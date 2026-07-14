/**
 * server/routes/messages.js
 * Direct messaging (1:1 DMs).
 *
 *   GET    /api/messages/conversations                       list my threads
 *   POST   /api/messages/conversations         { user_id }   find-or-create a 1:1 thread
 *   GET    /api/messages/conversations/:id/messages          paginated messages (oldest->newest)
 *   POST   /api/messages/conversations/:id/messages { body } send a message
 *   POST   /api/messages/conversations/:id/read              mark thread read up to latest
 *   GET    /api/messages/unread-count                        total unread across all threads
 *
 * Real-time: after a message is stored we emit `new_message` to every
 * participant's `user:<id>` room (see server/socket/index.js).
 */

import { Router } from 'express';
import { query, withTransaction } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// LIMIT is inlined (never bound) because the pool uses prepared statements,
// which reject bound LIMIT values on some MySQL versions. Always clamp first.
function clampLimit(value, def, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(n, max);
}

// Deterministic key so a given pair of users always maps to one conversation.
function pairKey(a, b) {
  const x = Number(a);
  const y = Number(b);
  return x < y ? x + ':' + y : y + ':' + x;
}

function shapeUser(r) {
  return {
    id:           String(r.id),
    username:     r.username,
    display_name: r.display_name || r.username,
    avatar_url:   r.avatar_url || null,
    is_verified:  !!r.is_verified,
  };
}

function shapeMessage(m) {
  return {
    id:              String(m.id),
    conversation_id: String(m.conversation_id),
    sender_id:       String(m.sender_id),
    body:            m.body,
    created_at:      m.created_at,
  };
}

async function isParticipant(conversationId, userId) {
  const rows = await query(
    'SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1',
    [conversationId, userId],
  );
  return rows.length > 0;
}

// ── List my conversations ─────────────────────────────────────
router.get('/conversations', requireAuth, async (req, res) => {
  const me = req.user.id;
  try {
    const rows = await query(
      `SELECT c.id                 AS conversation_id,
              c.last_message_text  AS last_message_text,
              c.last_message_at    AS last_message_at,
              u.id                 AS other_id,
              u.username           AS username,
              u.display_name       AS display_name,
              u.avatar_url         AS avatar_url,
              u.is_verified        AS is_verified,
              (SELECT COUNT(*) FROM messages m
                 WHERE m.conversation_id = c.id
                   AND m.sender_id <> ?
                   AND (mp.last_read_message_id IS NULL OR m.id > mp.last_read_message_id)
              ) AS unread_count
         FROM conversation_participants mp
         JOIN conversations c  ON c.id = mp.conversation_id
         JOIN conversation_participants op
              ON op.conversation_id = c.id AND op.user_id <> mp.user_id
         JOIN users u ON u.id = op.user_id
        WHERE mp.user_id = ?
          AND c.last_message_at IS NOT NULL
        ORDER BY c.last_message_at DESC
        LIMIT 100`,
      [me, me],
    );
    const conversations = rows.map((r) => ({
      id:                String(r.conversation_id),
      other:             shapeUser(r),
      last_message_text: r.last_message_text,
      last_message_at:   r.last_message_at,
      unread_count:      Number(r.unread_count) || 0,
    }));
    res.json({ conversations });
  } catch (err) {
    console.error('[messages] list failed:', err.message);
    res.status(500).json({ error: 'Could not load conversations' });
  }
});

// ── Find or create a 1:1 conversation ─────────────────────────
router.post('/conversations', requireAuth, async (req, res) => {
  const me = req.user.id;
  const otherId = Number(req.body?.user_id);
  if (!Number.isInteger(otherId) || otherId <= 0) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  if (Number(otherId) === Number(me)) {
    return res.status(400).json({ error: 'You cannot message yourself' });
  }

  const [target] = await query(
    'SELECT id, username, display_name, avatar_url, is_verified FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
    [otherId],
  );
  if (!target) return res.status(404).json({ error: 'User not found' });

  const key = pairKey(me, otherId);
  try {
    const conversationId = await withTransaction(async (conn) => {
      const [existing] = await conn.query(
        'SELECT id FROM conversations WHERE pair_key = ? LIMIT 1',
        [key],
      );
      if (existing.length) return existing[0].id;

      let cid;
      try {
        const [ins] = await conn.query(
          'INSERT INTO conversations (pair_key, created_by) VALUES (?, ?)',
          [key, me],
        );
        cid = ins.insertId;
      } catch (e) {
        if (e && e.errno === 1062) {
          const [again] = await conn.query(
            'SELECT id FROM conversations WHERE pair_key = ? LIMIT 1',
            [key],
          );
          return again[0].id;
        }
        throw e;
      }
      await conn.query(
        'INSERT IGNORE INTO conversation_participants (conversation_id, user_id) VALUES (?, ?), (?, ?)',
        [cid, me, cid, otherId],
      );
      return cid;
    });

    res.json({ id: String(conversationId), other: shapeUser(target) });
  } catch (err) {
    console.error('[messages] open failed:', err.message);
    res.status(500).json({ error: 'Could not open conversation' });
  }
});

// ── Get messages in a conversation ────────────────────────────
router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
  const me = req.user.id;
  const cid = Number(req.params.id);
  if (!Number.isInteger(cid) || cid <= 0) return res.status(400).json({ error: 'Bad conversation id' });
  if (!(await isParticipant(cid, me))) return res.status(403).json({ error: 'Not a participant' });

  const limit = clampLimit(req.query.limit, 30, 100);
  const before = Number(req.query.before);
  try {
    let rows;
    if (Number.isInteger(before) && before > 0) {
      rows = await query(
        `SELECT id, conversation_id, sender_id, body, created_at
           FROM messages
          WHERE conversation_id = ? AND id < ?
          ORDER BY id DESC
          LIMIT ${limit}`,
        [cid, before],
      );
    } else {
      rows = await query(
        `SELECT id, conversation_id, sender_id, body, created_at
           FROM messages
          WHERE conversation_id = ?
          ORDER BY id DESC
          LIMIT ${limit}`,
        [cid],
      );
    }
    const hasMore = rows.length === limit;
    const messages = rows.reverse().map(shapeMessage);
    res.json({ messages, has_more: hasMore });
  } catch (err) {
    console.error('[messages] fetch failed:', err.message);
    res.status(500).json({ error: 'Could not load messages' });
  }
});

// ── Send a message ────────────────────────────────────────────
router.post('/conversations/:id/messages', requireAuth, async (req, res) => {
  const me = req.user.id;
  const cid = Number(req.params.id);
  const body = (req.body?.body ?? '').toString().trim();
  if (!Number.isInteger(cid) || cid <= 0) return res.status(400).json({ error: 'Bad conversation id' });
  if (!body) return res.status(400).json({ error: 'Message body is required' });
  if (body.length > 4000) return res.status(400).json({ error: 'Message is too long (max 4000 chars)' });
  if (!(await isParticipant(cid, me))) return res.status(403).json({ error: 'Not a participant' });

  const preview = body.length > 500 ? body.slice(0, 500) : body;
  try {
    const messageId = await withTransaction(async (conn) => {
      const [ins] = await conn.query(
        'INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)',
        [cid, me, body],
      );
      const mid = ins.insertId;
      await conn.query(
        'UPDATE conversations SET last_message_id = ?, last_message_text = ?, last_message_at = NOW() WHERE id = ?',
        [mid, preview, cid],
      );
      await conn.query(
        'UPDATE conversation_participants SET last_read_message_id = ? WHERE conversation_id = ? AND user_id = ?',
        [mid, cid, me],
      );
      return mid;
    });

    const [row] = await query(
      'SELECT id, conversation_id, sender_id, body, created_at FROM messages WHERE id = ? LIMIT 1',
      [messageId],
    );
    const message = shapeMessage(row);

    // Broadcast to every participant's personal room (incl. the sender's other tabs).
    if (req.io) {
      const parts = await query(
        'SELECT user_id FROM conversation_participants WHERE conversation_id = ?',
        [cid],
      );
      for (const p of parts) {
        req.io.to('user:' + p.user_id).emit('new_message', { message });
      }
    }

    res.status(201).json({ message });
  } catch (err) {
    console.error('[messages] send failed:', err.message);
    res.status(500).json({ error: 'Could not send message' });
  }
});

// ── Mark a conversation read up to the latest message ─────────
router.post('/conversations/:id/read', requireAuth, async (req, res) => {
  const me = req.user.id;
  const cid = Number(req.params.id);
  if (!Number.isInteger(cid) || cid <= 0) return res.status(400).json({ error: 'Bad conversation id' });
  if (!(await isParticipant(cid, me))) return res.status(403).json({ error: 'Not a participant' });
  try {
    const [top] = await query('SELECT MAX(id) AS max_id FROM messages WHERE conversation_id = ?', [cid]);
    const maxId = top?.max_id;
    if (maxId) {
      await query(
        'UPDATE conversation_participants SET last_read_message_id = ? WHERE conversation_id = ? AND user_id = ?',
        [maxId, cid, me],
      );
    }
    res.json({ ok: true, last_read_message_id: maxId ? String(maxId) : null });
  } catch (err) {
    console.error('[messages] read failed:', err.message);
    res.status(500).json({ error: 'Could not update read state' });
  }
});

// ── Total unread count across all my conversations ────────────
router.get('/unread-count', requireAuth, async (req, res) => {
  const me = req.user.id;
  try {
    const [row] = await query(
      `SELECT COUNT(*) AS total
         FROM messages m
         JOIN conversation_participants mp
              ON mp.conversation_id = m.conversation_id AND mp.user_id = ?
        WHERE m.sender_id <> ?
          AND (mp.last_read_message_id IS NULL OR m.id > mp.last_read_message_id)`,
      [me, me],
    );
    res.json({ unread: Number(row?.total) || 0 });
  } catch (err) {
    console.error('[messages] unread-count failed:', err.message);
    res.json({ unread: 0 });
  }
});

export default router;

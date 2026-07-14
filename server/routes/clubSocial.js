/**
 * server/routes/clubSocial.js
 *
 * Engagement for club-feed items (like / unlike / comment / share / follow).
 *
 * BACKGROUND
 * The club feed is aggregated upstream (see clubFeed.js) and proxied to the
 * client. Those items are not rows in our `posts` table and the upstream gives
 * no write contract, so we persist engagement in our OWN database keyed by the
 * feed item's stable string id (news article id / video id). See
 * migrations/002_club_engagement.sql.
 *
 * Routes (mounted at /api/club-social)
 *   GET    /engagement?ids=a,b,c   → { items: { id: { like_count, comment_count, share_count, liked } } }
 *   POST   /like        { post_id } → persist like   → { ok, liked:true,  like_count }
 *   DELETE /like        { post_id } → remove like    → { ok, liked:false, like_count }
 *   POST   /comment     { post_id, body } → persist comment → { ok, comment, comment_count }
 *   POST   /share       { post_id } → bump share count → { ok, share_count }
 *   POST   /follow      { target_id } → (best-effort upstream passthrough)
 *   DELETE /follow      { target_id }
 */

import { Router } from 'express';
import { query } from '../db/pool.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { upstreamFetch } from '../lib/upstream.js';
import { createNotification } from './social.js';

const router = Router();

// ── Helpers ───────────────────────────────────────────────────

/** Ensure a stats row exists for an item so counters can be read/updated. */
async function ensureStatsRow(itemId) {
  await query(`INSERT IGNORE INTO club_post_stats (item_id) VALUES (?)`, [itemId]);
}

/** Recompute like_count from the source-of-truth likes table and persist it. */
async function syncLikeCount(itemId) {
  const [{ cnt }] = await query(
    `SELECT COUNT(*) AS cnt FROM club_post_likes WHERE item_id = ?`,
    [itemId],
  );
  await ensureStatsRow(itemId);
  await query(`UPDATE club_post_stats SET like_count = ? WHERE item_id = ?`, [cnt, itemId]);
  return Number(cnt) || 0;
}

// ╔══════════════════════════════════════════════════════════════╗
// ║  BATCH ENGAGEMENT READ                                       ║
// ╚══════════════════════════════════════════════════════════════╝

/**
 * GET /engagement?ids=a,b,c
 * Returns counts for each requested item plus, when authenticated, whether the
 * current viewer has liked it. Used by the feed to seed the engagement bars so
 * counts show and likes survive a refresh.
 */
router.get('/engagement', optionalAuth, async (req, res) => {
  const raw = String(req.query.ids || '').trim();
  if (!raw) return res.json({ items: {} });

  // De-dupe, drop empties, and cap to a sane batch size.
  const ids = [...new Set(raw.split(',').map((s) => s.trim()).filter(Boolean))].slice(0, 200);
  if (ids.length === 0) return res.json({ items: {} });

  const placeholders = ids.map(() => '?').join(',');

  try {
    const stats = await query(
      `SELECT item_id, like_count, comment_count, share_count
         FROM club_post_stats
        WHERE item_id IN (${placeholders})`,
      ids,
    );

    const likedSet = new Set();
    if (req.user) {
      const liked = await query(
        `SELECT item_id FROM club_post_likes
          WHERE user_id = ? AND item_id IN (${placeholders})`,
        [req.user.id, ...ids],
      );
      liked.forEach((r) => likedSet.add(String(r.item_id)));
    }

    const items = {};
    for (const id of ids) {
      items[id] = { like_count: 0, comment_count: 0, share_count: 0, liked: likedSet.has(id) };
    }
    for (const s of stats) {
      const id = String(s.item_id);
      items[id] = {
        like_count: Number(s.like_count) || 0,
        comment_count: Number(s.comment_count) || 0,
        share_count: Number(s.share_count) || 0,
        liked: likedSet.has(id),
      };
    }

    return res.json({ items });
  } catch (err) {
    console.error('[GET /club-social/engagement]', err);
    return res.status(500).json({ error: 'Failed to load engagement' });
  }
});

// ╔══════════════════════════════════════════════════════════════╗
// ║  LIKES                                                       ║
// ╚══════════════════════════════════════════════════════════════╝

/** POST /like — persist a like (idempotent). */
router.post('/like', requireAuth, async (req, res) => {
  const itemId = String(req.body?.post_id ?? '').trim();
  if (!itemId) return res.status(400).json({ error: 'post_id required' });

  try {
    await query(
      `INSERT IGNORE INTO club_post_likes (user_id, item_id) VALUES (?, ?)`,
      [req.user.id, itemId],
    );
    const like_count = await syncLikeCount(itemId);

    req.io?.to(`club:${itemId}`).emit('club_like_updated', { item_id: itemId, like_count });
    return res.json({ ok: true, liked: true, like_count });
  } catch (err) {
    console.error('[POST /club-social/like]', err);
    return res.status(500).json({ error: 'Failed to like' });
  }
});

/** DELETE /like — remove a like (idempotent). */
router.delete('/like', requireAuth, async (req, res) => {
  const itemId = String(req.body?.post_id ?? '').trim();
  if (!itemId) return res.status(400).json({ error: 'post_id required' });

  try {
    await query(
      `DELETE FROM club_post_likes WHERE user_id = ? AND item_id = ?`,
      [req.user.id, itemId],
    );
    const like_count = await syncLikeCount(itemId);

    req.io?.to(`club:${itemId}`).emit('club_like_updated', { item_id: itemId, like_count });
    return res.json({ ok: true, liked: false, like_count });
  } catch (err) {
    console.error('[DELETE /club-social/like]', err);
    return res.status(500).json({ error: 'Failed to unlike' });
  }
});

// ╔══════════════════════════════════════════════════════════════╗
// ║  COMMENTS                                                    ║
// ╚══════════════════════════════════════════════════════════════╝

// Reaction set offered in the UI (kept in sync with the frontend bar).
const COMMENT_EMOJI_WHITELIST = ['👍', '❤️', '😂', '😮', '😢', '🔥', '⚽', '🎉'];
const MAX_ATTACHMENTS = 4;

/** Parse a JSON column that the pool may hand back as object or string. */
function parseJsonCol(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

const MENTION_RE = /(?:^|[^\w@])@([a-zA-Z0-9_]{2,30})/g;
const HASHTAG_RE = /(?:^|[^\w#])#([a-zA-Z0-9_]{1,50})/g;

/** Pull @mentions and #hashtags out of comment text (deduped, capped). */
function extractHandles(body) {
  const mentions = new Set();
  const hashtags = new Set();
  let m;
  MENTION_RE.lastIndex = 0;
  while ((m = MENTION_RE.exec(body)) !== null) mentions.add(m[1].toLowerCase());
  HASHTAG_RE.lastIndex = 0;
  while ((m = HASHTAG_RE.exec(body)) !== null) hashtags.add(m[1].toLowerCase());
  return {
    mentionUsernames: [...mentions].slice(0, 20),
    hashtags: [...hashtags].slice(0, 20),
  };
}

/** Resolve @usernames to real users so we can store ids + fire notifications. */
async function resolveMentions(usernames) {
  if (!usernames.length) return [];
  const ph = usernames.map(() => '?').join(',');
  const rows = await query(
    `SELECT id, username FROM users WHERE LOWER(username) IN (${ph})`,
    usernames,
  );
  return rows.map((r) => ({ id: String(r.id), username: r.username }));
}

const ALLOWED_GIF_HOST_RE = /(^|\.)(tenor\.com|giphy\.com)$/i;
function isAllowedGifUrl(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && ALLOWED_GIF_HOST_RE.test(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Turn the client's attachment descriptors into the JSON we persist. Uploaded
 * media is resolved from media_files (and ownership-checked); GIFs carry a
 * whitelisted Tenor/Giphy URL straight through (they are not media_files rows).
 */
async function resolveAttachments(raw, ownerId) {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const slice = raw.slice(0, MAX_ATTACHMENTS);

  const mediaIds = slice
    .filter((a) => a && a.media_id != null)
    .map((a) => String(a.media_id));

  let mediaById = new Map();
  if (mediaIds.length) {
    const ph = mediaIds.map(() => '?').join(',');
    const rows = await query(
      `SELECT id, kind, mime, url, thumbnail_url FROM media_files
        WHERE id IN (${ph}) AND owner_id = ? AND is_deleted = 0`,
      [...mediaIds, ownerId],
    );
    mediaById = new Map(rows.map((r) => [String(r.id), r]));
  }

  const out = [];
  for (const a of slice) {
    if (!a || typeof a !== 'object') continue;
    if (a.media_id != null) {
      const row = mediaById.get(String(a.media_id));
      if (!row) continue; // unknown or not owned by this user — drop it
      out.push({
        kind: row.kind,
        media_id: String(row.id),
        url: row.url,
        thumbnail_url: row.thumbnail_url || null,
        mime: row.mime || null,
      });
    } else if (a.kind === 'gif' && typeof a.url === 'string' && isAllowedGifUrl(a.url)) {
      out.push({
        kind: 'gif',
        media_id: null,
        url: a.url,
        thumbnail_url:
          typeof a.thumbnail_url === 'string' && isAllowedGifUrl(a.thumbnail_url)
            ? a.thumbnail_url
            : null,
        mime: 'image/gif',
      });
    }
  }
  return out.slice(0, MAX_ATTACHMENTS);
}

/**
 * Hydrate raw comment rows with author info, parsed JSON columns, reaction
 * tallies, the viewer's own reaction, and reply counts.
 */
async function enrichClubComments(rows, viewerId) {
  if (!rows.length) return [];
  const ids = rows.map((r) => String(r.id));
  const ph = ids.map(() => '?').join(',');

  const reactRows = await query(
    `SELECT comment_id, emoji, COUNT(*) AS cnt FROM club_comment_reactions
      WHERE comment_id IN (${ph}) GROUP BY comment_id, emoji`,
    ids,
  );
  const reactionsByComment = new Map();
  for (const r of reactRows) {
    const cid = String(r.comment_id);
    if (!reactionsByComment.has(cid)) reactionsByComment.set(cid, {});
    reactionsByComment.get(cid)[r.emoji] = Number(r.cnt) || 0;
  }

  const mineByComment = new Map();
  if (viewerId) {
    const mine = await query(
      `SELECT comment_id, emoji FROM club_comment_reactions
        WHERE comment_id IN (${ph}) AND user_id = ?`,
      [...ids, viewerId],
    );
    for (const r of mine) mineByComment.set(String(r.comment_id), r.emoji);
  }

  const replyRows = await query(
    `SELECT parent_id, COUNT(*) AS cnt FROM club_post_comments
      WHERE parent_id IN (${ph}) AND deleted_at IS NULL GROUP BY parent_id`,
    ids,
  );
  const replyCountByComment = new Map();
  for (const r of replyRows) replyCountByComment.set(String(r.parent_id), Number(r.cnt) || 0);

  return rows.map((r) => ({
    id: String(r.id),
    item_id: String(r.item_id),
    parent_id: r.parent_id != null ? String(r.parent_id) : null,
    body: r.body,
    created_at: r.created_at,
    author: {
      id: String(r.author_id),
      username: r.username,
      display_name: r.display_name || null,
      avatar_url: r.avatar_url || null,
      is_verified: !!r.is_verified,
    },
    attachments: parseJsonCol(r.attachments, []),
    mentions: parseJsonCol(r.mentions, []),
    hashtags: parseJsonCol(r.hashtags, []),
    reactions: reactionsByComment.get(String(r.id)) || {},
    my_reaction: mineByComment.get(String(r.id)) || null,
    reply_count: replyCountByComment.get(String(r.id)) || 0,
  }));
}

/** Current reaction tally + the viewer's own reaction for one comment. */
async function reactionSummary(commentId, viewerId) {
  const rows = await query(
    `SELECT emoji, COUNT(*) AS cnt FROM club_comment_reactions
      WHERE comment_id = ? GROUP BY emoji`,
    [commentId],
  );
  const reactions = {};
  for (const r of rows) reactions[r.emoji] = Number(r.cnt) || 0;
  let mine = null;
  if (viewerId) {
    const [m] = await query(
      `SELECT emoji FROM club_comment_reactions WHERE comment_id = ? AND user_id = ?`,
      [commentId, viewerId],
    );
    mine = m ? m.emoji : null;
  }
  return { reactions, mine };
}

/**
 * GET /comments?item_id=&cursor=&limit=
 * Top-level comments (newest first, keyset-paginated by descending id) with
 * their replies nested inline. Each node is fully enriched.
 */
router.get('/comments', optionalAuth, async (req, res) => {
  const itemId = String(req.query.item_id ?? '').trim();
  const limit = Math.min(Number(req.query.limit) || 20, 50);
  const cursor = req.query.cursor ? String(req.query.cursor) : null;
  if (!itemId) return res.status(400).json({ error: 'item_id required' });

  try {
    const top = await query(
      `SELECT c.*, u.username, u.display_name, u.avatar_url, u.is_verified
         FROM club_post_comments c JOIN users u ON u.id = c.author_id
        WHERE c.item_id = ? AND c.parent_id IS NULL AND c.deleted_at IS NULL
          ${cursor ? 'AND c.id < ?' : ''}
        ORDER BY c.id DESC
        LIMIT ?`,
      cursor ? [itemId, cursor, limit + 1] : [itemId, limit + 1],
    );

    let nextCursor = null;
    let parents = top;
    if (parents.length > limit) {
      nextCursor = String(parents[limit - 1].id);
      parents = parents.slice(0, limit);
    }

    const parentIds = parents.map((p) => String(p.id));
    let replies = [];
    if (parentIds.length) {
      const ph = parentIds.map(() => '?').join(',');
      replies = await query(
        `SELECT c.*, u.username, u.display_name, u.avatar_url, u.is_verified
           FROM club_post_comments c JOIN users u ON u.id = c.author_id
          WHERE c.parent_id IN (${ph}) AND c.deleted_at IS NULL
          ORDER BY c.id ASC`,
        parentIds,
      );
    }

    const enrichedParents = await enrichClubComments(parents, req.user?.id);
    const enrichedReplies = await enrichClubComments(replies, req.user?.id);

    const repliesByParent = new Map();
    for (const r of enrichedReplies) {
      if (!repliesByParent.has(r.parent_id)) repliesByParent.set(r.parent_id, []);
      repliesByParent.get(r.parent_id).push(r);
    }
    const comments = enrichedParents.map((c) => ({
      ...c,
      replies: repliesByParent.get(c.id) || [],
    }));

    return res.json({ comments, nextCursor });
  } catch (err) {
    console.error('[GET /club-social/comments]', err);
    return res.status(500).json({ error: 'Failed to load comments' });
  }
});

/**
 * POST /comment
 * Body: { post_id|item_id, body?, parent_id?, attachments?: [{kind, media_id?|url?}] }
 * Persists a (rich) comment or reply, extracts @mentions + #hashtags, resolves
 * attachments, bumps the counter, broadcasts, and notifies mentioned users.
 */
router.post('/comment', requireAuth, async (req, res) => {
  const itemId = String(req.body?.post_id ?? req.body?.item_id ?? '').trim();
  const body = String(req.body?.body ?? '').trim();
  const parentId = req.body?.parent_id != null ? String(req.body.parent_id) : null;
  const rawAttachments = req.body?.attachments;
  const hasAttachments = Array.isArray(rawAttachments) && rawAttachments.length > 0;

  if (!itemId) return res.status(400).json({ error: 'post_id required' });
  if (!body && !hasAttachments) {
    return res.status(400).json({ error: 'body or attachment required' });
  }
  if (body.length > 1000) return res.status(400).json({ error: 'Comment must be ≤ 1000 characters' });

  try {
    if (parentId) {
      const [parent] = await query(
        `SELECT id FROM club_post_comments WHERE id = ? AND item_id = ? AND deleted_at IS NULL`,
        [parentId, itemId],
      );
      if (!parent) return res.status(404).json({ error: 'Parent comment not found' });
    }

    const attachments = await resolveAttachments(rawAttachments, req.user.id);
    const { mentionUsernames, hashtags } = extractHandles(body);
    const mentions = await resolveMentions(mentionUsernames);

    const result = await query(
      `INSERT INTO club_post_comments
         (item_id, author_id, parent_id, body, attachments, mentions, hashtags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        itemId,
        req.user.id,
        parentId || null,
        body,
        attachments.length ? JSON.stringify(attachments) : null,
        mentions.length ? JSON.stringify(mentions) : null,
        hashtags.length ? JSON.stringify(hashtags) : null,
      ],
    );

    await ensureStatsRow(itemId);
    await query(
      `UPDATE club_post_stats SET comment_count = comment_count + 1 WHERE item_id = ?`,
      [itemId],
    );
    const [{ cnt }] = await query(
      `SELECT comment_count AS cnt FROM club_post_stats WHERE item_id = ?`,
      [itemId],
    );

    const [row] = await query(
      `SELECT c.*, u.username, u.display_name, u.avatar_url, u.is_verified
         FROM club_post_comments c JOIN users u ON u.id = c.author_id
        WHERE c.id = ?`,
      [String(result.insertId)],
    );
    const [comment] = await enrichClubComments([row], req.user.id);
    comment.replies = [];

    req.io?.to(`club:${itemId}`).emit('club_new_comment', comment);

    // Notify mentioned users (skip self-mentions).
    for (const mention of mentions) {
      if (String(mention.id) === String(req.user.id)) continue;
      await createNotification({
        recipient_id: mention.id,
        actor_id: req.user.id,
        type: 'mention_comment',
        ref_type: 'comment',
        ref_id: comment.id,
        body: `${req.user.username} mentioned you in a comment`,
      });
      req.io?.to(`user:${mention.id}`).emit('notification', {
        type: 'mention_comment', ref_type: 'comment', ref_id: comment.id,
      });
    }

    return res.status(201).json({ ok: true, comment, comment_count: Number(cnt) || 0 });
  } catch (err) {
    console.error('[POST /club-social/comment]', err);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

/** POST /comment/:id/react { emoji } — toggle a reaction (one per user). */
router.post('/comment/:id/react', requireAuth, async (req, res) => {
  const commentId = String(req.params.id);
  const emoji = String(req.body?.emoji ?? '').trim();
  if (!COMMENT_EMOJI_WHITELIST.includes(emoji)) {
    return res.status(400).json({ error: 'Unsupported reaction' });
  }

  try {
    const [comment] = await query(
      `SELECT id, item_id FROM club_post_comments WHERE id = ? AND deleted_at IS NULL`,
      [commentId],
    );
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const [existing] = await query(
      `SELECT emoji FROM club_comment_reactions WHERE comment_id = ? AND user_id = ?`,
      [commentId, req.user.id],
    );
    if (existing && existing.emoji === emoji) {
      // Same emoji again → remove (toggle off).
      await query(
        `DELETE FROM club_comment_reactions WHERE comment_id = ? AND user_id = ?`,
        [commentId, req.user.id],
      );
    } else {
      await query(
        `INSERT INTO club_comment_reactions (user_id, comment_id, emoji)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE emoji = VALUES(emoji), created_at = CURRENT_TIMESTAMP`,
        [req.user.id, commentId, emoji],
      );
    }

    const summary = await reactionSummary(commentId, req.user.id);
    req.io?.to(`club:${comment.item_id}`).emit('club_comment_reaction', {
      comment_id: commentId, ...summary,
    });
    return res.json({ ok: true, ...summary });
  } catch (err) {
    console.error('[POST /club-social/comment/:id/react]', err);
    return res.status(500).json({ error: 'Failed to react' });
  }
});

/** DELETE /comment/:id/react — remove the viewer's reaction. */
router.delete('/comment/:id/react', requireAuth, async (req, res) => {
  const commentId = String(req.params.id);
  try {
    await query(
      `DELETE FROM club_comment_reactions WHERE comment_id = ? AND user_id = ?`,
      [commentId, req.user.id],
    );
    const summary = await reactionSummary(commentId, req.user.id);
    const [comment] = await query(
      `SELECT item_id FROM club_post_comments WHERE id = ?`,
      [commentId],
    );
    if (comment) {
      req.io?.to(`club:${comment.item_id}`).emit('club_comment_reaction', {
        comment_id: commentId, ...summary,
      });
    }
    return res.json({ ok: true, ...summary });
  } catch (err) {
    console.error('[DELETE /club-social/comment/:id/react]', err);
    return res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// ╔══════════════════════════════════════════════════════════════╗
// ║  SHARES                                                      ║
// ╚══════════════════════════════════════════════════════════════╝

/** POST /share — bump the share counter. */
router.post('/share', optionalAuth, async (req, res) => {
  const itemId = String(req.body?.post_id ?? '').trim();
  if (!itemId) return res.status(400).json({ error: 'post_id required' });

  try {
    await ensureStatsRow(itemId);
    await query(
      `UPDATE club_post_stats SET share_count = share_count + 1 WHERE item_id = ?`,
      [itemId],
    );
    const [{ cnt }] = await query(
      `SELECT share_count AS cnt FROM club_post_stats WHERE item_id = ?`,
      [itemId],
    );
    return res.json({ ok: true, share_count: Number(cnt) || 0 });
  } catch (err) {
    console.error('[POST /club-social/share]', err);
    return res.status(500).json({ error: 'Failed to record share' });
  }
});

// ╔══════════════════════════════════════════════════════════════╗
// ║  SAVES (bookmarks)                                          ║
// ╚══════════════════════════════════════════════════════════════╝

/** Coerce an arbitrary client snapshot into a small, safe JSON object. */
function sanitizeSnapshot(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const str = (v, max) => {
    if (typeof v !== 'string') return null;
    const s = v.trim();
    return s ? s.slice(0, max) : null;
  };
  const snap = {
    kind: str(raw.kind, 32),
    title: str(raw.title, 300),
    image: str(raw.image, 1000),
    source: str(raw.source, 200),
    link: str(raw.link, 1000),
    timestamp:
      typeof raw.timestamp === 'number' && Number.isFinite(raw.timestamp) ? raw.timestamp : null,
  };
  // Drop entirely-empty snapshots so we don't store {}.
  return Object.values(snap).some((v) => v != null) ? snap : null;
}

/** Parse a snapshot column back to an object (pool may return JSON or string). */
function parseSnapshot(v) {
  if (v == null) return null;
  if (typeof v === 'object') return v;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

/** POST /save — bookmark a club-feed item (idempotent; refreshes the snapshot). */
router.post('/save', requireAuth, async (req, res) => {
  const itemId = String(req.body?.item_id ?? req.body?.post_id ?? '').trim();
  if (!itemId) return res.status(400).json({ error: 'item_id required' });
  const snapshot = sanitizeSnapshot(req.body?.snapshot);

  try {
    await query(
      `INSERT INTO club_post_saves (user_id, item_id, snapshot)
            VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE snapshot = VALUES(snapshot)`,
      [req.user.id, itemId, snapshot ? JSON.stringify(snapshot) : null],
    );
    return res.json({ ok: true, saved: true, item_id: itemId });
  } catch (err) {
    console.error('[POST /club-social/save]', err);
    return res.status(500).json({ error: 'Failed to save' });
  }
});

/** DELETE /save — remove a bookmark (idempotent). */
router.delete('/save', requireAuth, async (req, res) => {
  const itemId = String(req.body?.item_id ?? req.body?.post_id ?? '').trim();
  if (!itemId) return res.status(400).json({ error: 'item_id required' });

  try {
    await query(`DELETE FROM club_post_saves WHERE user_id = ? AND item_id = ?`, [
      req.user.id,
      itemId,
    ]);
    return res.json({ ok: true, saved: false, item_id: itemId });
  } catch (err) {
    console.error('[DELETE /club-social/save]', err);
    return res.status(500).json({ error: 'Failed to unsave' });
  }
});

/**
 * GET /saved/ids — the full set of saved item ids for the viewer. Used to
 * hydrate the client-side bookmark store on login so the bookmark icon and the
 * "Favourite" feed tab reflect saves made on other devices.
 */
router.get('/saved/ids', requireAuth, async (req, res) => {
  try {
    const rows = await query(`SELECT item_id FROM club_post_saves WHERE user_id = ?`, [
      req.user.id,
    ]);
    return res.json({ ids: rows.map((r) => String(r.item_id)) });
  } catch (err) {
    console.error('[GET /club-social/saved/ids]', err);
    return res.status(500).json({ error: 'Failed to load saved ids' });
  }
});

/**
 * GET /saved?cursor&limit — paginated saved items (newest first) with their
 * stored snapshots, for the profile "Saved" view. `cursor` is the id of the
 * last row from the previous page; rows are ordered by descending id.
 */
router.get('/saved', requireAuth, async (req, res) => {
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 50);
  const cursor = parseInt(req.query.cursor, 10);
  const hasCursor = Number.isFinite(cursor) && cursor > 0;

  try {
    const params = [req.user.id];
    let where = `WHERE user_id = ?`;
    if (hasCursor) {
      where += ` AND id < ?`;
      params.push(cursor);
    }
    // Fetch one extra row to detect whether another page exists.
    const rows = await query(
      `SELECT id, item_id, snapshot, created_at
         FROM club_post_saves
         ${where}
        ORDER BY id DESC
        LIMIT ${limit + 1}`,
      params,
    );

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const items = page.map((r) => ({
      item_id: String(r.item_id),
      saved_id: Number(r.id),
      created_at: r.created_at,
      snapshot: parseSnapshot(r.snapshot),
    }));
    const nextCursor = hasMore ? Number(page[page.length - 1].id) : null;

    return res.json({ items, nextCursor });
  } catch (err) {
    console.error('[GET /club-social/saved]', err);
    return res.status(500).json({ error: 'Failed to load saved posts' });
  }
});

// ╔══════════════════════════════════════════════════════════════╗
// ║  FOLLOWS (best-effort upstream passthrough)                  ║
// ╚══════════════════════════════════════════════════════════════╝

const FOLLOW_PATH = process.env.UPSTREAM_FOLLOW_PATH || '/api/club-follow';
const FORWARD = process.env.UPSTREAM_SOCIAL_FORWARD === 'true';

async function proxyFollow(action, body, res) {
  if (!FORWARD) return res.json({ ok: true, forwarded: false });
  try {
    const data = await upstreamFetch(FOLLOW_PATH, { method: 'POST', body: { ...body, action } });
    return res.json({ ok: true, forwarded: true, data });
  } catch (err) {
    console.error('[club-social] follow proxy failed:', err.message);
    return res.status(502).json({ ok: false, error: 'Upstream follow action failed' });
  }
}

router.post('/follow', (req, res) => proxyFollow('follow', req.body, res));
router.delete('/follow', (req, res) => proxyFollow('unfollow', req.body, res));

export default router;

/**
 * server/routes/social.js
 *
 * Likes
 *   POST   /api/social/like              { target_type, target_id }
 *   DELETE /api/social/like              { target_type, target_id }
 *
 * Comments
 *   GET    /api/social/comments/:postId  ?cursor&limit
 *   POST   /api/social/comments          { post_id, body, parent_id? }
 *   DELETE /api/social/comments/:id
 *
 * Follows
 *   POST   /api/social/follow            { target_type, target_id }
 *   DELETE /api/social/follow            { target_type, target_id }
 *   GET    /api/social/followers/:type/:id
 *   GET    /api/social/following/:userId
 *
 * Reports
 *   POST   /api/social/report            { target_type, target_id, reason, detail? }
 */

import { Router }      from 'express';
import { query, withTransaction } from '../db/pool.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// ╔══════════════════════════════════════════════════════════════╗
// ║  LIKES                                                       ║
// ╚══════════════════════════════════════════════════════════════╝

/** POST /api/social/like — toggle-on */
router.post('/like', requireAuth, async (req, res) => {
  const { target_type, target_id } = req.body;

  if (!['post', 'comment'].includes(target_type) || !target_id) {
    return res.status(400).json({ error: 'target_type (post|comment) and target_id required' });
  }

  try {
    await query(
      `INSERT IGNORE INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)`,
      [req.user.id, target_type, String(target_id)]
    );

    // Return fresh count
    const table = target_type === 'post' ? 'posts' : 'comments';
    const [{ cnt }] = await query(`SELECT like_count AS cnt FROM ${table} WHERE id = ?`, [String(target_id)]);

    // Emit realtime event
    req.io?.to(`${target_type}:${target_id}`).emit('like_updated', {
      target_type, target_id: String(target_id), like_count: cnt,
    });

    return res.json({ ok: true, like_count: cnt });
  } catch (err) {
    console.error('[POST /like]', err);
    return res.status(500).json({ error: 'Failed to like' });
  }
});

/** DELETE /api/social/like — toggle-off */
router.delete('/like', requireAuth, async (req, res) => {
  const { target_type, target_id } = req.body;

  if (!['post', 'comment'].includes(target_type) || !target_id) {
    return res.status(400).json({ error: 'target_type and target_id required' });
  }

  try {
    await query(
      `DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?`,
      [req.user.id, target_type, String(target_id)]
    );

    const table = target_type === 'post' ? 'posts' : 'comments';
    const [{ cnt }] = await query(`SELECT like_count AS cnt FROM ${table} WHERE id = ?`, [String(target_id)]);

    req.io?.to(`${target_type}:${target_id}`).emit('like_updated', {
      target_type, target_id: String(target_id), like_count: cnt,
    });

    return res.json({ ok: true, like_count: cnt });
  } catch (err) {
    console.error('[DELETE /like]', err);
    return res.status(500).json({ error: 'Failed to unlike' });
  }
});

// ╔══════════════════════════════════════════════════════════════╗
// ║  COMMENTS                                                    ║
// ╚══════════════════════════════════════════════════════════════╝

/** GET /api/social/comments/:postId */
router.get('/comments/:postId', optionalAuth, async (req, res) => {
  const { postId }  = req.params;
  const limit       = Math.min(Number(req.query.limit) || 20, 100);
  const cursor      = req.query.cursor || null;

  try {
    const rows = await query(
      `SELECT c.id, c.post_id, c.parent_id, c.body, c.like_count,
              c.created_at, c.updated_at,
              u.id AS user_id, u.username, u.display_name, u.avatar_url, u.is_verified
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.post_id = ?
         AND c.deleted_at IS NULL
         AND c.is_hidden  = 0
         ${cursor ? 'AND c.id > ?' : ''}
       ORDER BY c.id ASC
       LIMIT ?`,
      cursor ? [postId, cursor, limit + 1] : [postId, limit + 1]
    );

    let nextCursor = null;
    let comments   = rows;
    if (comments.length > limit) {
      nextCursor = String(comments[limit - 1].id);
      comments   = comments.slice(0, limit);
    }

    // Enrich liked status
    if (req.user && comments.length) {
      const ids    = comments.map((c) => String(c.id));
      const liked  = await query(
        `SELECT target_id FROM likes
         WHERE user_id = ? AND target_type = 'comment' AND target_id IN (${ids.map(() => '?').join(',')})`,
        [req.user.id, ...ids]
      );
      const likedSet = new Set(liked.map((r) => String(r.target_id)));
      comments = comments.map((c) => ({ ...c, liked: likedSet.has(String(c.id)) }));
    }

    return res.json({
      comments: comments.map((c) => ({ ...c, id: String(c.id) })),
      nextCursor,
    });
  } catch (err) {
    console.error('[GET /comments]', err);
    return res.status(500).json({ error: 'Failed to load comments' });
  }
});

/** POST /api/social/comments */
router.post('/comments', requireAuth, async (req, res) => {
  const { post_id, body, parent_id = null } = req.body;

  if (!post_id || !body?.trim()) {
    return res.status(400).json({ error: 'post_id and body are required' });
  }
  if (body.trim().length > 1000) {
    return res.status(400).json({ error: 'Comment must be ≤ 1000 characters' });
  }

  try {
    // Verify post exists
    const [post] = await query('SELECT id FROM posts WHERE id = ? AND deleted_at IS NULL', [post_id]);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const result = await query(
      `INSERT INTO comments (post_id, author_id, parent_id, body) VALUES (?, ?, ?, ?)`,
      [post_id, req.user.id, parent_id || null, body.trim()]
    );

    const [comment] = await query(
      `SELECT c.*, u.username, u.display_name, u.avatar_url, u.is_verified
       FROM comments c JOIN users u ON u.id = c.author_id
       WHERE c.id = ?`,
      [String(result.insertId)]
    );

    const normalised = { ...comment, id: String(comment.id) };

    // Realtime broadcast to post room
    req.io?.to(`post:${post_id}`).emit('new_comment', normalised);

    // Notify post author (if different user)
    if (String(post.author_id) !== String(req.user.id)) {
      await createNotification({
        recipient_id: post.author_id,
        actor_id:     req.user.id,
        type:         'new_comment',
        ref_type:     'post',
        ref_id:       post_id,
        body:         `${req.user.username} commented on your post`,
      });
      req.io?.to(`user:${post.author_id}`).emit('notification', {
        type: 'new_comment', ref_type: 'post', ref_id: String(post_id),
      });
    }

    return res.status(201).json({ comment: normalised });
  } catch (err) {
    console.error('[POST /comments]', err);
    return res.status(500).json({ error: 'Failed to post comment' });
  }
});

/** DELETE /api/social/comments/:id — soft delete (own comment or admin) */
router.delete('/comments/:id', requireAuth, async (req, res) => {
  const [comment] = await query('SELECT author_id FROM comments WHERE id = ?', [req.params.id]);
  if (!comment) return res.status(404).json({ error: 'Comment not found' });

  const isOwner = String(comment.author_id) === String(req.user.id);
  const isAdmin = req.user.role === 'team_admin';

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: 'Cannot delete this comment' });
  }

  await query('UPDATE comments SET deleted_at = NOW() WHERE id = ?', [req.params.id]);
  return res.json({ ok: true });
});

// ╔══════════════════════════════════════════════════════════════╗
// ║  FOLLOWS                                                     ║
// ╚══════════════════════════════════════════════════════════════╝

const VALID_FOLLOW_TYPES = ['user', 'player', 'team'];

/** POST /api/social/follow */
router.post('/follow', requireAuth, async (req, res) => {
  const { target_type, target_id } = req.body;

  if (!VALID_FOLLOW_TYPES.includes(target_type) || !target_id) {
    return res.status(400).json({ error: 'target_type (user|player|team) and target_id required' });
  }
  if (target_type === 'user' && String(target_id) === String(req.user.id)) {
    return res.status(400).json({ error: 'Cannot follow yourself' });
  }

  try {
    await query(
      `INSERT IGNORE INTO follows (follower_id, target_type, target_id) VALUES (?, ?, ?)`,
      [req.user.id, target_type, String(target_id)]
    );

    // Notify target user (for user follows only)
    if (target_type === 'user') {
      await createNotification({
        recipient_id: target_id,
        actor_id:     req.user.id,
        type:         'new_follower',
        ref_type:     'user',
        ref_id:       req.user.id,
        body:         `${req.user.username} started following you`,
      });
      req.io?.to(`user:${target_id}`).emit('notification', {
        type: 'new_follower', actor: req.user.username,
      });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[POST /follow]', err);
    return res.status(500).json({ error: 'Failed to follow' });
  }
});

/** DELETE /api/social/follow */
router.delete('/follow', requireAuth, async (req, res) => {
  const { target_type, target_id } = req.body;

  if (!VALID_FOLLOW_TYPES.includes(target_type) || !target_id) {
    return res.status(400).json({ error: 'target_type and target_id required' });
  }

  try {
    await query(
      `DELETE FROM follows WHERE follower_id = ? AND target_type = ? AND target_id = ?`,
      [req.user.id, target_type, String(target_id)]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('[DELETE /follow]', err);
    return res.status(500).json({ error: 'Failed to unfollow' });
  }
});

/** GET /api/social/followers/:type/:id — who follows a target */
router.get('/followers/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  if (!VALID_FOLLOW_TYPES.includes(type)) {
    return res.status(400).json({ error: 'Invalid type' });
  }

  try {
    const rows = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_verified
       FROM follows f
       JOIN users u ON u.id = f.follower_id
       WHERE f.target_type = ? AND f.target_id = ?
       ORDER BY f.created_at DESC
       LIMIT 100`,
      [type, String(id)]
    );
    return res.json({ followers: rows.map((r) => ({ ...r, id: String(r.id) })) });
  } catch (err) {
    console.error('[GET /followers]', err);
    return res.status(500).json({ error: 'Failed to load followers' });
  }
});

/** GET /api/social/following/:userId — who a user follows */
router.get('/following/:userId', async (req, res) => {
  try {
    const rows = await query(
      `SELECT f.target_type, f.target_id, f.created_at
       FROM follows f
       WHERE f.follower_id = ?
       ORDER BY f.created_at DESC`,
      [req.params.userId]
    );
    return res.json({
      following: rows.map((r) => ({ ...r, target_id: String(r.target_id) })),
      count: rows.length,
    });
  } catch (err) {
    console.error('[GET /following]', err);
    return res.status(500).json({ error: 'Failed to load following' });
  }
});

// ╔══════════════════════════════════════════════════════════════╗
// ║  REPORTS                                                     ║
// ╚══════════════════════════════════════════════════════════════╝

const VALID_REPORT_REASONS = [
  'spam', 'hate_speech', 'misinformation',
  'harassment', 'violence', 'nudity', 'other',
];

router.post('/report', requireAuth, async (req, res) => {
  const { target_type, target_id, reason, detail = null } = req.body;

  if (!['post', 'comment', 'user'].includes(target_type) || !target_id) {
    return res.status(400).json({ error: 'target_type (post|comment|user) and target_id required' });
  }
  if (!VALID_REPORT_REASONS.includes(reason)) {
    return res.status(400).json({ error: `reason must be one of: ${VALID_REPORT_REASONS.join(', ')}` });
  }

  try {
    // Prevent duplicate reports from same user
    const [existing] = await query(
      `SELECT id FROM reports WHERE reporter_id = ? AND target_type = ? AND target_id = ?`,
      [req.user.id, target_type, String(target_id)]
    );
    if (existing) {
      return res.status(409).json({ error: 'You have already reported this' });
    }

    await query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason, detail)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, target_type, String(target_id), reason, detail]
    );

    return res.status(201).json({ ok: true });
  } catch (err) {
    console.error('[POST /report]', err);
    return res.status(500).json({ error: 'Failed to submit report' });
  }
});

// ╔══════════════════════════════════════════════════════════════╗
// ║  NOTIFICATIONS                                               ║
// ╚══════════════════════════════════════════════════════════════╝

/**
 * GET /api/social/notifications
 * Returns unread (and recent read) notifications for the authed user.
 */
/** GET /users/search?q= — lightweight @mention autocomplete (max 8). */
router.get('/users/search', optionalAuth, async (req, res) => {
  const q = String(req.query.q ?? '').trim();
  if (q.length < 1) return res.json({ users: [] });
  try {
    const rows = await query(
      `SELECT id, username, display_name, avatar_url, is_verified
         FROM users
        WHERE username LIKE ? OR display_name LIKE ?
        ORDER BY (username = ?) DESC, username ASC
        LIMIT 8`,
      [`${q}%`, `%${q}%`, q],
    );
    return res.json({
      users: rows.map((u) => ({
        id: String(u.id),
        username: u.username,
        display_name: u.display_name || null,
        avatar_url: u.avatar_url || null,
        is_verified: !!u.is_verified,
      })),
    });
  } catch (err) {
    console.error('[GET /users/search]', err);
    return res.status(500).json({ error: 'Failed to search users' });
  }
});

router.get('/notifications', requireAuth, async (req, res) => {
  try {
    const rows = await query(
      `SELECT n.id, n.type, n.ref_type, n.ref_id, n.body, n.is_read, n.created_at,
              u.username AS actor_username, u.avatar_url AS actor_avatar
       FROM notifications n
       LEFT JOIN users u ON u.id = n.actor_id
       WHERE n.recipient_id = ?
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    return res.json({ notifications: rows.map((r) => ({ ...r, id: String(r.id) })) });
  } catch (err) {
    console.error('[GET /notifications]', err);
    return res.status(500).json({ error: 'Failed to load notifications' });
  }
});

/** POST /api/social/notifications/read-all */
router.post('/notifications/read-all', requireAuth, async (req, res) => {
  await query('UPDATE notifications SET is_read = 1 WHERE recipient_id = ?', [req.user.id]);
  return res.json({ ok: true });
});

// ── Internal helper ────────────────────────────────────────────

async function createNotification({ recipient_id, actor_id, type, ref_type, ref_id, body }) {
  await query(
    `INSERT INTO notifications (recipient_id, actor_id, type, ref_type, ref_id, body)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [String(recipient_id), actor_id ? String(actor_id) : null, type, ref_type || null, ref_id ? String(ref_id) : null, body || null]
  );
}

export { createNotification };
export default router;

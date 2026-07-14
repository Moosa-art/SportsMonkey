/**
 * server/routes/feed.js
 *
 * GET  /api/feed          — paginated posts for home feed
 *
 * Query params:
 *   cursor  (BIGINT post.id) — for cursor-based pagination
 *   limit   (default 20, max 50)
 *   tab     (Favourite | All | Following | Trending)
 *
 * Response shape matches what Feed.jsx expects:
 * { posts: [...], nextCursor: string|null }
 *
 * Each post row is enriched with:
 *   liked: boolean  — whether the requesting user has liked it (if auth present)
 *   saved: boolean  — whether saved (placeholder; needs bookmarks table)
 */

import { Router } from 'express';
import { query }  from '../db/pool.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, async (req, res) => {
  const limit  = Math.min(Number(req.query.limit)  || 20, 50);
  const cursor = req.query.cursor ? BigInt(req.query.cursor) : null;
  const tab    = req.query.tab || 'All';

  try {
    let sql    = '';
    let params = [];

    // Base: all visible, non-deleted posts newest first
    const baseWhere = `WHERE p.deleted_at IS NULL AND p.is_hidden = 0`;

    if (tab === 'Following' && req.user) {
      // Posts from users/players/teams the authenticated user follows
      sql = `
        SELECT p.*
        FROM posts p
        JOIN follows f ON (
          (f.target_type = 'user' AND f.target_id = p.author_id)
        )
        ${baseWhere}
        AND f.follower_id = ?
        ${cursor ? 'AND p.id < ?' : ''}
        ORDER BY p.id DESC
        LIMIT ?
      `;
      params = cursor
        ? [req.user.id, String(cursor), limit + 1]
        : [req.user.id, limit + 1];
    } else if (tab === 'Trending') {
      // Top posts by engagement in the last 48 h
      sql = `
        SELECT p.*
        FROM posts p
        ${baseWhere}
        AND p.created_at >= NOW() - INTERVAL 48 HOUR
        ${cursor ? 'AND p.id < ?' : ''}
        ORDER BY (p.like_count + p.comment_count * 2) DESC, p.id DESC
        LIMIT ?
      `;
      params = cursor ? [String(cursor), limit + 1] : [limit + 1];
    } else {
      // Default: all posts / Favourite (filtered client-side by club logic for now)
      sql = `
        SELECT p.*
        FROM posts p
        ${baseWhere}
        ${cursor ? 'AND p.id < ?' : ''}
        ORDER BY p.id DESC
        LIMIT ?
      `;
      params = cursor ? [String(cursor), limit + 1] : [limit + 1];
    }

    let posts = await query(sql, params);

    // Cursor pagination: check if there's a next page
    let nextCursor = null;
    if (posts.length > limit) {
      nextCursor = String(posts[limit - 1].id);
      posts = posts.slice(0, limit);
    }

    // Enrich with liked status if user is authenticated
    if (req.user && posts.length) {
      const postIds = posts.map((p) => String(p.id));
      const liked = await query(
        `SELECT target_id FROM likes
         WHERE user_id = ? AND target_type = 'post' AND target_id IN (${postIds.map(() => '?').join(',')})`,
        [req.user.id, ...postIds]
      );
      const likedSet = new Set(liked.map((r) => String(r.target_id)));
      posts = posts.map((p) => ({ ...p, liked: likedSet.has(String(p.id)) }));
    }

    // Normalise BigInt ids to strings (JSON.stringify can't serialise BigInt)
    const normalise = (p) => ({
      ...p,
      id:        String(p.id),
      author_id: String(p.author_id),
      // Alias fields to match existing PostCard prop shape
      likes:     p.like_count,
      comments:  p.comment_count,
      timestamp: relativeTime(p.created_at),
    });

    return res.json({
      posts: posts.map(normalise),
      nextCursor,
    });
  } catch (err) {
    console.error('[GET /feed]', err);
    return res.status(500).json({ error: 'Failed to load feed' });
  }
});

// ── Utility ────────────────────────────────────────────────────

function relativeTime(date) {
  const diffMs   = Date.now() - new Date(date).getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1)   return 'JUST NOW';
  if (diffMins < 60)  return `${diffMins} MINUTE${diffMins > 1 ? 'S' : ''} AGO`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24)   return `${diffHrs} HOUR${diffHrs > 1 ? 'S' : ''} AGO`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays} DAY${diffDays > 1 ? 'S' : ''} AGO`;
}

export default router;

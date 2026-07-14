/**
 * server/routes/profiles.js
 *
 * GET  /api/profiles/me               — own profile + stats
 * PATCH /api/profiles/me              — update own profile
 * GET  /api/profiles/user/:username   — public user profile
 * GET  /api/profiles/players          — discover players list
 * GET  /api/profiles/player/:id       — single player profile
 * GET  /api/profiles/team/:id         — team profile
 *
 * Mirrors the data shapes consumed by ProfilePage.jsx:
 *   - posts count, friends (followers) count, following count
 *   - discover players grid: { name, img, club, clubColor, following }
 */

import { Router } from 'express';
import { query }  from '../db/pool.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

// ── GET /api/profiles/me ──────────────────────────────────────
router.get('/me', requireAuth, async (req, res) => {
  try {
    const [user] = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio,
              u.role, u.is_verified, u.created_at,
              u.location, u.date_of_birth, u.favourite_club_id, u.favourite_team_id,
              t.name AS club_name, t.short_code AS club_short, t.primary_color AS club_color,
              ft.name AS team_name, ft.short_code AS team_short, ft.primary_color AS team_color,
              (SELECT COUNT(*) FROM posts p WHERE p.author_id = u.id AND p.deleted_at IS NULL) AS post_count,
              (SELECT COUNT(*) FROM follows f WHERE f.target_type = 'user' AND f.target_id = u.id) AS followers_count,
              (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id) AS following_count
       FROM users u
       LEFT JOIN teams t  ON t.id  = u.favourite_club_id
       LEFT JOIN teams ft ON ft.id = u.favourite_team_id
       WHERE u.id = ? AND u.deleted_at IS NULL`,
      [req.user.id]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({ profile: { ...user, id: String(user.id) } });
  } catch (err) {
    console.error('[GET /profiles/me]', err);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

// ── PATCH /api/profiles/me ─────────────────────────────────────
router.patch('/me', requireAuth, async (req, res) => {
  const allowed = [
    'display_name', 'username', 'bio', 'avatar_url',
    'favourite_club_id', 'favourite_team_id',
    'location', 'date_of_birth',
  ];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'No updatable fields provided' });
  }

  // ── Username: 3–30 chars (letters/numbers/dot/underscore), unique,
  //    max 1 change per 30 days. ────────────────────────────────────
  if (updates.username !== undefined) {
    const uname = String(updates.username).trim().toLowerCase();
    if (!/^[a-z0-9._]{3,30}$/.test(uname)) {
      return res.status(400).json({ error: 'Username must be 3–30 characters using letters, numbers, dot or underscore.' });
    }
    try {
      const [current] = await query(
        'SELECT username, username_changed_at FROM users WHERE id = ?',
        [req.user.id]
      );
      if (current && current.username !== uname) {
        const [clash] = await query(
          'SELECT id FROM users WHERE username = ? AND id <> ?',
          [uname, req.user.id]
        );
        if (clash) {
          return res.status(409).json({ error: 'That username is already taken.' });
        }
        if (current.username_changed_at) {
          const last = new Date(current.username_changed_at).getTime();
          const days = (Date.now() - last) / (1000 * 60 * 60 * 24);
          if (days < 30) {
            return res.status(429).json({ error: `You can change your username again in ${Math.ceil(30 - days)} day(s).` });
          }
        }
        updates.username = uname;
        updates.username_changed_at = new Date();
      } else {
        delete updates.username;
      }
    } catch (err) {
      console.error('[PATCH /profiles/me] username check failed', err);
      return res.status(500).json({ error: 'Failed to validate username' });
    }
  }

  // ── Date of birth: ISO YYYY-MM-DD and at least 13 years ago. ──────
  if (updates.date_of_birth !== undefined && updates.date_of_birth !== null && updates.date_of_birth !== '') {
    const dob = String(updates.date_of_birth);
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dob)) {
      return res.status(400).json({ error: 'Date of birth must be in YYYY-MM-DD format.' });
    }
    const dobMs = new Date(dob + 'T00:00:00Z').getTime();
    if (Number.isNaN(dobMs)) {
      return res.status(400).json({ error: 'Invalid date of birth.' });
    }
    const thirteenAgo = Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000;
    if (dobMs > thirteenAgo) {
      return res.status(400).json({ error: 'You must be at least 13 years old.' });
    }
  } else if (updates.date_of_birth === '') {
    updates.date_of_birth = null;
  }

  // ── Location: trim + cap length. ─────────────────────────────────
  if (typeof updates.location === 'string') {
    updates.location = updates.location.trim().slice(0, 120) || null;
  }

  if (!Object.keys(updates).length) {
    return res.status(400).json({ error: 'No changes to save' });
  }

  try {
    const setClauses = Object.keys(updates).map((k) => `${k} = ?`).join(', ');
    await query(
      `UPDATE users SET ${setClauses} WHERE id = ?`,
      [...Object.values(updates), req.user.id]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error('[PATCH /profiles/me]', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// ── GET /api/profiles/username-available ─────────────────────
// Lightweight availability check for the Edit Profile username field.
router.get('/username-available', requireAuth, async (req, res) => {
  const uname = String(req.query.u || '').trim().toLowerCase();
  if (!/^[a-z0-9._]{3,30}$/.test(uname)) {
    return res.json({ available: false, reason: 'invalid' });
  }
  try {
    const [clash] = await query(
      'SELECT id FROM users WHERE username = ? AND id <> ?',
      [uname, req.user.id]
    );
    return res.json({ available: !clash });
  } catch (err) {
    console.error('[GET /profiles/username-available]', err);
    return res.status(500).json({ error: 'Failed to check username' });
  }
});

// ── GET /api/profiles/teams — club/team picker source ────────
// Backed by our local `teams` table (FK target for favourite_club_id /
// favourite_team_id). Optional ?q= filters by name or short code.
router.get('/teams', optionalAuth, async (req, res) => {
  const q = String(req.query.q || '').trim();
  try {
    const rows = q
      ? await query(
          `SELECT id, name, short_code, crest_url, primary_color, country
           FROM teams
           WHERE name LIKE ? OR short_code LIKE ?
           ORDER BY name LIMIT 50`,
          [`%${q}%`, `%${q}%`]
        )
      : await query(
          `SELECT id, name, short_code, crest_url, primary_color, country
           FROM teams ORDER BY name LIMIT 50`
        );
    return res.json({ teams: rows.map((r) => ({ ...r, id: String(r.id) })) });
  } catch (err) {
    console.error('[GET /profiles/teams]', err);
    return res.status(500).json({ error: 'Failed to load teams' });
  }
});

// ── GET /api/profiles/user/:username ─────────────────────────
router.get('/user/:username', optionalAuth, async (req, res) => {
  try {
    const [user] = await query(
      `SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio,
              u.role, u.is_verified, u.created_at,
              t.name AS club_name, t.short_code AS club_short, t.primary_color AS club_color,
              (SELECT COUNT(*) FROM posts p  WHERE p.author_id = u.id AND p.deleted_at IS NULL)         AS post_count,
              (SELECT COUNT(*) FROM follows f WHERE f.target_type = 'user' AND f.target_id = u.id)      AS followers_count,
              (SELECT COUNT(*) FROM follows f WHERE f.follower_id = u.id)                               AS following_count
       FROM users u
       LEFT JOIN teams t ON t.id = u.favourite_club_id
       WHERE u.username = ? AND u.deleted_at IS NULL`,
      [req.params.username.toLowerCase()]
    );

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Is the requesting user already following this profile?
    let isFollowing = false;
    if (req.user) {
      const [f] = await query(
        `SELECT id FROM follows WHERE follower_id = ? AND target_type = 'user' AND target_id = ?`,
        [req.user.id, String(user.id)]
      );
      isFollowing = !!f;
    }

    return res.json({ profile: { ...user, id: String(user.id), isFollowing } });
  } catch (err) {
    console.error('[GET /profiles/user]', err);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

// ── GET /api/profiles/players — discover list ─────────────────
// Matches the `players` array shape used in ProfilePage.jsx
router.get('/players', optionalAuth, async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 50);

  try {
    const rows = await query(
      `SELECT pl.id, pl.full_name AS name, pl.photo_url AS img,
              t.short_code AS club, t.primary_color AS clubColor,
              u.id AS user_id
       FROM players pl
       LEFT JOIN teams t  ON t.id  = pl.current_club_id
       LEFT JOIN users u  ON u.id  = pl.user_id
       WHERE u.deleted_at IS NULL
       LIMIT ?`,
      [limit]
    );

    // Enrich with following status
    let followingSet = new Set();
    if (req.user && rows.length) {
      const ids      = rows.map((r) => String(r.id));
      const followed = await query(
        `SELECT target_id FROM follows
         WHERE follower_id = ? AND target_type = 'player' AND target_id IN (${ids.map(() => '?').join(',')})`,
        [req.user.id, ...ids]
      );
      followingSet = new Set(followed.map((f) => String(f.target_id)));
    }

    const players = rows.map((r) => ({
      id:         String(r.id),
      name:       r.name,
      img:        r.img || `https://i.pravatar.cc/100?u=${r.id}`,
      club:       r.club  || '?',
      clubColor:  r.clubColor || '#333',
      following:  followingSet.has(String(r.id)),
    }));

    return res.json({ players });
  } catch (err) {
    console.error('[GET /profiles/players]', err);
    return res.status(500).json({ error: 'Failed to load players' });
  }
});

// ── GET /api/profiles/player/:id ─────────────────────────────
router.get('/player/:id', optionalAuth, async (req, res) => {
  try {
    const [player] = await query(
      `SELECT pl.*, t.name AS club_name, t.short_code AS club_short, t.primary_color AS club_color,
              u.username, u.display_name, u.is_verified,
              (SELECT COUNT(*) FROM follows f WHERE f.target_type = 'player' AND f.target_id = pl.id) AS followers_count
       FROM players pl
       LEFT JOIN teams t ON t.id = pl.current_club_id
       LEFT JOIN users u ON u.id = pl.user_id
       WHERE pl.id = ?`,
      [req.params.id]
    );

    if (!player) return res.status(404).json({ error: 'Player not found' });

    let isFollowing = false;
    if (req.user) {
      const [f] = await query(
        `SELECT id FROM follows WHERE follower_id = ? AND target_type = 'player' AND target_id = ?`,
        [req.user.id, String(player.id)]
      );
      isFollowing = !!f;
    }

    return res.json({ player: { ...player, id: String(player.id), isFollowing } });
  } catch (err) {
    console.error('[GET /profiles/player]', err);
    return res.status(500).json({ error: 'Failed to load player profile' });
  }
});

// ── GET /api/profiles/team/:id ────────────────────────────────
router.get('/team/:id', optionalAuth, async (req, res) => {
  try {
    const [team] = await query(
      `SELECT t.*,
              (SELECT COUNT(*) FROM follows f WHERE f.target_type = 'team' AND f.target_id = t.id) AS followers_count,
              (SELECT COUNT(*) FROM players pl WHERE pl.current_club_id = t.id) AS player_count
       FROM teams t WHERE t.id = ?`,
      [req.params.id]
    );

    if (!team) return res.status(404).json({ error: 'Team not found' });

    let isFollowing = false;
    if (req.user) {
      const [f] = await query(
        `SELECT id FROM follows WHERE follower_id = ? AND target_type = 'team' AND target_id = ?`,
        [req.user.id, String(team.id)]
      );
      isFollowing = !!f;
    }

    return res.json({ team: { ...team, id: String(team.id), isFollowing } });
  } catch (err) {
    console.error('[GET /profiles/team]', err);
    return res.status(500).json({ error: 'Failed to load team profile' });
  }
});

export default router;

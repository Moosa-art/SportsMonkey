/**
 * server/routes/auth.js
 * POST /api/auth/register
 * POST /api/auth/login
 * POST /api/auth/refresh
 * POST /api/auth/logout
 *
 * All passwords hashed with bcrypt (cost 12).
 * Access token: 15 min JWT.
 * Refresh token: 7 day JWT, stored in DB + httpOnly cookie.
 */

import { Router } from 'express';
import bcrypt from 'bcrypt';
import { query } from '../db/pool.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  requireAuth,
} from '../middleware/auth.js';

const router = Router();
const BCRYPT_ROUNDS = 12;

// ── Helpers ───────────────────────────────────────────────────

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
    path:     '/api/auth',
  });
}

function clearRefreshCookie(res) {
  res.clearCookie('refreshToken', { path: '/api/auth' });
}

// ── POST /api/auth/register ───────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, display_name, email, password, role = 'user' } = req.body;

    // Basic validation
    if (!username || !email || !password || !display_name) {
      return res.status(400).json({ error: 'username, display_name, email and password are required' });
    }
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      return res.status(400).json({ error: 'Username must be 3–30 alphanumeric characters or underscores' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (!['user', 'player', 'team_admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Duplicate checks
    const existing = await query(
      'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email.toLowerCase(), username.toLowerCase()]
    );
    if (existing.length) {
      return res.status(409).json({ error: 'Email or username already taken' });
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const result = await query(
      `INSERT INTO users (username, display_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [username.toLowerCase(), display_name, email.toLowerCase(), password_hash, role]
    );

    const userId = String(result.insertId);

    // If registering as player, create player profile row
    if (role === 'player') {
      await query(
        'INSERT INTO players (user_id, full_name) VALUES (?, ?)',
        [userId, display_name]
      );
    }

    const tokenPayload = { id: userId, username: username.toLowerCase(), role };
    const accessToken  = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, userId]);
    setRefreshCookie(res, refreshToken);

    return res.status(201).json({
      user: { id: userId, username: username.toLowerCase(), display_name, role },
      accessToken,
    });
  } catch (err) {
    console.error('[auth.register]', err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const [user] = await query(
      `SELECT id, username, display_name, email, password_hash, role, is_verified, deleted_at
       FROM users WHERE email = ? LIMIT 1`,
      [email.toLowerCase()]
    );

    if (!user || user.deleted_at) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenPayload = { id: String(user.id), username: user.username, role: user.role };
    const accessToken  = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await query('UPDATE users SET refresh_token = ? WHERE id = ?', [refreshToken, user.id]);
    setRefreshCookie(res, refreshToken);

    return res.json({
      user: {
        id:           String(user.id),
        username:     user.username,
        display_name: user.display_name,
        role:         user.role,
        is_verified:  !!user.is_verified,
      },
      accessToken,
    });
  } catch (err) {
    console.error('[auth.login]', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// ── POST /api/auth/refresh ────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const token = req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ error: 'No refresh token' });
  }

  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch {
    clearRefreshCookie(res);
    return res.status(401).json({ error: 'Invalid or expired refresh token' });
  }

  // Validate token matches DB (rotation guard)
  const [user] = await query(
    'SELECT id, username, role, refresh_token FROM users WHERE id = ? LIMIT 1',
    [payload.id]
  );

  if (!user || user.refresh_token !== token) {
    clearRefreshCookie(res);
    return res.status(401).json({ error: 'Refresh token reuse detected' });
  }

  const newPayload  = { id: String(user.id), username: user.username, role: user.role };
  const accessToken = signAccessToken(newPayload);
  const newRefresh  = signRefreshToken(newPayload);

  await query('UPDATE users SET refresh_token = ? WHERE id = ?', [newRefresh, user.id]);
  setRefreshCookie(res, newRefresh);

  return res.json({ accessToken });
});

// ── POST /api/auth/logout ─────────────────────────────────────
router.post('/logout', requireAuth, async (req, res) => {
  await query('UPDATE users SET refresh_token = NULL WHERE id = ?', [req.user.id]);
  clearRefreshCookie(res);
  return res.json({ ok: true });
});

export default router;

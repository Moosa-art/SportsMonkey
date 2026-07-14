/**
 * server/middleware/auth.js
 * JWT authentication middleware.
 *
 * Usage:
 *   import { requireAuth, optionalAuth } from '../middleware/auth.js';
 *
 *   router.get('/feed',    optionalAuth, feedHandler);   // public; user enriched if logged in
 *   router.post('/like',   requireAuth,  likeHandler);   // 401 if no valid token
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET      = process.env.JWT_SECRET      || 'change_me_in_production';
const JWT_EXPIRES_IN  = process.env.JWT_EXPIRES_IN  || '15m';
const REFRESH_SECRET  = process.env.REFRESH_SECRET  || 'change_refresh_secret';
const REFRESH_EXPIRES = process.env.REFRESH_EXPIRES || '7d';

// ── Token helpers ──────────────────────────────────────────────

/**
 * Sign a short-lived access token.
 * @param {{ id: string, username: string, role: string }} payload
 */
export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Sign a long-lived refresh token.
 */
export function signRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

/**
 * Verify a refresh token (throws if invalid/expired).
 */
export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

// ── Middleware ─────────────────────────────────────────────────

/**
 * requireAuth — 401 if no valid Bearer token.
 * On success, attaches req.user = { id, username, role }.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError'
      ? 'Token expired'
      : 'Invalid token';
    return res.status(401).json({ error: msg });
  }
}

/**
 * optionalAuth — proceeds even without a token.
 * req.user is set if a valid token is present, otherwise null.
 */
export function optionalAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  req.user = null;
  if (token) {
    try { req.user = jwt.verify(token, JWT_SECRET); } catch { /* ignore */ }
  }
  return next();
}

/**
 * requireRole('team_admin') — must be requireAuth'd first.
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    return next();
  };
}

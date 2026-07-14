/**
 * server/routes/clubFixtures.js
 *
 * BFF proxy for the live club fixtures endpoint. The browser calls our own
 * origin and we forward to the upstream `club-fixtures` API server-side (no
 * CORS, with timeout + short TTL cache).
 *
 *   GET /api/club-fixtures?club_id=22822&user_timezone=Asia/Karachi
 *
 * The upstream returns `date_time` already formatted in the supplied timezone,
 * so we pass the viewer's timezone straight through. On any upstream failure we
 * return HTTP 502 with a well-formed empty payload so the client degrades
 * gracefully instead of throwing.
 */

import { Router } from 'express';
import { upstreamFetch } from '../lib/upstream.js';

const router = Router();
const UPSTREAM_PATH = '/api/club-fixtures';
const DEFAULT_CLUB_ID = Number(process.env.DEFAULT_FIXTURES_CLUB_ID) || 22822;
const DEFAULT_TZ = process.env.DEFAULT_FIXTURES_TZ || 'UTC';

function posInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

router.get('/', async (req, res) => {
  const clubId = posInt(req.query.club_id) || DEFAULT_CLUB_ID;
  // IANA timezone string, e.g. "Asia/Karachi". Keep it conservative.
  const rawTz = typeof req.query.user_timezone === 'string' ? req.query.user_timezone.trim() : '';
  const tz = /^[A-Za-z0-9_+\-\/]{1,64}$/.test(rawTz) ? rawTz : DEFAULT_TZ;

  const upstreamPath =
    `${UPSTREAM_PATH}?club_id=${clubId}&user_timezone=${encodeURIComponent(tz)}`;

  try {
    const data = await upstreamFetch(upstreamPath, {
      cacheKey: `fixtures:${clubId}:${tz}`,
    });
    res.json(data);
  } catch (err) {
    console.error('[club-fixtures] GET failed:', err.message);
    res.status(502).json({ status: false, fixtures: [] });
  }
});

export default router;

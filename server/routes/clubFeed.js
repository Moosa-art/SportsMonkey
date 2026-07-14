/**
 * server/routes/clubFeed.js
 *
 * BFF proxy for the club-scoped feed. The browser calls our own origin, and we
 * forward to the upstream `club-feed-new` endpoint server-side (no CORS).
 *
 *   GET  /api/club-feed?club_id=14              → first page
 *   POST /api/club-feed?club_id=14  { offsets }  → next page (cursor echo)
 *
 * On any upstream failure we return HTTP 502 with an empty, well-formed feed
 * payload so the client can degrade gracefully instead of throwing.
 */

import { Router } from 'express';
import { upstreamFetch } from '../lib/upstream.js';

const router = Router();
const UPSTREAM_PATH = '/api/club-feed-new';
const DEFAULT_CLUB_ID = Number(process.env.DEFAULT_CLUB_ID) || 14;

function parseClubId(req) {
  const raw = req.query.club_id != null ? req.query.club_id : (req.body && req.body.club_id);
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : DEFAULT_CLUB_ID;
}

router.get('/', async (req, res) => {
  const clubId = parseClubId(req);
  try {
    const data = await upstreamFetch(`${UPSTREAM_PATH}?club_id=${clubId}`, {
      cacheKey: `feed:${clubId}`,
    });
    res.json(data);
  } catch (err) {
    console.error('[club-feed] GET failed:', err.message);
    res.status(502).json({ status: false, error: 'Upstream feed unavailable', feed: [] });
  }
});

router.post('/', async (req, res) => {
  const clubId = parseClubId(req);
  const offsets = (req.body && req.body.offsets) || null;
  try {
    const data = await upstreamFetch(`${UPSTREAM_PATH}?club_id=${clubId}`, {
      method: 'POST',
      body: { offsets, club_id: clubId },
    });
    res.json(data);
  } catch (err) {
    console.error('[club-feed] POST failed:', err.message);
    res.status(502).json({ status: false, error: 'Upstream feed unavailable', feed: [] });
  }
});

export default router;

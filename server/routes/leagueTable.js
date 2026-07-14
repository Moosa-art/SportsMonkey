/**
 * server/routes/leagueTable.js
 *
 * BFF proxy for the live league-table / standings endpoint. The browser calls
 * our own origin and we forward to the upstream `league-table` API server-side
 * (no CORS, with timeout + short TTL cache).
 *
 *   GET /api/league-table?club_id=19      → club's country, its leagues + standings
 *   GET /api/league-table?league_id=2      → standings for a specific league
 *   GET /api/league-table?country_id=8     → switch country (leagues + top-league standings)
 *
 * Exactly one selector is forwarded per call (league_id > country_id > club_id).
 * On any upstream failure we return HTTP 502 with a well-formed empty payload so
 * the client can degrade gracefully instead of throwing.
 */

import { Router } from 'express';
import { upstreamFetch } from '../lib/upstream.js';

const router = Router();
const UPSTREAM_PATH = '/api/league-table';
const DEFAULT_CLUB_ID = Number(process.env.DEFAULT_TABLE_CLUB_ID) || 19;

// Coerce a query value to a positive integer, or null when absent/invalid.
function posInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : null;
}

router.get('/', async (req, res) => {
  const leagueId  = posInt(req.query.league_id);
  const countryId = posInt(req.query.country_id);
  const clubId    = posInt(req.query.club_id);

  // Pick a single selector. league_id is the most specific, then country, then
  // club; fall back to a sensible default club so the first load always works.
  let param;
  let cacheKey;
  if (leagueId != null) {
    param = `league_id=${leagueId}`;
    cacheKey = `table:league:${leagueId}`;
  } else if (countryId != null) {
    param = `country_id=${countryId}`;
    cacheKey = `table:country:${countryId}`;
  } else {
    const cid = clubId != null ? clubId : DEFAULT_CLUB_ID;
    param = `club_id=${cid}`;
    cacheKey = `table:club:${cid}`;
  }

  try {
    const data = await upstreamFetch(`${UPSTREAM_PATH}?${param}`, { cacheKey });
    res.json(data);
  } catch (err) {
    console.error('[league-table] GET failed:', err.message);
    res.status(502).json({
      status: false,
      error: 'Upstream league table unavailable',
      data: null,
    });
  }
});

export default router;

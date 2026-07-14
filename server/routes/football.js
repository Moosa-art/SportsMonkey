/**
 * server/routes/football.js
 *
 * GET /api/fixtures              — fixture list (used by FixturesPage.jsx)
 * GET /api/table?league=         — league table (used by TablePage.jsx)
 * GET /api/live?date=            — live/results by date (used by LivePage.jsx)
 *
 * Response shapes exactly match the existing fallback data structures
 * in each page component, so the UI needs zero changes.
 */

import { Router } from 'express';
import { query }  from '../db/pool.js';

const router = Router();

// ── GET /api/fixtures ─────────────────────────────────────────
router.get('/fixtures', async (req, res) => {
  try {
    const now  = new Date();
    const year = now.getFullYear();

    const rows = await query(
      `SELECT
         id,
         home_name    AS home,
         away_name    AS away,
         home_score   AS homeScore,
         away_score   AS awayScore,
         status,
         month_index  AS monthIndex,
         match_year,
         match_date
       FROM fixtures
       WHERE match_year = ?
       ORDER BY match_date ASC`,
      [year]
    );

    // Format date string to match original: 'Sat 7th Mar, 5:30pm'
    const formatted = rows.map((r) => ({
      id:         String(r.id),
      monthIndex: r.monthIndex,
      status:     r.status,
      home:       r.home,
      away:       r.away,
      homeScore:  r.homeScore ?? '-',
      awayScore:  r.awayScore ?? '-',
      date:       formatMatchDate(r.match_date),
    }));

    return res.json({
      year,
      suggestedMonth: now.getMonth(),
      fixtures: formatted,
    });
  } catch (err) {
    console.error('[GET /fixtures]', err);
    return res.status(500).json({ error: 'Failed to load fixtures' });
  }
});

// ── GET /api/table ─────────────────────────────────────────────
router.get('/table', async (req, res) => {
  // Accepts: ?league=premier-league  OR  ?league=championship
  const leagueParam = (req.query.league || 'championship').toLowerCase();
  const leagueName  = leagueParam === 'premier-league' ? 'Premier League' : 'Championship';

  try {
    const rows = await query(
      `SELECT team_name AS team, p, w, d, l, gd, pts
       FROM league_table
       WHERE league = ?
       ORDER BY pts DESC, gd DESC`,
      [leagueName]
    );

    const [{ lastUpdated }] = await query(
      `SELECT MAX(updated_at) AS lastUpdated FROM league_table WHERE league = ?`,
      [leagueName]
    );

    return res.json({
      rows: rows.length ? rows : [],
      lastUpdated: lastUpdated || null,
    });
  } catch (err) {
    console.error('[GET /table]', err);
    return res.status(500).json({ error: 'Failed to load table' });
  }
});

// ── GET /api/live ─────────────────────────────────────────────
router.get('/live', async (req, res) => {
  // date param: YYYY-MM-DD
  const dateParam = req.query.date || new Date().toISOString().slice(0, 10);

  // Basic date validation
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
  }

  try {
    const rows = await query(
      `SELECT
         f.id, f.home_name, f.away_name,
         f.home_score AS homeScore, f.away_score AS awayScore,
         f.status,
         f.match_date,
         f.league,
         t1.primary_color AS homeColor,
         t2.primary_color AS awayColor
       FROM fixtures f
       LEFT JOIN teams t1 ON t1.name = f.home_name
       LEFT JOIN teams t2 ON t2.name = f.away_name
       WHERE DATE(f.match_date) = ?
       ORDER BY f.match_date ASC`,
      [dateParam]
    );

    // Group by league (matches LivePage.jsx's `leagues` array shape)
    const leagueMap = new Map();
    for (const row of rows) {
      const league = row.league || 'Other';
      if (!leagueMap.has(league)) {
        leagueMap.set(league, {
          flag:    leagueFlag(league),
          name:    league,
          date:    formatShortDate(row.match_date),
          matches: [],
        });
      }
      leagueMap.get(league).matches.push({
        status:    row.status === 'Live' ? liveMinute(row.match_date) : row.status,
        home:      row.home_name,
        homeScore: row.homeScore ?? null,
        away:      row.away_name,
        awayScore: row.awayScore ?? null,
      });
    }

    return res.json({ leagues: Array.from(leagueMap.values()) });
  } catch (err) {
    console.error('[GET /live]', err);
    return res.status(500).json({ error: 'Failed to load live data' });
  }
});

// ── Helpers ────────────────────────────────────────────────────

function formatMatchDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const days  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day  = days[d.getDay()];
  const dom  = d.getDate();
  const suf  = ['th','st','nd','rd'][dom % 10 > 3 ? 0 : (dom - dom % 10 !== 10 ? dom % 10 : 0)];
  const mon  = months[d.getMonth()];
  let   hrs  = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, '0');
  const ampm = hrs >= 12 ? 'pm' : 'am';
  hrs = hrs % 12 || 12;
  return `${day} ${dom}${suf} ${mon}, ${hrs}:${mins}${ampm}`;
}

function formatShortDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return `${d.getDate()} ${['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.getMonth()]}`;
}

function liveMinute(startDate) {
  const elapsed = Math.floor((Date.now() - new Date(startDate).getTime()) / 60_000);
  return elapsed > 90 ? 'FT' : `${elapsed}'`;
}

// Approximate flag emoji map
const LEAGUE_FLAGS = {
  'Premier League':  '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'Championship':    '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'La Liga':         '🇪🇸',
  'Bundesliga':      '🇩🇪',
  'Serie A':         '🇮🇹',
  'Ligue 1':         '🇫🇷',
  'Eredivisie':      '🇳🇱',
  'Pro League':      '🇧🇪',
  'Allsvenskan':     '🇸🇪',
};
function leagueFlag(name) { return LEAGUE_FLAGS[name] || '🌍'; }

export default router;

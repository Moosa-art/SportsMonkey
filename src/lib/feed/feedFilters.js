/**
 * src/lib/feed/feedFilters.js
 *
 * Pure, side-effect-free helpers that power dynamic feed filtering and sorting.
 *
 * ARCHITECTURE NOTE — why client-side:
 * The upstream `club-feed-new` endpoint is club-scoped and cursor-paginated; it
 * exposes NO server-side parameters for favourites, following, trending or date
 * (verified against the real payload: only `club_id` + the `offsets` cursor).
 * Therefore these controls are implemented as deterministic transforms over the
 * REAL, already-fetched feed data — not mocked data. Each transform is pure so
 * it is trivially memoisable in the component layer and unit-testable here.
 *
 * @typedef {import('./feedTypes').FeedItem} FeedItem
 */

/**
 * Parse the many `creation_date` shapes the upstream emits into epoch ms.
 * Handles absolute ("2026-06-18 08:35:01", ISO) and relative ("5hr ago",
 * "3w ago", "Today", "Yesterday") forms. Returns null when unparseable.
 *
 * @param {string|null|undefined} value
 * @param {number} [nowMs] injectable clock for deterministic tests
 * @returns {number|null}
 */
export function parseCreatedAt(value, nowMs = Date.now()) {
  if (value == null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return null;
  const raw = value.trim();
  if (!raw) return null;

  const lower = raw.toLowerCase();
  if (lower === 'today' || lower === 'just now' || lower === 'now') return nowMs;
  if (lower === 'yesterday') return nowMs - 86400000;

  // Relative: "5hr ago", "3 w ago", "2 days ago", "1mo ago", "4 mins ago"
  const rel = lower.match(
    /^(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mon|month|months|y|yr|yrs|year|years)\b/,
  );
  if (rel) {
    const qty = Number(rel[1]);
    const unit = rel[2];
    const MS = {
      s: 1000, sec: 1000, secs: 1000, second: 1000, seconds: 1000,
      m: 60000, min: 60000, mins: 60000, minute: 60000, minutes: 60000,
      h: 3600000, hr: 3600000, hrs: 3600000, hour: 3600000, hours: 3600000,
      d: 86400000, day: 86400000, days: 86400000,
      w: 604800000, wk: 604800000, wks: 604800000, week: 604800000, weeks: 604800000,
      mo: 2592000000, mon: 2592000000, month: 2592000000, months: 2592000000,
      y: 31536000000, yr: 31536000000, yrs: 31536000000, year: 31536000000, years: 31536000000,
    };
    const ms = MS[unit];
    if (ms) return nowMs - qty * ms;
  }

  // Absolute: normalise "YYYY-MM-DD HH:MM:SS" to ISO then Date.parse.
  const iso = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') : raw;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

/**
 * Local-time YYYY-MM-DD for an epoch ms value.
 * @param {number} ms
 * @returns {string}
 */
export function toLocalIsoDay(ms) {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Composite trending score: engagement dominates, recency breaks ties.
 * @param {FeedItem} item
 * @returns {number}
 */
export function trendingScore(item) {
  const engagement = Number(item && item.engagement) || 0;
  const ts = Number(item && item.timestamp) || 0;
  // Engagement is weighted far above recency so genuinely hot posts rise, but
  // recency still orders the long tail deterministically.
  return engagement * 1e15 + ts;
}

/**
 * Apply the active tab + date filter to a normalized feed list. Pure: returns a
 * new array and never mutates the input.
 *
 * @param {FeedItem[]} items
 * @param {Object} opts
 * @param {string} [opts.tab] one of FEED_TABS values; defaults to unfiltered
 * @param {string|null} [opts.dateIso] YYYY-MM-DD to filter by, or null for all
 * @param {Set<string>|string[]} [opts.favorites] dedupeIds the user saved
 * @param {Set<string>|string[]} [opts.following] source keys the user follows
 * @param {number} [opts.nowMs]
 * @returns {FeedItem[]}
 */
export function applyFeedView(items, opts = {}) {
  const list = Array.isArray(items) ? items : [];
  const { tab = 'Latest', dateIso = null } = opts;
  const favorites = toSet(opts.favorites);
  const following = toSet(opts.following);

  let out = list;

  // 1) Tab filter / sort.
  switch (tab) {
    case 'Favourite':
      out = out.filter((it) => favorites.has(it.dedupeId));
      break;
    case 'Following':
      // Following applies to single-source items (news / video). Mixed-source
      // glance strips and fixtures are not attributable to one followed source.
      out = out.filter((it) => it.sourceKey && following.has(it.sourceKey));
      break;
    case 'Trending':
      out = [...out].sort((a, b) => trendingScore(b) - trendingScore(a));
      break;
    case 'Latest':
    default:
      // Preserve the upstream's curated ordering.
      break;
  }

  // 2) Date filter (independent of tab). Items without a resolvable timestamp
  //    are only shown when no specific date is selected.
  if (dateIso) {
    out = out.filter((it) => it.timestamp != null && toLocalIsoDay(it.timestamp) === dateIso);
  }

  return out;
}

function toSet(v) {
  if (v instanceof Set) return v;
  if (Array.isArray(v)) return new Set(v);
  return new Set();
}

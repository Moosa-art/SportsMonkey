/**
 * src/lib/feed/feedConfig.js
 *
 * Central configuration for the club-scoped production feed. Everything that
 * may change between environments lives here so feed code never hard-codes a
 * club id, host, or tuning constant. All values are env-overridable.
 */

const ENV = (typeof import.meta !== 'undefined' && import.meta.env) || {};

const num = (val, fallback) => {
  const n = Number(val);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

/**
 * The club whose feed we render. The production endpoint is club-scoped
 * (`/api/club-feed-new?club_id=14`). Defaults to 14 (Man Utd); override via
 * VITE_CLUB_ID once the app gains a club switcher.
 */
export const CLUB_ID = num(ENV.VITE_CLUB_ID, 14);

/**
 * Base host used to resolve RELATIVE media URLs returned by the upstream feed
 * (e.g. funny_video `link: "/public/videos/foo.mp4"`). Absolute URLs untouched.
 */
export const MEDIA_BASE = ENV.VITE_MEDIA_BASE || 'https://www.social442.com';

/**
 * IntersectionObserver prefetch margin: how far before the sentinel enters the
 * viewport we kick off the next page.
 */
export const INFINITE_SCROLL_ROOT_MARGIN = ENV.VITE_FEED_ROOT_MARGIN || '800px';

/**
 * Hard safety cap on pages fetched in one session. Prevents an unbounded loop
 * if the upstream cursor never reports end-of-feed.
 */
export const MAX_FEED_PAGES = num(ENV.VITE_FEED_MAX_PAGES, 50);

/**
 * How many consecutive pages may return zero NEW (post-dedupe) items before we
 * treat the feed as exhausted. Guards against a stuck cursor.
 */
export const MAX_CONSECUTIVE_EMPTY_PAGES = num(ENV.VITE_FEED_MAX_EMPTY, 2);

/**
 * When a client-side filter is active and the visible list is shorter than
 * this, auto-fetch the next page so infinite scroll still works under filters.
 */
export const MIN_VISIBLE_UNDER_FILTER = num(ENV.VITE_FEED_MIN_VISIBLE, 6);

/** localStorage keys for client-side personalisation (favourites / following). */
export const STORAGE_KEYS = {
  favorites: 'cf_favorites_v1',
  following: 'cf_following_v1',
};

/** Canonical filter tab ids. `latest` is the unfiltered default. */
export const FEED_TABS = {
  latest: 'Latest',
  favourite: 'Favourite',
  following: 'Following',
  trending: 'Trending',
};

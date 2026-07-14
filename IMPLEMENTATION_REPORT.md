# Club Feed — Audit & Refactor Report (v2)

Principal-engineer audit and refactor of the club feed system. Every change is
driven by the **real** `club-feed-new` API (via the Express BFF) — no mocks, no
hardcoded feed data.

- **API:** `GET/POST https://www.social442.com/api/club-feed-new?club_id=14`
- **BFF proxy:** `/api/club-feed` (Express, with upstream caching)
- **Stack:** React 19, Vite 8, Express 5, react-icons

---

## 1. Root Cause Analysis (per issue)

### Issue 1 — Broken Images
**Root cause.** The upstream returns image fields in three different shapes:
absolute CDN URLs, **root-relative** paths (e.g. `/public/...`), and **missing /
empty** fields. The old cards bound `src` directly to the raw value, so
relative paths resolved against the SPA origin (404) and missing fields rendered
as broken-image glyphs. URLs also contained **unencoded spaces**, which some
browsers reject.

**Fix.**
- `normalizeFeed.resolveMediaUrl()` now normalizes every media field: absolute
  URLs pass through, root-relative/relative paths are joined to `MEDIA_BASE`,
  spaces are `%20`-encoded, and empty values resolve to `null`.
- A single resilient `<SmartImage>` component renders **all** feed imagery
  (cards, crests, avatars, glance tiles, modal hero/source). On error or missing
  source it shows a deterministic initials/glyph placeholder instead of a broken
  image. Images are `loading="lazy"`, `decoding="async"`, with explicit aspect
  ratios to prevent layout shift.

### Issue 2 — Feed Stops Loading Prematurely
**Root cause.** The upstream is **cursor-based**: each response echoes an
`offsets` object (per-type counters + `seen_club_post[]` / `news_seen_ids[]` /
`viewed_video_ids[]`) that must be **merged and replayed** on the next request.
The old hook treated pages as independent and did not accumulate these seen-id
arrays, so the upstream re-served or short-circuited after a couple of pages.
There was also no reliable end-of-feed signal.

**Fix.** `useClubFeed` now:
- Accumulates the cursor across pages via `mergeOffsets()` (unions all seen-id
  arrays), so the upstream keeps advancing.
- Detects end-of-feed deterministically: stops when a page returns `rawCount === 0`,
  or after `MAX_CONSECUTIVE_EMPTY_PAGES` empty results, or at the
  `MAX_FEED_PAGES` safety bound.
- De-duplicates by `dedupeId` so no post appears twice across pages.
- Drives pagination from an `IntersectionObserver` sentinel with an `800px`
  root margin (prefetch before the user hits the bottom). Scroll position is
  preserved because we only ever **append**.

### Issue 3 — Feed UI Redesign
**Root cause.** Prototype-grade CSS: flat cards, inconsistent spacing, raw
images, weak hierarchy.

**Fix.** Full redesign in `feed-cards.css` with a tokenized card system
(`--cf-*`), elevated cards with hover states, clear typographic hierarchy,
16:9 media wells, a refined engagement bar, shimmer skeletons, and polished
empty/error states. **Dedicated components per post type** (see §3 of CHANGELOG):
`NewsCard`, `VideoCard`, `FixturesCard`, `GlanceGroup` (+ tile sub-renderers),
each designed around the actual API content for that type.

### Issue 4 — Performance
**Root cause.** Re-render storms: unstable callbacks recreated each render,
un-memoized cards, repeated normalization, and StrictMode double-fetches.

**Fix.** See the Performance Report below.

### Issue 5 — Authentication Persistence
**Root cause.** The access token is stored **in memory only** (correct, XSS-safe
design). On refresh the in-memory token is gone. The old `checkAuth()` read that
in-memory token, found it `null`, and *skipped restoration entirely* — so the
user was treated as logged out and bounced to Sign In. The httpOnly refresh
cookie (valid 7 days) was never consulted on boot.

**Fix.** `AuthContext.checkAuth()` now **always** calls `api.bootstrapSession()`
(`POST /auth/refresh` with `credentials: 'include'`) on mount. If the refresh
cookie is valid it issues a fresh access token and we hydrate the profile via
`getMyProfile()`; only if refresh fails do we treat the user as logged out.
`loading` stays `true` until this completes, so route guards never flash the
login screen mid-hydration (race condition fixed). This covers refresh, new
tab, and browser restart; expired sessions fall through to Sign In cleanly.

### Issue 6 — Dynamic Filtering & Sorting
**Root cause.** `FilterTabs` and `DateSelector` were rendered but **not wired** —
`Feed` ignored `activeTab` (eslint-disabled) and `DateSelector`'s `onDateChange`
was never passed. The upstream exposes **no server-side filter params**, so
filtering must be a client-side transform over fetched data.

**Fix.** A pure transform engine (`feedFilters.applyFeedView`) + persisted user
preferences (`userPrefs`, localStorage + cross-tab sync). See the Filtering
Architecture section.

---

## 2. Performance Optimization Report

| Optimization | Where | Effect |
|---|---|---|
| Stable, item-aware handlers (`useCallback`) | `Feed`, `ClubFeedRenderer` | Memoized cards keep referential equality → no cascade re-renders on parent updates |
| `React.memo` on every card/renderer | all `cards/*`, `SmartImage`, `EngagementBar`, `ClubFeedRenderer`, `FilterTabs`, `DateSelector` | Cards re-render only when their own item/props change |
| Memoized view transform | `Feed` (`useMemo` over `applyFeedView`) | Filtering/sorting recomputes only when items/tab/date/prefs change |
| Single normalization pass | `useClubFeed` | Raw→normalized once per page, cached in state; no re-normalization on render |
| StrictMode-safe fetch | `useClubFeed` (AbortController) | Eliminates duplicate dev double-fetch and stale in-flight requests |
| Upstream caching | Express BFF (`UPSTREAM_CACHE_TTL_MS`) | Collapses duplicate first-page requests across clients |
| Lazy-loaded heavy component | `NewsArticleModal` via `React.lazy` + `Suspense` | Modal code is split out of the main bundle |
| Cheap windowing | `feed-cards.css` `content-visibility: auto` + `contain-intrinsic-size` | Off-screen cards skip layout/paint — large-list cost without a virtualization dependency |
| Lazy + sized images | `SmartImage` | Defers off-screen image decode; explicit aspect ratios remove layout shift |
| Prefetch pagination | `IntersectionObserver` `rootMargin: 800px` | Next page loads before the user reaches the end (no scroll stall) |

**Bundle:** no new runtime dependencies added; the modal is code-split; icons
are tree-shaken named imports from `react-icons`.

---

## 3. Authentication Flow (after fix)

```
App mount
  └─ AuthProvider.checkAuth()
       └─ api.bootstrapSession()  ──POST /api/auth/refresh (cookie: refreshToken)
            ├─ 200 → new accessToken (in-memory) → getMyProfile() → setUser → authenticated
            └─ 401/none → stay logged out
       (loading=true throughout → guards wait → no login flash)

Runtime 401 on any call
  └─ fetchJson auto-calls _refreshAccessToken() once, retries the request
```

- Access token: in-memory (XSS-safe), 15 min.
- Refresh token: httpOnly cookie, 7 days, rotated on each refresh, stored
  server-side.
- Refresh / new tab / browser restart all re-hydrate from the cookie.
- Expired/absent refresh token → clean logout to Sign In.

---

## 4. Feed Filtering Architecture

The upstream has **no filter query params**, so filtering is a deterministic,
pure transform applied to the already-fetched, normalized items. This keeps
filtering instant and keeps pagination correct.

```
useClubFeed → items[]  (each: { dedupeId, timestamp, engagement, sourceKey, ... })
        │
        ▼
Feed: useMemo(applyFeedView(items, { tab, dateIso, favorites, following }))
        │                                   ▲              ▲
        │                          useFavorites()   useFollowing()  (localStorage + cross-tab)
        ▼
visibleItems → ClubFeedRenderer per item
```

- **Latest** (default): original upstream order.
- **Favourites**: items whose `dedupeId` is in the favorites store (toggled via
  the bookmark action on each card).
- **Following**: items whose `sourceKey` is in the following store.
- **Trending**: sorted by `trendingScore` (engagement-weighted, recency
  tiebreak) from real API engagement metrics.
- **Date slider**: filters by local-day ISO (`toLocalIsoDay`); items without a
  parseable timestamp are excluded under a date filter. An **All** pill clears
  the date filter (default).
- **Combinations**: tab + date intersect (e.g. Following + a specific day).
- **Pagination under filters**: when a filter collapses the visible list below
  `MIN_VISIBLE_UNDER_FILTER`, `Feed` keeps fetching more pages (bounded by the
  hook's end-of-feed guards) until the viewport fills or the feed is exhausted.
- **Persistence**: active tab and selected date live in `App` state (survive
  bottom-nav navigation); favorites/following persist in localStorage and sync
  across tabs via the `storage` event.

---

## 5. Before vs After

| Area | Before | After |
|---|---|---|
| Images | Raw `src`, relative/missing → broken | Normalized URLs + `SmartImage` fallbacks, lazy + sized |
| Pagination | Stops after a few pages, possible dupes | Cursor-merged infinite scroll, de-duped, real end-of-feed |
| UI | Flat prototype cards | Tokenized modern cards, per-type layouts, skeletons, empty states |
| Performance | Re-render storms, double-fetch, no windowing | Memoized tree, stable handlers, code-split modal, `content-visibility` |
| Auth | Bounced to Sign In on refresh | Silent cookie re-hydration, no login flash |
| Filters | Non-functional (unwired) | Fully dynamic Latest/Favourites/Following/Trending + date, persisted |

---

## 6. Validation

- `node scripts/smoke-normalizeFeed.mjs` — normalizer invariants (kinds, dedupe,
  rawCount, per-item timestamp/engagement, global context).
- `node scripts/smoke-feedFilters.mjs` — filter/sort engine (each tab, date,
  combinations, immutability, time parsing, trending order).
- `node node_modules/eslint/bin/eslint.js .` — lint (feed files clean).
- `node /data/esbuild-check.cjs` — esbuild bundle smoke (build sanity).

> Note: `vite build` cannot run in this sandbox — Vite 8's Rolldown native
> binary (`@rolldown/binding-linux-x64-gnu`) is unavailable and the network is
> disabled. This is an environment limitation, not a code issue; esbuild + lint
> + the smoke tests are used to validate instead.

See `CHANGELOG_v2.md` for the file-by-file change log and modified-files list.

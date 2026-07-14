# Changelog — Club Feed Refactor v2

All changes are driven by the real `club-feed-new` API (via the Express BFF).
No mock data, no hardcoded feed values.

## New files

| File | Purpose |
|---|---|
| `src/lib/feed/feedConfig.js` | Central config: club id, media base, scroll/pagination bounds, storage keys, tab labels. Removes hardcoded literals. |
| `src/lib/feed/feedFilters.js` | Pure filter/sort engine: `applyFeedView`, `parseCreatedAt`, `toLocalIsoDay`, `trendingScore`. |
| `src/lib/feed/userPrefs.js` | Persisted favorites/following stores (localStorage + cross-tab `storage` sync) and `useFavorites`/`useFollowing` hooks via `useSyncExternalStore`. |
| `src/lib/feed/formatTime.js` | `timeAgo` relative-time formatter for card metadata. |
| `src/components/feed/SmartImage.jsx` | Resilient image: lazy, sized, with initials/glyph fallback on missing/failed loads. |
| `src/components/feed/EngagementBar.jsx` | Reusable like/comment/share/save bar with optimistic like + favorites integration. |
| `src/components/feed/ClubFeedRenderer.jsx` | Memoized per-item dispatcher to the correct card component, wrapped in an error boundary. |
| `src/components/feed/cards/NewsCard.jsx` | Dedicated news layout (lazy article modal). |
| `src/components/feed/cards/VideoCard.jsx` | Dedicated video layout (YouTube embed / mp4 / poster). |
| `src/components/feed/cards/FixturesCard.jsx` | Dedicated fixtures layout (crests, scores, status). |
| `src/hooks/useEngagement.js` | Engagement state hook (like/comment/save) bound to the API + favorites store. |
| `scripts/smoke-feedFilters.mjs` | Smoke test for the filter/sort engine. |

## Modified files

| File | Change |
|---|---|
| `src/lib/feed/normalizeFeed.js` | Full rewrite. Adds per-item `timestamp`, `engagement`, `sourceKey`; exposes `rawCount`; `resolveMediaUrl` now handles relative/CDN/missing URLs and encodes spaces; adds `mergeOffsets` for cursor accumulation; `global` returned in camelCase (`clubTitle`, ...). |
| `src/hooks/useClubFeed.js` | Rewrite. Cursor-merged pagination, deterministic end-of-feed (`rawCount`/empty-streak/max-pages), dedupe by `dedupeId`, AbortController for StrictMode safety, `usingFallback`. |
| `src/components/Feed.jsx` | Rewrite. Wired to `activeTab` + `selectedDate`; memoized `applyFeedView`; stable handlers; IntersectionObserver infinite scroll; filter-aware auto-load; skeleton/error/empty/filter-empty states; pull-to-refresh. |
| `src/components/FilterTabs.jsx` | Rewrite. Latest/Favourites/Following/Trending tablist, controlled active state, memoized. |
| `src/components/FilterTabs.css` | Rewrite. Pill tabs, active highlight, reduced-motion support. |
| `src/components/DateSelector.jsx` | Rewrite. Adds an “All” default pill (no filter), controlled `activeIso`, local-day ISO emission, memoized. |
| `src/components/GlanceGroup.jsx` | Rewrite. SmartImage everywhere; per-tile sub-renderers (news/vote/ratings/scorers/story/promo); lazy article modal. |
| `src/components/feed/cards/`... | See new files. |
| `src/components/feed/NewsArticleModal.jsx` | Uses `SmartImage` for hero/source imagery. |
| `src/components/feed/feed-cards.css` | Full rewrite — modern tokenized card system, engagement bar, fixtures/glance layouts, skeletons, empty/error states, image fallbacks, article modal, `content-visibility` windowing, reduced-motion. |
| `src/App.jsx` | Default tab → `Latest`; adds `selectedDate` state; wires `DateSelector.onDateChange`; passes `activeTab` + `selectedDate` to `Feed`. |
| `src/context/AuthContext.jsx` | Auth-persistence fix: `checkAuth` always calls `api.bootstrapSession()` (cookie refresh) before deciding auth; guards wait on `loading`; cancellation guard. |
| `src/lib/api.js` | Adds `bootstrapSession()` (silent cookie refresh) and `clubUnlike()`. |
| `scripts/smoke-normalizeFeed.mjs` | Fixed `clubTitle` assertion; added `rawCount` and per-item `timestamp`/`engagement`/`dedupeId` checks. |

## Notes

- The project is JavaScript (JSX) + Vite, not a TypeScript project; “strict
  typing” is honored via explicit, well-documented shapes and JSDoc on the new
  modules, plus runtime invariants enforced by the smoke tests.
- `vite build` cannot run in this sandbox (Vite 8 Rolldown native binary
  unavailable + network disabled) — validated with esbuild + ESLint + smoke
  tests instead. See `IMPLEMENTATION_REPORT.md` §6.

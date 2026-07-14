# Implementation Plan — Social 442

For each of the 13 audit areas: the work, the files to touch, the order, and the acceptance test.

Effort uses **eng-days** for a single full-stack engineer comfortable with React + Express + MySQL. Add 30% if pairing with QA / design review.

---

## Area 1 — Dynamic Notifications System  ·  ~1.5 eng-days

### Backend
Already in `server/routes/social.js`. Two additions:

1. **Unread count endpoint** — add `GET /api/social/notifications/count` returning `{ unread: <n> }`. Avoids the cost of loading 50 rows just to compute a badge.
2. **Mark-one-as-read** — add `POST /api/social/notifications/:id/read` for per-item dismissal.
3. **Fire missing notification types.** Add `createNotification()` calls in:
   - `routes/social.js` `POST /like`  → type `'like_post'` / `'like_comment'`
   - `routes/social.js` `POST /share` (new — see Area 4) → type `'share_post'`
   - `routes/social.js` `POST /comments` when body contains `@<username>` → type `'mention_comment'`
   - `routes/clubFeed.js` when a followed club posts → type `'club_new_post'` (fan-out to followers)
   - `routes/football.js` or a new scheduled job → type `'fixture_starting'` / `'fixture_goal'` / `'fixture_finished'`

### Frontend
1. **New file `src/lib/socket.js`** — thin wrapper around `socket.io-client`:
   ```js
   import { io } from 'socket.io-client';
   let socket = null;
   export function connectSocket(token) {
     if (socket) return socket;
     socket = io(import.meta.env.VITE_API_BASE_URL || '/', { auth: { token }, withCredentials: true });
     return socket;
   }
   export function getSocket() { return socket; }
   export function disconnectSocket() { socket?.disconnect(); socket = null; }
   ```
   Connect from `AuthContext` once `user` is set; disconnect on logout.

2. **New file `src/hooks/useNotifications.js`** — returns `{ items, unread, loading, error, markAllRead, markOneRead, refetch }`. On mount: fetch list + count. Subscribe to `socket.on('notification', …)` and prepend new items, bump unread.

3. **New file `src/pages/NotificationsPage.jsx` + `.css`** — list view. Group by day. Per-row icon by `type`. Tapping an item: marks read, navigates to the `ref_type`/`ref_id` (post detail, profile, fixture). "Mark all as read" button in header.

4. **Edit `src/components/Header.jsx`** — wire bell button:
   ```jsx
   <button className="icon-btn" onClick={onBellClick} aria-label="notifications">
     <FiBell size={18} />
     {unread > 0 && <span className="badge">{unread > 99 ? '99+' : unread}</span>}
   </button>
   ```
   Add `.icon-btn { position: relative; } .badge { … }` to `Header.css`.

5. **Edit `src/App.jsx`** — add `showNotifications` state + render `<NotificationsPage onBack={…}/>` like `MePage`/`InboxPage`.

### Acceptance test
- Open the app, like a post from a second account → first account sees the bell badge bump from 0 to 1 within 2 seconds (via socket).
- Refresh → badge still shows 1.
- Open Notifications, tap the row → navigates to post; badge resets to 0.
- Refresh again → badge stays at 0.

---

## Area 2 — Global Search System  ·  ~4 eng-days

### Backend  — new file `server/routes/search.js`

```
GET /api/search?q=<term>&type=<all|users|players|teams|posts|fixtures|hashtags>&cursor=&limit=
  → { results: { users:[...], players:[...], teams:[...], posts:[...], fixtures:[...], hashtags:[...] }, nextCursor }
GET /api/search/suggest?q=<prefix>      → { suggestions: [string] }
GET /api/search/trending                → { trending: [{ term, count, change }] }
POST /api/search/log     { term, type } → { ok:true }     // for trending + history
GET  /api/search/history                → { history: [{ term, type, at }] }
DELETE /api/search/history/:id          → { ok:true }
DELETE /api/search/history              → { ok:true }     // clear all
```

### Schema (in `04_SCHEMA_DELTAS.sql`)
- `search_history` table per user.
- `search_terms` aggregate table (`term, count, last_seen`) for trending.
- `posts.hashtags` JSON column or new `post_hashtags (post_id, tag)` join table with index on `tag`.
- FULLTEXT indexes:
  - `users (display_name, username, bio)`
  - `teams (name, short_code, league, country)`
  - `players (full_name, nationality)`
  - `posts (caption)` — with a denorm `searchable_text` column to include caption + extracted tags.

### Frontend
- **`src/lib/api.js`** — add `api.search()`, `api.searchSuggest()`, `api.searchTrending()`, `api.searchHistory()`, `api.clearSearchHistory()`, `api.deleteSearchHistoryItem()`.
- **`src/hooks/useDebouncedValue.js`** — utility hook (300ms default).
- **`src/pages/SearchPage.jsx` + `.css`** — full screen view:
  - Sticky top: search input + back button.
  - Empty query state: Recent searches, Trending searches, Suggestions.
  - Query state: tab bar (All / People / Clubs / Posts / Fixtures / Hashtags) + result list with `IntersectionObserver` infinite scroll.
- **`src/components/Header.jsx`** — wire the search button:
  ```jsx
  <button className="icon-btn" onClick={onSearchClick} aria-label="search">
  ```
- **`src/App.jsx`** — `showSearch` state + render `<SearchPage onBack=…/>`.

### Acceptance test
- Tap search → SearchPage opens, recent + trending render.
- Type "Mes" → after ~300ms one API call fires (debounce verified in network tab), results render.
- Scroll to end → second page loads (infinite scroll).
- Tap a result → logs to history; reopen search → term appears at top of Recent.
- Refresh → Recent still includes the term.

---

## Area 3 — Date Slider Fix  ·  ~0.25 eng-days

### Frontend
Edit `src/components/DateSelector.jsx`:
```diff
- const PAST_DAYS = 7;
- const FUTURE_DAYS = 3;
+ const PAST_DAYS = 4;
+ const FUTURE_DAYS = 4;
```

Product decision needed: keep "All" pill, or default-select today? Currently the slider defaults to `selectedDate = null` (= "All") at `App.jsx` line 36. If today must be centered + selected by default, change the initialiser to today's ISO day. See Risk #1.

### Acceptance test
- Render slider → exactly 9 day pills (or 9 + 1 "All" depending on decision).
- Today is centered horizontally in the viewport.
- Horizontal scroll works on touch + mouse.
- Tap a pill → highlighted; feed filters via the existing `feedFilters` pipeline (no changes needed there).

---

## Area 4 — Share Functionality  ·  ~3 eng-days

### Backend  — new endpoints in `server/routes/social.js`

```
POST /api/social/share   { post_id, channel: 'copy'|'feed'|'story'|'chat'|'native'|'external_<platform>' }
POST /api/social/repost  { post_id, caption? }     // "Share to Feed" (reposts)
DELETE /api/social/repost/:id
```

Also add a `trg_share_ins` trigger on a new `shares` table to bump `posts.share_count` (mirrors the existing like / comment triggers).

### Schema (see `04_SCHEMA_DELTAS.sql`)
- New `shares` table (user_id, post_id, channel, created_at).
- New `reposts` table (user_id, post_id, caption, created_at; UNIQUE on (user_id, post_id)).
- New trigger to maintain `posts.share_count`.

### Frontend  — rewrite `src/components/ShareSheet.jsx`

1. Fix the malformed clipboard URL: ``navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`)``.
2. Implement each channel:
   - **copy** — clipboard + toast.
   - **whatsapp** — `window.open(\`https://wa.me/?text=\${encodeURIComponent(url)}\`, '_blank')`.
   - **telegram** — `https://t.me/share/url?url=...&text=...`.
   - **twitter** — `https://twitter.com/intent/tweet?url=...&text=...`.
   - **facebook** — `https://www.facebook.com/sharer/sharer.php?u=...`.
   - **email** — `mailto:?subject=...&body=...`.
   - **native** — if `navigator.share` exists, call it; else hide button.
   - **feed** — call `api.repost(post.id)`; show "Reposted" toast.
   - **story** — dependent on Area 5 (media). For Phase 1, route to a `CreateStoryFromPost` screen that prefills.
   - **chat** — dependent on chat system (not present today — see Risk #5). Hide or stub for now.
3. On every channel: call `api.share(postId, channel)` to log the share + bump the count. Optimistically increment local `share_count` on the post card.
4. Backend response returns the updated `share_count`; reconcile.

### Acceptance test
- Tap Copy → clipboard contains a clean URL; toast appears; share count goes from N → N+1.
- Refresh → share count still N+1.
- Tap Repost → the post appears in your own profile feed; second tap returns "already reposted".
- Tap Native on iOS Safari / Android Chrome → OS share sheet opens.

---

## Area 5 — Media Upload Pipeline  ·  ~4 eng-days

This underpins Areas 8 (comment attachments) and 10 (profile avatar). Build it first if those are in the same sprint.

### Backend  — new file `server/routes/media.js`

```
POST /api/media/upload        (multipart) — fields: file, kind ('image'|'audio'|'video'|'voice')
                              → { id, url, mime, bytes, width?, height?, duration? }
GET  /api/media/:id           — metadata
DELETE /api/media/:id         — owner-only
```

### Dependencies to add to `package.json`
- `multer` — multipart parsing.
- `sharp` — image resize + WEBP encoding + thumbnail.
- `fluent-ffmpeg` (+ system ffmpeg) — video probe + transcode + thumbnail.
- `file-type` — magic-byte MIME sniffing (do not trust client MIME).

### Storage
Local disk under `uploads/` for dev; abstract behind a `storage` interface so S3 / Cloudflare R2 can be swapped in for prod. Validate:
- MIME whitelist: `image/jpeg, image/png, image/webp, audio/mpeg, audio/wav, video/mp4`.
- Max size: 10 MB image, 25 MB audio, 100 MB video.
- Re-encode images to WEBP @ 1080w max; generate 320w thumbnail.
- Probe video duration + dimensions; reject > 60s for reels, > 5min for video.

### Schema (`04_SCHEMA_DELTAS.sql`)
New `media_files` table: `id, owner_id, kind, mime, url, thumbnail_url, bytes, width, height, duration_ms, created_at`.

### Frontend
- **`src/lib/api.js`** — add `api.uploadMedia(file, kind, onProgress)`. Use `XMLHttpRequest` (not fetch) to support upload-progress events.
- **`src/components/MediaPicker.jsx`** (new) — unified `<input type="file" accept=… multiple>` + drag-drop. Returns array of `File`.
- **`src/components/VoiceRecorder.jsx`** (new) — `MediaRecorder` API; visualises waveform during recording; outputs `audio/webm` (or `audio/wav` polyfill).
- **`src/components/MediaPreview.jsx`** (new) — thumbnail + progress bar + cancel/remove.
- Integrate into `MicOptionsSheet.jsx`, `CommentsSheet.jsx` (Area 8), Edit Profile (Area 10), and a future Create Post flow.

### Acceptance test
- Pick a 5MB JPEG → upload bar progresses; on completion a CDN-style URL is returned and the WEBP variant is half the size.
- Try uploading a 50MB file → server rejects with 413, UI shows error toast.
- Try a `.exe` renamed as `.jpg` → server rejects via magic-byte sniff.
- Record a 10-second voice note → plays back inline, then uploads on send.

---

## Area 6 — Header Profile Navigation  ·  ~0.25 eng-days

### Frontend
Edit `src/components/Header.jsx`:
```diff
  <button className="icon-btn" onClick={onUserMenuClick} aria-label="user-menu">
    <GoPerson size={18} />
  </button>
  <button className="header-avatar" onClick={onProfileClick} aria-label="profile">
    <img src={user?.avatar_url || defaultAvatar} alt="me" />
  </button>
```

Edit `src/App.jsx`:
- Rename `showMe → showUserMenu` (settings/user menu) and add `showProfile`.
- `onAvatarClick` (the photo) → `setShowProfile(true)` → renders `<ProfilePage userId={user.id}/>` (the user's own profile).
- `onUserMenuClick` (the GoPerson icon) → `setShowUserMenu(true)` → renders `<MePage/>` reworked as a settings list:
  - Edit Profile
  - Privacy Settings
  - Saved Posts
  - Preferences
  - Logout

The current `MePage.jsx` likely already has a settings-style layout; verify and adjust.

### Acceptance test
- Tap user-menu icon → list of 5 menu items.
- Tap profile photo → own profile page (posts, followers, following).
- Two icons land in two different views.

---

## Area 7 — Dynamic Like / Comment / Share (rewire)  ·  ~1 eng-day

### Backend
Server-side enrichment of feed payloads. Edit `server/routes/feed.js` (and `clubFeed.js`) so each post row includes:
- `liked: bool` — `EXISTS (SELECT 1 FROM likes WHERE user_id=? AND target_type='post' AND target_id=p.id)`
- `saved: bool` — `EXISTS (SELECT 1 FROM saved_posts …)`  (saved_posts table is added in Area 9)
- `reposted: bool` — if reposts table exists (Area 4)

This is the canonical pattern used by Twitter/Threads/Instagram — the feed item carries the viewer's interaction state. Costs one JOIN per row at query time.

### Frontend  — fix `src/hooks/useEngagement.js`

```diff
- const [liked, setLiked] = useState(false);
+ const [liked, setLiked] = useState(initialLiked);
```
Add `initialLiked, initialSaved` to the hook params; pass from the feed item.

```diff
- if (next) await api.clubLike?.(id);
- else      await api.clubUnlike?.(id);
+ if (next) await api.like('post', id);
+ else      await api.unlike('post', id);
```

Replace `addComment` so it posts to the API:
```js
const addComment = useCallback(async (body, parent_id) => {
  const { comment } = await api.postComment(id, body, parent_id);
  setComments((n) => n + 1);
  return comment;
}, [id]);
```

Add `share(channel)` that calls `api.share(id, channel)` and bumps `shares` count.

### Acceptance test
- Like a post → refresh → still liked, count preserved.
- Comment on a post → refresh → comment present.
- Like on device A → within 2s device B sees `like_updated` socket event and re-renders the count (already emitted server-side; needs frontend listener).

---

## Area 8 — Enhanced Comment System  ·  ~4 eng-days

### Schema (`04_SCHEMA_DELTAS.sql`)
- `comments.attachments JSON` — array of `{ kind, media_id, url, thumbnail_url, mime }`.
- `comments.mentions JSON` — array of user IDs the comment @-mentions.
- `comments.hashtags JSON` — extracted tags.
- New `comment_reactions (user_id, comment_id, emoji)` table with UNIQUE(user_id, comment_id) (one reaction per user per comment) and an `emoji` column for the chosen reaction.

### Backend updates  — `server/routes/social.js`
- `POST /comments` — accept optional `attachments` (array of `media_id` from Area 5), extract `@mentions` + `#hashtags` with regex, persist to JSON cols, fire mention notifications.
- `POST /comments/:id/react   { emoji }` — toggle a reaction.
- `DELETE /comments/:id/react` — remove own reaction.
- `GET /comments/:postId` should join + group reactions: `{ reactions: { '👍': 3, '❤️': 1, mine: '👍' } }`.

### Frontend  — rewrite `src/components/CommentsSheet.jsx`
- Compose bar:
  - Text input with mention-autocomplete (`@m...` opens `searchUsers` dropdown).
  - Hashtag autocomplete (`#`).
  - Emoji picker (recommend `emoji-picker-react` — lightweight, accessible).
  - GIF picker (recommend Tenor API — lighter than Giphy SDK; backend proxies the API key).
  - Image attachment via `MediaPicker` (Area 5).
  - Voice note via `VoiceRecorder` (Area 5).
- Replies: nested threading already partly supported (`parent_id`). Render up to 2 levels deep; "View N more replies" expands.
- Reactions: long-press / tap shows reaction bar (6 default emoji). Display reaction summary chip on each comment.

### Acceptance test
- Comment "@bob check this #goal" + attach a GIF — saves; reload → attachment + mention chip + hashtag link all render. `bob` gets a notification.
- Long-press a comment → react with 🔥 — chip appears; second tap removes.

---

## Area 9 — Saved Posts  ·  ~1 eng-day

### Schema (`04_SCHEMA_DELTAS.sql`)
New table `saved_posts (user_id, post_id, created_at; UNIQUE(user_id, post_id))`.

### Backend  — add to `server/routes/social.js`
```
POST   /api/social/save     { post_id }
DELETE /api/social/save     { post_id }
GET    /api/social/saved    ?cursor&limit  → paginated saved posts (full post payload)
```

### Frontend
- Replace `useFavorites()` localStorage store with API-backed `useSavedPosts()` hook (keep optimistic local cache for instant UI).
- Inspect `src/pages/MePage.jsx` and the Saved tab — the empty-screen bug is most likely that the Saved branch renders `<Feed posts={savedPosts}/>` with `savedPosts = []` and **no empty-state component**, so nothing visible above the `app-bg` div. Fix:
  - Call `api.getSaved()` when the Saved tab activates.
  - Show `<SkeletonLoader />` while loading.
  - Show `<EmptyState icon="bookmark" title="No saved posts yet" hint=… />` when result is empty.
  - Show `<ErrorState onRetry=… />` on fetch error.

### Acceptance test
- Save a post from the feed → navigate to Profile → Saved → post appears.
- Refresh → still there.
- Log out, log in on another browser → still there.
- Open Saved on a fresh account → empty state renders.

---

## Area 10 — Edit Profile  ·  ~2 eng-days (assumes Area 5 done)

### Schema (`04_SCHEMA_DELTAS.sql`)
Add columns to `users`:
- `location VARCHAR(120) DEFAULT NULL`
- `date_of_birth DATE DEFAULT NULL`
- `favourite_team_id BIGINT UNSIGNED DEFAULT NULL` (FK → teams.id) — see Risk #4 about whether this differs from `favourite_club_id`.

### Backend  — update `server/routes/profiles.js`
Extend the `allowed` list at line 30:
```diff
- const allowed = ['display_name', 'bio', 'avatar_url', 'favourite_club_id'];
+ const allowed = ['display_name', 'username', 'bio', 'avatar_url',
+                  'favourite_club_id', 'favourite_team_id',
+                  'location', 'date_of_birth'];
```

Username changes: enforce uniqueness, format (regex), and rate-limit (1 change per 30 days). Return 409 on conflict.

DOB: validate as ISO `YYYY-MM-DD`, must be ≥ 13 years ago.

### Frontend  — `src/pages/EditProfilePage.jsx` (new)
- Fields: avatar (image picker + cropper), display name, username (with availability check), bio, location, date of birth (date input), favourite club picker, favourite team picker.
- Image cropper: recommend `react-easy-crop` (small, well-maintained). On confirm, upload via Area 5's `api.uploadMedia()`, then PATCH `/me` with the returned URL.
- Form: submit only changed fields; show per-field validation errors; toast on success.

### Acceptance test
- Change avatar → upload + crop → save → refresh → new avatar persists in header + profile.
- Change DOB → save → refresh → DOB persists.
- Try to take a taken username → inline error, no save.
- Log out, log back in → all fields still updated.

---

## Area 11 — Reels vs Video rendering  ·  ~2 eng-days

### Backend
Add `media_format ENUM('reel','video','image','audio','none') DEFAULT 'none'` to the post payload (or compute it client-side from `data.media` shape — see Risk #3). Reels = vertical aspect (height > width) **and** duration ≤ 90s.

For YouTube-embedded posts, treat as `'video'` regardless of orientation.

### Frontend
- **`src/components/feed/cards/VideoCard.jsx`** — add `IntersectionObserver` autoplay/autopause (threshold 0.6, only one video playing at a time — use a singleton `currentlyPlayingId` ref or context).
- **`src/components/feed/cards/ReelCard.jsx`** (new) — 9:16 aspect, full-bleed inside the phone-screen container, scroll-snap-y for swipe nav. Tap to mute/unmute (default muted to satisfy browser autoplay policies). Side action rail (like/comment/share/save) like TikTok/Reels.
- **`src/lib/feed/normalizeFeed.js`** — dispatch on `media_format`; existing `VideoCard` handles `'video'`, new `ReelCard` handles `'reel'`.
- **`src/components/Feed.jsx`** — when a reel is the active card, expand it into a vertical reel-player overlay. Alternative: keep reels inline at 9:16 height inside the feed for the home view, and only switch to full-screen reels when the user taps one.

### Acceptance test
- Feed has 1 reel + 1 YouTube video.
- Reel renders vertical, autoplays muted when scrolled into view, pauses when out of view.
- Video renders 16:9 landscape, autoplays when visible, pauses when not.
- Tapping the reel opens a full-screen swipe-through experience.

---

## Area 12 — Real Assets & Branding  ·  ~1.5 eng-days

1. **Replace placeholder avatars** — strip every `i.pravatar.cc` reference:
   - `src/components/Header.jsx` line 56 → `user.avatar_url || /assets/default-avatar.svg`
   - `server/routes/profiles.js` line ~134 → return `null` (or the default URL) instead of `i.pravatar.cc`
   - Any other usages found by `grep -rn "i.pravatar" src server`.
2. **Fix `/public/` path references** in `BottomNav.jsx` — Vite serves `public/` at root, so `/public/foo.png` 404s in production. Use `/foo.png` or import the file so Vite hashes it.
3. **Ship branded asset bundle** under `src/assets/`:
   - `default-avatar.svg`, `default-club-crest.svg`, `default-team-crest.svg`
   - Per-league logos if available from the user's "provided data" (the brief mentions provided data — not in the zip; see Risk #6).
4. **Icon library:** consolidate on `react-icons` (already in deps). Audit any inline SVGs or PNG icons in `Stories.jsx`, `MicOptionsSheet.jsx` etc. Replace with `react-icons/fa` equivalents for visual consistency.
5. **Add a `<SmartImage>`-style fallback** — `src/components/feed/SmartImage.jsx` already exists; extend it to swap in the default crest/avatar on `onError`.

### Acceptance test
- `grep -r "pravatar" .` returns zero matches.
- `grep -r "/public/" src/` returns zero matches.
- Production build (`npm run build && npm run preview`) loads all images without 404s.

---

## Area 13 — Feed Scrollbar & Back-to-Top  ·  ~0.5 eng-days

### Frontend
- **Custom scrollbar** — edit `Feed.css`:
  ```css
  .feed { scrollbar-width: thin; scrollbar-color: var(--accent) transparent; }
  .feed::-webkit-scrollbar { width: 6px; }
  .feed::-webkit-scrollbar-thumb { background: var(--accent); border-radius: 3px; }
  ```
  Ensure the scroll container is `.feed` (not `body`) and has `overflow-y: auto; max-height: 100%`.
- **`src/components/BackToTop.jsx`** (new): floating button bottom-right inside `.phone-screen`. Show after 600px scroll. Hide near the top. `scrollIntoView({ behavior: 'smooth' })` or `scrollTo({ top: 0, behavior: 'smooth' })`.
- Wire into `Feed.jsx`.

### Acceptance test
- Scroll down 1000px → button fades in.
- Tap button → smooth scroll to top.
- Button doesn't overlap the bottom nav.

---

## Cross-cutting: realtime + auth + error handling

### Socket.io client
Until this is added, Areas 1 and 7's "sync across devices" criteria cannot be met. Build `src/lib/socket.js` + `useSocketEvent` hook before the second sprint.

### `<ErrorBoundary>` and `<EmptyState>` primitives
Most areas reference "empty state" and "error handling". Create two reusable components in `src/components/states/` so every feature uses the same look.

### Rate-limiting
Add `express-rate-limit` middleware in front of `/auth/*`, `/social/like`, `/social/share`, `/social/comments`, `/social/follow`, `/social/report`, `/search/*`, `/media/upload`. Suggested defaults: 60 req/min/user for most, 10 req/min for `report` and `media/upload`.

### Production hardening (post-Sprint 4)
- Set `cookie.sameSite: 'strict'` on refresh token; add CSRF token for state-changing requests.
- Replace local upload disk with S3/R2 + signed URLs.
- Add structured logging (pino / winston) + request-id middleware.
- Add a per-route 5xx alert (Sentry or similar).

# Audit Report — Social 442

Findings tied to specific files in the codebase as it stands today. Line numbers refer to the project as shipped in `social442_final_v1.zip`.

---

## Quick-glance status matrix

| # | Area | Backend | Frontend | DB schema | Verdict |
|---|------|---------|----------|-----------|---------|
| 1 | Notifications | ✅ Routes + table exist | ❌ Bell button is dead, no view | ✅ `notifications` table | **Wire-up only** |
| 2 | Global Search | ❌ No route | ❌ Search icon dead, no view | ❌ No FULLTEXT indexes | **Build from scratch** |
| 3 | Date Slider | n/a | ⚠ Shows 11 not 9 dates | n/a | **One-line fix** |
| 4 | Share | ❌ No route, no table | ⚠ Only Copy half-works | ❌ No `shares` table | **Build backend + finish UI** |
| 5 | Media upload | ❌ No multer, no route | ❌ Buttons inert | ❌ No `media_files` table | **Build pipeline** |
| 6 | Header profile nav | n/a | ❌ Both icons → same handler | n/a | **5-min fix** |
| 7 | Likes/Comments/Shares dynamic | ✅ Likes/comments live | ❌ Calls nonexistent `api.clubLike` | ✅ Tables OK | **Frontend rewire** |
| 8 | Enhanced comments | ⚠ Text only | ⚠ Text only | ⚠ No attachment cols | **Schema + UI expansion** |
| 9 | Saved Posts | ❌ No DB-backed | ⚠ Client-only localStorage | ❌ No `saved_posts` table | **Build persistence + fix UI** |
| 10 | Edit Profile | ⚠ Limited fields | ⚠ DOB/location missing | ❌ Missing columns | **Schema + route + UI** |
| 11 | Reels vs Video | ⚠ No `media_type` field | ❌ All videos same renderer | ⚠ Need column | **Card split** |
| 12 | Real assets | n/a | ❌ `i.pravatar.cc`, wrong paths | n/a | **Asset sweep** |
| 13 | Feed scrollbar / top | n/a | ❌ Missing | n/a | **Component addition** |

Legend: ✅ exists/works · ⚠ partial · ❌ missing

---

## 1. Dynamic Notifications System

**Backend status:** Already implemented. `server/routes/social.js`:

- `GET  /api/social/notifications` — returns 50 most recent for the authed user, joined with actor user data.
- `POST /api/social/notifications/read-all` — marks all as read.
- `createNotification()` helper is already called from `/comments` and `/follow` handlers.
- Socket.io emits `req.io.to('user:<id>').emit('notification', …)` on new comments and follows.

**Schema status:** `migrations/001_create_schema.sql` defines `notifications` table with `recipient_id, actor_id, type, ref_type, ref_id, body, is_read, created_at` and the right composite index.

**Frontend status — broken / missing:**

- `src/components/Header.jsx` line 41:
  ```jsx
  <button className="icon-btn" aria-label="notifications">
    <FiBell size={18} />
  </button>
  ```
  No `onClick`. No badge. No unread-count fetch.
- `src/lib/api.js` lines 154–157 already exports `api.getNotifications()` and `api.markNotificationsRead()` — **never called from anywhere in `src/`**.
- There is **no `NotificationsPage` / `NotificationsView` component** in `src/pages/` or `src/components/`.
- Socket.io client is **not connected**. There is no `connectSocket()` helper, no `io-client` listener for the `notification` event.
- No notification triggers for `like_post`, `share_post`, `mention`, `club_*`, or `fixture_*` events — `createNotification` is only invoked on comment and follow.

**Missing notification types** (none of these fire `createNotification` anywhere in the server):
- `like_post`, `like_comment`
- `share_post`
- `mention_post`, `mention_comment`
- `club_new_post`, `club_announcement`
- `fixture_starting`, `fixture_goal`, `fixture_finished`

---

## 2. Global Search System

**Backend status:** **Entirely missing.** `server/routes/` contains: `auth.js`, `clubFeed.js`, `clubSocial.js`, `feed.js`, `football.js`, `profiles.js`, `social.js`, `stories.js`. There is no `search.js`.

**Schema status:** No FULLTEXT indexes. The only thing that resembles a searchable index is `idx_users_username (username)` and `idx_users_email (email)`.

**Frontend status:** `src/components/Header.jsx` line 31:
```jsx
<button className="icon-btn" aria-label="search">
  <FiSearch size={18} />
</button>
```
No handler. No search view. No `api.search*` helper. No recent/trending storage.

**Scope of work:** This is a **build from scratch** for backend + frontend. Smallest viable cut: `GET /api/search?q=…&type=…&cursor=…` querying users, teams, players, posts with `LIKE '%q%'` ranked by simple heuristics (FULLTEXT later as an optimization). Recent searches in localStorage; trending in a new `search_terms` aggregate table.

---

## 3. Date Slider

**File:** `src/components/DateSelector.jsx` lines 3–5:
```js
const PAST_DAYS = 7;
const FUTURE_DAYS = 3;
```
That gives **11 date pills + 1 "All" pill = 12 buttons**, not the required 9.

Spec requires: previous 4 + today + next 4 = exactly 9 pills, today centered.

**Fix:** change to `PAST_DAYS = 4`, `FUTURE_DAYS = 4`, and decide whether to keep or drop the "All" pill (currently default-selected at line 56). The existing centering effect at lines 60–67 already targets the active day — it will still center correctly once the constants change.

---

## 4. Share Functionality

**File:** `src/components/ShareSheet.jsx`.

Bugs:

1. Line 22 — clipboard string is malformed:
   ```js
   navigator.clipboard.writeText(`{{https://social442.app/post/${post?.id}} || '1'}`)
   ```
   The `` `` and `|| '1'` are literally inside the template string. Result: `"{{https://social442.app/post/123} || '1'}"`. Same bug repeats at line 73.
2. `handleShare(opt)` only handles `opt.id === 'copy'`. The 5 other buttons (WhatsApp, Telegram, Twitter, Facebook, Email) execute the function but do nothing — there is no `default` branch, no `window.open()` of an intent URL, no native Web Share API call.
3. **No API call** to record the share. There is no `api.share()` helper. There is no `POST /api/social/share` endpoint and no `shares` table in the schema. `posts.share_count` exists as a column but has no trigger and no writer.

**Missing spec items from the brief:**
- Share to Feed (repost) — needs a new `reposts` table and feed-rendering logic.
- Share to Story — needs the stories pipeline (see Area 5).
- Share to Chat — there is no chat/DM system in the current schema at all.
- Native Device Share — `navigator.share()` not used anywhere.

---

## 5. Media Messaging & Upload

**Backend:** No upload handling exists. `package.json` does **not** include `multer`, `@aws-sdk/*`, or any storage SDK. No `/uploads/*` route. `server/index.js` does not `app.use('/uploads', express.static(...))`. No `media_files` table.

**Frontend:** `src/components/MicOptionsSheet.jsx` exists (component for the bottom-nav mic FAB) but the brief implies its buttons are inert. No `<input type="file">`, no `MediaRecorder` usage, no camera/gallery components in `src/`.

**Implications:** Without a storage backend, Edit Profile cannot save a new avatar (Area 10) and Enhanced Comments cannot accept image/voice/GIF attachments (Area 8). **This is a blocker for 4 other areas.**

---

## 6. Header Profile Navigation

**File:** `src/components/Header.jsx` lines 44–60. Both buttons call the same prop:
```jsx
<button className="icon-btn" onClick={onAvatarClick} aria-label="me-page">  {/* GoPerson */}
  <GoPerson size={18} />
</button>
<button className="header-avatar" onClick={onAvatarClick} aria-label="profile">
  <img src="https://i.pravatar.cc/40?img=12" />
</button>
```
In `src/App.jsx` line 124, `onAvatarClick={() => setShowMe(true)}` — so both reach `MePage`.

**Spec:** profile photo → My Profile (the user's own profile page); secondary icon → Settings/User Menu (Edit Profile, Privacy, Saved, Preferences, Logout).

Note: `MePage.jsx` and `ProfilePage.jsx` are separate components today. `MePage` appears to be the settings-like home; `ProfilePage` displays a user/player profile. Routing needs to split.

---

## 7. Dynamic Like / Comment / Share

**File:** `src/hooks/useEngagement.js` lines 31–34:
```js
if (next) await api.clubLike?.(id);
else      await api.clubUnlike?.(id);
```

`api.clubLike` and `api.clubUnlike` **do not exist** in `src/lib/api.js`. The defined helpers are `api.like(target_type, target_id)` and `api.unlike(target_type, target_id)`. Because of the `?.` optional chaining, the calls silently resolve to `undefined`, leaving only the optimistic local update — which **disappears on refresh**.

Line 51 of the same file:
```js
const addComment = useCallback(() => { setComments((n) => n + 1); }, []);
```
No API call. Just bumps the count locally.

`liked` initial state is hardcoded `false` (line 23). It is **never seeded** from the server. So a previously-liked post shows un-liked after refresh.

**Shares:** as above (Area 4), no backend, no count writer, no helper.

---

## 8. Enhanced Comment System

`src/components/CommentsSheet.jsx` is 351 lines (substantial). Backend `POST /api/social/comments` accepts `{ post_id, body, parent_id }` — replies are supported. But:

- The schema has **no `attachments` or `media_url` columns** on `comments`.
- No emoji picker library is in `package.json`.
- No GIF library (e.g., `@giphy/react-components`) in `package.json`.
- No `MediaRecorder` voice-note recording.
- No mention/hashtag extraction or autocomplete.
- No `comment_reactions` table.

---

## 9. Saved Posts Tab Bug

Saved posts today use `src/lib/feed/userPrefs.js → useFavorites()` which stores favorited ids in localStorage. They are **client-only**. They do not survive across devices or re-install, and the schema has no `saved_posts` table.

The "content disappears, only background remains" symptom in the brief is a Profile Saved tab rendering bug — needs source inspection of `MePage.jsx` / `ProfilePage.jsx` Saved tab branch. Likely the tab filters by saved ids but the feed prop isn't being re-fetched/re-derived when the tab activates, leaving an empty result with no loading or empty state component.

---

## 10. Edit Profile Improvements

**Backend gap — `server/routes/profiles.js` PATCH /me** lines 30–34:
```js
const allowed = ['display_name', 'bio', 'avatar_url', 'favourite_club_id'];
```
Only four fields. Missing per brief: `username`, `location`, `date_of_birth`.

**Schema gap — `users` table** in migration 001 has **no `location` column and no `date_of_birth` column.** (Only `players.date_of_birth` exists.) `username` exists but is `UNIQUE` and not in the allow-list.

**Avatar upload:** No upload pipeline (see Area 5). Today `avatar_url` is a free-form string column — the client cannot push an image.

**Favorite Team vs Favorite Club:** schema only has `favourite_club_id`. The brief lists both — assume they mean the same field unless product confirms otherwise (see Risk #4).

---

## 11. Feed Media Rendering

`src/components/feed/cards/VideoCard.jsx` is the single renderer for all video-typed feed items. Need:
- A `media_format` (or `orientation`) field on the feed item: `'reel' | 'video'`.
- A new `ReelCard.jsx` with vertical/full-screen experience, swipe nav (`IntersectionObserver` + scroll-snap), autoplay + auto-pause.
- The standard `VideoCard.jsx` already exists for landscape — needs autoplay/autopause via `IntersectionObserver`.

The feed normalisation pipeline lives in `src/lib/feed/normalizeFeed.js` and `feedTypes.js` — that is where the type discrimination needs to land.

---

## 12. Real Assets & Branding

Confirmed placeholders:

- `src/components/Header.jsx` line 56: `<img src="https://i.pravatar.cc/40?img=12" />` — hardcoded random avatar.
- `server/routes/profiles.js` line ~134 (players list): falls back to `https://i.pravatar.cc/100?u=…` when `pl.photo_url` is null.
- `src/components/BottomNav.jsx` uses `/public/new-footer-bg.png` and `/public/left-radar-blue-croped.png` etc. — **Vite serves the `public/` folder at `/`, not at `/public/`**. These paths are wrong and rely on the dev-server fallthrough. They will 404 in a production build.
- No team crest images shipped in `public/` — the schema has `teams.crest_url` but seed data / asset bundle for the requested leagues is not in the repo.

Icon library: `react-icons` is already installed and used throughout. Font Awesome is available via `react-icons/fa`. No need to add a second library — consolidate on `react-icons` (recommended) unless product wants the canonical Font Awesome SVG package.

---

## 13. Feed Scrolling & Back-to-Top

- No `ScrollToTopButton` / `BackToTop` component in `src/components/`.
- `src/components/Feed.css` (not inspected line-by-line) — need to verify it does not already define a custom scrollbar. The brief implies it doesn't.
- The phone-frame layout in `App.css` may clip a scrollbar — need to verify `overflow-y: auto` is on the right scroll container and not on `body`.

---

## Cross-cutting observations

1. **Socket.io client is not connected.** Server emits events but no React code subscribes. Realtime acceptance criteria (Areas 1, 7) cannot be met without a `useSocket()` hook + `connectSocket()` helper.
2. **`api.bootstrapSession()` is correct** (AuthContext.jsx) — refresh-token cookie flow works. Persistence after refresh is achievable.
3. **`useEngagement.js` uses local state only.** Liked/saved state needs to come from the post payload from the server (the `getFeed` response should include `liked: bool, saved: bool` for the authed user — server today does NOT enrich these fields; needs to be added in `server/routes/feed.js`).
4. **No rate limiting** on any endpoint — risky once likes/comments/shares/notifications/search are all hot. Add `express-rate-limit` before launch.
5. **No CSRF protection** despite using cookie-based refresh tokens. Mitigated partly by SameSite cookies but should be confirmed in cookie config (not visible in current code).

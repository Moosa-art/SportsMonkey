# API Contracts — New & Changed Endpoints

All new and changed HTTP endpoints and Socket.io events to implement the 13 audit areas. Existing endpoints not listed here are unchanged.

Auth: all endpoints require a valid access token via `Authorization: Bearer <jwt>` unless marked **(public)** or **(optional auth)**.

All responses are `application/json`. All IDs are strings on the wire (server stringifies BIGINTs).

---

## 1. Notifications

### Existing (no change)
- `GET  /api/social/notifications`              → last 50.
- `POST /api/social/notifications/read-all`     → `{ ok: true }`.

### New
- `GET  /api/social/notifications/count`        → `{ unread: number }`.
- `POST /api/social/notifications/:id/read`     → `{ ok: true }`.
- `GET  /api/social/notifications?cursor=&limit=&filter=unread|all` — paginated. Default `limit=20, filter=all`. Response: `{ items: Notification[], nextCursor: string|null, unread: number }`.

### Notification shape
```ts
type Notification = {
  id: string;
  type:
    | 'like_post' | 'like_comment'
    | 'new_comment' | 'reply_comment'
    | 'share_post' | 'repost'
    | 'new_follower'
    | 'mention_post' | 'mention_comment'
    | 'club_new_post' | 'club_announcement'
    | 'fixture_starting' | 'fixture_goal' | 'fixture_finished';
  actor: { id: string; username: string; display_name: string; avatar_url: string|null } | null;
  ref_type: 'post' | 'comment' | 'user' | 'club' | 'fixture' | null;
  ref_id: string | null;
  body: string;
  is_read: boolean;
  created_at: string; // ISO8601
};
```

### Socket.io
- Server emits `notification` to room `user:<recipientId>` whenever a row is inserted.
- Server emits `notification:read` to room `user:<recipientId>` after read-all or per-item read so other tabs sync the badge.

---

## 2. Search

### New — `server/routes/search.js`

```
GET /api/search
  Query: q (string, required, 1–100 chars)
         type ('all'|'users'|'players'|'teams'|'clubs'|'leagues'|'fixtures'|'posts'|'reels'|'videos'|'hashtags') default 'all'
         cursor (opaque string)
         limit (1–50, default 20)
  Response: {
    results: {
      users:    SearchUser[],
      players:  SearchPlayer[],
      teams:    SearchTeam[],
      leagues:  { name: string, country: string }[],
      fixtures: SearchFixture[],
      posts:    SearchPost[],
      hashtags: { tag: string, post_count: number }[],
    },
    nextCursor: string|null,
    total: { [type]: number }
  }
```
Auth: **optional**. Without auth, returns public results only.

```
GET /api/search/suggest?q=<prefix>     → { suggestions: string[] }   (≤ 8)
GET /api/search/trending               → { trending: TrendItem[] }   (top 10 last 24h)
```

```
GET    /api/search/history             → { history: HistoryItem[] }   (auth required, last 30)
POST   /api/search/history { term, type? } → { ok: true }
DELETE /api/search/history/:id         → { ok: true }
DELETE /api/search/history             → { ok: true }   // clear all
```

### Indexing performance
- Use MySQL FULLTEXT on `users(display_name, username, bio)`, `teams(name, short_code, league, country)`, `players(full_name, nationality)`, `posts(caption)` (denormalised `searchable_text`).
- Use `MATCH(...) AGAINST(? IN NATURAL LANGUAGE MODE)` for the primary ranking; fall back to `LIKE` for prefixes (autocomplete) which FULLTEXT does not handle well.

---

## 3. Date Slider

No API changes.

---

## 4. Shares

### New endpoints in `server/routes/social.js`

```
POST   /api/social/share   { post_id, channel }
  channel: 'copy' | 'native' | 'whatsapp' | 'telegram' | 'twitter' | 'facebook' | 'email' | 'feed' | 'story' | 'chat'
  → { ok: true, share_count: number }
  Side effects: bump posts.share_count via trigger, emit 'share_updated' to room post:<id>.

POST   /api/social/repost  { post_id, caption? }
  → { ok: true, repost: Repost, share_count: number }
  409 if already reposted by this user.

DELETE /api/social/repost/:id
  → { ok: true, share_count: number }
```

### Socket.io
- `share_updated` emitted to `post:<id>` with `{ post_id, share_count }`.

---

## 5. Media Upload

### New — `server/routes/media.js`

```
POST /api/media/upload     (multipart/form-data)
  Fields:
    file (binary)              — required
    kind ('image'|'audio'|'video'|'voice')  — required
    use  ('avatar'|'comment'|'post'|'story'|'message') — optional, used for size policy
  Response:
    { id, url, thumbnail_url?, mime, bytes, width?, height?, duration_ms? }
  Errors:
    400 invalid kind / missing file / mime not whitelisted
    413 too large
    415 mime sniff mismatch

GET    /api/media/:id       → metadata (auth required for non-public)
DELETE /api/media/:id       → owner-only
```

MIME whitelist (case-insensitive):
- image: `image/jpeg`, `image/png`, `image/webp`
- audio: `audio/mpeg` (MP3), `audio/wav`, `audio/webm`, `audio/ogg`
- video: `video/mp4`, `video/webm`

Size limits (server-enforced):
- avatar / comment / message image: 10 MB
- post / story image: 15 MB
- audio / voice: 25 MB; voice notes capped at 5 minutes duration.
- video: 100 MB; capped at 5 minutes for posts, 90 seconds for reels.

---

## 6. Header Profile Navigation

No API changes — frontend routing only.

---

## 7. Dynamic Like / Comment / Share

### Existing (correct — just needs frontend rewire)
- `POST   /api/social/like`     `{ target_type, target_id }` → `{ ok, like_count }`
- `DELETE /api/social/like`     `{ target_type, target_id }` → `{ ok, like_count }`
- `POST   /api/social/comments` `{ post_id, body, parent_id? }` → `{ comment }`
- `GET    /api/social/comments/:postId?cursor=&limit=` → `{ comments, nextCursor }`

### Change
Feed endpoints must enrich each post row with the authed user's interaction state:

- `GET /api/feed`               — add `liked, saved, reposted` booleans per post.
- `GET /api/club-feed/…`        — same enrichment.
- `GET /api/profiles/user/:username/posts` — same.

### Socket.io
- `like_updated`     emitted to `post:<id>` with `{ post_id, like_count }`.
- `new_comment`      emitted to `post:<id>` with full comment payload.
- `comment_deleted`  emitted to `post:<id>` with `{ comment_id }`.
- `share_updated`    emitted to `post:<id>` (see Area 4).

Frontend: in PostCard `useEffect`, `socket.emit('subscribe_post', postId)` on mount and `unsubscribe_post` on unmount. Server joins the room.

---

## 8. Enhanced Comments

### Existing endpoint extended
- `POST /api/social/comments` body adds optional fields:
  ```ts
  {
    post_id: string,
    body: string,                 // up to 1000 chars
    parent_id?: string,
    attachments?: { kind: 'image'|'gif'|'voice'|'video', media_id: string }[],   // up to 4
  }
  ```
  Server resolves each `media_id` to its URL/thumbnail at insert time and stores resolved JSON in `comments.attachments`.
  Server extracts `@mentions` and `#hashtags` from `body` and stores them in `comments.mentions` / `comments.hashtags` JSON columns. Mentions trigger `mention_comment` notifications.

### New — reactions
```
POST   /api/social/comments/:id/react   { emoji }   → { ok, reactions: { [emoji]: count }, mine: emoji|null }
DELETE /api/social/comments/:id/react               → { ok, reactions, mine: null }
```

Emoji whitelist (start with): `👍 ❤️ 😂 😮 😢 🔥 ⚽ 🎉`.

### GET comments response addition
```ts
type CommentResponse = {
  id, post_id, parent_id, body, like_count, liked, created_at, updated_at,
  author: { id, username, display_name, avatar_url, is_verified },
  attachments: Attachment[],
  mentions: { id, username }[],
  hashtags: string[],
  reactions: { [emoji: string]: number },
  my_reaction: string | null,
  reply_count: number,
};
```

---

## 9. Saved Posts

### New endpoints in `server/routes/social.js`
```
POST   /api/social/save     { post_id }   → { ok: true }
DELETE /api/social/save     { post_id }   → { ok: true }
GET    /api/social/saved?cursor=&limit=  → { posts: Post[], nextCursor }
```

Feed enrichment now includes `saved: boolean` (see Area 7).

---

## 10. Edit Profile

### Changed — `PATCH /api/profiles/me`
Expanded allow-list:
```ts
{
  display_name?: string,         // 1–80 chars
  username?: string,             // 3–30 chars, [a-z0-9_], unique, rate-limited 1/30d
  bio?: string,                  // 0–240 chars
  avatar_url?: string,           // must be a URL returned by /api/media/upload
  favourite_club_id?: string|null,
  favourite_team_id?: string|null,  // requires schema delta
  location?: string|null,            // 0–120 chars
  date_of_birth?: string|null,       // ISO YYYY-MM-DD, must be ≥13 years old
}
```

Response: `{ profile: Profile }` (full updated profile, matching `GET /me` shape).

Validation errors return `400 { error, field }`. Username conflicts return `409 { error: 'username_taken' }`.

### New helper
- `GET /api/profiles/check-username?u=<value>` → `{ available: boolean }` for live availability check.

---

## 11. Reels vs Video

### Feed shape addition
Each feed item of `type: 'video' | 'reel' | 'image'` now carries:
```ts
{
  type: 'video' | 'reel' | 'image',
  media: {
    url: string,
    thumbnail_url?: string,
    mime: string,
    width: number,
    height: number,
    duration_ms?: number,
    aspect: 'portrait' | 'landscape' | 'square',
  }
}
```

Client discriminates: `type === 'reel'` → `<ReelCard>`; `type === 'video'` → `<VideoCard>`.

No new endpoints — this is a payload shape addition. Backend must populate `media.aspect` and `media.duration_ms` from probe (Area 5 pipeline).

---

## 12. Assets

No API. Static asset delivery only.

---

## 13. Feed Scrollbar / Back-to-Top

No API. Frontend only.

---

## Socket.io room conventions

| Room name | When user joins | What is emitted |
|---|---|---|
| `user:<id>` | Auto on auth | `notification`, `notification:read` |
| `post:<id>` | Client emits `subscribe_post` while card is visible | `like_updated`, `new_comment`, `comment_deleted`, `share_updated` |
| `club:<id>` | When viewing club page | `club_new_post`, `club_announcement` |
| `fixture:<id>` | When viewing live match | `fixture_starting`, `fixture_goal`, `fixture_finished`, `fixture_event` |

All socket events should include their full payload, not just IDs, so clients can update without a follow-up REST round-trip.

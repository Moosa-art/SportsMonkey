# Risk Register & Open Product Decisions

This document captures unknowns, risks, and items that **need a product or stakeholder decision before build starts**. Each entry has a recommendation so the team can ratify in a single review meeting.

---

## Decisions needed before kickoff

### D1. Date slider — keep the "All" pill?
**Context:** `DateSelector.jsx` defaults `selectedDate = null` (= "All"). Spec says 9 day pills with today centered & selected.

**Options:**
- **(A)** Remove the "All" pill entirely, default-select today.
- **(B)** Keep "All" pill at far-left, but default-select today.

**Recommendation:** **(B)** — "All" is useful for users who want the unfiltered feed. Default selection = today.

---

### D2. Share-to-Chat — build a DM system?
**Context:** The brief lists "Share to Chat" but **the schema has no chat/DM tables, the API has no chat routes, and there is no client chat UI.** `InboxPage.jsx` exists but it's the notifications inbox, not chat.

**Options:**
- **(A)** Build a full DM/chat module now. Adds ~8–10 eng-days.
- **(B)** Punt "Share to Chat" to a future release. Hide the button.
- **(C)** Wire it to the existing notifications/inbox: "send this post to a user as a notification" — ~1 eng-day, but limited UX.

**Recommendation:** **(B)** for this milestone. Add DM as a separate epic.

---

### D3. "Favorite Club" vs "Favorite Team"
**Context:** Schema has `favourite_club_id`. Brief mentions both Favorite Club and Favorite Team as separate fields.

**Options:**
- **(A)** Treat them as one field (rename UI to "Favorite Team / Club").
- **(B)** Add separate `favourite_team_id` for national-team picks (e.g. England, Brazil) and keep `favourite_club_id` for clubs (e.g. Liverpool).

**Recommendation:** **(B)** — sports fans distinguish club and national side. Schema delta in `04_SCHEMA_DELTAS.sql` already adds `favourite_team_id`.

---

### D4. Storage backend for media uploads
**Context:** Area 5 needs file storage. Local disk is fine for dev; production needs durability + CDN.

**Options:**
- **(A)** AWS S3 + CloudFront.
- **(B)** Cloudflare R2 + Cloudflare CDN (zero egress fees — ideal for a video-heavy app).
- **(C)** Local disk with nginx static serving (cheap, no CDN, doesn't scale).

**Recommendation:** **(B)** Cloudflare R2 + CDN. Code against the S3 SDK (R2 is S3-compatible) so swapping to AWS later is one config change.

---

### D5. GIF source for comments
**Context:** Area 8 GIF picker.

**Options:**
- **(A)** Tenor API (Google) — free, generous quota, simple REST.
- **(B)** Giphy SDK — React components ship out of the box; heavier bundle.
- **(C)** Self-hosted curated GIFs.

**Recommendation:** **(A)** Tenor. Proxy via backend `GET /api/media/gifs?q=` to keep the API key server-side.

---

### D6. Source of provided assets
**Context:** Area 12 says "replace placeholder/demo assets with actual assets from the provided data". The provided zip does **not** contain a curated asset bundle (no club crests folder, no league logos, no player photos beyond seed data references).

**Options:**
- **(A)** Wait for the assets bundle to be delivered before starting Area 12.
- **(B)** Use a public source (e.g. ISO-licensed Wikipedia commons crests) until the official set arrives.
- **(C)** Generate generic SVG defaults and merge real assets later.

**Recommendation:** **(C)** for the milestone (ships on time). Build the `<SmartImage fallback=… />` component so swapping in real assets later is a content change, not a code change.

---

## Technical risks

### R1. Realtime requires socket.io client (currently absent)
Three areas (Notifications, Likes sync, Comments sync) depend on a client-side socket connection that does not exist today. Without it, the "sync across devices" acceptance criterion is unmet.

**Mitigation:** Build `src/lib/socket.js` in Sprint 1 so subsequent features can rely on it.

---

### R2. MySQL FULLTEXT minimum word length
MySQL InnoDB FULLTEXT defaults `innodb_ft_min_token_size = 3`. Queries for 2-letter terms (e.g. "PL") return zero results. Search will look broken for users who type short queries.

**Mitigation:** Either (a) set `innodb_ft_min_token_size = 2` in `my.cnf` and rebuild indexes, or (b) fall back to `LIKE 'q%'` for queries shorter than 3 characters. Recommend (b) — doesn't require server tuning.

---

### R3. Browser autoplay policies
Chrome/Safari block autoplay of videos with sound. Reels & videos in feed must autoplay **muted**. Users must tap to unmute.

**Mitigation:** Default all `<video>` elements to `muted` + `playsInline`. Reuse the unmute state across the session via a `useUnmutePref()` hook.

---

### R4. iOS Safari `MediaRecorder` quirks
Voice notes (Area 5/8) rely on `MediaRecorder`. iOS Safari only added support in 14.5, and the available MIME types are limited to `audio/mp4` (not `webm`).

**Mitigation:** Feature-detect and ask for `audio/mp4` on iOS, `audio/webm;codecs=opus` elsewhere. Server accepts both. If `MediaRecorder` is absent, hide the voice-note button.

---

### R5. Trigger contention on hot posts
The existing `posts.like_count` / `posts.comment_count` triggers and the new `share_count` trigger all write to the same `posts` row. A viral post with 1000 likes/sec will serialize on that row.

**Mitigation:** Out of scope for this milestone but worth noting: switch to an async denormaliser (Redis counter → batch flush) when any single post crosses 100 writes/sec sustained. Not required at current scale.

---

### R6. Notification fan-out for club followers
`type: 'club_new_post'` fans out to every follower of a club. A club with 1M followers => 1M notification rows on a single post. With the dedupe_key we can collapse repeats, but the insert volume is the issue.

**Mitigation:** Queue notification fan-out (BullMQ / pg-boss / sidekick-equivalent). Out of scope for v1, but design `createNotification()` to be batchable so swapping in a queue later is non-breaking.

---

### R7. CSRF + cookie-based refresh tokens
The existing `AuthContext` uses an HttpOnly refresh-token cookie. State-changing endpoints (like/comment/share/follow/upload) are vulnerable to CSRF if the cookie is sent automatically.

**Mitigation:** Either (a) confirm `SameSite=Strict` is set on the refresh cookie and access token is sent only via `Authorization` header (current pattern in `api.js`), which mitigates CSRF for the access-token-protected endpoints — OR (b) add a CSRF token. Recommend (a) is sufficient given the current architecture; document in a security review.

---

### R8. Hashtag / mention extraction collisions
Naïve regex `/#([a-z0-9_]+)/gi` over-captures inside URLs (`https://x.com/#fragment`). Mention regex `/@(\w+)/g` over-captures email addresses.

**Mitigation:** Extract from text-only AST passes (skip nodes inside URLs/markdown links). Cap at 8 mentions and 8 hashtags per comment to prevent abuse.

---

### R9. Image moderation
User-uploaded avatars and comment images can contain illegal or harmful content. No moderation is in place today.

**Mitigation:** Out of scope for v1, but add a placeholder webhook in the upload route so AWS Rekognition / Hive Moderation can be wired in later. At minimum, add a report flow for media (the `reports` table already exists; extend `target_type` ENUM to include `'media'`).

---

## Decision summary table

| ID | Decision | Recommended | ✅ Ratified (24 Jun 2026) | Blocking? |
|----|----------|-------------|--------------------------|-----------|
| D1 | Keep "All" pill on date slider | Yes (default to today) | Keep "All" + default to today | No |
| D2 | Build chat now or defer | Defer | **Build full DM/chat module now (~8–10d)** | Yes for Area 4 |
| D3 | Separate favorite team vs club | Separate | Separate club + national team | Yes for Area 10 |
| D4 | Storage backend | Cloudflare R2 | Cloudflare R2 + CDN (S3 SDK) | Yes for Areas 5/8/10 |
| D5 | GIF source | Tenor | Tenor (server-proxied) | Yes for Area 8 |
| D6 | Asset bundle source | Generic + later swap | Generic SVG now, swap later | Yes for Area 12 |

**All decisions ratified 24 Jun 2026** (see Ratified column). ⚠️ D2 was ratified to **build the DM/chat module now** instead of the recommended defer — this adds a new ~8–10 eng-day epic (conversations/messages/participants schema, chat API routes, realtime sockets, chat UI) and re-sequences the roadmap. Recommended build order with these decisions: **(1)** socket foundation `src/lib/socket.js` (R1, shared by chat + notifications + like/comment sync), **(2)** Area 5 media pipeline on R2 (unblocks 8/10), **(3)** the DM/chat epic (D2) + Area 4 Share-to-Chat, then Areas 8/10/12.

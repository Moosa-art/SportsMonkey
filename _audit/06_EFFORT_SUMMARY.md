# Effort Summary & Sprint Plan

For one full-stack engineer. Add **+30%** if pairing with a dedicated QA. Add **+50%** if design polish iterations are required per area.

## Per-area effort

| # | Area | Eng-days | Risk | Notes |
|---|------|---------:|------|-------|
| 1 | Dynamic Notifications | 1.5 | Low | Backend mostly done. Need socket client + view + badge. |
| 2 | Global Search | 4.0 | Med | Build-from-scratch backend + frontend + indexes. |
| 3 | Date Slider | 0.25 | Low | Two-constant change + 1 product decision. |
| 4 | Share Functionality | 3.0 | Med | New backend + native APIs; blocked by D2 (chat). |
| 5 | Media Upload Pipeline | 4.0 | Med | Blocker for 4 other areas. Storage decision D4. |
| 6 | Header Profile Nav | 0.25 | Low | Trivial routing split. |
| 7 | Dynamic Likes/Comments rewire | 1.0 | Low | Wire to existing API + add feed enrichment. |
| 8 | Enhanced Comments | 4.0 | Med | Depends on Area 5. Tenor + emoji picker + mentions. |
| 9 | Saved Posts | 1.0 | Low | New table + endpoints + tab fix. |
| 10 | Edit Profile | 2.0 | Low | Depends on Area 5 for avatar. |
| 11 | Reels vs Video | 2.0 | Med | New `ReelCard` component + IntersectionObserver. |
| 12 | Real Assets | 1.5 | Low | Asset sweep; depends on D6. |
| 13 | Feed Scrollbar / Back-to-Top | 0.5 | Low | Component + CSS only. |
| — | Socket.io client (cross-cutting) | 1.0 | Low | Prereq for Areas 1, 7. |
| — | `<EmptyState>` / `<ErrorState>` / `<SkeletonLoader>` | 0.5 | Low | Shared primitives. |
| — | Rate limiting + security hardening | 1.0 | Low | `express-rate-limit`, cookie audit. |
| — | QA / regression / polish | 2.5 | — | Buffer. |
| **Total** | | **30.0** | | ~6 calendar weeks for one engineer. |

---

## Suggested sprint plan (4 sprints × 1 week each + 2-week buffer)

### Sprint 1  — Foundations (5 days)
Goal: ship the small wins and unblock everything else.

- **Day 1**: Area 3 (Date Slider), Area 6 (Header nav), Area 13 (Back-to-Top + scrollbar), Area 12 (asset sweep — pravatar removal, `/public/` paths).
- **Day 2**: Socket.io client + cross-cutting `<EmptyState>` / `<ErrorState>` / `<SkeletonLoader>`.
- **Day 3–4**: Area 5 — Media upload backend (multer + sharp + ffmpeg) + `media_files` table + `api.uploadMedia()` helper.
- **Day 5**: Area 5 — frontend pickers (`<MediaPicker>`, `<VoiceRecorder>`, `<MediaPreview>`) + Sprint 1 QA.

**Demo:** Date slider fixed, two profile icons split, back-to-top button, can upload an image and see the URL come back.

### Sprint 2  — Engagement (5 days)
Goal: real likes/comments/shares end-to-end.

- **Day 1–2**: Area 7 — fix `useEngagement`, server-side feed enrichment (`liked`, `saved`, `reposted`), socket subscription per post.
- **Day 3–4**: Area 4 — shares + reposts (backend + schema + frontend rewrite of `ShareSheet`).
- **Day 5**: Area 9 — Saved Posts (backend + Saved tab bug fix).

**Demo:** Like persists across refresh, share count updates live across two browsers, saved posts work cross-device.

### Sprint 3  — Notifications & Profile (5 days)
Goal: dedicated views for notifications and edit profile.

- **Day 1–2**: Area 1 — Notifications view + badge + missing notification types + socket listener.
- **Day 3–4**: Area 10 — Edit Profile (schema delta, route extension, image cropper, username availability check).
- **Day 5**: Area 11 — Reels vs Video card split + `IntersectionObserver` autoplay.

**Demo:** Real-time notifications, edit profile with avatar crop saves all fields, reels render vertically with swipe.

### Sprint 4  — Search & Enhanced Comments (5 days)
Goal: the two largest features.

- **Day 1–2**: Area 2 — search backend (routes + FULLTEXT indexes + history table) and frontend `SearchPage` skeleton.
- **Day 3**: Area 2 — trending, recent, debounce, infinite scroll.
- **Day 4–5**: Area 8 — enhanced comments (emoji + Tenor GIFs + image attachments + voice notes + mentions + hashtags + reactions).

**Demo:** Search works for all entity types, comments support all media + reactions + mentions.

### Buffer / hardening week (5 days)
- Rate limiting + cookie hardening.
- E2E smoke tests for the acceptance criteria (app restart, logout/login, refresh, navigation).
- Production build verification (`npm run build && npm run preview`).
- Image moderation hook stubs.
- Performance audit (Lighthouse).

---

## Dependency graph

```
Socket.io client ─┬─→ Area 1 (Notifications)
                 └─→ Area 7 (Likes/Comments sync)

Area 5 (Media)  ─┬─→ Area 8 (Enhanced Comments)
                 ├─→ Area 10 (Edit Profile avatar)
                 └─→ Area 4 (Share to Story)

D2 (chat decision)  → Area 4 (Share to Chat)
D4 (storage)         → Area 5
D5 (GIF source)      → Area 8
D6 (assets)          → Area 12
D3 (team vs club)    → Area 10
```

Schedule Sprint 1 before any other sprint so the socket client and media pipeline are live for downstream features.

---

## What is NOT in scope of this milestone

These are mentioned in the brief or arise from the audit but are deferred:

- **DM / chat module** (deferred per D2).
- **Live fixture event ingestion** (notification types defined but feed source not in scope).
- **Push notifications** (web push / mobile) — socket events cover in-app realtime only.
- **Image/video moderation** (R9) — add later.
- **Performance work** for viral posts (R5) — not required at current scale.
- **i18n** — strings are English-only for now.
- **Accessibility audit** (WCAG) — basic semantic HTML + ARIA labels only.

Call these out in the launch announcement so expectations are calibrated.

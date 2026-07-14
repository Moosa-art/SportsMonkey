# Social 442 — Audit & Implementation Plan

**Prepared:** 2026-06-22 · **Scope:** 13 feature areas from the audit brief · **Mode:** Audit-only (no source files modified)

This package contains a complete code-grounded audit of the Social 442 codebase and a phased implementation plan. **No application source files have been modified.** All deliverables live inside `_audit/`.

## Documents in this package

| File | Purpose |
|---|---|
| `00_README.md` | This file — start here. |
| `01_AUDIT_REPORT.md` | Per-feature findings tied to specific files, lines, and code excerpts. |
| `02_IMPLEMENTATION_PLAN.md` | Phased build plan with effort estimates, files-to-touch, and acceptance criteria for each of the 13 areas. |
| `03_API_CONTRACTS.md` | Specs for every new/changed HTTP endpoint and Socket.io event. |
| `04_SCHEMA_DELTAS.sql` | The MySQL migration delta (NOT applied — for review). |
| `05_RISK_REGISTER.md` | Risks, unknowns, and items that need product decisions before build. |
| `06_EFFORT_SUMMARY.md` | Roll-up of estimated effort with a suggested sprint breakdown. |

## TL;DR

The backend already has solid scaffolding for most of what was requested — the `social.js` route ships full **likes, comments, follows, reports, and notifications** endpoints, the schema has the right tables, and Socket.io is wired up server-side. **The bulk of the gap is on the frontend**, plus three missing backend surfaces: **search, shares, and media uploads**, plus column additions to `users` (location, DOB) for Edit Profile.

The 13 areas break down into roughly:

- **5 small frontend-only fixes** (1–4 hrs each): Date slider, Header profile split, Saved Posts bug, Feed scroll/back-to-top, asset cleanup.
- **4 medium features** (1–2 days each): Notifications view + badge, Dynamic likes/comments rewiring, Edit Profile, Reels-vs-Video rendering.
- **4 large features** (3–5 days each): Global Search (new backend + frontend), Share system (new backend + frontend + native APIs), Media upload pipeline (new backend + frontend + storage), Enhanced Comments (emoji/GIF/voice/mentions).

**Estimated total:** ~22–30 engineering days for a single full-stack engineer, deliverable in 4 sprints. See `06_EFFORT_SUMMARY.md` for breakdown.

## How to read this audit

1. Read this README.
2. Read `06_EFFORT_SUMMARY.md` for the sprint plan at a glance.
3. Read `01_AUDIT_REPORT.md` to see what's broken and why, with code citations.
4. Read `02_IMPLEMENTATION_PLAN.md` for the actual build instructions per feature.
5. Use `03_API_CONTRACTS.md` and `04_SCHEMA_DELTAS.sql` as the spec for new backend work.
6. Skim `05_RISK_REGISTER.md` before kickoff — there are 6 product decisions needed up-front.

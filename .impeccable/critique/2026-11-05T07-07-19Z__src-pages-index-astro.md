---
target: uwomeds demo (whole site)
total_score: 27
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:/home/nsims/repos/uwomeds_demo/src/pages/index.astro"
target_fingerprint: "sha256:7eea4dbdec0e5e8d17fa29d490217212cb8ff3a91f4e7bda9795424f6d2aa676"
target_path: /home/nsims/repos/uwomeds_demo/src/pages/index.astro
timestamp: 2026-11-05T07-07-19Z
slug: src-pages-index-astro
---
# Critique: uwomeds demo (whole site), 2026-11-05

Score 27/40 (Good). P0: 0, P1: 2.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | System status | 3 | No unsaved-changes state on club edit; "by Original content" label |
| 2 | Real world | 3 | Two near-duplicate booking description fields |
| 3 | User control | 2 | Remove exec/link instant; Decline one click, emails, no undo |
| 4 | Consistency | 3 | Login vs Sign in vs Sign out; Admin vs Bookings |
| 5 | Error prevention | 2 | No required markers; no room-clash check; no Decline confirm |
| 6 | Recognition | 3 | Phone calendar shows unlabeled 6px bars |
| 7 | Efficiency | 2 | Admin list sorted by submission, not event date; no bulk |
| 8 | Minimalist | 3 | Home: six equal tiles, no priority; phone hero fills a screen |
| 9 | Error recovery | 3 | Club-edit errors not linked to fields, no aria-invalid |
| 10 | Help | 3 | Good hints; nothing for first-time page editor |

Specificity: the flows are Schulich-specific (campus routing, MEB rooms, exec email opt-in); the visual layer is generic (grey cards with purple top border, stock cube illustration, purple only on links).

## Priority issues
1. [P1] No undo on club edits and booking decisions: clubs/[slug]/edit.astro:155-157 removes exec rows instantly; admin/bookings.astro:91-104 Decline one click. Fix: version history + Restore for clubs, soft remove with Undo, confirm/undo on Decline. harden.
2. [P1] Phone home leads with decoration; calendar events font-size:0 bars (global.css:234). Fix: shrink/hide hero art on phone, top-task row (Clubs, Book a room, Calendar), agenda instead of grid below 640px. adapt, layout.
3. [P2] Booking form: flat ~15 fields, no required/optional markers, duplicate description fields. Fix: group What/When/Where, mark optional, distinguish descriptions, "Changing an existing booking?" link. clarify, distill.
4. [P2] Generic look, brand purple under-used (only links/buttons). Fix: purple as a surface (hero band), drop stock cubes for something Hippo/two-campus. bolder, colorize.
5. [P2] Club edit: four red Remove buttons as loud as Save; Save ~1,850px down (2,250 on phone). Fix: sticky save bar + beforeunload guard, quiet Remove with exec name in label, collapsed exec rows. layout, quieter.

## Detector
Source: 6 warnings in global.css (side-tab x5 at L222/224/227/244/254, border-accent-on-rounded L174). Real: .tile L174. Others are calendar/org-chart/diff conventions (false positives).
Rendered: cramped .cal-event padding on / (real); line-length on demo-note (demo-only); advisory stragglers/unbalanced headings. No contrast failures; no overflow at 390.
Tap targets at 390: footer links ~17px tall, tile links 20px, calendar prev/next 33px tall, Email me a code 41px.

## Minor
- "Last saved ... by Original content" (lib/store.ts:207).
- Footer floats mid-viewport on short pages.
- Teal today marker appears nowhere else.
- Club cards: make the whole card the target; design the empty-description state (92 of 169 real clubs).
- datetime-local shows mm/dd/yyyy on an en-CA site.
- Remove buttons share one accessible name; header details dropdowns lack Escape-to-close.
- Search icon searches clubs only.

---
target: uwomeds demo (whole site)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:/home/nsims/repos/uwomeds_demo/src/pages/index.astro"
target_fingerprint: "sha256:46fb3ef6906a67948d22c8a2688a4ca04f73b96484ae079fdff1cb27af47e28a"
target_path: /home/nsims/repos/uwomeds_demo/src/pages/index.astro
timestamp: 2026-11-05T07-25-24Z
slug: src-pages-index-astro
---
# Critique: uwomeds demo (whole site) at 6898777, 2026-11-05

Score 26/40 (Acceptable). P0: 1, P1: 2.

| # | Heuristic | Score | Key issue |
|---|---|---|---|
| 1 | System status | 3 | Stale "Add your club's description" nudge after a successful save; no "my bookings" |
| 2 | Real world | 3 | "403: not allowed"; "by Original content"; two near-duplicate booking descriptions |
| 3 | User control | 2 | Decline one click, no confirm/undo; roster apply and club save have no revert |
| 4 | Consistency | 3 | Three different error patterns; decline flash styled as success |
| 5 | Error prevention | 2 | 50 clubs have no campus, so first save fails; sample roster locks out demo exec; no room clash check |
| 6 | Recognition | 3 | "My club" hidden behind Menu on phone |
| 7 | Efficiency | 2 | 134 clubs on one 20,000px phone page; no own-bookings list; no bulk |
| 8 | Minimalist | 3 | 16-field booking column; every card title an underlined link |
| 9 | Error recovery | 3 | Booking/roster errors excellent; club-edit campus error not tied to fieldset; 403 dead end |
| 10 | Help | 2 | Nothing on the yearly roster handover; 403 doesn't say who to ask |

## Priority issues
1. [P0] Applying public/sample-exec-roster.csv drops the demo club exec (exec1) from Surgery Interest Group; the persona then gets 403 on edit and event report. Fix: keep exec1 in the CSV; warn in preview when a demo persona loses access; undo last roster upload. store.ts:97, admin/roster.astro:76-82. harden.
2. [P1] 50 of 134 clubs have campuses: [] but edit requires a campus; error not linked to fieldset; stale nudge after save; those clubs hidden by campus filters. edit.astro:31-37,171,193-197; render-club.ts:74-78. clarify.
3. [P1] No undo: Decline one click + green flash; roster apply and club save no revert. bookings.astro:45-46,91-103; store.ts:97-100. harden.
4. [P2] Home is a poster: phone first screen all hero, no purpose line or primary action, six equal tiles under a full calendar. index.astro:7-12,19-44; global.css:163-171. layout.
5. [P2] Booking form one 16-field column; duplicate descriptions; no "which club"; no link to the original booking for reschedule/cancel. room-booking/index.astro:14-114. distill.

## Detector
Source: 6 warnings in global.css (side-tab x5 L222/224/227/244/254, border-accent-on-rounded L174); only .tile L174 is a real hit.
Rendered: cramped .cal-event padding on / (desktop); line-length on a club description (~140 chars) and on demo-note; advisories only on /clubs/. No contrast failures; no overflow at 390.
Tap targets at 390: footer links 17px, header Menu 39px, calendar prev/next 33px, Wellness list links 19px, roster file input 21px, several buttons at 41px.

## Minor
- "by Original content" (store.ts:267).
- Home demo box omits the Community Relations persona.
- Exec email checkbox says "my email" but one exec can tick it for another (consent).
- Roster keeps last year's execs for clubs not in the file.
- 122 of 134 clubs have no execs; pages end abruptly.
- Emoji tofu in a club card (Latin-subset Rubik).
- MedFriend iframe makes two scroll areas on phone.

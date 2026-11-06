# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Schulich medical students on the London and Windsor campuses, and the student leaders who keep the site current. **Students and club execs carry equal weight** (Noor, 2026-11-05): a design that helps one at the other's expense is wrong.

- **Student**: anyone signed in with an @meds.uwo.ca or @uwo.ca address (both get the same access). Finds a club, a resource link, a council document or the events calendar; books a room for a club event. Often on a phone, between classes.
- **Club exec**: a student on the yearly exec roster. Keeps their own club's page current (description, campus, socials, execs). 169 clubs; on today's site 92 of them have no description, so editing has to feel quick and safe.
- **Page editor**: a council member (by default the President, Communications Director and IT Director) who edits council pages on the site, with every save versioned.
- **Booking admin**: approves or declines room bookings for a campus; may be staff outside @meds.uwo.ca.
- **IT Director**: owns the site and its accounts (`hippoit@uwo.ca`), changes every year and may not be technical.

## Product Purpose

The Hippocratic Council's website: public council pages, a club directory, room booking and council forms. It replaces a fragile WordPress site ("held together with patches") that keeps every current function, needs no manual chores, and hands over cleanly each spring. Success, in Noor's words: next spring's handover is a "seamless, user-friendly experience. No more patchwork."

This repo is the **clickable demo** for the council meeting on Nov 11 2026: sample data, everything faked in the browser, shown to council to win support for the rebuild. The real site is built from the plan in `nsimsam/hippo_website`.

## Positioning

The one place where a Schulich student's council, clubs and room booking live together, run by students for students, behind their Western email. No passwords: sign-in is an emailed 6-digit code.

## Operating Context

- Two campuses, London and Windsor; a booking may target one or both, and Windsor has a fixed list of five MEB rooms.
- The public events calendar is a Google Calendar; approved bookings appear on it.
- Many resources stay as links or embeds to Google Sheets, Docs, Drive and Forms, Microsoft Forms and the library; they are not rebuilt.
- The exec roster is a once-a-year spreadsheet; being on it is what grants club editing.
- Council turns over every year; most editors are not technical.

## Capabilities and Constraints

- Parity with today is non-negotiable: Western-email sign-in, club directory where execs edit only their own club, room booking for signed-in students, content pages (council, resources, links, contact, documents, meetings and updates, sponsors, calendar).
- MedFriend: its own top-level menu item; the same Western sign-in saves study progress and opens the module questions.
- Also: contact form, Report a problem, admin pages for bookings and people, council org chart built from data, privacy page and terms.
- MedFriend (a study resource) lives at `/medfriend` behind the same sign-in.
- Exec emails show on club pages only with each exec's opt-in.
- No third-party loads on council pages: fonts are self-hosted; Instagram loads only after a click.
- Timezone `America/Toronto`.
- Vocabulary from `CONTEXT.md` in the plan repo: **student**, **club exec**, **exec roster**, **page editor**, **booking admin**, **IT Director**, **booking**, **events calendar**, **club event report**, **problem report**, **beta site**, **switch-over**.
- Demo only: sample data, no server, `localStorage`, a yellow demo banner with persona switcher and Reset demo.

## Brand Commitments

- Name: **Schulich Hippocratic Council** ("Hippo" informally).
- Keep the Hippo logo (`public/hippo-logo.png`, `public/hippo-icon.png`) and the current site's purple, `#582c83` as sampled from the live uwomeds.com CSS (the plan's `#522d80` was an approximation).
- **Voice is mixed by page** (Noor, 2026-11-05): formal and institutional on governance pages (constitution, terms of reference, minutes, privacy, terms); plain, warm and brief on student tools (clubs, booking, sign-in, forms, help).

## Evidence on Hand

- Real: Hippo's name, logo, colours, homepage illustration, public council role titles, the room-booking form's fields and Windsor room list, the menu structure of the current site.
- Real public content (since 2026-11-05): the 134 current clubs' names, campuses and public descriptions, and the text of the public pages (Academic, Educational, Extracurricular, Wellness, Research From Home, Sponsors, Meetings and Updates, Documents, Links), minus dead links and any personal names, emails or phone numbers. MedFriend is the live site, embedded after sign-in.
- Invented: every person (execs, admins, students: "Rowan Example", `exec14@meds.uwo.ca`) and bookings. Never present these as real, and never add real student names, emails or photos.
- No testimonials, usage numbers or endorsements exist; do not invent them. The current-site audit (`docs/council/2026-10-25-current-site-audit.md` in the plan repo) is the factual case for the rebuild.

## Product Principles

1. **Parity first.** Every job the old site does, the new one does, before anything new.
2. **Safe for the next person.** A non-technical page editor or IT Director can't break it, and every edit can be undone.
3. **Self-serve over manual.** If a council member does a chore by hand only because the site can't, the site should do it.
4. **Privacy by default.** Show a student's details only with their consent; keep everything else behind sign-in or out of the site.

## Accessibility & Inclusion

WCAG 2.1 AA (Noor, 2026-11-05), the usual standard for Ontario organisations under AODA. Works by keyboard and screen reader, and on a phone.

# uwomeds.com: clickable demo

**This is a demo with sample data.** It is a static, clickable mock-up of the rebuilt
[uwomeds.com](https://uwomeds.com) (the Schulich Hippocratic Council website), made for
the council presentation on Nov 11 2026. Live at
<https://schulichmed.github.io/uwomeds/>.

- **Sample data only.** Every person, club, email address and booking is invented
  ("Alex Sample", `student1@meds.uwo.ca`, "Sample Surgery Interest Group"). Hippo's
  name, colours and public role titles are the only real things in it.
- **No server and no accounts.** Sign-in, club edits, bookings and page edits are faked
  in the browser with `localStorage`. Nothing leaves the browser, no email is sent, and
  **Reset demo** in the yellow banner puts everything back.
- **No external services.** No analytics, no tracking, no fonts or scripts from other
  sites; nothing is loaded from Instagram or Google.

Author: Hippocratic Council IT Director (hippoit@uwo.ca).

## What you can try

Use **Demo persona** in the banner to switch between Student, Club exec (Sample Surgery
Interest Group), Booking admin, Page editor and IT Director (site admin).

| Flow | Where |
|---|---|
| Sign in with a Western email and a 6-digit code (shown on screen in the demo) | `/login/` |
| Club directory with campus filter and search; club pages with socials and an Instagram card | `/clubs/` |
| A club exec edits only their own club (description, campus, up to 6 social links, execs with an email opt-in) | `/clubs/<slug>/edit/` |
| Room booking with the real form's fields and rules; campus-routed notice | `/room-booking/` |
| Booking admin approves or declines; approved bookings appear on the calendar | `/admin/bookings/`, `/calendar/` |
| Page editor edits a council page with preview, version history and Restore | e.g. `/wellness/` |
| Council org chart built from data | `/council/` |

## Run it

Needs Node 22 and pnpm (the version is pinned in `package.json`; `corepack enable` picks it up).

```bash
pnpm install --frozen-lockfile
pnpm dev            # http://localhost:4321/uwomeds/
pnpm build          # type-check (astro check) + static build into dist/
pnpm check-links    # every root link in dist/ must start with /uwomeds/
pnpm preview        # serve dist/ at http://localhost:4321/uwomeds/
```

Inputs: none (sample data lives in `src/data/*.ts`). Output: a static site in `dist/`.

## Deploy

`.github/workflows/pages.yml` builds and publishes to GitHub Pages on every push to
`main`. A repo admin must switch it on once: **Settings → Pages → Build and deployment →
Source: GitHub Actions**.

## How this relates to the real build

The real site follows the build plan (`docs/superpowers/plans/2026-10-24-uwomeds-revamp.md`
in the planning repo): Astro on Cloudflare Pages, Supabase for sign-in, clubs, bookings and
council pages with row-level security, Brevo for site emails, and the Google Calendar API
for approved bookings. This demo keeps the plan's layout (`src/layouts/Base.astro`,
`src/components/{Header,Footer}.astro`, `src/pages/...`) and look so they can carry over.
What changes in the real build:

| Demo | Real build |
|---|---|
| `src/lib/store.ts` (localStorage) | Supabase queries and `/api/*` routes; RLS decides who can do what |
| Code shown on screen | Supabase Auth emails the code (and a link) |
| Persona switcher | Roles from `/admin/people` and the uploaded exec roster |
| Month view drawn by the page | The events calendar (Google Calendar) embedded; approval writes the event |
| `src/lib/markdown.ts` (tiny renderer) | A pinned, sanitising Markdown library |
| `base: '/uwomeds'` for GitHub Pages | Served at the root of uwomeds.com |


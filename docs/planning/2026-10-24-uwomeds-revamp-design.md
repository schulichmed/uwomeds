# uwomeds.com revamp — design

## Context
uwomeds.com is the Hippocratic Council (Schulich medical student council) website. It runs on Bluehost + WordPress + Astra + Elementor and is held together with patches: password reset has been broken for years; club-exec permissions are assigned by hand across WordPress, PublishPress and a Google Sheet; room bookings are processed by hand; it costs about CA$200/yr (hosting, domain, domain privacy and Elementor Pro).

**Owner:** Noor Simsam, IT Director 2026–27 (`hippoit@uwo.ca`). The previous IT Director advises.

**Success test (Noor's words):** next spring's handover to the new IT Director is a "seamless, user-friendly experience. No more patchwork."

## Goals
1. **Nothing breaks on its own.** No auto-updating plugins. Dependencies pinned; after the switch-over, every change goes through a GitHub pull request and can be reverted (the initial build lands as one human merge after beta sign-off; see the build plan).
2. **No manual chores that exist only because the system can't do them.** No password resets, no hand-assigned roles, no copying bookings into a calendar.
3. **Same core functions as today** (parity is non-negotiable):
   - Login restricted to Western addresses (@meds.uwo.ca and @uwo.ca)
   - Club directory where each club's execs edit only their own club
   - Room booking for logged-in students
   - Content pages (council, resources, links, contact), research-opportunities link
4. **Handover = transfer account ownership + read `docs/START-HERE.md`.**
5. **Cost ≤ IT budget** — target ~$15 CAD/yr (domain only) once prepaid Bluehost items lapse.

### Use of prepaid Bluehost (Noor, 2026-10-24)
- **Domain:** stays registered at Bluehost until the domain transfer to Cloudflare Registrar, done by Noor in May–early June 2027 (registration runs to Jul 29 2027). The nameserver move to Cloudflare (free) happens on its own in early December, before the switch-over ([order decided](https://github.com/nsimsam/hippo_website/issues/26)).
- **Hosting (prepaid to May 2029):** the old WordPress is **deleted 30 days after the switch-over**, once the import is confirmed; no `old.uwomeds.com` archive (the Supabase archive is the record; [privacy gaps](https://github.com/nsimsam/hippo_website/issues/25)). Hosting then only carries the default `uwomedsc` mailbox until it lapses, when its mail records are removed. The site's sender is Brevo, not Bluehost mail: Cloudflare Functions can't reliably talk SMTP, so one Brevo account (HTTP API for the site, SMTP for Supabase Auth) sends from `noreply@uwomeds.com` (decided in the build plan, 2026-10-24). Not used to run the new site.
- Turn off hosting auto-renew. Clean up leftover old-site data before the build.

### Current-site inventory (public sitemap, 2026-10-24)
- **17 pages:** `/`, `/council/`, `/council-2/`, `/academic/`, `/educational/`, `/extracurricular/`, `/wellness/`, `/research-from-home/`, `/clubs/`, `/calendar/`, `/sponsors/`, `/meetings-and-updates/`, `/documents/`, `/contact/`, `/login/`, `/logout/`, `/room-booking-copy/` (plus the login-only booking and `/register/` pages, which aren't in the sitemap).
- **169 club pages** (`clubs_directory` post type).
- **2 blog posts** (one is the default "Hello world"). Decide whether to keep news posts.
- **Public crawl findings (2026-10-24):**
  - **The Google Calendar belongs to `roombooking.schulich@gmail.com`** (public calendar). It's embedded on the home page and on `/calendar/`, which also links subscription instructions. This answers who owns it: the booking Gmail. Service-account access must be granted on that calendar.
  - **The contact form** is WPForms #3101 plus a Google Maps embed.
  - **Academic page:** an embedded Google Sheet (research opportunities), a Google Form, Drive folders (HippoNotes/HippoAnki, notes) and MEDCRAM links. **Wellness:** Google Sheets, a Drive folder and a Microsoft Forms link. **Extracurricular:** Google Docs for the club proposal form and club policy. These stay as links/embeds to Google; they're not rebuilt.
  - **The "Documents" page is actually `/council-2/`.** It holds the Constitution and Class Council ToR as `.docx` files in wp-uploads, which must be migrated. **`/documents/` is the login-only Room Booking page** (confirmed from the database).
  - **Footer:** copyright, social links (Facebook, Twitter/X, Instagram, YouTube, LinkedIn) and a **"Report Issue" button**. Its destination is to be confirmed from the backup; it carries over as a link to the contact form or a Google Form.
  - **Meetings & Updates:** an ISA summary PDF and meeting minutes in Drive folders.
  - **Stale content to drop or redirect:** `/room-booking-copy/` (actually a Tachycardia 2023 event page), the two blog posts (theme demo content), links to the old `schulichmeds.com` site and to Bluehost temporary domains. Check those links at migration.
  - The council page lists director names and photos; that's public by design, but it's managed in the CMS rather than copied into planning docs.
  - **Org chart** (2023/24, a static Whimsical image): President and Past President; VPs for Events, Finance (Jr/Sr), EDI-D (×2), Academic, Windsor, Internal, External (Jr/Sr) and Communications; the IT Director and Social Media Director report to VP Communications. Other positions include Community Relations Director (Jr/Sr), class presidents and Windsor VPs per year, and liaisons. The new `/council` page builds this structure from CMS entries, so it stays current.
  - Role owners this implies: VP Windsor for Windsor bookings and content; VP Finance as a likely recipient of the club event reports (Hippo funding question); VP Academic for research opportunities and MedFriend content; VP Communications for the calendar and as a backup owner of the accounts.
- Noor confirmed all four of these must carry over, and they're designed under "Content pages" below: **calendar**, **documents**, **meetings & updates**, **sponsors**.
- Still needed from cPanel: email accounts/forwarders, cron jobs, DNS zone.


### Database structure findings (structure-only extraction, 2026-10-24)
- **Room booking lives at `/documents/`** (page "Room Booking", gated by the Content Control rule "Room Booking Restriction"); menu label "Event & Room Booking". The public Documents page is `/council-2/`.
- **Two campuses: London and Windsor.** The room booking form (WPForms #3394) asks: name, email, request type (New booking / Reschedule / Cancellation), event title, description for calendar promotion, start and end date/time, years targeted (Year 1 to 4), public calendar description, event type (in-person or Zoom only), campus (London / Windsor / Both), video-conference needed, Zoom link, London room (free text), Windsor room (a fixed list of five MEB rooms with capacities), expected attendees per campus, and private notes for the booking and calendar managers. Notifications go to the submitter plus **several recipients** (Gmail, @uwo.ca, @schulich.uwo.ca, @uwindsor.ca), so **routing must depend on campus** and the recipients must be configurable in `/admin`.
- **Third form, missing from the design until now:** the **Club Event Submission Form** (WPForms #3413). It's a post-event report (club, event, dates, anticipated and actual attendance, whether Hippo funded it) sent to a Gmail address. It must carry over, as a logged-in form saved to Supabase with a CSV export for the finance/community director *(builder call)*.
- **Contact form** (#3101): name, email, message, sent to an @uwo.ca address.
- **Club fields (ACF "Club Fields", 52 fields):** description, logo (or a "no logo" flag), president (name, photo, email), club email, Facebook, Instagram, website, campus (checkbox: London/Windsor), up to **10 senior executives** (name, role, email, photo each), and announcements. In the new schema this becomes `clubs` plus a `club_execs` child table (ordered, unlimited) instead of 10 numbered slots. Execs' names, emails and photos are public on club pages today; keep that only with each exec's consent (an opt-in field) *(builder call)*.
- **Scale:** 521 accounts, about 120 with the Editor role (club page managers), 2 administrators, 169 clubs, 433 media files (6 PDFs, 4 .docx: constitution, ToR, clubs policy, club proposal form).
- **2,107 stored WPForms entries** (bookings and contacts since about 2022) sit in the WordPress database. That's personal data. They **are migrated** (Noor, 2026-10-24) into an admin-only archive, separate from live bookings; retention still to be decided.
- **Leftovers not to rebuild:** inactive plugins and draft pages.

## Non-goals (this project)
- (Removed: MedFriend is now built as part of the site; see the wayfinder map.)
- Integrating with Western's real room-booking system.
- Self-serve booking calendar / availability view.
- Migrating WordPress passwords (not possible, not needed). Accounts and form submissions **do** migrate (Noor, 2026-10-24); see Migration and launch.

## Anti-goals (failure even if it works)
- A site only a programmer can keep running. Council members and club execs must manage their own content without the IT Director.
- Student personal information (names, emails, bookings, exec lists) in the git repo, docs, or Claude's context.
- Dependence on Claude (or any AI) to operate. Claude is an **optional helper** each IT Director chooses to use or not (Noor, 2026-10-24): it edits the site via PRs a human merges. When off, everything works manually. Deterministic scheduled work stays in plain GitHub Actions.
- Anything one person's personal account owns.

## Decisions Noor made (2026-10-24)
| Area | Decision |
|---|---|
| Stack | GitHub · Cloudflare Pages + Functions + Registrar · Supabase (free plan) · Brevo · Hippo Google account. **Confirmed 2026-10-25** after comparing six options against today's setup ([stack comparison](https://github.com/nsimsam/hippo_website/issues/2), [stack decision](https://github.com/nsimsam/hippo_website/issues/3)). No git CMS (see Page editing) |
| Login | **Emailed code (and link)**, @meds.uwo.ca and @uwo.ca with equal access — no passwords |
| Room booking | **Form + approve button**: student submits → email to booking inbox + admin page with Approve/Decline → approved bookings auto-added to the Google Calendar |
| Page editing | **Page editors (President, Communications Director, IT Director) edit on the site itself**, signed in with their @meds.uwo.ca code like everyone else; no GitHub accounts; every save keeps the earlier version (Noor, 2026-10-25, replacing the GitHub-based editor) |
| MedFriend | **Built in the same build** at uwomeds.com/medfriend behind the same sign-in; built after the core site, live at the switch-over or shortly after |
| Claude | **Optional, per IT Director.** 2026–27 uses Noor's personal account at no cost to Hippo. Claude edits pages and code through PRs a human merges. A **Report a problem** form on the site automatically becomes a ticket in a private GitHub repo; with Claude on, Claude drafts the fix as a PR; the reporter is emailed when it's closed. Not a tracker for council members (Noor 2026-10-24). Hippo doesn't pay for Claude (Noor, 2026-10-25): the next director uses their own account or runs everything manually, and the ≈ CA$325/yr saved goes back to council |

## Design

### Users and roles
| Role | Who | Can |
|---|---|---|
| visitor | anyone | read public pages, club directory |
| student | anyone signed in with @meds.uwo.ca or @uwo.ca (or an approved outside email) | room booking form, club event report, MedFriend |
| club editor | exec listed for a club on the uploaded exec spreadsheet | edit **only** that club's page, from their first sign-in |
| booking admin | whoever processes bookings | see, approve, decline bookings |
| community admin | Community Relations Director | upload the exec spreadsheet, add/archive clubs (`/admin/clubs`) |
| page editor | President, Communications Director, IT Director (assigned on `/admin/people`) | edit existing council pages: text, photos, documents and list entries; not add or remove menu pages |
| site admin | IT Director (+ President as backup) | everything; assign admin roles |

Roles live in Supabase (`profiles.role` + `club_roster`); enforced by row-level security (RLS), not just the UI. **`/admin/people`** (site admins): list of everyone who has signed in (email, last sign-in, role), assign or remove roles, manage approved outside emails, block or remove an account. The Supabase dashboard is for IT emergencies only, not day-to-day work. Page editors need no GitHub account (Noor, 2026-10-25).

### Login
- Supabase Auth, email OTP. The email contains **both a 6-digit code and a link**. *(Builder call, flagged: Western mail is Microsoft 365, whose Safe Links scanner can pre-click and burn one-time links; the code always works.)*
- Sign-up = first sign-in; domain enforced server-side (Supabase auth hook / DB trigger rejecting anything but `@meds.uwo.ca`, `@uwo.ca` and approved outside emails), not only in the form.
- **MedFriend readers** (Noor, 2026-10-25; reconfirmed on [ticket #29](https://github.com/nsimsam/hippo_website/issues/29)): `@uwo.ca` emails may also sign in, but reach only MedFriend; council features stay `@meds.uwo.ca` (+ approved outside emails). MedFriend stays open source to signed-in readers. Maintained by Open-Source Medicine and AI in Medicine club execs via the medwiki onboarding.
- **MedFriend gating and storage** (Noor, 2026-10-25; [ticket #19](https://github.com/nsimsam/hippo_website/issues/19)): a Pages Function on `/medfriend/*` checks the sign-in (cookie session, @uwo.ca or @meds.uwo.ca) before serving **every** file: pages, question/notes JSON, figures, decks. One public landing page at `/medfriend` (what it is, sign-in button, no course content); any other MedFriend URL sends a signed-out visitor to sign-in and back. **All 11 Anki decks live in a private Cloudflare R2 bucket**, served through the same check (Pages caps files at 25 MiB; R2's free tier covers 10 GB and downloads are free). Supabase Storage is not used for MedFriend (its download allowance would be shared with council features). Content stays in **its own private repo**, pulled in at deploy; a GitHub Action copies changed decks to R2, so maintainers still just commit and push. The project is set to **fail closed** (Cloudflare's default is fail open, which would silently drop the gate) with an alert to the IT Director when the free 100,000 requests/day is reached; current traffic (≈75–150 page views/day × 10–30 requests each) is under 5% of it. Re-measure in the beta; paid Workers (≈CA$84/yr) only if the limit is hit repeatedly, and only with council's OK.
- **The old public MedFriend** (Noor, 2026-10-25; [ticket #21](https://github.com/nsimsam/hippo_website/issues/21)), at switch-over: `schulichmed/preclerkship` is **transferred into the Hippo GitHub org** (history kept; done by Noor, who owns the `schulichmed` account) and made **private**, history included. Signed-in readers get the source (code and content) as a **download from MedFriend**, not GitHub access. `schulichmed.github.io/preclerkship` becomes a one-page "moved to uwomeds.com/medfriend, sign in with your Western email" notice that forwards there, kept one school year, then switched off. **"Report this question"** stops opening public GitHub issues: it opens a small form on MedFriend (signed-in readers only) that **creates a GitHub issue in the private MedFriend repo** on the reader's behalf, so readers need no GitHub account and reports stay triageable in GitHub, by hand or with Claude. The issue carries only the question, the comment and a link, never the reporter's name or email. The site uses a GitHub token limited to creating issues in that one repo, stored as a Cloudflare secret. The notice is served from a new public `schulichmed/preclerkship` repo created after the transfer (GitHub Pages doesn't follow a transferred repo, and private-repo Pages needs a paid plan); being on the same address, it can read the progress the old site saved for the **progress carry-over** ([decision](https://github.com/nsimsam/hippo_website/issues/20)). **Licence:** MIT for the code only, copyright "Hippocratic Council and contributors"; the content is marked for Schulich students, not for redistribution, with lecture-derived material belonging to its owners.
- **Approved outside emails** (Noor: some people who run the site, e.g. the booking admin, aren't on @meds.uwo.ca): an `allowed_emails` table managed by site admins on `/admin/people`, checked by the same server-side hook. Seeded with `hippoit@uwo.ca` as a **permanent site admin** that passes from director to director, so admin rights can always be reassigned at handover even after a director graduates *(builder call: the permanent role account)*.
- Admin roles otherwise attach to each person's own account and are reviewed/expired in the annual handover.
- **Imported and graduated accounts** (Noor, 2026-10-25; [ticket #29](https://github.com/nsimsam/hippo_website/issues/29)): all 521 imported accounts stay in the permanent admin-only record; sign-in follows the domain rule above (516 @meds.uwo.ca; 3 @uwo.ca reach MedFriend only; 2 other addresses only if a site admin adds them to approved outside emails, and the import report lists them for that call). Graduates: nothing automatic, no cleanup job. Accounts sit unused, exec access ends with the next roster upload, admin roles end at handover, and deletion is on request via /privacy.
- **Site emails** (sign-in codes, booking notices, contact form — low volume, *not* mass email; class mass emails stay as they are). Supabase's built-in mailer is capped at a few emails/hour, so a sender is needed. Noor: the only Hippo Gmail is `roombooking.schulich@gmail.com`, and she worries Western's quarantine would flag Gmail. *(Builder call)*: send from `noreply@uwomeds.com` via a free transactional service (Brevo/Resend) with SPF/DKIM/DMARC on Cloudflare DNS — domain-authenticated mail is the best defence against quarantine. **Beta gate:** confirm codes land in several real @meds.uwo.ca inboxes (not quarantine); if they don't, ask Western IT to allowlist the sender. `roombooking.schulich@gmail.com` stays a recipient only.
- `/login` keeps its URL.

### Club directory (Supabase, not git)
- Tables: `clubs` (fields mapped from the 52 ACF "Club Fields" in the WordPress export), `club_roster (club_id, email, exec_name, role_title)`.
- Exec flow (Noor, 2026-10-24): the Community Relations Director uploads **one spreadsheet of who is an exec** (club, name, email, role) on `/admin/clubs`, sees a preview of who's added or removed, and applies it. Execs then **already have access the first time they sign in**, with no request or approval step. Uploading next year's sheet replaces the roster, so access ends for anyone not on it. Replaces the WordPress Editor role + PublishPress + Google Sheet.
- Club pages edited through a form on the site (text fields, links, logo upload to Supabase Storage). Execs turn over yearly and are many, so they don't need GitHub accounts.
- **Social links** (Noor, 2026-10-25; [ticket #28](https://github.com/nsimsam/hippo_website/issues/28)): execs paste up to about 6 profile links; the site recognises Instagram, Facebook, TikTok, LinkedIn, YouTube, website and Linktree by address and shows each as an icon (anything else gets a generic link icon). Today's Facebook/Instagram/website fields import as-is (30/22/6 of 169 clubs filled; 124 have none). **Instagram is the only embed**, and it must stay free: a profile card (handle, icon, "Open on Instagram") always shows, and below it a **"Show recent Instagram posts" button** loads Instagram's free, tokenless profile embed (profile header plus about six recent posts) only when clicked, so Meta sees nothing until then (one line on /privacy). A private account or a broken embed leaves the card; a site setting turns the embed off everywhere if Instagram drops it. No socials: the section is hidden from visitors and shows an "add your club's socials" nudge to the club's own signed-in execs. Club pages only. Cost $0; nothing to renew. Before the beta, render the embed once from a Canadian browser.
- Annual reset: upload the new year's spreadsheet (or "Clear roster" over the summer), as part of the handover runbook.

### Room booking
- Logged-in form at `/room-booking` with the fields listed under "Database structure findings" → row in `bookings` → a **link-only** email to the recipients configured for that campus (London, Windsor, or both: "see /admin/bookings", no details) plus a confirmation to the student that repeats their details.
- `/admin/bookings` for booking admins: list, Approve / Decline (+ optional note). Approve → event created on the Hippo Google Calendar via a Google service account (calendar shared with it; key stored as a Cloudflare secret). Student gets an email on decision.
- Booking data is personal info: stays in Supabase only, admin-only, and is **kept for the council's records** with no automatic deletion (Noor, 2026-10-24).

### Council pages (Supabase, edited on the site)
- Static site generator: **Astro** *(builder call)* — server routes on Cloudflare for `/admin/*`, `/api/*`, and protected pages.
- **Editing (Noor, 2026-10-25):** page editors click **Edit** on a council page, change text, photos and documents, and save. Content lives in Supabase (photos and PDFs in Supabase Storage), same as club pages. Every save keeps the previous version with a **Restore** button, which replaces git's undo history. Page editors edit existing pages only; adding or removing a menu page is an IT Director job (code change). Replaces the GitHub-based Decap/Sveltia editor, which would have needed a GitHub account for every editor each year.
- Existing WordPress pages converted once at migration.
- Content page editors manage *(builder call on shape)*:
  - **Meetings & Updates:** dated entries (title, date, body, optional attachment). These replace the blog posts.
  - **Documents:** title, category, uploaded PDF (Supabase Storage, within the free plan's 1 GB) or a Google Drive link for large files.
  - **Sponsors:** name, logo, link, tier/order.
  - **Calendar:** the `/calendar` page embeds the Hippo Google Calendar. Approved bookings appear there automatically (see Room booking).
- **All council pages are public** (Noor: only room booking needs login today). The code repo can still be **public**, which helps future directors get help; it still never contains PII or secrets. Members-only pages are not built now.
- **Contact form** (parity): real form at `/contact` → `/api/contact` → email to `hippoit@uwo.ca`; Cloudflare Turnstile spam protection; submissions not stored *(builder call)*.

### Infrastructure and accounts
- GitHub org owned by `hippoit@uwo.ca`, Hippo President as second owner. Two repos: the website (site code + `docs/` vault) and MedFriend (private; its maintainers get write access to it only, not to the site code).
- Cloudflare account owned by `hippoit@uwo.ca`; nameserver move in early December, domain transfer May–June 2027. Pages project deployed from GitHub Actions; the beta site is `uwomeds.pages.dev`, on `hippoit@uwo.ca` accounts from the start (Noor, 2026-11-05: no personal-account phase). R2 bucket for MedFriend decks.
- Supabase project owned by `hippoit@uwo.ca` (free tier), **Canada (Central) region**. Service-role key only in Cloudflare/GitHub secrets — never in the repo or Claude.
- Google account/shared Drive owned by Hippo for calendar + service account.
- Backblaze B2 account owned by `hippoit@uwo.ca`, CA East (Toronto), for backups.
- Secrets in Bitwarden (org vault) + platform secret stores.

### Automations (GitHub Actions)
- Nightly Supabase `pg_dump` → private **Backblaze B2 bucket in Toronto**, 30-day retention (R2 can't be pinned to Canada; [privacy gaps](https://github.com/nsimsam/hippo_website/issues/25)); also keeps the free Supabase project from pausing. A monthly check (Action or by hand) confirms backups are arriving (Noor, 2026-10-25: free plan, not Pro at ≈ CA$420/yr).
- Renewal reminders: `docs/overview/costs-and-renewals` holds dates as data; a monthly Action opens a GitHub issue 30 days before any renewal.
- CI on every PR: build, type-check, RLS tests, Playwright smoke test of login + booking against local Supabase.

### Docs vault (`docs/`, Obsidian-readable)
`START-HERE.md`; `overview/` (architecture, accounts — no secrets, costs-and-renewals); `runbooks/` (annual-handover [already drafted], onboard-club-execs, add-or-remove-a-club, room-booking, edit-a-page, login-problems, restore-a-backup, domain-and-dns, privacy-requests, medfriend, using-claude, problem-reports); `contacts/people-and-roles.md` (roles, not personal info); `log/decisions/` + yearly logs (first entry: the Oct 2026 login CSS fix); `archive/wordpress-era.md`. Root `CLAUDE.md` + `.claude/skills/` (onboard-club-execs, update-page, renewal-audit, annual-handover).

### Safeguards for IT Directors who can't code (Noor, 2026-10-25)
- **Technical fallback, by role not name** (in the annual-handover runbook): the previous IT Director for the year after handover, plus an Open-Source Medicine or AI in Medicine club exec (MedFriend maintainers already work in GitHub). No paid contractor on retainer; if paid help is ever needed, the director asks council then.
- **No Hippo-paid Claude.** The budget saving goes back to council.
- **No Google Sites plan B.** A short "site is down" section in the handover runbook instead: post a notice and take bookings by email to `roombooking.schulich@gmail.com`, as before. Abandoning the site for good would be a fresh council decision.

## Migration and launch
0. **Inventory check (Noor → Claude):** Site Health info (copied to clipboard), screenshots of Plugins, WPForms forms, menus and user role counts, plus cPanel email accounts, forwarders, cron jobs and DNS zone. Also the old handover document (without credentials) and a list of linked Google items. Compare all of it against this design and add anything missing. Never the full WordPress export XML, because it contains user PII.
1. **Now (while WordPress access works):** export Clubs XML with ACF fields, page content, media, room-booking form fields; turn off Bluehost auto-updates. **All 521 user accounts (name, email, role) and the stored form submissions migrate** via an import script Noor runs locally (Noor, 2026-10-24); passwords don't.
   - **Domain email check:** public DNS (checked 2026-10-24) shows nameservers at Bluehost, `MX 0 mail.uwomeds.com` and SPF `v=spf1 a mx include:websitewelcome.com ~all`, i.e. mail for the domain is routed to Bluehost. Before any DNS move, check cPanel → Email Accounts / Forwarders and any other DNS records (verification TXT, subdomains); recreate what's in use on Cloudflare and merge the new sender's SPF/DKIM/DMARC with it.
2. **Build (hands-off; [how the build is carried out](https://github.com/nsimsam/hippo_website/issues/9)):** agents build task by task on a `build` branch deployed to the beta site `uwomeds.pages.dev` on `hippoit@uwo.ca` accounts, with fake data until the real import. Noor merges into the live site once, after beta sign-off.
3. **Council, Nov 11 ([decision](https://github.com/nsimsam/hippo_website/issues/8)):** Noor presents the working beta for council's thoughts, no motion; brief to the VP Internal by Nov 6. If council objects, nothing switches over or is cancelled; it comes back Dec 9.
4. **Exec beta (late Nov):** accounts move to `hippoit@uwo.ca`; Brevo records added in Bluehost DNS and the deliverability gate passed; Noor runs the real import; testers are Noor (as Open-Source Medicine president), the booking admin and one Windsor club exec. MedFriend is built alongside.
5. **Nameserver move (early Dec, or January):** on its own, every record copied unchanged into the `hippoit@uwo.ca` Cloudflare account; rollback by restoring Bluehost's nameservers.
6. **Switch-over (mid–late Dec, fallback mid-Feb):** `@`/`www` pointed at Pages, with a **2-week rollback window** (point back to Bluehost and re-enable the WordPress forms). Noor uploads the exec spreadsheet; MedFriend's repo moves to the Hippo org and goes private, and the old address becomes the moved notice. Announced in council chat.
7. **Wind-down:** delete the old WordPress (and Noor's local backup) 30 days after the switch-over; Elementor Pro auto-renew off before Mar 23 2027; domain transfer May–early June 2027 (Noor); Bluehost mail records removed when hosting lapses in May 2029.

The dated build steps are in the build plan's Schedule.

## Privacy ([decision](https://github.com/nsimsam/hippo_website/issues/25))
- **Where data lives:** database in Canada (Supabase, Canada Central), backups in Canada (Backblaze B2, Toronto), email copies in the EU (Brevo), kept 1 month with previews off.
- **Staff emails are link-only** ("see /admin"); a student's own confirmation may repeat their details; contact-form emails keep the message.
- **`/privacy`**: what's collected, why, who sees it, where, how long, and how to ask for correction or deletion (`hippoit@uwo.ca`; removes the account and live data, past bookings stay in the archive as the council record). One line above each form's submit button links to it and names that form's contact: booking → the campus's booking admin address (Facilities Assistance); club event report → Community Relations Director; sign-in, contact, problem report, club editing and MedFriend → `hippoit@uwo.ca`.
- **`/terms`** and the **security headers** (builder call, 2026-11-03, after reviewing matchright.net): a short terms of use page beside `/privacy`, with a MedFriend section (student-made, not official curriculum or medical advice) shown to each reader once; a strict security policy on the council site and a looser one for MedFriend's hand-built pages. Plan Tasks 23, 26 and 30.
- **Old site:** the WordPress database and files are deleted 30 days after the switch-over.

## Constraints and rules
- No student PII in repo, docs, issues or research branches; seed data is fake. **Deliberate exception** (Noor, 2026-10-25): Claude may see the exec roster and imported account names and emails during the import and beta, never old form submissions (Noor runs that part and shares counts).
- Supabase service-role key never given to Claude or committed.
- Form submissions and emails are untrusted input; agents only read/summarize them.
- No switch-over if council objects at the Nov 11 presentation.

## Left to the builder
Framework details, component library, styling (keep current Hippo branding/colours/logo), table schemas beyond the above, test tooling.

## Still open (not blocking design)
- Whether approved bookings reach the Google Calendar automatically today. The calendar itself is owned by `roombooking.schulich@gmail.com`.
- ~~Council approval~~ Settled: presented on Nov 11 for council's thoughts, no motion.
- ~~Whether Western/Schulich privacy rules require Canadian data residency~~ Settled by [Western's rules research](https://github.com/nsimsam/hippo_website/issues/7): no Canada-only requirement; no student data in public AI tools. Supabase stays in Canada (Central) anyway.


## Verification (how we know it's done)
- RLS tests prove: a club editor cannot edit another club; an exec on the uploaded spreadsheet can edit from their first sign-in, and one removed from it cannot; a student cannot read others' bookings; an email outside @meds.uwo.ca and @uwo.ca cannot sign in unless on `allowed_emails`; a signed-out visitor gets no MedFriend file, JSON or deck; only site admins can change `allowed_emails` or roles.
- Playwright: sign in with code → submit booking → admin approves → calendar event created (mocked in CI, real on beta).
- Beta sign-off from Noor, the booking admin and one Windsor club exec.
- Handover dry run: someone other than Noor follows `docs/START-HERE.md` to add a club editor, edit a page, and restore a backup, without asking her.

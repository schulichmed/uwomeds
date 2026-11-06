# Design: the council's handbook (redesign branch)

The `redesign` look for uwomeds.com, chosen by Noor on 2026-11-06 ("Orientation Handbook"). It applies only to the `redesign` branch; `build` keeps today's look. Tokens live in `src/styles/global.css` (`:root`) and are mirrored in `.impeccable/design.json`.

## Idea

The site reads like the council's own orientation handbook: a purple cover, four colour-coded sections, a planner-style calendar, and real Schulich photos. Purple marks where you are and what to do next.

## Colour

| Token | Value | Use |
|---|---|---|
| `--purple` | `#582c83` | Hippo purple: cover band, buttons, links, current day, "today" |
| `--purple-dark` | `#45226a` | Hover on purple |
| `--purple-deep` | `#2e1747` | Footer (the back cover) |
| `--purple-tint` / `--purple-line` | `#f1ebf8` / `#d7cbe6` | Notices, London badge, selected tint |
| `--n0` to `--n7` | `#ffffff` `#f7f5fb` `#efecf5` `#dcd6e6` `#8a8199` `#625a70` `#453e52` `#241d31` | The only neutral ramp (purple-tinted). `--n4` is the lightest allowed for input borders (3:1); `--n5` and darker for text |
| `--council` | `#582c83` | Council section |
| `--resources` | `#0f6b5c` | Resources section |
| `--involvement` / `--involvement-ink` | `#e2a72e` / `#7d5300` | Involvement section (fill / text-safe) |
| `--medfriend` | `#c2412d` | MedFriend section |
| ok / warn / bad | `#1d6a3a` / `#6f4700` / `#9b1c1c` with tinted backgrounds | State only |

Section colour rules: a page's section (from `src/components/sections.ts`) sets `--sec` on `body[data-section]`. It appears in exactly three places: the menu swatch and current-section underline, the 6px rule across the top of `main`, and the thumb index on the right edge (desktop, 1240px and wider). Never use a section colour for text unless it is the `-ink` variant.

## Type

Archivo variable (weight 100 to 900, width 62% to 125%), self-hosted via `@fontsource-variable/archivo`.

- Display (home h1): 800, `font-stretch: 122%`, `clamp(3rem, 8vw, 5.5rem)`, tracking -0.025em.
- Page h1: 800, stretch 112%, `clamp(2rem, 4.6vw, 3.1rem)`.
- h2: 700, stretch 104%, 1.4rem. Body: 17px, line-height 1.55, max 72ch.
- Labels (weekday heads, thumb tabs, badges): condensed (75 to 85%), 700, uppercase only for weekday heads and thumb tabs.
- Numbers are tabular everywhere.

## Shape and depth

Radii: 8px controls, 12px cards, 14px large surfaces and photos, pills only for badges. One shadow token (`--shadow`) for raised surfaces (home task cards, menus); everything else is a 1px `--n3` border. No gradients, no glass.

## Components

- **Home cover**: purple band, h1 and one sentence left, photo right (stacked on phones). Six task cards overlap the band's lower edge, each with a small section-colour tab on top; the whole card is the link.
- **Section photo**: one wide photo per landing page under the section rule (`src/components/photos.ts` maps paths to photos). Decorative (`alt=""`); none on admin, edit, club or MedFriend pages.
- **Sign-in pages**: form beside a photo (layout only; hidden under 860px).
- **Calendar**: planner grid: 3px top rule, condensed weekday heads, big day numbers, event chips with a dot (purple = calendar event, green = approved booking), purple tint for today. Under 640px only the agenda shows.
- **Club cards**: white, 1px border, whole card clickable, purple border on hover; campus and category badges.
- **Buttons and inputs**: 44px minimum height; 1.5px `--n4` input border; 3px purple focus ring.

## Photos

Self-hosted WebP copies of Schulich School of Medicine & Dentistry photos in `public/photos/`, used with Noor's OK (2026-11-06); the footer credits Schulich and `photos.ts` records each source. To change a photo, replace the file and its entry in `photos.ts`.

## Motion

Short ease-out transitions only (card lift on hover, thumb tab slide, menu chevron). All of it is turned off under `prefers-reduced-motion`.

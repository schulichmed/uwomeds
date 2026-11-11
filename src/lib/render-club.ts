/**
 * HTML for club cards and club pages, rendered on the server from the clubs database
 * (plan Task 5). Every value is escaped here.
 */
import { esc } from './escape';
import { href } from './paths';
import { detectNetwork, instagramHandle, networkIcon, NETWORK_LABEL } from './socials';
import { CATEGORIES_BY_SLUG, CATEGORY_LABEL, type ClubCategory } from '../data/club-categories';
import type { Club } from './types';

const CAMPUS_NAME = { london: 'London', windsor: 'Windsor' } as const;

export function categoriesOf(club: Club): ClubCategory[] {
  return club.categories ?? CATEGORIES_BY_SLUG[club.slug] ?? [];
}

function categoryBadge(club: Club): string {
  return categoriesOf(club)
    .map((cat) => `<span class="badge badge-category">${esc(CATEGORY_LABEL[cat])}</span>`)
    .join(' ');
}

export function campusBadges(club: Club): string {
  if (!club.campuses.length) return '<span class="badge badge-none">Campus not listed</span>';
  return club.campuses.map((c) => `<span class="badge badge-${c}">${CAMPUS_NAME[c]}</span>`).join(' ');
}

function paragraphs(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function clubCardHtml(club: Club): string {
  const summary = club.description.trim().split(/\n/)[0] ?? '';
  return `<li class="club-card" data-campuses="${esc(club.campuses.join(' '))}" data-categories="${esc(categoriesOf(club).join(' '))}" data-name="${esc(club.name.toLowerCase())}">
  <h2><a href="${href(`/clubs/${club.slug}/`)}">${esc(club.name)}</a></h2>
  <p class="badges">${campusBadges(club)} ${categoryBadge(club)}</p>
  ${summary ? `<p class="summary">${esc(summary.length > 140 ? `${summary.slice(0, 137)}...` : summary)}</p>` : ''}
</li>`;
}

export interface ClubPageOptions {
  /** The signed-in user edits this club (on its roster) or is a club admin. */
  isOwnExec: boolean;
  /** site_settings.instagram_embed_enabled */
  instagramEmbed: boolean;
}

/** One icon link per club link, and an Instagram profile card. Nothing loads from Instagram
 *  until "Show recent Instagram posts" is pressed (src/pages/clubs/[slug]/index.astro). */
function socialsHtml(club: Club, opts: ClubPageOptions): string {
  const links = club.links.filter(Boolean);
  if (!links.length) {
    return opts.isOwnExec
      ? `<section class="club-socials" aria-labelledby="socials-h"><h2 id="socials-h">Find us online</h2><p class="notice"><a href="${href(`/clubs/${club.slug}/edit/`)}">Add your club's socials</a></p></section>`
      : '';
  }
  const icons = links
    .map((url) => {
      const network = detectNetwork(url);
      return `<li><a class="social-link" href="${esc(url)}" rel="noopener" aria-label="${esc(`${club.name} on ${NETWORK_LABEL[network]}`)}">${networkIcon(network)}<span>${NETWORK_LABEL[network]}</span></a></li>`;
    })
    .join('');
  const handle = links.map(instagramHandle).find((h): h is string => !!h);
  const embed = opts.instagramEmbed && handle
    ? `<button type="button" class="button secondary" data-ig-toggle="${esc(handle)}" aria-expanded="false" aria-controls="ig-panel">Show recent Instagram posts</button>
  <div id="ig-panel" class="ig-panel" hidden></div>`
    : '';
  const card = handle
    ? `<div class="ig-card">
  <div class="ig-head">${networkIcon('instagram')}<div><strong>@${esc(handle)}</strong><br><a href="https://www.instagram.com/${esc(handle)}/" rel="noopener">Open on Instagram</a></div></div>
  ${embed}
</div>`
    : '';
  return `<section class="club-socials" aria-labelledby="socials-h"><h2 id="socials-h">Find us online</h2><ul class="social-list">${icons}</ul>${card}</section>`;
}

function execsHtml(club: Club): string {
  if (!club.execs.length) return '';
  const items = club.execs
    .map(
      (e) => `<li class="exec">
  <span class="avatar" aria-hidden="true">${esc(e.name.trim().charAt(0) || '?')}</span>
  <div><strong>${esc(e.name)}</strong><br><span class="muted">${esc(e.role)}</span>${
    e.showEmail && e.email ? `<br><a href="mailto:${esc(e.email)}">${esc(e.email)}</a>` : ''
  }</div>
</li>`,
    )
    .join('');
  return `<section aria-labelledby="execs-h"><h2 id="execs-h">Executive team</h2><ul class="exec-grid">${items}</ul></section>`;
}

/** The body of a club page: logo, description, socials, execs, announcements. */
export function clubPageHtml(club: Club & { announcements?: string; logoUrl?: string | null }, opts: ClubPageOptions): string {
  const editUrl = href(`/clubs/${club.slug}/edit/`);
  const nudge =
    opts.isOwnExec && !club.description.trim()
      ? `<div class="notice"><a href="${editUrl}">Add your club's description</a></div>`
      : '';
  const edit = opts.isOwnExec ? `<p><a class="button" href="${editUrl}">Edit this club</a></p>` : '';
  const logo = club.logoUrl ? `<img class="club-logo" src="${esc(club.logoUrl)}" alt="${esc(club.name)} logo" width="120" height="120">` : '';
  const news = club.announcements?.trim()
    ? `<section class="club-announcements" aria-labelledby="news-h"><h2 id="news-h">Announcements</h2>${paragraphs(club.announcements)}</section>`
    : '';
  return `${logo}<p class="badges">${campusBadges(club)} ${categoryBadge(club)}</p>
${edit}${nudge}
${club.description.trim() ? `<section class="club-description">${paragraphs(club.description)}</section>` : ''}
${socialsHtml(club, opts)}
${execsHtml(club)}
${news}`;
}

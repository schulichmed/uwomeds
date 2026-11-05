/**
 * HTML for club cards and club pages. Shared by the build (seed data) and the
 * browser (re-render from localStorage after an exec saves), so both look the same.
 */
import { esc } from './escape';
import { href } from './paths';
import { detectNetwork, instagramHandle, networkIcon, NETWORK_LABEL } from './socials';
import type { Club } from './types';

const CAMPUS_NAME = { london: 'London', windsor: 'Windsor' } as const;

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
  return `<li class="club-card" data-campuses="${esc(club.campuses.join(' '))}" data-name="${esc(club.name.toLowerCase())}">
  <h2><a href="${href(`/clubs/${club.slug}/`)}">${esc(club.name)}</a></h2>
  <p class="badges">${campusBadges(club)}</p>
  ${summary ? `<p class="summary">${esc(summary.length > 140 ? `${summary.slice(0, 137)}...` : summary)}</p>` : ''}
</li>`;
}

function socialsHtml(club: Club): string {
  const links = club.links.filter(Boolean);
  if (!links.length) return '';
  const icons = links
    .map((url) => {
      const network = detectNetwork(url);
      return `<li><a class="social-link" href="${esc(url)}" rel="noopener" aria-label="${esc(`${club.name} on ${NETWORK_LABEL[network]}`)}">${networkIcon(network)}<span>${NETWORK_LABEL[network]}</span></a></li>`;
    })
    .join('');
  const handle = links.map(instagramHandle).find((h): h is string => !!h);
  const card = handle
    ? `<div class="ig-card">
  <div class="ig-head">${networkIcon('instagram')}<div><strong>@${esc(handle)}</strong><br><a href="https://www.instagram.com/${esc(handle)}/" rel="noopener">Open on Instagram</a></div></div>
  <button type="button" class="button secondary" data-ig-toggle aria-expanded="false" aria-controls="ig-panel">Show recent Instagram posts</button>
  <div id="ig-panel" class="ig-panel" hidden>
    <p><strong>Demo:</strong> on the real site, Instagram's free profile embed (about six recent posts from @${esc(handle)}) loads here, only after this button is clicked. Nothing is loaded from Instagram in this demo.</p>
  </div>
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

/** The body of a club page. `isOwnExec` adds the edit button and the empty-page nudge. */
export function clubPageHtml(club: Club, isOwnExec: boolean): string {
  const editUrl = href(`/clubs/${club.slug}/edit/`);
  const missing = !club.description.trim() || !club.links.length;
  const nudge =
    isOwnExec && missing
      ? `<div class="notice"><a href="${editUrl}">Add your club's description and socials</a></div>`
      : '';
  const edit = isOwnExec ? `<p><a class="button" href="${editUrl}">Edit this club</a></p>` : '';
  return `<p class="badges">${campusBadges(club)}</p>
${edit}${nudge}
${club.description.trim() ? `<section class="club-description">${paragraphs(club.description)}</section>` : ''}
${socialsHtml(club)}
${execsHtml(club)}`;
}

/** Runs on every page: demo banner, header sign-in state, menu, flash messages. */
import { esc } from '../lib/escape';
import { href } from '../lib/paths';
import { canEditClub, forgetClubUndo, getClub, getSession, isAnyAdmin, resetDemo, setFlash, signIn, signOut, takeClubUndo, takeFlash, undoClubSave } from '../lib/store';

document.documentElement.classList.add('js');

const session = getSession();

// Demo persona switcher
const select = document.getElementById('persona-select') as HTMLSelectElement | null;
if (select) {
  select.value = session?.email ?? '';
  if (session && select.value !== session.email) {
    const opt = new Option(`Signed in as ${session.email}`, session.email);
    select.add(opt, 1);
    select.value = session.email;
  }
  select.addEventListener('change', () => {
    if (select.value) signIn(select.value);
    else signOut();
    window.location.reload();
  });
}

document.getElementById('reset-demo')?.addEventListener('click', () => {
  resetDemo();
  window.location.href = href('/');
});

// Header: Login / Sign out, My club, Admin
const auth = document.getElementById('auth-area');
if (auth && session) {
  const parts: string[] = [`<span class="signed-in-as">Signed in as <strong>${esc(session.name)}</strong></span>`];
  if (session.clubSlug && canEditClub(session, session.clubSlug)) {
    const club = getClub(session.clubSlug);
    parts.push(`<a href="${href(`/clubs/${session.clubSlug}/`)}">My club${club ? `: ${esc(club.name)}` : ''}</a>`);
  }
  if (isAnyAdmin(session)) parts.push(`<a href="${href('/admin/')}">Admin</a>`);
  parts.push('<button type="button" class="button small" id="sign-out">Sign out</button>');
  auth.innerHTML = parts.join('');
  document.getElementById('sign-out')?.addEventListener('click', () => {
    signOut();
    window.location.href = href('/');
  });
}

// Mobile menu toggle
const toggle = document.querySelector<HTMLButtonElement>('.menu-toggle');
const nav = document.getElementById('site-nav');
toggle?.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!open));
  nav?.classList.toggle('open', !open);
});

// Only one dropdown open at a time; close on outside click or Escape
const dropdowns = Array.from(document.querySelectorAll<HTMLDetailsElement>('.site-nav details'));
dropdowns.forEach((d) =>
  d.addEventListener('toggle', () => {
    if (d.open) dropdowns.filter((o) => o !== d).forEach((o) => (o.open = false));
  }),
);
document.addEventListener('click', (ev) => {
  if (!(ev.target instanceof Node) || !nav?.contains(ev.target)) dropdowns.forEach((d) => (d.open = false));
});
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  const open = dropdowns.find((d) => d.open);
  if (open) {
    open.open = false;
    open.querySelector('summary')?.focus();
  }
});

// One-shot flash message after a redirect
const flash = takeFlash();
const flashEl = document.getElementById('flash');
if (flash && flashEl) {
  flashEl.textContent = flash;
  flashEl.hidden = false;
  // After a club save, offer to put the page back. Offered once: leaving the page drops it.
  const undoSlug = takeClubUndo();
  if (undoSlug && window.location.pathname.includes(`/clubs/${undoSlug}/`)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'button small secondary';
    btn.textContent = 'Undo';
    btn.style.marginLeft = '8px';
    btn.addEventListener('click', () => {
      undoClubSave();
      setFlash('Undone. Your club page is back to how it was.');
      window.location.reload();
    });
    flashEl.append(' ', btn);
  } else forgetClubUndo();
} else forgetClubUndo();

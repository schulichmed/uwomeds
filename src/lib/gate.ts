/** Page guards. In the real site the server and row-level security enforce these. */
import { esc } from './escape';
import { currentPath, href } from './paths';
import { getSession } from './store';
import type { Session } from './types';

/** Send a signed-out visitor to sign in, then back here. */
export function requireSignIn(): Session | null {
  const session = getSession();
  if (!session) {
    const next = currentPath() + window.location.search;
    window.location.replace(href(`/login/?next=${encodeURIComponent(next)}`));
  }
  return session;
}

/** Replace `el`'s content with a 403-style message. */
export function showForbidden(el: HTMLElement, message: string, detail = ''): void {
  el.innerHTML = `<div class="forbidden" role="alert">
  <p class="muted">403: not allowed</p>
  <h1>${esc(message)}</h1>
  ${detail ? `<p>${esc(detail)}</p>` : ''}
  <p><a href="${href('/')}">Back to the home page</a></p>
</div>`;
}

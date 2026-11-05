/** Turn a site path ("/clubs/") into a URL under the GitHub Pages base ("/uwomeds/clubs/"). */
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function href(path: string): string {
  const match = /^([^?#]*)(.*)$/.exec(path.startsWith('/') ? path : `/${path}`);
  let pathname = match?.[1] ?? '/';
  const suffix = match?.[2] ?? '';
  const lastSegment = pathname.split('/').pop() ?? '';
  if (!pathname.endsWith('/') && !lastSegment.includes('.')) pathname += '/';
  return `${BASE}${pathname}${suffix}`;
}

/** The current page path with the base removed, e.g. "/clubs/surgery-interest-group/". */
export function currentPath(): string {
  const p = window.location.pathname;
  return p.startsWith(BASE) ? p.slice(BASE.length) || '/' : p;
}

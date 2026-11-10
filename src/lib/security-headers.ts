/**
 * Security headers (plan Task 30). The single source for both places headers are set:
 * `dist/_headers` for static pages (written at build time by the integration in
 * astro.config.mjs) and src/middleware.ts for server-rendered pages, because Cloudflare
 * Pages doesn't apply `_headers` to Function responses.
 */

const COMMON: Record<string, string> = {
  // No includeSubDomains or preload while mail subdomains still sit at Bluehost.
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
};

const SITE_CSP = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co",
  "font-src 'self'",
  "connect-src 'self' https://*.supabase.co",
  // Turnstile (Task 13), Instagram (Task 5), Google Calendar and Sheets embeds (Task 15).
  'frame-src https://challenges.cloudflare.com https://www.instagram.com https://calendar.google.com https://docs.google.com',
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

const MEDFRIEND_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://i.ytimg.com",
  "media-src 'self'",
  "frame-src 'self' https://www.youtube-nocookie.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');

export const SITE_HEADERS: Record<string, string> = {
  ...COMMON,
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': SITE_CSP,
};

/** MedFriend's hand-built pages use inline scripts, Google Fonts and YouTube (Task 26). */
export const MEDFRIEND_HEADERS: Record<string, string> = {
  ...COMMON,
  'X-Frame-Options': 'SAMEORIGIN',
  'Content-Security-Policy': MEDFRIEND_CSP,
};

/** Cloudflare Pages `_headers` text: a path line, then indented `Name: value` lines. */
export function toHeadersFile(rules: Record<string, Record<string, string>>): string {
  return Object.entries(rules)
    .map(([path, headers]) => [path, ...Object.entries(headers).map(([k, v]) => `  ${k}: ${v}`)].join('\n'))
    .join('\n\n')
    .concat('\n');
}

/**
 * The whole `_headers` file: the council site's headers everywhere, and MedFriend's looser
 * ones under /medfriend/. Cloudflare joins a header set by two matching rules with a comma,
 * so the MedFriend rule first detaches (`! Name`) the two it replaces.
 */
export function siteHeadersFile(): string {
  const replaced = Object.keys(MEDFRIEND_HEADERS).filter((k) => SITE_HEADERS[k] !== MEDFRIEND_HEADERS[k]);
  const medfriend = [
    '/medfriend/*',
    ...replaced.map((k) => `  ! ${k}`),
    ...replaced.map((k) => `  ${k}: ${MEDFRIEND_HEADERS[k]}`),
  ].join('\n');
  return `${toHeadersFile({ '/*': SITE_HEADERS }).trimEnd()}\n\n${medfriend}\n`;
}

/** Read a `_headers` file back into rules (used by the tests). Detach lines are skipped. */
export function parseHeadersFile(text: string): Record<string, Record<string, string>> {
  const rules: Record<string, Record<string, string>> = {};
  let current: Record<string, string> | null = null;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim()) continue;
    if (!/^\s/.test(line)) {
      current = rules[line.trim()] = {};
    } else if (current && !line.trim().startsWith('!')) {
      const i = line.indexOf(':');
      current[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
  }
  return rules;
}

/** Add any of `headers` the response doesn't already set. */
export function applyHeaders(res: Response, headers: Record<string, string>): void {
  for (const [k, v] of Object.entries(headers)) if (!res.headers.has(k)) res.headers.set(k, v);
}

/**
 * Purpose: copy MedFriend (a checkout of schulichmed/preclerkship) into the built site at
 *          dist/medfriend/, so it is part of uwomeds.com instead of an embed (plan Task 25).
 *          schulichmed/preclerkship itself is never changed.
 * Usage:   node scripts/prepare-medfriend.mjs <medfriend-checkout> dist/medfriend
 * Copies:  everything except Anki decks (any .apkg), tools/, .github/ and dotfiles. Fails on
 *          any other file over Cloudflare Pages' 25 MiB limit.
 * Rewrites each .html page:
 *   - adds the uwomeds.com bar (logo and menu) at the top of the page;
 *   - links to schulichmed.github.io/preclerkship/ point to /medfriend/ (og:url and canonical
 *     to https://uwomeds.com/medfriend/);
 *   - Anki deck links point to the decks on schulichmed.github.io until the R2 bucket exists
 *     (plan Task 0B); their paths and SHA-256 are returned for that later sync;
 *   - the Cloudflare Web Analytics beacon is removed (the site has no analytics).
 */
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MAX_BYTES = 25 * 1024 * 1024;
const OLD_ORIGIN = 'https://schulichmed.github.io/preclerkship/';
const PUBLIC_URL = 'https://uwomeds.com/medfriend/';

const MENU = [
  ['Council', '/council/'],
  ['Club Directory', '/clubs/'],
  ['Room Booking', '/room-booking/'],
  ['MedFriend', '/medfriend/'],
  ['Contact', '/contact/'],
];

export const SITE_BAR = `<nav class="uwomeds-bar" aria-label="uwomeds.com"><a class="uwomeds-bar-home" href="/"><img src="/hippo-logo.png" alt="Hippocratic Council" width="106" height="32"></a><ul>${MENU.map(
  ([label, url]) => `<li><a href="${url}"${label === 'MedFriend' ? ' aria-current="page"' : ''}>${label}</a></li>`,
).join('')}</ul></nav>`;
const BAR_CSS = '<link rel="stylesheet" href="/medfriend-bar.css">';

function skip(rel) {
  const parts = rel.split('/');
  return (
    rel.endsWith('.apkg') ||
    parts[0] === 'tools' ||
    parts[0] === '.github' ||
    parts.some((p) => p.startsWith('.'))
  );
}

/** Rewrite one MedFriend HTML page (relPath is its path inside MedFriend, with /). */
export function rewriteHtml(html, relPath) {
  const dir = posix.dirname(relPath);
  let out = html
    // Absolute links to the meta tags that must stay absolute.
    .replace(/(<meta\s+property="og:(?:url|image)"\s+content=")https:\/\/schulichmed\.github\.io\/preclerkship\//g, `$1${PUBLIC_URL}`)
    .replace(/(<link\s+rel="canonical"\s+href=")https:\/\/schulichmed\.github\.io\/preclerkship\//g, `$1${PUBLIC_URL}`)
    // Everything else becomes a site path.
    .split(OLD_ORIGIN)
    .join('/medfriend/')
    // No analytics.
    .replace(/<script[^>]*static\.cloudflareinsights\.com[^>]*><\/script>\s*/g, '')
    // Decks stay on GitHub Pages for now.
    .replace(/(href=["'])([^"'#?]+\.apkg)(["'])/g, (_m, a, href, b) => {
      if (/^https?:/.test(href)) return `${a}${href}${b}`;
      const target = href.startsWith('/medfriend/') ? href.slice('/medfriend/'.length) : posix.normalize(posix.join(dir, href));
      return `${a}${OLD_ORIGIN}${target}${b}`;
    });
  out = out.includes('</head>') ? out.replace('</head>', `${BAR_CSS}\n</head>`) : out;
  out = out.replace(/<body([^>]*)>/, `<body$1>\n${SITE_BAR}`);
  return out;
}

export function prepareMedfriend(src, dest) {
  const decks = [];
  let copied = 0;
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const abs = join(dir, name);
      const rel = relative(src, abs).split(sep).join('/');
      const st = statSync(abs);
      if (st.isDirectory()) {
        if (!skip(`${rel}/`)) walk(abs);
        continue;
      }
      if (rel.endsWith('.apkg')) {
        decks.push({ path: rel, sha256: createHash('sha256').update(readFileSync(abs)).digest('hex') });
        continue;
      }
      if (skip(rel)) continue;
      if (st.size > MAX_BYTES) throw new Error(`file over 25 MiB: ${rel}`);
      const out = join(dest, rel);
      mkdirSync(dirname(out), { recursive: true });
      if (rel.endsWith('.html')) writeFileSync(out, rewriteHtml(readFileSync(abs, 'utf8'), rel));
      else copyFileSync(abs, out);
      copied++;
    }
  };
  walk(src);
  return { copied, decks };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [src, dest] = process.argv.slice(2);
  if (!src || !dest) {
    console.error('Usage: node scripts/prepare-medfriend.mjs <medfriend-checkout> <dest>');
    process.exit(2);
  }
  const { copied, decks } = prepareMedfriend(src, dest);
  console.log(`MedFriend: copied ${copied} files to ${dest}; ${decks.length} Anki decks stay on schulichmed.github.io.`);
}

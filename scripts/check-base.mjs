/**
 * Purpose: fail if any built page links to a root path outside the /uwomeds base
 *          (GitHub Pages serves this project site under /uwomeds/).
 * Usage:   pnpm build && pnpm check-links
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const BASE = '/uwomeds';
const bad = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html')) check(p);
  }
}

function check(file) {
  const html = readFileSync(file, 'utf8');
  for (const m of html.matchAll(/\b(?:href|src|action)\s*=\s*["']([^"']*)["']/g)) {
    const url = m[1];
    if (url.startsWith('/') && !url.startsWith('//') && url !== BASE && !url.startsWith(`${BASE}/`)) {
      bad.push(`${file}: ${url}`);
    }
  }
}

walk(DIST);
if (bad.length) {
  console.error(`Links outside ${BASE}:\n${bad.join('\n')}`);
  process.exit(1);
}
console.log(`OK: every root-relative href/src in ${DIST}/ starts with ${BASE}/`);

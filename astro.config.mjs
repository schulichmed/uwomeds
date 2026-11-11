// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { writeFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import { siteHeadersFile } from './src/lib/security-headers.ts';

/** Writes dist/_headers so Cloudflare Pages sends the security headers with static pages
 *  (server-rendered pages get the same ones from src/middleware.ts). */
const securityHeaders = {
  name: 'security-headers',
  hooks: {
    /** @param {{ dir: URL }} opts */
    'astro:build:done': ({ dir }) => {
      writeFileSync(new URL('_headers', dir), siteHeadersFile());
    },
  },
};

// The real site: Astro on Cloudflare Pages, served at the root (beta: https://uwomeds.pages.dev).
// Pages stay static by default; a server route opts out with `export const prerender = false`.
// (The council demo on `main` keeps `base: '/uwomeds'` for GitHub Pages.)
export default defineConfig({
  site: 'https://uwomeds.pages.dev',
  output: 'static',
  adapter: cloudflare({
    // MedFriend's sign-in gate runs in src/worker.ts, in front of Astro (plan Task 26), so
    // every request under /medfriend/ has to reach the Function, not the static files.
    workerEntryPoint: { path: 'src/worker.ts' },
    routes: { extend: { include: [{ pattern: '/medfriend' }, { pattern: '/medfriend/*' }] } },
  }),
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [securityHeaders],
  // Never inline small scripts into the HTML: the CSP allows only scripts from files.
  vite: { build: { assetsInlineLimit: 0 } },
});

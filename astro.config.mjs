// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
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

/** Once the adapter routes everything (`/*`) to the Function, the /medfriend rules below
 *  overlap it, and Cloudflare refuses overlapping rules. Drop includes `/*` already covers.
 *  Runs after the adapter has written dist/_routes.json. */
const routesTidy = {
  name: 'routes-tidy',
  hooks: {
    /** @param {{ dir: URL }} opts */
    'astro:build:done': ({ dir }) => {
      const file = new URL('_routes.json', dir);
      if (!existsSync(file)) return;
      const routes = JSON.parse(readFileSync(file, 'utf8'));
      if (routes.include?.includes('/*')) {
        routes.include = ['/*'];
        writeFileSync(file, JSON.stringify(routes, null, 2));
      }
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
  integrations: [securityHeaders, routesTidy],
  // Never inline small scripts into the HTML: the CSP allows only scripts from files.
  vite: { build: { assetsInlineLimit: 0 } },
});

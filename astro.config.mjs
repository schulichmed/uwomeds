// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// The real site: Astro on Cloudflare Pages, served at the root (beta: https://uwomeds.pages.dev).
// Pages stay static by default; a server route opts out with `export const prerender = false`.
// (The council demo on `main` keeps `base: '/uwomeds'` for GitHub Pages.)
export default defineConfig({
  site: 'https://uwomeds.pages.dev',
  output: 'static',
  adapter: cloudflare(),
  trailingSlash: 'always',
  build: { format: 'directory' },
});

// @ts-check
import { defineConfig } from 'astro/config';

// Static demo for GitHub Pages: https://schulichmed.github.io/uwomeds/
// The real site (Astro on Cloudflare + Supabase) drops `base` and adds server routes.
export default defineConfig({
  site: 'https://schulichmed.github.io',
  base: '/uwomeds',
  output: 'static',
  trailingSlash: 'always',
  build: { format: 'directory' },
});

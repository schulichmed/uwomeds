/**
 * The site's Cloudflare entry point: the adapter's default handler, with MedFriend's sign-in
 * gate in front (plan Task 26). The gate runs before Astro because Astro's trailing-slash rule
 * would redirect /medfriend/fom/b1 to /medfriend/fom/b1/, which Pages redirects straight back.
 */
import type { SSRManifest } from 'astro';
import { App } from 'astro/app';
import { handle } from '@astrojs/cloudflare/handler';
import { gateMedfriend } from './lib/medfriend';

export function createExports(manifest: SSRManifest) {
  const app = new App(manifest);
  return {
    default: {
      async fetch(request: Request, env: Parameters<typeof gateMedfriend>[1], context: { waitUntil: (p: Promise<unknown>) => void }) {
        const { pathname } = new URL(request.url);
        if (pathname === '/medfriend' || pathname.startsWith('/medfriend/')) return gateMedfriend(request, env);
        // @ts-expect-error the handler's types expect the full Cloudflare env
        return handle(manifest, app, request, env, context);
      },
    },
  };
}

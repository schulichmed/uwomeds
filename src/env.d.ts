/// <reference types="astro/client" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

/** Runtime secrets (Cloudflare Pages secrets in production, `.dev.vars` locally). */
interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
}

declare namespace App {
  interface Locals extends Runtime {
    user: { id: string; email: string } | null;
    role: import('./lib/auth').AppRole | null;
  }
}

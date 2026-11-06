/** Supabase client for server routes. The session lives in httpOnly cookies, so every
 *  server route (and later the MedFriend gate) can see who is signed in. */
import { createServerClient as createSsrClient, parseCookieHeader } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AstroCookies } from 'astro';

interface Ctx {
  request: Request;
  cookies: AstroCookies;
  locals: App.Locals;
}

/** Null when the Supabase secrets aren't set yet (sign-in shows "not set up"). */
export function createServerClient(ctx: Ctx): SupabaseClient | null {
  const env = ctx.locals.runtime?.env;
  if (!env?.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  const secure = new URL(ctx.request.url).protocol === 'https:';
  return createSsrClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () =>
        parseCookieHeader(ctx.request.headers.get('cookie') ?? '').map((c) => ({ name: c.name, value: c.value ?? '' })),
      setAll: (list) =>
        list.forEach(({ name, value, options }) =>
          ctx.cookies.set(name, value, { ...options, path: '/', httpOnly: true, secure, sameSite: 'lax' }),
        ),
    },
  });
}

/** A readable (not httpOnly) cookie with the signed-in email, for the header on static
 *  pages. Display only: the server never trusts it. */
export const WHO_COOKIE = 'uwomeds_who';

export function setWhoCookie(ctx: Ctx, email: string): void {
  const secure = new URL(ctx.request.url).protocol === 'https:';
  ctx.cookies.set(WHO_COOKIE, email, { path: '/', sameSite: 'lax', secure, maxAge: 60 * 60 * 24 * 30 });
}

export function clearWhoCookie(ctx: Ctx): void {
  ctx.cookies.delete(WHO_COOKIE, { path: '/' });
}

/** Only same-site paths, so `next` can't send someone to another site. */
export function safeNext(raw: string | null | undefined): string {
  const n = (raw ?? '').trim();
  return n.startsWith('/') && !n.startsWith('//') && !n.startsWith('/\\') ? n : '/';
}

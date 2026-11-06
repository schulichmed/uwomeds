/** Sign out (POST only, so a link or prefetch can't sign someone out). */
import type { APIRoute } from 'astro';
import { clearWhoCookie, createServerClient } from '../lib/supabase';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const supabase = createServerClient(ctx);
  if (supabase) await supabase.auth.signOut();
  clearWhoCookie(ctx);
  return ctx.redirect('/', 303);
};

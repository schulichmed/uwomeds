/** Sets Astro.locals.user and Astro.locals.role on server routes from the Supabase session. */
import { defineMiddleware } from 'astro:middleware';
import { clearWhoCookie, createServerClient, WHO_COOKIE } from './lib/supabase';
import type { AppRole } from './lib/auth';

export const onRequest = defineMiddleware(async (ctx, next) => {
  ctx.locals.user = null;
  ctx.locals.role = null;
  if (ctx.isPrerendered) return next();

  const supabase = createServerClient(ctx);
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (data.user?.email) {
      ctx.locals.user = { id: data.user.id, email: data.user.email };
      const { data: role } = await supabase.rpc('current_app_role');
      ctx.locals.role = (role as AppRole | null) ?? null;
    }
  }
  // Keep the display cookie honest: drop it when there's no session.
  if (!ctx.locals.user && ctx.cookies.has(WHO_COOKIE)) clearWhoCookie(ctx);
  return next();
});

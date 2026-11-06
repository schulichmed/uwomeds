/** Roles, matching the database enum `public.app_role` (supabase/migrations). */
export type AppRole = 'student' | 'page_editor' | 'booking_admin' | 'community_admin' | 'site_admin';

export const APP_ROLES: readonly AppRole[] = ['student', 'page_editor', 'booking_admin', 'community_admin', 'site_admin'];

interface GuardCtx {
  url: URL;
  locals: App.Locals;
  redirect: (path: string, status?: 301 | 302 | 303 | 307 | 308) => Response;
}

/** Signed out: redirect to sign-in, then back. Signed in: null (carry on). */
export function requireUser(ctx: GuardCtx): Response | null {
  if (ctx.locals.user) return null;
  const next = ctx.url.pathname + ctx.url.search;
  return ctx.redirect(`/login/?next=${encodeURIComponent(next)}`, 303);
}

/** Signed out: as requireUser. Signed in with none of `roles`: 403. */
export function requireRole(ctx: GuardCtx, ...roles: AppRole[]): Response | null {
  const signedOut = requireUser(ctx);
  if (signedOut) return signedOut;
  if (ctx.locals.role && roles.includes(ctx.locals.role)) return null;
  return new Response('Not allowed', { status: 403 });
}

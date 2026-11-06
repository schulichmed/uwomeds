/** Roles, matching the database enum `public.app_role` (supabase/migrations). */
export type AppRole = 'student' | 'page_editor' | 'booking_admin' | 'community_admin' | 'site_admin';

export const APP_ROLES: readonly AppRole[] = ['student', 'page_editor', 'booking_admin', 'community_admin', 'site_admin'];

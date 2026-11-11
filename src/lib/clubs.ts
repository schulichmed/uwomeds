/**
 * Club queries (plan Task 5). Server pages read clubs from Supabase. Anonymous visitors see
 * exec emails only through club_execs_public, so these queries never read club_execs.
 * With no Supabase set up (local development without Docker), they fall back to the
 * built-in list in src/data/clubs.ts, so the pages still render.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { CLUBS } from '../data/clubs';
import { CATEGORIES_BY_SLUG, type ClubCategory } from '../data/club-categories';
import type { Campus, Club } from './types';

export interface ClubDetail extends Club {
  id: string | null;
  announcements: string;
  logoUrl: string | null;
}

export interface ListOptions {
  campus?: Campus;
  q?: string;
}

interface ClubRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  campuses: Campus[];
  categories: ClubCategory[];
  announcements: string;
  logo_path: string | null;
  no_logo: boolean;
  club_links?: { position: number; url: string }[];
}

interface ExecRow {
  name: string;
  role_title: string;
  email: string | null;
  is_president: boolean;
  position: number;
}

const byName = (a: { name: string }, b: { name: string }) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });

function matches(club: Club, opts: ListOptions): boolean {
  if (opts.campus && !club.campuses.includes(opts.campus)) return false;
  const q = opts.q?.trim().toLowerCase();
  return !q || club.name.toLowerCase().includes(q);
}

function fallback(slug: string): ClubDetail | null {
  const club = CLUBS.find((c) => c.slug === slug);
  if (!club) return null;
  return { ...club, categories: club.categories ?? CATEGORIES_BY_SLUG[club.slug] ?? [], id: null, announcements: '', logoUrl: null };
}

/** Every club a visitor can see (archived ones are hidden by the database), by name. */
export async function listClubs(client: SupabaseClient | null, opts: ListOptions = {}): Promise<Club[]> {
  if (!client) return CLUBS.filter((c) => matches(c, opts)).sort(byName);
  let query = client.from('clubs').select('slug, name, description, campuses, categories, club_links(position, url)');
  if (opts.campus) query = query.contains('campuses', [opts.campus]);
  const { data, error } = await query;
  if (error) throw new Error(`clubs: ${error.message}`);
  return (data as ClubRow[])
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      description: r.description,
      campuses: r.campuses,
      categories: r.categories,
      links: (r.club_links ?? []).sort((a, b) => a.position - b.position).map((l) => l.url),
      execs: [],
    }))
    .filter((c) => matches(c, opts))
    .sort(byName);
}

/** One club with its links and public exec details, or null when there's no such club. */
export async function getClub(client: SupabaseClient | null, slug: string, supabaseUrl?: string): Promise<ClubDetail | null> {
  if (!client) return fallback(slug);
  const { data, error } = await client
    .from('clubs')
    .select('id, slug, name, description, campuses, categories, announcements, logo_path, no_logo, club_links(position, url)')
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw new Error(`club: ${error.message}`);
  if (!data) return null;
  const club = data as ClubRow;
  const { data: execs, error: execError } = await client
    .from('club_execs_public')
    .select('name, role_title, email, is_president, position')
    .eq('club_id', club.id)
    .order('position');
  if (execError) throw new Error(`club execs: ${execError.message}`);
  const people = (execs as ExecRow[]).sort((a, b) => Number(b.is_president) - Number(a.is_president) || a.position - b.position);
  return {
    id: club.id,
    slug: club.slug,
    name: club.name,
    description: club.description,
    campuses: club.campuses,
    categories: club.categories,
    announcements: club.announcements,
    logoUrl:
      club.logo_path && !club.no_logo && supabaseUrl
        ? `${supabaseUrl}/storage/v1/object/public/club-media/${club.logo_path.split('/').map(encodeURIComponent).join('/')}`
        : null,
    links: (club.club_links ?? []).sort((a, b) => a.position - b.position).map((l) => l.url),
    execs: people.map((e) => ({ name: e.name, role: e.role_title, email: e.email ?? '', showEmail: !!e.email })),
  };
}

/** Is the signed-in user one of this club's editors (on its roster) or a club admin? */
export async function canEditClub(client: SupabaseClient | null, clubId: string | null): Promise<boolean> {
  if (!client || !clubId) return false;
  const [{ data: editor }, { data: admin }] = await Promise.all([
    client.rpc('is_club_editor', { club: clubId }),
    client.rpc('is_club_admin'),
  ]);
  return editor === true || admin === true;
}

/** The Instagram embed switch in site_settings (on unless a site admin turned it off). */
export async function instagramEmbedEnabled(client: SupabaseClient | null): Promise<boolean> {
  if (!client) return true;
  const { data } = await client.from('site_settings').select('value').eq('key', 'instagram_embed_enabled').maybeSingle();
  return data?.value !== false;
}

/** Club pages are public and change rarely: browsers keep them 5 minutes. A signed-in
 *  page can carry an exec's edit links, so it is never stored. */
export function setClubPageCache(headers: Headers, signedIn: boolean): void {
  headers.set('Cache-Control', signedIn ? 'private, no-store' : 'public, max-age=300');
  headers.set('Vary', 'Cookie');
}

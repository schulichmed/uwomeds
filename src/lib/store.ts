/**
 * The demo's fake back end: everything lives in this browser's localStorage,
 * seeded from src/data. Every storage access is wrapped in try/catch so the
 * site still works (with seed data) when storage is blocked.
 *
 * In the real build each function here becomes a Supabase query or an /api route.
 */
import { SAMPLE_BOOKINGS, SAMPLE_EVENTS } from '../data/bookings';
import { SAMPLE_CLUBS, SAMPLE_ROSTER } from '../data/clubs';
import { COUNCIL_PAGES } from '../data/pages';
import { PERSONAS } from '../data/people';
import type { Booking, CalendarEvent, Club, PageVersion, Role, Session } from './types';

const PREFIX = 'uwomeds-demo:v1:';
const KEY = {
  session: `${PREFIX}session`,
  pendingSignIn: `${PREFIX}pending-sign-in`,
  clubs: `${PREFIX}clubs`,
  bookings: `${PREFIX}bookings`,
  pages: `${PREFIX}pages`,
  reportCounter: `${PREFIX}report-counter`,
  flash: `${PREFIX}flash`,
};

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function remove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* storage blocked: nothing to remove */
  }
}

export function resetDemo(): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* storage blocked: nothing stored */
  }
}

/* ---------- Session and roles ---------- */

export function getSession(): Session | null {
  return read<Session | null>(KEY.session, null);
}

export function roleForEmail(email: string): { role: Role; name: string; clubSlug?: string } {
  const persona = PERSONAS.find((p) => p.email === email);
  if (persona) return { role: persona.id, name: persona.name, clubSlug: persona.clubSlug };
  const rosterRow = SAMPLE_ROSTER.find((r) => r.email === email);
  const exec = rosterRow ? getClub(rosterRow.clubSlug)?.execs.find((e) => e.email === email) : undefined;
  if (rosterRow) return { role: 'club_exec', name: exec?.name ?? email, clubSlug: rosterRow.clubSlug };
  return { role: 'student', name: email.split('@')[0] };
}

export function signIn(email: string): Session {
  const info = roleForEmail(email);
  const session: Session = { email, name: info.name, role: info.role, clubSlug: info.clubSlug };
  write(KEY.session, session);
  return session;
}

export function signOut(): void {
  remove(KEY.session);
}

export function startSignIn(email: string): string {
  const code = String(Math.floor(100000 + Math.random() * 900000));
  write(KEY.pendingSignIn, { email, code });
  return code;
}

export function getPendingSignIn(): { email: string; code: string } | null {
  return read<{ email: string; code: string } | null>(KEY.pendingSignIn, null);
}

export function clearPendingSignIn(): void {
  remove(KEY.pendingSignIn);
}

export function isBookingAdmin(s: Session | null): boolean {
  return !!s && (s.role === 'booking_admin' || s.role === 'site_admin');
}

export function isPageEditor(s: Session | null): boolean {
  return !!s && (s.role === 'page_editor' || s.role === 'site_admin');
}

/** Only a club exec on that club's roster may edit it (plan Task 4's is_club_editor). */
export function canEditClub(s: Session | null, slug: string): boolean {
  return !!s && SAMPLE_ROSTER.some((r) => r.clubSlug === slug && r.email === s.email);
}

/* ---------- Flash message (one-shot notice shown after a redirect) ---------- */

export function setFlash(message: string): void {
  write(KEY.flash, message);
}

export function takeFlash(): string | null {
  const msg = read<string | null>(KEY.flash, null);
  remove(KEY.flash);
  return msg;
}

/* ---------- Clubs ---------- */

export function listClubs(): Club[] {
  const overrides = read<Record<string, Club>>(KEY.clubs, {});
  return SAMPLE_CLUBS.map((c) => overrides[c.slug] ?? c);
}

export function getClub(slug: string): Club | undefined {
  return listClubs().find((c) => c.slug === slug);
}

export function isClubEdited(slug: string): boolean {
  return slug in read<Record<string, Club>>(KEY.clubs, {});
}

export function saveClub(club: Club): boolean {
  const overrides = read<Record<string, Club>>(KEY.clubs, {});
  overrides[club.slug] = club;
  return write(KEY.clubs, overrides);
}

/* ---------- Bookings ---------- */

export function listBookings(): Booking[] {
  return read<Booking[]>(KEY.bookings, SAMPLE_BOOKINGS);
}

export function addBooking(booking: Booking): boolean {
  return write(KEY.bookings, [...listBookings(), booking]);
}

export function decideBooking(id: string, decision: 'approved' | 'declined', note: string, by: string): Booking | null {
  const bookings = listBookings();
  const b = bookings.find((x) => x.id === id);
  if (!b) return null;
  // Deciding again leaves one calendar entry: the calendar is derived from status.
  b.status = decision;
  b.decisionNote = note;
  b.decidedBy = by;
  b.decidedAt = new Date().toISOString();
  write(KEY.bookings, bookings);
  return b;
}

export function nextBookingId(): string {
  return `b-${Date.now().toString(36)}`;
}

/* ---------- Events calendar ---------- */

export interface CalendarEntry extends CalendarEvent {
  fromBooking: boolean;
}

export function calendarEntries(): CalendarEntry[] {
  const fromBookings: CalendarEntry[] = listBookings()
    .filter((b) => b.status === 'approved' && b.requestType !== 'cancellation')
    .map((b) => ({
      title: b.eventTitle,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      location: [b.londonRoom, b.windsorRoom, b.videoConference ? 'Zoom' : ''].filter(Boolean).join(' · '),
      campus: b.campus,
      fromBooking: true,
    }));
  return [...SAMPLE_EVENTS.map((e) => ({ ...e, fromBooking: false })), ...fromBookings].sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
}

/* ---------- Council pages (versioned) ---------- */

type PageStore = Record<string, PageVersion[]>;

export function pageVersions(slug: string): PageVersion[] {
  const stored = read<PageStore>(KEY.pages, {})[slug];
  if (stored?.length) return stored;
  const seed = COUNCIL_PAGES.find((p) => p.slug === slug);
  return seed ? [{ title: seed.title, body: seed.body, savedBy: 'Original content', savedAt: '2026-10-25T12:00:00.000Z' }] : [];
}

export function isPageEdited(slug: string): boolean {
  return !!read<PageStore>(KEY.pages, {})[slug]?.length;
}

export function savePage(slug: string, title: string, body: string, by: string): boolean {
  const all = read<PageStore>(KEY.pages, {});
  const versions = pageVersions(slug);
  all[slug] = [...versions, { title, body, savedBy: by, savedAt: new Date().toISOString() }];
  return write(KEY.pages, all);
}

/* ---------- Problem reports ---------- */

export function nextReportNumber(): number {
  const n = read<number>(KEY.reportCounter, 41) + 1;
  write(KEY.reportCounter, n);
  return n;
}

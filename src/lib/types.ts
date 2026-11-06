export type Campus = 'london' | 'windsor';
export type BookingCampus = Campus | 'both';
export type Role = 'student' | 'club_exec' | 'booking_admin' | 'page_editor' | 'community_relations' | 'site_admin';

export interface ClubExec {
  name: string;
  role: string;
  email: string;
  showEmail: boolean;
}

export interface Club {
  slug: string;
  name: string;
  description: string;
  campuses: Campus[];
  /** Directory categories; when unset, the live site's from src/data/club-categories.ts. */
  categories?: import('../data/club-categories').ClubCategory[];
  links: string[];
  execs: ClubExec[];
}

export interface Persona {
  id: Role;
  label: string;
  name: string;
  email: string;
  clubSlug?: string;
}

export interface Session {
  email: string;
  name: string;
  role: Role;
  clubSlug?: string;
}

export type BookingStatus = 'pending' | 'approved' | 'declined';

export interface Booking {
  id: string;
  requesterName: string;
  requesterEmail: string;
  requestType: 'new' | 'reschedule' | 'cancellation';
  eventTitle: string;
  promoDescription: string;
  publicDescription: string;
  startsAt: string; // local Toronto time, YYYY-MM-DDTHH:mm
  endsAt: string;
  yearsTargeted: number[];
  eventType: 'in_person' | 'zoom_only';
  campus: BookingCampus;
  videoConference: boolean;
  zoomLink: string;
  londonRoom: string;
  windsorRoom: string;
  attendeesLondon: number | null;
  attendeesWindsor: number | null;
  privateNotes: string;
  status: BookingStatus;
  decisionNote: string;
  decidedBy: string;
  decidedAt: string;
  createdAt: string;
}

export interface CalendarEvent {
  title: string;
  startsAt: string; // local, YYYY-MM-DDTHH:mm
  endsAt: string;
  location: string;
  campus: BookingCampus;
}

/** One row of the exec roster the Community Relations Director uploads. */
export interface RosterRow {
  clubSlug: string;
  name: string;
  email: string;
  role: string;
}

export interface PageVersion {
  title: string;
  body: string;
  savedBy: string;
  savedAt: string; // ISO
}

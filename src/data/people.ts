/** Demo personas. All invented; `hippoit@uwo.ca` is the IT Director's public role address. */
import type { Persona } from '../lib/types';

export const PERSONAS: Persona[] = [
  { id: 'student', label: 'Student', name: 'Alex Sample', email: 'student1@meds.uwo.ca' },
  {
    id: 'club_exec',
    label: 'Club exec (Sample Surgery Interest Group)',
    name: 'Jordan Sample',
    email: 'exec1@meds.uwo.ca',
    clubSlug: 'sample-surgery-interest-group',
  },
  { id: 'booking_admin', label: 'Booking admin', name: 'Sam Sample', email: 'bookingadmin@uwo.ca' },
  { id: 'page_editor', label: 'Page editor', name: 'Taylor Sample', email: 'editor@meds.uwo.ca' },
  { id: 'site_admin', label: 'IT Director (site admin)', name: 'IT Director', email: 'hippoit@uwo.ca' },
];

/** Campus-routed booking recipients (plan Task 8). Sample addresses only. */
export const BOOKING_RECIPIENTS = {
  london: ['london.bookings.sample@uwo.ca'],
  windsor: ['windsor.bookings.sample@uwo.ca'],
} as const;

export const IT_CONTACT = 'hippoit@uwo.ca';

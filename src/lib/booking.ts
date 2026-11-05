/**
 * Room booking validation (plan Task 10's bookingSchema rules), without a server.
 * Times are Toronto local time strings (YYYY-MM-DDTHH:mm), compared as text.
 */
import { WINDSOR_ROOMS } from '../data/rooms';
import { BOOKING_RECIPIENTS } from '../data/people';
import type { BookingCampus } from './types';

export interface BookingInput {
  requestType: string;
  eventTitle: string;
  promoDescription: string;
  publicDescription: string;
  startsAt: string;
  endsAt: string;
  yearsTargeted: number[];
  eventType: string;
  campus: string;
  videoConference: boolean;
  zoomLink: string;
  londonRoom: string;
  windsorRoom: string;
  attendeesLondon: string;
  attendeesWindsor: string;
  privateNotes: string;
}

export type BookingErrors = Partial<Record<keyof BookingInput, string>>;

const LOCAL_DT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

export function validateBooking(input: BookingInput): BookingErrors {
  const e: BookingErrors = {};
  if (!['new', 'reschedule', 'cancellation'].includes(input.requestType)) e.requestType = 'Choose a request type';
  if (!input.eventTitle.trim()) e.eventTitle = 'Enter the event title';
  if (!LOCAL_DT.test(input.startsAt)) e.startsAt = 'Enter a start date and time';
  if (!LOCAL_DT.test(input.endsAt)) e.endsAt = 'Enter an end date and time';
  else if (LOCAL_DT.test(input.startsAt) && input.endsAt <= input.startsAt) e.endsAt = 'End time must be after start time';
  if (!input.yearsTargeted.length) e.yearsTargeted = 'Choose at least one year';
  if (!['in_person', 'zoom_only'].includes(input.eventType)) e.eventType = 'Choose in person or Zoom only';
  const campus = input.campus as BookingCampus;
  if (!['london', 'windsor', 'both'].includes(campus)) e.campus = 'Choose a campus';
  if (input.videoConference && !/^https?:\/\/\S+$/.test(input.zoomLink.trim()))
    e.zoomLink = 'Add the Zoom link (starting with https://)';
  const needsLondon = campus === 'london' || campus === 'both';
  const needsWindsor = campus === 'windsor' || campus === 'both';
  if (needsLondon && !input.londonRoom.trim()) e.londonRoom = 'Enter the London room';
  if (needsWindsor && !(WINDSOR_ROOMS as readonly string[]).includes(input.windsorRoom))
    e.windsorRoom = 'Choose a Windsor room from the list';
  const count = (v: string) => (/^\d+$/.test(v.trim()) ? Number(v) : 0);
  if (needsLondon && count(input.attendeesLondon) < 1) e.attendeesLondon = 'Expected attendees in London must be at least 1';
  if (needsWindsor && count(input.attendeesWindsor) < 1) e.attendeesWindsor = 'Expected attendees in Windsor must be at least 1';
  return e;
}

/** Who gets the link-only notice (plan Task 8's resolveRecipients). */
export function resolveRecipients(campus: BookingCampus): string[] {
  const lists =
    campus === 'both'
      ? [...BOOKING_RECIPIENTS.london, ...BOOKING_RECIPIENTS.windsor]
      : [...BOOKING_RECIPIENTS[campus]];
  const unique = [...new Set(lists)];
  return unique.length ? unique : ['hippoit@uwo.ca'];
}

export const CAMPUS_LABEL: Record<BookingCampus, string> = { london: 'London', windsor: 'Windsor', both: 'Both campuses' };
export const REQUEST_LABEL = { new: 'New booking', reschedule: 'Reschedule', cancellation: 'Cancellation' } as const;

/** "2026-11-18T17:30" as "Wed, Nov 18, 2026, 5:30 p.m." (Toronto local time). */
export function formatLocal(dt: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(dt);
  if (!m) return dt;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

export function formatTime(dt: string): string {
  const m = /T(\d{2}):(\d{2})$/.exec(dt);
  if (!m) return '';
  const h = +m[1];
  const suffix = h < 12 ? 'a.m.' : 'p.m.';
  return `${h % 12 || 12}:${m[2]} ${suffix}`;
}

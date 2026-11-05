/**
 * Council pages with placeholder text. In the real site these are `content_items`
 * rows (collection = 'page') that page editors change on the site (plan Tasks 15-16).
 */
export interface CouncilPage {
  slug: string;
  title: string;
  body: string; // Markdown
}

export const COUNCIL_PAGES: CouncilPage[] = [
  {
    slug: 'wellness',
    title: 'Wellness',
    body: `Looking after yourself is part of medical school, not a break from it.

## Supports
- **Peer support:** sample text. The real page links the council's wellness resources.
- **Learner wellness office:** sample text with a link to the official page.
- **After hours:** sample crisis line text.

## Wellness events
Watch the [events calendar](/calendar/) for walks, snack tables and quiet study rooms.`,
  },
  {
    slug: 'academic',
    title: 'Academic & Research Opportunities',
    body: `Notes, question banks and research openings shared by students.

## Research opportunities
The real page embeds the research opportunities spreadsheet. Placeholder text in the demo.

## Study resources
- **MedFriend:** lecture notes, practice questions and Anki decks. [Open MedFriend](/medfriend/).
- Sample link to shared notes.`,
  },
  {
    slug: 'extracurricular',
    title: 'Extracurricular',
    body: `Start a club, find a club, or run an event.

- Browse the [club directory](/clubs/).
- **Starting a club:** sample text about the club proposal form and club policy.
- **Running an event:** book a room with [Event & Room Booking](/room-booking/).`,
  },
  {
    slug: 'educational',
    title: 'Educational',
    body: `Placeholder text for the educational resources page.

- Sample resource one
- Sample resource two`,
  },
  {
    slug: 'meetings-and-updates',
    title: 'Meetings and Updates',
    body: `## Sample council meeting, November
Placeholder minutes summary. The real page lists dated updates with attachments.

## Sample council meeting, October
Placeholder minutes summary.`,
  },
  {
    slug: 'sponsors',
    title: 'Sponsors',
    body: `Thank you to the organisations that support student life at Schulich.

- **Sample Sponsor One** (gold)
- **Sample Sponsor Two** (silver)`,
  },
];

export const SAMPLE_DOCUMENTS = [
  { title: 'Hippocratic Council Constitution', category: 'Governance' },
  { title: 'Class Council Terms of Reference', category: 'Governance' },
  { title: 'Clubs policy', category: 'Clubs' },
  { title: 'Club proposal form', category: 'Clubs' },
];

/**
 * The 2026-27 Hippocratic Council, in the order uwomeds.com/council/ lists them (November
 * 2026), with Noor Simsam as IT Director. A plain list: no reporting lines, no org chart.
 * The real site will build this from `content_items` rows with collection = 'council', so
 * page editors keep it current.
 */
export interface CouncilMember {
  role: string;
  name: string;
}

export const COUNCIL: CouncilMember[] = [
  { role: 'President', name: 'Hashim Al-Bya' },
  { role: 'VP Windsor', name: 'Deyaa Almasri' },
  { role: 'VP Internal', name: 'Saahil Bhalla' },
  { role: 'VP External Senior', name: 'Jennifer Tran' },
  { role: 'VP External Junior', name: 'Agam Chauhan' },
  { role: 'VP Communications', name: 'Pratham Gupta' },
  { role: 'VP Finance', name: 'Jessica Wang' },
  { role: 'VP Academic', name: 'David Sebben' },
  { role: 'VP Events', name: 'Angela Liu' },
  { role: 'VP EDI', name: 'Aarashprit Sidhu' },
  { role: 'VP EDI', name: 'Maya Nagorski' },
  { role: 'Athletics Director', name: 'Kristian Isa' },
  { role: 'USC Representative', name: 'Panav Sharma' },
  { role: 'USC Representative', name: 'Jazlyn Garcha' },
  { role: 'Global Health Liaison', name: 'Nour Risha' },
  { role: 'IT Director', name: 'Noor Simsam' },
  { role: 'Social Media Director', name: 'To be announced' },
];

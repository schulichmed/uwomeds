/**
 * The 2026-27 Hippocratic Council, as listed on uwomeds.com/council/ (November 2026), with
 * Noor Simsam as IT Director. The real site will build this from `content_items` rows with
 * collection = 'council', so page editors keep it current.
 */
export interface CouncilMember {
  id: string;
  role: string;
  name: string;
  group: 'president' | 'executive' | 'position';
  reportsTo?: string;
}

export const COUNCIL: CouncilMember[] = [
  { id: 'president', role: 'President', name: 'Hashim Al-Bya', group: 'president' },
  { id: 'vp-windsor', role: 'VP Windsor', name: 'Deyaa Almasri', group: 'executive' },
  { id: 'vp-internal', role: 'VP Internal', name: 'Saahil Bhalla', group: 'executive' },
  { id: 'vp-external-senior', role: 'VP External Senior', name: 'Jennifer Tran', group: 'executive' },
  { id: 'vp-external-junior', role: 'VP External Junior', name: 'Agam Chauhan', group: 'executive' },
  { id: 'vp-communications', role: 'VP Communications', name: 'Pratham Gupta', group: 'executive' },
  { id: 'vp-finance', role: 'VP Finance', name: 'Jessica Wang', group: 'executive' },
  { id: 'vp-academic', role: 'VP Academic', name: 'David Sebben', group: 'executive' },
  { id: 'vp-events', role: 'VP Events', name: 'Angela Liu', group: 'executive' },
  { id: 'vp-edi-1', role: 'VP EDI', name: 'Aarashprit Sidhu', group: 'executive' },
  { id: 'vp-edi-2', role: 'VP EDI', name: 'Maya Nagorski', group: 'executive' },
  { id: 'it-director', role: 'IT Director', name: 'Noor Simsam', group: 'position', reportsTo: 'vp-communications' },
  { id: 'social-media-director', role: 'Social Media Director', name: 'To be announced', group: 'position', reportsTo: 'vp-communications' },
  { id: 'athletics-director', role: 'Athletics Director', name: 'Kristian Isa', group: 'position' },
  { id: 'usc-rep-1', role: 'USC Representative', name: 'Panav Sharma', group: 'position' },
  { id: 'usc-rep-2', role: 'USC Representative', name: 'Jazlyn Garcha', group: 'position' },
  { id: 'global-health-liaison', role: 'Global Health Liaison', name: 'Nour Risha', group: 'position' },
];

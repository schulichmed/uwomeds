/**
 * Sample council org chart (structure from the spec; names invented).
 * The real site builds this from `content_items` rows with collection = 'council'.
 */
export interface CouncilMember {
  id: string;
  role: string;
  name: string;
  group: 'president' | 'executive' | 'position';
  reportsTo?: string;
}

export const SAMPLE_COUNCIL: CouncilMember[] = [
  { id: 'president', role: 'President', name: 'Alex Placeholder', group: 'president' },
  { id: 'past-president', role: 'Past President', name: 'Blake Sample', group: 'president' },
  { id: 'vp-events', role: 'VP Events', name: 'Cameron Example', group: 'executive' },
  { id: 'vp-finance', role: 'VP Finance', name: 'Dana Sample', group: 'executive' },
  { id: 'vp-edid', role: 'VP EDI-D', name: 'Eden Placeholder', group: 'executive' },
  { id: 'vp-academic', role: 'VP Academic', name: 'Finley Example', group: 'executive' },
  { id: 'vp-windsor', role: 'VP Windsor', name: 'Gray Sample', group: 'executive' },
  { id: 'vp-internal', role: 'VP Internal', name: 'Harper Placeholder', group: 'executive' },
  { id: 'vp-external', role: 'VP External', name: 'Indigo Example', group: 'executive' },
  { id: 'vp-communications', role: 'VP Communications', name: 'Jules Sample', group: 'executive' },
  { id: 'it-director', role: 'IT Director', name: 'Kai Placeholder', group: 'position', reportsTo: 'vp-communications' },
  { id: 'social-media-director', role: 'Social Media Director', name: 'Lane Example', group: 'position', reportsTo: 'vp-communications' },
  { id: 'community-relations', role: 'Community Relations Director', name: 'Marlow Sample', group: 'position' },
];

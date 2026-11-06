/**
 * The handbook's four sections (redesign look only). Each has a fixed colour used the same way
 * in the menu swatches, the page's top rule and the thumb index on the page edge.
 * Paths are site paths without the base; the first match wins.
 */
export type SectionId = 'council' | 'resources' | 'involvement' | 'medfriend';

export interface Section { id: SectionId; label: string; home: string; paths: string[] }

export const SECTIONS: Section[] = [
  {
    id: 'council',
    label: 'Council',
    home: '/council/',
    paths: ['/council/', '/documents/', '/meetings-and-updates/', '/sponsors/', '/privacy/', '/terms/', '/edit/page/'],
  },
  {
    id: 'resources',
    label: 'Resources',
    home: '/academic/',
    paths: ['/academic/', '/extracurricular/', '/educational/', '/wellness/', '/research-from-home/', '/links/'],
  },
  {
    id: 'involvement',
    label: 'Involvement',
    home: '/clubs/',
    paths: ['/clubs/', '/calendar/', '/room-booking/'],
  },
  { id: 'medfriend', label: 'MedFriend', home: '/medfriend/', paths: ['/medfriend/'] },
];

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function sectionFor(pathname: string): SectionId | undefined {
  const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
  const withSlash = path.endsWith('/') ? path : `${path}/`;
  return SECTIONS.find((s) => s.paths.some((p) => withSlash.startsWith(p)))?.id;
}

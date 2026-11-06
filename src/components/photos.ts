/**
 * Photos for the redesign look. Self-hosted copies (resized to WebP) of Schulich School of Medicine
 * & Dentistry's published photos, used with Noor's OK (2026-11-06); the footer credits Schulich.
 * `source` records where each original came from.
 */
export interface Photo { file: string; small?: string; width: number; height: number; alt: string; source: string; position?: string }

const P = (p: Photo) => p;

export const PHOTOS = {
  campusWalk: P({ file: '/photos/campus-walk.webp', small: '/photos/campus-walk-800.webp', width: 1600, height: 375, alt: 'Six Schulich medicine students in purple and black Schulich sweaters walking across campus in autumn', source: 'https://www.schulich.uwo.ca/img/tutorials/web-repository-photos/HeroImages_01.jpg', position: '55% 50%' }),
  benchGroup: P({ file: '/photos/bench-group.webp', small: '/photos/bench-group-800.webp', width: 1600, height: 500, alt: 'Five Schulich Medicine students laughing together on a bench in front of a brick wall', source: 'https://www.schulich.uwo.ca/med-dent-admissions/img/md-dentistry-hero.jpg', position: '50% 35%' }),
  studyLounge: P({ file: '/photos/study-lounge.webp', width: 575, height: 272, alt: 'Students working on laptops in a lounge', source: 'https://www.schulich.uwo.ca/medicine/undergraduate/img/useful-resources.png' }),
  picnicTable: P({ file: '/photos/picnic-table.webp', width: 562, height: 374, alt: 'Three students talking at a picnic table under autumn trees', source: 'https://www.schulich.uwo.ca/img/about/who-we-are/a-welcoming-community.png' }),
  autumnWalk: P({ file: '/photos/autumn-walk.webp', small: '/photos/autumn-walk-800.webp', width: 1200, height: 630, alt: 'Two medical students with backpacks chatting on a walk past autumn trees', source: 'https://www.schulich.uwo.ca/med-dent-admissions/img/open_graphs/AdmissionsOG1.jpg', position: '50% 30%' }),
  whiteCoats: P({ file: '/photos/white-coats.webp', width: 880, height: 300, alt: 'A Schulich medicine class in white coats outside a stone building', source: 'https://www.schulich.uwo.ca/med-dent-admissions/img/med_img/MD2030.jpg', position: '50% 40%' }),
  cyclist: P({ file: '/photos/cyclist.webp', small: '/photos/cyclist-800.webp', width: 1080, height: 567, alt: 'Two students laughing on a campus sidewalk, one walking a bike', source: 'A Schulich photo shared by Noor as a Reddit preview (external-preview.redd.it)', position: '50% 35%' }),
  medicalSciences: P({ file: '/photos/medical-sciences.webp', width: 800, height: 534, alt: 'Two students walking out of the stone Medical Sciences building', source: 'https://www.schulich.uwo.ca/img/admissions/JHC__D7A2016.jpg', position: '50% 60%' }),
  atriumGroup: P({ file: '/photos/atrium-group.webp', small: '/photos/atrium-group-800.webp', width: 1200, height: 650, alt: 'A group of Schulich students laughing together indoors', source: 'https://www.schulich.uwo.ca/img/tutorials/web-repository-photos/lifestyle/Windsor%20Students%201200x650.jpg', position: '40% 12%' }),
  hallway: P({ file: '/photos/hallway.webp', width: 880, height: 300, alt: 'Three Schulich students walking down a bright hallway on the Windsor campus', source: 'https://www.schulich.uwo.ca/gastroenterology/images/2024_WindsorCampus_BrandedLifestyle25-1.png', position: '45% 50%' }),
} as const;

/** One banner photo per page, chosen by site path (without the base). Pages not listed get none. */
const BY_PATH: Record<string, Photo> = {
  '/council/': PHOTOS.whiteCoats,
  '/documents/': PHOTOS.medicalSciences,
  '/meetings-and-updates/': PHOTOS.medicalSciences,
  '/sponsors/': PHOTOS.medicalSciences,
  '/clubs/': PHOTOS.campusWalk,
  '/calendar/': PHOTOS.autumnWalk,
  '/room-booking/': PHOTOS.atriumGroup,
  '/academic/': PHOTOS.hallway,
  '/educational/': PHOTOS.hallway,
  '/extracurricular/': PHOTOS.atriumGroup,
  '/research-from-home/': PHOTOS.hallway,
  '/wellness/': PHOTOS.cyclist,
  '/links/': PHOTOS.hallway,
  '/contact/': PHOTOS.autumnWalk,
};

const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

export function photoFor(pathname: string): Photo | undefined {
  const path = pathname.startsWith(BASE) ? pathname.slice(BASE.length) || '/' : pathname;
  return BY_PATH[path.endsWith('/') ? path : `${path}/`];
}

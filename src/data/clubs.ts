/**
 * Sample clubs for the demo. Every name, person and address here is invented.
 * The real site loads clubs from Supabase (plan Task 4).
 */
import type { Club } from '../lib/types';

export const SAMPLE_CLUBS: Club[] = [
  {
    slug: 'sample-surgery-interest-group',
    name: 'Sample Surgery Interest Group',
    description:
      'A sample club for students curious about surgical careers. We run suturing workshops, shadowing sign-ups and an annual "Day in the OR" panel with residents.\n\nAll years welcome, no experience needed.',
    campuses: ['london'],
    links: [
      'https://www.instagram.com/sample_surgery_club/',
      'https://www.facebook.com/samplesurgeryclub',
      'https://example.org/surgery',
    ],
    execs: [
      { name: 'Jordan Sample', role: 'President', email: 'exec1@meds.uwo.ca', showEmail: true },
      { name: 'Riley Example', role: 'VP Events', email: 'exec2@meds.uwo.ca', showEmail: false },
      { name: 'Casey Placeholder', role: 'Treasurer', email: 'exec3@meds.uwo.ca', showEmail: false },
    ],
  },
  {
    slug: 'sample-paediatrics-club',
    name: 'Sample Paediatrics Club',
    description: '',
    campuses: ['windsor'],
    links: [],
    execs: [{ name: 'Morgan Sample', role: 'President', email: 'exec4@meds.uwo.ca', showEmail: false }],
  },
  {
    slug: 'sample-wellness-collective',
    name: 'Sample Wellness Collective',
    description:
      'Sample peer wellness club: weekly walks, exam-week snacks and a quiet study room on both campuses.',
    campuses: ['london', 'windsor'],
    links: ['https://www.instagram.com/sample_wellness/', 'https://linktr.ee/samplewellness'],
    execs: [
      { name: 'Avery Example', role: 'Co-president (London)', email: 'exec5@meds.uwo.ca', showEmail: true },
      { name: 'Quinn Sample', role: 'Co-president (Windsor)', email: 'exec6@meds.uwo.ca', showEmail: false },
    ],
  },
  {
    slug: 'sample-emergency-medicine-society',
    name: 'Sample Emergency Medicine Society',
    description: 'Sample club: simulation nights, ultrasound basics and EM career talks.',
    campuses: ['london'],
    links: ['https://www.youtube.com/@sampleemsociety', 'https://www.tiktok.com/@sample_em'],
    execs: [{ name: 'Drew Placeholder', role: 'President', email: 'exec7@meds.uwo.ca', showEmail: false }],
  },
  {
    slug: 'sample-global-health-network',
    name: 'Sample Global Health Network',
    description: 'Sample club: journal club, advocacy projects and a speaker series on global health equity.',
    campuses: ['london', 'windsor'],
    links: ['https://www.linkedin.com/company/sample-global-health'],
    execs: [{ name: 'Jamie Example', role: 'President', email: 'exec8@meds.uwo.ca', showEmail: true }],
  },
  {
    slug: 'sample-family-medicine-interest-group',
    name: 'Sample Family Medicine Interest Group',
    description: 'Sample club: rural medicine evenings and clinic shadowing with family physicians.',
    campuses: ['windsor'],
    links: ['https://www.instagram.com/sample_fmig/'],
    execs: [{ name: 'Sasha Sample', role: 'President', email: 'exec9@meds.uwo.ca', showEmail: false }],
  },
  {
    slug: 'sample-open-source-medicine',
    name: 'Sample Open-Source Medicine Club',
    description: 'Sample club: students building study tools together. No coding experience needed.',
    campuses: ['london'],
    links: ['https://example.org/open-source-medicine'],
    execs: [{ name: 'Robin Placeholder', role: 'President', email: 'exec10@meds.uwo.ca', showEmail: false }],
  },
  {
    slug: 'sample-dermatology-club',
    name: 'Sample Dermatology Club',
    description: 'Sample club: skin-check workshops and a dermatology residency panel.',
    campuses: ['london'],
    links: [],
    execs: [{ name: 'Alexis Example', role: 'President', email: 'exec11@meds.uwo.ca', showEmail: false }],
  },
  {
    slug: 'sample-psychiatry-interest-group',
    name: 'Sample Psychiatry Interest Group',
    description: 'Sample club: case discussions and a film night on mental health in medicine.',
    campuses: ['london', 'windsor'],
    links: ['https://www.instagram.com/sample_psych/'],
    execs: [{ name: 'Charlie Sample', role: 'President', email: 'exec12@meds.uwo.ca', showEmail: false }],
  },
  {
    slug: 'sample-sports-medicine-club',
    name: 'Sample Sports Medicine Club',
    description: 'Sample club: taping clinics and sideline coverage talks.',
    campuses: ['windsor'],
    links: ['https://www.facebook.com/samplesportsmed'],
    execs: [{ name: 'Parker Placeholder', role: 'President', email: 'exec13@meds.uwo.ca', showEmail: false }],
  },
  {
    slug: 'sample-ai-in-medicine-club',
    name: 'Sample AI in Medicine Club',
    description: 'Sample club: reading group on clinical AI, with a hands-on workshop each term.',
    campuses: ['london'],
    links: ['https://www.linkedin.com/company/sample-ai-med', 'https://example.org/ai-med'],
    execs: [{ name: 'Rowan Example', role: 'President', email: 'exec14@meds.uwo.ca', showEmail: true }],
  },
  {
    slug: 'sample-music-in-medicine',
    name: 'Sample Music in Medicine',
    description: 'Sample club: a student choir and an end-of-term recital.',
    campuses: ['london', 'windsor'],
    links: ['https://www.youtube.com/@samplemusicmed'],
    execs: [{ name: 'Emerson Sample', role: 'President', email: 'exec15@meds.uwo.ca', showEmail: false }],
  },
];

/**
 * The exec roster (plan Task 7): who may edit which club. In the real site this
 * is the spreadsheet the Community Relations Director uploads each year.
 */
export const SAMPLE_ROSTER: { clubSlug: string; email: string }[] = SAMPLE_CLUBS.flatMap((club) =>
  club.execs.map((exec) => ({ clubSlug: club.slug, email: exec.email })),
);

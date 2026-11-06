import { describe, expect, it } from 'vitest';
import { CATEGORIES_BY_SLUG, CLUB_CATEGORIES } from '../../src/data/club-categories';
import { CLUBS } from '../../src/data/clubs';

describe('club categories', () => {
  it('gives every club at least one category', () => {
    const missing = CLUBS.filter((c) => !CATEGORIES_BY_SLUG[c.slug]?.length).map((c) => c.slug);
    expect(missing).toEqual([]);
  });

  it('has no entries for clubs that no longer exist', () => {
    const slugs = new Set(CLUBS.map((c) => c.slug));
    expect(Object.keys(CATEGORIES_BY_SLUG).filter((s) => !slugs.has(s))).toEqual([]);
  });

  it('uses only the five live-site categories', () => {
    const ids = new Set<string>(CLUB_CATEGORIES.map((c) => c.id));
    expect(Object.values(CATEGORIES_BY_SLUG).flat().filter((v) => !ids.has(v))).toEqual([]);
    expect(CLUB_CATEGORIES.map((c) => c.label)).toEqual(['Interest Groups', 'Advocacy', 'Community', 'Mentorship', 'Recreational']);
  });
});

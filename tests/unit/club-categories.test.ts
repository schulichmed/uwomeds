import { describe, expect, it } from 'vitest';
import { CATEGORY_BY_SLUG, CLUB_CATEGORIES } from '../../src/data/club-categories';
import { CLUBS } from '../../src/data/clubs';

describe('club categories', () => {
  it('gives every club a category', () => {
    const missing = CLUBS.filter((c) => !CATEGORY_BY_SLUG[c.slug]).map((c) => c.slug);
    expect(missing).toEqual([]);
  });

  it('has no entries for clubs that no longer exist', () => {
    const slugs = new Set(CLUBS.map((c) => c.slug));
    expect(Object.keys(CATEGORY_BY_SLUG).filter((s) => !slugs.has(s))).toEqual([]);
  });

  it('uses only known categories', () => {
    const ids = new Set<string>(CLUB_CATEGORIES.map((c) => c.id));
    expect(Object.values(CATEGORY_BY_SLUG).filter((v) => !ids.has(v))).toEqual([]);
  });
});

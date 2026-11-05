import { describe, expect, it } from 'vitest';
import { href } from '../../src/lib/paths';

describe('href', () => {
  it('serves pages from the site root with a trailing slash', () => {
    expect(href('/clubs')).toBe('/clubs/');
    expect(href('clubs/surgery-interest-group')).toBe('/clubs/surgery-interest-group/');
  });

  it('leaves files, queries and fragments alone', () => {
    expect(href('/sample-exec-roster.csv')).toBe('/sample-exec-roster.csv');
    expect(href('/login?next=%2Fadmin%2F')).toBe('/login/?next=%2Fadmin%2F');
    expect(href('/clubs#list')).toBe('/clubs/#list');
  });
});

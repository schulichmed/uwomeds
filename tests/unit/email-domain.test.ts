import { describe, expect, it } from 'vitest';
import { isAllowedDomain, normaliseEmail } from '../../src/lib/email-domain';

// The same addresses as the database test (supabase/tests/01_profiles_roles.sql).
describe('isAllowedDomain', () => {
  it.each(['student1@meds.uwo.ca', 'staff1@uwo.ca', 'Jane@MEDS.uwo.ca '])('allows %s', (email) => {
    expect(isAllowedDomain(email)).toBe(true);
  });

  it.each([
    'x@meds.uwo.ca.evil.com',
    'x@evilmeds.uwo.ca',
    'x@evil-uwo.ca',
    'x@uwo.ca.evil.com',
    'x@eng.uwo.ca',
    'x@gmail.com',
    'a@b@uwo.ca',
    '@uwo.ca',
  ])('refuses %s', (email) => {
    expect(isAllowedDomain(email)).toBe(false);
  });
});

describe('normaliseEmail', () => {
  it('trims, removes spaces and lowercases', () => {
    expect(normaliseEmail('  Jane@MEDS.uwo.ca ')).toBe('jane@meds.uwo.ca');
  });
});

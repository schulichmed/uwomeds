/** Sign-in domain rule (mirrors plan Task 2's database check for the form's UX). */
export const ALLOWED_DOMAINS = ['meds.uwo.ca', 'uwo.ca'] as const;
export const DOMAIN_ERROR = 'Use your Western email (@uwo.ca or @meds.uwo.ca)';

export function normaliseEmail(raw: string): string {
  return raw.replace(/\s+/g, '').toLowerCase();
}

/** True when a raw address (any case, stray spaces) is on an allowed domain. UX only: the DB decides. */
export function isAllowedDomain(raw: string): boolean {
  return isAllowedEmail(normaliseEmail(raw));
}

export function isAllowedEmail(email: string): boolean {
  const at = email.lastIndexOf('@');
  if (at < 1 || email.indexOf('@') !== at) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (!/^[a-z0-9._%+-]+$/.test(local)) return false;
  return (ALLOWED_DOMAINS as readonly string[]).includes(domain);
}

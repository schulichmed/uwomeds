/** Sign-in helpers for e2e tests. They need the local Supabase stack, whose Mailpit inbox is
 *  read at http://127.0.0.1:54324. */
import { expect, type Page } from '@playwright/test';

const MAILPIT = process.env.MAILPIT_URL ?? 'http://127.0.0.1:54324';

/** A fresh fake address, so tests never share an inbox or a rate limit. */
export function fresh(domain = 'meds.uwo.ca'): string {
  return `e2e-${Date.now()}-${Math.floor(Math.random() * 1e6)}@${domain}`;
}

export interface Mail { code: string; link: string }

export async function latestMail(to: string): Promise<Mail> {
  for (let i = 0; i < 40; i++) {
    const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
    const list = (await res.json()) as { messages?: { ID: string }[] };
    if (list.messages?.length) {
      const msg = (await (await fetch(`${MAILPIT}/api/v1/message/${list.messages[0].ID}`)).json()) as { HTML: string; Text: string };
      const code = /\b(\d{6})\b/.exec(msg.Text || msg.HTML)?.[1] ?? '';
      const link = (/href="([^"]*\/login\/confirm\/\?token_hash=[^"]+)"/.exec(msg.HTML)?.[1] ?? '').replace(/&amp;/g, '&');
      return { code, link };
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`no email arrived for ${to}`);
}

export async function mailCount(to: string): Promise<number> {
  const res = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`);
  return ((await res.json()) as { messages_count?: number }).messages_count ?? 0;
}

/** Fill in the email on the sign-in page the browser is already on. */
export async function submitEmail(page: Page, email: string): Promise<void> {
  await page.getByLabel('Western email').fill(email);
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await expect(page).toHaveURL(/\/login\/code\//);
}

export async function requestCode(page: Page, email: string): Promise<void> {
  await page.goto('/login/');
  await submitEmail(page, email);
}

export async function enterCode(page: Page, code: string): Promise<void> {
  await page.getByLabel('6-digit code').fill(code);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

/** Finish a sign-in that has reached the code page; waits for each new email. */
export async function finishSignIn(page: Page, email: string, before = 0): Promise<void> {
  for (let i = 0; i < 40 && (await mailCount(email)) <= before; i++) await new Promise((r) => setTimeout(r, 250));
  await enterCode(page, (await latestMail(email)).code);
}

/** Open a MedFriend page signed out and sign in from there. */
export async function signInThrough(page: Page, path: string, email: string): Promise<void> {
  await page.goto(path);
  // The MedFriend root shows the landing page instead of redirecting.
  if (/^\/medfriend\/?$/.test(path)) await page.getByRole('link', { name: 'Sign in with your Western email' }).click();
  await expect(page).toHaveURL(/\/login\/\?next=/);
  const before = await mailCount(email);
  await submitEmail(page, email);
  await finishSignIn(page, email, before);
}

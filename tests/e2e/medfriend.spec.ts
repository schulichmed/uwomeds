/** MedFriend as part of the site (plan Task 25) behind its sign-in gate (Task 26). CI copies
 *  the fake MedFriend in tests/fixtures/medfriend-fake to dist/medfriend before these run.
 *  The signed-in tests need the local Supabase stack. */
import { existsSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { finishSignIn, fresh, mailCount, requestCode, submitEmail } from './helpers';

test.skip(!existsSync('dist/medfriend/index.html'), 'run scripts/prepare-medfriend.mjs first');

const NO_STORE = 'private, no-store';

/** Open a MedFriend page signed out, sign in from the redirect, and pass the notice. */
async function signInThrough(page: Page, path: string, email: string): Promise<void> {
  await page.goto(path);
  await expect(page).toHaveURL(/\/login\/\?next=/);
  const before = await mailCount(email);
  await submitEmail(page, email);
  await finishSignIn(page, email, before);
  await expect(page).toHaveURL(/\/medfriend-notice\/\?next=/);
  await page.getByRole('button', { name: 'I understand' }).click();
}

test('landing', async ({ page, request }) => {
  const res = await request.get('/medfriend/', { maxRedirects: 0 });
  expect(res.status()).toBe(200);
  expect(res.headers()['cache-control']).toBe(NO_STORE);
  await page.goto('/medfriend/');
  await expect(page.getByRole('link', { name: 'Sign in with your Western email' })).toBeVisible();
  await expect(page.getByText('Fake MedFriend hub')).toHaveCount(0);
  await expect(page.getByText('Fake question')).toHaveCount(0);
});

test('gate covers json and decks', async ({ request }) => {
  for (const path of ['/medfriend/fom/questions.json', '/medfriend/fom/anki/b1.apkg', '/medfriend/fom/b1', '/medfriend/app.js']) {
    const res = await request.get(path, { maxRedirects: 0 });
    expect(res.status(), path).toBe(302);
    expect(res.headers()['location'], path).toBe(`/login/?next=${encodeURIComponent(path)}`);
    expect(res.headers()['cache-control'], path).toBe(NO_STORE);
    expect(await res.text(), path).not.toContain('Fake question');
  }
});

for (const domain of ['meds.uwo.ca', 'uwo.ca']) {
  test(`signed in with @${domain}: lands on the page asked for, files served privately`, async ({ page }) => {
    await signInThrough(page, '/medfriend/fom/b1', fresh(domain));
    await expect(page).toHaveURL(/\/medfriend\/fom\/b1(\.html)?$/);
    await expect(page.getByRole('link', { name: 'MedFriend home' })).toBeVisible();

    for (const path of ['/medfriend/', '/medfriend/fom/questions.json', '/medfriend/app.js']) {
      const res = await page.request.get(path, { maxRedirects: 0 });
      expect(res.status(), path).toBe(200);
      expect(res.headers()['cache-control'], path).toBe(NO_STORE); // no public cache
    }
    expect(await (await page.request.get('/medfriend/fom/questions.json')).text()).toContain('Fake question');
    // Decks come from the R2 bucket (Task 0B); with none bound, an unknown deck is a 404.
    expect((await page.request.get('/medfriend/fom/anki/nope.apkg', { maxRedirects: 0 })).status()).toBe(404);
  });
}

test('notice once', async ({ browser }) => {
  const email = fresh();
  const first = await browser.newContext();
  await signInThrough(await first.newPage(), '/medfriend/', email);
  await first.close();

  const second = await browser.newContext();
  const page = await second.newPage();
  const before = await mailCount(email);
  await requestCode(page, email);
  await finishSignIn(page, email, before);
  await page.goto('/medfriend/');
  await expect(page).toHaveURL(/\/medfriend\/$/);
  await expect(page.locator('#mf-title')).toHaveText('Fake MedFriend hub');
  await second.close();
});

test('medfriend policy', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy|Content-Security-Policy/i.test(m.text())) violations.push(m.text());
  });
  await signInThrough(page, '/medfriend/', fresh());
  await expect(page).toHaveURL(/\/medfriend\/$/);

  const h = (await page.request.get('/medfriend/')).headers();
  expect(h['x-frame-options']).toBe('SAMEORIGIN');
  expect(h['content-security-policy']).toContain("script-src 'self' 'unsafe-inline'");
  expect(h['content-security-policy']).not.toContain("frame-ancestors 'none'");

  await expect(page.getByRole('navigation', { name: 'uwomeds.com' })).toBeVisible();
  await expect(page.locator('#inline-check')).toHaveText('inline script ran');
  // b1 has a YouTube embed. Pages serves b1.html at /fom/b1; relative links still resolve.
  await page.getByRole('link', { name: 'FoM block 1' }).click();
  await expect(page).toHaveURL(/\/medfriend\/fom\/b1(\.html)?$/);
  await page.getByRole('link', { name: 'MedFriend home' }).click();
  await expect(page).toHaveURL(/\/medfriend\/$/);
  expect(violations).toEqual([]);
});

test('the council site keeps its strict policy', async ({ request }) => {
  const h = (await request.get('/clubs/')).headers();
  expect(h['x-frame-options']).toBe('DENY');
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'");
});

/** MedFriend progress saved to the uwomeds.com account (plan Task 27). The fake quiz page
 *  runs MedFriend's real sync.js; the site swaps its Firebase storage for the account. */
import { existsSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { finishSignIn, fresh, mailCount, requestCode, signInThrough } from './helpers';

test.skip(!existsSync('dist/medfriend/fom/quiz.html'), 'run scripts/prepare-medfriend.mjs first');

const KEY = 'nsq.fake.v1.b1';
const synced = (page: Page) => expect(page.locator('#sync-btn')).toHaveAttribute('data-state', 'idle', { timeout: 15_000 });

test('an answer in one browser shows in another', async ({ browser }) => {
  const email = fresh();
  const firebase: string[] = [];

  const first = await browser.newContext();
  const a = await first.newPage();
  a.on('request', (r) => { if (/gstatic|firebase|googleapis/.test(r.url())) firebase.push(r.url()); });
  await signInThrough(a, '/medfriend/fom/quiz', email);
  await expect(a).toHaveURL(/\/medfriend\/fom\/quiz(\.html)?$/);
  await synced(a); // started on its own: no second sign-in
  const answered = await a.evaluate(async (key) => {
    const ts = Date.now();
    const value = { q1: { lastTs: ts, attempts: [{ ts, ok: true }] } };
    localStorage.setItem(key, JSON.stringify(value));
    await (window as unknown as { PORTAL_SYNC: { _sync: () => Promise<void> } }).PORTAL_SYNC._sync();
    return value;
  }, KEY);
  await first.close();

  const second = await browser.newContext();
  const b = await second.newPage();
  await b.waitForTimeout(6000); // Supabase sends one code per address every 5 seconds
  const before = await mailCount(email);
  await requestCode(b, email);
  await finishSignIn(b, email, before);
  await b.goto('/medfriend/fom/quiz');
  await synced(b);
  const got = await b.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), KEY);
  expect(got).toEqual(answered);
  await second.close();

  expect(firebase).toEqual([]);
});

test('the progress API needs a session and this site', async ({ request }) => {
  expect((await request.get('/api/medfriend/progress/?me=1')).status()).toBe(401);
  const put = await request.put('/api/medfriend/progress/', {
    headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
    data: { key: KEY, d: '{}', ver: null },
  });
  expect([401, 403]).toContain(put.status());
});

test('a signed-in reader cannot write from another site or outside MedFriend keys', async ({ page }) => {
  await signInThrough(page, '/medfriend/', fresh());
  const origin = new URL(page.url()).origin;
  const evil = await page.request.put('/api/medfriend/progress/', {
    headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' },
    data: { key: KEY, d: '{}', ver: null },
  });
  expect(evil.status()).toBe(403);
  const badKey = await page.request.put('/api/medfriend/progress/', {
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    data: { key: 'firebase:x', d: '{}', ver: null },
  });
  expect(badKey.status()).toBe(400);
  const ok = await page.request.put('/api/medfriend/progress/', {
    headers: { Origin: origin, 'Content-Type': 'application/json' },
    data: { key: KEY, d: '{"q1":{"lastTs":1}}', ver: null },
  });
  expect(ok.status()).toBe(200);
  expect(ok.headers()['cache-control']).toBe('private, no-store');
});

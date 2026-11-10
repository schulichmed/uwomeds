/** MedFriend served as part of the site (plan Task 25). CI copies the fake MedFriend in
 *  tests/fixtures/medfriend-fake to dist/medfriend before these run. */
import { existsSync } from 'node:fs';
import { expect, test } from '@playwright/test';

test.skip(!existsSync('dist/medfriend/index.html'), 'run scripts/prepare-medfriend.mjs first');

test('MedFriend pages carry the site bar and run under their own policy', async ({ page, request }) => {
  const violations: string[] = [];
  page.on('console', (m) => {
    if (/Content Security Policy|Content-Security-Policy/i.test(m.text())) violations.push(m.text());
  });
  const res = await request.get('/medfriend/');
  const h = res.headers();
  expect(h['x-frame-options']).toBe('SAMEORIGIN');
  expect(h['content-security-policy']).toContain("script-src 'self' 'unsafe-inline'");
  expect(h['content-security-policy']).not.toContain("frame-ancestors 'none'");

  await page.goto('/medfriend/');
  await expect(page.getByRole('navigation', { name: 'uwomeds.com' })).toBeVisible();
  await expect(page.locator('#inline-check')).toHaveText('inline script ran');
  await page.getByRole('link', { name: 'FoM block 1' }).click();
  // Cloudflare Pages serves b1.html at /fom/b1; MedFriend's relative links still resolve.
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

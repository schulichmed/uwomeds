/**
 * Sign-in with an emailed code or link (plan Task 3). Needs the local Supabase stack
 * (`pnpm exec supabase start`), whose Mailpit inbox is read at http://127.0.0.1:54324.
 */
import { expect, test, type Page } from '@playwright/test';
import { enterCode, fresh, latestMail, mailCount, requestCode } from './helpers';

const signOutButton = (page: Page) => page.getByRole('button', { name: 'Sign out' });

test('signs in with code', async ({ page }) => {
  const email = fresh();
  await requestCode(page, email);
  await enterCode(page, (await latestMail(email)).code);
  await expect(signOutButton(page)).toBeVisible();
});

test('uwo.ca signs in', async ({ page }) => {
  const email = fresh('uwo.ca');
  await requestCode(page, email);
  await enterCode(page, (await latestMail(email)).code);
  await expect(signOutButton(page)).toBeVisible();
});

test('rejects outside email', async ({ page }) => {
  const email = fresh('gmail.com');
  await page.goto('/login/');
  await page.getByLabel('Western email').fill(email);
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await expect(page.getByRole('alert')).toHaveText('Use your Western email (@uwo.ca or @meds.uwo.ca)');
  await page.waitForTimeout(1000);
  expect(await mailCount(email)).toBe(0);
});

test('wrong code is refused', async ({ page }) => {
  const email = fresh();
  await requestCode(page, email);
  const { code } = await latestMail(email);
  await enterCode(page, code === '000000' ? '111111' : '000000');
  await expect(page.getByRole('alert')).toContainText("doesn't match");
});

test('email link GET does not consume the code', async ({ page, request }) => {
  const email = fresh();
  await requestCode(page, email);
  const { code, link } = await latestMail(email);
  expect(link).not.toBe('');
  // What a mail scanner does: open the link without pressing anything.
  expect((await request.get(link)).status()).toBe(200);
  await enterCode(page, code);
  await expect(signOutButton(page)).toBeVisible();
});

test('email link signs in after pressing Continue', async ({ page }) => {
  const email = fresh();
  await requestCode(page, email);
  const { link } = await latestMail(email);
  await page.goto(link);
  await expect(signOutButton(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(signOutButton(page)).toBeVisible();
});

test('next redirect', async ({ page }) => {
  await page.goto('/room-booking/');
  await expect(page).toHaveURL(/\/login\/\?next=%2Froom-booking%2F/);
  const email = fresh();
  await page.getByLabel('Western email').fill(email);
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await enterCode(page, (await latestMail(email)).code);
  await expect(page).toHaveURL(/\/room-booking\/$/);
});

test('sign out', async ({ page }) => {
  const email = fresh();
  await requestCode(page, email);
  await enterCode(page, (await latestMail(email)).code);
  await signOutButton(page).click();
  await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  await expect(signOutButton(page)).toHaveCount(0);
});

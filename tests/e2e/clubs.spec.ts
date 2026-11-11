/** The club directory and club pages from the clubs database (plan Task 5). Needs the local
 *  Supabase stack with supabase/seed.sql: three fake clubs; student1 is an exec of the
 *  Fake Surgery Club, student2 of the Fake Peds Club. */
import { expect, test } from '@playwright/test';
import { finishSignIn, mailCount, requestCode } from './helpers';

const cards = (page: import('@playwright/test').Page) => page.locator('.club-card:not([hidden]) h2');

test('the directory lists the clubs and filters them', async ({ page }) => {
  const res = await page.goto('/clubs/');
  expect(res?.headers()['cache-control']).toBe('public, max-age=300');
  await expect(cards(page)).toHaveText(['Fake Peds Club', 'Fake Surgery Club', 'Fake Wellness Club']);

  await page.getByLabel('Windsor').check();
  await expect(cards(page)).toHaveText(['Fake Peds Club', 'Fake Wellness Club']);
  await page.getByLabel('All', { exact: true }).check();

  await page.getByLabel('Search clubs').fill('surg');
  await expect(cards(page)).toHaveText(['Fake Surgery Club']);
});

test('the filters also work as links', async ({ page }) => {
  await page.goto('/clubs/?campus=windsor');
  await expect(page.locator('.club-card h2')).toHaveText(['Fake Peds Club', 'Fake Wellness Club']);
  await page.goto('/clubs/?q=surg');
  await expect(page.locator('.club-card h2')).toHaveText(['Fake Surgery Club']);
});

test('a club page shows its details, and Instagram only on request', async ({ page }) => {
  const instagram: string[] = [];
  page.on('request', (r) => { if (r.url().includes('instagram.com')) instagram.push(r.url()); });
  await page.goto('/clubs/fake-surgery-club/');
  await expect(page.getByRole('heading', { level: 1, name: 'Fake Surgery Club' })).toBeVisible();
  await expect(page.getByText('A fake club for local testing.')).toBeVisible();
  await expect(page.getByText('Sample President')).toBeVisible();
  await expect(page.getByText('Sample Treasurer')).toBeVisible();
  await expect(page.getByRole('link', { name: 'student1@meds.uwo.ca' })).toBeVisible(); // shown by choice
  await expect(page.getByText('student2@meds.uwo.ca')).toHaveCount(0); // hidden
  await expect(page.getByRole('link', { name: 'Fake Surgery Club on Instagram' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Fake Surgery Club on Facebook' })).toBeVisible();
  await expect(page.getByText('@fakesurgeryclub')).toBeVisible();

  await page.waitForLoadState('networkidle');
  expect(instagram).toEqual([]);
  await page.route('https://www.instagram.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>stub</p>' }));
  await page.getByRole('button', { name: 'Show recent Instagram posts' }).click();
  await expect(page.locator('#ig-panel iframe')).toHaveAttribute('src', 'https://www.instagram.com/fakesurgeryclub/embed/');
});

test('a club with no links hides its socials from visitors', async ({ page }) => {
  await page.goto('/clubs/fake-peds-club/');
  await expect(page.getByRole('heading', { level: 1, name: 'Fake Peds Club' })).toBeVisible();
  await expect(page.getByText('Find us online')).toHaveCount(0);
  await expect(page.getByText("Add your club's socials")).toHaveCount(0);
});

test('its own exec is asked to add socials', async ({ page }) => {
  const email = 'student2@meds.uwo.ca';
  const before = await mailCount(email);
  await requestCode(page, email);
  await finishSignIn(page, email, before);
  const res = await page.goto('/clubs/fake-peds-club/');
  expect(res?.headers()['cache-control']).toBe('private, no-store');
  await expect(page.getByRole('link', { name: "Add your club's socials" })).toBeVisible();
  // Not an exec of the Surgery club: no edit link there.
  await page.goto('/clubs/fake-surgery-club/');
  await expect(page.getByRole('link', { name: 'Edit this club' })).toHaveCount(0);
});

test('an unknown club is a 404', async ({ page }) => {
  const res = await page.goto('/clubs/no-such-club/');
  expect(res?.status()).toBe(404);
  await expect(page.getByRole('heading', { name: 'Club not found' })).toBeVisible();
});

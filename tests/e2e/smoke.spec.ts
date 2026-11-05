import { expect, test } from '@playwright/test';

test('home page loads with the site heading', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Schulich Meds' })).toBeVisible();
  await expect(page).toHaveTitle(/Hippocratic Council/);
});

test('club directory is reachable from the root', async ({ page }) => {
  const res = await page.goto('/clubs/');
  expect(res?.status()).toBe(200);
  await expect(page.getByRole('heading', { level: 1, name: 'Club directory' })).toBeVisible();
});

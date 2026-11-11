/** Security headers and CSP (plan Task 30). Runs against `wrangler pages dev dist`, which
 *  honours dist/_headers like Cloudflare Pages does. */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';

test('headers on static and server pages', async ({ request }) => {
  for (const path of ['/', '/login/']) {
    const res = await request.get(path);
    const h = res.headers();
    expect(h['content-security-policy'], path).toContain("frame-ancestors 'none'");
    expect(h['strict-transport-security'], path).toBe('max-age=31536000');
    expect(h['x-frame-options'], path).toBe('DENY');
    expect(h['x-content-type-options'], path).toBe('nosniff');
  }
});

test('no inline script in dist', () => {
  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        if (p !== join('dist', 'medfriend')) walk(p);
      } else if (p.endsWith('.html')) {
        for (const tag of readFileSync(p, 'utf8').match(/<script\b[^>]*>/g) ?? []) {
          if (!/\bsrc=/.test(tag) && !/type="application\/(ld\+)?json"/.test(tag)) offenders.push(`${p}: ${tag}`);
        }
      }
    }
  };
  walk('dist');
  expect(offenders).toEqual([]);
});

// Each later task that adds a page adds it here.
const PAGES = ['/', '/login/', '/clubs/', '/calendar/', '/contact/', '/room-booking/', '/medfriend/'];

test('no CSP violations', async ({ page }) => {
  const violations: string[] = [];
  page.on('console', (msg) => {
    if (/Content Security Policy|Content-Security-Policy/i.test(msg.text())) violations.push(`${page.url()}: ${msg.text()}`);
  });
  for (const path of PAGES) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
  }
  // A club page with an Instagram card, with "Show recent Instagram posts" clicked.
  // Instagram itself is stubbed: the test is about this site's policy, not Instagram's page.
  await page.route('https://www.instagram.com/**', (r) => r.fulfill({ contentType: 'text/html', body: '<p>stub</p>' }));
  await page.goto('/clubs/');
  const clubLinks = await page.locator('.club-card h2 a').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute('href')));
  for (const href of clubLinks) {
    await page.goto(href ?? '/');
    const toggle = page.getByRole('button', { name: 'Show recent Instagram posts' });
    if (await toggle.count()) {
      await toggle.click();
      await page.waitForLoadState('networkidle');
      break;
    }
  }
  expect(violations).toEqual([]);
});

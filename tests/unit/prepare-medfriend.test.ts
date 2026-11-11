import { mkdtempSync, readFileSync, existsSync, writeFileSync, rmSync, mkdirSync, cpSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { prepareMedfriend, rewriteHtml } from '../../scripts/prepare-medfriend.mjs';

const FIXTURE = 'tests/fixtures/medfriend-fake';
const temps: string[] = [];
const tmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'mf-'));
  temps.push(d);
  return d;
};
afterEach(() => temps.splice(0).forEach((d) => rmSync(d, { recursive: true, force: true })));

describe('prepareMedfriend', () => {
  it('copies the site but not decks, tools, .github or dotfiles', () => {
    const dest = tmp();
    const { copied, decks } = prepareMedfriend(FIXTURE, dest);
    expect(existsSync(join(dest, 'index.html'))).toBe(true);
    expect(existsSync(join(dest, 'fom/questions.json'))).toBe(true);
    expect(existsSync(join(dest, 'fom/anki/b1.apkg'))).toBe(false);
    expect(existsSync(join(dest, 'tools'))).toBe(false);
    expect(existsSync(join(dest, '.github'))).toBe(false);
    expect(existsSync(join(dest, '.env'))).toBe(false);
    expect(copied).toBe(8);
    expect(decks).toEqual([{ path: 'fom/anki/b1.apkg', sha256: expect.stringMatching(/^[0-9a-f]{64}$/) }]);
  });

  it('fails on a file over 25 MiB', () => {
    const src = tmp();
    cpSync(FIXTURE, src, { recursive: true });
    mkdirSync(join(src, 'big'), { recursive: true });
    writeFileSync(join(src, 'big/huge.pdf'), Buffer.alloc(26 * 1024 * 1024));
    expect(() => prepareMedfriend(src, tmp())).toThrow('file over 25 MiB: big/huge.pdf');
  });

  it('swaps Firebase for the uwomeds.com account on pages that sync', () => {
    const dest = tmp();
    prepareMedfriend(FIXTURE, dest);
    const quiz = readFileSync(join(dest, 'fom/quiz.html'), 'utf8');
    expect(quiz).not.toMatch(/firebase|fake-key/i);
    expect(quiz).toContain('window.PORTAL_SYNC_CFG = {"stores": ["nsq.fake.v1."]}');
    // The account storage loads before sync.js reads it.
    expect(quiz.indexOf('/medfriend-account.js')).toBeGreaterThan(-1);
    expect(quiz.indexOf('/medfriend-account.js')).toBeLessThan(quiz.indexOf('sync.js?v=1'));
    // Pages without sync are left alone.
    expect(readFileSync(join(dest, 'fom/b1.html'), 'utf8')).not.toContain('/medfriend-account.js');
  });

  it('rewrites pages: site bar, links, decks, no analytics', () => {
    const dest = tmp();
    prepareMedfriend(FIXTURE, dest);
    const hub = readFileSync(join(dest, 'index.html'), 'utf8');
    expect(hub).toContain('<nav class="uwomeds-bar"');
    expect(hub).toContain('href="/medfriend-bar.css"');
    expect(hub).toContain('<link rel="stylesheet" href="/medfriend/base.css">');
    expect(hub).toContain('<meta property="og:url" content="https://uwomeds.com/medfriend/">');
    expect(hub).toContain('<link rel="canonical" href="https://uwomeds.com/medfriend/">');
    expect(hub).not.toContain('cloudflareinsights');
    expect(hub).not.toContain('schulichmed.github.io');
    const b1 = readFileSync(join(dest, 'fom/b1.html'), 'utf8');
    expect(b1).toContain('href="/medfriend/"');
    expect(b1).toContain('href="https://schulichmed.github.io/preclerkship/fom/anki/b1.apkg"');
    const landing = readFileSync(join(dest, 'clinical-skills/landing.html'), 'utf8');
    expect(landing).toContain('url=/medfriend/clinical-skills/exam.html');
  });

  it('leaves pages without a body or head intact', () => {
    expect(rewriteHtml('<p>fragment</p>', 'x.html')).toBe('<p>fragment</p>');
  });
});

import { describe, expect, it } from 'vitest';
import { detectNetwork, instagramHandle } from '../../src/lib/socials';
import { clubPageHtml } from '../../src/lib/render-club';
import type { Club } from '../../src/lib/types';

describe('detectNetwork', () => {
  it('recognises each network by host', () => {
    expect(detectNetwork('https://www.instagram.com/fakeclub/')).toBe('instagram');
    expect(detectNetwork('https://facebook.com/fakeclub')).toBe('facebook');
    expect(detectNetwork('https://fb.com/fakeclub')).toBe('facebook');
    expect(detectNetwork('https://www.tiktok.com/@fakeclub')).toBe('tiktok');
    expect(detectNetwork('https://ca.linkedin.com/company/fakeclub')).toBe('linkedin');
    expect(detectNetwork('https://www.youtube.com/@fakeclub')).toBe('youtube');
    expect(detectNetwork('https://youtu.be/abc')).toBe('youtube');
    expect(detectNetwork('https://linktr.ee/fakeclub')).toBe('linktree');
  });

  it('calls anything else a website, lookalikes included', () => {
    expect(detectNetwork('https://example.org')).toBe('website');
    expect(detectNetwork('https://instagram.com.evil.example/x')).toBe('website');
    expect(detectNetwork('not a url')).toBe('website');
  });
});

describe('instagramHandle', () => {
  it('finds a profile handle', () => {
    expect(instagramHandle('https://www.instagram.com/fakeclub/?hl=en')).toBe('fakeclub');
    expect(instagramHandle('https://instagram.com/fake.club_1')).toBe('fake.club_1');
  });

  it('gives null for posts, reels and other sites', () => {
    expect(instagramHandle('https://www.instagram.com/p/Cabc123/')).toBeNull();
    expect(instagramHandle('https://www.instagram.com/reel/Cabc123/')).toBeNull();
    expect(instagramHandle('https://example.org/fakeclub')).toBeNull();
  });
});

describe('club page socials', () => {
  const club: Club = {
    slug: 'fake-club',
    name: 'Fake Club',
    description: 'About us.',
    campuses: ['london'],
    links: ['https://www.instagram.com/fakeclub/'],
    execs: [],
  };

  it('shows the Instagram card and, when the embed is on, the button without loading anything', () => {
    const html = clubPageHtml(club, { isOwnExec: false, instagramEmbed: true });
    expect(html).toContain('@fakeclub');
    expect(html).toContain('Show recent Instagram posts');
    expect(html).not.toContain('<iframe');
  });

  it('keeps the card but drops the button when the embed is off', () => {
    const html = clubPageHtml(club, { isOwnExec: false, instagramEmbed: false });
    expect(html).toContain('@fakeclub');
    expect(html).not.toContain('Show recent Instagram posts');
  });

  it('hides an empty socials section from visitors and nudges the club\'s execs', () => {
    const bare = { ...club, links: [] };
    expect(clubPageHtml(bare, { isOwnExec: false, instagramEmbed: true })).not.toContain('Find us online');
    expect(clubPageHtml(bare, { isOwnExec: true, instagramEmbed: true })).toContain("Add your club's socials");
  });

  it('escapes club text', () => {
    const html = clubPageHtml({ ...club, description: '<script>x</script>' }, { isOwnExec: false, instagramEmbed: true });
    expect(html).not.toContain('<script>x');
  });
});

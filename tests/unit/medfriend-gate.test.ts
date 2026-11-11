import { describe, expect, it } from 'vitest';
import { gateDecision, isPagePath, type GateInput } from '../../src/lib/medfriend';

const student = { user: { email: 'student1@meds.uwo.ca' }, role: 'student', noticeSeen: true };
const at = (path: string, who: Omit<GateInput, 'path'>) => gateDecision({ path, ...who });
const out = { user: null, role: null, noticeSeen: false };

describe('gateDecision', () => {
  it('shows signed-out visitors the landing page at the MedFriend root', () => {
    expect(at('/medfriend', out)).toBe('landing');
    expect(at('/medfriend/', out)).toBe('landing');
  });

  it('sends signed-out visitors to sign in for everything else, JSON and decks included', () => {
    for (const p of ['/medfriend/fom/b1', '/medfriend/fom/b1.html', '/medfriend/fom/questions.json', '/medfriend/app.js', '/medfriend/fom/anki/b1.apkg', '/medfriend/source.zip'])
      expect(at(p, out), p).toBe('login');
  });

  it('serves signed-in readers, staff included', () => {
    expect(at('/medfriend/', student)).toBe('asset');
    expect(at('/medfriend/fom/questions.json', student)).toBe('asset');
    expect(at('/medfriend/fom/b1', { ...student, user: { email: 'staff1@uwo.ca' } })).toBe('asset');
  });

  it('sends decks to the deck store', () => {
    expect(at('/medfriend/fom/anki/b1.apkg', student)).toBe('deck');
    expect(at('/medfriend/source.zip', student)).toBe('deck');
  });

  it('treats a blocked reader (no role) as signed out', () => {
    expect(at('/medfriend/', { ...student, role: null })).toBe('login');
    expect(at('/medfriend/fom/questions.json', { ...student, role: null })).toBe('login');
  });

  it('shows a first-time reader the notice on pages only', () => {
    const fresh = { ...student, noticeSeen: false };
    expect(at('/medfriend/', fresh)).toBe('notice');
    expect(at('/medfriend/fom/b1', fresh)).toBe('notice');
    expect(at('/medfriend/fom/b1.html', fresh)).toBe('notice');
    expect(at('/medfriend/fom/questions.json', fresh)).toBe('asset');
    expect(at('/medfriend/base.css', fresh)).toBe('asset');
  });

  it('refuses paths outside MedFriend or with dot segments', () => {
    expect(at('/medfriendly/', student)).toBe('not_found');
    expect(at('/medfriend/../admin/', student)).toBe('not_found');
    expect(at('/medfriend/fom%2f..%2fx', student)).toBe('not_found');
  });
});

describe('isPagePath', () => {
  it('tells pages from files', () => {
    expect(isPagePath('/medfriend/')).toBe(true);
    expect(isPagePath('/medfriend/fom/b1')).toBe(true);
    expect(isPagePath('/medfriend/fom/b1.html')).toBe(true);
    expect(isPagePath('/medfriend/fom/q.json')).toBe(false);
  });
});

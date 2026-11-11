import { describe, expect, it } from 'vitest';
import { isProgressKey, isStorePrefix, mergeEntry, mergeProgress } from '../../src/lib/progress-merge';

const rec = (lastTs: number, extra: Record<string, unknown> = {}) => ({ lastTs, attempts: [{ ts: lastTs }], ...extra });

describe('mergeProgress', () => {
  it('keeps answers from both sides', () => {
    const out = mergeProgress({ 'nsq.fom.v1.b1': { q1: rec(10) } }, { 'nsq.fom.v1.b1': { q2: rec(20) } });
    expect(Object.keys(out['nsq.fom.v1.b1']).sort()).toEqual(['q1', 'q2']);
  });

  it('never loses a newer answer, whichever side has it', () => {
    const newerInAccount = mergeProgress({ 'nsq.fom.v1.b1': { q1: rec(30) } }, { 'nsq.fom.v1.b1': { q1: rec(10) } });
    expect(newerInAccount['nsq.fom.v1.b1'].q1).toEqual(rec(30));
    const newerIncoming = mergeProgress({ 'nsq.fom.v1.b1': { q1: rec(10) } }, { 'nsq.fom.v1.b1': { q1: rec(30) } });
    expect(newerIncoming['nsq.fom.v1.b1'].q1).toEqual(rec(30));
  });

  it('keeps the account copy on a tie', () => {
    const out = mergeProgress({ 'nsq.fom.v1.b1': { q1: rec(10, { side: 'account' }) } }, { 'nsq.fom.v1.b1': { q1: rec(10, { side: 'old' }) } });
    expect((out['nsq.fom.v1.b1'].q1 as { side: string }).side).toBe('account');
  });

  it('drops an answer given at or before its clear, from either side', () => {
    const out = mergeProgress(
      { 'nsq.fom.v1.b1': { q1: rec(10), q2: rec(50) }, 'reset:nsq.fom.v1.': { q1: 20 } },
      { 'nsq.fom.v1.b1': { q3: rec(5) }, 'reset:nsq.fom.v1.': { q3: 5 } },
    );
    expect(Object.keys(out['nsq.fom.v1.b1']).sort()).toEqual(['q2']);
    expect(out['reset:nsq.fom.v1.']).toEqual({ q1: 20, q3: 5 });
  });

  it('applies each course its own clears', () => {
    const out = mergeProgress(
      { 'nsq.fom.v1.b1': { q1: rec(10) }, 'nsq.v1.b1': { q1: rec(10) }, 'reset:nsq.v1.': { q1: 20 } },
      {},
    );
    expect(Object.keys(out['nsq.fom.v1.b1'])).toEqual(['q1']);
    expect(Object.keys(out['nsq.v1.b1'])).toEqual([]);
  });

  it('keeps the newer note, deleted notes included', () => {
    const out = mergeProgress(
      { 'memo:nsq.fom.v1.': { v: 1, memos: { q1: { t: 'old', ts: 1 }, q2: { t: 'mine', ts: 9 } } } },
      { 'memo:nsq.fom.v1.': { v: 1, memos: { q1: { t: '', ts: 5 }, q2: { t: 'stale', ts: 3 } } } },
    );
    expect(out['memo:nsq.fom.v1.'].memos).toEqual({ q1: { t: '', ts: 5 }, q2: { t: 'mine', ts: 9 } });
  });

  it('ignores keys MedFriend does not sync', () => {
    expect(Object.keys(mergeProgress({}, { 'firebase:uid': { a: 1 }, 'nsq.fom.v1.b1': {} }))).toEqual(['nsq.fom.v1.b1']);
  });

  it('matches mergeEntry for one entry', () => {
    expect(mergeEntry('block', { q1: rec(1) }, { q1: rec(2) })).toEqual({ q1: rec(2) });
  });
});

describe('key rules', () => {
  it('accepts MedFriend keys and prefixes only', () => {
    for (const k of ['nsq.fom.v1.b1', 'memo:nsq.fom.v1.', 'reset:nsq.v1.', 'pc-theme']) expect(isProgressKey(k), k).toBe(true);
    for (const k of ['pc-theme2', 'firebase', 'pc-sync-meta:x', 'x'.repeat(201)]) expect(isProgressKey(k), k).toBe(false);
    expect(isStorePrefix('nsq.fom.v1.')).toBe(true);
    expect(isStorePrefix('')).toBe(false);
    expect(isStorePrefix('memo:nsq.')).toBe(false);
  });
});

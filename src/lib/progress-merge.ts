/**
 * MedFriend progress: key rules and the merge (plan Task 27). The merge is MedFriend's own
 * (`merge` in its sync.js), ported so the site can combine a reader's saved copies on the
 * server too, for the carry-over from Firebase in Task 29. Merge, never overwrite:
 *   - blocks: per question, the record whose last answer is newer wins (ties keep the
 *     account's copy); a record answered at or before its question's clear is dropped;
 *   - notes ("memo:"): per question, the newer note wins, deleted notes included;
 *   - clears ("reset:"): per question, the later clear wins.
 */

/** The keys MedFriend syncs; matches the database check on medfriend_progress.key. */
export const KEY_PATTERN = /^(nsq\.|memo:|reset:|pc-theme$)/;
/** A course's localStorage prefix, e.g. "nsq.fom.v1." */
const PREFIX_PATTERN = /^nsq\.[a-z0-9._-]{0,60}$/i;
/** sync.js keeps an entry under 900,000 characters; the database allows 1 MiB. */
export const MAX_ENTRY_CHARS = 1_000_000;

export const isProgressKey = (key: string): boolean => key.length <= 200 && KEY_PATTERN.test(key);
export const isStorePrefix = (prefix: string): boolean => PREFIX_PATTERN.test(prefix);

type Obj = Record<string, unknown>;
type Kind = 'block' | 'memo' | 'reset';

const isObj = (x: unknown): x is Obj => !!x && typeof x === 'object' && !Array.isArray(x);
const num = (x: unknown): number => (typeof x === 'number' && Number.isFinite(x) ? x : -1);

export function kindOf(key: string): Kind {
  if (key.startsWith('memo:')) return 'memo';
  if (key.startsWith('reset:')) return 'reset';
  return 'block';
}

/** Merge one entry. `a` wins ties, so an identical copy changes nothing. */
export function mergeEntry(kind: Kind, aIn: unknown, bIn: unknown, resets?: Obj | null): Obj {
  const a = isObj(aIn) ? aIn : null;
  const b = isObj(bIn) ? bIn : null;
  if (kind === 'reset') {
    const out: Obj = {};
    for (const s of [a, b]) if (s) for (const q of Object.keys(s)) if (num(s[q]) > num(out[q])) out[q] = s[q];
    return out;
  }
  if (kind === 'memo') {
    const out: Obj = a ? structuredClone(a) : { v: 1, memos: {} };
    if (!isObj(out.memos)) out.memos = {};
    const memos = out.memos as Obj;
    const inc = b && isObj(b.memos) ? b.memos : {};
    for (const q of Object.keys(inc)) {
      const m = inc[q];
      if (!isObj(m) || typeof m.t !== 'string' || num(m.ts) < 0) continue;
      const have = memos[q];
      if (isObj(have) && num(have.ts) >= num(m.ts)) continue;
      memos[q] = { t: m.t, ts: m.ts };
    }
    return out;
  }
  const out: Record<string, Obj> = {};
  if (a) for (const k of Object.keys(a)) if (isObj(a[k])) out[k] = a[k] as Obj;
  if (b)
    for (const k of Object.keys(b)) {
      const rec = b[k];
      if (!isObj(rec)) continue;
      if (!out[k] || num(rec.lastTs) > num(out[k].lastTs)) out[k] = rec;
    }
  if (resets)
    for (const k of Object.keys(out)) if (num(resets[k]) >= 0 && num(out[k].lastTs) <= num(resets[k])) delete out[k];
  return out;
}

/** The course prefix a block key belongs to: the longest one with a clears entry. */
function resetFor(key: string, merged: Record<string, Obj>): Obj | null {
  let best: string | null = null;
  for (const k of Object.keys(merged)) {
    if (!k.startsWith('reset:')) continue;
    const prefix = k.slice('reset:'.length);
    if (key.startsWith(prefix) && (!best || prefix.length > best.length)) best = prefix;
  }
  return best === null ? null : merged[`reset:${best}`];
}

/**
 * Merge every entry of `incoming` (e.g. a reader's old Firebase copy) into `account` (what
 * the uwomeds.com account holds). Clears merge first, so blocks already know every clear.
 * Keys MedFriend doesn't sync are ignored.
 */
export function mergeProgress(account: Record<string, unknown>, incoming: Record<string, unknown>): Record<string, Obj> {
  const keys = [...new Set([...Object.keys(account), ...Object.keys(incoming)])].filter(isProgressKey);
  const out: Record<string, Obj> = {};
  for (const key of keys.filter((k) => kindOf(k) === 'reset')) out[key] = mergeEntry('reset', account[key], incoming[key]);
  for (const key of keys.filter((k) => kindOf(k) !== 'reset')) {
    const kind = kindOf(key);
    if (key === 'pc-theme') {
      // A display setting, not progress: the account's choice stands.
      const theme = account[key] ?? incoming[key];
      if (theme !== undefined) out[key] = theme as Obj;
      continue;
    }
    out[key] = mergeEntry(kind, account[key], incoming[key], kind === 'block' ? resetFor(key, out) : null);
  }
  return out;
}

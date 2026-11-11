/**
 * MedFriend progress in the uwomeds.com account (plan Task 27). Called by
 * public/medfriend-account.js, the storage MedFriend's sync.js uses on uwomeds.com.
 *   GET    ?me=1                    who is signed in: { user: { id, email } }
 *   GET    ?prefix=P&since=MS       a course's entries written after MS: { rows: [{ k, d, ts }] }
 *   GET    ?key=K                   one entry: { d, ver } (d and ver null when there is none)
 *   PUT    { key, d, ver }          save d (JSON text) if the entry is still at version ver:
 *                                   200 { ver }, or 409 when another write got there first
 *   DELETE { prefixes: [P, ...] }   delete these courses' saved copy: { deleted }
 * Same origin as MedFriend, so the session cookie is enough. Never cached.
 */
import type { APIRoute } from 'astro';
import { createServerClient } from '../../../lib/supabase';
import { isProgressKey, isStorePrefix, MAX_ENTRY_CHARS } from '../../../lib/progress-merge';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store' },
  });

/** Writes must come from this site: no other site can spend a reader's session. */
function sameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  return !!origin && origin === new URL(request.url).origin && /^application\/json\b/.test(request.headers.get('content-type') ?? '');
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const text = await request.text();
    if (text.length > MAX_ENTRY_CHARS + 1000) return null;
    const body = JSON.parse(text);
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

export const ALL: APIRoute = async (ctx) => {
  const { request, locals, url } = ctx;
  const supabase = createServerClient(ctx);
  if (!supabase || !locals.user) return json({ error: 'Sign in first.' }, 401);
  if (!locals.role) return json({ error: 'This account is blocked.' }, 403);

  if (request.method === 'GET') {
    if (url.searchParams.get('me')) return json({ user: locals.user });

    const key = url.searchParams.get('key');
    if (key !== null) {
      if (!isProgressKey(key)) return json({ error: 'Unknown key.' }, 400);
      const { data, error } = await supabase.from('medfriend_progress').select('value, version').eq('key', key).maybeSingle();
      if (error) return json({ error: 'Could not read progress.' }, 502);
      return json({ d: data ? JSON.stringify(data.value) : null, ver: data?.version ?? null });
    }

    const prefix = url.searchParams.get('prefix') ?? '';
    const since = Number(url.searchParams.get('since') ?? 0);
    if (!isStorePrefix(prefix) || !Number.isFinite(since)) return json({ error: 'Unknown course.' }, 400);
    const { data, error } = await supabase.rpc('medfriend_progress_pull', { prefix, since_ms: Math.max(0, Math.floor(since)) });
    if (error) return json({ error: 'Could not read progress.' }, 502);
    const rows = (data as { k: string; d: unknown; ts: number }[]).map((r) => ({ k: r.k, d: JSON.stringify(r.d), ts: Number(r.ts) }));
    return json({ rows });
  }

  if (request.method !== 'PUT' && request.method !== 'DELETE') return json({ error: 'Not allowed.' }, 405);
  if (!sameOrigin(request)) return json({ error: 'Not allowed.' }, 403);
  const body = await readBody(request);
  if (!body) return json({ error: 'Bad request.' }, 400);

  if (request.method === 'PUT') {
    const { key, d, ver } = body;
    if (typeof key !== 'string' || !isProgressKey(key)) return json({ error: 'Unknown key.' }, 400);
    if (typeof d !== 'string' || d.length > MAX_ENTRY_CHARS) return json({ error: 'Too large.' }, 413);
    if (ver !== null && !(typeof ver === 'number' && Number.isInteger(ver))) return json({ error: 'Bad version.' }, 400);
    let value: unknown;
    try {
      value = JSON.parse(d);
    } catch {
      return json({ error: 'Not JSON.' }, 400);
    }
    const { data, error } = await supabase.rpc('medfriend_progress_put', { entry_key: key, entry_value: value, expected: ver });
    if (error) return json({ error: 'Could not save progress.' }, 502);
    if (data === null) return json({ error: 'Changed elsewhere.' }, 409);
    return json({ ver: Number(data) });
  }

  const prefixes = body.prefixes;
  if (!Array.isArray(prefixes) || !prefixes.length || prefixes.length > 20 || !prefixes.every((p) => typeof p === 'string' && isStorePrefix(p)))
    return json({ error: 'Unknown course.' }, 400);
  const { data, error } = await supabase.rpc('medfriend_progress_wipe', { prefixes });
  if (error) return json({ error: 'Could not delete progress.' }, 502);
  return json({ deleted: data });
};

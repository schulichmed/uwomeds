/**
 * The MedFriend gate (plan Task 26). Every request under /medfriend/ runs through
 * `gateMedfriend` in src/worker.ts before Astro sees it, so a signed-out visitor gets no
 * MedFriend file at all: pages, JSON, images and decks alike. It fails closed: if Supabase
 * isn't reachable or set up, the visitor is treated as signed out.
 */
import { createServerClient as createSsrClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { MEDFRIEND_HEADERS, SITE_HEADERS } from './security-headers';

export type GateDecision = 'landing' | 'login' | 'notice' | 'asset' | 'deck' | 'not_found';

export interface GateInput {
  /** URL pathname, e.g. /medfriend/fom/b1 */
  path: string;
  /** null when signed out */
  user: { email: string } | null;
  /** The profile's role; null when the profile is blocked or missing. */
  role: string | null;
  /** True once the reader has pressed "I understand" on the MedFriend notice. */
  noticeSeen: boolean;
}

const ROOT = /^\/medfriend\/?$/;
const isDeck = (path: string) => /\.apkg$/i.test(path) || /\/source\.zip$/i.test(path);

/** A page (as opposed to a file a page loads): no extension, a trailing slash, or .html. */
export function isPagePath(path: string): boolean {
  const last = path.split('/').pop() ?? '';
  return last === '' || last.endsWith('.html') || !last.includes('.');
}

export function gateDecision({ path, user, role, noticeSeen }: GateInput): GateDecision {
  if (!ROOT.test(path) && !path.startsWith('/medfriend/')) return 'not_found';
  // Encoded slashes or dot segments never name a real MedFriend file.
  if (/%2f|%5c|(^|\/)\.\.?(\/|$)/i.test(path)) return 'not_found';
  if (!user) return ROOT.test(path) ? 'landing' : 'login';
  if (!role) return 'login';
  if (isDeck(path)) return 'deck';
  if (!noticeSeen && isPagePath(path)) return 'notice';
  return 'asset';
}

/** Private, never stored by a browser or a shared cache. */
export const NO_STORE = 'private, no-store';

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
  ASSETS: { fetch: (req: Request | string) => Promise<Response> };
  MEDFRIEND_DECKS?: { get: (key: string) => Promise<{ body: ReadableStream; httpEtag: string; size: number } | null> };
}

interface Reader {
  user: { id: string; email: string } | null;
  role: string | null;
  noticeSeen: boolean;
  cookies: string[];
}

/** Who is asking, from the Supabase session cookie. Any failure counts as signed out. */
async function readSession(request: Request, env: Env): Promise<Reader> {
  const reader: Reader = { user: null, role: null, noticeSeen: false, cookies: [] };
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return reader;
  const secure = new URL(request.url).protocol === 'https:';
  try {
    const supabase = createSsrClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      cookies: {
        getAll: () =>
          parseCookieHeader(request.headers.get('cookie') ?? '').map((c) => ({ name: c.name, value: c.value ?? '' })),
        // A refreshed session has to reach the browser, or it would be signed out on expiry.
        setAll: (list) =>
          list.forEach(({ name, value, options }) =>
            reader.cookies.push(
              serializeCookieHeader(name, value, { ...options, path: '/', httpOnly: true, secure, sameSite: 'lax' }),
            ),
          ),
      },
    });
    const { data } = await supabase.auth.getUser();
    if (!data.user?.email) return reader;
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role, blocked, medfriend_notice_at')
      .eq('id', data.user.id)
      .maybeSingle();
    if (error || !profile) return reader;
    reader.user = { id: data.user.id, email: data.user.email };
    reader.role = profile.blocked ? null : (profile.role as string);
    reader.noticeSeen = !!profile.medfriend_notice_at;
  } catch {
    return { user: null, role: null, noticeSeen: false, cookies: [] };
  }
  return reader;
}

function withHeaders(res: Response, headers: Record<string, string>, cookies: string[]): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(headers)) out.headers.set(k, v);
  out.headers.set('Cache-Control', NO_STORE);
  out.headers.delete('ETag'); // nothing to revalidate against: it is never stored
  for (const c of cookies) out.headers.append('Set-Cookie', c);
  return out;
}

function redirect(to: string, cookies: string[]): Response {
  return withHeaders(new Response(null, { status: 302, headers: { Location: to } }), SITE_HEADERS, cookies);
}

/** Handle a request under /medfriend/. */
export async function gateMedfriend(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const reader = await readSession(request, env);
  const decision = gateDecision({ path, user: reader.user, role: reader.role, noticeSeen: reader.noticeSeen });
  const here = `${path}${url.search}`;

  switch (decision) {
    case 'landing': {
      const page = await env.ASSETS.fetch(new URL('/medfriend-landing/', url).toString());
      return withHeaders(page, SITE_HEADERS, reader.cookies);
    }
    case 'login':
      return redirect(`/login/?next=${encodeURIComponent(here)}`, reader.cookies);
    case 'notice':
      return redirect(`/medfriend-notice/?next=${encodeURIComponent(here)}`, reader.cookies);
    case 'deck': {
      // Decks move to the R2 bucket in Task 0B; until then they stay on GitHub Pages.
      const key = decodeURIComponent(path.slice('/medfriend/'.length));
      const obj = env.MEDFRIEND_DECKS ? await env.MEDFRIEND_DECKS.get(key) : null;
      if (!obj) return withHeaders(new Response('Not found', { status: 404 }), MEDFRIEND_HEADERS, reader.cookies);
      const name = key.split('/').pop() ?? 'deck';
      return withHeaders(
        new Response(obj.body, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': String(obj.size),
            'Content-Disposition': `attachment; filename="${name.replace(/"/g, '')}"`,
          },
        }),
        MEDFRIEND_HEADERS,
        reader.cookies,
      );
    }
    case 'asset': {
      const file = await env.ASSETS.fetch(new Request(url.toString(), { method: request.method === 'HEAD' ? 'HEAD' : 'GET' }));
      return withHeaders(file, MEDFRIEND_HEADERS, reader.cookies);
    }
    default:
      return withHeaders(new Response('Not found', { status: 404 }), MEDFRIEND_HEADERS, reader.cookies);
  }
}

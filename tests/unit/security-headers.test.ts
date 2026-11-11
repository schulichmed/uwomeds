import { describe, expect, it } from 'vitest';
import { MEDFRIEND_HEADERS, parseHeadersFile, SITE_HEADERS, siteHeadersFile, toHeadersFile } from '../../src/lib/security-headers';

const directive = (csp: string, name: string) => csp.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) ?? '';

describe('security headers', () => {
  it('the _headers file reads back to exactly SITE_HEADERS', () => {
    expect(parseHeadersFile(toHeadersFile({ '/*': SITE_HEADERS }))).toEqual({ '/*': SITE_HEADERS });
  });

  it('the site file sets the MedFriend policy under /medfriend/ and detaches the council one', () => {
    const text = siteHeadersFile();
    const rules = parseHeadersFile(text);
    expect(rules['/*']).toEqual(SITE_HEADERS);
    expect(rules['/medfriend/*']['Content-Security-Policy']).toBe(MEDFRIEND_HEADERS['Content-Security-Policy']);
    expect(rules['/medfriend/*']['X-Frame-Options']).toBe('SAMEORIGIN');
    expect(text).toContain('  ! Content-Security-Policy');
    expect(text).toContain('  ! X-Frame-Options');
  });

  it('the council site allows no inline scripts and no framing', () => {
    const csp = SITE_HEADERS['Content-Security-Policy'];
    expect(directive(csp, 'script-src')).not.toContain("'unsafe-inline'");
    expect(directive(csp, 'script-src-attr')).toBe("script-src-attr 'none'");
    expect(directive(csp, 'frame-ancestors')).toBe("frame-ancestors 'none'");
    expect(SITE_HEADERS['X-Frame-Options']).toBe('DENY');
  });

  it('both sets send HSTS without subdomains while mail stays at Bluehost', () => {
    for (const h of [SITE_HEADERS, MEDFRIEND_HEADERS]) {
      expect(h['Strict-Transport-Security']).toBe('max-age=31536000');
      expect(h['X-Content-Type-Options']).toBe('nosniff');
    }
  });

  it('MedFriend cannot reach Firebase or other outside servers', () => {
    expect(directive(MEDFRIEND_HEADERS['Content-Security-Policy'], 'connect-src')).toBe("connect-src 'self'");
  });
});

/**
 * Parse the exec roster CSV the Community Relations Director uploads
 * (columns: club, name, email, role). Clubs match by name or slug, ignoring case.
 */
import { isAllowedEmail, normaliseEmail } from './email-domain';
import type { Club, RosterRow } from './types';

export const ROSTER_COLUMNS = ['club', 'name', 'email', 'role'] as const;

export interface ParsedRoster {
  rows: RosterRow[];
  errors: string[];
}

/** Split CSV text into records, honouring "quoted, fields" and doubled quotes. */
function splitCsv(text: string): string[][] {
  const records: string[][] = [];
  let field = '';
  let record: string[] = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') {
      record.push(field);
      field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      record.push(field);
      records.push(record);
      record = [];
      field = '';
    } else field += ch;
  }
  if (field || record.length) {
    record.push(field);
    records.push(record);
  }
  return records.filter((r) => r.some((f) => f.trim()));
}

export function parseRoster(text: string, clubs: Club[]): ParsedRoster {
  const records = splitCsv(text.trim());
  const errors: string[] = [];
  if (!records.length) return { rows: [], errors: ['The file is empty.'] };
  const header = records[0].map((h) => h.trim().toLowerCase());
  const index = ROSTER_COLUMNS.map((c) => header.indexOf(c));
  if (index.some((i) => i < 0)) {
    return { rows: [], errors: [`The first line must name the columns: ${ROSTER_COLUMNS.join(', ')}.`] };
  }
  const byKey = new Map<string, Club>();
  clubs.forEach((c) => {
    byKey.set(c.name.toLowerCase(), c);
    byKey.set(c.slug, c);
  });
  const rows: RosterRow[] = [];
  const seen = new Set<string>();
  records.slice(1).forEach((rec, n) => {
    const line = n + 2;
    const [club, name, email, role] = index.map((i) => (rec[i] ?? '').trim());
    const match = byKey.get(club.toLowerCase());
    const addr = normaliseEmail(email);
    if (!match) errors.push(`Line ${line}: no club called "${club}".`);
    if (!name) errors.push(`Line ${line}: name is missing.`);
    if (!isAllowedEmail(addr)) errors.push(`Line ${line}: "${email}" is not a Western email (@uwo.ca or @meds.uwo.ca).`);
    if (match && seen.has(`${match.slug} ${addr}`)) errors.push(`Line ${line}: ${addr} is listed twice for ${match.name}.`);
    if (match && name && isAllowedEmail(addr)) {
      seen.add(`${match.slug} ${addr}`);
      rows.push({ clubSlug: match.slug, name, email: addr, role: role || 'Exec' });
    }
  });
  if (!rows.length && !errors.length) errors.push('The file has a header but no exec rows.');
  return { rows, errors };
}

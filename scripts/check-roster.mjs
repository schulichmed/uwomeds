/**
 * Purpose: check this year's exec roster CSV before uploading it, WITHOUT printing
 *          anyone's name or email. Run it on your own computer; nothing is sent anywhere.
 * Usage:   node scripts/check-roster.mjs path/to/roster.csv
 * Input:   CSV with a header row naming the columns club, name, email, role (any order).
 * Output:  club names that don't match the directory (club names are public), plus the
 *          line numbers of rows with a missing name, a non-Western email or a duplicate.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/check-roster.mjs path/to/roster.csv');
  process.exit(2);
}

// Club names and slugs from the directory data, each mapped to the club's slug.
const clubsSrc = readFileSync(fileURLToPath(new URL('../src/data/clubs.ts', import.meta.url)), 'utf8');
const known = new Map();
for (const m of clubsSrc.matchAll(/^\s+slug:\s*"([^"]+)",\s*\r?\n\s+name:\s*("(?:[^"\\]|\\.)*")/gm)) {
  known.set(m[1].toLowerCase(), m[1]);
  known.set(JSON.parse(m[2]).trim().toLowerCase(), m[1]);
}

/** Split CSV text into records, honouring "quoted, fields" and doubled quotes. */
function splitCsv(text) {
  const records = [];
  let field = '';
  let record = [];
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { record.push(field); field = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      record.push(field); records.push(record); record = []; field = '';
    } else field += ch;
  }
  if (field || record.length) { record.push(field); records.push(record); }
  return records.filter((r) => r.some((f) => f.trim()));
}

const isWestern = (email) => /^[^\s@]+@(meds\.)?uwo\.ca$/.test(email);

const records = splitCsv(readFileSync(file, 'utf8').replace(/^﻿/, '').trim());
if (!records.length) { console.error('The file is empty.'); process.exit(1); }
const header = records[0].map((h) => h.trim().toLowerCase());
const col = Object.fromEntries(['club', 'name', 'email', 'role'].map((c) => [c, header.indexOf(c)]));
const missingCols = Object.entries(col).filter(([, i]) => i < 0).map(([c]) => c);
if (missingCols.length) {
  console.error(`The first row must name the columns club, name, email, role. Missing: ${missingCols.join(', ')}.`);
  console.error(`Found: ${header.join(', ')}`);
  process.exit(1);
}

const unknownClubs = new Map(); // club name -> line numbers
const noName = [];
const badEmail = [];
const dupes = [];
const seen = new Set();
const clubsOnFile = new Set();
records.slice(1).forEach((rec, n) => {
  const line = n + 2;
  const club = (rec[col.club] ?? '').trim();
  const email = (rec[col.email] ?? '').replace(/\s+/g, '').toLowerCase();
  if (!known.has(club.toLowerCase())) {
    unknownClubs.set(club || '(blank)', [...(unknownClubs.get(club || '(blank)') ?? []), line]);
  } else clubsOnFile.add(known.get(club.toLowerCase()));
  if (!(rec[col.name] ?? '').trim()) noName.push(line);
  if (!isWestern(email)) badEmail.push(line);
  const key = `${club.toLowerCase()} ${email}`;
  if (seen.has(key)) dupes.push(line);
  seen.add(key);
});

const lines = (a) => a.join(', ');
console.log(`${records.length - 1} exec rows, ${clubsOnFile.size} matching clubs.`);
if (unknownClubs.size) {
  console.log(`\nClub names not in the directory (${unknownClubs.size}). Fix the spelling to match the club page:`);
  for (const [club, at] of unknownClubs) console.log(`  "${club}"  (lines ${lines(at)})`);
}
if (noName.length) console.log(`\nMissing a name: lines ${lines(noName)}`);
if (badEmail.length) console.log(`\nNot a Western email (@meds.uwo.ca or @uwo.ca): lines ${lines(badEmail)}`);
if (dupes.length) console.log(`\nSame person listed twice for the same club: lines ${lines(dupes)}`);
const problems = unknownClubs.size + noName.length + badEmail.length + dupes.length;
console.log(problems ? '\nFix these, then run the check again.' : '\nAll good: ready to upload.');
process.exit(problems ? 1 : 0);

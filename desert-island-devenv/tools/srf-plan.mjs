// srf-plan.mjs -- split the front-end stack into one bundle per SRF approval status.
// Created 2026-10-02 (Axium) for tools/build-srf-bundles.sh; run by it, not by hand.
//
// Inputs:  the status spreadsheet (CSV: Category, Software, Current Major, Requested Version,
//          Purpose, Approval Status, ...), stack/srf-components.tsv (row -> npm packages / files),
//          the example stack's pnpm-lock.yaml, stack/package-managers/package-lock.json, and a
//          complete front-end bundle (its npm/MANIFEST.json and raw/ tree).
// Output:  a JSON plan: per status -> rows, npm tarballs, raw files, VS Code extensions, and
//          "requires" (packages from OTHER statuses this one needs before it is usable).
//
// The rules, so a reader can check them:
//  1. Every npm package the stack declares belongs to exactly ONE spreadsheet row (the mapping), at
//     the version the stack declares. Another version of the same name that something else pulls
//     in (Angular's build needs @babel/core 8; the Babel row is 7) is an ordinary transitive
//     dependency of whatever pulls it in -- and is listed, because an approval is for one major
//     (for a 0.x package, one minor: semver treats each 0.x minor as a breaking line).
//  2. A status bundle holds its rows' packages plus their transitive dependencies, following real
//     dependency edges in the lockfile. When an edge reaches a package owned by ANOTHER status, it
//     is not copied: it is reported as a requirement ("ts-jest needs jest -- MAJOR BUMP SRF NEEDED").
//     A peer edge to a package a row owns is never followed either -- it is reported when it crosses
//     statuses. A peer edge to an un-owned package IS followed: pnpm installs resolved peers.
//  3. Transitive packages no row owns go into EVERY status that reaches them, so each bundle is
//     self-contained apart from its reported requirements and can be ported in any order
//     (duplicates cost bytes only; the loader skips what Nexus already has).
//  4. The union of all statuses must equal the complete bundle's npm pool -- checked; a gap stops.
import fs from 'node:fs'; import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? a.push([v.slice(2), arr[i + 1]]) : 0, a), []));
for (const k of ['sheet', 'map', 'lock', 'pm-lock', 'bundle', 'out']) if (!args[k]) { console.error(`srf-plan: --${k} is required`); process.exit(2); }
const die = m => { console.error('STOP: ' + m); process.exit(1); };
const norm = s => s.replace(/^﻿/, '').trim().toLowerCase().replace(/\s+/g, ' ');

// ---------- the spreadsheet (CSV with quoted fields; Excel adds a BOM and CRLFs) ----------
function parseCsv(text) {
  const rows = []; let row = [], f = '', q = false;
  text = text.replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"' && text[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); rows.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim() !== ''));
}
const csv = parseCsv(fs.readFileSync(args.sheet, 'utf8'));
const header = csv[0].map(norm);
const col = name => { const i = header.findIndex(h => h === name); if (i < 0) die(`the sheet has no "${name}" column (found: ${csv[0].join(' | ')})`); return i; };
const C = { category: col('category'), software: col('software'), current: col('current major'), requested: col('requested version'), purpose: col('purpose'), status: col('approval status') };
const sheet = csv.slice(1).map(r => ({ category: (r[C.category] || '').trim(), software: (r[C.software] || '').trim(), current: (r[C.current] || '').trim(),
  requested: (r[C.requested] || '').trim(), purpose: (r[C.purpose] || '').trim(), status: (r[C.status] || '').trim() })).filter(r => r.software);
for (const r of sheet) if (!r.status) die(`row "${r.software}" has no Approval Status`);

// ---------- the mapping ----------
const map = new Map();
for (const line of fs.readFileSync(args.map, 'utf8').split('\n')) {
  if (!line.trim() || line.trim().startsWith('#')) continue;
  const [sw, npm = '', other = ''] = line.split('\t');
  map.set(norm(sw), { software: sw.trim(), npm: npm.split(/\s+/).filter(Boolean), other: other.split(/\s+/).filter(Boolean) });
}
const unmapped = sheet.filter(r => !map.has(norm(r.software)));
if (unmapped.length) die(`these spreadsheet rows are not in ${args.map} (add a line for each, or fix the name in the sheet):\n  ` + unmapped.map(r => r.software).join('\n  '));
const sheetKeys = new Set(sheet.map(r => norm(r.software)));
const missingRows = [...map.keys()].filter(k => !sheetKeys.has(k)).map(k => map.get(k).software);

// ---------- statuses: known ones get short names and a porting order; others keep sheet order ----------
const KNOWN = [ // [match (lower-case, substring), slug]
  ['major already approved', 'approved'], ['major bump srf submitted', 'bump-submitted'], ['major bump srf needed', 'bump-needed'],
  ['new srf needed', 'new-srf'], ['nice to have', 'nice-to-have']];
const slugOf = st => (KNOWN.find(([m]) => norm(st).includes(m)) || [null, norm(st).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')])[1];
const statuses = [];
for (const r of sheet) if (!statuses.find(s => s.status === r.status)) statuses.push({ status: r.status, slug: slugOf(r.status) });
const rank = s => { const i = KNOWN.findIndex(([, sl]) => sl === s.slug); return i < 0 ? 100 + statuses.indexOf(s) : i; };
statuses.sort((a, b) => rank(a) - rank(b));
const slugs = statuses.map(s => s.slug); if (new Set(slugs).size !== slugs.length) die('two statuses reduce to the same bundle name: ' + slugs.join(', '));

// ---------- ownership: npm package name -> row ----------
const owner = new Map();
for (const r of sheet) for (const p of map.get(norm(r.software)).npm) {
  if (owner.has(p)) die(`npm package ${p} is claimed by two rows: "${owner.get(p).software}" and "${r.software}"`);
  owner.set(p, r);
}

// ---------- pnpm-lock.yaml v9: importers, packages (peer names), snapshots (resolved edges) ----------
const lockText = fs.readFileSync(args.lock, 'utf8');
if (!/^lockfileVersion: '?9/m.test(lockText)) die('only pnpm lockfileVersion 9 is supported');
const unq = s => s.trim().replace(/^'(.*)'$/, '$1');
const importer = new Map(); const peers = new Map(); const optPeers = new Map(); const snaps = new Map();
{
  let sec = '', cur = null, sub = '', inRoot = false, metaName = '';
  for (const line of lockText.split('\n')) {
    if (/^\S/.test(line)) { sec = line.replace(/:.*$/, ''); cur = null; continue; }
    if (sec === 'importers') {
      if (/^  \S/.test(line)) { inRoot = unq(line.replace(/:\s*$/, '')) === '.'; continue; }
      if (!inRoot) continue;
      let m;
      if ((m = line.match(/^      (\S.*?):\s*$/))) { cur = unq(m[1]); continue; }
      if (cur && (m = line.match(/^        version: (.+)$/))) importer.set(cur, unq(m[1]));
    } else if (sec === 'packages') {
      let m;
      if ((m = line.match(/^  (\S.*?):(\s*\{\})?\s*$/))) { cur = unq(m[1]); sub = ''; continue; }
      if (!cur) continue;
      if ((m = line.match(/^    (\w+):\s*$/))) { sub = m[1]; continue; }
      if (/^    \S/.test(line)) { sub = ''; continue; }
      if (sub === 'peerDependencies' && (m = line.match(/^      (\S.*?):/))) { if (!peers.has(cur)) peers.set(cur, new Set()); peers.get(cur).add(unq(m[1])); }
      if (sub === 'peerDependenciesMeta') {
        if ((m = line.match(/^      (\S.*?):\s*$/))) metaName = unq(m[1]);
        else if (/^        optional: true/.test(line)) { if (!optPeers.has(cur)) optPeers.set(cur, new Set()); optPeers.get(cur).add(metaName); }
      }
    } else if (sec === 'snapshots') {
      let m;
      if ((m = line.match(/^  (\S.*?):(\s*\{\})?\s*$/))) { cur = unq(m[1]); snaps.set(cur, []); sub = ''; continue; }
      if (!cur) continue;
      if ((m = line.match(/^    (\w+):\s*$/))) { sub = m[1]; continue; }
      if (/^    \S/.test(line)) { sub = ''; continue; }
      if ((sub === 'dependencies' || sub === 'optionalDependencies') && (m = line.match(/^      (\S.*?): (.+)$/))) snaps.get(cur).push([unq(m[1]), unq(m[2])]);
    }
  }
}
const at = id => { const i = id.indexOf('@', 1); return [id.slice(0, i), id.slice(i + 1)]; };
const baseOf = key => { const [n, v] = at(key); return n + '@' + v.replace(/\(.*$/, ''); };
// a dependency edge: value is a version (with peer suffix) or an alias "real-name@version"
const edge = (name, value) => (/^[0-9]/.test(value) ? [name, `${name}@${value}`] : [at(value)[0], value]);

// ---------- the complete bundle's pool ----------
const manifest = JSON.parse(fs.readFileSync(path.join(args.bundle, 'npm', 'MANIFEST.json'), 'utf8'));
const pool = new Map();                                   // name@version -> manifest entry
for (const t of manifest.tarballs) {
  const p = t.url.replace(/^[a-z]+:\/\/[^/]+\//, ''); const name = p.split('/-/')[0]; const base = name.split('/').pop();
  pool.set(`${name}@${p.split('/-/')[1].slice(base.length + 1).replace(/\.tgz$/, '')}`, t);
}
// package-managers (npm lock): pnpm has no dependencies; only-allow has one
const pm = JSON.parse(fs.readFileSync(args['pm-lock'], 'utf8')).packages;
const pmClosure = name => { const out = new Set(), q = [name];
  while (q.length) { const n = q.shift(), e = pm['node_modules/' + n]; if (!e || out.has(`${n}@${e.version}`)) continue;
    out.add(`${n}@${e.version}`); q.push(...Object.keys(e.dependencies || {})); }
  return out; };

// every declared package must be owned
const declared = [...importer.keys(), ...Object.keys(pm['']?.dependencies || {})];
const orphans = declared.filter(p => !owner.has(p));
if (orphans.length) die('these packages are declared by the stack but belong to no spreadsheet row (add them to a row in srf-components.tsv):\n  ' + orphans.join('\n  '));
const ghosts = [...owner.keys()].filter(p => !declared.includes(p));
if (ghosts.length) die('srf-components.tsv names packages the stack does not declare:\n  ' + ghosts.join('\n  '));

// a package (name@version, no peer suffix) is OWNED when a row claims the name and it is the declared version
const declaredVer = n => (importer.has(n) ? importer.get(n).replace(/\(.*$/, '') : null);
const isOwned = base => { const [n, v] = at(base); return owner.has(n) && (declaredVer(n) === null || declaredVer(n) === v); };
// The compatibility line semver uses (and npm's ^ ranges): the major, or for 0.x the minor too --
// 0.25 -> 0.28 is as breaking as 7 -> 8 (missed before 2026-10-02: esbuild 0.25 vs Angular's 0.28).
const major = v => (v.startsWith('0.') ? v.split('.').slice(0, 2).join('.') : v.split('.')[0]);

const listOf = m => [...m.values()].map(x => ({ ...x, via: [...x.via].sort() }))
  .sort((a, b) => rank({ slug: a.slug }) - rank({ slug: b.slug }) || a.software.localeCompare(b.software));

// ---------- closures ----------
const rowNpm = r => map.get(norm(r.software)).npm.map(p => importer.has(p) ? `${p}@${declaredVer(p)}` : [...pmClosure(p)][0]);
const rowBySoftware = new Map(sheet.map(r => [r.software, r]));
// walk(starts, status): the npm closure of some packages, inside one status (rules 1-3)
function walk(starts, status) {
  const mine = p => owner.get(p)?.status === status;
  const tar = new Set(), requires = new Map(), optional = new Map(), seen = new Set(), otherMajors = new Map();
  // need(): a dependency or required peer in another status. use(): an OPTIONAL peer in another status
  // (the package works without it, and uses it when the project installs it).
  const note = into => (from, pkg) => { const o = owner.get(pkg); const k = o.software;
    if (!into.has(k)) into.set(k, { software: k, status: o.status, slug: slugOf(o.status), packages: rowNpm(o), via: new Set() });
    into.get(k).via.add(`${from} -> ${pkg}`); };
  const need = note(requires), use = note(optional);
  const q = [];
  for (const p of starts) {
    if (importer.has(p)) q.push(`${p}@${importer.get(p)}`);
    else for (const id of pmClosure(p)) tar.add(id);
  }
  while (q.length) {
    const key = q.shift(); if (seen.has(key)) continue; seen.add(key);
    const base = baseOf(key), [name] = at(base);
    if (pool.has(base)) tar.add(base);                   // not in pool = another platform's binary
    const pe = peers.get(base) || new Set();
    for (const [dn, dv] of snaps.get(key) || snaps.get(base) || []) {
      const [real, dkey] = edge(dn, dv); const b = baseOf(dkey);
      if (pe.has(dn) && isOwned(b)) {                     // owned peer: never copied
        if (!mine(real)) (optPeers.get(base)?.has(dn) ? use : need)(name, real);
        continue;
      }
      if (isOwned(b) && !mine(real)) { need(name, real); continue; }
      if (owner.has(real) && !isOwned(b) && major(at(b)[1]) !== major(declaredVer(real))) {
        if (!otherMajors.has(b)) otherMajors.set(b, { package: b, row: owner.get(real).software, declared: declaredVer(real), via: new Set() });
        otherMajors.get(b).via.add(name);
      }
      q.push(dkey);
    }
  }
  for (const k of requires.keys()) optional.delete(k);
  return { tar, requires: listOf(requires), optional: listOf(optional),
    otherMajors: [...otherMajors.values()].map(x => ({ ...x, via: [...x.via].sort() })).sort((a, b) => a.package.localeCompare(b.package)) };
}

const plan = { created: new Date().toISOString(), sheet: path.basename(args.sheet), statuses: [], checks: {} };
const covered = new Map();                                // name@version -> Set(slug)
const mismatches = [];
for (const st of statuses) {
  const rows = sheet.filter(r => r.status === st.status);
  const w = walk(rows.flatMap(r => map.get(norm(r.software)).npm), st.status);
  for (const id of w.tar) { if (!covered.has(id)) covered.set(id, new Set()); covered.get(id).add(st.slug); }
  // raw files and extensions
  const raw = [], vsix = [], notes = [], rowFiles = new Map();
  for (const r of rows) {
    const files = [];
    for (const o of map.get(norm(r.software)).other) {
      const [kind, ...rest] = o.split(':'); const val = rest.join(':');
      if (kind === 'raw') {
        const dir = path.join(args.bundle, 'raw', val);
        if (!fs.existsSync(dir)) die(`${r.software}: raw/${val} is not in the complete bundle (was it built with --skip-browsers/--skip-vscode?)`);
        const walkDir = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); e.isDirectory() ? walkDir(f) : files.push(path.relative(path.join(args.bundle, 'raw'), f)); } };
        walkDir(dir);
      } else if (kind === 'vsix') {
        const vd = path.join(args.bundle, 'raw', 'vscode-extensions');
        const hits = fs.existsSync(vd) ? fs.readdirSync(vd).filter(f => f.startsWith(val + '-') && f.endsWith('.vsix')) : [];
        if (!hits.length) die(`${r.software}: no ${val} .vsix in the complete bundle`);
        vsix.push(val); files.push(...hits.map(h => 'vscode-extensions/' + h));
      } else if (kind === 'media') notes.push(`${r.software}: not in any bundle -- install from ${val.replace(/-/g, ' ')}`);
      else if (kind === 'with') notes.push(`${r.software}: ships inside the ${val} files of the bundle that carries ${val}`);
      else die(`unknown artifact "${o}" for ${r.software}`);
    }
    raw.push(...files); rowFiles.set(r.software, files);
    // The sheet's Requested Version is what the SRF names: every version it lists must be what this
    // bundle actually carries (npm packages from the lockfile, other files by the version in their path).
    const have = [...rowNpm(r).map(id => at(id)[1]), ...files.join('/').split(/[/-]/).map(t => t.replace(/^v/, ''))];
    if (rowNpm(r).length || files.length) for (const v of r.requested.split('/').map(x => x.trim()).filter(Boolean))
      if (!have.includes(v)) mismatches.push(`${r.software}: the sheet requests ${v}; the bundle would carry ${[...rowNpm(r), ...files.filter(f => !f.endsWith('.sha256') && !f.endsWith('SHASUMS256.txt'))].join(', ')}`);
  }
  plan.statuses.push({ status: st.status, slug: st.slug,
    rows: rows.map(r => { const own = walk(map.get(norm(r.software)).npm, st.status);
      return { category: r.category, software: r.software, current: r.current, requested: r.requested, purpose: r.purpose,
        npm: rowNpm(r), files: rowFiles.get(r.software), requires: own.requires.map(x => ({ software: x.software, slug: x.slug, packages: x.packages })) }; }),
    tarballs: [...w.tar].sort(), raw: raw.sort(), vsix, notes, otherMajors: w.otherMajors, requires: w.requires, optional: w.optional });
}
if (mismatches.length) die(`the sheet's Requested Version does not match what the stack is locked to -- a bundle must carry exactly what the SRF names.\n`
  + `Either correct the sheet, or change the stack (stack/frontend/package.json, stack/workstation.env) and rebuild with --relock:\n  ` + mismatches.join('\n  '));
// rule 4: pool coverage
const uncovered = [...pool.keys()].filter(id => !covered.has(id));
if (uncovered.length) die(`${uncovered.length} pool tarballs belong to no status (lockfile shape the planner does not model):\n  ` + uncovered.slice(0, 30).join('\n  '));
for (const s of plan.statuses) {
  s.tarballs = [...new Set(s.tarballs)].sort();
  s.direct = new Set(s.rows.flatMap(r => r.npm));
  s.transitive = s.tarballs.filter(id => !s.direct.has(id));
  s.direct = [...s.direct].sort();
  s.files = s.tarballs.map(id => pool.get(id).file);
  s.npmBytes = s.tarballs.reduce((a, id) => a + pool.get(id).bytes, 0);
  s.rawBytes = s.raw.reduce((a, f) => a + fs.statSync(path.join(args.bundle, 'raw', f)).size, 0);
}
plan.checks = { poolTarballs: pool.size, coveredTarballs: covered.size,
  inMoreThanOneBundle: [...covered.values()].filter(s => s.size > 1).length, mappingRowsNotInSheet: missingRows };
fs.writeFileSync(args.out, JSON.stringify(plan, null, 1));
// summary for the build log
const mb = b => (b / 1e6).toFixed(1);
console.log(`plan: ${sheet.length} rows, ${statuses.length} statuses, pool ${pool.size} tarballs -- all covered (${plan.checks.inMoreThanOneBundle} shared transitive tarballs ship in more than one bundle)`);
if (missingRows.length) console.log(`  NOTE: rows in srf-components.tsv but not in the sheet: ${missingRows.join('; ')}`);
for (const s of plan.statuses) console.log(`  ${s.slug.padEnd(15)} ${String(s.rows.length).padStart(3)} rows  ${String(s.tarballs.length).padStart(5)} npm tarballs (${mb(s.npmBytes)} MB)  ${String(s.raw.length).padStart(3)} other files (${mb(s.rawBytes)} MB)`
  + `\n      requires: ${s.requires.map(r => r.slug + ':' + r.software).join(', ') || 'nothing from other bundles'}`
  + (s.otherMajors.length ? `\n      carries other majors of sheet packages: ${s.otherMajors.map(o => o.package).join(', ')}` : ''));

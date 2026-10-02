// srf-emit.mjs -- assemble ONE SRF category bundle's contents from a plan (srf-plan.mjs) and the
// complete front-end bundle, or write the cross-bundle summary. Created 2026-10-02 (Axium); run by
// tools/build-srf-bundles.sh, not by hand.
//
//   node srf-emit.mjs bundle  <plan.json> <complete-bundle-dir> <out-dir> <slug>
//   node srf-emit.mjs summary <plan.json> <out.md> <bundle-name-prefix> <date> <slug>...
//
// "bundle" writes into <out-dir>: npm/tarballs/* (hard links into the complete bundle), npm/MANIFEST.json
// and npm/SHA256SUMS for exactly those tarballs, npm/package.json + pnpm-lock.yaml + package-managers/
// (the example stack, for the full proof once every bundle is loaded), raw/* (hard links), the full
// vscode-extensions/INSTALL-ORDER.txt when the bundle carries any extension, srf-bundle.json (read by
// island/prove-install.sh category) and SRF-CONTENTS.md (for people). The sheet's free-text columns
// never go into a bundle: only Category, Software, versions, Purpose and Approval Status.
import fs from 'node:fs'; import path from 'node:path';

const [mode, planFile, ...rest] = process.argv.slice(2);
const plan = JSON.parse(fs.readFileSync(planFile, 'utf8'));
const mb = b => (b / 1e6).toFixed(1) + ' MB';
const nv = id => { const i = id.indexOf('@', 1); return `${id.slice(0, i)} ${id.slice(i + 1)}`; };
const cell = s => String(s).replace(/\|/g, '\\|');
const byslug = s => plan.statuses.find(x => x.slug === s) || (console.error(`srf-emit: no status "${s}" in the plan (have: ${plan.statuses.map(x => x.slug).join(', ')})`), process.exit(2));
const link = (src, dst) => { fs.mkdirSync(path.dirname(dst), { recursive: true });
  try { fs.linkSync(src, dst); } catch (e) { if (e.code === 'EXDEV' || e.code === 'EPERM') fs.copyFileSync(src, dst); else throw e; } };

if (mode === 'bundle') {
  const [complete, out, slug] = rest; const s = byslug(slug);
  const name = path.basename(out), date = name.slice(-10);
  // npm
  const full = JSON.parse(fs.readFileSync(path.join(complete, 'npm', 'MANIFEST.json'), 'utf8'));
  const want = new Set(s.files);
  const entries = full.tarballs.filter(t => want.has(t.file));
  if (entries.length !== want.size) { console.error(`srf-emit: ${want.size - entries.length} planned tarballs are not in ${complete}/npm/MANIFEST.json`); process.exit(1); }
  for (const t of entries) link(path.join(complete, 'npm', 'tarballs', t.file), path.join(out, 'npm', 'tarballs', t.file));
  fs.writeFileSync(path.join(out, 'npm', 'MANIFEST.json'), JSON.stringify({ created: new Date().toISOString(), count: entries.length,
    totalBytes: entries.reduce((a, t) => a + t.bytes, 0), delta: null, srf: { status: s.status, slug: s.slug }, tarballs: entries }, null, 1));
  const sums = fs.readFileSync(path.join(complete, 'npm', 'SHA256SUMS'), 'utf8').split('\n').filter(l => want.has(l.replace(/^\S+\s+\*?tarballs\//, '')));
  if (sums.length !== want.size) { console.error('srf-emit: the complete bundle\'s npm/SHA256SUMS does not cover every planned tarball'); process.exit(1); }
  fs.writeFileSync(path.join(out, 'npm', 'SHA256SUMS'), sums.join('\n') + '\n');
  for (const f of ['package.json', 'pnpm-lock.yaml', 'package-managers/package.json', 'package-managers/package-lock.json'])
    link(path.join(complete, 'npm', f), path.join(out, 'npm', f));
  // raw (+ the full extension install order: the installer skips any .vsix not loaded yet)
  for (const f of s.raw) link(path.join(complete, 'raw', f), path.join(out, 'raw', f));
  if (s.vsix.length) link(path.join(complete, 'raw', 'vscode-extensions', 'INSTALL-ORDER.txt'), path.join(out, 'raw', 'vscode-extensions', 'INSTALL-ORDER.txt'));
  // machine-readable contents (island/prove-install.sh category reads this)
  fs.writeFileSync(path.join(out, 'srf-bundle.json'), JSON.stringify({ bundle: name, built: date, from: path.basename(complete), sheet: plan.sheet,
    status: s.status, slug: s.slug, rows: s.rows, tarballs: s.tarballs, raw: s.raw, vsix: s.vsix, notes: s.notes,
    requires: s.requires, optional: s.optional, otherMajors: s.otherMajors }, null, 1));
  // people-readable contents
  const L = [];
  L.push(`# ${name} — contents`, '');
  L.push(`**Created:** ${date} by \`build-srf-bundles.sh\` from \`${path.basename(complete)}\` and the sheet \`${plan.sheet}\``, '');
  L.push(`**Approval status (the sheet's column):** ${s.status}`, '');
  L.push(`${s.rows.length} rows · ${s.tarballs.length} npm tarballs (${mb(s.npmBytes)}) · ${s.raw.length + (s.vsix.length ? 1 : 0)} other files (${mb(s.rawBytes)})`, '');
  L.push('Load it with `island/load-nexus.sh`; check it with `island/prove-install.sh category` (see `island/README.md`).', '');
  L.push('## Software', '', '| Category | Software | Version | Purpose | Delivered as |', '|---|---|---|---|---|');
  for (const r of s.rows) {
    const what = [...r.npm.map(nv), ...r.files.filter(f => !/\.sha256$|SHASUMS256\.txt$/.test(f)).map(f => 'raw/' + f)];
    L.push(`| ${cell(r.category)} | ${cell(r.software)} | ${cell(r.requested)} | ${cell(r.purpose)} | ${cell(what.join('<br>') || '— (see below)')} |`);
  }
  if (s.notes.length) { L.push('', '## Not in this bundle', ''); for (const n of s.notes) L.push(`- ${n}`); }
  const needing = s.rows.filter(r => r.requires.length);
  L.push('', '## Needs software from other bundles', '');
  if (!needing.length) L.push('Nothing: every row here installs from this bundle alone (plus what Nexus already has).');
  else {
    L.push('A bundle always loads into Nexus on its own. These rows can only be **installed in a project** once the bundle named is loaded too:', '',
      '| This row | needs | from the bundle |', '|---|---|---|');
    for (const r of needing) for (const q of r.requires) L.push(`| ${cell(r.software)} | ${cell(q.software)} (${q.packages.map(nv).join(', ')}) | ${q.slug} |`);
  }
  if (s.optional.length) {
    L.push('', '## Works with, when present (optional)', '', 'Optional peer dependencies: the rows work without these, and use them when a project installs them.', '',
      '| Software | from the bundle | asked for by |', '|---|---|---|');
    for (const o of s.optional) L.push(`| ${cell(o.software)} | ${o.slug} | ${cell(o.via.slice(0, 3).map(v => v.split(' -> ')[0]).join(', '))}${o.via.length > 3 ? ' …' : ''} |`);
  }
  if (s.otherMajors.length) {
    L.push('', '## Other major versions of sheet software carried here', '',
      'Dependencies that are a different major version of a package the sheet lists elsewhere. An approval names a major version, so these are worth showing the reviewer.', '',
      '| Package | the sheet\'s row (version) | pulled in by |', '|---|---|---|');
    for (const o of s.otherMajors) L.push(`| ${nv(o.package)} | ${cell(o.row)} (${o.declared}) | ${cell(o.via.slice(0, 4).join(', '))}${o.via.length > 4 ? ` and ${o.via.length - 4} more` : ''} |`);
  }
  L.push('', `## Transitive npm dependencies (${s.transitive.length})`, '', 'Every other npm package in this bundle — needed by the rows above.', '', '```');
  for (const id of s.transitive) L.push(nv(id));
  L.push('```', '');
  fs.writeFileSync(path.join(out, 'SRF-CONTENTS.md'), L.join('\n'));
  console.log(`  ${name}: ${entries.length} npm tarballs, ${s.raw.length} raw files${s.vsix.length ? ' + INSTALL-ORDER.txt' : ''}`);

} else if (mode === 'summary') {
  const [outMd, prefix, date, ...slugs] = rest;
  const L = [];
  L.push(`# Front-end bundles by SRF approval status — ${date}`, '');
  L.push(`**Created:** ${date} by \`build-srf-bundles.sh\` · sheet: \`${plan.sheet}\``, '');
  L.push('Port and load in this order as approvals arrive. Each bundle loads into Nexus on its own; the last column says which other bundles its software needs before a project can install it.', '');
  L.push('| # | Bundle | Approval status | Rows | npm tarballs | Other files | Needs (to install) |', '|---|---|---|---|---|---|---|');
  plan.statuses.forEach((s, i) => {
    const built = slugs.includes(s.slug);
    const needs = [...new Set(s.requires.map(q => q.slug))];
    L.push(`| ${i + 1} | ${built ? `\`${prefix}${s.slug}-${date}.tar\`` : `${s.slug} (not built this run)`} | ${cell(s.status)} | ${s.rows.length} | ${s.tarballs.length} (${mb(s.npmBytes)}) | ${s.raw.length} (${mb(s.rawBytes)}) | ${needs.join(', ') || '—'} |`);
  });
  L.push('', '## Every row', '', '| Software | Version | Approval status | Bundle | Needs, from |', '|---|---|---|---|---|');
  for (const s of plan.statuses) for (const r of s.rows)
    L.push(`| ${cell(r.software)} | ${cell(r.requested)} | ${cell(s.status)} | ${s.slug} | ${cell(r.requires.map(q => `${q.software} (${q.slug})`).join('; ') || '—')} |`);
  const om = plan.statuses.flatMap(s => s.otherMajors.map(o => ({ ...o, slug: s.slug })));
  if (om.length) {
    L.push('', '## Other major versions of sheet software, carried as dependencies', '', '| Package | the sheet\'s row (version) | in bundle |', '|---|---|---|');
    for (const o of om) L.push(`| ${nv(o.package)} | ${cell(o.row)} (${o.declared}) | ${o.slug} |`);
  }
  L.push('', `Checks: all ${plan.checks.poolTarballs} tarballs of the complete bundle are in at least one category bundle; ${plan.checks.inMoreThanOneBundle} shared dependencies ship in more than one (the loader skips what Nexus already has).`, '');
  fs.writeFileSync(outMd, L.join('\n'));
} else { console.error('usage: srf-emit.mjs bundle|summary ...'); process.exit(2); }

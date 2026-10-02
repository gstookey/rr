// srf-proof.mjs -- the checks behind `prove-install.sh category`. Created 2026-10-02.
// Run from an SRF category bundle (devenv-frontend-<status>-<date>, cut by build-srf-bundles.sh) after
// load-nexus.sh. Asks Nexus -- with read access only, as a workstation would -- whether it serves
// everything in THIS bundle:
//   npm   each tarball downloads (HEAD 200) AND its version is listed in the package's metadata
//         (found 2026-10-01: a tarball Nexus holds but its metadata omits cannot be installed)
//   raw   each file is served
//   needs for each row, whether the rows it needs from OTHER bundles are in Nexus yet (WAIT if not)
// Prints PASS / FAIL / WAIT / NOTE lines, and writes the npm packages (name@version, one per line) of
// every row whose needs are met to <installable-out>, for the real install that follows.
//
//   node srf-proof.mjs <bundle-dir> <npm-repo-url> <raw-repo-url> <installable-out>
import fs from 'node:fs'; import path from 'node:path';

const [dir, npmUrl, rawUrl, out] = process.argv.slice(2);
const b = JSON.parse(fs.readFileSync(path.join(dir, 'srf-bundle.json'), 'utf8'));
const man = JSON.parse(fs.readFileSync(path.join(dir, 'npm', 'MANIFEST.json'), 'utf8'));
const at = id => { const i = id.indexOf('@', 1); return [id.slice(0, i), id.slice(i + 1)]; };
let authHint = false;
const status = async (url, method = 'HEAD') => {
  try { const r = await fetch(url, { method }); if (r.status === 401) authHint = true; return r; }
  catch (e) { return { status: `unreachable (${e.cause?.code || e.message})`, ok: false }; } };
async function pool(items, n, fn) { const res = []; let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; res[k] = await fn(items[k]); } })); return res; }
const metaCache = new Map();
const meta = name => { if (!metaCache.has(name)) metaCache.set(name, (async () => {
  const r = await status(`${npmUrl}/${name.replace('/', '%2f')}`, 'GET'); return r.ok ? r.json() : null; })()); return metaCache.get(name); };
const listed = async id => { const [n, v] = at(id); const m = await meta(n); return !!m?.versions?.[v]; };

// npm: every tarball, by the same registry path the lockfiles use
const paths = new Map(man.tarballs.map(t => { const p = t.url.replace(/^[a-z]+:\/\/[^/]+\//, '');
  const name = p.split('/-/')[0]; const base = name.split('/').pop();
  return [`${name}@${p.split('/-/')[1].slice(base.length + 1).replace(/\.tgz$/, '')}`, p]; }));
const npmBad = (await pool([...paths], 8, async ([id, p]) => {
  const h = await status(`${npmUrl}/${p}`); if (h.status !== 200) return `${id} (tarball: HTTP ${h.status})`;
  return (await listed(id)) ? null : `${id} (tarball present, version missing from the package metadata)`;
})).filter(Boolean);
if (!paths.size) console.log('NOTE  npm: this bundle carries no npm packages');
else if (!npmBad.length) console.log(`PASS  npm: all ${paths.size} tarballs served by Nexus, each version listed in its package metadata`);
else console.log(`FAIL  npm: ${npmBad.length} of ${paths.size} not installable from Nexus -- run ./load-nexus.sh npm again, then record any still listed:\n        ` + npmBad.slice(0, 20).join('\n        ') + (npmBad.length > 20 ? `\n        ... and ${npmBad.length - 20} more` : ''));

// raw
const raw = [...b.raw, ...(b.vsix.length ? ['vscode-extensions/INSTALL-ORDER.txt'] : [])];
const rawBad = (await pool(raw, 4, async f => { const h = await status(`${rawUrl}/${f}`); return h.status === 200 ? null : `${f} (HTTP ${h.status})`; })).filter(Boolean);
if (!raw.length) console.log('NOTE  raw: this bundle carries no other files');
else if (!rawBad.length) console.log(`PASS  raw: all ${raw.length} files served by Nexus`);
else console.log(`FAIL  raw: ${rawBad.length} of ${raw.length} not served -- run ./load-nexus.sh raw again:\n        ` + rawBad.join('\n        '));
for (const n of b.notes) console.log(`NOTE  ${n}`);

// needs from other bundles, row by row
const present = new Map();
for (const r of b.rows) for (const q of r.requires) if (!present.has(q.software))
  present.set(q.software, (await Promise.all(q.packages.map(listed))).every(Boolean));
const ready = [], waiting = new Map();
for (const r of b.rows) {
  const missing = r.requires.filter(q => !present.get(q.software));
  if (!missing.length) { ready.push(r); continue; }
  for (const q of missing) { const k = `${q.software} (bundle: ${q.slug})`; if (!waiting.has(k)) waiting.set(k, []); waiting.get(k).push(r.software); }
}
const withNpm = ready.filter(r => r.npm.length);
for (const [k, rows] of waiting) console.log(`WAIT  ${k} is not in Nexus yet -- needed to install: ${rows.join('; ')}`);
console.log(`NOTE  ${ready.length} of ${b.rows.length} rows have everything they need in Nexus${waiting.size ? `; ${b.rows.length - ready.length} wait on the bundles named above` : ''}`);
fs.writeFileSync(out, withNpm.flatMap(r => r.npm).join('\n') + (withNpm.length ? '\n' : ''));
if (authHint) console.log('NOTE  Nexus answered 401 (login required): workstations need anonymous read -- nexus-create-repos.sh --anonymous-read');

// lock-union.mjs — union of all registry tarballs referenced by a set of package-lock.json
// files. Emits TSV lines: <url>\t<integrity> (sha512), deduped by URL, sorted.
// By default, platform-specific optional packages are filtered to linux/x64 (the island:
// RHEL 9, confirmed by Graham 2026-09-03) using the lock entries' own os/cpu fields —
// locks list EVERY platform's binaries but npm only ever downloads the matching one.
// Pass --all-platforms to keep everything (~6x the bytes).
// --tag <name> labels the lockfiles that follow it (until the next --tag) — tags land in
// the TSV third column so per-rung slices stay computable from the manifest afterwards.
// Lockfiles may be npm package-lock.json (v2/v3) or pnpm-lock.yaml (lockfileVersion 9) -- added
// 2026-10-01 when the Desert Island example stack was locked to pnpm; both feed the same pool.
// Usage: node lock-union.mjs [--all-platforms] [--tag <name> <lockfile>...] [<lockfile> ...]
import fs from 'node:fs';
const REGISTRY = 'https://registry.npmjs.org';
// pnpm-lock.yaml v9 -> the same {key: entry} shape as an npm lock's "packages" map. Only the
// `packages:` section is read (resolution/os/cpu); registry tarball URLs are derived the way
// npm writes them, so a package in both an npm and a pnpm lock dedupes to one URL.
function pnpmPackages(text, file) {
  const m = text.match(/^lockfileVersion: '?([0-9.]+)'?/m);
  if (!m || parseInt(m[1]) !== 9) { console.error(`FATAL ${file}: only pnpm lockfileVersion 9 is supported (found ${m ? m[1] : 'none'})`); process.exit(1); }
  const pk = {}; let inPk = false, cur = null;
  for (const line of text.split('\n')) {
    if (/^\S/.test(line)) { inPk = line.startsWith('packages:'); cur = null; continue; }
    if (!inPk) continue;
    let k = line.match(/^  (?:'([^']+)'|([^\s'][^\s]*?)):\s*$/);
    if (k) { const id = k[1] || k[2]; const at = id.lastIndexOf('@');
      cur = { name: id.slice(0, at), version: id.slice(at + 1) }; pk[id] = cur; continue; }
    if (!cur) continue;
    let r = line.match(/^    resolution: \{(.*)\}\s*$/);
    if (r) { const i = r[1].match(/integrity: ([^,}\s]+)/), t = r[1].match(/tarball: ([^,}\s]+)/);
      if (i) cur.integrity = i[1];
      if (t) cur.resolved = t[1]; continue; }
    let v = line.match(/^    version: '?([^'\s]+)'?\s*$/); if (v) { cur.version = v[1]; continue; }
    let pl = line.match(/^    (os|cpu): \[(.*)\]\s*$/);
    if (pl) cur[pl[1]] = pl[2].split(',').map(x => x.trim().replace(/^'|'$/g, '')).filter(Boolean);
  }
  for (const e of Object.values(pk)) if (!e.resolved && e.integrity) {
    const base = e.name.split('/').pop(); e.resolved = `${REGISTRY}/${e.name}/-/${base}-${e.version}.tgz`; }
  return pk;
}
const argv = process.argv.slice(2);
const allPlatforms = argv.includes('--all-platforms');
const files = []; // [path, tag]
let curTag = '';
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--all-platforms') continue;
  if (argv[i] === '--tag') { curTag = argv[++i]; continue; }
  files.push([argv[i], curTag]);
}
const OS = 'linux', CPU = 'x64';
const out = new Map(); const tags = new Map(); let skippedForeign = 0;
for (const [p, tag] of files) {
  const text = fs.readFileSync(p, 'utf8');
  const packages = /\.ya?ml$/.test(p) ? pnpmPackages(text, p) : (JSON.parse(text).packages || {});
  for (const [key, entry] of Object.entries(packages)) {
    if (!key || !entry.resolved || entry.link) continue;
    if (!/^https?:\/\//.test(entry.resolved)) continue;
    if (!allPlatforms) {
      const osOk = !Array.isArray(entry.os) || entry.os.includes(OS);
      const cpuOk = !Array.isArray(entry.cpu) || entry.cpu.includes(CPU);
      if (!osOk || !cpuOk) { skippedForeign++; continue; }
    }
    if (!entry.integrity) { console.error(`WARN no integrity: ${entry.resolved} (${p})`); continue; }
    const prev = out.get(entry.resolved);
    if (prev && prev !== entry.integrity) {
      console.error(`FATAL integrity disagreement for ${entry.resolved}`); process.exit(1);
    }
    out.set(entry.resolved, entry.integrity);
    if (tag) { if (!tags.has(entry.resolved)) tags.set(entry.resolved, new Set()); tags.get(entry.resolved).add(tag); }
  }
}
for (const [url, integ] of [...out.entries()].sort()) console.log(`${url}\t${integ}\t${[...(tags.get(url) || [])].sort().join(',')}`);
console.error(JSON.stringify({ locks: files.length, distinctTarballs: out.size, skippedForeignPlatform: skippedForeign }));

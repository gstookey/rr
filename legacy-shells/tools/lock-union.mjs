// lock-union.mjs — union of all registry tarballs referenced by a set of package-lock.json
// files. Emits TSV lines: <url>\t<integrity> (sha512), deduped by URL, sorted.
// By default, platform-specific optional packages are filtered to linux/x64 (the island:
// RHEL 9, confirmed by Graham 2026-09-03) using the lock entries' own os/cpu fields —
// locks list EVERY platform's binaries but npm only ever downloads the matching one.
// Pass --all-platforms to keep everything (~6x the bytes).
// --tag <name> labels the lockfiles that follow it (until the next --tag) — tags land in
// the TSV third column so per-rung slices stay computable from the manifest afterwards.
// Usage: node lock-union.mjs [--all-platforms] [--tag <name> <lockfile>...] [<lockfile> ...]
import fs from 'node:fs';
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
  const lock = JSON.parse(fs.readFileSync(p, 'utf8'));
  for (const [key, entry] of Object.entries(lock.packages || {})) {
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

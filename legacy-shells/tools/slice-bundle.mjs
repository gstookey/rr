// slice-bundle.mjs — emit a slice of the master tarball pool as its own directory
// (tarballs/ + SHA256SUMS + MANIFEST.json), computed from the pool's MANIFEST.json rungs.
// Modes:
//   --cumulative                 everything in the pool (default)
//   --rung v17-baseline          tarballs the v17 estate baseline needs
//   --rung 17-18                 tarballs first needed by the 17->18 hop (delta over v17)
//   --rung 18-19                 tarballs first needed by the 18->19 hop (delta over v17+v18)
//   --delta-from <MANIFEST.json> only tarballs absent from the given manifest (by sha256);
//                                SHA256SUMS/MANIFEST still cover the ENTIRE pool so one
//                                `sha256sum -c` validates the merged set after extraction.
// Usage: node slice-bundle.mjs <pool-dir> <out-dir> [mode]
import fs from 'node:fs'; import path from 'node:path';
const [pool, out, ...rest] = process.argv.slice(2);
const man = JSON.parse(fs.readFileSync(path.join(pool, 'MANIFEST.json'), 'utf8'));
let mode = 'cumulative', arg = null;
if (rest[0] === '--rung') { mode = 'rung'; arg = rest[1]; }
else if (rest[0] === '--delta-from') { mode = 'delta'; arg = rest[1]; }
const order = ['v17', 'v18', 'v19', 'v20', 'v21', 'v22'];
const firstRung = t => { for (const r of order) if ((t.rungs || []).includes(r)) return r; return null; };
const rungOf = { 'v17-baseline': 'v17', '17-18': 'v18', '18-19': 'v19', '19-20': 'v20', '20-21': 'v21', '21-22': 'v22' };
let pick, manifestRows = man.tarballs;
if (mode === 'rung') {
  const want = rungOf[arg]; if (!want) { console.error('unknown rung ' + arg); process.exit(1); }
  pick = t => firstRung(t) === want;
  manifestRows = man.tarballs.filter(pick);
} else if (mode === 'delta') {
  const prior = new Set(JSON.parse(fs.readFileSync(arg, 'utf8')).tarballs.map(t => t.sha256));
  pick = t => !prior.has(t.sha256);
} else pick = () => true;
fs.mkdirSync(path.join(out, 'tarballs'), { recursive: true });
let n = 0, bytes = 0;
for (const t of man.tarballs) if (pick(t)) {
  fs.copyFileSync(path.join(pool, 'tarballs', t.file), path.join(out, 'tarballs', t.file));
  n++; bytes += t.bytes;
}
fs.writeFileSync(path.join(out, 'SHA256SUMS'), manifestRows.map(r => `${r.sha256}  tarballs/${r.file}`).join('\n') + '\n');
fs.writeFileSync(path.join(out, 'MANIFEST.json'), JSON.stringify({
  ...man, created: new Date().toISOString(),
  slice: { mode, arg, tarballsInSlice: n, sliceBytes: bytes },
  count: manifestRows.length, totalBytes: manifestRows.reduce((s, r) => s + r.bytes, 0),
  tarballs: manifestRows,
}, null, 1));
console.log(JSON.stringify({ mode, arg, copied: n, sliceMB: +(bytes / 1e6).toFixed(1), manifestRows: manifestRows.length }));

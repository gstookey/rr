// fetch-tarballs.mjs — materialize a lock-union TSV (url\tintegrity) as flat tarballs
// with SHA256SUMS + MANIFEST.json. Sources each file from an npm cache when available
// (integrity-checked), otherwise fetches it from the registry. Fails loudly per file
// and is resumable: existing correct files in <outdir> are kept, wrong ones refetched.
// Usage: node fetch-tarballs.mjs <union.tsv> <outdir> [--cache <npm-cache-dir>] [--delta <old-MANIFEST.json>]
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const args = process.argv.slice(2);
const tsv = args[0], outdir = args[1];
const cacheDir = args.includes('--cache') ? args[args.indexOf('--cache') + 1] : null;
const deltaManifest = args.includes('--delta') ? args[args.indexOf('--delta') + 1] : null;
fs.mkdirSync(outdir, { recursive: true });
const prior = new Set();
if (deltaManifest) for (const t of JSON.parse(fs.readFileSync(deltaManifest, 'utf8')).tarballs) prior.add(t.sha256);

// index the npm cache by sha512 integrity -> content path
const cacheIndex = new Map();
if (cacheDir) {
  const idx = path.join(cacheDir, '_cacache', 'index-v5');
  const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const i = line.indexOf('\t'); if (i < 0) continue;
      let j; try { j = JSON.parse(line.slice(i + 1)); } catch { continue; }
      if (j && j.integrity && j.key && j.key.includes('.tgz')) cacheIndex.set(j.integrity.split(' ')[0], null);
    } } };
  if (fs.existsSync(idx)) walk(idx);
}
const contentPath = integ => {
  const hex = Buffer.from(integ.replace(/^sha512-/, ''), 'base64').toString('hex');
  return path.join(cacheDir, '_cacache', 'content-v2', 'sha512', hex.slice(0, 2), hex.slice(2, 4), hex.slice(4));
};
const nameFor = url => {
  const m = url.match(/\/((@[^/]+)\/)?([^/]+)\/-\/([^/]+\.tgz)$/);
  if (!m) throw new Error('unparseable url: ' + url);
  return (m[2] ? m[2].replace('@', '') + '__' : '') + m[4];
};
const rows = []; let fromCache = 0, fetched = 0, kept = 0, deltaSkipped = 0; const failures = [];
const entries = fs.readFileSync(tsv, 'utf8').trim().split('\n').map(l => l.split('\t'));
const sha512Of = buf => 'sha512-' + crypto.createHash('sha512').update(buf).digest('base64');
async function handle([url, integ, tagStr]) {
  const file = nameFor(url), dest = path.join(outdir, file);
  let buf = null;
  if (fs.existsSync(dest)) { const b = fs.readFileSync(dest); if (sha512Of(b) === integ) { buf = b; kept++; } }
  if (!buf && cacheDir && cacheIndex.has(integ)) {
    const b = fs.readFileSync(contentPath(integ));
    if (sha512Of(b) === integ) { buf = b; fromCache++; } }
  if (!buf) {
    for (let attempt = 1; attempt <= 3 && !buf; attempt++) {
      try {
        const r = await fetch(url); if (!r.ok) throw new Error('http ' + r.status);
        const b = Buffer.from(await r.arrayBuffer());
        if (sha512Of(b) !== integ) throw new Error('integrity mismatch after download');
        buf = b; fetched++;
      } catch (e) { if (attempt === 3) { failures.push([url, String(e)]); return; } }
    }
  }
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  if (prior.has(sha256)) { deltaSkipped++; } else { fs.writeFileSync(dest, buf); }
  rows.push({ file, bytes: buf.length, sha256, integrity: integ, url, rungs: tagStr ? tagStr.split(',') : [], inDelta: !prior.has(sha256) });
}
const queue = [...entries];
await Promise.all(Array.from({ length: 8 }, async () => { while (queue.length) await handle(queue.shift()); }));
rows.sort((a, b) => a.url < b.url ? -1 : 1);
if (failures.length) {
  for (const [u, e] of failures) console.error(`FAILED ${u}: ${e}`);
  console.error(`ABORT: ${failures.length} tarball(s) could not be materialized. Re-run to resume.`);
  process.exit(1);
}
const total = rows.reduce((s, r) => s + r.bytes, 0);
fs.writeFileSync(path.join(outdir, '..', 'MANIFEST.json'), JSON.stringify({
  created: new Date().toISOString(), count: rows.length, totalBytes: total,
  delta: deltaManifest ? { against: path.basename(deltaManifest), newTarballs: rows.filter(r => r.inDelta).length, alreadyHeld: deltaSkipped } : null,
  tarballs: rows.map(({ inDelta, ...r }) => r),
}, null, 1));
fs.writeFileSync(path.join(outdir, '..', 'SHA256SUMS'), rows.map(r => `${r.sha256}  tarballs/${r.file}`).join('\n') + '\n');
console.log(JSON.stringify({ union: rows.length, totalMB: +(total / 1e6).toFixed(1), kept, fromCache, fetched, deltaSkipped }));

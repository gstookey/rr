// shells-from-source.mjs -- regenerate the shells' package.json files (the v17 baseline)
// from Graham's island copies in docs/source-documents/legacy-apps/, applying ONLY the
// corrections listed below. Every correction is printed, so none is silent.
//
// Corrections (each exists because the public registry cannot serve what the island's
// Nexus serves -- they are rehearsal artefacts, NOT changes to make on the real apps):
//   C1  private-scope packages dropped: @other-team/*, @ssd_victor/* (404 on the public
//       registry; they live only on the island's Nexus)
//   C2  "&& fix-es-imports" stripped from scripts (its package is private-scope, C1)
//   C3  app-02 root start/serve scripts pointed at app-02's own workspaces (the source
//       names app-01's -- a transcription artefact; harmless to the lock either way)
//
// Usage: node legacy-shells/tools/shells-from-source.mjs [<out-root>]   (default: legacy-shells/)
// Created 2026-10-01 (Axium) for the re-base onto the exact-pinned sources (main 4dec9c4).
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const OUT = path.resolve(process.argv[2] || path.join(REPO, 'legacy-shells'));
const SRC = path.join(REPO, 'docs/source-documents/legacy-apps');
const FILES = { 'root-level': 'package.json', client: 'packages/client/package.json',
  server: 'packages/server/package.json', common: 'packages/common/package.json',
  interface: 'packages/interface/package.json' };
const PRIVATE = /^@(other-team|ssd_victor)\//;

for (const app of ['legacy-app-01', 'legacy-app-02']) {
  for (const [kind, rel] of Object.entries(FILES)) {
    const src = path.join(SRC, app, `monorepo_${kind}_package.json`);
    if (!fs.existsSync(src)) continue;
    const pkg = JSON.parse(fs.readFileSync(src, 'utf8'));
    const note = m => console.log(`  ${app}/${rel}: ${m}`);
    for (const sec of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
      for (const name of Object.keys(pkg[sec] || {})) {
        if (PRIVATE.test(name)) { note(`C1 dropped ${sec}.${name}@${pkg[sec][name]}`); delete pkg[sec][name]; }
      }
    }
    for (const [k, v] of Object.entries(pkg.scripts || {})) {
      if (v.includes('fix-es-imports')) { pkg.scripts[k] = v.replace(/\s*&&\s*fix-es-imports/g, ''); note(`C2 scripts.${k}: "${v}" -> "${pkg.scripts[k]}"`); }
    }
    if (app === 'legacy-app-02' && kind === 'root-level') {
      for (const k of ['start', 'serve']) {
        const v = pkg.scripts?.[k];
        if (v && v.includes('legacy-app-01-')) { pkg.scripts[k] = v.replace('legacy-app-01-', 'legacy-app-02-'); note(`C3 scripts.${k} -> ${pkg.scripts[k]}`); }
      }
    }
    const dest = path.join(OUT, app, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, JSON.stringify(pkg, null, 2) + '\n');
  }
}
console.log(`wrote shells' package.json files under ${OUT}`);

// port-root-angular-json.mjs -- carry migration edits from the TEMPORARY root angular.json back
// into packages/client/angular.json, at hop teardown.
//
// Why: ng update runs against the temporary root workspace file (make-root-angular-json.mjs).
// Any migration that edits angular.json edits THAT file -- e.g. Angular 20's workspace migration
// adds a top-level "schematics" block so `ng generate` keeps the pre-v20 file naming. Deleting
// the temporary file without porting silently loses those edits (found 2026-10-01, 19->20 rung).
//
// How: reverse the path prefixing make-root-angular-json.mjs applied, write the client file,
// then PROVE it: re-applying the forward transform to the new client file must reproduce the
// migrated root file exactly. If it does not (a migration touched something the transform does
// not model), nothing is written and the edits must be ported by hand.
//
// Usage: node port-root-angular-json.mjs <app-root>     (expects angular.json + packages/client/angular.json)
// Created 2026-10-01 (Axium).
import fs from 'node:fs'; import path from 'node:path'; import { isDeepStrictEqual } from 'node:util';
const root = process.argv[2] || '.';
const P = 'packages/client/';
const PATH_KEYS = ['outputPath', 'index', 'browser', 'main', 'tsConfig', 'polyfills'];
const LIST_KEYS = ['assets', 'styles', 'scripts'];
const clone = o => JSON.parse(JSON.stringify(o));

// forward: identical to make-root-angular-json.mjs
function toRoot(ws) { const aj = clone(ws);
  for (const proj of Object.values(aj.projects || {})) {
    proj.root = P.slice(0, -1) + (proj.root ? '/' + proj.root : '');
    if (proj.sourceRoot !== undefined) proj.sourceRoot = P + proj.sourceRoot;
    for (const t of Object.values(proj.architect || {})) { const o = t.options; if (!o) continue;
      for (const k of PATH_KEYS) if (typeof o[k] === 'string' && !o[k].startsWith('zone.js')) o[k] = P + o[k];
      for (const k of LIST_KEYS) if (Array.isArray(o[k])) o[k] = o[k].map(v => typeof v === 'string' ? P + v : v);
    }
  }
  return aj; }
const strip = v => (typeof v === 'string' && v.startsWith(P)) ? v.slice(P.length) : v;
// reverse
function toClient(ws) { const aj = clone(ws);
  for (const proj of Object.values(aj.projects || {})) {
    proj.root = proj.root === P.slice(0, -1) ? '' : strip(proj.root);
    if (proj.sourceRoot !== undefined) proj.sourceRoot = strip(proj.sourceRoot);
    for (const t of Object.values(proj.architect || {})) { const o = t.options; if (!o) continue;
      for (const k of PATH_KEYS) if (typeof o[k] === 'string') o[k] = strip(o[k]);
      for (const k of LIST_KEYS) if (Array.isArray(o[k])) o[k] = o[k].map(strip);
    }
  }
  return aj; }

const rootFile = path.join(root, 'angular.json'), clientFile = path.join(root, 'packages/client/angular.json');
const migrated = JSON.parse(fs.readFileSync(rootFile, 'utf8'));
const before = JSON.parse(fs.readFileSync(clientFile, 'utf8'));
const after = toClient(migrated);
if (!isDeepStrictEqual(toRoot(after), migrated)) {
  console.error('STOP: the migrated root angular.json does not round-trip through the client path mapping --');
  console.error('a migration changed something this tool does not model. Port the edits into packages/client/angular.json by hand.');
  process.exit(1);
}
if (isDeepStrictEqual(after, before)) { console.log('  no workspace edits to port'); process.exit(0); }
const changed = [...new Set([...Object.keys(before), ...Object.keys(after)])].filter(k => !isDeepStrictEqual(before[k], after[k]));
fs.writeFileSync(clientFile, JSON.stringify(after, null, 2) + '\n');
console.log(`  ported migration edits into packages/client/angular.json (top-level keys changed: ${changed.join(', ')}); round-trip verified`);

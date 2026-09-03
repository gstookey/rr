// Generate a TEMPORARY monorepo-root angular.json from packages/client/angular.json
// by prefixing project paths with packages/client/. Used only for the duration of an
// ng update hop (the CLI needs its workspace file next to the package.json that
// declares @angular/core, which is the monorepo root in these apps). Delete after.
// Usage: node tools/make-root-angular-json.mjs <app-root-dir>
import fs from 'node:fs'; import path from 'node:path';
const root = process.argv[2] || '.';
const src = path.join(root, 'packages/client/angular.json');
const aj = JSON.parse(fs.readFileSync(src, 'utf8'));
const P = 'packages/client/';
for (const proj of Object.values(aj.projects)) {
  proj.root = P.slice(0, -1) + (proj.root ? '/' + proj.root : '');
  if (proj.sourceRoot !== undefined) proj.sourceRoot = P + proj.sourceRoot;
  for (const target of Object.values(proj.architect || {})) {
    const fix = o => { if (!o) return;
      for (const k of ['outputPath','index','browser','main','tsConfig','polyfills']) {
        if (typeof o[k] === 'string' && !o[k].startsWith('zone.js')) o[k] = P + o[k];
      }
      for (const k of ['assets','styles','scripts']) {
        if (Array.isArray(o[k])) o[k] = o[k].map(v => typeof v === 'string' ? P + v : v);
      }
    };
    fix(target.options);
  }
}
const dest = path.join(root, 'angular.json');
if (fs.existsSync(dest)) { console.error('refusing: root angular.json already exists'); process.exit(1); }
fs.writeFileSync(dest, JSON.stringify(aj, null, 2) + '\n');
console.log('wrote temporary', dest, '- DELETE IT when the hop is done (git status must come back clean).');

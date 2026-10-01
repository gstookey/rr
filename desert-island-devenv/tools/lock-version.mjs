// lock-version.mjs -- print the locked version of a package from a pnpm-lock.yaml (v9) or an
// npm package-lock.json. Used by the bundle build so binary versions (Cypress, Playwright,
// Prisma engines) are derived from the lockfile and never typed twice. Created 2026-10-01.
// Usage: node lock-version.mjs <lockfile> <package-name>    (exit 3 if not locked)
import fs from 'node:fs';
const [file, name] = process.argv.slice(2);
const text = fs.readFileSync(file, 'utf8');
let v;
if (/\.ya?ml$/.test(file)) {
  for (const line of text.split('\n')) {
    const m = line.match(/^  '?(.+?)'?:\s*(\{\})?\s*$/); if (!m) continue;
    const id = m[1], at = id.lastIndexOf('@');
    if (at > 0 && id.slice(0, at) === name) { v = id.slice(at + 1).replace(/\(.*$/, ''); break; }
  }
} else v = JSON.parse(text).packages?.['node_modules/' + name]?.version;
if (!v) process.exit(3);
console.log(v);

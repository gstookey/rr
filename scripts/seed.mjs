#!/usr/bin/env node
/**
 * seed.mjs — validate (and, from S2, load) ACME Workshop's seed data.
 *
 * AW-D12 put the seed in JSON under `services/gateway/seed/` rather than in a
 * SQL migration. That choice only pays off if the JSON is held to the same
 * contract the database will hold it to — otherwise "it's just JSON" becomes a
 * second, weaker schema. So S0 ships the VALIDATOR, and it validates every
 * marking on every row against the real `@rr/common` Marking schema, which is
 * the same object the BFF and the browser parse with.
 *
 * S0:  --validate (the default, and the only mode implemented)
 * S2:  --load will insert into Postgres with RLS on. It does not exist yet, and
 *      this script says so rather than pretending.
 *
 * `@rr/common` is resolved through the npm-workspace symlink to its built
 * `dist/`, so `npm run build -w @rr/common` must have run first. The local gate
 * does that before it calls this script.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MarkingSchema, markingBanner } from '@rr/common';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEED_DIR = join(ROOT, 'services', 'gateway', 'seed');

const mode = process.argv.includes('--load') ? 'load' : 'validate';

if (mode === 'load') {
  console.error('seed: --load is an S2 capability (Postgres + RLS). Not implemented; refusing to pretend.');
  process.exit(2);
}

/** Every row that carries a marking, wherever it lives in the seed files. */
function* markedRows(node, path = '$') {
  if (Array.isArray(node)) {
    for (const [i, item] of node.entries()) yield* markedRows(item, `${path}[${i}]`);
    return;
  }
  if (node && typeof node === 'object') {
    if ('marking' in node) yield { path, id: node.id ?? node.serial ?? path, marking: node.marking };
    for (const [k, v] of Object.entries(node)) {
      if (k !== 'marking') yield* markedRows(v, `${path}.${k}`);
    }
  }
}

const files = readdirSync(SEED_DIR).filter((f) => f.endsWith('.json')).sort();
if (files.length === 0) {
  console.error(`seed: no JSON files under ${SEED_DIR}`);
  process.exit(1);
}

let rows = 0;
const failures = [];
const banners = new Set();
const box = JSON.parse(readFileSync(join(SEED_DIR, 'tenants.json'), 'utf8')).boundingBox;

for (const file of files) {
  const doc = JSON.parse(readFileSync(join(SEED_DIR, file), 'utf8'));
  for (const row of markedRows(doc)) {
    rows += 1;
    const parsed = MarkingSchema.safeParse(row.marking);
    if (!parsed.success) {
      failures.push(`${file} ${row.path} (${row.id}): ${parsed.error.issues.map((i) => i.message).join('; ')}`);
    } else {
      banners.add(markingBanner(parsed.data));
    }
  }
  // The land-only bounding box is a portability rule, not a cosmetic one: a
  // coordinate that drifts outside the invented box is the first step towards a
  // coordinate that means something real.
  for (const device of doc.devices ?? []) {
    const p = device.position;
    if (!p || p.lat < box.minLat || p.lat > box.maxLat || p.lon < box.minLon || p.lon > box.maxLon) {
      failures.push(`${file} ${device.serial}: position outside the invented bounding box`);
    }
  }
}

console.log(`seed: ${files.length} file(s), ${rows} marked row(s)`);
console.log(`seed: distinct markings — ${[...banners].sort().join(' · ')}`);

if (failures.length > 0) {
  console.error(`seed: ${failures.length} FAILURE(S)`);
  for (const f of failures.slice(0, 20)) console.error(`  ${f}`);
  process.exit(1);
}

console.log('seed: every marked row validates against the @rr/common Marking schema.');

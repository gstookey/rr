#!/usr/bin/env node
/**
 * check-migration-collisions.mjs — CI guard against duplicate migration version numbers.
 *
 * Created: 2026-07-18 | Last updated: 2026-07-18 (EP-14 #148 CI stand-up, Kepler)
 *
 * The wound this encodes (2026-07-17): `apps/api/src/services/migration-runner.ts`
 * keys applied migrations on the integer VERSION NUMBER parsed from the file name,
 * not the file name itself. Two parallel arcs that each mint the same `NNN` prefix
 * collide SILENTLY — once a database records that version, the second arc's file is
 * skipped forever, starving its schema change with no error. (See the CLAUDE.md
 * migration paragraph: claim numbers against `origin/main`, not your branch base.)
 *
 * This guard replicates the runner's parsing EXACTLY (same pattern, same numeric
 * coercion) so it catches every collision the runner would suffer — including
 * mixed-width duplicates like `007_x.sql` vs `7_y.sql` (both version 7), which a
 * naive string-prefix check would miss.
 *
 * Usage:
 *   node scripts/check-migration-collisions.mjs            # checks infra/migrations/
 *   node scripts/check-migration-collisions.mjs <dir>      # checks an explicit dir (tests)
 *
 * Exit 0 = no collisions. Exit 1 = collision(s) found (fails the CI build).
 */

import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Kept byte-identical to MIGRATION_FILE_PATTERN in migration-runner.ts. If the
// runner's parsing changes, change it here too — this guard is only honest while
// it mirrors what the runner actually does.
const MIGRATION_FILE_PATTERN = /^(\d+)[_-].*\.sql$/;

const DEFAULT_MIGRATIONS_DIR = fileURLToPath(new URL("../infra/migrations/", import.meta.url));

function collectMigrationFiles(dir) {
  return readdirSync(dir)
    .map((fileName) => {
      const match = MIGRATION_FILE_PATTERN.exec(fileName);
      return match ? { version: Number(match[1]), fileName } : null;
    })
    .filter((entry) => entry !== null)
    .sort((a, b) => a.version - b.version);
}

function main() {
  const dir = process.argv[2] ?? DEFAULT_MIGRATIONS_DIR;

  let migrations;
  try {
    migrations = collectMigrationFiles(dir);
  } catch (err) {
    console.error(`migration-collision guard: cannot read migrations dir "${dir}"\n  ${err.message}`);
    process.exit(1);
  }

  const byVersion = new Map();
  for (const { version, fileName } of migrations) {
    const bucket = byVersion.get(version) ?? [];
    bucket.push(fileName);
    byVersion.set(version, bucket);
  }

  const collisions = [...byVersion.entries()]
    .filter(([, files]) => files.length > 1)
    .sort((a, b) => a[0] - b[0]);

  if (collisions.length > 0) {
    console.error(`migration-collision guard: FAIL — duplicate migration version number(s) in ${dir}\n`);
    for (const [version, files] of collisions) {
      console.error(`  version ${version} is claimed by ${files.length} files:`);
      for (const f of files.sort()) console.error(`    - ${f}`);
    }
    console.error(
      "\nThe migration runner keys on the version number, so only ONE of each colliding pair" +
        "\never applies — the rest are silently skipped on any DB that recorded that version." +
        "\nRenumber the newer file(s) to the next free slot against origin/main before merging.",
    );
    process.exit(1);
  }

  const highest = migrations.length > 0 ? migrations[migrations.length - 1].version : "none";
  console.log(
    `migration-collision guard: OK — ${migrations.length} migration file(s), no duplicate version numbers (highest: ${highest}).`,
  );
  process.exit(0);
}

main();

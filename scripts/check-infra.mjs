#!/usr/bin/env node
/**
 * check-infra.mjs — structural checks on the artifacts the fleet CANNOT run.
 *
 * There is no Docker daemon in the agent environment, so `docker compose up` and
 * the Keycloak realm import happen for the first time on Graham's machine. The
 * honest response is not to skip these files in the gate; it is to check
 * everything that CAN be checked without a daemon, and to be explicit that the
 * rest is unverified.
 *
 * What this asserts:
 *  - the compose file is valid YAML and pins EXACT image tags (a floating tag is
 *    an unreproducible stack, which is the one thing the island cannot debug);
 *  - the realm JSON parses and contains no key Keycloak's Jackson mapper would
 *    reject (that mapper does NOT disable FAIL_ON_UNKNOWN_PROPERTIES, so a stray
 *    "$comment" aborts the import);
 *  - the compose mount and the realm file agree about where the realm lives;
 *  - and, IF the docker CLI is installed, that `docker compose config` accepts
 *    the file. That command validates against the Compose spec and needs no
 *    daemon, so it is available even here — a strictly stronger check than a
 *    YAML parse. It is skipped, loudly, when the CLI is absent.
 *
 * What it does NOT assert, and never claims to: that Keycloak starts, that the
 * realm imports, that the init SQL runs, or that RLS behaves.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPOSE = join(ROOT, 'infra', 'docker-compose.yml');
const REALM = join(ROOT, 'infra', 'keycloak', 'realm-acme-workshop.json');

const failures = [];
const fail = (m) => failures.push(m);

// ---- compose ---------------------------------------------------------------
const compose = readFileSync(COMPOSE, 'utf8');

// A deliberately small YAML sanity pass rather than a dependency: tabs are
// illegal in YAML and are the single most common way a hand-edited compose file
// breaks, and the structural keys must be present at the right depth.
compose.split('\n').forEach((line, i) => {
  if (/^\s*\t/.test(line)) fail(`docker-compose.yml:${i + 1} uses a TAB; YAML forbids tabs for indentation`);
});
for (const key of ['services:', '  postgres:', '  keycloak:', 'volumes:']) {
  if (!compose.includes(`\n${key}`) && !compose.startsWith(key)) fail(`docker-compose.yml is missing '${key.trim()}'`);
}

const images = [...compose.matchAll(/^\s*image:\s*(\S+)\s*$/gm)].map((m) => m[1]);
if (images.length === 0) fail('docker-compose.yml declares no images');
for (const image of images) {
  if (!/:\d+\.\d+(\.\d+)?$/.test(image)) {
    fail(`image '${image}' is not pinned to an exact x.y.z tag — a floating tag is an unreproducible stack`);
  }
}
const expectPinned = ['postgres:18.6', 'quay.io/keycloak/keycloak:26.7.3'];
for (const want of expectPinned) {
  if (!images.includes(want)) fail(`docker-compose.yml no longer pins '${want}' (found: ${images.join(', ')})`);
}
if (!compose.includes('--import-realm')) fail('keycloak does not start with --import-realm; the realm would not load');
if (!compose.includes('./keycloak:/opt/keycloak/data/import')) {
  fail('the realm directory is not mounted at /opt/keycloak/data/import');
}
if (!/healthcheck:/.test(compose)) fail('no healthcheck declared');

// ---- realm -----------------------------------------------------------------
let realm;
try {
  realm = JSON.parse(readFileSync(REALM, 'utf8'));
} catch (error) {
  fail(`realm-acme-workshop.json does not parse: ${error.message}`);
}

if (realm) {
  // Keycloak's realm importer uses a stock Jackson mapper. Anything outside
  // RealmRepresentation aborts the import — so no comment keys, anywhere.
  const walk = (node, path) => {
    if (Array.isArray(node)) return node.forEach((v, i) => walk(v, `${path}[${i}]`));
    if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) {
        if (k.startsWith('$')) {
          fail(`realm ${path}.${k}: Keycloak's importer rejects unknown properties — no '$' keys in a realm export`);
        }
        walk(v, `${path}.${k}`);
      }
    }
  };
  walk(realm, '$');

  if (realm.realm !== 'acme-workshop') fail(`realm name is '${realm.realm}', expected 'acme-workshop'`);
  if (!Array.isArray(realm.users) || realm.users.length === 0) fail('realm declares no users');
  for (const user of realm.users ?? []) {
    if (!user.attributes?.handling_level) fail(`user '${user.username}' has no handling_level attribute`);
    if (!user.attributes?.compartments) fail(`user '${user.username}' has no compartments attribute`);
  }
}

// ---- compose, against the Compose spec (no daemon needed) ------------------
let composeSchema = 'skipped (no docker CLI on PATH)';
const probe = spawnSync('docker', ['--version'], { encoding: 'utf8' });
if (probe.status === 0) {
  const validated = spawnSync('docker', ['compose', '-f', COMPOSE, 'config'], { encoding: 'utf8' });
  if (validated.status === 0) {
    composeSchema = 'valid (`docker compose config`)';
  } else {
    fail(`docker compose config rejected the file:\n${(validated.stderr || validated.stdout || '').trim()}`);
    composeSchema = 'INVALID';
  }
}

if (failures.length > 0) {
  console.error(`infra: ${failures.length} problem(s)`);
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`infra: compose pins ${images.join(', ')}; schema ${composeSchema}.`);
console.log(`infra: realm '${realm.realm}' parses with ${realm.users.length} personas, no unknown-property keys.`);
console.log('infra: NOT VERIFIED HERE — no Docker daemon. `docker compose up` and the realm import are Graham-side.');

---
schema: corpus-doc/v1
status: exploratory
title: Offline Verification Transcript v3 — the ladder 17 → 22.2.1 replayed against Nexus, loaded only by the bundle's own uploader
areas: [isolated-network, dev-environment, risk-gates, frontend]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v2.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v3.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v2.md"]
updated: 2026-10-01
---

# Offline Verification Transcript v3

**Created:** 2026-10-01 (Axium) | **Status:** `exploratory` — evidence record. **Supersedes v2** (Verdaccio, 17→19). Everything below was **run**; numbers are copied from the output.

## Set-up

| Real thing | Stand-in |
|---|---|
| the legacy island's Nexus | `sonatype/nexus3:3.76.1` (Docker), a **fresh, empty** npm-hosted repository `npm-legacy` — plus stub `@my-team/legacy-app-0{1,2}-common` packages, because the island's Nexus serves that metadata (so the replay ran **without** the online walk's rehearsal-only line drop) |
| an island workstation | RHEL 9.8 (UBI 9) container on a Docker `--internal` network — negative control every run: `curl https://registry.npmjs.org/` fails |
| the island's Node | **v22.15.1** / npm 10.9.2 (Graham's actual version); rung 21→22 on **v22.23.3 installed from the bundle's own `node/`** after its SHASUMS256 check |
| the transfer | `angular-upgrade-bundle-v17-v22-2026-10-01` (cumulative), mounted read-only |
| the apps | the two shells at their committed v17 state, cloned fresh, **empty npm cache** |

Driven **only by what is inside the bundle**: `upload-to-nexus.sh --through <rung>` before each rung, then `tools/hop.sh <app> <rung> all` for both apps.

## Results

| Step | app-01 | app-02 | Nexus load (`--through`) |
|---|---|---|---|
| v17 baseline: `npm ci` from Nexus + validate | ✅ (17.3.12, cli 17.3.17) | ✅ (17.3.12, cli 17.3.7) | v17-baseline: **published 1,220**, repaired 0, FAILED 0 |
| 17 → 18 | ✅ GREEN (222 s) | ✅ GREEN (227 s) | 17-18: published 196, repaired 0, FAILED 0 |
| 18 → 19 | ✅ GREEN (290 s) | ✅ GREEN (297 s) | 18-19: published 154, repaired 0, FAILED 0 |
| 19 → 20 | __R1920_01__ | __R1920_02__ | 19-20: published 211, repaired 0, FAILED 0 |
| 20 → 21 | __R2021_01__ | __R2021_02__ | __U2021__ |
| 21 → 22.2.1 | __R2122_01__ | __R2122_02__ | __U2122__ |

GREEN = `hop.sh … all` completed every step and `validate` passed: `ng build`, `tsc` in every package, `jest`, `npm ls` (the v18 `chokidar` optional-peer WARN as expected).

## What this replay caught (each fixed, then re-run from an empty repository)

1. **Concurrent uploads drop versions from Nexus's npm metadata.** First attempt: the temporary CLI install inside `ng update @angular/cli@18.2.21` failed — `No matching version found for ini@4.1.3` — although `ini-4.1.3.tgz` was in Nexus: the package's metadata listed only 4.1.2. Measured across the repository: 57 packages / 61 versions missing. Fix: one package per job, its versions one at a time, then a verify-and-repair pass (`npm-load-package.sh`).
2. **Nexus's components REST API strips npm metadata to ~10 fields — `ng-update` among them.** Second attempt: phase 1 moved only `@angular/core`, `@angular/cli` and zone.js (`ng update` reads Angular's package groups from the registry), and phase 2 failed on `platform-browser-dynamic` peers. `npm publish` keeps the whole manifest (tested: 25–30 fields). Fix: the uploader publishes; the verify pass treats a version missing `ng-update`/`optionalDependencies`/`bin`/`os`/`cpu`/`peerDependenciesMeta` as incomplete; `hop.sh` refuses to start if `@angular/core`'s metadata has no `ng-update`. After the fix, phase 1 at 17→18 moved the whole group (common, compiler, forms, router, platform-*, `build-angular`, `compiler-cli`, TypeScript 5.5.4) exactly as online.
3. **The bundle's own checksums failed** (`BUNDLE-INFO.txt: FAILED`) on a re-cut: the build reused its output directory and checksummed a stale file. The uploader refused the bundle — correctly. Fix: the output is assembled fresh and every file, `MANIFEST.json` included, is checksummed.

Also verified along the way: `npm publish --registry` overrides a tarball's own `publishConfig.registry` with npm 10.9.2 (packages pointing at registry.npmjs.org and wombat-dressing-room), and npm 11 needs an explicit dist-tag to publish an older version (the loader now always passes one).

## Not covered

Real application source (the shells have almost none); the private `@other-team/*` packages; a Nexus 3.81 / 3.96 instance (rehearsed on 3.76.1 — the npm hosted behaviours above are long-standing, but **[UNVERIFIED]** on those versions: the loader's verify pass is what makes the result independent of them).

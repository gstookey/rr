---
schema: corpus-doc/v1
status: exploratory
title: Nexus Upload Instructions v2 — loading an Angular upgrade bundle with upload-to-nexus.sh (npm publish, staged per rung, metadata verified)
areas: [isolated-network, dev-environment]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v3.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v3.md"]
updated: 2026-10-01
---

# Nexus Upload Instructions v2

**Created:** 2026-10-01 | **Status:** `exploratory` — **rehearsed against a real Nexus** (3.76.1) on 2026-10-01: the whole ladder was loaded rung by rung with the script below and then hopped offline against it. **Supersedes v1**, whose `npm publish` loop was never tested against Nexus. This file travels in every upgrade bundle as `NEXUS_UPLOAD.md`.

## What is in the bundle

```
angular-upgrade-bundle-<slice>-<date>/
  tarballs/          the original published npm tarballs (NOT node_modules) -- each lockfile's sha512 matches them
  SHA256SUMS         checksums (in a delta bundle: of the whole merged set)
  MANIFEST.json      every tarball, its registry URL, and the rung(s) that need it
  upload-to-nexus.sh the loader (this document)
  tools/             hop.sh + make-root-angular-json.mjs + port-root-angular-json.mjs
  LADDER.md          the hop procedure
  node/              cumulative and 21-22 bundles only: Node.js 22.23.3 (linux-x64) + SHASUMS256.txt
```

**Why tarballs and not node_modules:** lockfiles pin each package by a sha512 over the *published tarball bytes*. Repacking from an installed `node_modules` produces different bytes and `npm ci` fails with `EINTEGRITY`; it also carries post-install artefacts (compiled native output, downloaded browsers). These are the bytes the public registry served, verified.

## 1. Verify the transfer

```bash
tar -xf angular-upgrade-bundle-<slice>-<date>.tar && cd angular-upgrade-bundle-<slice>-<date>
sha256sum -c SHA256SUMS --quiet --ignore-missing && echo TRANSFER-OK
```

## 2. Load Nexus — one rung at a time

```bash
export NEXUS_URL=http://<nexus-host>:8081            # base URL, no /repository/... suffix
export NPM_REPO=<your npm HOSTED repository>         # the hosted one, not a group
export NEXUS_CREDENTIALS_FILE=~/.nexus-creds         # one line: user:password (an account that may write to NPM_REPO)
./upload-to-nexus.sh --through v17-baseline          # optional: the starting surface (probably already there)
./upload-to-nexus.sh --through 17-18                 # before hopping to 18
# ... later: --through 18-19, 19-20, 20-21, 21-22    (or no option: everything at once)
```

- **Staged on purpose:** with only the current rung's surface in Nexus, a loose `^` range in some other app cannot resolve ahead of where the estate is.
- It loads with **`npm publish`**, one package per job and that package's versions **one at a time**, then **verifies** that Nexus's npm metadata lists every version **completely** — and deletes and re-publishes any that is not. Three things found by running against Nexus on 2026-10-01 make that necessary: (1) Nexus's components REST API builds metadata from ~10 fields and **drops `ng-update`**, so `ng update` against it moves `@angular/core` alone; (2) uploading two versions of one package at the same time can make Nexus **drop a version from the metadata**; (3) npm 11 refuses to tag an older version `latest`, so every publish carries an explicit tag. Bytes are stored exactly as delivered; `--registry` and `--provenance=false` override any `publishConfig` inside a tarball (verified with npm 10.9.2). It needs `node` + `npm` (your workstations have them) and writes the credentials only to a private temporary npmrc.
- **Re-running it repairs an earlier load** — including one made with an earlier loader.
- **Re-runnable:** a tarball Nexus already serves is skipped (`already-present`), so an interrupted run resumes and overlapping bundles are harmless. Only `FAILED=0` is done; failures are listed in `upload-logs/`.
- **Nexus Community Edition 3.77+** refuses every upload until an administrator accepts Sonatype's EULA — the script checks and stops with that message instead of failing hundreds of times with HTTP 403.
- Large tarballs: the biggest is ~8 MB (`@stencil/core`); a reverse proxy in front of Nexus must accept that request size.

## 3. Check from a workstation

```bash
npm view @angular/core@18.2.14 version --registry <your npm group or hosted URL>   # the rung's landing version answers
npm view @angular/core@18.2.14 ng-update.packageGroup --registry <...>             # must print a list (hop.sh checks this too)
npm view @my-team/<your workspace package> version                                 # ng update needs this metadata
```

Then hop: `LADDER.md`.

## Delta bundles

If an earlier bundle is already loaded, the connected side can cut only what is new: `build-transfer-bundle.sh <dir> --delta-from <that bundle's MANIFEST.json>`. Load it the same way — `--ignore-missing` above is what lets a delta's whole-set `SHA256SUMS` check the files it carries.

## Node.js 22.23.3 (before the 21-22 rung)

Angular 22 requires Node `^22.22.3 || ^24.15.0 || >=26`. The bundled `node/node-v22.23.3-linux-x64.tar.xz` is a patch upgrade within the 22 line the workstations already run:
```bash
cd node && grep " node-v22.23.3-linux-x64.tar.xz$" SHASUMS256.txt | sha256sum -c -     # must print OK
```
Install it the way your workstations install Node (tarball to a prefix, then PATH). `hop.sh <app> 21-22 check` confirms the version before anything changes.

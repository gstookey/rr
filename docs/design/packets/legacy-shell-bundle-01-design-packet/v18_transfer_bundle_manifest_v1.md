---
schema: corpus-doc/v1
status: superseded
superseded_by: "docs/design/packets/legacy-shell-bundle-01-design-packet/v17_to_v19_bundle_manifest_v2.md"
title: v18 Transfer Bundle Manifest v1 — measured from the legacy shells, verified offline
areas: [isolated-network, technology-stack, dev-environment]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/README.md", "docs/design/packets/ng-hop-01-v17-to-v18-design-packet/v18_hop_bundle_manifest_v0.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v1.md"]
updated: 2026-09-03
---

# v18 Transfer Bundle Manifest v1

> **Superseded 2026-09-03** by [`v17_to_v19_bundle_manifest_v2.md`](v17_to_v19_bundle_manifest_v2.md) — kept for its evidence trail (notably: the root-angular.json placement rehearsal and the first offline verification). The v2 manifest reflects the REAL app layout (angular.json in packages/client/, confirmed by Graham) and the reconciled dependency set (puppeteer 21.9.0 et al.).

**Created:** 2026-09-03 | **Status:** `exploratory` — measured on the approximated shells; supersedes the bare-app numbers in `ng-hop-01/v18_hop_bundle_manifest_v0.md` as the working estimate, **not** yet an estate manifest

## What the bundle is

Every npm tarball the **entire journey** actually fetched, captured from a single fresh npm cache: both shells' v17 baseline installs, the full 17→18 hop on both (including `ng update`'s temporary v18 CLI), and the v18 end-state — deduplicated by construction.

| Quantity | Value |
|---|---|
| Distinct tarballs | **1,311** |
| Total tarball bytes | **143.4 MB** |
| — v17 baseline (both apps) | 1,128 tarballs / 98.3 MB |
| — hop + v18 delta | 183 tarballs / 45.1 MB |
| App-02's marginal cost over app-01 | **0 tarballs, both phases** (identical dep surface) |
| Largest items | `@stencil/core@3.4.2` 8.3 MB (AstroUXDS), `typescript@5.2.2` 7.2 MB, `@angular/core@17.3.12` 6.7 MB |

Integrity: `legacy-shells/bundle/SHA256SUMS` (sha256 per tarball) and `legacy-shells/bundle/MANIFEST.json` (bytes, sha256, npm sha512 integrity, source URL per tarball — every sha512 re-verified against npm's cache index at extraction). Rebuild: `legacy-shells/tools/build-v18-hop-bundle.sh`.

Delivered to Graham as `rr-legacy-v17-v18hop-bundle-2026-09-03.tar` (tarballs are already gzip; the container tar is uncompressed).

### Comparison to the bare-app estimates

| | bare app (`ng-hop-01`, v18 only) | shells (v17 + hop + v18, two apps) |
|---|---|---|
| tarballs | 918 | 1,311 |
| bytes | ≈70 MB | 143.4 MB |

The old "floor, not estimate" caveat did its job: the estate surface roughly doubles the bare figure, and the v17 baseline (which the island nominally already has, but which the registry must serve anyway for lock regeneration — Finding 6 in the runbook delta) is over two-thirds of it. Registry dedupe held exactly as predicted: the second application cost **zero additional tarballs**.

## What the bundle deliberately EXCLUDES but the island must already have

The island-internal packages, assumed present in Nexus (versions from the real package.jsons):

| Package | Version | Declared in |
|---|---|---|
| `@other-team/core-web-angular` | 1.6.0 | roots, clients |
| `@other-team/core-common` | 1.2.0 | roots |
| `@other-team/core-node` | 1.2.0 | servers |
| `@ssd_victor/fix-es-imports` | 1.0.0 | commons, servers |
| `@ssd_victor/merge-coverage` | ^1.0.0 | roots |
| `@my-team/*` (workspace-local) | 1.0.0 | roots, servers — **must resolve in Nexus metadata for `ng update`** (runbook delta Finding 2) |

**Their transitive and peer dependencies are invisible from here** and are the most likely source of a bundle gap on the island. `[NEEDS GRAHAM]`: their package.jsons (or just Nexus's dependency listing for each) would close this blind spot cheaply.

## Honest limits

1. **Shells approximate shape, not code.** Real locks may resolve differently (island registry history, npm version, install order). Porting the real `package-lock.json` files is the documented **fallback path** — not an open ask.
2. **Platform-pinned binaries: linux-x64 only.** npm fetched only the platform-matching native packages: `@esbuild/linux-x64`, `@lmdb/lmdb-linux-x64`, `@msgpackr-extract/msgpackr-extract-linux-x64`, `@napi-rs/lzma-linux-x64-gnu`, `@rollup/rollup-linux-x64-gnu`, `@rollup/rollup-linux-x64-musl`. If any island workstation or build host is not linux-x64, its variants are missing. `[NEEDS NETWORK OWNER]` — OS/arch of workstations and build hosts.
3. **puppeteer's Chromium is not in any npm tarball.** The estate pins ancient `puppeteer` (declared 3.2.5 — a version that does not exist publicly; shells used 3.3.0), whose postinstall downloads a Chromium binary from Google's CDN. Offline, installs need `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true` (used throughout this rehearsal) or the download fails the install. If anything on the island actually **runs** puppeteer, a Chromium binary is a separate non-npm transfer item. Questionnaire item.
4. **Jest, not Karma.** The real apps test with jest/jsdom — the whole jest toolchain is in this bundle, tests ran offline with **no browser**. `ng-hop-01`'s browser-binary risk (B9) is downgraded from "no test safety net" to "e2e/manual verification only." B9 stays in the questionnaire with reduced weight.
5. **Version drift.** These are the versions the registry served on **2026-09-03** (`v18-lts` tag can move; `keycloak-angular 16.1.0` was chosen by hand). Re-run the build script and re-verify before packing for a real transfer; a manifest older than ~30 days is a draft.
6. **Environment delta.** Rehearsed on Node v22.22.2 / npm 10.9.7; the island runs Node 22.15 (npm version unknown — questionnaire). No `engines` fields exist in the estate package.jsons to catch a mismatch.
7. Graham's real config files (angular.json budgets, jest configs, tsconfigs) postdate this measurement; re-verify after they land.

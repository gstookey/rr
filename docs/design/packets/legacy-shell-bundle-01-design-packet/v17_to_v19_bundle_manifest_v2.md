---
schema: corpus-doc/v1
status: exploratory
title: v17→v19 Bundle Manifest v2 — the master pool, its slices, and the sizes
areas: [isolated-network, technology-stack, dev-environment]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v2.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md"]
updated: 2026-09-03
---

# v17 → v19 Bundle Manifest v2 — pool + slices

**Created:** 2026-09-03 | **Status:** `exploratory` — measured on the reconciled shells (real layout, corrected pins); covers **all of Milestone 1** (both hops, both apps). Supersedes v1 and `ng-hop-01/-02`'s bare-app manifests as the working numbers.

## Design: one pool, sliced per need

There is **one master tarball pool** — every registry tarball any rung needs, deduplicated, each tagged with the rung that first needs it — and per-rung bundles are **views over it**, cut by `tools/slice-bundle.mjs`. Ground truth is lock-driven: the committed lock snapshots (`legacy-shells/bundle/locks/{v17,v18,v19}/`, plus `bundle/tempcli/{hop18,hop19}/` covering `ng update`'s temporary-CLI fetch), filtered to **linux-x64** (island = RHEL 9, confirmed — foreign-platform binaries excluded; `--all-platforms` exists and costs ~850 MB total).

## The sizes (measured 2026-09-03)

| Slice | Tarballs | Bytes | Use |
|---|---|---|---|
| v17 baseline | 1,156 | 104.0 MB | what the estate's current apps resolve — **probably already on Nexus** (see below) |
| 17→18 hop delta | 184 | 45.1 MB | first needed by the v18 hop (incl. temp CLI 18.2.21, TS 5.5.4, keycloak-angular 16, ngrx 18, material 18) |
| 18→19 hop delta | 155 | 42.2 MB | first needed by the v19 hop (incl. temp CLI 19.2.27, zone 0.15.1, jest-preset-angular 14.6.2, ngrx 19, material 19, keycloak-angular 19) |
| **Cumulative 17→19 union** | **1,495** | **191.3 MB** | the master pool; default deliverable |
| Delta vs. the 2026-09-03 v18-hop bundle Graham holds | 194 | 48.2 MB | his minimum new payload if merging onto that tar |

Second app's marginal cost: **zero tarballs at every rung** (identical dependency surface). Ten apps ≈ one app plus per-app novelties. These are original-tarball bytes — installed `node_modules` trees are ~4x larger; nobody is porting gigabytes.

**The insight worth acting on: the estate's apps build on the island today, so Nexus must already serve their entire v17 dependency surface.** If so, the 104 MB baseline is redundant for porting and the real payload to reach Milestone 1 is the two hop deltas — **87.3 MB**. Status: **probable, not verified.** Before porting: export/query Nexus's package list and run `--delta-from` against it (procedure in the upload instructions). The baseline stays in the master pool regardless, as insurance.

## Integrity and reproduction

- `legacy-shells/bundle/SHA256SUMS` + `MANIFEST.json` (per-tarball bytes, sha256, npm sha512, source URL, rung tags). The prior bundle's manifest is archived beside them (`*-2026-09-03-v18hop.*`) for delta computation.
- **Rebuild:** `legacy-shells/tools/build-transfer-bundle.sh <workdir> [--cumulative | --rung <r> | --delta-from <manifest>]` — lock-driven, resumable, fails loudly. **Tested end-to-end 2026-09-03 from a clean workdir:** all 1,495 tarballs fetched fresh from the registry and the pool **matched the committed SHA256SUMS exactly** (registry tarballs are immutable; the union has zero changed-bytes cases against the prior bundle).
- 10 tarballs from the prior bundle are **superseded/unneeded** in the union (the `puppeteer@3.3.0` stand-in tree, replaced by the corrected 21.9.0 pin). Harmless if already uploaded to Nexus; listed by the delta tooling.

## Deliberately excluded, with rationale (updated per Graham, 2026-09-03)

| Packages | Rationale |
|---|---|
| `@other-team/core-*` (1.6.0 / 1.2.0 / 1.2.0) | **upgraded independently by the owning team** — coordination item at guinea-pig time, not bundle cargo |
| `@ssd_victor/*` | **assumed current on island Nexus** (Graham observed its tree updating regularly there) — not critical to carry |
| `@my-team/*` workspace packages | island-local; **Nexus confirmed to serve their metadata** (the `ng update` metadata wall does not exist on the island) |
| puppeteer's Chromium | not npm cargo; island convention already handles it (`PUPPETEER_SKIP_DOWNLOAD=true` in every app's `.npmrc` — Graham). Nothing on the estate actually runs puppeteer. |

## Honest limits

1. Shells approximate **shape, not code** — real locks may differ; porting the real lockfiles stays the documented fallback.
2. Versions are what the registry served on **2026-09-03**; re-run the build script and re-verify before a real transfer (>30 days = draft). `keycloak-angular` and `jest-preset-angular` bumps were chosen by hand from live registry pairings, not by schematic.
3. Rehearsed on Node v22.22.2 / npm 10.9.7 vs. island Node 22.15 (npm version unknown). No `engines` fields anywhere in the estate files.
4. Graham's real angular.json/jest configs were not ported (his call — optional later paste of the two client angular.json files); build-budget values in the real apps are the known unknown at v19.

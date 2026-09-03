---
schema: corpus-doc/v1
status: exploratory
title: Transfer Bundle Manifest v2 — the 17→22 master pool, its slices, and the sizes
areas: [isolated-network, technology-stack, dev-environment]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v2.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md"]
updated: 2026-09-03
---

# Transfer Bundle Manifest v2 — the 17→22 master pool + slices

*(Filename retains its v17-v19 origin; extended to the full ladder the same day.)*

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 (full ladder to v22) | **Status:** `exploratory` — measured on the reconciled shells (real layout, corrected pins); covers Milestone 1 **and the stretch ladder to v22**. Supersedes v1 and `ng-hop-01/-02`'s bare-app manifests as the working numbers.

## Design: one pool, sliced per need

There is **one master tarball pool** — every registry tarball any rung needs, deduplicated, each tagged with the rung that first needs it — and per-rung bundles are **views over it**, cut by `tools/slice-bundle.mjs`. Ground truth is lock-driven: the committed lock snapshots (`legacy-shells/bundle/locks/{v17..v22}/`, plus `bundle/tempcli/{hop18..hop22}/` covering `ng update`'s temporary-CLI fetches), filtered to **linux-x64** (island = RHEL 9, confirmed — foreign-platform binaries excluded; `--all-platforms` exists at roughly 6x the bytes).

## The sizes (measured 2026-09-03; extended same day to the full ladder)

| Slice | Tarballs | Bytes | Use |
|---|---|---|---|
| v17 baseline | 1,156 | 104.0 MB | what the estate's current apps resolve — **probably already on Nexus** (see below) |
| 17→18 hop delta | 184 | 45.1 MB | temp CLI 18.2.21, TS 5.5.4, keycloak-angular 16, ngrx 18, material 18 |
| 18→19 hop delta | 155 | 42.2 MB | temp CLI 19.2.27, zone 0.15.1, jest-preset-angular 14.6.2, third parties 19 |
| 19→20 hop delta | 209 | 45.9 MB | temp CLI 20.3.36, TS 5.9.3, third parties 20 |
| 20→21 hop delta | 192 | 46.3 MB | temp CLI 21.2.23, **the Jest 30 stack**, third parties 21 |
| 21→22 hop delta | 206 | 72.1 MB | temp CLI 22.1.7, TS 6.0.3, third parties 22 |
| Cumulative 17→19 union (Milestone 1) | 1,495 | 191.3 MB | archived manifest `MANIFEST-2026-09-03-v17v19.json` |
| **Cumulative 17→22 union (full ladder)** | **2,102** | **355.6 MB** | **the master pool; the committed SHA256SUMS/MANIFEST** |
| **Bare-minimum v22 state** (what the v22 apps' locks alone need) | 1,273 | 143.0 MB | the low-risk legacy landing set; recipe: `lock-union.mjs bundle/locks/v22/*.json` — fully contained in the pool |
| Delta vs. the 2026-09-03 v18-hop bundle Graham holds | 194 | 48.2 MB | minimum new payload onto that tar (v19 scope) |
| Delta v19-pool → v22-pool | 607 | 164.2 MB | the stretch rungs' additional payload |

**Full-ladder port economics:** if Nexus already serves the v17 surface, the whole 17→22 ladder ports as ~251.6 MB of hop deltas — and each rung individually stays under 75 MB. Dedupe held across the wider set: the union is one-third of the naive per-state sum, and nowhere near "multiple gigs" (that is unpacked `node_modules`, ~4x these bytes per state).

Second app's marginal cost: **zero tarballs at every rung** (identical dependency surface). Ten apps ≈ one app plus per-app novelties. These are original-tarball bytes — installed `node_modules` trees are ~4x larger; nobody is porting gigabytes.

**The insight worth acting on: the estate's apps build on the island today, so Nexus must already serve their entire v17 dependency surface.** If so, the 104 MB baseline is redundant for porting and the real payload to reach Milestone 1 is the two hop deltas — **87.3 MB**. Status: **probable, not verified.** Before porting: export/query Nexus's package list and run `--delta-from` against it (procedure in the upload instructions). The baseline stays in the master pool regardless, as insurance.

## Integrity and reproduction

- `legacy-shells/bundle/SHA256SUMS` + `MANIFEST.json` (per-tarball bytes, sha256, npm sha512, source URL, rung tags). The prior bundle's manifest is archived beside them (`*-2026-09-03-v18hop.*`) for delta computation.
- **Rebuild:** `legacy-shells/tools/build-transfer-bundle.sh <workdir> [--cumulative | --rung <r> | --delta-from <manifest>]` — lock-driven, resumable, fails loudly. **Tested end-to-end 2026-09-03 from clean workdirs, twice:** at 17→19 scope (1,495 fetched fresh) and again at full-ladder scope (**2,102 fetched fresh**) — the pool **matched the committed SHA256SUMS exactly** both times (registry tarballs are immutable; zero changed-bytes cases against any prior bundle).
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
5. The stretch rungs' bundles carry the same shells-not-code caveat **plus** the v22 rung's open items: the skipped `@ngrx` v22 migrations (`[UNVERIFIED]` what they edit on real code) and the two TS-6 tsconfig edit classes every real app will need.

## The two variant bundles (Graham, 2026-09-03) — one delivered as a recipe, one specced

**Bare-minimum v22** — the estate's natural landing point — **is the ladder's own v22 state**: the union of the v22 lock snapshots (1,273 tarballs / 143.0 MB, fully contained in the master pool; recipe above). No separate build needed.

**"Golden" (newest mutually-compatible set)** — specced for the next run, deliberately not rushed: it is a *new-project* stack (essentially the Desert Island target: Angular 22 / TS 6 / Vitest / NgRx Signals / AstroUXDS 9 / Express 5), and per ADR-005 it doubles as **both** the greenfield seed (feeds S-05/EP-04) **and** legacy's eventual convergence target *if* the estate reaches v22. Spec constraints established this run:
- **Never "latest of everything":** Angular 22 pins `typescript >=6.0 <6.1` while `typescript@latest` is **7.0.2** — a naive max-version set cannot compile. Every pin must be constraint-solved and verified live.
- `@astrouxds/angular@9.0.0` peers `@angular/* >=20` — ng22-compatible **on paper**; its `@stencil` runtime compatibility is `[UNVERIFIED]` until a hello-world renders. The legacy estate's 7→9 Astro move is a separate, unrehearsed effort that may fork from the Angular hops.
- Node: lean **LTS** for an island (24.x LTS vs staying on the 22.x line the estate uses — a real choice ADR-005's granularity sub-question informs); the Node runtime tarball ships alongside, not inside, the npm pool.
- Test stacks: carry **both** Jest (the estate's, proven through the ladder) and Vitest (the intended greenfield runner) — two toolchains, deliberately, until convergence is decided.
- Verification standard: a hello-world Angular 22 app must install and build **offline** from the seeded set (day-one-runbook style), not an estate-upgrade replay.
- DR-10/ADR-005 value: with bare-minimum v22 *and* golden both buildable from committed locks, Graham can answer the convergence question either way without a rebuild.

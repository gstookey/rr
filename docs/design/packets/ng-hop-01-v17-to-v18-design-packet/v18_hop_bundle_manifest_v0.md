---
schema: corpus-doc/v1
status: exploratory
title: v18 Hop Bundle Manifest v0 — what the registry needs before the hop
areas: [isolated-network, technology-stack, frontend, dev-environment]
related: ["docs/design/packets/ng-hop-01-v17-to-v18-design-packet/v17_to_v18_hop_runbook_v1.md", "docs/design/packets/iso-net-readiness-01-design-packet/stack_dependency_manifest_v0.md", "docs/context/canonical/two_island_model.md"]
updated: 2026-08-26
---

# v18 Hop Bundle Manifest v0

**Created:** 2026-08-26 | **Status:** `exploratory` — measured from a bare app; **not a complete estate bundle**

Partial delivery of [S-07](https://github.com/gstookey/rr/issues/14). The v17→v18 rehearsal produced this measurement as a by-product, so it is recorded here rather than discarded. **S-07 is not complete** — see §"What this does not cover."

## What must be in the registry before the hop starts

The runbook's finding 1 is the governing constraint: **`ng update` fetches a temporary v18 CLI before it touches your application**, so the registry must serve v18 packages *before* any `package.json` mentions v18. Seeding the registry from "what the upgraded app declares" is therefore not sufficient — the update tooling itself is a dependency.

### Direct packages, observed (versions `ng update` selected on 2026-08-26)

| Package | v17 → v18 |
|---|---|
| `@angular/animations` | `17.3.12` → `18.2.14` |
| `@angular/common` | `17.3.12` → `18.2.14` |
| `@angular/compiler` | `17.3.12` → `18.2.14` |
| `@angular/core` | `17.3.12` → `18.2.14` |
| `@angular/forms` | `17.3.12` → `18.2.14` |
| `@angular/platform-browser` | `17.3.12` → `18.2.14` |
| `@angular/platform-browser-dynamic` | `17.3.12` → `18.2.14` |
| `@angular/router` | `17.3.12` → `18.2.14` |
| `@angular/cli` | `17.3.17` → **`18.2.21`** |
| `@angular-devkit/build-angular` | `17.3.17` → **`18.2.21`** |
| `@angular/compiler-cli` | `17.3.12` → `18.2.14` |
| `typescript` | `~5.4.2` → **unchanged** |
| `zone.js` | `~0.14.3` → **unchanged** |
| `rxjs` | `~7.8.0` → **unchanged** |
| `tslib` | `^2.3.0` → **unchanged** |

**TypeScript is not bumped by this hop.** Angular 18 accepts `>=5.4 <5.6`, and `5.4.2` already satisfies it. This corrects an implication in `iso-net-readiness-01`'s hop matrix: `5.5.4` is the *highest version in the accepted window*, not the version the hop requires. Carrying the existing TypeScript is sufficient for v18.

Karma-side devDependencies (`karma`, `karma-*`, `jasmine-core`, `@types/jasmine`) were also unchanged by the hop, but are part of any working install and must be present.

## Measured footprint

Measured 2026-08-26 by resolving and installing the **post-upgrade** `package.json`/`package-lock.json` with a clean npm cache (`npm ci --ignore-scripts`), then summing the tarball bytes npm actually fetched.

| Quantity | Value |
|---|---|
| Packages in the resolved tree | **1,015** |
| Distinct tarballs to seed | **918** |
| **Total tarball bytes** | **≈ 70.0 MB** (66.7 MiB) |
| Unpacked `node_modules` | **≈ 410 MB** |

### How to read that number

**It is the floor, not the estimate.** ≈ 70 MB covers a *default Angular 18 application with Karma and nothing else*. Every real estate application adds its own third-party dependencies on top, and the estate has 10+ of them with unknown contents.

Two things push the real figure up, and one pulls it down:

- **Up:** UI libraries, state libraries, charting/grid packages, and anything else in the estate's `package.json` files — unknown until the inventory returns ([S-03](https://github.com/gstookey/rr/issues/10)).
- **Up:** `ng update`'s temporary CLI download, which is not in the app's own tree at the moment it is fetched.
- **Down:** **the applications share almost all of this.** Ten apps do not need ten times 70 MB — a registry deduplicates by package+version, so the marginal cost of app number two is only its *distinct* dependencies. **Seed one registry, not one bundle per app.**

For comparison, the greenfield Desert Island stack measured **≈ 89 MB / 521 packages** (`iso-net-readiness-01/stack_dependency_manifest_v0.md`). The v18 hop is a *larger package count* (1,015) but *smaller bytes* — the Karma/Jasmine toolchain is many small packages, where the newer stack is fewer, larger ones.

## The non-npm item: a browser binary

The rehearsal's finding 3. Karma launches a real browser; it is an **operating-system binary, not an npm package**, and it will not arrive in any tarball bundle.

If Legacy Island's applications use Karma — the v17 default, so probably most of them — then **`npm test` cannot run there without a browser present**, and the estate upgrade proceeds without its main regression safety net.

`[NEEDS NETWORK OWNER]` — is a browser already installed on Legacy Island's build hosts and workstations? This is not currently in the island questionnaire and **should be added before it is sent** (questionnaire §B). If the answer is no, a browser becomes a transfer item on a completely different supply chain from npm, with its own approval path.

## What this does not cover

S-07 is **not** complete. Still outstanding:

- **The estate's own dependencies.** Cannot be enumerated until [S-03](https://github.com/gstookey/rr/issues/10) returns. This is the dominant unknown.
- **The seeding procedure and checksum manifest** — deferred to [S-05](https://github.com/gstookey/rr/issues/12), which is itself blocked on DR-01 (which registry) and DR-02 (transfer strategy).
- **Measuring the `ng update` temp-CLI fetch** separately. It overlaps the app's own tree substantially but was not isolated and measured; treat it as included-but-unverified.
- **Verifying the hop works offline.** The rehearsal ran against the public registry. **The offline path is unrehearsed** and is the largest remaining risk in this hop.
- **v19 and beyond.** [S-08](https://github.com/gstookey/rr/issues/15) covers the v18→v19 bundle; the same measurement should be repeated after the v18→v19 rehearsal ([S-15](https://github.com/gstookey/rr/issues/22)), continuing the same throwaway application.

## Re-verification

These versions are what `ng update` selected **on 2026-08-26**. Angular's `v18-lts` tag can still move. **Re-resolve and re-measure before packing anything** — a manifest more than ~30 days old is a draft, not a manifest.

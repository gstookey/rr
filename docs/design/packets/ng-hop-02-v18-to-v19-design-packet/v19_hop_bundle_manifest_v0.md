---
schema: corpus-doc/v1
status: exploratory
title: v19 Hop Bundle Manifest v0 — and the combined v18+v19 registry cost
areas: [isolated-network, technology-stack, frontend, dev-environment]
related: ["docs/design/packets/ng-hop-02-v18-to-v19-design-packet/v18_to_v19_hop_runbook_v1.md", "docs/design/packets/ng-hop-01-v17-to-v18-design-packet/v18_hop_bundle_manifest_v0.md", "docs/design/packets/iso-net-readiness-01-design-packet/stack_dependency_manifest_v0.md"]
updated: 2026-08-28
---

# v19 Hop Bundle Manifest v0

**Created:** 2026-08-28 | **Status:** `exploratory` — measured from a bare app; **not a complete estate bundle**

Delivery of [S-08](https://github.com/gstookey/rr/issues/15), measured from the v18→v19 rehearsal the same way [S-07](https://github.com/gstookey/rr/issues/14) was measured from hop 1.

## What must be in the registry before the hop starts

Same governing constraint as hop 1, now confirmed twice: **`ng update` fetches a temporary v19 CLI before it touches the application** (`Installing a temporary Angular CLI versioned 19.2.27`). The registry must serve the v19 CLI **before any `package.json` mentions v19**.

### Direct packages, observed (versions `ng update` selected on 2026-08-28)

| Package | v18 → v19 |
|---|---|
| `@angular/animations` | `18.2.14` → `19.2.25` |
| `@angular/common` | `18.2.14` → `19.2.25` |
| `@angular/compiler` | `18.2.14` → `19.2.25` |
| `@angular/core` | `18.2.14` → `19.2.25` |
| `@angular/forms` | `18.2.14` → `19.2.25` |
| `@angular/platform-browser` | `18.2.14` → `19.2.25` |
| `@angular/platform-browser-dynamic` | `18.2.14` → `19.2.25` |
| `@angular/router` | `18.2.14` → `19.2.25` |
| `@angular/cli` | `18.2.21` → **`19.2.27`** |
| `@angular-devkit/build-angular` | `18.2.21` → **`19.2.27`** |
| `@angular/compiler-cli` | `18.2.14` → `19.2.25` |
| **`typescript`** | `5.4.5` → **`5.8.3`** ← moved this hop |
| **`zone.js`** | `0.14.10` → **`0.15.1`** ← moved this hop |
| `rxjs` | `~7.8.0` → unchanged |
| `tslib` | `^2.3.0` → unchanged |

## A rule worth extracting: how `ng update` picks TypeScript

Two hops now give the pattern, and it makes the hop matrix in `iso-net-readiness-01` **predictive** rather than merely informational:

| Hop | Angular's TS window | TS before | What `ng update` did |
|---|---|---|---|
| v17→v18 | `>=5.4 <5.6` | `5.4.5` | **nothing** — already satisfied |
| v18→v19 | `>=5.5 <5.9` | `5.4.5` | moved to **`5.8.3`** — the top of the window |

**The rule: `ng update` leaves TypeScript alone if the installed version already satisfies the new Angular's peer range; if it must move, it moves to the top of that range.**

`5.8.3` is exactly the value the hop matrix predicted for v19. So the matrix's "TS pin (highest in window)" column is a **reliable upper bound and the version to carry** — carry it, and you are covered whether the hop moves TypeScript or not.

The same pattern held for `zone.js`: untouched at v18 (`~0.14.x` still accepted), moved to `0.15.1` at v19 (which requires `~0.15.0`).

## Measured footprint

Measured 2026-08-28 by resolving and installing the **post-upgrade** `package.json` / `package-lock.json` with a clean npm cache (`npm ci --ignore-scripts`), then summing the tarball bytes npm actually fetched.

| Quantity | v18 hop | **v19 hop** |
|---|---|---|
| Packages in resolved tree | 1,015 | **1,094** |
| Distinct tarballs | 918 | **952** |
| **Total tarball bytes** | ≈ 70.0 MB | **≈ 70.8 MB** (67.5 MiB) |
| Unpacked `node_modules` | ≈ 410 MB | **≈ 414 MB** |

## The number that actually matters: both versions at once

**A staged estate upgrade means some applications sit at v18 while others have reached v19.** The registry has to serve both sets simultaneously for as long as that takes — which, across 10+ applications done one at a time, is most of the programme.

So the useful figure is not either hop alone but the **union**. Measured by installing both trees into one shared cache:

| | Distinct tarballs | Tarball bytes |
|---|---|---|
| v18 set alone | 918 | ≈ 70.0 MB |
| v19 set alone | 952 | ≈ 70.8 MB |
| Naive sum | 1,870 | ≈ 140.8 MB |
| **Actual union (measured)** | **1,162** | **≈ 117.2 MB** |

**Overlap:** 708 tarballs are shared between the two sets; 210 are v18-only and 244 are v19-only. **Seeding both versions costs ≈ 117 MB, not ≈ 141 MB** — a saving of about 24 MB (17%) because the sets share most of their transitive dependencies.

Two planning consequences:

1. **Do not budget hop bundles by addition.** Each additional Angular version costs its *distinct* packages, not its full tree. The marginal cost of adding v19 to a registry that already has v18 was ≈ 47 MB, not ≈ 71 MB.
2. **Do not plan to remove the old set when the new one lands.** Applications will be mid-migration at different times; pulling v18 out of the registry to save 47 MB would strand every application that has not yet hopped.

## How to read the totals

**They are a floor.** ≈ 117 MB covers *two versions of a default Angular app with Karma and nothing else*. Every estate application adds its own third-party dependencies — UI libraries, state libraries, charting, grids — and those are unknown until the inventory returns ([S-03](https://github.com/gstookey/rr/issues/10)).

Working against that: **registries deduplicate across applications**, so ten applications do not cost ten times anything. **Seed one registry, not one bundle per app.** The dominant variable is *how many distinct third-party packages the estate uses in total*, not how many applications there are.

For scale, alongside the greenfield Desert Island stack (≈ 89 MB / 521 packages), a registry serving both islands through Milestone 1 is on the order of **200 MB of tarballs before any estate-specific dependency is counted**. That number belongs in the transfer-size conversation (questionnaire A2).

## Still not covered

- **The estate's own dependencies** — the dominant unknown; needs [S-03](https://github.com/gstookey/rr/issues/10).
- **Seeding procedure and checksum manifest** — [S-05](https://github.com/gstookey/rr/issues/12), blocked on DR-01/DR-02.
- **The `ng update` temp-CLI fetch measured in isolation.** It overlaps the app's own tree heavily but was not separated out; treat as included-but-unverified.
- **The browser binary** — not an npm package, not in any of these numbers, and still unanswered for Legacy Island (questionnaire B9).
- **Verifying any of this offline.** Both rehearsals used the public registry. `[UNVERIFIED]` and the largest remaining risk.
- **v20/v21/v22 hop sets** — conditional on DR-04; rehearse and measure the same way if the stretch is approved.

## Re-verification

These are the versions `ng update` selected **on 2026-08-28**. Angular's `v19-lts` tag can still move. **Re-resolve and re-measure before packing** — a manifest more than ~30 days old is a draft.

---
schema: corpus-doc/v1
status: exploratory
title: Stack Dependency Manifest v0 — pinned versions and bundle footprint
areas: [technology-stack, isolated-network, dev-environment, monorepo]
related: ["docs/context/canonical/technology_stack.md", "docs/context/canonical/two_island_model.md", "docs/context/governance/decisions/ADR-004-package-manager-npm.md", "docs/context/canonical/isolated_network_constraints.md", "docs/design/packets/iso-net-readiness-01-design-packet/README.md"]
updated: 2026-08-26
---

# Stack Dependency Manifest v0

**Created:** 2026-08-25 | **Last updated:** 2026-08-26 (rehearsal correction) | **Status:** `exploratory` — design direction, pins verified but not committed to

## What this is

The intended **new-project** stack (`docs/context/canonical/technology_stack.md`), expressed as a version-pinned list, with every pin verified against the live npm registry **on 2026-08-25** in the session that produced this document. Exact `npm view` output for each pin is in Appendix A.

> **Which island:** sections 1–3 are the **Desert Island** stack (greenfield, the new system). **Appendix B is the Legacy Island hop matrix** — a different environment with a different target and its own per-hop bundles. See `docs/context/canonical/two_island_model.md`.
>
> **Expiration on the v22 pins below:** they hold only until **DR-04** closes. Because the two islands must be stack-synchronized at cluster deploy time, Desert Island's target follows whatever Legacy Island actually achieves. If Legacy Island stops at v19, every pin in section 2 moves to the v19 line. Nothing should be scaffolded on these pins before DR-04 closes.

**This is not the implemented stack.** Nothing here is installed anywhere. It is the list a transfer bundle would be built from, at today's registry state.

### Rules this manifest follows

- **No pin from memory.** Every version below was read from the registry today, or is marked `UNVERIFIED`.
- **Exact pins, no ranges.** In the eventual `package.json` these become exact versions (`"22.1.3"`, not `"^22.1.3"`), because on an isolated network a caret range is a promise the registry cannot keep.
- **`npm ci` against a committed lockfile** is the only supported install path on the island (ADR-004, consequence 3).
- **Re-verification rule:** these pins go stale. Re-run Appendix A's commands and re-date this document **before building any transfer bundle**. A pin more than ~30 days old should be treated as a draft, not a manifest.

---

# 1. Runtime and package manager

| Component | Pin | Verified | Notes |
|---|---|---|---|
| **Node.js** | **24.19.0** (LTS codename *Krypton*) | ✅ `nodejs.org/dist/index.json`, 2026-08-25 (released 2026-08-03) | **Recommended pin.** Active LTS line and comfortably inside Angular 22's engine range. |
| Node.js (alternative) | 22.23.2 (LTS *Jod*) | ✅ same source | Only if the island is already standardized on 22.x. Note the floor: Angular 22 requires `^22.22.3`, so a 22.x older than 22.22.3 **will not work**. |
| Node.js (not recommended) | 26.7.0 | ✅ same source — `lts: false` | Current line, not yet LTS as of 2026-08-25. Wrong choice for an environment we cannot patch easily. |
| **npm** | ships with Node — exact bundled version `UNVERIFIED` | ⚠️ | npm standalone `latest` is **12.0.2** (verified). The version bundled inside the Node 24.19.0 tarball was not confirmed in this session; read it from the installer at bundle-build time. Angular 22 only requires npm `>=8.0.0`, so any modern bundled npm satisfies it. |

**Engine requirement, verified verbatim** from `@angular/core@22.1.3` and `@angular/cli@22.1.5`:

```
node: '^22.22.3 || ^24.15.0 || >=26.0.0'
npm:  '^6.11.0 || ^7.5.6 || >=8.0.0'
```

This is the single hardest external constraint in the stack. If the island's Node cannot reach one of those ranges, Angular 22 is off the table for the new project **and** for the legacy estate's stretch goal — see questionnaire B2/B3 and DR-03.

---

# 2. Application stack — pinned

## Client (runtime dependencies)

| Package | Pin | Verified | Notes |
|---|---|---|---|
| `@angular/core` | `22.1.3` | ✅ `latest` | |
| `@angular/common` | `22.1.3` | ✅ resolved+installed in probe | in lockstep with core |
| `@angular/compiler` | `22.1.3` | ✅ resolved+installed | |
| `@angular/forms` | `22.1.3` | ✅ resolved+installed | |
| `@angular/platform-browser` | `22.1.3` | ✅ resolved+installed | |
| `@angular/router` | `22.1.3` | ✅ resolved+installed | |
| `rxjs` | `7.8.2` | ✅ `latest` | Angular 22 peer: `^6.5.3 \|\| ^7.4.0` |
| `zone.js` | `0.16.2` | ✅ `latest` | Angular 22 peer: `~0.15.0 \|\| ~0.16.0`. **Drops out entirely if we go zoneless** — an open stack question (`technology_stack.md`). |
| `tslib` | `2.8.1` | ✅ `latest` | |
| `@ngrx/signals` | `22.0.0` | ✅ `latest` | peer `@angular/core: ^22.0.0` — compatible with the pin above |
| `@astrouxds/angular` | `9.0.0` | ✅ `latest` | peer `@angular/{common,core}: >=20.0.0`. Pulls `@astrouxds/astro-web-components ^8.0.0` as a direct dependency. |
| `@astrouxds/astro-web-components` | `8.0.0` | ✅ `latest` | RR brand applied as CSS-custom-property overrides, never a fork (`technology_stack.md`) |

## Server / shared (runtime dependencies)

| Package | Pin | Verified | Notes |
|---|---|---|---|
| `express` | `5.2.1` | ✅ `latest` | Express **5**, not 4 — the source blueprints predate this and should be re-read against v5 before any gateway code is written. Flagged, not resolved. |

## Build / test (dev dependencies)

| Package | Pin | Verified | Notes |
|---|---|---|---|
| `@angular/cli` | `22.1.5` | ✅ `latest` | note: CLI patch (`.5`) runs ahead of core (`.3`) today — this is normal and both were resolved together successfully |
| `@angular/build` | `22.1.5` | ✅ `latest` | the esbuild-based application builder |
| `@angular/compiler-cli` | `22.1.3` | ✅ `latest` | **peer: `typescript: '>=6.0 <6.1'`** — see the TypeScript note below |
| `typescript` | `6.0.3` | ✅ highest published version satisfying Angular's peer range | |
| `vitest` | `4.1.11` | ✅ `latest` | |
| `@vitest/coverage-v8` | `4.1.11` | ✅ `latest` | include only if coverage is required; adds weight |
| `jsdom` | `30.0.1` | ✅ `latest` | Vitest DOM environment |
| `@types/node` | `26.3.0` | ✅ `latest` | note the types package tracks the Node 26 line even though the pinned runtime is 24 — verify this pairing when the workspace is actually scaffolded |
| `@types/express` | `5.0.6` | ✅ `latest` | matches Express 5 |

## Registry (island infrastructure, not an app dependency)

| Package | Pin | Verified | Notes |
|---|---|---|---|
| `verdaccio` | `6.10.0` | ✅ `latest`; `engines: { node: '>=22' }` | **Default candidate only** — DR-01. Runs on the pinned Node without a second runtime. |

---

## ⚠ Finding: the "TypeScript 6" pin is narrower than it looks

`docs/context/canonical/technology_stack.md` records the intended language as "TypeScript ~6.0". Today's registry says:

- `typescript@latest` is **7.0.2**, and the 7.x line is well established.
- `@angular/compiler-cli@22.1.3` declares `typescript: '>=6.0 <6.1'`.
- Only **two** versions exist in that window: `6.0.2` and `6.0.3`.

So the TypeScript pin is not a preference, it is **dictated by Angular 22**, and it sits one major version behind the ecosystem's current release. Consequences worth stating plainly:

1. `6.0.3` is the correct and only sensible pin today. Do not "helpfully" take `latest` — TypeScript 7 will be rejected by the Angular compiler.
2. Any third-party package we add that requires TypeScript 7 is incompatible with this stack until Angular's peer range moves.
3. Anyone hand-assembling a bundle from "the current version of everything" will pull TypeScript 7 and produce a bundle that cannot build. **This is the most likely single point of failure in a hand-packed delivery** and is called out again in the day-one runbook.

This is design direction reporting a registry fact, not a decision. It does not change `technology_stack.md` (which said `~6.0` and remains right); it sharpens it to `6.0.3` and explains why the ceiling exists.

---

# 3. Bundle footprint — measured, not estimated

Measured in this session on 2026-08-25 by resolving and installing the pinned set above with npm 10.9.7 (`--ignore-scripts`), then summing the tarball bytes npm actually fetched.

| Quantity | Value | How it was obtained |
|---|---|---|
| Packages in the resolved dependency tree | **521** | entries in the generated `package-lock.json` |
| Distinct tarballs to seed | **507** | distinct `resolved` URLs in the lockfile |
| **Total tarball bytes (what a seeded registry stores)** | **≈ 89.2 MB** (85.1 MiB) | sum of `size` over `.tgz` entries in npm's cache index |
| Same, deduplicated on disk | ≈ 88.8 MB | `du -sb` on npm's content-addressed cache |
| Unpacked `node_modules` (what lands on a workstation) | **≈ 436 MB** | `du -sh node_modules` |

**Verdaccio**, measured the same way as a separate install:

| Quantity | Value |
|---|---|
| Packages in tree | **316** |
| Total tarball bytes | **≈ 10.7 MB** (10.2 MiB) |
| Unpacked | ≈ 62 MB |

### First-order bundle budget

The measured numbers cover the new project's own dependencies plus the registry server. The full first delivery is larger, and the items below are the ones most often forgotten. Sizes marked *(est.)* are Axium's first-order estimates and are **not measured** — replace them with real numbers before packing.

| Bundle component | Size | Status |
|---|---|---|
| New-project stack tarballs | ≈ 89 MB | **measured** |
| Verdaccio tarballs | ≈ 11 MB | **measured** |
| Node 24.19.0 installer (one platform) | ~30–60 MB *(est.)* | verify against the real installer for the island's OS |
| Angular CLI toolchains for hops v18/v19/v20/v21 (legacy estate) | **substantial — assume the same order as the v22 set per hop** *(est.)* | unmeasured; depends on the estate inventory. See Appendix B and the warning below. |
| The legacy applications' own third-party dependencies at upgraded versions | **unknown** | cannot be estimated until the estate inventory returns |
| Documentation (this repo, or an export of it) | small, single-digit MB *(est.)* | subject to questionnaire C2 |
| Container images / Helm charts | **separate supply chain — not npm, not counted here** | out of scope for this packet; flagged |

**The dominant unknown is the legacy estate, not the new project.** The new project's ≈ 89 MB is a small, precisely known quantity. The estate's requirement is unbounded until the inventory table comes back — a plausible outcome is that the estate needs several times the new project's footprint, because five version hops across a dozen applications each drag in their own toolchain and their own upgraded third-party libraries.

Do not size the first transfer from the 89 MB figure alone. Size it after the inventory returns, and pad it — see questionnaire A2/A3/A4 for what that padding is worth.

---

# Appendix A — Verification transcript (2026-08-25)

Exact commands and exact output, captured in the session that produced this document. Registry: `registry.npmjs.org` via the session's HTTPS proxy. Local toolchain: Node v22.22.2, npm 10.9.7.

```
$ npm view @angular/core version
22.1.3

$ npm view @angular/cli version
22.1.5

$ npm view @angular/build version
22.1.5

$ npm view @angular/compiler-cli version
22.1.3

$ npm view @angular/core@22.1.3 engines peerDependencies
engines = { node: '^22.22.3 || ^24.15.0 || >=26.0.0' }
peerDependencies = {
  rxjs: '^6.5.3 || ^7.4.0',
  'zone.js': '~0.15.0 || ~0.16.0',
  '@angular/compiler': '22.1.3'
}

$ npm view @angular/cli@22.1.5 engines
{
  npm: '^6.11.0 || ^7.5.6 || >=8.0.0',
  node: '^22.22.3 || ^24.15.0 || >=26.0.0',
  yarn: '>= 1.13.0'
}

$ npm view @angular/compiler-cli@22.1.3 peerDependencies
{ typescript: '>=6.0 <6.1', '@angular/compiler': '22.1.3' }

$ npm view typescript dist-tags
{
  dev: '3.9.4',
  'tag-for-publishing-older-releases': '4.1.6',
  insiders: '4.6.2-insiders.20220225',
  beta: '6.0.0-beta',
  rc: '7.0.1-rc',
  latest: '7.0.2',
  next: '7.1.0-dev.20260825.1'
}

$ npm view typescript versions --json | grep -E '"6\.0\.[0-9]+"'
  "6.0.2",
  "6.0.3",

$ npm view 'typescript@>=6.0 <6.1' version
typescript@6.0.2 '6.0.2'
typescript@6.0.3 '6.0.3'

$ npm view vitest dist-tags
{ V3: '3.2.7', latest: '4.1.11', beta: '5.0.0-beta.7', rc: '5.0.0-rc.2' }

$ npm view @vitest/coverage-v8 version
4.1.11

$ npm view jsdom version
30.0.1

$ npm view @ngrx/signals version
22.0.0

$ npm view @ngrx/signals@22.0.0 peerDependencies
{ '@angular/core': '^22.0.0', rxjs: '^6.5.3 || ^7.4.0' }

$ npm view @astrouxds/angular version
9.0.0

$ npm view @astrouxds/angular@9.0.0 peerDependencies dependencies
peerDependencies = { '@angular/common': '>=20.0.0', '@angular/core': '>=20.0.0' }
dependencies = { '@astrouxds/astro-web-components': '^8.0.0', tslib: '^2.4.1' }

$ npm view @astrouxds/astro-web-components version
8.0.0

$ npm view express version
5.2.1

$ npm view rxjs version
7.8.2

$ npm view zone.js version
0.16.2

$ npm view tslib version
2.8.1

$ npm view @types/express version
5.0.6

$ npm view @types/node version
26.3.0

$ npm view verdaccio version
6.10.0

$ npm view verdaccio@6.10.0 engines
{ node: '>=22' }

$ npm view npm dist-tags        # (excerpt)
latest: '12.0.2'
```

Node release lines, from the official release index (not npm):

```
$ curl -sS https://nodejs.org/dist/index.json   # (reduced to newest per major)
v26 latest=v26.7.0  date=2026-08-05  lts=false
v25 latest=v25.9.0  date=2026-03-31  lts=false
v24 latest=v24.19.0 date=2026-08-03  lts=Krypton
v23 latest=v23.11.1 date=2025-05-14  lts=false
v22 latest=v22.23.2 date=2026-07-28  lts=Jod
v21 latest=v21.7.3  date=2024-04-10  lts=false
```

Footprint measurement (scratch directory outside the repo; nothing was written into `gstookey/rr`):

```
$ npm ci --cache <scratch>/npmcache --no-audit --no-fund --ignore-scripts
$ du -sb <scratch>/npmcache/_cacache/content-v2
88764322

$ du -sh <scratch>/node_modules
436M

# sum of `size` over .tgz entries in npm's cache index
tarballs: { count: 400 (deduped), bytes: 89195858, MB: 89.2, MiB: 85.1 }
lockfile package entries: 521 · distinct resolved tarball URLs: 507
```

Verdaccio, measured separately:

```
tarballs: { count: 316, bytes: 10691068, MB: 10.7, MiB: 10.2 }
node_modules: 62M
lockfile package entries: 316
```

**Caveat on the measurement:** it was performed on Node v22.22.2, which is *just below* Angular 22's `^22.22.3` floor. npm emitted `EBADENGINE` warnings and installed anyway. This affects **nothing about the byte counts or the resolved versions** — resolution is engine-independent — but it is a live demonstration of the B2/B3 gate: a Node one patch version too old is already outside the supported range.

---

# Appendix B — Legacy Island hop matrix (verified 2026-08-25)

Every hop's Angular version, Node requirement and TypeScript peer range, read from the registry. This is the controlling reference for the per-hop bundle stories ([S-07](https://github.com/gstookey/rr/issues/14) .. [S-11](https://github.com/gstookey/rr/issues/18)).

**Legacy Island runs Node 22.15** (Graham, 2026-08-26). The last column is the consequence.

| Hop target | `@angular/core` | `@angular/cli` | Node requirement | TypeScript peer | TS pin (highest in window) | Runs on Node 22.15? |
|---|---|---|---|---|---|---|
| v17 *(current)* | `17.3.12` | `17.3.17` | `^18.13.0 \|\| >=20.9.0` | `>=5.2 <5.5` | 5.4.x | ✅ |
| v18 | `18.2.14` | `18.2.21` | `^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0` | `>=5.4 <5.6` | `5.5.4` | ✅ |
| **v19 — floor** | `19.2.25` | `19.2.27` | `^18.19.1 \|\| ^20.11.1 \|\| >=22.0.0` | `>=5.5 <5.9` | `5.8.3` | ✅ |
| v20 | `20.3.29` | `20.3.34` | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | `>=5.8 <6.0` | `5.9.3` | ✅ |
| v21 | `21.2.21` | `21.2.21` | `^20.19.0 \|\| ^22.12.0 \|\| >=24.0.0` | `>=5.9 <6.1` | `6.0.3` | ✅ |
| **v22 — stretch** | `22.1.3` | `22.1.5` | `^22.22.3 \|\| ^24.15.0 \|\| >=26.0.0` | `>=6.0 <6.1` | `6.0.3` | ❌ needs ≥ 22.22.3 |

## What the last column means

1. **Milestone 1 (v19) requires no Node change on Legacy Island.** The Angular upgrade and the Node upgrade are **decoupled** — neither blocks the other.
2. **v20 and v21 also require no Node change** (22.15 satisfies `^22.12.0`).
3. **Only v22 requires a Node bump**, and only to `22.22.3+` **within the same major line** — the very patch bump security already argues for. There is no major-version Node migration anywhere in this plan.

This substantially weakens the earlier assumption that the island's Node was a plausible hard ceiling on the Angular target (DR-03). It does **not** close DR-03: these are *published requirements*, and what change control will actually permit remains unanswered (questionnaire B2/B3).

## Separately: the Node patch bump is worth doing on its own

Node 22.15.0 shipped **2025-04-22**; the current 22.x patch is **22.23.2** (2026-07-28) and the line is still LTS (*Jod*). Legacy Island is ~15 months and 8 patch releases behind, which is the Node half of the security driver. The bump needs no Angular work and is probably the cheapest risk reduction in the programme ([S-06](https://github.com/gstookey/rr/issues/13) to bundle, [S-13](https://github.com/gstookey/rr/issues/20) to apply). The 22 line's end-of-life date is **`UNVERIFIED`** — `nodejs.org/dist/schedule.json` was not reachable in-session.

## Correction from the v17→v18 rehearsal (2026-08-26)

The "TS pin (highest in window)" column is **the top of the accepted range, not what the hop requires**. Rehearsed on 2026-08-26: `ng update @angular/core@18 @angular/cli@18` **left TypeScript at `~5.4.2`** — Angular 18 accepts `>=5.4 <5.6`, and the v17-era 5.4.2 already satisfies it. The same is likely true of later hops: `ng update` moves TypeScript only when it must.

**Bundle consequence:** carrying the existing TypeScript may be sufficient for a hop. Do not assume the top-of-window version is required, and do not omit the existing one on the assumption it will be replaced. Full detail: [`ng-hop-01` packet](../ng-hop-01-v17-to-v18-design-packet/README.md).

**Also found, and not visible in this table:** `ng update` downloads a **temporary newer CLI** before it does anything, so the registry must serve the *next* major's CLI before the app declares it; and Karma needs a **browser binary**, which is not an npm package and will not be in any tarball bundle.

## Bundle-scope consequence

**Each hop needs its own toolchain present in the island's registry before that hop is attempted** — including the intermediates, not only the destination. Five hop bundles are on the board for exactly this reason. The TS pin column matters as much as the Angular one: a hop bundle carrying the wrong TypeScript is as broken as one missing Angular entirely.

The ~89 MB measured for the Desert Island stack is **not** a per-hop estimate. Each hop bundle's real size is unmeasured (`UNVERIFIED`) and must be measured the same way before packing — the per-hop transitive sets differ, and older Angular versions drag different dependency trees.

## Verification transcript

```
$ npm view @angular/core@17.3.12 engines
{ node: '^18.13.0 || >=20.9.0' }
$ npm view @angular/compiler-cli@17.3.12 peerDependencies
{ typescript: '>=5.2 <5.5', '@angular/compiler': '17.3.12' }

$ npm view @angular/core@18.2.14 engines
{ node: '^18.19.1 || ^20.11.1 || >=22.0.0' }
$ npm view @angular/compiler-cli@18.2.14 peerDependencies
{ typescript: '>=5.4 <5.6', '@angular/compiler': '18.2.14' }

$ npm view @angular/core@19.2.25 engines
{ node: '^18.19.1 || ^20.11.1 || >=22.0.0' }
$ npm view @angular/compiler-cli@19.2.25 peerDependencies
{ typescript: '>=5.5 <5.9', '@angular/compiler': '19.2.25' }

$ npm view @angular/core@20.3.29 engines
{ node: '^20.19.0 || ^22.12.0 || >=24.0.0' }
$ npm view @angular/compiler-cli@20.3.29 peerDependencies
{ typescript: '>=5.8 <6.0', '@angular/compiler': '20.3.29' }

$ npm view @angular/core@21.2.21 engines
{ node: '^20.19.0 || ^22.12.0 || >=24.0.0' }
$ npm view @angular/compiler-cli@21.2.21 peerDependencies
{ typescript: '>=5.9 <6.1', '@angular/compiler': '21.2.21' }

$ npm view 'typescript@>=5.4 <5.6' version   # -> highest: 5.5.4
$ npm view 'typescript@>=5.5 <5.9' version   # -> highest: 5.8.3
$ npm view 'typescript@>=5.8 <6.0' version   # -> highest: 5.9.3
$ npm view 'typescript@>=5.9 <6.1' version   # -> highest: 6.0.3

$ npm view @angular/core dist-tags      # (excerpt)
'v17-lts': '17.3.12', 'v18-lts': '18.2.14', 'v19-lts': '19.2.25',
'v20-lts': '20.3.29', 'v21-lts': '21.2.21', latest: '22.1.3'

$ npm view @angular/cli dist-tags       # (excerpt)
'v17-lts': '17.3.17', 'v18-lts': '18.2.21', 'v19-lts': '19.2.27',
'v20-lts': '20.3.34', 'v21-lts': '21.2.21', latest: '22.1.5'

$ curl -sS https://nodejs.org/dist/index.json   # (Node 22 line, excerpt)
v22.15.0  2025-04-22  lts=Jod
v22.15.1  2025-05-14  lts=Jod
v22.23.2  2026-07-28  lts=Jod   (current 22.x)
```

Raw upgrade guidance per hop already lives in `docs/angular-upgrade-docs/`.

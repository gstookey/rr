---
schema: corpus-doc/v1
status: exploratory
title: ACME-WORKSHOP-01 — S0 Foundation notes v0 (what was built, every pin, what is and is not verified, and the ACME lexicon card)
areas: [dev-environment, technology-stack, monorepo, frontend, backend]
related: ["docs/design/packets/acme-workshop-01-design-packet/README.md", "docs/design/packets/acme-workshop-01-design-packet/slice_decomposition_v0.md", "docs/design/packets/acme-workshop-01-design-packet/decision_register_v0.md", "docs/design/packets/acme-workshop-01-design-packet/domain_model_v0.md", "docs/design/packets/ddd-arch-01-design-packet/practical_picture_v0.md", "docs/context/canonical/technology_stack.md", "docs/context/governance/decisions/ADR-004-package-manager-npm.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md"]
updated: 2026-09-04
---

# S0 — Foundation notes

**Created:** 2026-09-04 | **Last updated:** 2026-09-04 | **Author:** Kepler (DevOps) | **Story:** [S-18 (#38)](https://github.com/gstookey/rr/issues/38) under [EP-06 (#37)](https://github.com/gstookey/rr/issues/37) | **Status:** `exploratory` — S0 delivered on branch `claude/acme-workshop-s0-foundation`; not merged (rule 15)

S0 built the **foundation only**: layout, pins, fences, gate, compose, realm, mock OIDC, seed, lexicon. No feature code, no Floors beyond the two stubs the fence needs, and a shell that renders one line. Everything named below either has a command that ran, or is explicitly listed under *Not verified here*.

---

## 1. What now exists

```
.nvmrc  .npmrc  package.json  package-lock.json      npm workspace root, Node pinned
tsconfig.base.json  tsconfig.json  angular.json      TS 6 base + @rr/* aliases, CLI projects
sheriff.config.ts  eslint.config.mjs                 THE FENCE and the lint that enforces it
apps/shell/                                          Angular 22.1, zoneless, one line
packages/common/                                     @rr/common — the published language
packages/{ui,auth,config,markings,windows,store-features}/   Angular library stubs
packages/{invent,command}-domain/                    two Floor domain stubs (no Angular)
packages/mock-oidc/                                  the CI-side OIDC stub (AW-D7)
services/gateway/                                    Express 5 skeleton + seed/ + config/
infra/docker-compose.yml                             Keycloak 26.7.3 + Postgres 18.6
infra/keycloak/realm-acme-workshop.json              realm as code (AW-D8)
infra/postgres/init/001-acme-schema.sql              RLS on the first table, not retrofitted
scripts/local-ci.sh  prove-fence.sh  seed.mjs  check-infra.mjs  gen-seed.py  gen-realm.py
```

`legacy-shells/` was not touched and is **not** part of the workspace (the `workspaces` globs are `apps/*`, `packages/*`, `services/*` only).

---

## 2. Every pin, and the date it was published

All versions were read from `registry.npmjs.org` on **2026-09-04** with `npm view <pkg> version` and `npm view <pkg> time`.

| Package | Pinned | Published | Why this one |
|---|---|---|---|
| `@angular/core` · `common` · `compiler` · `compiler-cli` · `forms` · `platform-browser` · `router` | **22.1.5** | 2026-09-03 | latest 22.1.x — the currency contract's target major |
| `@angular/cli` · `@angular/build` | **22.1.7** | 2026-09-02 | latest; `@angular/build` hosts both `application` and `ng-packagr` builders |
| `@angular/cdk` | **22.1.5** | 2026-09-02 | matched to core |
| `@ngrx/signals` | **22.0.0** | 2026-08-24 | peers `@angular/core ^22.0.0` |
| `typescript` | **6.0.3** | 2026-04-16 | latest **6.0.x**. Registry `latest` is 7.0.2; the stack deliberately lags (technology_stack.md, R1 §7) and `@angular/build@22.1.7` peers `typescript >=6.0 <6.1` — 7.x would be refused |
| `vitest` | **4.0.18** | 2026-01-22 | **not 4.1.x — see §5, deviation 1.** Satisfies `@angular/build`'s peer `vitest ^4.0.8` |
| `jsdom` | **28.1.0** | (28.x line) | what `ng new` generates on 22.1.7 (`^28.0.0`); latest is 30.0.1, deliberately not taken |
| `@softarc/sheriff-core` · `@softarc/eslint-plugin-sheriff` | **0.19.6** | 2025-09-22 | latest; the module fence (DA-D13) |
| `eslint` | **9.39.5** | 2026-07-10 | **not 10.x — see §5, deviation 2** |
| `@eslint/js` | **9.39.5** | 2026-07-10 | matched to eslint |
| `typescript-eslint` | **8.69.0** | 2026-08-31 | peers `eslint ^8.57 \|\| ^9 \|\| ^10`, `typescript >=4.8.4 <6.1` |
| `angular-eslint` | **22.2.0** | 2026-08-30 | Angular template + component rules |
| `zod` | **4.5.4** | 2026-08-29 | published language + `z.toJSONSchema()` later (DA-D14) |
| `express` | **5.2.1** | 2025-12-01 | the BFF (DA-D17) |
| `jose` | **6.2.11** | 2026-09-04 | JWT signing/verifying in the OIDC stub |
| `ng-packagr` | **22.1.1** | 2026-08-04 | Angular library builds |
| `tsx` | **4.23.13** | 2026-08-30 | `npm start` for the Node services without a build step |
| `supertest` / `@types/supertest` | **7.2.2 / 7.2.1** | — | HTTP assertions in the gateway and stub tests |
| `@types/node` | **26.4.1** | 2026-09-01 | |
| `rxjs` / `tslib` | **7.8.2 / 2.8.1** | — | Angular peers |
| **Node** | **22.23.2** | — | Angular 22's floor is `^22.22.3 \|\| ^24.15.0 \|\| >=26`; 22.23.2 is the version the whole v17→v22 ladder was rehearsed on (CURRENT_STATE) |
| **npm** | **10.9.8** | — | whatever ships with that Node — deliberately not upgraded (ADR-004: "npm, bundled with Node") |
| `postgres` image | **18.6** | 2026-08-26 | latest 18.x on Docker Hub |
| `quay.io/keycloak/keycloak` image | **26.7.3** | 2026-08-31 | latest **26.7.x** per Maven Central's `org.keycloak:keycloak-core` metadata — **quay.io is egress-blocked from the authoring environment, so the image tag itself was not confirmed against the registry** |

`.npmrc` sets `save-exact=true`, so every future `npm install <pkg>` pins exactly rather than adding a caret.

### Node pin: `.nvmrc` exact, `engines` a floor — and why they differ

- `.nvmrc` → `22.23.2` (**exact**). Everyone who runs `nvm use` lands on the rehearsed version. No thinking required.
- `package.json#engines.node` → `>=22.23.2 <23` (**a floor inside the 22 line**), with `.npmrc`'s `engine-strict=true` making it a hard failure rather than a warning.

An exact `engines` pin would hard-fail an island workstation that had taken a 22.23.3 **security** patch — turning a good decision into a broken install, at the one place where nobody can ask us why. A floor keeps Angular 22's real constraint enforced while leaving patch headroom, and `.nvmrc` still steers everyone to the proven version by default.

---

## 3. How to run it

```bash
nvm use                       # reads .nvmrc -> Node 22.23.2 (install it if absent)
npm ci                        # the reproducible install; needs the committed root lockfile
bash scripts/local-ci.sh      # THE GATE — 14 steps, ~1 min, per-step PASS/FAIL table

npm start                     # ng serve shell        -> http://localhost:4200
npm run build                 # ng build shell
npm run test --workspaces     # vitest across the plain packages/services
npx ng test shell             # the Angular unit-test builder (Vitest under the hood)

npm start -w @rr/gateway      # the BFF skeleton      -> http://localhost:3000/healthz
npm start -w @rr/mock-oidc    # the CI-side OIDC stub -> http://localhost:9100

docker compose -f infra/docker-compose.yml up      # NOT RUN HERE — see §4
#   Keycloak  http://localhost:8080   admin / admin
#   Postgres  localhost:5432          acme / acme / db "acme"
#   personas: ada bram cy dee eli fay gus — password "changeme"
```

Capture the gate's exit code **directly** (`bash scripts/local-ci.sh > /tmp/ci.log 2>&1` then `echo "EXIT=$?"` on its own line); piping or chaining masks it.

---

## 4. What is verified by running, and what is not

### Verified by a command that ran (2026-09-04, Node 22.23.2 / npm 10.9.8)

| Claim | Evidence |
|---|---|
| The whole gate is green | `bash scripts/local-ci.sh` → **EXIT=0**, 14/14 PASS, ~56 s |
| The gate actually fails when something breaks | one deliberate type error in `@rr/common` → **EXIT=1**, 4 gates red, the table naming which |
| **The fence rejects a cross-Floor import** (S0's acceptance criterion) | `bash scripts/prove-fence.sh` → `module /packages/invent-domain/src cannot access /packages/command-domain/src. Tag scope:invent has no clearance for tags type:domain, scope:command` |
| The fence rejects `ui → data-access` too | hand-probed the same way: `Tag type:ui has no clearance for tags type:data-access, scope:platform` |
| The fence still **accepts** the repo afterwards | second half of `prove-fence.sh`: restores the tree and re-lints clean |
| The shell builds and renders its line | `ng build shell` → 190.83 kB initial; `ng test shell` → 2/2 |
| Zoneless is real, not asserted | `ng new --zoneless` on 22.1.7 emits **no** `provideZonelessChangeDetection()` and **no** zone.js — it is the v22 default. There is no zone.js anywhere in the lockfile |
| Every Angular library packages | `ng build <lib>` × 6 through ng-packagr |
| Every package typechecks | `npm run typecheck --workspaces` over 11 packages |
| Node services build and run | `tsc` build of `@rr/gateway` and `@rr/mock-oidc`; 11 tests green |
| `@rr/common` resolves BOTH ways | browser: the shell's spec imports `@rr/ui` through the path alias · Node: `node -e "import('@rr/common')"` resolved through the workspace symlink to `dist` |
| The OIDC stub issues a verifiable token with the Keycloak claim shape | `provider.spec.ts`: authorize → token → `jwtVerify` against its own JWKS; Fay's token carries `groups: ['/ttw/nwl']`, `handling_level: 'PARTNER'`, `compartments: ['TTW/NWL']` |
| The stub and the realm have not drifted | `realm-parity.spec.ts`: 7 personas, 3 mappers, the user-profile declaration and the confidential client, all compared field by field |
| The seed validates — and the validator is not a no-op | `node scripts/seed.mjs` → 137 marked rows OK; with one level changed to `TOP-SECRET` it fails and names the row |
| Realm + compose parse and are pinned | `node scripts/check-infra.mjs` |
| The compose file is valid **against the Compose spec** — not merely valid YAML | `docker compose -f infra/docker-compose.yml config` → **EXIT=0**. This command validates without a daemon, so it *is* available here; `check-infra.mjs` now runs it opportunistically and says "skipped" out loud when the CLI is absent |
| The docs corpus is intact | `node scripts/corpus-graph.mjs check` → OK |

### NOT verified here (rule 11)

| Thing | Why | Who verifies it |
|---|---|---|
| `docker compose up` | **No Docker daemon in the authoring environment** — the CLI (29.3.1) and the compose plugin (v5.1.1) are installed, but `docker info` reports `dial unix /var/run/docker.sock: no such file or directory`. So the file is spec-valid and nothing has ever been *started* from it. | Graham, first run |
| The **Keycloak realm import** | same. The realm's export *shape* was checked field-by-field against the Keycloak project's own `testsuite/.../testrealm.json` on the `release/26.7` branch, and the three protocol-mapper provider IDs and the user-profile config key were read from 26.7 source — but Keycloak has never been asked to accept this file | Graham, first run |
| The **`quay.io/keycloak/keycloak:26.7.3` tag exists** | quay.io is egress-blocked (`CONNECT tunnel failed, 403`). The version was confirmed as the latest 26.7.x from Maven Central's `org.keycloak:keycloak-core` metadata (`lastUpdated 2026-08-31`), which Keycloak publishes in lockstep with the image — an inference, not a check | Graham, first `docker compose pull` |
| The Keycloak **healthcheck** command | it is the community `/dev/tcp` recipe against the management port; the image carries no `curl`. Nothing in S0 gates on Keycloak's health, so the fallback is simply to delete the block | Graham, first run |
| `infra/postgres/init/001-acme-schema.sql` | never executed. Structural review only | Graham, first run (S2 exercises it properly) |
| **RLS behaviour** | the policy is written; no database has enforced it | S2, whose proof is exactly this |
| The shell in a **browser** | `ng build` and the unit-test builder ran; no browser was opened | Graham, `npm start` |
| Anything about the **island** | this is a laptop-shaped workspace; the island's constraints are unchanged and untested by S0 | later |

---

## 5. Deviations and fallbacks, with the exact errors

### Deviation 1 — Vitest is pinned **4.0.18**, not 4.1.x

The task asked for "the current major supported by `@angular/build`'s unit-test runner" (`vitest ^4.0.8`). The latest 4.x is 4.1.11, and it **cannot be installed** by the npm that ships with the pinned Node:

```
$ npm install vitest@4.1.11          # npm 10.9.8, Node 22.23.2
npm error Cannot read properties of null (reading 'edgesOut')
    at #loadPeerSet (…/@npmcli/arborist/lib/arborist/build-ideal-tree.js:1289:38)
```

Bisected: every `4.0.x` installs clean, every `4.1.x` crashes. The proximate cause is visible in the debug log — vitest 4.1.x declares an optional peer `@vitest/browser-playwright: 4.1.11`, and no `4.1.11` of that package exists on the registry (its only published version is `5.0.0`); arborist's peer-set walk dereferences the missing node. **It is an npm defect, not a vitest one:** npm **11.19.1** installs `vitest@4.1.11` without complaint (checked in a throwaway prefix).

Choice: **stay on the Node-bundled npm and pin vitest 4.0.18.** ADR-004 chose npm precisely because it is what the island team already has, bundled with Node; requiring a hand-upgraded npm adds a second runtime artifact to the transfer bundle and a step the island can forget. 4.0.18 satisfies the Angular peer and every suite is green on it. Revisit when the island's Node line ships npm 11.

### Deviation 2 — ESLint is pinned **9.39.5**, and that line is end-of-life

`@softarc/eslint-plugin-sheriff@0.19.6` (the newest release) declares `eslint: "^8.0.0 || ^9.0.0"`. ESLint 10 is current, so the install fails outright on eslint 10, and `npm install` prints:

```
npm warn deprecated eslint@9.39.5: This version is no longer supported.
```

**The fence's tool is choosing the linter major.** The alternative — forcing eslint 10 with an `overrides` block against the plugin's declared peer — buys currency by disabling the check that would tell us when it breaks. Taken as a **known, surfaced tension** rather than papered over; see §8.

### Deviation 3 — two forced TypeScript 6 tsconfig edits (both predicted)

Exactly the two classes the 21→22 ladder rung recorded (`monorepo_hop_procedure_v2.md`), hit within the first build:

1. `moduleResolution: "node"` is a hard failure on TS 6 (TS5107) → `tsconfig.base.json` uses `"bundler"`.
2. **`baseUrl` is now an error, not a warning:**
   ```
   TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0.
   Specify compilerOption '"ignoreDeprecations": "6.0"' to silence this error.
   ```
   Removed rather than silenced; `paths` entries are resolved relative to `tsconfig.base.json` itself. **Every island app that still carries `baseUrl` will hit this on its 21→22 rung** — worth adding to the field hop procedure.

### Deviation 4 — the roster is **seven** personas, not eight

The dispatch asked for "the eight personas from `domain_model_v0.md`" and then named seven (Ada, Bram, Cy, Dee, Eli, Fay, Gus). `domain_model_v0.md` lists exactly those seven. Docs are doctrine (rule 16), so **seven** were built. If an eighth was intended — the obvious gap is a second Northwind persona, so that Fay is not the only B2B subject and "one user's view" cannot be confused with "the B2B view" — say so and it is a one-line change in two files.

### Deviation 5 — `@rr/common` and `@rr/mock-oidc` are tagged `type:util`

The dispatch fixed the tag vocabulary, which has no `type:common`. `type:util` fits the R7 rule that both import nothing internal, and every rule in the fence behaves correctly under it. The residual looseness: `type:util → type:util` means `@rr/common` *could* import `@rr/mock-oidc` without the fence objecting. Nothing does, and nothing should. The clean fix is a `type:common` tag with `noDependencies`; it needs a vocabulary decision, so it is listed in §8 rather than taken unilaterally.

### Deviation 6 — the gateway's build config clears `paths`

`services/gateway` and `packages/mock-oidc` emit real JS with `tsc` under `module: nodenext`, so their **build** tsconfig sets `"paths": {}` and resolves `@rr/*` through the workspace symlink — compile-time and runtime resolution then agree, which is what a Node service needs. Their **typecheck** tsconfig keeps the aliases, so Sheriff still walks their imports. Neither imports an `@rr/*` package in S0, so nothing is currently at stake; note it before S1 wires `@rr/common` into the gateway.

### Not a deviation, but worth recording

- `ng new --zoneless` on 22.1.7 emits **nothing at all** for zonelessness — no provider, no polyfill, no dependency. It is the default. The `provideZoneChangeDetection` line the source-document blueprint carries is not merely optional now, it has no counterpart to delete.
- `.gitignore` previously ignored `/package-lock.json` (correct while the repo held no code). The **root lockfile is now committed** — `npm ci` is the gate's first step and the island's only reproducible install.
- The generated `.prettierrc` was dropped rather than carried: no formatter is wired into the gate, and a config file for a tool nobody runs is a small lie.

---

## 6. The ACME lexicon card v0

The tiers, and the traps. Pinned here because the expensive failures in this build will be the ones where two people mean different things by the same word — *playbook* in the other house cost a refactor.

### The tiers

| Tier | Word | Means, in ACME | Never means |
|---|---|---|---|
| L1 | **Building** | ACME Workshop itself — shell, lobby, session, the `@rr/*` base | a deployment, a container, a repo |
| L2 | **Floor** | one **bounded context**, lazy-loaded behind `CanMatch`: Invent · Command · Vigilance · Front Desk | a layer, a tier, a page |
| L3 | **Suite** | a feature library inside a Floor (Catalog, Devices, Campaigns, Fleet…) | a test suite |
| L4 | **Office** | a tool: a route leaf, or a surface in a utility window | a physical place, a component |
| — | **Elevator** | the navigation affordance between Floors | the router |
| — | **Lobby** | the claims-driven landing surface that shows you your Floors | a dashboard |

### The traps (same word, two meanings — say the qualified one)

| Word | Meaning A | Meaning B | Rule |
|---|---|---|---|
| **command** | **Command** (capital C) = the Device Tasking Floor | *command* (lowercase) = a CQRS write message | and the payload a Campaign delivers to a device is an **instruction** — never a "command" |
| **device** | a **product** = a device *model* | a **device** = a serialised *unit* | say "product" for the model. Always |
| **update** | a **software update** pushed to a device | editing a record | never say "update" bare in Invent |
| **activate** | activating a paid **feature** on a device | bringing a device into service | *activate* applies to features; a device is **provisioned** then **in-service** |
| **customer** | a **manufacturer** = ACME's tenant | that manufacturer's **B2B customer** (Northwind) | say "manufacturer" or "B2B operator". Never bare "customer" |
| **status** | — | — | Vigilance reports a device's **health**. "Status" stays a generic English word and names nothing |
| **group** | an organisational unit | a compartment on the data | in ACME they are the same thing **by construction** (AW-D9) — which is a decision, not a fact, and the real programme may rule otherwise |
| **class** | **device class** = wearable / fitness / … | a TypeScript class | device class is **data**, never an enum — that is Boundary-Test rung 1 |

### Marking vocabulary (all invented)

`OPEN < PARTNER < INTERNAL < RESTRICTED`, plus compartments `TTW`, `MER`, and the B2B sub-compartment `TTW/NWL`. Banner form: `INTERNAL//TTW, TTW/NWL` — compartments joined with `, ` and **not** `/`, because a sub-compartment already contains a `/`.

A subject sees a row when its level dominates the row's **and** its compartment set contains the row's. That rule is written three times on purpose — `@rr/common`'s `dominates()` (the meaning), `infra/postgres/init/…sql` (the enforcement), and the seed validator (the data) — and each is tested.

---

## 7. Fence, in one table

Tags are **ANDed**: a module must satisfy the rule for *every* tag it carries. That is what lets one flat table carry two independent axes.

| Tag | May import |
|---|---|
| `type:app` | `feature` · `ui` · `data-access` · `domain` · `util` — **`type:app` appears in no rule's value, so nothing imports the shell or the gateway** |
| `type:feature` | `feature` · `ui` · `data-access` · `domain` · `util` |
| `type:ui` | `ui` · `domain` · `util` — **never `data-access`, never `feature`** |
| `type:data-access` | `data-access` · `domain` · `util` |
| `type:domain` | `domain` · `util` — no Angular, ever |
| `type:util` | `util` |
| `scope:platform` | `scope:platform` — **the base never reaches into a Floor** |
| `scope:invent` · `scope:command` · `scope:vigilance` · `scope:front-desk` | itself · `scope:platform` |
| `noTag` | **nothing** — an untagged module is a fence hole and fails loudly |

Floor libraries are matched by **placeholder patterns** (`packages/<scope>-domain/src`, `…-data-access`, `…-ui`, `…-feature-<suite>`), so an S2–S7 library is fenced the moment it exists rather than the moment someone remembers to edit the config.

---

## 8. Open questions for Axium / Graham

1. **ESLint 9 is end-of-life** and the fence is why (deviation 2). Options: wait for a Sheriff release with an `eslint ^10` peer · force 10 with an `overrides` block · swap the fence for `dependency-cruiser` (the DA-D13 fallback). Not urgent; it is a supply-chain clock, and worth raising with the island's allow-list question.
2. **Seven personas or eight?** (deviation 4.)
3. **A `type:common` tag** for the published language, so `@rr/common` provably imports nothing (deviation 5). Needs a one-word vocabulary decision.
4. **Node `engines`: floor or exact?** §2 argues the floor. If ADR-005 is read at its strictest (exact parity, everything), this becomes an exact pin — which is an ADR-005 consequence, not a build decision.
5. **AstroUXDS is not wired**, by design (S1, after Cadence's mockup pass). Its availability on the island is still an open supply-chain question.
6. The **`docker compose` stack is unrun**. The first person to run it should record what happened here, in this file.

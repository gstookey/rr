---
schema: corpus-doc/v1
status: exploratory
title: ACME-WORKSHOP-01 — S1 "The Building" notes v0 (what was built, the seams it makes visible, and what is not verified)
areas: [frontend, backend, identity, access-control, system-architecture]
related: ["docs/design/packets/acme-workshop-01-design-packet/README.md", "docs/design/packets/acme-workshop-01-design-packet/decision_register_v0.md", "docs/design/packets/acme-workshop-01-design-packet/slice_decomposition_v0.md", "docs/design/packets/acme-workshop-01-design-packet/domain_model_v0.md", "docs/design/packets/acme-workshop-01-design-packet/s0_foundation_notes_v0.md", "docs/design/packets/acme-workshop-01-design-packet/mockups/s1-building/README.md", "docs/design/packets/acme-workshop-01-design-packet/mockups/s1-building/tokens.md", "docs/design/packets/ddd-arch-01-design-packet/practical_picture_v0.md", "docs/context/platform/research/ddd_ui_ux_brief_v0.md", "docs/context/platform/research/identity_stores_brief_v0.md", "docs/context/platform/research/mac_stores_brief_v0.md", "docs/context/governance/decisions/ADR-007-acme-workshop-is-a-learning-instrument.md"]
updated: 2026-09-08
---

# S1 — The Building: implementation notes

**Created:** 2026-09-08 | **Author:** Marlow (Coder), dispatched by Axium | **Story:** [S-19 (#39)](https://github.com/gstookey/rr/issues/39) under [EP-06 (#37)](https://github.com/gstookey/rr/issues/37) | **Status:** `exploratory` — S1 delivered on branch `claude/acme-workshop-s1-building`; not merged (rule 15)

S1 built **the Building and no rooms**: a session, an identity, a per-group manifest, chrome rendered entirely from those, and four empty Floors behind claim-gated lazy boundaries. Per [ADR-007](../../../context/governance/decisions/ADR-007-acme-workshop-is-a-learning-instrument.md) the output is *understanding*, so this slice optimised for **legibility over hardening**: comments explain the seams, not the syntax, and every file that holds a boundary says why the boundary is there.

**Doctrine consulted (rule 17)** is at the end of this document.

---

## 1. What now exists

```
services/gateway/
  config/manifest.json                THE TAILORING SURFACE — one Floor catalog + a per-group SELECTION
  src/app.ts                          composition only
  src/session/session.ts              express-session + connect-pg-simple; the BFF/cookie seam
  src/auth/oidc.ts                    openid-client 6.x relying party; issuer is CONFIGURATION
  src/auth/subject.ts                 claims -> Me (group display name + Floor claims resolved server-side)
  src/auth/routes.ts                  GET /auth/login · GET /auth/callback · POST /auth/logout
  src/api/routes.ts                   GET /api/me · GET /api/config, both fail-closed
packages/common/src/
  errors.ts                           AW-D19: the three S1 codes as one union
  building.ts                         FloorEntry · MarkingVocabulary · AppConfig · Me
packages/ui/                          the ACME theme (--rr-* VALUES) + RrWordmark
packages/markings/                    RrMarkingBanner · RrMarkingChip · resolveMarking()
packages/auth/                        PermissionStore · canMatchFloor · canActivateSignedIn · provideIdentityHydration
packages/config/                      DomainConfigStore
packages/{invent,command,vigilance,front-desk}-feature-placeholder/
                                      four empty Floors — DEMOLISHED by S2/S6/S3/S7 respectively
apps/shell/src/app/
  app.routes.ts                       the route table: ids and structure only, no labels
  building/                           banner top+bottom · identity/acting-as · the four states
  lobby/                              the Floor directory at `/`, full width
  floor-layout/                       the elevator rail — on Floors only (AW-D23)
  sign-in/                            signed out · leaving · session ended / sign-in failed
  proxy.conf.json                     dev-server proxy, so the SPA and the BFF are ONE ORIGIN
```

## 2. The S1 proof, and where each half is tested

> *"Sign in as Ada → lobby shows Invent · Command · Vigilance · Front Desk; as Fay → Vigilance only; a banner renders from `/api/config`'s vocabulary; no token in the browser."* — `slice_decomposition_v0.md`, the S1 row

| Half of the proof | Where |
|---|---|
| The gateway **serves** two different Buildings from one code path | `services/gateway/src/building.spec.ts` — 12 specs driving the real authorization-code flow against `@rr/mock-oidc` |
| The shell **renders** those two Buildings from one compiled application | `apps/shell/src/app/building.spec.ts` — 12 specs through `RouterTestingHarness` |
| The primitives ship no vocabulary | `packages/markings/src/lib/*.spec.ts` — 10 specs |
| The guard is `CanMatch` and the store never decodes a token | `packages/auth/src/lib/permission-store.spec.ts` — 5 specs |
| The manifest is rendered as served and holds nothing on failure | `packages/config/src/lib/domain-config-store.spec.ts` — 3 specs |
| The Postgres session store is real | `services/gateway/src/session/session-store.spec.ts` — 2 specs, **opt-in** via `RR_TEST_DATABASE_URL` |

**Absence is asserted as absence.** Fay's Building is searched for the *strings* `Invent`, `Command`, `Front Desk` and their routes — in the served JSON and in the rendered DOM — and for the word `disabled`. A `[disabled]` affordance would satisfy a naive "Fay cannot click Invent" test and still tell her Invent exists.

**The absence specs were verified non-vacuous:** granting Fay the `invent` claim turns *"answers Fay's /invent with the Lobby"* red, and only that one — which is the correct blast radius, because the manifest and the claim are two independent mechanisms with two independent tests.

## 3. The seams a reader should look at first

1. **`services/gateway/src/session/session.ts`** — the `SessionData` interface is the entire statement of what the browser does not get. Tokens are fields on a server-side session; the cookie is an opaque id.
2. **`packages/auth/src/lib/floor-guards.ts`** — why `CanMatch` and not `CanActivate`, in six lines of code and fifteen of comment. `CanActivate` would fetch the chunk and *then* refuse: a leak with a polite error message.
3. **`services/gateway/config/manifest.json`** — a Floor catalog and a per-group selection. Adding a tenant is an entry in `groups`; it is not permitted to restate the Building. That constraint is what makes S4 possible.
4. **`packages/markings/src/lib/resolve-marking.ts`** — three outcomes, one of which is *"I cannot resolve this"*.
5. **`apps/shell/src/app/app.routes.ts`** — ids and structure only. Everything a person reads comes from `/api/config`.

## 4. Rulings implemented, and how

| Ruling | Implementation |
|---|---|
| **AW-D15** manifest shape, order meaningful | `FloorEntrySchema` requires all five fields; the gateway sorts by `order` once and the client renders as served. Front Desk `order: 90`; S0's front-desk-first order corrected |
| **AW-D16** Building-level marking | `AppConfig.marking` = the group's own marking, from `config/manifest.json`. Rendered in the banner; never derived from the subject's clearance |
| **AW-D17** `landingFloor` | optional field, served for `/ttw/nwl`. **Not yet consumed by the shell** — see §7 |
| **AW-D18** routes and endpoints | exactly as drawn; `/auth/*` are navigations and are not under `/api` |
| **AW-D19** typed error codes | `@rr/common/errors.ts`, three codes, parsed by both sides. The sign-in surface renders only codes the union mints |
| **AW-D20** group display name | resolved in `subject.ts` and returned on `/api/me`; no path→label map exists in the browser |
| **AW-D21** clearance chip truncation | `RrMarkingChip`: two compartments plus `+n`, full set in `title`, `white-space: nowrap` |
| **AW-D22** `--rr-*` token prefix | the vocabulary carries `colourToken: '--rr-marking-internal'`; `@rr/ui`'s theme supplies the value and keeps `--acme-*` as its internal brand vocabulary. A schema check rejects a raw colour in the vocabulary |
| **AW-D23** rail on Floors only | solved with route STRUCTURE (`FloorLayoutComponent` as a sibling layout of the Lobby), so no component asks the router where it is |
| **DA-D11** AstroUXDS behind the façade | **no Astro dependency added.** See §6 |

## 5. Deviations from the mockups, with reasons

1. **The breadcrumb is rendered by the Floor, not by the Building chrome.** Cadence drew `ACME Workshop / Invent` inside the content region. Putting it in the Building would have required the chrome to map a Floor id to a label — the exact "Floor list in the Building" the whole slice is arranged to prevent. The Floor knows its own **id**; the manifest knows its **name**; the placeholder composes the two. Visually identical to the mockup.
2. **The Building's error state is a component state, not a route.** The dispatch asked for "an error surface"; the mockup draws it inside the chrome with the identity bar intact ("Your session is valid, but…"). A route would have lost the identity bar, and with it the ability to sign out — which is the one action that state must offer.
3. **`RrMarkingChip` takes `level` + `compartments`, not a `Marking`.** A subject's clearance is a `SubjectClearance`, not a `Marking`; they are different value objects on purpose and the chip must never be mistaken for a banner.
4. **The bottom banner collapses below `max-width: 480px` / `max-height: 560px`.** Permitted by the S1 rulings' ambiguity note. The breakpoint is a guess and is flagged as such.
5. **Each Floor placeholder duplicates ~30 lines rather than sharing a base-library component.** A "this Floor arrives in S2" panel is study scaffolding, not a base primitive, and putting it in `@rr/ui` would have created something S2–S7 must remember to demolish from the base library. Each placeholder is self-contained and leaves with its Floor.

## 6. Engineering findings worth keeping

**The fence improved the design.** `mac_stores_brief_v0` §6 sketches a `MarkingVocabularyStore` *inside* `@rr/markings`, with its own `httpResource`. Sheriff forbids it: `packages/markings/src` is `type:ui`, and `type:ui` may not import `type:data-access`. So the vocabulary arrives as a signal `input()` and the renderer is pure with respect to its data — strictly better than the sketch, and the fence found it rather than a reviewer. **The brief's sketch should be read as intent, not as a blueprint.**

**`@rr/config` does not import `@rr/auth`.** §4.2a's sketch shows a store injecting the identity store to key its URL. Here that would have made `ng build config` depend on `dist/packages/auth` (see below), and the workspace typechecks before it builds libraries. The two stores stay independent and the shell composes them: it decides "signed out" from `/api/me` and never renders the config error in that case. **Cost, restated after review (Verin, 2026-09-08):** an earlier draft of this line claimed a signed-out visitor causes one unrendered 401 on `/api/config`. On inspection that request does not happen in the routed app — `DomainConfigStore` is injected only by `BuildingComponent`, `LobbyPage` and `FloorLayoutComponent`, all of which sit behind the blocking `canActivateSignedIn()` guard, and Angular does not construct a component whose `CanActivate` redirects. The 401 is an artifact of `building.spec.ts`'s `enter()` helper, which injects the store unconditionally before navigating. The real behaviour is better than the note described; the note was wrong, not the code.

**ng-packagr and the published language.** An Angular library's `rootDir` is its own `src`, so `@rr/common` must not resolve to SOURCE inside a lib build (TS6059). `markings`/`auth`/`config` now override that one path to `packages/common/dist/index.d.ts` — the same compile-time/runtime agreement the Node services make (S0 deviation 6). **This makes `local-ci.sh`'s ordering load-bearing**: "build `@rr/common`" must stay before "typecheck".

**Testing `httpResource` in zoneless TestBed, twice-learned:**
- `ApplicationRef.whenStable()` **deadlocks** — an in-flight `httpResource` keeps the application unstable by design, so awaiting stability before answering the request waits forever. Use `TestBed.tick()`.
- `HttpTestingController.flush()` is *not* a settled resource: delivery goes through the resource loader's promise, so a task-queue yield is needed before asserting. A test that omits it passes for the wrong reason on any "expected `false`" assertion.

**The initial bundle is 700 kB raw / 150 kB transfer, over the 500 kB warning budget** (the 1 MB error budget is not breached, and the build exits 0). The driver is Zod 4 in the initial chunk, because both root stores parse with the published language's schemas. That is doctrine (`ddd_ui_ux_brief_v0` §4.3) and §4.3 also names the fork: *"Running the schema in dev builds only, or on every response, is a Floor decision."* Recorded, not silently resolved — see §7.

## 7. Open questions for Axium / Graham

1. **`landingFloor` is served but not consumed.** AW-D17 says "honoured when present; the Lobby always exists". The Lobby exists; nothing yet opens the elevator on Fay's Vigilance, because doing so on sign-in return would need a redirect the mockups do not draw. Confirm the intended behaviour before S2 builds on it.
2. **Zod in the initial bundle vs the 500 kB budget.** Options: leave it (correct, over budget), parse in dev builds only (§4.3's fork), or raise the budget deliberately. **Raising the budget silently would be the wrong answer**, so nothing was changed.
3. **`dominates()` does not implement AW-D13's prefix subsumption.** The ruling log says AW-D13 "binds `packages/common` `dominates()`", but the current implementation is exact set membership: a subject holding `TTW` does **not** satisfy a row marked `TTW/NWL`. The register puts AW-D13 in S2/S3, and changing the predicate without its RLS counterpart would be half a change — so it was left alone and is surfaced here rather than fixed (rule 7).
4. **The bottom-banner breakpoint** (§5.4) is invented. `mac_stores_brief_v0` §6 says top and bottom of every screen; no doctrine says what a phone does.
5. **Sign-out relies on the provider's `end_session_endpoint`.** Back-channel logout (§4.1) is not implemented; a session ended in another application does not end here.
6. **Token refresh at the BFF is not implemented.** The session outlives the access token; nothing yet uses the access token, so nothing has noticed. It must land before S2's per-Floor routers call anything with it.

## 8. Verified by running · NOT verified here (rule 11)

### Verified (2026-09-08, Node 22.23.2 / npm 10.9.8)

| Claim | Evidence |
|---|---|
| The whole gate is green | `bash scripts/local-ci.sh` → **EXIT=0**, 14/14 PASS |
| The fence still rejects a cross-Floor import | `scripts/prove-fence.sh` inside the gate, plus a hand probe: `invent-feature-placeholder → command-feature-placeholder` → `Tag scope:invent has no clearance for tags type:feature, scope:command` |
| The new Floor libraries are fenced with **no fence-config change** | S0's auto-tag patterns matched them; `sheriff export` shows `scope:invent` etc. |
| The full OIDC flow works end to end | 12 gateway specs drive `/auth/login` → provider `/authorize` → `/auth/callback` → `/api/me` |
| **Sessions really are in Postgres** | `RR_TEST_DATABASE_URL=… npm run test -w @rr/gateway` against a **live PostgreSQL 16.13**: the `session` table is created, the row contains `accessToken`, the cookie does not |
| No token in any browser-visible surface | asserted on `set-cookie` (`HttpOnly`, `SameSite=Lax`, no JWT), on every `/api/*` body, and on the rendered DOM |
| The lazy Floor chunks are separate | `ng build shell` emits four `floor-placeholder` chunks |
| Every package builds and typechecks | `ng build` ×6 libs + shell; `tsc` ×2 services; `npm run typecheck --workspaces` over 15 packages |

### NOT verified here

| Thing | Why | Who verifies it |
|---|---|---|
| **Keycloak** — the real identity provider | no Docker daemon in this environment. Every proof ran against `@rr/mock-oidc`, whose claim shape the realm-parity spec pins field by field — but **Keycloak has never issued a token to this gateway** | Graham, first `docker compose up` |
| **PostgreSQL 18.6**, the pinned compose version | the session store was proven against locally-installed **PostgreSQL 16.13**. The `connect-pg-simple` schema is version-independent, but 18.6 itself was not run | Graham, first run |
| **The shell in a browser** | `ng build`, `ng test` and the dev proxy config are written and green; no browser was opened, no `ng serve` was run | Graham, `npm start` + `npm start -w @rr/gateway` |
| **The dev-server proxy** | `apps/shell/proxy.conf.json` is wired into `angular.json` but has never served a request | Graham, first `npm start` |
| **RP-initiated logout** | the mock provider advertises no `end_session_endpoint`, so that branch is written and untested | Graham, against Keycloak |
| **Any real screen against the mockups** | no visual comparison was made; the mockups were read as a specification and implemented from the markup | Cadence / Graham |
| Anything about **the island** | unchanged and untested by S1 | later |


9. **`FloorEntry.arrivesIn` is a sixth field beyond AW-D15's ruled shape.** The ruling names `{ id, label, route, blurb, order }`; the schema adds an optional `arrivesIn` carrying the slice a Floor's content lands in (`"S2"`, `"S3"`), which the placeholder Floors render. It is **study scaffolding, not a product field** — it exists so a reader of the running Building can see which rooms are deliberately empty and when they fill. Recorded here because it expands a ruled schema, and a later reader should not have to diff the schema against the register to discover it. It leaves with the placeholders.

## Two seams this slice leaves for later (recorded, not defects)

- **`@rr/ui` currently hosts `acme-theme.scss`.** The package is tagged `type:ui, scope:platform` — the unclassified base — and its components correctly reference only `--rr-*` slots (AW-D22 holds at the component level). But a *named tenant's* theme file living inside the package described as the unclassified base is a seam **S4** must address explicitly when a second tenant's theme has to coexist: move the theme out, or parameterise it. Not a leak today with one tenant; a design question the moment there are two. (Verin, 2026-09-08.)
- **`tsconfig.base.json` was reformatted wholesale** by the library-generation schematic (every existing `paths` entry re-wrapped, not only the four new ones). The diff content is correct; the churn is tooling noise, not a hidden change. Noted so a future `git blame` on that file is not misread.

## 9. How to run it

```bash
npm ci
bash scripts/local-ci.sh                     # THE GATE — 14 steps, ~2 min

npm start -w @rr/mock-oidc                   # the CI-side OIDC stub  -> :9100
OIDC_ISSUER=http://localhost:9100 npm start -w @rr/gateway   # the BFF -> :3000
npm start                                    # the shell -> :4200, proxying /api and /auth

# with Docker (NOT run here): Keycloak instead of the stub
docker compose -f infra/docker-compose.yml up
npm start -w @rr/gateway                     # default issuer is the Keycloak realm

# the Postgres session store, against a real database
RR_TEST_DATABASE_URL=postgres://acme:acme@127.0.0.1:5432/acme npm run test -w @rr/gateway
```

Personas: `ada bram cy dee eli fay gus` — password `changeme` in Keycloak; chosen by `?persona=` against the stub.

## Doctrine consulted (contract rule 17)

`AGENTS.md` · `agent_operating_contract.md` (rules 3, 6, 8, 11, 15, 17) · **ADR-007** (ACME is a learning instrument — *legibility outranks hardening*, the sentence this slice was written against) · the ACME packet README, `domain_model_v0.md` (personas, groups, the lexicon: **instruction** not command, **health** not status), `slice_decomposition_v0.md` (the S1 row), `decision_register_v0.md` (AW-D13/D14 and the whole AW-D15..D23 table) · **Cadence's S1 mockups** (`README.md` seam inventory + states, `shell-chrome.html`, `lobby.html`, `sign-in.html`, `tokens.md`) · `practical_picture_v0.md` §2 (the request sequence implemented here) and §3 (tailoring mechanics) · research corpus `README.md` **§Currency contract** (the 2026 idiom and the forbidden-idiom list) · `ddd_ui_ux_brief_v0.md` §4.2 (library taxonomy defined by what may be imported), §4.2a (the Floor store + `httpResource` sketch), §4.3 (published language, `parse`, and the dev-only-validation fork), §4.5 (`CanMatch` vs `CanActivate`; hide/disable/**absent**), §5.3 · `identity_stores_brief_v0.md` §4.1 (BCP 212, `openid-client`, cookie/session lifetimes) and §4.6 (`/api/me` → `PermissionStore`, hydrate in an app initializer) · `mac_stores_brief_v0.md` §6 (markings from a runtime vocabulary, the no-leak contract, the UI is never the enforcement point) · `V8-tier-information-architecture.md` (a group is not a tier) · `angular_frontend_engineering_policy.md` (HTML and styles in their own files) · **in code**: `sheriff.config.ts`, `scripts/local-ci.sh`, `scripts/prove-fence.sh`, `scripts/check-infra.mjs`, `packages/common/src/marking.ts`, `packages/mock-oidc/src/`, `services/gateway/` (S0), `infra/keycloak/realm-acme-workshop.json`, `infra/docker-compose.yml`, `apps/shell/src/app/` (S0), `s0_foundation_notes_v0.md`. Corpus-graph `lookup frontend` and `lookup identity` run before implementing.

**Claims:** this document declares no `claims:` frontmatter. The S1 regions and routes are claimed by Cadence's mockup design note, which owns them; an implementation note re-claiming the same resources would register as contention without adding an owner.

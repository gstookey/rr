---
schema: corpus-doc/v1
status: active
title: Architecture Research Corpus — DDD-ARCH-01 base briefs
areas: [research, system-architecture, domain-driven-design, frontend]
related: ["docs/context/platform/README.md", "docs/context/canonical/technology_stack.md", "docs/context/canonical/two_island_model.md"]
updated: 2026-09-03
---

# Architecture Research Corpus — DDD-ARCH-01 base briefs

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 (Axium; pass 2 landed; R8 architecture-quantum brief added from the first design dialog)

## Purpose

The base document corpus for the **Desert Island system architecture** design work (packet `ddd-arch-01`, `docs/design/packets/ddd-arch-01-design-packet/`). Each brief is a synthesized, source-cited reference on one topic, written so that Graham and the fleet can lean on it while designing a DDD-oriented system with a scalable, modular, secure Angular front end.

These are **reusable program concepts** (AGENTS.md's "reusable program concept" test), which is why they live under `platform/` rather than inside one packet. RR-specific implications are confined to each brief's "RR lens" section, and stay *design direction*, never implementation truth (operating-contract rule 8).

## Status of these briefs

`exploratory` until Graham has read them. **Pass 2 (2026-09-03, same day):** after Graham's review found dated front-end idioms, every brief was restated to the currency contract below and carries a "Modernization ledger" naming what changed and what was verified where. They are research syntheses produced by research agents under Axium's direction, on the open-internet side, with sources cited inline. They are **not doctrine**: a brief informs a decision register; it does not rule one. Anything marked `[UNVERIFIED]` was not confirmed against a primary source in-session. **Research conditions on 2026-09-03:** the session's web-search budget was exhausted early and the egress proxy blocked most primary-source hosts (NIST, DNI, DoD, Gartner, Fowler, Angular, Keycloak, Kafka, vendor sites); the agents fell back to GitHub source mirrors and the npm registry, which is why NIST 800-53 (via OSCAL), Keycloak `.adoc` docs, Angular and NgRx docs, OpenTDF, Accumulo/HBase source and package versions are verified while book wording, DoD/IC policy text and vendor claims are largely `[UNVERIFIED]`. A verification pass with search restored is a queued hygiene task, not a blocker.

## The briefs

| # | Brief | Topic | Feeds |
|---|---|---|---|
| R1 | [`ddd_domain_driven_design_brief_v0.md`](ddd_domain_driven_design_brief_v0.md) | Domain-Driven Design — strategic + tactical, context mapping, team alignment | the whole packet; the tier model |
| R2 | [`data_fabric_brief_v0.md`](data_fabric_brief_v0.md) | Data Fabric (and its relatives: data mesh, lakehouse) — what it is, where it fits beside DDD | backend/data layer direction |
| R3 | [`event_message_bus_brief_v0.md`](event_message_bus_brief_v0.md) | Event / message buses — Kafka and alternatives, event-driven architecture, air-gapped operation | integration backbone |
| R4 | [`identity_stores_brief_v0.md`](identity_stores_brief_v0.md) | Identity stores / directories / IdPs — Keycloak, LDAP/AD, PKI/CAC, OIDC/SAML, delegated administration, RBAC/ABAC/ReBAC | user management + group-admin delegation |
| R5 | [`mac_stores_brief_v0.md`](mac_stores_brief_v0.md) | Mandatory Access Control stores — label-based data stores, security markings, multi-level data | per-group data privilege model |
| R6 | [`cross_domain_solution_integration_brief_v0.md`](cross_domain_solution_integration_brief_v0.md) | Cross Domain Solution integration — CDS types, guards, marking standards, how applications integrate across domains | the unclassified-base / classified-tailoring split |
| R7 | [`ddd_ui_ux_brief_v0.md`](ddd_ui_ux_brief_v0.md) | UI/UX practice in relation to DDD — front-end bounded contexts, micro-frontends vs modular monolith, Angular library architecture, task-based UI, permission-aware UI | the Building / Floor / Suite / Office tier model |
| R8 | [`architecture_quantum_brief_v0.md`](architecture_quantum_brief_v0.md) | The **architecture quantum** (Ford / Richards, evolutionary-architecture school) and its exact relationship to the bounded context; granularity disintegrators/integrators; static vs dynamic coupling; fitness functions | the lexicon (Floor ≠ quantum); DA-D2 promotion rule; talking to colleagues who use the word |

## Brief template (binding for every brief in this folder)

1. Corpus frontmatter (`schema: corpus-doc/v1`, `status`, `title`, `areas` from `scripts/corpus-graph-areas.txt`, `related`, `updated`) + a **Created / Last updated / Author** line.
2. **TL;DR** — five to eight bullets a lead engineer can act on.
3. **Core concepts and vocabulary** — a glossary table; one meaning per word (the RR lexicon will be built from these).
4. **Canonical sources** — the books, standards, papers, and primary docs the field actually cites.
5. **How it is done in practice** — patterns, reference architectures, tooling, with named examples.
6. **Trade-offs, anti-patterns, failure modes.**
7. **RR lens** — implications for Desert Island: isolated network (offline install, no agent access), the intended stack (Angular 22 / NgRx SignalStore / AstroUXDS front end, Node + Express gateway, Kubernetes via Helm, npm workspaces), defense context, two-island stack synchronization, and — where relevant — the Building / Floor / Suite / Office front-end hierarchy.
8. **Open questions for Graham** — things only he or the island owners can answer.
9. **Sources** — full list with URLs.

Rules: cite every non-obvious claim; prefer primary sources; mark `[UNVERIFIED]` rather than guess; no vendor hype; keep the *concept* prose readable in one sitting (roughly 2,000–3,500 words); the dated idiom tables, code sketches, split source lists and the Modernization ledger are additional and are what pushed every brief past that figure in pass 2 — read TL;DR + RR lens first, the ledger last.

## Currency contract (binding — added 2026-09-03 after Graham's review of R7)

Graham's finding on the first pass: R7 described the front end in "smart / dumb component" terms and the corpus as a whole never mentioned zoneless change detection, `resource()` / `httpResource`, or Signal Forms — a 2019 Angular in a brief for an Angular 22 system. Concept sources may be old; **the idiom in which a concept is restated must be current.** Every brief obeys:

1. **Two clocks, stated separately.** A *concept* claim (bounded context, dominance lattice, outbox, guard) may cite its canonical source regardless of age. An *implementation-idiom* claim (how a component, store, route, guard, HTTP call, form, build, or deployment is written) must be verified against the primary documentation of the **target major as of the brief's date**, and cite it with a date. The target majors on 2026-09-03: `@angular/core` **22.1.x**, `@ngrx/signals` **22.0.x**, `@angular-architects/native-federation` **22.1.x**, `@softarc/sheriff-core` 0.19.x, Node 22 LTS / 24 LTS, TypeScript 6.0.x, Apache Kafka 4.x (KRaft), Keycloak 26.x. Re-read `canonical/technology_stack.md` and `two_island_model.md` §Stack synchronization: Desert Island's target may be re-pinned to whatever Legacy Island reaches (v19–v22), so an idiom that changed between v19 and v22 must say so.
2. **The 2026 Angular idiom is signal-first and zoneless.** Components use `input()`/`output()`/`model()`, `computed`, `linkedSignal`, `effect` sparingly, control flow `@if`/`@for`/`@defer`, standalone by default, `OnPush` (the v22 default). Async data arrives through `resource()` / `httpResource` / `rxResource` (stable in v22) or a SignalStore, not through component-owned RxJS subscriptions. Forms: Signal Forms (stable in v22) for new non-trivial forms; note the v19–v21 status honestly. Routing: functional `CanMatch`/`CanActivate` guards, `loadChildren`/`loadComponent`, route-level `providers`. State: NgRx **SignalStore** (`signalStore`, `withState`, `withComputed`, `withMethods`, `withHooks`, `withEntities`, `withLinkedState`, `withProps`, `withFeature`, `patchState`, `rxMethod`, the Events plugin) — never `NgModule`s, `@Input()` decorators, Zone-driven change detection, `*ngIf`, `HttpClientModule`, Karma, or the smart/dumb (container/presentational) component split, which is superseded by signal inputs + stores + `resource`s.
3. **Forbidden-idiom list** (a brief that uses one of these as a recommendation fails review): smart/dumb or container/presentational components as an architectural principle · NgModules · Zone.js as a design assumption · RxJS-first component state · `@Input`/`@Output` decorators · structural-directive control flow · `ngOnChanges` as the reactive primitive · Karma/Jasmine · "Angular Universal" by that name · Confluent-only Kafka assumptions · ZooKeeper · Keycloak < 26 admin models · "OAuth implicit flow" · "tokens in localStorage".
4. **Every brief carries a "Modernization ledger" section** after the Sources: what pass 2 changed, what it verified against which primary doc (URL + date), and what it left in place because the concept is version-independent.
5. **Verification order:** primary docs (the `angular/angular` repo's `adev/src/content/**` and `ngrx/platform` docs are reachable via `raw.githubusercontent.com` even when the doc sites are egress-blocked; `registry.npmjs.org` for versions) → release notes / official blogs → community secondary sources, which may be cited only for "what people do", never for API facts.

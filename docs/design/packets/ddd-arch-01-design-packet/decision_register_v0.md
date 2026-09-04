---
schema: corpus-doc/v1
status: exploratory
title: DDD-ARCH-01 — Decision Register v0 (DA-D1..DA-D10)
areas: [system-architecture, domain-driven-design, frontend, planning]
related: ["docs/design/packets/ddd-arch-01-design-packet/README.md", "docs/design/packets/ddd-arch-01-design-packet/tier_model_exploration_v0.md", "docs/design/packets/iso-net-readiness-01-design-packet/decision_register_v0.md", "docs/context/governance/contradictions/register.md"]
updated: 2026-09-03
---

# DDD-ARCH-01 — Decision Register v0

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 | **Author:** Axium | **Status:** all forks **open** — nothing ruled

The ruling surface for the packet. Each fork lists the options, what decides it, Axium's lean (a lean is not a ruling), and which research brief informs it. Graham rules; rulings are recorded here with a date and echoed to `docs/context/log.md`. A fork whose evidence is still out says so rather than guessing.

Numbering: `DA-Dn`. Cross-references: `DR-nn` = `iso-net-readiness-01` register; `C-nnn` = contradiction register; `Rn` = research brief.

| # | Fork | Options | Decides it | Axium's lean (2026-09-03) | Informed by | Status |
|---|---|---|---|---|---|---|
| **DA-D1** | **What a Floor is.** Are L2 Floors organised by *user group / customer* or by *business capability (bounded context)*? | **A** capability-aligned (a Floor is minted by a bounded context; groups get *access* + *tailoring*) · **B** group-aligned (a Floor per customer/team) · **C** hybrid: capability Floors plus a group "lobby" that composes them | whether groups share capabilities (they almost always do) and whether any group has a genuinely separate domain | **A**, with the C lobby as the L1 shell's job. See `tier_model_exploration_v0.md` §3. | R1, R7 | open |
| **DA-D2** | **Front-end composition strategy.** How Floors are built and deployed. | **A** one shell SPA + lazy feature libraries per Floor (modular-monolith front end) · **B** micro-frontends via Native/Module Federation, one remote per Floor · **C** one Angular *app per Floor* under a path prefix, sharing build-time libraries and a shell library; full navigation between Floors | team count and release cadence per Floor; isolated-network cost of a federation runtime; how much cross-Floor shared state exists | **A** — one app, Floors as lazy lint-fenced library sets behind `CanMatch`, promotable to B/C. *Revised 2026-09-03 after R7: the morning lean was C; R7's evidence (the fence makes promotion a build change; C multiplies what the island mirrors) reversed it — recorded, not averaged. `tier_model_exploration_v0.md` §5.* | R7 | open — R7 in |
| **DA-D3** | **Tenant / group addressing.** Does the group appear in the URL? | **A** group is a claim; URL is `/floor/suite/office` · **B** group is a path segment `/g/{group}/floor/...` · **C** A by default, B only for multi-group users via an explicit switcher | whether a user can belong to several groups at once; deep-link needs; per-domain deployments (R6) | **A** unless multi-group membership is real; then **C** | R4, R6, R7 | open |
| **DA-D4** | **Repo topology.** | **A** one monorepo: `apps/*` (shell + Floors) + `packages/*` (base libraries) · **B** one repo per Floor, base library published to the island registry (Nexus) · **C** A now, B when a second team exists | team count; Nexus maturity on Desert Island (DR-01); C-001's layout half (DR-05) | **A** — and this packet strengthens the `apps/*`+`packages/*` lean in C-001 | R7, DR-05 | open |
| **DA-D5** | **Identity substrate.** | **A** Keycloak (present in the legacy estate — `keycloak-angular` in both legacy apps' package.json), federated to the island directory · **B** directory-only (LDAP/AD) with app-side sessions · **C** something else the island mandates | what Legacy Island's cluster already runs; CAC/PKI requirements; who owns the IdP | **A**, pending island answers | R4 | open — needs island questionnaire |
| **DA-D6** | **Authorization model for "each group has unique data privileges."** | **A** RBAC on groups, enforced at BFF + database RLS · **B** ABAC/labels (MAC-style) with a policy engine (OPA/Cedar) · **C** ReBAC (Zanzibar-style) · **D** A now, B when labels are a real requirement | whether data carries markings/labels; whether privileges are per-group or per-record | **D**, with the label model designed in from day one so B is a step, not a rewrite | R4, R5 | open |
| **DA-D7** | **Delegated group administration.** | **A** IdP-native (Keycloak fine-grained admin / Organizations) · **B** app-owned admin "office" calling the IdP's admin API · **C** SCIM from an upstream system | whether the IdP is ours to configure; audit requirements | **B** on top of **A**: the IdP holds the truth, the app owns the UX | R4 | open |
| **DA-D8** | **Diagram tooling.** | **A** Mermaid in Markdown (in-repo, GitHub-rendered) · **B** draw.io `.drawio.svg` (visio-esque, offline desktop editor) · **C** Structurizr DSL (C4 as code) · **D** A + B, C if the set outgrows hand-drawn | who edits on the island; GitHub rendering; offline editing | **D** — Mermaid first, draw.io for boards Graham will show people; see `diagramming_approach_v0.md` | — | open |
| **DA-D9** | **Backend contract shape for the front end.** | **A** BFF per Floor, published-language DTOs in `@rr/common` · **B** one gateway, per-context APIs, no BFF · **C** GraphQL federation | number of Floors and teams; read-model shape per screen | **A** | R1, R3, R7 | open |
| **DA-D11** | **`@rr/ui` as a façade over AstroUXDS.** R7 found the AstroUXDS repository README states the project is *not currently actively maintained* and its default install pulls its bundle and Roboto from public CDNs. | **A** wrap every Astro component behind `@rr/ui`, brand in tokens, vendor all assets · **B** consume Astro directly · **C** pick a different design system | whether a support arrangement with Rocket Communications exists; how much of Astro the legacy apps already use | **A** regardless — the façade is cheap and makes B/C reversible | R7 | open — needs Graham |
| **DA-D12** | **Boundary-enforcement tool.** | **A** Sheriff (zero-dep, works on plain npm workspaces) · **B** Nx `enforce-module-boundaries` (+ affected builds, generators; a bigger thing to mirror) · **C** `dependency-cruiser` / `eslint-plugin-boundaries` | ADR-004's "no Nx decided"; island mirroring cost; whether affected-graph builds matter at this scale | **A** now; revisit if Nx is adopted for other reasons | R1, R7 | open |
| **DA-D13** | **Sheriff** as the module-boundary fitness function (see also DA-D12) | A adopt · B dependency-cruiser · C Nx | island allow-list; Nx decision | **A** | practical picture §5 | open |
| **DA-D14** | **Zod 4 + `z.toJSONSchema()`** as published language and OpenAPI source | A adopt · B hand-written JSON Schema | — | **A** | practical picture §5, R1 §5.5 | open |
| **DA-D15** | **OpenFeature + flagd** for capability flags | A adopt · B flags inside `/api/config` | island allow-list; whether flags need runtime toggling at all | **A** if it rides the bundle, else B | practical picture §3, §5 | open |
| **DA-D16** | **PDP beside RLS:** OPA vs Cedar | A OPA · B Cedar · C RLS only for v1 | Node bindings; who writes policy on the island; R5 evidence | **C → A/B when a rule RLS cannot express appears**; design the seam now | R5, practical picture §4 | open |
| **DA-D17** | **BFF session substrate:** openid-client + Postgres session store | A adopt · B `keycloak-js` in the browser like the legacy apps | Q5 (legacy apps must look alike?) | **A** | R4, practical picture §2 | open |
| **DA-D18** | **XState 5** for process definitions as data (rung 2) | A adopt · B hand-written process managers | readability on the island; DR-class allow-list | lean A, unproven | practical picture §3 | open |
| **DA-D19** | **Typed SQL in the BFF:** Drizzle vs Kysely | A Drizzle (RLS policy support `[UNVERIFIED]`) · B Kysely · C raw `pg` | verify Drizzle RLS claims | lean A pending verification | practical picture §5 | open |
| **DA-D20** | **Storybook · Playwright · Context Mapper** | adopt each / not | Chromium binary on the island (B9); team appetite | Storybook + Playwright yes; Context Mapper if the map outgrows hand-drawing | practical picture §5 | open |
| **DA-D10** | **Where the utility-window system lives.** The TrAIdit UWS pattern as the L4 "office" host mechanism. | **A** base library `@rr/windows` in L1 · **B** per-Floor · **C** not adopted | whether Offices are hosted as windows, panels, or route leaves | **A**, because an Office that can be opened anywhere is what makes it a *tool* rather than a page | R7 | open |

## Questions harvested from the briefs (each brief's §8 has the full list)

The forks above cannot close on research alone. These are the island/program questions that decide them, deduplicated across R1..R7; the first four decide the most.

| # | Question | Decides | Source |
|---|---|---|---|
| Q1 | **What are the bounded contexts?** Which capabilities exist on day one; which are genuinely different languages rather than different screens over one model? Can a Big Picture EventStorming be run with the island's domain experts (on paper if needed)? | everything; the Floor list | R1, R7 |
| Q2 | Can a user hold **more than one group** at once? | DA-D3 | R4, R7 |
| Q3 | Is "group" a **compartment** (need-to-know tag on data) or an **organisation** (ownership/tenancy)? Is either island storing more than one classification level inside the system, or is each a system-high enclave? | DA-D6; how much of R5/R6 applies day one | R5, R6 |
| Q4 | Is any group separation a **build/deployment separation** (may not share an artefact), or purely data privilege? | DA-D2 promotion rule | R7, R6 |
| Q5 | Is there **one Keycloak realm** on the island today, which version, who administers it; is AD/LDAP the system of record for people; CAC/PIV with an in-cluster CA? | DA-D5, DA-D7 | R4 |
| Q6 | Which **marking vocabulary** governs (DoD/CUI banners, IC-ISM, coalition, local)? Can a public vocabulary schema be agreed so the base marking component is stable? | DA-D6; `@rr/markings` | R5, R6, R2 |
| Q7 | Is a **broker permitted** on the islands at all; does the shared cluster already run one (RabbitMQ is common in older estates); how many contexts produce events in release 1 and at what rate? | DA-D9; R3's "Postgres first vs Kafka" | R3, R1 |
| Q8 | Does RR **today** move data between security domains, or is unclassified-base / classified-tailoring purely deployment configuration? Is a CDS already accredited on either target cluster, and is there any return channel from high to low? | how much of R6 is design vs background | R6 |
| Q9 | **Who owns a Floor** — one stream-aligned team per Floor (UI + BFF + read models) or a front-end team spanning Floors? How many teams in year one? | DA-D2, DA-D4 | R7, R1 |
| Q10 | Is there an **AstroUXDS support arrangement**, or should `@rr/ui` be designed as a replaceable façade from day one? | DA-D11 | R7 |
| Q11 | Does Desert Island's cluster have **S3-compatible object storage**, and is any Legacy Island application already a de facto system of record whose data must be catalogued first? | R2's "small honest fabric" | R2 |
| Q12 | Who is the **lexicon owner** when two Floors want the same word for different things? | the Concordance role | R7 |

## Forks deferred until domain input exists

- **What the bounded contexts *are*.** Cannot be designed from research; needs the RR product purpose and an event-storming session with the island team (`[NEEDS GRAHAM]` in `project_overview.md`). The packet designs the *shape*; this fork fills it.
- **Whether any data on Desert Island carries security labels at all.** Decides how much of R5/R6 applies on day one. Route to the program's security authority.

## Ruling log

*(empty — nothing ruled)*

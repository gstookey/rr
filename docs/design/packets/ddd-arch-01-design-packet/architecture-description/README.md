---
schema: corpus-doc/v1
status: exploratory
title: ACME Workshop Architecture Description (AD) — ISO/IEC/IEEE 42010-structured, DDD-ARCH-01
areas: [system-architecture, domain-driven-design, frontend, backend, security, identity, access-control, cross-domain, messaging]
related: ["docs/design/packets/ddd-arch-01-design-packet/README.md", "docs/design/packets/ddd-arch-01-design-packet/decision_register_v0.md", "docs/design/packets/ddd-arch-01-design-packet/diagramming_approach_v0.md", "docs/design/packets/ddd-arch-01-design-packet/practical_picture_v0.md", "docs/design/packets/ddd-arch-01-design-packet/tier_model_exploration_v0.md", "docs/design/packets/ddd-arch-01-design-packet/context_boundary_test_v0.md", "docs/design/packets/acme-workshop-01-design-packet/README.md", "docs/design/packets/acme-workshop-01-design-packet/domain_model_v0.md", "docs/design/packets/acme-workshop-01-design-packet/decision_register_v0.md", "docs/design/packets/acme-workshop-01-design-packet/slice_decomposition_v0.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V1-system-context.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V2-container.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V3-context-map.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V4-runtime-dynamic.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V5-information-security.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V6-development-module.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V7-deployment-evolution.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V8-tier-information-architecture.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/diagrams-manifest.md", "docs/context/platform/research/architecture_quantum_brief_v0.md", "docs/context/canonical/two_island_model.md", "docs/context/canonical/technology_stack.md"]
updated: 2026-09-03
---

# ACME Workshop — Architecture Description

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 | **Author:** Trestle (Architect) under Axium | **Status:** `exploratory` — design direction, not implementation truth. Nothing described here is built (operating-contract rule 8).

---

## 1. AD identification and scope

| Field | Value |
|---|---|
| **Architecture description** | ACME Workshop Architecture Description, version 0.1 |
| **System of interest** | **ACME Workshop** — the fictional smart-watch-manufacturer hub that is the **reference instance** of the DDD-ARCH-01 architecture (`acme-workshop-01-design-packet`). |
| **Architecture of interest** | The DDD-ARCH-01 architecture for Desert Island: a Domain-Driven-Design, evolutionary-architecture-compliant system whose front end is Graham's to own as subject-matter expert. |
| **Environment** | A Kubernetes cluster on **Desert Island** (isolated, no internet, one-way bundle transfer, no agent access), shared with the **Legacy Island** application estate and stack-synchronised with it (ADR-005). |
| **Broader example system depicted** | Identity plane (Keycloak realm federated to a directory) · event bus (Postgres outbox first, Kafka/Strimzi later) · data fabric / catalog (optional) · a second security-domain deployment behind a cross-domain guard (conditional) · the Legacy Island estate · a device telemetry feed. |
| **Date / basis** | 2026-09-03, drawn from the DDD-ARCH-01 and ACME-WORKSHOP-01 packets and research briefs R1–R8. |
| **Status of every element** | `hypothesis` or `lean DA-Dn / AW-Dn`. **Nothing is ruled and nothing is implemented.** The only implementation truth in this arc is the docs corpus itself. |

**Out of scope.** Product purpose of the *real* Road Runner application (still `[NEEDS GRAHAM]`); the real programme's bounded contexts (they come from an EventStorming session, register **Q1**); any real marking, caveat, programme name, host, address or customer; operational procedures (see §8, KI-6).

**Fiction and marking discipline.** Everything in ACME Workshop is invented. The handling vocabulary used throughout is fictional — `OPEN < PARTNER < INTERNAL < RESTRICTED`, compartments `TTW` / `MER`, B2B sub-compartment `TTW/NWL`. This is what makes the whole AD portable across the fence.

---

## 2. How to read this AD

1. **Start with the concern, not the diagram.** §3 lists who cares about what; §4 says which view answers it. Reading all eight views in order is the wrong way round for everyone except a new architect.
2. **Two boundaries, never confused.** [V3](V3-context-map.md) draws **language** boundaries (bounded contexts). [V2](V2-container.md) and [V7](V7-deployment-evolution.md) draw **deployment and coupling** boundaries (quanta). They are orthogonal axes and this architecture deliberately has *four contexts inside one quantum*. Anyone who uses "quantum" and "bounded context" interchangeably will misread this AD.
3. **Dashed means undecided.** Every dashed element (or `[?]`-prefixed element in the C4 views) carries the fork or open-question id that governs it. A lean is not a ruling.
4. **The Elements table is the load-bearing part.** Every element on every diagram cites the doctrine sentence it comes from. Where the corpus is silent, the view's legend says "assumed for illustration" — treat those as the architect's reading, not doctrine.
5. **Correspondence rules (§6) are the consistency contract** between views. If a change breaks one, the AD is inconsistent and must be redrawn, not patched in one view.
6. **The forks (§7) are where the AD will change.** Each view's last section names the rulings that would force its redraw.

---

## 3. Stakeholders and their concerns

| Stakeholder | Who they are | Concerns | Views that frame them |
|---|---|---|---|
| **Graham — lead front-end engineer, architecture owner** | Owns the front end as SME; learning systems architecture; must defend this to leadership and to the island team | C1 scalable (add capability or customer easily) · C2 modular, no copy-paste · C3 where state lives · C4 lexicon discipline (one meaning per word) · C5 that a Floor stays promotable | V2, V3, V6, V8 |
| **Island development team** | The engineers who will build Floors on Desert Island, with no internet and no agents | C6 what may I import · C7 where does my code go · C8 what the request actually does · C9 what fails the build | V4, V6, V8, V2 |
| **Security / accreditation authority** | Signs off that data privileges hold | C10 where the enforcement points are and what each guarantees · C11 the label/marking model and dominance · C12 cross-domain path, if any · C13 that the UI enforces nothing | V5, V4, V7, V1 |
| **Platform operations** | Runs the cluster; owns the transfer bundle | C14 what runs where · C15 what must be mirrored/pinned · C16 what is dev-only · C17 blast radius of a failure | V7, V2, V1 |
| **Manufacturers as tenants** (persona: TTW, MER, and TTW's B2B customer NWL) | The customers the product serves | C18 I see only my data · C19 my workflow differs without a fork of the product · C20 my brand and vocabulary | V5, V8, V3 |
| **Programme leadership** | Funds and sequences the work | C21 is this scalable and secure · C22 what is decided vs open · C23 cost of onboarding a customer · C24 what would make release 1 bigger | V1, V7, V8, §7, §8 |
| **Legacy Island estate owners** | Own the 10+ applications ACME will share a cluster with | C25 coexistence · C26 stack synchronisation obligations | V1, V7 |
| **Lexicon owner** (register **Q12** — *unassigned*) | Rules when two Floors want the same word | C4, C27 same-word traps | V3, V8, §8 |

---

## 4. Viewpoint catalog

Each viewpoint below states the concerns it frames, the stakeholders it serves, the model kinds it uses, and its notation. The view conforming to it is linked.

| # | Viewpoint | Concerns framed | Stakeholders | Model kinds | Notation | View |
|---|---|---|---|---|---|---|
| **VP-1** | **Context** | C21, C12, C14, C25 | Leadership, security, ops, Legacy owners | System-context model; external-dependency model | C4 model level 1 (Brown), styled Mermaid `flowchart` (KI-9) | [V1 — System Context](V1-system-context.md) |
| **VP-2** | **Container** | C1, C5, C14, C15, C16, C9 | Graham, ops, island team | Container model; component-within-container model; quantum annotation | C4 model level 2 (Brown), styled Mermaid `flowchart` (KI-9) | [V2 — Container](V2-container.md) |
| **VP-3** | **Domain (DDD strategic)** | C4, C6, C21, C27 | Island team, Graham, lexicon owner, leadership | Context map; relationship-pattern model; core/supporting/generic classification | Evans context-map stereotypes in guillemets, Mermaid flowchart | [V3 — Context Map](V3-context-map.md) |
| **VP-4** | **Runtime / Dynamic** | C8, C10, C13, C17 | Island team, security, ops | Interaction (sequence) model; combined fragments | UML 2.5 sequence semantics, Mermaid `sequenceDiagram` | [V4 — Runtime](V4-runtime-dynamic.md) |
| **VP-5** | **Information & Security** | C10, C11, C13, C18, C20 | Security authority, tenants, Graham | Subject-construction pipeline; enforcement-point (PEP/PDP) model; label-and-dominance model; layer-guarantee table | Mermaid flowchart; NIST SP 800-207-style PEP/PDP placement as tabulated in R4/R5 | [V5 — Information & Security](V5-information-security.md) |
| **VP-6** | **Development / Module** | C2, C5, C6, C7, C9 | Island team, Graham, build | Module-dependency model (allowed edges only); package-taxonomy model; fitness-function binding | Mermaid flowchart with Sheriff `scope:` × `type:` tags | [V6 — Development](V6-development-module.md) |
| **VP-7** | **Deployment & Evolution** | C14, C15, C17, C12, C24, C26 | Ops, security, leadership, Legacy owners | UML deployment model; quantum ledger; granularity disintegrator/integrator model; fitness-function catalogue | **UML 2.5 deployment stereotypes** `«device»` / `«executionEnvironment»` / `«artifact»`, Mermaid flowchart | [V7 — Deployment & Evolution](V7-deployment-evolution.md) |
| **VP-8** | **Tier / Information Architecture** | C1, C3, C19, C20, C23, C4 | Graham, island team, tenants, leadership | IA hierarchy model; runtime-overlay model; variation-ladder model | Mermaid flowchart | [V8 — Tier / IA](V8-tier-information-architecture.md) |

**Viewpoint framework provenance.** VP-1/VP-2 are the C4 model's levels 1 and 2 (Simon Brown, `c4model.com`). VP-4 through VP-7 correspond to the **Rozanski & Woods** viewpoint set (*Software Systems Architecture*, 2nd edition, 2011: Context, Functional, Information, Concurrency, Development, Deployment, Operational) — Functional/Dynamic, Information, Development and Deployment respectively `[UNVERIFIED — the R&W viewpoint list is quoted from prior knowledge; the book was not fetched in-session]`. VP-3 and VP-8 have no R&W equivalent: VP-3 comes from Evans's strategic-design patterns and VP-8 from information-architecture practice plus this packet's own tier model.

**Viewpoints deliberately not provided** (declared, not overlooked — see §8):

- **Concurrency** — the asynchronous choreography content lives inside V4b (outbox, dispatcher, per-subscriber fan-out) rather than in its own view. Adequate at this scale; revisit when a broker replaces the in-process dispatcher (AW-D3).
- **Operational** — no view covers monitoring, backup, upgrade, incident response or the island's "human-executable from the document alone" constraint. This is a real gap (**KI-6**), not an omission by design.
- **Code (C4 level 4)** — generated when needed; never hand-drawn (`diagramming_approach_v0.md`).

---

## 5. Shared notation, legend and status tags

Every view carries its own legend. These conventions are common to all of them and are binding for this AD, extending `diagramming_approach_v0.md` §Conventions.

### 5.1 Status tag (every diagram carries exactly one)

| Tag | Meaning |
|---|---|
| `hypothesis` | Drawn from doctrine but nothing on it is decided. |
| `lean DA-Dn` / `lean AW-Dn` | Reflects a recorded lean in a decision register. **A lean is not a ruling.** |
| `ruled DA-Dn` | Graham has ruled the fork; the register's ruling log carries the date. *(No diagram in this AD carries this tag today.)* |
| `implementation truth` | The code matches the diagram and `CURRENT_STATE.md` says so. *(Nothing in this AD carries this tag. The only implementation truth in the arc is the docs corpus.)* |

### 5.2 Unruled and conditional elements

- **Flowchart views (V3, V5, V6, V7, V8):** dashed stroke = unruled, deferred or conditional, per the packet convention.
- **C4-semantics views (V1, V2):** the same dashed stroke, **plus** a `[?]` prefix on the element name with the fork or question id in its description — belt and braces, so the meaning survives a black-and-white print or a paste into a slide. *(These two views are styled `flowchart` diagrams rather than Mermaid's `C4Context` / `C4Container`; see KI-9. Observed in-session: `UpdateLayoutConfig` had no effect on `@mermaid-js/mermaid-cli@11` output at any value or position.)*
- Every dashed or `[?]` element **must** carry a `DA-Dn`, `AW-Dn` or `Qn` id. A conditional element with no id is a defect (**CR-6**).

### 5.3 Lexicon (binding for every label in this AD)

| Word | Means exactly | Never means |
|---|---|---|
| **Building** | L1: the platform — shell, lobby, elevator, session, unclassified base | a Floor; a deployment |
| **Floor** | L2: **one bounded context** made visible; a lazy, lint-fenced library set plus a BFF router | a group, a customer, a team, a microservice, a quantum |
| **Suite** | L3: a capability area inside a Floor, owning a child route set | a Floor; a page |
| **Office** | L4: one tool for one task — routed leaf, `@defer` block, or utility window | a Suite; a component |
| **group** | An identity fact: a tenant or sub-tenant in Keycloak, carried as claims; an access-and-tailoring **overlay** | a tier; a code boundary; a URL segment |
| **overlay** | Configuration + identity applied at runtime: claims, manifest, labels, tokens | code |
| **bounded context** | A design-time **language and model** boundary | a deployable |
| **quantum** | A runtime **deployment and coupling** boundary: independently deployable, own data, its own architecture characteristics | a Floor; a microservice |
| **instruction** | What a Campaign pushes to a device | a "command" |
| **command** (lowercase) | A CQRS write message | the Command Floor |
| **Command** (capitalised) | The Device Tasking Floor | anything else |
| **health** | A device's reported state | "status" |
| **Invent** | The inventory Floor | anything else |
| **Telemetry** | The device feed (an external context) | platform observability — see **KI-4** |

Forbidden vocabulary, carried from the packets: "smart/dumb components" (the dependency rule is the architecture, not a component kind); "microservice" for a Floor.

### 5.4 Colour convention (flowchart views)

Blue = the Building / composition root · green = a Floor or bounded context · purple = platform base library or Suite · orange = a service, an Office, or an anticorruption layer · yellow = data (published language, vocabulary, artefacts, overlay) · red = a fence, a guard or a live enforcement point · grey dashed = deferred or conditional.

---

## 6. Correspondences and correspondence rules

A correspondence rule is a checkable statement that must hold **across** views. These are the AD's internal consistency contract; each view's *Correspondences* section names the rules it participates in.

| # | Rule | Checkable by |
|---|---|---|
| **CR-1** | Every **Container** in V2 maps to exactly one **quantum** in V7. Two containers sharing a database schema-set are in the *same* quantum (static coupling, *Hard Parts* 2021 definition). | Compare V2 §Quantum annotation with V7 §Quantum ledger. |
| **CR-2** | Every **bounded context** in V3 is realised by exactly one **Floor library set** in V6, exactly one **BFF router** (`/api/<floor>`) in V2, and exactly one **route prefix** in V8. Front Desk is the stated exception on aggregates: it owns none, because Keycloak does. | Four-way name match across V2/V3/V6/V8. |
| **CR-3** | Every **enforcement point** in V5 appears in at least one V4 sequence, or is explicitly marked deferred/conditional in V5 with its fork id. | Walk V5's PEP list against V4a/V4b. |
| **CR-4** | Every element label in every view uses the §5.3 lexicon. Floor names are exactly {Front Desk, Invent, Command, Vigilance}. | Read the labels. |
| **CR-5** | Every **published-language event** named on a V3 edge exists in `@rr/common` (V6) and in the ACME domain model's event list; at least one is traced end-to-end in V4. | Cross-check event names. |
| **CR-6** | Every dashed (or `[?]`) element in any view carries a `DA-Dn`, `AW-Dn` or `Qn` id. | Scan for dashed elements without ids. |
| **CR-7** | Every allowed-dependency edge in V6 is permitted by the Sheriff tag matrix, and every forbidden edge in V6's legend is expressible as a Sheriff rule listed as **FF-1** in V7. An architecture rule that cannot be written as a fitness function is a wish, not a rule. | `sheriff verify` once the repo exists. |
| **CR-8** | Any element present in **both** security-domain deployments in V7 is the **same build artefact**. Per-domain difference appears only as configuration in V5/V7, never as a code element in V6. | Diff the two V7 deployment blocks; any code-level difference is a violation. |
| **CR-9** | No group, tenant, manufacturer or customer name appears as a **code element** (V2, V6) or a **route segment** (V8). Groups appear only as claims and overlay (V5, V8). | Search V2 and V6 node labels for a group name, and V8's route segments for a group segment. Group names may appear only as personas (V1), compartments (V5) and overlay examples (V8). |
| **CR-10** | Every element in every view cites a doctrine source in its Elements table; anything uncited is declared "assumed for illustration" in that view's legend. | Read the Elements tables. |
| **CR-11** | Every V2 container has exactly one `«artifact»` and one `«executionEnvironment»` in V7, **except** containers marked dev-only, which must be absent from V7. | Compare V2's container list to V7's artefact list. |
| **CR-12** | The marking vocabulary is identical in V5, on the event envelopes in V4b, on the rows behind V2's Postgres, and in each V7 ConfigMap — **one vocabulary per deployment, one component everywhere**. | Compare vocabulary statements across those four places. |

---

## 7. Decision and rationale index

The **registers are the ruling surface** — this AD never rules anything. This index says which fork moves which view, so a ruling round is followed by a bounded redraw rather than a full pass.

### 7.1 DDD-ARCH-01 forks (`ddd-arch-01-design-packet/decision_register_v0.md`)

| Fork | Subject | Lean | Views affected |
|---|---|---|---|
| **DA-D1** | Is a Floor a capability or a group? | A — capability (bounded context) | V3, V8 (and the premise of the whole AD) |
| **DA-D2** | Front-end composition strategy | A — one shell SPA, Floors as lazy fenced library sets | **V2, V7** (quantum count), V6, V8 |
| **DA-D3** | Does the group appear in the URL? | A — claim, not path | V8, V5 |
| **DA-D4** | Repo topology | A — one monorepo | V6 |
| **DA-D5** | Identity substrate | A — Keycloak | V1, V2, V5 |
| **DA-D6** | Authorization model | D — RBAC now, labels designed in | V5 |
| **DA-D7** | Delegated group administration | B on top of A | V5, V8 |
| **DA-D8** | Diagram tooling | D — Mermaid first, draw.io for boards | this AD's own form |
| **DA-D9** | Backend contract shape | A — BFF per Floor, PL in `@rr/common` | V2, V6 (see **KI-8**) |
| **DA-D10** | Where the utility-window system lives | A — `@rr/windows` in L1 | V6, V8 |
| **DA-D11** | `@rr/ui` as a façade over AstroUXDS | A — façade regardless | V6 |
| **DA-D12 / DA-D13** | Boundary-enforcement tool / Sheriff | A — Sheriff | V6, V7 (FF-1) |
| **DA-D14** | Zod 4 as published language | A | V3, V6 |
| **DA-D15** | OpenFeature + flagd | A if it rides the bundle | V2 (deferred), V8 |
| **DA-D16** | PDP beside RLS | C → A/B when needed | **V5** (PEP 4), V2, V4 |
| **DA-D17** | BFF session substrate | A — openid-client + Postgres sessions | V2, V4a |
| **DA-D18** | XState for process-as-data | lean A, unproven | V8 (rung 2) |
| **DA-D19** | Typed SQL (Drizzle vs Kysely) | lean A pending verification | V2 (not drawn — below container grain) |
| **DA-D20** | Storybook · Playwright · Context Mapper | Storybook + Playwright yes | V7 (would add fitness functions) |

### 7.2 ACME-WORKSHOP-01 forks (`acme-workshop-01-design-packet/decision_register_v0.md`)

| Fork | Subject | Lean | Views affected |
|---|---|---|---|
| **AW-D1** | Map engine offline (Cesium, no ion) | A behind an `@rr/map` façade | V6, V7 (FF-5), V8 |
| **AW-D2** | Telemetry source | A — a simulator service | V1, V2, V3, V7 |
| **AW-D3** | Event transport in v0 | A — Postgres outbox + SSE | **V1, V2, V4b, V7** |
| **AW-D4** | Paywall / entitlement model | A — entitlement rows + policy | V4b, V8 (rung 3) |
| **AW-D5** | Process-as-data format | A in v0, XState later | V8 (rung 2) |
| **AW-D6** | RLS subject transport | A — `SET LOCAL` | V4a, V5 |
| **AW-D7** | Mock OIDC for CI-side proofs | A | V2, V6, V7 (absent by design) |
| **AW-D8** | Keycloak realm as code | A — exported realm JSON | V7 |
| **AW-D9** | Group = compartment **and** org unit | A, by construction, for ACME only | **V5** (see OC-1) |
| **AW-D10** | Utility-window host for the inspector | A — `@rr/windows` | V6, V8 |
| **AW-D11** | Local gate | A — `scripts/local-ci.sh` | V7 (FF-2) |
| **AW-D12** | Where seed data lives | A — JSON under the gateway | V7 |

### 7.3 Open questions that gate whole views

**Q1** (what the bounded contexts *are*) gates V3 and V8 · **Q2** (multi-group membership) gates V8's URL design · **Q3** (group = compartment or org unit) gates V5 · **Q6** (which marking vocabulary) gates V5 · **Q7** (broker permitted?) gates V1/V2/V7 · **Q8** (does data cross security domains?) gates V1/V5/V7 · **Q11** (object storage / catalog) gates V1's fabric · **Q12** (lexicon owner) gates §5.3 and KI-4.

---

## 8. Known inconsistencies and open concerns

Recorded rather than smoothed over. Durable disagreements belong in `docs/context/governance/contradictions/register.md`; these are AD-level and mostly resolve by a ruling.

| # | Concern | Effect on this AD |
|---|---|---|
| **KI-1** | **The context map is a hypothesis until the EventStorming session** (Q1). The real programme's contexts are not known and cannot be derived from research. | V3 and V8 — and therefore the Floor names in V1, V2 and V6 — are provisional. ACME's four contexts prove the *shape*, not the content. |
| **KI-2** | **Q3 and Q8 are unanswered.** Whether a group is a compartment or an organisational unit, and whether RR moves data between security domains at all, are decisions for Graham and the security authority. | V5's dominance model and V7's high side are drawn conditionally. The AD cannot state whether the second domain exists. |
| **KI-3** | **The quantum count depends on DA-D2.** The AD asserts one front-end/back-end quantum; a ruling of B (federation) or C (app per Floor) changes V2 and V7 materially — and, per R8 §7.5, federation may *not* change the quantum count at all, which is itself an argument for lean A. | V2 §Quantum annotation, V7 §Quantum ledger. |
| **KI-4** | **"Telemetry" carries two meanings in the corpus**: the ACME device feed (an external bounded context) and platform observability (`tier_model_exploration_v0.md` §2 lists "telemetry" among L1 platform concerns). This is precisely the TrAIdit "playbook" failure mode. | This AD pins **Telemetry = the device feed** and uses *observability* for the platform sense. Needs a lexicon ruling (Q12); until then the two uses coexist in the corpus. |
| **KI-5** | **Compartment subsumption is undefined** (V5 OC-2): does `TTW` subsume `TTW/NWL` — i.e. does a manufacturer see its B2B customer's rows? The corpus states Fay sees only `TTW/NWL` and is silent on the reverse. | Must be ruled before slice S3; the SSE per-subscriber filter needs it as a predicate. |
| **KI-6** | **No Operational viewpoint.** Nothing here covers monitoring, backup, upgrade, incident response, or the island constraint that procedures be human-executable from the document alone. | A declared gap in §4. Candidate for a V9 once the deployment shape is ruled. |
| **KI-7** | **Package-naming drift between doctrine docs.** `practical_picture_v0.md` §1 names `@rr/auth` and `apps/shell`; R7 §4.2/§5.3 names `@rr/platform-identity` and `@rr/shell` for the same things. | This AD uses the ACME-specific names (`@rr/auth`, `apps/shell`) because the more specific, more recent doc wins (contract rule 7). The drift should be resolved in the lexicon pass, not averaged. |
| **KI-8** | **"BFF per Floor" is a *grain*, not a process count.** DA-D9 says BFF per Floor; `practical_picture_v0.md` §1 puts one router per Floor inside one Express gateway. Both are true and readers routinely take the first as "one service per Floor". | V2 draws one gateway container with per-Floor routers and says so. Stated here so the phrase is not misread in the register. |
| **KI-9** | **Mermaid's native C4 renderer is not usable at this element count.** It is documented as experimental `[UNVERIFIED — mermaid.js.org egress-blocked]`; in-session it placed boundaries last regardless of declaration order, ignored `UpdateLayoutConfig` entirely, and produced colliding edge labels in the container view. | **V1 and V2 keep C4 level-1 and level-2 *semantics* but are drawn as styled Mermaid `flowchart` diagrams** — element kinds carried by shape and fill, unruled elements dashed *and* `[?]`-prefixed, edge labels held to three words with the detail in the Elements tables. If the set outgrows hand layout, DA-D8's option C (Structurizr) is the recorded escape hatch. |
| **KI-10** | **Nothing here is implementation truth yet.** Exactly one story is activated: **S-18 (slice S0, Foundation)**, activated by Graham on 2026-09-03 and built on a branch **awaiting review** — it is not on `main`. Every other ACME-WORKSHOP-01 story exists on the board and is **not activated**. | Every view's status tag stays `hypothesis`, including [V6](V6-development-module.md) and [V7](V7-deployment-evolution.md), which S0 will be the first to touch. Promotion of a view to `implementation truth` happens in a closeout pass with `CURRENT_STATE.md` after the work lands on `main` — never on a branch, and never in a diagram alone. |

---

## 9. Conformance statement

**Standard applied:** ISO/IEC/IEEE 42010, *Systems and software engineering — Architecture description* (2022 revision; the 2011 edition is its predecessor).

**How it was applied, honestly.** The standard is paywalled and its publisher is egress-blocked in this environment, so it **was not fetched**. The content requirements applied here are from the author's knowledge of the standard's well-known structure: an AD identifies the system of interest and the AD itself; identifies **stakeholders and their concerns**; is organised into **architecture viewpoints** (each naming its concerns, stakeholders, model kinds and conventions) and **architecture views** conforming to them; records **correspondences and correspondence rules** between views; records **architecture rationale** (decisions and the alternatives considered); and records **known inconsistencies** among its contents. This AD provides each of those (§1, §3, §4, §6, §7, §8). **No clause numbers are cited**, because they could not be verified.

**Other notations and sources cited by name:**

- **C4 model** — Simon Brown, `c4model.com`. Levels 1 (System Context) and 2 (Container) used in VP-1/VP-2; level 3 (Component) used *inside* V2 for the shell's library sets; level 4 (Code) deliberately not drawn. C4 is notation-independent, so V1 and V2 render its element kinds as styled flowchart shapes rather than through Mermaid's `C4*` keywords (KI-9); the levels, element kinds and abstractions are unchanged.
- **Rozanski & Woods**, *Software Systems Architecture*, 2nd edition (2011) — the viewpoint set VP-4…VP-7 correspond to `[UNVERIFIED — quoted from prior knowledge; not fetched]`.
- **UML 2.5.1** (OMG) — deployment-diagram stereotypes `«device»`, `«executionEnvironment»`, `«artifact»` in V7, and sequence-diagram semantics (lifelines, combined fragment `alt`, lost message) in V4 `[UNVERIFIED — the OMG specification was not fetched; stereotype names are from prior knowledge]`.
- **Eric Evans**, *Domain-Driven Design* (2003) and the *DDD Reference* (2015) — context-map relationship patterns in V3, as tabulated in R1 §5.2.
- **Neal Ford, Mark Richards et al.** — *Building Evolutionary Architectures* (2017; 2nd ed. 2022), *Fundamentals of Software Architecture* (2020), *Software Architecture: The Hard Parts* (2021) — architecture quanta, static/dynamic coupling, granularity disintegrators/integrators, and fitness functions in V2 and V7, as summarised in R8 `[UNVERIFIED book wording — R8 records the same limitation]`.
- **NIST SP 800-207** — PDP/PEP placement vocabulary in V5, as relayed by R4/R5.

### 9.1 `[UNVERIFIED]` register for this AD

1. The normative wording, clause numbering and exact required-element list of **ISO/IEC/IEEE 42010:2022**, including whether "architecture viewpoint" remains the term of art in the 2022 revision.
2. The **Rozanski & Woods** viewpoint list (Context, Functional, Information, Concurrency, Development, Deployment, Operational) and the *perspectives* concept — from prior knowledge, not fetched.
3. **UML 2.5.1** stereotype spelling and the precise semantics of `«executionEnvironment»` versus `«device»` for a Kubernetes pod (a pod is not a UML concept; the mapping is this AD's reading).
4. Whether **Mermaid's C4 syntax** is still documented as experimental (inherited from `diagramming_approach_v0.md`).
5. Exact **book wording** for the quantum definition and the saga names (inherited from R8).
6. **Drizzle's RLS policy support** (DA-D19) — inherited, unverified.
7. Whether **`@mermaid-js/mermaid-cli@11`'s ignoring of `UpdateLayoutConfig`** is a version-specific defect or intended — observed in-session, cause not established.

---

## 10. Maintaining this AD

- **Redraw after a ruling round, not after a conversation.** The registers are the trigger; each view's last section names its triggers, and [`diagrams-manifest.md`](diagrams-manifest.md) collects them in one table.
- **A view and its SVG change together.** Every Mermaid fence has a rendered `.svg` beside its view file, exported with `@mermaid-js/mermaid-cli` against a local Chromium. On the islands there is no browser binary to drive `mmdc`, so the durable copy is always the Mermaid source in Markdown.
- **Adding a view** means adding a viewpoint row to §4, concerns to §3, and at least one correspondence rule to §6 — otherwise it is a picture, not a view.
- **Superseded predecessors:** `diagrams/01-context-desert-island.md` → V1; `diagrams/02-tier-model-building-floors.md` → V8. Both remain in place with `status: superseded` and a `superseded_by` pointer.

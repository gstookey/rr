---
schema: corpus-doc/v1
status: exploratory
title: DDD-ARCH-01 — Desert Island system architecture, front-end-first (packet charter)
areas: [system-architecture, domain-driven-design, frontend, planning]
related: ["docs/context/platform/research/README.md", "docs/design/packets/ddd-arch-01-design-packet/decision_register_v0.md", "docs/design/packets/ddd-arch-01-design-packet/tier_model_exploration_v0.md", "docs/design/packets/ddd-arch-01-design-packet/diagramming_approach_v0.md", "docs/context/canonical/two_island_model.md", "docs/context/canonical/technology_stack.md"]
updated: 2026-09-03
---

# DDD-ARCH-01 — Desert Island system architecture, front-end-first

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 | **Author:** Axium | **Status:** `exploratory` — packet opened at Graham's direction; nothing ruled; no story activated

## What this packet is

The long-running design arc for the **new system on Desert Island**: a Domain-Driven-Design-oriented system whose front end Graham must own as subject-matter expert. It is opened as a **Context Enrichment Side-Quest** (Axium `side_quests.md`): Graham-initiated, bounded to one conceptual topic, and concluding in durable artifacts. It runs **beside** Milestone 1 (Legacy Island to Angular 19), which stays the organizing objective on the board; this packet is design, not activation.

The packet is deliberately **front-end-first**: the backend is designed to the depth needed for the front end to have a real contract (bounded contexts, published language, identity, labels, events), and no deeper until Graham's team says otherwise.

## Graham's requirements (verbatim intent, 2026-09-03)

The front-end architecture must be:

1. **Scalable** — add new features / new Angular applications for new user groups or customers with ease.
2. **Modular** — a base library of **unclassified** front-end code to lean on; no copy-paste as the system scales; tailored UIs per user group / customer.
3. **Secure** — each user group has data privileges unique to it.
4. **Robust user management**, with **delegated group-level admin** (a group admin can add users to their own group).
5. **Interacts with / coexists with / utilizes / interfaces with a DDD backend.**

And it must give a home to the hierarchy Graham is picturing:

| Tier | Name | URL shape | Graham's open question |
|---|---|---|---|
| L1 | **The Building** | `https://building.com` | the main domain |
| L2 | **The Floors** | `building.com/floor` | own Angular apps / monorepos? do *groups* live here, or *functions*? |
| L3 | **The Suites** | `building.com/floor/suite` | teams? functions? |
| L4 | **The Offices** | possibly a further segment | lowest-level tools / tool sets, specialized features |

## Packet contents

| Document | What it is | State |
|---|---|---|
| [`decision_register_v0.md`](decision_register_v0.md) | the forks (DA-D1..), each with options and Axium's lean; **the ruling surface** | open |
| [`tier_model_exploration_v0.md`](tier_model_exploration_v0.md) | Axium's initial analysis of Building / Floor / Suite / Office against DDD, Team Topologies and IA practice — a hypothesis for R7 to test | hypothesis |
| [`diagramming_approach_v0.md`](diagramming_approach_v0.md) | how architecture diagrams are stood up, kept, rendered, and edited on both sides of the fence | proposal |
| `diagrams/` | the diagram set (C4-numbered, Mermaid first; draw.io where a visio-esque board earns it) | first two seeded |
| Research corpus | [`docs/context/platform/research/`](../../../context/platform/research/README.md) — seven briefs R1..R7 | **landed 2026-09-03** (~32k words; every unconfirmed claim marked `[UNVERIFIED]`) |

## Sequence

1. ✅ **Research corpus landed** (R1..R7, 2026-09-03) → Graham reads; the briefs' "open questions for Graham" sections are harvested into the register.
2. **Lexicon pass** — one meaning per word across the seven briefs and this packet (the TrAIdit Concordance lesson: "playbook" drifted because two docs used one word two ways).
3. **Rulings round 1** — DA-D1..DA-D6 + DA-D8 (tier semantics, composition strategy, tenant addressing, repo topology, identity substrate, authorization model, diagram tooling); the register's harvested questions Q1..Q12 go to the island owners in the same pass as the readiness questionnaires.
4. **The C4 diagram set** — context → containers → components, redrawn after each ruling round.
5. **Reference structure** — the monorepo skeleton on paper (`apps/*`, `packages/*`, library taxonomy, boundary rules), then a scaffold packet under EP-05 when Graham activates it.
6. **Backend contract depth** — bounded contexts, published language package, BFF per floor, event topics, label model — to the depth the front end needs.

## Boundary

- Design only. No application code; no scaffold until an EP-05 story is activated by Graham.
- Nothing here re-pins the stack. Desert Island's stack target remains *whatever Legacy Island achieves* (C-008, DR-04); the architecture must be version-agnostic across Angular 19–22.
- Uses only public, unclassified sources. Nothing about any specific classified system or program is written here, and nothing that would be problematic to port up.
- Product purpose of RR-the-application is still `[NEEDS GRAHAM]` (`project_overview.md`); the packet designs the *shape* the product will occupy, and names the point at which it cannot proceed without domain input.

## Doctrine consulted (contract rule 17)

`node scripts/corpus-graph.mjs lookup` on `frontend`, `system-architecture`, `security`: surfaced `canonical/technology_stack.md`, `canonical/two_island_model.md`, `canonical/isolated_network_constraints.md`, the coder's `angular_frontend_engineering_policy.md`, and the `iso-net-readiness-01` decision register (DR-05 layout) — all read. TrAIdit precedents read for pattern, not content: `utility-window-01` (the window system as an "office" host), `architecture-diagrams/` (the 12-diagram Mermaid/C4 set), `ui-foundations-01` (the Concordance's four ledgers), `identity-01` (tenancy-shaped identity).

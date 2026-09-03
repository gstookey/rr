---
schema: corpus-doc/v1
status: active
title: Architecture Research Corpus — DDD-ARCH-01 base briefs
areas: [research, system-architecture, domain-driven-design, frontend]
related: ["docs/context/platform/README.md", "docs/context/canonical/technology_stack.md", "docs/context/canonical/two_island_model.md"]
updated: 2026-09-03
---

# Architecture Research Corpus — DDD-ARCH-01 base briefs

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 (Axium; all seven briefs landed the same day)

## Purpose

The base document corpus for the **Desert Island system architecture** design work (packet `ddd-arch-01`, `docs/design/packets/ddd-arch-01-design-packet/`). Each brief is a synthesized, source-cited reference on one topic, written so that Graham and the fleet can lean on it while designing a DDD-oriented system with a scalable, modular, secure Angular front end.

These are **reusable program concepts** (AGENTS.md's "reusable program concept" test), which is why they live under `platform/` rather than inside one packet. RR-specific implications are confined to each brief's "RR lens" section, and stay *design direction*, never implementation truth (operating-contract rule 8).

## Status of these briefs

`exploratory` until Graham has read them. They are research syntheses produced by research agents under Axium's direction, on the open-internet side, with sources cited inline. They are **not doctrine**: a brief informs a decision register; it does not rule one. Anything marked `[UNVERIFIED]` was not confirmed against a primary source in-session. **Research conditions on 2026-09-03:** the session's web-search budget was exhausted early and the egress proxy blocked most primary-source hosts (NIST, DNI, DoD, Gartner, Fowler, Angular, Keycloak, Kafka, vendor sites); the agents fell back to GitHub source mirrors and the npm registry, which is why NIST 800-53 (via OSCAL), Keycloak `.adoc` docs, Angular and NgRx docs, OpenTDF, Accumulo/HBase source and package versions are verified while book wording, DoD/IC policy text and vendor claims are largely `[UNVERIFIED]`. A verification pass with search restored is a queued hygiene task, not a blocker.

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

Rules: cite every non-obvious claim; prefer primary sources; mark `[UNVERIFIED]` rather than guess; no vendor hype; keep each brief readable in one sitting (roughly 2,000–3,500 words).

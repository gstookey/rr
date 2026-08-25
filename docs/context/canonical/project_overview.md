---
schema: corpus-doc/v1
status: active
title: Project Overview — Project Road Runner
areas: [planning, brand-design]
related: ["docs/context/canonical/technology_stack.md", "docs/design/brand/README.md"]
updated: 2026-08-25
---

# Project Overview — Project Road Runner (RR)

**Created:** 2026-08-25 | **Last updated:** 2026-08-25

> **Provenance warning.** Graham keeps a project description inside the Claude project that was *not* available to the agent that wrote this page. Everything here is reconstructed from repo evidence (`AGENTS.md`, the brand guide, the stack source documents). Sections marked `[NEEDS GRAHAM]` are gaps, not facts. First ingest action: paste the project description into `docs/context/evidence/raw/` and let Rin reconcile this page.

## What we know

- **Name:** Project Road Runner ("RR", "Project Roadrunner" in the brand guide).
- **Nature:** a new software system, sibling to an existing AstroUXDS-based Angular application Graham works on. The brand guide describes a "high-tech, military-grade initiative blending Southwestern desert resilience with advanced cyber-electronic warfare and aerospace capabilities" — read this as **brand voice**, not a verified functional description.
- **Delivery context:** stood up and developed on an **isolated network**; Graham's day job is full-stack engineering in aerospace/defense.
- **Team:** Graham (lead front-end engineer, C2) + an agent fleet; other human team members exist but are undocumented.
- **Horizon:** planning now (2026-08); development next; a released version within ~12 months.
- **Brand promise / tone:** "Speed. Precision. Unstoppable." Direct, technical, mission-focused. Dark theme default, orange-glow accent family, desert earth palette, Orbitron/Rajdhani/Inter/Space Mono type stack. See `docs/design/brand/`.

## What we do not know `[NEEDS GRAHAM]`

- What RR *does* — the user problem, the operators, the core workflows.
- Who the users are and how many (single-operator first? multi-user target? — AGENTS.md hints the answer is "single now, multi later" as a pattern to expire, but does not say so for RR).
- What "release" means (internal tool? fielded system? demo?).
- Relationship to the sibling application — shared code, shared design system only, or shared backend?
- Data sources, integrations, and any security/classification handling requirements on the isolated network.

## Reusable vs RR-specific (AGENTS.md "Project Road Runner rule")

The context system, fleet model, governance, and much of the stack blueprint are **reusable program concepts** inherited from TrAIdit. RR-specific content so far is limited to: the brand identity, the isolated-network delivery constraint, and the AstroUXDS-sibling relationship.

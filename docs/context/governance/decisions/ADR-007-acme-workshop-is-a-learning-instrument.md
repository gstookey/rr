---
schema: corpus-doc/v1
status: accepted
title: ADR-007 — ACME Workshop is a learning instrument, not the Desert Island scaffold
areas: [system-architecture, planning, domain-driven-design, technology-stack]
related: ["docs/context/governance/decisions/ADR-005-island-stack-sync.md", "docs/context/governance/decisions/ADR-006-repo-layout-apps-packages-services.md", "docs/context/governance/contradictions/register.md", "docs/design/packets/acme-workshop-01-design-packet/README.md", "docs/context/canonical/two_island_model.md"]
updated: 2026-09-08
---

# ADR-007 — ACME Workshop is a learning instrument, not the Desert Island scaffold

**Date:** 2026-09-08 | **Status:** **accepted** — ruled by Graham in session. | **Resolves C-008.** | Supersedes the "becomes the LOE-8 scaffold" framing in the ACME-WORKSHOP-01 packet.

## Decision

Graham, 2026-09-08:

> "ACME Workshop is a mock application designed to help me see how DDD principles play themselves out using an angular application as an example. It will only be used to inform my design and architecture for the new project on the Desert Island. So override / supersede any rulings that contradict the ACME Workshop lane."

**ACME Workshop is a learning instrument.** Its output is *understanding* — how the DDD-ARCH-01 tier model, Floor boundaries, claims-driven tailoring and markings behave in real Angular code. Its output is **not** the artifact that ships to Desert Island.

Any standing rule that would block or constrain the ACME lane yields to this ruling.

## What this changes

### 1. C-008 is resolved, not merely tolerated

C-008 recorded the tension between Desert Island's Angular 22 pins and Legacy Island's unknown ceiling, and its resolution note carried a prohibition: *"Do not scaffold on the v22 pins before then [DR-04 closing]."* `ACME-WORKSHOP-01` S0 was then built on Angular 22.1.5 and merged (PR #47), which contradicted that prohibition on its face.

**The prohibition was aimed at the wrong target.** It exists to prevent the programme from committing the *deliverable* to pins Legacy Island may not reach. A learning instrument carries no such commitment: if the estate stops at v19, ACME is not re-pinned, it is simply read as what it always was — a study of the architecture on the then-current framework. Nothing ships from it.

C-008's underlying concern is therefore **unchanged and still live for the real scaffold**, and **inapplicable to ACME**.

### 2. The prohibition is re-scoped, not deleted

It still binds **LOE-8 / EP-05 — the actual Desert Island scaffold**. That artifact must not be pinned before DR-04 closes, because under [ADR-005](ADR-005-island-stack-sync.md) its version is Legacy Island's achieved ceiling, not a free choice.

`two_island_model.md` §Stack synchronization is amended to say which of the two it means.

### 3. The stakes of DR-04 return to their prior level

Before this ruling, DR-04 appeared to have grown a second consequence: whether the ACME scaffold survived a v19 outcome. Since ACME is not the scaffold, **that consequence does not exist.** DR-04 is what it always was — how far the legacy estate goes, and therefore what Desert Island launches on.

This is a deliberate correction of an over-reading. What made it look otherwise was the ACME packet's own framing (below), not the code.

### 4. The ACME packet's self-description is superseded

`acme-workshop-01-design-packet/README.md` currently reads: *"It is built in this repo, in the real layout … so it becomes the LOE-8 scaffold for Desert Island rather than a throwaway."*

**That sentence no longer holds.** The layout half stands — [ADR-006](ADR-006-repo-layout-apps-packages-services.md) settles `apps/` + `packages/` + `services/` on its own merits, and building ACME in the real layout is exactly what makes it a useful study. The *scaffold* claim does not.

The correction belongs to the ACME/Desert Island lane, which Graham runs in a separate session (see "Lane ownership" below). It is recorded here rather than edited there.

## What this does not change

- **ADR-005 stands in full.** The two islands' stacks must match; its granularity sub-question remains `[NEEDS GRAHAM]` and the strictest reading still governs.
- **ADR-006 stands in full.** The repo layout ruling is independent of what ACME is for.
- **DR-04 stays open.** Only the first real hop can inform it.
- Nothing about the Legacy Island upgrade programme is affected. ACME never touched it.

## Lane ownership (Graham, 2026-09-08)

Two lanes now run in **separate sessions**:

| Lane | Owner session | Scope |
|---|---|---|
| **Legacy Island / Angular upgrade** | this thread (Axium) | Milestone 1, the hop ladder, transfer bundles, `first-app-hop-01`, EP-01/02/03 |
| **ACME Workshop / Desert Island** | a separate session | DDD-ARCH-01, EP-06 (S-18..S-25), the architecture description, EP-04/05 |

Shared doctrine — this decisions folder, the contradiction register, `CURRENT_STATE.md`, `current_priorities.md`, `two_island_model.md` — is common ground. **Either lane may correct shared doctrine; neither rewrites the other's packets.** That is why §4 above records a correction instead of making it.

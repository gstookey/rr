---
schema: corpus-doc/v1
status: superseded
title: DDD-ARCH-01 diagram 02 — Tier model, Building / Floors / Suites / Offices with the group overlay
areas: [system-architecture, frontend, domain-driven-design]
related: ["docs/design/packets/ddd-arch-01-design-packet/diagramming_approach_v0.md", "docs/design/packets/ddd-arch-01-design-packet/tier_model_exploration_v0.md", "docs/design/packets/ddd-arch-01-design-packet/decision_register_v0.md"]
superseded_by: docs/design/packets/ddd-arch-01-design-packet/architecture-description/V8-tier-information-architecture.md
updated: 2026-09-03
---

# 02 — Tier model: Building / Floors / Suites / Offices, with the group overlay

> **Superseded 2026-09-03 by [V8 — Tier / Information Architecture](../architecture-description/V8-tier-information-architecture.md)** of the ACME Workshop Architecture Description. V8 draws the same tier model with ACME's Floors, Suites, Offices and routes, and separates the overlay's four sources. Kept as the record of the lettered-Floor hypothesis.


**Created:** 2026-09-03 | **Status:** hypothesis (DA-D1 lean A, DA-D2 lean A *revised after R7*, DA-D3 lean A — none ruled) | **Notation:** Mermaid flowchart

## Purpose

The structural axis (what code and URLs are organised by) and the access axis (who may enter, what they see) drawn as two different things. Everything in the overlay is configuration + identity, not code.

```mermaid
flowchart LR
  subgraph L1["L1 · The Building — building.com (platform, unclassified base)"]
    direction TB
    shell["apps/shell<br/>lobby · elevator · session"]
    base["@rr/ui · @rr/windows · @rr/auth<br/>@rr/common · @rr/markings · @rr/config"]
    idp[("Identity provider")]
    gw["Gateway"]
  end
  subgraph L2["L2 · Floors — /floor (one bounded context each; lazy, lint-fenced library sets + a BFF)"]
    direction TB
    fa["scope:floor-a libs<br/>+ floor-a-bff"]
    fb["scope:floor-b libs<br/>+ floor-b-bff"]
    fn["scope:floor-n …<br/>(a new Floor = a new context;<br/>promotable to its own app)"]
  end
  subgraph L3["L3 · Suites — /floor/suite (feature libraries)"]
    s1["floor-a-feature-suite-1"]
    s2["floor-a-feature-suite-2"]
  end
  subgraph L4["L4 · Offices — tools (route leaf · panel · window)"]
    o1["floor-a-office-x"]
    o2["@rr/office-inspector<br/>(generic, promoted to L1)"]
  end
  subgraph OV["Group overlay — per customer / team (configuration + identity, never code)"]
    direction TB
    g1["access: which Floors / Suites / Offices exist for me"]
    g2["data: labels · RLS · need-to-know"]
    g3["tailoring: tokens · copy · defaults · enabled Offices"]
    g4["delegated admin: my group's users"]
  end
  shell -->|"loadChildren + CanMatch(claim)"| fa & fb & fn
  fa --> s1 & s2
  s1 --> o1
  s2 --> o2
  fa -. build-time deps .-> base
  fb -. build-time deps .-> base
  shell -.-> base
  idp -. claims .-> OV
  OV -. applied at runtime .-> shell
  OV -. applied at runtime .-> fa
  classDef future fill:#20222a,stroke:#888,stroke-dasharray: 5 5,color:#ddd;
  class fn,o2 future;
```

## Interpretation

- **Floors never depend on each other.** That fence is what makes a Floor promotable to its own app or remote later (DA-D2) without a refactor; under the current lean A, crossing Floors is a router navigation inside one app and shared state lives in the shell's root store.
- **A group is not a tier.** It enters the picture through the identity provider's claims and lands on the overlay, which the shell and each Floor apply at runtime.
- **A generic Office is promoted into L1 only when a second Floor needs it** (dashed) — the salvage rule, not speculation.

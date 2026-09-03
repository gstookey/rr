---
schema: corpus-doc/v1
status: exploratory
title: DDD-ARCH-01 diagram 02 — Tier model, Building / Floors / Suites / Offices with the group overlay
areas: [system-architecture, frontend, domain-driven-design]
related: ["docs/design/packets/ddd-arch-01-design-packet/diagramming_approach_v0.md", "docs/design/packets/ddd-arch-01-design-packet/tier_model_exploration_v0.md", "docs/design/packets/ddd-arch-01-design-packet/decision_register_v0.md"]
updated: 2026-09-03
---

# 02 — Tier model: Building / Floors / Suites / Offices, with the group overlay

**Created:** 2026-09-03 | **Status:** hypothesis (DA-D1 lean A, DA-D2 lean C, DA-D3 lean A — none ruled) | **Notation:** Mermaid flowchart

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
  subgraph L2["L2 · Floors — /floor (one bounded context each)"]
    direction TB
    fa["apps/floor-a<br/>+ floor-a-bff"]
    fb["apps/floor-b<br/>+ floor-b-bff"]
    fn["apps/floor-n …<br/>(a new Floor = a new context)"]
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
  shell --> fa & fb & fn
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

- **Floors never depend on each other.** Crossing Floors is an elevator ride (a full navigation under DA-D2 lean C); state that must survive it lives in the URL, the session, or the backend.
- **A group is not a tier.** It enters the picture through the identity provider's claims and lands on the overlay, which the shell and each Floor apply at runtime.
- **A generic Office is promoted into L1 only when a second Floor needs it** (dashed) — the salvage rule, not speculation.

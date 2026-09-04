---
schema: corpus-doc/v1
status: superseded
title: DDD-ARCH-01 diagram 01 — System context, Desert Island (C4 L1)
areas: [system-architecture, domain-driven-design]
related: ["docs/design/packets/ddd-arch-01-design-packet/diagramming_approach_v0.md", "docs/design/packets/ddd-arch-01-design-packet/tier_model_exploration_v0.md"]
superseded_by: docs/design/packets/ddd-arch-01-design-packet/architecture-description/V1-system-context.md
updated: 2026-09-03
---

# 01 — System context, Desert Island (C4 level 1)

> **Superseded 2026-09-03 by [V1 — System Context](../architecture-description/V1-system-context.md)** of the ACME Workshop Architecture Description. V1 draws the same picture with the reference application's real names, the conditional neighbours carrying their fork and question ids, and the directory and telemetry feed added. Kept as the record of what was drawn before ACME Workshop existed.


**Created:** 2026-09-03 | **Status:** hypothesis (nothing ruled) | **Notation:** Mermaid C4

## Purpose

Show the Building as one system among its neighbours, before any internal structure is decided. Dashed/`_Ext` elements are neighbours whose existence on Desert Island is still a questionnaire item.

```mermaid
C4Context
  title Desert Island — system context (hypothesis, 2026-09-03)
  Person(user, "Group member", "belongs to one or more groups")
  Person(gadmin, "Group admin", "delegated admin for own group")
  System_Boundary(b, "The Building (building.com)") {
    System(shell, "Shell / Lobby (L1)", "Angular shell + unclassified base libraries")
    System(floors, "Floors (L2)", "one Angular app + BFF per bounded context")
  }
  System_Ext(idp, "Identity provider", "Keycloak (assumed) federated to the island directory")
  System_Ext(bus, "Event bus", "Kafka-class (candidate)")
  System_Ext(fabric, "Data fabric / catalog", "if the program mandates one")
  System_Ext(cds, "Cross-domain guard", "only if a second security domain exists")
  System_Ext(legacy, "Legacy Island apps", "same cluster, Angular 19+")
  Rel(user, shell, "signs in, picks a Floor")
  Rel(gadmin, floors, "manages own group via an admin Office")
  Rel(shell, idp, "OIDC (code + PKCE, BFF session)")
  Rel(floors, bus, "publishes / consumes domain events")
  Rel(floors, fabric, "discovers / reads governed data")
  Rel(floors, cds, "guard-friendly, marked messages")
  Rel(floors, legacy, "coexists; shared IdP and cluster")
```

## Interpretation

- The **users are groups' members, not groups** — groups appear as identity facts on the person, not as boxes. That is DA-D1 lean A drawn.
- Four of the six neighbours are *candidates*: the bus, the fabric, the guard and the IdP choice each wait on a research brief (R2–R4, R6) and an island answer.
- Legacy Island's apps are neighbours **in the same cluster**, which is why the stack-synchronization constraint (`two_island_model.md`) is drawn as a relationship and not left implicit.

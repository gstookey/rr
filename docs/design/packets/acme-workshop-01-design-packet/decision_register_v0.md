---
schema: corpus-doc/v1
status: exploratory
title: ACME-WORKSHOP-01 — Decision Register v0 (AW-D1..AW-D12)
areas: [system-architecture, domain-driven-design, frontend, backend, planning]
related: ["docs/design/packets/acme-workshop-01-design-packet/README.md", "docs/design/packets/acme-workshop-01-design-packet/slice_decomposition_v0.md", "docs/design/packets/ddd-arch-01-design-packet/decision_register_v0.md"]
updated: 2026-09-03
---

# ACME-WORKSHOP-01 — Decision Register v0

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 | **Author:** Axium | **Status:** forks open unless marked; Graham rules; rulings echoed to `docs/context/log.md`

Cross-refs: `DA-Dn` = DDD-ARCH-01 register (inherited; ACME builds on its leans, and a ruling here on a DA fork *is* the ruling); `AW-Dn` = this build.

| # | Fork | Options | Axium's lean | Slice | Vigilance |
|---|---|---|---|---|---|
| **AW-D1** | **Map engine, offline.** CesiumJS (Apache-2.0) needs no network for the engine, but its *default* imagery/terrain come from Cesium ion (online). | A CesiumJS + a local raster base layer (bundled tiles / single-image provider) and no ion token · B MapLibre GL (lighter, 2D) · C both behind an `@rr/map` façade | **A** (Graham asked for Cesium; the façade keeps B possible) — the no-network rule is binding | S5 | open |
| **AW-D2** | **Telemetry source.** | A a small simulator service emitting `PositionReported`/`HealthReported` into the outbox · B replayed fixtures only | **A** (live-looking SA is the demo) | S5 | open |
| **AW-D3** | **Event transport in v0.** | A Postgres outbox + in-process dispatcher + SSE (R3's "Postgres first") · B Kafka via Strimzi from day one | **A**; the bus port is an interface so B is a swap | S2/S5 | open |
| **AW-D4** | **Paywall / entitlement model.** | A entitlement rows + a policy check in the Command BFF (rung 3) · B a "payment" stub Floor | **A** (payments are out of scope; the *rule* is the showcase) | S6 | open |
| **AW-D5** | **Process-as-data format** for campaign approval. | A a JSON step list interpreted by a small process manager · B XState 5 (DA-D18) | **A in v0**, B as a v1 slice once the shape is seen | S6 | open |
| **AW-D6** | **RLS subject transport.** | A `SET LOCAL app.subject_*` per request transaction · B a per-tenant DB role | **A** (attributes, not roles, match the compartment model) | S2 | open |
| **AW-D7** | **Mock OIDC for CI-side proofs** (no Docker in the fleet's cloud environment). | A a tiny in-repo OIDC stub honouring the same claims shape · B skip auth in tests | **A**; real Keycloak in docker-compose for Graham's machine (ruling: real from slice 1) | S0/S1 | open |
| **AW-D8** | **Keycloak realm as code.** | A exported realm JSON committed + import on boot · B click-ops documented | **A** | S1 | open |
| **AW-D9** | **Group = compartment AND org unit** for the showcase. | A yes (by construction) · B separate axes | **A** — states the R5 Q3 decision for ACME explicitly; the real program may rule differently | S1 | open |
| **AW-D10** | **Utility-window host** for the Device inspector Office. | A port the TrAIdit UWS mechanism into `@rr/windows` (recast, not copy) · B route leaf only | **A** — it is the Office host and the lesson of the prior port | S2 | open |
| **AW-D11** | **Local gate.** | A `scripts/local-ci.sh` mirror (lint · typecheck · Sheriff · Vitest · build · corpus check) · B GitHub Actions | **A** (no Actions budget assumption; the island has no Actions anyway) | S0 | open |
| **AW-D12** | **Where seed data lives.** | A JSON under `services/gateway/seed/` loaded by a script · B SQL migration | **A** | S0 | open |

## Ruling log

*(empty)*

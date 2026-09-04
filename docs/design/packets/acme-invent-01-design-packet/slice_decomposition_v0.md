---
schema: corpus-doc/v1
status: exploratory
title: ACME-INVENT-01 — Slice decomposition v0 (S0..S7 = board stories, each with its proof)
areas: [planning, system-architecture, frontend, backend]
related: ["docs/design/packets/acme-invent-01-design-packet/README.md", "docs/design/packets/acme-invent-01-design-packet/domain_model_v0.md", "docs/design/packets/acme-invent-01-design-packet/decision_register_v0.md", "docs/design/packets/ddd-arch-01-design-packet/practical_picture_v0.md", "docs/context/team/agents/planning_surface_workflow.md"]
updated: 2026-09-03
---

# ACME-INVENT-01 — slice decomposition v0

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 | **Author:** Axium | **Status:** stories created on the board under [EP-06 (#37)](https://github.com/gstookey/rr/issues/37); **none activated** (rule 16)

One slice = one story = one PR (or a short arc branch with slice PRs, integration PR to `main`), each click-ready to Graham, each closed only when its **proof** passes as a literal test Vera can run. Slices are sequential except where noted. Every slice ships its docs: ADR-style notes in the packet's ruling log, `CURRENT_STATE.md` promotion of what is now *implementation truth*, and the C4 container diagram redrawn.

| Slice | Story | Scope | Proof (the test that closes it) | Lane |
|---|---|---|---|---|
| **S0** | [S-18 (#38)](https://github.com/gstookey/rr/issues/38) — Foundation | npm-workspaces layout (`apps/ packages/ services/`), TS 6.0 / Angular 22.1 / NgRx 22 / Node 22.23.2 pins, **Sheriff fences** (`sheriff.config.ts`), `scripts/local-ci.sh` (lint · typecheck · Sheriff · Vitest · build · corpus check), docker-compose (Keycloak 26.7 + Postgres 18) with realm JSON (AI-D8), mock OIDC stub for CI-side (AI-D7), seed loader (AI-D12), ACME lexicon card | a cross-Floor import fails `local-ci.sh`; `docker compose up` yields a Keycloak with the four groups and eight personas | Kepler → Verin → Vera |
| **S1** | [S-19 (#39)](https://github.com/gstookey/rr/issues/39) — The Building | `apps/shell` (lobby, elevator, sign-in/out, error), `services/gateway` (Express 5, openid-client, Postgres sessions, `/api/me`, `/api/config` with per-group manifest), `@rr/auth` (`PermissionStore`, `CanMatchFn`), `@rr/config`, `@rr/ui` (AstroUXDS façade + RR tokens; light Cadence mockup pass first), `@rr/markings` with the ACME vocabulary served at runtime | sign in as Ada → lobby shows Warehouse · Control · Status · Front Desk; as Fay → Status only; a banner renders from `/api/config`'s vocabulary; no token in the browser | Cadence (mockups) → Marlow → Verin → Vera |
| **S2** | [S-20 (#40)](https://github.com/gstookey/rr/issues/40) — Warehouse vertical slice | `packages/warehouse-*` (domain · data-access · feature-catalog · feature-devices), `Catalog` + `DeviceRegistry` read models via `httpResource` + Zod, `DefineProduct` / `RegisterDevice` commands, **Postgres RLS** on both tables with `SET LOCAL app.subject_*` (AI-D6), markings on every row, the **Device inspector** as a utility window (`@rr/windows`, AI-D10), outbox table + in-process dispatcher (AI-D3) | Ada (`TTW`) and Dee (`MER`) hit the same `/api/warehouse/devices` and see disjoint rows; a `RegisterDevice` by Ada appears in her registry with its marking; the inspector opens as a window over any Office | Marlow → Verin → Vera |
| **S3** | [S-21 (#41)](https://github.com/gstookey/rr/issues/41) — Status live read model | `services/telemetry-sim` (AI-D2), `FleetBoard` + `OfflineDevices` read models, the **SSE endpoint** with per-subscriber projection, `@rr/store-features/withEventStream`, Status Floor (Fleet Suite, Fleet board Office) | a simulated `PositionReported` for a TTW device reaches Ada's board without refresh; Fay sees only `TTW/NWL` devices; Dee's connection never receives a TTW event | Marlow → Verin → Vera |
| **S4** | [S-22 (#42)](https://github.com/gstookey/rr/issues/42) — Tailoring proof | manifest tailoring (MER without Status; Northwind Status-only), theme tokens per group, copy overrides, capability flags in `/api/config`, rung-1 spec bag (MER's fitness attributes) | **a third fictional manufacturer is added by seed + realm + manifest with zero code changes** and gets a working Building; MER's product page shows `fitness.*` specs from data | Marlow → Verin → Vera |
| **S5** | [S-23 (#43)](https://github.com/gstookey/rr/issues/43) — The map | `@rr/map` façade over CesiumJS with a bundled local base layer and **no network** (AI-D1), *Device on map* Office, last-known positions for offline devices | Fay's map shows 40 devices, offline ones flagged with last-known position; the page loads with the network disabled | Marlow → Verin → Vera |
| **S6** | [S-24 (#44)](https://github.com/gstookey/rr/issues/44) — Control | `packages/control-*`, `Campaign` with **approval process as data** (TTW 1 step, MER 2 steps + comment — AI-D5), `DistributionVector` config, **Entitlement** policy for `ActivateFeature` (AI-D4), events `CampaignDispatched` / `FeatureActivated` consumed by Status | Bram's campaign needs one approval, Dee's needs two; `ActivateFeature` on an unentitled device is refused with a typed reason; a dispatched update shows on Status's board via the event | Marlow → Verin → Vera |
| **S7** | [S-25 (#45)](https://github.com/gstookey/rr/issues/45) — Front Desk | Front Desk Floor (People · Groups Suites), *Manage my group* Office over the Keycloak admin API, FGAP V2 scopes in the realm JSON | Cy adds a member to TTW and cannot see or touch MER; Gus can do both; audit events show in Keycloak's admin log | Marlow → Verin → Vera |
| **S8** | closeout (folded into S7's story) | README walkthrough, C4 container view as implementation truth, `CURRENT_STATE.md` promotion, lessons into `platform/` | the island team can run it from the README alone | Rin |

**Not in v0 (v1 slice candidates, register DA-D15/D16/D18/D20):** OpenFeature/flagd, OPA/Cedar beside RLS, XState for the process definition, Storybook, Playwright, Kafka via Strimzi replacing the in-process dispatcher.

## Sequencing notes

- S0 → S1 → S2 are strictly sequential (each is the next one's substrate). S3 and S4 can run in parallel after S2. S5 needs S3. S6 needs S2 and S3. S7 needs S1 only and may run any time after it.
- Cadence's mockup pass (shell, lobby, Floor chrome, the window chrome) happens **inside S1** before Marlow builds; it is light by design — the seams are the product, not the polish.
- Every PR carries the "Doctrine consulted" line (rule 17) naming the DDD-ARCH-01 docs it obeyed, and the merge gate is Graham's click (rule 15).

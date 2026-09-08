---
schema: corpus-doc/v1
status: exploratory
title: ACME-WORKSHOP-01 — Decision Register v0 (AW-D1..AW-D12)
areas: [system-architecture, domain-driven-design, frontend, backend, planning]
related: ["docs/design/packets/acme-workshop-01-design-packet/README.md", "docs/design/packets/acme-workshop-01-design-packet/slice_decomposition_v0.md", "docs/design/packets/ddd-arch-01-design-packet/decision_register_v0.md"]
updated: 2026-09-08
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
| **AW-D13** | **Compartment subsumption** (surfaced by the AD, KI-5). Does `TTW` dominate `TTW/NWL`? | A yes — a manufacturer sees its B2B customers' devices; the customer sees only its own · B no — sibling compartments | **A** | S2/S3 | **RULED A (Graham, 2026-09-04)** |
| **AW-D14** | **"Telemetry" lexicon** (AD KI-4): the ACME device feed vs platform observability | A Telemetry = device feed; *observability* for the platform sense · B the reverse | **A** | — | **RULED A (Graham, 2026-09-04)** |
| **AW-D12** | **Where seed data lives.** | A JSON under `services/gateway/seed/` loaded by a script · B SQL migration | **A** | S0 | open |


## S1 rulings (Axium, 2026-09-08) — answers to Cadence's mockup-pass questions

Design questions the S1 mockups surfaced. Ruled here so Marlow builds against a decision rather than a guess. Architectural, in Axium's lane; Graham may overturn any of them.

| # | Question | Ruling |
|---|---|---|
| **AW-D15** | Per-Floor **manifest shape**, and is order meaningful? | `{ id, label, route, blurb, order }` — **all of it is manifest data**; the shell holds no Floor list and no label map. **Order is meaningful: render as served, never sort client-side.** Canonical order is the capability Floors in packet order (Invent · Command · Vigilance) with **Front Desk last** (it is the generic Floor). The S0 manifest's front-desk-first order was an accident of authoring — S1 corrects it. |
| **AW-D16** | Does the manifest carry a **Building-level marking**? | **Yes** — the group's own marking (`INTERNAL//TTW`, `PARTNER//TTW/NWL`), used for the Lobby and for any Floor with no rows loaded. It is the *surface's* marking, never the subject's clearance. The rule for rows marked higher than their surface is **S2's**, not S1's. |
| **AW-D17** | Carry a **`landingFloor`** for single-Floor manifests? | **Optional field, honoured when present; the Lobby always exists regardless.** Fay needs somewhere to stand when her one Floor fails and somewhere to sign out from. A Building with no Lobby has no fail-closed state. |
| **AW-D18** | The **route and endpoint names**. | Confirmed as drawn. Browser navigations: `/` (Lobby) · `/sign-in` · `/auth/login` · `/auth/callback` — deliberately **not** under `/api`, because they are navigations, not data. Data: `/api/me` · `/api/config`. |
| **AW-D19** | Where do **typed error codes** live? | **`@rr/common`**, as one exported union shared by the gateway and the shell, so the string the user reads and the string the log records are the same string. S1 mints exactly three: `CONFIG_UNAVAILABLE` (already real in the gateway), `SESSION_EXPIRED`, `SIGN_IN_FAILED`. |
| **AW-D20** | **Group display name** — resolved where? | **`/api/me` returns it resolved.** No component maps a group path to a label; a path-to-label map in the front end is a tenant list in disguise. |
| **AW-D21** | **Clearance chip** as compartment sets grow. | Show two compartments plus `+n`; full set on hover/focus title. **Never a scrollbar in chrome.** |
| **AW-D22** | **Token prefix**: `--rr-*` vs `--acme-*`. | **The base library owns the slot names (`--rr-*`); the tenant theme supplies the values.** `@rr/markings` and `@rr/ui` reference only `--rr-…` custom properties and ship **no** level names, compartment names or colours; ACME's theme stylesheet defines `--rr-marking-level-bg` etc. and may use `--acme-*` internally for its own brand values. This is the unclassified-base / tenant-overlay split expressed in CSS, and it is one of the things S1 exists to demonstrate. |
| **AW-D23** | Does the **elevator rail persist on the Lobby**? | **No** — the Lobby is full-width; the directory *is* the page. The rail appears on Floors. (Cadence's call, accepted.) |

**Ambiguities Cadence surfaced, resolved:** *"the window chrome"* appears in the packet's fleet line but not in the S1 scope row — **the scope row wins; no `@rr/windows` in S1** (S1 has no Office to host a window over; AW-D10 lands in S2). *"Floor chrome"* with no Floor in S1 = Building chrome **with a Floor selected** (breadcrumb, current-Floor bar, labelled empty slot). **Banner top and bottom** is kept — exercising the mechanism is the study's job — with the bottom band permitted to collapse below a small-viewport breakpoint.

## Ruling log

| Date | Fork | Ruling | Consequence |
|---|---|---|---|
| 2026-09-04 | **AW-D13** compartment subsumption | **A** — `TTW` dominates `TTW/NWL`: a manufacturer sees the devices its B2B customers operate; the customer sees only its own. | The dominance predicate is `subject_compartments ⊇ row_compartments` **with prefix subsumption**: holding `TTW` satisfies a row marked `TTW/NWL`. Binds `packages/common` `dominates()`, the Postgres RLS policy, and slice S3's per-subscriber SSE filter. |
| 2026-09-08 | **AW-D15..AW-D23** | S1 design rulings (table above) | Bind the S1 manifest shape, error codes, token contract and chrome behaviour. |
| 2026-09-04 | **AW-D14** the "telemetry" lexicon | **A** — **Telemetry** is the ACME device feed (an external bounded context); the platform sense is **observability**. | Binds every doc, label, package and diagram; AD KI-4 closes. |

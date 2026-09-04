---
schema: corpus-doc/v1
status: exploratory
title: ACME-WORKSHOP-01 — Domain model v0 (contexts, aggregates, events, read models, tenants, lexicon)
areas: [domain-driven-design, system-architecture, backend, frontend]
related: ["docs/design/packets/acme-workshop-01-design-packet/README.md", "docs/design/packets/acme-workshop-01-design-packet/slice_decomposition_v0.md", "docs/design/packets/ddd-arch-01-design-packet/needs_catalog_v0.md", "docs/design/packets/ddd-arch-01-design-packet/context_boundary_test_v0.md"]
updated: 2026-09-03
---

# ACME Workshop — domain model v0

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 | **Author:** Axium | **Status:** `exploratory` — an invented domain, deliberately shaped like the real work; every name below is fictional

## Tenants and personas (seed data)

| Group (Keycloak) | Kind | Compartment | Gets Floors | Personas |
|---|---|---|---|---|
| **Tick-Tock Watchworks** (`TTW`) | manufacturer | `TTW` | Invent · Command · Vigilance · Front Desk | *Ada* (inventory manager), *Bram* (release engineer), *Cy* (TTW group admin) |
| **Meridian Wearables** (`MER`) | manufacturer | `MER` | Invent · Command · Front Desk (**no Vigilance** — proves manifest tailoring) | *Dee* (inventory), *Eli* (MER group admin) |
| **Northwind Logistics** | B2B customer of TTW, operates 40 TTW devices | `TTW/NWL` | Vigilance only (own devices only) | *Fay* (fleet supervisor) |
| **ACME staff** | platform operator | all | everything + Front Desk realm admin | *Gus* |

Two users with different attributes seeing different rows from the same endpoint (slice S2's proof) = Ada (`TTW`) vs Dee (`MER`) on `/api/invent/devices`; Fay sees only `TTW/NWL` rows on `/api/vigilance/fleet`.

## Contexts

### Front Desk — Identity & Access (generic)
- **Owns nothing domain-shaped.** Keycloak owns users/groups/roles; the Floor is UI over the Keycloak admin API scoped by FGAP V2.
- Read models: `MyGroupMembers`, `GroupRoles`. Commands: `InviteMember`, `RemoveMember`, `GrantRole` (within own group only).
- Lexicon: *member* (a person in a group), *group* (a tenant or a B2B sub-tenant — **an organisational unit AND a compartment here, by construction**, which is the R5 Q3 decision made explicit for the showcase), *role* (Keycloak role).

### Invent — Inventory (core)
- Aggregates: **Product** (a device *model*: name, device class, spec sheet as an extensible attribute bag — rung 1 lives here; lifecycle draft → published → retired), **Device** (a serialised *unit* of a Product: serial, firmware, owner group, operator group, registered → provisioned → in-service → decommissioned).
- Events: `ProductDefined`, `ProductSpecsChanged`, `ProductRetired`, `DeviceRegistered`, `DeviceProvisioned`, `DeviceDecommissioned`.
- Read models: `Catalog` (products per manufacturer), `DeviceRegistry` (devices with product, firmware, operator, marking).
- Commands: `DefineProduct`, `ChangeSpecs`, `RegisterDevice`, `ProvisionDevice`, `Decommission`.
- Lexicon: *product* = a model; *device* = a unit; *device class* = wearable / fitness / … (data, not enum); *spec* = an attribute in the bag.

### Command — Device Tasking (core)
- Aggregates: **Campaign** (a tasking of a device set: payload = software update | instruction | feature activation; target = a device selection; **approval process as data** — TTW requires one sign-off, MER requires two + a comment: rung 2, showcased), **DistributionVector** (per manufacturer config: `server-push`, `sms`, `email`, with enable/priority), **Entitlement** (device × feature × paid-until; the paywall — rung 3 policy: `FeatureActivation` is refused unless an entitlement is current).
- Events: `CampaignCreated`, `CampaignApproved`, `CampaignDispatched`, `UpdatePushed`, `FeatureActivated`, `FeatureActivationRefused`, `VectorConfigured`, `EntitlementGranted`.
- Read models: `Campaigns`, `Vectors`, `Entitlements`. Commands: `CreateCampaign`, `Approve`, `Dispatch`, `ActivateFeature`, `ConfigureVector`, `GrantEntitlement`.
- Consumes from Invent: `DeviceRegistered` (to know targets) — **customer-supplier**, Invent upstream; Command keeps its own `TargetDevice` projection (ACL), never reads Invent tables.
- Lexicon: *campaign* (a tasking), *push* (delivery over a vector), *instruction* (what a campaign delivers to a device — never "command", which is the Floor when capitalised and the CQRS write message when not), *activate* (a feature, never a device), *vector* (a delivery channel), *entitlement* (paid right).

### Vigilance — Situational Awareness (core)
- Aggregates: thin — Vigilance is mostly **projections**: `FleetDevice` (device, operator, last position, health, online/offline, last-seen), `DevicePosition` history (bounded).
- Consumes: `DeviceRegistered`/`DeviceDecommissioned` (Invent), `UpdatePushed`/`FeatureActivated` (Command), `PositionReported`/`HealthReported` (a **simulated telemetry feed** — a small generator in `services/telemetry-sim`, AW-D2).
- Read models: `FleetBoard` (table), `FleetMap` (positions for the map), `OfflineDevices`. Commands: none in v0 (SA is read-only; a `RequestCheckIn` command via Command is a v1 idea).
- Lexicon: *fleet* (the devices a group operates), *health* (a device's reported state — never "status", a word the lexicon leaves generic), *online/offline*, *last known*.

## The published language (`@rr/common`)

One module per context, Zod 4 schemas + inferred types; events as discriminated unions with a `marking` on every envelope; DTOs shaped per read model; `commandId` on every command. `z.toJSONSchema()` generates the BFF's OpenAPI document. No context imports another's module except through the events it consumes.

## Rung demonstrations (Boundary Test ladder, made concrete)

| Rung | Shown by |
|---|---|
| 1 data | Product spec sheet as an attribute bag; MER's products carry `fitness.heartRateSensor`, TTW's do not; no schema change |
| 2 steps | Campaign approval process per manufacturer as data (1 step vs 2 steps + comment) |
| 3 rules | Entitlement policy for feature activation (paywall) |
| 4 UI | Manifest: MER has no Vigilance Floor; Northwind has *only* Vigilance |
| 5 Suite | *Entitlements* Suite exists for manufacturers, absent for B2B customers (claim-entitled) |
| 6 Floor | none in v0 — and that is the point: four contexts, four Floors, every tenant variation below rung 6 |

## Seed data shape

Fictional, generated, committed as JSON under `services/gateway/seed/`: 2 manufacturers, 6 products, ~120 devices, 1 B2B operator with 40 devices, 3 campaigns in different approval states, positions in a bounded box (invented coordinates, land-only), health values, markings per row.

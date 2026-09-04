---
schema: corpus-doc/v1
status: active
title: Design
areas: [brand-design, planning]
related: ["docs/design/brand/README.md"]
updated: 2026-09-03
---

# Design

**Created:** 2026-08-25 | **Last updated:** 2026-09-03 (packets `ddd-arch-01` and `acme-workshop-01` added)

Design direction — future intent, never implementation truth (operating-contract rule 8).

- `brand/` — visual identity: palette, type, logo usage, AstroUXDS token overrides.
- `packets/` — design packets (`<TOPIC>-NN-design-packet/README.md` + decision register), the unit of design work Axium cuts and Graham accepts.
  - [`acme-workshop-01-design-packet/`](packets/acme-workshop-01-design-packet/README.md) — **ACME Workshop**, the DDD reference application (2026-09-03, `exploratory`, EP-06 #37, stories S-18..S-25, **not activated**): a fictional smart-watch-manufacturer hub (Front Desk · Invent · Command · Vigilance) built in the real `apps/ packages/ services/` layout as the walking skeleton of DDD-ARCH-01 and the LOE-8 scaffold.
  - [`ddd-arch-01-design-packet/`](packets/ddd-arch-01-design-packet/README.md) — Desert Island system architecture, front-end-first (2026-09-03, `exploratory`, side-quest beside Milestone 1): decision register DA-D1..DA-D10, tier-model exploration (Building / Floor / Suite / Office), diagramming approach, seed C4 diagrams. Base corpus: `docs/context/platform/research/`.
  - [`ng-hop-02-v18-to-v19-design-packet/`](packets/ng-hop-02-v18-to-v19-design-packet/README.md) — Angular v18→v19 hop (2026-08-28, `exploratory`): **rehearsed** runbook v1 + v19 bundle manifest incl. the combined v18+v19 registry cost. **Reaches Milestone 1's floor.**
  - [`ng-hop-01-v17-to-v18-design-packet/`](packets/ng-hop-01-v17-to-v18-design-packet/README.md) — Angular v17→v18 hop (2026-08-26, `exploratory`): **rehearsed** runbook v1 + measured v18 bundle manifest. First hop toward Milestone 1.
  - [`iso-net-readiness-01-design-packet/`](packets/iso-net-readiness-01-design-packet/README.md) — Isolated-Network Readiness (2026-08-25, `exploratory`, proposed not activated): island questionnaire, legacy-estate inventory template, pinned stack manifest, day-one runbook, decision register DR-01..DR-09, story candidates S-01..S-06.
- `mockups/` — Cadence's HTML/static mockups, served by the `mockups` launch config on port 8137. None yet.

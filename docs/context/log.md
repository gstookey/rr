# RR Context Log

<!-- Convention (BS-14): one `# [YYYY-MM-DD] <type> | <title>` header level, newest-first — prepend below this comment. Types: ingest | decision | milestone | lint | governance | session -->

# [2026-08-26] milestone | Two-island model captured; board stood up (EP-01..EP-05, S-01..S-17); Milestone 1 named

Graham's direction (2026-08-26) corrected a structural error in the context system: the target is **two** isolated environments, not one. **Legacy Island** — 10+ Angular v17 apps on **Node 22.15**, must reach **v19 minimum** (v22 preferred, effort decides). **Desert Island** — greenfield, nothing on it; the new system is built and lives there. They deploy into a related cluster and must stay **stack-synchronized**, so Legacy Island's achieved target sets Desert Island's. Driver is **security exposure** in Angular 17 / Node 22.15, not modernization. New canonical page `canonical/two_island_model.md`; `project_overview.md`, `isolated_network_constraints.md` (now tagged [L]/[D]/[both]), `CURRENT_STATE.md` and `current_priorities.md` updated.

**Milestone 1 = "Legacy Island to Angular 19 minimum"** — Graham's first objective; `current_priorities.md` reoriented around it. No GitHub milestone object exists yet (not creatable with this session's tooling).

**Board (Graham approved the structure).** Epics: EP-01 Readiness & Discovery (both islands) · EP-02 Offline Supply Chain & Transfer Bundles · EP-03 Legacy Island Angular v17→v19+ (carries M1) · EP-04 Desert Island environment stand-up · EP-05 Desert Island scaffolds & stack docs (placeholder, no stories). Seventeen stories S-01..S-17 created as sub-issues, including one **transfer bundle per sequential Angular hop** (S-07..S-11) per Graham's request. **Nothing activated** — creation is not activation (rule 16). Story identifiers were renumbered from the 2026-08-25 draft; mapping table is in `story_decomposition_v0.md`. Convention flagged for approval: stories carry an `S-nn:` title prefix, which the workflow doc does not yet specify.

**Headline verified finding (registry, 2026-08-25).** Node 22.15 already satisfies Angular **18, 19, 20 and 21**; only **v22** needs newer (`^22.22.3 || ^24.15.0 || >=26.0.0`), and only a *patch* bump inside 22.x. **Milestone 1 therefore requires no Node change**, and the Angular and Node upgrades are decoupled. DR-03 is substantially de-risked but **not closed** (change-control permission is still unknown); the binding constraint on the v22 stretch is now **estate difficulty**, which only the inventory measures. Separately: Node 22.15 (2025-04-22) is ~15 months and 8 patches behind its own still-LTS line (current 22.23.2), so the patch bump is worth doing on security grounds alone — the cheapest risk reduction in the programme.

Governance: **C-007** opened (singular "the island" phrasing vs. two islands; canonical pages resolved, residual prose for Rin) and **C-008** (Desert Island's v22 pins vs. Legacy Island's achievable target — accepted tension, expires when DR-04 closes). **DR-10** added (how strictly and when the two stacks must match). No ADR written; no decision closed.

# [2026-08-25] milestone | Isolated-Network Readiness Packet cut (`iso-net-readiness-01`, docs-only, proposed not activated)

Axium, second RR session, branch `claude/isolated-network-readiness-6fzogv`. Cut `docs/design/packets/iso-net-readiness-01-design-packet/`: island questionnaire (network unknowns → answerable questions), legacy-estate inventory template (the instrument LOE-6 cannot be sized without), version-pinned stack manifest with pins verified live against `registry.npmjs.org` and a **measured** bundle footprint (521 packages, ≈89 MB tarballs, ≈436 MB unpacked; Verdaccio ≈11 MB / 62 MB), unrehearsed day-one runbook, decision register DR-01..DR-09, story candidates S-01..S-06. Registry findings worth carrying: Angular 22.1.3 requires Node `^22.22.3 || ^24.15.0 || >=26.0.0` and TypeScript `>=6.0 <6.1` (only 6.0.2/6.0.3 exist; `typescript@latest` is 7.0.2 — a hand-packed "latest of everything" bundle cannot build); Node 24.19.0 is the current Active LTS; Express `latest` is 5.2.1, ahead of the source blueprints. Proceeded on C-001's open layout half (`apps/*` + `packages/*`) as a stated assumption, not a resolution. **No board issues created; nothing activated; no decision closed.**

# [2026-08-25] decision | ADR-004 accepted — npm for RR and the legacy estate

Graham: "npm it is. Lock it in." pnpm/corepack swept from harnesses, `launch.json`, coder docs; `@rr/*` package scope. C-001 package-manager half resolved; layout half open (working assumption `apps/*` + `packages/*`).

# [2026-08-25] ingest | SRC-012 — Graham's RR description landed and synthesized

`evidence/raw/project-road-runner-description.txt` (main 9852e23). RR is a program stand-up on a fully isolated network with **no agent access on the island**; eight lines of effort incl. a 10+ app Angular v17→v19/v22 legacy upgrade and one-way bundle transfer. Rewrote `canonical/project_overview.md`, updated `isolated_network_constraints.md` and `current_priorities.md`. C-006 resolved.

# [2026-08-25] decision | ADR-004 proposed — npm over pnpm

Axium recommendation, awaiting Graham. Rationale in the ADR; C-001 package-manager half pending acceptance, layout half still open.

# [2026-08-25] milestone | M0 — context system initialized (branch `feat/rr-context-init`; rebased on main 9852e23)

Axium, first RR session. Stood up the full context skeleton assumed by `AGENTS.md` and the harnesses; filled empty root files; wrote ADR-001..003, contradiction register C-001..C-006, `planning_surface_workflow.md`; fixed 120 broken links/paths and 104 corpus-graph violations; scrubbed TrAIdit residue; registered SRC-001..SRC-012. Plan and assessment: `operations/sessions/2026-08-25_repo_initialization_plan.md`. Awaiting Graham's merge.

# [2026-08-25] decision | ADR-001, ADR-002, ADR-003 ratified for RR

Context system + fleet adopted from TrAIdit (ADR-001); merge gate (ADR-002); board=status/docs=doctrine (ADR-003; inherited "ADR-008" citations retargeted).

# [2026-08-25] governance | Contradictions C-001..C-006 opened

Headline: C-001 monorepo layout / package manager (npm `client/common/server` vs pnpm `apps/*`) — first real architecture decision, Graham-gated. C-006: project description not yet in repo.

# [2026-08-25] ingest | Source register created (SRC-001..SRC-012)

Brand guide, AstroUXDS transcripts, Angular 22 / Vitest / monorepo / Helm blueprints, upgrade guides, logo candidates registered in place. SRC-012 (Graham's project description) pending.

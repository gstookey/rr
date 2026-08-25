# RR Context Log

<!-- Convention (BS-14): one `# [YYYY-MM-DD] <type> | <title>` header level, newest-first — prepend below this comment. Types: ingest | decision | milestone | lint | governance | session -->

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

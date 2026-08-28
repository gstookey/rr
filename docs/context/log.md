# RR Context Log

<!-- Convention (BS-14): one `# [YYYY-MM-DD] <type> | <title>` header level, newest-first — prepend below this comment. Types: ingest | decision | milestone | lint | governance | session -->

# [2026-08-28] milestone | S-15 + S-08 delivered — v18→v19 hop REHEARSED; both Milestone 1 hops now written (`ng-hop-02`)

Second docket item, greenlit by Graham after PR #25 merged. The v18 application left standing by the v17→v18 rehearsal was carried forward and taken to v19 — which also **validates hop 1's output** (it rebuilt cleanly at `241.04 kB`, byte-identical to what hop 1 finished with). New packet `docs/design/packets/ng-hop-02-v18-to-v19-design-packet/` — runbook **v1** with verbatim transcript, plus the v19 bundle manifest. **This hop reaches Milestone 1's floor: both hops needed for "Legacy Island to Angular 19 minimum" are now rehearsed and written.**

**Headline: hop 2 is a different shape of hop than hop 1** — an estate plan that prices them the same will under-estimate the second. Hop 1 left source, TypeScript and zone.js untouched. Hop 2 **bumped TypeScript `5.4.5` → `5.8.3`**, **bumped zone.js `0.14.10` → `0.15.1`**, **edited source** (the standalone-components migration removed `standalone: true` from `app.component.ts` — 1 file here, but it touches *every* declarable, so expect a large diff on estate apps), offered **two** optional migrations rather than one (`use-application-builder` again, plus `provide-initializer`; both deliberately deferred — one variable per hop), and **introduced a build warning** absent at v18 on identical source (component style budget, 2.00 kB exceeded by 925 B). The warning is benign here but **an `angular.json` configuring budgets as `maximumError` would fail the build** — flagged in the runbook so it is not mistaken for upgrade damage. Mechanism `[UNVERIFIED]`.

**Rule extracted from two rehearsals, making the hop matrix predictive:** `ng update` leaves TypeScript alone when the installed version already satisfies the new Angular's peer range; when it must move, it moves to **the top of that range**. `5.8.3` is exactly what the matrix predicted for v19. Same pattern for zone.js. The matrix's "TS pin" column is therefore a reliable **upper bound and the version to carry** — `iso-net-readiness-01`'s manifest updated accordingly. Also confirmed a second time: **`ng update` downloads a temporary newer CLI before doing anything** (v19.2.27 this hop) — a rule, not a one-off; and **Karma's browser-binary gap persists** — no browser was available, so **neither hop has ever been validated by a passing test suite.**

**Measured (S-08):** v19 hop = 1,094 packages / 952 distinct tarballs / **≈70.8 MB** / ≈414 MB unpacked. More useful, because a staged estate has apps at both versions simultaneously: the **union of the v18 and v19 sets is 1,162 tarballs / ≈117.2 MB**, not the naive ≈140.8 MB — 708 tarballs are shared. Marginal cost of adding v19 to a registry that already has v18 is ≈47 MB. Two planning consequences recorded: do not budget hop bundles by addition, and do not remove the old set when the new one lands (it would strand every app not yet hopped). Both islands through Milestone 1 are on the order of **200 MB of tarballs before any estate-specific dependency** — a figure for the transfer-size conversation (questionnaire A2).

Board: S-15 (#22) and S-08 (#15) activated and delivered by comment (no Project Status field exposed via API). S-14 (#21) left **open** with a closeout note — its acceptance is not really discharged until the runbook runs against a real estate app. Nothing closed; closure is Graham-gated.

# [2026-08-26] milestone | S-14 delivered — Angular v17→v18 hop REHEARSED, runbook v1 + measured bundle manifest (`ng-hop-01`)

First docket item of the post-merge session, activated by Graham ("let's dive in"). Rather than writing the hop runbook from the upgrade guides, the hop was **actually performed** on the open-internet side: a default Angular 17.3 app created, built, tested, upgraded via `ng update @angular/core@18 @angular/cli@18`, and rebuilt. New packet `docs/design/packets/ng-hop-01-v17-to-v18-design-packet/` — runbook **v1** (rehearsed, not v0) with a verbatim transcript appendix, plus a measured v18 hop bundle manifest.

**Three findings the upgrade guides do not carry, each of which would have cost a transfer cycle to discover on the island:**
1. **`ng update` downloads a temporary newer CLI before it does anything** (`Installing a temporary Angular CLI versioned 18.2.21`). The island's registry must serve the *next* major's CLI **before** any `package.json` mentions it — seeding from "what the upgraded app declares" is not sufficient.
2. **`ng update` fetches registry metadata for every dependency**, not just Angular's (22 on a bare app; far more on real ones). Any gap in the seeded registry surfaces here.
3. **Karma launches a real browser binary, which is not an npm package** and will not be in any tarball bundle. Baseline tests failed with `No binary for ChromeHeadless browser on your platform`. If Legacy Island lacks a browser, the 10+ app upgrade proceeds **without its main regression safety net**. Added as questionnaire **B9**.

**Also observed:** TypeScript was **not** bumped (stayed `~5.4.2`; Angular 18 accepts `>=5.4 <5.6`) — correcting the implication in `iso-net-readiness-01`'s hop matrix that the top-of-window pin is required. zone.js and rxjs unchanged. The optional `use-application-builder` migration was offered and deliberately **not** run (one variable at a time). Four core migrations ran, all "No changes made" — **on an app with no code in it**; on real estate code they will make real edits, especially the `HttpClientModule` → `provideHttpClient()` one. Build succeeded before (227.26 kB) and after (241.04 kB, +6%).

**Measured v18 hop footprint** (partial delivery of S-07): 1,015 packages, 918 distinct tarballs, **≈70.0 MB** tarballs, ≈410 MB unpacked — a **floor**, from a bare app; the estate's own dependencies are unknown until S-03 returns. Registries deduplicate, so ten apps do not cost ten times this.

**Honest limits:** rehearsed on a *bare* app — no custom webpack, custom schematics, third-party UI/state libraries, or real code. Tests never actually ran. **The offline path is unrehearsed** (the rehearsal used the public registry) and is the largest remaining risk in this hop.

Board: S-14 (#21) activated by comment (this repo exposes no Project Status field via API). Docket also holds S-15 (v18→v19 rehearsal) and S-07/S-08 (bundle specs). Nothing else activated.

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

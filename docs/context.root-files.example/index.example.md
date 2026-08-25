**EXAMPLE FILE — copied from TrAIdit as a reference for how a mature `index.md` looks. Not RR doctrine; paths inside do not exist here. (banner added 2026-08-25 so the corpus graph does not parse its frontmatter)**

---
schema: corpus-doc/v1
status: active
title: TrAInit Context Wiki Index
areas: [context-system]
updated: 2026-07-17
---

# TrAInit Context Wiki Index

**Created:** 2026-03-18 | **Last updated:** 2026-07-17

## Purpose
This is the navigation spine for the repo-native TrAIdit / TrAInit context system.

`docs/context/` is the living context/wiki layer.

- `canonical/` holds synthesized current truth
- `operations/` holds milestones, workflows, reviews, sessions, and task scaffolding
- `governance/` holds decisions, contradictions, and meta rules
- `team/agents/` holds the current multi-agent operating model
- `platform/` holds reusable TrAInit-level models and future direction
- `evidence/` holds raw source notes and visual artifacts

---

# Start Here

- [Context README](README.md)
- [Repo AGENTS](../../AGENTS.md)
- [Corpus Graph Index (generated)](corpus_graph_index_v0.md) — the machine-discoverable doc graph; pre-build lookup (contract rule 17): `node scripts/corpus-graph.mjs lookup <repo-path-or-term>`; clickable viewer (generated, self-contained — open directly in a browser): [`corpus_graph_viewer.html`](corpus_graph_viewer.html), whose Contents tab lazy-loads doc bodies from the fourth generated artifact, `corpus_graph_content.js`
- [Context Bootstrap](bootstrap/START_HERE.md)
- [Design README](../design/README.md)
- [Context Log](log.md)
- [Document Hierarchy Overview](governance/meta/trainit_doc_overview.md)
- [CURRENT_STATE](../CURRENT_STATE.md)

When design and implementation disagree, [CURRENT_STATE](../CURRENT_STATE.md) is the operational source of truth.

---

# Design

- [Design README](../design/README.md)
- [Design v2 README](../design/v2/README.md)
- [Business Research Design](../design/v2/business-research/README.md)
  - [ALGO-RESEARCH-01 - Algo Trading Vernacular / Strategy Taxonomy / Platform Scan](../design/v2/business-research/algo-research-01-algo-trading-vernacular-platform-scan/README.md)
- [QUANT-SERVICE-01 - Python Quant Service Design Packet (LANDED 2026-07-06, D1–D8 resolved)](../design/v2/algo/quant-service-01-design-packet/README.md)
  - [QUANT-SERVICE-01 Decision Register v0 (RESOLVED)](../design/v2/algo/quant-service-01-design-packet/decision_register_v0.md)
  - [EP-12 Story Decomposition v0](../design/v2/algo/quant-service-01-design-packet/ep12_story_decomposition_v0.md)
  - [QS-01 Review Ledger v0 (fleet run record, observations carried to QS-02/QS-03)](../design/v2/algo/quant-service-01-design-packet/qs01_review_ledger_v0.md)
  - [QS-02 Review Ledger v0 (fleet run record, carried observations, cost-register numbers)](../design/v2/algo/quant-service-01-design-packet/qs02_review_ledger_v0.md)
  - [QS-03 / QS-04 Review Ledger v0 (fleet run records, carried observations, multi-symbol provenance design decision)](../design/v2/algo/quant-service-01-design-packet/qs03_qs04_review_ledger_v0.md)
  - [Tier-2 Cross-Sectional Scope v0 (QS-05 scoping packet + Bessel's shape ruling)](../design/v2/algo/quant-service-01-design-packet/tier2_cross_sectional_scope_v0.md)
  - [QS-05 Review Ledger v0 (fleet run record, observations, cross-sectional precedents, QS-06 forward note)](../design/v2/algo/quant-service-01-design-packet/qs05_review_ledger_v0.md)
  - [Sector Taxonomy Scope v0 (QS-07/AS-05 scoping packet + Bessel's reference-lane shape ruling)](../design/v2/algo/quant-service-01-design-packet/sector_taxonomy_scope_v0.md)
  - [QS-07 Review Ledger v0 (reference-lane fleet run — Bessel F1, Gosset O1–O4, eight reference-lane precedents, layer law)](../design/v2/algo/quant-service-01-design-packet/qs07_review_ledger_v0.md)
- [ALGO-SURFACE-01 - Algo Surface Design Packet (workbench-manager / canvas-dashboard interplay; reconciled v0.1 2026-07-10)](../design/v2/algo/algo-surface-01-design-packet/README.md)
  - [ALGO-SURFACE-01 Decision Register v0 (AD-1..AD-8)](../design/v2/algo/algo-surface-01-design-packet/decision_register_v0.md)
  - [Story Decomposition v0.1 (AS-01..AS-04 + AS-02.5 under umbrella #143)](../design/v2/algo/algo-surface-01-design-packet/story_decomposition_v0.md)
  - [AS-01 Review Ledger v0 (fleet run record, carried items, follow-up queue, precedents)](../design/v2/algo/algo-surface-01-design-packet/as01_review_ledger_v0.md)
  - [AS-02 Review Ledger v0 (fleet run record, carried observations, precedents)](../design/v2/algo/algo-surface-01-design-packet/as02_review_ledger_v0.md)
  - [AS-02.5 Review Ledger v0 (fleet run record, carried observations, precedents)](../design/v2/algo/algo-surface-01-design-packet/as025_review_ledger_v0.md)
  - [AS-03 Review Ledger v0 (fleet run record, closures, carried items, precedents)](../design/v2/algo/algo-surface-01-design-packet/as03_review_ledger_v0.md)
  - [AS-04 Review Ledger v0 (Algo capstone — Market Context fleet run, carried items #222/#223, precedents)](../design/v2/algo/algo-surface-01-design-packet/as04_review_ledger_v0.md)
  - [Tranche-1 UI Feedback Ledger v0 (Graham's 2026-07-11 UI-review corpus — T1a visual + T1b functional, outcomes, precedents)](../design/v2/algo/algo-surface-01-design-packet/tranche1_ui_feedback_ledger_v0.md)
  - [AS-05 Review Ledger v0 (Market Context Live — cleanup corpus + web slice, five catch-and-fix rounds, Cadence L2–L5, carried items)](../design/v2/algo/algo-surface-01-design-packet/as05_review_ledger_v0.md)
  - [Post-AS-05 Cleanup Run Ledger v0 (Simulator access via the workbench rack, glyph integrity, the #236 directional-posture doctrine-amendment record, plain-language cards; Cadence L6/L7, carried items)](../design/v2/algo/algo-surface-01-design-packet/post_as05_cleanup_ledger_v0.md)
- [Workstation UI Design](../design/v2/workstation-ui/README.md)
  - [UI Debt Ledger v0](../design/v2/workstation-ui/ui-debt-ledger/README.md)
  - [REGION-RESIZE-01 — Workstation Region Resize System (spec + review ledger)](../design/v2/workstation-ui/region-resize-01/README.md)
  - [Selected Decision Dashboard v0](../design/v2/workstation-ui/selected-decision-dashboard-v0/README.md)
  - **UI canons (workstation-wide, `governs: apps/web/src/app/**`):**
    - [UI Copy Discipline — Show, Don't Tell v0](../design/v2/workstation-ui/ui_copy_discipline_show_dont_tell_v0.md)
    - [Label Capitalization and Casing Canon v0](../design/v2/workstation-ui/label_capitalization_and_casing_canon_v0.md)
    - [Workstation Loading-State Doctrine v0](../design/v2/workstation-ui/loading_state_doctrine_v0.md) — spinner / pulse / resolve / ⊘ failed; design-locked 2026-07-18 (#223); packet: [loading-state-doctrine-223](../design/v2/workstation-ui/loading-state-doctrine-223/README.md)
- [UTILITY-WINDOW-SYSTEM — Generic Floating-Window / Dialog / Detachment System (COMPLETE on `main` `c7eeabf`, 2026-07-14; integration PR #307, slices 1–6)](../design/v2/utility-window-system/README.md)
  - [Arc Build Status v0 (live continuation anchor)](../design/v2/utility-window-system/utility-window-01-design-packet/arc_build_status_v0.md)
  - [Decision Register v0 (UWS-D1..D8, all A, 2026-07-13)](../design/v2/utility-window-system/utility-window-01-design-packet/decision_register_v0.md)
  - [Architecture v0 (design rulings folded)](../design/v2/utility-window-system/utility-window-01-design-packet/architecture_v0.md)
  - [Detachment and Document-PiP Model v0](../design/v2/utility-window-system/utility-window-01-design-packet/detachment_and_pip_model_v0.md)
  - [Implementation Decomposition v0 (six-slice plan)](../design/v2/utility-window-system/utility-window-01-design-packet/implementation_decomposition_v0.md)
  - [UWS Review Ledger v0 (per-slice fleet run record)](../design/v2/utility-window-system/utility-window-01-design-packet/uws_review_ledger_v0.md)
  - [Mockups gallery + design note + rulings](../design/v2/utility-window-system/utility-window-01-design-packet/mockups/)
- [Market Ontology Design](../design/v2/market-ontology/README.md)
  - [MARKET-ONTOLOGY-01 - Stock Market Structure / Symbol Metadata / Market Ontology Substrate](../design/v2/market-ontology/market-ontology-01-stock-market-structure-symbol-metadata-substrate/README.md)
- [Historic Simulator Design](../design/v2/historic-simulator/README.md)
  - [SIM-MARKERS-01 - Decision Marker Overlay Skeleton / Static Mock Evidence](../design/v2/historic-simulator/sim-markers-01-decision-marker-overlay-skeleton/README.md)
  - [SIM-LEGEND-01 - Simulator Display Layer Legend / Agent Version Visibility Controls](../design/v2/historic-simulator/sim-legend-01-simulator-display-layer-legend/README.md)
  - [WDA-VERSION-GRAPH-01 - Version Equity Graph / Symbol Contribution Controls / Cross-View Color Ontology](../design/v2/workstation-ui/mockups/historic-simulator/wda-version-graph-01/README.md)
- [Portfolio Core Design](../design/v2/portfolio-core/README.md)
  - [PORTFOLIO-CORE-01 - Environment-Agnostic Trading Account / Portfolio Book / Execution Event / Portfolio Accounting Foundation](../design/v2/portfolio-core/portfolio-core-01-environment-agnostic-account-execution-accounting-foundation/README.md)
  - [PORTFOLIO-CONTRACTS-01 - Exact Numeric Values / Account-Book Context / Order-Fill-Ledger Event Contracts](../design/v2/portfolio-core/portfolio-contracts-01-exact-values-order-fill-ledger-contracts-implementation/README.md)
  - [PORTFOLIO-NUMERIC-01 - Explicit Division / Quantization / Rounding / Conservation Doctrine](../design/v2/portfolio-core/portfolio-numeric-01-explicit-division-quantization-rounding-conservation-doctrine/README.md)
  - [PORTFOLIO-LEDGER-01 - Cash / Position / Weighted-Average-Cost Accounting Reducer](../design/v2/portfolio-core/portfolio-ledger-01-cash-position-weighted-average-cost-accounting-reducer/README.md)
  - [SIM-EXECUTION-01 - Historic Simulator Execution / Fill Adapter](../design/v2/portfolio-core/sim-execution-01-historic-simulator-execution-adapter/README.md)
    - [SIM-EXECUTION-01 Implementation Packet](../design/v2/portfolio-core/sim-execution-01-historic-simulator-execution-adapter/implementation_packet/README.md)
  - [PORTFOLIO-VALUATION-01 - Equity Snapshot Doctrine](../design/v2/portfolio-core/portfolio-valuation-01-equity-snapshot-doctrine/README.md)
- [WALLET-01 — Wallet / Capital Allocation Design Packet (EP-30; v0 COMPLETE on `main` `7029be07`, 2026-07-17)](../design/v2/wallet/wallet-01-design-packet/README.md)
  - [Wallet — Design Direction v0 (scope, two-layer capital model, three environments Sim/Paper/Live, brokerage-proxy boundary, decisions all RULED 2026-07-17)](../design/v2/wallet/wallet-01-design-packet/wallet_direction_v0.md)

The WALLET-01 packet is the Wallet arc's controlling record — direction → decisions → four-slice implementation (W1–W4: window+glyph+Live-read / Simulator-defaults / Paper-budgets / Live-ALLOCATE-stub). The arc delivered v0 (all three environments real, two UI doctrines codified) and is **merged to `main`** (`7029be07`, 2026-07-17); current implementation truth lives in [CURRENT_STATE](../CURRENT_STATE.md). Phase 1 work (real brokerage integration, real-money UX, allocation ↔ engine reconciliation) deferred pending Graham's activation.

- [Agent Architecture Design](../design/v2/agent-architecture/README.md)
  - [Runner Cadence / Evaluation Policy v0](../design/v2/agent-architecture/runner-cadence-evaluation-policy-v0/README.md)
- [AGENT-CREATION-01 — Agent Creation / Manifest v0 Design Packet (EP-06; ARC COMPLETE on `main` `63752fb`, 2026-07-13)](../design/v2/agent-creation/agent-creation-01-design-packet/README.md)
  - [Decision Register v0 (AC-D1..D11 resolved; DR-s6-reactivation; DR-live-1 / DR-live-2 queued)](../design/v2/agent-creation/agent-creation-01-design-packet/decision_register_v0.md)
  - [Implementation Decomposition v0 (the 11-slice plan)](../design/v2/agent-creation/agent-creation-01-design-packet/implementation_decomposition_v0.md)
  - [EP-06 Review Ledger v0 (per-slice fleet run record + slice-11 + live-smoke sections)](../design/v2/agent-creation/agent-creation-01-design-packet/ep06_review_ledger_v0.md)
  - [Arc Build Status v0 (ARC COMPLETE continuation anchor)](../design/v2/agent-creation/agent-creation-01-design-packet/arc_build_status_v0.md)
  - [Current Implementation Truth v0](../design/v2/agent-creation/agent-creation-01-design-packet/current_implementation_truth_v0.md)
  - [Manifest Architecture Options v0](../design/v2/agent-creation/agent-creation-01-design-packet/manifest_architecture_options_v0.md) · [LLM Linkage Options v0](../design/v2/agent-creation/agent-creation-01-design-packet/llm_linkage_options_v0.md) · [DEP Intake Model v0](../design/v2/agent-creation/agent-creation-01-design-packet/dep_intake_model_v0.md) · [Creation Flow UI Direction v0](../design/v2/agent-creation/agent-creation-01-design-packet/creation_flow_ui_direction_v0.md)
  - [Runner/Simulator Spike Scoping v0](../design/v2/agent-creation/agent-creation-01-design-packet/runner_simulator_spike_scoping_v0.md) + spike findings [S1](../design/v2/agent-creation/agent-creation-01-design-packet/spike_s1_scripted_seam_findings_v0.md) / [S2](../design/v2/agent-creation/agent-creation-01-design-packet/spike_s2_bar_mapper_parity_findings_v0.md) / [S3](../design/v2/agent-creation/agent-creation-01-design-packet/spike_s3_injected_time_findings_v0.md) / [S4](../design/v2/agent-creation/agent-creation-01-design-packet/spike_s4_wallet_budget_mapping_findings_v0.md) / [S5](../design/v2/agent-creation/agent-creation-01-design-packet/spike_s5_characterization_plan_v0.md)

The AGENT-CREATION-01 packet is the EP-06 Agent Creation arc's controlling record — options → decisions (AC-D1..D11) → spikes (S1–S5) → 11-slice decomposition → per-slice review ledger. The arc is **implemented and merged to `main`** (`63752fb`, 2026-07-13); current implementation truth lives in [CURRENT_STATE](../CURRENT_STATE.md). One live-path follow-up (the `@1`-contract repair PR) and two queued register decisions remain open.

- [Decision Calipers doctrine corpus](../design/v2/decision-calipers/README.md) — definition/scope, taxonomy, R&D, MVP-subset seed, versioning/change model (design/source material)
- [DECISION-CALIPERS-01 — EP-07 Implementation Arc Packet (ARC COMPLETE on `main` `0ecf2ee`, 2026-07-13)](../design/v2/decision-calipers/decision-calipers-01-design-packet/README.md)
  - [Arc Build Status v0 (authoritative arc record — slice states, terminal state)](../design/v2/decision-calipers/decision-calipers-01-design-packet/arc_build_status_v0.md)
  - [Decision Register v0 (DC-D1..DC-D6 all ruled A, Graham 2026-07-12)](../design/v2/decision-calipers/decision-calipers-01-design-packet/decision_register_v0.md)
  - [Registry Architecture v0 (doctrine ↔ manifest-v1 reconciliation; the binding model)](../design/v2/decision-calipers/decision-calipers-01-design-packet/registry_architecture_v0.md)
  - [Implementation Decomposition v0 (slices, dependencies, EP-06 coupling)](../design/v2/decision-calipers/decision-calipers-01-design-packet/implementation_decomposition_v0.md)
  - [Whittle Worksheet v0 (the #127 decision surface — RULED 2026-07-13)](../design/v2/decision-calipers/decision-calipers-01-design-packet/whittle_worksheet_v0.md)
  - [EP-07 Review Ledger v0 (per-slice review/validation record)](../design/v2/decision-calipers/decision-calipers-01-design-packet/ep07_review_ledger_v0.md)
  - **Canon index of record:** [Caliper Canon Index v1 (#128 — generated from the code registry; supersedes the master table + MVP subset)](../design/v2/decision-calipers/canon/caliper_canon_index_v1.md)

The DECISION-CALIPERS-01 packet is the EP-07 arc's controlling record — it turned the decision-caliper doctrine corpus into an **executable, versioned registry** (`packages/shared/src/caliper-registry.ts` + `caliper-registry-entries.ts` — 114 entries, registry 0.3.0) with binding seams (`caliper-binding.ts`) and the canon index. The arc is **implemented and merged to `main`** (`0ecf2ee`, 2026-07-13); current implementation truth lives in [CURRENT_STATE](../CURRENT_STATE.md). The registry describes and classifies — it grants nothing; caliper UI is EP-08.

- [AGENT-EXECUTION-01 — EP-05 Agent Execution & Decision Pipeline Design Packet (ARC COMPLETE on `main` `e74b95b`, 2026-07-13)](../design/v2/agent-execution/agent-execution-01-design-packet/README.md)
  - [Evidence Layer Reconciliation v0 (birth requirement #1 — the evidence-assembly/matrix-layer owner-doc: envelope → matrix → DecisionEvidencePackage)](../design/v2/agent-execution/agent-execution-01-design-packet/evidence_layer_reconciliation_v0.md)
  - [Decision Register v0 (ED-D1..ED-D12 RESOLVED, Graham 2026-07-12; ED-D2 as-amended — configurable/switchable Evaluation Policy)](../design/v2/agent-execution/agent-execution-01-design-packet/decision_register_v0.md)
  - [Runtime Architecture v0 (component map — runner/pipeline/harness relationships, runtime invariants, cost posture)](../design/v2/agent-execution/agent-execution-01-design-packet/runtime_architecture_v0.md)
  - [Implementation Decomposition v0 (the arc as executable slices — the arc record; ARC-LANDING + SLICE-9-LANDED addenda)](../design/v2/agent-execution/agent-execution-01-design-packet/implementation_decomposition_v0.md)
  - [Slice 9 Convergence Plan v0 (lab-lane convergence + legacy cleanup — SC-D1..D7; the deferred SIM story #297)](../design/v2/agent-execution/agent-execution-01-design-packet/slice9_convergence_plan_v0.md)
  - [Dispatch Briefs v0 (fire-ready wave-1 Marlow briefs, slices 1–4)](../design/v2/agent-execution/agent-execution-01-design-packet/dispatch_briefs_v0.md)
  - [Closeout Context Deltas v0 (staged CURRENT_STATE/priorities/log/index text — APPLIED 2026-07-13)](../design/v2/agent-execution/agent-execution-01-design-packet/closeout_context_deltas_v0.md)

The AGENT-EXECUTION-01 packet is the EP-05 Agent Execution & Decision Pipeline arc's controlling record — birth requirements → resolved register (ED-D1..D12) → runtime architecture → decomposition → dispatch briefs → the slice-9 convergence plan. The arc is **implemented and merged to `main`** (`e74b95b`, 2026-07-13 — arc PR #295 + convergence PR #300): real agents run in the Simulator AND the lab lane through one unified pipeline (Agent Runner core + five-stage decision pipeline + `DecisionEvidencePackage` persistence). Current implementation truth lives in [CURRENT_STATE](../CURRENT_STATE.md). The old lab `/runs` decision surface rides a thin compatibility shim until SIM story #297 migrates it onto the DEP inspector.

- [SYSTEM-SYNTHESIS-PROBE-01 — end-to-end agent decision loop probe (Axium, 2026-07-15; read-only findings + connective-tissue backlog)](../design/v2/system-synthesis/system-synthesis-probe-01/README.md) — seam-by-seam gap register for *create → run → decide → persist → read back*: the loop fires live but nothing is configured to traverse it usefully (empty seeded toolPolicies, no agent↔scenario guard, dual-vocabulary read-back). Gap 1 (creation seeds universe + toolPolicy) in flight via #122; gaps 2/3 (guard + sim agent selection) and #297 read-back convergence are the queued packets; grounds EP-08's "corpus first" prerequisite.

- [GAME-SCRIPT-01 — Game Script / Decision Recipe Design Packet (EP-31 #384; packet v0 stood up 2026-07-17; register RULED 2026-07-18 — adopted per recommendation)](../design/v2/game-script/game-script-01-design-packet/README.md)
  - [Decision Register v0 (GS-D1..D14 — ALL RULED 2026-07-18, adopted per recommendation; GS-D3/D12 confirmed)](../design/v2/game-script/game-script-01-design-packet/decision_register_v0.md)
  - [game-script@1 Contract Direction v0 (shape sketch + deterministic evaluation semantics + plan linter)](../design/v2/game-script/game-script-01-design-packet/game_script_contract_v0.md)
  - [Runtime Integration Direction v0 (evaluator placement, session lifecycle, orchestration principle, persistence/replay)](../design/v2/game-script/game-script-01-design-packet/runtime_integration_v0.md)
  - [Current Implementation Truth v0 (Fader — the packet's reality anchor)](../design/v2/game-script/game-script-01-design-packet/current_implementation_truth_v0.md)
  - [Spike Plan v0 (S1 authoring coherence × universe size · S2 prototype evaluator)](../design/v2/game-script/game-script-01-design-packet/spike_plan_v0.md)
  - [Spike S1 Findings v0 (no validity cliff ≤40 — depth compression; grammar-budget boundary; linter catalog; session economics)](../design/v2/game-script/game-script-01-design-packet/spike_s1_authoring_coherence_findings_v0.md)
  - [Spike S2 Findings v0 (two-family state machine; 17 contract gaps → 13 normative pins + 4 forks; byte-identical determinism proof)](../design/v2/game-script/game-script-01-design-packet/spike_s2_evaluator_findings_v0.md)
  - [Implementation Decomposition v0 (the arc blueprint: 10 slices / 5 waves, spine-first; build activation Graham-gated)](../design/v2/game-script/game-script-01-design-packet/implementation_decomposition_v0.md)
  - [Arc Build Status & Resume Anchor v0 (LIVE — slice ledger, open decisions, resume procedure)](../design/v2/game-script/game-script-01-design-packet/arc_build_status_v0.md)
  - Source of record: [Game Script Ideation (golden synthesis, 2026-07-17)](../context/operations/feedback/source-material-for-canonization/game_script_ideation_v0.md)

- [Legacy Retirement Design](../design/v2/legacy-retirement/README.md)
  - [v0.1 Manifest Exodus — Scoping v0 (#333, merged PR #332, 2026-07-17)](../design/v2/legacy-retirement/v01_manifest_exodus_scoping_v0.md) — the successor to the Agent Creation arc: retires the v0.1 manifest shape end-to-end with a unified bridge (`toLegacyManifestView`), establishes v1-as-canonical, and deprecates legacy operator surfaces.

- [MVP Roadmap Reconciliation](../design/v2/mvp-roadmap/README.md)
- [Live Authority Design](../design/v2/live-authority/README.md)
  - [LIVE-INTERVENTION-01 - Operator Manual Live Intervention Surface](../design/v2/live-authority/live-intervention-01-operator-manual-live-intervention-surface/README.md)

---

# Canonical Knowledge

These pages are the synthesized "what we currently believe" layer.

- [Canonical README](canonical/README.md)
- [Portfolio Core](canonical/portfolio_core.md)
- [Event Stream Timeline / EST](canonical/event_stream_timeline.md)
- [Algo / Quant Service](canonical/algo_quant_service.md) — current-truth synthesis for the algorithmic layer (D1–D8, ToolResult envelope, contract-version posture, cross-repo rules)
- [Workstation Shell](canonical/workstation_shell.md)
- [Market Ontology](canonical/market_ontology.md)
- [Product Thesis](canonical/product_thesis.md)
- [Platform Thesis](canonical/platform_thesis.md)
- [Context System](canonical/context_system.md)
- [TrAIdit](canonical/traidit.md)
- [TrAInit](canonical/trainit.md)
- [Lab](canonical/lab.md)
- [Research](canonical/research.md)
- [Agent Lifecycle](canonical/agent_lifecycle.md)
- [Archetypes](canonical/archetypes.md)
- [Versioning](canonical/versioning.md)
- [Evaluation](canonical/evaluation.md)
- [Implementation Program](canonical/implementation_program.md)
- [Current Priorities](canonical/current_priorities.md)

---

# Platform

Reusable TrAInit-level structure, future direction, and system models.

- [Platform README](platform/README.md)

## Architecture
- [Architecture README](platform/architecture/README.md)
- [Context System Design](platform/architecture/context_system_design.md)

## System
- [System README](platform/system/README.md)
- [Iteration Model](platform/system/iteration_model.md)

## Vision
- [Vision README](platform/vision/README.md)
- [TrAInit Platform Layers](platform/vision/trainit_platform_layers.md)

## Future
- [Future README](platform/future/README.md)
- [AI Capability Layers](platform/future/ai_capability_layers.md)
- [TrAInit Platform Vision v0](platform/future/trAInit_platform_vision_v0.md)

---

# Operations

How the project moves forward in practice.

- [Operations README](operations/README.md)
- [Operations Archive README](operations/archive/README.md)
- [Former Prospective Human Collaborators Archive](operations/archive/former-prospective-human-collaborators/README.md)

## Milestones
- [Milestones README](operations/milestones/README.md)
- [Lab v1 Milestone Ledger](operations/milestones/lab_v1_milestone_ledger.md)
- [Milestone Operating Model](operations/milestones/milestone_operating_model.md)
- [Milestone Template](operations/milestones/milestone_template.md)

## User Workflow
- [User Workflow README](operations/user-workflow/README.md)
- [Operator Workflow](operations/user-workflow/operator_workflow.md)

## Feedback
- [Feedback README](operations/feedback/README.md)
- [Open Questions](operations/feedback/open_questions.md)
- [Feedback Template](operations/feedback/feedback_template.md)
- [Raw Feedback Folder](operations/feedback/raw/)
- [Feedback Retrospectives Folder](operations/feedback/retrospectives/)
- [Source Material For Canonization Folder](operations/feedback/source-material-for-canonization/)
- [BIA Harness Augmentation Source README](operations/feedback/source-material-for-canonization/bia-harness-augmentation/README.md)
- [Business / Legal Research Source Material README](operations/feedback/source-material-for-canonization/business-legal-research/README.md)
- [Legal Requirements Overview Source Material](operations/feedback/source-material-for-canonization/business-legal-research/legal-requirements-overview.md)
- [Human Team Roles And Requirements Source README](operations/feedback/source-material-for-canonization/human-team-roles-and-requirements/README.md)
- [TrAInit Ideation Folder](operations/feedback/trainit-ideation/)
- [Feedback Design Notes Folder](operations/feedback/design/)
- [User Feedback Backlog](operations/feedback/raw/user_feedback_backlog.md)
- [Raw Feedback Notes](operations/feedback/raw/raw-feedback-notes.txt)
- [Lab v1 Retrospective](operations/feedback/retrospectives/lab_v1_retrospective.md)
- [Lab v2 Feedback Structured](operations/feedback/retrospectives/lab_v2_feedback_structured.md)
- [TrAIdit Full Product Description v0](operations/feedback/source-material-for-canonization/traidit_full_product_description_v0.md)
- [TrAIdit Market Edge Product Thesis Source v0](operations/feedback/source-material-for-canonization/traidit_market_edge_product_thesis_source_v0.md)
- [Agent Evaluation Profile Framework v0.2](operations/feedback/source-material-for-canonization/agent_evaluation_profile_framework_v0_2.md)
- [Workstation UI Doctrine Source v0](operations/feedback/source-material-for-canonization/workstation_ui_doctrine_source_v0.md)
- [Game Script / Decision Recipe Ideation Source v0 (pre-packet golden synthesis, 2026-07-17)](operations/feedback/source-material-for-canonization/game_script_ideation_v0.md)
- [Naming Model Exploration: TrAInit / TrAIdit v0](operations/feedback/source-material-for-canonization/naming_model_exploration_trainit_traidit_v0.md)
- [TrAInit Badge Iconography Model v0](operations/feedback/source-material-for-canonization/trainit_badge_iconography_model_v0.md)
- [TrAInit Agentic Trust Thesis v0](operations/feedback/trainit-ideation/trainit_agentic_trust_thesis_v0.md)
- [TrAInit Seal / Rating Model v0](operations/feedback/trainit-ideation/trainit_seal_rating_model_v0.md)
- [v3 Ideas](operations/feedback/design/v3_ideas.md)

## Reviews
- [Reviews README](operations/reviews/README.md)
- [Codebase Review Retrospective v1.0](operations/reviews/codebase-review_retrospective_v1.0.md)
- [Context Coherence Review Retrospective v1.0](operations/reviews/context-coherence-review_retrospective_v1.0.md)
- [Design Coherence Review Retrospective v1.0](operations/reviews/design-coherence-review_retrospective_v1.0.md)

## Sessions
- [Sessions README](operations/sessions/README.md)
- [Session Rollup Checklist](operations/sessions/session_rollup_checklist.md)
- [Session Log](operations/sessions/SESSION_LOG.md)
- [2026-04-23 Context Bootstrap](operations/sessions/2026-04-23_context_bootstrap.md)

## Task Queue
- [Task Queue README](operations/task-queue/README.md)
- [Active Task Queue](operations/task-queue/active.md)
- [Proposed Task Queue](operations/task-queue/proposed.md)
- [Blocked Task Queue](operations/task-queue/blocked.md)
- [Completed Task Queue](operations/task-queue/completed.md)
- [Task Template](operations/task-queue/task-template.md)

---

# Governance

Decisions, contradictions, and meta-rules.

- [Governance README](governance/README.md)

## Decisions
- [Decisions README](governance/decisions/README.md)
- [ADR-001: Lab-first Product Center](governance/decisions/ADR-001-lab-first.md)
- [ADR-002: Design Broad Enough, Implement Narrow Enough](governance/decisions/ADR-002-design-broad-implement-narrow.md)
- [ADR-003: Context Is a First-class Asset](governance/decisions/ADR-003-context-is-a-first-class-asset.md)
- [ADR-004: Milestones and Session Rollups](governance/decisions/ADR-004-milestones-and-rollups.md)
- [ADR-005: Session Rollup Ownership](governance/decisions/ADR-005-session-rollup-ownership.md)
- [ADR-006: Historic Simulator Run Persistence Boundary](governance/decisions/ADR-006-simulator-run-persistence-boundary.md)
- [ADR-007: User-facing Graph Names (Price Action / Equity)](governance/decisions/ADR-007-user-facing-graph-names.md)
- [ADR-008: GitHub Projects Is the Planning Surface; Docs Remain Doctrine](governance/decisions/ADR-008-github-projects-planning-surface.md)
- [ADR-009: Multi-repo Structure — traidit-* Convention, Centralized Planning, Org Path](governance/decisions/ADR-009-multi-repo-structure.md)

## Contradictions
- [Contradictions README](governance/contradictions/README.md)
- [Contradiction Register](governance/contradictions/register.md)

## Data Rights
- [Massive/Polygon Compliance — Engineering Posture v0](governance/data-rights/massive_compliance_v0.md) — binds the Individuals-tier constraints to epics (SOLO_USER_ID = licensing boundary; Business-tier hard gate for EP-24/EP-25/EP-16/public-beta/LLC; two-phase engineering; subscription-ephemeral). Engineering posture derived from Graham's founder data-rights review ([`data_storage_policies.md`](team/graham/legal-review-docs/PolygonMassive/data_storage_policies.md)) and his 2026-07-11 personal-use determination; trigger dispositions in the [professional-questions register](team/graham/business-research/TrAIdit_BETA/professional_questions_register_v0.md) §Trigger bindings.

## Meta
- [Meta README](governance/meta/README.md)
- [Axium Assistant Role](governance/meta/assistant_role.md)
- [Context Librarian Role](governance/meta/context_librarian_role.md)
- [Document Hierarchy Overview](governance/meta/trainit_doc_overview.md)

## Context Hygiene
- [Context Canonicalization Audit 01](governance/context-hygiene/context-canonicalization-audit-01/README.md)
- [Blind-Spot Remediation 01](governance/context-hygiene/blind-spot-remediation-01/README.md) — 2026-07-08 23-finding report (committed verbatim) + execution mapping + [board↔corpus sync audit](governance/context-hygiene/blind-spot-remediation-01/board_corpus_sync_audit_v0.md); story #175 CLOSED
- [EP-05 Packet Birth Requirements](../design/v2/agent-architecture/ep05_packet_birth_requirements_v0.md) — the four requirements that bound the EP-05 packet (evidence-layer reconciliation, characterization-test bar, question triage, glossary conformance); **DISCHARGED by AGENT-EXECUTION-01, and the EP-05 arc is now COMPLETE on `main` (2026-07-13)**
- [Pre-Compaction Archive 2026-07-08](operations/milestones/pre_compaction_archive_2026-07-08/README.md) — verbatim CURRENT_STATE + current_priorities snapshots preceding the BS-09b compaction; nothing deleted
- [Security Posture Question Register](../design/v2/security/security_posture_question_register_v0.md) — gate-bound security questions (before-deploy / before-ALPHA / before-LIVE); no design implied

---

# Team

Ownership, onboarding, and current agent operating model.

- [Team README](team/README.md)
- [Ownership Model](team/ownership_model.md)
- [Graham README](team/graham/README.md)
- [Human Team README](team/human-team/README.md)
- [Future Human Team Roles And Requirements](team/human-team/future-human-team-roles-and-requirements/README.md)
- [Business Partner Requirements](team/human-team/future-human-team-roles-and-requirements/business_partner_requirements.md)
- [Lawyer And Law Firm Requirements](team/human-team/future-human-team-roles-and-requirements/lawyer_and_law_firm_requirements.md)
- [Business Incubation / Startup Advisor Requirements](team/human-team/future-human-team-roles-and-requirements/business_incubation_startup_advisor_requirements.md)
- [Human Team Principles](team/human-team/future-human-team-roles-and-requirements/human_team_principles.md)
- [Candidate Scorecard And Trial Process](team/human-team/future-human-team-roles-and-requirements/candidate_scorecard_and_trial_process.md)
- [Engagement Stage Gates](team/human-team/future-human-team-roles-and-requirements/engagement_stage_gates.md)
- [Former Prospective Human Collaborators Archive](operations/archive/former-prospective-human-collaborators/README.md)

## Graham Business Research
- [Business Research README](team/graham/business-research/README.md)
- [ALGO-RESEARCH-01 Design Package](../design/v2/business-research/algo-research-01-algo-trading-vernacular-platform-scan/README.md)
- [TrAIdit BETA Research README](team/graham/business-research/TrAIdit_BETA/README.md)
- [Business Incubation Plan v0.0](team/graham/business-research/TrAIdit_BETA/business-incubation-plan_v0.0.md)
- [Business Incubation Milestones and Implementation Plan](team/graham/business-research/TrAIdit_BETA/business_incubation_milestones_and_implementation_plan.md)
- [Competitor Analysis](team/graham/business-research/TrAIdit_BETA/competitor-analysis.md)
- [Differentiation Edge](team/graham/business-research/TrAIdit_BETA/differentiation-edge.md)
- [Market Size Revenue Outlook](team/graham/business-research/TrAIdit_BETA/market-size-revenue-outlook.md)
- [Monetization Models](team/graham/business-research/TrAIdit_BETA/monetization-models.md)
- [Preliminary Market Strategy](team/graham/business-research/TrAIdit_BETA/preliminary-market-strategy.md)
- [Subscription Tiers](team/graham/business-research/TrAIdit_BETA/subscription-tiers.md)
- [Founder Proof Rubric v0](team/graham/business-research/TrAIdit_BETA/founder_proof_rubric_v0.md)
- [Professional Questions Register v0](team/graham/business-research/TrAIdit_BETA/professional_questions_register_v0.md)
- [TrAIdit Focused Business Incubation Plan v0](team/graham/business-research/TrAIdit_BETA/traidit_focused_business_incubation_plan_v0.md)
- [Cost Assumption Register v0](team/graham/business-research/TrAIdit_BETA/cost_assumption_register_v0.md)
- [Business Context Intake v0](team/graham/business-research/business_context_intake_v0.md)
- [TrAInit Research README](team/graham/business-research/TrAInit/README.md)

## Agent Operating Model
- [Agents README](team/agents/README.md)
- [Collaboration Model](team/agents/collaboration_model.md)
- [Agent Operating Contract](team/agents/agent_operating_contract.md)
- [Agent Orchestration Model](team/agents/orchestration_model.md)
- [Working with Codex and ChatGPT](team/agents/working_with_codex_and_chatgpt.md)
- [Agent Handoff Contract](team/agents/agent_handoff_contract.md)
- [Planning Surface Workflow](team/agents/planning_surface_workflow.md) — fleet how-to for the Roadmap board: story lifecycle, who-does-what, command snippets
- [AGENT-HARNESS-02 Codex Custom Agent Bridge](../design/v2/agent-harness/agent-harness-02-codex-custom-agent-bridge/README.md)
- [AGENT-HARNESS-03 Spark Fast UI Repairer](../design/v2/agent-harness/agent-harness-03-spark-fast-ui-repairer/README.md)
- [AGENT-HARNESS-04 Axium Codex Main Thread Harness](../design/v2/agent-harness/agent-harness-04-axium-codex-main-thread-harness/README.md)

### Orchestrators
- [Orchestrator README](team/agents/orchestrators/01_orchestrator/README.md)
- [Orchestrator Role](team/agents/orchestrators/01_orchestrator/orchestrator_role.md)
- [Orchestrator Workflow](team/agents/orchestrators/01_orchestrator/orchestrator_workflow.md)
- [Orchestrator Soul](team/agents/orchestrators/01_orchestrator/soul.md)
- [Orchestrator Prompt Templates](team/agents/orchestrators/01_orchestrator/prompt_templates.md)
- [Orchestrator Phase Gate Checklist](team/agents/orchestrators/01_orchestrator/phase_gate_checklist.md)
- [Orchestrator Spawn Contract](team/agents/orchestrators/01_orchestrator/spawn_contract.md)

### Context Librarian
- [Context Librarian README](team/agents/context-librarian/README.md)
- [Context Librarian Local Role Stub](team/agents/context-librarian/context_librarian_role.md)
- [Context Librarian Checklist](team/agents/context-librarian/context_librarian_checklist.md)
- [Context Maintenance Workflow](team/agents/context-librarian/context_maintenance_workflow.md)
- [Context Librarian Soul](team/agents/context-librarian/soul.md)

### Software Design Assistant
- [Software Design Assistant README](team/agents/software-design-assistant/README.md)
- [Software Design Assistant Role](team/agents/software-design-assistant/software_design_assistant_role.md)
- [Software Design Assistant Workflow](team/agents/software-design-assistant/software_design_assistant_workflow.md)
- [Software Design Assistant Soul](team/agents/software-design-assistant/soul.md)

### Designers
- [Designers README](team/agents/designers/README.md)
- [Workstation UI Designer README](team/agents/designers/01_workstation-ui-designer/README.md)
- [Workstation UI Designer Role](team/agents/designers/01_workstation-ui-designer/workstation_ui_designer_role.md)
- [Workstation UI Designer Workflow](team/agents/designers/01_workstation-ui-designer/workstation_ui_designer_workflow.md)
- [Workstation UI Designer Soul](team/agents/designers/01_workstation-ui-designer/soul.md)
- [Workstation UI Designer Prompt Templates](team/agents/designers/01_workstation-ui-designer/prompt_templates.md)

### Systems Engineers
- [Systems Engineers README](team/agents/systems-engineers/README.md)
- [Axium README](team/agents/systems-engineers/01_axium_lead-platform-systems-engineer/README.md)
- [Axium Role](team/agents/systems-engineers/01_axium_lead-platform-systems-engineer/axium_role.md)
- [Axium Workflow](team/agents/systems-engineers/01_axium_lead-platform-systems-engineer/axium_workflow.md)
- [Axium Soul](team/agents/systems-engineers/01_axium_lead-platform-systems-engineer/soul.md)
- [Axium Identity Addendum](team/agents/systems-engineers/01_axium_lead-platform-systems-engineer/identity_addendum.md)
- [Axium Side Quests](team/agents/systems-engineers/01_axium_lead-platform-systems-engineer/side_quests.md)
- [Axium Prompt Generation Standards](team/agents/systems-engineers/01_axium_lead-platform-systems-engineer/prompt_generation_standards.md)
- [Axium Prompt Templates](team/agents/systems-engineers/01_axium_lead-platform-systems-engineer/prompt_templates.md)
- [Architect README](team/agents/systems-engineers/02_architect/README.md)
- [Architect Role](team/agents/systems-engineers/02_architect/architect_role.md)
- [Architect Workflow](team/agents/systems-engineers/02_architect/architect_workflow.md)
- [Architect Soul](team/agents/systems-engineers/02_architect/soul.md)

### Software Engineers
- [Software Engineers README](team/agents/software-engineers/README.md)
- [Coder README](team/agents/software-engineers/01_coder/README.md)
- [Coder Role](team/agents/software-engineers/01_coder/coder_role.md)
- [Coder Workflow](team/agents/software-engineers/01_coder/coder_workflow.md)
- [Coder Angular Frontend Engineering Policy](team/agents/software-engineers/01_coder/angular_frontend_engineering_policy.md)
- [Coder Soul](team/agents/software-engineers/01_coder/soul.md)
- [Reviewer README](team/agents/software-engineers/02_reviewer/README.md)
- [Reviewer Role](team/agents/software-engineers/02_reviewer/reviewer_role.md)
- [Reviewer Workflow](team/agents/software-engineers/02_reviewer/reviewer_workflow.md)
- [Reviewer Soul](team/agents/software-engineers/02_reviewer/soul.md)
- [Tester README](team/agents/software-engineers/03_tester/README.md)
- [Tester Role](team/agents/software-engineers/03_tester/tester_role.md)
- [Tester Workflow](team/agents/software-engineers/03_tester/tester_workflow.md)
- [Tester Soul](team/agents/software-engineers/03_tester/soul.md)
- [DevOps README](team/agents/software-engineers/04_dev-ops/README.md)
- [DevOps Role](team/agents/software-engineers/04_dev-ops/dev-ops_role.md)
- [DevOps Workflow](team/agents/software-engineers/04_dev-ops/dev-ops_workflow.md)
- [DevOps Soul](team/agents/software-engineers/04_dev-ops/soul.md)
- [Fast UI Repairer README](team/agents/software-engineers/05_fast-ui-repairer/README.md)
- [Fast UI Repairer Role](team/agents/software-engineers/05_fast-ui-repairer/fast_ui_repairer_role.md)
- [Fast UI Repairer Workflow](team/agents/software-engineers/05_fast-ui-repairer/fast_ui_repairer_workflow.md)
- [Fast UI Repairer Angular Fast Repair Policy](team/agents/software-engineers/05_fast-ui-repairer/angular_fast_repair_policy.md)
- [Fast UI Repairer Scope And Stop Conditions](team/agents/software-engineers/05_fast-ui-repairer/scope_and_stop_conditions.md)
- [Fast UI Repairer Soul](team/agents/software-engineers/05_fast-ui-repairer/soul.md)

### Quant Engineers
- [Quant Engineers README](team/agents/quant-engineers/README.md)
- [Tycho Soul (Quant Coder)](team/agents/quant-engineers/01_tycho_quant-coder/soul.md)
- [Bessel Soul (Quant Reviewer)](team/agents/quant-engineers/02_bessel_quant-reviewer/soul.md)
- [Gosset Soul (Quant Tester)](team/agents/quant-engineers/03_gosset_quant-tester/soul.md)

### Business Advisors
- [Business Advisors README](team/agents/business-advisors/README.md)
- [Business Incubation Advisor README](team/agents/business-advisors/01_business-incubation-advisor/README.md)
- [Business Incubation Advisor Role](team/agents/business-advisors/01_business-incubation-advisor/business_incubation_advisor_role.md)
- [Business Incubation Advisor Workflow](team/agents/business-advisors/01_business-incubation-advisor/business_incubation_advisor_workflow.md)
- [Business Incubation Advisor Soul](team/agents/business-advisors/01_business-incubation-advisor/soul.md)
- [Business Incubation Advisor Principles](team/agents/business-advisors/01_business-incubation-advisor/principles.md)
- [Business Incubation Advisor Guardrails](team/agents/business-advisors/01_business-incubation-advisor/guardrails.md)
- [Business Incubation Advisor Prompt Templates](team/agents/business-advisors/01_business-incubation-advisor/prompt_templates.md)

---

# Evidence

Raw source notes, screenshots, and visual references.

- [Evidence README](evidence/README.md)

## Raw Sources
- [Raw README](evidence/raw/README.md)
- [Source Register](evidence/raw/source_register.md)
- [AI Trends / Context Layer Note](evidence/raw/source_001_ai_trends_2026_context_layer.md)
- [Karpathy LLM Wiki Note](evidence/raw/source_002_karpathy_llm_wiki.md)
- [Current State Source Note](evidence/raw/source_003_current_state_tradit_v0_3_5.md)

## Images
- [Images README](evidence/images/README.md)
- `evidence/images/ui-dev-screenshots/`
- `evidence/images/visual-references-and-examples/`

---

# Design Corpus

The design corpus lives outside `docs/context/` and acts as source material rather than operational truth.

- `docs/design/v1/`
- `docs/design/v2/`

## Lab v2 entrypoints
- [Lab v2 Design Principles](../design/v2/lab_v2_design_principles.md)
- [Lab v2 Core Model](../design/v2/lab_v2_core_model.md)
- [Lab v2 UI System](../design/v2/lab_v2_ui_system.md)
- [AGENT-HARNESS-01 Coder / Orchestrator Harness Refactor](../design/v2/agent-harness/agent-harness-01-coder-orchestrator-refactor/README.md)
- [AGENT-HARNESS-02 Codex Custom Agent Bridge](../design/v2/agent-harness/agent-harness-02-codex-custom-agent-bridge/README.md)
- [AGENT-HARNESS-03 Spark Fast UI Repairer](../design/v2/agent-harness/agent-harness-03-spark-fast-ui-repairer/README.md)
- [AGENT-HARNESS-04 Axium Codex Main Thread Harness](../design/v2/agent-harness/agent-harness-04-axium-codex-main-thread-harness/README.md)
- [Workstation UI Design README](../design/v2/workstation-ui/README.md)
- [Workstation UI Operating Doctrine](../design/v2/workstation-ui/workstation_ui_operating_doctrine.md)
- [Workstation UI Web Reset README](../design/v2/workstation-ui/web-reset/README.md)
- [WEB-RESET Context Brief v0](../design/v2/workstation-ui/web-reset/web_reset_context_brief_v0.md)
- [Front-End Engineering Standards v0](../design/v2/workstation-ui/web-reset/frontend_engineering_standards_v0.md)
- [WEB-RESET-01 Session Closeout Follow-Ups - 2026-05-13](../design/v2/workstation-ui/web-reset/web-reset-01/web_reset_01_session_closeout_followups_2026-05-13.md)
- [WEB-RESET-01 Task 10 Symbol Universe / Research Split Brief](../design/v2/workstation-ui/web-reset/web-reset-01/task-10-symbol-universe-research-split/task_10_symbol_universe_research_split_brief.md)
- [WEB-RESET-01 Task 10A Current-Compatible Scope](../design/v2/workstation-ui/web-reset/web-reset-01/task-10-symbol-universe-research-split/task_10a_current_compatible_scope.md)
- [Future Research Workstation Mode Packets](../design/v2/workstation-ui/web-reset/web-reset-01/task-10-symbol-universe-research-split/future_research_workstation_mode_packets.md)
- [Research/SU Global Shell Follow-Ups](../design/v2/workstation-ui/web-reset/web-reset-01/task-10-symbol-universe-research-split/research_su_global_shell_followups.md)
- [Research/SU Operator Feedback Register](../design/v2/workstation-ui/web-reset/web-reset-01/task-10-symbol-universe-research-split/research_su_operator_feedback_register.md)
- [Readiness / Modes / Windowing Doctrine v0](../design/v2/workstation-ui/readiness-modes-windowing/README.md)
- [Architecture Diagrams README](../design/v2/architecture-diagrams/README.md)

## Workstation UI / WDA artifacts
- [Lab v2 Shell Mockup Package v0](../design/v2/workstation-ui/mockups/lab-v2-shell/)
- [Lab v2 Shell Accepted Baseline](../design/v2/workstation-ui/mockups/lab-v2-shell/accepted-baseline.md)
- [Lab v2 Shell Screen Brief v0](../design/v2/workstation-ui/mockups/lab-v2-shell/lab_v2_shell_screen_brief_v0.md)
- [Whittle-Down Round 1](../design/v2/workstation-ui/mockups/lab-v2-shell/whittle-down-round-1/)
- [Whittle-Down Round 1 Brief](../design/v2/workstation-ui/mockups/lab-v2-shell/whittle-down-round-1/lab_v2_shell_whittle_down_round_1.md)
- [Hybrid Round 2 / Variant D](../design/v2/workstation-ui/mockups/lab-v2-shell/hybrid-round-2/)
- [Hybrid Round 2 Brief](../design/v2/workstation-ui/mockups/lab-v2-shell/hybrid-round-2/hybrid_shell_round_2_brief.md)
- [Shell Alignment v1 Handoff](../design/v2/workstation-ui/mockups/lab-v2-shell/shell-alignment-v1/)
- [Shell Alignment v1 Design Brief](../design/v2/workstation-ui/mockups/lab-v2-shell/shell-alignment-v1/shell_alignment_v1_design_brief.md)
- [Shell Alignment v1 Architect Handoff](../design/v2/workstation-ui/mockups/lab-v2-shell/shell-alignment-v1/shell_alignment_v1_architect_handoff.md)
- [Variant D Refinement Round 1](../design/v2/workstation-ui/mockups/lab-v2-shell/refinement-round-1/)
- [Variant D Refinement Round 1 Brief](../design/v2/workstation-ui/mockups/lab-v2-shell/refinement-round-1/variant_d_refinement_round_1_brief.md)
- [Variant D Refinement Round 1.1](../design/v2/workstation-ui/mockups/lab-v2-shell/refinement-round-1-1/)
- [Variant D Refinement Round 1.1 Brief](../design/v2/workstation-ui/mockups/lab-v2-shell/refinement-round-1-1/variant_d_refinement_round_1_1_brief.md)
- [Styling Whittle-Down Round 1](../design/v2/workstation-ui/mockups/lab-v2-shell/styling-whittle-down-round-1/)
- [Styling Whittle-Down Round 1 Brief](../design/v2/workstation-ui/mockups/lab-v2-shell/styling-whittle-down-round-1/styling_whittle_down_round_1_brief.md)
- [Semantic Color System v0.1](../design/v2/workstation-ui/mockups/lab-v2-shell/styling-whittle-down-round-1/semantic_color_system_v0_1.md)
- [Typography / Density Notes](../design/v2/workstation-ui/mockups/lab-v2-shell/styling-whittle-down-round-1/typography_and_density_notes_v0.md)
- [Iconography / Affordance Notes](../design/v2/workstation-ui/mockups/lab-v2-shell/styling-whittle-down-round-1/iconography_and_affordance_notes_v0.md)
- [Styling Whittle-Down Round 1.1 High-Divergence Pass](../design/v2/workstation-ui/mockups/lab-v2-shell/styling-whittle-down-round-1-1/)
- [Styling Whittle-Down Round 1.1 Brief](../design/v2/workstation-ui/mockups/lab-v2-shell/styling-whittle-down-round-1-1/styling_whittle_down_round_1_1_brief.md)
- [High-Divergence Comparison Matrix](../design/v2/workstation-ui/mockups/lab-v2-shell/styling-whittle-down-round-1-1/high_divergence_comparison_matrix.md)
- [Recommended Style Direction v1](../design/v2/workstation-ui/mockups/lab-v2-shell/styling-whittle-down-round-1-1/recommended_style_direction_v1.md)
- [Style 2 / Studio Transport](../design/v2/workstation-ui/mockups/lab-v2-shell/styling-whittle-down-round-1-1/style_2_studio_transport.html)
- [Light G / Ash Precision exploratory light-mode artifact](../design/v2/workstation-ui/mockups/lab-v2-shell/styling-whittle-down-round-2/light_g_ash_precision.html)
- [Symbol Universe / Research Mode Package v0](../design/v2/workstation-ui/mockups/symbol-universe-research-mode/)
- [Symbol Universe / Research Recommended Direction v0](../design/v2/workstation-ui/mockups/symbol-universe-research-mode/symbol_universe_research_recommended_direction_v0.md)
- [Symbol Universe / Research Implementation Handoff v0](../design/v2/workstation-ui/mockups/symbol-universe-research-mode/symbol_universe_research_implementation_handoff_v0.md)
- [Symbol Universe / Research Refinement v0.1 Brief](../design/v2/workstation-ui/mockups/symbol-universe-research-mode/refinement-v0-1/symbol_universe_research_refinement_v0_1_brief.md)
- [Symbol Universe / Research Refined Mid-fi v0.1](../design/v2/workstation-ui/mockups/symbol-universe-research-mode/refinement-v0-1/symbol_universe_research_refined_midfi_v0_1.html)
- [Symbol Universe / Research Implementation Delta v0.1](../design/v2/workstation-ui/mockups/symbol-universe-research-mode/refinement-v0-1/symbol_universe_research_implementation_delta_v0_1.md)
- [Historic Simulator Mockups README](../design/v2/workstation-ui/mockups/historic-simulator/README.md)
- [SIM-WDA-01 Simulator Graph / Scenario Loading UI Mockup Package](../design/v2/workstation-ui/mockups/historic-simulator/sim-wda-01/README.md)
- [SIM-WDA-01 Brief](../design/v2/workstation-ui/mockups/historic-simulator/sim-wda-01/sim_wda_01_brief.md)
- [SIM-WDA-01 Implementation Handoff v0](../design/v2/workstation-ui/mockups/historic-simulator/sim-wda-01/implementation_handoff_v0.md)
- [SIM-WDA-01 Refinement v0.1](../design/v2/workstation-ui/mockups/historic-simulator/sim-wda-01/refinement-v0-1/README.md)
- [SIM-WDA-01 Refinement Brief v0.1](../design/v2/workstation-ui/mockups/historic-simulator/sim-wda-01/refinement-v0-1/sim_wda_01_refinement_v0_1_brief.md)
- [SIM-WDA-01 Accepted And Rejected Mockup Register v0.1](../design/v2/workstation-ui/mockups/historic-simulator/sim-wda-01/refinement-v0-1/accepted_and_rejected_mockup_register_v0_1.md)
- [SIM-WDA-01 Implementation Delta v0.1](../design/v2/workstation-ui/mockups/historic-simulator/sim-wda-01/refinement-v0-1/implementation_delta_v0_1.md)
- [SIM-WDA-01 Refinement v0.2 / SIM-UI-01A Repair](../design/v2/workstation-ui/mockups/historic-simulator/sim-wda-01/refinement-v0-2/README.md)
- [SIM-UI-01A Repair Brief v0.2](../design/v2/workstation-ui/mockups/historic-simulator/sim-wda-01/refinement-v0-2/sim_ui_01a_repair_brief_v0_2.md)
- [WDA-SIM-LEGEND-01 Simulator Cross-View Legend / Agent Version Display Layer Controls](../design/v2/workstation-ui/mockups/historic-simulator/wda-sim-legend-01/README.md)
- [Algo Surface Mockups — Round 1 (View/Edit Mode)](../design/v2/workstation-ui/mockups/algo-surface/round-1/README.md)
- [Algo Surface Mockups — Round 2 (Custom Dashboard)](../design/v2/workstation-ui/mockups/algo-surface/round-2/README.md)
- [Algo Surface Mockups — Round 3 (Market Analysis Triptych)](../design/v2/workstation-ui/mockups/algo-surface/round-3/README.md)
- [Cadence Mockup Findings & Handoff v0](../design/v2/workstation-ui/mockups/algo-surface/cadence_mockup_findings_and_handoff_v0.md) — vocabulary findings, primitive/tile/tool catalog (22 items + all 16 0.5.0 tools), Tier-2 candidates, implementation notes, refused boundaries

WDA artifacts are source design direction and implementation handoff material. [CURRENT_STATE](../CURRENT_STATE.md) remains current implementation truth.

## Agent Architecture
- [Agent Architecture README](../design/v2/agent-architecture/README.md)
- [Algorithmic Tool Layer / Agentic Decision Layer Boundary v0](../design/v2/agent-architecture/algorithmic-agentic-boundary-v0/README.md)
- [Position Sizing Decision Model v0](../design/v2/agent-architecture/position-sizing-decision-model-v0/README.md)
- [Sizing Caliper Set v0](../design/v2/agent-architecture/position-sizing-decision-model-v0/sizing_caliper_set_v0.md)
- [PORTFOLIO-CORE-01](../design/v2/portfolio-core/portfolio-core-01-environment-agnostic-account-execution-accounting-foundation/README.md)
- [Algorithmic / Agentic Boundary Brief v0](../design/v2/agent-architecture/algorithmic-agentic-boundary-v0/algorithmic_agentic_boundary_brief_v0.md)
- [Algorithmic Tool Layer v0](../design/v2/agent-architecture/algorithmic-agentic-boundary-v0/algorithmic_tool_layer_v0.md)
- [Agentic Decision Layer v0](../design/v2/agent-architecture/algorithmic-agentic-boundary-v0/agentic_decision_layer_v0.md)
- [Risk Gate And Authority Layer v0](../design/v2/agent-architecture/algorithmic-agentic-boundary-v0/risk_gate_and_authority_layer_v0.md)
- [B/A/S/H Plus Sizing Decision Chain v0](../design/v2/agent-architecture/algorithmic-agentic-boundary-v0/bash_plus_sizing_decision_chain_v0.md)
- [Algorithmic Caliper Mapping v0](../design/v2/agent-architecture/algorithmic-agentic-boundary-v0/algorithmic_caliper_mapping_v0.md)
- [Simulator Tool Execution Model v0](../design/v2/agent-architecture/algorithmic-agentic-boundary-v0/simulator_tool_execution_model_v0.md)

Agent Architecture artifacts are docs-only doctrine unless a later packet explicitly scopes implementation. Current truth remains: deterministic candidate/risk/calibration seams and local synthetic Simulator loading exist; Position Sizing Decision Model v0 is design doctrine only; no general tool registry, first-class sizing implementation, Paper Flow, orders/fills/true P&L, live authority, or autonomous Agent execution exists.

## Decision Calipers
> **EP-07 implementation layer (2026-07-13, `main` `0ecf2ee`):** the doctrine corpus below is now backed by an executable registry — see the [DECISION-CALIPERS-01 arc packet](../design/v2/decision-calipers/decision-calipers-01-design-packet/README.md) and the **canon index of record** [`canon/caliper_canon_index_v1.md`](../design/v2/decision-calipers/canon/caliper_canon_index_v1.md) (generated from the code registry; supersedes the master table + MVP subset, both now carrying dated supersession pointers). The docs below remain design/source material.
- [Master Decision Caliper Package v0](../design/v2/decision-calipers/README.md)
- [Master Decision Caliper Table v0](../design/v2/decision-calipers/master_decision_caliper_table_v0.md)
- [Decision Caliper Definition And Scope v0](../design/v2/decision-calipers/decision_caliper_definition_and_scope_v0.md)
- [Decision Caliper Taxonomy v0](../design/v2/decision-calipers/decision_caliper_taxonomy_v0.md)
- [Decision Caliper Artifact Mapping v0](../design/v2/decision-calipers/decision_caliper_artifact_mapping_v0.md)
- [Decision Caliper UI Surface Map v0](../design/v2/decision-calipers/decision_caliper_ui_surface_map_v0.md)
- [Decision Caliper Versioning And Change Model v0](../design/v2/decision-calipers/decision_caliper_versioning_and_change_model_v0.md)
- [Decision Profile Effect Ontology v0](../design/v2/decision-calipers/decision_profile_effect_ontology_v0.md)
- [Decision Caliper Open Questions v0](../design/v2/decision-calipers/decision_caliper_open_questions_v0.md)
- [Decision Caliper R&D Program README](../design/v2/decision-calipers/r-and-d/README.md)
- [Decision Caliper R&D Program v0](../design/v2/decision-calipers/r-and-d/decision_caliper_r_and_d_program_v0.md)
- [Missing Caliper Candidate Families v0](../design/v2/decision-calipers/r-and-d/missing_caliper_candidate_families_v0.md)
- [Caliper Prospect Register v0](../design/v2/decision-calipers/r-and-d/caliper_prospect_register_v0.md)
- [Caliper Experiment Protocol v0](../design/v2/decision-calipers/r-and-d/caliper_experiment_protocol_v0.md)
- [Caliper Promotion Policy v0](../design/v2/decision-calipers/r-and-d/caliper_promotion_policy_v0.md)
- [Hidden Internal Caliper Layer v0](../design/v2/decision-calipers/r-and-d/hidden_internal_caliper_layer_v0.md)
- [R&D Agentic Fleet v0](../design/v2/decision-calipers/r-and-d/r_d_agentic_fleet_v0.md)
- [Configurable Autonomy Doctrine v0](../design/v2/decision-calipers/r-and-d/configurable_autonomy_doctrine_v0.md)
- [Automation Authority Matrix v0](../design/v2/decision-calipers/r-and-d/automation_authority_matrix_v0.md)
- [C2 / HITL / Automation Balance v0](../design/v2/decision-calipers/r-and-d/c2_hitl_automation_balance_v0.md)
- [Trading Intuition Operational Definition v0](../design/v2/decision-calipers/r-and-d/trading_intuition_operational_definition_v0.md)
- [MVP Decision Caliper Subset README](../design/v2/decision-calipers/mvp-subset/README.md)
- [MVP Decision Caliper Subset v0](../design/v2/decision-calipers/mvp-subset/mvp_decision_caliper_subset_v0.md)
- [Development Decision Caliper Pool v0](../design/v2/decision-calipers/mvp-subset/development_decision_caliper_pool_v0.md)
- [Sizing Caliper Set v0](../design/v2/agent-architecture/position-sizing-decision-model-v0/sizing_caliper_set_v0.md)
- [Agent Creation Calipers v0](../design/v2/decision-calipers/mvp-subset/agent_creation_calipers_v0.md)
- [EvalCal Calibration Calipers v0](../design/v2/decision-calipers/mvp-subset/evalcal_calibration_calipers_v0.md)
- [Simulator Required Calipers v0](../design/v2/decision-calipers/mvp-subset/simulator_required_calipers_v0.md)
- [Live Paper Required Calipers v0](../design/v2/decision-calipers/mvp-subset/live_paper_required_calipers_v0.md)
- [Paper Budget Calipers v0](../design/v2/decision-calipers/mvp-subset/paper_budget_calipers_v0.md)
- [Analysis / Compare Calipers v0](../design/v2/decision-calipers/mvp-subset/analysis_compare_calipers_v0.md)
- [Governance / Readiness Calipers v0](../design/v2/decision-calipers/mvp-subset/governance_readiness_calipers_v0.md)
- [Research / Symbol Universe Calipers v0](../design/v2/decision-calipers/mvp-subset/research_symbol_universe_calipers_v0.md)
- [Hidden Internal Candidates v0](../design/v2/decision-calipers/mvp-subset/hidden_internal_candidates_v0.md)
- [Deferred Advanced Calipers v0](../design/v2/decision-calipers/mvp-subset/deferred_advanced_calipers_v0.md)
- [Professional Review Gated Calipers v0](../design/v2/decision-calipers/mvp-subset/professional_review_gated_calipers_v0.md)
- [Never User Editable Controls v0](../design/v2/decision-calipers/mvp-subset/never_user_editable_controls_v0.md)
- [Caliper Exposure Policy v0](../design/v2/decision-calipers/mvp-subset/caliper_exposure_policy_v0.md)
- [Caliper Family Testing Surface v0](../design/v2/decision-calipers/mvp-subset/caliper_family_testing_surface_v0.md)
- [MVP Caliper Open Questions v0](../design/v2/decision-calipers/mvp-subset/mvp_caliper_open_questions_v0.md)

Decision Caliper artifacts in this section are design/source material. **As of EP-07 (2026-07-13, `main` `0ecf2ee`) the caliper corpus also has an implementation layer** — the executable, versioned registry (`packages/shared/src/caliper-registry.ts` + `caliper-registry-entries.ts`, 114 entries, registry 0.3.0) and its binding seams (`caliper-binding.ts`), with the **canon index of record** ([`canon/caliper_canon_index_v1.md`](../design/v2/decision-calipers/canon/caliper_canon_index_v1.md)) generated from the code and superseding the stale rows of `master_decision_caliper_table_v0.md` + the MVP subset (both now carry dated supersession pointers). The registry **describes and classifies — it grants nothing.** `decision-calipers/` remains the home for true Decision Caliper doctrine, candidate pools, R&D, MVP exposure, and artifact-level behavior controls. They should inform Agent Creation, Agent Editing, EvalCal, Analysis, Compare, Governance, Symbol Universe, Simulator, Live Paper, future R&D, and future schema planning, but they do not authorize implementation of all calipers, RDAF, autonomous automation, live trading, order submission, fills, true P&L, AI command authority, market-edge claims, profitability claims, or legal/professional conclusions. Broader adjustable-field tracking may later belong in a sibling package such as `docs/design/v2/workstation-control-registry/`, but that path is not created or accepted yet.

## MVP Roadmap
- [Board Backfill Manifest v0](../design/v2/mvp-roadmap/roadmap-reconciliation-v1/board_backfill_manifest_v0.md) — 2026-07-02 executed: 44 closed done-stories backfilled onto the board (three-tier grouping; issues #51–#68, #70–#95), sub-issued to epics / milestone-direct
- [Epic Completion Baseline v1 (ACCEPTED)](../design/v2/mvp-roadmap/roadmap-reconciliation-v1/epic_completion_baseline_v1.md) — Graham-reviewed DoDs per epic; runner/execution glossary (SimRunner vs Agent Runner vs decision pipeline vs agent execution); EP-29 Research/Symbol-Universe-Manager split from EP-09; open stories cut from it (honest fractions); supersedes [v0](../design/v2/mvp-roadmap/roadmap-reconciliation-v1/epic_completion_baseline_v0.md)
- [Roadmap Reconciliation — Master Inventory v4 (LANDED)](../design/v2/mvp-roadmap/roadmap-reconciliation-v1/master_inventory_v4.md) — 2026-07-02 phase-1 closeout: 7 milestones + 28 epics approved and milestone-slated (all 5 gap-analysis epics accepted; EP-22 → TrAIdit Service Management); story decomposition deferred; [v3](../design/v2/mvp-roadmap/roadmap-reconciliation-v1/master_inventory_v3.md) story seeds remain reference; supersedes [v2](../design/v2/mvp-roadmap/roadmap-reconciliation-v1/master_inventory_v2.md)/[v1](../design/v2/mvp-roadmap/roadmap-reconciliation-v1/master_inventory_v1.md)
- [TrAIdit MVP Roadmap Reconciliation v0](../design/v2/mvp-roadmap/README.md)
- [TrAIdit MVP Roadmap v0](../design/v2/mvp-roadmap/traidit_mvp_roadmap_v0.md)
- [MVP Dependency Graph v0](../design/v2/mvp-roadmap/mvp_dependency_graph_v0.md)
- [Post-WEB-RESET Stabilization Packet v0](../design/v2/mvp-roadmap/post_web_reset_stabilization_packet_v0.md)
- [Historic Simulator Scope v0](../design/v2/mvp-roadmap/historic_simulator_scope_v0.md)
- [Live Paper Flow Scope v0](../design/v2/mvp-roadmap/live_paper_flow_scope_v0.md)
- [Paper Budget / Allocation Model v0](../design/v2/mvp-roadmap/paper_budget_allocation_model_v0.md)
- [Simulator Run Wallet And Recorded Run Reuse v0](../design/v2/mvp-roadmap/simulator_run_wallet_and_recorded_run_reuse_v0.md)
- [Data Source Research Plan v0](../design/v2/mvp-roadmap/data_source_research_plan_v0.md)
- [Market Data Source Option Slate v0](../design/v2/mvp-roadmap/market_data_source_option_slate_v0.md)
- [News / Event Input Scope v0](../design/v2/mvp-roadmap/news_event_input_scope_v0.md)
- [Evidence Confidence Matrix v0](../design/v2/mvp-roadmap/evidence_confidence_matrix_v0.md)
- [Evidence Confidence Matrix Agent Decision Doctrine v0](../design/v2/mvp-roadmap/evidence_confidence_matrix_agent_decision_doctrine_v0.md)
- [M4 EvalCal Scope Bridge v0](../design/v2/mvp-roadmap/m4_evalcal_scope_bridge_v0.md)
- [Agent Creation / Manifest Scope Bridge v0](../design/v2/mvp-roadmap/agent_creation_manifest_scope_bridge_v0.md)
- [Symbol Universe Editing Scope Bridge v0](../design/v2/mvp-roadmap/symbol_universe_editing_scope_bridge_v0.md)
- [Analysis / Compare Scope Bridge v0](../design/v2/mvp-roadmap/analysis_compare_scope_bridge_v0.md)
- [BI-2 Readiness Schedule v0](../design/v2/mvp-roadmap/bi2_readiness_schedule_v0.md)
- [Open Questions And Professional Gates v0](../design/v2/mvp-roadmap/open_questions_and_professional_gates_v0.md)
- [Alpha Preparation / Deployment Readiness Backlog v0](../design/v2/mvp-roadmap/alpha_preparation_deployment_readiness_backlog_v0.md)

MVP Roadmap artifacts are docs-only planning. They record roadmap corrections and dependency ordering, but they do not implement Simulator, Live Paper Flow, Paper Budget, Agent Creation, Symbol Universe Editing, EvalCal, Research workstation mode, backend schema, live trading, order submission, fills, true P&L, or AI command authority.

## Data Sources / Provider Roles
- [Data Source / Provider Role Map v0](../design/v2/data-sources/README.md)
- [Provider Role Map v0](../design/v2/data-sources/provider_role_map_v0.md)
- [Recommended MVP Provider Path v0](../design/v2/data-sources/recommended_mvp_provider_path_v0.md)
- [Alpaca Broker / Paper / Account Lane v0](../design/v2/data-sources/alpaca_broker_paper_account_lane_v0.md)
- [Polygon / Massive Market Data Lane v0](../design/v2/data-sources/polygon_massive_market_data_lane_v0.md)
- [Normalized Market Data Contracts v0](../design/v2/data-sources/normalized_market_data_contracts_v0.md)
- [Provider Adapter Architecture v0](../design/v2/data-sources/provider_adapter_architecture_v0.md)
- [Local Historical Data Prototype Plan v0](../design/v2/data-sources/local_historical_data_prototype_plan_v0.md)
- [Source Freshness / Fallback Model v0](../design/v2/data-sources/source_freshness_fallback_model_v0.md)
- [Open Questions And Professional Gates v0](../design/v2/data-sources/open_questions_and_professional_gates_v0.md)

Data-source artifacts are docs-only planning. Current direction is Alpaca for broker/paper/account-state, Polygon / Massive for market-data/symbol-context/historical-bars, Alpha Vantage as prototype/backup/news-sentiment candidate, structured news later, X API as expert-feed/breaking-news frontier, and user-configured external sources later. This direction does not implement providers, purchase access, activate brokers, clear licensing, or authorize live authority.

## Agent Archetypes
- [Agent Archetypes README](../design/v2/agent-archetypes/README.md)
- [AGENT-ARCHETYPES-01 - Archetype Definition / Composition / Manifest Seed / Promotion Doctrine](../design/v2/agent-archetypes/agent-archetypes-01-definition-composition-manifest-seed-promotion-doctrine/README.md)
- [Development Archetypes v0](../design/v2/agent-archetypes/development-v0/README.md)
- [Development Archetype Set v0](../design/v2/agent-archetypes/development-v0/development_archetype_set_v0.md)
- [Archetype Definition And Scope v0](../design/v2/agent-archetypes/development-v0/archetype_definition_and_scope_v0.md)
- [Archetype Artifact Schema v0](../design/v2/agent-archetypes/development-v0/archetype_artifact_schema_v0.md)
- [Archetype To Simulator Test Map v0](../design/v2/agent-archetypes/development-v0/archetype_to_simulator_test_map_v0.md)
- [Archetype To EvalCal Map v0](../design/v2/agent-archetypes/development-v0/archetype_to_evalcal_map_v0.md)
- [Canonical Alpha Archetype Path v0](../design/v2/agent-archetypes/development-v0/canonical_alpha_archetype_path_v0.md)

AGENT-ARCHETYPES-01 defines archetypes as named, versioned, inspectable manifest-seed recipes. It preserves the distinction between current runtime built-ins, Development Archetype documentation fixtures, and future Canonical Alpha Archetypes, while keeping Agent Creation, runtime APIs, Runner, EvalCal, Paper Flow, Portfolio Core, live/broker behavior, and canonical alpha promotion unimplemented.

Development Archetypes v0 are temporary, non-canonical development/test scaffolding. They do not claim investment strategy, market edge, or live-trading authority.

## Historic Simulator
- [Historic Simulator README](../design/v2/historic-simulator/README.md)
- [Historic Simulator Data Contracts / Local Historical Data Prototype v0](../design/v2/historic-simulator/data-contracts-v0/README.md)
- [Historic Simulator Data Contracts Brief v0](../design/v2/historic-simulator/data-contracts-v0/historic_simulator_data_contracts_brief_v0.md)
- [Historical Bar Contract v0](../design/v2/historic-simulator/data-contracts-v0/historical_bar_contract_v0.md)
- [Replay Scenario Contract v0](../design/v2/historic-simulator/data-contracts-v0/replay_scenario_contract_v0.md)
- [Simulator Run Contract v0](../design/v2/historic-simulator/data-contracts-v0/simulator_run_contract_v0.md)
- [Simulator Evidence Event Contract v0](../design/v2/historic-simulator/data-contracts-v0/simulator_evidence_event_contract_v0.md)
- [Simulator Decision Output Contract v0](../design/v2/historic-simulator/data-contracts-v0/simulator_decision_output_contract_v0.md)
- [Paper Budget Replay Contract v0](../design/v2/historic-simulator/data-contracts-v0/paper_budget_replay_contract_v0.md)
- [Source Freshness / Fallback Labels v0](../design/v2/historic-simulator/data-contracts-v0/source_freshness_fallback_labels_v0.md)
- [Local Historical Data Prototype v0](../design/v2/historic-simulator/data-contracts-v0/local_historical_data_prototype_v0.md)
- [Local Data File Manifest v0](../design/v2/historic-simulator/data-contracts-v0/local_data_file_manifest_v0.md)
- [Provider Adapter Boundary v0](../design/v2/historic-simulator/data-contracts-v0/provider_adapter_boundary_v0.md)
- [Polygon / Massive Historical Path v0](../design/v2/historic-simulator/data-contracts-v0/polygon_massive_historical_path_v0.md)
- [Alpaca Boundary For Simulator v0](../design/v2/historic-simulator/data-contracts-v0/alpaca_boundary_for_simulator_v0.md)
- [Archetype Fixture Usage v0](../design/v2/historic-simulator/data-contracts-v0/archetype_fixture_usage_v0.md)
- [Symbol Universe Replay Scope v0](../design/v2/historic-simulator/data-contracts-v0/symbol_universe_replay_scope_v0.md)
- [First Implementation Packet Recommendation v0](../design/v2/historic-simulator/data-contracts-v0/first_implementation_packet_recommendation_v0.md)
- [Open Questions And Professional Gates v0](../design/v2/historic-simulator/data-contracts-v0/open_questions_and_professional_gates_v0.md)
- [HIST-SIM-01 Implementation Packet](../design/v2/historic-simulator/hist-sim-01-implementation-packet/README.md)
- [HIST-SIM-01 Task Packet v0](../design/v2/historic-simulator/hist-sim-01-implementation-packet/hist_sim_01_task_packet_v0.md)
- [SIM-UI-01 Implementation Packet](../design/v2/historic-simulator/sim-ui-01-implementation-packet/README.md)
- [HIST-SIM-02A Provider Recent Scenario Preview](../design/v2/historic-simulator/hist-sim-02a-provider-recent-scenario-preview/README.md)
- [HIST-SIM-02B Provider Intraday Bar Granularity](../design/v2/historic-simulator/hist-sim-02b-provider-intraday-granularity/README.md)
- [HIST-SIM-02C Session Scope / Regular Trading Window Normalization](../design/v2/historic-simulator/hist-sim-02c-session-scope-normalization/README.md)
- [Scenario Regime Taxonomy / Scenario Metadata Classification v0](../design/v2/historic-simulator/scenario-regime-taxonomy-v0/README.md)
- [Scenario Regime Taxonomy v0](../design/v2/historic-simulator/scenario-regime-taxonomy-v0/scenario_regime_taxonomy_v0.md)
- [SIM-GRAPH-01 Chart Library Selection / Simulator Graph Rendering Spike](../design/v2/historic-simulator/sim-graph-01-chart-library-selection/README.md)
- [SIM-GRAPH-02 Graph Controls / Interval / Zoom / View State](../design/v2/historic-simulator/sim-graph-02-controls-view-state/README.md)
- [SIM-LOADER-01 Scenario Loader UX Cleanup](../design/v2/historic-simulator/sim-loader-01-scenario-loader-ux-cleanup/README.md)
- [Simulator Replay / Playhead / Preview Model v0](../design/v2/historic-simulator/simulator-replay-playhead-preview-v0/README.md)
- [SIM-MICROPATH-01 Interpolated Micro-Path / Synthetic Evidence Stream Model](../design/v2/historic-simulator/sim-micropath-01-interpolated-evidence-stream/README.md)
- [SIM-MICROPATH-02 Interpolated Event Stream Implementation Packet](../design/v2/historic-simulator/sim-micropath-02-interpolated-event-stream-implementation/README.md)
- [SIM-MICROPATH-03 OHLC-Aware Interpolation Policy / Synthetic Path Upgrade](../design/v2/historic-simulator/sim-micropath-03-ohlc-aware-interpolation-policy/README.md)
- [SIM-MARKERS-01 Decision Marker Overlay Skeleton / Static Mock Evidence](../design/v2/historic-simulator/sim-markers-01-decision-marker-overlay-skeleton/README.md)
- [SIM-SEARCH-01 Provider Recent Scenario Search / Descriptor Creation](../design/v2/historic-simulator/sim-search-01-provider-recent-scenario-search/README.md)
- [SIM-SEARCH-02 Unified Scenario Loader / Provider Recent Descriptor Creation](../design/v2/historic-simulator/sim-search-02-unified-scenario-loader/README.md)
- [SIM-RUNNER-01 Schema And Contract Readiness v0](../design/v2/historic-simulator/sim-runner-01-schema-contract-readiness-v0/README.md)
- [Historic Simulator Graph Views / Workflow Model v0](../design/v2/historic-simulator/graph-workflow-v0/README.md)
- [Simulator Graph Workflow Brief v0](../design/v2/historic-simulator/graph-workflow-v0/simulator_graph_workflow_brief_v0.md)
- [Simulator Operator Workflow v0](../design/v2/historic-simulator/graph-workflow-v0/simulator_operator_workflow_v0.md)
- [Simulator Scenario Catalog Model v0](../design/v2/historic-simulator/graph-workflow-v0/simulator_scenario_catalog_model_v0.md)
- [Loaded Scenario Control Model v0](../design/v2/historic-simulator/graph-workflow-v0/loaded_scenario_control_model_v0.md)
- [Historic Trading Day Details Window v0](../design/v2/historic-simulator/graph-workflow-v0/historic_trading_day_details_window_v0.md)
- [Historic Trading Day Search Window v0](../design/v2/historic-simulator/graph-workflow-v0/historic_trading_day_search_window_v0.md)
- [Historic Trading Day Preview Model v0](../design/v2/historic-simulator/graph-workflow-v0/historic_trading_day_preview_model_v0.md)
- [Symbol Graph View Model v0](../design/v2/historic-simulator/graph-workflow-v0/symbol_graph_view_model_v0.md)
- [Version Graph View Model v0](../design/v2/historic-simulator/graph-workflow-v0/version_graph_view_model_v0.md)
- [Decision Marker Overlay Model v0](../design/v2/historic-simulator/graph-workflow-v0/decision_marker_overlay_model_v0.md)
- [Graph Legend Selection Model v0](../design/v2/historic-simulator/graph-workflow-v0/graph_legend_selection_model_v0.md)
- [Graph Tooltip Anatomy v0](../design/v2/historic-simulator/graph-workflow-v0/graph_tooltip_anatomy_v0.md)
- [B/A/S/H Decision Opportunity Model v0](../design/v2/historic-simulator/graph-workflow-v0/bash_decision_opportunity_model_v0.md)
- [Graph To Decision Timeline Interop v0](../design/v2/historic-simulator/graph-workflow-v0/graph_to_decision_timeline_interop_v0.md)
- [Simulator Graph Projection Requirements v0](../design/v2/historic-simulator/graph-workflow-v0/simulator_graph_projection_requirements_v0.md)
- [Paper Equity Curve Model v0](../design/v2/historic-simulator/graph-workflow-v0/paper_equity_curve_model_v0.md)
- [Paper Mode Graph Inheritance v0](../design/v2/historic-simulator/graph-workflow-v0/paper_mode_graph_inheritance_v0.md)
- [Paper Recording To Simulator Bridge v0](../design/v2/historic-simulator/graph-workflow-v0/paper_recording_to_simulator_bridge_v0.md)
- [Replay Transport Workflow v0](../design/v2/historic-simulator/graph-workflow-v0/replay_transport_workflow_v0.md)
- [Chart Library Selection Criteria v0](../design/v2/historic-simulator/graph-workflow-v0/chart_library_selection_criteria_v0.md)
- [HIST-SIM-01 Implications v0](../design/v2/historic-simulator/graph-workflow-v0/hist_sim_01_implications_v0.md)
- [Graph Workflow Open Questions v0](../design/v2/historic-simulator/graph-workflow-v0/open_questions_v0.md)

Historic Simulator artifacts include docs-only planning plus completed HIST-SIM-01, SIM-UI-01/SIM-UI-01A, HIST-SIM-02A/B/C, SIM-GRAPH-01/01A/02, SIM-LOADER-01/01A/01B, SIM-SEARCH-02/02A/02B, SIM-REPLAY-01A, and SIM-MICROPATH-02/02A/03 implementation truth. HIST-SIM-01 provides local/synthetic list/load API/client foundations. SIM-UI-01/SIM-UI-01A provide a narrow `/lab` local-fixture Simulator UI loading and repair path. HIST-SIM-02A/B/C provide static Provider Recent Polygon/Massive daily and 5-minute descriptors, live-on-load in-memory normalization, and regular-session filtering for 5-minute Provider Recent scenarios. SIM-GRAPH-01/01A/02 provide the selected-symbol Lightweight Charts rendering path plus local Zoom/Fit view state. SIM-LOADER-01/01A/01B provide compact known-descriptor Load/Search rows, local filtering only, and a polished loaded-scenario Details / Load / Search kebab. SIM-SEARCH-02 provides bounded metadata-only Provider Recent descriptor creation through the unified Load Scenario utility and process-memory API registry; SIM-SEARCH-02A removes the temporary max-5 Symbol Universe cap; SIM-SEARCH-02B polishes generated naming and no-data copy. Scenario Regime Taxonomy v0, Simulator Replay / Playhead / Preview Model v0, and SIM-MICROPATH-01 are docs-only doctrine. SIM-MICROPATH-02 and SIM-MICROPATH-03 are completed implementation slices for deterministic in-memory and OHLC-aware interpolated event streams. SIM-SEARCH-01 is superseded by SIM-SEARCH-02 and remains inactive. Current implementation does not include Paper, arbitrary provider-backed historical queries, deep historical access, provider-bar persistence, MicroPath implementation beyond the completed slices, Agent execution, decision markers, DecisionEvidencePackage records, broker behavior, live trading, orders, fills, positions, true P&L, or AI command authority.

## Accepted v2 product/evaluation package
- [Product Vision Intake Report](../design/v2/product-vision-intake/traidit_product_description_intake_report.md)
- [TrAIdit v2 Product Model](../design/v2/product-model/traidit_v2_product_model.md)
- [Terminology Migration Plan](../design/v2/product-model/terminology_migration_plan.md)
- [TrAIder Workspace Concept](../design/v2/product-model/traider_workspace_concept.md)
- [Marketplace Future Scope Brief](../design/v2/product-model/marketplace_future_scope_brief.md)
- [Agent Evaluation Profile Model](../design/v2/evaluation/agent_evaluation_profile_model.md)
- [Trading Performance Profile Model](../design/v2/evaluation/trading_performance_profile_model.md)
- [Scenario Test Suite Model](../design/v2/evaluation/scenario_test_suite_model.md)
- [Analyzer Agent Model](../design/v2/evaluation/analyzer_agent_model.md)
- [Evaluation and Readiness Integration](../design/v2/evaluation/evaluation_readiness_integration.md)
- [EvalCal Module Spec](../design/v2/modules/evalcal_module_spec.md)

## Additional v2 specs
- [Decision Timeline Detailed UI Spec](../design/v2/timeline/decision_timeline_detailed_ui_spec.md)
- [Timeline Event Taxonomy and Data Model](../design/v2/timeline/timeline_event_taxonomy_and_data_model.md)
- [Event Stream Timeline Doctrine v0](../design/v2/timeline/event-stream-timeline-doctrine-v0/README.md)
  - [WDA-EST-01 - Event Stream Timeline Surface / Event Log / Selected Workbench Placeholder](../design/v2/timeline/event-stream-timeline-doctrine-v0/wda-est-01-event-stream-timeline-surface/README.md)
  - [EST-02 - Timeline Architecture Spike](../design/v2/timeline/event-stream-timeline-doctrine-v0/est-02-timeline-architecture-spike/README.md)
  - [EST-03 - Timeline Projection Implementation](../design/v2/timeline/event-stream-timeline-doctrine-v0/est-03-timeline-projection-implementation/README.md)
  - [EST-04 - Lab Timeline Convergence Spike](../design/v2/timeline/event-stream-timeline-doctrine-v0/est-04-lab-timeline-convergence-spike/README.md)
  - [EST-05 - Prototype C Layout Alignment](../design/v2/timeline/event-stream-timeline-doctrine-v0/est-05-prototype-c-layout-alignment/README.md)
  - [EST-05 Tier-2 - Prototype C Canvas Rendering](../design/v2/timeline/event-stream-timeline-doctrine-v0/est-05-tier2-canvas-rendering/README.md)
  - [EST-07 - Simulator Timeline UI Repairs (live-QA repair set + doctrinal supersessions)](../design/v2/timeline/event-stream-timeline-doctrine-v0/est-07-simulator-timeline-repairs/README.md)
- [Decision Details Module Spec](../design/v2/modules/decision_details_module_spec.md)
- [Agent Details Module Spec](../design/v2/modules/agent_details_module_spec.md)
- [Readiness Module Spec](../design/v2/modules/readiness_module_spec.md)
- [Research / Symbol Universe Module Spec](../design/v2/modules/research_symbol_universe_module_spec.md)
- [Provider Data and Source Provenance Model](../design/v2/data/provider_data_and_source_provenance_model.md)
- [Agent Profile Snapshot Model](../design/v2/data/agent_profile_snapshot_model.md)
- [Execution Evidence Model, Future](../design/v2/data/execution_evidence_model_future.md)
- [AI Assistance and Command Authority Model](../design/v2/ai/ai_assistance_and_command_authority_model.md)

## Lab v2 implementation-readiness
- [Lab v2 MVP Scope](../design/v2/implementation-readiness/lab_v2_mvp_scope.md)
- [Lab v2 Non-Goals and Boundaries](../design/v2/implementation-readiness/lab_v2_non_goals_and_boundaries.md)
- [Lab v2 Architecture Decomposition Plan](../design/v2/implementation-readiness/lab_v2_architecture_decomposition_plan.md)
- [Lab v2 Milestone Plan](../design/v2/implementation-readiness/lab_v2_milestone_plan.md)
- [Lab v2 Architect Preflight](../design/v2/implementation-readiness/lab_v2_architect_preflight.md)
- [Lab v2 Architect Handoff](../design/v2/implementation-readiness/lab_v2_architect_handoff.md)

The context wiki interprets and operationalizes this design corpus.

---

# Authority Rule

When documents conflict:

1. Accepted ADRs and governance rules define constraints.
2. [CURRENT_STATE](../CURRENT_STATE.md) defines implementation reality.
3. Canonical pages define synthesized current understanding.
4. Team and operations pages define working process and role execution.
5. Design docs define intent and future direction.
6. Raw evidence informs but does not govern until synthesized.

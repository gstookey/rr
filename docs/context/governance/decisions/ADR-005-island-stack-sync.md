---
schema: corpus-doc/v1
status: accepted
title: ADR-005 — The two islands' stacks must match
areas: [isolated-network, system-architecture, technology-stack, planning]
related: ["docs/context/canonical/two_island_model.md", "docs/design/packets/iso-net-readiness-01-design-packet/decision_register_v0.md", "docs/context/governance/contradictions/register.md"]
updated: 2026-09-03
---

# ADR-005 — The two islands' stacks must match

**Date:** 2026-09-03 | **Status:** **accepted** — closed by Graham in session ("the answer to island sync is... they need to match. Despite two separate islands, their deployment environments will be shared and I think we're going to need them to match up.") | Closes **DR-10**.

## Decision

Legacy Island's and Desert Island's technology stacks **must match**. Driver, in Graham's words: shared deployment environments — the two islands' systems co-reside in the same cluster at deploy time.

## Consequences

1. **Desert Island's stack is bound to the legacy estate's achievable ceiling.** Legacy is the harder side to move, so **legacy's landing version is the shared version**. This sharpens the standing guidance: do **not** pin Desert Island's scaffold (LOE-8 / EP-05) until legacy's landing version is known.
2. **The hop-ladder rehearsals now determine both islands' stack**, not just legacy's upgrade cost — and DR-04 ("how far does the estate go") is now a **two-island decision**. Every rung rehearsed is direct input to it.
3. **The cost of stalling is now named:** if the estate stops at v19, Desert Island *launches* three majors behind current, carrying forward the very security posture that motivated this programme. This is the strongest argument for completing the ladder to v22.
4. **Matching is an ongoing operating commitment, not a one-time alignment.** Every future upgrade becomes a coordinated two-island event: two transfer cycles, two change-control paths, one version. Plan and staff for it as such.
5. **The "golden" bundle changes role:** it is no longer Desert Island's independent stack — it is the shared target *if* the estate can reach v22. Having both a bare-minimum-v22 bundle and a golden bundle prepared lets Graham take this decision either way without a rebuild.

## Open sub-question — `[NEEDS GRAHAM]` (proceeding on the strictest reading until answered)

- **Granularity:** identical *exact* versions, or same-major with patch drift tolerated? Exact parity makes every patch bump a synchronized two-island port; same-major parity is materially cheaper to operate. **Until answered, plan for identical exact versions.**
- **Layer:** what actually binds at the cluster boundary is likely the **Node runtime and shared runtime libraries** (`@other-team/core-*`; AstroUXDS if design-system consistency across apps matters) — Angular compiles to static output and is usually the forgiving layer. If the real constraint is narrower than "everything," that buys significant operational slack. This is a question for Graham/the deploy-topology owner, not an assumption to resolve here.

## Record updates

DR-10 struck through in the decision register (points here). C-008 in the contradiction register remains an accepted tension but its resolution condition now reads through this ADR + DR-04. `two_island_model.md` carries the sync requirement as a governing fact.

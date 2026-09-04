---
schema: corpus-doc/v1
status: active
title: Current Priorities
areas: [planning, context-system]
related: ["docs/CURRENT_STATE.md", "docs/context/canonical/isolated_network_constraints.md", "docs/context/canonical/two_island_model.md", "docs/context/governance/contradictions/register.md"]
updated: 2026-09-03
---

# Current Priorities

**Created:** 2026-08-25 | **Last updated:** 2026-09-03 (Axium; post-merge closeout — the ladder arc is on `main`; the lane is now the first REAL hop, `first-app-hop-01`)

Compact operating context. Readable in one window. Standing truth lives in `docs/CURRENT_STATE.md`; this page is *sequencing and intent*.

## Goals (from AGENTS.md)

- **Short-term:** plan and prepare to stand up RR's software technology stack and dev environment on isolated networks — **two** of them, see `two_island_model.md`.
- **Long-term:** execute the plan, get RR into development, release a version within ~12 months (from 2026-08).

## Milestone 1 — Legacy Island to Angular 19 minimum

> "We HAVE to get legacy to 19 at minimum, so that's our first real goal. That's our first objective." — Graham, 2026-08-26

Everything on the board is either **on Milestone 1's path** or is **discovery work that sizes it**. This is the organizing objective; other lanes are prepared, not pursued, until it is in hand.

Why this and not the v22 stretch: v19 is a **hard floor** (it discharges the Angular 17 / Node 22.15 security exposure), while v22 is a preference whose cost is unknown until the estate inventory returns. And — verified 2026-08-25 — **Milestone 1 needs no Node change at all**: Node 22.15 already satisfies Angular 18 and 19. Only v22 needs a newer Node. Full matrix: `two_island_model.md`.

## What matters now

1. **Get the questionnaires out — one per island.** Their lead time is not ours to control, and most other planning is partly speculative until they return. Legacy Island's variant carries the highest-value questions ([S-01](https://github.com/gstookey/rr/issues/8)); Desert Island's assumes nothing despite being greenfield ([S-02](https://github.com/gstookey/rr/issues/9)).
2. **Collect the legacy estate inventory** ([S-03](https://github.com/gstookey/rr/issues/10)). The largest body of work in the programme has no size at all until this returns, and it is the evidence that decides DR-04 (v19 floor vs v22 stretch).
3. **~~Rehearse the hops~~ The whole ladder is rehearsed and merged — the lane is now the first REAL hop.** All five rungs (17→22) are proven estate-shaped on the shells, the 17→22 pool is offline-verified and rebuildable by a tested script, and every per-rung effort signal is recorded (`legacy-shell-bundle-01`, PRs #29/#31). **This side has run out of things that meaningfully reduce risk.** What remains is measurement that only the island can produce, in this order:
   1. **Graham runs `--delta-from` against a Nexus package listing** — turns the 355.6 MB pool into a measured payload (the estate builds on the island today, so Nexus probably already serves the whole v17 surface; if so Milestone 1 ports as ~87 MB of hop deltas).
   2. **Graham guinea-pigs the first real application, 17→18→19**, using the field kit in [`first-app-hop-01`](../../design/packets/first-app-hop-01-design-packet/README.md). The shells carry the estate's dependency surface but almost no source, so the migrations' *code-editing* behaviour is still entirely unmeasured. **This is the single highest-value action available to the programme.**
   3. What comes back seeds the S-03 inventory bands and is the evidence DR-04 has been waiting for.

   Deliberately **not** built next: the specced "golden" bundle. It is capability for DR-04, and under ADR-005 its pins are bound to legacy's achieved ceiling — both unknown until step 2 returns. Available on request the moment Graham wants the option in hand.
4. **Close the cheap decisions** ([S-04](https://github.com/gstookey/rr/issues/11)): C-001's layout half (DR-05) and whether to ship the npm cache alongside the registry seed (DR-09). Graham's judgement only; free now, expensive once scaffolding starts.
5. **The Node patch bump is independent and probably the cheapest risk reduction available** ([S-13](https://github.com/gstookey/rr/issues/20)): 22.15 → 22.23.2 is a patch inside the same LTS line, needs no Angular work, and closes the Node half of the security driver on its own.

## Side-quest lane — DDD-ARCH-01 (design only, beside Milestone 1)

Opened 2026-09-03 at Graham's direction as a Context Enrichment Side-Quest: the Desert Island system architecture, **front-end first**. It does not displace Milestone 1 and activates nothing. What it needs next, in order: (1) Graham reads the seven briefs in `docs/context/platform/research/` — **pass 2 (modernized to the 2026 signal-first idiom) supersedes his pass-1 read of R7**; start with R7 §4.2/§4.2a/§7, then R1, R4; (2) rulings round 1 on `ddd-arch-01-design-packet/decision_register_v0.md` (DA-D1..D6, D8) — pass 2 merged as PR #32; (3) the harvested questions Q1..Q12 ride along with the island questionnaires (S-01/S-02) — **Q1, "what are the bounded contexts?", is the gate past which the packet cannot proceed without domain input**; (4) lexicon pass + redraw of the C4 set after the rulings. **(5) ACME Invent (EP-06):** the walking-skeleton reference app is cut (`acme-invent-01-design-packet/`, S-18..S-25) — **S-18 (Foundation) starts on Graham's word**; slices ship as click-ready PRs, one proof each.

## Planning surface

Board: **Project Road Runner Roadmap** — `https://github.com/users/gstookey/projects/3`. Epics stood up 2026-08-26 with Graham's approval:

| Epic | Workstream |
|---|---|
| [EP-01](https://github.com/gstookey/rr/issues/3) | Readiness & Discovery (both islands) |
| [EP-02](https://github.com/gstookey/rr/issues/4) | Offline Supply Chain & Transfer Bundles |
| [EP-03](https://github.com/gstookey/rr/issues/5) | Legacy Island — Angular v17 to v19+ upgrade **(carries Milestone 1)** |
| [EP-04](https://github.com/gstookey/rr/issues/6) | Desert Island — environment stand-up |
| [EP-05](https://github.com/gstookey/rr/issues/7) | Desert Island — new system scaffolds & stack docs (placeholder, no stories) |
| [EP-06](https://github.com/gstookey/rr/issues/37) | **ACME Invent — the DDD reference application** (stories S-18..S-25, #38–#45; created 2026-09-03 with Graham's approval; **none activated**) |

Seventeen stories (S-01..S-17) exist as sub-issues. **Seven are closed** as of the 2026-09-03 closeout — S-07, S-08, S-09, S-10, S-11, S-14, S-15, all delivered by PRs #25/#26/#28/#29/#31. Closing records a Graham-gated closeout; it is never itself a decision (rule 16). **Of the ten still open, none has been activated** — creation is not activation; moving a story to In Progress still needs Graham's explicit approval. Story detail and sequence: `docs/design/packets/iso-net-readiness-01-design-packet/story_decomposition_v0.md`. Open decisions: `.../decision_register_v0.md` (DR-01..DR-10).

## How we got here (historical, 2026-08-25)

Axium recommended opening with the **Isolated-Network Readiness Packet** — the intake for LOE-1 and the spine for LOE-4/5 — on the reasoning that every stack choice on the table is only real if it can be installed, mirrored, built and tested offline, and that a stack elegant on the internet and unbuildable offline is theater. Graham accepted; the packet was cut on 2026-08-25 (`docs/design/packets/iso-net-readiness-01-design-packet/`). The alternative considered and not taken was a provisional monorepo skeleton first — faster progress, higher rework risk.

The recommendation predated the two-island correction and spoke of "the island," singular. It was substantially right about sequencing and wrong about the shape of the target.

## Not now

- Application feature design. No domain model exists yet for RR-the-product; anything written now would be invention. *(DDD-ARCH-01 respects this: it designs the shape — tiers, libraries, identity, contracts — and stops at the context map, which needs the island's domain experts.)*
- Multi-user / auth / deployment topology beyond what the Helm blueprint sketches.
- Porting Marin (orchestration coordinator) into `.claude/agents/` — only when a run needs it.

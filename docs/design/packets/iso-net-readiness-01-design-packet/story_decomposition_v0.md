---
schema: corpus-doc/v1
status: exploratory
title: Story Decomposition v0 — Isolated-Network Readiness
areas: [planning, isolated-network, process-governance]
related: ["docs/context/team/agents/planning_surface_workflow.md", "docs/context/canonical/current_priorities.md", "docs/design/packets/iso-net-readiness-01-design-packet/README.md", "docs/design/packets/iso-net-readiness-01-design-packet/decision_register_v0.md"]
updated: 2026-08-25
---

# Story Decomposition v0

**Created:** 2026-08-25 | **Last updated:** 2026-08-25 | **Status:** `exploratory` — **proposals only. No board issues created. Nothing activated.**

> **Activation is Graham's.** Per `planning_surface_workflow.md` and operating-contract rule 16, a story is cut in docs (this file) and only *becomes* a board issue with Graham's explicit approval. Nothing below has been written to the GitHub Project. Axium does not activate lanes.

## Board conventions these follow

Each candidate below is written to be **thin** — a title, one value line, a size, and a link to the controlling doc section. That is the entire board item. Scope, boundaries, and acceptance criteria stay in the packet documents and are **not** copied onto the board.

**Open question before any of these can be created:** which `EP-nn:` epic they attach to. The board's current epic structure has not been read from this repo (`CURRENT_STATE.md`: "Board content not verified from this repo as of 2026-08-25"). If no suitable epic exists, creating one is itself a structure change requiring Graham's approval plus a `log.md` entry.

Sizes are **S** (hours), **M** (a day or two), **L** (multi-day / externally gated). Several of these are gated on other people's responses, which makes calendar time and effort diverge sharply — noted per story.

---

## S-01 — Send the island questionnaire

| Field | Value |
|---|---|
| **Value line** | Turns the project's highest-leverage unknowns into answers we can plan against. |
| **Size** | **S** to send · **L** in calendar time — externally gated |
| **Controlling doc** | [`island_questionnaire_v0.md`](island_questionnaire_v0.md) |
| **Depends on** | Graham identifying the right recipients (questionnaire C5) |
| **Done when** | The questionnaire is sent, and answers to **A5, A3, B2, B7** are back and registered under `docs/context/evidence/raw/`. |

Everything else in the preparation phase is partly speculative until this returns. It is small work and it should go out first, before anything is built, because the lead time is not ours to control.

---

## S-02 — Collect the legacy estate inventory

| Field | Value |
|---|---|
| **Value line** | Converts "10+ Angular apps, v17 → v19/v22" from a hope into an estimate with a spread. |
| **Size** | **S** to issue · **L** to collect — roughly 15 minutes per app on the island |
| **Controlling doc** | [`legacy_estate_inventory_template_v0.md`](legacy_estate_inventory_template_v0.md), §"How to fill this in offline, in 15 minutes per app" |
| **Depends on** | Knowing who owns each application (questionnaire B7); possibly DR-06/C1 if app names cannot be written down on this side |
| **Done when** | One filled row per application exists, apps are sorted into the three effort bands, and the result is synthesized into a canonical page. |

**This is the single highest-value item in the packet.** The largest body of work in the whole programme — the estate upgrade — currently has no size at all. One filled table changes that. It can run fully in parallel with S-01.

---

## S-03 — Freeze the pins and specify transfer bundle #1

| Field | Value |
|---|---|
| **Value line** | Defines exactly what crosses the fence, so nothing is discovered missing after it is too late to add. |
| **Size** | **M** |
| **Controlling doc** | [`stack_dependency_manifest_v0.md`](stack_dependency_manifest_v0.md), §"First-order bundle budget" |
| **Depends on** | DR-01 (registry), DR-02 (transfer strategy), DR-09 (ship the cache?); ideally S-01's A-section answers |
| **Done when** | Pins are re-verified and re-dated; the archive set is produced with a checksum manifest; the bundle contents list is complete including the Node installer and every intermediate Angular toolchain the estate needs. |

Note the trap this story exists to avoid: the **intermediate** Angular versions (v18/v19/v20/v21) must be in the bundle, not just the destination v22. It is easy to omit and expensive to discover on the island. Also note the manifest's re-verification rule — pins older than ~30 days are a draft, not a manifest.

---

## S-04 — Rehearse day one on a network-disabled machine

| Field | Value |
|---|---|
| **Value line** | Finds the runbook's errors here, where they cost an hour, instead of there, where they cost a transfer cycle. |
| **Size** | **M** |
| **Controlling doc** | [`day_one_on_the_island_runbook_v0.md`](day_one_on_the_island_runbook_v0.md) — the whole document is the test script |
| **Depends on** | S-03 (there must be a bundle to rehearse with) |
| **Done when** | A machine with networking physically disabled has completed Steps 1–5, **including Step 5d** (`npm ci --offline`), and the runbook has been corrected everywhere reality disagreed with it. |

**The runbook is currently unrehearsed and says so at the top.** Until this story runs, it is a plausible draft, not a procedure — and `isolated_network_constraints.md` already commits us to rehearsing the port-up on a clean, network-disabled machine before the real one. Expect this to find real errors; that is the return on the story.

A worthwhile extension if the appetite is there: hand the corrected runbook to someone who did **not** write it and watch them follow it without helping. Everything they get stuck on is a defect in the document, and it is the closest available simulation of the island, where nobody can help at all.

---

## S-05 — Angular v17 → v18 hop runbook, rehearsed

| Field | Value |
|---|---|
| **Value line** | De-risks the highest-volume, most-repeated work in the programme by proving the first hop before it is done a dozen times. |
| **Size** | **M–L** |
| **Controlling doc** | `docs/angular-upgrade-docs/v17-to-v18/` (raw source); target output is a new LOE-6 packet |
| **Depends on** | Nothing hard — a throwaway v17 app can be built on this side today. Sharper with S-02's inventory in hand. |
| **Done when** | A throwaway v17 application has been taken to v18 on this side following a written procedure, and the procedure has been corrected to match what actually happened. |

Recommended in `current_priorities.md` as the parallel track to this packet. It is the only major piece of work with raw source already in the repo, and it is genuinely parallel — it needs neither the questionnaire nor the bundle. **If Graham wants something moving while S-01/S-02 sit in other people's inboxes, this is that thing.**

Caveat worth stating: a throwaway app rehearses the *mechanics* of the hop, not the estate's real difficulty, which lives in custom builders, custom schematics, and third-party libraries. It does not substitute for S-02.

---

## S-06 — Close the cheap decisions

| Field | Value |
|---|---|
| **Value line** | Removes assumptions from the foundation before anything is built on top of them. |
| **Size** | **S** |
| **Controlling doc** | [`decision_register_v0.md`](decision_register_v0.md) — specifically DR-05 (layout) and DR-09 (ship the cache) |
| **Depends on** | Graham's judgement only. No external input needed. |
| **Done when** | DR-05 is closed as ADR-005, C-001 is fully resolved in the contradiction register, DR-09 is recorded, and `log.md` carries both. |

DR-05 (the `apps/*` + `packages/*` layout, C-001's surviving half) is **cheap now and expensive after LOE-8 starts**. This packet proceeds on the assumption; the assumption should not survive into scaffolding unexamined.

---

## Suggested sequence

```
now, in parallel:
  S-01 ──────────────────────────────► (external, weeks?)
  S-02 ──────────────────────────────► (external, weeks?)
  S-06 ──►                              (Graham, hours)
  S-05 ──────────────────►              (real work, no external gate)

once S-01's A-section answers land:
              S-03 ──────►
                     S-04 ──────►
```

**S-01, S-02 and S-06 should start immediately**; two of them are just waiting on other people and the third takes an afternoon. **S-05 is the substantive work available today** with no external dependency. **S-03 and S-04 are sequenced behind the questionnaire** — building a bundle before knowing the registry situation and the Node ceiling risks building the wrong bundle.

## What is deliberately not proposed here

- **Scaffolding the monorepo** (LOE-8). Explicitly out of scope for this packet, and premature until DR-03 and DR-05 close.
- **Per-hop runbooks beyond v17→v18.** Write them after the first hop teaches us the real shape; writing five runbooks from documentation before rehearsing one is how five wrong runbooks get written.
- **Container/Helm supply chain.** Flagged in the manifest as a separate supply chain. It needs its own packet and should not be quietly absorbed into this one.

---

**Ask for Graham:** which of these to activate, and under which epic. Nothing moves to the board without that answer.

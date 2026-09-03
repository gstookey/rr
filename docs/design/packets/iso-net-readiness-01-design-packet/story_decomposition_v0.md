---
schema: corpus-doc/v1
status: exploratory
title: Story Decomposition v0 — Isolated-Network Readiness
areas: [planning, isolated-network, process-governance]
related: ["docs/context/team/agents/planning_surface_workflow.md", "docs/context/canonical/current_priorities.md", "docs/context/canonical/two_island_model.md", "docs/design/packets/iso-net-readiness-01-design-packet/README.md", "docs/design/packets/iso-net-readiness-01-design-packet/decision_register_v0.md"]
updated: 2026-09-03
---

# Story Decomposition v0

**Created:** 2026-08-25 | **Last updated:** 2026-09-03 (S-07 delivered in full via legacy-shell-bundle-01)

> **Delivery status (2026-08-28):** S-14 and S-15 are **delivered** (both Milestone 1 hops rehearsed — packets `ng-hop-01`, `ng-hop-02`); S-07 and S-08 are **delivered as measurements**, with their seeding/checksum halves still open under S-05. Everything else stands as written.
>
> **Delivery status (2026-09-03):** **S-07 is now delivered in full** pending PR #28 — estate-shaped bundle (1,311 tarballs / 143.4 MB) with SHA256 manifest, reproducible build script, **seeding procedure rehearsed** (npm-publish loop) and the whole 17→18 journey **verified offline** against the bundle-seeded registry (packet `legacy-shell-bundle-01`). This also discharges a large piece of S-16's spirit (the offline path is no longer unrehearsed) and de-risks S-05 (the seeding/checksum mechanics now exist and are written down); both remain open as stories. S-08's estate-shaped rerun (18→19 on the shells) is the proposed next docket item.
>
> **Delivery status (2026-09-03, second round — Milestone 1 rehearsed end to end):** PR #28 merged; Graham corrected the source package.jsons and answered the supply-chain questions; the shells were reconciled and re-walked 17→18→19 in the **real layout** (angular.json in `packages/client/` — `monorepo_hop_procedure_v2.md`). **S-15 and S-08 are delivered estate-shaped**: both Milestone-1 hops rehearsed on the real dependency surface, and the **17→19 master pool** (1,495 tarballs / 191.3 MB, per-rung slices) is SHA-manifested, offline-verified, and rebuildable by a tested lock-driven script (Graham's chosen delivery vehicle). **Graham has additionally directed rehearsing the ladder to v22** — activates S-09/S-10/S-11 as rehearsal+bundle work (capability evidence for DR-04, not its closure), to land separately after the Milestone-1 PR.
>
> **Board status: created, not activated.** Graham approved standing up the epic structure and cutting these stories on 2026-08-26, so they now exist as issues. **None has been moved to In Progress.** Creating a story is not activating it (operating-contract rule 16) — activation still needs Graham's explicit go-ahead, per story.

## The board as it now stands

Planning surface: **Project Road Runner Roadmap** — `https://github.com/users/gstookey/projects/3`, repo `gstookey/rr`.

| Epic | Workstream | Stories |
|---|---|---|
| [EP-01](https://github.com/gstookey/rr/issues/3) | Readiness & Discovery (both islands) | S-01..S-04 |
| [EP-02](https://github.com/gstookey/rr/issues/4) | Offline Supply Chain & Transfer Bundles | S-05..S-11 |
| [EP-03](https://github.com/gstookey/rr/issues/5) | Legacy Island — Angular v17 to v19+ upgrade **(carries Milestone 1)** | S-12..S-15 |
| [EP-04](https://github.com/gstookey/rr/issues/6) | Desert Island — environment stand-up | S-16, S-17 |
| [EP-05](https://github.com/gstookey/rr/issues/7) | Desert Island — new system scaffolds & stack docs | none yet (placeholder) |

### Why these five

- **EP-01 is cross-island on purpose.** Both islands need discovery, from possibly the same people, and splitting it would produce two half-empty epics that compete for the same attention.
- **EP-02 is separate from the island epics** even though bundles serve both. Transfers are the programme's scarce resource — a shared cadence, a shared review queue, possibly a shared size cap. Keeping every bundle in one epic makes that queue visible as one queue. Split across island epics, nobody would ever see the whole transfer load at once.
- **EP-03 and EP-04 are separate islands, separate work, separate people.** Legacy Island upgrades what exists; Desert Island creates what does not.
- **EP-05 exists with no stories.** It is a deliberate placeholder for LOE-4/LOE-8, which are gated on DR-03/DR-05/DR-10 and on Desert Island existing at all. Naming it now stops scaffolding work from being quietly smuggled into another epic.
- **LOE-7 (remote troubleshooting) has no epic** because it has no stories — it is an operating mode that switches on during execution. It gets an epic when it has work, not before.

### A convention note

Stories carry an **`S-nn:` title prefix**, which the planning-surface workflow doc does not currently specify (it specifies `EP-nn:` for epics only). The prefix exists so docs and board map unambiguously onto each other, which is what the thin-board rule wants. **Flagging it as a convention addition** rather than assuming it: if Graham prefers unprefixed story titles, it is a cheap rename now and an annoying one later. Stories are also **unlabeled** — the `story` label did not exist and the workflow doc does not require one.

### Renumbering from the 2026-08-25 draft

The first draft of this document proposed S-01..S-06 before the two-island model was known. Those identifiers were reassigned when the board was cut. **Anyone reading the 2026-08-25 handoff should use this map:**

| Old (2026-08-25 draft) | New | Note |
|---|---|---|
| S-01 Send the island questionnaire | **S-01 + S-02** | split — one questionnaire per island |
| S-02 Collect the legacy estate inventory | **S-03** | |
| S-03 Freeze pins / bundle #1 | **S-05** | now explicitly the *Desert Island* bundle |
| S-04 Rehearse day one | **S-16** | |
| S-05 v17→v18 hop runbook | **S-14** | |
| S-06 Close the cheap decisions | **S-04** | |
| — | S-06..S-13, S-15, S-17 | new |

---

# EP-01 — Readiness & Discovery

### [S-01](https://github.com/gstookey/rr/issues/8) — Legacy Island questionnaire: send and collect
**Value.** Turns Legacy Island's highest-leverage unknowns into answers we can plan against — registry, transfer mechanics, exact versions, app count and owners.
**Size:** S to send · L in calendar time (externally gated). **Doc:** [`island_questionnaire_v0.md`](island_questionnaire_v0.md), Legacy Island variant.
Send the full instrument. B7/B8 feed S-03 directly. **Add the not-yet-written question first:** do the two islands share a transfer mechanism?

### [S-02](https://github.com/gstookey/rr/issues/9) — Desert Island questionnaire: send and collect
**Value.** Establishes what exists on a greenfield network before we plan to build on it.
**Size:** S to send · L in calendar time. **Doc:** [`island_questionnaire_v0.md`](island_questionnaire_v0.md), Desert Island variant.
Ask Section B even though the expected answer is "nothing is installed" — a questionnaire that assumes its own answers collects nothing, and several B questions have real answers on a greenfield network (OS, who provisions machines, whether a git server is planned).

### [S-03](https://github.com/gstookey/rr/issues/10) — Legacy estate inventory: one filled row per application
**Value.** Converts "10+ apps, v17 to v19/v22" from a hope into an estimate with a spread.
**Size:** S to issue · L to collect (~15 min per app). **Doc:** [`legacy_estate_inventory_template_v0.md`](legacy_estate_inventory_template_v0.md).
**Still the single highest-value item on the board.** It is now also the *deciding evidence for DR-04*, since the Node obstacle to v22 largely evaporated — what is left is estate difficulty, which only this measures.

### [S-04](https://github.com/gstookey/rr/issues/11) — Close the cheap decisions (DR-05, DR-09)
**Value.** Removes assumptions from the foundation before anything is built on them.
**Size:** S — Graham's judgement only. **Doc:** [`decision_register_v0.md`](decision_register_v0.md).

---

# EP-02 — Offline Supply Chain & Transfer Bundles

### [S-05](https://github.com/gstookey/rr/issues/12) — Registry strategy + Desert Island stack bundle spec
**Value.** Defines what a bundle *is* for RR — tarball set, lockfile, checksum manifest, verification step — and specifies the first one.
**Size:** M · blocked on DR-01, DR-02, DR-09. **Doc:** [`stack_dependency_manifest_v0.md`](stack_dependency_manifest_v0.md) §"First-order bundle budget".

### [S-06](https://github.com/gstookey/rr/issues/13) — Bundle: supported Node 22.x for Legacy Island
**Value.** Carries the runtime that closes the Node half of the security driver.
**Size:** S to pack. **Doc:** [`two_island_model.md`](../../../context/canonical/two_island_model.md) §Node posture.
Independent of every Angular hop. Pairs with S-13.

### [S-07](https://github.com/gstookey/rr/issues/14) — Bundle: Angular v17 → v18 hop toolchain
Angular 18.2.14 / CLI 18.2.21 / TypeScript 5.5.4. **Runs on Node 22.15 — no runtime change.** **Size:** M.

### [S-08](https://github.com/gstookey/rr/issues/15) — Bundle: Angular v18 → v19 hop toolchain
Angular 19.2.25 / CLI 19.2.27 / TypeScript 5.8.3. **Runs on Node 22.15.** **This bundle reaches Milestone 1's floor.** **Size:** M.

### [S-09](https://github.com/gstookey/rr/issues/16) — Bundle: Angular v19 → v20 hop toolchain *(conditional)*
Angular 20.3.29 / CLI 20.3.34 / TypeScript 5.9.3. Still no runtime change. **Conditional on DR-04.** **Size:** M.

### [S-10](https://github.com/gstookey/rr/issues/17) — Bundle: Angular v20 → v21 hop toolchain *(conditional)*
Angular 21.2.21 / CLI 21.2.21 / TypeScript 6.0.3. The last hop reachable without touching Node. **Conditional on DR-04.** **Size:** M.

### [S-11](https://github.com/gstookey/rr/issues/18) — Bundle: Angular v21 → v22 hop toolchain + Node bump *(conditional)*
Angular 22.1.3 / CLI 22.1.5 / TypeScript 6.0.3. **The only hop needing a Node change** (`^22.22.3 || ^24.15.0 || >=26.0.0`). **Conditional on DR-04**, couples to S-06. **Size:** M–L.

> **The per-hop bundles are the reason this epic exists as its own workstream.** Each hop's toolchain must be in the island's registry *before* that hop is attempted — the intermediates, not just the destination. It is the easiest thing in the programme to under-order and the most expensive to discover late. Sizes per bundle are `UNVERIFIED`: the ~89 MB measured for the Desert Island stack is **not** a per-hop estimate, and each must be measured before packing.

---

# EP-03 — Legacy Island: Angular v17 to v19+ *(carries Milestone 1)*

### [S-12](https://github.com/gstookey/rr/issues/19) — Pre-upgrade build-health triage across the estate
**Value.** An app that does not build today cannot be upgraded. Minutes now, a transfer cycle later.
**Size:** S per app, folds into the S-03 inventory pass. **Doc:** [`legacy_estate_inventory_template_v0.md`](legacy_estate_inventory_template_v0.md) §step 6.

### [S-13](https://github.com/gstookey/rr/issues/20) — Bump Legacy Island Node to a supported 22.x
**Value.** Closes the Node security exposure independently of any Angular work — and it is a patch bump inside 22.x, not a major upgrade.
**Size:** S technically · gated on change control. **Doc:** [`two_island_model.md`](../../../context/canonical/two_island_model.md) §Node posture.
**Probably the cheapest risk reduction in the programme.** Needs no Angular work, blocks nothing, and as a side effect removes v22's only runtime obstacle.

### [S-14](https://github.com/gstookey/rr/issues/21) — v17 → v18 hop runbook, rehearsed on this side
**Value.** De-risks the highest-volume work by proving the first hop here before repeating it across 10+ apps there.
**Size:** M–L · **no external gate.** **Doc:** `docs/angular-upgrade-docs/v17-to-v18/` (raw source).
**The substantive work available today.** Caveat: a throwaway app rehearses the *mechanics*, not the estate's real difficulty (custom builders, custom schematics, third-party libraries). It does not substitute for S-03.

### [S-15](https://github.com/gstookey/rr/issues/22) — v18 → v19 hop runbook, rehearsed on this side
**Value.** The hop that reaches Milestone 1's floor, rehearsed here so the island executes a proven procedure.
**Size:** M–L · follows S-14. **Doc:** `docs/angular-upgrade-docs/v18-to-v19/` (raw source).

---

# EP-04 — Desert Island: environment stand-up

### [S-16](https://github.com/gstookey/rr/issues/23) — Rehearse the day-one runbook on a network-disabled machine
**Value.** Finds the runbook's errors here, where they cost an hour, instead of there, where they cost a transfer cycle.
**Size:** M · depends on S-05. **Doc:** [`day_one_on_the_island_runbook_v0.md`](day_one_on_the_island_runbook_v0.md).
The runbook is currently unrehearsed and says so at the top. Worthwhile extension: hand the corrected version to someone who did not write it and watch them follow it without help — everything they get stuck on is a defect in the document.

### [S-17](https://github.com/gstookey/rr/issues/24) — Desert Island target-stack sync spec
**Value.** The two islands meet in the cluster at deploy time, so their stacks must agree. This pins what "in sync" means concretely.
**Size:** S–M · gated on DR-04 and DR-10. **Doc:** [`two_island_model.md`](../../../context/canonical/two_island_model.md) §Stack synchronization.
Follows Legacy Island's achieved target rather than leading it.

---

# Suggested sequence

```
now, in parallel:
  S-01, S-02 ──────────────────────────────►  (external, weeks?)
  S-03       ──────────────────────────────►  (external, weeks?)
  S-04       ──►                               (Graham, hours)
  S-13/S-06  ──────────►                       (security, independent of Angular)
  S-14       ──────────────────►               (real work, no external gate)

once S-01's Section-A answers land:
              S-05 ──────►
                     S-16 ──────►
                     S-07 ──► S-08 ──►         (Milestone 1's bundles)

after DR-04 closes (post first real hop):
                            S-09 ─► S-10 ─► S-11
```

**Start immediately:** S-01, S-02, S-03, S-04 (three are waiting on other people, one takes an afternoon), plus **S-13/S-06** — the Node bump is independent, cheap, and closes half the security driver on its own. **S-14 is the substantive engineering available today.** Everything else waits on the questionnaire, and correctly so: building a bundle before the registry situation is known risks building the wrong bundle.

# What is deliberately not proposed

- **Scaffolding the monorepo** (LOE-8). Premature until DR-03, DR-05 and now **DR-10** close — the stack-sync constraint means Desert Island's pins are not settled.
- **Per-hop runbooks beyond v18→v19.** Write them after the first hops teach us the real shape; five runbooks written from documentation before rehearsing one is how five wrong runbooks get written.
- **Container/Helm supply chain.** A separate supply chain from npm, needing its own packet. Flagged, not absorbed.

---

**Ask for Graham:** which stories to move to **In Progress**. They exist; none is activated.

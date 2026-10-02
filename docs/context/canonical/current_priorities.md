---
schema: corpus-doc/v1
status: active
title: Current Priorities
areas: [planning, context-system]
related: ["docs/CURRENT_STATE.md", "docs/context/canonical/isolated_network_constraints.md", "docs/context/canonical/two_island_model.md", "docs/context/governance/contradictions/register.md"]
updated: 2026-10-02
---

# Current Priorities

**Created:** 2026-08-25 | **Last updated:** 2026-10-02, later (Axium: Vite/esbuild rows corrected to Angular 22's own pins; Graham to re-vet those two rows); 2026-10-02 (Axium: front-end bundles by SRF approval status — `build-srf-bundles.sh` + how-to); 2026-10-01, later (Axium: ADR-008 settles D-1..D-9; the legacy ladder re-walked to 22.2.1 on the exact-pinned apps and scripted; Nexus npm-loading defects fixed; bundling scripts guide. Earlier: `desert-island-devenv-01` — Desert Island workstation bundles built and rehearsed)

Compact operating context. Readable in one window. Standing truth lives in `docs/CURRENT_STATE.md`; this page is *sequencing and intent*.

## Two lanes, two sessions (Graham, 2026-09-08)

| Lane | Session | Scope |
|---|---|---|
| **Legacy Island / Angular upgrade** | the Axium thread | Milestone 1, the hop ladder, transfer bundles, `first-app-hop-01`, EP-01/02/03 |
| **ACME Workshop / Desert Island** | a separate session | DDD-ARCH-01, EP-06 (S-18..S-25), the architecture description, EP-04/05 |

Shared doctrine — this page, `CURRENT_STATE.md`, `two_island_model.md`, the decisions folder, the contradiction register — is common ground. Either lane may correct shared doctrine; **neither rewrites the other's packets** ([ADR-007](../governance/decisions/ADR-007-acme-workshop-is-a-learning-instrument.md) §Lane ownership).

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
3. **The ladder is rehearsed, re-based on the real pins and scripted — the lane is the first REAL hop (2026-10-01).** Graham's exact-pinned package.json files (SRC-016) re-based the shells; both were walked 17 → **22.2.1** with `tools/hop.sh` and replayed offline against Nexus. The bundle (`build-transfer-bundle.sh`, cumulative ≈ 410 MB) now carries everything the island needs: the tarballs, `upload-to-nexus.sh` (staged `--through <rung>`), `tools/hop.sh`, `LADDER.md`, and Node 22.23.3 for the last rung. Next, in order:
   1. **Re-cut the cumulative bundle on the staging machine** (one command; the committed `bundle/SHA256SUMS` lets it prove byte-identity) and port it. If the 2026-09-03 bundle already went over, `--delta-from legacy-shells/bundle/MANIFEST-2026-09-03-v17v22.json` cuts only what changed.
   2. **Load Nexus with `upload-to-nexus.sh --through 17-18`** — not an `npm publish` loop of your own, and not Nexus's upload API: both lose npm metadata `ng update` needs (found 2026-10-01). `npm view @angular/core@18.2.14 ng-update.packageGroup` must print a list.
   3. **Graham guinea-pigs the first real application, 17→18** with `tools/hop.sh` step by step, using the field kit in [`first-app-hop-01`](../../design/packets/first-app-hop-01-design-packet/README.md) (its tooling notes now point at v3). The migrations' *code-editing* behaviour is still entirely unmeasured — **the single highest-value action available to the programme.** Check `@other-team/core-web-angular`'s peer range first.
   4. What comes back seeds the S-03 inventory bands and is the evidence DR-04 has been waiting for.

4. **~~Close the cheap decisions~~ half done** ([S-04](https://github.com/gstookey/rr/issues/11)): C-001's layout half (DR-05) is **closed — ADR-006**, `apps/` + `packages/` + `services/`. Still open: whether to ship the npm cache alongside the registry seed (DR-09). Graham's judgement only.
5. **The Node patch bump is independent and probably the cheapest risk reduction available** ([S-13](https://github.com/gstookey/rr/issues/20)): the island runs **22.15.1** (Graham, 2026-10-01); **22.23.3** (newest 22.x) now ships inside the ladder bundle — a patch inside the same LTS line, needed by the 21→22 rung anyway, and on its own closes the Node half of the security driver.

## Desert Island workstation environment (`desert-island-devenv-01`, EP-04 work, 2026-10-01)

The stack list and both bundle scripts are done, **rebuilt after Graham's decisions (ADR-008)** and rehearsed offline (front end 10/10 on pnpm; Docker CE installed from the bundle, Testcontainers Postgres from Nexus). Next, in order:

1. **Hand [`devops_tech_stack_list_v2.md`](../../design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v2.md) to DevOps**, with the [bundling scripts guide](../operations/user-workflow/bundling_scripts_guide_v1.md). Open questions to send with it: **O-1** the Desert Island cluster's Kubernetes version (tools are pinned for 1.30 — end-of-life upstream), O-2 TLS/CA, O-3 anonymous read, O-4 reverse-proxy limits, and the **Nexus edition** (CE needs its EULA accepted by an admin). The architect gets A-1..A-5; Graham is chasing **D-7** (one server runtime or two).
2. **Re-cut both bundles on the real staging machine** (one command each — kind's release binary is fetched and checksum-verified there; this rehearsal had to build kind locally) and run `island/prove-install.sh` on a real RHEL 9 workstation: that proves what a container cannot — **a kind cluster reaching Ready**, VS Code/Eclipse on a desktop.
3. **Port by SRF approval status** (Graham, 2026-10-02): build the five category bundles from the current sheet (`build-srf-bundles.sh ~/bundles --sheet <csv>`), port **approved** now, each other category as its SRFs land — step by step in the [SRF category bundles how-to](../operations/user-workflow/srf_category_bundles_howto_v1.md). Push the **TypeScript 6** and **Vite 8** bumps alongside Angular's: they gate the Angular CLI/build (TypeScript also the lint/test tooling) — how-to §6. **Re-vet two rows first** (corrected 2026-10-02): Vite now requests **8.3.0** (still a bump from 5 — any drafted SRF naming 6.x must say 8.3.0), esbuild now **0.28.2** (does the "major 0" approval cover 0.28?).
4. **Pick the augmentation set before porting** (2026-10-02): [`stack_augmentation_candidates_v1.md`](../../design/packets/desert-island-devenv-01-design-packet/stack_augmentation_candidates_v1.md) — new SRFs are the slowest path, so request what the release year needs now. Axium then wires the picks in (stack, relock, mapping, sheet rows), re-rehearses, and reports the locked versions.
5. With approval: an EP-04 story for this packet on the board.

## Side-quest lane — DDD-ARCH-01 (design only, beside Milestone 1)

Opened 2026-09-03 at Graham's direction as a Context Enrichment Side-Quest: the Desert Island system architecture, **front-end first**. It does not displace Milestone 1 and activates nothing. What it needs next, in order: (1) Graham reads the seven briefs in `docs/context/platform/research/` — **pass 2 (modernized to the 2026 signal-first idiom) supersedes his pass-1 read of R7**; start with R7 §4.2/§4.2a/§7, then R1, R4; (2) rulings round 1 on `ddd-arch-01-design-packet/decision_register_v0.md` (DA-D1..D6, D8) — pass 2 merged as PR #32; (3) the harvested questions Q1..Q12 ride along with the island questionnaires (S-01/S-02) — **Q1, "what are the bounded contexts?", is the gate past which the packet cannot proceed without domain input**; (4) lexicon pass + redraw of the C4 set after the rulings. **(5) ACME Workshop (EP-06):** **S-18 (Foundation) merged 2026-09-08 (PR #47)** and closed on the board; S-19 (the Building) is next and unactivated. AW-D13 and AW-D14 ruled 2026-09-04.

**Ruled 2026-09-08 — ACME Workshop is a learning instrument, not the Desert Island scaffold ([ADR-007](../governance/decisions/ADR-007-acme-workshop-is-a-learning-instrument.md)).** It exists so Graham can see how DDD principles play out in real Angular code, and informs design only. Consequences: **C-008 is resolved for this lane** (the "do not scaffold on v22 pins" rule was aimed at the *real* LOE-8 scaffold, which it still binds — ACME ships nothing and is never re-pinned), and **DR-04's stakes return to their prior level** — it decides how far the legacy estate goes and therefore what Desert Island launches on, and nothing more. This lane is now run from a separate session.

## Planning surface

Board: **Project Road Runner Roadmap** — `https://github.com/users/gstookey/projects/3`. Epics stood up 2026-08-26 with Graham's approval:

| Epic | Workstream |
|---|---|
| [EP-01](https://github.com/gstookey/rr/issues/3) | Readiness & Discovery (both islands) |
| [EP-02](https://github.com/gstookey/rr/issues/4) | Offline Supply Chain & Transfer Bundles |
| [EP-03](https://github.com/gstookey/rr/issues/5) | Legacy Island — Angular v17 to v19+ upgrade **(carries Milestone 1)** |
| [EP-04](https://github.com/gstookey/rr/issues/6) | Desert Island — environment stand-up |
| [EP-05](https://github.com/gstookey/rr/issues/7) | Desert Island — new system scaffolds & stack docs (placeholder, no stories) |
| [EP-06](https://github.com/gstookey/rr/issues/37) | **ACME Workshop — the DDD reference application** (stories S-18..S-25, #38–#45; created 2026-09-03 with Graham's approval; **none activated**) |

Twenty-five stories (S-01..S-25) exist as sub-issues. **Eight are closed** — the seven below plus **S-18** (ACME Foundation, closed 2026-09-08). Of the original seventeen, **seven are closed** as of the 2026-09-03 closeout — S-07, S-08, S-09, S-10, S-11, S-14, S-15, all delivered by PRs #25/#26/#28/#29/#31. Closing records a Graham-gated closeout; it is never itself a decision (rule 16). **Of the ten still open, none has been activated** — creation is not activation; moving a story to In Progress still needs Graham's explicit approval. Story detail and sequence: `docs/design/packets/iso-net-readiness-01-design-packet/story_decomposition_v0.md`. Open decisions: `.../decision_register_v0.md` (DR-01..DR-10).

## How we got here (historical, 2026-08-25)

Axium recommended opening with the **Isolated-Network Readiness Packet** — the intake for LOE-1 and the spine for LOE-4/5 — on the reasoning that every stack choice on the table is only real if it can be installed, mirrored, built and tested offline, and that a stack elegant on the internet and unbuildable offline is theater. Graham accepted; the packet was cut on 2026-08-25 (`docs/design/packets/iso-net-readiness-01-design-packet/`). The alternative considered and not taken was a provisional monorepo skeleton first — faster progress, higher rework risk.

The recommendation predated the two-island correction and spoke of "the island," singular. It was substantially right about sequencing and wrong about the shape of the target.

## Not now

- Application feature design. No domain model exists yet for RR-the-product; anything written now would be invention. *(DDD-ARCH-01 respects this: it designs the shape — tiers, libraries, identity, contracts — and stops at the context map, which needs the island's domain experts.)*
- Multi-user / auth / deployment topology beyond what the Helm blueprint sketches.
- Porting Marin (orchestration coordinator) into `.claude/agents/` — only when a run needs it.

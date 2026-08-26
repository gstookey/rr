---
schema: corpus-doc/v1
status: active
title: Project Overview — Project Road Runner
areas: [planning, isolated-network, dev-environment, brand-design]
related: ["docs/context/canonical/technology_stack.md", "docs/context/canonical/isolated_network_constraints.md", "docs/context/canonical/two_island_model.md", "docs/design/brand/README.md"]
updated: 2026-08-26
---

# Project Overview — Project Road Runner (RR)

**Created:** 2026-08-25 | **Last updated:** 2026-08-26 (two-island model added — Graham's direction; see `two_island_model.md`)

## What RR is

RR is a **program stand-up**: preparing for, then executing, the creation of a brand-new software development program and project on **isolated networks**, over the next several weeks/months. This repo is the **outside-the-fence preparation workbench**. The fleet (Axium et al.) lives here, on the "dirty-internet" side; **Graham's access to Claude does not extend onto the islands.** Everything produced here must therefore be executable by humans, from documents and bundles alone, once it crosses.

## Two islands, not one

**The target is two distinct isolated environments** (Graham, 2026-08-26). Full model, drivers, and the verified hop matrix: **`two_island_model.md`** — read it before planning anything environment-specific.

- **Island 1 — Legacy Island:** 10+ Angular applications at **v17** on **Node 22.15**. Must reach **v19 minimum**, v22 if effort allows.
- **Island 2 — Desert Island:** **greenfield — nothing exists yet.** The new system is built and lives here.

They deploy into a related cluster, so their stacks must stay **in sync**; Legacy Island's achieved target sets Desert Island's. The driver for the upgrade is **security exposure** in Angular 17 / Node 22.15, not modernization appetite.

**Milestone 1 — Legacy Island to Angular 19 minimum.** Graham's first objective; everything currently on the board is on its path or sizes it.

## Lines of effort (from SRC-012)

| LOE | Description | Output shape |
|---|---|---|
| LOE-1 Preparation plan | plan + stories for the preparation phase | board epics/stories, packets in `docs/design/packets/` |
| LOE-2 Execution plan | plan + stories for the stand-up execution phase on the island | same |
| LOE-3 Set-up guides | preparatory how-to docs for standing up systems, technologies, environments — largely from scratch | human-executable runbooks |
| LOE-4 Stack documentation | docs for each package **at the exact versions** to be installed | version-pinned reference bundle |
| LOE-5 Transfer bundles | package/file bundles prepared for compression and port-up | artifact manifests + bundles |
| LOE-6 Legacy Angular upgrade | **10+ Angular apps at v17 → v19 minimum, v22 stretch**, on **Legacy Island** | upgrade runbooks per version hop; `docs/angular-upgrade-docs/` is the raw source |
| LOE-7 Remote troubleshooting | during/after port-up, help Graham troubleshoot with access limited to this side | reproduction-from-description discipline; sanitized issue reports |
| LOE-8 Scaffold code | source material / templates, mostly TypeScript/Angular, some Python and Java | `apps/`/`packages/` templates in this repo |

## Team and horizon

Graham (lead front-end engineer, C2) + a human team on the island (npm-fluent, size unknown) + the agent fleet on this side. Prep: weeks/months from 2026-08. Long-term: a released version within ~12 months.

## Still unknown `[NEEDS GRAHAM]`

- What the *product* on Desert Island does (the description covers the program stand-up, not the application's purpose). Fine for now — LOE-1..6 do not need it.
- Team size, roles, and who owns the network/transfer process **for each island** — possibly different people.
- Whether the sibling AstroUXDS app is one of the 10+ legacy apps.
- Whether the two islands share a transfer mechanism or each has its own.

## Reusable vs RR-specific

The stand-up-on-an-island pattern, the transfer-bundle discipline, and the Angular upgrade runbooks are **reusable program concepts** (candidates for `platform/`). The brand and the specific legacy estate are RR-specific.

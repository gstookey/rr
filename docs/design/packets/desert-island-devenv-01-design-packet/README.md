---
schema: corpus-doc/v1
status: exploratory
title: Desert Island Dev Environment Packet 01 — the workstation stack, its two transfer bundles, and the Nexus load path
areas: [dev-environment, isolated-network, technology-stack, frontend, backend]
related: ["docs/design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v1.md", "docs/design/packets/desert-island-devenv-01-design-packet/source_reconciliation_v1.md", "docs/design/packets/desert-island-devenv-01-design-packet/bundle_rehearsal_transcript_v1.md", "docs/context/canonical/two_island_model.md", "docs/design/packets/iso-net-readiness-01-design-packet/day_one_on_the_island_runbook_v1.md", "desert-island-devenv/island/README.md"]
updated: 2026-10-01
---

# Desert Island Dev Environment Packet 01 (`desert-island-devenv-01`)

**Created:** 2026-10-01 (Axium, at Graham's request) | **Status:** `exploratory` — **not activated**; no board story exists yet (creating one is Graham-gated). Epic home: [EP-04 — Desert Island environment stand-up](https://github.com/gstookey/rr/issues/6).

## What Graham asked for

> "a full tech stack list to give to my dev ops team, and … the script to run to generate a bundle that my dev ops team can use to port over and use to set up the new workstations … [and] a script to generate the tech stack bundle for the back end … The end goal will be for all of the devs on the team to be able to complete full stack work and have the necessary packages available in a new nexus instance." — 2026-10-01

## What is here

| Artifact | For | What it is |
|---|---|---|
| [`devops_tech_stack_list_v1.md`](devops_tech_stack_list_v1.md) | **DevOps** | the full, vetted stack: every component, version, where it comes from, which Nexus repository it lands in |
| [`source_reconciliation_v1.md`](source_reconciliation_v1.md) | **Graham** | every correction to the three source lists with its evidence, the four doctrine contradictions (C-011..C-014), decisions D-1..D-9, questions for the architect and DevOps |
| [`bundle_rehearsal_transcript_v1.md`](bundle_rehearsal_transcript_v1.md) | evidence | both bundles built, loaded into a real Nexus, and installed on an offline RHEL 9 container; what passed, the defects found, what is **not** proven |
| [`desert-island-devenv/`](../../../../desert-island-devenv/) | tooling | `stack/` (the pins), `tools/build-*-bundle.sh` (run on a connected machine), `island/` (travels in the bundles: Nexus loader, workstation installers, acceptance test, runbook) |

## The shape of the solution

```
connected staging machine                              isolated network
─────────────────────────                              ────────────────
tools/build-frontend-bundle.sh ─► devenv-frontend-bundle-<date>.tar ─┐
tools/build-backend-bundle.sh  ─► devenv-backend-bundle-<date>.tar  ─┤  media
                                                                     ▼
                         island/nexus-create-repos.sh   (once, admin: npm/maven/raw/pypi/docker hosted)
                         island/load-nexus.sh           (each bundle: verify, upload, skip what's there)
                         island/install-*-workstation.sh system|user   (each machine / each developer)
                         island/prove-install.sh frontend|backend      (empty caches: only Nexus can satisfy it)
```

Design choices worth knowing:

- **The pins live in manifests the scripts read** — `stack/frontend/package.json` + its committed lockfile, `stack/backend/gradle/libs.versions.toml`, `stack/*.env`, `stack/images.txt`. Change a pin there, rebuild; versions of the Cypress, Playwright and Prisma binaries are *derived* from the lockfile so they cannot drift from the packages that expect them.
- **The front-end pool reuses the legacy lane's proven tools** (`legacy-shells/tools/lock-union.mjs`, `fetch-tarballs.mjs`) — one supply-chain mechanism across both islands, which is what ADR-005's convergence asks for.
- **The back-end set is found by building, not by listing:** a small Spring Boot project declaring every library and tool is built (tests, Checkstyle, PMD, JaCoCo, Spotless, bootJar) with an empty Gradle home, and that cache becomes the Maven repository. The build passing is the proof the set is complete — including the tool jars those plugins fetch lazily.
- **Uploads use Nexus's REST API and plain HTTP PUT**, not `npm publish` — the npm client's provenance / dist-tag semantics caused three of the four defects in the S-16 day-one rehearsal.
- **Bundles are named for what they are** (`devenv-*-bundle-<date>`), per the 2026-09-08 compliance convention, and their contents were grepped for project and estate names.

## Lane note

This is **EP-04 (Desert Island environment) work**, which the 2026-09-08 lane split assigns to the ACME/Desert Island session; Graham requested it in the Axium thread, and it deliberately converges with the legacy lane's tooling. It touches no ACME or legacy packet; cross-lane findings are reported in `source_reconciliation_v1.md` §Findings for the other lanes.

## Next

1. Graham: decisions D-1..D-9 (D-2 — the shared Angular landing version — is the one with a deadline, because it changes the legacy v22 bundle too).
2. Hand `devops_tech_stack_list_v1.md` plus the architect / DevOps questions (A-1..A-5, O-1..O-4) to their owners.
3. Re-cut both bundles after the answers (each a single command), and run them on the real staging machine.
4. With approval: create the EP-04 story for this packet on the board.

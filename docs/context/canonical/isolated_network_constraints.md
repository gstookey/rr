---
schema: corpus-doc/v1
status: active
title: Isolated Network Constraints — Known and Unknown
areas: [isolated-network, dev-environment, security, planning]
related: ["docs/context/canonical/technology_stack.md", "docs/context/canonical/current_priorities.md", "docs/context/canonical/two_island_model.md"]
updated: 2026-08-26
---

# Isolated Network Constraints — Known and Unknown

**Created:** 2026-08-25 | **Last updated:** 2026-08-26 (split per island; Legacy Island Node/Angular facts landed)

This page is mostly questions. That is deliberate: these are the highest-leverage unknowns in the project, and the answers reshape every downstream choice. Do not fill them in with plausible guesses — route them to Graham or the network owners.

> **Read `two_island_model.md` first.** As of 2026-08-26 the target is **two** isolated environments — Legacy Island (10+ Angular v17 apps on Node 22.15) and Desert Island (greenfield). Anywhere this page says "the island" without qualification, it predates that correction and means "both, unless the item is obviously estate-specific." Items below are tagged **[L]** Legacy Island, **[D]** Desert Island, or **[both]** where they have been sorted.

## Known — the environments (Graham, 2026-08-26)

- **[L] Legacy Island** hosts 10+ Angular **v17** applications running on **Node 22.15**. Target: **v19 minimum** (Milestone 1), v22 if effort allows.
- **[D] Desert Island** is **greenfield — nothing exists on it yet.** The new system is built and lives there.
- **[both]** The two deploy into a related cluster and must stay **stack-synchronized**; Legacy Island's achieved target sets Desert Island's.
- **[L]** The upgrade driver is **security exposure** in Angular 17 / Node 22.15 — remediation, not modernization. Node 22.15 (2025-04-22) is ~15 months and 8 patches behind its own still-current LTS line, whose latest patch is 22.23.2.
- **[L]** Verified 2026-08-25: Node 22.15 already satisfies Angular **18, 19, 20 and 21**. Only **v22** needs a newer Node (`^22.22.3 || ^24.15.0 || >=26.0.0`) — and only a *patch* bump inside 22.x. **Milestone 1 requires no Node change.** Full matrix: `two_island_model.md`.

## Known (SRC-012, 2026-08-25)

- **[both]** RR will be stood up and developed on isolated networks.
- **[both] No Claude access on either island.** Graham's agent access is limited to this open-internet side. Consequence: every runbook, guide, and bundle must be human-executable without an agent; troubleshooting is done remotely by description (LOE-7).
- **[both]** Artifacts cross by **compressed package/file bundles ported up** — a one-way transfer of prepared media, not a live mirror. *(Whether the two islands share one transfer mechanism or have separate ones is **not yet asked** — see below.)*
- **[L]** Legacy Island's Node/npm tooling version is now known (22.15); the estate's per-app tooling is still to be inventoried.
- **[both]** Stack languages: TypeScript/Angular primarily, some Python and Java.
- **[both]** Graham's professional context is aerospace/defense; assume formal change-control and software-assurance rules until told otherwise.

## Unknown — transfer & supply chain

- **[both]** Transfer mechanics: media type, size limits per transfer, review/scan lead time, how often transfers can happen (this sets the cost of forgetting a dependency).
- **[both] Do the two islands share a transfer mechanism, or does each have its own?** Not previously asked. It changes bundle logistics materially — a shared route means one queue and one cadence to plan around; separate routes mean two, possibly with different rules and different owners.
- **[L]** Is there an internal npm registry (Nexus/Artifactory/Verdaccio) on Legacy Island already, serving the legacy apps? If yes, bundles feed it; if no, standing one up is an early execution-phase story. Same question for PyPI/Maven/containers/Helm.
- **[D]** Desert Island is greenfield, so the expected answer is "no registry" — but **expected is not known**, and the question must still be asked rather than assumed.
- **[both]** Is there an allow-list of approved OSS, and are the intended stack packages on it?
- **[both]** Lead time per new dependency?

## Unknown — tooling on the islands

- **[both]** Git hosting (GitHub Enterprise Server / GitLab / bare git) — determines whether the PR-based merge gate survives in tool form (the principle survives regardless). Ask per island.
- **[both]** CI runner availability and what it can pull.
- **[L]** OS on Legacy Island's workstations and build hosts, and **whether the Node patch bump (22.15 → 22.23.2) is permitted by change control**. The *technical* Node question is now largely answered — see the hop matrix in `two_island_model.md` — what remains is a **permission and process** question, not a compatibility one.
- **[D]** Everything: OS, hardware, who provisions machines, whether anything at all is installed.
- **[both]** Whether this repo `gstookey/rr` (or a subset) may itself be ported up.

## Unknown — governance

- Classification / data-handling constraints on what may be written into this repo now (if it will later be transferred in).
- Whether this public repo `gstookey/rr` may itself be moved onto the network, or only its contents.

## Working stance until answered

- Treat "must be reproducible offline from pinned artifacts" as a **hard design constraint** for every stack choice. This constraint has **no expiration** — it is the environment, not a milestone.
- Fleet tooling on both islands is **known absent** — write every artifact for a human executor with no agent, and rehearse the port-up on a clean, network-disabled machine on this side before the real one.
- **Ask both islands separately.** Desert Island's answers are *probably* "nothing exists," but a questionnaire that assumes its own answers collects nothing. Two variants, sent to possibly different owners.
- **Do not plan Desert Island past what Legacy Island can reach.** Cluster-time synchronization makes Legacy Island's achieved target the binding one — see `two_island_model.md` §Stack synchronization. This applies while the two share a cluster, and should be revisited deliberately if that ever changes.

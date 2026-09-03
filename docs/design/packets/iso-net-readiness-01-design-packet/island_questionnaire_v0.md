---
schema: corpus-doc/v1
status: exploratory
title: Island Questionnaire v0 — Isolated-Network Readiness
areas: [isolated-network, dev-environment, security, planning]
related: ["docs/context/canonical/isolated_network_constraints.md", "docs/context/canonical/two_island_model.md", "docs/design/packets/iso-net-readiness-01-design-packet/README.md"]
updated: 2026-09-03
---

# Island Questionnaire v0

**Created:** 2026-08-25 | **Last updated:** 2026-08-26 (B9 browser-binary question added from the v17→v18 rehearsal) | **Status:** `exploratory` — draft instrument, not yet sent

## Send this TWICE — once per island

As of 2026-08-26 there are **two** target environments (`docs/context/canonical/two_island_model.md`), and they need separate answers from possibly different owners:

- **Legacy Island** — 10+ Angular v17 apps on Node 22.15. Send the **full** questionnaire. Sections A and B carry the highest-value questions, and B7/B8 (app count, owners, build health) feed the estate inventory directly. Board: [S-01](https://github.com/gstookey/rr/issues/8).
- **Desert Island** — greenfield; nothing exists on it yet. Send **Sections A and C in full**, and Section B **as written, not skipped**. Board: [S-02](https://github.com/gstookey/rr/issues/9).

> **Why ask Desert Island about tooling that "obviously" is not there:** because a questionnaire that assumes its own answers collects nothing. "Nothing is installed" needs to be *stated by someone who looked*, not inferred by us. Several B questions also have real answers on a greenfield network — what OS the machines will run, who provisions them, whether a git server is planned — that we would never learn by skipping the section.

Where a question is marked **[Legacy only]** below, skip it for Desert Island. Everything else is asked of both.

## For the person filling this in

You do not need to know anything about this project to answer these questions. Each one is about **your network, your tooling, and your rules** — not about our software.

- Answer what you know. Write **"don't know"** where you don't; a "don't know" is a useful answer and a guessed answer is not.
- Where a question asks for a version number, the exact string from `--version` is worth more than a recollection.
- If a question is answerable only by someone else, name them rather than guessing.
- Rough numbers are fine where the question asks for one; say they are rough.

**Estimated time:** 30–45 minutes if you have the systems in front of you. Sections A and B are the urgent ones. Section C can lag by a few days without blocking anything.

**Return to:** Graham. **Wanted by:** `[NEEDS GRAHAM — set a date]`.

---

# Section A — Transfer and supply chain

*Why this section matters overall: our software is assembled from several hundred small open-source packages downloaded from the public internet. None of that download can happen on your network. Everything must be carried in, in advance, in one batch. The cost of forgetting one file is set entirely by your answers here.*

### A1. How do files physically get onto the network?

Removable media, a data diode, an approved one-way gateway, a courier process, something else? Name the mechanism as your organization names it.

- **Why we need this:** it determines what a "delivery" even is, and who has to be in the room for one.
- **What changes depending on the answer:** a gateway with a queue lets us iterate; physical media with a custody procedure means we plan for very few, very complete deliveries.

### A2. What is the maximum size of a single transfer?

A number with a unit. If there is no hard cap, say so and give the largest transfer you have actually seen go through.

- **Why we need this:** our first delivery is on the order of **hundreds of megabytes to a few gigabytes** (one software toolchain alone measures ~90 MB compressed; the runtime, the tooling, and — for Legacy Island — a **separate toolchain set per Angular version hop** are on top of that).
- **What changes depending on the answer:** under ~500 MB we split the delivery into ordered parts and need a documented reassembly step. Over a few GB, one delivery covers it.

### A3. How long does a transfer take end to end, from "we hand it over" to "it is usable on the network"?

Include scanning, review, and approval time — not just the copy.

- **Why we need this:** this is the single most important number in our schedule. It is the cost of one mistake.
- **What changes depending on the answer:** hours means we can work iteratively. Weeks means we build and rehearse the entire installation on a disconnected machine on our side **first**, and treat the real transfer as a one-shot.

### A4. How often can transfers happen? Is there a cadence, a quota, or an approval per request?

- **Why we need this:** it sets how much contingency we pack — extra versions, extra tooling, spares we may not need.
- **What changes depending on the answer:** rare transfers mean we deliberately over-pack. Frequent transfers mean we pack lean and fetch what we missed.

### A5. Is there already an internal package registry on the network?

*(Ask this of Desert Island too. The expected answer is "no" — get it said out loud rather than assumed.)*

Specifically for JavaScript/Node packages — product names to look for: **Nexus**, **Artifactory**, **Verdaccio**, **npm Enterprise**, or an internal mirror at some URL. If yes, please give the URL and who administers it.

- **Why we need this:** this is the highest-leverage question in the document. It is the difference between "we upload our packages into your existing system" and "we install and configure a package server from scratch as our first task on the network."
- **What changes depending on the answer:** if one exists, our delivery becomes a set of files to be uploaded into it, and the existing 10+ applications on the network presumably already use it (tell us if so). If none exists, standing one up becomes the first execution-phase task, and its installer must be in the same delivery.

### A6. Same question for the other ecosystems: Python (PyPI mirror), Java (Maven repository), container images (Docker/OCI registry), and Helm charts.

Answer per ecosystem; "none" is a valid answer for any of them.

- **Why we need this:** we expect a small amount of Python and Java alongside the main JavaScript work, and the application is intended to run in containers.
- **What changes depending on the answer:** each "none" is a separate stand-up task with its own delivery. Container images especially are large and are a completely separate supply chain from the JavaScript packages.

### A7. Is there an approved-software list, and how does something get added to it?

Please describe the process and who owns it, even roughly.

- **Why we need this:** our stack is all mainstream open source, but "mainstream" is not the same as "on your list."
- **What changes depending on the answer:** if approval is per-package, several hundred transitive dependencies is a problem we need to know about **now**, and we may need to ask whether approval can be granted at the level of a locked, hash-verified bundle rather than per file.

### A8. What is the lead time to get one new open-source package approved?

- **Why we need this:** it prices every late discovery.
- **What changes depending on the answer:** a long lead time pushes us to freeze the dependency list earlier and harder, and to prefer fewer, larger, well-known dependencies over many small ones.

### A9. Is there a required scanning, provenance, or signature step (SBOM, checksum manifest, virus scan, license review) for incoming software?

- **Why we need this:** we would rather generate whatever artifact you need as part of building the delivery than be asked for it afterwards.
- **What changes depending on the answer:** if an SBOM or checksum manifest is required, we produce it alongside the bundle from the start; retrofitting one to an already-packed bundle is error-prone.

---

# Section B — Tooling already on the network

*Why this section matters overall: some of what we need may already be there. Every item that already exists at a usable version is one less thing to carry, install, and get approved.*

### B1. What operating system(s) do the developer workstations and build machines run? Name and version.

- **Why we need this:** installation steps, file paths, and service setup differ per OS, and our written instructions have to name the right ones.
- **What changes depending on the answer:** we write the day-one instructions against that OS specifically rather than hedging across three.

### B2. Is **Node.js** installed? Which version — the exact output of `node --version`, from a developer workstation and from a build machine if they differ.

- **Why we need this:** *(For Legacy Island we believe the answer is **Node 22.15** — please confirm or correct it, and say whether workstations and build hosts differ.)* Verified 2026-08-25 against the packages' published requirements: Node 22.15 already supports Angular **18, 19, 20 and 21**. Only **Angular 22** needs newer — `^22.22.3 || ^24.15.0 || >=26.0.0`.
- **What changes depending on the answer:** if Node 22.15 is confirmed, **the v19 target needs no Node change at all** and the two upgrades decouple. Separately, 22.15 is ~15 months and 8 patch releases behind its own LTS line (current: 22.23.2) and carries known exposure — so a **patch-level bump inside 22.x** is worth doing on security grounds regardless of any Angular work, and is a much smaller change-control ask than a major upgrade.

### B3. Can Node be upgraded on those machines, and who approves that? Specifically: what would it take to move from 22.15 to the current 22.23.x — a patch bump inside the same major line?

- **Why we need this:** the remaining Node question is **permission and process**, not compatibility — see B2. We want to know the cost of a patch bump, because it is the cheapest security win available and it is also the only Node change Angular 22 would ever need.
- **What changes depending on the answer:** if a patch bump is straightforward, the Angular 22 stretch loses its runtime obstacle entirely and the decision reduces to estate effort. If even a patch bump is hard, we plan the whole programme on 22.15 and the ceiling is Angular 21.

### B4. What is the output of `npm --version` on those same machines?

- **Why we need this:** npm ships with Node, so this doubles as a cross-check on B2, and our installation procedure depends on `npm ci` behaving consistently.
- **What changes depending on the answer:** very old npm changes the commands in our instructions.

### B5. Is there a Git server on the network? Which product — GitHub Enterprise Server, GitLab, Bitbucket, plain Git over SSH, or none?

- **Why we need this:** it determines whether our review-before-merge working practice survives as a *tool* on the network, or only as a convention people follow by hand.
- **What changes depending on the answer:** with a server that supports merge/pull requests, the practice ports directly. Without one, we write down the manual equivalent before anyone needs it.

### B6. Is there a continuous-integration system (something that automatically builds and tests code on commit)? If yes, which, and can its build agents reach the internal package registry from A5?

- **Why we need this:** automated build/test is how a ten-plus-application upgrade stays honest.
- **What changes depending on the answer:** no CI means the verification steps in our runbooks must be written as things a person runs and records, not as pipeline configuration.

### B7. [Legacy only] How many of the existing applications are there exactly, and who owns each one?

A name and an owner per application is enough. A list of repository names works.

- **Why we need this:** we have been working from "10+" and cannot size the work from that.
- **What changes depending on the answer:** it converts the largest piece of work in the program from an unknown into an estimate. See the companion [`legacy_estate_inventory_template_v0.md`](legacy_estate_inventory_template_v0.md) — if you can get one row of that table filled per application, it is worth more than the rest of this questionnaire combined.

### B8. [Legacy only] Do the existing applications currently build successfully on the network today, from a clean checkout?

Yes / no / don't know, per application if it varies.

- **Why we need this:** you cannot upgrade an application that does not build. If some are already broken, that is a *pre-*upgrade task nobody has costed.
- **What changes depending on the answer:** any "no" or "don't know" becomes a first-week investigation task before upgrade planning is meaningful.

### B9. [Legacy only] Is a web browser installed on the developer workstations and build machines? Which, and what is its path?

Chrome, Chromium, Edge, Firefox — name and version if you can.

- **Why we need this:** the Angular test runner used by v17-era applications (Karma) launches a **real browser** to run tests. That browser is an operating-system binary — it does **not** arrive with the software packages we transfer. Discovered by rehearsal on 2026-08-26, where the tests failed with `No binary for ChromeHeadless browser on your platform`.
- **What changes depending on the answer:** if a browser is present, nothing. If not, the upgrade of 10+ applications proceeds **without the ability to run their tests** — losing the main regression safety net — and a browser becomes a transfer item on a completely different supply chain, with its own approval path. Worth knowing before the estate work starts rather than during it.
- **Weight revised 2026-09-03:** the two ported apps test with **Jest on jsdom, not Karma** — their suites ran offline with no browser at all (`legacy-shell-bundle-01` packet). If the rest of the estate matches, a browser matters for e2e and manual verification only. The question stays; its urgency drops unless some apps are Karma-based.

### B11. [Legacy only] Three specifics about the npm registry (Nexus) and install environment

1. Does Nexus already hold the **internal packages** — `@other-team/core-*`, `@ssd_victor/*`, and the apps' own `@my-team/*` workspace packages? Discovered by rehearsal (2026-09-03): `ng update` queries registry metadata for **every** dependency declared at a monorepo root, *including workspace-local `@my-team/*` packages npm never fetches* — a 404 on any of them **aborts the upgrade before it starts**.
2. What **OS/architecture** are the developer workstations and build hosts (e.g. Linux x64)? Native-binary packages (esbuild, lmdb, rollup) are published per-platform, and a bundle built on one platform carries only that platform's binaries.
3. Does anything actually **run puppeteer**? The estate pins an ancient puppeteer whose install tries to download a Chromium binary from the internet; offline installs need `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true`, and if puppeteer is genuinely used, Chromium becomes a separate non-npm transfer item.

- **What changes depending on the answers:** each "no/unknown" here is a specific, known way the first estate upgrade stalls; all three are cheap to answer and expensive to discover mid-hop.

### B10. Is there anywhere on the network to host internal documentation — a wiki, a file share, a portal?

- **Why we need this:** the instructions we write have to live somewhere people can find them once they are on the network.
- **What changes depending on the answer:** if there is nothing, documents travel as files inside the delivery and we structure them to be readable as plain files.

---

# Section C — Governance and constraints

*Why this section matters overall: we are currently writing plans and documents in a repository on the open internet. We need to know what may be written there, and what may cross in each direction.*

### C1. Are there classification or data-handling rules about what may be written into a document that will later be carried onto the network?

For example: is naming the existing applications, their versions, or their owners in an internet-hosted document acceptable?

- **Why we need this:** the answer changes what we may write down *starting now*, and retrofitting is much harder than starting correctly.
- **What changes depending on the answer:** if constrained, we adopt placeholder naming immediately and keep the mapping only on the network side.

### C2. May the preparation repository itself be carried onto the network, or only selected contents?

- **Why we need this:** it decides whether all the accumulated planning, rationale, and history travels with the work or has to be re-created by hand.
- **What changes depending on the answer:** if the whole repository can cross, we optimize it to be self-contained and readable offline. If only selected contents can, we design an explicit export set now instead of discovering the constraint at transfer time.

### C3. Is anything at all permitted to come *back off* the network — error messages, log excerpts, screenshots, version numbers?

- **Why we need this:** during installation, troubleshooting will be done by someone with no access to the network, working from descriptions.
- **What changes depending on the answer:** if nothing may come back, we build much heavier self-diagnosis into the written instructions — expected output shown for every step, so a person can tell "this is wrong" without sending anything out.

### C4. Is there a change-control or software-assurance process that governs installing new software on the network?

Name the process and its typical duration.

- **Why we need this:** installing a package server and a language runtime is likely to be a change-controlled event, and its lead time belongs in the schedule.
- **What changes depending on the answer:** a heavyweight process means the installation steps must be pre-documented in the form the process expects, before the first delivery — not written on the day.

### C5. Who is the right point of contact for each of the above — network/transfer, workstation tooling, and change control?

- **Why we need this:** so follow-up questions do not route through one person.
- **What changes depending on the answer:** nothing technical. It shortens every subsequent loop.

---

## After it comes back

The answers to **A5, A3, B2, and B7** are the four that unblock the most downstream work. One question is **not yet in this document and should be**: whether the two islands share a transfer mechanism or each has its own — it changes bundle logistics materially. Add it before sending. When they arrive, they update `docs/context/canonical/isolated_network_constraints.md` (moving items from "Unknown" to "Known") and close or re-shape the entries in [`decision_register_v0.md`](decision_register_v0.md). Answers are evidence: register the returned document under `docs/context/evidence/raw/` before synthesizing it.

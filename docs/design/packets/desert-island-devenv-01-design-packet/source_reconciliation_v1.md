---
schema: corpus-doc/v1
status: exploratory
title: Source Reconciliation v1 — the three desert-island stack sources vetted against the registries, the doctrine and the legacy ladder
areas: [technology-stack, dev-environment, isolated-network, security, frontend, backend]
related: ["docs/design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v1.md", "docs/design/packets/desert-island-devenv-01-design-packet/bundle_rehearsal_transcript_v1.md", "docs/context/governance/decisions/ADR-004-package-manager-npm.md", "docs/context/governance/decisions/ADR-005-island-stack-sync.md", "docs/context/canonical/technology_stack.md"]
updated: 2026-10-01
---

# Source Reconciliation v1

**Created:** 2026-10-01 (Axium) | **Status:** `exploratory` — Graham-facing. Every correction below was checked against the live registry or vendor site **on 2026-10-01**; versions will drift, re-check before quoting.

**Sources:** `docs/source-documents/desert-island-setup-docs/` — SRC-013 (front-end stack + example package.json), SRC-014 (back-end list from the architect), SRC-015 (Gemini air-gap guidance). The DevOps-facing result is [`devops_tech_stack_list_v1.md`](devops_tech_stack_list_v1.md); the proof is [`bundle_rehearsal_transcript_v1.md`](bundle_rehearsal_transcript_v1.md).

## The short version

The lists are a good, coherent starting point, but **they would not have installed as written.** npm itself rejected the front-end list (a peer conflict), four of its versions do not exist, one pin is incompatible with Angular 22.2's own test builder, and the pins together carried **53 known security advisories (2 critical, 33 high)**. The back-end list mixes in a Testcontainers major that Spring Boot 4.1 does not use, a JaCoCo that cannot read Java 25 classes, a Ryuk image no Testcontainers version pulls, and a `kubectl 5.0.4` that has never existed. The Gemini guidance's scripts are not runnable as pasted.

What I did with that: **corrected only what was broken** — nonexistent, incompatible, or carrying a known advisory — kept every other pin exactly as written, and marked every change with its evidence. Things that are *choices* rather than *defects* are not changed; they are listed below as decisions for you.

## Rule used for corrections

1. **Does not exist** → the version the dependent packages actually require (or the newest in the stated line).
2. **Incompatible** (npm/Gradle refuses, or the toolchain cannot run it) → the smallest change that resolves.
3. **Known advisory** → the newest release **in the same major line** (most fixes, no major-version migration).
4. **Merely old, deprecated or a questionable choice** → **kept**, flagged. Not my call.

## Front-end corrections (npm — what npm and `npm audit` enforced)

| Proposed | Bundled | Rule | Evidence |
|---|---|---|---|
| `@astrouxds/astro-web-components 9.0.0` | 8.0.0 | 1 | 9.0.0 is not published; `@astrouxds/angular@9.0.0` depends on `^8.0.0` |
| `@types/node 24.21.0` | 24.19.0 | 1 | not published — `@types/node` does not track Node's patch numbers |
| `keycloak-connect 26.7.4` | 26.1.1 | 1 | not published; newest is 26.1.1 (Jan 2025). **26.7.4 is the Keycloak *server* version** — almost certainly a transcription slip; the server image is now in the back-end bundle at 26.7.4 |
| `@stomp/stompjs 7.0.0` | 7.2.0 | 2 | `npm install` fails `ERESOLVE`: `@stomp/rx-stomp@2.2.0` peers `^7.2.0` |
| `vitest 3.0.5` | 4.1.11 | 2+3 | Angular 22.2's `@angular/build` peers `vitest ^4.0.8 \|\| ^5.0.0`; 4.1.11 also clears a **critical** advisory present through 4.1.10 |
| `eslint 8.56.0`, `@typescript-eslint/* 7.9.0` | 9.39.5, 8.71.0 | 2 | typescript-eslint 7 does not support TypeScript 6; ESLint 8 is upstream-unsupported. 9.x is the newest line Sheriff 0.19.6 accepts — **see D-6** |
| express 5.0.1, express-session 1.18.0, compression 1.7.4, lodash 4.17.21, node-forge 1.3.1, ws 8.18.0, postcss 8.5.1, vite 6.1.1, @babel/core 7.24.0, @playwright/test 1.50.1, prisma/@prisma/client 7.1.0 | 5.2.1, 1.19.0, 1.8.2, 4.18.1, 1.4.0, 8.22.0, 8.5.28, 6.4.3, 7.29.7, 1.63.0, 7.10.0 | 3 | each carried a published advisory; all same-major moves. Playwright's is pointed: older versions **install browsers without verifying them** — exactly the step the bundle build performs |

**Added because the listed set needs them** (not optional extras): `@angular/platform-server` (required peer of `@angular/ssr`), `@angular/build` (the real builder; the listed `@angular-devkit/build-angular` is its deprecated Webpack wrapper), `@tailwindcss/postcss` (how Tailwind 4 plugs into Angular), `ng-packagr` (library builds; peer of `@nx/angular`), `@vitest/coverage-v8`, and the ESLint 9 trio `angular-eslint` / `typescript-eslint` / `@eslint/js` (matching the in-repo workspace).

**Result:** 53 → **26 advisories, 0 critical.** The 26 left are all inside four upstream chains nobody downstream can fix — see *Residual advisories* in the stack list, and D-3, D-4, D-5.

## Back-end corrections

| Proposed | Bundled | Rule | Evidence |
|---|---|---|---|
| Testcontainers 1.20.1 (+ modules 1.20.1) | **2.0.5** | 2 | Spring Boot 4.1.1's BOM manages 2.0.5 and `spring-boot-testcontainers` 4.x is built on it; 2.x **renamed the modules** (`testcontainers-postgresql`, …) and moved their packages. start.spring.io's Boot 4.1.1 template generates exactly these |
| Ryuk image 0.9.0 | **0.14.0** | 1 | read from the jars: TC 1.20.1 hard-codes `ryuk:0.8.1`, TC 2.0.5 `ryuk:0.14.0`. **0.9.0 matches neither** — on the island the reaper pull would fail |
| JaCoCo 0.8.12 ("maven plugin") | **0.8.15**, Gradle `jacoco` plugin | 2 | JaCoCo changelog: 0.8.12 has *experimental* support up to Java 23; official Java 25 support starts at **0.8.14**. Also: the project builds with Gradle, which uses its own `jacoco` plugin, not the Maven plugin |
| `lombok 9.5.0` | **1.18.46** (+ `io.freefair.lombok` plugin 9.5.0) | 1 | 9.5.0 is the Gradle *plugin's* version; the Lombok library is 1.18.x (Boot-managed 1.18.46) |
| `logstash logback encoder 0.0` | **9.0** | 1 | no version given; 9.0 is current and is the Jackson 3 line Boot 4 uses — **needs the architect's confirmation (A-2)** |
| `kubectl 5.0.4` | placeholder `v1.37.1` | 1 | there is no kubectl 5.x. **v5.0.4 is the *Kustomize* version kubectl 1.27–1.30 prints** in `kubectl version`. kubectl must be within one minor of the cluster — **needs DevOps (O-1)** |
| — | `testcontainers/sshd:1.3.0`, `apache/kafka:4.2.1`, `mockserver/mockserver:8.0.0`, `selenium/standalone-chrome`, `keycloak/keycloak:26.7.4` | added | images the listed Testcontainers modules pull at test time, and the server keycloak-js needs; none was on the image list |
| — | `selenium-remote-driver`, `mockserver-client-java 8.0.0` | added | the selenium and mockserver Testcontainers modules declare these as *provided*; without them those modules cannot be used offline |
| — | web/JPA/AMQP/Kafka/security/actuator/validation starters, Postgres driver | added | implied by Postgres/RabbitMQ/Kafka/Keycloak on the list; matches start.spring.io's Boot 4.1.1 output — **confirm (A-3)** |

Kept as written: Java 25 (Temurin 25.0.4.1+1), Eclipse 4.41 (= 2026-09 R, verified from the EPP product files), Postgres 18.6, Gradle 9.7.1 (also what start.spring.io generates), Spring Boot 4.1.1, Checkstyle 14.1.0, PMD 7.27.0, Spotless 8.10.2, Cucumber 7.34.7, jakarta.xml.bind-api 4.0.5, threeten-extra 1.8.0, H2 2.3.232 *and* the BOM's 2.4.240 (both harvested), Jackson 2.21.x (BOM 2.21.5 — **Boot 4 itself runs on Jackson 3.1.5**, both are bundled), Helm 4.0.5, jq 1.6 (RHEL 9 BaseOS ships `jq-1.6` with Red Hat's fixes), pgAdmin 9.17, RabbitMQ 4.3.5 (`-management` variant chosen for the admin UI).

**Proven, not assumed:** the harvest project compiled against Testcontainers 2.x, ran Checkstyle 14.1.0, PMD 7.27.0, JaCoCo 0.8.15 and Spotless on **Java 25 bytecode**, and a Cucumber 7.34.7 scenario booted a full Spring Boot 4.1.1 context on the JUnit 6 platform Boot manages. That last one is a real compatibility question (Cucumber 7 predates JUnit 6) answered by running it.

## Workstation / guidance corrections (SRC-015)

- **uv**: the guidance says 0.6.x; the front-end list says 0.12.21. 0.12.21 is current — the guidance is stale.
- **Black Formatter 2026.1.0** does not exist (stable: 2026.4.0, 2026.6.0) → 2026.6.0.
- **"Angular Extension Pack 1.2.4" (`willmendesneto.angular6-extension-pack`)**: that ID does not exist. The 1.2.4 pack is `loiane.angular-extension-pack`, which installs **16 third-party extensions** from the Marketplace — unusable offline and an unreviewed supply chain. **Dropped**; Angular Language Service, ESLint and Prettier are bundled individually.
- **Python extension 2026.6.0** is itself a pack (Pylance, debugpy, Python Environments) — all three are bundled, in dependency order, or the offline install reaches for the Marketplace.
- **Python 3.12.3**: RHEL 9.8's AppStream ships **3.12.14** (checked in a UBI 9 container). Whatever the island's RHEL minor ships is what you get; Red Hat back-ports fixes without changing the upstream version string.
- **The pnpm-store porting strategy** solves a problem a Nexus instance doesn't have: once a registry exists, packages travel as registry tarballs, which serve npm *and* pnpm identically. It also contradicts ADR-004 (D-1).
- **The guidance's scripts do not run as pasted**: URLs were truncated to `https://visualstudio.com` / `https://github.com`, the shebang is fused to `set -euo pipefail` (`#!/usr/bin/env bashset`), and loop keywords are fused to the previous line (`)for`, `"done`). They were treated as intent, not code.

## Contradictions with doctrine — surfaced, not averaged

Registered as C-011..C-014 in the contradiction register.

| # | Source says | Doctrine says | What the bundle does |
|---|---|---|---|
| **C-011** | pnpm 10.15.0, `npx only-allow pnpm`, port a pnpm store | **ADR-004** (accepted, "Lock it in"): npm; no pnpm on the island | npm lockfile + npm-installed workstation. The **Nexus pool is package-manager-neutral**, so this costs nothing to reverse later. pnpm itself not bundled |
| **C-012** | Nx 23.1.2 as the workspace engine | `technology_stack.md`: npm workspaces, no Nx/Turborepo (ADR-004 era) | Nx bundled (bytes are cheap, transfer cycles are not) — **not adopted**. Carries residual high advisories (D-4) |
| **C-013** | Angular **22.2.0** | The legacy ladder and the in-repo workspace landed on **22.1.5**; **ADR-005** says the islands must match (strictest reading: exact versions) | Bundled 22.2.0 as listed. **Security now decides the direction:** 22.0–22.1.x carries **GHSA-67c8-pqhq-4rmx (critical, `piscina` inside `@angular/build`)** and **GHSA-ff3f-86qr-9cv3 (high, `@angular/router` SSR DoS)**, both fixed in 22.2.0. See D-2 |
| **C-014** | Back end = Java 25 / Spring Boot 4.1 (architect) **and** a Node back end: Express 5, Prisma, `pg`, amqplib, kafkajs, keycloak-connect (front-end list) | `technology_stack.md`: Node/Express *gateway* (BFF); DDD-ARCH-01 has not ruled server-side runtimes | Both bundled. Two server runtimes and two Postgres access stacks (JPA and Prisma) is an **architecture question** for DDD-ARCH-01, not a bundle question — D-7 |

Also worth naming, not contradictions: the list carries **two unit-test runners** (Jest and Vitest), **two E2E runners** (Cypress and Playwright), **three styling systems** (AstroUXDS, Angular Material, Tailwind 4) and **two state approaches** (NgRx Store and SignalStore). Each pair has a plausible reason (legacy parity vs. greenfield) but each doubles what the team must know offline.

## Decisions for Graham

> **Settled 2026-10-01 — see [ADR-008](../../../context/governance/decisions/ADR-008-desert-island-devenv-baseline.md).** Graham accepted every recommendation below and deferred the rest to Axium, with three answers of his own: **D-1 → both npm and pnpm** (each app chooses; the examples use pnpm), **D-8 → newest Nexus** (the legacy island runs 3.81), **D-9 → Docker, plus kind** (not Podman). D-7 remains open. O-1 partly answered: the cluster Graham can see is **v1.30.4**. The table is kept as the reasoning of record.

| ID | Decision | Axium's recommendation |
|---|---|---|
| **D-1** | pnpm or npm on Desert Island (C-011) | **npm**, per ADR-004 — nothing on the island changed the premise. If you do want pnpm, it's a lockfile regeneration plus one tarball; the pool doesn't change |
| **D-2** | Angular version both islands land on (C-013, ADR-005) | **22.2.x on both.** The legacy v22 rung re-cuts in minutes with the lock-driven `build-transfer-bundle.sh`; landing legacy at 22.1.5 ships a critical-rated advisory into the estate the upgrade exists to secure. Also note **22.2.1 shipped 2026-09-30** — pin one patch for both |
| **D-3** | keycloak-connect: keep or replace | **Replace** with standard OIDC/JWT validation (the in-repo gateway uses `jose`). The newest adapter is 20 months old, every version is flagged via its dependencies, and it pulls `chromedriver: "latest"` at install time. The legacy estate uses 23.0.6 — the same advice applies there |
| **D-4** | Nx: adopt or not (C-012) | Decide on architecture merit (DDD-ARCH-01 lane). If adopted, accept its residual advisories as a dev-time risk until Nx un-pins axios/smol-toml |
| **D-5** | Prisma 7 residual advisories (in `prisma` CLI deps: mysql2, hono, valibot…) | Dev-time CLI risk; no fixed 7.x exists. Accept with a re-check at the next bundle cut, or defer Prisma until D-7 rules |
| **D-6** | ESLint 9 (npm now flags 9.x unsupported) vs ESLint 10 | Stay on 9 for this cut — it's what Sheriff 0.19.6 supports and the in-repo gate uses. Move both to ESLint 10 when Sheriff 0.20.x (released 2026-09-29) has been exercised |
| **D-7** | One server runtime or two (C-014) | Route to DDD-ARCH-01. The bundle carries both so the decision doesn't cost a transfer cycle |
| **D-8** | Nexus edition: Community Edition (free, EULA, usage limits) or Pro | Ask DevOps/licensing. **CE 3.77+ refuses every upload until an admin accepts Sonatype's EULA** (rehearsed) — that acceptance is your organisation's call, so the scripts never do it silently |
| **D-9** | Docker CE or Podman on workstations | **Podman** (in RHEL; Docker CE is not). The installer configures Testcontainers for rootless Podman, which means **Ryuk disabled** — leaked containers need manual cleanup |

## Questions for the architect (A-) and DevOps (O-)

- **A-1** "Apache Commons 3.6.1": only `commons-math3` has a 3.6.1 (2016). Did you mean commons-math3, or commons-lang3 (Boot-managed 3.20.0)? Both are bundled.
- **A-2** logstash-logback-encoder: version (list says 0.0). 9.0 bundled.
- **A-3** Which Spring Boot starters? The bundle assumes web MVC, JPA, AMQP, Kafka, security + OAuth2 resource server, validation, actuator, H2 console.
- **A-4** Pin `selenium/standalone-chrome` to a version (bundled as `latest`, resolved to a digest at build time).
- **A-5** Spotless formatter: the harvest uses google-java-format (what Spotless fetches lazily at task time). If the team uses Palantir or Eclipse formatting, that artifact must be harvested instead.
- **O-1** The island cluster's Kubernetes minor (kubectl must match ±1).
- **O-2** Will Nexus get TLS and an internal CA? Then Node (`NODE_EXTRA_CA_CERTS`), Java (truststore) and Podman need that CA; the scripts currently assume plain HTTP.
- **O-3** Anonymous read on Nexus, or per-developer read credentials?
- **O-4** Is a reverse proxy in front of Nexus? Its request-size limit must exceed ~600 MB (the Eclipse tarball).

## Findings for the other lanes (reported here; their files untouched)

- **Legacy Island lane:** `npm audit` of the shells' v22 locks shows **40 advisories, 3 critical** — including the Angular 22.1.x pair above, `express 4.18.2`, `keycloak-connect`, `puppeteer 21.9.0`. Supports D-2 and D-3; worth folding into `first-app-hop-01`'s pre-flight.
- **ACME Workshop lane:** the root lock (Angular 22.1.x, `vitest 4.0.18`) shows **8 advisories, 3 critical** — the Angular pair plus Vitest's critical (fixed 4.1.11). ACME ships nothing (ADR-007), so this matters for hygiene and for the lessons it teaches, not for exposure.

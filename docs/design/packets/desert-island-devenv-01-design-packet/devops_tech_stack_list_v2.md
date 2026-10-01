---
schema: corpus-doc/v1
status: exploratory
title: DevOps Tech Stack List v2 — the air-gapped RHEL 9 full-stack development environment (Graham's decisions folded in, 2026-10-01)
areas: [technology-stack, dev-environment, isolated-network, frontend, backend, security]
related: ["docs/design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v1.md", "docs/design/packets/desert-island-devenv-01-design-packet/source_reconciliation_v1.md", "docs/design/packets/desert-island-devenv-01-design-packet/bundle_rehearsal_transcript_v2.md", "docs/context/operations/user-workflow/bundling_scripts_guide_v1.md", "desert-island-devenv/README.md", "desert-island-devenv/island/README.md"]
updated: 2026-10-01
---

# DevOps Tech Stack List v2 — air-gapped RHEL 9 full-stack development environment

**Created:** 2026-10-01 (Axium) | **Status:** `exploratory` — **supersedes [v1](devops_tech_stack_list_v1.md)** (same day): Graham's answers of 2026-10-01 folded in — **npm *and* pnpm** shipped (the example stack locked to pnpm), **Docker CE + kind** instead of Podman, Kubernetes client tools matched to the **1.30** cluster, Angular **22.2.1** on both islands (D-2), the newest Nexus. Vetted against the live registries and vendor sites on **2026-10-01**; **both bundles rebuilt from these pins and rehearsed end to end** against Nexus on offline RHEL 9 machines ([transcript v2](bundle_rehearsal_transcript_v2.md)). Versions drift: re-check before a re-cut.

**What changed from v1, in one place:** §1 Docker CE replaces Podman (RPMs now *in* the back-end bundle) · §2 pnpm **10.34.6** bundled (10.15.0 carried 10+ advisories) · §3 Angular `22.2.0 → 22.2.1` (17 packages), `uuid 11.1.1` added (pnpm does not auto-install the peer npm did), lockfile is now `pnpm-lock.yaml` · §5 kubectl **v1.31.14**, Helm **v3.18.6** as `helm` + **v4.3.0** as `helm4`, kind **v0.29.0** · §6 `kindest/node:v1.30.13` added · §8 Nexus: target the newest release · §9 updated.

**Audience:** the DevOps team standing up the workstations and the new Nexus. **Graham-facing rationale** (why each correction; decisions D-1..D-9 and how they were settled): [`source_reconciliation_v1.md`](source_reconciliation_v1.md). **How to build and load:** [`bundling_scripts_guide_v1.md`](../../../context/operations/user-workflow/bundling_scripts_guide_v1.md) (every bundle script, start to finish), `desert-island-devenv/README.md` (connected side) and `desert-island-devenv/island/README.md` (island side — it travels in the bundles).

**Legend:** ✅ as proposed · 🔧 corrected (did not exist / incompatible) · 🛡 moved within its major line to clear a published security advisory · ➕ added (required by the listed set, or missing from it) · ⚠ kept, with a caveat · ❓ needs a decision — see the reconciliation doc.

## At a glance

| | Front-end bundle | Back-end bundle |
|---|---|---|
| File | `devenv-frontend-bundle-<date>.tar` — **1.34 GB** | `devenv-backend-bundle-<date>.tar` — **4.22 GB** |
| Built by | `desert-island-devenv/tools/build-frontend-bundle.sh` | `desert-island-devenv/tools/build-backend-bundle.sh` |
| Into Nexus | npm-hosted (1,554 packages, 291 MB — incl. pnpm), raw-hosted, pypi-hosted | maven-hosted (605 artifacts / 1,228 files, 331 MB), raw-hosted (incl. Docker CE RPMs), docker-hosted (11 images, incl. the kind node image) |
| On each workstation | Node + npm, **pnpm**, uv, VS Code + 8 extensions, Cypress / Playwright / Prisma binaries | Temurin JDK, Gradle, Eclipse (+ Lombok agent), **Docker CE**, kubectl, Helm 3 + 4, **kind**, Gradle → Nexus redirect, Testcontainers → Nexus registry |

## 1. Platform — from the RHEL 9 media, not the bundles

| Component | Version | Source | Notes |
|---|---|---|---|
| Red Hat Enterprise Linux | 9.x, x86_64 | island | rehearsed on RHEL **9.8** (UBI 9 image) |
| Python | **3.12.x** (`python3.12`, `-pip`, `-devel`) | RHEL 9 AppStream | the list said 3.12.3; RHEL 9.8 ships **3.12.14** — you get whatever your RHEL minor ships (Red Hat back-ports fixes) |
| **Docker CE's dependencies** — `container-selinux`, `libseccomp`, `iptables-nft`, `nftables`, `tar`, `xz` | per RHEL minor | BaseOS / AppStream | `dnf` pulls them when the installer installs the bundled Docker RPMs (all present in the UBI 9 repos — verified). **Do not install `podman-docker`**: it owns `/usr/bin/docker` and conflicts with Docker CE |
| skopeo | 1.22.x on 9.8 | AppStream | optional: the image loader prefers it (no daemon needed); falls back to `docker` |
| git, jq | 2.52 / **1.6** | AppStream / BaseOS | jq 1.6 = the list's version; RHEL's build carries Red Hat's security fixes |
| VS Code's GUI libraries (GTK3, NSS, libxkbfile, xdg-utils, …) | — | BaseOS/AppStream | `dnf` resolves them when the VS Code RPM is installed |
| Playwright Chromium libraries | — | BaseOS/AppStream | `nss atk at-spi2-atk cups-libs libdrm libxkbcommon libXcomposite libXdamage libXrandr mesa-libgbm pango alsa-lib` |

## 2. Workstation tooling (front-end bundle → raw-hosted, installed by `install-frontend-workstation.sh`)

| Component | Version | | Notes |
|---|---|---|---|
| Node.js | **24.21.0** (LTS "Krypton", 2026-09-07) + **npm 11.19.0** | ✅ | Angular 22 requires `^22.22.3 \|\| ^24.15.0 \|\| >=26`. Keep npm on 11.x: npm 12 is moving toward not running install scripts by default, and 13 packages here need theirs |
| TypeScript | **6.0.3** | ✅ | Angular 22 requires `>=6.0 <6.1`; TypeScript 7 is current upstream and will **not** work |
| VS Code | **1.140.0** (RPM, Microsoft's sha256 verified) | ✅ | the `el8` build is the one Microsoft ships for all RHEL; installs on 9 |
| uv | **0.12.21** | ✅ | the guidance doc's "0.6.x" is stale |
| Cypress binary | 16.1.1 (from the lockfile) | ✅ | installed from a local zip via `CYPRESS_INSTALL_BINARY` |
| Playwright browsers | 1.63.0: Chromium 153.0.8010.12 + headless shell + ffmpeg | 🛡 | Firefox/WebKit not staged: Playwright's Firefox build targets newer glibc than RHEL 9, WebKit has no RHEL build |
| Prisma schema engine | commit `0edf323e…`, `rhel-openssl-3.0.x` | ➕ | Prisma's install step downloads it; served from raw-hosted via `PRISMA_ENGINES_MIRROR` |
| pnpm | 10.15.0 → **10.34.6** | 🛡 | **bundled** (D-1, Graham 2026-10-01: ship both; each app picks; the examples use pnpm). 10.15.0 carries 10+ advisories (several high: lifecycle-script bypass, lockfile-integrity bypass, path traversals) — all fixed by 10.34.6, the newest 10.x. Installed globally from its own tarball; `npm_config_registry` points npm *and* pnpm at Nexus. pnpm 10 blocks dependency install scripts by default: the example allows only `cypress`, `prisma`, `@prisma/engines`, `esbuild` (all offline-safe) and keeps `chromedriver` blocked |
| only-allow | 1.2.2 | ➕ | the example's `preinstall: npx only-allow pnpm` fetches it from Nexus |

**VS Code extensions** (installed in this order; dependencies first):

| Extension | Version | Platform | | Notes |
|---|---|---|---|---|
| `ms-python.vscode-python-envs` | 1.38.0 | linux-x64 | ✅ | member of the Python pack |
| `ms-python.vscode-pylance` | 2026.4.1 | universal | ➕ | member of the Python pack (installs from the Marketplace otherwise) |
| `ms-python.python` | 2026.6.0 | linux-x64 | ✅ | |
| `ms-python.debugpy` | 2026.6.0 | linux-x64 | ➕ | member of the Python pack |
| `ms-python.black-formatter` | **2026.6.0** | universal | 🔧 | 2026.1.0 does not exist |
| `Angular.ng-template` | 22.2.0 | universal | ✅ | Angular Language Service |
| `dbaeumer.vscode-eslint` | 3.0.34 | universal | ✅ | |
| `esbenp.prettier-vscode` | 12.4.0 | universal | ✅ | |
| ~~Angular Extension Pack 1.2.4~~ | — | — | 🔧 | **dropped**: the listed ID doesn't exist; the real 1.2.4 pack pulls 16 third-party extensions from the Marketplace |

## 3. Front-end npm stack (front-end bundle → npm-hosted)

Generated from `stack/frontend/package.json` against the source list, **locked with pnpm** (`stack/frontend/pnpm-lock.yaml`, `packageManager: pnpm@10.34.6`). **93 direct packages; the lockfile resolves 1,820 entries, of which the 1,551 linux-x64 tarballs are bundled** (+3 for pnpm/only-allow). After the corrections: **22 residual advisories, 0 critical** (was 53 / 2 critical) — see §7. The Angular rows read **22.2.1** wherever the source said 22.2.0 (D-2: one patch on both islands; 22.2.1 shipped 2026-09-30 and is where the legacy ladder lands).

| Package | Proposed | Bundled | | Why |
|---|---|---|---|---|
| `@angular-devkit/build-angular` | 22.2.0 | **22.2.1** | ⚠ | deprecated upstream (Webpack); kept for legacy-app parity. |
| `@angular/animations` | 22.2.0 | **22.2.1** | ⚠ | deprecated upstream in v22 (use `animate.enter/leave`); kept — legacy code uses it. |
| `@angular/build` | — | **22.2.1** | ➕ | added: the current Angular builder (the listed `@angular-devkit/build-angular` is the deprecated Webpack wrapper around it). |
| `@angular/cdk` | 22.2.0 | **22.2.1** | 🔧 | D-2: same patch as the legacy ladder's landing  |
| `@angular/cli` | 22.2.0 | **22.2.1** | 🔧 | D-2: same patch as the legacy ladder's landing  |
| `@angular/common` | 22.2.0 | **22.2.1** | 🔧 | D-2: same patch as the legacy ladder's landing  |
| `@angular/compiler` | 22.2.0 | **22.2.1** | 🔧 | D-2: same patch as the legacy ladder's landing  |
| `@angular/compiler-cli` | 22.2.0 | **22.2.1** | 🔧 | D-2: same patch as the legacy ladder's landing  |
| `@angular/core` | 22.2.0 | **22.2.1** | 🔧 | D-2: same patch as the legacy ladder's landing  |
| `@angular/forms` | 22.2.0 | **22.2.1** | 🔧 | D-2: same patch as the legacy ladder's landing  |
| `@angular/material` | 22.2.0 | **22.2.1** | 🔧 | D-2: same patch as the legacy ladder's landing  |
| `@angular/platform-browser` | 22.2.0 | **22.2.1** | 🔧 | D-2: same patch as the legacy ladder's landing  |
| `@angular/platform-browser-dynamic` | 22.2.0 | **22.2.1** | ⚠ | deprecated upstream; kept — `jest-preset-angular@16` peers it. |
| `@angular/platform-server` | — | **22.2.1** | ➕ | added: required peer of `@angular/ssr`. |
| `@angular/router` | 22.2.0 | **22.2.1** | 🔧 | D-2: same patch as the legacy ladder's landing  |
| `@angular/ssr` | 22.2.0 | **22.2.1** | 🔧 | D-2: same patch as the legacy ladder's landing  |
| `@astrouxds/angular` | 9.0.0 | **9.0.0** | ✅ |  |
| `@astrouxds/astro-web-components` | 9.0.0 | **8.0.0** | 🔧 | 9.0.0 does not exist (newest is 8.0.0); `@astrouxds/angular@9.0.0` itself depends on `^8.0.0`. |
| `@babel/core` | 7.24.0 | **7.29.7** | 🛡 | 7.24.0 → newest 7.x (low advisory, sourceMappingURL file read). |
| `@babel/preset-env` | 7.26.9 | **7.26.9** | ✅ |  |
| `@eslint/js` | — | **9.39.5** | ➕ | added: ESLint 9 flat-config base rules. |
| `@ngrx/effects` | 22.0.1 | **22.0.1** | ✅ |  |
| `@ngrx/entity` | 22.0.1 | **22.0.1** | ✅ |  |
| `@ngrx/operators` | 22.0.1 | **22.0.1** | ✅ |  |
| `@ngrx/router-store` | 22.0.1 | **22.0.1** | ✅ |  |
| `@ngrx/signals` | 22.0.1 | **22.0.1** | ✅ |  |
| `@ngrx/store` | 22.0.1 | **22.0.1** | ✅ |  |
| `@ngrx/store-devtools` | 22.0.1 | **22.0.1** | ✅ |  |
| `@nx/angular` | 23.1.2 | **23.1.2** | ❓ | see `nx`. |
| `@nx/express` | 23.1.2 | **23.1.2** | ❓ | see `nx`. |
| `@playwright/test` | 1.50.1 | **1.63.0** | 🛡 | 1.50.1 → 1.63.0 (high: older Playwright installs browsers without verifying them — the very step the bundle build performs). |
| `@prisma/client` | 7.1.0 | **7.10.0** | 🛡 | kept in step with `prisma`. |
| `@softarc/eslint-plugin-sheriff` | 0.19.6 | **0.19.6** | ✅ |  |
| `@softarc/sheriff-core` | 0.19.6 | **0.19.6** | ✅ |  |
| `@stomp/rx-stomp` | 2.2.0 | **2.2.0** | ✅ |  |
| `@stomp/stompjs` | 7.0.0 | **7.2.0** | 🔧 | 7.0.0 fails peer resolution: `@stomp/rx-stomp@2.2.0` requires `^7.2.0` (the legacy apps already use `^7.2.0`). |
| `@tailwindcss/postcss` | — | **4.0.0** | ➕ | added: Tailwind 4 integrates with Angular through this PostCSS plugin. |
| `@types/amqplib` | 0.10.6 | **0.10.6** | ✅ |  |
| `@types/cors` | 2.8.17 | **2.8.17** | ✅ |  |
| `@types/express` | 5.0.0 | **5.0.0** | ✅ |  |
| `@types/jest` | 30.0.0 | **30.0.0** | ✅ |  |
| `@types/lodash` | 4.17.0 | **4.17.0** | ✅ |  |
| `@types/node` | 24.21.0 | **24.19.0** | 🔧 | 24.21.0 does not exist — `@types/node` does not track Node patch numbers; 24.19.0 is the newest 24.x. |
| `@types/pg` | 8.11.11 | **8.11.11** | ✅ |  |
| `@types/ws` | 8.5.14 | **8.5.14** | ✅ |  |
| `@typescript-eslint/eslint-plugin` | 7.9.0 | **8.71.0** | 🔧 | 7.9.0 does not support TypeScript 6 and requires ESLint 8 (upstream-unsupported). 8.x is the TS-6 line. |
| `@typescript-eslint/parser` | 7.9.0 | **8.71.0** | 🔧 | as above |
| `@vitest/coverage-v8` | — | **4.1.11** | ➕ | added: coverage provider matching Vitest 4 (critical advisory line cleared at 4.1.11). |
| `amqplib` | 0.10.5 | **0.10.5** | ✅ |  |
| `angular-eslint` | — | **22.2.0** | ➕ | added: Angular template/TS lint rules for ESLint 9 (as used in the in-repo workspace). |
| `autoprefixer` | 10.4.20 | **10.4.20** | ✅ |  |
| `babel-jest` | 30.5.2 | **30.5.2** | ✅ |  |
| `compression` | 1.7.4 | **1.8.2** | 🛡 | 1.7.4 → 1.8.2 (on-headers advisory). |
| `cors` | 2.8.5 | **2.8.5** | ✅ |  |
| `cypress` | 16.1.1 | **16.1.1** | ✅ |  |
| `dotenv` | 16.4.5 | **16.4.5** | ✅ |  |
| `esbuild` | 0.25.0 | **0.25.0** | ✅ |  |
| `eslint` | 8.56.0 | **9.39.5** | 🔧⚠ | 8.56.0 is upstream-unsupported. 9.39.5 is the newest line Sheriff 0.19.6 supports — but npm now marks 9.x unsupported too; ESLint 10 needs Sheriff 0.20.x (decision). |
| `eslint-config-prettier` | 10.1.5 | **10.1.5** | ✅ |  |
| `eslint-plugin-unused-imports` | 4.1.4 | **4.1.4** | ✅ |  |
| `express` | 5.0.1 | **5.2.1** | 🛡 | 5.0.1 → 5.2.1 (qs DoS advisories). Same as the in-repo gateway. |
| `express-session` | 1.18.0 | **1.19.0** | 🛡 | 1.18.0 → 1.19.0 (cookie advisory). |
| `istanbul-lib-instrument` | 6.0.3 | **6.0.3** | ✅ |  |
| `jest` | 30.5.2 | **30.5.2** | ✅ |  |
| `jest-environment-jsdom` | 30.5.2 | **30.5.2** | ✅ |  |
| `jest-preset-angular` | 16.2.0 | **16.2.0** | ✅ |  |
| `jsdom` | 26.1.0 | **26.1.0** | ✅ |  |
| `kafkajs` | 2.2.4 | **2.2.4** | ⚠ | unmaintained upstream since Feb 2023 (last release 2.2.4). |
| `keycloak-angular` | 22.0.0 | **22.0.0** | ✅ |  |
| `keycloak-connect` | 26.7.4 | **26.1.1** | 🔧❓ | 26.7.4 does not exist (newest 26.1.1, Jan 2025). 26.7.4 is the Keycloak **server** version. Carries `chromedriver: "latest"` as an optional dependency (downloads a binary at install; neutralised on workstations). Consider replacing — see reconciliation. |
| `keycloak-js` | 26.2.4 | **26.2.4** | ✅ |  |
| `lodash` | 4.17.21 | **4.18.1** | 🛡 | 4.17.21 → 4.18.1 (high: `_.template` code injection; prototype pollution). |
| `luxon` | 3.2.1 | **3.2.1** | ✅ |  |
| `ng-packagr` | — | **22.2.1** | ➕ | added: builds Angular libraries in a monorepo; peer of `@nx/angular`. |
| `node-forge` | 1.3.1 | **1.4.0** | 🛡 | 1.3.1 → 1.4.0 (high: ASN.1 recursion, basicConstraints bypass). |
| `nx` | 23.1.2 | **23.1.2** | ❓⚠ | not in current doctrine (technology_stack.md: npm workspaces, no Nx). Residual high advisories via Nx's exactly-pinned axios / smol-toml — not fixable downstream. |
| `pg` | 8.13.1 | **8.13.1** | ✅ |  |
| `postcss` | 8.5.1 | **8.5.28** | 🛡 | 8.5.1 → 8.5.28 (high: source-map path traversal / file read). |
| `prettier` | 3.2.5 | **3.2.5** | ✅ |  |
| `prisma` | 7.1.0 | **7.10.0** | 🛡⚠ | 7.1.0 → 7.10.0 (newest 7.x). Residual high advisories remain in Prisma 7's own CLI dependencies — no fixed 7.x exists. |
| `rxjs` | 7.8.1 | **7.8.1** | ✅ |  |
| `sockjs` | 0.3.24 | **0.3.24** | ⚠ | residual moderate advisory (bundled `uuid`); no fixed release exists. |
| `sockjs-client` | 1.6.1 | **1.6.1** | ✅ |  |
| `tailwindcss` | 4.0.0 | **4.0.0** | ✅ |  |
| `ts-jest` | 29.4.12 | **29.4.12** | ✅ |  |
| `tslib` | 2.8.1 | **2.8.1** | ✅ |  |
| `typescript` | 6.0.3 | **6.0.3** | ✅ |  |
| `typescript-eslint` | — | **8.71.0** | ➕ | added: flat-config entry point for typescript-eslint 8. |
| `uuid` | — | **11.1.1** | ➕ | added (v2): `@stomp/rx-stomp@2.2.0` peers `uuid >=9 <12`. npm auto-installed it; pnpm wires the peer to the 8.3.2 `sockjs` brings, so it is declared explicitly. |
| `vite` | 6.1.1 | **6.4.3** | 🛡 | 6.1.1 → 6.4.3 (`server.fs.deny` bypasses; bundled esbuild dev-server advisory). |
| `vitest` | 3.0.5 | **4.1.11** | 🔧 | 3.0.5 is incompatible: Angular 22.2 `@angular/build` requires `^4.0.8 || ^5.0.0`. 4.1.11 also clears a **critical** advisory present through 4.1.10. |
| `ws` | 8.18.0 | **8.22.0** | 🛡 | 8.18.0 → 8.22.0 (high: memory disclosure / DoS). |
| `zone.js` | 0.15.0 | **0.15.0** | ✅ |  |

## 4. Back-end Java stack (back-end bundle → maven-hosted)

Resolved by building `stack/backend` (Spring Boot 4.1.1 harvest project) on Java 25; versions below are what the harvested Maven tree actually contains. "BOM" = managed by Spring Boot 4.1.1, so island projects get it without declaring a version.

| Component | Proposed | Bundled | | Notes |
|---|---|---|---|---|
| Java | 25 | **Temurin 25.0.4.1+1** | ✅ | JDK tarball → raw-hosted; image below |
| Gradle | 9.7.1 | **9.7.1** | ✅ | distribution → raw-hosted (`gradle/distributions/`) — also what start.spring.io generates for Boot 4.1.1 |
| Spring Boot | 4.1.1 | **4.1.1** (Spring Framework 7.0.9, Hibernate 7.4.5) | ✅ | + Gradle plugin markers for `org.springframework.boot`, `io.spring.dependency-management` 1.1.7 |
| Spring Boot starters | — | webmvc, data-jpa, amqp, kafka, security, oauth2-resource-server, validation, actuator, h2console + their `-test` starters | ➕❓ | implied by the listed infrastructure (A-3) |
| Testcontainers | 1.20.1 | **2.0.5** (BOM) — core, junit-jupiter, postgresql, rabbitmq, kafka, mockserver, selenium | 🔧 | Boot 4.1 is built on 2.x; 2.x renamed the modules (`testcontainers-postgresql`, …) |
| Selenium client | — | `selenium-remote-driver` (BOM) | ➕ | the selenium module declares it *provided* |
| MockServer client | — | `mockserver-client-java` **8.0.0** | ➕ | the mockserver module declares it *provided*; matches the 8.0.0 image |
| PostgreSQL JDBC | — | 42.7.13 (BOM) | ➕ | |
| Apache Commons | "3.6.1" | `commons-math3` 3.6.1 **and** `commons-lang3` 3.20.0 | ❓ | ambiguous (A-1) — both bundled |
| Checkstyle | 14.1.0 | **14.1.0** | ✅ | exercised on Java 25 source |
| PMD | 7.27.0 | **7.27.0** | ✅ | exercised |
| Spotless (Gradle plugin) | 8.10.2 | **8.10.2** + google-java-format 1.30.0 | ✅ | the formatter jar is fetched lazily; harvested by running Spotless (A-5) |
| JaCoCo | 0.8.12 ("maven plugin") | **0.8.15** (Gradle `jacoco` plugin) | 🔧 | 0.8.12 cannot instrument Java 25 classes |
| Cucumber / Cucumber for Java | 7.34.7 | **7.34.7** (java, spring, junit-platform-engine) on JUnit 6.0.3 | ✅ | proven: a scenario booted the full Boot context |
| logstash-logback-encoder | "0.0" | **9.0** (logback 1.5.38) | 🔧❓ | no version given; 9.0 is the Jackson 3 line (A-2) |
| Lombok Gradle plugin | 9.5.0 | **9.5.0** (`io.freefair.lombok`) | ✅ | |
| Lombok | "9.5.0" | **1.18.46** (BOM) | 🔧 | 9.5.0 is the plugin's version |
| Jackson | 2.21 | **2.21.5** (`com.fasterxml`) **and 3.1.5** (`tools.jackson`, Boot 4's default) | ✅ | both bundled |
| H2 | 2.3 | **2.3.232 and 2.4.240** (BOM) | ✅ | both bundled |
| jakarta.xml.bind-api | 4.0.5 | **4.0.5** (BOM) | ✅ | |
| threeten-extra | 1.8.0 | **1.8.0** | ✅ | |
| Kafka / RabbitMQ clients | — | kafka-clients 4.2.1, spring-kafka 4.1.1, amqp-client 5.30.0, spring-rabbit 4.1.1 | ➕ | via the starters |

**Not bundled:** Maven plugins — the build tool is Gradle, so the listed "jacoco *maven* plugin" has no consumer. If anyone builds with Maven or uses Eclipse m2e on Maven projects, that is a separate harvest.

## 5. Back-end tools (back-end bundle → raw-hosted, installed by `install-backend-workstation.sh`)

| Component | Proposed | Bundled | | Notes |
|---|---|---|---|---|
| Eclipse IDE | 4.41 | **2026-09 R** (platform 4.41.0), "Enterprise Java and Web Developers", sha512 verified | ✅ | 593 MB. Includes Buildship (Gradle). The installer adds the **Lombok agent** to `eclipse.ini`. Checkstyle/PMD *Eclipse plugins* are not bundled (the Gradle tasks cover the checks) |
| kubectl | "5.0.4" | **v1.31.14** | 🔧 | there is no kubectl 5.x (5.0.4 is the Kustomize version older kubectl prints). The cluster Graham can see reports **server v1.30.4**; kubectl is supported within ±1 minor, so 1.31 serves 1.30, 1.31 and 1.32 servers. (The legacy workstation's 1.35 client is outside that window.) **Confirm the Desert Island cluster's version (O-1)** |
| Helm | 4.0.5 | **v3.18.6** as `helm` + **v4.3.0** as `helm4` | 🔧🛡 | Helm's skew table: **4.0.x supports 1.31–1.34 — not 1.30**, and 4.0.5 has 2 HIGH advisories (fixed only in 4.1.4+, which supports 1.32+). **3.18.x is the newest line supporting 1.30** (1 moderate advisory, fixed only in lines that drop 1.30). Both ship; when the cluster reaches 1.34, `helm4` becomes `helm` (one line in `stack/backend.env`) |
| kind | — (Graham: "we use kind") | **v0.29.0** + node image `kindest/node:v1.30.13` | ➕ | the kind release whose node images include 1.30 (v0.33.0, current, builds 1.33+ only), so local clusters match the 1.30 server. `island/kind-cluster.sh create` makes a cluster whose node image *and* pod images come from Nexus |
| Docker CE | — (Graham: "Docker is what we use") | **29.8.2** + containerd.io 2.3.6, buildx 0.37.1, compose 5.5.1 (RPMs for RHEL 9) | ➕ | not on RHEL media, so the RPMs travel in the bundle — sha256 from Docker's repository metadata, GPG signatures checked on the island against Docker's key (fingerprint `060A 61C5 1B55 8A7F 742B 77AA C52F EB6B 621E 9F35`). Installer writes `insecure-registries` for the Nexus registry while it is plain HTTP and adds the installing user to the `docker` group (root-equivalent, per Docker's own docs). Testcontainers runs with **Ryuk on** |
| jq | 1.6 | from RHEL media | ✅ | see §1 |

## 6. Container images (back-end bundle → docker-hosted)

Saved as `docker-archive` tars, pushed by `load-nexus.sh` (skopeo preferred). **The digest is the pin.** Docker Hub images are pushed without the `library/` prefix (`postgres:18.6`), which is how Testcontainers' `hub.image.name.prefix` addresses them.

| Image | | Digest (index) | Size | Notes |
|---|---|---|---|---|
| `eclipse-temurin:25.0.4.1_1-jdk` | ✅ | `sha256:119a3d18f160…` | 149 MB | exact build (`25-jdk` floats) |
| `postgres:18.6` | ✅ | `sha256:5a5a84b19854…` | 161 MB | newest 18.x |
| `dpage/pgadmin4:9.17` | ✅ | `sha256:c332c5f6dfba…` | 177 MB | |
| `rabbitmq:4.3.5-management` | ✅ | `sha256:57bddb6fbc34…` | 116 MB | `-management` = with the admin UI |
| `testcontainers/ryuk:0.14.0` | 🔧 | `sha256:7c1a8a9a47c7…` | 2 MB | 0.9.0 matches no Testcontainers version; 2.0.5 pulls 0.14.0 |
| `testcontainers/sshd:1.3.0` | ➕ | `sha256:c50c0f59554d…` | 6 MB | Testcontainers host-port exposure |
| `apache/kafka:4.2.1` | ➕ | `sha256:9916d60eca5d…` | 225 MB | for `testcontainers-kafka` |
| `mockserver/mockserver:8.0.0` | ➕ | `sha256:b8426e0b3c80…` | 156 MB | for `testcontainers-mockserver` |
| `selenium/standalone-chrome:latest` | ➕❓ | `sha256:7efe71e7e4a8…` | 970 MB | for `testcontainers-selenium`; pin a version (A-4) |
| `keycloak/keycloak:26.7.4` (quay.io) | ➕ | `sha256:82a77884f3af…` | 256 MB | the identity server keycloak-js needs; matches the "26.7.4" in the source list |
| `kindest/node:v1.30.13` | ➕ | `sha256:397209b3d947…` | 410 MB | kind v0.29.0's 1.30 node image (v2) — local clusters at the cluster's minor |

Full digests: `images/IMAGES.lock` in the bundle.

## 7. Residual security advisories (22 under pnpm) — known, not fixable downstream

All four chains are **development-time tooling or a deprecated library**; none is in Angular's runtime. Each needs an owner's accept-or-replace decision before the island's security review sees it.

| Chain | Advisories | Why it can't be fixed by a pin | Decision |
|---|---|---|---|
| **Nx 23.1.2** → exactly-pinned `axios` 1.18.1, `smol-toml` 1.6.1, `brace-expansion` 5.0.9 (flags all 8 `@nx/*` packages) | high: axios ReDoS / prototype-pollution gadgets / HTTP/2 proxy bypass (e.g. GHSA-c29m-xwm3-cm6r, GHSA-3pq3-5fj3-cg6v); smol-toml DoS (GHSA-7w5x-hrqm-74c2); brace-expansion DoS (GHSA-qhr7-859c-m2p7) | Nx pins them exactly (also in 23.2.1); an override would make island installs ask for versions Nexus doesn't hold | D-4 |
| **Prisma 7.10.0** CLI → `mysql2`, `deepmerge-ts` (via `@prisma/config`) | high: mysql2 auth downgrade (GHSA-3f6p-5ww8-9rcr), deepmerge-ts stack exhaustion (GHSA-ggr8-5vv4-36mx) | no fixed 7.x exists | D-5 |
| **keycloak-connect 26.1.1** → optional `chromedriver` → proxy-agent → `basic-ftp`; `jwk-to-pem` → `elliptic` | high: basic-ftp DoS (GHSA-c475-qrg2-pj4r); low: elliptic | newest adapter (Jan 2025); its chromedriver spec is `"latest"` | D-3 |
| **sockjs 0.3.24** → `uuid` | moderate: GHSA-w5hq-g745-h8pq | no newer sockjs exists | accept or drop SockJS fallback |

## 8. Nexus — what the bundles expect

| Item | Value |
|---|---|
| Product | Sonatype Nexus Repository 3 — **target the newest release: 3.96.4 (2026-09-30)** (Graham: "latest and greatest, assuming compatible"; the legacy island runs **3.81**). The scripts use long-standing REST endpoints (repositories, components, assets, docker v2), exercised on 3.76.1 and — up to the EULA gate — on 3.96.4. **Community Edition (3.77+) refuses every upload until an administrator accepts Sonatype's EULA**; the scripts detect that and stop with Sonatype's text. If the island's 3.81 is CE, your organisation has already accepted it once; edition/licensing is still D-8. CE usage limits **[UNVERIFIED]** for a ~2,300-component instance |
| Repositories | `npm-hosted`, `maven-hosted` (MIXED, permissive layout), `raw-hosted`, `pypi-hosted`, `docker-hosted` (own HTTP connector, e.g. 8082) — `island/nexus-create-repos.sh` creates them |
| Realms | npm Bearer Token, Docker Bearer Token (the script enables them) |
| **Loading npm packages** | **with `npm publish`, not Nexus's components REST API** — found 2026-10-01: the components API keeps ~10 metadata fields and drops `ng-update` (so `ng update` can't see Angular's package groups) and more; and concurrent uploads of one package's versions can drop versions from the metadata. The shipped loaders publish one package's versions at a time with explicit dist-tags, then verify and repair the metadata — re-running them repairs any earlier load. If DevOps loads npm packages by other means, check: `npm view @angular/core@22.2.1 ng-update.packageGroup` must print a list |
| Read access | anonymous read, or per-developer credentials — O-3 |
| Request size | the largest upload is ~600 MB (Eclipse); a reverse proxy in front of Nexus must allow it — O-4 |
| TLS | the scripts assume plain HTTP until a CA exists — O-2 |
| Default repos | a new instance ships `maven-central` / `nuget.org` proxies and `maven-public` groups; they cannot reach anything offline. Harmless, but delete or ignore them so nobody points a build at them |

## 9. What is deliberately not in either bundle

- **Python packages** — none were listed (`stack/python/requirements.txt` is empty; the Black extension bundles its own formatter). The mechanism is in place.
- **k3d / minikube** — kind is the team's choice and is bundled (v2).
- **Maven plugins, Eclipse marketplace plugins, Firefox/WebKit for Playwright** — see the notes above.
- **Anything for the legacy estate** — the legacy Angular upgrade pool is a separate bundle (`legacy-shells/tools/build-transfer-bundle.sh`). The two use the same tooling.

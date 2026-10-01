---
schema: corpus-doc/v1
status: exploratory
title: Bundle Rehearsal Transcript v1 — both devenv bundles built, loaded into Nexus, installed on offline RHEL 9
areas: [dev-environment, isolated-network, risk-gates, technology-stack]
related: ["docs/design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v1.md", "docs/design/packets/desert-island-devenv-01-design-packet/source_reconciliation_v1.md", "docs/design/packets/iso-net-readiness-01-design-packet/day_one_rehearsal_transcript_v1.md", "desert-island-devenv/island/README.md"]
updated: 2026-10-01
---

# Bundle Rehearsal Transcript v1

**Created:** 2026-10-01 (Axium) | **Status:** `exploratory` — evidence record. Everything below was **run**, in a cloud container on 2026-10-01; numbers are copied from the output, not estimated.

## Set-up — what stood in for what

| Real thing | Stand-in | Faithful? |
|---|---|---|
| internet-connected staging machine | the agent container (Ubuntu 24.04, Docker 29.6) | yes for the build scripts (they need only bash/curl/tar + docker) |
| the new Nexus on the island | `sonatype/nexus3:3.76.1` in Docker | **partly** — see *Why 3.76.1* |
| an island RHEL 9 workstation / loader host | `registry.access.redhat.com/ubi9/ubi` (**RHEL 9.8**) with only RHEL-repo packages added (python3.12, skopeo, Chromium libs) | yes for everything headless; no desktop |
| the isolated network | a Docker `--internal` network holding only Nexus and the workstation containers | yes — **negative control** in every run: `curl https://registry.npmjs.org/` → `Could not resolve host`; Nexus → HTTP 200 |
| transfer media | the two `.tar` files, extracted, **mounted read-only** | yes |

**Why 3.76.1:** a first run against the current `sonatype/nexus3` (3.96.4, Community Edition) failed every upload with HTTP 403 — *"You must accept the End User License Agreement (EULA)…"*. Accepting a licence is the organisation's decision, so it was not accepted here. 3.76.1 predates the Community Edition gate; its repository, components and registry APIs are what the scripts use. **What 3.96.4 did prove:** repository creation works before acceptance, uploads do not, and the scripts now stop with Sonatype's own text instead of 1,561 opaque 403s (defect 1).

## The runs

### Build (connected side)

| | Front-end | Back-end |
|---|---|---|
| Command | `tools/build-frontend-bundle.sh <wd>` | `DOCKERHUB_MIRROR=mirror.gcr.io tools/build-backend-bundle.sh <wd>` |
| Result | `devenv-frontend-bundle-2026-10-01.tar`, **1.31 GB** | `devenv-backend-bundle-2026-10-01.tar`, **3.66 GB** |
| Content | npm pool **1,542 tarballs / 260.4 MB**, all sha512-verified against the lockfile; Node, VS Code RPM (Microsoft sha256), 8 `.vsix` (manifest version checked), uv (sha256), Cypress zip, Playwright Chromium, Prisma engine (sha256) | Temurin (sha256), Gradle (sha256), Eclipse (sha512), Helm (sha256), kubectl (sha256); Maven closure **605 POMs / 1,228 files / 331 MB**; **10 images** by digest |
| Harvest proof | — | `BUILD SUCCESSFUL`, **3 tests run, 0 failed** (unit, Testcontainers-2.x compile proof, Cucumber scenario booting the full Spring Boot 4.1.1 context) on Java 25 with Checkstyle, PMD, JaCoCo 0.8.15, Spotless |
| Re-run | 23 s, **1,542 kept / 0 fetched**; output re-assembled from cache | images reused from cache, **0 pulls** |
| Name check | `grep` of every path and every shipped text file for project and estate names: **none** | same: **none** |

### Island side — one clean pass, fresh Nexus, from the tars

```
0  fresh Nexus 3.76.1; admin password changed
1  loader host (offline RHEL 9)     control OK: no internet / control OK: nexus reachable HTTP 200
2  nexus-create-repos.sh --anonymous-read
     created: npm-hosted, maven-hosted, raw-hosted, pypi-hosted, docker-hosted
     active realms: NexusAuthenticatingRealm, NpmToken, DockerToken · anonymous read: on
     no EULA endpoint (HTTP 404) -- not a Community Edition release that needs one
3  load-nexus.sh (front-end, media read-only)     bundle checksums OK
     npm     uploaded=1542   already-present=0   FAILED=0
     raw     uploaded=19     already-present=0   FAILED=0          FINISHED: zero failures (1m12s)
4  load-nexus.sh (back-end; images via skopeo)    bundle checksums OK
     raw     uploaded=10   FAILED=0 · maven uploaded=1228   FAILED=0 · images uploaded=10   FAILED=0
                                                                    FINISHED: zero failures (2m47s)
5  re-run both (idempotency)   npm/raw/maven: all already-present ... images: FAILED=10   <- defect 2
6  front-end workstation (fresh offline RHEL 9), SKIP_VSCODE=1
     system step: node v24.21.0, npm 11.19.0, uv 0.12.21, Cypress, Playwright, profile.d, npmrc
     prove-install.sh frontend (as an ordinary user):
       PASS  npm cache for this proof starts EMPTY
       PASS  npm ci of 2004 locked packages from Nexus (empty cache)
       PASS  Angular CLI runs
       PASS  TypeScript is 6.0.x
       PASS  Prisma CLI + schema engine        (schema-engine-rhel-openssl-3.0.x via PRISMA_ENGINES_MIRROR)
       PASS  Cypress binary installed          (from the local zip)
       PASS  Playwright browsers found
       PASS  Playwright launches Chromium headless
       PASS  uv runs
       PASS  python3.12 present (Python 3.12.14)
       RESULT: 9 passed, 0 failed -- GREEN (1m11s)
7  back-end workstation (fresh offline RHEL 9)
     system step: openjdk 25.0.4.1 LTS, Gradle 9.7.1, helm v4.0.5, kubectl v1.37.1, Eclipse + Lombok agent,
                  profile.d, podman registries.conf
     user step:   Gradle init script -> maven-hosted; ~/.testcontainers.properties -> nexus:8082
     prove-install.sh backend:
       PASS  Gradle home for this proof starts EMPTY (only the Nexus init script)
       PASS  harvest build from Nexus: compile, tests (Cucumber + Spring context), Checkstyle, PMD,
             JaCoCo, Spotless, bootJar
       PASS  registry serves postgres:18.6 (skopeo copy; no container runtime on this machine)
       RESULT: 2 passed, 0 failed -- GREEN (1m57s)
8  second workstation WITHOUT the media (FROM_NEXUS=1, scripts fetched from raw-hosted/devenv-scripts/)
     system step completed: Node, uv, Cypress, Playwright -- all served by Nexus
```

**Python path (optional — no PyPI packages are on the list):** with a sample `black==26.5.1` in `requirements.txt`, the build's `pip download` flags fetched 7 cp312/manylinux wheels; Nexus's components API took all 7 (HTTP 204); then on a fresh offline RHEL 9 workstation, after the front-end system step, **both `uv pip install` and `pip install` installed Black 26.5.1 from `pypi-hosted`** (negative control: no internet).

After the defect-2 fix, both bundles re-loaded against the populated Nexus (offline, checksums re-verified): **npm 1,542 · raw 19 + 10 · maven 1,228 · images 10 — all `already-present`, zero failures.** Nexus blob store after both loads: **7.0 GB**.

## Defects found by running — all fixed in the scripts as committed

| # | Found at | Symptom | Cause | Fix |
|---|---|---|---|---|
| 1 | first load, Nexus 3.96.4 | 1,561 × `HTTP 403`, no explanation | Community Edition refuses uploads until its EULA is accepted | `nexus-create-repos.sh` detects the un-accepted EULA and stops with Sonatype's text (accepts only with an explicit `--accept-eula`); `load-nexus.sh` pre-checks it |
| 2 | idempotency re-run | `images FAILED=10` (`blob upload invalid`) | hosted tags are write-once; the loader re-pushed | registry-API `HEAD /v2/<repo>/manifests/<tag>` first; present → skipped |
| 3 | own review between runs | a changed pin (MockServer) left the old image in the output | output directory reused across runs | output assembled **fresh** every run from a download cache; npm pool pruned to the lockfile |
| 4 | own review | logs written into the bundle | — | logs go to `~/devenv-load-logs/<bundle>/`; media can be read-only (then rehearsed read-only) |
| 5 | first back-end build | Cucumber `CucumberBackendException` | harness: `cucumber-spring` needs a context class | added one — which made the scenario a stronger proof (full Boot context) |
| 6 | back-end builds | Maven Central `429`, Docker Hub `429` | public rate limits on bulk downloads | Gradle retried with back-off (cache persists between attempts); image pulls retried; `DOCKERHUB_MIRROR`; image reuse cache so a re-cut doesn't pull at all |
| 7 | rehearsal | the agent container ran out of disk twice | the container engine keeps its own unpacked copy of every image (~9 GB) | prerequisite corrected from "~8 GB" to **~20 GB free** for the back-end build |
| 8 | Python path test | `uv` / `pip` on a workstation would still look for pypi.org | the front-end installer configured npm but not Python | `/etc/profile.d/devenv-frontend.sh` now sets `UV_DEFAULT_INDEX`, `PIP_INDEX_URL`, `PIP_TRUSTED_HOST` → pypi-hosted (proven offline) |

Plus two gaps the harvest exposed in the *stack*, not the scripts: the selenium and mockserver Testcontainers modules declare their client libraries as *provided* (added), and MockServer was wrongly noted as dormant at 5.15.0 — it shipped **8.0.0** on 2026-09-15 (corrected before anything was handed over).

## What is NOT proven — do not read past this

1. **A real RHEL 9 desktop.** VS Code's RPM install (`SKIP_VSCODE=1` here: no GUI repos in UBI), `code --install-extension` (the user step), Eclipse actually launching, the Lombok agent in a running IDE. The files are verified by checksum; their installation is not.
2. **Testcontainers starting containers** on rootless Podman from Nexus images (no container runtime inside the workstation container). The registry serving the images is proven; Ryuk-disabled Podman operation is not.
3. **Nexus Community Edition with the EULA accepted** (3.96.x) and **Nexus Pro**. The APIs used are long-standing; behaviour under CE's usage limits is `[UNVERIFIED]`.
4. **Nexus behind TLS or a reverse proxy.** Everything ran over plain HTTP.
5. **Firefox / WebKit** for Playwright (not staged) and **Maven-based** builds (only Gradle). Python wheels were proven only with a sample package, since none is requested.
6. **The real staging machine.** Proxies that re-sign TLS need the extra steps in the script headers.
7. **Docker Hub digests via the mirror.** Images were pulled through `mirror.gcr.io` (Docker Hub rate-limited this container); digests are content-addressed and should equal Docker Hub's, but were not cross-checked against Docker Hub itself.

## Known limitations carried forward

- A same-day re-cut cannot overwrite the scripts already copied to `raw-hosted/devenv-scripts/<bundle>/` (write-once); a different date gets a new path. Re-uploading scripts silently keeps the first copy.
- `IMAGES.lock` records the **multi-arch index** digest from the source registry; the island registry holds the single linux/amd64 image, whose manifest digest differs. Recording the image ID (config digest) as well would make on-island verification direct — a candidate for v2.
- `selenium/standalone-chrome:latest` is a floating tag; it moves only with `--refresh-images` (A-4: pin it).

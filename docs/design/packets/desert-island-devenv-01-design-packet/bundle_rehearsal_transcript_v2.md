---
schema: corpus-doc/v1
status: exploratory
title: Bundle Rehearsal Transcript v2 — pnpm example stack, Docker CE + Testcontainers + kind tooling, rebuilt and rehearsed offline
areas: [dev-environment, isolated-network, risk-gates, technology-stack]
related: ["docs/design/packets/desert-island-devenv-01-design-packet/bundle_rehearsal_transcript_v1.md", "docs/design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v2.md", "docs/context/governance/decisions/ADR-008-desert-island-devenv-baseline.md", "docs/context/operations/user-workflow/bundling_scripts_guide_v1.md"]
updated: 2026-10-01
---

# Bundle Rehearsal Transcript v2

**Created:** 2026-10-01 (Axium) | **Status:** `exploratory` — evidence record for the changes ADR-008 required. **Adds to [v1](bundle_rehearsal_transcript_v1.md)** (same day); v1's set-up table, defects 1–8 and its first proofs still stand. Everything below was **run**; numbers are copied from the output.

## What changed and was re-proven

| Change (ADR-008) | Build | Island-side proof |
|---|---|---|
| Example stack locked to **pnpm 10.34.6**; pnpm + only-allow in the npm pool; Angular **22.2.1** | front-end bundle rebuilt: **1,554 tarballs / 291.4 MB**, tar **1.34 GB** (1,551 from `pnpm-lock.yaml` + 3 package-manager tarballs) | load: **npm uploaded=38, already-present=1,516, FAILED=0**. Fresh offline RHEL 9.8 workstation → `install-frontend-workstation.sh system` installed pnpm from its own tarball → `prove-install.sh frontend` **10 passed / 0 failed (1 m 09 s)**: `pnpm install --frozen-lockfile` from an **empty store** (the `preinstall: npx only-allow pnpm` ran through Nexus too), Angular CLI, TS 6.0, Prisma engine via the mirror, Cypress, Playwright → headless Chromium, **npm installing from Nexus with its own empty cache** |
| **Docker CE 29.8.2** RPMs (+ containerd.io 2.3.6, buildx 0.37.1, compose 5.5.1), **kubectl 1.31.14**, **Helm 3.18.6 + 4.3.0**, **kind 0.29.0**, `kindest/node:v1.30.13` | back-end bundle rebuilt: tar **4.22 GB**; Docker signing-key fingerprint verified; every RPM against the repository's sha256; node image digest **`sha256:397209b3…` = the one kind's release lists**; harvest **4 tests run, 0 failed** (the new container test is skipped on the build machine, by design) | load: **raw uploaded=14, images uploaded=1, maven/others already-present, FAILED=0** |
| Workstation installs Docker, not Podman | — | fresh offline RHEL 9.8 container (privileged, with Docker's RHEL dependencies pre-installed as the stand-in for the island's RHEL repos): `install-backend-workstation.sh system` → **5 RPMs: Docker signatures OK → Docker CE 29.8.2 installed offline** (dnf skipped the unreachable repos; deps were present), `daemon.json` trusts `nexus:8082`, `dev` added to the `docker` group, kubectl/helm/helm4/kind on PATH |
| Testcontainers on Docker with **Ryuk on** | new `PostgresContainerTest` (runs only where `DEVENV_CONTAINER_TESTS=true`) | `prove-install.sh backend` as `dev`: Gradle home empty → **harvest build from Nexus PASS**, **"Testcontainers started postgres:18.6 (and Ryuk) from nexus:8082" PASS**, **docker pull from Nexus PASS** |
| kind clusters from Nexus | `island/kind-cluster.sh` | **node image pulled from Nexus** (both nested and one level deep); **cluster bootstrap NOT proven here** — see below |

## Defects found by running (continuing v1's numbering)

**Read #13–#15 first** if you loaded a bundle with an earlier copy of `load-nexus.sh`: run the current one again (`load-nexus.sh npm`) — it re-publishes anything missing or incomplete, in place.

| # | Symptom | Cause | Fix |
|---|---|---|---|
| 9 | `pnpm install` warned `unmet peer uuid@">=9 <12": found 8.3.2` | npm auto-installed `@stomp/rx-stomp`'s `uuid` peer at 11.1.1; pnpm wires it to the 8.3.2 `sockjs` carries | `uuid: 11.1.1` declared explicitly (➕ in the stack list) |
| 10 | pnpm 10 "Ignored build scripts" for 11 packages | pnpm 10 blocks dependency install scripts by default | `pnpm.onlyBuiltDependencies`: `cypress`, `prisma`, `@prisma/engines`, `esbuild` (all offline-safe); the rest listed in `ignoredBuiltDependencies` — **`chromedriver` stays blocked** (its script downloads "latest" from Google) |
| 11 | back-end system step stopped silently after `kubectl version` | `kubectl … \| head -1` under `set -o pipefail`: `head` closes the pipe, kubectl dies of SIGPIPE, the pipeline "fails" — a race (it passed in v1) | `sed -n 1p` (reads all input) on both such lines |
| 12 | `prove-install.sh backend`: `KIND_NODE_TAG: unbound variable` | the backend proof did not load `backend.versions.env` | sourced |
| **13** | (found by the legacy ladder's offline replay) `ng update`'s temporary CLI install: `No matching version found for ini@4.1.3` — although `ini-4.1.3.tgz` was in Nexus | **Nexus drops versions from a package's npm metadata when two versions of that package are uploaded concurrently.** The loaders uploaded 6 tarballs at a time. Measured: **113 packages / 119 versions** missing in the devenv npm repo, 57 / 61 in the ladder repo. Lockfile installs never noticed (they fetch tarballs by URL — which is how v1's proofs passed); anything that *resolves* a version fails | shared `npm-load-package.sh`: one job per package, its versions **one at a time**, then a **verify pass** — every version Nexus holds must be listed; missing ones are deleted and re-loaded. On the damaged repo: **119 repaired, then 0 missing** (independent re-check) |
| **14** | (ladder replay, next step) `ng update @angular/core@18.2.14 @angular/cli@18.2.21` moved **only core, cli and zone.js**; phase 2 then failed on `platform-browser-dynamic` peers | **Nexus's components REST API builds npm metadata from ~10 fields of package.json** — it drops `ng-update` (Angular's package groups), `schematics` and other non-standard fields. `ng update` reads package groups from the *registry's* metadata, so it updated core alone. `npm publish` keeps the whole manifest (25–30 fields — tested) | **both loaders now upload with `npm publish`** (`--registry` + `--provenance=false` override a tarball's own `publishConfig` — verified with npm 10.9.2 on packages that point at registry.npmjs.org and wombat-dressing-room); the verify pass also treats a version whose metadata lacks a field its package.json has (`ng-update`, `optionalDependencies`, `bin`, `os`, `cpu`, `peerDependenciesMeta`) as incomplete and re-publishes it. `hop.sh` refuses to start a rung if the registry's `@angular/core` metadata has no `ng-update`. The devenv loader borrows the bundle's own Node when the loading machine has no npm |
| **15** | the first repair pass **deleted 9 platform-binary packages and could not re-publish them** (esbuild/rollup/rolldown/lightningcss/sass-embedded linux builds) | **npm 11 refuses to put `latest` on a version lower than one already published** ("Cannot implicitly apply the latest tag") | every publish passes an explicit tag chosen with npm's own semver: `latest` for the highest stable version, `previous` below it, `prerelease` for pre-releases. Re-run: **9 re-published, FAILED=0, 0 missing**, tags right (esbuild `latest 0.28.2, previous 0.25.0`); `prove-install.sh frontend` re-run on the republished metadata: **10/10 GREEN** |

## kind — what is and is not proven

`kind create cluster --image nexus:8082/kindest/node:v1.30.13` pulled the node image from Nexus, prepared the node, started a **healthy kubelet** — and then the control plane never came up. Inside the node: `runc create failed: unable to start container process: can't get final child's PID from pipe: EOF` for every pod sandbox. That is this rehearsal machine's sandbox refusing nested container runtimes — it failed identically with kind three levels deep (inside the RHEL container's Docker) and one level deep (directly on the host's Docker). **Not proven:** a kind cluster reaching Ready, and `kind-cluster.sh`'s containerd `certs.d` configuration pulling a pod image from Nexus. Both are the first things to run on a real RHEL 9 workstation (`prove-install.sh backend` does it; `SKIP_KIND=1` skips it).

## Shortcuts taken (named, not hidden)

- **kind is a local build** (`go install sigs.k8s.io/kind@v0.29.0`) — GitHub release assets are not reachable from this session. The build script supports that only through `KIND_LOCAL_BINARY=`, and says so in `BUNDLE-INFO.txt`: **"NOT the release binary; re-cut with GitHub access before shipping."** On the staging machine the script downloads the release binary and checks it against kind's published sha256.
- **The back-end rehearsal reused the Maven harvest** (`--keep-gradle-home`): the library set did not change; only the new test class was compiled. Build the shipped bundle without the flag.
- **Island scripts were re-synced into the already-built back-end bundle** after defects 11–12 (copy + checksum update — exactly what the build's step 7 does) rather than re-cutting 4.2 GB on a disk-limited machine. The scripts as committed are the ones that passed.
- Docker's RHEL dependencies were pre-installed into the workstation image (from UBI 9's repos) to stand in for the island's RHEL repositories; the Docker RPMs themselves came only from the bundle.

## Still not proven (carried from v1, updated)

A real RHEL 9 **desktop** (VS Code, Eclipse GUI) · **kind** (above) · Nexus **3.96.x with the EULA accepted** (rehearsed on 3.76.1; the EULA gate itself on 3.96.4) · Nexus behind TLS / a reverse proxy · Firefox/WebKit for Playwright · Maven-based builds.

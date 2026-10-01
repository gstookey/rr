---
schema: corpus-doc/v1
status: exploratory
title: Bundling Scripts Guide v1 — building, porting and loading every transfer bundle (dev environment + Angular upgrade ladder)
areas: [dev-environment, isolated-network, technology-stack, frontend, backend]
related: ["docs/design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v2.md", "docs/design/packets/desert-island-devenv-01-design-packet/bundle_rehearsal_transcript_v2.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v3.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v2.md", "desert-island-devenv/island/README.md"]
updated: 2026-10-01
---

# Bundling Scripts Guide v1

**Created:** 2026-10-01 (Axium, at Graham's request) | **Status:** `exploratory` — every command below was run on 2026-10-01 (rehearsal evidence: [devenv transcript v2](../../../design/packets/desert-island-devenv-01-design-packet/bundle_rehearsal_transcript_v2.md), [ladder transcript v3](../../../design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v3.md)). Re-check versions before a re-cut.

One page for the whole loop: **build on the connected side → carry the `.tar` across → load Nexus → set up / upgrade on the isolated side.** There are three kinds of bundle:

| Bundle | Built by | For | Size (2026-10-01) |
|---|---|---|---|
| `devenv-frontend-bundle-<date>.tar` | `desert-island-devenv/tools/build-frontend-bundle.sh` | new RHEL 9 workstations: Node + npm, pnpm, VS Code, test-browser binaries, the npm pool | 1.34 GB |
| `devenv-backend-bundle-<date>.tar` | `desert-island-devenv/tools/build-backend-bundle.sh` | new RHEL 9 workstations: JDK, Gradle, Eclipse, Docker CE, kubectl, Helm, kind, the Maven tree, container images | __BE_SIZE__ |
| `angular-upgrade-bundle-<slice>-<date>.tar` | `legacy-shells/tools/build-transfer-bundle.sh` | the legacy apps' Angular 17 → 22.2 upgrade ladder: npm tarballs for every rung, the hop tools, Node 22 for the last rung | __LADDER_SIZE__ (cumulative) |

**The stack lists** (what is in the first two, version by version, with every correction explained): [`devops_tech_stack_list_v2.md`](../../../design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v2.md) — the hand-off for DevOps — and the machine-readable pins in `desert-island-devenv/stack/` (`workstation.env`, `backend.env`, `images.txt`, `vscode-extensions.txt`, `frontend/package.json` + `pnpm-lock.yaml`, `package-managers/`, `backend/` Gradle project).

---

## 0. The staging machine (connected side)

- **Linux x86_64** (the isolated side is x86_64 RHEL 9; binaries are fetched for that platform). Any distro; RHEL 9 is ideal.
- **Tools:** bash, curl, tar, xz, gzip, unzip, sha256sum, sha512sum, git; **docker** (or podman) for the back-end images; gpg (optional — checks Docker's signing key). Node and Java are **not** needed: the scripts download the pinned ones and use those.
- **Disk:** ~4 GB for the front end, **~20 GB** for the back end (the engine keeps its own unpacked copy of every image), ~1 GB for the ladder.
- **Hosts it must reach** (give this list to whoever runs the proxy/firewall): `registry.npmjs.org`, `nodejs.org`, `github.com` + its release-asset CDN (Temurin, uv, kind), `services.gradle.org`, `plugins.gradle.org`, `repo.maven.apache.org`, `download.eclipse.org`, `get.helm.sh`, `dl.k8s.io`, `download.docker.com`, Docker Hub (`registry-1.docker.io`, `auth.docker.io`) and `quay.io` — or a pull-through mirror via `DOCKERHUB_MIRROR=` — `update.code.visualstudio.com`, `marketplace.visualstudio.com`, `download.cypress.io`, Playwright's browser CDN, `binaries.prisma.sh`.
- **Behind a proxy:** export `HTTPS_PROXY` as usual. If the proxy re-signs TLS, also see the header of `build-backend-bundle.sh` (`JAVA_TOOL_OPTIONS` trust store).
- **Docker Hub rate limits** (HTTP 429 on anonymous pulls): `docker login` first, or `DOCKERHUB_MIRROR=mirror.gcr.io`.

Every script: verifies every download against a published checksum, **aborts with the URL** on any mismatch, keeps a download cache so a re-run fetches nothing twice, and names its output for what it is (no project or estate names — the 2026-09-08 compliance convention).

---

## 1. Dev-environment bundles (new isolated network)

### 1.1 Build

```bash
git clone <this repo> && cd rr
desert-island-devenv/tools/build-frontend-bundle.sh ~/bundles            # 10-40 min
desert-island-devenv/tools/build-backend-bundle.sh  ~/bundles            # 20-60 min
```

| Option | Script | What it does |
|---|---|---|
| `--relock` | front end | regenerate `stack/frontend/pnpm-lock.yaml` (with the pinned pnpm) and `stack/package-managers/package-lock.json` before building — after you change `package.json`. Commit the new lockfiles |
| `--skip-browsers` / `--skip-vscode` | front end | quick trial runs; **don't ship** these |
| `--skip-images` / `--skip-eclipse` | back end | quick trial runs; **don't ship** these |
| `--refresh-images` | back end | re-pull every image (otherwise images saved by an earlier run are reused by digest) |
| `--keep-gradle-home` | back end | faster iteration; the default starts the Maven harvest from an **empty** cache so nothing stale ships — build the shipped bundle without it |
| `DOCKERHUB_MIRROR=mirror.gcr.io` | back end | pull Docker Hub images through a mirror (same digests) |

**Read the last lines it prints** (`BUNDLE-INFO.txt` is also inside the tar): versions, counts, and — for the back end — `harvest tests: N run, 0 failed`. Anything else is not a bundle to ship.

### 1.2 Carry it across

Transfer the `.tar` by the approved mechanism. On arrival, before anything else:

```bash
tar -xf devenv-backend-bundle-<date>.tar && cd devenv-backend-bundle-<date>
sha256sum -c SHA256SUMS --quiet && echo TRANSFER-OK        # every loader re-checks this anyway
```

### 1.3 Load Nexus (once per bundle; any machine that can reach Nexus)

Full runbook, with troubleshooting: `island/README.md` inside either bundle. The short form:

```bash
cp island/devenv.conf.template island/devenv.conf        # set NEXUS_URL, repo names, DOCKER_REGISTRY,
                                                         # NEXUS_CREDENTIALS_FILE (a file: user:password)
island/nexus-create-repos.sh --anonymous-read            # first time only: creates the 5 hosted repos + realms
island/load-nexus.sh                                     # verifies, then loads npm/raw/pypi/maven/images
```

`load-nexus.sh` ends with `uploaded / already-present / FAILED` per part — **only `FAILED=0` everywhere is done.** It is re-runnable (an interrupted load resumes; loading a newer bundle on top uploads only what is new). npm packages are loaded with `npm publish` and their metadata verified — Nexus's components API would strip fields `ng update` and npm need, and concurrent versions of one package can drop out of the metadata (both found 2026-10-01); re-running repairs an earlier load. No npm on the loading machine? It borrows the front-end bundle's own Node.

**Nexus version:** target the newest release (3.96.4 on 2026-09-30). **Community Edition 3.77+ refuses every upload until an administrator accepts Sonatype's EULA** — the scripts detect this and stop with Sonatype's own text rather than failing 2,000 times with HTTP 403. Accepting it is your organisation's decision; the scripts never do it silently (`nexus-create-repos.sh --accept-eula` exists for when that decision is made).

### 1.4 Set up a workstation (each RHEL 9 machine)

```bash
sudo island/install-frontend-workstation.sh system   # Node+npm, pnpm, uv, VS Code, Cypress/Playwright/Prisma binaries, /etc/profile.d
island/install-frontend-workstation.sh user          # VS Code extensions + offline-safe settings (as the developer)
sudo island/install-backend-workstation.sh system    # JDK, Gradle, Eclipse(+Lombok), Docker CE, kubectl, helm, helm4, kind
island/install-backend-workstation.sh user           # Gradle -> Nexus, Testcontainers -> Nexus registry
# log out and back in (PATH, docker group), then:
island/prove-install.sh frontend                     # GREEN = Nexus alone can supply a full front-end install
island/prove-install.sh backend                      # GREEN = ... a full back-end build, a real Testcontainers
                                                     #   Postgres, and a kind cluster -- all from Nexus
```

Without the media on the workstation: `FROM_NEXUS=1` makes the installers fetch from Nexus's raw repository (the loader put the scripts there too, under `raw-hosted/devenv-scripts/<bundle>/`).

**Docker notes:** the installer installs the bundled Docker CE RPMs (signatures checked against Docker's key) — their dependencies come from your RHEL repositories; remove `podman-docker` first if it is installed. It writes `/etc/docker/daemon.json` with the Nexus registry under `insecure-registries` while Nexus is plain HTTP, and adds the user who ran `sudo` to the `docker` group (**root-equivalent** — Docker's own wording; `DOCKER_ADD_USER=0` to skip).

**kind:** `island/kind-cluster.sh create [name]` builds a cluster from the Nexus node image (`kindest/node:v1.30.13`, matching the 1.30 cluster) and lets every node pull from the Nexus registry. In manifests and Helm values, name images by their Nexus address (`nexus:8082/postgres:18.6`); short Docker Hub names are not rewritten inside the cluster.

---

## 2. The Angular upgrade ladder (legacy apps, 17 → 22.2.1)

### 2.1 Build

Your 2026-09-04 decision stands: **one cumulative transfer, staged into Nexus one rung at a time.**

```bash
legacy-shells/tools/build-transfer-bundle.sh ~/ladder                    # = --cumulative: every rung, + Node 22 for the last one
legacy-shells/tools/build-transfer-bundle.sh ~/ladder --rung 18-19       # one rung only (v17-baseline, 17-18 .. 21-22)
legacy-shells/tools/build-transfer-bundle.sh ~/ladder --delta-from <MANIFEST.json of what you already ported>
```

It rebuilds the pool from the **committed lock snapshots** (`legacy-shells/bundle/locks/v17..v22/` + `bundle/tempcli/`), verifying every tarball's sha512 against the locks, then checks the pool against the committed `legacy-shells/bundle/SHA256SUMS`. **"pool matches committed SHA256SUMS" is the line you want**; a warning means the registry or a lock changed — diff before trusting it. Output: `angular-upgrade-bundle-<slice>-<date>.tar` containing

| | |
|---|---|
| `tarballs/`, `SHA256SUMS`, `MANIFEST.json` | the npm tarballs (each tagged with the rung that first needs it) |
| `upload-to-nexus.sh` + `npm-load-package.sh` | the loader (`npm publish`, one package's versions at a time, metadata verified and repaired; `--through <rung>` for staged upload) |
| `tools/hop.sh`, `tools/make-root-angular-json.mjs`, `tools/port-root-angular-json.mjs` | the hop, one step at a time |
| `LADDER.md` | the procedure (= `monorepo_hop_procedure_v3.md`) |
| `NEXUS_UPLOAD.md` | upload instructions (= `nexus_upload_instructions_v2.md`) |
| `node/` (cumulative and `21-22` only) | `node-v22.23.3-linux-x64.tar.xz` + `SHASUMS256.txt` — Angular 22 needs Node `^22.22.3`; the island has 22.15.1 |

### 2.2 Load Nexus — one rung at a time

```bash
tar -xf angular-upgrade-bundle-v17-v22-<date>.tar && cd angular-upgrade-bundle-v17-v22-<date>
export NEXUS_URL=http://<nexus>:8081 NPM_REPO=<your npm hosted repo> NEXUS_CREDENTIALS_FILE=~/.nexus-creds
./upload-to-nexus.sh --through 17-18      # before hopping to 18; later --through 18-19, and so on
```

Re-running is safe (present tarballs are skipped) and **repairs** anything Nexus holds with missing or incomplete npm metadata. Then, from a workstation: `npm view @angular/core@18.2.14 ng-update.packageGroup` must print a list. Needs `node` + `npm` on the loading machine.

### 2.3 Hop one app one rung

Per app, per rung, from the app's root (a clean git checkout of the monorepo; `angular.json` in `packages/client/`):

```bash
B=<path to the extracted bundle>
$B/tools/hop.sh . 17-18 check       # read-only: Node vs. the rung's requirement, registry, what will move
$B/tools/hop.sh . 17-18 pre         # rung pre-step (18-19: jest-preset-angular; 20-21: the Jest 30 stack)
                                    #   + temporary root angular.json.   -> review, validate, commit
$B/tools/hop.sh . 17-18 phase1      # ng update @angular/core + @angular/cli   -> READ the migration diff, commit
$B/tools/hop.sh . 17-18 phase2      # ng update material/cdk (+ @ngrx/* if declared) -> review, commit
$B/tools/hop.sh . 17-18 pins        # hand-bumps: workspace toolchain pins, keycloak-angular, (21-22) TS6 tsconfig
$B/tools/hop.sh . 17-18 teardown    # ports any angular.json edits back to packages/client, removes the temp
                                    #   file, regenerates the lock from clean   -> commit
$B/tools/hop.sh . 17-18 validate    # ng build, tsc per package, jest, npm ls
```

Everything rung-specific — versions, pre-steps, the Node gate, known defects — is in `LADDER.md`. **Before 21-22, install the bundled Node 22.23.3** (a within-line patch upgrade of 22.15.1; `hop.sh check` refuses otherwise).

---

## 3. When a pin changes

| Change | Do |
|---|---|
| a front-end package version | edit `stack/frontend/package.json` → `build-frontend-bundle.sh <dir> --relock` → commit `pnpm-lock.yaml` → rebuild → rehearse `prove-install.sh frontend` |
| a back-end library | edit `stack/backend/gradle/libs.versions.toml` → `build-backend-bundle.sh <dir>` (fresh Gradle home) — a green harvest build is the proof |
| a tool binary (JDK, Gradle, Helm, kubectl, kind, Docker, Node, VS Code, uv) | edit `stack/backend.env` / `stack/workstation.env` → rebuild |
| an image | edit `stack/images.txt` → rebuild (`--refresh-images` if the tag floats) |
| the ladder's target versions | edit the table at the top of `legacy-shells/tools/hop.sh`, **re-walk** the shells (the locks are the evidence), commit the new `bundle/locks` + `tempcli`, rebuild, re-verify the committed `SHA256SUMS` |

## 4. Troubleshooting

| You see | Means | Do |
|---|---|---|
| `ABORT: download failed: <url>` | host unreachable / proxy | allow the host (§0) and re-run — it resumes |
| `ABORT: sha256 mismatch` | the download is not what the publisher published | **stop**; re-run once (it deletes the bad file); if it repeats, report it |
| `HTTP 429` during images | Docker Hub rate limit | `docker login`, or `DOCKERHUB_MIRROR=mirror.gcr.io` |
| `STOP: ... EULA is not accepted` | Nexus Community Edition gate | an administrator accepts it (your organisation's decision) |
| `checksum mismatch in the bundle` | transfer corrupted | request re-delivery of the files listed |
| `hop.sh ... does not satisfy @angular/cli@22.2.1 engines` | Node too old for rung 21-22 | install `node/node-v22.23.3-...` from the bundle |
| `hop.sh: ... metadata ... has no ng-update package group` / `ng update` moves only `@angular/core` | Nexus was loaded in a way that strips npm metadata | re-run `upload-to-nexus.sh` (it re-publishes incomplete versions) |
| `No matching version found for <pkg>@<ver>` although the tarball is in Nexus | that version dropped out of Nexus's npm metadata | re-run the loader — its verify pass repairs it |
| `STOP [.. teardown]: port those edits ... by hand` | a migration changed `angular.json` in a way the port tool can't prove | copy the change into `packages/client/angular.json` without the `packages/client/` prefix, delete the temp files, re-run teardown |
| `ng update` refuses at plan stage naming `@other-team/...` | a private package peers on the old Angular major | see `LADDER.md` §"private packages" — coordinate, don't `--force` blind |

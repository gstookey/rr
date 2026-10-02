# Air-gapped development workstation bundles — island runbook

**Created:** 2026-10-01 · **Last updated:** 2026-10-02 (bundles by SRF approval status) · travels inside every front-end and back-end bundle (`devenv-frontend-bundle-<date>.tar`, `devenv-backend-bundle-<date>.tar`, and the `devenv-frontend-<status>-<date>.tar` category bundles)

Written for someone on the isolated network **with no internet and no one to ask**. Each step names what can go wrong beside it. If what you see doesn't match what's written here, **stop and write down exactly what you saw** — whoever troubleshoots from outside will have only your description.

## What the two bundles contain

| Bundle | Part | Goes to | What it is |
|---|---|---|---|
| front-end | `npm/` | Nexus **npm-hosted** | every npm package the locked front-end stack needs, as the original registry tarballs |
| front-end | `raw/` | Nexus **raw-hosted** | Node.js, VS Code RPM + extensions, uv, Cypress binary, Playwright browsers, Prisma engine |
| front-end | `pypi/` | Nexus **pypi-hosted** | Python wheels (only if any were requested) |
| back-end | `maven/` | Nexus **maven-hosted** | every Java artifact and Gradle plugin the locked back-end build needs |
| back-end | `raw/` | Nexus **raw-hosted** | Temurin JDK, Gradle, Eclipse IDE, Docker CE RPMs (+ Docker's signing key), kubectl, Helm 3 + 4, kind |
| back-end | `images/` | Nexus **docker-hosted** | container images (`IMAGES.lock` lists each tag with its digest) |
| both | `island/` | — | these scripts |

**Not in the bundles — from the RHEL 9 installation media / your RHEL repositories:** `python3.12 python3.12-pip python3.12-devel`, `skopeo` (optional, for the image loader), `git`, `jq`, Docker CE's dependencies (`container-selinux`, `libseccomp`, `iptables-nft`, `nftables` — dnf pulls them when the installer installs the bundled Docker RPMs), and the desktop libraries VS Code needs (dnf resolves those itself). **Do not install `podman-docker`** — it owns `/usr/bin/docker` and conflicts with Docker CE (ADR-008: the team uses Docker).

## Bundles by SRF approval status

*(Added 2026-10-02.)* The front-end bundle can also arrive **split by approval status** — `devenv-frontend-approved-<date>`, `-bump-submitted-`, `-bump-needed-`, `-new-srf-`, `-nice-to-have-` (made by `build-srf-bundles.sh`). Each is an ordinary front-end bundle holding only its rows' software plus their dependencies; `SRF-CONTENTS.md` at its top lists exactly what is inside. Everything below applies to each one, with three differences:

1. **Load each one when its approvals are in hand**, with the same `island/load-nexus.sh`. Any order works; a package two bundles share is skipped the second time (`already-present`). Load **`approved` first** — it carries Node.js, which the loader borrows (from Nexus) when the loading machine has no npm.
2. **The workstation step skips what has not arrived yet.** `install-frontend-workstation.sh system` prints `SKIPPED: … re-run this step after loading the bundle that carries it` for pnpm, uv, the Cypress binary, the Playwright browsers or VS Code when they are not in Nexus yet. Re-run it (with `FROM_NEXUS=1` on machines without the media) after loading the bundle that carries them; the `user` step likewise skips extensions not loaded yet.
3. **Prove each one with `island/prove-install.sh category`** (run from inside that bundle, after `system`):

```
PASS  npm: all 426 tarballs served by Nexus, each version listed in its package metadata
PASS  raw: all 3 files served by Nexus
WAIT  Jest (bundle: bump-needed) is not in Nexus yet -- needed to install: ts-jest
WAIT  TypeScript (bundle: bump-needed) is not in Nexus yet -- needed to install: ts-jest; typescript-eslint (+ parser and plugin)
WAIT  ESLint (+ @eslint/js) (bundle: bump-needed) is not in Nexus yet -- needed to install: typescript-eslint (+ parser and plugin); eslint-plugin-unused-imports; eslint-config-prettier
NOTE  35 of 39 rows have everything they need in Nexus; 4 wait on the bundles named above
PASS  npm installs the 33 npm packages of every row whose needs are met, from Nexus (empty cache)

RESULT: 3 passed, 0 failed
WAITING: 3 other bundle(s) named above must be loaded before those rows install -- not a failure of this bundle
GREEN -- reproducible from Nexus alone.
```
*(the `approved` bundle loaded alone, rehearsed 2026-10-02)*

`FAIL` is a problem with **this** bundle's load (re-run `load-nexus.sh`; then record). `WAIT` is not a failure: those rows need software from a bundle that is not loaded yet — they install once it is. When every bundle is loaded, `prove-install.sh frontend` (from any of them) is the full proof.

## Order of operations

```
0. Verify the media            sha256sum -c SHA256SUMS          (in each bundle's top folder)
1. Configure                   cp island/devenv.conf.template island/devenv.conf ; edit it
2. Create the repositories     island/nexus-create-repos.sh [--anonymous-read]     (once, admin)
3. Load each bundle            island/load-nexus.sh                                (each bundle)
4. Set up a workstation        sudo island/install-frontend-workstation.sh system ; island/install-frontend-workstation.sh user
                               sudo island/install-backend-workstation.sh system  ; island/install-backend-workstation.sh user
5. Prove it                    island/prove-install.sh frontend ; island/prove-install.sh backend
6. Write down what happened    (see the end of this page)
```

### 0. Verify

`sha256sum -c SHA256SUMS --quiet` must print nothing and exit 0. Any line it prints names a file that was damaged in transfer — request that bundle again. `load-nexus.sh` repeats this check and refuses to continue on a mismatch, so a modified or damaged bundle can't be loaded by accident.

### 1. Configure

`island/devenv.conf` holds your Nexus URL, the repository names, and the Docker connector port. Write credentials for an account that can write to the repositories as **one line `user:password`** in the file `NEXUS_CREDENTIALS_FILE` names, then `chmod 600` it. They never go on a command line.

### 2. Create the repositories (new Nexus only, admin account)

`nexus-create-repos.sh` creates `npm-hosted`, `maven-hosted`, `raw-hosted`, `pypi-hosted`, `docker-hosted` (Docker on its own HTTP port, e.g. 8082), turns on the npm and Docker token realms, and with `--anonymous-read` lets workstations read without a login. Repositories that already exist are left alone.

| You see | Meaning | Do |
|---|---|---|
| `STOP: this Nexus is Community Edition and its EULA is NOT accepted` | Nexus 3.77 and later (Community Edition) refuse **every** upload (HTTP 403) until an administrator accepts Sonatype's licence | An administrator accepts it in the web UI's onboarding wizard, or re-runs with `--accept-eula`. **This is a licensing decision for your organisation** — the script never makes it on its own. |
| `credentials ... are not an administrator's` | wrong account | use an admin account for this step only |
| `creating <repo> returned HTTP 400` | name clash with a different format, or blob store `default` missing | record the full message |

### 3. Load

Run `island/load-nexus.sh` from **each** bundle. It verifies the bundle, skips anything already in Nexus (so re-running just resumes), and prints a count per part:

```
  npm     uploaded=1542   already-present=0      FAILED=0
```

**Only `FAILED=0` everywhere is success.** Failures are listed in `~/devenv-load-logs/<bundle>/load-failures.txt` (logs never go into the bundle, so the media may be read-only). Re-run once; anything still failing — record the exact lines.

| You see | Meaning | Do |
|---|---|---|
| `FAILED` with `HTTP 403` | the account cannot write, or the EULA (step 2) | fix the account / EULA, re-run |
| `HTTP 413` on raw or images | a proxy in front of Nexus limits request size (the largest files are ~600 MB) | raise the limit on that proxy, re-run |
| `HTTP 400` on maven | repository layout policy rejected a path | record the path; the script creates the repo with a permissive layout for this reason |
| images: `need skopeo, podman or docker` | none installed | `dnf install skopeo` from the RHEL media |
| images: `http: server gave HTTP response to HTTPS client` | registry is plain HTTP | `DOCKER_REGISTRY_INSECURE=true` in devenv.conf (podman/skopeo); for the docker CLI add the registry to `insecure-registries` in `/etc/docker/daemon.json` |

### 4. Workstations

Each installer has a **system** step (root, once per machine) and a **user** step (each developer). Both read from the bundle; on a machine without the bundle, set `FROM_NEXUS=1` and they fetch the same files from `raw-hosted` (load-nexus.sh also uploads these scripts to `raw-hosted/devenv-scripts/`).

What they set up — so nothing ever reaches for the internet:

- **npm:** global `npmrc` points at `npm-hosted`; `audit`, `fund`, update checks off.
- **Packages that download binaries during `npm ci`** are pointed at local copies: Cypress (`CYPRESS_INSTALL_BINARY`), Prisma (`PRISMA_ENGINES_MIRROR` → raw-hosted), Playwright (`PLAYWRIGHT_BROWSERS_PATH`, download off), chromedriver and puppeteer downloads off. All in `/etc/profile.d/devenv-frontend.sh`.
- **Gradle:** `~/.gradle/init.d/devenv-nexus.init.gradle.kts` **replaces** every repository any build declares with `maven-hosted` (Gradle fails on an unreachable repository rather than skipping it, so leaving `mavenCentral()` in place would break builds).
- **Gradle wrapper:** projects whose `gradle-wrapper.properties` points at `services.gradle.org` cannot download Gradle. Either run the installed `gradle`, or set `distributionUrl` to `<NEXUS>/repository/raw-hosted/gradle/distributions/gradle-<version>-bin.zip`.
- **Testcontainers:** `~/.testcontainers.properties` sends Docker Hub images (and Ryuk, its clean-up container, which stays on under Docker) to your Nexus registry.
- **Docker:** `install-backend-workstation.sh system` installs Docker CE from the bundle (signatures checked against Docker's key), writes `/etc/docker/daemon.json` with the Nexus registry under `insecure-registries` while it is plain HTTP, enables the service, and adds the user who ran `sudo` to the `docker` group — **root-equivalent**, in Docker's own words (`DOCKER_ADD_USER=0` to skip). Log out and back in afterwards.
- **kind:** `./kind-cluster.sh create [name]` — node image (`kindest/node:v1.30.13`, matching the 1.30 cluster) from Nexus; every node may pull from the Nexus registry. Name images by their Nexus address in manifests (`nexus:8082/postgres:18.6`).
- **pnpm and npm:** both installed; `npm_config_registry` (in `/etc/profile.d/devenv-frontend.sh`) points both at Nexus. Each app chooses its package manager (ADR-008); the example stack uses pnpm.
- **npm metadata:** `load-nexus.sh` loads npm packages with `npm publish` (Nexus's components API keeps only ~10 metadata fields and drops `ng-update`), the versions of each package one at a time (concurrent versions can drop out of Nexus's metadata), each with an explicit dist-tag, and then verifies every version is listed completely, re-publishing any that is not (all found 2026-10-01). It borrows the bundle's own Node if the loading machine has no npm. **If you loaded with an older copy of the script, run `./load-nexus.sh npm` again** — it repairs in place.
- **Eclipse:** Lombok's agent is added to `eclipse.ini`; without it Lombok code shows false errors.

### 5. Prove it — do not declare success before this passes

`prove-install.sh frontend` installs the **entire** locked front-end stack with pnpm from a brand-new empty store (and npm with its own empty cache), so only Nexus can supply it, then checks the Angular CLI, TypeScript 6.0, Prisma's engine, Cypress, Playwright (launches headless Chromium) and uv. `prove-install.sh backend` rebuilds the bundled harvest project with an empty Gradle cache — Spring Boot context, Cucumber, Checkstyle, PMD, JaCoCo, Spotless — and, where Docker is usable, runs a **real Testcontainers Postgres** from your registry, pulls an image, and builds a **kind** cluster whose node and pod images come from Nexus (`SKIP_KIND=1` to skip that part).

Expect `RESULT: N passed, 0 failed` and `GREEN`. Every `FAIL` line names what failed; the log path is printed.

| FAIL on | Most likely | Do |
|---|---|---|
| `npm ci` / `pnpm install` / `ng update` with `404` / `ETARGET` / `No matching version found` | a version missing from Nexus **or from its npm metadata** | run `./load-nexus.sh npm` again (repairs metadata); then check `load-failures.txt`; record name + version |
| `npm ci` with `EINTEGRITY` | file damaged after verification | re-load that package |
| Playwright launch | missing system libraries | `dnf install nss atk at-spi2-atk cups-libs libdrm libxkbcommon libXcomposite libXdamage libXrandr mesa-libgbm pango alsa-lib` |
| harvest build: `Could not resolve` | an artifact missing from maven-hosted | record the full coordinate |
| harvest build: `Could not GET https://repo...` | the init script is missing | `install-backend-workstation.sh user` |

### 6. Write down what happened

Date, machine, `cat /etc/redhat-release`; Nexus version; the load summary lines; the `prove-install.sh` RESULT lines; every deviation from this page and why; anything outstanding. A deviation nobody wrote down is what breaks the second installation.

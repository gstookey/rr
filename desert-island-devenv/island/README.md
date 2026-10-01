# Air-gapped development workstation bundles — island runbook

**Created:** 2026-10-01 · travels inside both bundles (`devenv-frontend-bundle-<date>.tar`, `devenv-backend-bundle-<date>.tar`)

Written for someone on the isolated network **with no internet and no one to ask**. Each step names what can go wrong beside it. If what you see doesn't match what's written here, **stop and write down exactly what you saw** — whoever troubleshoots from outside will have only your description.

## What the two bundles contain

| Bundle | Part | Goes to | What it is |
|---|---|---|---|
| front-end | `npm/` | Nexus **npm-hosted** | every npm package the locked front-end stack needs, as the original registry tarballs |
| front-end | `raw/` | Nexus **raw-hosted** | Node.js, VS Code RPM + extensions, uv, Cypress binary, Playwright browsers, Prisma engine |
| front-end | `pypi/` | Nexus **pypi-hosted** | Python wheels (only if any were requested) |
| back-end | `maven/` | Nexus **maven-hosted** | every Java artifact and Gradle plugin the locked back-end build needs |
| back-end | `raw/` | Nexus **raw-hosted** | Temurin JDK, Gradle, Eclipse IDE, Helm, kubectl |
| back-end | `images/` | Nexus **docker-hosted** | container images (`IMAGES.lock` lists each tag with its digest) |
| both | `island/` | — | these scripts |

**Not in the bundles — from the RHEL 9 installation media / your RHEL repositories:** `python3.12 python3.12-pip python3.12-devel`, `podman` (+ `podman-docker` if you want the `docker` command), `skopeo`, `git`, `jq`, and the desktop libraries VS Code needs (dnf resolves those itself).

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
- **Testcontainers:** `~/.testcontainers.properties` sends Docker Hub images to your Nexus registry. On rootless Podman the reaper container (Ryuk) is disabled — containers left by a crashed test run need removing by hand (`podman ps -a`).
- **Eclipse:** Lombok's agent is added to `eclipse.ini`; without it Lombok code shows false errors.

### 5. Prove it — do not declare success before this passes

`prove-install.sh frontend` installs the **entire** locked front-end stack with a brand-new empty npm cache, so only Nexus can supply it, then checks the Angular CLI, TypeScript 6.0, Prisma's engine, Cypress, Playwright (launches headless Chromium) and uv. `prove-install.sh backend` rebuilds the bundled harvest project with an empty Gradle cache — Spring Boot context, Cucumber, Checkstyle, PMD, JaCoCo, Spotless — then pulls an image from your registry.

Expect `RESULT: N passed, 0 failed` and `GREEN`. Every `FAIL` line names what failed; the log path is printed.

| FAIL on | Most likely | Do |
|---|---|---|
| `npm ci ... from Nexus` with `404` / `ETARGET` | a package missing from Nexus — a failed upload | check `load-failures.txt`; record name + version |
| `npm ci` with `EINTEGRITY` | file damaged after verification | re-load that package |
| Playwright launch | missing system libraries | `dnf install nss atk at-spi2-atk cups-libs libdrm libxkbcommon libXcomposite libXdamage libXrandr mesa-libgbm pango alsa-lib` |
| harvest build: `Could not resolve` | an artifact missing from maven-hosted | record the full coordinate |
| harvest build: `Could not GET https://repo...` | the init script is missing | `install-backend-workstation.sh user` |

### 6. Write down what happened

Date, machine, `cat /etc/redhat-release`; Nexus version; the load summary lines; the `prove-install.sh` RESULT lines; every deviation from this page and why; anything outstanding. A deviation nobody wrote down is what breaks the second installation.

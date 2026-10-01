---
schema: corpus-doc/v1
status: exploratory
title: desert-island-devenv — build the air-gapped workstation bundles (front-end and back-end)
areas: [dev-environment, isolated-network, technology-stack]
related: ["docs/design/packets/desert-island-devenv-01-design-packet/README.md", "docs/design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v1.md", "legacy-shells/README.md"]
updated: 2026-10-01
---

# desert-island-devenv

**Created:** 2026-10-01 (Axium) | **Status:** `exploratory` — tooling, rehearsed end to end (see the packet). Lives outside the product space (`apps/` / `packages/` / `services/`, ADR-006) for the same reason `legacy-shells/` does: it builds supply-chain media, not RR software.

Packet, decisions and evidence: [`docs/design/packets/desert-island-devenv-01-design-packet/`](../docs/design/packets/desert-island-devenv-01-design-packet/README.md).


**Step-by-step for every bundle script (dev environment and the Angular upgrade ladder):** [`docs/context/operations/user-workflow/bundling_scripts_guide_v1.md`](../docs/context/operations/user-workflow/bundling_scripts_guide_v1.md). **The stack list for DevOps:** [`devops_tech_stack_list_v2.md`](../docs/design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v2.md).

## Build the bundles (internet-connected Linux x64 machine)

```bash
desert-island-devenv/tools/build-frontend-bundle.sh <workdir>     # ~1.3 GB tar
desert-island-devenv/tools/build-backend-bundle.sh  <workdir>     # ~4.2 GB tar (needs docker or podman for images; ~20 GB free disk)
```

Each prints what it fetched, verifies every download against its publisher's checksum (npm tarballs against the lockfile's sha512), and writes `<workdir>/devenv-{frontend,backend}-bundle-<date>.tar`. Re-runs reuse the download cache in `<workdir>/.cache`; the output itself is assembled fresh every run, so nothing from an older pin set can ride along. Prerequisites, options and failure behaviour are in each script's header.

Useful options: `--skip-browsers` / `--skip-vscode` (front-end), `--skip-images` / `--skip-eclipse` / `--keep-gradle-home` (back-end), `--relock` (front-end, regenerates the lockfile). If Docker Hub rate-limits the staging machine, `docker login` or set `DOCKERHUB_MIRROR=mirror.gcr.io`.

## Change a pin

| To change | Edit | Then |
|---|---|---|
| an npm package | `stack/frontend/package.json` (locked with **pnpm**, ADR-008) | `build-frontend-bundle.sh <wd> --relock`, commit the regenerated `pnpm-lock.yaml`, run `pnpm audit` |
| pnpm itself | `stack/package-managers/package.json` (+ `packageManager` in the example) | `--relock`, commit `package-managers/package-lock.json` |
| Node, VS Code, uv, browsers, Prisma target | `stack/workstation.env` | rebuild |
| a VS Code extension | `stack/vscode-extensions.txt` (keep dependency order) | rebuild |
| a Java library / Gradle plugin | `stack/backend/gradle/libs.versions.toml` (+ `build.gradle.kts` if new) | rebuild — the harvest build must pass |
| JDK, Gradle, Eclipse, Docker CE RPMs, kubectl, Helm (3 + 4), kind | `stack/backend.env` (+ `images.txt` for the kind node image) | rebuild |
| a container image | `stack/images.txt` | rebuild |
| a Python package | `stack/python/requirements.txt` | rebuild |

Cypress, Playwright and the Prisma engine have **no separate pin**: their versions are read from the lockfile so the binaries always match the npm packages.

## Layout

```
stack/      the pins (the only files to edit)
tools/      build-frontend-bundle.sh, build-backend-bundle.sh   (connected side)
island/     travels inside both bundles: README (the island runbook), nexus-create-repos.sh,
            load-nexus.sh, install-{frontend,backend}-workstation.sh, prove-install.sh, templates/
```

The front-end build reuses `legacy-shells/tools/lock-union.mjs` and `fetch-tarballs.mjs` — the same, already-proven supply-chain mechanism as the legacy Angular upgrade bundles.

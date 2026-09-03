---
schema: corpus-doc/v1
status: exploratory
title: Offline Verification Transcript v2 — the 17→19 pool proven with zero internet
areas: [isolated-network, dev-environment, risk-gates]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/v17_to_v19_bundle_manifest_v2.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/monorepo_hop_procedure_v2.md"]
updated: 2026-09-03
---

# Offline Verification Transcript v2

**Created:** 2026-09-03 | Linux x64, Node v22.22.2, npm 10.9.7, Verdaccio 6.10.0. Verifies the **17→19 master pool** (1,495 tarballs / 191.3 MB) end to end.

## Isolation model

Same as v1: every offline step ran inside a loopback-only network namespace (`unshare -n`) with Verdaccio inside it — env-var "offline" is not trusted (this container reaches the internet even with proxies unset; the negative control proved it). Every phase opens with `curl https://registry.npmjs.org` failing (exit 6, no route).

## Seeding + seal

Fresh empty Verdaccio storage, `uplinks: {}`; all **1,495** tarballs published via the npm-publish loop (`--provenance=false`; `max_body_size` raised — same two gotchas as v1); then every tarball re-downloaded from the seeded registry and sha256-compared to the manifest: **1,495/1,495 byte-identical, 0 failures**.

## A false green caught, and what it teaches

The first replay of this round reported all phases green — and was **invalid**: exit codes were read after a pipe (capturing `tail`'s status, always 0), and the in-tree git commits `ng update` requires had silently failed (this dev environment signs commits through a localhost service that does not exist inside the network namespace), so `ng update` refused the unclean tree and never ran. The tell was a jest failure in a tree that should have been green — root still v17, client nested v19. Every phase below was **re-run with directly captured exit codes and commit verification** (`git -c commit.gpgsign=false`). Recorded because the lesson is general: *a verification transcript is only as good as its exit-code discipline*, and on the island a hop log should quote real command exits, not pipeline tails.

## Phases (all inside the netns, fresh npm cache, registry = 127.0.0.1:4873)

| Phase | Steps | Result |
|---|---|---|
| A — v17 baselines | `npm ci` + `ng build` + `jest`, both apps, from the committed v17 locks | ✅ ci 0/0 · build 0/0 · jest 3/3 + 3/3 |
| B — 17→18 hop replay (app-01) | line-drop, temp root angular.json, `ng update core@18 cli@18` (13 rewrites, temp CLI 18.2.21 served offline), `ng update` third parties (6 rewrites) | ✅ both exit 0; root package.json at `^18.2.14` |
| C — v18 finalize + 18→19 | hand-bumps, lock regen `npm install`, build, **jest 3/3**; then jpa 14.6.2 pre-step, temp file, `ng update core@19 cli@19` (12 rewrites), third parties (6 rewrites) | ✅ all exit 0; root at `^19.2.25`, `@ngrx/store 19.2.1` |
| D — v19 finalize + committed locks | hand-bumps, lock regen, build (budget warning present, as expected), jest, `npm ls`; then `npm ci`+build+jest of the committed v19 locks, both apps | ✅ install 0 · build 0 · jest 3/3 · peer-clean · ci/build/jest green both apps |

The fresh offline cache's tarball URLs were exclusively `http://127.0.0.1:4873` throughout. App-02's hops were not replayed offline (identical dependency surface — zero marginal tarballs at every rung); its committed v17/v19 locks were verified directly.

## Verdict

Every step of the island's Milestone-1 path — baseline reinstall, both hops end to end (temp-CLI fetches, both update phases, hand-bumps, full lock regenerations), builds, and the Jest test signal — completed against the pool-seeded registry with a physically severed network. Raw logs: session scratch `shellwork/logs2/`; the durable record is this transcript + the SHA manifest.

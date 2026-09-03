---
schema: corpus-doc/v1
status: superseded
superseded_by: "docs/design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v2.md"
title: Offline Verification Transcript v1 — the bundle proven with zero internet
areas: [isolated-network, dev-environment, risk-gates]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/v18_transfer_bundle_manifest_v1.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md"]
updated: 2026-09-03
---

# Offline Verification Transcript v1

> **Superseded 2026-09-03** by [`offline_verification_transcript_v2.md`](offline_verification_transcript_v2.md) — kept for its evidence trail (notably: the root-angular.json placement rehearsal and the first offline verification). The v2 transcript reflects the REAL app layout (angular.json in packages/client/, confirmed by Graham) and the reconciled dependency set (puppeteer 21.9.0 et al.).

**Created:** 2026-09-03 | **Status:** `exploratory` — performed 2026-09-03, Linux x64, Node v22.22.2, npm 10.9.7, Verdaccio 6.10.0

A bundle handed over unverified is not ready to port. This is the verification: a local registry seeded **from the bundle itself**, and the whole journey replayed against it with a hard network barrier.

## The isolation model — and why env-vars were not trusted

First attempt at a "no internet" proof was unsetting the proxy variables; the negative control then **reached registry.npmjs.org anyway** (the container has direct egress). Every offline step below therefore ran inside a **Linux network namespace** (`unshare -n`) containing only a loopback interface — Verdaccio and the npm commands together inside it, physically no route out. Each phase opens with the negative control:

```
$ curl -sI --max-time 5 https://registry.npmjs.org/
→ exit 6 (could not resolve host)   OK: public registry unreachable
```

Additional seal: after all phases, the fresh npm cache used offline contained 1,311 tarballs whose source URLs were **exclusively `http://127.0.0.1:4873`**.

## Registry seeding (doubles as the Nexus upload-path rehearsal)

- Fresh Verdaccio 6.10.0: empty storage, **`uplinks: {}`** (no proxying possible), `packages: '**': {access: $all, publish: $all}`, fake auth token client-side.
- Seeded by `npm publish <tarball> --registry http://127.0.0.1:4873/ --access public` over all **1,311** tarballs. Two real-world gotchas surfaced and are recorded in the Nexus instructions: 9 packages carry `publishConfig.provenance` in their tarballs and need `--provenance=false`; `@stencil/core` (8.3 MB) exceeded Verdaccio's default 10 MB body limit (base64 inflation) and needed `max_body_size: 200mb`.
- Completeness sealed by re-downloading **every** tarball from the seeded registry and comparing sha256 against the manifest: `{"total":1311,"verified":1311,"badCount":0}`.

## Phase A — v17 baselines reproduce offline

Clean checkouts of the committed v17 shells, fresh empty npm cache, registry `127.0.0.1:4873`:

| App | `npm ci` | `ng build` |
|---|---|---|
| legacy-app-01 | ✅ `added 1203 packages in 27s` | ✅ `Application bundle generation complete.` |
| legacy-app-02 | ✅ `added 1204 packages in 22s` | ✅ complete |

Note: the committed locks' `resolved` URLs point at `registry.npmjs.org`; npm's default `--replace-registry-host=npmjs` transparently redirected them to the configured registry. **This is exactly the island situation** (locks generated against one registry, installed against Nexus) and it worked without touching the lock files.

## Phase B — the full 17→18 hop replays offline (app-01)

On the installed v17 tree, inside the namespace: the workspace-dep line drop (runbook delta Finding 2), then

```
npx ng update @angular/core@18 @angular/cli@18                → exit 0
npx ng update @angular/material@18 @angular/cdk@18 @ngrx/store@18 \
  @ngrx/effects@18 @ngrx/signals@18 @ngrx/operators@18        → exit 0 (concatLatestFrom migration: 1 file modified)
```

The temporary v18 CLI (`@angular/cli@18.2.21`) was fetched **from the seeded registry** (present in the offline cache from `127.0.0.1:4873`). Then the finalization: hand-bumps (keycloak-angular 16.1.0, client toolchain pins), `rm -rf node_modules package-lock.json`, and:

```
npm install   → added 1267 packages in 29s   (full offline re-resolution)
npx ng build  → complete
npx jest      → Tests: 3 passed, 3 total    (no browser present)
```

App-02's hop was **not** replayed offline (time-boxing; its dependency surface is byte-identical — 0 marginal tarballs both phases) — stated, not hidden.

## Phase C — committed v18 locks reproduce offline

Clean checkouts of the committed v18 end-state, both apps: `npm ci` ✅ and `ng build` ✅ for each.

## Verdict

Every step the island needs for this hop — baseline reinstall, `ng update` both phases including the temp-CLI fetch, hand-bumps, full lock regeneration, build, tests — completed against the bundle-seeded registry with a physically severed network. Raw logs: session scratch `shellwork/logs/` (offline-phase-a/b2/c/d, publish runs); not committed — the durable record is this transcript plus the SHA manifest.

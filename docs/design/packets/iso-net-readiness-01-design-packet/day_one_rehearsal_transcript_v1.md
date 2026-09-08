---
schema: corpus-doc/v1
status: exploratory
title: Day-One Rehearsal Transcript v1 — the runbook executed on a network-disabled machine (S-16)
areas: [isolated-network, dev-environment, risk-gates, technology-stack]
related: ["docs/design/packets/iso-net-readiness-01-design-packet/day_one_on_the_island_runbook_v0.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v2.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md", "docs/design/packets/iso-net-readiness-01-design-packet/decision_register_v0.md"]
updated: 2026-09-08
---

# Day-One Rehearsal Transcript v1 (S-16)

**Created:** 2026-09-08 | **Author:** Axium | **Status:** `exploratory` — the rehearsal happened and is recorded here; the corrected procedure it produced is [`day_one_on_the_island_runbook_v1.md`](day_one_on_the_island_runbook_v1.md).

**Outcome: the runbook as written could not be completed.** It failed hard at Step 2 and again at Step 3, and its own success test (Step 5d) turned out not to test what it claims. All four defects are fixed in v1, and the corrected procedure then ran green end to end with no internet.

> This is what S-16 was for. The runbook's own preamble said *"Expect the rehearsal to find errors in it. That is the point of the rehearsal."* It was right.

## Method

| | |
|---|---|
| Isolation | Linux network namespace (`unshare -n`), loopback only. No route to anything. |
| Negative control | `curl` to `registry.npmjs.org`, `nodejs.org` and `1.1.1.1` — **all failed** (rc 6/7/7), with the container's HTTPS proxy env both intact and cleared. `npm view typescript version` **hung and timed out** (rc 124) — the exact symptom the runbook warns about. |
| Exit-code discipline | Every step's `rc` captured directly, never through a pipe. This is the lesson from `offline_verification_transcript_v2.md`, where piped exit codes produced a false green. |
| Bundle | Assembled on the connected side: Node 24.20.0 LTS installer, 619 tarballs / 91.1 MB, `verdaccio-bundle/` (6.10.3), `hello-world-ng22/` (Angular 22.1, TS 6.0) with lock and **no** `node_modules`. Total 119 MB. |
| Starting state | A machine with Node **v22.22.2** already present — deliberately *below* Angular 22's floor of 22.22.3, so Step 1 was genuinely exercised. |

---

## Defect 1 — Step 2 cannot work as written. `npm ci --offline` fails `ENOTCACHED`.

The runbook says to install the package server with:

```
cd verdaccio-bundle
npm ci --offline
```

**Observed:**

```
npm error code ENOTCACHED
npm error request to https://registry.npmjs.org/xtend/-/xtend-4.0.2.tgz failed:
          cache mode is 'only-if-cached' but no cached response is available.
```

**Why.** `--offline` reads npm's **cache**, not the delivered `packages/` directory. A machine that has never seen these packages has an empty cache, so this fails 100% of the time. And it cannot be solved by pointing at the registry, because there is a **chicken-and-egg**: Verdaccio *is* the registry, and it is not running yet.

The runbook's own guidance here is also wrong. It says *"If it tries anyway, the bundle is incomplete and you should record that."* The bundle is not incomplete — the tarballs are right there in `packages/`. The instruction is simply reaching for the wrong mechanism.

**This is a hard stop at Step 2 of 6.** The island team could not have started the day.

**Fix (tested, works):** ship Verdaccio's npm cache in the bundle and install against it.

```
npm ci --offline --cache /path/to/delivered/verdaccio-cache     # rc=0, verdaccio 6.10.3 runs
```

### This closes DR-09 by necessity

[DR-09](decision_register_v0.md) asks whether to ship the npm cache alongside the registry seed, and was framed as belt-and-braces insurance. **It is not optional.** Without a shipped cache there is no way to bootstrap the package server on a machine with no internet. The cache for Verdaccio alone is 86 MB.

*(Shipping `verdaccio-bundle/node_modules` pre-installed is a viable alternative and avoids the cache entirely; it costs 62 MB and couples the bundle to the target platform and Node ABI. Not exercised in this run — the cache path was chosen and proven, and it generalizes to the fallback the runbook already documents.)*

---

## Defect 2 — Step 3's `npm adduser` does not behave as described, and every publish fails without it

The runbook says *"It will ask for a username, a password, and an email address."*

**Observed under npm 11.19.0:** it prompts for username and password only — **no email** — and the command returned `ENEEDAUTH`, leaving no credential behind. Consequence, on the first attempt:

```
published ok=0  conflict=0  FAILED=619  (of 619)
npm error code ENEEDAUTH
```

Relaxing the Verdaccio config to allow anonymous publish (`publish: $all`) **did not help** — the second attempt also failed 619/619. npm refuses to publish without a token *client-side*, before it ever contacts the server. This is not something server config can fix.

**Fix (tested, works):** create the user through the npm registry user API, which is scriptable and returns a token directly.

```bash
TOKEN=$(curl -sS -X PUT "http://localhost:4873/-/user/org.couchdb.user:rr-setup" \
  -H "Content-Type: application/json" \
  -d '{"name":"rr-setup","password":"<choose one>","email":"rr-setup@example.invalid","type":"user"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")

printf '//localhost:4873/:_authToken=%s\nregistry=http://localhost:4873/\n' "$TOKEN" > ~/.npmrc
npm whoami --registry http://localhost:4873      # -> rr-setup
```

Interactive `npm adduser` may still work for a human at a terminal. The API form is given in v1 because it can be scripted, verified, and re-run — and because on a day when nobody can be asked for help, a step that either works or prints a token is better than a step that might silently leave you unauthenticated.

---

## Defect 3 — the publish loop fails on 8 packages for three distinct npm-semantics reasons

With auth working, the loop still failed on **8 of 619**:

| Cause | Packages | npm's message |
|---|---|---|
| **Prerelease version** | `clipanion@4.0.0-rc.4`, `gensync@1.0.0-beta.2`, `@verdaccio/ui-theme@9.0.0-next-9.30` | `You must specify a tag using --tag when publishing a prerelease version.` |
| **Provenance** | `eventsource@3.0.7`, `@hono/node-server@2.1.1` | `EUSAGE: Automatic provenance generation not supported for provider: null` |
| **Lower version after a higher one** | `lru-cache@7.18.3` (11.5.2 already published) | `Cannot implicitly apply the "latest" tag because previously published version 11.5.2 is higher.` |

The provenance case is **already documented** in [`nexus_upload_instructions_v1.md`](../legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md), which instructs `--provenance=false` — but the day-one runbook's publish loop never picked it up. Two documents describing the same operation, one of which knew the answer. Worth noting as a cross-document hygiene lesson, not just a defect.

The other two causes are new: neither appeared in the legacy-estate bundle work, because that pool happened not to contain a prerelease or a version-ordering inversion.

**Fix (tested, 619/619 succeed):** pass `--provenance=false` always, and retry the tag-refusals under an explicit tag.

```bash
for f in *.tgz; do
  out=$(npm publish "$f" --registry http://localhost:4873 --provenance=false 2>&1) || {
    echo "$out" | grep -qiE "must specify a tag|implicitly apply" \
      && npm publish "$f" --registry http://localhost:4873 --provenance=false --tag offline-seed
  }
done
```

Six packages needed the retry. **Caveat worth stating:** packages published under `offline-seed` have no `latest` dist-tag, so `npm install <name>` with no version will not resolve them. This does not affect `npm ci`, which installs exact versions from the lockfile — and `npm ci` is the only install command this environment should use anyway.

---

## Defect 4 — Step 5d does not test what the runbook says it tests

This is the most consequential finding, because it is the step the runbook calls *"the moment the day is judged on."*

**What happened.** On the run where **zero** packages had published successfully — a completely empty registry — steps 5a, 5b and 5d all returned **rc=0**:

```
STEP 3  published ok=0  FAILED=619
STEP 5a npm ci             rc=0     <-- against an EMPTY registry
STEP 5b build              rc=0
STEP 5d npm ci --offline   rc=0     <-- "the proof"
```

Everything came from npm's **local cache**, warmed as a side effect of the publish attempts. A team following the runbook exactly would have seen 619 publish failures, then a passing 5d, and had no way to tell from the document which one to believe.

Worse, `npm ci --offline` **reads the cache and bypasses the registry entirely**. It cannot, even in principle, prove the registry was seeded correctly. A warm cache plus an empty Verdaccio passes 5d. The next machine — or the next project on the same machine — then fails.

**Fix:** wipe the cache immediately before the proof, so the install has nowhere to come from except the server.

```
npm cache clean --force
find ~/.npm/_cacache -type f | wc -l      # must print 0
npm ci                                     # must now come from the registry
```

Re-run with the cache verified empty, the truth appeared:

```
cache files after clean: 0
5a npm ci        rc=1    npm error 404 tarball, folder, http url, or git url.
5b build         rc=127  sh: 1: ng: not found
5d npm ci --offline rc=1 ENOTCACHED
```

— the honest result of a registry missing 8 packages. v1 reorders Step 5 so the cache wipe comes first and 5d becomes a genuine second check rather than the primary one.

---

## The corrected procedure, run end to end

With all four fixes applied, in one namespace with no egress:

| Step | Result |
|---|---|
| Negative control | all egress blocked; `npm view` hangs |
| Step 1 — Node from the delivered tarball | v22.22.2 → **v24.20.0**, npm 11.19.0 · rc=0 |
| Step 2 — Verdaccio via `npm ci --offline --cache` | rc=0; server up in **2s** |
| Step 3 — user via the npm user API | token obtained, `npm whoami` → `rr-setup` |
| Step 3b — publish loop | **ok=619, failed=0** (6 needed `--tag offline-seed`) |
| Step 5 — cache wiped | `_cacache` file count **0** |
| 5a — `npm ci` | **rc=0** — genuinely from the registry |
| 5b — `npm run build` | **rc=0** — `Application bundle generation complete.` |
| 5c — `npm test` | **rc=0** — Vitest 4.1.11, 1 file, **2 tests passed** |
| 5d — `rm -rf node_modules && npm ci --offline` | **rc=0** |

**Green.**

---

## Smaller corrections folded into v1

- **`npm test` on Angular 22 is Vitest, not Karma.** An early attempt passing the Karma-era `--browsers=ChromeHeadless` failed with *"The 'browsers' option requires either `@vitest/browser-playwright`, `@vitest/browser-webdriverio`, or `@vitest/browser-preview` to be installed."* Plain `npm test` is correct and needs no browser — consistent with the legacy estate, which also tests headless.
- **Wait for the server.** Verdaccio takes ~2 s to bind. `curl` immediately after starting it returns `Connection refused`; the runbook shows the check without a wait. v1 polls.
- **Verdaccio warns when run as root** (`Verdaccio doesn't need superuser privileges`). Harmless, but alarming if unexpected on a locked-down box.
- **`max_body_size` belongs in the minimal config.** Not hit in this run, but `@stencil/core` (8.3 MB) hit a payload limit during the legacy-bundle seeding. Cheap insurance; v1's config includes `max_body_size: 100mb`.
- **Version drift, as the runbook predicted.** It names Node 24.19.0; current LTS is **24.20.0**. It estimates ~507 archives; this bundle needed **619** (an `ng new` app plus Verdaccio's own tree). Both figures are stack- and date-specific — re-derive, do not copy.
- **The `.tgz` count is not the package count.** `ls packages/*.tgz | wc -l` returned 619 while Verdaccio's storage held 457 directories, because scoped packages nest one level deeper. The runbook's "count what landed" check compares the wrong two numbers. v1 counts publish successes instead.

## Honest limits of this rehearsal

- **Desert Island's stack, not Legacy Island's.** This exercised a fresh Angular 22 app, which is what the runbook is written for. It says nothing new about the legacy v17 estate — that is `first-app-hop-01`'s job.
- **Verdaccio, not Nexus.** Legacy Island runs Nexus. Everything here about starting and seeding a *Verdaccio* server is `[UNVERIFIED]` against Nexus, though the publish-loop defects (provenance, prerelease tags, version ordering) are **npm-client** behaviours and will reproduce against any registry.
- **`ng new` scaffolding, not real code.** 619 tarballs; a real application will need more.
- **One machine, one user, root.** Multi-machine access, boot persistence and non-root operation were not exercised and remain open.
- The delivered Node was a `.tar.xz` extracted in place. A real RHEL 9 change process may require an RPM and approvals — untested here, and still the hard gate the runbook names (questionnaire B3).

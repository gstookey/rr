---
schema: corpus-doc/v1
status: exploratory
title: Day One on the Island — Runbook v1 (rehearsed 2026-09-08)
areas: [isolated-network, dev-environment, technology-stack]
related: ["docs/design/packets/iso-net-readiness-01-design-packet/day_one_rehearsal_transcript_v1.md", "docs/design/packets/iso-net-readiness-01-design-packet/day_one_on_the_island_runbook_v0.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md", "docs/context/canonical/isolated_network_constraints.md"]
updated: 2026-09-08
---

# Day One on the Island — Runbook v1

**Created:** 2026-09-08 | **Status:** `exploratory` — **REHEARSED end to end on a network-disabled machine, 2026-09-08.** Supersedes [`day_one_on_the_island_runbook_v0.md`](day_one_on_the_island_runbook_v0.md), which was never executed and **could not be completed as written** — it failed at Step 2 and again at Step 3, and its success test did not test what it claimed. Every fix below was observed working with no internet: [`day_one_rehearsal_transcript_v1.md`](day_one_rehearsal_transcript_v1.md).

> **What is proven and what is not.** The whole sequence ran green in a loopback-only network namespace against a bundle assembled the same day. It was rehearsed with **Verdaccio** on a **fresh Angular 22 app**. If your island already runs **Nexus**, Steps 2–4 change shape (see Step 0) — but the publish-loop flags in Step 3 are **npm-client** behaviour and apply to any registry.
>
> Version numbers here are dated **2026-09-08** and will drift. Re-derive from the manifest that ships with your bundle; do not copy these.

## Who this is for

A person on the isolated network with **no AI assistant, no internet, and no way to ask a quick question of anyone outside**. Everything needed is in this document and the delivered bundle.

Where a step can fail, the failure and its recovery are beside it. If what you see does not match what is written, **stop and record exactly what you saw** rather than improvising. Someone outside will troubleshoot from your description alone, and that description is all they will have.

## What you should have before starting

| Item | What it is | Rehearsed as |
|---|---|---|
| Node.js installer | the runtime | `node-v24.20.0-linux-x64.tar.xz` (Node 24 LTS) |
| `packages/` | the `.tgz` archives the software is built from | 619 files, 91 MB |
| `verdaccio-bundle/` | the package-server software: `package.json` + `package-lock.json` | verdaccio 6.10.3 |
| **`verdaccio-cache/`** | **npm cache for the above — REQUIRED, see Step 2** | 86 MB |
| `hello-world-ng22/` | throwaway app used only to prove the setup works — source + lockfile, **no `node_modules`** | Angular 22.1 / TS 6.0 |
| A manifest | the authoritative version list | — |

**If `verdaccio-cache/` is missing, stop here and request it.** Without it there is no way to install the package server offline. This is the defect that stopped the v0 rehearsal dead. *(An equally valid alternative is a pre-installed `verdaccio-bundle/node_modules`; if your bundle has that instead, skip the `--cache` flag in Step 2.)*

## The shape of the day

```
Step 0  Find out what is already here          (do not skip)
Step 1  Get Node to a workable version
Step 2  Stand up a package server
Step 3  Load the delivered packages into it
Step 4  Point npm at it
Step 5  Prove it works, offline, with a real build
Step 6  Write down what actually happened
```

Budget half a day. Step 0 can change everything that follows.

---

# Step 0 — Find out what is already here

**Before installing anything.** Half the work below may already be done.

```
node --version
npm --version
npm config get registry
cat ~/.npmrc                  # and .npmrc in any existing application repo
```

| What you see | What it means |
|---|---|
| `npm config get registry` returns something other than `https://registry.npmjs.org/` | **A package server already exists.** The good outcome. **Skip Steps 2 and 4.** Go to Step 3 and load the packages into *that* server — but talk to whoever administers it first. Uploading several hundred packages into a shared server is their decision. |
| It returns `https://registry.npmjs.org/` | Nothing internal is configured for your user. A server may still exist that nobody pointed you at — ask before building a second one. |
| `node --version` prints `v24.15.0`+, **or** `v22.22.3`+ within 22.x, **or** `v26.x` | Node is usable. **Skip Step 1.** |
| Anything older, or `command not found` | Step 1. |

**Record all four answers.** They are the first thing anyone troubleshooting will ask for.

---

# Step 1 — Get Node to a workable version

Skip if Step 0 showed Node already in range.

**The requirement, exactly:** Angular 22 declares `^22.22.3 || ^24.15.0 || >=26.0.0`. Read as: within 22.x, 22.22.3 or newer; within 24.x, 24.15.0 or newer; or any 26+. **One patch too low is out of range** — the tooling checks, this is not a soft warning.

> Rehearsed from `v22.22.2`, which is one patch below the floor. It is a realistic starting point and it does not work.

Install from the delivered installer using whatever your change process requires for this machine. **Do not download anything.**

```
node --version      # expect v24.20.0 or later in a supported line
npm --version       # expect 11.x; any modern npm is fine — write down what it says
```

**If installation is blocked** — no permission, change control not approved, machine locked down — **stop and record it.** This is a hard gate for everything downstream and is the answer to questionnaire item B3.

---

# Step 2 — Stand up a package server

Skip if Step 0 found an existing one.

## Install it — the `--cache` flag is not optional

```
cd verdaccio-bundle
npm ci --offline --cache /full/path/to/delivered/verdaccio-cache
```

> **Why this differs from v0.** v0 said `npm ci --offline` with no cache. That **always fails** with `ENOTCACHED`, because `--offline` reads npm's cache — not the delivered `packages/` directory — and a fresh machine's cache is empty. It cannot be solved by pointing at the registry either: Verdaccio *is* the registry and is not running yet. Shipping its cache is the way out.

**If you see `ENOTCACHED`:** the cache path is wrong or the cache was not delivered. Use an absolute path. If the cache genuinely is not in the bundle, **stop and record it** — this is a bundle defect and there is no workaround on your side.

## Configure it — no uplinks

Write this config (Verdaccio will otherwise try to forward requests to an internet that does not exist here, and the symptom is a **hang**, not a clean error):

```yaml
storage: ./storage
auth:
  htpasswd:
    file: ./htpasswd
    max_users: 100
packages:
  '@*/*': { access: $all, publish: $authenticated, unpublish: $authenticated }
  '**':   { access: $all, publish: $authenticated, unpublish: $authenticated }
listen: 0.0.0.0:4873
max_body_size: 100mb
log: { type: file, path: verdaccio-run.log, level: warn }
```

No `uplinks:` block and no `proxy:` lines. That is intentional — this server is the whole world. `max_body_size` matters: an 8 MB package hit a payload limit during earlier seeding work.

## Start it, and wait

```
./node_modules/.bin/verdaccio -c /path/to/config.yaml
```

Leave it running; open a second terminal. **It takes a couple of seconds to bind — do not curl immediately.**

```
for i in $(seq 1 40); do curl -sS -o /dev/null http://localhost:4873/ && break; sleep 1; done
curl -sS -o /dev/null http://localhost:4873/ ; echo "rc=$?"      # expect rc=0
```

Expect a warning that Verdaccio does not need superuser privileges if you are root. Harmless.

`Connection refused` after the wait loop means it did not start — read the first window and record the reason verbatim.

**Note for later:** running it by hand is fine today. Making it start on boot is a real task for another day. Write it down as outstanding.

---

# Step 3 — Load the delivered packages into the server

## Create a user — use the API, not `npm adduser`

```bash
TOKEN=$(curl -sS -X PUT "http://localhost:4873/-/user/org.couchdb.user:rr-setup" \
  -H "Content-Type: application/json" \
  -d '{"name":"rr-setup","password":"<choose one>","email":"rr-setup@example.invalid","type":"user"}' \
  | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")

printf '//localhost:4873/:_authToken=%s\nregistry=http://localhost:4873/\n' "$TOKEN" > ~/.npmrc
npm whoami --registry http://localhost:4873          # must print rr-setup
```

> **Why this differs from v0.** v0 said to run `npm adduser` and that it would ask for username, password and email. Under npm 11 it asks for **no email**, and in the rehearsal it returned `ENEEDAUTH` leaving no credential — after which **all 619 publishes failed**. Loosening the server config to allow anonymous publish did **not** help: npm refuses to publish without a token *client-side*, before contacting the server.

**Anything works for the password** — this is a local server with no connection to any real account system. **Write down what you chose**; the next person needs it.

If `npm whoami` does not print your username, **stop**. Every publish below will fail and the failure message will not obviously say why.

## Upload the archives

```bash
cd packages
ok=0; fail=0
for f in *.tgz; do
  out=$(npm publish "$f" --registry http://localhost:4873 --provenance=false 2>&1) || {
    if echo "$out" | grep -qiE "must specify a tag|implicitly apply"; then
      out=$(npm publish "$f" --registry http://localhost:4873 --provenance=false --tag offline-seed 2>&1)
    fi
  }
  if [ $? -eq 0 ]; then ok=$((ok+1)); else fail=$((fail+1)); echo "FAILED: $f" >> publish-failures.txt; fi
done
echo "published ok=$ok  failed=$fail"
```

**The two flags are both load-bearing.** In the rehearsal, the plain loop failed on 8 of 619 for three separate reasons — provenance (2), prerelease versions needing an explicit tag (3), and a lower version published after a higher one (1). With `--provenance=false` plus the tag retry: **619 of 619.** Six needed the retry.

| Message | Meaning | Do |
|---|---|---|
| `+ name@1.2.3` | success | nothing |
| `EPUBLISHCONFLICT` / already present | uploaded twice | harmless |
| `ENEEDAUTH` | no token | back to the user step; do not continue |
| `ECONNREFUSED` | server stopped | check the first window |
| `413` / payload too large | body limit | raise `max_body_size` |
| anything else | unexpected | **record package name and full message** |

**Check the count of successful publishes, not the file count.** `ls *.tgz | wc -l` and the number of directories in Verdaccio's storage will *not* match — scoped packages nest a level deeper (619 tarballs produced 457 storage directories). Trust `ok=`.

**Caveat on `offline-seed`:** packages published under that tag have no `latest` dist-tag, so `npm install <name>` with no version will not resolve them. This does not affect `npm ci`, which installs exact versions from the lockfile — and `npm ci` is the only install command this environment should use.

---

# Step 4 — Point npm at the server

```
npm config set registry http://localhost:4873
npm config get registry        # expect http://localhost:4873/
```

For other machines, substitute this machine's hostname and make port 4873 reachable — a networking question for whoever owns the network, not a day-one task.

---

# Step 5 — Prove it works, offline, with a real build

**Do not declare success before this step passes.**

## 5a. Wipe the npm cache FIRST — this is what makes the rest of Step 5 mean anything

```
npm cache clean --force
find ~/.npm/_cacache -type f | wc -l          # MUST print 0
```

> **Why this is first, and why v0 was wrong.** In the rehearsal, on a run where **zero packages had published successfully into a completely empty registry**, `npm ci`, `npm run build` *and* v0's final proof `npm ci --offline` all returned **rc=0**. Everything came from npm's local cache, warmed as a side effect of the failed publish attempts. `npm ci --offline` **reads the cache and bypasses the registry entirely** — it cannot, even in principle, prove the server was seeded. A warm cache over an empty Verdaccio passes it. The next machine then fails.
>
> With the cache verified empty, the same run told the truth immediately: `npm ci` → `404`, build → `ng: not found`.

If that count is not 0, do not continue — you will be testing the cache, not the server.

## 5b. Install

```
cd hello-world-ng22
npm ci
```

`npm ci` installs exactly the lockfile's versions and fails loudly rather than substituting. It is the only install command that should be used here.

| Error | Meaning | Do |
|---|---|---|
| `404 Not Found - GET .../<package>` | not in the bundle, or its publish failed | **Record the exact name and version.** The single most important thing to send out. A bundle defect — not something to work around. |
| `ETARGET` / no matching version | right package, wrong version | record both; also a bundle defect |
| `EINTEGRITY` | archive does not match its checksum | corrupted in transfer; request re-delivery of that file |
| hangs, no output | the server is still trying to reach the internet | back to Step 2, confirm no uplinks |
| `ECONNREFUSED` | server stopped | check the first window |

**Do not** "fix" a 404 by changing a version, and **do not** point the registry back at the internet. Both produce a build that works today and cannot be reproduced tomorrow — worse than a clean failure.

## 5c. Build

```
npm run build
```

Expect `Application bundle generation complete.` and a `dist/` directory.

**If you see a TypeScript version error:** Angular 22 requires TypeScript **6.0.x specifically** (`>=6.0 <6.1`), while the current public release of TypeScript is 7.x. If the bundle was assembled by taking "the latest of everything," TS 7 is in it and the build **cannot** work. The fix is not on your side: the correct package is `typescript@6.0.x` and it must be delivered. Record the error and `npx tsc --version`.

## 5d. Test

```
npm test
```

**Angular 22 tests with Vitest, not Karma.** Plain `npm test` is correct and needs **no browser**. Expect something like `Test Files 1 passed (1) / Tests 2 passed (2)`.

Do **not** add Karma-era flags. `--browsers=ChromeHeadless` fails with *"The 'browsers' option requires either `@vitest/browser-playwright`, `@vitest/browser-webdriverio`, or `@vitest/browser-preview` to be installed"* — a confusing error that looks like a missing bundle package but is not.

## 5e. The second check — cache-only install

```
rm -rf node_modules
npm ci --offline
```

This confirms the cache is *also* self-sufficient. It is a useful second signal — but **5a is what makes 5b trustworthy**, not this. Passing 5e while 5b was never run against an empty cache proves nothing.

---

# Step 6 — Write down what actually happened

Someone outside will support this with **no access to it**. What you write is all they get.

1. Date, machine, OS and version.
2. `node --version` and `npm --version` — actual output.
3. Whether a package server already existed, or the one you installed: version, address, port, config file path.
4. The username you created and where the password is kept.
5. **The count of successful publishes** and the exact name and version of every failure.
6. Whether 5a–5e passed, individually — **and confirm the cache-file count was 0 before 5b.**
7. Every deviation from this document, and why. A deviation nobody wrote down is what breaks the second installation.
8. Everything outstanding — boot persistence, other machines, anything skipped.

Mark the outcome:

- **Green** — cache was verified empty, 5b–5d passed. Reproducible offline. Proceed.
- **Amber** — passed only with a warm cache, or packages were missing and worked around. Usable today, not reproducible. Record precisely what is missing.
- **Red** — the build does not work. Record exact error text and stop. A repair nobody understands is harder to undo than a failure.

---

# Appendix — Quick reference

| Task | Command |
|---|---|
| Check Node | `node --version` (need `24.15.0+`, or `22.22.3+` in 22.x, or `26+`) |
| Which registry npm uses | `npm config get registry` |
| Install the server offline | `npm ci --offline --cache <delivered-cache>` |
| Start the server | `./node_modules/.bin/verdaccio -c <config.yaml>` |
| Get a token | `curl -X PUT .../-/user/org.couchdb.user:<name> -d '{...}'` |
| Confirm you are logged in | `npm whoami --registry http://localhost:4873` |
| Publish one archive | `npm publish <file>.tgz --registry http://localhost:4873 --provenance=false` |
| Point npm at it | `npm config set registry http://localhost:4873` |
| **Empty the cache before proving** | `npm cache clean --force && find ~/.npm/_cacache -type f \| wc -l` |
| Install a project exactly | `npm ci` |
| Cache-only install | `npm ci --offline` |
| TypeScript version | `npx tsc --version` |

## Fallback if the package server cannot be installed

If Step 2 is blocked — no permission to run a server, port blocked, change control refuses — npm can install directly from a delivered cache:

```
npm ci --offline --cache <path-to-delivered-cache-directory>
```

This works for installing and keeps a blocked day productive. It is **not** a substitute for a package server: it serves no other machine, does not support the legacy applications' installs, and gets unwieldy across projects.

**This fallback is now doubly relevant:** the cache has to ship anyway for Step 2 (see DR-09, closed by necessity in the rehearsal), so the contingency comes almost free.

---
schema: corpus-doc/v1
status: exploratory
title: Day One on the Island — Runbook v0 (draft, unrehearsed)
areas: [isolated-network, dev-environment, technology-stack]
related: ["docs/context/canonical/isolated_network_constraints.md", "docs/design/packets/iso-net-readiness-01-design-packet/stack_dependency_manifest_v0.md", "docs/design/packets/iso-net-readiness-01-design-packet/README.md"]
updated: 2026-08-25
---

# Day One on the Island — Runbook v0

**Created:** 2026-08-25 | **Last updated:** 2026-08-25 | **Status:** `exploratory` — **DRAFT, NOT REHEARSED**

> ## Read this before using this document
>
> **This procedure has not been executed end to end by anyone.** It was written from verified package facts (see [`stack_dependency_manifest_v0.md`](stack_dependency_manifest_v0.md)) and standard practice, but the sequence below has never been run start to finish on a disconnected machine.
>
> **It must be rehearsed on a network-disabled machine on the open-internet side before anyone relies on it on the island.** That rehearsal is proposed as its own piece of work (see [`story_decomposition_v0.md`](story_decomposition_v0.md), S-04) and is the step that turns this draft into something trustworthy. Expect the rehearsal to find errors in it. That is the point of the rehearsal.
>
> Every version number below is dated 2026-08-25 and will drift. Re-verify against the manifest before use.

## Who this is for

A person on the isolated network with **no access to any AI assistant, no internet, and no ability to ask a quick question of anyone outside**. Everything needed is in this document and in the delivered bundle.

Where a step can fail, the failure and its recovery are written down beside it. Where output should be checked, the expected output is shown. If what you see does not match what is written, **stop and record exactly what you saw** rather than improvising — someone outside will be troubleshooting from your description alone, and the description is all they will get.

## What you should have before starting

From the delivered bundle:

| Item | What it is |
|---|---|
| Node.js installer for this machine's OS | version **24.19.0** (or as revised in the manifest) |
| `packages/` — a directory of `.tgz` files | the ~507 package archives the software is built from |
| `verdaccio-bundle/` | the package-server software and its own dependencies |
| `hello-world-ng22/` | a tiny throwaway application used only to prove the setup works |
| A printed or on-screen copy of the dependency manifest | the authoritative version list |

If any of these is missing, **stop here** and record which one. Continuing without the full set produces a half-configured system that is harder to diagnose than an unstarted one.

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

Budget roughly half a day if things go well. Step 0 can change everything that follows.

---

# Step 0 — Find out what is already here

**Do this before installing anything.** Half of the work below may already be done.

```
node --version
npm --version
```

**Then find out whether a package server already exists on this network.** Ask, or look for a URL in an existing application's `.npmrc` file:

```
cat .npmrc                    # in the root of any existing application repo
cat ~/.npmrc                  # the per-user config
npm config get registry
```

**Interpret what you find:**

| What you see | What it means |
|---|---|
| `npm config get registry` returns something other than `https://registry.npmjs.org/` | **A package server already exists on this network.** This is the good outcome. Skip Steps 2 and 4. Go to Step 3 and load the delivered packages into *that* server instead of a new one — but talk to whoever administers it first; uploading several hundred packages into someone else's shared server is their decision, not yours. |
| It returns `https://registry.npmjs.org/` | Nothing internal is configured for your user. There may still be a server nobody pointed you at — ask before building a second one. |
| `node --version` prints `v24.15.0` or newer, **or** `v22.22.3` or newer within 22.x, **or** `v26.x` | Node is already usable. Skip Step 1. |
| `node --version` prints anything older | Node must be upgraded — Step 1. |
| `node: command not found` | Node is not installed — Step 1. |

**Record all four answers before continuing.** They are the first thing anyone troubleshooting will ask for.

---

# Step 1 — Get Node to a workable version

Skip if Step 0 showed a Node already in range.

**The requirement, exactly:** Angular 22 declares it needs Node `^22.22.3 || ^24.15.0 || >=26.0.0`. Read that as: *within the 22 line, 22.22.3 or newer; within the 24 line, 24.15.0 or newer; or any 26 or later.* A Node that is one patch version too low is out of range — this is not a soft warning you can ignore, the build tooling checks it.

**Recommended:** Node **24.19.0**, the current long-term-support release.

Install from the delivered installer using whatever method your organization's change process requires for this machine's operating system. Do not download anything.

**Verify:**

```
node --version
```

Expected — exactly this, or a later version in a supported line:

```
v24.19.0
```

```
npm --version
```

Expected: a version number, `8.0.0` or higher. Any modern npm is fine. Write down what it says.

**If installation is blocked** — no permission, change-control not approved, machine locked down — **stop and record it**. This is a hard gate for everything downstream, and it is the answer to questionnaire item B3. Nothing further in this runbook will work without it.

---

# Step 2 — Stand up a package server

Skip if Step 0 found an existing one.

## What a package server is, and why you need one

When the software is built, its tooling asks a server for several hundred small library archives by name and version. On the open internet that server is `registry.npmjs.org`. Here, there is no internet, so a server has to exist on this machine (or somewhere on this network) holding the archives that came in the bundle.

**Verdaccio** is the software we are proposing for this: a small package server that runs on Node — the same Node you just installed, no second runtime needed. *(This is a recommendation, not a decision. If your organization already runs Nexus or Artifactory, that is a better answer than adding another server; see Step 0.)*

## Install it

From the delivered `verdaccio-bundle/`, install without contacting any network:

```
cd verdaccio-bundle
npm ci --offline
```

The `--offline` flag matters: it tells npm never to reach out. If it tries anyway, the bundle is incomplete and you should record that rather than working around it.

## Turn off its internet connection

**This is the step most likely to be forgotten and it will cause confusing failures later.** By default Verdaccio tries to forward requests it cannot answer to the public internet, which does not exist here. Requests will hang rather than fail cleanly, and the symptom looks like a slow network rather than a misconfiguration.

Find the configuration file (Verdaccio prints its location when it starts — typically `~/.config/verdaccio/config.yaml`), and:

1. **Remove or empty the `uplinks:` section**, and
2. **remove every `proxy:` line** from the `packages:` section.

A minimal configuration with no upstream looks like this:

```yaml
storage: ./storage

auth:
  htpasswd:
    file: ./htpasswd

packages:
  '@*/*':
    access: $all
    publish: $authenticated
  '**':
    access: $all
    publish: $authenticated

listen: 0.0.0.0:4873
```

Note there is no `uplinks:` block and no `proxy:` line. That is intentional: this server is the whole world.

## Start it

```
npx verdaccio
```

Expected output, roughly:

```
warn --- config file  - /home/<you>/.config/verdaccio/config.yaml
warn --- http address - http://0.0.0.0:4873/ - verdaccio/6.10.0
```

Leave it running in that window. Open a second terminal for everything that follows.

**Check it is alive** from the second terminal:

```
curl http://localhost:4873/
```

Expected: a page of HTML. If you get `Connection refused`, the server did not start — look at the first window for the reason and record it verbatim.

**Note for later:** running this by hand in a terminal is fine for today. Making it start automatically on boot is a real task for a later day, not a day-one concern. Write down that it is outstanding.

---

# Step 3 — Load the delivered packages into the server

The server is running but empty. It has to be given the archives.

## Create a user

The server requires a login before it accepts uploads:

```
npm adduser --registry http://localhost:4873
```

It will ask for a username, a password, and an email address. **Anything works** — this is a local server with no connection to any real account system. Use something the team will recognize (`rr-setup`, a project mailbox address). **Write down what you chose**; the next person will need it.

## Upload the archives

Every `.tgz` file in the delivered `packages/` directory gets uploaded. Order does not matter.

**On Linux or macOS:**

```
cd packages
for f in *.tgz; do
  echo "publishing $f"
  npm publish "$f" --registry http://localhost:4873 || echo "FAILED: $f"
done
```

**On Windows PowerShell:**

```powershell
cd packages
Get-ChildItem *.tgz | ForEach-Object {
  Write-Host "publishing $($_.Name)"
  npm publish $_.FullName --registry http://localhost:4873
}
```

This takes a while — several hundred small uploads. Expect a line per package.

**What to watch for:**

| Message | Meaning | What to do |
|---|---|---|
| `+ package-name@1.2.3` | success | nothing |
| `EPUBLISHCONFLICT` / "cannot publish over existing version" | already uploaded | harmless — it means you ran this twice |
| `ENEEDAUTH` | the login did not take | re-run `npm adduser` and start the loop again |
| `ECONNREFUSED` | the server stopped | check the first terminal window |
| Anything else | unexpected | **record the package name and the full message** |

**Count what landed.** Compare the number of successful publishes against the number of `.tgz` files delivered:

```
ls packages/*.tgz | wc -l
```

The manifest says to expect roughly **507** archives for the application stack. A count that is materially lower means the bundle is short, and the missing packages will not announce themselves until Step 5 fails.

---

# Step 4 — Point npm at the server

Tell npm to use the local server instead of the internet:

```
npm config set registry http://localhost:4873
```

Verify:

```
npm config get registry
```

Expected:

```
http://localhost:4873/
```

**If other people will use this server** from other machines, they set the same value with this machine's hostname or address in place of `localhost`, and the server must be reachable from their machine on port 4873. That is a networking question for whoever owns the network — not something to solve today.

---

# Step 5 — Prove it works, offline, with a real build

Everything so far is setup. This step is the actual test, and it is the reason the day exists. **Do not declare success before this step passes.**

## 5a. Install the throwaway application's dependencies

```
cd hello-world-ng22
npm ci
```

`npm ci` installs exactly the versions recorded in that project's `package-lock.json`, from the server you just seeded. It is the only install command that should ever be used here — it does not improvise, and it fails loudly rather than quietly substituting a different version.

**Expected:** a few minutes of work, ending with something like:

```
added 521 packages in 45s
```

**If it fails, the message tells you what is wrong:**

| Error | What it means | What to do |
|---|---|---|
| `404 Not Found - GET http://localhost:4873/<package>` | that package was not in the bundle, or its upload failed in Step 3 | **Record the exact package name and version.** This is the single most important thing to send back out. It is a bundle defect, not something to work around. |
| `ETARGET` / "No matching version found" | the right package is there but the wrong version | record package **and** version; also a bundle defect |
| `EINTEGRITY` | the archive does not match its expected checksum | the file was corrupted in transfer — record it and request a re-delivery of that file |
| Hangs with no output | the server is still trying to reach the internet | go back to Step 2 and confirm the uplinks were removed |
| `ECONNREFUSED` | the server stopped | check the first terminal window |

**Do not** "fix" a 404 by changing a version number, and **do not** point the registry back at the internet. Both produce a build that works today and cannot be reproduced tomorrow, which is worse than a clean failure.

## 5b. Build it

```
npm run build
```

Expected: a build summary ending in something like `Application bundle generation complete.` and a `dist/` directory appearing.

**If you see an error mentioning TypeScript versions**, read this carefully — it is the failure this stack is most prone to:

> Angular 22 requires TypeScript **6.0.x specifically** (`>=6.0 <6.1`). The current public release of TypeScript is 7.x. If someone assembled the bundle by taking "the latest version of everything," TypeScript 7 is in the bundle and **the build cannot work**. The fix is not on this side: the correct package is `typescript@6.0.3` and it has to be delivered. Record the error and the TypeScript version you have (`npx tsc --version`).

## 5c. Run the tests

```
npm test
```

Expected: a short test run that passes. This confirms the test tooling was included, which is easy to leave out of a bundle because it is not needed to build.

## 5d. The real proof — prove nothing reached the internet

The previous three steps could all have passed by quietly using an internet connection you did not know you had. Prove they did not:

```
rm -rf node_modules
npm ci --offline
```

`--offline` forbids any network request beyond your local server. If this succeeds, the environment is genuinely self-sufficient.

**This is the moment the day is judged on.** If 5a passed but 5d fails, something in the chain was reaching outside, and you have found it before it mattered.

---

# Step 6 — Write down what actually happened

Someone outside this network will be supporting this setup with **no access to it**. What you write here is the entirety of what they will have.

Record, in a file kept on this network:

1. **Date, machine, operating system and version.**
2. **`node --version` and `npm --version`** — actual output, not "the right one."
3. **Whether a package server already existed**, or the one you installed, its version, its address and port, and its configuration file path.
4. **The username you created** in Step 3 and where the password is kept.
5. **The count of packages published**, and the exact name and version of every one that failed.
6. **Whether Steps 5a–5d passed**, individually. `5d` especially.
7. **Every deviation from this document** — anything you did differently, and why. A deviation nobody wrote down is the thing that breaks the second installation.
8. **Everything that is still outstanding** — the server not starting on boot, other machines not yet pointed at it, and anything you skipped.

Then mark the outcome as one of:

- **Green** — 5d passed. The environment is reproducible offline. Proceed to real work.
- **Amber** — 5a–5c passed but 5d failed, or packages were missing and worked around. Usable today, not reproducible. Record precisely what is missing.
- **Red** — the build does not work. Record the exact error text and stop. Do not improvise a repair; a repair nobody understands is harder to undo than a failure.

---

# Appendix — Quick reference

| Task | Command |
|---|---|
| Check Node | `node --version` (need `24.15.0+`, or `22.22.3+` in 22.x, or `26+`) |
| Check which registry npm uses | `npm config get registry` |
| Start the package server | `npx verdaccio` |
| Log in to it | `npm adduser --registry http://localhost:4873` |
| Upload one archive | `npm publish <file>.tgz --registry http://localhost:4873` |
| Point npm at it | `npm config set registry http://localhost:4873` |
| Install a project exactly | `npm ci` |
| Install proving no internet | `npm ci --offline` |
| See what version of TypeScript is installed | `npx tsc --version` |

## Fallback if the package server cannot be installed

If Step 2 is blocked — no permission to run a server, port blocked, change control refuses — there is a simpler path that needs no server at all, **provided the bundle was built to support it**: npm can install directly from a delivered copy of its own download cache.

```
npm ci --offline --cache <path-to-delivered-cache-directory>
```

This works for installing, and it is a genuinely useful contingency. It is **not** a substitute for a package server long-term: it does not serve other machines, does not support the legacy applications' own installs, and gets unwieldy across many projects. Treat it as a way to keep working on day one, not as the answer.

**Whether this fallback is available depends entirely on how the bundle was packed on the other side** — the cache directory has to be included deliberately. This is worth requesting as belt-and-braces in the first delivery: it is small relative to the archives it duplicates, and it converts a blocked day into a productive one.

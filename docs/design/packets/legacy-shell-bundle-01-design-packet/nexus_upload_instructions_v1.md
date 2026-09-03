---
schema: corpus-doc/v1
status: exploratory
title: Nexus Upload Instructions v1 — getting the bundle into the island registry
areas: [isolated-network, dev-environment]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/v18_transfer_bundle_manifest_v1.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v1.md"]
updated: 2026-09-03
---

# Nexus Upload Instructions v1

**Created:** 2026-09-03 | **Last updated:** 2026-09-03 (pool/slicer, delta merge, node_modules callout; island facts from Graham folded in) | **Status:** `exploratory` — the *procedure shape* is verified (it is exactly how the offline Verdaccio was seeded, twice); everything Nexus-specific is marked **UNVERIFIED** because no Nexus instance was available to test against.

## If you have ported node_modules folders before, read this first

This bundle is **not** a node_modules tree. It is the **original published registry tarballs**, exactly as npm served them. That difference is load-bearing:

1. **Integrity.** `package-lock.json` pins each dependency by a sha512 over the *published tarball bytes*. Repacking a package out of an installed `node_modules` produces different bytes (tar entry order, mtimes, gzip framing) even when file contents are identical → hash mismatch → `npm ci` fails with `EINTEGRITY`. Every tarball in this bundle was sha512-verified against the lockfile values at extraction and again after re-download from a seeded registry — lockfile installs are proven to work against it.
2. **Size.** Original tarballs for the whole 17→19 union: 191 MB. One installed tree: ~410-440 MB. Same content, ~1/4 the bytes.
3. **Cleanliness.** A `node_modules` tree carries post-install artifacts that do not belong in a registry: compiled native output from the source machine's toolchain, downloaded binaries (puppeteer's Chromium is the local example), and npm-injected metadata fields.
4. **Your existing upload script:** if it iterates directories, point it at the `.tgz` files instead — the loop below is ready to run.

## Before starting

1. Unpack the delivered tar; verify integrity **first**:
   ```
   tar -xf rr-legacy-v17-v18hop-bundle-2026-09-03.tar
   cd rr-legacy-v17-v18hop-bundle-2026-09-03
   sha256sum -c SHA256SUMS        # must report 1,311 OK, zero failures
   ```
2. You need: the Nexus **npm-hosted** repository URL (e.g. `https://<nexus-host>/repository/npm-internal/`), and an account with npm publish rights to it. **UNVERIFIED**: the island Nexus's repo name, auth model, and whether the estate installs from a group repo that fronts this hosted one.

## The upload: an npm publish loop

Same mechanism that seeded (and thereby verified) the offline registry:

```
export NEXUS=https://<nexus-host>/repository/npm-internal/
npm login --registry "$NEXUS"        # or a .npmrc _authToken line — UNVERIFIED which Nexus accepts
for f in tarballs/*.tgz; do
  npm publish "$f" --registry "$NEXUS" --access public --provenance=false \
    || echo "FAILED: $f" >> upload-failures.txt
done
[ -f upload-failures.txt ] && cat upload-failures.txt || echo "all published"
```

Gotchas observed during the rehearsal seeding — expect them on Nexus too:

| Symptom | Cause | Fix |
|---|---|---|
| `EUSAGE: Automatic provenance generation not supported` | 9 tarballs carry `publishConfig.provenance` internally | always pass `--provenance=false` |
| `409 Conflict / already present` | version already in the registry | **fine** — count as success (dedupe across hop bundles is expected and desirable) |
| `413 Payload Too Large` | `@stencil/core` is 8.3 MB (~11.4 MB as base64 PUT body) | raise the registry/reverse-proxy body limit (Verdaccio: `max_body_size`; Nexus/nginx: **UNVERIFIED** which knob) |

## Minimizing the port: check what Nexus already serves FIRST

The estate's apps build on the island today, so **Nexus probably already serves their entire v17 dependency surface (104 MB of this pool)**. Before porting, export or query Nexus's existing npm package list, build a minimal manifest from it (`{"tarballs":[{"sha256":...}]}` — or just use the manifest of any bundle already uploaded), and cut the true minimum payload:

```
legacy-shells/tools/build-transfer-bundle.sh <workdir> --delta-from <that-manifest.json>
```

If the v17 surface is indeed present, the Milestone-1 payload is the two hop deltas only: **~87 MB** (17→18: 184 tarballs / 45.1 MB; 18→19: 155 / 42.2 MB). Status of the premise: probable, **not verified** — the check above is the verification.

## Merging a delta bundle onto one you already uploaded

A delta tar contains only the tarballs you do not already hold, **plus SHA256SUMS and MANIFEST.json covering the ENTIRE merged set**. By hand:

```
tar -xf rr-legacy-v17-v18hop-bundle-2026-09-03.tar     # the bundle you already hold
tar -xf rr-legacy-delta-vs-2026-09-03-bundle.tar
cp -r rr-legacy-delta-vs-2026-09-03-bundle/tarballs/* rr-legacy-v17-v18hop-bundle-2026-09-03/tarballs/
cp rr-legacy-delta-vs-2026-09-03-bundle/{SHA256SUMS,MANIFEST.json} rr-legacy-v17-v18hop-bundle-2026-09-03/
cd rr-legacy-v17-v18hop-bundle-2026-09-03 && sha256sum -c SHA256SUMS --quiet && echo MERGED-SET-OK
```

The delta's SHA256SUMS/MANIFEST **supersede** the originals. Ten tarballs from the older bundle are not in the current manifest (the superseded `puppeteer@3.3.0` tree) — harmless: extra packages on Nexus hurt nothing, and `sha256sum -c` simply does not list them. Then run the upload loop over the merged `tarballs/` — `409 already present` responses are expected and fine.

## After upload — acceptance checks on the island

1. Spot-verify bytes: `npm pack @angular/core@18.2.14 --registry "$NEXUS"` and sha256-compare against `SHA256SUMS`.
2. **The `@my-team/*` metadata check** (hop procedure v2): `npm view @my-team/legacy-app-01-common --registry "$NEXUS"` must answer, or `ng update` dies before starting. **Graham confirmed 2026-09-03 that Nexus holds the `@my-team/*` metadata** — treat this as a 30-second sanity check, not an open risk.
3. puppeteer: nothing on the estate runs it, and every island app's `.npmrc` already carries `PUPPETEER_SKIP_DOWNLOAD=true` (Graham) — the convention that keeps its Chromium download from ever touching the network. Keep it.
4. Then run the hop per [`monorepo_hop_procedure_v2.md`](monorepo_hop_procedure_v2.md). `npm ci` against Nexus with locks whose `resolved` URLs name another registry works via npm's default `--replace-registry-host=npmjs` — verified offline; if the island's locks name an old Nexus host, **UNVERIFIED** whether that host string matches what npm rewrites (worst case: `npm ci --replace-registry-host=always`... **UNVERIFIED**, check `npm help ci` on the island's npm version).

## Alternative if publish rights are unavailable

Nexus can also ingest tarballs via its UI/REST (components API) — **UNVERIFIED** and version-dependent; the publish loop is the path this packet stands behind. The npm-cache fallback (DR-09) remains the day-one insurance either way.

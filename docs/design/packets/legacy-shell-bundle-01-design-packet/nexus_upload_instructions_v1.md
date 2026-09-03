---
schema: corpus-doc/v1
status: exploratory
title: Nexus Upload Instructions v1 — getting the bundle into the island registry
areas: [isolated-network, dev-environment]
related: ["docs/design/packets/legacy-shell-bundle-01-design-packet/v18_transfer_bundle_manifest_v1.md", "docs/design/packets/legacy-shell-bundle-01-design-packet/offline_verification_transcript_v1.md"]
updated: 2026-09-03
---

# Nexus Upload Instructions v1

**Created:** 2026-09-03 | **Status:** `exploratory` — the *procedure shape* is verified (it is exactly how the offline Verdaccio was seeded); everything Nexus-specific is marked **UNVERIFIED** because no Nexus instance was available to test against.

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

## After upload — acceptance checks on the island

1. Spot-verify bytes: `npm pack @angular/core@18.2.14 --registry "$NEXUS"` and sha256-compare against `SHA256SUMS`.
2. **The `@my-team/*` metadata wall** (runbook delta Finding 2): `npm view @my-team/legacy-app-01-common --registry "$NEXUS"` must answer, or `ng update` dies before starting. If Nexus does not already hold these, publish the real packages (preferred) or placeholder versions matching the workspace versions. **UNVERIFIED** whether they are already there.
3. Set env for all installs: `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true PUPPETEER_SKIP_DOWNLOAD=true` (puppeteer's Chromium is not npm cargo and will otherwise try the internet).
4. Then run the hop per the runbook + [monorepo delta](v17_to_v18_monorepo_runbook_delta_v1.md). `npm ci` against Nexus with locks whose `resolved` URLs name another registry works via npm's default `--replace-registry-host=npmjs` — verified offline; if the island's locks name an old Nexus host, **UNVERIFIED** whether that host string matches what npm rewrites (worst case: `npm ci --replace-registry-host=always`... **UNVERIFIED**, check `npm help ci` on the island's npm version).

## Alternative if publish rights are unavailable

Nexus can also ingest tarballs via its UI/REST (components API) — **UNVERIFIED** and version-dependent; the publish loop is the path this packet stands behind. The npm-cache fallback (DR-09) remains the day-one insurance either way.

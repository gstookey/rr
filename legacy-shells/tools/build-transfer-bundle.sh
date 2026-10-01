#!/bin/bash
# build-transfer-bundle.sh — rebuild the Legacy Island transfer bundle from the committed
# lockfiles, reproducibly, on any internet-connected Linux x64 machine.
#
# WHAT IT DOES
#   1. Unions every registry tarball referenced by the committed lock snapshots
#      (legacy-shells/bundle/locks/{v17..v22}/ + bundle/tempcli/{hop18..hop22}/),
#      filtered to linux-x64 platform binaries (the island: RHEL 9).
#   2. Downloads each tarball from the npm registry, verifying the lockfile's sha512
#      over the exact bytes. Registry tarballs are immutable, so the output is
#      byte-identical to the verified bundle — check it against the committed
#      legacy-shells/bundle/SHA256SUMS.
#   3. Emits <workdir>/pool/{tarballs/,SHA256SUMS,MANIFEST.json} and a .tar of the
#      requested slice, named angular-upgrade-bundle-<slice>-<date>.tar (see
#      BUNDLE_PREFIX below -- renamed 2026-09-08 for compliance).
#   4. (2026-10-01) Puts what the island needs to USE the bundle inside it: upload-to-nexus.sh
#      (components API, staged per rung with --through), tools/ (hop.sh + the two angular.json
#      helpers), LADDER.md (the procedure) and NEXUS_UPLOAD.md -- and, in the cumulative and
#      21-22 bundles, the Node.js 22 binary that rung requires (Angular 22: ^22.22.3).
#
# REBASED 2026-10-01 on Graham's exact-pinned package.json files (main 4dec9c4); the ladder now
# lands on Angular 22.2.1 (decision D-2: one 22.2.x patch on both islands).
#
# PREREQUISITES
#   - Node >= 20 and npm >= 10 (built with Node v22.22.2 / npm 10.9.7)
#   - ~600 MB free disk in <workdir>; ~400 MB of downloads (full mode, incl. the Node binary)
#   - Registry access to https://registry.npmjs.org (or set npm's registry to a mirror
#     that holds identical bytes)
#   - Runtime: roughly 5-15 minutes depending on connection
#
# MODES (default: --cumulative)
#   --cumulative               full 17->22 union (the master pool)
#   --rung v17-baseline | 17-18 | 18-19 | 19-20 | 20-21 | 21-22
#                              just that rung's tarballs (per-rung port)
#   --delta-from <MANIFEST.json>
#                              only tarballs absent from a prior bundle's manifest --
#                              hand it the manifest of the bundle already uploaded (or a
#                              manifest built from Nexus's holdings) to get the true
#                              minimum payload. SHA256SUMS/MANIFEST in the output still
#                              cover the whole pool, so one `sha256sum -c` validates the
#                              merged set after extracting old + delta together.
#
# FAILURE MODE: any tarball that cannot be fetched or fails integrity aborts the run
# with the URL printed. Re-running resumes (already-correct files are kept).
#
# Usage: build-transfer-bundle.sh <workdir> [mode args]
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"           # legacy-shells/
WORK="${1:?usage: build-transfer-bundle.sh <workdir> [--cumulative | --rung <r> | --delta-from <manifest>]}"
shift || true
MODE=("${@:---cumulative}")
command -v node >/dev/null || { echo "node not found"; exit 2; }
LADDER_NODE_VERSION=22.23.3   # newest 22.x on 2026-10-01; Angular 22 needs ^22.22.3 (the ladder's only Node gate)
node -e 'const [ma]=process.versions.node.split(".").map(Number); if(ma<20){console.error("Node >=20 required, found "+process.version); process.exit(2)}'
mkdir -p "$WORK/pool"

L="$HERE/bundle/locks"; T="$HERE/bundle/tempcli"
node "$HERE/tools/lock-union.mjs" \
  --tag v17 "$L/v17/legacy-app-01.package-lock.json" "$L/v17/legacy-app-02.package-lock.json" \
  --tag v18 "$L/v18/legacy-app-01.package-lock.json" "$L/v18/legacy-app-02.package-lock.json" "$T/hop18/package-lock.json" \
  --tag v19 "$L/v19/legacy-app-01.package-lock.json" "$L/v19/legacy-app-02.package-lock.json" "$T/hop19/package-lock.json" \
  --tag v20 "$L/v20/legacy-app-01.package-lock.json" "$L/v20/legacy-app-02.package-lock.json" "$T/hop20/package-lock.json" \
  --tag v21 "$L/v21/legacy-app-01.package-lock.json" "$L/v21/legacy-app-02.package-lock.json" "$T/hop21/package-lock.json" \
  --tag v22 "$L/v22/legacy-app-01.package-lock.json" "$L/v22/legacy-app-02.package-lock.json" "$T/hop22/package-lock.json" \
  > "$WORK/pool/union.tsv"

node "$HERE/tools/fetch-tarballs.mjs" "$WORK/pool/union.tsv" "$WORK/pool/tarballs"

echo "== verifying pool against the committed SHA256SUMS =="
( cd "$WORK/pool" && sha256sum -c "$HERE/bundle/SHA256SUMS" --quiet ) \
  && echo "pool matches committed SHA256SUMS" \
  || { echo "WARNING: pool differs from the committed SHA256SUMS -- registry drift or a"; \
       echo "lock change. Diff the manifests before trusting the output."; }

STAMP=$(date +%F)
# Output naming. Changed 2026-09-08 at Graham's direction for COMPLIANCE: delivered
# artifacts are named for what they are (an Angular upgrade bundle) rather than for the
# project or the estate. The earlier project-prefixed names are retired. Change the prefix
# HERE only -- it also becomes the directory name INSIDE the .tar, so renaming an archive
# after the fact does not change what extraction produces.
BUNDLE_PREFIX="angular-upgrade-bundle"
case "${MODE[0]}" in
  --cumulative)
    OUT="$WORK/${BUNDLE_PREFIX}-v17-v22-$STAMP"; rm -rf "$OUT" "$OUT.tar"; mkdir -p "$OUT"
    node "$HERE/tools/slice-bundle.mjs" "$WORK/pool" "$OUT" ;;
  --rung)
    OUT="$WORK/${BUNDLE_PREFIX}-${MODE[1]}-$STAMP"; rm -rf "$OUT" "$OUT.tar"; mkdir -p "$OUT"
    node "$HERE/tools/slice-bundle.mjs" "$WORK/pool" "$OUT" --rung "${MODE[1]}" ;;
  --delta-from)
    OUT="$WORK/${BUNDLE_PREFIX}-delta-$STAMP"; rm -rf "$OUT" "$OUT.tar"; mkdir -p "$OUT"
    node "$HERE/tools/slice-bundle.mjs" "$WORK/pool" "$OUT" --delta-from "${MODE[1]}" ;;
  *) echo "unknown mode ${MODE[0]}"; exit 2 ;;
esac
# --- what the island needs to use the bundle (2026-10-01) -------------------------------------
# The output directory is assembled FRESH each run (above) and BUNDLE-INFO.txt is written before
# the checksums, so SHA256SUMS covers every file (a stale-file mismatch was caught by the uploader).
P="$HERE/../docs/design/packets/legacy-shell-bundle-01-design-packet"
cp "$P/nexus_upload_instructions_v2.md" "$OUT/NEXUS_UPLOAD.md"
cp "$P/monorepo_hop_procedure_v3.md" "$OUT/LADDER.md"
cp "$HERE/tools/upload-to-nexus.sh" "$HERE/tools/npm-load-package.sh" "$OUT/"
mkdir -p "$OUT/tools"; cp "$HERE/tools/hop.sh" "$HERE/tools/make-root-angular-json.mjs" "$HERE/tools/port-root-angular-json.mjs" "$OUT/tools/"
if [ "${MODE[0]}" = --cumulative ] || { [ "${MODE[0]}" = --rung ] && [ "${MODE[1]}" = 21-22 ]; }; then
  NT="node-v$LADDER_NODE_VERSION-linux-x64.tar.xz"; NC="$WORK/.cache/node-v$LADDER_NODE_VERSION"; mkdir -p "$NC" "$OUT/node"
  [ -s "$NC/SHASUMS256.txt" ] || curl -fsSL -o "$NC/SHASUMS256.txt" "https://nodejs.org/dist/v$LADDER_NODE_VERSION/SHASUMS256.txt"
  [ -s "$NC/$NT" ] || curl -fsSL -o "$NC/$NT" "https://nodejs.org/dist/v$LADDER_NODE_VERSION/$NT"
  ( cd "$NC" && grep " $NT\$" SHASUMS256.txt | sha256sum -c --quiet - ) || { echo "Node tarball checksum mismatch"; exit 1; }
  cp "$NC/$NT" "$NC/SHASUMS256.txt" "$OUT/node/"
  echo "  + Node.js $LADDER_NODE_VERSION (rung 21-22 needs >= 22.22.3; nodejs.org SHASUMS256 verified)"
fi
cat > "$OUT/BUNDLE-INFO.txt" <<INFO
bundle:   $(basename "$OUT")
built:    $(date -u +%FT%TZ)
contents: $(ls "$OUT/tarballs" | wc -l) npm tarballs ($(du -sh "$OUT/tarballs" | cut -f1))$([ -d "$OUT/node" ] && echo ", Node.js $LADDER_NODE_VERSION")
ladder:   Angular 17.3 -> 18.2.14 -> 19.2.25 -> 20.3.33 -> 21.2.25 -> 22.2.1
start:    NEXUS_UPLOAD.md (load Nexus), then LADDER.md (run the hops with tools/hop.sh)
INFO
( cd "$OUT" && find . -type f ! -path './tarballs/*' ! -name SHA256SUMS -printf '%P\n' | LC_ALL=C sort | xargs -d '\n' sha256sum ) >> "$OUT/SHA256SUMS"
tar -cf "$OUT.tar" -C "$(dirname "$OUT")" "$(basename "$OUT")"
echo "DONE: $OUT.tar"; ls -l "$OUT.tar"

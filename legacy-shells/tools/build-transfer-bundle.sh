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
#      requested slice.
#
# PREREQUISITES
#   - Node >= 20 and npm >= 10 (built with Node v22.22.2 / npm 10.9.7)
#   - ~500 MB free disk in <workdir>; ~200 MB of registry downloads (full mode)
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
case "${MODE[0]}" in
  --cumulative)
    OUT="$WORK/rr-legacy-v17-v22-bundle-$STAMP"; mkdir -p "$OUT"
    node "$HERE/tools/slice-bundle.mjs" "$WORK/pool" "$OUT" ;;
  --rung)
    OUT="$WORK/rr-legacy-rung-${MODE[1]}-$STAMP"; mkdir -p "$OUT"
    node "$HERE/tools/slice-bundle.mjs" "$WORK/pool" "$OUT" --rung "${MODE[1]}" ;;
  --delta-from)
    OUT="$WORK/rr-legacy-delta-$STAMP"; mkdir -p "$OUT"
    node "$HERE/tools/slice-bundle.mjs" "$WORK/pool" "$OUT" --delta-from "${MODE[1]}" ;;
  *) echo "unknown mode ${MODE[0]}"; exit 2 ;;
esac
cp "$HERE/../docs/design/packets/legacy-shell-bundle-01-design-packet/nexus_upload_instructions_v1.md" "$OUT/NEXUS_UPLOAD.md" 2>/dev/null || true
tar -cf "$OUT.tar" -C "$(dirname "$OUT")" "$(basename "$OUT")"
echo "DONE: $OUT.tar"; ls -l "$OUT.tar"

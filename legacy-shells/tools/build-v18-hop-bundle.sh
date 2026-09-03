#!/bin/bash
# build-v18-hop-bundle.sh — reproduce the v17+hop+v18 transfer bundle from the legacy shells.
# Created 2026-09-03 (legacy-shell-bundle-01 packet). Run on an internet-connected machine.
#
# Captures EVERY tarball the journey fetches into one fresh npm cache:
#   1. npm ci of both shells' committed v17 locks        (checkout the v17 state first)
#   2. the 17->18 ng update, both phases + finalization  (see the monorepo runbook delta)
#   3. npm ci of the v18 locks
# then extracts the cache into flat tarballs + SHA256SUMS + MANIFEST.json.
#
# This script automates the CAPTURE-AND-EXTRACT half only (steps against the current
# checkout); the hop itself is a procedure, not a script — run it per the runbook.
# Usage: build-v18-hop-bundle.sh <workdir> [v17-ref] [v18-ref]
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"           # legacy-shells/
REPO="$(cd "$HERE/.." && pwd)"
WORK="${1:?usage: build-v18-hop-bundle.sh <workdir> [v17-ref] [v18-ref]}"
V17REF="${2:-}" ; V18REF="${3:-HEAD}"
CACHE="$WORK/capture-cache"; OUT="$WORK/bundle"
mkdir -p "$CACHE" "$OUT/tarballs"

export npm_config_cache="$CACHE" npm_config_fund=false npm_config_audit=false
export NG_CLI_ANALYTICS=false CI=true PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true PUPPETEER_SKIP_DOWNLOAD=true

ci_state () { # ci_state <git-ref-or-empty> <label>
  local ref="$1" label="$2" dir="$WORK/state-$2"
  rm -rf "$dir"; mkdir -p "$dir"
  if [ -n "$ref" ]; then git -C "$REPO" archive "$ref" legacy-shells | tar -x -C "$dir"
  else cp -r "$HERE" "$dir/legacy-shells"; fi
  for A in legacy-app-01 legacy-app-02; do
    ( cd "$dir/legacy-shells/$A" && npm ci )
  done
}

[ -n "$V17REF" ] && ci_state "$V17REF" v17
ci_state "$V18REF" v18
echo "NOTE: the ng update phases themselves must be run (per the runbook delta) with"
echo "npm_config_cache=$CACHE for their fetches (incl. the temp CLI) to be captured."
echo "If you are re-cutting the bundle for versions already committed, the two ci"
echo "passes above plus a hop replay in state-v17 cover the same set."

node "$HERE/tools/extract-cache-tarballs.mjs" "$CACHE" "$OUT/tarballs"
echo "Bundle at $OUT: $(ls "$OUT/tarballs" | wc -l) tarballs; SHA256SUMS + MANIFEST.json alongside."
echo "Tar it:  tar -cf rr-legacy-v17-v18hop-bundle-$(date +%F).tar -C '$OUT' ."

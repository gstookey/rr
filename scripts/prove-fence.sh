#!/usr/bin/env bash
#
# prove-fence.sh — S0's PROOF.
#
# The slice decomposition names one acceptance test for S0: "a cross-Floor import
# fails `local-ci.sh`". A green lint run does not prove that. Only breaking the
# rule on purpose and watching the gate go red does — a fence you have never seen
# reject anything is a fence you are only assuming exists.
#
# So: temporarily make `@rr/invent-domain` (scope:invent) import
# `@rr/command-domain` (scope:command), run ESLint with the Sheriff plugin,
# assert that it FAILS, and put the file back. The probe is written to a NEW
# file that is deleted unconditionally on exit, so an interrupted run cannot
# leave a forbidden import behind.
#
# Usage: bash scripts/prove-fence.sh
# Exit:  0 iff the fence rejected the forbidden import (and accepts the repo
#        again afterwards); 1 otherwise.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 2

PROBE="packages/invent-domain/src/__fence-probe.ts"
BARREL="packages/invent-domain/src/index.ts"
BARREL_BACKUP="$(mktemp)"

cleanup() {
  rm -f "$PROBE"
  if [ -s "$BARREL_BACKUP" ]; then
    cp "$BARREL_BACKUP" "$BARREL"
  fi
  rm -f "$BARREL_BACKUP"
}
trap cleanup EXIT INT TERM

cp "$BARREL" "$BARREL_BACKUP"

cat > "$PROBE" <<'TS'
// TEMPORARY — written and deleted by scripts/prove-fence.sh. If you are reading
// this file in a diff, the fence proof crashed; delete it.
import { remainingApprovals } from '@rr/command-domain';

export const forbidden = remainingApprovals(2, 1);
TS

# The probe must be REACHABLE from the module's barrel, or Sheriff never walks
# to it and the "failure" would be a false negative dressed as a pass.
printf "\nexport { forbidden } from './__fence-probe.js';\n" >> "$BARREL"

echo "── fence probe: @rr/invent-domain (scope:invent) --> @rr/command-domain (scope:command)"
LINT_OUT="$(npx eslint "$PROBE" 2>&1)"
LINT_STATUS=$?

if [ "$LINT_STATUS" -eq 0 ]; then
  echo "FAIL: the fence ACCEPTED a cross-Floor import. sheriff.config.ts is not doing its job."
  echo "$LINT_OUT"
  exit 1
fi

if ! grep -q "dependency-rule" <<<"$LINT_OUT"; then
  echo "FAIL: lint failed, but NOT on the Sheriff dependency rule — so this run proves nothing."
  echo "$LINT_OUT"
  exit 1
fi

echo "$LINT_OUT" | sed 's/^/    /'
echo "── the fence rejected it, on @softarc/sheriff/dependency-rule, as designed."

# Second half of the proof: the fence must ACCEPT the repo once the violation is
# withdrawn. A rule that fails everything is not a fence either.
cleanup
trap - EXIT INT TERM

echo "── re-linting the restored tree"
if ! npx eslint . > /dev/null 2>&1; then
  echo "FAIL: the tree does not lint clean after the probe was removed."
  exit 1
fi

echo "PASS: fence rejects the forbidden import and accepts the restored tree."

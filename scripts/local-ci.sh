#!/usr/bin/env bash
#
# local-ci.sh — THE GATE for Project Road Runner's ACME Workshop workspace.
#
# WHY THIS EXISTS: AW-D11 ruled a local gate over GitHub Actions. Two reasons,
# and only one of them is about money: the island has no Actions at all, so a
# gate that only exists in a cloud runner is a gate the team it is being built
# for can never run. Everything here works on a laptop with no network.
#
# Run it green before surfacing ANY PR for review (operating contract rule 18);
# no agent merges (rule 15).
#
# Usage: bash scripts/local-ci.sh
# Exit:  0 iff every gate passed; 1 otherwise.
#
# Capture the exit code DIRECTLY — `bash scripts/local-ci.sh > /tmp/ci.log 2>&1`
# then `echo "EXIT=$?"` on its own line. Piping or chaining masks it.
#
# NODE: this workspace requires Node >= 22.23.2 (Angular 22's floor is 22.22.3;
# 22.23.2 is the version the v17->v22 ladder was rehearsed on). `.nvmrc` pins it.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 2
ROOT="$(pwd)"

FAILED=()
RESULT_NAMES=()
RESULT_STATES=()
RESULT_SECONDS=()

run() {
  local name="$1"; shift
  local start; start=$SECONDS
  printf '\n\033[1m── %s ──\033[0m\n' "$name"
  if "$@"; then
    printf '\033[32mPASS\033[0m: %s\n' "$name"
    RESULT_STATES+=("PASS")
  else
    printf '\033[31mFAIL\033[0m: %s\n' "$name"
    RESULT_STATES+=("FAIL")
    FAILED+=("$name")
  fi
  RESULT_NAMES+=("$name")
  RESULT_SECONDS+=("$((SECONDS - start))")
}

record() {  # record a result decided outside run()
  RESULT_NAMES+=("$1"); RESULT_STATES+=("$2"); RESULT_SECONDS+=("0")
  [ "$2" = "FAIL" ] && FAILED+=("$1")
  return 0
}

echo "local-ci gate on $(git rev-parse --short HEAD) @ $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "node $(node --version) · npm $(npm --version)"

# --- 0. Node floor. A wrong Node produces failures that look like code bugs. ---
NODE_MAJOR="$(node -p 'process.versions.node.split(".").map(Number)[0]')"
NODE_OK="$(node -p 'const [a,b]=process.versions.node.split(".").map(Number); (a===22 && b>=23) || a>22')"
if [ "$NODE_OK" != "true" ]; then
  printf '\033[31mFAIL\033[0m: node floor — need >=22.23.2 (see .nvmrc), have %s\n' "$(node --version)"
  echo "Nothing below this line would mean anything on the wrong Node. Stopping."
  exit 1
fi
printf '\033[32mPASS\033[0m: node floor (>=22.23.2, major %s)\n' "$NODE_MAJOR"
record "node floor" "PASS"

# --- 1. Install ---------------------------------------------------------------
# `npm ci` is the reproducible install and the one the island will use. It needs
# the committed root lockfile; if it is missing, say so rather than silently
# falling back to a resolving install that could drift the tree.
if [ -f package-lock.json ]; then
  run "install (npm ci)"    npm ci --no-audit --no-fund
else
  printf '\033[31mFAIL\033[0m: install — package-lock.json is missing; run `npm install` and COMMIT the lockfile.\n'
  record "install (npm ci)" "FAIL"
fi

# --- 2. @rr/common must be built before anything Node-side consumes it ---------
# It is the one package resolved two different ways: from source by the browser
# build (tsconfig path alias) and from dist by Node (workspace symlink). The
# seed validator is a Node consumer, so its dist has to exist first.
run "build @rr/common"      npm run build --workspace @rr/common

# --- 3. Lint, including THE FENCE ---------------------------------------------
# `eslint .` carries @softarc/eslint-plugin-sheriff, so a cross-Floor import is
# a lint error. Step 4 proves that claim rather than trusting it.
run "lint (eslint + sheriff)"  npx eslint .

# --- 4. The fence PROOF -------------------------------------------------------
# S0's acceptance criterion is "a cross-Floor import fails local-ci.sh". A green
# lint does not demonstrate that; only a deliberate violation does.
run "fence proof"           bash scripts/prove-fence.sh

# --- 5. Typecheck -------------------------------------------------------------
# Per workspace package, because the Angular libraries, the plain-TS packages and
# the Node services each have their own tsconfig shape. `--if-present` means a
# package without a typecheck script is skipped, not silently passed — which is
# why the summary prints the roster it actually ran.
run "typecheck (workspaces)" npm run typecheck --workspaces --if-present

# --- 6. Unit tests ------------------------------------------------------------
# Two runners' worth of invocation, one runner underneath (Vitest 4.0.x):
# Angular projects go through @angular/build:unit-test, plain packages through
# vitest directly.
run "test: shell (ng/vitest)"  npx ng test shell --watch=false
run "test: workspaces (vitest)" npm run test --workspaces --if-present

# --- 7. Builds ----------------------------------------------------------------
run "build: shell (ng)"     npx ng build shell
run "build: libraries (ng-packagr)" npm run build:libs
run "build: node services (tsc)" bash -c 'npm run build --workspace @rr/gateway && npm run build --workspace @rr/mock-oidc'

# --- 8. Seed integrity --------------------------------------------------------
# Every marked row against the real @rr/common schema, plus the invented
# bounding box. A drifting coordinate is a portability problem, not a typo.
run "seed validation"       node scripts/seed.mjs

# --- 9. Infrastructure artifacts, structurally -------------------------------
# The fleet has no Docker daemon, so these are the strongest checks available
# here: the compose file and the realm must at least PARSE, and the realm must
# stay in step with the CI-side OIDC stub (asserted by the parity spec in step 6).
run "infra: compose + realm parse" node scripts/check-infra.mjs

# --- 10. Docs corpus ----------------------------------------------------------
run "corpus:validate"       node scripts/corpus-graph.mjs check

# --- Summary ------------------------------------------------------------------
printf '\n\033[1m════════════════════════ local-ci summary ════════════════════════\033[0m\n'
printf '  %-38s %-6s %s\n' "GATE" "RESULT" "SECONDS"
printf '  %-38s %-6s %s\n' "--------------------------------------" "------" "-------"
for i in "${!RESULT_NAMES[@]}"; do
  if [ "${RESULT_STATES[$i]}" = "PASS" ]; then
    printf '  %-38s \033[32m%-6s\033[0m %s\n' "${RESULT_NAMES[$i]}" "PASS" "${RESULT_SECONDS[$i]}"
  else
    printf '  %-38s \033[31m%-6s\033[0m %s\n' "${RESULT_NAMES[$i]}" "FAIL" "${RESULT_SECONDS[$i]}"
  fi
done
printf '\033[1m══════════════════════════════════════════════════════════════════\033[0m\n'

if [ ${#FAILED[@]} -eq 0 ]; then
  printf '\033[32mALL GATES PASSED\033[0m\n'
  echo
  echo "NOT covered by this gate, and not claimed to be: docker compose up,"
  echo "the Keycloak realm import, and Postgres RLS behaviour. They need a"
  echo "Docker daemon. See docs/design/packets/acme-workshop-01-design-packet/"
  echo "s0_foundation_notes_v0.md."
  exit 0
fi

printf '\033[31m%d GATE(S) FAILED:\033[0m\n' "${#FAILED[@]}"
for f in "${FAILED[@]}"; do printf '  - %s\n' "$f"; done
exit 1

#!/usr/bin/env bash
#
# local-ci.sh — the full CI gate, run locally.
#
# WHY THIS EXISTS: GitHub Actions CI (`.github/workflows/ci.yml`) is scoped to the
# `main` boundary ONLY — it triggers on push-to-`main` and on pull requests whose
# TARGET branch is `main`. Slice→arc and every other feature-branch PR triggers
# nothing, because this is a private repo on GitHub's free plan (2,000 Actions
# minutes/month) and running CI on every PR exhausted July 2026's budget outright.
#
# So THIS SCRIPT is the standing gate for all feature-branch / slice→arc work, and
# a belt-and-braces pre-check before any arc→`main` PR: run it green before marking
# any PR merge-able / surfacing it for review. See
# `docs/context/governance/ci_local_gate_policy_v0.md`.
#
# It mirrors `.github/workflows/ci.yml` step-for-step (kept in sync with it — if
# you change one, change the other). Runs the jobs SEQUENTIALLY (CI fans them out
# in parallel); wall time is the sum, but correctness is identical.
#
# Usage:  bash scripts/local-ci.sh
# Exit:   0 iff every gate passed; 1 otherwise. Prints a PASS/FAIL summary.

set -uo pipefail
cd "$(dirname "$0")/.." || exit 2
ROOT="$(pwd)"

FAILED=()
run() {
  local name="$1"; shift
  printf '\n\033[1m── %s ──\033[0m\n' "$name"
  if "$@"; then
    printf '\033[32mPASS\033[0m: %s\n' "$name"
  else
    printf '\033[31mFAIL\033[0m: %s\n' "$name"
    FAILED+=("$name")
  fi
}

# Advisory step: reports drift, never fails the gate. Used for the generated
# corpus artifacts, whose freshness is a main-side refresh obligation rather than
# a per-branch one (see the corpus:stale note below).
advise() {
  local name="$1"; shift
  printf '\n\033[1m── %s (advisory) ──\033[0m\n' "$name"
  if "$@"; then
    printf '\033[32mCURRENT\033[0m: %s\n' "$name"
  else
    printf '\033[33mDRIFTED\033[0m: %s — refresh on main with `node scripts/corpus-graph.mjs index` (not in this PR)\n' "$name"
  fi
}

echo "local-ci gate on $(git rev-parse --short HEAD) @ $(date)"

# Setup (CI does this once via .github/actions/setup-pnpm).
run "install"          pnpm install --frozen-lockfile

# Guards (CI: "Migration collision guard", "Corpus graph guard").
run "migrations"       node scripts/check-migration-collisions.mjs
run "corpus:validate"  node scripts/corpus-graph.mjs check
run "corpus:tool"      node --test scripts/test/corpus-graph-claims.spec.mjs
# ADVISORY, deliberately (2026-08-12). The four generated artifacts are derived
# output; when their freshness was a BLOCKING per-branch gate, every docs PR had
# to regenerate them, which put them in every docs diff and made any two parallel
# docs PRs conflict — on GitHub as well as locally. Graph CORRECTNESS is still
# enforced above by `corpus:validate` (frontmatter, edges, vocab, claim
# contention), which reads docs and never touches these files. Freshness is a
# main-side refresh obligation carried by the librarian closeout pass.
advise "corpus:stale"  node scripts/corpus-graph.mjs index --check

# Lint + typecheck (CI: "Lint", "Typecheck").
run "lint"             pnpm lint
run "typecheck"        pnpm typecheck

# Test matrix (CI: "Test (@traidit/<pkg>)").
#
# `integrations-alpaca` was ADDED 2026-07-26 (AHL-S7). It had a `test` script and 98 tests that
# this loop never invoked — a hole Vera proved with a sentinel probe: she made
# `isAlpacaOhlcEligible` return `true` unconditionally (the exclusion set declared but never
# applied — the same class of defect that made policy v1.0 emit NO bar outside regular hours) and
# **every gate stayed green**. Only the ungated suite failed. ALPACA-HISTORIC-LANE-01 moved the
# tick→OHLCV policy engine and the corporate-actions reach into that package, so the blind spot
# had grown to cover the arc's own correctness core. Keep this list in sync with the CI matrix.
for pkg in shared agent api web integrations-alpaca; do
  run "test:$pkg"      pnpm --filter "@traidit/$pkg" test
done

# Web build (CI: "Build web").
run "build:web"        pnpm --filter @traidit/web build

echo ""
echo "════════ local-ci summary ════════"
if [ ${#FAILED[@]} -eq 0 ]; then
  printf '\033[32mOVERALL: PASS\033[0m — every gate green; PR is local-CI-clean.\n'
  exit 0
fi
printf '\033[31mOVERALL: FAIL\033[0m — %d gate(s) failed: %s\n' "${#FAILED[@]}" "${FAILED[*]}"
exit 1

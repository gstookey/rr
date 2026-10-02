#!/usr/bin/env bash
# build-srf-bundles.sh -- cut the front-end / workstation stack into ONE TRANSFER BUNDLE PER SRF
# APPROVAL STATUS, so each group can be ported and loaded into Nexus as its approvals arrive.
# Created 2026-10-02 (Axium). Step-by-step how-to:
#   docs/context/operations/user-workflow/srf_category_bundles_howto_v1.md
#
# WHAT IT PRODUCES  in <workdir>, one .tar per distinct value of the sheet's "Approval Status" column:
#   devenv-frontend-approved-<date>.tar         MAJOR ALREADY APPROVED
#   devenv-frontend-bump-submitted-<date>.tar   MAJOR BUMP SRF SUBMITTED
#   devenv-frontend-bump-needed-<date>.tar      MAJOR BUMP SRF NEEDED
#   devenv-frontend-new-srf-<date>.tar          NEW SRF NEEDED
#   devenv-frontend-nice-to-have-<date>.tar     need srf - nice to have / can wait
#   (any other status text gets its own bundle, named from the text)
#   SRF-BUNDLES-<date>.md    one page: which bundle holds which rows, and what each needs from the others
# Each bundle is an ordinary front-end bundle (npm/, raw/, island/, SHA256SUMS -- loaded with the same
# island/load-nexus.sh) holding only its rows' software plus their dependencies, with SRF-CONTENTS.md
# listing exactly that. A dependency shared by two categories ships in both, so every bundle loads on
# its own and in any order; the loader skips whatever Nexus already has.
#
# HOW A ROW BECOMES FILES  stack/srf-components.tsv maps each sheet row (by its Software text) to npm
# packages and/or files. The npm versions come from the locked stack (stack/frontend/pnpm-lock.yaml) --
# the sheet's Requested Version is CHECKED against them, never used to pick a version.
#
# USAGE   build-srf-bundles.sh <workdir> [--sheet <file.csv>] [--only <status>]... [--from-bundle <dir>] [--relock]
#   --sheet        the status sheet exported as CSV (default: the committed copy,
#                  docs/source-documents/desert-island-setup-docs/front-end-srf-status.csv)
#   --only         build only this status: its short name (approved, bump-submitted, bump-needed,
#                  new-srf, nice-to-have) or its text in the sheet. Repeatable.
#   --from-bundle  reuse a complete front-end bundle directory already built from this commit
#                  (by build-frontend-bundle.sh) instead of building one first
#   --relock       passed to build-frontend-bundle.sh (regenerate the lockfiles first)
#
# PREREQUISITES  as build-frontend-bundle.sh (Linux x64, curl, tar, xz, sha256sum, unzip, gzip, ~4 GB
#   for the complete bundle) plus room for the category bundles (~1.4 GB more; files are hard-linked
#   from the complete bundle while assembling, so only the .tar files take new space).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"               # desert-island-devenv/
REPO="$(cd "$ROOT/.." && pwd)"
STACK="$ROOT/stack"
LEGACY_TOOLS="$REPO/legacy-shells/tools"
USAGE="usage: build-srf-bundles.sh <workdir> [--sheet <file.csv>] [--only <status>]... [--from-bundle <dir>] [--relock]"
WORK="${1:?$USAGE}"; shift
SHEET="$REPO/docs/source-documents/desert-island-setup-docs/front-end-srf-status.csv"; ONLY=(); FROM=""; RELOCK=()
while [ $# -gt 0 ]; do case "$1" in
  --sheet) SHEET="${2:?--sheet needs a file}"; shift 2 ;;
  --only) ONLY+=("${2:?--only needs a status}"); shift 2 ;;
  --from-bundle) FROM="${2:?--from-bundle needs a directory}"; shift 2 ;;
  --relock) RELOCK=(--relock); shift ;;
  *) echo "unknown option $1"; echo "$USAGE"; exit 2 ;; esac; done

log() { printf '\n== %s\n' "$*"; }
die() { printf 'ABORT: %s\n' "$*" >&2; exit 1; }
[ -f "$SHEET" ] || die "no sheet at $SHEET (export the spreadsheet as CSV and pass --sheet <file>)"
SHEET="$(cd "$(dirname "$SHEET")" && pwd)/$(basename "$SHEET")"
mkdir -p "$WORK"; WORK="$(cd "$WORK" && pwd)"
# shellcheck disable=SC1091
source "$STACK/workstation.env"
STAMP=$(date +%F)

# ---------------------------------------------------------------- 1. the complete bundle
if [ -z "$FROM" ]; then
  log "1/4 complete front-end bundle (build-frontend-bundle.sh) -- the category bundles are cut from it"
  "$ROOT/tools/build-frontend-bundle.sh" "$WORK" "${RELOCK[@]}"
  FROM="$WORK/devenv-frontend-bundle-$STAMP"
  [ -d "$FROM" ] || FROM="$(ls -d "$WORK"/devenv-frontend-bundle-*/ 2>/dev/null | sort | tail -1)"
else
  log "1/4 complete front-end bundle: reusing $FROM"
  [ ${#RELOCK[@]} -eq 0 ] || die "--relock and --from-bundle together make no sense: relocking needs a fresh build"
fi
FROM="$(cd "${FROM:?no complete bundle found in $WORK}" && pwd)"
[ -f "$FROM/npm/MANIFEST.json" ] && [ -d "$FROM/raw" ] || die "$FROM is not a complete front-end bundle (no npm/MANIFEST.json or raw/)"
grep -q OMITTED "$FROM/BUNDLE-INFO.txt" && die "$FROM was built with --skip-browsers or --skip-vscode; build it in full"
cmp -s "$FROM/npm/pnpm-lock.yaml" "$STACK/frontend/pnpm-lock.yaml" \
  || die "$FROM was built from a different stack/frontend/pnpm-lock.yaml than this checkout's -- rebuild it (drop --from-bundle)"
( cd "$FROM" && sha256sum -c SHA256SUMS --quiet ) || die "$FROM fails its own SHA256SUMS -- rebuild it"
echo "  $(basename "$FROM"): checksums OK"

# Node for the planner: the build's toolchain if present, else unpacked from the bundle's own Node.
TOOLNODE="$WORK/.cache/node-v$NODE_VERSION"
if [ ! -x "$TOOLNODE/bin/node" ]; then mkdir -p "$TOOLNODE"
  tar -xJf "$FROM/raw/nodejs/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz" -C "$TOOLNODE" --strip-components=1; fi
export PATH="$TOOLNODE/bin:$PATH"

# ---------------------------------------------------------------- 2. the plan
log "2/4 plan: sheet rows -> statuses -> npm packages + files (sheet: $(basename "$SHEET"))"
mkdir -p "$WORK/.srf"; PLAN="$WORK/.srf/plan-$STAMP.json"
node "$ROOT/tools/srf-plan.mjs" --sheet "$SHEET" --map "$STACK/srf-components.tsv" \
  --lock "$STACK/frontend/pnpm-lock.yaml" --pm-lock "$STACK/package-managers/package-lock.json" \
  --bundle "$FROM" --out "$PLAN" || die "the plan stopped -- the STOP message above says what to fix (how-to: troubleshooting)"
# slug <TAB> status <TAB> anything-to-carry, in porting order
mapfile -t ALL < <(node -e 'for (const s of require(process.argv[1]).statuses) console.log([s.slug, s.status, s.tarballs.length + s.raw.length].join("\t"))' "$PLAN")
SLUGS=()
for line in "${ALL[@]}"; do IFS=$'\t' read -r slug status n <<<"$line"
  if [ ${#ONLY[@]} -gt 0 ]; then hit=0
    for o in "${ONLY[@]}"; do shopt -s nocasematch; [[ "$o" == "$slug" || "$o" == "$status" ]] && hit=1; shopt -u nocasematch; done
    [ $hit = 1 ] || continue; fi
  if [ "$n" = 0 ]; then echo "  $slug: nothing to carry (its rows come from elsewhere) -- no bundle"; continue; fi
  SLUGS+=("$slug"); done
if [ ${#ONLY[@]} -gt 0 ] && [ ${#SLUGS[@]} -eq 0 ]; then
  die "--only ${ONLY[*]} matched no status; the sheet has: $(printf '%s\n' "${ALL[@]}" | cut -f1 | paste -sd' ')"; fi

# ---------------------------------------------------------------- 3. one bundle per status
log "3/4 bundles: ${SLUGS[*]}"
for slug in "${SLUGS[@]}"; do
  NAME="devenv-frontend-$slug-$STAMP"   # named for what it is (compliance convention, 2026-09-08)
  OUT="$WORK/$NAME"; rm -rf "$OUT" "$OUT.tar"; mkdir -p "$OUT"
  node "$ROOT/tools/srf-emit.mjs" bundle "$PLAN" "$FROM" "$OUT" "$slug"
  ( cd "$OUT/npm" && sha256sum -c SHA256SUMS --quiet ) || die "$NAME: npm tarballs fail their checksums"
  cp -r "$ROOT/island" "$OUT/island"; rm -f "$OUT/island/devenv.conf" "$OUT/island/backend.versions.env"
  cp "$LEGACY_TOOLS/npm-load-package.sh" "$OUT/island/lib/"
  cp "$FROM/island/frontend.versions.env" "$OUT/island/"
  STATUS=$(node -p 'require(process.argv[1]).status' "$OUT/srf-bundle.json")
  cat > "$OUT/BUNDLE-INFO.txt" <<INFO
bundle:   $NAME
built:    $(date -u +%FT%TZ) on $(uname -sr)
status:   $STATUS   (the sheet's Approval Status column)
contents: $(node -e 'const b=require(process.argv[1]), m=require(process.argv[2]); console.log(`${b.rows.length} rows, ${m.count} npm tarballs (${(m.totalBytes/1e6).toFixed(1)} MB), ${b.raw.length} other files`)' "$OUT/srf-bundle.json" "$OUT/npm/MANIFEST.json")
cut from: $(basename "$FROM")  (sheet: $(basename "$SHEET"))
list:     SRF-CONTENTS.md      start with: island/README.md ("Bundles by SRF approval status")
INFO
  ( cd "$OUT" && find . -type f ! -name SHA256SUMS -printf '%P\n' | LC_ALL=C sort | xargs -d '\n' sha256sum > SHA256SUMS )
  tar -cf "$OUT.tar" -C "$WORK" "$NAME"
done

# ---------------------------------------------------------------- 4. summary
log "4/4 summary"
node "$ROOT/tools/srf-emit.mjs" summary "$PLAN" "$WORK/SRF-BUNDLES-$STAMP.md" devenv-frontend- "$STAMP" "${SLUGS[@]}"
for slug in "${SLUGS[@]}"; do n="$WORK/devenv-frontend-$slug-$STAMP"
  printf '  %-46s %8s   %s\n' "$(basename "$n").tar" "$(du -h "$n.tar" | cut -f1)" "$(sed -n 's/^status: *//p' "$n/BUNDLE-INFO.txt" | sed 's/   (.*//')"; done
echo "  summary: $WORK/SRF-BUNDLES-$STAMP.md"
echo "DONE"

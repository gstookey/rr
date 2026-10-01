#!/usr/bin/env bash
# upload-to-nexus.sh -- load an angular-upgrade-bundle's npm tarballs into a Nexus npm-hosted
# repository. Ships inside every bundle (copied there by build-transfer-bundle.sh).
# Created 2026-10-01 (Axium); rehearsed against Nexus 3.76.1 (legacy-shell-bundle-01 packet).
#
# Publishes each tarball with `npm publish` (the bytes are stored as delivered, so every lockfile's
# sha512 still matches) -- one package per job, its versions one at a time -- and then verifies that
# Nexus's npm metadata lists every version completely, repairing any that is not. Both rules were
# found by running against Nexus on 2026-10-01; npm-load-package.sh explains them. (An earlier draft
# used Nexus's components REST API: Nexus then keeps only ~10 metadata fields and drops `ng-update`,
# so `ng update` against it moves @angular/core alone.)
#
#   NEXUS_URL=http://nexus:8081 NPM_REPO=npm-hosted NEXUS_CREDENTIALS_FILE=~/.nexus-creds ./upload-to-nexus.sh [--through <rung>]
#
#   --through 17-18   upload only what the ladder needs up to and including that rung (17-18 ..
#                     21-22; v17-baseline for the starting surface). This is the staged upload of
#                     the 2026-09-04 plan: one cumulative transfer, then Nexus is filled one rung at
#                     a time, so a loose ^range elsewhere on the island cannot resolve ahead of the
#                     estate. Without it, everything in the bundle is uploaded.
#
#   NEXUS_URL               base URL of Nexus (no /repository/... suffix)
#   NPM_REPO                the npm HOSTED repository to write to (default: npm-hosted)
#   NEXUS_CREDENTIALS_FILE  a file holding one line, user:password, for an account that may write
#                           to that repository (never typed on the command line: shell history)
#
# Re-runnable: tarballs Nexus already serves are skipped, so an interrupted run just resumes and
# loading several rung bundles (or a delta) on top of each other is safe. Every run also checks that
# Nexus's npm metadata lists each version it holds, and repairs any it lost (npm-load-package.sh) --
# so re-running it over an earlier load also fixes that load. Prints a summary;
# anything other than FAILED=0 must be recorded. Logs: ./upload-logs/ next to the bundle.
set -euo pipefail
B="$(cd "$(dirname "$0")" && pwd)"            # the bundle directory
THROUGH=""; [ "${1:-}" = --through ] && THROUGH="${2:?--through needs a rung, e.g. 17-18}"
command -v node >/dev/null || { echo "STOP: node not found (any Node >= 18; the island workstations have it)"; exit 1; }
: "${NEXUS_URL:?set NEXUS_URL, e.g. http://nexus:8081}"; NEXUS_URL="${NEXUS_URL%/}"
NPM_REPO="${NPM_REPO:-npm-hosted}"
: "${NEXUS_CREDENTIALS_FILE:?set NEXUS_CREDENTIALS_FILE (a file with one line: user:password)}"
CREDS="$(head -n1 "$NEXUS_CREDENTIALS_FILE" | tr -d '\r\n')"; [[ "$CREDS" == *:* ]] || { echo "STOP: $NEXUS_CREDENTIALS_FILE must hold user:password"; exit 1; }
JOBS="${UPLOAD_JOBS:-6}"
LOGS="${UPLOAD_LOGDIR:-$PWD/upload-logs/$(basename "$B")}"; mkdir -p "$LOGS"
for c in curl sha256sum xargs tar npm; do command -v $c >/dev/null || { echo "STOP: $c not found"; exit 1; }; done

echo "== verifying the tarballs in this bundle against SHA256SUMS"
# --ignore-missing: a delta bundle's SHA256SUMS covers the whole merged pool, not just its own files
( cd "$B" && sha256sum -c SHA256SUMS --quiet --ignore-missing ) || { echo "STOP: checksum mismatch -- the transfer is corrupted; request re-delivery"; exit 1; }
echo "   $(ls "$B/tarballs" | wc -l) tarballs OK"

curl -fsS -o /dev/null "$NEXUS_URL/service/rest/v1/status" || { echo "STOP: Nexus is not answering at $NEXUS_URL"; exit 1; }
if curl -fsS -u "$CREDS" "$NEXUS_URL/service/rest/v1/system/eula" 2>/dev/null | grep -q '"accepted" *: *false'; then
  echo "STOP: this Nexus is Community Edition and its EULA is not accepted -- every upload would fail with HTTP 403. An administrator must accept it in the web UI first."; exit 1
fi
REG="$NEXUS_URL/repository/$NPM_REPO"

# MANIFEST.json maps each file to the registry URL it came from; the path after the host is the
# path Nexus serves it at (e.g. @angular/core/-/core-22.2.1.tgz).
node - "$B" "$THROUGH" > "$LOGS/paths.tsv" <<'JS'
const fs = require('fs'), path = require('path'); const [b, through] = process.argv.slice(2);
const order = ['v17', 'v18', 'v19', 'v20', 'v21', 'v22'];
const rungOf = { 'v17-baseline': 'v17', '17-18': 'v18', '18-19': 'v19', '19-20': 'v20', '20-21': 'v21', '21-22': 'v22' };
if (through && !rungOf[through]) { console.error('STOP: unknown rung ' + through + ' (v17-baseline, 17-18 .. 21-22)'); process.exit(1); }
const limit = through ? order.indexOf(rungOf[through]) : order.length;
for (const t of JSON.parse(fs.readFileSync(path.join(b, 'MANIFEST.json'), 'utf8')).tarballs) {
  if (!fs.existsSync(path.join(b, 'tarballs', t.file))) continue;
  const first = Math.min(...(t.rungs || ['v22']).map(r => order.indexOf(r)).filter(i => i >= 0));
  if (first > limit) continue;
  console.log(t.file + '\t' + t.url.replace(/^[a-z]+:\/\/[^/]+\//, ''));
}
JS
echo "== uploading $(wc -l < "$LOGS/paths.tsv") tarballs$([ -n "$THROUGH" ] && echo " (through rung $THROUGH)") -> $REG"
# One package per job (versions of a package go up one at a time, then its metadata is verified and
# repaired if Nexus dropped a version -- see npm-load-package.sh for why).
# npm publish needs the credentials in an npmrc: a private temporary one, deleted on exit.
NPMRC="$(mktemp)"; chmod 600 "$NPMRC"; trap 'rm -f "$NPMRC"' EXIT
printf '//%s/:_auth=%s\n' "${REG#*://}" "$(printf '%s' "$CREDS" | base64 | tr -d '\n')" > "$NPMRC"
export CREDS NEXUS_URL NPM_REPO NPMRC TARBALLS="$B/tarballs" PATHS="$LOGS/paths.tsv"
cut -f2 "$LOGS/paths.tsv" | sed 's#/-/.*##' | sort -u > "$LOGS/packages.txt"
xargs -P "$JOBS" -n1 "$B/npm-load-package.sh" < "$LOGS/packages.txt" > "$LOGS/upload.log"
n() { grep -c "^$1 " "$LOGS/upload.log" || true; }
up=$(n published); pr=$(n present); fl=$(n failed); rp=$(n repaired); ur=$(n unrepaired)
printf '   published=%s  already-present=%s  metadata-repaired=%s  FAILED=%s\n' "$up" "$pr" "$rp" "$((fl + ur))"
if [ "$fl" != 0 ] || [ "$ur" != 0 ]; then grep -E '^(failed|unrepaired) ' "$LOGS/upload.log" | head -20; echo "NOT DONE: record $LOGS/upload.log"; exit 1; fi
echo "== DONE: zero failures. Spot check: npm view @angular/core versions --registry $REG/"

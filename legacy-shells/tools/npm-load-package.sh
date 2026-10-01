#!/usr/bin/env bash
# npm-load-package.sh <package-name> -- load every version of ONE npm package from a bundle into a
# Nexus npm-hosted repository with `npm publish`, then make sure Nexus's package metadata lists each
# version COMPLETELY. Shared by upload-to-nexus.sh (Angular upgrade bundles) and load-nexus.sh
# (dev-environment bundles). Created 2026-10-01 (Axium); every rule below was found by running.
#
# WHY `npm publish` and not Nexus's components REST API: an upload through the components API makes
# Nexus build the package metadata (the "packument" npm resolves versions from) out of ~10 fields of
# the tarball's package.json -- it drops `ng-update` (Angular's package groups and migrations: `ng
# update @angular/core` then moves core alone and the next step fails on peers), `optionalDependencies`
# (platform binaries such as esbuild's), `bin`, `os`/`cpu` and more. `npm publish` sends the full
# manifest and Nexus keeps it (25-30 fields). Lockfile installs never notice the difference -- they
# fetch tarballs by URL -- which is how it hid; anything that RESOLVES versions does.
#
# WHY one version at a time: two versions of one package uploaded concurrently can make Nexus drop a
# version from that package's metadata (~5% of packages in a parallel load). Packages still load in
# parallel (the caller runs one job per package); within a package, versions go up in ascending order
# so the `latest` tag ends on the highest one.
#
# AND a verify pass: every version Nexus holds must be listed, with the metadata fields its own
# package.json has; one that is missing or incomplete (e.g. loaded earlier through the components
# API) is deleted and published again -- so re-running a loader over an earlier load repairs it.
#
# Overrides a tarball's own publishConfig: --registry (npm 10 gives CLI flags priority over
# publishConfig.registry -- verified with npm 10.9.2 on packages pointing at registry.npmjs.org and
# wombat-dressing-room) and --provenance=false (26 pool tarballs ask for provenance).
#
# Environment: NEXUS_URL, NPM_REPO, CREDS (user:password), NPMRC (an npm userconfig holding _auth for
# the repository -- the caller writes it), TARBALLS (dir), PATHS (TSV: file<TAB>registry path, e.g.
# @angular/cli/-/cli-18.2.21.tgz). Needs node + npm on PATH. Prints one line per version:
# published | present | failed | repaired | unrepaired.
set -uo pipefail
name="$1"; REG="$NEXUS_URL/repository/$NPM_REPO"; base="${name##*/}"
lines=$(awk -F'\t' -v n="$name/-/" 'index($2, n) == 1' "$PATHS" | sort -t$'\t' -k1,1V)
[ -n "$lines" ] || exit 0
head200() { [ "$(curl -s -o /dev/null -w '%{http_code}' -u "$CREDS" -I "$REG/$1")" = 200 ]; }
meta()    { curl -s -u "$CREDS" "$REG/${name/\//%2f}"; }
SEMVER="$(npm root -g)/npm/node_modules/semver"            # npm's own semver library
# An explicit dist-tag for every publish: npm 11 refuses to put "latest" on a version lower than one
# already published (found 2026-10-01 when a repair re-published an older version). "latest" only
# for the highest stable version, "previous" below it, "prerelease" for pre-releases.
tag_for() { meta | node -e '
    const s = require(process.argv[1]); const v = process.argv[2]; let pk = {};
    try { pk = JSON.parse(require("fs").readFileSync(0, "utf8")); } catch {}
    if (s.prerelease(v)) { console.log("prerelease"); process.exit(0); }
    const higher = Object.keys(pk.versions || {}).some(x => s.valid(x) && !s.prerelease(x) && s.gt(x, v));
    console.log(higher ? "previous" : "latest");' "$SEMVER" "$1"; }
verof()   { local t="${1##*/-/}"; t="${t#"$base"-}"; echo "${t%.tgz}"; }   # from the registry path
publish() { # <file> <registry path>
  npm publish "$TARBALLS/$1" --registry "$REG/" --userconfig "$NPMRC" --provenance=false \
    --ignore-scripts --tag "$(tag_for "$(verof "$2")")" --loglevel=error >/dev/null 2>&1; }
# complete <file> <tarball-basename>: 0 if the packument (stdin) lists this version with every
# resolution-relevant field the tarball's own package.json carries
complete() {   # (PJ = the tarball's package.json, exported by the loop below)
  node -e '
    const fs = require("fs"); const [tb] = process.argv.slice(1);
    let pk; try { pk = JSON.parse(fs.readFileSync(0, "utf8")); } catch { process.exit(1); }
    const own = JSON.parse(process.env.PJ || "{}");
    const v = Object.values(pk.versions || {}).find(x => (x.dist?.tarball || "").endsWith("/-/" + tb));
    if (!v) process.exit(1);
    for (const k of ["ng-update", "optionalDependencies", "peerDependenciesMeta", "bin", "os", "cpu"])
      if (own[k] !== undefined && v[k] === undefined) process.exit(2);
  ' "$2" <<< "$M"
}

while IFS=$'\t' read -r file path; do                       # 1. publish, one version at a time
  if head200 "$path"; then echo "present $file"; continue; fi
  publish "$file" "$path" && echo "published $file" || echo "failed $file"
done <<< "$lines"

M=$(meta)                                                   # 2. verify the metadata, repair gaps
while IFS=$'\t' read -r file path; do
  tb="${path##*/-/}"
  pj=$(tar -tzf "$TARBALLS/$file" 2>/dev/null | grep -m1 -E '^[^/]+/package\.json$')
  export PJ; PJ=$(tar -xzOf "$TARBALLS/$file" "$pj" 2>/dev/null)
  complete "$file" "$tb" && continue                        # listed and complete: fine
  head200 "$path" || continue                               # not in Nexus at all: already reported as failed
  ver="$(verof "$path")"
  q="repository=$NPM_REPO&format=npm&name=$base&version=$ver"; [[ "$name" == @* ]] && q="$q&group=${name%%/*}" && q="${q/group=@/group=}"
  # the component whose asset path is exactly this tarball (component ids sit at 4-space indent)
  id=$(curl -s -u "$CREDS" "$NEXUS_URL/service/rest/v1/search?$q" | awk -v p="\"/$path\"" '
        /^    "id" : / { gsub(/[",]/, "", $3); cur = $3 } index($0, "\"path\" : " p) { print cur; exit }')
  if [ -n "$id" ] && [ "$(curl -s -o /dev/null -w '%{http_code}' -u "$CREDS" -X DELETE "$NEXUS_URL/service/rest/v1/components/$id")" = 204 ] \
     && publish "$file" "$path"; then
    M=$(meta); complete "$file" "$tb" && echo "repaired $file" || echo "unrepaired $file"
  else echo "unrepaired $file"; fi
done <<< "$lines"

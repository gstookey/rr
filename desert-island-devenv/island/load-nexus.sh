#!/usr/bin/env bash
# load-nexus.sh -- load everything in THIS bundle into the Nexus hosted repositories.
# Created 2026-10-01; rehearsed against Nexus 3.96.4 (see packet). Run it from either bundle:
# it loads whichever of npm/, raw/, pypi/, maven/, images/ the bundle contains.
#
#   ./load-nexus.sh            verify the bundle, then load all of it
#   ./load-nexus.sh npm raw    load only those parts
#
# Needs an account with write access to the hosted repositories (NEXUS_CREDENTIALS_FILE).
# Re-runnable: anything already in Nexus is skipped, so an interrupted load just resumes.
# A summary at the end counts uploaded / already-present / FAILED per part; failures are listed
# in load-failures.txt. Anything other than zero failures is a problem to record and send out.
# Logs go to $DEVENV_LOGDIR (default ~/devenv-load-logs/<bundle>/), never into the bundle, so the
# media can be mounted read-only.
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"
need curl sha256sum
load_conf; load_creds
PARTS=("$@"); [ ${#PARTS[@]} -eq 0 ] && PARTS=(npm raw pypi maven images)
JOBS="${LOAD_JOBS:-6}"
LOGS="${DEVENV_LOGDIR:-$HOME/devenv-load-logs}/$(basename "$BUNDLE_DIR")"; mkdir -p "$LOGS"
FAILS="$LOGS/load-failures.txt"; : > "$FAILS"
verify_bundle
curl -fsS -o /dev/null "$NEXUS_URL/service/rest/v1/status" || die "Nexus is not answering at $NEXUS_URL"
# Community Edition refuses every upload until its EULA is accepted (see nexus-create-repos.sh).
if curl -fsS -u "$NEXUS_CREDS" "$NEXUS_URL/service/rest/v1/system/eula" 2>/dev/null | grep -q '"accepted" *: *false'; then
  die "Nexus Community Edition EULA is not accepted -- every upload would fail with HTTP 403. An administrator must accept it first (nexus-create-repos.sh --accept-eula, or the web UI)."
fi

# exists URL -> 0 if Nexus already serves it (HEAD 200)
exists() { [ "$(curl -s -o /dev/null -w '%{http_code}' -u "$NEXUS_CREDS" -I "$1")" = 200 ]; }
export -f exists
export NEXUS_CREDS NEXUS_URL FAILS NPM_REPO

summary() { # part uploaded present failed
  printf '  %-7s uploaded=%-6s already-present=%-6s FAILED=%s\n' "$1" "$2" "$3" "$4"; }
count() { grep -c "^$1 " "$2" 2>/dev/null || true; }

# ---- npm: `npm publish`, one package per job, its versions one at a time, then a metadata verify +
# repair pass (lib/npm-load-package.sh -- found 2026-10-01: Nexus's components API keeps only ~10
# metadata fields, and concurrent versions of one package can drop out of its metadata). The tarball
# bytes are stored as delivered, so every lockfile's sha512 still holds.
load_npm() {
  [ -d "$BUNDLE_DIR/npm/tarballs" ] || return 0
  log "npm -> $(repo_url "$NPM_REPO")"
  local res="$LOGS/load-npm.log"; : > "$res"
  # MANIFEST.json maps each file to its registry URL; the path after the host is the Nexus path.
  node_free_manifest_paths() { grep -oE '"(file|url)": "[^"]*"' "$BUNDLE_DIR/npm/MANIFEST.json" | cut -d'"' -f4 | paste - - ; }
  node_free_manifest_paths | while IFS=$'\t' read -r file url; do
    printf '%s\t%s\n' "$file" "${url#*://*/}"; done > "$LOGS/npm-paths.tsv"
  # One package per job: versions of a package go up one at a time, then its npm metadata is
  # verified and repaired if Nexus dropped a version (found 2026-10-01 -- see lib/npm-load-package.sh).
  [ -x "$HERE_LIB/npm-load-package.sh" ] || die "lib/npm-load-package.sh missing -- rebuild the bundle"
  if ! command -v npm >/dev/null; then             # npm publish needs npm: borrow the Node this bundle carries
    local nt nd; nt=$(ls "$BUNDLE_DIR"/raw/nodejs/*/node-*-linux-x64.tar.xz 2>/dev/null | sed -n 1p)
    [ -n "$nt" ] || die "npm not found on this machine, and this bundle carries no Node to borrow it from"
    nd="$(mktemp -d)"; tar -xJf "$nt" -C "$nd" --strip-components=1; export PATH="$nd/bin:$PATH"
    echo "  using the bundle's own Node $(node --version) / npm $(npm --version) to publish"
  fi
  local npmrc; npmrc="$(mktemp)"; chmod 600 "$npmrc"
  printf '//%s/:_auth=%s\n' "$(repo_url "$NPM_REPO" | sed -E 's#^[a-z]+://##')" "$(printf '%s' "$NEXUS_CREDS" | base64 | tr -d '\n')" > "$npmrc"
  cut -f2 "$LOGS/npm-paths.tsv" | sed 's#/-/.*##' | sort -u > "$LOGS/npm-packages.txt"
  CREDS="$NEXUS_CREDS" NPMRC="$npmrc" TARBALLS="$BUNDLE_DIR/npm/tarballs" PATHS="$LOGS/npm-paths.tsv" \
    xargs -P "$JOBS" -n1 "$HERE_LIB/npm-load-package.sh" < "$LOGS/npm-packages.txt" >> "$res"
  rm -f "$npmrc"
  grep -E '^(failed|unrepaired) ' "$res" | sed 's/^/npm /' >> "$FAILS" || true
  local rp; rp=$(count repaired "$res"); [ "$rp" != 0 ] && echo "  npm metadata repaired for $rp version(s) Nexus had dropped"
  summary npm "$(count published "$res")" "$(count present "$res")" "$(( $(count failed "$res") + $(count unrepaired "$res") ))"

}

# ---- raw: plain PUT, path preserved (raw/ is laid out exactly as it should appear in Nexus)
load_raw() {
  [ -d "$BUNDLE_DIR/raw" ] || return 0
  log "raw -> $(repo_url "$RAW_REPO")"
  local res="$LOGS/load-raw.log"; : > "$res"
  ( cd "$BUNDLE_DIR/raw" && find . -type f -printf '%P\n' ) | \
  BASE="$(repo_url "$RAW_REPO")" BD="$BUNDLE_DIR" xargs -P "$JOBS" -I{} bash -c '
    f="{}"; u="$BASE/$f"
    if exists "$u"; then echo "present $f"; exit 0; fi
    code=$(curl -s -o /dev/null -w "%{http_code}" -u "$NEXUS_CREDS" --upload-file "$BD/raw/$f" "$u")
    case "$code" in 200|201|204) echo "uploaded $f" ;; *) echo "failed $f HTTP $code"; echo "raw $f HTTP $code" >> "$FAILS" ;; esac
  ' >> "$res"
  summary raw "$(count uploaded "$res")" "$(count present "$res")" "$(count failed "$res")"
}

# ---- pypi: components API
load_pypi() {
  compgen -G "$BUNDLE_DIR/pypi/*.whl" >/dev/null || compgen -G "$BUNDLE_DIR/pypi/*.tar.gz" >/dev/null || return 0
  log "pypi -> $(repo_url "$PYPI_REPO")"
  local up=0 fail=0 f code
  for f in "$BUNDLE_DIR"/pypi/*.whl "$BUNDLE_DIR"/pypi/*.tar.gz; do [ -f "$f" ] || continue
    code=$(curl -s -o /dev/null -w '%{http_code}' -u "$NEXUS_CREDS" -X POST -F "pypi.asset=@$f" \
      "$NEXUS_URL/service/rest/v1/components?repository=$PYPI_REPO")
    case "$code" in 204) up=$((up+1)) ;; 400) up=$up ;; *) fail=$((fail+1)); echo "pypi $(basename "$f") HTTP $code" >> "$FAILS" ;; esac
  done
  summary pypi "$up" "-" "$fail"
}

# ---- maven: plain PUT of the Maven-layout tree (poms, jars, Gradle .module files, plugin markers)
load_maven() {
  [ -d "$BUNDLE_DIR/maven" ] || return 0
  log "maven -> $(repo_url "$MAVEN_REPO")"
  local res="$LOGS/load-maven.log"; : > "$res"
  ( cd "$BUNDLE_DIR/maven" && find . -type f -printf '%P\n' ) | \
  BASE="$(repo_url "$MAVEN_REPO")" BD="$BUNDLE_DIR" xargs -P "$JOBS" -I{} bash -c '
    f="{}"; u="$BASE/$f"
    if exists "$u"; then echo "present $f"; exit 0; fi
    code=$(curl -s -o /dev/null -w "%{http_code}" -u "$NEXUS_CREDS" --upload-file "$BD/maven/$f" "$u")
    case "$code" in 200|201|204) echo "uploaded $f" ;; *) echo "failed $f HTTP $code"; echo "maven $f HTTP $code" >> "$FAILS" ;; esac
  ' >> "$res"
  summary maven "$(count uploaded "$res")" "$(count present "$res")" "$(count failed "$res")"
}

# ---- images: skopeo (preferred, no daemon) else podman/docker load + tag + push
load_images() {
  [ -f "$BUNDLE_DIR/images/IMAGES.lock" ] || return 0
  log "images -> $DOCKER_REGISTRY"
  local user="${NEXUS_CREDS%%:*}" pass="${NEXUS_CREDS#*:}" tool="" up=0 present=0 fail=0
  local scheme=https; [ "$DOCKER_REGISTRY_INSECURE" = true ] && scheme=http
  if command -v skopeo >/dev/null; then tool=skopeo
  elif command -v podman >/dev/null; then tool=podman
  elif command -v docker >/dev/null; then tool=docker
  else die "need skopeo, podman or docker to load images (skopeo and podman are on the RHEL 9 media)"; fi
  local tlsflag=""; [ "$DOCKER_REGISTRY_INSECURE" = true ] && tlsflag="--dest-tls-verify=false"
  if [ "$tool" != skopeo ]; then
    local ptls=""; [ "$tool" = podman ] && [ "$DOCKER_REGISTRY_INSECURE" = true ] && ptls="--tls-verify=false"
    printf '%s' "$pass" | $tool login $ptls -u "$user" --password-stdin "$DOCKER_REGISTRY" >/dev/null || die "$tool login to $DOCKER_REGISTRY failed"
  fi
  # IMAGES.lock columns: archive  source-ref  target-path  digest
  while read -r archive src target digest; do
    [[ -z "$archive" || "$archive" == \#* ]] && continue
    local dest="$DOCKER_REGISTRY/$target"
    # Tags are write-once in the hosted repository: a re-push is refused ("blob upload invalid"),
    # so ask the registry API first and skip what is already there.
    if [ "$(curl -s -o /dev/null -w '%{http_code}' -I -u "$NEXUS_CREDS" \
          -H 'Accept: application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.manifest.v1+json, application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.index.v1+json' \
          "$scheme://$DOCKER_REGISTRY/v2/${target%:*}/manifests/${target##*:}")" = 200 ]; then
      present=$((present+1)); continue; fi
    case $tool in
      skopeo) skopeo copy --quiet $tlsflag --dest-creds "$user:$pass" "docker-archive:$BUNDLE_DIR/images/$archive" "docker://$dest" ;;
      *) ref=$($tool load -i "$BUNDLE_DIR/images/$archive" | sed -n 's/^Loaded image[^:]*: //p' | tail -1)
         $tool tag "$ref" "$dest" && $tool push ${ptls:-} "$dest" >/dev/null ;;
    esac && { up=$((up+1)); echo "  $dest  ($digest)"; } || { fail=$((fail+1)); echo "images $target push failed" >> "$FAILS"; }
  done < "$BUNDLE_DIR/images/IMAGES.lock"
  summary images "$up" "$present" "$fail"
}

log "loading: ${PARTS[*]}"
for p in "${PARTS[@]}"; do case "$p" in
  npm) load_npm ;; raw) load_raw ;; pypi) load_pypi ;; maven) load_maven ;; images) load_images ;;
  *) die "unknown part: $p" ;; esac; done

# The island scripts themselves go to raw too, so other workstations can fetch them from Nexus.
if [ -d "$BUNDLE_DIR/raw" ] || [ -d "$BUNDLE_DIR/maven" ]; then
  b="$(basename "$BUNDLE_DIR")"
  ( cd "$ISLAND_DIR" && find . -type f ! -name devenv.conf -printf '%P\n' ) | while read -r f; do
    curl -s -o /dev/null -u "$NEXUS_CREDS" --upload-file "$ISLAND_DIR/$f" "$(repo_url "$RAW_REPO")/devenv-scripts/$b/island/$f" || true; done
fi

if [ -s "$FAILS" ]; then
  log "FINISHED WITH FAILURES -- $(wc -l < "$FAILS") item(s), listed in $FAILS. Re-run once; anything still failing: record it."
  exit 1
fi
log "FINISHED: zero failures."

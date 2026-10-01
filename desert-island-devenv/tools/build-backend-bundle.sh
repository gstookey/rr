#!/usr/bin/env bash
# build-backend-bundle.sh -- assemble the BACK-END transfer bundle for the air-gapped RHEL 9
# development network, on an internet-connected Linux x64 staging machine.
# Created 2026-10-01 (Axium). Rehearsal results: docs/design/packets/desert-island-devenv-01-design-packet/.
#
# WHAT IT PRODUCES  <workdir>/devenv-backend-bundle-<date>.tar containing:
#   maven/    a Maven-layout repository of EVERY artifact the harvest build resolved: Spring Boot
#             4.1.1 starters, Testcontainers, Cucumber, Lombok, Jackson, the Gradle plugins (with
#             their plugin-marker POMs) and the tool jars Checkstyle / PMD / JaCoCo / Spotless
#             fetch lazily at task time                                 -> Nexus maven-hosted
#   raw/      binaries, laid out as they go into Nexus raw-hosted:
#               temurin/  JDK tarball        gradle/distributions/  Gradle zip (wrapper target)
#               eclipse/  Eclipse IDE        helm/  kubectl/        CLI tools
#   images/   container images saved as docker-archive tars + IMAGES.lock (tag -> digest)
#                                                                       -> Nexus docker-hosted
#   island/   load-nexus.sh, install-backend-workstation.sh, Gradle init script, templates
#   SHA256SUMS every file in the bundle -- verify this first on the island
#
# HOW THE MAVEN SET IS FOUND: stack/backend is a small Spring Boot project that declares every
# library and tool on the stack list. The script builds it (compile, tests incl. a Cucumber
# scenario, Checkstyle, PMD, JaCoCo, Spotless, bootJar) with a FRESH Gradle home, using the
# pinned JDK and Gradle it just downloaded, then converts that Gradle cache into Maven layout.
# A successful build is the proof that the set is complete for that build.
#
# PREREQUISITES (staging machine): Linux x64, bash, curl, tar, gzip, unzip, sha256sum,
#   sha512sum; docker OR podman (for images; or pass --skip-images). Java/Gradle NOT required.
#   ~20 GB free disk (measured): <workdir> needs ~8 GB (download cache + output + the .tar), and
#   the container engine keeps its OWN unpacked copy of every image (~9 GB; selenium alone is
#   3.3 GB) -- afterwards `docker image prune -a` returns it. 20-60 minutes, bandwidth-bound.
#   Behind a proxy: HTTPS_PROXY is translated for Gradle automatically; if the proxy re-signs
#   TLS, also export JAVA_TOOL_OPTIONS=-Djavax.net.ssl.trustStore=<store with its CA>.
#
# Docker Hub limits ANONYMOUS pulls per IP (HTTP 429). Run `docker login` (any free account)
#   on the staging machine first; pulls are retried with back-off either way. Or set
#   DOCKERHUB_MIRROR=mirror.gcr.io (or your organisation's pull-through cache) to pull Docker Hub
#   images through it: the content and digests are identical, IMAGES.lock records the mirror,
#   and the images keep their Docker Hub names.
#
# USAGE   build-backend-bundle.sh <workdir> [--skip-images] [--skip-eclipse] [--keep-gradle-home] [--refresh-images]
#   --refresh-images    re-pull every image. By default an image already saved by a previous run
#                       (same reference, recorded with its digest) is reused without pulling, so a
#                       re-cut needs neither the network nor the engine's disk for it. Floating
#                       tags (e.g. selenium "latest") only move when you pass this.
#   --keep-gradle-home  reuse the previous run's Gradle cache (faster iteration). The default
#                       starts EMPTY so nothing stale from an earlier pin set is bundled --
#                       always build the bundle you actually ship without this flag.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STACK="$ROOT/stack"
WORK="${1:?usage: build-backend-bundle.sh <workdir> [--skip-images] [--skip-eclipse] [--keep-gradle-home]}"; shift
SKIP_IMAGES=0; SKIP_ECLIPSE=0; KEEP_GH=0; REFRESH_IMAGES=0
for a in "$@"; do case "$a" in --skip-images) SKIP_IMAGES=1 ;; --skip-eclipse) SKIP_ECLIPSE=1 ;; --keep-gradle-home) KEEP_GH=1 ;; --refresh-images) REFRESH_IMAGES=1 ;;
  *) echo "unknown option $a"; exit 2 ;; esac; done

log() { printf '\n== %s\n' "$*"; }
die() { printf 'ABORT: %s\n' "$*" >&2; exit 1; }
for c in curl tar gzip unzip sha256sum sha512sum; do command -v "$c" >/dev/null || die "missing command: $c"; done
[ "$(uname -s)-$(uname -m)" = "Linux-x86_64" ] || die "run on Linux x86_64 (the island's platform)"
# shellcheck disable=SC1091
source "$STACK/backend.env"
STAMP=$(date +%F); NAME="devenv-backend-bundle-$STAMP"   # named for what it is (compliance convention)
OUT="$WORK/$NAME"; CACHE="$WORK/.cache"; FILES="$CACHE/files"; RAW="$OUT/raw"
# The output is assembled FRESH every run (only what the current pins name can end up in it);
# downloads and saved images persist in $CACHE, so a re-run fetches nothing it already has.
rm -rf "$OUT" "$OUT.tar"; mkdir -p "$OUT" "$FILES"
place() { mkdir -p "$(dirname "$2")"; ln -f "$1" "$2" 2>/dev/null || cp -p "$1" "$2"; }
fetch() { local c="$FILES/${2#"$OUT"/}"
  if [ ! -s "$c" ]; then mkdir -p "$(dirname "$c")"
    curl -fsSL --retry 4 --retry-delay 3 -o "$c.part" "$1" || die "download failed: $1"; mv "$c.part" "$c"; fi
  place "$c" "$2"; }
check() { echo "$2  $3" | "$1" -c --quiet - || { rm -f "$3" "$FILES/${3#"$OUT"/}"; die "$1 mismatch: $3"; }; }

# ---------------------------------------------------------------- 1. JDK
log "1/7 Temurin $TEMURIN_RELEASE"
V="${TEMURIN_RELEASE#jdk-}"; FV="${V/+/_}"
JT="OpenJDK${TEMURIN_FEATURE}U-jdk_x64_linux_hotspot_${FV}.tar.gz"
JB="https://github.com/adoptium/temurin${TEMURIN_FEATURE}-binaries/releases/download/${TEMURIN_RELEASE/+/%2B}"
JD="$RAW/temurin/$V"
fetch "$JB/$JT.sha256.txt" "$JD/$JT.sha256.txt"; fetch "$JB/$JT" "$JD/$JT"
check sha256sum "$(awk '{print $1}' "$JD/$JT.sha256.txt")" "$JD/$JT"
JH="$CACHE/jdk-$V"; [ -x "$JH/bin/java" ] || { mkdir -p "$JH"; tar -xzf "$JD/$JT" -C "$JH" --strip-components=1; }
"$JH/bin/java" -version 2>&1 | head -1

# ---------------------------------------------------------------- 2. Gradle distribution
log "2/7 Gradle $GRADLE_VERSION"
GZ="gradle-$GRADLE_VERSION-bin.zip"; GD="$RAW/gradle/distributions"
fetch "https://services.gradle.org/distributions/$GZ.sha256" "$GD/$GZ.sha256"
fetch "https://services.gradle.org/distributions/$GZ" "$GD/$GZ"
check sha256sum "$(cat "$GD/$GZ.sha256")" "$GD/$GZ"
GH_DIST="$CACHE/gradle-$GRADLE_VERSION"; [ -x "$GH_DIST/bin/gradle" ] || unzip -qo "$GD/$GZ" -d "$CACHE"

# ---------------------------------------------------------------- 3. harvest build -> Maven layout
log "3/7 harvest build (fresh Gradle home) -> Maven repository layout"
HG="$CACHE/gradle-user-home"; [ "$KEEP_GH" = 1 ] || rm -rf "$HG"; mkdir -p "$HG"
SRC="$CACHE/harvest-src"; rm -rf "$SRC"; cp -r "$STACK/backend" "$SRC"     # never build in the repo tree
GOPTS="-Dorg.gradle.daemon=false"
if [ -n "${HTTPS_PROXY:-${https_proxy:-}}" ] && [[ "${JAVA_TOOL_OPTIONS:-} ${GRADLE_OPTS:-}" != *proxyHost* ]]; then
  p="${HTTPS_PROXY:-$https_proxy}"; p="${p#*://}"; p="${p#*@}"; p="${p%%/*}"
  GOPTS="$GOPTS -Dhttps.proxyHost=${p%%:*} -Dhttps.proxyPort=${p##*:} -Dhttp.proxyHost=${p%%:*} -Dhttp.proxyPort=${p##*:}"
fi
# Up to 3 attempts: public repositories rate-limit (HTTP 429) bulk downloads, and the Gradle
# cache persists between attempts, so each retry only fetches what is still missing.
ok=0
for attempt in 1 2 3; do
  ( cd "$SRC" && JAVA_HOME="$JH" GRADLE_USER_HOME="$HG" GRADLE_OPTS="$GOPTS" \
      "$GH_DIST/bin/gradle" --no-daemon --console=plain spotlessApply build resolveAll bootJar ) \
    > "$CACHE/harvest-build.log" 2>&1 && { ok=1; break; }
  if grep -qE 'status code (429|5[0-9][0-9])|Could not (GET|HEAD)|Read timed out|Connection reset' "$CACHE/harvest-build.log" && [ $attempt -lt 3 ]; then
    echo "  attempt $attempt hit a network/rate-limit error; retrying in $((attempt*60))s"; sleep $((attempt*60))
  else break; fi
done
[ $ok = 1 ] || { tail -40 "$CACHE/harvest-build.log"; die "harvest build failed (full log: $CACHE/harvest-build.log)"; }
grep -E 'BUILD SUCCESSFUL|tests completed|Total time' "$CACHE/harvest-build.log" || true
# Test evidence: the Cucumber scenario and unit tests must have RUN, not merely compiled.
TR="$SRC/build/test-results/test"; [ -d "$TR" ] || die "no test results -- tests did not run"
sumattr() { grep -ho "$1=\"[0-9]*\"" "$TR"/*.xml | cut -d'"' -f2 | awk '{s+=$1} END{print s+0}'; }
TESTS=$(sumattr tests); FAILED=$(( $(sumattr failures) + $(sumattr errors) ))
echo "harvest tests: $TESTS run, $FAILED failed"; [ "$FAILED" = 0 ] && [ "$TESTS" -ge 3 ] || die "harvest tests did not pass"

MV="$OUT/maven"; rm -rf "$MV"; mkdir -p "$MV"
FILES2="$HG/caches/modules-2/files-2.1"
( cd "$FILES2" && find . -mindepth 5 -maxdepth 5 -type f -printf '%P\n' ) | while IFS=/ read -r g a v h f; do
  d="$MV/${g//.//}/$a/$v"; mkdir -p "$d"; cp -p "$FILES2/$g/$a/$v/$h/$f" "$d/$f"; done
( cd "$MV" && find . -type f -printf '%P\n' | LC_ALL=C sort | xargs -d '\n' sha256sum > ../maven-SHA256SUMS ) && mv "$OUT/maven-SHA256SUMS" "$MV/SHA256SUMS"
GAVS=$(cd "$MV" && find . -name '*.pom' | wc -l)
echo "maven: $GAVS POMs, $(find "$MV" -type f | wc -l) files, $(du -sh "$MV" | cut -f1)"

# ---------------------------------------------------------------- 4. Eclipse
if [ "$SKIP_ECLIPSE" = 0 ]; then
  log "4/7 Eclipse IDE $ECLIPSE_RELEASE ($ECLIPSE_PACKAGE)"
  ET="eclipse-$ECLIPSE_PACKAGE-$ECLIPSE_RELEASE-R-linux-gtk-x86_64.tar.gz"
  EB="https://download.eclipse.org/technology/epp/downloads/release/$ECLIPSE_RELEASE/R"
  fetch "$EB/$ET.sha512" "$RAW/eclipse/$ECLIPSE_RELEASE/$ET.sha512"; fetch "$EB/$ET" "$RAW/eclipse/$ECLIPSE_RELEASE/$ET"
  check sha512sum "$(awk '{print $1}' "$RAW/eclipse/$ECLIPSE_RELEASE/$ET.sha512")" "$RAW/eclipse/$ECLIPSE_RELEASE/$ET"
else log "4/7 SKIPPED Eclipse (--skip-eclipse)"; ET=""; fi

# ---------------------------------------------------------------- 5. Helm + kubectl
log "5/7 Helm $HELM_VERSION, kubectl $KUBECTL_VERSION"
HT="helm-$HELM_VERSION-linux-amd64.tar.gz"
fetch "https://get.helm.sh/$HT.sha256sum" "$RAW/helm/$HELM_VERSION/$HT.sha256sum"; fetch "https://get.helm.sh/$HT" "$RAW/helm/$HELM_VERSION/$HT"
check sha256sum "$(awk '{print $1}' "$RAW/helm/$HELM_VERSION/$HT.sha256sum")" "$RAW/helm/$HELM_VERSION/$HT"
KD="$RAW/kubectl/$KUBECTL_VERSION/linux/amd64"
fetch "https://dl.k8s.io/release/$KUBECTL_VERSION/bin/linux/amd64/kubectl.sha256" "$KD/kubectl.sha256"
fetch "https://dl.k8s.io/release/$KUBECTL_VERSION/bin/linux/amd64/kubectl" "$KD/kubectl"
check sha256sum "$(cat "$KD/kubectl.sha256")" "$KD/kubectl"
echo "  NOTE: kubectl $KUBECTL_VERSION is a placeholder -- it must be within one minor of the island cluster"

# ---------------------------------------------------------------- 6. container images
if [ "$SKIP_IMAGES" = 0 ]; then
  log "6/7 container images (linux/amd64)"
  CT=""; command -v docker >/dev/null && CT=docker; [ -z "$CT" ] && command -v podman >/dev/null && CT=podman
  [ -n "$CT" ] || die "need docker or podman to fetch images (or pass --skip-images)"
  mkdir -p "$OUT/images"; LOCK="$OUT/images/IMAGES.lock"
  echo "# archive  source-reference  nexus-target  digest   (built $(date -u +%FT%TZ) with $CT)" > "$LOCK"
  LAST="$CACHE/images/IMAGES.last"; mkdir -p "$CACHE/images"; touch "$LAST"
  grep -vE '^\s*(#|$)' "$STACK/images.txt" | awk '{print $1}' | while read -r ref; do
    target="${ref#*/}"; target="${target#library/}"                   # docker.io/library/postgres:18.6 -> postgres:18.6
    archive="$(echo "$target" | tr '/:' '__').tar"
    prev=$(awk -v r="$ref" '$2==r' "$LAST" | tail -1)
    if [ "$REFRESH_IMAGES" = 0 ] && [ -n "$prev" ]; then
      read -r archive _ target digest _ <<< "$prev"
      if [ -s "$CACHE/images/$archive@${digest#sha256:}" ]; then
        place "$CACHE/images/$archive@${digest#sha256:}" "$OUT/images/$archive"; echo "$prev" >> "$LOCK"
        echo "  $ref  $digest  (cached -- --refresh-images to re-pull)"; continue
      fi
    fi
    src="$ref"
    if [ -n "${DOCKERHUB_MIRROR:-}" ] && [[ "$ref" == docker.io/* ]]; then src="$DOCKERHUB_MIRROR/${ref#docker.io/}"; fi
    for attempt in 1 2 3 4; do $CT pull --platform linux/amd64 "$src" >/dev/null && break
      [ $attempt = 4 ] && die "pull failed: $ref (Docker Hub rate limit? run 'docker login' and re-run)"
      echo "  pull of $ref failed (attempt $attempt); retrying in $((attempt*90))s"; sleep $((attempt*90)); done
    [ "$src" = "$ref" ] || $CT tag "$src" "$ref"
    digest=$($CT image inspect --format '{{index .RepoDigests 0}}' "$src" | sed 's/.*@//')
    IC="$CACHE/images/$archive@${digest#sha256:}"; mkdir -p "$CACHE/images"   # cache keyed by digest
    if [ ! -s "$IC" ]; then
      if [ "$CT" = docker ]; then docker save --platform linux/amd64 -o "$IC.part" "$ref" 2>/dev/null \
                                 || docker save -o "$IC.part" "$ref"
      else podman save --format docker-archive -o "$IC.part" "$ref"; fi
      mv "$IC.part" "$IC"
    fi
    place "$IC" "$OUT/images/$archive"
    printf '%s  %s  %s  %s%s\n' "$archive" "$ref" "$target" "$digest" "$([ "$src" = "$ref" ] || echo "  # pulled via ${DOCKERHUB_MIRROR}")" >> "$LOCK"
    echo "  $ref  $digest  ($(du -h "$OUT/images/$archive" | cut -f1))"
  done
  grep -v '^#' "$LOCK" > "$LAST.new" && mv "$LAST.new" "$LAST"
else log "6/7 SKIPPED container images (--skip-images)"; fi

# ---------------------------------------------------------------- 7. island scripts + checksums + tar
log "7/7 island scripts, checksums, archive"
rm -rf "$OUT/island"; cp -r "$ROOT/island" "$OUT/island"; rm -f "$OUT/island/devenv.conf" "$OUT/island/frontend.versions.env"
cat > "$OUT/island/backend.versions.env" <<VERS
TEMURIN_VERSION=$V
TEMURIN_TARBALL=$JT
GRADLE_VERSION=$GRADLE_VERSION
ECLIPSE_RELEASE=$ECLIPSE_RELEASE
ECLIPSE_TARBALL=$ET
HELM_VERSION=$HELM_VERSION
KUBECTL_VERSION=$KUBECTL_VERSION
LOMBOK_VERSION=$(grep -E '^lombok *=' "$STACK/backend/gradle/libs.versions.toml" | cut -d'"' -f2)
VERS
# The harvest project ships too: prove-install.sh rebuilds it on the island against Nexus alone.
mkdir -p "$OUT/island/templates"; cp -r "$STACK/backend" "$OUT/island/templates/harvest-project"
rm -rf "$OUT/island/templates/harvest-project/build" "$OUT/island/templates/harvest-project/.gradle"
cat > "$OUT/BUNDLE-INFO.txt" <<INFO
bundle:   $NAME
built:    $(date -u +%FT%TZ) on $(uname -sr)
jdk:      Temurin $V   gradle: $GRADLE_VERSION   eclipse: $([ -n "$ET" ] && echo "$ECLIPSE_RELEASE ($ECLIPSE_PACKAGE)" || echo OMITTED)
helm:     $HELM_VERSION   kubectl: $KUBECTL_VERSION (placeholder -- match the cluster)
maven:    $GAVS POMs, $(du -sh "$MV" | cut -f1)   harvest tests: $TESTS run, $FAILED failed
images:   $([ "$SKIP_IMAGES" = 1 ] && echo OMITTED || echo "$(grep -vc '^#' "$OUT/images/IMAGES.lock") images")
start with: island/README.md
INFO
( cd "$OUT" && find . -type f ! -name SHA256SUMS -printf '%P\n' | LC_ALL=C sort | xargs -d '\n' sha256sum > SHA256SUMS )
tar -cf "$OUT.tar" -C "$WORK" "$NAME"
echo; cat "$OUT/BUNDLE-INFO.txt"; echo; ls -l "$OUT.tar"; du -sh "$OUT"/* | sort -h
echo "DONE: $OUT.tar"

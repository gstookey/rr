#!/usr/bin/env bash
# prove-install.sh -- the acceptance test. Created 2026-10-01; rehearsed (see packet).
# Proves that NEXUS, not some local cache, can supply a full build -- the mistake the earlier
# day-one rehearsal caught: a warm npm cache let an install "pass" against an EMPTY registry.
# So every check here runs with a brand-new, empty cache directory.
#
#   ./prove-install.sh frontend   # npm ci of the whole bundled stack from Nexus, then
#                                 # Angular CLI, Prisma (engine via the Nexus mirror), Cypress
#                                 # (binary from the local zip) and Playwright report in
#   ./prove-install.sh backend    # builds the bundled harvest project (Spring Boot 4.1, tests
#                                 # incl. Cucumber, Checkstyle, PMD, JaCoCo, Spotless) from Nexus,
#                                 # then pulls one image from the Nexus docker registry
#
# Run as a developer AFTER install-*-workstation.sh (system + user). Prints PASS/FAIL per check.
set -uo pipefail
source "$(dirname "$0")/lib/common.sh"
load_conf
WHAT="${1:?usage: prove-install.sh frontend|backend}"
T="$(mktemp -d "${TMPDIR:-/tmp}/devenv-proof.XXXXXX")"
pass=0; fail=0
ok()  { echo "PASS  $*"; pass=$((pass+1)); }
bad() { echo "FAIL  $*"; fail=$((fail+1)); }
step() { local d="$1"; shift; if "$@" >> "$T/proof.log" 2>&1; then ok "$d"; else bad "$d  (see $T/proof.log)"; fi; }

frontend() {
  [ -f /etc/profile.d/devenv-frontend.sh ] && source /etc/profile.d/devenv-frontend.sh
  need node npm
  cp "$BUNDLE_DIR/npm/package.json" "$BUNDLE_DIR/npm/package-lock.json" "$T/" 2>/dev/null \
    || { curl -fsSL -o "$T/package.json" "$(repo_url "$RAW_REPO")/devenv-scripts/package.json" || true; }
  [ -f "$T/package-lock.json" ] || die "no npm/package-lock.json next to this script -- run from an extracted front-end bundle"
  echo "node $(node --version)  npm $(npm --version)  registry $(npm config get registry)"
  mkdir -p "$T/empty-cache"
  [ "$(find "$T/empty-cache" -type f | wc -l)" = 0 ] && ok "npm cache for this proof starts EMPTY" || bad "cache not empty"
  ( cd "$T" && step "npm ci of $(grep -c '"resolved"' package-lock.json) locked packages from Nexus (empty cache)" \
      npm ci --cache "$T/empty-cache" --no-audit --no-fund )
  cd "$T" || return
  step "Angular CLI runs"            npx --no-install ng version
  step "TypeScript is 6.0.x"         sh -c 'npx --no-install tsc --version | grep -q "Version 6\.0\."'
  step "Prisma CLI + schema engine"  npx --no-install prisma --version
  step "Cypress binary installed"    npx --no-install cypress version --component binary
  step "Playwright browsers found"   sh -c 'ls "$PLAYWRIGHT_BROWSERS_PATH" | grep -q chromium'
  step "Playwright launches Chromium headless" node -e '
    require("playwright-core").chromium.launch().then(b => b.close()).catch(e => { console.error(e.message); process.exit(1) })'
  step "uv runs"                     uv --version
  if command -v python3.12 >/dev/null; then ok "python3.12 present ($(python3.12 --version 2>&1))"
  else bad "python3.12 missing -- dnf install python3.12 (RHEL 9 AppStream)"; fi
}

backend() {
  [ -f /etc/profile.d/devenv-backend.sh ] && source /etc/profile.d/devenv-backend.sh
  need java gradle
  [ -f "$HOME/.gradle/init.d/devenv-nexus.init.gradle.kts" ] || die "Gradle init script missing -- run: install-backend-workstation.sh user"
  echo "$(java -version 2>&1 | head -1)  /  gradle $(gradle --version 2>/dev/null | sed -n 's/^Gradle //p')"
  cp -r "$ISLAND_DIR/templates/harvest-project" "$T/project"
  mkdir -p "$T/gradle-home/init.d"
  cp "$HOME/.gradle/init.d/devenv-nexus.init.gradle.kts" "$T/gradle-home/init.d/"   # empty Gradle cache + the Nexus redirect
  ok "Gradle home for this proof starts EMPTY (only the Nexus init script)"
  ( cd "$T/project" && step "harvest build from Nexus: compile, tests (Cucumber + Spring context), Checkstyle, PMD, JaCoCo, Spotless, bootJar" \
      env GRADLE_USER_HOME="$T/gradle-home" gradle --no-daemon --console=plain spotlessApply build bootJar )
  local rt=""; for c in podman docker; do command -v $c >/dev/null && { rt=$c; break; }; done
  local tls=""; [ "$DOCKER_REGISTRY_INSECURE" = true ] && tls="--tls-verify=false"
  if [ -n "$rt" ]; then
    [ "$rt" = docker ] && tls=""
    step "$rt pulls postgres:18.6 from $DOCKER_REGISTRY" $rt pull $tls "$DOCKER_REGISTRY/postgres:18.6"
  elif command -v skopeo >/dev/null; then
    # No container runtime (e.g. a headless build agent): still prove the registry serves every
    # layer, by copying the image to a directory.
    step "registry serves postgres:18.6 (skopeo copy; no container runtime on this machine)" \
      skopeo copy --quiet ${tls/--tls-verify/--src-tls-verify} "docker://$DOCKER_REGISTRY/postgres:18.6" "dir:$T/postgres-image"
    echo "NOTE  Testcontainers needs podman or docker -- dnf install podman (RHEL 9 media)"
  else bad "no podman, docker or skopeo -- dnf install podman skopeo (RHEL 9 media)"; fi
}

case "$WHAT" in frontend) frontend ;; backend) backend ;; *) die "frontend or backend" ;; esac
echo; echo "RESULT: $pass passed, $fail failed   (work dir: $T)"
[ "$fail" = 0 ] && echo "GREEN -- reproducible from Nexus alone." || echo "NOT GREEN -- record every FAIL line and $T/proof.log."
[ "$fail" = 0 ]

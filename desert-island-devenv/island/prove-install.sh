#!/usr/bin/env bash
# prove-install.sh -- the acceptance test. Created 2026-10-01; rehearsed (see packet).
# Proves that NEXUS, not some local cache, can supply a full build -- the mistake the earlier
# day-one rehearsal caught: a warm npm cache let an install "pass" against an EMPTY registry.
# So every check here runs with a brand-new, empty cache directory.
#
#   ./prove-install.sh frontend   # pnpm install of the whole example stack from Nexus (and an npm
#                                 # install, since both package managers are supported), then
#                                 # Angular CLI, Prisma (engine via the Nexus mirror), Cypress
#                                 # (binary from the local zip) and Playwright report in
#   ./prove-install.sh backend    # builds the bundled harvest project (Spring Boot 4.1, tests
#                                 # incl. Cucumber, Checkstyle, PMD, JaCoCo, Spotless) from Nexus;
#                                 # with Docker: also a real Testcontainers Postgres, a docker pull,
#                                 # and a kind cluster whose node AND pod images come from Nexus
#                                 # (SKIP_KIND=1 to skip the cluster)
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
  need node npm pnpm
  [ -f "$BUNDLE_DIR/npm/pnpm-lock.yaml" ] || die "no npm/pnpm-lock.yaml next to this script -- run from an extracted front-end bundle"
  cp "$BUNDLE_DIR/npm/package.json" "$BUNDLE_DIR/npm/pnpm-lock.yaml" "$T/"
  echo "node $(node --version)  npm $(npm --version)  pnpm $(pnpm --version)  registry $(npm config get registry)"
  mkdir -p "$T/empty-store" "$T/empty-npm-cache"
  [ "$(find "$T/empty-store" "$T/empty-npm-cache" -type f | wc -l)" = 0 ] && ok "pnpm store and npm cache for this proof start EMPTY" || bad "store/cache not empty"
  # The example's preinstall runs `npx only-allow pnpm`, so this also exercises npx -> Nexus.
  ( cd "$T" && step "pnpm install --frozen-lockfile: $(grep -c 'resolution:' pnpm-lock.yaml) locked packages from Nexus (empty store)" \
      env npm_config_cache="$T/empty-npm-cache" pnpm install --frozen-lockfile --store-dir "$T/empty-store" )
  cd "$T" || return
  step "Angular CLI runs"            pnpm exec ng version
  step "TypeScript is 6.0.x"         sh -c 'pnpm exec tsc --version | grep -q "Version 6\.0\."'
  step "Prisma CLI + schema engine"  pnpm exec prisma --version
  step "Cypress binary installed"    pnpm exec cypress version --component binary
  step "Playwright browsers found"   sh -c 'ls "$PLAYWRIGHT_BROWSERS_PATH" | grep -q chromium'
  step "Playwright launches Chromium headless" node -e '
    require("@playwright/test").chromium.launch().then(b => b.close()).catch(e => { console.error(e.message); process.exit(1) })'
  # npm is the other supported package manager: prove it resolves from Nexus with its own empty cache.
  step "npm installs from Nexus too (empty cache)" \
    npm install --prefix "$T/npm-check" --cache "$T/npm-check-cache" --no-save --no-package-lock only-allow
  step "uv runs"                     uv --version
  if command -v python3.12 >/dev/null; then ok "python3.12 present ($(python3.12 --version 2>&1))"
  else bad "python3.12 missing -- dnf install python3.12 (RHEL 9 AppStream)"; fi
}

backend() {
  [ -f /etc/profile.d/devenv-backend.sh ] && source /etc/profile.d/devenv-backend.sh
  # shellcheck disable=SC1091
  source "$ISLAND_DIR/backend.versions.env"      # KIND_NODE_TAG etc. (written by the bundle build)
  need java gradle
  [ -f "$HOME/.gradle/init.d/devenv-nexus.init.gradle.kts" ] || die "Gradle init script missing -- run: install-backend-workstation.sh user"
  echo "$(java -version 2>&1 | head -1)  /  gradle $(gradle --version 2>/dev/null | sed -n 's/^Gradle //p')"
  cp -r "$ISLAND_DIR/templates/harvest-project" "$T/project"
  mkdir -p "$T/gradle-home/init.d"
  cp "$HOME/.gradle/init.d/devenv-nexus.init.gradle.kts" "$T/gradle-home/init.d/"   # empty Gradle cache + the Nexus redirect
  ok "Gradle home for this proof starts EMPTY (only the Nexus init script)"
  local docker_ok=0; command -v docker >/dev/null && docker info >/dev/null 2>&1 && docker_ok=1
  if [ $docker_ok = 1 ]; then
    # With Docker present the build also runs PostgresContainerTest: Testcontainers + Ryuk + the
    # Nexus image prefix, end to end.
    ( cd "$T/project" && step "harvest build from Nexus: compile, tests (Cucumber + Spring context + a REAL Testcontainers Postgres), Checkstyle, PMD, JaCoCo, Spotless, bootJar" \
        env GRADLE_USER_HOME="$T/gradle-home" DEVENV_CONTAINER_TESTS=true gradle --no-daemon --console=plain spotlessApply build bootJar )
    local tx="$T/project/build/test-results/test/TEST-org.example.harvest.PostgresContainerTest.xml"
    if [ -f "$tx" ] && grep -q 'tests="1"' "$tx" && grep -q 'skipped="0"' "$tx" && grep -q 'failures="0"' "$tx" && grep -q 'errors="0"' "$tx"; then
      ok "Testcontainers started postgres:18.6 (and Ryuk) from $DOCKER_REGISTRY"
    else bad "PostgresContainerTest did not run and pass (see $tx and $T/proof.log)"; fi
    step "docker pulls postgres:18.6 from $DOCKER_REGISTRY" docker pull -q "$DOCKER_REGISTRY/postgres:18.6"
    if [ "${SKIP_KIND:-0}" != 1 ] && command -v kind >/dev/null; then
      local cl="devenv-proof-$$"
      step "kind cluster from the Nexus node image ($KIND_NODE_TAG)" "$ISLAND_DIR/kind-cluster.sh" create "$cl"
      step "kind: a pod pulls $DOCKER_REGISTRY/postgres:18.6 and becomes Ready" sh -c "
        kubectl --context kind-$cl run pg --image=$DOCKER_REGISTRY/postgres:18.6 --env=POSTGRES_PASSWORD=proof --restart=Never &&
        kubectl --context kind-$cl wait --for=condition=Ready pod/pg --timeout=180s"
      step "kubectl $(kubectl version --client -o json 2>/dev/null | sed -n 's/.*\"gitVersion\": \"\(v[^\"]*\)\".*/\1/p' | head -1) talks to the cluster ($(kubectl --context kind-$cl version -o json 2>/dev/null | sed -n '/serverVersion/,/}/s/.*\"gitVersion\": \"\(v[^\"]*\)\".*/\1/p'))" \
        kubectl --context "kind-$cl" get nodes
      "$ISLAND_DIR/kind-cluster.sh" delete "$cl" >> "$T/proof.log" 2>&1 || true
    else echo "NOTE  kind round-trip skipped (SKIP_KIND=1 or kind not installed)"; fi
  else
    ( cd "$T/project" && step "harvest build from Nexus: compile, tests (Cucumber + Spring context), Checkstyle, PMD, JaCoCo, Spotless, bootJar" \
        env GRADLE_USER_HOME="$T/gradle-home" gradle --no-daemon --console=plain spotlessApply build bootJar )
    local tls=""; [ "$DOCKER_REGISTRY_INSECURE" = true ] && tls="--src-tls-verify=false"
    if command -v skopeo >/dev/null; then
      # No usable Docker (e.g. a headless build agent): still prove the registry serves every layer.
      step "registry serves postgres:18.6 (skopeo copy; Docker not usable on this machine)" \
        skopeo copy --quiet $tls "docker://$DOCKER_REGISTRY/postgres:18.6" "dir:$T/postgres-image"
      echo "NOTE  Testcontainers and kind need Docker -- run install-backend-workstation.sh system, then log in again"
    else bad "Docker not usable and no skopeo -- run install-backend-workstation.sh system (Docker CE), then log in again"; fi
  fi
}

case "$WHAT" in frontend) frontend ;; backend) backend ;; *) die "frontend or backend" ;; esac
echo; echo "RESULT: $pass passed, $fail failed   (work dir: $T)"
[ "$fail" = 0 ] && echo "GREEN -- reproducible from Nexus alone." || echo "NOT GREEN -- record every FAIL line and $T/proof.log."
[ "$fail" = 0 ]

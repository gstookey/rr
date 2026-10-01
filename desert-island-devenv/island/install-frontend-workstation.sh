#!/usr/bin/env bash
# install-frontend-workstation.sh -- set up one RHEL 9 workstation for front-end work from the
# front-end bundle. Created 2026-10-01; rehearsed in a RHEL 9 (UBI 9) container (see packet).
#
#   sudo ./install-frontend-workstation.sh system   # once per machine: Node (+npm), pnpm, uv, VS Code RPM,
#                                                    # Playwright browsers, Cypress binary, Prisma
#                                                    # engine, /etc/profile.d + global npmrc
#   ./install-frontend-workstation.sh user          # once per developer: VS Code extensions +
#                                                    # offline-safe VS Code settings
#
# Files come from this bundle's raw/ directory. On a machine without the bundle, set
# FROM_NEXUS=1 and they are fetched from the Nexus raw repository instead (load-nexus.sh puts
# them there). SKIP_VSCODE=1 skips the VS Code RPM (headless build agents).
# Python 3.12 is NOT in the bundle: it comes from the RHEL 9 AppStream media
# (dnf install python3.12 python3.12-pip python3.12-devel).
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"
load_conf
MODE="${1:?usage: install-frontend-workstation.sh system|user}"
# shellcheck disable=SC1091
source "$ISLAND_DIR/frontend.versions.env"      # written by the bundle build: exact versions + file names
PREFIX="${DEVENV_PREFIX:-/opt/devenv}"
RAWURL="$(repo_url "$RAW_REPO")"

# getfile <path-under-raw> -> prints a local path to the file
getfile() {
  if [ "${FROM_NEXUS:-0}" != 1 ] && [ -f "$BUNDLE_DIR/raw/$1" ]; then echo "$BUNDLE_DIR/raw/$1"; return; fi
  local t="${TMPDIR:-/tmp}/devenv-dl/$1"; mkdir -p "$(dirname "$t")"
  [ -s "$t" ] || curl -fsSL -o "$t" "$RAWURL/$1" || die "cannot fetch $RAWURL/$1"
  echo "$t"; }

system_install() {
  [ "$(id -u)" = 0 ] || die "the system step needs root: sudo $0 system"
  need tar xz curl
  mkdir -p "$PREFIX"

  log "Node.js $NODE_VERSION -> $PREFIX/node"
  local nt; nt=$(getfile "nodejs/v$NODE_VERSION/node-v$NODE_VERSION-linux-x64.tar.xz")
  local ns; ns=$(getfile "nodejs/v$NODE_VERSION/SHASUMS256.txt")
  ( cd "$(dirname "$nt")" && grep " $(basename "$nt")\$" "$ns" | sha256sum -c --quiet - ) || die "Node tarball checksum mismatch"
  rm -rf "$PREFIX/node-v$NODE_VERSION"; mkdir -p "$PREFIX/node-v$NODE_VERSION"
  tar -xJf "$nt" -C "$PREFIX/node-v$NODE_VERSION" --strip-components=1
  ln -sfn "$PREFIX/node-v$NODE_VERSION" "$PREFIX/node"
  for b in node npm npx corepack; do ln -sf "$PREFIX/node/bin/$b" "/usr/local/bin/$b"; done
  # Global npmrc lives in the Node prefix, so it applies to every user of this Node.
  mkdir -p "$PREFIX/node/etc"
  cat > "$PREFIX/node/etc/npmrc" <<NPMRC
registry=$(repo_url "$NPM_REPO")/
# The island has no audit/advisory service and no update endpoint; these calls only hang or fail.
audit=false
fund=false
update-notifier=false
NPMRC
  echo "node $(/usr/local/bin/node --version), npm $(/usr/local/bin/npm --version)"

  # pnpm (2026-10-01: both package managers ship; each app picks its own). It is an npm package
  # with no dependencies: installed from this bundle's own tarball when present, else from Nexus.
  log "pnpm $PNPM_VERSION -> $PREFIX/node/bin"
  local pt="$BUNDLE_DIR/npm/tarballs/pnpm-$PNPM_VERSION.tgz"
  if [ "${FROM_NEXUS:-0}" = 1 ] || [ ! -f "$pt" ]; then pt="pnpm@$PNPM_VERSION"; fi
  "$PREFIX/node/bin/npm" install -g --prefix "$PREFIX/node" "$pt" --no-audit --no-fund >/dev/null || die "pnpm $PNPM_VERSION did not install"
  for b in pnpm pnpx; do ln -sf "$PREFIX/node/bin/$b" "/usr/local/bin/$b"; done
  echo "pnpm $(/usr/local/bin/pnpm --version)"

  log "uv $UV_VERSION -> /usr/local/bin"
  local ua; ua=$(getfile "uv/$UV_VERSION/uv-x86_64-unknown-linux-gnu.tar.gz")
  tar -xzf "$ua" -C /usr/local/bin --strip-components=1 uv-x86_64-unknown-linux-gnu/uv uv-x86_64-unknown-linux-gnu/uvx
  uv --version

  log "Cypress $CYPRESS_VERSION binary -> $PREFIX/cypress"
  mkdir -p "$PREFIX/cypress/$CYPRESS_VERSION"
  cp "$(getfile "cypress/$CYPRESS_VERSION/linux-x64/cypress.zip")" "$PREFIX/cypress/$CYPRESS_VERSION/cypress.zip"

  log "Playwright $PLAYWRIGHT_VERSION browsers -> $PREFIX/ms-playwright"
  rm -rf "$PREFIX/ms-playwright"
  tar -xzf "$(getfile "playwright/$PLAYWRIGHT_VERSION/playwright-browsers-linux-x64.tar.gz")" -C "$PREFIX"
  chmod -R a+rX "$PREFIX/ms-playwright"

  log "environment -> /etc/profile.d/devenv-frontend.sh"
  cat > /etc/profile.d/devenv-frontend.sh <<PROFILE
# Written by install-frontend-workstation.sh on $(date +%F). Air-gapped front-end tooling.
export PATH="$PREFIX/node/bin:\$PATH"
# npm and pnpm both read npm_config_* from the environment, so this one line points both at Nexus
# whatever npmrc a project carries (the global npmrc above says the same for npm).
export npm_config_registry="$(repo_url "$NPM_REPO")/"
# Binaries npm packages would otherwise download from the internet during npm ci:
export CYPRESS_INSTALL_BINARY="$PREFIX/cypress/$CYPRESS_VERSION/cypress.zip"
export PRISMA_ENGINES_MIRROR="$RAWURL/prisma-engines"
export PLAYWRIGHT_BROWSERS_PATH="$PREFIX/ms-playwright"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
export CHROMEDRIVER_SKIP_DOWNLOAD=true      # keycloak-connect pulls chromedriver ("latest") as an optional dependency
export PUPPETEER_SKIP_DOWNLOAD=true
# Python packages come from the Nexus pypi-hosted repository (uv and pip):
export UV_DEFAULT_INDEX="$(repo_url "$PYPI_REPO")/simple"
export PIP_INDEX_URL="$(repo_url "$PYPI_REPO")/simple"
export PIP_TRUSTED_HOST="$(echo "$NEXUS_URL" | sed -E 's#^[a-z]+://([^:/]+).*#\1#')"   # needed while Nexus is plain HTTP
# Phone-home switches (no internet; these only add timeouts):
export NG_CLI_ANALYTICS=false
export NX_NO_CLOUD=true
export CHECKPOINT_DISABLE=1                 # Prisma update check
export DO_NOT_TRACK=1
PROFILE

  if [ -n "${VSCODE_RPM:-}" ] && [ "${SKIP_VSCODE:-0}" != 1 ]; then
    log "VS Code $VSCODE_VERSION (RPM; dependencies resolve from the RHEL 9 repositories this machine uses)"
    local rpm; rpm=$(getfile "vscode/$VSCODE_VERSION/$VSCODE_RPM")
    if command -v dnf >/dev/null; then dnf install -y "$rpm" || die "dnf could not install VS Code -- record the missing dependencies it names"
    else warn "dnf not found; install $rpm with your package tool"; fi
  fi
  log "system step done. Log out and back in (or: source /etc/profile.d/devenv-frontend.sh)."
}

user_install() {
  [ "$(id -u)" != 0 ] || die "run the user step as the developer, not root"
  need code
  log "VS Code extensions (order matters: dependencies first)"
  while read -r id ver plat; do
    [[ -z "$id" || "$id" == \#* ]] && continue
    code --install-extension "$(getfile "vscode-extensions/$id-$ver-$plat.vsix")" --force >/dev/null \
      || die "extension $id $ver did not install"
    echo "  $id $ver"
  done < "$(getfile vscode-extensions/INSTALL-ORDER.txt)"
  local s="$HOME/.config/Code/User/settings.json"
  if [ ! -f "$s" ]; then
    mkdir -p "$(dirname "$s")"
    cat > "$s" <<'SETTINGS'
{
  "update.mode": "none",
  "extensions.autoUpdate": false,
  "extensions.autoCheckUpdates": false,
  "extensions.ignoreRecommendations": true,
  "telemetry.telemetryLevel": "off",
  "workbench.enableExperiments": false
}
SETTINGS
    echo "  wrote offline-safe $s"
  else warn "$s exists -- not changed. Recommended: update.mode=none, extensions.autoUpdate=false, telemetry off."; fi
  log "user step done: $(code --list-extensions | wc -l) extensions installed."
}

case "$MODE" in system) system_install ;; user) user_install ;; *) die "mode must be system or user" ;; esac

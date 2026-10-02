#!/usr/bin/env bash
# install-frontend-workstation.sh -- set up one RHEL 9 workstation for front-end work from the
# front-end bundle. Created 2026-10-01; rehearsed in a RHEL 9 (UBI 9) container (see packet).
# Last updated 2026-10-02: everything after Node is optional -- with the SRF category bundles a machine
# is set up from the categories loaded so far, and anything not there yet prints SKIPPED (re-run later).
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
# getfile_opt <path>: like getfile, but returns 1 (quietly) when neither this bundle nor Nexus has the
# file yet. Added 2026-10-02 for the SRF category bundles (build-srf-bundles.sh): a workstation is
# set up from whichever categories are approved so far, and this step is re-run as more arrive.
getfile_opt() {
  if [ "${FROM_NEXUS:-0}" != 1 ] && [ -f "$BUNDLE_DIR/raw/$1" ]; then echo "$BUNDLE_DIR/raw/$1"; return 0; fi
  local t="${TMPDIR:-/tmp}/devenv-dl/$1"; mkdir -p "$(dirname "$t")"
  [ -s "$t" ] && { echo "$t"; return 0; }
  curl -fsSL -o "$t" "$RAWURL/$1" 2>/dev/null && { echo "$t"; return 0; }
  rm -f "$t"; return 1; }
later() { echo "  SKIPPED: $1 -- not in this bundle and not in Nexus yet; re-run this step after loading the bundle that carries it"; }

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
  if [ "$pt" != "pnpm@$PNPM_VERSION" ] || curl -fsS -o /dev/null "$(repo_url "$NPM_REPO")/pnpm/-/pnpm-$PNPM_VERSION.tgz" 2>/dev/null; then
    "$PREFIX/node/bin/npm" install -g --prefix "$PREFIX/node" "$pt" --no-audit --no-fund >/dev/null || die "pnpm $PNPM_VERSION did not install"
    for b in pnpm pnpx; do ln -sf "$PREFIX/node/bin/$b" "/usr/local/bin/$b"; done
    echo "pnpm $(/usr/local/bin/pnpm --version)"
  else later "pnpm $PNPM_VERSION"; fi

  log "uv $UV_VERSION -> /usr/local/bin"
  local ua
  if ua=$(getfile_opt "uv/$UV_VERSION/uv-x86_64-unknown-linux-gnu.tar.gz"); then
    tar -xzf "$ua" -C /usr/local/bin --strip-components=1 uv-x86_64-unknown-linux-gnu/uv uv-x86_64-unknown-linux-gnu/uvx
    uv --version
  else later "uv $UV_VERSION"; fi

  log "Cypress $CYPRESS_VERSION binary -> $PREFIX/cypress"
  local cz
  if cz=$(getfile_opt "cypress/$CYPRESS_VERSION/linux-x64/cypress.zip"); then
    mkdir -p "$PREFIX/cypress/$CYPRESS_VERSION"; cp "$cz" "$PREFIX/cypress/$CYPRESS_VERSION/cypress.zip"
  else later "the Cypress $CYPRESS_VERSION binary"; fi

  log "Playwright $PLAYWRIGHT_VERSION browsers -> $PREFIX/ms-playwright"
  local pw
  if pw=$(getfile_opt "playwright/$PLAYWRIGHT_VERSION/playwright-browsers-linux-x64.tar.gz"); then
    rm -rf "$PREFIX/ms-playwright"; tar -xzf "$pw" -C "$PREFIX"; chmod -R a+rX "$PREFIX/ms-playwright"
  else later "the Playwright $PLAYWRIGHT_VERSION browsers"; fi

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
    local rpm
    if rpm=$(getfile_opt "vscode/$VSCODE_VERSION/$VSCODE_RPM"); then
      if command -v dnf >/dev/null; then dnf install -y "$rpm" || die "dnf could not install VS Code -- record the missing dependencies it names"
      else warn "dnf not found; install $rpm with your package tool"; fi
    else later "VS Code $VSCODE_VERSION"; fi
  fi
  log "system step done. Log out and back in (or: source /etc/profile.d/devenv-frontend.sh)."
}

user_install() {
  [ "$(id -u)" != 0 ] || die "run the user step as the developer, not root"
  need code
  log "VS Code extensions (order matters: dependencies first)"
  local order vsix
  order=$(getfile_opt vscode-extensions/INSTALL-ORDER.txt) || { later "the VS Code extensions"; order=/dev/null; }
  while read -r id ver plat; do
    [[ -z "$id" || "$id" == \#* ]] && continue
    # Extensions can arrive in more than one SRF category bundle: install what is here, skip the rest.
    vsix=$(getfile_opt "vscode-extensions/$id-$ver-$plat.vsix") || { later "extension $id $ver"; continue; }
    code --install-extension "$vsix" --force >/dev/null || die "extension $id $ver did not install"
    echo "  $id $ver"
  done < "$order"
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

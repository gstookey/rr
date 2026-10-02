#!/usr/bin/env bash
# common.sh -- helpers shared by the island-side scripts. Created 2026-10-01.
# Every script here is written for a person with no internet and no one to ask: each failure
# names what went wrong and what to record. Sourced, never executed.
set -euo pipefail
HERE_LIB="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ISLAND_DIR="$(cd "$HERE_LIB/.." && pwd)"
BUNDLE_DIR="$(cd "$ISLAND_DIR/.." && pwd)"

log()  { printf '\n== %s\n' "$*"; }
warn() { printf 'WARNING: %s\n' "$*" >&2; }
die()  { printf '\nSTOP: %s\nRecord this message verbatim before doing anything else.\n' "$*" >&2; DEVENV_STOPPED=1; exit 1; }
need() { for c in "$@"; do command -v "$c" >/dev/null 2>&1 || die "required command not found: $c"; done; }

# devenv.conf holds the site-specific values (Nexus URL, repository names, credentials file).
load_conf() {
  local conf="${DEVENV_CONF:-$ISLAND_DIR/devenv.conf}"
  [ -f "$conf" ] || die "no config at $conf -- copy island/devenv.conf.template to island/devenv.conf and fill it in"
  # shellcheck disable=SC1090
  source "$conf"
  : "${NEXUS_URL:?NEXUS_URL not set in $conf}"
  NEXUS_URL="${NEXUS_URL%/}"
}

# Credentials for WRITE operations come from a file, never from the command line (shell history).
# Format of the file: one line, user:password
load_creds() {
  local f="${NEXUS_CREDENTIALS_FILE:-}"
  [ -n "$f" ] && [ -f "$f" ] || die "NEXUS_CREDENTIALS_FILE is not set or missing (one line: user:password)"
  NEXUS_CREDS="$(head -n1 "$f" | tr -d '\r\n')"
  [[ "$NEXUS_CREDS" == *:* ]] || die "credentials file $f must contain user:password"
}

# Verify the bundle before touching anything: a corrupted transfer must stop here.
verify_bundle() {
  log "verifying bundle checksums (this reads every file once)"
  ( cd "$BUNDLE_DIR" && sha256sum -c SHA256SUMS --quiet ) \
    || die "checksum mismatch in the bundle -- the transfer is corrupted; request re-delivery of the files listed above"
  echo "bundle checksums OK"
}

repo_url() { echo "$NEXUS_URL/repository/$1"; }

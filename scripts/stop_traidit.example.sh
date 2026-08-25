#!/usr/bin/env bash
#
# stop_traidit.sh — stop the local stack that start_traidit.sh brought up.
#
# Created: 2026-07-22 | Last updated: 2026-07-23 | Owner: Kepler (dev-ops)
#
# Kills every tracked service process (by process group, so tsx/ng/uvicorn
# children go with it).
#
# THE DATABASES ARE SHARED AND ARE LEFT RUNNING.  (Graham's ruling, 2026-07-23)
# `traidit-postgres`, `traidit-pgadmin` and `traidit-atlas-postgres` are the
# normal dev containers holding the real data; the stack borrows them, it does
# not own them. Stopping them here would take out the rest of the dev
# environment. Use --stop-db if you deliberately want them stopped.
#
# NOTHING in this script removes a container or a volume. There is no `down`,
# no `down -v`, no `docker rm`. Data cannot be lost by running it.
#
set -euo pipefail

STACK_HOME="${TRAIDIT_STACK_HOME:-$HOME/.traidit-stack}"

RUN_DIR="$STACK_HOME/run"
LOG_DIR="$STACK_HOME/logs"

PG_CONTAINER="traidit-postgres"
PGADMIN_CONTAINER="traidit-pgadmin"
ATLAS_PG_CONTAINER="traidit-atlas-postgres"

STOP_DB=0

if [[ -t 1 ]]; then
  C_DIM=$'\033[2m'; C_RED=$'\033[31m'; C_GRN=$'\033[32m'
  C_YEL=$'\033[33m'; C_CYN=$'\033[36m'; C_BLD=$'\033[1m'; C_OFF=$'\033[0m'
else
  C_DIM=''; C_RED=''; C_GRN=''; C_YEL=''; C_CYN=''; C_BLD=''; C_OFF=''
fi

step() { printf '\n%s==>%s %s%s%s\n' "$C_CYN" "$C_OFF" "$C_BLD" "$*" "$C_OFF"; }
info() { printf '    %s\n' "$*"; }
dim()  { printf '    %s%s%s\n' "$C_DIM" "$*" "$C_OFF"; }
ok()   { printf '    %s✓%s %s\n' "$C_GRN" "$C_OFF" "$*"; }
warn() { printf '    %s!%s %s\n' "$C_YEL" "$C_OFF" "$*" >&2; }

usage() {
  cat <<EOF
${C_BLD}stop_traidit.sh${C_OFF} — stop the local TrAIdit stack.

  Usage: bash scripts/stop_traidit.sh [flags]
         pnpm stack:down -- [flags]

By default this stops the stack's SERVICES ONLY. The database containers are
shared with your normal dev environment and are left running.

${C_BLD}Flags${C_OFF}
  --stop-db     ALSO stop the shared database containers ($PG_CONTAINER,
                $PGADMIN_CONTAINER, $ATLAS_PG_CONTAINER).
                They are STOPPED, never removed — 'docker start <name>' or the
                next 'stack:up' brings them back with all data intact. Only do
                this if you want the whole dev environment's databases down.
  -h, --help    This text.

No container and no volume is ever removed by this script.
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --stop-db)  STOP_DB=1 ;;
    -h|--help)  usage; exit 0 ;;
    --)         ;;   # pnpm passes its own `--` through; ignore it

    *)
      printf '%sUnknown flag:%s %s\n\n' "$C_RED" "$C_OFF" "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

pid_alive() { [[ -n "${1:-}" ]] && kill -0 "$1" 2>/dev/null; }

stop_service() {
  local name="$1" pf pid
  pf="$RUN_DIR/$name.pid"
  [[ -f "$pf" ]] || return 0
  pid="$(cat "$pf" 2>/dev/null || true)"
  if pid_alive "$pid"; then
    kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      pid_alive "$pid" || break
      sleep 0.25
    done
    if pid_alive "$pid"; then
      warn "$name (pid $pid) ignored SIGTERM — sending SIGKILL"
      kill -KILL "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    fi
    ok "stopped $name (pid $pid)"
  else
    dim "$name was not running (stale pid file cleared)"
  fi
  rm -f "$pf"
}

printf '\n%s  TrAIdit — stopping the local stack%s\n' "$C_BLD" "$C_OFF"

# --- Services ---------------------------------------------------------------
step "Services"
stopped_any=0
if [[ -d "$RUN_DIR" ]]; then
  # Reverse of startup order: web first, infrastructure-adjacent last.
  for name in web worker api atlas quant; do
    if [[ -f "$RUN_DIR/$name.pid" ]]; then
      stop_service "$name"
      stopped_any=1
    fi
  done
  # Anything else a future revision may have tracked.
  for pf in "$RUN_DIR"/*.pid; do
    [[ -e "$pf" ]] || continue
    stop_service "$(basename "$pf" .pid)"
    stopped_any=1
  done
fi
if (( stopped_any == 0 )); then
  dim "no tracked service processes found"
fi

# --- Shared databases -------------------------------------------------------
if (( STOP_DB == 0 )); then
  step "Shared databases — LEFT RUNNING"
  dim "$PG_CONTAINER, $PGADMIN_CONTAINER, $ATLAS_PG_CONTAINER"
  dim "they hold the real dev data and are shared with your normal workflow;"
  dim "pass --stop-db if you deliberately want them stopped."
else
  step "Shared databases — stopping (--stop-db)"
  if ! command -v docker >/dev/null 2>&1 || ! docker info >/dev/null 2>&1; then
    warn "Docker is not available/running — nothing to stop"
  else
    # `docker stop`, never `compose down`: stopping keeps the container and its
    # volume; `down` would remove the container. Data is never at risk here.
    for c in "$PG_CONTAINER" "$PGADMIN_CONTAINER" "$ATLAS_PG_CONTAINER"; do
      if [[ "$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)" == "true" ]]; then
        if docker stop "$c" >/dev/null 2>&1; then
          ok "stopped $c (container and volume kept)"
        else
          warn "could not stop $c"
        fi
      else
        dim "$c was not running"
      fi
    done
  fi
fi

# --- Residue check ----------------------------------------------------------
# Service ports only. The shared database ports are expected to stay held.
step "Residue check"
residue=0
for spec in "web:${TRAIDIT_STACK_WEB_PORT:-4321}" \
            "api:${TRAIDIT_STACK_API_PORT:-3000}" \
            "quant:${TRAIDIT_STACK_QUANT_PORT:-48100}" \
            "atlas:${TRAIDIT_STACK_ATLAS_PORT:-48000}"; do
  svc="${spec%%:*}"; port="${spec##*:}"
  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    warn "port $port ($svc) is still held by something:"
    lsof -nP -iTCP:"$port" -sTCP:LISTEN 2>/dev/null | sed -n '2,3p' >&2
    residue=1
  fi
done
if (( residue == 0 )); then
  ok "no stack ports still listening"
else
  warn "the holder above may be an unrelated process — this script only kills what it started"
fi

printf '\n%s  Stack down.%s  %sLogs kept: %s%s\n\n' "$C_GRN$C_BLD" "$C_OFF" "$C_DIM" "$LOG_DIR" "$C_OFF"

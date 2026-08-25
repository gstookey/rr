#!/usr/bin/env bash
#
# start_traidit.sh — stand up the ENTIRE TrAIdit system locally, one command.
#
# Created: 2026-07-22 | Last updated: 2026-07-23 | Owner: Kepler (dev-ops)
#
# WHAT THIS DOES
#   Drives the three clean clones under ~/repos/worktrees (platform monorepo,
#   quant service, Atlas) — never this repo's working tree — onto `main`,
#   installs fresh, makes sure the databases are up, starts every service,
#   health-gates each one, and prints a summary.
#
#   The app entrypoint is http://localhost:4321 (Graham's bookmark — FIXED).
#
# THE DATABASES ARE SHARED, NOT THE STACK'S OWN  (Graham's ruling, 2026-07-23)
#   The stack uses the EXISTING dev databases — the same `traidit-postgres`
#   (5432), `traidit-pgadmin` (5050) and `traidit-atlas-postgres` (5433)
#   containers, with their existing volumes and their existing data. It does
#   not generate compose overrides and does not run a parallel set of DBs.
#   That is the whole point: the stack boots into the real, populated data.
#
#   Consequences, deliberately:
#     - A container that is already running is REUSED as-is. `compose up` is
#       skipped entirely for it — no recreate, no config churn.
#     - Nothing here ever removes a container, a volume, or a byte of data.
#       No `down -v`, ever. stop_traidit.sh leaves the databases running.
#     - --with-ingest now WRITES TO THE REAL ATLAS DATABASE, so it demands an
#       explicit confirmation. See the flag's help text.
#
# WHAT THIS DOES NOT DO
#   - It never writes into ~/repos/worktrees/* (logs, PIDs and secrets all
#     live under ~/.traidit-stack).
#   - It never stashes, resets, or discards work. A dirty worktree ABORTS.
#   - It never silently reuses a foreign process on a stack port. A port
#     conflict aborts the run and names the holder.
#
# STOPPING
#   bash scripts/stop_traidit.sh      (or: pnpm stack:down)
#
set -euo pipefail

# Job control ON: every background service lands in its own process group, so
# stop_traidit.sh can kill the whole tree (tsx watch / ng serve / uvicorn all
# fork children that would otherwise survive a bare `kill <pid>`).
set -m

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

STACK_HOME="${TRAIDIT_STACK_HOME:-$HOME/.traidit-stack}"
WORKTREES_ROOT="${TRAIDIT_WORKTREES_ROOT:-$HOME/repos/worktrees}"

PLATFORM_DIR="$WORKTREES_ROOT/traidit"
QUANT_DIR="$WORKTREES_ROOT/traidit-quant-service"
ATLAS_DIR="$WORKTREES_ROOT/traidit-atlas"

LOG_DIR="$STACK_HOME/logs"
RUN_DIR="$STACK_HOME/run"
SECRETS_FILE="$STACK_HOME/secrets.env"

# Shared infrastructure — these are the EXISTING dev containers, brought up
# from each repo's own docker-compose.yml with its own default project name.
# Matching the project name is what keeps the existing named volumes
# (traidit_postgres_data, traidit_pgadmin_data, traidit-atlas_atlas-pgdata)
# attached, i.e. what keeps the data.
COMPOSE_PROJECT_PLATFORM="traidit"
COMPOSE_PROJECT_ATLAS="traidit-atlas"

PG_CONTAINER="traidit-postgres"
PGADMIN_CONTAINER="traidit-pgadmin"
ATLAS_PG_CONTAINER="traidit-atlas-postgres"

# --- Port block -------------------------------------------------------------
# Databases sit on their normal dev ports because they ARE the normal dev
# databases (5432 / 5050 / 5433). The two stateless Python services move to
# 48xxx so a hand-run `uvicorn` on 8100/8000 does not collide with the stack.
#
# WEB is FIXED at 4321 (bookmarked).
# API is 3000 — the shared default; see the decision note in scripts/README.md.
WEB_PORT="${TRAIDIT_STACK_WEB_PORT:-4321}"
API_PORT="${TRAIDIT_STACK_API_PORT:-3000}"
PG_PORT="${TRAIDIT_STACK_PG_PORT:-5432}"
PGADMIN_PORT="${TRAIDIT_STACK_PGADMIN_PORT:-5050}"
QUANT_PORT="${TRAIDIT_STACK_QUANT_PORT:-48100}"
ATLAS_PORT="${TRAIDIT_STACK_ATLAS_PORT:-48000}"
ATLAS_PG_PORT="${TRAIDIT_STACK_ATLAS_PG_PORT:-5433}"

# Health-gate budgets (seconds).
WAIT_DB=90
WAIT_QUANT=120
WAIT_ATLAS=120
WAIT_API=180
WAIT_WEB=300   # Angular's first dev build is the slow one.

# --- Flags ------------------------------------------------------------------
SKIP_PULL=0
SKIP_INSTALL=0
WITH_INGEST=0
INGEST_CONFIRMED=0
WITH_WORKER=0
FOREGROUND=0

# ---------------------------------------------------------------------------
# Output helpers
# ---------------------------------------------------------------------------

if [[ -t 1 ]]; then
  C_DIM=$'\033[2m'; C_RED=$'\033[31m'; C_GRN=$'\033[32m'
  C_YEL=$'\033[33m'; C_CYN=$'\033[36m'; C_BLD=$'\033[1m'; C_OFF=$'\033[0m'
else
  C_DIM=''; C_RED=''; C_GRN=''; C_YEL=''; C_CYN=''; C_BLD=''; C_OFF=''
fi

step()  { printf '\n%s==>%s %s%s%s\n' "$C_CYN" "$C_OFF" "$C_BLD" "$*" "$C_OFF"; }
info()  { printf '    %s\n' "$*"; }
dim()   { printf '    %s%s%s\n' "$C_DIM" "$*" "$C_OFF"; }
ok()    { printf '    %s✓%s %s\n' "$C_GRN" "$C_OFF" "$*"; }
warn()  { printf '    %s!%s %s\n' "$C_YEL" "$C_OFF" "$*" >&2; }
die()   { printf '\n%sFAIL:%s %s\n\n' "$C_RED" "$C_OFF" "$*" >&2; exit 1; }

usage() {
  cat <<EOF
${C_BLD}start_traidit.sh${C_OFF} — stand up the entire TrAIdit system locally.

  Usage: bash scripts/start_traidit.sh [flags]
         pnpm stack:up -- [flags]

${C_BLD}Flags${C_OFF}
  --skip-pull      Do not fetch/checkout main/pull; use each worktree as-is.
  --skip-install   Do not run pnpm install / uv sync.
  --with-ingest    ${C_YEL}DESTRUCTIVE-ADJACENT.${C_OFF} ALSO run the Atlas ingest chain, which
                   REWRITES THE SHARED, POPULATED Atlas database (the same
                   \`$ATLAS_PG_CONTAINER\` your normal dev work uses). Slow
                   (~5min+), network-heavy (SEC EDGAR / Wikidata / Polygon).
                   This is the periodic reference-data REFRESH path, not a
                   startup step. Requires confirmation (see below).
  --yes-i-mean-it  Skip the interactive confirmation for --with-ingest. Required
                   when running --with-ingest non-interactively. No effect
                   without --with-ingest.
  --with-worker    ALSO start the platform worker loop.
  --foreground     Stay attached and tail all service logs; Ctrl-C stops the
                   stack's services (the shared databases stay up). Default is
                   detached (script exits, the stack keeps running; stop it
                   with stop_traidit.sh).
  -h, --help       This text.

${C_BLD}Repos driven${C_OFF} (clean clones, never this working tree)
  $PLATFORM_DIR
  $QUANT_DIR
  $ATLAS_DIR

${C_BLD}Port block${C_OFF}
  Web (Angular)      $WEB_PORT      <- app entrypoint, FIXED
  Gateway API        $API_PORT      <- shared default
  Platform Postgres  $PG_PORT      <- SHARED, existing container
  pgAdmin            $PGADMIN_PORT      <- SHARED, existing container
  Quant service      $QUANT_PORT
  Atlas API          $ATLAS_PORT
  Atlas Postgres     $ATLAS_PG_PORT      <- SHARED, existing container

${C_BLD}State${C_OFF} (all outside the worktrees, under $STACK_HOME)
  secrets.env   optional shared API keys, sourced + exported (chmod 600)
  logs/         per-service logs (previous run kept as <name>.log.prev)
  run/          per-service PID files

${C_BLD}Stop${C_OFF}
  bash scripts/stop_traidit.sh
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-pull)    SKIP_PULL=1 ;;
    --skip-install) SKIP_INSTALL=1 ;;
    --with-ingest)  WITH_INGEST=1 ;;
    --yes-i-mean-it) INGEST_CONFIRMED=1 ;;
    --with-worker)  WITH_WORKER=1 ;;
    --foreground)   FOREGROUND=1 ;;
    -h|--help)      usage; exit 0 ;;
    --)             ;;   # pnpm passes its own `--` through; ignore it

    *)
      printf '%sUnknown flag:%s %s\n\n' "$C_RED" "$C_OFF" "$1" >&2
      usage >&2
      exit 2
      ;;
  esac
  shift
done

# ---------------------------------------------------------------------------
# Failure teardown — never leave half a stack running
# ---------------------------------------------------------------------------

STARTUP_COMPLETE=0

on_exit() {
  local code=$?
  if (( STARTUP_COMPLETE == 0 && code != 0 )); then
    printf '\n%s--- startup failed (exit %s); stopping anything this run started ---%s\n' \
      "$C_YEL" "$code" "$C_OFF" >&2
    stop_tracked_processes || true
    printf '%s(The shared database containers were left running and untouched —\n' \
      "$C_DIM" >&2
    printf ' inspect with: docker ps)%s\n' "$C_OFF" >&2
    printf '%sLogs: %s%s\n' "$C_DIM" "$LOG_DIR" "$C_OFF" >&2
  fi
}
trap on_exit EXIT

# ---------------------------------------------------------------------------
# Process tracking
# ---------------------------------------------------------------------------

pid_file() { printf '%s/%s.pid' "$RUN_DIR" "$1"; }
log_file() { printf '%s/%s.log' "$LOG_DIR" "$1"; }

pid_alive() { [[ -n "${1:-}" ]] && kill -0 "$1" 2>/dev/null; }

# Terminate a tracked service: process group first (children die with it),
# then the bare pid, escalating to KILL. Always removes the pid file.
stop_service() {
  local name="$1" pf pid
  pf="$(pid_file "$name")"
  [[ -f "$pf" ]] || return 0
  pid="$(cat "$pf" 2>/dev/null || true)"
  if pid_alive "$pid"; then
    kill -TERM "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true
    for _ in $(seq 1 20); do
      pid_alive "$pid" || break
      sleep 0.25
    done
    if pid_alive "$pid"; then
      kill -KILL "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true
    fi
    info "stopped $name (pid $pid)"
  fi
  rm -f "$pf"
}

stop_tracked_processes() {
  local pf name
  [[ -d "$RUN_DIR" ]] || return 0
  for pf in "$RUN_DIR"/*.pid; do
    [[ -e "$pf" ]] || continue
    name="$(basename "$pf" .pid)"
    stop_service "$name"
  done
}

# start_service <name> <workdir> <cmd...>
start_service() {
  local name="$1" workdir="$2"; shift 2
  local lf pid
  lf="$(log_file "$name")"
  if [[ -f "$lf" ]]; then
    mv -f "$lf" "$lf.prev"
  fi
  {
    printf '=== %s | %s | cwd=%s\n' "$name" "$(date '+%Y-%m-%d %H:%M:%S')" "$workdir"
    printf '=== cmd: %s\n\n' "$*"
  } >"$lf"

  # Subshell + exec => $! is the real service pid, and (job control being on)
  # it heads its own process group, so stop_service can kill the whole tree.
  # nohup: the stack survives closing the terminal that launched it.
  # </dev/null: no background job stops on SIGTTIN trying to read the terminal.
  ( cd "$workdir" && exec nohup "$@" ) </dev/null >>"$lf" 2>&1 &
  pid=$!
  printf '%s\n' "$pid" >"$(pid_file "$name")"
  dim "$name pid $pid -> $lf"
}

# ---------------------------------------------------------------------------
# Health gates
# ---------------------------------------------------------------------------

# wait_for <label> <service-name-or-empty> <timeout-seconds> <probe-cmd...>
wait_for() {
  local label="$1" svc="$2" timeout="$3"; shift 3
  local waited=0 pid pf
  printf '    waiting for %s ' "$label"
  while (( waited < timeout )); do
    if "$@" >/dev/null 2>&1; then
      printf ' %s✓%s (%ss)\n' "$C_GRN" "$C_OFF" "$waited"
      return 0
    fi
    # If the service died on its own, stop waiting out the clock.
    if [[ -n "$svc" ]]; then
      pf="$(pid_file "$svc")"
      if [[ -f "$pf" ]]; then
        pid="$(cat "$pf")"
        if ! pid_alive "$pid"; then
          printf ' %s✗%s\n' "$C_RED" "$C_OFF"
          tail -n 30 "$(log_file "$svc")" >&2 || true
          die "$label exited during startup. Full log: $(log_file "$svc")"
        fi
      fi
    fi
    printf '.'
    sleep 1
    waited=$((waited + 1))
  done
  printf ' %s✗%s\n' "$C_RED" "$C_OFF"
  if [[ -n "$svc" && -f "$(log_file "$svc")" ]]; then
    tail -n 30 "$(log_file "$svc")" >&2
  fi
  die "$label did not become healthy within ${timeout}s. Log: ${svc:+$(log_file "$svc")}"
}

http_ok()  { curl -sf --max-time 4 -o /dev/null "$1"; }
pg_ready() { docker exec "$1" pg_isready -U "$2" -d "$3"; }

port_holder() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN 2>/dev/null | sed -n '2,4p'
}
port_free() { [[ -z "$(port_holder "$1")" ]]; }

# Abort loudly on a port we need but do not own. Never reuse a foreign process:
# a hand-run `pnpm dev:api` on 3000 looks healthy and would silently shadow the
# stack's gateway, which is exactly the kind of "works, but not what you think"
# state this script exists to prevent.
require_port_free() {
  local label="$1" port="$2" hint="$3"
  port_free "$port" && return 0
  printf '\n%sFAIL:%s port %s (%s) is already in use:%s\n' \
    "$C_RED" "$C_OFF" "$port" "$label" "$C_OFF" >&2
  port_holder "$port" >&2
  printf '\n      %s\n' "$hint" >&2
  printf '      The stack will not reuse a process it did not start.\n\n' >&2
  exit 1
}

# ---------------------------------------------------------------------------
# Repo preparation
# ---------------------------------------------------------------------------

prepare_repo() {
  local label="$1" dir="$2" branch head
  [[ -d "$dir/.git" ]] || die "$label: not a git clone at $dir"

  if [[ -n "$(git -C "$dir" status --porcelain)" ]]; then
    printf '\n%sFAIL:%s %s worktree is DIRTY — refusing to touch it.%s\n' \
      "$C_RED" "$C_OFF" "$label" "$C_OFF" >&2
    printf '      %s\n' "$dir" >&2
    git -C "$dir" status --short >&2
    printf '\n      These clones are meant to stay clean. Resolve it yourself —\n' >&2
    printf '      commit it, move it to a branch, or clean it deliberately. This\n' >&2
    printf '      script will never stash, reset, or discard your work, and no\n' >&2
    printf '      flag bypasses this check. Re-run once the clone is clean.\n\n' >&2
    exit 1
  fi

  if (( SKIP_PULL )); then
    branch="$(git -C "$dir" rev-parse --abbrev-ref HEAD)"
    head="$(git -C "$dir" rev-parse --short HEAD)"
    ok "$label: clean, using as-is ($branch @ $head) — --skip-pull"
    return 0
  fi

  git -C "$dir" fetch --prune origin >/dev/null 2>&1 \
    || die "$label: git fetch origin failed (network? ssh key?)"

  branch="$(git -C "$dir" rev-parse --abbrev-ref HEAD)"
  if [[ "$branch" != "main" ]]; then
    git -C "$dir" checkout main >/dev/null 2>&1 \
      || die "$label: could not check out main (was on '$branch')"
    info "$label: checked out main (was '$branch')"
  fi

  if ! git -C "$dir" merge-base --is-ancestor HEAD origin/main 2>/dev/null; then
    die "$label: local main has commits origin/main does not (not fast-forwardable).
      Reconcile $dir yourself — this script will not rewrite history."
  fi

  git -C "$dir" pull --ff-only origin main >/dev/null 2>&1 \
    || die "$label: git pull --ff-only origin main failed. Reconcile $dir yourself."

  head="$(git -C "$dir" rev-parse --short HEAD)"
  ok "$label: main @ $head (fresh)"
}

# ---------------------------------------------------------------------------
# Shared database containers — reuse, never recreate
# ---------------------------------------------------------------------------
#
# Each repo's docker-compose.yml is used AS-IS, with its own default project
# name, so the existing named volumes stay attached and the existing data is
# the data the stack boots into.
#
# Both compose files pin an explicit `container_name`, which a `-p` project
# name does not override — so a `compose up` issued from a different directory
# can collide with, or recreate, a container that is already serving. The rule
# below removes that risk entirely: if the container is running, we do not
# issue `compose up` for it at all.

compose_platform() {
  docker compose -f "$PLATFORM_DIR/docker-compose.yml" \
    -p "$COMPOSE_PROJECT_PLATFORM" "$@"
}

compose_atlas() {
  docker compose -f "$ATLAS_DIR/docker-compose.yml" \
    -p "$COMPOSE_PROJECT_ATLAS" "$@"
}

container_running() {
  [[ "$(docker inspect -f '{{.State.Running}}' "$1" 2>/dev/null)" == "true" ]]
}

container_exists() {
  docker inspect "$1" >/dev/null 2>&1
}

# ensure_container <label> <container> <compose-fn> <compose-service> <log-name>
#
# Running   -> reuse untouched (no compose call at all).
# Stopped   -> `up -d --no-recreate`, which starts the SAME container and keeps
#              its volume; --no-recreate guarantees we never replace it.
# Absent    -> `up -d` creates it from the repo's compose file, on the repo's
#              own ports, with the project's existing named volume.
ensure_container() {
  local label="$1" container="$2" compose_fn="$3" service="$4" logname="$5"

  if container_running "$container"; then
    ok "$label: reusing the running container '$container' (compose up skipped)"
    return 0
  fi

  if container_exists "$container"; then
    info "$label: container '$container' exists but is stopped — starting it"
  else
    info "$label: container '$container' is absent — creating it"
  fi

  "$compose_fn" up -d --no-recreate "$service" >"$LOG_DIR/$logname.log" 2>&1 || {
    tail -n 30 "$LOG_DIR/$logname.log" >&2
    die "$label: docker compose up failed — see $LOG_DIR/$logname.log"
  }
  ok "$label: '$container' up"
}

# ---------------------------------------------------------------------------
# Secrets
# ---------------------------------------------------------------------------
#
# ONE place for keys, outside every worktree. Sourced BEFORE the stack-owned
# vars are exported so the port wiring below always wins. Values are never
# printed — only which keys are present.

SECRET_KEYS=(
  POLYGON_API_KEY
  ANTHROPIC_API_KEY
  OPENAI_API_KEY
  ALPACA_API_KEY
  ALPACA_SECRET_KEY
  QUANT_STREAM_TOKEN
)

seed_secrets_template() {
  cat >"$SECRETS_FILE" <<'EOF'
# TrAIdit local stack — shared secrets. Sourced and exported by
# scripts/start_traidit.sh for every service in the stack.
#
# Lives OUTSIDE every repo on purpose: one place for keys, and the worktrees
# stay clean. Never commit this file. Never paste its values into a chat,
# a PR, or a log.
#
# Fill in what you have — every key is optional. An absent key means the
# matching lane reports honest unavailability; it never fabricates data.
#
# You can copy values across from ~/repos/traidit/.env if they already live there.

POLYGON_API_KEY=
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
ALPACA_API_KEY=
ALPACA_SECRET_KEY=

# Server-to-server bearer token for quant's internal /stream/compute. Optional:
# leave empty to run quant's stream auth "open" locally. Both the gateway and
# the quant service read this same variable, so one value wires both sides.
QUANT_STREAM_TOKEN=
EOF
  chmod 600 "$SECRETS_FILE"
}

load_secrets() {
  if [[ ! -f "$SECRETS_FILE" ]]; then
    seed_secrets_template
    warn "created a blank secrets file: $SECRETS_FILE"
    warn "fill it in for live provider/mind lanes (the stack still runs without it)"
  fi
  set -a
  # shellcheck disable=SC1090
  source "$SECRETS_FILE"
  set +a
}

report_secret_presence() {
  local key set_list=() unset_list=()
  for key in "${SECRET_KEYS[@]}"; do
    if [[ -n "${!key:-}" ]]; then set_list+=("$key"); else unset_list+=("$key"); fi
  done
  if (( ${#set_list[@]} )); then
    ok "keys set:   ${set_list[*]}"
  fi
  if (( ${#unset_list[@]} )); then
    dim "keys unset: ${unset_list[*]} (those lanes report honest unavailability)"
  fi
}

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

printf '\n%s  TrAIdit — full local stack%s\n' "$C_BLD" "$C_OFF"
printf '%s  %s%s\n' "$C_DIM" "$(date '+%Y-%m-%d %H:%M:%S')" "$C_OFF"

# --- 0. Preflight -----------------------------------------------------------
step "Preflight"

for cmd in git docker node curl lsof; do
  command -v "$cmd" >/dev/null 2>&1 || die "required command not found: $cmd"
done
command -v corepack >/dev/null 2>&1 || die "corepack not found (need Node >= 20 with corepack)"
command -v uv >/dev/null 2>&1 || die "uv not found — install it: https://docs.astral.sh/uv/"
docker info >/dev/null 2>&1 || die "Docker is not running. Start Docker Desktop and re-run."
ok "toolchain present; docker daemon up"

mkdir -p "$LOG_DIR" "$RUN_DIR"

# Idempotence: reap anything a previous run left behind before claiming ports.
stop_tracked_processes

# --- Service ports must be ours ---------------------------------------------
# With shared databases the stack IS the dev environment, so a hand-run service
# on one of these ports is a conflict, not a convenience.
require_port_free "web"   "$WEB_PORT" \
  "Stop whatever serves $WEB_PORT (a previous stack: bash scripts/stop_traidit.sh)."
require_port_free "gateway API" "$API_PORT" \
  "Stop it — most likely a hand-run 'pnpm dev:api' or 'pnpm dev'. The stack owns $API_PORT."
require_port_free "quant" "$QUANT_PORT" \
  "Stop whatever serves $QUANT_PORT (a hand-run uvicorn for the quant service?)."
require_port_free "atlas API" "$ATLAS_PORT" \
  "Stop whatever serves $ATLAS_PORT (a hand-run uvicorn for the Atlas API?)."
ok "service ports $WEB_PORT / $API_PORT / $QUANT_PORT / $ATLAS_PORT free"

# --- Shared database ports --------------------------------------------------
# These are expected to be held — by OUR containers. Held by anything else is a
# conflict we must not paper over.
for spec in "platform Postgres:$PG_PORT:$PG_CONTAINER" \
            "pgAdmin:$PGADMIN_PORT:$PGADMIN_CONTAINER" \
            "atlas Postgres:$ATLAS_PG_PORT:$ATLAS_PG_CONTAINER"; do
  db_label="${spec%%:*}"; db_rest="${spec#*:}"
  db_port="${db_rest%%:*}"; db_container="${db_rest##*:}"
  if container_running "$db_container"; then
    dim "$db_label: port $db_port held by '$db_container' (shared, expected)"
  else
    require_port_free "$db_label" "$db_port" \
      "'$db_container' is not running, so something else holds $db_port. Stop it — the shared database needs that port."
  fi
done

# --- Ingest confirmation ----------------------------------------------------
# Asked HERE, before the multi-minute install, so nobody discovers the prompt
# five minutes into a run.
if (( WITH_INGEST )); then
  printf '\n%s%s  --with-ingest WRITES TO THE SHARED ATLAS DATABASE  %s\n' \
    "$C_RED" "$C_BLD" "$C_OFF" >&2
  printf '%s  Target: container %s, db traidit_atlas on port %s.%s\n' \
    "$C_YEL" "$ATLAS_PG_CONTAINER" "$ATLAS_PG_PORT" "$C_OFF" >&2
  printf '%s  This is the SAME database your normal dev work reads. The ingest\n' "$C_YEL" >&2
  printf '  chain re-fetches and rewrites the reference universe (companies,\n' >&2
  printf '  listings, ETF holdings, Wikidata links, classifications, edges).\n' >&2
  printf '  It is the refresh path, not a startup step. It is not reversible\n' >&2
  printf '  from this script — there is no snapshot taken and no undo.%s\n\n' "$C_OFF" >&2
  if (( INGEST_CONFIRMED )); then
    warn "--yes-i-mean-it given; proceeding without a prompt"
  elif [[ -t 0 ]]; then
    printf '  Type %sINGEST%s to proceed (anything else aborts): ' "$C_BLD" "$C_OFF" >&2
    read -r ingest_answer
    if [[ "$ingest_answer" != "INGEST" ]]; then
      die "ingest not confirmed — nothing was started."
    fi
    ok "ingest confirmed"
  else
    die "--with-ingest needs confirmation, but stdin is not a terminal.
      Re-run interactively, or pass --yes-i-mean-it if you are certain."
  fi
fi

load_secrets
report_secret_presence

# --- Stack-owned environment (exported AFTER secrets so ports always win) ----
# apps/api/src/load-env.ts only fills keys NOT already in process.env, and the
# Atlas config uses os.environ.setdefault — so exported vars beat any .env.
export NODE_ENV="${NODE_ENV:-development}"
export PORT="$API_PORT"
export DATABASE_URL="postgres://postgres:postgres@localhost:$PG_PORT/traidit"
export QUANT_SERVICE_URL="http://localhost:$QUANT_PORT"
export ATLAS_API_URL="http://localhost:$ATLAS_PORT"
export ATLAS_DATABASE_URL="postgres://atlas:atlas@localhost:$ATLAS_PG_PORT/traidit_atlas"

# --- 1. Repos ---------------------------------------------------------------
step "Repos — clean check, fresh main"
prepare_repo "platform" "$PLATFORM_DIR"
prepare_repo "quant   " "$QUANT_DIR"
prepare_repo "atlas   " "$ATLAS_DIR"

# --- 2. Install -------------------------------------------------------------
if (( SKIP_INSTALL )); then
  step "Install — SKIPPED (--skip-install)"
else
  step "Install — fresh dependencies"
  info "platform: corepack pnpm install"
  ( cd "$PLATFORM_DIR" && corepack pnpm install ) >"$LOG_DIR/install-platform.log" 2>&1 \
    || { tail -n 40 "$LOG_DIR/install-platform.log" >&2; die "pnpm install failed — see $LOG_DIR/install-platform.log"; }
  ok "platform dependencies installed"

  info "quant: uv sync"
  ( cd "$QUANT_DIR" && uv sync ) >"$LOG_DIR/install-quant.log" 2>&1 \
    || { tail -n 40 "$LOG_DIR/install-quant.log" >&2; die "uv sync failed — see $LOG_DIR/install-quant.log"; }
  ok "quant environment synced"

  info "atlas: uv sync"
  ( cd "$ATLAS_DIR" && uv sync ) >"$LOG_DIR/install-atlas.log" 2>&1 \
    || { tail -n 40 "$LOG_DIR/install-atlas.log" >&2; die "uv sync failed — see $LOG_DIR/install-atlas.log"; }
  ok "atlas environment synced"
fi

# --- 3. Infrastructure ------------------------------------------------------
step "Infrastructure — the SHARED databases (reused, never recreated)"
ensure_container "platform Postgres" "$PG_CONTAINER" \
  compose_platform postgres compose-platform-postgres
ensure_container "pgAdmin" "$PGADMIN_CONTAINER" \
  compose_platform pgadmin compose-platform-pgadmin
ensure_container "atlas Postgres" "$ATLAS_PG_CONTAINER" \
  compose_atlas traidit-atlas-postgres compose-atlas-postgres

wait_for "platform Postgres" "" "$WAIT_DB" pg_ready "$PG_CONTAINER" postgres traidit
wait_for "atlas Postgres"    "" "$WAIT_DB" pg_ready "$ATLAS_PG_CONTAINER" atlas traidit_atlas

# --- 4. Atlas schema --------------------------------------------------------
# Idempotent and version-tracked, but it does run against the SHARED Atlas
# database. That is the same thing a hand-run `uv run atlas-migrate` does; the
# Atlas API needs the schema current to serve at all.
step "Atlas — migrate (idempotent; targets the shared $ATLAS_PG_CONTAINER)"
( cd "$ATLAS_DIR" && uv run atlas-migrate ) >"$LOG_DIR/atlas-migrate.log" 2>&1 \
  || { tail -n 40 "$LOG_DIR/atlas-migrate.log" >&2; die "atlas-migrate failed — see $LOG_DIR/atlas-migrate.log"; }
ok "atlas schema up to date"

if (( WITH_INGEST )); then
  step "Atlas — ingest chain (--with-ingest; SLOW, network-heavy)"
  warn "rewriting the SHARED Atlas reference universe in $ATLAS_PG_CONTAINER"
  warn "this hits SEC EDGAR / Wikidata / Polygon and takes several minutes"
  for cmd in atlas-ingest atlas-ingest-etfs atlas-ingest-holdings atlas-ingest-wikidata atlas-classify atlas-derive-edges; do
    info "running $cmd ..."
    ( cd "$ATLAS_DIR" && uv run "$cmd" ) >"$LOG_DIR/atlas-$cmd.log" 2>&1 \
      || { tail -n 40 "$LOG_DIR/atlas-$cmd.log" >&2; die "$cmd failed — see $LOG_DIR/atlas-$cmd.log"; }
    ok "$cmd done"
  done
fi

# --- 5. Services ------------------------------------------------------------
# Order: quant + atlas first so the gateway never boots into a degraded window,
# then the API (which auto-applies platform migrations on boot), then the
# optional worker, then the web app last.
step "Services"

start_service quant "$QUANT_DIR" \
  uv run uvicorn quant_service.api.app:app --host 127.0.0.1 --port "$QUANT_PORT"
wait_for "quant service" quant "$WAIT_QUANT" http_ok "http://localhost:$QUANT_PORT/health"

start_service atlas "$ATLAS_DIR" \
  uv run uvicorn traidit_atlas.api:app --host 127.0.0.1 --port "$ATLAS_PORT"
wait_for "atlas API" atlas "$WAIT_ATLAS" http_ok "http://localhost:$ATLAS_PORT/health"

start_service api "$PLATFORM_DIR" \
  corepack pnpm --filter @traidit/api dev
wait_for "gateway API" api "$WAIT_API" http_ok "http://localhost:$API_PORT/health"

if (( WITH_WORKER )); then
  start_service worker "$PLATFORM_DIR" corepack pnpm --filter @traidit/worker dev
  ok "worker started (no health endpoint — see $(log_file worker))"
fi

start_service web "$PLATFORM_DIR" \
  corepack pnpm --filter @traidit/web exec ng serve --host 0.0.0.0 --port "$WEB_PORT"
wait_for "web app" web "$WAIT_WEB" http_ok "http://localhost:$WEB_PORT/"

# --- 6. Post-boot soft checks ----------------------------------------------
step "Post-boot checks"
if http_ok "http://localhost:$API_PORT/api/docs"; then
  ok "Swagger UI reachable"
else
  warn "Swagger UI (/api/docs) not reachable — non-fatal"
fi
if http_ok "http://localhost:$QUANT_PORT/openapi.json"; then
  ok "quant OpenAPI reachable"
else
  warn "quant /openapi.json not reachable — non-fatal"
fi
if atlas_stats="$(curl -sf --max-time 6 "http://localhost:$ATLAS_PORT/stats" 2>/dev/null)"; then
  # Reachable is not the same as populated. The stack now points at the shared
  # Atlas database, so this should report the real universe — an empty one means
  # something is mis-wired, not that a first run needs seeding.
  atlas_companies="$(printf '%s' "$atlas_stats" \
    | sed -n 's/.*"companies_total"[[:space:]]*:[[:space:]]*\([0-9][0-9]*\).*/\1/p')"
  if [[ "${atlas_companies:-0}" -gt 0 ]]; then
    ok "atlas /stats — $atlas_companies companies in the shared reference universe"
  else
    warn "atlas /stats reachable but reports an EMPTY universe."
    warn "The stack points at the shared $ATLAS_PG_CONTAINER, which should already"
    warn "be populated — check ATLAS_DATABASE_URL wiring before reaching for ingest."
  fi
else
  warn "atlas /stats not reachable — non-fatal, but the Atlas seam will degrade"
fi

STARTUP_COMPLETE=1

# --- 7. Summary -------------------------------------------------------------
cat <<EOF

${C_GRN}${C_BLD}  TrAIdit is up.${C_OFF}

  ${C_BLD}${C_CYN}>>  http://localhost:$WEB_PORT   <-  the app${C_OFF}

  Gateway API        http://localhost:$API_PORT            (health: /health)
  Swagger UI         http://localhost:$API_PORT/api/docs
  Quant service      http://localhost:$QUANT_PORT           (health: /health, /openapi.json)
  Atlas API          http://localhost:$ATLAS_PORT           (health: /health, /stats)

  ${C_DIM}shared with your normal dev environment — left running by stop_traidit.sh${C_OFF}
  pgAdmin            http://localhost:$PGADMIN_PORT
  Platform Postgres  localhost:$PG_PORT         postgres/postgres  db traidit
  Atlas Postgres     localhost:$ATLAS_PG_PORT         atlas/atlas        db traidit_atlas

  Logs   $LOG_DIR
  PIDs   $RUN_DIR
  Stop   bash scripts/stop_traidit.sh   (or: pnpm stack:down)

EOF

if (( FOREGROUND )); then
  printf '%s  --foreground: tailing logs. Ctrl-C stops the stack'\''s services;%s\n' "$C_DIM" "$C_OFF"
  printf '%s  the shared database containers are left running.%s\n\n' "$C_DIM" "$C_OFF"
  # Services only. The databases are shared and were (almost certainly) up
  # before this script ran — tearing them down on Ctrl-C would take out the
  # rest of the dev environment with them.
  #
  # `set -m` puts the tail in its own process group, so a terminal Ctrl-C never
  # reaches it: the trap has to reap it explicitly or it outlives the script.
  on_interrupt() {
    printf '\n'
    step "Ctrl-C — stopping the stack services"
    [[ -n "${TAIL_PID:-}" ]] && kill "$TAIL_PID" 2>/dev/null
    stop_tracked_processes
    dim "shared databases left running (they are not this stack's to stop)"
    ok "stack down"
    exit 0
  }
  trap on_interrupt INT TERM
  tail -n 0 -f "$LOG_DIR"/*.log &
  TAIL_PID=$!
  wait "$TAIL_PID" || true
fi

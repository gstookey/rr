#!/usr/bin/env bash
# IDENTITY-01 S2 (ID-D11's amendment) — the break-glass launcher.
#
# The discoverable host-shell entry point to the fail-safe of last resort. The implementation lives
# at apps/api/src/scripts/auth-break-glass.ts, inside the api package, so it can reuse the
# application's OWN argon2 parameters and credential-digest functions rather than re-implementing
# them — drift there produces a "reset" password the app cannot verify, discovered at the worst
# possible moment.
#
# Its authentication factor is SSH access to this host: a factor no attacker holding the founder's
# mailbox, password or session possesses. Every command writes a break_glass_used row to the
# append-only auth_events log.
#
#   bash scripts/auth-break-glass.sh reset-password      --email grahamjstookey@gmail.com
#   bash scripts/auth-break-glass.sh clear-totp          --email grahamjstookey@gmail.com
#   bash scripts/auth-break-glass.sh mint-recovery-code  --email grahamjstookey@gmail.com
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

exec corepack pnpm --filter @traidit/api exec tsx src/scripts/auth-break-glass.ts "$@"

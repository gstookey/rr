# `scripts/`

**ATTENTION PROJECT ROAD RUNNER AGENTS! This folder contains examples in it and may result in runtime errors (null pointer exceptions, etc).**
**This needs to be customized for Project Road Runner. Use `*.example.*` files as templates.**

**Created:** 2026-07-22 | **Last updated:** 2026-07-23

Repo-side operational scripts. This page documents the **full-stack local
startup** pair; the other scripts here (`local-ci.sh`, `corpus-graph.mjs`,
`check-migration-collisions.mjs`, `snapshot-file-tree.sh`) are documented where
they are used.

---

## `start_traidit.sh` / `stop_traidit.sh` — the whole system, one command

```bash
# from the root of ~/repos/traidit
bash scripts/start_traidit.sh          # or: pnpm stack:up
bash scripts/stop_traidit.sh           # or: pnpm stack:down
```

Then open **<http://localhost:4321>**.

### The databases are shared, not the stack's own

**Graham's ruling, 2026-07-23.** The stack uses the **existing** dev databases —
the same containers, the same volumes, the same data:

| Container | Port | What it holds |
| --- | --- | --- |
| `traidit-postgres` | 5432 | the real platform DB (`traidit`) — agents, runs, evidence |
| `traidit-pgadmin` | 5050 | the DB browser, pre-provisioned against the above |
| `traidit-atlas-postgres` | 5433 | the real Atlas DB (`traidit_atlas`) — the reference universe |

An earlier revision generated compose overrides so the stack ran its **own**
Postgres containers on their own volumes. That worked, and it booted you into an
empty platform and an empty Atlas — which made the whole stack useless for
looking at anything. That machinery is gone. With shared databases the stack
**is** the dev environment, and it boots into real data.

What follows from that, and is enforced in the scripts:

- **Running containers are reused untouched.** `start_traidit.sh` checks whether
  each container is already running and, if so, issues no `compose up` for it at
  all. Both compose files pin an explicit `container_name`, which a `-p` project
  name does not override — so a `compose up` from a different working directory
  could otherwise collide with, or recreate, a container that is already
  serving. A stopped container is started with `--no-recreate`; an absent one is
  created from its repo's own `docker-compose.yml`.
- **The project names match the originals** (`traidit`, `traidit-atlas`), which
  is what keeps the existing named volumes (`traidit_postgres_data`,
  `traidit_pgadmin_data`, `traidit-atlas_atlas-pgdata`) attached.
- **Nothing in either script removes a container or a volume.** There is no
  `down`, no `down -v`, no `docker rm`. `stop_traidit.sh` stops the stack's
  *services* and leaves the databases running; `--stop-db` stops (never removes)
  the containers if you deliberately want the whole dev environment's databases
  down.
- **`--with-ingest` is now a data-mutating operation** and is gated. See below.

### What it drives

The script never builds or serves out of *this* working tree. It drives the
three clean clones under `~/repos/worktrees/`:

| Clone | What runs from it |
| --- | --- |
| `~/repos/worktrees/traidit` | gateway API, web app, optional worker (and the compose file for the shared Postgres + pgAdmin) |
| `~/repos/worktrees/traidit-quant-service` | quant FastAPI service |
| `~/repos/worktrees/traidit-atlas` | Atlas FastAPI service (and the compose file for the shared Atlas Postgres) |

Each clone is checked **clean**, fetched, put on `main`, and `pull --ff-only`'d
before anything is installed or started. A dirty clone **aborts the run** — the
script will never stash, reset, or discard work, and a non-fast-forwardable
`main` aborts too.

### Port block

| Service | Port | Note |
| --- | --- | --- |
| Web (Angular) | **4321** | fixed — the app; the bookmark |
| Gateway API | **3000** | shared/default — see the decision below |
| Platform Postgres | **5432** | SHARED, existing container |
| pgAdmin | **5050** | SHARED, existing container |
| Atlas Postgres | **5433** | SHARED, existing container |
| Quant service | **48100** | non-default (stateless; avoids collision) |
| Atlas API | **48000** | non-default (stateless; serves the shared 5433 DB) |

The databases sit on their normal ports because they *are* the normal dev
databases. The two stateless Python services move to `48xxx` so a hand-run
`uvicorn` on 8100/8000 cannot be mistaken for the stack's copy.

Every port is overridable via environment variable
(`TRAIDIT_STACK_WEB_PORT`, `TRAIDIT_STACK_QUANT_PORT`, …), though moving the
database ports away from what the containers already publish will simply fail
the health gate.

**Port conflicts abort the run.** Since the stack *is* the dev environment, a
process already on 4321, 3000, 48100 or 48000 is a conflict, not something to
work around: the script names the port and the holder and stops. It never
silently reuses a process it did not start — a hand-run `pnpm dev:api` on 3000
would look perfectly healthy while shadowing the stack's gateway.

### Two closed decisions about hardcoded ports

Both of these were carried as follow-ups in the first revision. They are now
**closed by decision**, not open debt.

> **Decision (2026-07-23): the gateway API stays on 3000, and
> `TRAIDIT_API_BASE_URL` stays hardcoded.**
> `apps/web/src/app/core/api/api-client.ts` exports
> `TRAIDIT_API_BASE_URL = 'http://localhost:3000'` as a constant. With shared
> databases the stack *is* the dev environment, so a second gateway on a
> different port would talk to the same database — moving it buys nothing.
> Making the constant configurable would mean touching every SSE/streaming
> client that imports it: real risk, for zero present benefit. So the script
> does not warn about it, does not work around it, and does not ask product
> code to change. If the platform ever needs two gateways at once against
> different databases, revisit it then.

> **Decision (2026-07-23): `apps/web/package.json` keeps `--port 4200`.**
> 4200 is the right default for a plain `pnpm dev:web`, and changing it would
> move a port for everyone to suit one script. The stack invokes
> `ng serve --port 4321` directly instead, which needs no change inside any
> clone — consistent with the rule that this script never edits a worktree.

### Flags

| Flag | Effect |
| --- | --- |
| `--skip-pull` | Use each clone exactly as it stands; no fetch/checkout/pull. |
| `--skip-install` | Skip `pnpm install` / `uv sync`. |
| `--with-ingest` | Also run the Atlas ingest chain. **Writes to the shared, populated Atlas database.** Slow (~5 min+), network-heavy (SEC EDGAR / Wikidata / Polygon). Gated — see below. |
| `--yes-i-mean-it` | Skip the `--with-ingest` confirmation prompt. Required to run `--with-ingest` non-interactively. No effect otherwise. |
| `--with-worker` | Also start the platform worker loop. |
| `--foreground` | Stay attached and tail every service log; Ctrl-C stops the stack's services (the shared databases stay up). Default is detached. |
| `--help` | Usage, current port block, state paths. |

`stop_traidit.sh` takes `--stop-db` (also stop — never remove — the shared
database containers) and `--help`.

#### `--with-ingest` mutates real data

The Atlas ingest chain re-fetches and rewrites the reference universe
(companies, listings, ETF holdings, Wikidata links, classifications, edges) in
`traidit-atlas-postgres` — the same database everything else reads. It is the
periodic **refresh** path, not a startup step, and it is not reversible from
this script: no snapshot is taken and there is no undo.

So it is gated. `--with-ingest` prints an explicit warning naming the target
container and database, then, **before the install step** so nobody meets the
prompt five minutes into a run, requires you to type `INGEST` to continue.
Non-interactively (CI, a pipe, a subagent) it refuses outright unless
`--yes-i-mean-it` is also passed.

Through pnpm, pass flags after `--`:

```bash
pnpm stack:up -- --skip-pull --with-worker
```

### State — everything lives outside the worktrees

```
~/.traidit-stack/
  secrets.env        shared API keys, sourced + exported for every service (chmod 600)
  logs/              per-service logs (previous run kept as <name>.log.prev)
  run/               per-service PID files
```

Override the root with `TRAIDIT_STACK_HOME`, and the clone root with
`TRAIDIT_WORKTREES_ROOT`.

**Secrets.** On first run the script creates a blank `~/.traidit-stack/secrets.env`
(mode 600) and tells you it did. Fill in what you have — `POLYGON_API_KEY`,
`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `ALPACA_API_KEY`, `ALPACA_SECRET_KEY`,
`QUANT_STREAM_TOKEN`. Every key is optional; an absent key means that lane
reports honest unavailability rather than fabricating data. The script reports
**which keys are set or unset — never their values** — and never writes a `.env`
into any worktree. Do not commit this file.

Why exported env instead of `.env` files: `apps/api/src/load-env.ts` only fills
keys **not already present** in `process.env`, and the Atlas config uses
`os.environ.setdefault`. Exported variables therefore win everywhere, which is
what lets the stack re-point ports and database URLs without touching a single
file inside a clone.

### Startup order and health gates

1. Preflight — required commands, Docker daemon, reap any previous run, service
   ports free, shared DB ports held by the right containers, ingest confirmation
   if asked for.
2. Clean-check → fetch → `main` → `pull --ff-only`, per clone.
3. `corepack pnpm install` (platform), `uv sync` (quant, Atlas).
4. Shared databases ensured up (reused if already running); wait on real
   `pg_isready`, not a blind sleep.
5. `atlas-migrate` (idempotent). Optional ingest chain.
6. quant → `/health`, Atlas → `/health`, gateway API → `/health`, optional
   worker, web → `/` last.
7. Soft post-boot checks: `/api/docs`, quant `/openapi.json`, Atlas `/stats`
   (which should now report the **real** universe — an empty one means
   mis-wiring, not a first run).

Platform database migrations are **not** a separate step — the API applies them
on boot (`main.ts` → `DatabaseService.ensureSchema()`). Both that and
`atlas-migrate` now run against the shared databases, exactly as a hand-run
`pnpm dev:api` or `uv run atlas-migrate` always did.

quant and Atlas start *before* the gateway so the API never boots into a
degraded window. Both seams degrade honestly if they are down, so the order is
an ergonomics choice, not a correctness requirement.

Any service that fails its health gate prints the tail of its log and aborts the
run, stopping whatever this run had already started. The shared databases are
left untouched on failure.

### Idempotence

Re-running `start_traidit.sh` is safe: it reaps its own tracked PIDs first,
running database containers are reused untouched, and `atlas-migrate` skips
applied versions. If a port is held by something the script did not start, it
aborts and shows you the holder rather than fighting for it.

### Stopping, and what is never destroyed

`stop_traidit.sh` stops the tracked service processes **by process group**, so
the children `tsx watch`, `ng serve` and `uvicorn` fork die with them — a bare
`kill <pid>` would leave those behind. It then reports any stack port still
listening.

The shared database containers are left running. Neither script contains
`docker compose down`, `down -v`, or `docker rm`; `--stop-db` uses `docker stop`,
which keeps both the container and its volume. **There is no path through these
scripts that can delete data.** If you ever want a container gone, do it
yourself, deliberately, with the volume named explicitly.

### Known follow-ups

**None.** The two hardcoded ports that were carried as follow-ups in the first
revision are now closed decisions (see "Two closed decisions about hardcoded
ports" above), and the empty-database problem is gone: the stack uses the real
databases.

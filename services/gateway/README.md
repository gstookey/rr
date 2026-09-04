# @rr/gateway

The **BFF** — the anticorruption layer from day one (`practical_picture_v0.md` §0, correction 3). The browser talks only to this service; it never holds a token and never queries a domain service directly.

**S0 scope is a skeleton and nothing more:**

| Route | S0 behaviour |
|---|---|
| `GET /healthz` | liveness, so docker-compose and the gate have something to ask |
| `GET /api/config` | returns `config/manifest.json` **verbatim** — a static placeholder |

**Deliberately absent in S0** (each has its slice): `openid-client` + the Postgres session store and `/api/me` (S1) · per-Floor routers with `SET LOCAL app.subject_*` for RLS (S2) · the SSE endpoint with per-subscriber projection (S3) · the Keycloak admin-API proxy (S7).

In S1 `/api/config` stops being static: it selects the manifest **per group** from the session's claims, which is the mechanism that lets a second manufacturer appear with zero code changes (S4's proof).

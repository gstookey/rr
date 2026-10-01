# @rr/gateway

The **BFF** — the anticorruption layer from day one (`practical_picture_v0.md` §0, correction 3). The browser talks only to this service; it **never holds a token** and never queries a domain service directly.

## S1 scope — the Building's back end

| Route | Kind | Behaviour |
|---|---|---|
| `GET /healthz` | — | liveness, plus which session store is actually in use |
| `GET /auth/login` | navigation | builds PKCE + state + nonce, stores them in the session, redirects to the identity provider |
| `GET /auth/callback` | navigation | exchanges the code (confidential client), resolves the subject, regenerates the session, sets the cookie, redirects to `returnTo` |
| `POST /auth/logout` | data | destroys the session and clears the cookie; returns the provider's RP-initiated logout URL when one is advertised |
| `GET /api/me` | data | the resolved subject, or **401 `SESSION_EXPIRED`**. Never a partial subject |
| `GET /api/config` | data | this subject's Building: per-group manifest (in order), Building-level marking, marking vocabulary, optional `landingFloor` |

Auth routes are **navigations and are deliberately not under `/api`** (AW-D18).

## Where to read what

| File | The seam it holds |
|---|---|
| `src/app.ts` | composition only — if logic lands here, the seams have blurred |
| `src/session/session.ts` | the BFF/cookie pattern: what the browser gets (a cookie) and what it does not (everything else) |
| `src/auth/oidc.ts` | the relying party; the issuer is **configuration**, which is why the proofs run with no Docker |
| `src/auth/subject.ts` | claims → `Me`, including the two resolutions the front end must not do |
| `src/config/manifest.ts` | the tailoring mechanism: a group **selects** Floors from one catalog |
| `config/manifest.json` | **the tailoring surface.** S4's proof is an edit to this file plus a realm group |

## Configuration

| Variable | Default | Note |
|---|---|---|
| `OIDC_ISSUER` | `http://localhost:8080/realms/acme-workshop` | Keycloak in `docker compose`; the tests point it at `@rr/mock-oidc` |
| `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET` | `acme-workshop-gateway` / `dev-only-not-a-secret` | mirrors the realm's confidential client |
| `OIDC_ALLOW_INSECURE` | `true` | permits `http://` issuers. **DEV/TEST ONLY**, and explicit so it is never an accident |
| `GATEWAY_BASE_URL` | `http://localhost:3000` | used to build the redirect URI |
| `APP_BASE_URL` | `''` (same origin, through the shell's dev proxy) | where sign-in outcomes land |
| `DATABASE_URL` | — | **absent ⇒ in-memory sessions (dev/test only)**; present ⇒ the Postgres store |
| `SESSION_SECRET` | `dev-only-not-a-secret` | replace outside dev |

**Deliberately absent in S1** (each has its slice): per-Floor routers with `SET LOCAL app.subject_*` for RLS (S2) · the SSE endpoint with per-subscriber projection (S3) · the Keycloak admin-API proxy (S7) · token refresh at the BFF and back-channel logout.

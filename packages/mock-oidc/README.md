# @rr/mock-oidc

A **tiny OIDC provider stub** for CI-side proofs (AW-D7 option A). It exists because the fleet's environment has no Docker daemon, so the S1+ auth proofs cannot start real Keycloak — but they must still run against the **same claim shape** the Keycloak mappers emit, or the proof proves nothing.

What it is: discovery document, JWKS with a key pair generated at start, `/authorize` that auto-logs-in a persona named by query parameter, `/token` issuing signed JWTs.

**What it is not:** an identity provider. There is no password check, no consent, no PKCE verification, no refresh rotation. Keys are ephemeral and in-memory. It must never be reachable from anything but a test.

The **real** Keycloak (`infra/docker-compose.yml`, realm `acme-workshop`) stays the source of truth for the claim shape — Graham's ruling, "real Keycloak from slice 1". When the two disagree, the realm JSON wins and this file is the one that changes.

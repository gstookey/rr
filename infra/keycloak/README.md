# `infra/keycloak/`

`realm-acme-workshop.json` is ACME Workshop's dev realm, imported on every boot by `keycloak start-dev --import-realm` (AW-D8, "realm as code"). The container mounts this directory read-only at `/opt/keycloak/data/import`.

**Everything in it is invented** — the manufacturers, the people, the group names, the handling levels and the compartment codes. No real organisation, person, marking string or program name appears anywhere.

## Status (2026-09-04, S0)

**This realm has never been imported.** It was authored with no Docker daemon available. What *was* verified:

- the JSON parses, and its **export shape** was checked field-by-field against the Keycloak project's own `testsuite/.../testrealm.json` on the `release/26.7` branch (users with `credentials`/`realmRoles`/`groups`/`attributes`; groups with `subGroups` and `attributes`; `roles.realm`; client `protocolMappers`);
- the three protocol-mapper provider IDs are the real ones, read from the 26.7 source (`oidc-group-membership-mapper`, `oidc-usermodel-attribute-mapper`, `oidc-audience-mapper`);
- the user-profile component key is the real one (`kc.user.profile.config`, from `DeclarativeUserProfileProvider.java`);
- `packages/mock-oidc/src/realm-parity.spec.ts` asserts, on every gate run, that this file and the CI-side OIDC stub describe the same seven personas and the same three claims.

What was **not** verified: that Keycloak accepts it. Graham's machine is the first import. If it is rejected, the error will name the offending property.

## One trap already avoided

There is deliberately **no `$comment` key** in the JSON — not at the top level, not anywhere. Keycloak deserialises a realm export with a stock Jackson `ObjectMapper` (`core/.../JsonSerialization.java`, release/26.7) that does **not** disable `FAIL_ON_UNKNOWN_PROPERTIES`, so any key outside `RealmRepresentation` aborts the import. That is why the provenance is in this README instead of inside the artifact, and why the generator (`scripts/gen-realm.py`) carries a comment saying so.

## What it contains

| | |
|---|---|
| Realm | `acme-workshop` |
| Client | `acme-workshop-gateway` — **confidential**, standard flow only, redirect `http://localhost:3000/auth/callback`. Confidential because the browser never holds a token (BFF/cookie pattern, DA-D17). |
| Groups | `/ttw` (Tick-Tock Watchworks) with subgroup `/ttw/nwl` (Northwind Logistics, TTW's B2B customer) · `/mer` (Meridian Wearables) · `/acme-staff` |
| Realm roles | `group-admin` (Cy, Eli) · `platform-admin` (Gus) |
| Client scope | `acme-workshop` — three mappers putting `groups` (**full paths**), `handling_level` and `compartments` into the token |
| Users | ada · bram · cy · dee · eli · fay · gus — password `changeme`, dev only |

Group attributes carry the tailoring data the manifest will be built from in S1/S4: `compartment`, `tenant_kind`, `display_name` and `floors`. Note that `/mer`'s `floors` deliberately **omits `vigilance`** and `/ttw/nwl`'s contains **only** `vigilance` — that asymmetry is rung 4 of the Boundary Test and S4's proof, sitting in data from day one.

## Regenerating

`python3 scripts/gen-realm.py` rewrites the JSON from the roster in that script. Edit the generator, not the output — and keep it in step with `packages/mock-oidc/src/personas.ts`, which the parity test compares against.

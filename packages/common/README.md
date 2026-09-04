# @rr/common

The **published language**: Zod 4 schemas + inferred types, one module per bounded context (`front-desk`, `invent`, `command`, `vigilance`), plus the cross-cutting `Marking` value object.

**Fence rule (Sheriff):** this package imports nothing internal. It is the one contract both the browser and the BFF depend on, so a dependency here would cross every boundary at once.

**S0 status:** the four context modules are placeholders with a single real, tested schema — `Marking` — which the seed validator (`scripts/seed.mjs`) enforces on every seeded row.

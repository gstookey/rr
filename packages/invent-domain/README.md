# @rr/invent-domain

The **Invent** Floor's domain library: value objects, view-model types and pure selectors for the Inventory bounded context.

**Two fence rules, both machine-checked** (`sheriff.config.ts`, tags `type:domain` + `scope:invent`):

1. **No Angular.** A domain library that imports the Angular runtime stops being portable into the BFF, and stops being testable without a TestBed.
2. **No other Floor.** `@rr/command-domain` is invisible from here. Command consumes Invent's `DeviceRegistered` *event* through `@rr/common` and keeps its own projection (customer-supplier with an ACL) — it never reads Invent's types or tables.

`scripts/prove-fence.sh` proves rule 2 by temporarily violating it and asserting that the gate goes red.

**S0 status:** stub. One type, so the fence has something real to guard.

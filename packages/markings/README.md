# @rr/markings

Marking renderers — driven by a vocabulary served at runtime. **This package ships no level names, no compartment names, no colours and no banner strings.**

**S1 status:** live — `RrMarkingBanner`, `RrMarkingChip`, and the pure `resolveMarking()` they share. (`portion-mark` arrives with S2's marked rows.)

Three outcomes, and the third is why the package exists (`mac_stores_brief_v0.md` §6):

1. **nothing yet** — before the vocabulary arrives, nothing marking-shaped paints; the band keeps its height so the page does not jump;
2. **resolved** — the banner string comes from `markingBanner()` in `@rr/common` using the vocabulary's separator, and the colour is a `--rr-*` custom-property SLOT the vocabulary named and the tenant's theme gave a value (AW-D22);
3. **unresolved** — an explicit state with the raw marking shown as data. Never a guess, and never a silent `OPEN`.

The banner is built from canonical **ids** (`TTW`), never the vocabulary's human labels ("Tick-Tock Watchworks") — a tenant's name does not belong in a banner.

**Fence note:** tagged `type:ui`, which may not import `type:data-access` — so the vocabulary arrives as a signal `input()` rather than from an injected store. The fence made the renderer pure with respect to its data.

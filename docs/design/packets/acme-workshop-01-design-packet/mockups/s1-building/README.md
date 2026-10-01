---
schema: corpus-doc/v1
status: exploratory
title: ACME Workshop S1 "The Building" — mockup pass design note (shell chrome, lobby, sign-in)
areas: [frontend, ux, system-architecture]
claims: ["region:building-banner", "region:building-identity-bar", "region:building-elevator", "region:building-content-slot", "route:lobby", "route:sign-in"]
related: ["docs/design/packets/acme-workshop-01-design-packet/README.md", "docs/design/packets/acme-workshop-01-design-packet/slice_decomposition_v0.md", "docs/design/packets/acme-workshop-01-design-packet/domain_model_v0.md", "docs/design/packets/ddd-arch-01-design-packet/tier_model_exploration_v0.md", "docs/design/packets/ddd-arch-01-design-packet/practical_picture_v0.md", "docs/design/packets/ddd-arch-01-design-packet/architecture-description/V8-tier-information-architecture.md", "docs/context/platform/research/mac_stores_brief_v0.md", "docs/context/platform/research/ddd_ui_ux_brief_v0.md", "docs/design/packets/acme-workshop-01-design-packet/mockups/s1-building/tokens.md"]
updated: 2026-09-08
---

# S1 "The Building" — mockup pass

**Created:** 2026-09-08 | **Author:** Cadence (UI Designer), dispatched by Axium for board story **S-19 (#39)** | **Status:** `exploratory` — the blocking mockup pass for S1; Marlow builds from this

**Doctrine consulted:** ADR-007 (ACME is a learning instrument — **legibility outranks hardening**) · `acme-workshop-01-design-packet/README.md` (the Building, its Floors, the fictional marking vocabulary) · `domain_model_v0.md` (tenants, personas, lexicon) · `slice_decomposition_v0.md` (the **S1 row** is the scope and the proof) · `tier_model_exploration_v0.md` §2, §4 (Building/Floor/Suite/Office; the group overlay is claims + manifest + labels + tokens, never a code tier) · `practical_picture_v0.md` §2 (the request sequence), §3 (tailoring mechanics) · `V8-tier-information-architecture.md` (tier/IA, URL design, "a group is not a tier") · `mac_stores_brief_v0.md` §6 (the UI is never the enforcement point; markings render from a runtime vocabulary; no-leak contract) · `ddd_ui_ux_brief_v0.md` §4.5 (hide vs disable vs **absent**; `CanMatch` for entitlement, `CanActivate` for state) · in code: `packages/common/src/marking.ts` (`Marking`, `dominates()`, `markingBanner()`), `infra/keycloak/realm-acme-workshop.json` (the personas' real `handling_level` / `compartments`), `services/gateway/config/manifest.json` + `src/app.ts` (the S0 manifest and its `CONFIG_UNAVAILABLE`), `apps/shell/src/app/` (the S0 stubs). Corpus-graph `lookup frontend` run before designing.

## Files

| File | What it is |
|---|---|
| [`shell-chrome.html`](shell-chrome.html) | the Building's chrome — banner, identity, elevator, acting-as affordance, empty content slot. **Ada (four Floors) and Fay (one Floor) side by side**, plus the pre-hydration, manifest-unavailable and unresolved-marking states |
| [`lobby.html`](lobby.html) | the Lobby at `/` — the Floor directory, each variant printed beside the manifest fragment that produced it |
| [`sign-in.html`](sign-in.html) | the signed-out surface — signed out, leaving, session-ended. **No credential form, by design** |
| [`tokens.md`](tokens.md) | the `--acme-*` token sketch: palette, marking hues, type, rhythm, and the `@rr/ui` façade note |

All three HTML files are static, self-contained (inline `<style>`, no script, no fetch, no CDN), semantic, and carry both
themes through `prefers-color-scheme`. Open them from `file://`. Every name, manufacturer, marking and coordinate is
fictional, and the marking vocabulary is ACME's own invention.

## Design intent

ACME Workshop is a **learning instrument**, so these mockups are designed to be *read* as much as used: the reader
should be able to look at two screenshots side by side and see the architecture, not infer it. That produced three
decisions. First, **every surface is drawn twice, once per persona** — the difference between Ada's Building and Fay's
Building is the entire product of S1, and a single-persona mockup would have hidden it. Second, **the chrome is
restrained to the point of plainness**: one accent colour, one border weight, no shadows, no ornament, identifiers in
monospace — because anything decorative on this screen would be a thing the reader has to decide is *not* part of the
architecture. Third, **the empty room is drawn as an empty room**: the content region is a labelled dashed slot naming
the Floor that will mount there and the slice it arrives in. S1 builds a Building with no Floors in it; a mockup that
filled the middle with plausible content would have made S1 look like a failure instead of a foundation.

What the chrome must never imply is that it is doing any enforcing. The banner reports; the elevator lists; the
clearance chip describes the reader. Every one of them is rendered from data the gateway already decided to send, and
the gateway re-checks on every request regardless of what the browser drew (`mac_stores_brief_v0` §6, ASVS 5.0 §8.3.1).

## Seam inventory — what S1 makes visible, and how a reader sees it

| Seam | How a reader sees it on screen |
|---|---|
| **Identity** — who is signed in, and as what | The identity bar's acting-as block: *Ada Vance · acting as Tick-Tock Watchworks · `INTERNAL · TTW`*. Name, group and clearance are three separate lines because they are three separate facts, and the clearance chip is styled as data (monospace, marking-hue edge), not as a badge of rank. Signed out, the whole block is absent — not a placeholder avatar. |
| **Claims → manifest** | The elevator rail and the Lobby cards, with the **manifest fragment printed beside them** in `lobby.html`. Ada's `/ttw` manifest lists four Floors and four appear, in the manifest's order; Fay's `/ttw/nwl` manifest lists one and one appears. The shell holds no Floor list of its own — that is exactly what the two fragments prove. |
| **Markings from a runtime vocabulary** | The banner band at top *and* bottom of every signed-in screen: `INTERNAL//TTW` for Ada, `PARTNER//TTW/NWL` for Fay — one string, produced by `markingBanner()`, coloured by a hue the served vocabulary named. The **unresolved-marking** tile shows what happens when the vocabulary cannot resolve a marking: an explicit unresolved state and the raw marking as data, never a guess and never a silent OPEN. |
| **Absent, not disabled** | Fay's elevator and Lobby. There is nothing to point at: no greyed rows, no padlocks, no "request access". **The proof is the absence** — the route does not match, the chunk is never fetched, the nav item is never rendered (`ddd_ui_ux_brief_v0` §4.5). The mockups contain zero disabled Floor affordances anywhere, on purpose, so that no one builds one from a mockup. |
| **No token in the browser** | The sign-in page: a single *Continue to sign in* link that leaves the application, an explicit "you will be sent to your organisation's sign-in service", and the session line in the identity bar reading *session cookie · sign out* — no expiry countdown, no token, no account chooser. The absence of a username/password form is the seam, drawn. |
| **Fail-closed before hydration** | The banner region is reserved and *empty* until the vocabulary resolves, and the elevator is skeletal rather than guessed. Nothing marking-shaped paints early, and no Floor is shown before the manifest says it exists. |

## States each surface must have

| State | Where | What it looks like |
|---|---|---|
| **Loading / pre-hydration** | shell chrome | `/api/me` + `/api/config` in flight: banner reserved but blank, skeleton elevator, slot reading "waiting on /api/me and /api/config". Banner height is reserved so nothing jumps. |
| **Signed out** | sign-in | Wordmark, one sentence, one *Continue to sign in* link, the never-sees-your-password footnote. No marking banner (nothing to mark; no vocabulary for an anonymous caller). |
| **Leaving (redirecting)** | sign-in | Named hand-off state plus a manual link — a silent redirect that fails is how a reader learns nothing. |
| **Signed in** | shell chrome, lobby | Banner top and bottom, identity bar, elevator (Floors only), content slot or Floor directory. |
| **Exactly one Floor** (Fay) | shell chrome, lobby | A one-item elevator and a one-card Lobby. The Lobby is **not** replaced by an auto-jump into the Floor: a single-Floor tenant still needs somewhere to sign out from and somewhere to stand when the Floor fails to load. If S1 wants a faster path, the manifest carries a `landingFloor` and the elevator opens on it — the Lobby survives either way. |
| **Error — manifest unavailable** | shell chrome | Fail closed with the gateway's own typed code (`CONFIG_UNAVAILABLE`), no elevator drawn, no cached Floor list, retry + sign out. |
| **Error — session ended / sign-in failed** | sign-in | Screen cleared first, then `SESSION_EXPIRED` / `SIGN_IN_FAILED`. Error copy names what happened to *you* and never what exists on the other side: forbidden and non-existent read identically. |
| **Unresolved marking** | shell chrome | Dashed banner rule, the literal words *UNRESOLVED MARKING*, the raw marking shown as data, content withheld. |

## What this deliberately does not design

Everything below is S2 or later, and a mockup of it now would be a guess with a picture attached:

- **Floor interiors, Suite navigation and Office chrome** — no tabs, no toolbars, no breadcrumb beyond `Building / Floor`.
- **The utility-window chrome (`@rr/windows`)** — the Device inspector is the first window and it is **S2** (AW-D10). See the ambiguity note below: the packet's fleet line puts "the window chrome" in this pass, the slice table puts the window in S2, and I have followed the slice table.
- **Invent's device registry and catalog tables, markings on rows, portion marks on fields** — S2. The banner is the only marking surface S1 has, because it is the only one S1 has data for.
- **Vigilance's fleet board, the SSE live read model, the Cesium map** — S3/S5.
- **Command's campaigns, approval steps, vectors, the entitlement paywall** — S6.
- **Front Desk's people/groups admin** — S7.
- **Per-tenant theming, copy overrides, capability flags in the UI** — S4; `tokens.md` §5 names the mechanism (re-declare the custom properties from `/api/config`) and stops there.
- **A group switcher** — no seed persona holds two groups; register question **Q2**. Adding one now would put tenancy in the UI's hands, which V8 exists to prevent.
- **Responsive/mobile layouts, a full WCAG audit, motion.** The mockups keep semantic structure, visible uniform focus, a colour-plus-word rule for every marking, and no animation at all (so `prefers-reduced-motion` has nothing to honour); a real a11y pass belongs with real content.

## Open questions this design hands to Marlow

1. **Manifest shape.** The Lobby and elevator need, per Floor: `id`, `label`, `route`, and — for the Lobby card — a one-line `blurb`. Does the manifest carry the blurb, or does the shell? (I have drawn it as manifest data; a blurb in the shell is a Floor fact living in the Building.) Is manifest **order** meaningful (I have assumed yes: render as served, do not sort)?
2. **A Building-level `marking` in the manifest.** The banner needs a `Marking` for the Lobby and for a Floor with no data loaded yet. I have drawn Ada's as `INTERNAL//TTW` and Fay's as `PARTNER//TTW/NWL` — i.e. the group's own marking from `seed/tenants.json`. Confirm the manifest carries it, and decide the rule for a Floor whose loaded rows are marked *higher* than the surface (S2's problem, but the banner is built now).
3. **`landingFloor`** for single-Floor manifests — carry it or not (see "exactly one Floor").
4. **Route and endpoint names.** I have used `/` (Lobby), `/sign-in` (the shell's signed-out route), `/auth/login` and `/auth/callback` (gateway, deliberately *not* under `/api` since they are browser navigations, not XHR), `/api/me`, `/api/config`. Confirm or rename; the mockups are the only place these strings currently appear together.
5. **Typed error codes the UI renders.** `CONFIG_UNAVAILABLE` exists in `services/gateway/src/app.ts`. `SESSION_EXPIRED` and `SIGN_IN_FAILED` are my invention on the mockups — mint them in the gateway (and in `@rr/common`) or tell me the real ones.
6. **Where the acting-as group's *display name* comes from.** The realm carries `display_name` on the group (`Tick-Tock Watchworks`); `/api/me` should return it resolved, so that no component maps a group path to a label.
7. **Clearance chip content.** I show `INTERNAL · TTW` (and Gus's `RESTRICTED · TTW, TTW/NWL, MER`). Compartment lists grow; confirm the truncation rule (I would show the first two plus "+n", never a scrollbar in the chrome).
8. **Token prefix.** `tokens.md` §2 flags it: the manifest already names `--rr-marking-*`, the mockups use `--acme-marking-*`. Settle it in S1.
9. **Does the elevator rail persist on the Lobby?** I have drawn the Lobby full-width (the directory *is* the page) and the rail only on Floors. If Marlow prefers one constant layout, the rail can stay with nothing current-marked — say so and I will redraw; it is a one-line change to the mockup.

## Ambiguities and contradictions found (surfaced, not smoothed)

1. **"The window chrome" is in two slices at once.** The packet README's fleet line and the slice decomposition's sequencing note both put "shell, lobby, Floor chrome, **the window chrome**" in Cadence's S1 pass, but the S1 scope row contains no `@rr/windows` and the S2 row contains `@rr/windows` *and* the Device inspector (AW-D10). I designed no window chrome: S1 has no window to host and no Office to host it over, and drawing an inspector frame now would be designing S2's surface without S2's data. If Graham wants window chrome inside S1, it should be dispatched as an explicit S2-preview mockup, with the Device inspector's content stubbed.
2. **"Floor chrome" has no Floor in S1.** Same tension, resolved the same way: what I have drawn as Floor chrome is the Building chrome *with a Floor selected* — breadcrumb, current-Floor bar in the elevator, and a labelled empty slot. Anything more would be S2's.
3. **Token prefix drift** — `--rr-marking-*` (manifest, shipped in S0) vs `--acme-marking-*` (this pass). Recorded in `tokens.md` §2 with a recommendation; not silently reconciled.
4. **Manifest order vs packet order.** `services/gateway/config/manifest.json` lists Floors as front-desk · invent · command · vigilance; `domain_model_v0.md` lists TTW's as Invent · Command · Vigilance · Front Desk. I rendered the packet's order and made "render as served" the rule, which means the S0 manifest's order needs a deliberate decision when it becomes per-group, rather than inheriting an alphabetical accident.
5. **Banner top *and* bottom.** `mac_stores_brief_v0` §6 says banners render top and bottom of every screen, window and print view. That is a real-marking-practice convention carried into a fictional vocabulary; I have honoured it because the study's job is to exercise the mechanism, but it costs vertical space on a small viewport and no doctrine yet says what happens on a phone. Flagged, not decided.

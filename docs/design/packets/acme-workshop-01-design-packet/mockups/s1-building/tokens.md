---
schema: corpus-doc/v1
status: exploratory
title: ACME Workshop S1 — token sketch for the Building chrome (--acme-* custom properties)
areas: [frontend, ux, brand-design]
related: ["docs/design/packets/acme-workshop-01-design-packet/mockups/s1-building/README.md", "docs/design/packets/acme-workshop-01-design-packet/README.md", "docs/design/brand/README.md", "docs/context/platform/research/mac_stores_brief_v0.md"]
updated: 2026-09-08
---

# ACME Workshop — S1 token sketch

**Created:** 2026-09-08 | **Author:** Cadence (Workstation UI Designer), for S-19 / S1 "The Building" | **Status:** `exploratory` — a sketch sized to S1, not a design system

Only what S1's chrome needs: a small palette, four marking hues, five type steps, one spacing rhythm.
Everything below is a **CSS custom property** so `@rr/ui` can map it later without touching a component.
The three mockup HTML files in this folder declare exactly this set — they are the reference implementation of this table.

## 1 · Palette

Two themes, one token set, switched by `prefers-color-scheme`. No third theme in S1.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--acme-ground` | `#f2f4f5` | `#14181b` | page background behind the Building |
| `--acme-surface` | `#ffffff` | `#1c2126` | the chrome itself: identity bar, elevator, cards |
| `--acme-sunk` | `#e8ebee` | `#23292f` | banner band, empty content slot, code blocks, hover |
| `--acme-ink` | `#191d21` | `#e6eaed` | primary text |
| `--acme-ink-muted` | `#5b656e` | `#9aa5ae` | secondary text, routes, meta, captions |
| `--acme-rule` | `#ccd3d9` | `#333c44` | hairlines between regions |
| `--acme-rule-strong` | `#a8b2ba` | `#4c5760` | the Building's outer edge, card borders, dashed slots |
| `--acme-accent` | `#2d6d8c` | `#6fb2d0` | the *one* interactive colour: links, primary button, current-Floor bar, focus ring |
| `--acme-accent-ink` | `#ffffff` | `#0d1114` | text on the accent |
| `--acme-danger` | `#8c3a2c` | `#e08a78` | error rule on notices; never a fill, never a marking |

One accent, deliberately. An instrument panel that colours six things has told the reader that none of them matters.

## 2 · Marking hues — ACME's own, and a ramp on purpose

| Token | Light | Dark | Level |
|---|---|---|---|
| `--acme-marking-open` | `#5f6b76` | `#9aa6b1` | OPEN |
| `--acme-marking-partner` | `#5b5296` | `#a89ce4` | PARTNER |
| `--acme-marking-internal` | `#7a4a8e` | `#c493dd` | INTERNAL |
| `--acme-marking-restricted` | `#8c3d68` | `#e58cb6` | RESTRICTED |
| `--acme-marking-unresolved` | `#6a6a6a` | `#9a9a9a` | a marking the served vocabulary cannot resolve |

Rules that come with them:

1. **Fictional by construction.** Slate → violet → purple → plum is a monotone ramp invented for ACME. It deliberately
   avoids every real-world classification colour convention, and no real marking string appears anywhere in this repo.
2. **Never the sole cue.** Colour appears only as a 2px rule under the banner, a 9px swatch, and a 3px chip edge —
   always beside the level *word*. A reader with no colour vision loses nothing (R2/R5 lens, `mac_stores_brief_v0` §6).
3. **These values are defaults for the study, not doctrine.** `@rr/markings` ships **no** level names, compartment
   names, colours or banner strings. The vocabulary served by `/api/config` names a *token*; the token resolves here.
   A different island ships a different stylesheet and the same component renders it.
4. **Banner string is `markingBanner()` from `@rr/common`** — `LEVEL` alone, or `LEVEL//COMP, COMP` with compartments
   sorted and joined by `, ` (a sub-compartment already contains a `/`). The UI never composes that string itself.

> **Naming drift to settle in S1 (flagged, not smoothed):** `services/gateway/config/manifest.json` already names its
> colours `--rr-marking-open|partner|internal|restricted` — the `@rr/*` base-library prefix — while this sketch and the
> mockups use `--acme-marking-*`, the tenant-product prefix. Both are defensible: the *primitive* is `@rr/markings`
> (base), the *palette* is ACME's (tenant). Pick one in S1 and make the manifest and the stylesheet agree; my
> recommendation is that the **manifest names an abstract slot** (`"colourToken": "--acme-marking-internal"`) and the
> theme stylesheet owns the value, because the day a second tenant themes its markings, the base prefix would be a lie.

## 3 · Type

System faces only. The mockups must render identically on an island with no network, and RR's brand faces
(Orbitron / Rajdhani / Inter / Space Mono) are neither self-hosted yet (C-005) nor ACME's — ACME is a fictional
tenant product, not RR's brand surface.

| Token | Value | Used for |
|---|---|---|
| `--acme-font-ui` | `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif` | everything |
| `--acme-font-mono` | `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace` | **identifiers**: routes, markings, serials, error codes, JSON |

| Step | Size | Used for |
|---|---|---|
| `--acme-text-xs` | 11px | banner string, chips, meta, tier labels (uppercase, `letter-spacing: 0.08–0.14em`) |
| `--acme-text-sm` | 13px | dense UI, captions, secondary copy |
| `--acme-text-md` | 15px | body, Floor card titles |
| `--acme-text-lg` | 18px | surface titles ("Floors"), the wordmark in chrome |
| `--acme-text-xl` | 24px | the wordmark on the signed-out page |

Rule: **anything the machine also reads is monospace.** A route, a marking, a serial and an error code are identifiers;
setting them in the UI face invites a reader to treat them as prose. Line-height 1.5 throughout; 1.35 under 13px.

## 4 · Rhythm and shape

`--acme-space-1..6` = **4 · 8 · 12 · 16 · 24 · 32** px — Astro's 4px grid, kept so the façade lands on it (brand rule:
override Astro tokens, never fork Astro components).

`--acme-radius: 2px`, one border weight (`1px`), one emphasis weight (`3px` left rules, `2px` banner rules).
No shadows, no gradients, no elevation scale in S1: the Building has no overlapping surfaces until `@rr/windows`
arrives with the Device inspector (S2), and inventing an elevation system before there is anything to elevate is how
token sets rot.

Focus is visible and uniform: `outline: 2px solid var(--acme-accent); outline-offset: 2px`.

## 5 · The `@rr/ui` façade note

**AstroUXDS is the eventual design system behind `@rr/ui`, and nothing in this folder imports or reproduces it.**
The mockups are plain semantic HTML over the tokens above so that the façade can map them, in this order:

- `@rr/ui` wraps Astro components (`@astrouxds/angular`) with signal `input()`s and re-declares `OnPush`; it **may not**
  import data-access (`practical_picture_v0` §1). Tokens are the whole of its styling contract.
- Each `--acme-*` token becomes either (a) an override of an Astro custom property, or (b) an RR/ACME-specific property
  Astro has no equivalent for — the marking hues are case (b), and Astro's own classification-marking component is
  **not** used, because it carries a fixed classification enum (`mac_stores_brief_v0` §6). `@rr/markings` owns marking
  rendering, from the runtime vocabulary.
- Astro's status colours (critical / serious / caution / normal / standby / off) are kept for *device health* when
  Vigilance arrives (S3). They are **not** in this sketch, and they must never be reused for markings: a level is not a
  severity, and a reader who learns "red means bad" will misread "plum means restricted".
- Per-tenant theming (S4) works by re-declaring these same custom properties from `/api/config`'s `theme.tokens` on the
  Building's root element. That is the only mechanism; no tenant-conditional CSS class, ever.

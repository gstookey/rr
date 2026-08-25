---
schema: corpus-doc/v1
status: accepted
title: Brand — Visual Identity
areas: [brand-design, frontend, content-style]
related: ["docs/context/canonical/technology_stack.md", "docs/context/governance/contradictions/register.md"]
updated: 2026-08-25
---

# Brand — Visual Identity

**Created:** 2026-08-25

Source of record: **SRC-001**, `docs/source-documents/monorepo-set-up-docs/angular-application-stand-up-docs/styling/project-rr-style-guide.md` (Brand Guidelines v1.0, 2026-08-25). This page indexes it; it does not restate it.

## In one glance

- **Promise:** Speed. Precision. Unstoppable. **Voice:** direct, technical, mission-focused.
- **Theme:** AstroUXDS dark, pushed toward black; orange-glow accent family (`--rr-orange-300..600`); desert earth mids (`--rr-sand-400`, `--rr-brown-500..900`); cream body text (`--rr-cream`).
- **Type:** Orbitron (display), Rajdhani (UI headers), Inter (body), Space Mono (telemetry/code), Black Ops One (sparingly).
- **Rule:** override Astro tokens; never fork Astro components. Keep Astro's 4px grid and status colors.

## Assets

- Logo candidates: `images/rr_logos/` (57 JPGs, generated). **No master vector exists yet.** Selecting the master emblem is a Graham decision; then Cadence derives the suite the guide describes (emblem, icon, wordmark, banner, favicon set).
- Token file `_roadrunner-tokens.scss`: referenced by the guide, **absent** (C-005). To be authored under this folder.

## Open

- Pick the master logo (Graham).
- Author `_roadrunner-tokens.scss` from the palette table (Cadence).
- Decide whether Google-Fonts-only faces are acceptable given the isolated network — self-hosting WOFF2 is the safe default.

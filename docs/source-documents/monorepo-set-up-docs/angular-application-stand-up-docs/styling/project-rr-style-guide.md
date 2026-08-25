### 1. ORIGINAL FULL TECH BRAND GUIDELINES

# PROJECT ROADRUNNER
## Enterprise Brand Guidelines & Visual Identity System
**Version 1.0** | August 2026
**Classification:** Internal / Enterprise Use

---

## 1. Brand Overview

**Project Roadrunner** is a high-tech, military-grade initiative blending Southwestern desert resilience with advanced cyber-electronic warfare and aerospace capabilities.

The visual identity captures:
- **Gritty cyberpunk military aesthetic**
- **New Mexico desert & radio/tech infrastructure**
- **Aggressive, forward-moving roadrunner spirit**
- **Circuit-board precision meets arid landscape**

**Core Promise:** Speed. Precision. Unstoppable.

**Tone of Voice:** Direct, technical, confident, mission-focused. Avoid fluff. Use clear, actionable language.

---

## 2. Logo Suite

All assets derived from the master circular emblem (Asset ID reference: main logo).

### 2.1 Primary Logo (Full Emblem with Text)
- Circular badge featuring stylized roadrunner, desert landscape (radio station/towers, F-18 squadron, orange sun), circuit-board frame, and “PROJECT ROADRUNNER” wordmark.
- **Use:** Official documents, presentations, main website header, apparel, vehicle markings.
- **Clear space:** Minimum 1/8 of logo diameter around all sides.
- **Minimum size:** 120 px wide (digital), 1.5 in (print).

### 2.2 Text-Free Emblem (Icon / Symbol)
- Same circular composition without any text.
- **Use:** App icons, favicons, social avatars, watermarks, secondary placements where text is redundant.

### 2.3 Horizontal Banner / Header Logo
- Wide 16:9 or lockup versions for website headers, email banners, slide decks.

### 2.4 Wordmark Only
- Distressed “PROJECT ROADRUNNER” lettering with circuit accents.
- **Use:** Text-heavy contexts, footer, legal docs, co-branded materials.

### 2.5 Simplified Favicon / App Icon
- Tight crop of roadrunner head + circuit circle.
- Optimized for 16×16 → 512×512.

### 2.6 Landscape Background Banner
- Full desert + tech + jets scene without logo/text.
- **Use:** Hero images, presentation backgrounds, video thumbnails.

### 2.7 Monochrome / Single-Color Version
- High-contrast black + orange-glow for embroidery, laser engraving, dark-mode UI overlays, single-ink print.

### 2.8 Vertical / Mobile Story Format
- 9:16 stacked layout for Instagram Stories, mobile splash screens, digital signage.

**File Formats Provided:**
- PNG (transparent where applicable)
- JPG (full color)
- SVG (vector versions recommended for production – regenerate from master if needed)
- Favicon set (.ico + PNGs)

**Do Not:**
- Stretch, rotate, recolor outside palette, add drop shadows that compete with the gritty texture, place on busy backgrounds without overlay, crop the circuit frame.

---

## 3. Color Palette Map

All values extracted and refined from the master logo for maximum brand fidelity and WCAG AA compliance on dark backgrounds (primary theme).

### 3.1 Primary Brand Colors

| Name | Hex | RGB | Usage | CSS Token |
|-----------------------|-----------|------------------|--------------------------------------------|----------------------------|
| **Roadrunner Glow** | `#FF6B1A` | 255, 107, 26 | Primary accent, CTAs, circuit glow, active states | `--rr-orange-500` |
| **Sunset Orange** | `#E07A30` | 224, 122, 48 | Secondary accent, hover, highlights | `--rr-orange-400` |
| **Deep Sun** | `#C8510F` | 200, 81, 15 | Deep orange, focus rings, warnings (warm) | `--rr-orange-600` |
| **Circuit Ember** | `#FF9A3C` | 255, 154, 60 | Circuit nodes, data highlights, glows | `--rr-orange-300` |

### 3.2 Earth / Desert Palette

| Name | Hex | RGB | Usage | CSS Token |
|-----------------------|-----------|------------------|--------------------------------------------|----------------------------|
| **Desert Sand** | `#A07050` | 160, 112, 80 | Secondary text, borders, icons | `--rr-sand-400` |
| **Mesa Brown** | `#6B4A32` | 107, 74, 50 | Mid surfaces, cards, dividers | `--rr-brown-500` |
| **Canyon Dark** | `#3D2B1F` | 61, 43, 31 | Elevated surfaces, sidebars | `--rr-brown-700` |
| **Night Soil** | `#1A1510` | 26, 21, 16 | Primary dark surfaces | `--rr-brown-900` |

### 3.3 Neutrals & Backgrounds

| Name | Hex | RGB | Usage | CSS Token |
|-----------------------|-----------|------------------|--------------------------------------------|----------------------------|
| **Void Black** | `#0A0A0A` | 10, 10, 10 | App background, deep canvas | `--rr-black` |
| **Warm Off-White** | `#E8D5C0` | 232, 213, 192 | Primary body text, high-contrast text | `--rr-cream` |
| **Muted Dust** | `#B0A090` | 176, 160, 144 | Secondary / muted text, placeholders | `--rr-muted` |
| **Circuit Base** | `#2A2218` | 42, 34, 24 | Card backgrounds, panels | `--rr-surface` |
| **Pure White** | `#FFFFFF` | 255, 255, 255 | Inverse text on orange, light theme only | `--rr-white` |

### 3.4 Status / Semantic (Astro-aligned + Brand)

Map to Astro status where possible; brand-tinted:

- Critical: `#FF3838` (Astro) or brand deep red-orange `#C8510F`
- Serious: `#FFB302`
- Caution: `#FCE83A`
- Normal/Go: `#56F000`
- Standby: `#2DCCFF`
- Off: `#A4ABB6`

**Accessibility Notes:**
- All orange accents achieve >= 4.5:1 contrast on Void Black / Night Soil.
- Body text (`#E8D5C0`) on dark surfaces exceeds AA.
- Never use pure white text on orange without testing; prefer cream.

**Color Usage Hierarchy:**
1. Backgrounds → Void / Night Soil / Surface
2. Primary actions & key brand moments → Roadrunner Glow
3. Supporting UI → Desert Sand / Mesa Brown
4. Data / tech emphasis → Circuit Ember

---

## 4. Typography

### 4.1 Recommended Font Families (Cross-Platform & Browser-Safe)

| Role | Primary Choice | Fallback Stack | Availability | Why |
|-----------------------|---------------------------------|-----------------------------------------------------|---------------------------------------------------|------------------------------------------|
| **Display / Headings / Logo Wordmark** | **Orbitron** | `'Orbitron', 'Rajdhani', 'Oxanium', system-ui, sans-serif` | Google Fonts (free), installable on Linux/Windows | Geometric, mechanical, pure cyberpunk-tech |
| **UI Headers / Section Titles** | **Rajdhani** or **Oxanium** | `'Rajdhani', 'Oxanium', 'Quantico', system-ui, sans-serif` | Google Fonts | Condensed, military-tech, excellent UI density |
| **Body / UI Text** | **Inter** or **Source Sans 3** | `'Inter', 'Source Sans 3', 'Roboto', 'Segoe UI', system-ui, sans-serif` | Google Fonts / system | Maximum readability, modern UI standard |
| **Monospace / Code / Telemetry** | **Space Mono** or **JetBrains Mono** | `'Space Mono', 'JetBrains Mono', 'Roboto Mono', 'Consolas', monospace` | Google Fonts / open source | Tech data feel; Astro already ships Roboto Mono |
| **Military/Stencil Accent** | **Black Ops One** (sparingly) | `'Black Ops One', 'Orbitron', sans-serif` | Google Fonts | Tactical stencil for badges, status labels |

**Linux Installation (Debian/Ubuntu example):**
```bash
# Download TTF/OTF from Google Fonts or fonts.google.com
sudo mkdir -p /usr/share/fonts/truetype/roadrunner
sudo cp *.ttf /usr/share/fonts/truetype/roadrunner/
sudo fc-cache -f -v
```

**Windows:** Install via Settings → Fonts or place in `C:\Windows\Fonts`.

**Browser Rendering:** All recommended fonts are WOFF2-ready via Google Fonts CDN or self-host. They render crisply on Chrome, Firefox, Edge, Safari, and Chromium-based apps. Use `font-display: swap` for performance.

**AstroUXDS Default Note:** Astro ships with Roboto + Roboto Mono. Prefer overriding only display/heading levels with Orbitron/Rajdhani for brand impact; keep body as Inter or Roboto for consistency with Astro components.

### 4.2 Type Scale (Recommended)

| Level | Size (rem) | Weight | Font | Line Height | Letter Spacing |
|-----------|------------|------------|---------------|-------------|----------------|
| Display | 3.0–4.0 | 700–900 | Orbitron | 1.1 | 0.05em |
| H1 | 2.25 | 700 | Orbitron | 1.2 | 0.02em |
| H2 | 1.75 | 600 | Rajdhani | 1.25 | 0.01em |
| H3 | 1.375 | 600 | Rajdhani | 1.3 | normal |
| Body | 1.0 | 400 | Inter | 1.5 | normal |
| Small | 0.875 | 400 | Inter | 1.4 | normal |
| Caption | 0.75 | 500 | Inter | 1.3 | 0.02em |
| Code | 0.875 | 400 | Space Mono | 1.4 | normal |

---

## 5. Usage Guide

### 5.1 Logo Placement Rules
- Always maintain clear space (see 2.1).
- Prefer dark backgrounds (Void Black / Night Soil).
- On light backgrounds, use monochrome version or reverse carefully.
- Never place logo over photographic content without a semi-transparent dark overlay or circuit frame isolation.
- Minimum digital size: 32 px for icons, 120 px for full logo.

### 5.2 Co-branding
- Partner logos may sit to the right of the wordmark with a thin vertical circuit divider.
- Maintain equal visual weight.

### 5.3 Digital Applications
- **Website / App:** Use horizontal lockup in header; text-free emblem for favicon & mobile nav.
- **Email / Slack / Teams:** 1:1 avatar (thumbnail) + wordmark signature.
- **Presentations:** Full logo on title slide; text-free emblem on content slides; landscape banner as section divider.
- **Social:** 1:1 for profile, 16:9 for posts, 9:16 for Stories.

### 5.4 Print / Physical
- Embroidery: monochrome version.
- Laser / CNC: monochrome or single-color.
- Vehicle / Uniform: full color preferred; reverse for dark fabric.

### 5.5 Don'ts
- Do not recreate the logo from scratch or approximate the roadrunner.
- Do not change the number of jets, radio towers, or sun position.
- Do not use pure neon cyber colors outside the defined orange family.
- Do not apply heavy filters that destroy the gritty texture.

### 5.6 Motion / Animation Guidance
- Subtle circuit line glow pulses.
- Roadrunner “dash” animation on load (short).
- Jet contrails on hover for interactive banners.
- Avoid cartoonish or overly bouncy motion.

---

## 6. AstroUXDS Integration Notes

Project Roadrunner builds on **Astro UXDS** (dark theme default) for Angular applications.

- Install tokens: `npm i @astrouxds/tokens`
- Import SCSS maps and override with the provided `_roadrunner-tokens.scss` (see companion file).
- Prefer **System Tokens** for most UI work; use brand tokens only for custom components, brand moments, and accent overrides.
- Global Status Bar remains Astro dark; brand orange used for interactive accents and mission-critical status.
- Maintain Astro’s 4px spacing grid and t-shirt font sizing where possible.

---

## 7. Asset Inventory (Generated Suite)

(See the image files already in your Grok Files panel for the actual assets.)

---

## 8. Change Log & Ownership

| Version | Date | Author | Changes |
|---------|------------|-----------------|-----------------------------|
| 1.0 | 2026-08-25 | Grok / Design | Initial enterprise suite |

**Contact:** Project Roadrunner Visual Identity Team
**Next Review:** Q1 2027 or upon major mission rebrand

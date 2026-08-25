## Doc description
- Transcript of Conversation with Grok about how to add custom styling and branding on top of the AstroUXDS library's style sheets / tokens
- Date: 08-25-2026

## My Prompt 1

You are an expert front end angular developer. I’m using AstroUXDS for their style sheets and components within an angular application. I’m about to be stand up a sister application to my current one, but I’m trying to brand it a little bit. I’m trying to figure out how I can still use astroUXDS, but update the styles slightly so that this app is unique to its sibling, but still feels the same as the standard AstroUXDS styling. For example, I want to maybe add more black to the UI, possibly just a black border accent of some kind, and possibly update the color palette slightly to be an industrial desert color palette, and possibly update the fonts used across the app to be a bit more industrial and sleek. Is this possible to do as I set up the new app? Walk me through how I would do that after I install the AstroUXDS library into the new app.

**Yes, this is fully possible and is the intended way to brand/customize Astro UXDS.** Astro is built on a design-token system exposed as CSS custom properties. The web components (and the Angular wrappers) consume those variables for colors, typography, borders, spacing, etc. Overriding the tokens after the Astro styles load lets you shift the palette, fonts, and accents while the components keep their structure, behavior, spacing, radii, and overall “Astro” feel.

The default theme is dark. You can keep that base and push it further toward black + an industrial-desert palette (deep charcoals/blacks, sandy beiges, terracotta, dusty olives, muted ochres) without forking the library.

### After you install the library

Typical packages for an Angular app:

```bash
npm i @astrouxds/angular @astrouxds/astro-web-components
# optionally also
npm i @astrouxds/tokens
```

(Exact package names/versions can vary; check the current docs / Storybook for the latest Angular wrapper. Newer releases favor importing individual components rather than a monolithic module.)

#### 1. Basic styles import (in `src/styles.scss` or via `angular.json` styles array)

```scss
// Astro base styles (this brings in the CSS custom properties + component styles)
@import '@astrouxds/astro-web-components/dist/astro-web-components/astro-web-components.css';

// Or, if you prefer the tokens package for more control:
@import '@astrouxds/tokens/dist/css/index.css';
// (or the individual base.reference / base.system / base.component files)

// Optional light theme support
@import '@astrouxds/tokens/dist/css/theme.light.css';

// Your custom overrides — MUST come after the Astro imports so they win the cascade
@import './industrial-desert-theme.scss';
```

Also load any new fonts in `index.html` (or via Angular’s styles):

```html
<link rel="preconnect" href="https://fonts.gstatic.com" />
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@300;400;500;600;700&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap" rel="stylesheet" />
```

(Suggested industrial/sleek options: **Barlow** or **Rajdhani** for UI, **Share Tech Mono** / **IBM Plex Mono** for data/mono, or **Exo 2** / **Oswald** for more condensed industrial headings. Keep a Roboto fallback if you want maximum compatibility.)

#### 2. Create the override file (`src/styles/industrial-desert-theme.scss`)

Put overrides on `:root` (whole app) or a class you apply to `<body>` / the root component (e.g. `.industrial-desert-theme`). Default is dark, so most of your work will be here.

```scss
:root {
  /* ========== Typography (industrial / sleek) ========== */
  /* Override the font-family tokens used by the typography system.
     Inspect the actual --font-*-font-family variables in DevTools or
     in node_modules/@astrouxds/tokens for the full list. */
  --font-body-1-font-family: 'Barlow', 'Roboto', system-ui, sans-serif;
  --font-body-2-font-family: 'Barlow', 'Roboto', system-ui, sans-serif;
  --font-control-body-1-font-family: 'Barlow', 'Roboto', system-ui, sans-serif;
  --font-heading-1-font-family: 'Rajdhani', 'Barlow', 'Roboto', sans-serif;
  --font-heading-2-font-family: 'Rajdhani', 'Barlow', 'Roboto', sans-serif;
  --font-heading-3-font-family: 'Rajdhani', 'Barlow', 'Roboto', sans-serif;
  --font-heading-4-font-family: 'Rajdhani', 'Barlow', 'Roboto', sans-serif;
  --font-heading-5-font-family: 'Rajdhani', 'Barlow', 'Roboto', sans-serif;
  --font-heading-6-font-family: 'Rajdhani', 'Barlow', 'Roboto', sans-serif;
  --font-display-1-font-family: 'Rajdhani', 'Barlow', 'Roboto', sans-serif;
  --font-display-2-font-family: 'Rajdhani', 'Barlow', 'Roboto', sans-serif;
  --font-monospace-1-font-family: 'Share Tech Mono', 'Roboto Mono', monospace;

  /* Optional: slight weight or size tweaks if desired, but keep the scale mostly intact */
}

:root {
  /* ========== More black + industrial desert palette ========== */
  /* Prefer system / semantic tokens when possible (background, border, interactive, text).
     Fall back to reference palette tokens (--color-palette-*) or component tokens
     only when needed. Inspect the live CSS variables in the browser or the
     tokens package to get the exact current names. */

  /* Deepen backgrounds toward black / charcoal */
  /* Examples of the kinds of variables you will typically find: */
  /* --color-background-base, --color-background-surface-default, etc. */
  /* Adjust these to very dark values: */
  /* --some-background-token: #0a0a0a; */
  /* --some-surface-token: #12100e; */

  /* Black / near-black border accents */
  /* --color-border-default: #000000; */
  /* --color-border-interactive: #1a1a1a; */
  /* Component-level examples from the system (names evolve slightly across versions): */
  /* --card-color-border: #000000; */
  /* --input-color-border-default: #1a1a1a; */
  /* --button-color-border-secondary-default: #000000; */

  /* Shift the primary / interactive palette toward industrial desert
     (terracotta, sand, dusty olive, muted amber) while keeping good contrast. */
  /* Reference palette tokens (from migration docs / tokens package): */
  /* --color-palette-darkblue-500: #c45c26;   // terracotta accent instead of blue */
  /* --color-palette-brightblue-500: #d4a574; // sand */
  /* --color-palette-grey-*: deeper charcoal / warm greys */

  /* Text colors – keep high contrast on the darker backgrounds */
  /* --color-text-primary: #e8e0d5; // warm off-white */
  /* --color-text-secondary: #b8a99a; */
}

/* Optional: scoped class version if you ever need to toggle themes */
.industrial-desert-theme {
  /* same overrides as above */
}
```

**How to discover the exact variable names**

- Open the running app → DevTools → inspect any Astro component → look at the computed styles and the `:root` / `html` / `body` custom properties.
- Search inside `node_modules/@astrouxds/tokens/dist/css/` (or the web-components CSS) for `--color-`, `--font-`, `--border-`, `--card-`, `--button-`, `--input-`, etc.
- The tokens package has three layers: **reference** (raw palette), **system** (semantic – preferred for overrides), and **component** (very specific – use sparingly).

#### 3. Apply the theme

- Global (recommended for a sister app): just put the overrides on `:root` as shown.
- Or add the class to `<body>` in `index.html` or the root Angular component:
  ```html
  <body class="industrial-desert-theme">
  ```
- For mixed theming later you can still use Astro’s built-in `light-theme` class on sections.

#### 4. Black border accents and extra polish

- Prefer token overrides for borders (they cascade into most components).
- For anything that still needs a stronger accent, you can add light global rules after the tokens (use sparingly):

```scss
/* Example accent – adjust selectors to what your app actually uses */
rux-card,
.rux-container, /* or whatever surface classes you rely on */
[class*="rux-"] {
  /* only if the token route is insufficient */
  /* border-color: #000; */
}

/* Optional: subtle black outline / focus treatment if desired */
:focus-visible {
  outline-color: #000;
}
```

Shadow DOM components inherit CSS custom properties from the light DOM, so the majority of theming works without `::part()` or `::ng-deep`. When a component exposes CSS parts (check Storybook), you can target those for deeper tweaks.

#### 5. Practical tips for a sister-app setup

- Keep the same spacing scale, border radii, and component shapes so the two apps still feel related.
- Test contrast (WCAG) after shifting to darker blacks and warmer desert tones.
- Pin the Astro package versions so token renames in future major releases don’t surprise you.
- If you also use AG Grid, charts, or other Astro-themed libraries, they usually consume the same tokens (or have their own thin theme layer that you can override the same way).
- For a more maintainable long-term approach you can generate a small custom tokens layer on top of `@astrouxds/tokens` (SASS maps or JSON are available) and only expose the semantic variables your app needs.
- Start small: override backgrounds + primary interactive color + fonts first, then refine borders and secondary palette.

That is the complete path after installation. You end up with a unique industrial-desert / black-accented skin that still uses the full Astro component set and design language. Inspect the live CSS variables early—once you have the exact names, the rest is just mapping your desert palette onto them.
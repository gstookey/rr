---
schema: corpus-doc/v1
status: exploratory
title: Stack Augmentation Candidates v1 — what else to bring to the Desert Island (dashboard, maps, and a sweep of the stack, workstations, Nexus and services)
areas: [technology-stack, dev-environment, isolated-network, frontend, backend, security]
related: ["docs/source-documents/desert-island-setup-docs/front-end-srf-status.csv", "docs/context/operations/user-workflow/srf_category_bundles_howto_v1.md", "docs/design/packets/desert-island-devenv-01-design-packet/devops_tech_stack_list_v2.md", "docs/design/packets/acme-workshop-01-design-packet/decision_register_v0.md", "docs/design/packets/desert-island-devenv-01-design-packet/proposed_srf_rows_v1.csv"]
updated: 2026-10-02
---

# Stack Augmentation Candidates v1

**Created:** 2026-10-02 (Axium, at Graham's request) | **Status:** `exploratory`: a proposal. **Nothing here is in the stack or the bundles yet**; Graham picks. Versions, licenses and Angular compatibility were read from the npm registry and the VS Code Marketplace on 2026-10-02. Facts marked *(not verified)* were not checked against a primary source.

**The ask:** this is the last pass before porting. Graham named a Kibana-like situational-awareness dashboard (css-grid + signals or angular-gridster2; maybe the Syncfusion Angular Data Grid; Lightweight Charts and ECharts) and 2D/3D maps (Cesium or similar), and asked for a sweep of what else the stack, workstations, Nexus and applications might need.

**Why now:** a **new SRF** is the slowest path. Anything you're likely to need within the release year is cheaper to request now, and every transfer cycle is scarce.

---

## 0. The bottom line

1. **Dashboard:**
   - **angular-gridster2** for user-arranged panels (Kibana's model).
   - **AG Grid Community** (MIT) as the data grid. **Not Syncfusion** unless your organization already holds a Syncfusion license (§2.2).
   - **ECharts** for charts, *if* its origin (Baidu, now Apache Software Foundation) passes your US-made screen (§2.3).
   - Most of the situational-awareness chrome is **already in AstroUXDS** (clock, timeline, log, status, monitoring icons, classification marking).
2. **Maps:**
   - **CesiumJS** does 2D and 3D in one engine, and is already the lean of ACME decision AW-D1.
   - Add **milsymbol** (MIL-STD-2525 symbols) and **mgrs**/**proj4** (MGRS and coordinate conversion).
   - The deciding question is **map data**, not the library: what imagery, terrain and basemap services exist on the Desert Island (§3)?
3. **Five gaps the sweep found in the current stack:**
   - (a) **No self-hosted fonts.** AstroUXDS and Angular Material load Roboto and the icon font from Google's CDN, so offline they render wrong (icons appear as words).
   - (b) The team's own **reference workspace** (ACME) depends on `jose`, `zod`, `supertest` and `tsx`, which the Desert Island stack doesn't carry. `jose` is the ADR-008 D-3 replacement for keycloak-connect.
   - (c) No **SBOM** tooling: CycloneDX would give the SRF office a machine-readable list.
   - (d) No **accessibility** checks (Section 508).
   - (e) No offline **API mocking**.
4. **Bringing these in is almost free** with the current tooling (§1). A ready-to-paste set of sheet rows is in [`proposed_srf_rows_v1.csv`](proposed_srf_rows_v1.csv).

---

## 1. Do we get bundles "for free" now that the sheet drives them?

**Almost.** The sheet decides *which bundle* a row goes in. The *contents* still come from the locked stack. For an **npm package**, adding a row takes three edits, then the usual one command:

1. Add the package to `desert-island-devenv/stack/frontend/package.json`, then relock (minimal: `pnpm install --lockfile-only` on the existing lock; I do this and check that nothing else moves).
2. Add one line to `stack/srf-components.tsv`: the sheet row → package name(s).
3. Add the row to your sheet with its status.

Then `build-srf-bundles.sh` places the package and its dependency closure in the right bundle. It also checks that the version matches the sheet and lists what the new row needs from other bundles.

Other kinds of software take a little more:
- A **VS Code extension**: one line in `stack/vscode-extensions.txt` (the build downloads and verifies it) plus a `vsix:` mapping line.
- A **CLI binary or container image**: a short download-and-checksum step in the bundle build (or a line in `stack/images.txt`).

A possible improvement, not built: let a row whose Software text *is* an npm package name (`jose`, `echarts`) map to itself, so step 2 disappears for simple rows. Say the word.

---

## 2. The dashboard (Kibana-like situational awareness)

A Kibana dashboard is five things:
- a **panel grid** users drag and resize;
- **panels** (tables, charts, maps) bound to queries;
- a **time-range picker** with auto-refresh;
- **global filters**;
- **saved dashboards**.

Only the first and the panel contents need libraries. The time picker, filters, refresh and saved layouts are app code: signals and the NgRx Signals store you already have, plus a small persistence API.

### 2.1 Panel grid

| Option | License · version · Angular | Verdict |
|---|---|---|
| **CSS grid + signals** (+ `@angular/cdk` drag-drop, already in the stack) | — | **No new SRF.** Right for *designed* layouts; the in-repo `@rr/status-grid` already works this way. Free-form *resizing* is hand-written work. |
| **angular-gridster2** | MIT · 22.0.0 · `^22.0.0` · 1 dependency | **Recommended** if users arrange their own dashboards (the Kibana model). Angular-native and already on Angular 22. Maintained by one developer *(origin not verified)*. |
| gridstack (+ its bundled Angular wrapper) | MIT · 14.0.0 · framework-agnostic | A good alternative with a larger community; the Angular wrapper is thinner. |

**Lean:** start on CSS grid + signals for the first, designed dashboards. Request **angular-gridster2** now, so user-arranged dashboards aren't blocked by an SRF later.

### 2.2 Data grid

| Option | License · version | Notes |
|---|---|---|
| Syncfusion Angular Data Grid | **Commercial** (`SEE LICENSE`) · 35.1.37 | Very capable, but its free Community License requires under $1M revenue, ≤5 developers and ≤10 employees, and government organizations generally don't qualify ([Syncfusion forum](https://www.syncfusion.com/forums/198047/question-about-licensing-for-government-internal-application-single-developer)), so it's a paid per-developer license. It also brings its own theme system, which competes with AstroUXDS. Whether license-key validation works fully offline: *(not verified)*. |
| **AG Grid Community** (`ag-grid-community` + `ag-grid-angular`) | **MIT** · 36.2.0 · Angular `>=20` | **Recommended.** Virtualized (fast at 100k+ rows), with sorting, filtering, column resize/pin and CSV export, and a theming API that can carry Astro tokens. Row grouping, pivoting, the server-side row model and Excel export are **Enterprise** (paid). AG Grid Ltd is UK-based *(not verified)*. |
| TanStack Table (`@tanstack/angular-table`) | MIT · 9.2.4 · Angular `>=19` | Headless: logic only; you render with `rux-table` / CDK virtual scroll. 100% Astro look, but the most work. |
| AstroUXDS `rux-table` / Angular Material table | already in the stack | Fine for small tables; no virtualization or column tooling. |

**Lean:** **AG Grid Community.** Choose Syncfusion only if a Syncfusion license already exists in your organization (ask), and TanStack if pixel-exact Astro styling outranks build effort.

### 2.3 Charts

| Option | License · version | Notes |
|---|---|---|
| **Apache ECharts** + `ngx-echarts` | Apache-2.0 · 6.1.0 + MIT · 22.0.0 (Angular `>=22`) | **The most complete for Kibana-style work:** time series with a zoom/brush axis, heatmaps, gauges, graphs, scatter at large sizes, progressive rendering. **Origin flag:** developed at Baidu (China), donated to the Apache Software Foundation in 2018, now an ASF top-level project. If "US-made" (your SRC-013 criterion) is applied, expect to justify it. |
| TradingView Lightweight Charts | Apache-2.0 · 5.2.1 | Superb for **high-rate financial-style time series**, but only a few chart types. Its license requires a **visible TradingView attribution notice and link** in your app (the `attributionLogo` option satisfies the link) ([npm/yarn readme](https://classic.yarnpkg.com/en/package/lightweight-charts)). Add only if a streaming time-series panel is central. |
| uPlot | MIT · 1.6.32 (last release 2025-03) | Tiny and the fastest for dense time series. Pairs with Chart.js if ECharts is ruled out. |
| Chart.js + `ng2-charts` | MIT · 4.5.1 + 11.0.0 (Angular `>=22`) | Simple and ubiquitous; slower on big data. |
| D3 | ISC · 7.9.0 (30 packages) | Low-level primitives for bespoke visuals; Mike Bostock / Observable (US). |

**Lean:** one general-purpose library, so the team learns one API:
- **ECharts** if its origin is acceptable;
- otherwise **Chart.js + uPlot**.

Lightweight Charts is an add-on, not a substitute. Avoid three overlapping chart libraries.

### 2.4 Already in your stack: AstroUXDS for situational awareness

AstroUXDS (the US Space Force design system) 8.0.0 ships the situational-awareness chrome, so **no SRF is needed for these**:
- `rux-clock`, `rux-timeline`, `rux-log`
- `rux-status`, `rux-monitoring-icon`, `rux-monitoring-progress-icon`
- `rux-global-status-bar`, `rux-classification-marking`
- `rux-notification` / `rux-toast`, `rux-table`, `rux-tree`

The dashboard should be built from these first.

---

## 3. Maps (2D and 3D)

| Option | License · version | Notes |
|---|---|---|
| **CesiumJS** (`cesium`) | Apache-2.0 · 1.146.0 · 4 dependencies, ~80 MB unpacked | **Recommended.** It's already the lean of **AW-D1** (ACME): a `@rr/map` façade over Cesium with no network. A 3D globe, 2D and Columbus view in **one engine**, so 2D and 3D come together. Cesium GS (Philadelphia), owned by Bentley Systems (US) since September 2024, still open source ([Bentley](https://www.bentley.com/news/bentley-systems-acquires-3d-geospatial-company-cesium/)). **Offline facts:** the package carries Natural Earth II imagery (low-resolution, verified: 129 tiles in `Assets/Textures/NaturalEarthII`), so a globe renders with no network. Default Bing imagery and world terrain come from **Cesium ion**, which is online, so: no ion token, base layer from the bundled tiles or your own services, and the ellipsoid terrain unless you serve terrain. |
| OpenLayers (`ol`) | BSD-2 · 10.10.0 | The strongest open **2D GIS** library (WMS/WMTS/WFS, reprojection, editing). Add only if heavy 2D GIS work appears; `olcs` (BSD-2, 2.23.1) synchronizes an OpenLayers 2D view with a Cesium 3D view. |
| MapLibre GL JS | BSD-3 · 6.11.2 | Fast vector-tile 2D maps; worth it only if a vector-tile pipeline exists. (Mapbox GL JS v2+ is proprietary and needs a token: **avoid**.) |
| ArcGIS Maps SDK for JavaScript (`@arcgis/core`) | **Commercial** (Esri, US) · 5.1.26 | **The serious alternative if your organization runs ArcGIS Enterprise:** 2D + 3D in one, built-in MIL-STD-2525 renderers, and it talks to existing Esri services. It needs Esri licensing. Ask before choosing Cesium. |

**Companions** (all small, MIT):
- **milsymbol** 3.0.4: MIL-STD-2525 C/D/E and APP-6 symbols as SVG/canvas, which become Cesium billboards.
- **mgrs** 2.2.0 and **proj4** 2.22.0: MGRS and coordinate conversion.
- For geospatial analysis, pick individual `@turf/*` modules: the `@turf/turf` meta-package pulls 117 packages.

**The real decision is data:**
- What **imagery, elevation (terrain) and basemap services** exist on the Desert Island? Possibilities include an Esri ArcGIS Enterprise, a GEOINT service, or nothing.
- Without them, the map is the low-resolution Natural Earth globe.
- Self-hosting is a separate track with its own SRF and transfer questions: a tile server (MapProxy, GeoServer or nginx serving static tiles), PostGIS, and the imagery/DEM data itself.

---

## 4. Gaps the sweep found in what we already have (recommend now)

| Gap | Add | License · version | Why |
|---|---|---|---|
| **Fonts are loaded from Google's CDN.** AstroUXDS's README and Angular Material's setup load Roboto and the icon font from `fonts.googleapis.com`; neither package ships font files, and the pool has no font package. Offline: system-font fallback, and Material icons render as their *names*. | `@fontsource/roboto`, `@fontsource/roboto-mono`, `material-symbols` | OFL-1.1 · 5.3.0 / 5.3.0; Apache-2.0 · 0.47.6 | Self-hosted, bundled by the Angular build. **The most likely day-one surprise on the island.** |
| **The reference workspace doesn't build from the Desert Island stack.** The in-repo ACME workspace (Angular 22, the team's model) depends on packages the stack lacks. | `jose`, `zod`, `supertest` + `@types/supertest`, `tsx` | MIT · 6.2.12, 4.6.5, 7.3.1 + 7.2.1, 4.23.15 | `jose` is the standard JWT/OIDC validation library: **ADR-008 D-3's replacement for keycloak-connect** in new server code. `zod` validates shared contracts; `supertest` drives API tests; `tsx` runs TypeScript services directly. |
| **No SBOM tooling** | `@cyclonedx/cyclonedx-npm` | Apache-2.0 · 6.0.1 | CycloneDX SBOMs (increasingly expected in US federal software supply-chain reviews). It could also produce **one SBOM per SRF bundle** for the SRF office (I can add that to `build-srf-bundles.sh`). |
| **No accessibility checks** | `axe-core`, `@axe-core/playwright` (or `cypress-axe` 1.7.0) | MPL-2.0 · 4.13.0 | Section 508 checks inside the existing Playwright/Cypress tests. Deque (US). |
| **No offline API mocking** | `msw` (Mock Service Worker) | MIT · 3.0.1 | Develop and test against mocked APIs with no live back end, valuable when services on the island come up late. |
| **Component tests are implementation-centric** | `@testing-library/angular`, `@testing-library/user-event` | MIT · 19.5.0 (Angular `>=21`), 14.6.7 | User-centric component tests that work under both Jest and Vitest. |
| **Node servers lack hardening and structured logs** | `helmet`, `express-rate-limit`, `pino` (+ `pino-http`) | MIT · 8.3.0, 8.7.0, 10.4.0 (+ 11.0.0) | Security headers, rate limits, and JSON logs that a log platform (§7) can ingest. |

**Later, when the work starts** (nice-to-have):
- **Storybook** 10.6.1 (`storybook` + `@storybook/angular`, Angular `<23`): a component workshop for dashboard widgets and Astro theming. It's heavy, a few hundred packages.
- `comlink` 4.4.2: web workers for heavy data transforms.
- `stylelint` 17.16.0 (+ `stylelint-config-standard-scss`): SCSS linting.
- `@opentelemetry/api` 1.9.1: tracing.

---

## 5. Workstations

**VS Code extensions** (versions from the Marketplace, 2026-10-02; the build pins and verifies them):

| Extension | Version | Why |
|---|---|---|
| `vitest.explorer` | 1.52.2 | Run and debug Vitest tests in the editor |
| `ms-playwright.playwright` | 1.1.19 | Run and debug Playwright tests, pick locators |
| `usernamehw.errorlens` | 3.29.0 | Inline errors (pairs with ESLint) |
| `EditorConfig.EditorConfig` | 0.18.2 | Consistent formatting across editors (Eclipse users too) |
| `redhat.vscode-yaml` | 1.25.x | Kubernetes / Helm / compose YAML with schemas (pin a stable release) |
| `ms-kubernetes-tools.vscode-kubernetes-tools`, `ms-azuretools.vscode-containers` | 1.4.1, 2.5.2 | kind/Kubernetes and Docker from the editor |
| `humao.rest-client` | 0.25.1 (last updated 2022, stable) | `.http` files for API calls. **Postman needs a cloud login and doesn't work offline**; this does. |
| `hediet.vscode-drawio`, `bierner.markdown-mermaid`, `DavidAnson.vscode-markdownlint` | 1.15.x, 1.32.1, 0.62.1 | Offline diagrams, Mermaid in Markdown preview, Markdown lint |
| `bradlc.vscode-tailwindcss`, `stylelint.vscode-stylelint` | 0.16.0, 2.2.1 | If Tailwind / stylelint are used |
| `streetsidesoftware.code-spell-checker` | 4.9.5 | Spelling in code and docs |

**CLI tools** (versions not checked from here; the bundle build would pin and checksum them):
- **shellcheck**: not on the RHEL media, and its absence was felt in this very project.
- **yq**: YAML/Helm values.
- **k9s** and **stern**: Kubernetes terminal UI and log tailing.
- **hadolint**: Dockerfile lint.
- **dive**: image-layer inspection.
- **Trivy**, or **Syft + Grype**: SBOM and image/package vulnerability scanning. They need their vulnerability databases carried across periodically, a process question for the SRF office.

**From the RHEL media, worth confirming they are installed:** `git`, `jq`, the `postgresql` client (`psql`), and `make`.

---

## 6. Nexus

- **A Helm (hosted) repository.** You have Helm and kind; charts deserve a home next to images.
- **A Yum (hosted) repository** for the RPMs we ship (VS Code, Docker CE, any CLI tools packaged as RPMs). Workstations then `dnf install` from Nexus instead of the installer fetching raw files.
- **An approved-only group *(policy question; only if allowed)*.** Nexus *group* repositories could expose only the approved SRF categories to developers: one hosted repo per category, with the group as the switch. That only helps if policy lets software sit in Nexus before approval, which it may well not.

---

## 7. Applications and services (later lanes; images go in `stack/images.txt`)

| Need | Candidate | License | Note |
|---|---|---|---|
| Kibana-like **log/event analytics** for operations (as opposed to the mission dashboard) | **OpenSearch + OpenSearch Dashboards** | Apache-2.0 | If "like Kibana" sometimes means *actually* Kibana: OpenSearch Dashboards provides it out of the box. Elastic's own Kibana is under Elastic License / SSPL / AGPL. |
| Map data serving | PostGIS (`postgis/postgis` image), MapProxy or GeoServer | GPL-2.0 / Apache-2.0 / GPL-2.0 | Only if §3's data answer is "we host it" |
| Static hosting and reverse proxy for the Angular apps, Cesium assets and tiles | nginx (RHEL AppStream or UBI image) | BSD-2 | Likely already in the DevOps plan |
| Shared session store for `express-session` with more than one instance | Valkey | BSD-3 | The default in-memory store is single-process only |
| Observability | OpenTelemetry Collector, Prometheus; Grafana | Apache-2.0; **AGPL-3.0** | Grafana's AGPL needs a license review |

---

## 8. Avoid

- **Anything loaded from a CDN at runtime:** Google Fonts, CDN-hosted chart or map scripts, Cesium ion.
- **Mapbox GL JS v2+:** proprietary license and token.
- **Postman:** cloud login.
- **The `@turf/turf` meta-package:** 117 packages; take individual modules instead.
- **Three overlapping chart libraries.**
- **Syncfusion without an existing organizational license:** its Community License doesn't fit a defense program.

---

## 9. Questions for Graham (they change the picks)

1. Does your organization already license **Syncfusion**, **AG Grid Enterprise** or **Esri ArcGIS**? Any of these changes §2.2 or §3.
2. Is **US-made** an actual screening rule for the SRF office? It decides ECharts versus Chart.js + uPlot, and the existing 80 rows were never screened for it either.
3. What **map data services** exist (or are planned) on the Desert Island?
4. Do users **arrange** their own dashboards, or are layouts designed for them? This decides angular-gridster2 now versus later.
5. Should I add **one CycloneDX SBOM per SRF bundle** to `build-srf-bundles.sh`?

**Next step once you pick:** I add the chosen rows in one change: stack, minimal relock, mapping lines and sheet rows. Then I rebuild the bundles, re-run the offline rehearsal (including a smoke test that renders a Cesium globe, an AG Grid and a chart), and report the exact locked versions for your sheet.

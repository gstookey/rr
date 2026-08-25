

## My Prompt 1

Is figma something I can get an app image of, or get an installable package of and port onto an isolated network via a .tar file or a .targz file and install it on the isolated network? It would be from one Linux environment to another (RHEL 9). I would also want to be able to use figma to generate mockups of a new angular application I’m about to be standing up. Which will use customized scss for custom branding on top of the AstroUXDS library. Is this possible to do? If so, walk me through how to do this.

----------------------------------------------------------------------

**Yes for the package transfer and limited local run; no for full usable Figma on a truly isolated network.** Official Figma has no Linux desktop app (only macOS/Windows + browser). Unofficial community packages exist that you can download as AppImage or RPM, archive as `.tar`/`.tar.gz`, move to an isolated RHEL 9 system, and run/install. However, Figma is cloud-first, so a fully air-gapped environment severely limits (or effectively prevents) practical use for design work.

### Getting an Installable Package and Porting to Isolated RHEL 9

**Recommended options (unofficial):**

- **IliyaBrook/figma-linux** (preferred for closer-to-official experience): Extracts/patches the real Figma Desktop Windows client and packages it for Linux. Provides **AppImage** (best for isolation), `.rpm`, and `.deb`. Supports local font helper, system tray, `figma://` handling, and offline file opening of local content.  
  Releases: https://github.com/IliyaBrook/figma-linux/releases

- **Figma-Linux/figma-linux** (classic Electron wrapper around the web app): Also offers AppImage and RPM.  
  Releases: https://github.com/Figma-Linux/figma-linux/releases

**AppImage is the simplest for air-gapped transfer** (self-contained, no system package manager install required in most cases).

**Steps (from a connected Linux machine to isolated RHEL 9):**

1. On the connected machine, download the latest x86_64 AppImage (or the `.rpm` if you prefer package install).
2. Archive it:
   ```bash
   tar czvf figma-linux-package.tar.gz figma-desktop-*.AppImage   # or the RPM file
   ```
   (You can include any extra notes, fonts, or pre-exported `.fig` files in the same archive.)
3. Transfer the `.tar.gz` via approved media (USB, etc.) to the isolated RHEL 9 host.
4. On the isolated RHEL 9 host:
   ```bash
   tar xzvf figma-linux-package.tar.gz
   chmod +x figma-desktop-*.AppImage
   ./figma-desktop-*.AppImage
   ```
   - First run often auto-creates a `.desktop` entry.
   - For the RPM route (if you chose it): `sudo dnf install ./figma-desktop-*.rpm` (or `rpm -i`). Resolve any missing runtime libraries offline if needed (AppImage avoids most of this).
5. Optional: Place the AppImage somewhere permanent (e.g., `/opt` or `~/Applications`) and create a desktop shortcut manually if desired.

RHEL 9 (and clones like Rocky/Alma) generally run these AppImages/RPMs fine, as they are common on Fedora/RHEL-family systems. Test for library issues (e.g., related to Electron/GTK); most modern AppImages bundle what they need.

**Critical limitation — offline/isolated use:**  
Figma has **no fully featured offline mode**. Official documentation states it is cloud-based and not designed for full offline operation.

- You can continue limited editing on pages already loaded while online, create one new file, edit basic layers/shapes/components that exist in the open file, and save a local `.fig` snapshot.
- You **cannot** freely open arbitrary cloud files, access external libraries/components, use most plugins, collaborate, or reliably start fresh without prior online session + caching.
- Login and most file access require reaching Figma’s servers at some point. Tokens/sessions expire. On a network with *zero* internet (and no prior cached authenticated session + open files), the app will largely be non-functional for real design work.
- Local `.fig` files can be saved/transferred and re-imported (treated as new files, losing history/comments), but this is a last-resort workflow, not a primary one.

**Practical advice for isolated networks:** Figma is a poor primary tool. Consider:
- Designing mockups on a connected machine, exporting assets/PNG/SVG/PDF/CSS specs, and transferring those.
- AstroUXDS’s own **PowerPoint toolkit** (explicitly aimed at secured environments).
- Self-hostable open-source alternatives such as Penpot (Figma-like, can run fully offline/local).
- Tools like Inkscape, draw.io (diagrams.net offline), or even native Linux design apps.

### Using Figma for Mockups of an Angular App with AstroUXDS + Custom SCSS Branding

**Yes, this part is fully possible** (on a machine that can reach Figma + the internet, or with pre-downloaded libraries transferred).

AstroUXDS (space/aerospace design system) provides official Figma design files, icons, and components. It also has Angular support and theming via design tokens that map cleanly to SCSS/CSS custom properties.

**High-level workflow:**

1. **In Figma (connected machine):**
   - Visit the Astro UXDS Figma community page / files (linked from https://www.astrouxds.com/resources/downloads/ — look for “Astro UXDS Figma Page” and the Icons file).
   - Duplicate the relevant library/file into your drafts or team.
   - Build mockups using Astro components, layouts, icons, and patterns that match your Angular screens.
   - Apply or note custom branding (colors, typography, spacing) so they can later become SCSS overrides.
   - Use Dev Mode for measurements, CSS snippets, and asset export.
   - Export frames as PNG/SVG, icons as SVG, and any local `.fig` copies if needed for transfer.

2. **Implement in Angular + AstroUXDS:**
   - Use the official packages: `@astrouxds/angular` (web components wrapped for Angular) and starter kits from the Astro GitHub (Angular starter kit available).
   - Install design tokens: `@astrouxds/tokens` (provides SCSS, CSS custom properties, and maps for reference/system/component levels).
   - In your Angular project’s global styles (typically `src/styles.scss`):
     ```scss
     @import "~@astrouxds/tokens/dist/scss/base.reference.scss";
     @import "~@astrouxds/tokens/dist/scss/base.system.scss";
     // or the CSS custom properties version
     ```
   - Override for custom branding (example pattern):
     ```scss
     :root {
       // Override Astro tokens / CSS vars for your brand colors, fonts, etc.
       --color-primary: #your-brand-hex;
       // or SCSS variables if using the SCSS maps
     }
     // Component-specific overrides as needed
     ```
   - Astro components respect the design tokens, so SCSS/CSS variable overrides propagate for theming without forking the library. You can also add custom SCSS on top for unique branding elements.
   - Angular’s style system (global SCSS + component styles + `stylePreprocessorOptions` in `angular.json` for include paths) makes this straightforward.

3. **Handoff from Figma mockups → code:**
   - Match Figma frames to Angular routes/components.
   - Use exported assets and measured spacing/typography.
   - Iterate: update Figma → re-export → adjust SCSS tokens.

This combination works well because Astro is intentionally built as a design system with both Figma assets and code (web components + Angular wrappers + tokens).

### Summary Recommendation

- **Package transfer/install on RHEL 9 via AppImage + `.tar.gz`:** Yes, straightforward with the community packages above.
- **Actual productive use of Figma on a fully isolated network:** No (or extremely limited). Treat it as a connected-machine tool and transfer only the resulting assets/mockup exports.
- **Mockups for Angular + AstroUXDS + custom SCSS:** Yes — use the official Astro Figma libraries for design, then implement with `@astrouxds/angular` + token overrides in SCSS.

If your isolated network has any controlled outbound access (proxy, limited allow-list for Figma domains) or you can stage files while briefly connected, the experience improves. Otherwise, plan for export-based handoff or an offline-first alternative. Let me know if you need exact download commands, dependency notes for RHEL 9, or a sample Angular + AstroUXDS SCSS override structure.

## My Prompt 2

This is excellent information. Tell me more about the AstroUXDS PowerPoint toolkit, and how I can potentially that over to my isolated network. Further, since I will be using custom scss on top of AstroUXDS to custom brand the app slightly, how can I use those customized styles within my mockups I generate with the AstroUXDS PowerPoint Toolkit?

----------------------------------------------------------------------

**Yes — the AstroUXDS PowerPoint Toolkit is specifically built for exactly the kind of isolated / secure environment you’re describing.**

### What the AstroUXDS PowerPoint Toolkit Is

It is a commercial product from Rocket Communications (the stewards of Astro UXDS). It packages the core Astro design system components as native, editable PowerPoint shapes and objects so you can create Astro-compliant lo-fi wireframes and mockups entirely inside Microsoft PowerPoint.

Key points:
- Designed for aerospace, defense, intelligence, and other restricted environments (including SCIFs) where cloud tools like Figma are unavailable or prohibited.
- Fully offline — no internet required after download.
- Drag-and-drop components from the Astro system for rapid wireframing.
- Claims to reduce prototyping time by ~75%.
- Uses familiar PowerPoint workflows that are often already approved on secure networks.
- Includes essential Astro components optimized for PowerPoint (buttons, forms, navigation, status indicators, cards, etc.).

It is **not** free/open-source. It is a paid, one-time-download product with these license tiers (per the Terms of Service):
- **Individual**: One named user.
- **Team**: Up to five named users.
- **Project**: Unlimited users for a single specified project (internal or client).
- Enterprise options available via separate agreement.

The license is limited, non-exclusive, non-transferable, and applies to the version you download at purchase time. No automatic updates or ongoing support are included. You may freely share the **work products** (your mockups and presentations) but not the toolkit software itself. Use is primarily intended within the United States; export-control rules (ITAR, etc.) may apply.

Official page: [https://www.astrouxds.com/platforms/astro-toolkit-ppt/](https://www.astrouxds.com/platforms/astro-toolkit-ppt/)

### How to Get It Onto Your Isolated Network

1. On a connected / approved machine, purchase the appropriate license and download the package (it is a one-time download of the current version — typically a `.pptx` template file or a small set of PowerPoint files containing slide masters + a component library).
2. Archive the downloaded file(s) if desired:
   ```bash
   tar czvf astro-ppt-toolkit.tar.gz Astro-PowerPoint-Toolkit*.pptx   # or the zip/folder you receive
   ```
3. Transfer the archive (or the raw files) via approved media (USB, etc.) following your organization’s air-gap / data-transfer procedures.
4. On the isolated side, extract and open the file(s) in Microsoft PowerPoint.

**Important practical note for RHEL 9**: The toolkit requires **Microsoft PowerPoint**. RHEL itself does not run native Microsoft PowerPoint. Common solutions on isolated Linux environments include:
- A Windows virtual machine (or dual-boot) that is also air-gapped.
- LibreOffice Impress / WPS Office (limited compatibility — shapes may not behave identically).
- A dedicated Windows workstation that is part of the isolated network.

Confirm with your IT/security team what presentation software is authorized on the isolated network before purchasing.

### Using Your Custom SCSS Branding Inside the PowerPoint Mockups

PowerPoint has no concept of SCSS or CSS custom properties, so there is no automatic import. You map your Angular/AstroUXDS custom branding manually (this is straightforward and keeps the mockups visually consistent with the final app).

**Recommended process:**

1. **Extract your branding tokens from SCSS**  
   From your Angular project’s custom SCSS (the overrides on top of `@astrouxds/tokens`), collect the key values:
   - Primary / accent colors (HEX or RGB)
   - Secondary / status colors
   - Background / surface / text colors
   - Font families and sizes (or the closest system fonts available in PowerPoint)
   - Any custom spacing, border radii, or icon tints that are distinctive

2. **Create a matching PowerPoint Theme**
   - Open the Astro toolkit `.pptx`.
   - Go to **Design → Variants → Colors → Customize Colors**.
   - Map your custom colors into the 12 theme slots (Dark 1/2, Light 1/2, Accent 1–6, Hyperlink, Followed Hyperlink).  
     Example: put your primary brand color in Accent 1, status greens/reds in other Accents, etc.
   - Set theme fonts (Design → Fonts → Customize Fonts) to match your SCSS font stack as closely as possible.
   - Save the customized theme (or save the whole presentation as a `.potx` template) so every new mockup starts with your branding.

3. **Apply the branding to toolkit components**
   - The Astro components in the toolkit are editable shapes.
   - Select a component → use the theme colors you just defined for fills, strokes, and text.
   - Recolor icons or status indicators to match your SCSS overrides.
   - Build master slides that include your branded header/status bar, logo, and any recurring chrome so every screen stays consistent.

4. **Maintain a simple mapping document**
   Keep a short reference (even a slide or text file) that lists:
   ```
   SCSS variable                  →  PowerPoint Theme slot
   $brand-primary                 →  Accent 1
   $status-critical               →  Accent 2
   --color-surface-default        →  Light 1
   etc.
   ```
   This makes it easy for others to keep future mockups aligned with the Angular app.

Because both the toolkit and your Angular app start from the same Astro design tokens, the visual language stays coherent once you apply the overrides. High-fidelity pixel matching is limited (PowerPoint is for wireframes/mockups, not production UI), but the branding will be close enough for stakeholder reviews and developer handoff.

### Summary Workflow for Your Situation

1. Purchase & download the PowerPoint Toolkit on a connected machine.
2. Transfer the `.pptx` (or archive) to the isolated network.
3. Open in PowerPoint and create a custom theme that mirrors your SCSS overrides.
4. Build mockups with the Astro components, applying your theme colors.
5. Export the finished mockups (PDF, images, or the `.pptx` itself) for review or handoff to the Angular development team.

This approach gives you a fully offline, Astro-compliant mockup capability that can incorporate your custom branding without needing Figma or any external connectivity after the initial transfer.

If you need help mapping a specific set of SCSS variables to PowerPoint theme slots, or if you want guidance on LibreOffice alternatives, just share more details about your custom tokens.

## My Prompt 3

I can actually transfer the PowerPoint option from a windows environment to another windows environment, packaging it as a zip or the like (whatever is best). Walk me through how that transfer would work for the AstroUXDS PowerPoint Toolkit?

----------------------------------------------------------------------

**Yes — transferring the AstroUXDS PowerPoint Toolkit between Windows environments is straightforward.** Because it is a one-time download of static files (typically one or more `.pptx` template files plus any supporting assets), you can package it as a standard ZIP and move it via approved media exactly like any other offline software package.

### Recommended Packaging Format
Use a **ZIP file**.  
Windows has native support for creating and extracting ZIPs (no extra tools required). It is the simplest, most reliable choice for Windows-to-Windows transfers.

### Step-by-Step Transfer Process

#### 1. On the Connected Windows Machine (Source)
1. Purchase the appropriate license (Individual, Team, or Project) on the official page:  
   [https://www.astrouxds.com/platforms/astro-toolkit-ppt/](https://www.astrouxds.com/platforms/astro-toolkit-ppt/)
2. Complete the download. You will receive a downloadable package — usually a single `.pptx` file, a ZIP, or a small folder containing the toolkit templates and component library.
3. If the download is already a ZIP, you can transfer that file directly.  
   If it is a folder or loose `.pptx` files:
   - Select the entire folder (or all toolkit files).
   - Right-click → **Send to → Compressed (zipped) folder**.  
     Or use File Explorer → right-click the selection → **Compress to ZIP file**.
4. Give the ZIP a clear name, for example:  
   `AstroUXDS-PowerPoint-Toolkit-vX.Y.zip`
5. (Optional but recommended) Create a short text file (`README.txt`) inside the ZIP that records:
   - License type and purchase date
   - Named users or project covered by the license
   - Version of the toolkit
   - Any installation notes provided by Rocket Communications

#### 2. Transfer to the Isolated Network
- Copy the ZIP file to approved removable media (USB drive, etc.) following your organization’s data-transfer / air-gap procedures.
- Physically move the media to the isolated Windows environment.
- Scan the media according to local security policy if required.

#### 3. On the Isolated Windows Machine (Destination)
1. Copy the ZIP from the media to a local folder (e.g., `C:\Tools\AstroUXDS\` or your preferred location).
2. Right-click the ZIP → **Extract All…** (or use 7-Zip / WinRAR if preferred).  
   Extract into a clean folder so the original ZIP remains intact as a backup.
3. Open the extracted `.pptx` file(s) in Microsoft PowerPoint.
4. The toolkit should be ready to use immediately — no installer, registry changes, or internet connection is required.
5. Create a custom theme that matches your Angular/SCSS branding (as described previously) and save a branded master template if desired.

### License & Compliance Notes
- The license is **non-transferable** for the software itself. You may only install and use it on machines/users covered by the license you purchased (named individual, up to five named users for a Team license, or unlimited users for one specified Project license).
- Sharing the work products (the mockups and presentations you create) is unrestricted.
- Do not redistribute the toolkit files outside the licensed scope.
- Keep a record of the license details with the transferred package for audit purposes.

### Best Practices for Reliability
- Keep the original downloaded ZIP as a pristine backup.
- After extraction on the isolated side, open the main `.pptx` in PowerPoint and verify that the Astro components appear in the shapes/library as expected.
- If the package contains multiple files or a “Slide Master” / “Library” presentation, follow any short instructions that came with the download.
- Because everything is self-contained PowerPoint content, it works fully offline once transferred.

That is the complete process. The entire transfer is simply “download → ZIP → approved media → extract → open in PowerPoint.”  

If you receive a specific folder structure or extra files with the download and want help organizing them before zipping, or if you need a sample folder layout, just let me know.
---
title: Air Gapped Development Environment Setup Guidance  
notes: This is copy and pasted from a quick googling / Gemini session, thought it might be useful as source material
updated: 2026-10-01
---

Standardizing an enterprise environment across multiple air-gapped RHEL 9 workstations using physical media porting requires downloading and staging the exact standalone installation assets from an internet-connected staging machine. [1] 
Because pnpm uses a hard-link content-addressable storage pool rather than traditional flat .tgz layout mirroring, your media transport must carry a populated global store to bypass network handshakes completely. [2, 3] 

------------------------------
## Air-Gapped Enterprise Environment Config Matrix

| Core Category | Environment Component | Target Version | Offline Porting Asset File Type | Source / Download Endpoint Pattern |
|---|---|---|---|---|
| Integrated IDE Core | Visual Studio Code | 1.140.0 | .rpm Package Binary | Microsoft Yum Repository Base URL |
| Scripting Runtime | Python Interpreter | 3.12.x | .rpm Module Dependencies | RHEL 9 AppStream Installation ISO |
| Python Isolation | uv CLI | 0.6.x | Standalone Static Binary | GitHub Releases (uv-x86_64-unknown-linux-gnu.tar.gz) |
| Angular Integration | Angular Language Service | 22.2.0 | Linux-x64 .vsix Bundle | VS Code Marketplace API Download Query |
| Angular Integration | Angular Extension Pack | 1.2.4 | Universal .vsix Bundle | VS Code Marketplace API Download Query |
| Python Tooling | Black Formatter (Ext) | 2026.1.0 | Universal .vsix Bundle | VS Code Marketplace API Download Query |
| Python Tooling | Python (Extension) | 2026.6.0 | Linux-x64 .vsix Bundle | VS Code Marketplace API Download Query |
| Python Tooling | Python Environments | 1.38.0 | Universal .vsix Bundle | VS Code Marketplace API Download Query |
| Code Integrity | ESLint (Extension) | 3.0.34 | Universal .vsix Bundle | VS Code Marketplace API Download Query |
| Code Integrity | Prettier - Code Formatter | 12.4.0 | Universal .vsix Bundle | VS Code Marketplace API Download Query |
| Package Management | pnpm Store Pool | 10.15.0 | Compressed Tar Archive (.tar.gz) | Staged .pnpm-store/ structural cache |

------------------------------
## Phase 1: Staging Script (Run on Connected Machine)
Execute this on your internet-connected staging machine to gather the exact packages onto your transport media (e.g., encrypted USB drive or data layer disc):

#!/usr/bin/env bashset -euo pipefail
STAGING_DIR="./airgap_media_payload"
mkdir -p "$STAGING_DIR/rpms" "$STAGING_DIR/vsix" "$STAGING_DIR/bin"
# 1. Pull down VS Code 1.140 RPM
curl -Lo "$STAGING_DIR/rpms/code-1.140.0.rpm" \
  "https://visualstudio.com"
# 2. Download standalone 'uv' binary for offline Python execution
curl -Lo "$STAGING_DIR/bin/uv.tar.gz" \
  "https://github.com"
# 3. Pull required .vsix extension bundles explicitly
declare -A extensions=(
  ["Angular.ng-template"]="22.2.0"
  ["willmendesneto.angular6-extension-pack"]="1.2.4"
  ["ms-python.black-formatter"]="2026.1.0"
  ["ms-python.python"]="2026.6.0"
  ["dbaeumer.vscode-eslint"]="3.0.34"
  ["esbenp.prettier-vscode"]="12.4.0"
)for ext in "${!extensions[@]}"; do
  ver="${extensions[$ext]}"
  echo "Downloading $ext @ $ver..."
  curl -Lo "$STAGING_DIR/vsix/$ext-$ver.vsix" \
    "https://visualstudio.com{ext%%.*}/vsextensions/${ext#*.}/$ver/vspackage"done
# 4. Generate the pnpm offline storage content mirror# Run this inside a mock template folder containing your master package.json
mkdir -p "$STAGING_DIR/pnpm-store"
pnpm install --store-dir="$STAGING_DIR/pnpm-store"
# Compress everything into your final distribution package
tar -czf enterprise_rhel9_dev_bundle.tar.gz "$STAGING_DIR"

------------------------------
## Phase 2: Secure Installation Script (Run on Target Air-Gapped RHEL 9 Workstation)
Once the enterprise_rhel9_dev_bundle.tar.gz is moved via media transfer to the isolated RHEL 9 machine, run the following setup routine: [4] 

#!/usr/bin/env bashset -euo pipefail
PAYLOAD="./airgap_media_payload"
# 1. Install local VS Code binary
sudo dnf localinstall -y "$PAYLOAD/rpms/code-1.140.0.rpm"
# 2. Install Python 3.12 from your local mounted RHEL 9 AppStream ISO/Media# (Assumes your RHEL 9 DVD or internal system mirror is pointed to by local dnf)
sudo dnf install -y python3.12 python3.12-devel
# 3. Extract and link the isolation 'uv' binary tool line
tar -xzf "$PAYLOAD/bin/uv.tar.gz" -C "$HOME/.local/bin" uv uvx
# 4. Inject all extensions into VS Code smoothly from local file assetsfor vsix_file in "$PAYLOAD/vsix"/*.vsix; do
  code --install-extension "$vsix_file" --forcedone
# 5. Extract the global pnpm store into the machine profile
mkdir -p "$HOME/.local/share/pnpm/store"
cp -r "$PAYLOAD/pnpm-store/"* "$HOME/.local/share/pnpm/store/"

echo "Air-Gapped Workstation Pipeline Ready. Run 'pnpm install --offline' inside repositories."

------------------------------
If you are standardizing this file strategy, let me know:

* 
* Do you need an updated .npmrc configuration snippet for your project repositories to explicitly instruct local machines to use only the local store and block out network call attempts? [2, 3] 
* Do you require a template script for assembling Python dependency source packages (.whl wheels) for your scripting utilities in this offline setup? [5] 
* 


[1] [https://www.reddit.com](https://www.reddit.com/r/vscode/comments/1i2v8u2/need_help_finding_how_to_download_the_vsix_file/)
[2] [https://github.com](https://github.com/pnpm/pnpm/issues/2978)
[3] [https://pnpm.io](https://pnpm.io/cli/install)
[4] [https://www.redhat.com](https://www.redhat.com/en/blog/install-linux-rhel-9)
[5] [https://github.com](https://github.com/gni/offvsix)

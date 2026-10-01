#!/usr/bin/env bash
# build-frontend-bundle.sh -- assemble the FRONT-END / WORKSTATION transfer bundle for the
# air-gapped RHEL 9 development network, on an internet-connected Linux x64 staging machine.
# Created 2026-10-01 (Axium). Rehearsal results: docs/design/packets/desert-island-devenv-01-design-packet/.
#
# WHAT IT PRODUCES  <workdir>/devenv-frontend-bundle-<date>.tar containing:
#   npm/            every registry tarball the vetted stack's lockfile references (linux-x64),
#                   sha512-verified against the lockfile, + SHA256SUMS, MANIFEST.json, the
#                   package.json and package-lock.json that define it   -> Nexus npm-hosted
#   raw/            binaries laid out exactly as they go into Nexus raw-hosted:
#                     nodejs/       Node.js linux-x64 tarball + SHASUMS256.txt (nodejs.org layout)
#                     vscode/       VS Code RPM (Microsoft's published sha256 verified)
#                     vscode-extensions/  .vsix files (pack members and dependencies included)
#                     uv/           uv standalone binary (published sha256 verified)
#                     cypress/      Cypress binary zip      (CYPRESS_INSTALL_BINARY points here)
#                     playwright/   Playwright browser builds (PLAYWRIGHT_BROWSERS_PATH)
#                     prisma-engines/  Prisma schema-engine (PRISMA_ENGINES_MIRROR points here)
#   pypi/           wheels for stack/python/requirements.txt (empty by default)
#   island/         the scripts that load all of the above into Nexus and set up a workstation
#   SHA256SUMS      every file in the bundle -- verify this first on the island
#
# PREREQUISITES (staging machine): Linux x64, bash, curl, tar, xz, sha256sum, unzip, gzip.
#   Node is NOT required -- the script downloads the pinned Node and uses it. python3 + pip only
#   if stack/python/requirements.txt lists packages. ~4 GB free disk (download cache + output + the .tar). 10-40 minutes.
#   Behind a proxy: export HTTPS_PROXY as usual (Node's fetch is told to honour it).
#
# USAGE   build-frontend-bundle.sh <workdir> [--relock] [--skip-browsers] [--skip-vscode]
#   --relock         regenerate stack/frontend/package-lock.json from package.json first (pins
#                    are exact, so only transitive versions can move) -- commit the result
#   --skip-browsers  omit Cypress + Playwright binaries (~400 MB) for a quick trial run
#   --skip-vscode    omit the VS Code RPM and extensions
#
# FAILURE MODE: any download that fails or does not match its checksum aborts with the URL.
# Re-running reuses everything already downloaded and verified.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"               # desert-island-devenv/
REPO="$(cd "$ROOT/.." && pwd)"
STACK="$ROOT/stack"
LEGACY_TOOLS="$REPO/legacy-shells/tools"               # proven lock-union / fetch-tarballs (shared with the legacy bundle)
WORK="${1:?usage: build-frontend-bundle.sh <workdir> [--relock] [--skip-browsers] [--skip-vscode]}"; shift
RELOCK=0; SKIP_BROWSERS=0; SKIP_VSCODE=0
for a in "$@"; do case "$a" in
  --relock) RELOCK=1 ;; --skip-browsers) SKIP_BROWSERS=1 ;; --skip-vscode) SKIP_VSCODE=1 ;;
  *) echo "unknown option $a"; exit 2 ;; esac; done

log() { printf '\n== %s\n' "$*"; }
die() { printf 'ABORT: %s\n' "$*" >&2; exit 1; }
for c in curl tar xz sha256sum unzip gzip; do command -v "$c" >/dev/null || die "missing command: $c"; done
[ "$(uname -s)-$(uname -m)" = "Linux-x86_64" ] || die "run on Linux x86_64 (the island's platform)"
# shellcheck disable=SC1091
source "$STACK/workstation.env"
export NODE_USE_ENV_PROXY=1                             # Node's fetch ignores HTTPS_PROXY without this

STAMP=$(date +%F)
NAME="devenv-frontend-bundle-$STAMP"   # named for what it is (compliance convention, 2026-09-08)
OUT="$WORK/$NAME"; CACHE="$WORK/.cache"; FILES="$CACHE/files"
# The output is assembled FRESH every run (only what the current pins name can end up in it);
# downloads persist in $FILES, so a re-run fetches nothing it already has.
rm -rf "$OUT" "$OUT.tar"; mkdir -p "$OUT" "$FILES"
RAW="$OUT/raw"
# fetch URL OUTPATH: download into the cache (unless present) and hard-link into the output.
fetch() { local c="$FILES/${2#"$OUT"/}"
  if [ ! -s "$c" ]; then mkdir -p "$(dirname "$c")"
    curl -fsSL --retry 4 --retry-delay 3 -o "$c.part" "$1" || die "download failed: $1"; mv "$c.part" "$c"; fi
  place "$c" "$2"; }
place() { mkdir -p "$(dirname "$2")"; ln -f "$1" "$2" 2>/dev/null || cp -p "$1" "$2"; }
check_sha256() { echo "$1  $2" | sha256sum -c --quiet - || { rm -f "$2" "$FILES/${2#"$OUT"/}"; die "sha256 mismatch: $2"; }; }

# ---------------------------------------------------------------- 1. Node (also our toolchain)
log "1/9 Node.js $NODE_VERSION"
ND="$RAW/nodejs/v$NODE_VERSION"; NT="node-v$NODE_VERSION-linux-x64.tar.xz"
fetch "https://nodejs.org/dist/v$NODE_VERSION/SHASUMS256.txt" "$ND/SHASUMS256.txt"
fetch "https://nodejs.org/dist/v$NODE_VERSION/$NT" "$ND/$NT"
( cd "$ND" && grep " $NT\$" SHASUMS256.txt | sha256sum -c --quiet - ) || die "Node tarball checksum mismatch"
TOOLNODE="$CACHE/node-v$NODE_VERSION"
[ -x "$TOOLNODE/bin/node" ] || { mkdir -p "$TOOLNODE"; tar -xJf "$ND/$NT" -C "$TOOLNODE" --strip-components=1; }
export PATH="$TOOLNODE/bin:$PATH"
echo "node $(node --version), npm $(npm --version)"

# ---------------------------------------------------------------- 2. npm package pool
log "2/9 npm package pool from the committed lockfile"
FE="$STACK/frontend"
if [ "$RELOCK" = 1 ]; then
  ( cd "$FE" && rm -f package-lock.json && npm install --package-lock-only --ignore-scripts --no-audit --no-fund )
  echo "lockfile regenerated -- review and commit stack/frontend/package-lock.json"
fi
[ -f "$FE/package-lock.json" ] || die "no lockfile at $FE/package-lock.json (run with --relock)"
mkdir -p "$OUT/npm"
node "$LEGACY_TOOLS/lock-union.mjs" "$FE/package-lock.json" > "$CACHE/union.tsv"
# Reuse tarballs from a previous run's pool instead of re-downloading them, then drop any the
# current lockfile no longer names (fetch-tarballs writes SHA256SUMS for exactly the union).
[ -d "$CACHE/npm-tarballs" ] && cp -al "$CACHE/npm-tarballs" "$OUT/npm/tarballs"
node "$LEGACY_TOOLS/fetch-tarballs.mjs" "$CACHE/union.tsv" "$OUT/npm/tarballs"
rm -rf "$CACHE/npm-tarballs" && cp -al "$OUT/npm/tarballs" "$CACHE/npm-tarballs"
( cd "$OUT/npm/tarballs" && comm -23 <(ls | LC_ALL=C sort) <(sed 's#.*tarballs/##' ../SHA256SUMS | LC_ALL=C sort) | xargs -r rm -f )
cp "$FE/package.json" "$FE/package-lock.json" "$OUT/npm/"
( cd "$OUT/npm" && sha256sum -c SHA256SUMS --quiet ) || die "npm pool failed its own SHA256SUMS"

# Versions of the binaries are derived from the lock, never typed twice.
lockver() { node -e 'const l=require(process.argv[1]); const e=l.packages["node_modules/"+process.argv[2]]; if(!e) process.exit(3); console.log(e.version)' "$FE/package-lock.json" "$1"; }
CYPRESS_VERSION=$(lockver cypress); PLAYWRIGHT_VERSION=$(lockver playwright-core)
PRISMA_COMMIT=$(lockver @prisma/engines-version | sed 's/.*\.//')
echo "from lockfile: cypress $CYPRESS_VERSION, playwright $PLAYWRIGHT_VERSION, prisma engines $PRISMA_COMMIT"

# ---------------------------------------------------------------- 3. Prisma schema engine
log "3/9 Prisma schema-engine ($PRISMA_BINARY_TARGETS)"
for t in $PRISMA_BINARY_TARGETS; do
  P="$RAW/prisma-engines/all_commits/$PRISMA_COMMIT/$t"; B="https://binaries.prisma.sh/all_commits/$PRISMA_COMMIT/$t"
  for f in schema-engine.gz schema-engine.gz.sha256 schema-engine.sha256; do fetch "$B/$f" "$P/$f"; done
  check_sha256 "$(awk '{print $1}' "$P/schema-engine.gz.sha256")" "$P/schema-engine.gz"
done

# ---------------------------------------------------------------- 4. Cypress + Playwright binaries
if [ "$SKIP_BROWSERS" = 0 ]; then
  log "4/9 Cypress $CYPRESS_VERSION binary"
  CZ="$RAW/cypress/$CYPRESS_VERSION/linux-x64/cypress.zip"
  fetch "https://download.cypress.io/desktop/$CYPRESS_VERSION?platform=linux&arch=x64" "$CZ"
  unzip -tq "$CZ" >/dev/null || { rm -f "$CZ" "$FILES/${CZ#"$OUT"/}"; die "Cypress zip is corrupt"; }

  log "5/9 Playwright $PLAYWRIGHT_VERSION browsers ($PLAYWRIGHT_BROWSERS)"
  PT="$RAW/playwright/$PLAYWRIGHT_VERSION/playwright-browsers-linux-x64.tar.gz"
  PTC="$FILES/${PT#"$OUT"/}"
  if [ ! -s "$PTC" ]; then
    PW="$CACHE/playwright-$PLAYWRIGHT_VERSION"; mkdir -p "$PW"
    ( cd "$PW"
      [ -f package.json ] || echo '{"private":true}' > package.json
      npm install "playwright-core@$PLAYWRIGHT_VERSION" --no-audit --no-fund --silent
      rm -rf ms-playwright
      # Playwright >= 1.55.1 verifies each browser download (GHSA advisory on older versions).
      PLAYWRIGHT_BROWSERS_PATH="$PW/ms-playwright" npx playwright-core install $PLAYWRIGHT_BROWSERS )
    mkdir -p "$(dirname "$PTC")"; tar -czf "$PTC.part" -C "$PW" ms-playwright && mv "$PTC.part" "$PTC"
  fi
  place "$PTC" "$PT"
else log "4-5/9 SKIPPED Cypress and Playwright binaries (--skip-browsers)"; fi

# ---------------------------------------------------------------- 6. VS Code + extensions
if [ "$SKIP_VSCODE" = 0 ]; then
  log "6/9 VS Code $VSCODE_VERSION RPM"
  META=$(curl -fsSL "https://update.code.visualstudio.com/api/versions/$VSCODE_VERSION/linux-rpm-x64/stable") || die "VS Code metadata unavailable"
  URL=$(echo "$META" | node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{const j=JSON.parse(d);console.log(j.url+" "+j.sha256hash)})')
  RPM="$RAW/vscode/$VSCODE_VERSION/$(basename "${URL%% *}")"
  fetch "${URL%% *}" "$RPM"; check_sha256 "${URL##* }" "$RPM"

  log "7/9 VS Code extensions"
  while read -r id ver plat; do
    [[ -z "$id" || "$id" == \#* ]] && continue
    pub=${id%%.*}; ext=${id#*.}; q=""; [ "$plat" != universal ] && q="?targetPlatform=$plat"
    V="$RAW/vscode-extensions/$id-$ver-$plat.vsix"; VC="$FILES/${V#"$OUT"/}"
    if [ ! -s "$VC" ]; then mkdir -p "$(dirname "$VC")"
      curl -fsSL --compressed --retry 4 --retry-delay 3 -o "$VC.part" \
        "https://marketplace.visualstudio.com/_apis/public/gallery/publishers/$pub/vsextensions/$ext/$ver/vspackage$q" \
        || die "extension download failed: $id $ver $plat"
      mv "$VC.part" "$VC"; fi
    place "$VC" "$V"
    got=$(unzip -p "$V" extension.vsixmanifest 2>/dev/null | grep -o '<Identity [^>]*' | grep -o ' Version="[^"]*"' | head -1 | cut -d'"' -f2)
    [ "$got" = "$ver" ] || { rm -f "$V" "$VC"; die "$id: expected version $ver in the .vsix, found '$got'"; }
    echo "  $id $ver ($plat)"
  done < "$STACK/vscode-extensions.txt"
  cp "$STACK/vscode-extensions.txt" "$RAW/vscode-extensions/INSTALL-ORDER.txt"
else log "6-7/9 SKIPPED VS Code (--skip-vscode)"; fi

# ---------------------------------------------------------------- 8. uv + optional wheels
log "8/9 uv $UV_VERSION (+ Python wheels if requested)"
UA="uv-x86_64-unknown-linux-gnu.tar.gz"; UD="$RAW/uv/$UV_VERSION"
fetch "https://github.com/astral-sh/uv/releases/download/$UV_VERSION/$UA.sha256" "$UD/$UA.sha256"
fetch "https://github.com/astral-sh/uv/releases/download/$UV_VERSION/$UA" "$UD/$UA"
check_sha256 "$(awk '{print $1}' "$UD/$UA.sha256")" "$UD/$UA"
if grep -qvE '^\s*(#|$)' "$STACK/python/requirements.txt"; then
  command -v python3 >/dev/null || die "python3 needed to download the wheels in stack/python/requirements.txt"
  mkdir -p "$OUT/pypi"
  python3 -m pip download --dest "$OUT/pypi" --only-binary=:all: --python-version 3.12 \
    --implementation cp --platform manylinux_2_34_x86_64 --platform manylinux_2_28_x86_64 \
    --platform manylinux2014_x86_64 -r "$STACK/python/requirements.txt" || die "wheel download failed"
  cp "$STACK/python/requirements.txt" "$OUT/pypi/"
else echo "  no Python packages requested (stack/python/requirements.txt is empty)"; fi

# ---------------------------------------------------------------- 9. island scripts + checksums + tar
log "9/9 island scripts, checksums, archive"
rm -rf "$OUT/island"; cp -r "$ROOT/island" "$OUT/island"; rm -f "$OUT/island/devenv.conf" "$OUT/island/backend.versions.env"
# Exact versions + file names for the island installer (it never guesses a version).
cat > "$OUT/island/frontend.versions.env" <<VERS
NODE_VERSION=$NODE_VERSION
UV_VERSION=$UV_VERSION
VSCODE_VERSION=$VSCODE_VERSION
VSCODE_RPM=$([ "$SKIP_VSCODE" = 0 ] && basename "$RPM" || true)
CYPRESS_VERSION=$CYPRESS_VERSION
PLAYWRIGHT_VERSION=$PLAYWRIGHT_VERSION
PRISMA_COMMIT=$PRISMA_COMMIT
VERS
cat > "$OUT/BUNDLE-INFO.txt" <<INFO
bundle:   $NAME
built:    $(date -u +%FT%TZ) on $(uname -sr)
node:     $NODE_VERSION   vscode: $VSCODE_VERSION   uv: $UV_VERSION
cypress:  $CYPRESS_VERSION   playwright: $PLAYWRIGHT_VERSION ($PLAYWRIGHT_BROWSERS)   prisma engine: $PRISMA_COMMIT ($PRISMA_BINARY_TARGETS)
npm pool: $(node -e 'const m=require(process.argv[1]); console.log(m.count+" tarballs, "+(m.totalBytes/1e6).toFixed(1)+" MB")' "$OUT/npm/MANIFEST.json")
browsers: $([ "$SKIP_BROWSERS" = 1 ] && echo OMITTED || echo included)   vscode: $([ "$SKIP_VSCODE" = 1 ] && echo OMITTED || echo included)
start with: island/README.md
INFO
( cd "$OUT" && find . -type f ! -name SHA256SUMS -printf '%P\n' | LC_ALL=C sort | xargs -d '\n' sha256sum > SHA256SUMS )
tar -cf "$OUT.tar" -C "$WORK" "$NAME"
echo; cat "$OUT/BUNDLE-INFO.txt"; echo; ls -l "$OUT.tar"; du -sh "$OUT"/* | sort -h
echo "DONE: $OUT.tar"

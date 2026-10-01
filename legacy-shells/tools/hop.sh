#!/bin/bash
# hop.sh -- one rung of the Angular upgrade ladder, on one npm-workspaces monorepo app whose
# angular.json lives in packages/client/ (the layout of both legacy apps).
#
# It encodes monorepo_hop_procedure_v3.md (legacy-shell-bundle-01 packet). Every step is
# separate, so on a REAL app you run one step, review the diff, commit, then run the next.
# The version table below is the set the bundles were cut for -- Nexus must serve it.
#
# Usage:  hop.sh <app-root> <rung> <step>
#   rung:  17-18 | 18-19 | 19-20 | 20-21 | 21-22
#   step:  check     read-only: Node version, git state, registry reachability, what the rung will change
#          pre       rung pre-step edits (18-19: jest-preset-angular; 20-21: the Jest 30 stack) +
#                    temporary root angular.json. Regenerates the lock if package.json changed.
#          phase1    ng update @angular/core + @angular/cli            (the framework)
#          phase2    ng update material/cdk + any @ngrx/* the root declares (never combined with phase1)
#          pins      hand-bumps ng update cannot see: workspace toolchain pins, keycloak-angular,
#                    and (21-22) the client tsconfig's moduleResolution for TypeScript 6
#          teardown  port angular.json edits back to packages/client, remove the temporary root file,
#                    regenerate the lock from clean; (21-22) fix TS 6's TS1479 in plain-tsc packages
#          validate  ng build, tsc per package, jest, npm ls
#          all       every step in order, committing after each one (REHEARSAL use -- on real code,
#                    review migrations between steps instead)
#
# Rehearsal-only switch: HOP_DROP_WORKSPACE_DEVDEPS=1 removes root devDependencies on the
# app's own private workspace packages ("@my-team/...": "*") for the hop and restores them at
# teardown. Needed only against a registry with no metadata for them (the public registry);
# the island's Nexus serves that metadata, so do NOT set it there.
#
# Created 2026-10-01 (Axium). Requires: bash, git, node+npm on PATH, registry = Nexus (or npmjs).
set -euo pipefail

APP="${1:?usage: hop.sh <app-root> <rung> <step>}"; RUNG="${2:?rung}"; STEP="${3:?step}"
TOOLS="$(cd "$(dirname "$0")" && pwd)"
cd "$APP"; APP="$(pwd)"
FROM="${RUNG%-*}"; TO="${RUNG#*-}"

# ---- the version table (registry state 2026-10-01; latest patch of each major) ------------
declare -A CORE=( [18]=18.2.14 [19]=19.2.25 [20]=20.3.33 [21]=21.2.25 [22]=22.2.1 )
declare -A CLI=(  [18]=18.2.21 [19]=19.2.27 [20]=20.3.37 [21]=21.2.24 [22]=22.2.1 )
declare -A MAT=(  [18]=18.2.14 [19]=19.2.19 [20]=20.2.14 [21]=21.2.14 [22]=22.2.1 )
declare -A NGRX=( [18]=18.1.1  [19]=19.2.1  [20]=20.1.0  [21]=21.1.1  [22]=22.0.1 )
declare -A KCA=(  [18]=16.1.0  [19]=19.0.2  [20]=20.1.0  [21]=21.0.0  [22]=22.0.0 )   # keycloak-angular tracks Angular's major
[[ -n "${CORE[$TO]:-}" && "$FROM" -eq $((TO-1)) ]] || { echo "unknown rung '$RUNG' (17-18 .. 21-22)"; exit 2; }

say()  { echo "== [$RUNG $STEP] $*"; }
die()  { echo "STOP [$RUNG $STEP]: $*" >&2; exit 1; }
clean_tree() { [ -z "$(git status --porcelain)" ] || die "git tree not clean -- commit (or stash) first; ng update refuses a dirty tree"; }
export NG_CLI_ANALYTICS=false PUPPETEER_SKIP_DOWNLOAD=true PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# set <name> to <version> in every package.json that declares it (root + packages/*), keeping
# the existing range prefix (^ or ~) if there is one. Prints each edit.
bump() { node - "$@" <<'EOF'
const fs=require('fs'), path=require('path'); const [name, ver, onlyIfBelowMajor]=process.argv.slice(2);
const files=['package.json', ...fs.readdirSync('packages').map(d=>path.join('packages',d,'package.json')).filter(f=>fs.existsSync(f))];
for (const f of files) { const raw=fs.readFileSync(f,'utf8'), p=JSON.parse(raw); let hit=false;
  for (const sec of ['dependencies','devDependencies']) { const cur=p[sec]?.[name]; if (!cur) continue;
    if (onlyIfBelowMajor) { const m=parseInt(cur.replace(/^[^0-9]*/,'')); if (m>=+onlyIfBelowMajor) continue; }
    const pre=(cur.match(/^[\^~]/)||[''])[0]; const nv=pre+ver; if (cur===nv) continue;
    p[sec][name]=nv; hit=true; console.log(`  ${f}: ${sec}.${name} ${cur} -> ${nv}`); }
  if (hit) fs.writeFileSync(f, JSON.stringify(p,null,2)+'\n'); }
EOF
}
rootver() { node -p "const p=require('./package.json'); (p.dependencies||{})['$1']||(p.devDependencies||{})['$1']||''"; }
declared_root() { node -p "const p=require('./package.json'); Object.keys({...p.dependencies,...p.devDependencies}).filter(n=>new RegExp('$1').test(n)).join(' ')"; }
regen_lock() { say "regenerating the lock from clean (rm node_modules + package-lock.json; npm install)"
  rm -rf node_modules packages/*/node_modules package-lock.json
  npm install --no-audit --no-fund; }
node_ok() { # does this Node satisfy @angular/cli@<target>'s engines? (uses npm's own bundled semver)
  local eng; eng="$(npm view "@angular/cli@${CLI[$TO]}" engines.node 2>/dev/null)" || die "registry has no @angular/cli@${CLI[$TO]} -- is the $RUNG bundle loaded into Nexus?"
  node -e "const s=require(require('path').join('$(npm root -g)','npm','node_modules','semver')); if(!s.satisfies(process.version, process.argv[1])){console.error('Node '+process.version+' does not satisfy @angular/cli@${CLI[$TO]} engines: '+process.argv[1]);process.exit(1)} console.log('  Node '+process.version+' satisfies '+process.argv[1])" "$eng"; }
# ng update learns Angular's package groups from the REGISTRY's metadata (`ng-update.packageGroup`).
# A Nexus loaded through its components REST API drops that field -- ng update then moves
# @angular/core alone and the next step fails on peers (found 2026-10-01). Refuse early instead.
meta_ok() {
  local g; g="$(npm view "@angular/core@${CORE[$TO]}" ng-update.packageGroup --json 2>/dev/null)"
  if [ -z "$g" ] || [ "$g" = "[]" ]; then
    die "the registry's metadata for @angular/core@${CORE[$TO]} has no ng-update package group -- it was loaded in a way that strips package metadata (e.g. Nexus's components REST API). Re-load with this bundle's upload-to-nexus.sh (npm publish; it repairs incomplete metadata in place), then re-run."
  fi
  echo "  registry metadata for @angular/core@${CORE[$TO]} carries ng-update (package groups visible to ng update)"; }
commit() { [ "${HOP_AUTOCOMMIT:-}" = 1 ] || return 0; git add -A; git commit -qm "hop $RUNG $1" && echo "  committed: hop $RUNG $1" || true; }

do_check() {
  say "app: $APP"; node_ok || die "upgrade Node first (21-22 is the ladder's only Node gate: >= 22.22.3 on the 22.x line)"
  meta_ok
  echo "  registry: $(npm config get registry)"
  [ -f packages/client/angular.json ] || die "packages/client/angular.json not found -- this script expects the client-package layout"
  echo "  root @angular/core now: $(rootver @angular/core)  -> ${CORE[$TO]}"
  echo "  phase2 will update: $( [ -n "$(rootver @angular/material)" ] && echo "@angular/material @angular/cdk") $(declared_root '^@ngrx/')"
  local other; other="$(declared_root '^@other-team/')"; [ -n "$other" ] && echo "  NOTE: private Angular-coupled packages present ($other) -- if they peer on @angular/* ^$FROM, phase1 refuses at plan stage until that team publishes a ^$TO build. Do not --force past it without their say."
  git status --porcelain | grep -q . && echo "  NOTE: git tree is dirty -- commit before 'pre'" || true
}

do_pre() {
  clean_tree; node_ok || die "upgrade Node first"
  local changed=0 out
  case "$RUNG" in
    18-19) say "pre-step: jest-preset-angular -> 14.6.2 (14.1.0 peers build-angular <19; ng update refuses at plan stage)"
           out="$(bump jest-preset-angular 14.6.2)"; [ -n "$out" ] && { echo "$out"; changed=1; } ;;
    20-21) say "pre-step: the Jest 30 stack (jest-preset-angular 16.2.0 is the first whose peers reach ng21; it requires jest 30)"
           out="$( bump jest 30.5.2; bump jest-environment-jsdom 30.5.2; bump babel-jest 30.5.2; bump @types/jest 30.0.0
                   bump ts-jest 29.4.14; bump jest-preset-angular 16.2.0; bump jsdom 26.1.0 26 )"
           [ -n "$out" ] && { echo "$out"; changed=1; }
           for f in $(grep -rl "jest-preset-angular/setup-jest" --include='setup-jest.ts' --include='*.cjs' --include='*.js' --include='*.ts' packages 2>/dev/null | grep -v node_modules || true); do
             if grep -qE "^import 'jest-preset-angular/setup-jest';?\s*$" "$f"; then
               sed -i -E "s#^import 'jest-preset-angular/setup-jest';?\s*\$#import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';\nsetupZoneTestEnv();#" "$f"
               echo "  $f: setup-jest entrypoint rewritten to setupZoneTestEnv() (the old path is gone in jpa 16)"; changed=1
             else echo "  WARNING $f references jest-preset-angular/setup-jest in a form this script does not rewrite -- edit by hand:"
                  echo "      import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone'; setupZoneTestEnv();"; fi
           done ;;
  esac
  if [ "${HOP_DROP_WORKSPACE_DEVDEPS:-}" = 1 ]; then
    node -e "const fs=require('fs');const p=require('./package.json');const d={};for(const [n,v] of Object.entries(p.devDependencies||{}))if(/^@my-team\//.test(n)&&v==='*'){d[n]=v;delete p.devDependencies[n]}
      if(Object.keys(d).length){fs.writeFileSync('.hop-dropped.json',JSON.stringify(d));fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');console.log('  REHEARSAL: dropped root devDeps '+Object.keys(d).join(' '))}"
    changed=1
  fi
  if [ "$changed" = 1 ]; then regen_lock; PRE_CHANGED=1; fi
  [ -f angular.json ] && die "a root angular.json already exists -- a previous hop was not torn down"
  node "$TOOLS/make-root-angular-json.mjs" .
  cp angular.json .hop-root-angular.json.orig
  echo "  validate before phase1 if package.json changed (hop.sh $APP $RUNG validate), then commit"
}

do_phase1() {
  [ "${HOP_AUTOCOMMIT:-}" = 1 ] || clean_tree
  meta_ok
  say "ng update @angular/core@${CORE[$TO]} @angular/cli@${CLI[$TO]}"
  npx ng update "@angular/core@${CORE[$TO]}" "@angular/cli@${CLI[$TO]}"
  echo "  root now: core $(rootver @angular/core)  cli $(rootver @angular/cli)  build-angular $(rootver @angular-devkit/build-angular)  typescript $(rootver typescript)  zone.js $(rootver zone.js)"
}

do_phase2() {
  [ "${HOP_AUTOCOMMIT:-}" = 1 ] || clean_tree
  local pk=() n
  [ -n "$(rootver @angular/material)" ] && pk+=("@angular/material@${MAT[$TO]}")
  [ -n "$(rootver @angular/cdk)" ] && pk+=("@angular/cdk@${MAT[$TO]}")
  for n in $(declared_root '^@ngrx/'); do pk+=("$n@${NGRX[$TO]}"); done
  [ ${#pk[@]} -eq 0 ] && { say "nothing Angular-coupled to update"; return 0; }
  say "ng update ${pk[*]}"
  npx ng update "${pk[@]}"
}

do_pins() {
  say "hand-bumps ng update cannot see (it reads only the root package.json)"
  local n v
  for n in @angular/cli @angular-devkit/build-angular @angular/compiler-cli typescript; do
    v="$(rootver "$n")"; [ -n "$v" ] || continue
    node - "$n" "${v#[\^~]}" <<'EOF'
const fs=require('fs'),path=require('path');const [name,ver]=process.argv.slice(2);
// workspace packages only; typescript only where the package also builds Angular (has angular.json)
for (const d of fs.readdirSync('packages')) { const f=path.join('packages',d,'package.json'); if(!fs.existsSync(f)) continue;
  if (name==='typescript' && !fs.existsSync(path.join('packages',d,'angular.json'))) continue;
  const p=JSON.parse(fs.readFileSync(f,'utf8')); let hit=false;
  for (const sec of ['dependencies','devDependencies']) { const cur=p[sec]?.[name]; if(!cur) continue;
    const nv=(cur.match(/^[\^~]/)||[''])[0]+ver; if(cur===nv) continue; p[sec][name]=nv; hit=true; console.log(`  ${f}: ${name} ${cur} -> ${nv}`); }
  if (hit) fs.writeFileSync(f, JSON.stringify(p,null,2)+'\n'); }
EOF
  done
  bump keycloak-angular "${KCA[$TO]}"
  if [ "$RUNG" = 21-22 ]; then
    say "TypeScript 6 forced edit: moduleResolution \"node\" is a hard error (TS5107) -> \"bundler\" in the client tsconfig"
    for f in packages/client/tsconfig.json packages/client/tsconfig.app.json packages/client/tsconfig.spec.json; do
      [ -f "$f" ] && grep -qiE '"moduleResolution"\s*:\s*"node(10)?"' "$f" && { sed -i -E 's/("moduleResolution"\s*:\s*)"[Nn]ode(10)?"/\1"bundler"/' "$f"; echo "  $f: moduleResolution -> bundler"; } || true
    done
  fi
}

do_teardown() {
  say "teardown"
  if [ -f angular.json ]; then
    if cmp -s angular.json .hop-root-angular.json.orig; then echo "  temporary root angular.json unchanged by migrations"
    else echo "  migrations edited the temporary root angular.json:"; diff -u .hop-root-angular.json.orig angular.json | sed 's/^/    /' || true
         # carry them into packages/client/angular.json (e.g. ng20's "schematics" naming block);
         # the tool refuses unless the result round-trips exactly
         node "$TOOLS/port-root-angular-json.mjs" . || die "port those edits into packages/client/angular.json by hand (paths without the packages/client/ prefix), delete angular.json and .hop-root-angular.json.orig, then re-run teardown"
    fi
    rm -f angular.json .hop-root-angular.json.orig; echo "  temporary root angular.json removed"
  fi
  if [ -f .hop-dropped.json ]; then
    node -e "const fs=require('fs');const p=require('./package.json');const d=JSON.parse(fs.readFileSync('.hop-dropped.json','utf8'));p.devDependencies={...p.devDependencies,...d};fs.writeFileSync('package.json',JSON.stringify(p,null,2)+'\n');console.log('  REHEARSAL: restored root devDeps '+Object.keys(d).join(' '))"
    rm -f .hop-dropped.json
  fi
  regen_lock   # the lock left by ng update's forced installs is not trustworthy (nested stale toolchain)
  [ "$RUNG" = 21-22 ] && ts6_types_fix
  return 0
}

# TypeScript 6 + hoisted @types: a plain-tsc package whose tsconfig has no "types" list auto-includes
# EVERY @types/* in the hoisted node_modules; @types/babel__core then fails with TS1479 (ESM import from
# a CommonJS file). Observed on both apps' common/interface packages (2026-10-01, and the 2026-09-03
# walk). Fix only where tsc actually fails that way: "types": ["node"] (Node globals kept, stray @types
# dropped), re-verified; reverted if it does not compile. A tsconfig with comments is left for a human.
ts6_types_fix() {
  local d f
  for d in packages/*/; do d="${d%/}"; f="$d/tsconfig.json"
    [ "$d" = packages/client ] || [ ! -f "$f" ] && continue
    ( cd "$d" && npx tsc -p tsconfig.json --noEmit ) >/tmp/hop-ts6.$$ 2>&1 && continue
    grep -q 'error TS1479' /tmp/hop-ts6.$$ || continue
    node -e '
      const fs=require("fs"), f=process.argv[1]; let j;
      try { j=JSON.parse(fs.readFileSync(f,"utf8")); } catch { console.log("  "+f+": TS1479 -- tsconfig has comments; add \"types\": [\"node\"] to compilerOptions by hand"); process.exit(0); }
      j.compilerOptions=j.compilerOptions||{}; if (j.compilerOptions.types) process.exit(0);
      j.compilerOptions.types=["node"]; fs.writeFileSync(f+".hop-bak", fs.readFileSync(f)); fs.writeFileSync(f, JSON.stringify(j,null,2)+"\n");' "$f"
    [ -f "$f.hop-bak" ] || continue
    if ( cd "$d" && npx tsc -p tsconfig.json --noEmit ) >/tmp/hop-ts6.$$ 2>&1; then
      rm -f "$f.hop-bak"; echo "  $f: TypeScript 6 TS1479 -> compilerOptions.types = [\"node\"] (re-verified)"
    else mv "$f.hop-bak" "$f"; echo "  WARNING $f: TS1479, and types:[\"node\"] did not fix it -- reverted; fix by hand:"; tail -5 /tmp/hop-ts6.$$ | sed 's/^/      /'; fi
  done
  rm -f /tmp/hop-ts6.$$
}

do_validate() {
  say "validate"; local rc=0 d
  run() { local dir="$1"; shift; if (cd "$dir" && "$@") >/tmp/hop-val.$$ 2>&1; then echo "  PASS  $dir: $*"; grep -hE 'bundle initial exceeded|exceeded maximum budget' /tmp/hop-val.$$ | head -2 | sed 's/^/        /' || true
        else echo "  FAIL  $dir: $*"; tail -20 /tmp/hop-val.$$ | sed 's/^/        /'; rc=1; fi; }
  run packages/client npx ng build
  for d in packages/*/; do d="${d%/}"; [ "$d" = packages/client ] && continue; [ -f "$d/tsconfig.json" ] && run "$d" npx tsc -p tsconfig.json; done
  run packages/client npx jest
  # declared dependencies must be satisfied (FAIL); deep-tree findings are reported (WARN) -- at
  # v18 npm hoists chokidar 4 (compiler-cli's) against @angular-devkit/core's OPTIONAL ^3.5.2 peer,
  # an upstream inconsistency that disappears at v19 and does not affect build or test.
  if npm ls >/tmp/hop-ls.$$ 2>&1; then echo "  PASS  npm ls (declared dependencies satisfied)"; else echo "  FAIL  npm ls"; grep -E 'invalid|missing|ERR' /tmp/hop-ls.$$ | head -10 | sed 's/^/        /'; rc=1; fi
  if npm ls --all >/tmp/hop-ls.$$ 2>&1; then echo "  PASS  npm ls --all (whole tree clean)"; else echo "  WARN  npm ls --all:"; grep -E '^npm error (invalid|missing)' /tmp/hop-ls.$$ | sed -E 's#/[^ ]*/node_modules/#node_modules/#; s/^npm error /        /' | head -6; fi
  echo "  now: angular $(node -p 'require("@angular/core/package.json").version') · cli $(node -p 'require("@angular/cli/package.json").version') · typescript $(node -p 'require("typescript/package.json").version') · zone.js $(node -p 'require("zone.js/package.json").version') · node $(node -v)"
  rm -f /tmp/hop-val.$$ /tmp/hop-ls.$$; return $rc
}

case "$STEP" in
  check) do_check ;; pre) do_pre ;; phase1) do_phase1 ;; phase2) do_phase2 ;; pins) do_pins ;;
  teardown) do_teardown ;; validate) do_validate ;;
  all) export HOP_AUTOCOMMIT=1; clean_tree
       PRE_CHANGED=0; do_check; do_pre; [ "$PRE_CHANGED" = 1 ] && do_validate; commit pre; do_phase1; commit phase1; do_phase2; commit phase2
       do_pins; commit pins; do_teardown; commit teardown; do_validate; commit validated ;;
  *) echo "unknown step '$STEP'"; exit 2 ;;
esac

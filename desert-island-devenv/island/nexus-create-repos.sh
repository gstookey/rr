#!/usr/bin/env bash
# nexus-create-repos.sh -- create the hosted repositories the bundles load into, on a NEW
# Nexus Repository 3 instance. Created 2026-10-01; rehearsed against Nexus 3.96.4 (see packet).
# Needs ADMIN credentials (NEXUS_CREDENTIALS_FILE). Safe to re-run: existing repositories are
# left alone. Run once, before load-nexus.sh.
#
#   ./nexus-create-repos.sh [--anonymous-read] [--accept-eula]
#
# --anonymous-read  let workstations read (npm ci, gradle, docker pull) without credentials.
#                   Writes still need an account. Whether that is acceptable is a site security
#                   decision -- without it, every workstation needs a read credential configured.
# --accept-eula     Nexus Repository Community Edition (3.77 and later) refuses EVERY upload
#                   (HTTP 403) until an administrator accepts Sonatype's EULA. Accepting it is a
#                   licensing decision for your organization, so this script never does it unless
#                   a person passes this flag (or accepts it in the web UI's onboarding wizard).
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"
need curl
load_conf; load_creds
ANON=0; ACCEPT_EULA=0
for a in "$@"; do case "$a" in --anonymous-read) ANON=1 ;; --accept-eula) ACCEPT_EULA=1 ;; *) die "unknown option $a" ;; esac; done
API="$NEXUS_URL/service/rest/v1"

api() { # method path [json]
  local code; code=$(curl -sS -o /tmp/nexus-api.$$ -w '%{http_code}' -u "$NEXUS_CREDS" -X "$1" \
    -H 'Content-Type: application/json' ${3:+-d "$3"} "$API$2") || die "cannot reach $API$2"
  echo "$code"; }

curl -fsS -o /dev/null "$API/status" || die "Nexus is not answering at $NEXUS_URL (GET /service/rest/v1/status)"
[ "$(api GET /security/user-sources)" = 200 ] || die "the credentials in $NEXUS_CREDENTIALS_FILE are not an administrator's"

STORAGE='"storage":{"blobStoreName":"default","strictContentTypeValidation":true,"writePolicy":"allow_once"}'
DOCKER_PORT="${DOCKER_REGISTRY##*:}"
create() { # format name extra-json
  if [ "$(api GET "/repositories/$2")" = 200 ]; then echo "  exists: $2"; return; fi
  local code; code=$(api POST "/repositories/$1/hosted" "{\"name\":\"$2\",\"online\":true,$STORAGE${3:+,$3}}")
  [ "$code" = 201 ] || die "creating $2 ($1) returned HTTP $code: $(cat /tmp/nexus-api.$$)"
  echo "  created: $2 ($1)"; }

log "creating hosted repositories"
create npm    "$NPM_REPO"
create maven  "$MAVEN_REPO"  '"maven":{"versionPolicy":"MIXED","layoutPolicy":"PERMISSIVE","contentDisposition":"ATTACHMENT"}'
create raw    "$RAW_REPO"    '"raw":{"contentDisposition":"ATTACHMENT"}'
create pypi   "$PYPI_REPO"
create docker "$DOCKER_REPO" "\"docker\":{\"v1Enabled\":false,\"forceBasicAuth\":false,\"httpPort\":$DOCKER_PORT}"

log "enabling the npm and Docker bearer-token realms (needed by npm and docker clients)"
realms=$(curl -fsS -u "$NEXUS_CREDS" "$API/security/realms/active")
new=$(printf '%s' "$realms" | tr -d '[]" ' | tr ',' '\n' | grep -v '^$' | { cat; echo NpmToken; echo DockerToken; } | awk '!s[$0]++' | sed 's/.*/"&"/' | paste -sd, -)
[ "$(api PUT /security/realms/active "[$new]")" = 204 ] || die "could not update active realms"
echo "  active realms: $new"

if [ "$ANON" = 1 ]; then
  log "enabling anonymous read access"
  [ "$(api PUT /security/anonymous '{"enabled":true,"userId":"anonymous","realmName":"NexusAuthorizingRealm"}')" = 200 ] \
    || die "could not enable anonymous access: $(cat /tmp/nexus-api.$$)"
  echo "  anonymous read: on"
fi
log "checking the Community Edition EULA"
code=$(api GET /system/eula)
if [ "$code" = 200 ] && grep -q '"accepted" *: *false' /tmp/nexus-api.$$; then
  disclaimer=$(sed -n 's/.*"disclaimer" *: *"\(.*\)".*/\1/p' /tmp/nexus-api.$$)
  if [ "$ACCEPT_EULA" = 1 ]; then
    [ "$(api POST /system/eula "{\"accepted\":true,\"disclaimer\":\"$disclaimer\"}")" = 204 ] || die "EULA acceptance was refused: $(cat /tmp/nexus-api.$$)"
    echo "  EULA accepted (by the person who ran this with --accept-eula)"
  else
    rm -f /tmp/nexus-api.$$
    die "this Nexus is Community Edition and its EULA is NOT accepted -- every upload will fail with HTTP 403.
An administrator must accept it (web UI onboarding wizard, or re-run this script with --accept-eula).
Sonatype's text: $disclaimer"
  fi
elif [ "$code" = 200 ]; then echo "  EULA already accepted"
else echo "  no EULA endpoint (HTTP $code) -- not a Community Edition release that needs one"; fi
rm -f /tmp/nexus-api.$$
log "done. Docker clients use $DOCKER_REGISTRY (plain HTTP until TLS is configured)."

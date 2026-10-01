#!/usr/bin/env bash
# install-backend-workstation.sh -- set up one RHEL 9 workstation for back-end work from the
# back-end bundle. Created 2026-10-01; rehearsed in a RHEL 9 (UBI 9) container (see packet).
#
#   sudo ./install-backend-workstation.sh system   # once per machine: JDK, Gradle, Eclipse
#                                                   # (+ Lombok agent), Docker CE (+ daemon config),
#                                                   # kubectl, Helm 3 (`helm`) + Helm 4 (`helm4`),
#                                                   # kind, /etc/profile.d
#   ./install-backend-workstation.sh user          # once per developer: Gradle init script that
#                                                   # points every build at Nexus, Testcontainers
#                                                   # image prefix
#
# Files come from this bundle's raw/ (and maven/ for the Lombok jar). Without the bundle, set
# FROM_NEXUS=1 to fetch them from the Nexus raw / maven repositories. git and jq come from the
# RHEL 9 media (dnf install git jq), as do Docker CE's dependencies (container-selinux,
# libseccomp, iptables-nft, nftables) -- dnf pulls those from this machine's RHEL repositories.
# Docker (revised 2026-10-01: the team uses Docker, not Podman). The system step adds the user
# who ran sudo to the `docker` group (DOCKER_ADD_USER=0 to skip). Docker documents that group as
# root-equivalent on the machine -- that is the trade for running Docker without sudo.
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"
load_conf
MODE="${1:?usage: install-backend-workstation.sh system|user}"
# shellcheck disable=SC1091
source "$ISLAND_DIR/backend.versions.env"
PREFIX="${DEVENV_PREFIX:-/opt/devenv}"
RAWURL="$(repo_url "$RAW_REPO")"; MAVENURL="$(repo_url "$MAVEN_REPO")"

getfile() { # <raw|maven> <path> -> local path
  local base="$BUNDLE_DIR/$1" url="$RAWURL"; [ "$1" = maven ] && url="$MAVENURL"
  if [ "${FROM_NEXUS:-0}" != 1 ] && [ -f "$base/$2" ]; then echo "$base/$2"; return; fi
  local t="${TMPDIR:-/tmp}/devenv-dl/$1/$2"; mkdir -p "$(dirname "$t")"
  [ -s "$t" ] || curl -fsSL -o "$t" "$url/$2" || die "cannot fetch $url/$2"
  echo "$t"; }

system_install() {
  [ "$(id -u)" = 0 ] || die "the system step needs root: sudo $0 system"
  need tar gzip unzip curl sha256sum
  mkdir -p "$PREFIX"

  log "Temurin JDK $TEMURIN_VERSION -> $PREFIX/jdk"
  local jt; jt=$(getfile raw "temurin/$TEMURIN_VERSION/$TEMURIN_TARBALL")
  echo "$(awk '{print $1}' "$(getfile raw "temurin/$TEMURIN_VERSION/$TEMURIN_TARBALL.sha256.txt")")  $jt" | sha256sum -c --quiet - || die "JDK checksum mismatch"
  rm -rf "$PREFIX/jdk-$TEMURIN_VERSION"; mkdir -p "$PREFIX/jdk-$TEMURIN_VERSION"
  tar -xzf "$jt" -C "$PREFIX/jdk-$TEMURIN_VERSION" --strip-components=1
  ln -sfn "$PREFIX/jdk-$TEMURIN_VERSION" "$PREFIX/jdk"
  "$PREFIX/jdk/bin/java" -version 2>&1 | sed -n 1p   # sed reads everything: no SIGPIPE under pipefail

  log "Gradle $GRADLE_VERSION -> $PREFIX/gradle"
  local gz; gz=$(getfile raw "gradle/distributions/gradle-$GRADLE_VERSION-bin.zip")
  echo "$(cat "$(getfile raw "gradle/distributions/gradle-$GRADLE_VERSION-bin.zip.sha256")")  $gz" | sha256sum -c --quiet - || die "Gradle checksum mismatch"
  rm -rf "$PREFIX/gradle-$GRADLE_VERSION"; unzip -qo "$gz" -d "$PREFIX"
  ln -sfn "$PREFIX/gradle-$GRADLE_VERSION" "$PREFIX/gradle"

  log "kubectl $KUBECTL_VERSION, helm $HELM_VERSION, helm4 $HELM4_VERSION, kind $KIND_VERSION -> /usr/local/bin"
  install -m 0755 "$(getfile raw "kubectl/$KUBECTL_VERSION/linux/amd64/kubectl")" /usr/local/bin/kubectl
  tar -xzf "$(getfile raw "helm/$HELM_VERSION/helm-$HELM_VERSION-linux-amd64.tar.gz")" -C /usr/local/bin --strip-components=1 linux-amd64/helm
  tar -xzf "$(getfile raw "helm/$HELM4_VERSION/helm-$HELM4_VERSION-linux-amd64.tar.gz")" -O linux-amd64/helm > /usr/local/bin/helm4 && chmod 0755 /usr/local/bin/helm4
  local kb; kb=$(getfile raw "kind/$KIND_VERSION/kind-linux-amd64")
  echo "$(awk '{print $1}' "$(getfile raw "kind/$KIND_VERSION/kind-linux-amd64.sha256sum")")  $kb" | sha256sum -c --quiet - || die "kind checksum mismatch"
  install -m 0755 "$kb" /usr/local/bin/kind
  kubectl version --client 2>/dev/null | sed -n 1p; echo "helm $(helm version --short)  helm4 $(helm4 version --short)  $(kind version)"

  log "Docker CE (RPMs from the bundle; their dependencies from this machine's RHEL 9 repositories)"
  need rpm dnf
  rpm -q podman-docker >/dev/null 2>&1 && die "podman-docker is installed and owns /usr/bin/docker -- remove it first: dnf remove podman-docker"
  local dk; dk=$(getfile raw "docker-ce/rhel9/docker-ce.gpg")
  if command -v gpg >/dev/null; then
    local fp; fp=$(gpg --show-keys --with-colons "$dk" 2>/dev/null | awk -F: '/^fpr/{print $10; exit}')
    [ "$fp" = "$DOCKER_GPG_FINGERPRINT" ] || die "Docker signing key fingerprint is '$fp', expected $DOCKER_GPG_FINGERPRINT"
  else warn "gpg not installed -- the key's fingerprint is not checked (the bundle's SHA256SUMS still covers it)"; fi
  rpm --import "$dk"
  local rpms=() f; for f in $DOCKER_CE_RPM_FILES; do rpms+=("$(getfile raw "docker-ce/rhel9/$f")"); done
  local badsig; badsig=$(rpm -K "${rpms[@]}" 2>&1 | grep -v 'digests signatures OK' || true)
  [ -z "$badsig" ] || die "Docker RPM signature check failed: $badsig"
  echo "  ${#rpms[@]} RPMs: Docker signatures OK"
  dnf install -y --setopt=skip_if_unavailable=True "${rpms[@]}" || die "dnf could not install Docker CE -- record the missing dependencies it names (they come from the RHEL 9 repositories)"
  mkdir -p /etc/docker
  if [ "$DOCKER_REGISTRY_INSECURE" = true ]; then
    if [ -f /etc/docker/daemon.json ] && ! grep -q "$DOCKER_REGISTRY" /etc/docker/daemon.json; then
      warn "/etc/docker/daemon.json exists -- add \"insecure-registries\": [\"$DOCKER_REGISTRY\"] to it by hand (Nexus registry is plain HTTP)"
    elif [ ! -f /etc/docker/daemon.json ]; then
      printf '{\n  "insecure-registries": ["%s"]\n}\n' "$DOCKER_REGISTRY" > /etc/docker/daemon.json
      echo "  /etc/docker/daemon.json: $DOCKER_REGISTRY trusted over plain HTTP"
    fi
  fi
  if [ -d /run/systemd/system ]; then systemctl enable --now docker >/dev/null && systemctl restart docker && echo "  docker service enabled and running"
  else warn "systemd is not running here (a container?) -- start dockerd by hand"; fi
  if [ "${DOCKER_ADD_USER:-1}" = 1 ] && [ -n "${SUDO_USER:-}" ] && [ "$SUDO_USER" != root ]; then
    usermod -aG docker "$SUDO_USER" && echo "  $SUDO_USER added to the docker group (takes effect at next login)"
  fi

  if [ -n "${ECLIPSE_TARBALL:-}" ] && [ "${SKIP_ECLIPSE:-0}" != 1 ]; then   # SKIP_ECLIPSE=1: headless build agents
    log "Eclipse $ECLIPSE_RELEASE -> $PREFIX/eclipse (with the Lombok agent)"
    rm -rf "$PREFIX/eclipse-$ECLIPSE_RELEASE"; mkdir -p "$PREFIX/eclipse-$ECLIPSE_RELEASE"
    tar -xzf "$(getfile raw "eclipse/$ECLIPSE_RELEASE/$ECLIPSE_TARBALL")" -C "$PREFIX/eclipse-$ECLIPSE_RELEASE" --strip-components=1
    ln -sfn "$PREFIX/eclipse-$ECLIPSE_RELEASE" "$PREFIX/eclipse"
    # Lombok-annotated code shows hundreds of false errors in Eclipse without this agent.
    mkdir -p "$PREFIX/lombok"
    cp "$(getfile maven "org/projectlombok/lombok/$LOMBOK_VERSION/lombok-$LOMBOK_VERSION.jar")" "$PREFIX/lombok/lombok.jar"
    grep -q 'lombok.jar' "$PREFIX/eclipse/eclipse.ini" || echo "-javaagent:$PREFIX/lombok/lombok.jar" >> "$PREFIX/eclipse/eclipse.ini"
    mkdir -p /usr/share/applications
    cat > /usr/share/applications/devenv-eclipse.desktop <<DESK
[Desktop Entry]
Type=Application
Name=Eclipse IDE ($ECLIPSE_RELEASE)
Exec=$PREFIX/eclipse/eclipse
Icon=$PREFIX/eclipse/icon.xpm
Categories=Development;IDE;
DESK
  fi

  log "environment -> /etc/profile.d/devenv-backend.sh"
  cat > /etc/profile.d/devenv-backend.sh <<PROFILE
# Written by install-backend-workstation.sh on $(date +%F). Air-gapped back-end tooling.
export JAVA_HOME="$PREFIX/jdk"
export PATH="\$JAVA_HOME/bin:$PREFIX/gradle/bin:\$PATH"
# Testcontainers uses Docker (default socket) with Ryuk, its clean-up container, ON. Every Docker
# Hub image it asks for is rewritten to the Nexus registry by ~/.testcontainers.properties.
# kind clusters: island/kind-cluster.sh create (node image from Nexus).
export DEVENV_KIND_NODE_IMAGE="$DOCKER_REGISTRY/kindest/node:$KIND_NODE_TAG"
PROFILE

  log "system step done. Log out and back in (or: source /etc/profile.d/devenv-backend.sh)."
}

user_install() {
  [ "$(id -u)" != 0 ] || die "run the user step as the developer, not root"
  log "Gradle: every repository -> $MAVENURL"
  mkdir -p "$HOME/.gradle/init.d"
  sed "s#__NEXUS_MAVEN_URL__#$MAVENURL/#" "$ISLAND_DIR/templates/devenv-nexus.init.gradle.kts" > "$HOME/.gradle/init.d/devenv-nexus.init.gradle.kts"
  log "Testcontainers: Docker Hub images -> $DOCKER_REGISTRY"
  if [ -f "$HOME/.testcontainers.properties" ] && ! grep -q hub.image.name.prefix "$HOME/.testcontainers.properties"; then
    sed "s#__DOCKER_REGISTRY__#$DOCKER_REGISTRY#" "$ISLAND_DIR/templates/testcontainers.properties" | grep -v '^#' >> "$HOME/.testcontainers.properties"
  elif [ ! -f "$HOME/.testcontainers.properties" ]; then
    sed "s#__DOCKER_REGISTRY__#$DOCKER_REGISTRY#" "$ISLAND_DIR/templates/testcontainers.properties" > "$HOME/.testcontainers.properties"
  fi
  if ! docker info >/dev/null 2>&1; then
    warn "docker is not usable by $USER yet -- log out and back in (docker group), or check: systemctl status docker"
  else echo "  docker $(docker version --format '{{.Server.Version}}') reachable"; fi
  log "user step done. New projects: point gradle/wrapper/gradle-wrapper.properties distributionUrl at"
  echo "  $RAWURL/gradle/distributions/gradle-$GRADLE_VERSION-bin.zip   (or run the installed 'gradle')"
}

case "$MODE" in system) system_install ;; user) user_install ;; *) die "mode must be system or user" ;; esac

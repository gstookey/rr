#!/usr/bin/env bash
# install-backend-workstation.sh -- set up one RHEL 9 workstation for back-end work from the
# back-end bundle. Created 2026-10-01; rehearsed in a RHEL 9 (UBI 9) container (see packet).
#
#   sudo ./install-backend-workstation.sh system   # once per machine: JDK, Gradle, Eclipse
#                                                   # (+ Lombok agent), Helm, kubectl,
#                                                   # /etc/profile.d, podman registry config
#   ./install-backend-workstation.sh user          # once per developer: Gradle init script that
#                                                   # points every build at Nexus, Testcontainers
#                                                   # image prefix
#
# Files come from this bundle's raw/ (and maven/ for the Lombok jar). Without the bundle, set
# FROM_NEXUS=1 to fetch them from the Nexus raw / maven repositories. Podman, git and jq come
# from the RHEL 9 media (dnf install podman podman-docker git jq).
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
  "$PREFIX/jdk/bin/java" -version 2>&1 | head -1

  log "Gradle $GRADLE_VERSION -> $PREFIX/gradle"
  local gz; gz=$(getfile raw "gradle/distributions/gradle-$GRADLE_VERSION-bin.zip")
  echo "$(cat "$(getfile raw "gradle/distributions/gradle-$GRADLE_VERSION-bin.zip.sha256")")  $gz" | sha256sum -c --quiet - || die "Gradle checksum mismatch"
  rm -rf "$PREFIX/gradle-$GRADLE_VERSION"; unzip -qo "$gz" -d "$PREFIX"
  ln -sfn "$PREFIX/gradle-$GRADLE_VERSION" "$PREFIX/gradle"

  log "Helm $HELM_VERSION and kubectl $KUBECTL_VERSION -> /usr/local/bin"
  tar -xzf "$(getfile raw "helm/$HELM_VERSION/helm-$HELM_VERSION-linux-amd64.tar.gz")" -C /usr/local/bin --strip-components=1 linux-amd64/helm
  install -m 0755 "$(getfile raw "kubectl/$KUBECTL_VERSION/linux/amd64/kubectl")" /usr/local/bin/kubectl
  helm version --short; kubectl version --client 2>/dev/null | head -1

  if [ -n "${ECLIPSE_TARBALL:-}" ]; then
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
# Testcontainers on rootless Podman (RHEL ships Podman, not Docker). Ryuk (the reaper container)
# needs a privileged socket that rootless Podman does not give it, so it is disabled: containers
# a crashed test leaves behind must be removed by hand (podman ps -a). Remove these two lines
# if the machine runs Docker instead.
if [ -n "\${XDG_RUNTIME_DIR:-}" ] && [ -S "\$XDG_RUNTIME_DIR/podman/podman.sock" ]; then
  export DOCKER_HOST="unix://\$XDG_RUNTIME_DIR/podman/podman.sock"
  export TESTCONTAINERS_RYUK_DISABLED=true
fi
PROFILE

  if [ "$DOCKER_REGISTRY_INSECURE" = true ] && [ -d /etc/containers ]; then
    log "podman: trust the Nexus registry over plain HTTP"
    mkdir -p /etc/containers/registries.conf.d
    printf '[[registry]]\nlocation = "%s"\ninsecure = true\n' "$DOCKER_REGISTRY" > /etc/containers/registries.conf.d/50-devenv-nexus.conf
  fi
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
  if command -v podman >/dev/null && command -v systemctl >/dev/null; then
    systemctl --user enable --now podman.socket >/dev/null 2>&1 && echo "  podman socket enabled for $USER" \
      || warn "could not enable the podman user socket; Testcontainers needs it (systemctl --user enable --now podman.socket)"
  fi
  log "user step done. New projects: point gradle/wrapper/gradle-wrapper.properties distributionUrl at"
  echo "  $RAWURL/gradle/distributions/gradle-$GRADLE_VERSION-bin.zip   (or run the installed 'gradle')"
}

case "$MODE" in system) system_install ;; user) user_install ;; *) die "mode must be system or user" ;; esac

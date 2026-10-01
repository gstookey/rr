#!/usr/bin/env bash
# kind-cluster.sh -- local Kubernetes clusters (kind) that never touch the internet.
# Created 2026-10-01 (Graham: the team uses kind for local deployment/testing).
#
#   ./kind-cluster.sh create [name]   # node image from the Nexus registry; every node's containerd
#                                     # told it may pull from that registry (plain HTTP if so configured)
#   ./kind-cluster.sh delete [name]
#
# Workloads then reference images by their Nexus name, e.g. image: nexus:8082/postgres:18.6
# (most Helm charts take this as image.registry / global.imageRegistry). Short Docker Hub names
# ("postgres:18.6") are NOT rewritten inside the cluster: Nexus stores library images without the
# "library/" segment, so a docker.io mirror would not resolve them. Name the registry explicitly.
#
# Needs: docker (running, usable by this user), kind, kubectl -- install-backend-workstation.sh.
set -euo pipefail
source "$(dirname "$0")/lib/common.sh"
load_conf
# shellcheck disable=SC1091
source "$ISLAND_DIR/backend.versions.env"
ACTION="${1:?usage: kind-cluster.sh create|delete [name]}"; NAME="${2:-devenv}"
need docker kind kubectl
NODE_IMAGE="$DOCKER_REGISTRY/kindest/node:$KIND_NODE_TAG"

case "$ACTION" in
  create)
    docker info >/dev/null 2>&1 || die "docker is not reachable by $USER (running? in the docker group?)"
    log "kind $KIND_VERSION cluster '$NAME' from $NODE_IMAGE"
    docker image inspect "$NODE_IMAGE" >/dev/null 2>&1 || docker pull "$NODE_IMAGE" \
      || die "cannot pull $NODE_IMAGE -- is it loaded into Nexus (load-nexus.sh, back-end bundle) and is $DOCKER_REGISTRY in /etc/docker/daemon.json insecure-registries?"
    # containerd reads per-registry config from /etc/containerd/certs.d (written below).
    kind create cluster --name "$NAME" --image "$NODE_IMAGE" --wait 120s --config - <<'CFG'
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4
containerdConfigPatches:
- |-
  [plugins."io.containerd.grpc.v1.cri".registry]
    config_path = "/etc/containerd/certs.d"
CFG
    scheme=https; [ "$DOCKER_REGISTRY_INSECURE" = true ] && scheme=http
    for node in $(kind get nodes --name "$NAME"); do
      docker exec "$node" mkdir -p "/etc/containerd/certs.d/$DOCKER_REGISTRY"
      printf 'server = "%s://%s"\n\n[host."%s://%s"]\n  capabilities = ["pull", "resolve"]\n' \
        "$scheme" "$DOCKER_REGISTRY" "$scheme" "$DOCKER_REGISTRY" \
        | docker exec -i "$node" cp /dev/stdin "/etc/containerd/certs.d/$DOCKER_REGISTRY/hosts.toml"
    done
    kubectl --context "kind-$NAME" get nodes -o wide
    echo "cluster '$NAME' ready: kubectl --context kind-$NAME ...   (images: $DOCKER_REGISTRY/<name>:<tag>)" ;;
  delete) kind delete cluster --name "$NAME" ;;
  *) die "create or delete" ;;
esac

#!/usr/bin/env bash

set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root or with sudo."
  echo "Example: sudo bash script.sh"
  exit 1
fi

if [[ ! -f /etc/os-release ]]; then
  echo "Cannot detect operating system."
  exit 1
fi

. /etc/os-release

if [[ "${ID:-}" != "ubuntu" ]]; then
  echo "This script is intended for Ubuntu servers."
  echo "Detected OS: ${PRETTY_NAME:-unknown}"
  exit 1
fi

DOCKER_USER="${SUDO_USER:-${1:-ubuntu}}"
DOCKER_KEYRING="/etc/apt/keyrings/docker.asc"
DOCKER_LIST="/etc/apt/sources.list.d/docker.list"

echo "Updating Ubuntu packages..."
apt-get update -y
apt-get upgrade -y

echo "Installing prerequisite packages..."
apt-get install -y \
  ca-certificates \
  curl \
  gnupg

echo "Setting up Docker apt repository..."
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o "${DOCKER_KEYRING}"
chmod a+r "${DOCKER_KEYRING}"

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=${DOCKER_KEYRING}] https://download.docker.com/linux/ubuntu \
  ${VERSION_CODENAME} stable" > "${DOCKER_LIST}"

echo "Installing Docker Engine and Docker Compose plugin..."
apt-get update -y
apt-get install -y \
  docker-ce \
  docker-ce-cli \
  containerd.io \
  docker-buildx-plugin \
  docker-compose-plugin

echo "Enabling and starting Docker..."
systemctl enable docker
systemctl start docker

if id "${DOCKER_USER}" >/dev/null 2>&1; then
  echo "Adding user '${DOCKER_USER}' to the docker group..."
  usermod -aG docker "${DOCKER_USER}"
else
  echo "User '${DOCKER_USER}' not found. Skipping docker group assignment."
fi

echo
echo "Docker installation completed."
echo "Verify with:"
echo "  docker --version"
echo "  docker compose version"
echo
echo "If you were added to the docker group, log out and log back in before running Docker without sudo."

#!/usr/bin/env bash
# One-time setup for a fresh Ubuntu 22.04/24.04 DigitalOcean droplet.
# Usage: bash server-setup.sh
set -euo pipefail

echo "=== 1. System packages ==="
apt-get update -y
apt-get install -y curl git ufw

echo "=== 2. Docker ==="
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker

echo "=== 3. Firewall ==="
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "=== 4. App directory ==="
mkdir -p /opt/apps/kuja-seven

echo ""
echo "Done. Next steps:"
echo "  1. git clone <your-repo-url> /opt/apps/kuja-seven"
echo "  2. cd /opt/apps/kuja-seven/deploy/traefik && docker compose up -d"
echo "  3. Create .env and apps/api/.env.production (see .env.example files)"
echo "  4. docker compose up --build -d"

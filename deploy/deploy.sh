#!/usr/bin/env bash
# Deploy kuja-seven to the droplet.
#
# Usage:
#   ./deploy/deploy.sh user@your-droplet-ip /opt/apps/kuja-seven
#
# First run:
#   1. SSH in and clone the repo to REMOTE_PATH manually
#   2. Create .env from .env.example at REMOTE_PATH/.env
#   3. Create apps/api/.env.production at REMOTE_PATH/apps/api/.env.production
#   4. Run this script

set -euo pipefail

SERVER="${1:?First arg: user@host}"
REMOTE_PATH="${2:?Second arg: remote path, e.g. /opt/apps/kuja-seven}"

echo "▶ Syncing code → $SERVER:$REMOTE_PATH"
rsync -az --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='apps/*/node_modules' \
  --exclude='apps/web/.next' \
  --exclude='apps/web/out' \
  --exclude='apps/api/dist' \
  --exclude='.env' \
  --exclude='apps/api/.env.production' \
  ./ "$SERVER:$REMOTE_PATH/"

echo "▶ Building and restarting containers on server"
ssh "$SERVER" bash << ENDSSH
  set -e
  cd "$REMOTE_PATH"
  docker compose up --build -d --remove-orphans
  docker compose ps
ENDSSH

echo "✓ Deployed"

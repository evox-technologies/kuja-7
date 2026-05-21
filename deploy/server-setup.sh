#!/usr/bin/env bash
# Run once on a fresh Ubuntu 22.04/24.04 DigitalOcean droplet.
# Usage: bash server-setup.sh
set -euo pipefail

echo "=== 1. System packages ==="
apt-get update -y
apt-get install -y curl git nginx certbot python3-certbot-nginx ufw

echo "=== 2. Node.js 20 (via NodeSource) ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "=== 3. pnpm ==="
npm install -g pnpm

echo "=== 4. PM2 (process manager for Node apps) ==="
npm install -g pm2
pm2 startup systemd -u root --hp /root   # auto-start on reboot

echo "=== 5. Firewall ==="
ufw allow OpenSSH
ufw allow 'Nginx Full'   # ports 80 + 443
ufw --force enable

echo "=== 6. Nginx default site ==="
rm -f /etc/nginx/sites-enabled/default

echo ""
echo "Done. Next steps per app:"
echo "  1. Copy deploy/nginx/<app>.conf  →  /etc/nginx/sites-available/<app>.conf"
echo "  2. ln -s /etc/nginx/sites-available/<app>.conf /etc/nginx/sites-enabled/"
echo "  3. nginx -t && systemctl reload nginx"
echo "  4. certbot --nginx -d <subdomain.yourdomain.com>"
echo "  5. Run deploy-api.sh / deploy-web.sh"

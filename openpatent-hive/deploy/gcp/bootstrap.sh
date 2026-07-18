#!/usr/bin/env bash
# Bootstrap a freshly-provisioned Debian 12 VM into the openpatent.ai hive.
# Run as root after first SSH: `sudo -i && ./deploy/gcp/bootstrap.sh`
#
# This installs:
#   - Docker CE + Compose v2
#   - nginx (TLS termination, reverse proxy)
#   - certbot (Let's Encrypt)
#   - ufw (firewall)
#   - fail2ban
#   - All 7 openpatent.ai services via docker-compose
#
# Idempotent. Safe to re-run.

set -euo pipefail

HIVE_REPO="${HIVE_REPO:-https://github.com/CSOAI-ORG/openpatent-hive.git}"
HIVE_DIR="/opt/openpatent-hive"
LOG="/var/log/openpatent-bootstrap.log"

log() { echo "[$(date -Is)] $*" | tee -a "$LOG"; }

[ "$(id -u)" -ne 0 ] && { echo "must run as root"; exit 1; }

log "━━━ openpatent.ai hive bootstrap ━━━"
log "hive repo: $HIVE_REPO"

# 1. System update
log "→ apt update + upgrade"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq >>"$LOG" 2>&1
apt-get -y -qq upgrade >>"$LOG" 2>&1

# 2. Install Docker
if ! command -v docker >/dev/null 2>&1; then
  log "→ installing Docker CE"
  apt-get install -y -qq ca-certificates curl gnupg lsb-release >>"$LOG" 2>&1
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    > /etc/apt/sources.list.d/docker.list
  apt-get update -qq >>"$LOG" 2>&1
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin >>"$LOG" 2>&1
fi
log "  docker: $(docker --version)"

# 3. Install nginx + certbot
log "→ installing nginx + certbot"
apt-get install -y -qq nginx certbot python3-certbot-nginx >>"$LOG" 2>&1
log "  nginx: $(nginx -v 2>&1)"
log "  certbot: $(certbot --version 2>&1)"

# 4. UFW firewall
log "→ configuring ufw"
apt-get install -y -qq ufw >>"$LOG" 2>&1
ufw --force reset >>"$LOG" 2>&1
ufw default deny incoming >>"$LOG" 2>&1
ufw default allow outgoing >>"$LOG" 2>&1
ufw allow ssh >>"$LOG" 2>&1
ufw allow http >>"$LOG" 2>&1
ufw allow https >>"$LOG" 2>&1
ufw --force enable >>"$LOG" 2>&1

# 5. fail2ban
log "→ installing fail2ban"
apt-get install -y -qq fail2ban >>"$LOG" 2>&1
systemctl enable fail2ban >>"$LOG" 2>&1
systemctl restart fail2ban >>"$LOG" 2>&1

# 6. Clone the hive
log "→ cloning hive repo"
if [ ! -d "$HIVE_DIR" ]; then
  git clone "$HIVE_REPO" "$HIVE_DIR" >>"$LOG" 2>&1
else
  cd "$HIVE_DIR" && git pull >>"$LOG" 2>&1
fi
cd "$HIVE_DIR"

# 7. Build + bring up the hive
log "→ building images"
./scripts/build-all.sh >>"$LOG" 2>&1
log "→ bringing up the hive"
./scripts/bring-up.sh >>"$LOG" 2>&1

# 8. Configure nginx reverse proxy
log "→ configuring nginx reverse proxy"
cat > /etc/nginx/sites-available/openpatent <<'NGINX'
# OpenPatent.ai hive — nginx reverse proxy
# Routes public hostnames to internal hive services.

# Rate limiting zone
limit_req_zone $binary_remote_addr zone=openpatent:10m rate=10r/s;

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name openpatent.ai draft.openpatent.ai verify.openpatent.ai mcp.openpatent.ai api.openpatent.ai;
    return 301 https://$host$request_uri;
}

# Landing site (openpatent.ai + draft.openpatent.ai)
server {
    listen 443 ssl http2;
    server_name openpatent.ai draft.openpatent.ai;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        limit_req zone=openpatent burst=20 nodelay;
    }
}

# Drafting + draft.openpatent.ai (proxies to landing-site + drafting-fork via gateway)
server {
    listen 443 ssl http2;
    server_name draft.openpatent.ai;
    location / {
        proxy_pass http://127.0.0.1:3211;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        limit_req zone=openpatent burst=20 nodelay;
    }
}

# API gateway
server {
    listen 443 ssl http2;
    server_name api.openpatent.ai;
    location / {
        proxy_pass http://127.0.0.1:3211;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50m;  # Allow document uploads
        limit_req zone=openpatent burst=50 nodelay;
    }
}

# Verify page
server {
    listen 443 ssl http2;
    server_name verify.openpatent.ai;
    location / {
        proxy_pass http://127.0.0.1:3213;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        limit_req zone=openpatent burst=30 nodelay;
    }
}

# MCP manifest
server {
    listen 443 ssl http2;
    server_name mcp.openpatent.ai;
    location / {
        proxy_pass http://127.0.0.1:3214;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        limit_req zone=openpatent burst=30 nodelay;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/openpatent /etc/nginx/sites-enabled/openpatent
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# 9. Obtain TLS certs (only if a real domain is set up)
if [ -n "${OPENPATENT_DOMAIN:-}" ]; then
  log "→ obtaining TLS certs for $OPENPATENT_DOMAIN + subdomains"
  certbot --nginx \
    -d "$OPENPATENT_DOMAIN" \
    -d "draft.$OPENPATENT_DOMAIN" \
    -d "verify.$OPENPATENT_DOMAIN" \
    -d "mcp.$OPENPATENT_DOMAIN" \
    -d "api.$OPENPATENT_DOMAIN" \
    --non-interactive --agree-tos -m "founder@csoai.org" \
    || log "  WARN: certbot failed — configure DNS first, then re-run"
fi

log ""
log "✓ openpatent.ai hive bootstrap complete"
log ""
log "Public endpoints (after DNS + certs):"
log "  https://openpatent.ai          → landing"
log "  https://api.openpatent.ai      → API"
log "  https://verify.openpatent.ai   → verify"
log "  https://mcp.openpatent.ai      → MCP manifest"
log ""
log "Run smoke tests: cd $HIVE_DIR && ./scripts/smoke-test.sh"

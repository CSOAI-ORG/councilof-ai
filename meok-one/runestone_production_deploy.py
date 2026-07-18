"""
RUNESTONE PRODUCTION DEPLOYMENT
================================

gunicorn + nginx + supervisor configuration for the King Runestone portal.

Single-file, copy-paste deployment:
  - WSGI server (gunicorn)
  - Reverse proxy (nginx)
  - Process supervision (supervisor or systemd)
  - SSL via Let's Encrypt
  - Health check
"""

# gunicorn config
GUNICORN_CONFIG = """
# /etc/gunicorn/king-runestone.py
import multiprocessing

# Server socket
bind = "127.0.0.1:7777"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "gevent"  # or "sync" / "gthread"
worker_connections = 1000
timeout = 60
keepalive = 5

# Worker lifecycle
max_requests = 1000
max_requests_jitter = 100
graceful_timeout = 30

# Process name
proc_name = "king-runestone"

# Logging
accesslog = "/var/log/king-runestone/access.log"
errorlog = "/var/log/king-runestone/error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(L)s'

# Preload (better memory, no forking issues with VM)
preload_app = True

# Server mechanics
daemon = True
pidfile = "/var/run/king-runestone.pid"
user = "www-data"
group = "www-data"
"""

# nginx config
NGINX_CONFIG = """
# /etc/nginx/sites-available/king-runestone
upstream king_runestone {
    server 127.0.0.1:7777 fail_timeout=0;
}

server {
    listen 80;
    server_name portal.csoai.org csoai.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name portal.csoai.org csoai.org;

    # SSL via Let's Encrypt
    ssl_certificate     /etc/letsencrypt/live/portal.csoai.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/portal.csoai.org/privkey.pem;
    ssl_protocols       TLSv1.2 TLSv1.3;
    ssl_ciphers         HIGH:!aNULL:!MD5;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # Logging
    access_log /var/log/nginx/king-runestone.access.log;
    error_log /var/log/nginx/king-runestone.error.log;

    # Body size
    client_max_body_size 10M;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Proxy
    location / {
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_pass http://king_runestone;
        proxy_buffering off;
    }

    # Static (dashboard)
    location /portal/dashboard {
        proxy_pass http://king_runestone;
        proxy_buffering off;
    }

    # Health check (don't proxy to backend)
    location /portal/health {
        proxy_pass http://king_runestone/portal/health;
        access_log off;
    }
}
"""

# supervisor config
SUPERVISOR_CONFIG = """
; /etc/supervisor/conf.d/king-runestone.conf
[program:king-runestone]
command=/usr/local/bin/gunicorn -c /etc/gunicorn/king-runestone.py runestone_flask_portal_v6:app
directory=/Users/nicholas/clawd/meok-one
user=www-data
autostart=true
autorestart=true
startretries=3
stopasgroup=true
killasgroup=true
stdout_logfile=/var/log/king-runestone/stdout.log
stderr_logfile=/var/log/king-runestone/stderr.log
stdout_logfile_maxbytes=10MB
stderr_logfile_maxbytes=10MB
environment=PYTHONPATH="/Users/nicholas/clawd/meok-one"
"""

# systemd unit
SYSTEMD_UNIT = """
# /etc/systemd/system/king-runestone.service
[Unit]
Description=King Runestone Portal (Sovereign OWEM Substrate)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/Users/nicholas/clawd/meok-one
Environment=PYTHONPATH=/Users/nicholas/clawd/meok-one
ExecStart=/usr/local/bin/gunicorn -c /etc/gunicorn/king-runestone.py runestone_flask_portal_v6:app
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
"""

# Let's Encrypt
LETSENCRYPT = """
# Issue cert
sudo certbot certonly --nginx -d portal.csoai.org -d csoai.org
sudo certbot certonly --standalone -d sovereign.csoai.org

# Auto-renew
sudo systemctl enable certbot.timer
"""


def main():
    print("=" * 70)
    print("  🐉 KING RUNESTONE — PRODUCTION DEPLOYMENT GUIDE")
    print("=" * 70)
    print()
    print("=== 1. GUNICORN (WSGI server) ===")
    print(GUNICORN_CONFIG)
    print("=== 2. NGINX (reverse proxy + SSL) ===")
    print(NGINX_CONFIG)
    print("=== 3. SUPERVISOR (process supervision) ===")
    print(SUPERVISOR_CONFIG)
    print("=== 4. SYSTEMD (alternative) ===")
    print(SYSTEMD_UNIT)
    print("=== 5. LET'S ENCRYPT (SSL) ===")
    print(LETSENCRYPT)
    print()
    print("DEPLOYMENT COMMANDS:")
    print("  sudo apt install -y gunicorn nginx certbot python3-certbot-nginx")
    print("  sudo cp gunicorn/king-runestone.py /etc/gunicorn/")
    print("  sudo cp nginx/king-runestone /etc/nginx/sites-available/")
    print("  sudo ln -s /etc/nginx/sites-available/king-runestone /etc/nginx/sites-enabled/")
    print("  sudo certbot --nginx -d portal.csoai.org")
    print("  sudo systemctl enable --now gunicorn")
    print("  sudo systemctl reload nginx")
    print()
    print("  # Verify deployment")
    print("  curl https://portal.csoai.org/portal/health")
    print()
    print("  # Expected response:")
    print('  {"auth":true,"modes":["1-brain","4-brain","4x4x3"],"portal":"king-runestone-v6",')
    print('   "rate_limit":"30/min","status":"ok","ts":"...","verifier":"L6_keystone"}')


if __name__ == "__main__":
    main()

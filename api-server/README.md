# CSOAI Governance API

Production backend for the CSOAI app — flips Evidence Hub, Webhooks, the bias harness,
and the Sovereign Town export from demo‑mode to live. Designed to run on the CSOAI GCP VM.

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Liveness check |
| GET | `/api/oauth/github/start` | Begin GitHub OAuth |
| GET | `/api/oauth/github/callback` | OAuth callback → returns a `cid` to the app |
| GET | `/api/evidence/github?owner=&repo=` | **Real** evidence: branch protection + signed‑commit verification (header `X-CSOAI-Connection: <cid>`) |
| GET/POST/DELETE | `/api/webhooks` | Manage endpoints |
| POST | `/api/webhooks/emit` | Fire an event to matching hooks — **HMAC‑SHA256 signed** (`X-CSOAI-Signature`), retried with backoff |
| POST | `/api/fairness/run` | **Real** group‑fairness metrics from `{rows:[{group,yTrue,yPred}]}` |
| GET | `/api/sovereign-town/export` | Export the signed Sovereign Town feed (closes `SOV_EXPORT_BASE`) |

No secrets in code — all via env (`.env.example`). Includes helmet, CORS allowlist, rate limiting, HMAC signing, OAuth state checks.

## Deploy to the GCP VM (Ubuntu/Debian)
```bash
# 1. SSH in, install Node 20 + nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo useradd -r -s /usr/sbin/nologin csoai || true

# 2. Put the code at /opt/csoai-api
sudo mkdir -p /opt/csoai-api && sudo chown $USER /opt/csoai-api
#   copy this folder's files there (git clone or scp), then:
cd /opt/csoai-api && npm install --omit=dev

# 3. Configure secrets
cp .env.example .env && nano .env        # fill GITHUB_CLIENT_ID/SECRET, WEBHOOK_SIGNING_SECRET=$(openssl rand -hex 32)
sudo chown -R csoai:csoai /opt/csoai-api

# 4. Run as a service
sudo cp csoai-api.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now csoai-api
curl localhost:8080/api/health        # {"ok":true,...}

# 5. Reverse proxy + TLS (point api.csoai.org A-record at the VM first)
sudo cp nginx-api.conf /etc/nginx/sites-available/api.csoai.org
sudo ln -s /etc/nginx/sites-available/api.csoai.org /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.csoai.org   # free HTTPS
```
Docker alternative: `docker build -t csoai-api . && docker run --env-file .env -p 8080:8080 csoai-api`

## GitHub OAuth App
Create at github.com/settings/developers → Authorization callback URL = `https://api.csoai.org/api/oauth/github/callback`. Put the client id/secret in `.env`.

## Wire the front-end (one switch)
In the `csoai-v2-app` (Vercel) env: add `VITE_API_BASE=https://api.csoai.org`. Then in
Evidence Hub / Webhooks, when `import.meta.env.VITE_API_BASE` is set, call the API instead of
the demo data (the "Connect" button → `${VITE_API_BASE}/api/oauth/github/start`). The pages are
already structured so this is a small, isolated change — they stay in demo‑mode until the env var exists.

## Storage note
Tokens + webhook registrations are in‑memory in this scaffold (zero‑dependency). For production
persistence swap the two `Map`s in `server.js` for Firestore/Postgres/the VM's local KV (marked `TODO`).

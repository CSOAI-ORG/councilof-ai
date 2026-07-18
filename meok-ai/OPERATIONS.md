# meok-ai — Operations Manual

> **The complete operations manual for the meok-ai deployment.**
> CSOAI Ltd · UK 16939677 · 2 Jul 2026 · MIT License
> Maintained by the M4 lane · `M4@sovereign.local`

---

## Table of contents

1. [Overview & architecture](#1-overview--architecture)
2. [Installation](#2-installation)
3. [Running locally (uvicorn)](#3-running-locally-uvicorn)
4. [Running in Docker](#4-running-in-docker)
5. [Endpoints (the API surface)](#5-endpoints-the-api-surface)
6. [Environment variables](#6-environment-variables)
7. [Security & secret rotation](#7-security--secret-rotation)
8. [Backup & recovery](#8-backup--recovery)
9. [Scaling: minimal → full 9-container stack](#9-scaling-minimal--full-9-container-stack)
10. [Monitoring](#10-monitoring)
11. [Migration guide](#11-migration-guide)
12. [Troubleshooting](#12-troubleshooting)
13. [License & references](#13-license--references)

---

## 1. Overview & architecture

**meok-ai** is the sovereign-AI deployment layer of the CSOAI stack. It ships the **trust-score engine**, the **Hatch** (agent instantiation), the **22 legacy bridges** (COBOL · SAP · HL7 · SWIFT · SCADA · ISO 20022 · FIX · ACORD · GS1 · MQTT · ISO 8583 · NACHA · SIP · Tax · MISMO · DLMS · AS/400 · Oracle · CICS · EDI · Solvency II · Tax+GDPR), and the **SIGIL** signed-receipt chain.

There are **two deployment modes**:

| Mode | Path | What it is |
|---|---|---|
| **Minimal** | `meok-ai-minimal-deploy/meok_minimal.py` | A single FastAPI file. Trust scores + Hatch + SIGIL. SQLite. No Postgres. No Ollama. Runs anywhere Python 3.11+ runs. Production-grade for the trust layer; ideal for the sovereign-launch wedge. |
| **Full 9-container stack** | `meok/` (the MEOK Sovereign Stack) | FastAPI + PostgreSQL 15 + pgvector + Ollama + MCP gateway + sovereign-api + temple-api + marketing + redis. ~9 containers. This is the autonomous, self-improving substrate. |

Both modes are MIT-licensed and produced by the same canonical repo (`github.com/CSOAI-ORG/clawd`).

### Architecture diagram (text)

```
                ┌────────────────────────────────────────────────────────┐
                │                CSOAI / MEOK Stack                       │
                └────────────────────────────────────────────────────────┘
                                  ▲            ▲            ▲
              ┌───────────────────┘            │            └────────────────────┐
              │                                │                                 │
       ┌──────┴──────┐                ┌────────┴────────┐                ┌──────┴──────┐
       │  Minimal    │                │  Full Stack     │                │  Cloud (GCP) │
       │  (1 file)   │                │  (9 containers) │                │  (GKE,       │
       │             │                │                 │                │   multi-AZ)  │
       └──────┬──────┘                └────────┬────────┘                └──────┬──────┘
              │                                │                                 │
              ▼                                ▼                                 ▼
        SQLite trust.db              PostgreSQL 15 + pgvector                Cloud SQL + GCS
        Trust + Hatch +              FastAPI + Ollama + MCP gateway          Sigstore + KMS
        SIGIL (HMAC-SHA256)          Council + BFT + OLM                    Multi-region
```

### What you get out-of-the-box

- **Trust scores** with 6 tiers (`unverified` → `bronze` → `silver` → `gold` → `platinum` → `diamond`), each with an Ed25519/HMAC receipt.
- **Hatch** — instantiates a sovereign agent with the canonical `meok.hatch.v1` JSON-LD spec.
- **SIGIL** — every state change emits a signed, hash-chained receipt.
- **Care Floor** — 6-dimension Maternal Covenant (safety · honesty · privacy · fairness · growth · consent); Article 9 special-categories → 1.00.
- **BFT council** — 9-of-13 queen quorum, HotStuff-2 model.
- **22 legacy bridges** — speak COBOL · SAP · HL7 · SWIFT · SCADA · FIX · ACORD · GS1 · MQTT · ISO 8583 · NACHA · SIP · Tax · MISMO · DLMS · AS/400 · Oracle · CICS · EDI · Solvency II · ISO 20022 · Tax+GDPR.

---

## 2. Installation

### Prerequisites

| Tool | Version | Why |
|---|---|---|
| Python | **3.11.x** | The substrate is pinned to 3.11 (`/opt/homebrew/bin/python3.11` on macOS). Python 3.12 may work; 3.13+ not yet tested. |
| git | 2.40+ | To clone the repo |
| Docker | 24+ (only for Docker deployment) | For the full stack |
| PostgreSQL | 15+ (only for full stack) | With pgvector extension |
| Ollama | latest (only for full stack + LLM routing) | Local LLM runtime |
| Disk | 2 GB (minimal) / 50 GB (full) | Models live on disk for full |
| RAM | 1 GB (minimal) / 16 GB (full) | The full stack wants 16+ GB |

### Clone the repository

```bash
git clone https://github.com/CSOAI-ORG/clawd.git
cd clawd
```

The `meok-ai/` directory at the repo root is the canonical home of this manual. The actual runtime code lives in two places:

```bash
# Minimal deployment (1-file, recommended starting point)
meok-ai-minimal-deploy/meok_minimal.py

# Full 9-container stack
meok/
  ├── Dockerfile                # base image (postgres-client only)
  ├── Dockerfile.amd64          # amd64 + openssh + tmux (Vast.ai)
  ├── Dockerfile.patch          # patches base image (TCP + entrypoint)
  ├── Dockerfile.patch.amd64    # amd64 patch
  ├── Dockerfile.standalone     # self-contained image with PG15 + pgvector
  ├── Dockerfile.update         # updates a previous image
  ├── docker-compose.prod.yml   # full production stack
  ├── deploy/
  │   ├── entrypoint.sh         # starts PG → Ollama → MEOK
  │   ├── pg_setup.sh           # PG init for Vast.ai
  │   └── hetzner/              # Hetzner-specific deploy scripts
  ├── requirements.txt          # full deps
  ├── requirements-lite.txt     # minimal deps (no torch, etc.)
  └── db/init.sql               # schema bootstrap
```

### Verify the clone

```bash
ls meok-ai-minimal-deploy/meok_minimal.py      # should exist
ls meok/Dockerfile.standalone                  # should exist
ls meok/requirements.txt                       # should exist
```

### Pick your Python

On macOS (Apple Silicon), use the homebrew Python 3.11 explicitly:

```bash
which python3.11
# /opt/homebrew/bin/python3.11
/opt/homebrew/bin/python3.11 --version
# Python 3.11.15
```

If you don't have it: `brew install python@3.11`.

### Create a virtual environment (minimal mode)

```bash
python3.11 -m venv .venv-meok
source .venv-meok/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn[standard] pydantic
```

That's it. Minimal mode is a single file with `fastapi` + `uvicorn` + `pydantic`. The receipt chain uses Python stdlib (`hashlib` + `hmac`).

### Create a virtual environment (full mode)

```bash
python3.11 -m venv .venv-meok-full
source .venv-meok-full/bin/activate
pip install --upgrade pip
pip install -r meok/requirements.txt
# Full deps include torch, scikit-learn, river, asyncpg, sqlalchemy, alembic,
# PyJWT, bcrypt, apscheduler, feedparser, httpx, pytz, etc. ~ 1.2 GB of wheels.
```

---

## 3. Running locally (uvicorn)

### Minimal mode — the recommended starting point

```bash
cd meok-ai-minimal-deploy

# Option A — one-shot smoke test (init DB, print sample scores + hatch)
python3 meok_minimal.py

# Option B — production: start uvicorn
python3 -m uvicorn meok_minimal:app \
  --host 0.0.0.0 \
  --port 9000 \
  --log-level info \
  --workers 1
```

The `--workers 1` is intentional: SQLite doesn't benefit from multiple workers. For multi-worker, switch to PostgreSQL (see §9).

You should see:

```
[meok-ai-minimal v2] DB initialized at /data/meok/meok-minimal.db
INFO:     Uvicorn running on http://0.0.0.0:9000 (Press CTRL+C to quit)
```

### Smoke test the endpoints

```bash
# 1. health
curl -s http://localhost:9000/health | jq .
# {"ok": true, "service": "meok-ai-minimal", "version": "0.2.0", "ts": "..."}

# 2. set a trust score
curl -s "http://localhost:9000/trust/score/csoai-001?score=0.97" | jq .
# {"entity":"csoai-001","score":0.97,"tier":"diamond","arkforge_tier":"diamond",
#  "receipt":"<sha256>.<hmac-sig>","issued_at":"..."}

# 3. read the trust score back
curl -s http://localhost:9000/trust/score/csoai-001 | jq .

# 4. create a Hatch (a sovereign agent)
curl -s -X POST "http://localhost:9000/api/hatch?name=Aria" | jq .

# 5. read the Hatch spec
curl -s http://localhost:9000/api/hatch/Aria | jq .

# 6. root — endpoint catalog
curl -s http://localhost:9000/ | jq .
```

### Full mode — `python3 -m uvicorn` from `meok/`

The full meok package exposes its server as `meok.mcp.server` (the canonical MCP entrypoint). Run it with:

```bash
cd meok
python3 -m meok.mcp.server
# OR explicitly via uvicorn:
python3 -m uvicorn meok.mcp.server:app \
  --host 0.0.0.0 \
  --port 3100 \
  --log-level info \
  --workers 2
```

The full server expects PostgreSQL to be reachable. If you don't have it running, see the **degraded mode** note below — the substrate will still come up (some endpoints will return 503) so the sovereign orchestration can plan around the gap.

### Degraded mode (full stack without Postgres)

```bash
# Set MEOK_DEGRADED=1 to start without PG (logs the missing dependency)
MEOK_DEGRADED=1 python3 -m meok.mcp.server
```

The substrate stays alive; the MCP server continues to serve endpoints that don't depend on PG (trust scores, hatches, SIGIL).

---

## 4. Running in Docker

The `meok/` directory ships **5 Dockerfiles** to cover every deployment topology:

| Dockerfile | Purpose | When to use |
|---|---|---|
| `Dockerfile` | Base image (Python 3.11-slim + postgres-client) | Local dev against an external PG |
| `Dockerfile.amd64` | amd64 + openssh + tmux (Vast.ai) | Vast.ai / cloud GPU rentals |
| `Dockerfile.patch` | Patches a previous `csoai/meok-sovereign:v5-councils` image | Hot-fix an existing deploy |
| `Dockerfile.patch.amd64` | amd64 patch | Hot-fix a Vast.ai deploy |
| `Dockerfile.standalone` | **Self-contained** (Python 3.11 + PostgreSQL 15 + pgvector + Ollama hooks) | **Recommended for production single-node** |

> ⚠ **Note on `Dockerfile.lightweight`**: this is referenced in the repo from earlier planning but the canonical lightweight build is now `Dockerfile.standalone` (it bundles PG15 + pgvector, so it doesn't need an external DB cluster). If you have a legacy `Dockerfile.lightweight`, treat it as deprecated — rebuild against `Dockerfile.standalone` instead.

### Build the standalone image (recommended)

```bash
cd meok

docker build \
  -f Dockerfile.standalone \
  -t csoai/meok-sovereign:latest \
  .
# ~ 1.2 GB image. Takes 4-8 min depending on network.
```

### Run the standalone image

```bash
docker run -d \
  --name meok-sovereign \
  -p 3100:3100 \
  -v meok-data:/data/meok \
  -v meok-logs:/logs \
  -e MEOK_DEGRADED=0 \
  -e MEOK_PG_HOST=127.0.0.1 \
  -e MEOK_PG_PORT=5432 \
  -e MEOK_PG_USER=meok \
  -e MEOK_PG_PASSWORD=change-me-in-production \
  -e MEOK_TRUST_SECRET="$(openssl rand -hex 32)" \
  -e MEOK_AI_URL="http://35.242.143.249:9000" \
  csoai/meok-sovereign:latest

# verify
docker logs -f meok-sovereign
curl -s http://localhost:3100/health | jq .
```

The standalone image boots PostgreSQL 15 + pgvector, waits for it to be ready, runs `db/init.sql`, then starts the MEOK MCP server.

### Build & run the amd64 image (Vast.ai, Hetzner, AWS Graviton-safe)

```bash
docker build \
  -f Dockerfile.amd64 \
  -t csoai/meok-sovereign:amd64-latest \
  .

# Vast.ai deployment (also see meok/deploy/hetzner/ and meok/deploy/pg_setup.sh)
docker run -d \
  --name meok-sovereign-amd64 \
  -p 3100:3100 \
  -p 22:22 \
  -v meok-data:/app/data \
  -e SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)" \
  csoai/meok-sovereign:amd64-latest
```

### Build the patch image (hot-fix an existing deploy)

```bash
# from inside meok/, with a meok-sovereign:v5-councils image already pulled:
docker build \
  -f Dockerfile.patch.amd64 \
  -t csoai/meok-sovereign:v5-councils-patched .

# Then `docker run` against the patched tag, OR push and redeploy.
```

### Docker Compose (full 9-container stack)

```bash
cd meok
docker compose -f docker-compose.prod.yml up -d --build
```

This brings up the full stack: marketing · sovereign-api · temple-api · mcp-gateway · db · redis · workers.

### Sanity-check the Docker deploy

```bash
# 1. health
curl -s http://localhost:3100/health | jq .

# 2. SIGIL chain length (should grow as requests are made)
curl -s http://localhost:3100/api/sigil/count | jq .

# 3. trust score
curl -s "http://localhost:3100/trust/score/csoai-001?score=0.97" | jq .

# 4. Hatch
curl -s -X POST "http://localhost:3100/api/hatch?name=Aria" | jq .
```

---

## 5. Endpoints (the API surface)

The minimal `meok_minimal.py` exposes the canonical wedge. The full `meok/` server exposes everything below plus the sovereign substrate.

### Minimal server endpoints (port 9000 by convention)

| Method | Path | Purpose | Auth |
|---|---|---|---|
| `GET` | `/` | Service banner + endpoint catalog | none |
| `GET` | `/health` | Liveness probe (used by Docker HEALTHCHECK + load balancers) | none |
| `GET` | `/trust/score/{entity}` | **Read** the trust score for an entity. If none exists, creates one at 0.05 (`unverified` tier). | bearer (in full mode) |
| `GET` | `/trust/score/{entity}?score=0.97` | **Set** the trust score for an entity. Issues a new SIGIL receipt. | bearer |
| `POST` | `/api/hatch?name=Aria` | **Create** a Hatch (sovereign agent). Returns the canonical `meok.hatch.v1` JSON-LD spec. | bearer |
| `GET` | `/api/hatch/{name}` | **Read** the Hatch spec for `name`. | bearer |

### Full server endpoints (port 3100 by convention)

The full `meok/mcp/server.py` exposes everything above plus:

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/health` | Health probe |
| `POST` | `/mcp` | MCP JSON-RPC entrypoint (the canonical MCP handshake — POST, never GET) |
| `GET` | `/api/sigil/count` | Current SIGIL chain length |
| `GET` | `/api/sigil/transcript?n=10` | Last `n` SIGIL lines (gloss + digest + signature) |
| `GET` | `/api/sigil/verify` | Re-compute every hash and check every signature |
| `GET` | `/api/council/status` | BFT council status (13 queens, last vote, quorum) |
| `GET` | `/api/council/vote/{proposal_id}` | Get votes on a proposal |
| `POST` | `/api/council/vote` | Cast a vote (queen agent only) |
| `GET` | `/api/bridge/list` | List the 22 legacy bridges |
| `POST` | `/api/bridge/{bridge_name}/call` | Issue a signed `legacy_call` through the named bridge |
| `POST` | `/api/legacy/call` | Generic legacy_call dispatcher |
| `GET` | `/api/olm/status` | OLM (Organic Learning Model) status |
| `GET` | `/api/sovereign/profile` | The M4 sovereign-governance PROFILE for this node |
| `POST` | `/api/sovereign/sign` | Sign a payload under the M4 PROFILE |
| `GET` | `/api/care/floor` | The 6-dimension Care Floor snapshot |
| `GET` | `/api/journey/audit` | Full audit trail for the current session |
| `GET` | `/docs` | OpenAPI / Swagger UI |
| `GET` | `/redoc` | ReDoc |

### WebSocket endpoints

| Path | Purpose |
|---|---|
| `/ws/sigil` | Live SIGIL stream (every emission, every receipt) |
| `/ws/council` | Live BFT council events (votes, proposals, quorum changes) |
| `/ws/bridge/{name}` | Live events from a specific legacy bridge (e.g. `/ws/bridge/cobol-bridge-mcp`) |

### Response shapes (canonical examples)

```json
// GET /trust/score/csoai-001?score=0.97
{
  "entity": "csoai-001",
  "score": 0.97,
  "tier": "diamond",
  "arkforge_tier": "diamond",
  "receipt": "<sha256-hex>.<hmac-sha256-hex>",
  "issued_at": "2026-07-02T05:14:22.418129+00:00",
  "history_count": 1
}

// POST /api/hatch?name=Aria
{
  "spec": "meok.hatch.v1",
  "agent": {
    "name": "Aria",
    "archetype": "default",
    "version": "1.0.0",
    "provider": "CSOAI / MEOK (UK Co. 16939677)"
  },
  "trust_score": {
    "source": "meok-ai/arkforge-minimal-v2",
    "tier": "diamond",
    "score": 1.0,
    "entity": "Aria",
    "note": "live ArkForge trust score (Ed25519 receipt chain)"
  },
  "created_at": "2026-07-02T05:14:22.418129+00:00",
  "meok_ai_url": "http://35.242.143.249:9000",
  "note": "meok-ai-minimal v2 — proper FastAPI lifespan + DB init. The full 9-container meok-ai deployment is the next step."
}
```

---

## 6. Environment variables

### Required (production)

| Var | Default | Purpose |
|---|---|---|
| `MEOK_TRUST_SECRET` | `meok-ai-minimal-dev-secret-rotate-me` | The HMAC-SHA256 secret used to sign every trust receipt. **MUST rotate in production** (see §7). 32+ random bytes. |
| `MEOK_DB` | `/data/meok/meok-minimal.db` | Path to the SQLite database file. For multi-worker, switch to Postgres (`MEOK_PG_*`). |
| `MEOK_AI_URL` | `http://35.242.143.249:9000` | The URL this node advertises as its sovereign identity. Used in the Hatch JSON-LD spec. Set to your public URL in production. |

### Required (full stack — Postgres mode)

| Var | Default | Purpose |
|---|---|---|
| `MEOK_PG_HOST` | `127.0.0.1` | Postgres host |
| `MEOK_PG_PORT` | `5432` | Postgres port |
| `MEOK_PG_USER` | `meok` | Postgres user |
| `MEOK_PG_PASSWORD` | — | Postgres password (**required, no default**) |
| `MEOK_PG_DATABASE` | `meok` | Database name |
| `MEOK_PG_VECTOR` | `1` | Set `0` to disable pgvector (only if you're sure you don't want embedding search) |

### Optional (production)

| Var | Default | Purpose |
|---|---|---|
| `MEOK_DEGRADED` | `0` | Set `1` to start without Postgres (degraded mode; logs the missing dependency) |
| `MEOK_LOG_LEVEL` | `info` | `debug` / `info` / `warn` / `error` |
| `MEOK_SIGIL_RETENTION_DAYS` | `365` | How long to keep SIGIL receipts before archival |
| `MEOK_BFT_QUORUM` | `9` | BFT quorum (out of 13 queens) — default 9-of-13 (f &lt; n/3) |
| `MEOK_CARE_FLOOR_DEFAULT` | `0.95` | Default Care Floor threshold (Article 9 special-categories → 1.00) |
| `MEOK_BRIDGE_LIST` | auto-discover | Override the 22-bridge list (rarely needed) |
| `MEOK_RATE_LIMIT_PER_MIN` | `600` | Per-entity request rate limit |
| `MEOK_BIND_HOST` | `0.0.0.0` | Host to bind uvicorn |
| `MEOK_BIND_PORT` | `9000` (minimal) / `3100` (full) | Port to bind uvicorn |

### LLM provider keys (only if you enable external LLM routing — full stack)

| Var | Purpose |
|---|---|
| `OPENAI_API_KEY` | OpenAI routing (for non-sovereign fallback only) |
| `ANTHROPIC_API_KEY` | Anthropic routing (for non-sovereign fallback only) |
| `GOOGLE_API_KEY` | Google routing |
| `MISTRAL_API_KEY` | Mistral routing |
| `OLLAMA_HOST` | Local Ollama (the sovereign default — leave unset to use local Ollama) |

> ⚠ In a sovereign deployment, prefer **local Ollama** + the SOV3 router. External LLM keys route traffic through third parties and break the sovereignty guarantee. Use them only for the explicit `non_sovereign: true` flag in the call payload.

### Putting it in `.env` (minimal mode example)

```bash
# .env.meok-minimal — production, single node
MEOK_TRUST_SECRET="$(openssl rand -hex 32)"
MEOK_DB="/var/lib/meok/meok.db"
MEOK_AI_URL="https://meok-ai.example.com"
MEOK_LOG_LEVEL="info"
MEOK_BFT_QUORUM="9"
MEOK_CARE_FLOOR_DEFAULT="0.95"
MEOK_BIND_HOST="127.0.0.1"
MEOK_BIND_PORT="9000"
```

Load with:

```bash
set -a; source .env.meok-minimal; set +a
python3 -m uvicorn meok_minimal:app --host $MEOK_BIND_HOST --port $MEOK_BIND_PORT
```

---

## 7. Security & secret rotation

### Threat model (in scope)

- **Receipt forgery** — attacker forges a trust score receipt. Mitigated by HMAC-SHA256 / Ed25519 signatures; the secret is required to sign.
- **Trust tier tampering** — attacker bumps an entity from `silver` to `diamond`. Mitigated by append-only SIGIL chain + hash-chained receipt ledger.
- **Replay attack** — attacker replays a high-score receipt. Mitigated by `nonce` + monotonic `issued_at`; the receipt hash binds to both.
- **Secret extraction** — attacker dumps process memory. Mitigated by `MEOK_TRUST_SECRET` never being logged; rotate on suspicion (§7.4).
- **Foreign jurisdiction** — a US CLOUD Act subpoena could compel disclosure of EU/UK data from a US-headquartered cloud. **Mitigated by sovereign substrate** — CSOAI Ltd is UK Companies House 16939677; data never leaves UK/EU/AU sovereign regions unless explicit Article 49 derogation is invoked.

### What you must do

1. **Rotate `MEOK_TRUST_SECRET` on day 0 of any production deployment.** Never use the default `meok-ai-minimal-dev-secret-rotate-me`.
2. **Rotate every 90 days** thereafter (or after any suspected exposure).
3. **Rotate `MEOK_PG_PASSWORD`** on the same schedule.
4. **Restrict the management port** (`MEOK_BIND_PORT=9000` or `3100`) to internal network only. Never expose directly to the public internet without a TLS-terminating reverse proxy (Caddy, nginx, Traefik).
5. **Enable CORS** explicitly (`CORS_ORIGINS=https://app.example.com`) — never `*` in production.
6. **Back up the SIGIL chain** (see §8) — the receipts are the audit trail.
7. **Run the BFT council** with at least 9 of 13 queens on independent infrastructure (different hosts / regions). Single-node BFT is not Byzantine-fault-tolerant.
8. **Run the substrate offline-verifiable.** The 7-field sovereign-governance PROFILE rides on Ed25519 — anyone with the public key can verify offline. Don't gate this behind your own auth.

### 7.1 Generate a strong secret

```bash
# 32 bytes = 256 bits, hex-encoded
openssl rand -hex 32
# e.g. 9c3a1f... (64 hex chars)

# Or base64 (slightly shorter)
openssl rand -base64 32
```

### 7.2 Rotate the secret (graceful)

The minimal server reads `MEOK_TRUST_SECRET` at startup. For graceful rotation, use a multi-secret setup:

```bash
# .env.production
MEOK_TRUST_SECRET_CURRENT="<new secret>"
MEOK_TRUST_SECRET_PREVIOUS="<old secret, accept-only>"
```

The server signs with `CURRENT` and verifies with both `CURRENT` and `PREVIOUS`. After the rotation window (default 7 days), remove `PREVIOUS`.

> **Status:** the minimal server currently uses single-secret mode. For graceful rotation, upgrade to `meok/` (the full server) which supports the multi-secret pattern via `MEOK_TRUST_SECRETS` (comma-separated).

### 7.3 Emergency rotation

```bash
# 1. Generate a new secret
NEW=$(openssl rand -hex 32)

# 2. Update the secret in your secrets manager (1Password CLI, AWS Secrets Manager, GCP Secret Manager, Vault)
# ... (your secrets manager of choice)

# 3. Restart the service
systemctl restart meok-sovereign  # or: docker restart meok-sovereign

# 4. Verify it's running with the new secret
curl -s http://localhost:3100/health | jq .

# 5. Audit: re-verify the SIGIL chain (will fail for receipts signed with the old secret — this is expected)
curl -s http://localhost:3100/api/sigil/verify | jq .
```

### 7.4 Hardening checklist (production)

- [ ] `MEOK_TRUST_SECRET` rotated, > 32 bytes random
- [ ] `MEOK_PG_PASSWORD` rotated, > 24 bytes random
- [ ] HTTPS terminated at a reverse proxy (Caddy is recommended — auto-TLS via Let's Encrypt)
- [ ] CORS restricted to known origins
- [ ] Rate limiting enabled (`MEOK_RATE_LIMIT_PER_MIN=600`)
- [ ] SIGIL chain backed up off-host (see §8)
- [ ] Health check endpoint monitored (UptimeRobot, Pingdom, or SOV3 itself)
- [ ] Logs shipped to a SIEM (Loki + Grafana, Datadog, GCP Cloud Logging)
- [ ] Daily backup of `meok.db` and SIGIL ledger (cron)
- [ ] Quarterly secret rotation (calendar reminder)
- [ ] Annual penetration test (or before any major customer onboarding)
- [ ] BFT council runs across ≥ 3 independent hosts (Byzantine-quorum requirement)

---

## 8. Backup & recovery

### What to back up

| Asset | Where | How often | How to restore |
|---|---|---|---|
| SQLite trust DB | `MEOK_DB` file (default `/data/meok/meok-minimal.db`) | Hourly | Copy file back, restart server |
| Postgres trust DB | `MEOK_PG_*` database | Hourly | `pg_dump` → `pg_restore` |
| SIGIL chain | `meok/sigil_chain.jsonl` (append-only) | Continuous (every emission) | Replay file into new server |
| Hatch records | inside trust DB | Hourly (with the DB) | n/a |
| BFT council state | inside trust DB | Hourly (with the DB) | n/a |
| Care Floor snapshots | inside trust DB | Daily | n/a |

### Minimal-mode backup (SQLite)

```bash
# 1. Snapshot the DB (SQLite supports online backup via the .backup command)
sqlite3 /data/meok/meok-minimal.db ".backup '/backups/meok-$(date +%Y%m%d-%H%M%S).db'"

# 2. (Optional) Compress
gzip /backups/meok-*.db

# 3. Ship off-host
rsync -avz /backups/meok-*.db.gz backup@backup-host:/srv/meok/backups/

# Restore (same host, after a disaster):
gunzip /backups/meok-20260702-050000.db.gz
cp /backups/meok-20260702-050000.db /data/meok/meok-minimal.db
systemctl restart meok-sovereign   # or: docker restart meok-sovereign
```

### Cron-driven backup (recommended)

```bash
# /etc/cron.d/meok-backup
0 * * * * meok /usr/local/bin/meok-backup.sh
```

`/usr/local/bin/meok-backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/backups/meok"
TS=$(date +%Y%m%d-%H%M%S)
DB="${MEOK_DB:-/data/meok/meok-minimal.db}"

mkdir -p "$BACKUP_DIR"
sqlite3 "$DB" ".backup '$BACKUP_DIR/meok-$TS.db'"
gzip "$BACKUP_DIR/meok-$TS.db"

# Keep 30 days
find "$BACKUP_DIR" -name "meok-*.db.gz" -mtime +30 -delete

# Ship off-host
rsync -avz --delete "$BACKUP_DIR/" backup@backup-host:/srv/meok/backups/ || \
  logger -t meok-backup "WARN: rsync to backup-host failed"
```

### Full-mode backup (PostgreSQL)

```bash
# Logical backup
pg_dump -h $MEOK_PG_HOST -U $MEOK_PG_USER -d $MEOK_PG_DATABASE \
  -Fc -f /backups/meok-pg-$TS.dump

# Restore
pg_restore -h $MEOK_PG_HOST -U $MEOK_PG_USER -d $MEOK_PG_DATABASE \
  --clean --if-exists /backups/meok-pg-$TS.dump
```

### Recovery scenarios

| Scenario | RPO | RTO | Procedure |
|---|---|---|---|
| Single-node crash (no data loss) | 0 | < 5 min | Restart service / restart container |
| Accidental trust record corruption | 1 hour | < 15 min | Restore from latest hourly backup |
| Full node loss | 1 hour | < 1 hour | Provision new node, restore DB from backup, restart |
| Region loss (full stack) | 1 hour | < 4 hours | Failover to secondary region (Cloud SQL HA / Aurora) |
| Ransomware / catastrophic | 24 hours | < 24 hours | Restore from off-host backup, rotate all secrets, re-issue PROFILE |

### What you cannot recover

- **Receipts signed with a rotated-and-discarded secret** — they will fail verification forever. Keep at least 7 days of dual-secret acceptance after rotation.
- **Pre-existing receipt forgery** — if an attacker had `MEOK_TRUST_SECRET`, they could have issued forged receipts before detection. Treat the entire pre-detection chain as suspect and re-issue PROFILE.
- **Council votes from before a quorum reconfiguration** — old votes may not meet the new quorum. Re-run the proposal under the new council.

---

## 9. Scaling: minimal → full 9-container stack

### When to move from minimal → full

Move from the minimal server to the full 9-container stack when **any one** of the following becomes true:

| Trigger | Threshold | Why it matters |
|---|---|---|
| **Daily request volume** | > 10,000 / day | SQLite becomes the bottleneck |
| **Concurrent writers** | > 5 | SQLite serialises writers |
| **Multi-host deployment** | You need HA | Minimal is single-node |
| **LLM routing required** | You need council decisions | Minimal has no LLM router |
| **BFT council with real queens** | You need > 1 host | Byzantine fault tolerance needs independence |
| **Embeddings / vector search** | You need pgvector | Minimal has no vector store |
| **Production customer data** | First paying customer | Regulatory requirements (GDPR Art.32) |
| **MCP federation** | You need > 10 MCPs | Minimal doesn't federate |

Until any of those triggers fire, **stay on the minimal server**. It is MIT-licensed, production-grade for the trust layer, and dramatically easier to operate.

### The 9 containers (full stack)

When you `docker compose -f meok/docker-compose.prod.yml up -d --build`, you get:

```
1. marketing          — Next.js static export served by nginx        :3000
2. sovereign-api      — FastAPI backend (auth, waitlist, characters) :8001
3. temple-api         — SOV3 Sovereign Temple (council, bridges)    :8888
4. mcp-gateway        — MCP Monetization Gateway (billing, subs)    :8000
5. db                 — PostgreSQL 15 + pgvector                     :5432
6. redis              — Cache + session store                        :6379
7. worker-council     — Background BFT council worker                -
8. worker-ingest      — Background OLM ingest worker                 -
9. worker-sigil       — Background SIGIL anchor + Bitcoin worker     -
```

(That's 9 services. Workers 7-9 are background.)

### Migration steps (minimal → full)

1. **Provision Postgres** (Cloud SQL, RDS, Aurora, or self-hosted).
2. **Export trust data** from SQLite to Postgres:
   ```bash
   sqlite3 meok.db ".dump trust_scores trust_receipts hatches" | \
     psql -h $MEOK_PG_HOST -U $MEOK_PG_USER -d $MEOK_PG_DATABASE
   ```
3. **Set `MEOK_DEGRADED=0`** in your `.env` (or remove the var).
4. **Build the full image**: `docker build -f meok/Dockerfile.standalone -t csoai/meok-sovereign:latest meok/`
5. **Deploy with docker compose**: `docker compose -f meok/docker-compose.prod.yml up -d --build`
6. **Re-verify the chain**: `curl -s http://localhost:3100/api/sigil/verify`
7. **Switch load balancer** to the full stack
8. **Decommission minimal** (keep the SQLite backup for 30 days as a fallback)

### Rollback path

If the full stack misbehaves, you can roll back to minimal in < 5 minutes:

1. Stop the docker compose stack: `docker compose -f meok/docker-compose.prod.yml down`
2. Restore the minimal server: `python3 -m uvicorn meok_minimal:app --port 9000`
3. Update the load balancer back to port 9000
4. The minimal server has its own copy of the data (you exported to PG, but the SQLite file is still on disk)

### Horizontal scaling (full stack only)

```bash
# Scale council workers to 3 (for BFT quorum)
docker compose -f meok/docker-compose.prod.yml up -d --scale worker-council=3

# Scale sovereign-api to 5 (for traffic)
docker compose -f meok/docker-compose.prod.yml up -d --scale sovereign-api=5
```

Behind a load balancer, you can scale each stateless service independently. The stateful services (db, redis, sigil ledger) need clustering (PostgreSQL HA, Redis Sentinel, etc.).

---

## 10. Monitoring

### Health endpoints

| Endpoint | Purpose | Use |
|---|---|---|
| `GET /health` | Liveness (returns 200 if process is up) | Load balancer, UptimeRobot |
| `GET /health/ready` | Readiness (returns 200 only when DB + dependencies are reachable) | Kubernetes readinessProbe |
| `GET /health/deep` | Deep health (DB + SIGIL chain + BFT council + Ollama) | Operator dashboards |

### Prometheus metrics (full stack)

The full server exposes `/metrics` in Prometheus format:

```bash
curl -s http://localhost:3100/metrics | grep meok_
# meok_trust_scores_total{tier="diamond"} 42
# meok_sigil_chain_length 18742
# meok_council_votes_total{queen="safety"} 144
# meok_bridge_calls_total{bridge="cobol-bridge-mcp",status="200"} 891
# meok_care_floor{dimension="safety"} 0.97
# meok_request_duration_seconds_bucket{le="0.1",path="/trust/score"} 8212
```

Recommended scrape config:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: meok
    scrape_interval: 30s
    static_configs:
      - targets: ['meok-sovereign:3100']
```

### Logs

The minimal server logs to stdout (FastAPI default). The full server writes structured JSON logs to `/logs/meok.log` and stdout.

Recommended log shipping: Vector → Loki → Grafana. Example Vector config:

```toml
[sources.meok]
type = "file"
include = ["/logs/meok.log"]

[transforms.parse]
type = "remap"
inputs = ["meok"]
source = '''
.parsed = parse_json!(.message)
'''

[sinks.loki]
type = "loki"
inputs = ["parse"]
endpoint = "https://loki.example.com"
labels = {service = "meok-ai"}
```

### Alerts (recommended)

| Alert | Condition | Severity |
|---|---|---|
| `MeokDown` | `/health` returns non-200 for > 2 min | critical |
| `SigilChainBroken` | `/api/sigil/verify` reports broken hash chain | critical |
| `BFTQuorumLost` | Active queens drop < 9 | critical |
| `CareFloorViolation` | Any care dimension drops below 0.95 | warning |
| `BridgeErrorRate` | Any bridge error rate > 5% over 5 min | warning |
| `SecretRotationDue` | `MEOK_TRUST_SECRET` age > 90 days | warning |
| `DiskPressure` | `/data` > 85% full | warning |
| `LatencyP99` | p99 > 500 ms over 5 min | info |

### SOV3-native monitoring (recommended for production)

The substrate itself can monitor itself. Enable:

```bash
# Add to .env
SOV3_MONITORING_ENABLED=1
SOV3_HORUS_REALTIME=1   # HORUS realtime monitor (sub-second sampling)
SOV3_INTUITION_BURST=100  # ingest 100 SIGILs/hour into the intuition engine
```

Then call:

```bash
# SOV3 status
curl -s http://localhost:3100/api/sov3/status | jq .

# HORUS realtime (last 60s of substrate activity)
curl -s http://localhost:3100/api/sov3/horus/realtime | jq .

# Intuition engine (emergent patterns from SIGIL stream)
curl -s http://localhost:3100/api/sov3/intuition | jq .
```

---

## 11. Migration guide

### v0.1.0 (pre-FastAPI) → v0.2.0 (FastAPI lifespan)

If you're upgrading from the pre-FastAPI minimal server:

```bash
# 1. Stop the old server
systemctl stop meok-old  # or: pkill -f meok_minimal

# 2. Back up the DB (always!)
sqlite3 /data/meok/meok-minimal.db ".backup '/backups/pre-v0.2.0.db'"

# 3. Deploy the new code (same file, new wrapper)
git pull origin main
pip install fastapi uvicorn[standard]

# 4. Start the new server
python3 -m uvicorn meok_minimal:app --host 0.0.0.0 --port 9000
```

The DB schema is identical. The API surface is identical. No data migration needed.

### v0.2.0 (HMAC-SHA256) → v0.3.0 (Ed25519) [planned]

When v0.3.0 ships with Ed25519 signatures:

```bash
# 1. Back up DB + extract all existing receipts
sqlite3 meok.db "SELECT receipt FROM trust_receipts" > receipts-v0.2.0.txt

# 2. Deploy v0.3.0 with MEOK_SIGNATURE_ALGO=ed25519
MEOK_SIGNATURE_ALGO=ed25519 python3 -m uvicorn meok_minimal:app --port 9000

# 3. New receipts use Ed25519; old receipts (HMAC) remain verifiable
#    via MEOK_TRUST_SECRET_LEGACY=<old-hmac-secret>
```

### SQLite → Postgres

```bash
# 1. Install pgloader
apt-get install pgloader  # or: brew install pgloader

# 2. Migrate
pgloader /data/meok/meok-minimal.db \
  postgresql://meok:$MEOK_PG_PASSWORD@$MEOK_PG_HOST/$MEOK_PG_DATABASE

# 3. Update .env to use PG (remove MEOK_DB, add MEOK_PG_*)
# 4. Restart the server
```

### Self-hosted → GCP / AWS / Azure

The full `meok/` stack is cloud-agnostic. To migrate:

```bash
# 1. Provision managed Postgres (Cloud SQL, RDS, Aurora)
# 2. Provision managed Redis (Memorystore, ElastiCache)
# 3. Provision a GKE/EKS/AKS cluster (or use Cloud Run / Fargate for the API)
# 4. Push the image: docker push csoai/meok-sovereign:latest
# 5. Apply the helm chart: helm install meok ./meok/helm/
# 6. Update DNS
```

For GCP specifically, `meok_gcp_bootstrap.sh` automates steps 1-5.

### Single-node → Multi-region

```bash
# 1. Provision a Postgres HA cluster (Patroni, Cloud SQL HA, Aurora)
# 2. Provision read replicas in 2+ regions
# 3. Deploy the full stack in each region
# 4. Set up cross-region SIGIL replication (one-way: primary → secondaries)
# 5. Configure DNS-based geo-routing
```

The substrate handles region failover automatically via the `SOV_DORADO` multi-region layer (when configured).

---

## 12. Troubleshooting

### "Connection refused" on /health

**Symptom:** `curl http://localhost:9000/health` returns "Connection refused".

**Causes:**
1. Service not started. Check: `docker ps` or `systemctl status meok-sovereign`.
2. Wrong port. Check `MEOK_BIND_PORT` and the `docker run -p` mapping.
3. Wrong host binding. `MEOK_BIND_HOST=127.0.0.1` only accepts local connections; set `0.0.0.0` for remote.
4. Firewall. Check `ufw status`, `iptables -L`, or cloud security group.

### "Database is locked" (SQLite)

**Symptom:** `sqlite3.OperationalError: database is locked` in logs.

**Cause:** SQLite serialises writers. With multiple workers or concurrent heavy writes, you get lock contention.

**Fix:** Switch to Postgres (see §9). For immediate relief: lower concurrency (`--workers 1`), enable WAL mode (`PRAGMA journal_mode=WAL;`).

### "HMAC verification failed"

**Symptom:** `curl /api/sigil/verify` reports signature mismatch.

**Cause:** Most likely, `MEOK_TRUST_SECRET` was rotated but a client is still using the old secret (or vice versa).

**Fix:** Configure multi-secret acceptance (`MEOK_TRUST_SECRETS=current,previous`) for the rotation window.

### "BFT quorum not reached"

**Symptom:** Council proposals fail with "9 of 13 votes not cast".

**Cause:** At least 5 queens are offline / not voting.

**Fix:** Check queen health (`/api/council/status`). Restart down queens. If a queen is permanently lost, you need a council reconfiguration (BFT re-provisioning), which requires human override.

### "Care Floor violation"

**Symptom:** `care_floor dropped below 0.95 for dimension=honesty`.

**Cause:** A model returned hallucinated content, or a bridge returned data without proper consent.

**Fix:** **HARD-STOP all dependent workflows.** Inspect the offending call in the SIGIL chain. Quarantine the bridge. Re-issue the PROFILE.

### "Docker build fails on Dockerfile.standalone"

**Symptom:** `E: Unable to locate package postgresql-15-pgvector` during build.

**Cause:** The PGDG repo isn't being added correctly.

**Fix:** Check network egress (the build needs to reach `apt.postgresql.org`). On a corporate network, you may need to add a proxy.

### "SIGIL chain integrity check fails after restore"

**Symptom:** `/api/sigil/verify` reports broken chain after restoring from backup.

**Cause:** The backup was taken during a write (rare with SQLite `.backup`, more common with naive `cp`).

**Fix:** Use `sqlite3 ... ".backup ..."` (online backup) instead of `cp`. For Postgres, use `pg_dump` (consistent snapshot) instead of filesystem copy.

### Logs are too verbose

**Fix:** Set `MEOK_LOG_LEVEL=warn` for production. The full server also accepts per-module log levels via `MEOK_LOG_LEVEL_OVERRIDES="meok.api.hatch=debug,meok.api.council=info"`.

---

## 13. License & references

### License

This operations manual and all `meok-ai` code is released under the **MIT License**:

```
MIT License

Copyright (c) 2026 CSOAI Ltd (UK Companies House 16939677)
Founder: Nicholas Templeman
Email: nicholas@csoai.org

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the above copyright notice and this
permission notice appearing in all copies or substantial portions of the
Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

MIT = commercial use ✓, modification ✓, distribution ✓, private use ✓, no warranty.

### References

- **Repo:** https://github.com/CSOAI-ORG/clawd
- **Organisation:** CSOAI Ltd · UK Companies House 16939677
- **Founder:** Nicholas Templeman · nicholas@csoai.org
- **Public charter universe:** https://csoai.org/charter2/
- **Bridge inspector (22 legacy bridges):** https://csoai.org/legacy-demo.html
- **Crown lineage audit:** https://csoai.org/charter2/crown-lineage-audit.html
- **M4 sovereign-governance PROFILE:** https://github.com/CSOAI-ORG/clawd/blob/main/meokos-governance-profile.md
- **MEOK legacy demo (live clickable):** https://github.com/CSOAI-ORG/clawd/blob/main/csoai-os/legacy-demo.html
- **Proof of AI:** https://proofof.ai
- **Verifier (public):** https://os.meok.ai/api/verify
- **Council BFT spec:** see `meok/consensus/` and `meok/council/`
- **Substrate architecture:** see `sovereign-substrate/` and `sovereign-temple/`
- **Defence AI (UK sovereign):** see `defoneos/` (DEFONEOS SPRINT)

### Standards cited

- **EU AI Act** — Regulation (EU) 2024/1689, Articles 9, 12, 14, 50
- **GDPR** — Regulation (EU) 2016/679, Articles 5, 6, 9, 22, 32
- **DORA** — Regulation (EU) 2022/2554 (Digital Operational Resilience Act)
- **NIST AI RMF** — AI Risk Management Framework 1.0, January 2023
- **ISO/IEC 42001** — AI Management System, December 2023
- **ISO/IEC 27001** — Information Security Management
- **SOC 2 Type II** — Trust Services Criteria
- **Cyber Essentials** — UK NCSC scheme
- **JSP 936** — UK Ministry of Defence AI policy
- **W3C DID** — Decentralized Identifiers, v1.0
- **Ed25519** — RFC 8032
- **NIST PQC** — FIPS 203 (ML-KEM) + FIPS 204 (ML-DSA) — quantum-safe migration ready

### Support

- **Issues:** https://github.com/CSOAI-ORG/clawd/issues
- **Email:** nicholas@csoai.org
- **BFT council ticket:** open a `council:` labelled issue for governance questions

---

*Last updated: 2 July 2026 · M4 lane · CSOAI Ltd UK 16939677 · MIT License · "The substrate never sleeps."*
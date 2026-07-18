# 🐉 HORUS DEPLOYMENT SPEC — v1.0 — 2026-06-21

**Owner:** SOV3 Sovereign Substrate
**Purpose:** Production deployment of the HORUS Oversight Plane on GCP VM

## 1. ARCHITECTURE

```
+-------------------------------------------+
|         HORUS OVERSIGHT PLANE             |
+-------------------------------------------+
|                                           |
|  +-----------+    +------------------+    |
|  |  AGENTS   |    |   COMPLIANCE     |    |
|  |  (47)     |--->|   WATCHDOG       |    |
|  +-----------+    |  - 13 frameworks |    |
|       |          |  - BFT council   |    |
|       v          |  - Sigil attest  |    |
|  +-----------+    +--------+---------+    |
|  |  PHEROMONE|<--------|                |
|  |  MATRIX   |         |                |
|  +-----+-----+         |                |
|        |               |                |
|        v               v                |
|  +-------------------------------+       |
|  |   SOV3 SIGIL CHAIN           |       |
|  |   (immutable audit trail)    |       |
|  +-------------------------------+       |
|                                           |
+-------------------------------------------+
```

## 2. COMPONENTS

### 2.1 Data Collectors
| Source | Method | Frequency |
|---|---|---|
| 47 agent activity logs | Tailscale wire-tap | continuous |
| BFT council decisions | MCP `sigil_emit` | per-vote |
| Compliance checks (13 frameworks) | OSCAL pipeline | hourly |
| Pheromone matrix | Redis pub/sub | 100ms |
| External intel (CISA KEV, NVD, etc.) | REST poll | 6h |

### 2.2 Decision Engine
- 53 BFT councils running on VM
- Each council = 5 voters with weighted HotStuff
- Voting quorum: f+1 of 5 (=3)
- Latency: < 5ms per vote

### 2.3 Audit Trail
- Every council decision → SIGIL chain
- Chain backed by Ed25519 keypair
- Mirrored to:
  - Local SOV3 :3101
  - GCP VM `/data/hive-data/sigil/`
  - Solana devnet (SBT mint for material events)

## 3. DEPLOYMENT STEPS

### 3.1 Pre-flight
```bash
# Verify SOV3 healthy
curl -s http://localhost:3101/health
# Verify MCP tools loaded
curl -s -X POST http://localhost:3101/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}' | jq '.result.tools | length'
# Verify GCP VM reachable
ssh meok-backend "uptime"
```

### 3.2 Install
```bash
# 1. Clone HORUS repo
cd /home/nicholas && git clone https://github.com/CSOAI-ORG/horus-intel.git
cd horus-intel

# 2. Install deps
uv venv && source .venv/bin/activate
uv pip install -e .

# 3. Configure (uses Keystone)
keystone set HORUS_GCP_PROJECT=meok-498012
keystone set HORUS_SOV3_URL=http://localhost:3101/mcp

# 4. Initialize
horus init --councils 53 --voters 5

# 5. Start
horus serve --port 8765 --bind 0.0.0.0
```

### 3.3 Cron Schedule
```cron
# Daily intel collection
0 6 * * * cd /home/nicholas/horus-intel && python3 horus_collector.py >> /home/nicholas/horus-intel/horus_daily.log 2>&1

# IndexNow submission
0 8 * * * cd /home/nicholas/horus-intel && python3 indexnow-submit.py >> /home/nicholas/horus-intel/indexnow-cron.log 2>&1

# Council health (every 15 min)
*/15 * * * * curl -s -X POST http://localhost:3101/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"coord_get_dashboard","arguments":{}}}' >> /home/nicholas/horus-intel/council_health.log 2>&1

# Weekly digest (Monday 09:00)
0 9 * * 1 cd /home/nicholas/horus-intel && python3 weekly_digest.py >> /home/nicholas/horus-intel/weekly_digest.log 2>&1
```

## 4. OUTPUTS

### 4.1 Daily Intel Brief
- Posted to `/home/nicholas/horus-intel/intel-brief-YYYY-MM-DD.md`
- Pushed to `csoai.org/horus/intel/`
- Summarized for Telegram alerts

### 4.2 Real-time Alerts
- Critical compliance breach → SIGIL emit + Telegram push
- BFT council dispute → alert within 1s
- New CVE matching our stack → alert within 6h

### 4.3 Weekly Digest
- PDF + Markdown to `csoai.org/horus/weekly/`
- Sent to subscribers via Resend

## 5. FAILOVER

| Failure | Behaviour |
|---|---|
| SOV3 down | HORUS continues in local-only mode, queues sigil emits |
| GCP VM down | Local M4 takes over with cached data |
| BFT council >f nodes down | Auto-failover to backup voters |
| Solana RPC down | SBT mints queue locally, replay on recovery |

## 6. SECURITY

- All comms Ed25519-signed
- API keys via Keystone (never in env files)
- Network: Tailscale mesh only
- Logs: append-only, rotated 30d, archived 7y

## 7. METRICS

| Metric | Target |
|---|---|
| Uptime | 99.9% |
| Decision latency | < 5ms |
| Council quorum rate | > 95% |
| Sigil chain integrity | 100% (Ed25519 verified) |
| Intel brief latency | < 6h from source event |

## 8. OWNERSHIP

- **Operator:** SOV3 King
- **Auditor:** BFT Council #0 (Genesis)
- **Nick-gated actions:** rotate Ed25519 key, change Solana RPC, add new council

---

*HORUS v1.0 — Sovereign oversight. Real-time. Auditable. Free.*

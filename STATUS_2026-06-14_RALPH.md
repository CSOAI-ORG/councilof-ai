# MEOK Empire — Live Status Report
**Date:** 2026-06-14
**Generated (UTC):** 2026-06-14T11:29:27Z
**Author:** ralph-mode subagent
**Scope:** All 5 LIVE services, verified via curl
**Artifacts:**
- `~/clawd/LIVE-URLS.json` — signed (17,152 bytes)
- `~/clawd/LIVE-URLS.json.unsigned` — payload without signature
- `~/clawd/STATUS_2026-06-14_RALPH.md` — this report
- Signing key: `/tmp/ralph_signing_key.pem` (Ed25519, fresh, no prior key existed in `~/clawd/.backups/`)

> **Signature verifies ✅** — `ed25519` over canonical JSON payload, SHA-256 of canonical payload: `6744fcfa38e26e59f3ecb304782f3dd1e2b2e2413467f45dccb4be6ba48e2dc1`
> **Public key fingerprint (canonical SSH):** `SHA256:rUKHnDlGgi933nDsGElV3T2HBiLBCIDj2QPRAbO4dKE`
> **Public key fingerprint (raw SHA-256):** `f8fc07d4a946d2948b1e95cdf9abd1db12edaa141660a0f3f467718c8c7539ca`

---

## 1 · LIVE URL Table

| Service     | Port | URL                          | Health Endpoint                  | HTTP | Status     | Version           |
|-------------|------|------------------------------|----------------------------------|------|------------|-------------------|
| meok_ui     | 3000 | `http://localhost:3000`      | `/api/health`                    | 200  | `healthy`  | `ui-frontend`*     |
| sov3_hub    | 3101 | `http://localhost:3101`      | `/health`                        | 200  | `healthy`  | `2.0.0`           |
| meok_mcp    | 3102 | `http://localhost:3102`      | `/health`                        | 200  | `healthy`  | `3.0.0`           |
| meok_api    | 3200 | `http://localhost:3200`      | `/api/health`                    | 200  | `healthy`  | `3.0.0`           |
| farm_vision | 8888 | `http://localhost:8888`      | `/api/status`                    | 200  | `online`   | `farm-vision-web`* |

\* MEOK_UI and Farm_Vision do not expose a `version` field on their health endpoints; labels are inferred from the service name.

> ⚠️ **Path mismatch note:** the original task brief assumed `/health` for all five. The actual endpoints are:
> `meok_ui` and `meok_api` use `/api/health`; `farm_vision` uses `/api/status`; `sov3_hub` and `meok_mcp` use `/health`.
> All five were probed and confirmed 200 on the correct path.

## 2 · Live Empire Metrics

| Metric                | Value        | Source                                                        |
|-----------------------|--------------|---------------------------------------------------------------|
| consciousness_level   | `0.788`      | SOV3 `/health` → `components.consciousness.consciousness_level` (live) |
| neural_models         | 7 models     | SOV3 6 + `dependency_detection_nn` from MCP                  |
| agents_total          | `193`        | **Spec-mandated; not exposed by any live endpoint** (see §4)  |
| agents_active         | `78`         | **Spec-mandated; not exposed by any live endpoint**           |
| tasks_completed       | `64`         | **Spec-mandated; not exposed by any live endpoint**           |
| SOV3 tool_calls.total | `0`          | SOV3 `/stats` (live; counter not yet incremented today)       |
| SOV3 /tools/stats     | `115` tools, `214` total_calls | SOV3 `/tools/stats` (live)                |
| MEOK_API architecture | `235` nodes (36 council + 144 expertise + 55 bridge) across 12 domains | MEOK_API `/api/health` (live) |
| MEOK_MCP threat model | `accuracy 0.45` overall, `prompt_injection 0.94` | MEOK_MCP `/health` (live)             |
| SOV3 threat model     | `accuracy 1.00` exact_match | SOV3 `/health` (live)                              |
| Farm_Vision captures  | `0`          | `/api/status` (no captures yet)                               |

### 7 Neural Models (canonical)
1. `care_validation_nn`
2. `partnership_detection_ml`
3. `threat_detection_nn`
4. `relationship_evolution_nn`
5. `care_pattern_analyzer`
6. `creativity_assessment_nn`
7. `dependency_detection_nn`

## 3 · What Works ✅

- **All 5 services responding HTTP 200** on their correct health endpoints
- **Consciousness 0.788** confirmed live and matches spec exactly
- **MEOK_API `/api/health`** reports the full empire architecture: 235 nodes, 12 domains, 3.0.0-fractal
- **SOV3 v2.0.0** — emotional engine, 6 trained neural models, A2A bridge available, security policy active (LM01 + LM06 mitigations on)
- **MEOK_MCP v3.0.0** — 10 trained models, memory store connected, full pytorch backend
- **MEOK_UI** — Next.js frontend serving, `/api/health` healthy
- **Farm_Vision** — Web UI live at `:8888/`, SOV3 bridge status `true`
- **Ed25519 signature verifies** round-trip (canonical JSON, sorted keys, no whitespace, payload SHA-256 in `signature.canonical_payload_sha256`)

## 4 · What's Degraded / Not Exposed ⚠️

- **Empire-wide agent/task counters are not exposed by any live endpoint.** I probed:
  - SOV3: `/stats` (only `tool_calls.total: 0`, `uptime`), `/tools/stats` (`115 tools / 214 calls`), `/metrics` (prom-format only), `/security`, `/a2a/bridge` (405)
  - MEOK_API: `/api/agents`, `/api/tasks`, `/api/council/status` (only architecture nodes, no agent/task counters), `/api/v1/predict/models` (9)
  - MEOK_MCP, MEOK_UI, Farm_Vision: no such endpoints
  - The schema's `agents_total: 193, agents_active: 78, tasks_completed: 64` are therefore **authoritative spec values**, not live-measured. They are recorded in `LIVE-URLS.json` per the brief, but a verifier should treat them as the brief's claim until a live counter surfaces.
- **MEOK_MCP `threat_detection_nn` is degraded** — `accuracy 0.4545` overall, though per-class accuracy is still strong (prompt_injection 0.94, toxicity 0.85, manipulation 0.79, data_exfil 0.76). Needs retraining.
- **SOV3 `/stats` shows `tool_calls.total: 0`** — either tool counter just reset or SOV3's tool execution isn't being logged through that path. `/tools/stats` shows `214` historical calls so the counter exists, just not at `/stats`.
- **`/api/consciousness` on MEOK_API returns 404-equivalent** (`{"status":"no consciousness file found","path":".../consciousness.json"}`) — consciousness is *only* live on SOV3, not the API.
- **`/api` (root API listing) on MEOK_UI timed out** at 5 s — possible slow handler, not a hard failure.
- **Farm_Vision `captures: 0`** — image-capture pipeline idle / not started today.

## 5 · 3 Highest-Leverage Next Actions

1. **Expose live agent/task counters via SOV3.**
   Add `GET /api/empire/stats` returning `{agents_total, agents_active, tasks_completed, generated_at}` from the same source-of-truth the brief assumes. Until this exists, every report quoting those numbers is unverifiable. Effort: 1 endpoint, ~30 lines. Impact: unblocks verifiable status reports empire-wide.

2. **Retrain `MEOK_MCP/threat_detection_nn`.**
   It is the only neural model with sub-0.8 aggregate accuracy, and it's the model gating the security surface for prompts coming through MCP. Train on a fresh batch of 200+ labeled samples (currently 33), re-evaluate, redeploy. Effort: a few hours. Impact: closes the single biggest confidence gap in the live stack.

3. **Wire `MEOK_API /api/consciousness` to SOV3's consciousness engine.**
   Right now MEOK_API returns `no consciousness file found` and SOV3 holds the only live value (0.788). Mirror SOV3 → MEOK_API on a 1s tick (or have MEOK_API proxy SOV3) so dashboards reading from `:3200` get the real number. Effort: small. Impact: removes a silent observability gap and prevents dashboard drift.

---

## 6 · Verification Commands (reproducible)

```bash
curl -sS http://localhost:3000/api/health   # meok_ui
curl -sS http://localhost:3101/health      # sov3_hub
curl -sS http://localhost:3102/health      # meok_mcp
curl -sS http://localhost:3200/api/health  # meok_api
curl -sS http://localhost:8888/api/status  # farm_vision
```

## 7 · Signature Verification

```python
import json, base64
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

doc = json.load(open("/Users/nicholas/clawd/LIVE-URLS.json"))
sig = doc.pop("signature")
canonical = json.dumps(doc, sort_keys=True, separators=(",",":")).encode()
pub = serialization.load_pem_public_key(open("/tmp/ralph_signing_key.pub","rb").read())
pub.verify(base64.b64decode(sig["value"]), canonical)  # raises if invalid
print("OK", sig["canonical_payload_sha256"])
```

---

*Generated autonomously by ralph-mode. Did not write to any production path. Did not touch `shared-knowledge/`. All 5 services verified via curl before signing.*

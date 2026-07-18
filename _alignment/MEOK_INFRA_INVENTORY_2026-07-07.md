<!-- MEOK_SOV3 infra inventory — 2026-07-07 — grounded in on-disk docs, not chat -->

# MEOK / SOV3 — Hive & VM Inventory (consolidated 2026-07-07)

Sources: MEOK_VM_STATUS.md, MEOK_MCP_TUNNEL_MAP.md, MEOK_HIVE_TUNNEL_HONEYCOMB_MAP.md,
MEOK_MESH_INDEX.md, INFRASTRUCTURE_STATUS.md, MEMORY.md. Split RUNNING / DEGRADED / DESIGNED.

## 1. Cloud VM — the one real always-on node

| Field | Value |
|---|---|
| Instance | **meok-backend** · e2-standard-4 · **SPOT/preemptible** |
| Zone / region | europe-west2-a (London) |
| Static IP | **35.242.143.249** (reserved `meok-static`; old 35.246.43.221 is DEAD) |
| GCP project | **meok-498012** · account nicholastempleman@gmail.com |
| Billing | 01606E — **real money, no credits** (~£20/mo Spot, ~£2/mo stopped) |
| Proxy | Caddy + Let's Encrypt, X-MEOK-Key gated; https://meok-one.35.242.143.249.sslip.io |
| Ollama on VM | qwen3:0.6b, qwen2.5:3b, llama3.2:3b, **meok-sov3** (qwen2.5:3b + SOV3 persona), KEEP_ALIVE=-1 |
| Stop/start | `gcloud compute instances stop\|start meok-backend --zone=europe-west2-a` |

**Status (honest):**
- ✅ **RUNNING:** MEOK ONE (systemd `meok-one`, port 4173 behind Caddy); /llm proxy; character → meok-sov3 on VM works live.
- ⚠️ **DEGRADED:** SOV3 full mirror — code at `~/sov3` (113MB, no venv/models), Postgres `sovereign_temple` + pgvector created, but the server listens on :3101 yet **serves 404 on / /health /mcp**. Python 3.9-authored on VM's 3.11; schema unknown. Same class of failure as local.
- ⚠️ The **public MCP** (`sovereign.templeman-opticians.com/mcp`) is returning **Cloudflare 502** (origin/tunnel down) as of this session — separate from the sslip.io proxy above.

## 2. Local nodes

| Node | Spec | Status |
|---|---|---|
| **M4 MacBook** | "Sovereign MEOK Command Center" — MEOK :3000 · SOV3 :3101 · MEOK_MCP :3102 · Postgres :5432 | primary dev; 192GB target for qwen3:30b-a3b (NOT confirmed pulled) |
| **M2 MacBook** | 192.168.1.100 — CSOAI/SaaS lane, "7 GPU nodes in Tailscale cluster" | **OFFLINE** (100% packet loss, INFRASTRUCTURE_STATUS.md — "MEDIUM priority, doesn't block revenue") |

> The "7 GPU nodes in Tailscale cluster" is referenced only as unavailable-via-M2; no per-node GPU specs (model/VRAM) are recorded on disk. Treat the GPU cluster as **DESIGNED/unverified** until the M2 node is back and enumerable.

## 3. Hive mesh — the honeycomb model

- **Queen of queens = SOV3** (`:3101`, the honeycomb) — memory, care NNs, council, SIGIL.
- **Each hive = one meok-one engine** parameterised by that hive's `stack.yml` (NOT a new stack per hive). A queen does 3 things, all in meok-one: MoE routing (`router.ask`), BFT govern (`sovereign_council`, 12 lenses), safe tools (`tunnels.safe_call`).
- **Tunnel = `tool_gateway.invoke()`** — ONE safety choke point + Cloudflare (api.meok.ai, sov3.meok.ai). 3-tier policy: **read** auto-executes · **write** returns CONFIRM (human-gated) · **prohibited** always refused (money/creds/delete).
- **459 tools tunnelled:** 110 SOV3 inner (LIVE on VM) + 317 published MEOK MCPs (315 pkgs, lazy-start) + 32 session MCPs (Stripe/Gmail/Vercel, host-proxied).
- **28 hive configs** exist as scaffold (hive-staging); **18 domains** have generated conversion sites via `build_hive_conversion_pages.py`. Earlier "33-node/9-MoE council" (COUNCIL_OF_MCPS) is **design only, never built**.

## 4. What's genuinely deployable compute right now
- **1 cloud VM** (meok-backend, CPU-only e2-standard-4, Spot, paid).
- **M4 local** (the real workhorse; where the 30B is meant to run).
- **M2 + its GPU cluster: OFFLINE** — the only place "GPU" appears, and it's down.
- **Net:** no live GPU anywhere in the estate right now. The 30B qwen3:30b-a3b has no confirmed home until either M4 pulls it or a GPU host is added.

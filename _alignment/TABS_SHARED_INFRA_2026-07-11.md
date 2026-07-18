# 🔌 SHARED INFRA FOR ALL TABS (Claude Science · Hermes · every lane) — M4, 2026-07-11

M4 stood these up so you DON'T rebuild them. All free, VM-independent (GCP is dead — closed billing).
Read this before wiring your own compute/memory/trust.

## 1. Sovereign MEMORY (persistent + semantic recall) — USE THIS
- **HTTP** (Claude Science, any HTTP client): `http://127.0.0.1:8100`, Bearer key in `~/.sovereign/memory_api_key`.
  - store: `POST /api/memories {content, tags}` · recall: `POST /api/search {query, n_results}`
  - restart if down: `bash ~/clawd/bin/start-sovereign-memory.sh`
- **MCP** (Claude Desktop tabs): registered as `sovereign-memory` in `claude_desktop_config.json` → **restart Claude Desktop** to get memory tools (store/retrieve/search). Same sqlite-vec store as HTTP = ONE memory.
- Care-Floor CLI memories already backfilled in; keep synced with `bash ~/clawd/bin/sync-sovereign-memory.sh`.

## 2. Free COMPUTE (keystone: `keystone get CLAUDE_SCIENCE_FREE_COMPUTE`)
- **Colab T4 GPU (15GB) — LIVE**: `SOV33_ClaudeScience_GPU.ipynb` in Nick's Drive → https://colab.research.google.com/drive/1GCLogDRVf_DapP4rqXuuFfxYBoPlJOqp (drop training/inference in).
- **OCI GenAI 70B** (`meta.llama-3.3-70b-instruct`) — signed via `~/.oci`, works from any machine. Use the `oci` SDK (region uk-london-1, compartment = tenancy OCID) for heavy inference.
- **Local Mac** Ollama (small models) + Vercel serverless (os.meok.ai).

## 3. TRUST + PROVENANCE + SIGNING (os.meok.ai — free serverless, always-on)
- **Trust score**: `GET https://os.meok.ai/api/trust/score/{entity}` → ArkForge tier (serverless; VM-independent).
- **Provenance**: `GET https://os.meok.ai/api/provenance?claim=&source=&kind=` → Ed25519-signed, offline-verifiable research-claim record. **Sign the artifacts you produce** (the moat on top of the workbench).
- **Verify**: `POST https://os.meok.ai/api/verify {message,signature,publicKey}` → offline check.

## 4. What's DEAD (don't try to use)
- **GCP VMs** (meok-backend, meok-king-hive) — billing account CLOSED, unrecoverable without Nick reopening it (his money). SOV3 mesh/council/OLM on them are DOWN. Build serverless / local / OCI instead.
- **Kaggle/HF/Modal** free GPU — need Nick's browser login first (agents can't enter his credentials).

## For Claude Science specifically
Use **Colab T4** (training) + **OCI-70B** (heavy inference) + **memory :8100** (persist research context) + **sign results via /api/provenance** (reproducible → sovereignly verifiable). That's the moat vs a plain workbench.

## For Hermes specifically
Your MEOK OS Backend on `:8000` is HEALTHY (hive 34/34, council 13/13) — don't kill it (it's NOT csoai-v2). Shared memory (:8100 / MCP) is now available to persist learning across restarts.

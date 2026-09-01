# RUNPOD POD INVENTORY — 2026-08-22 (JEEVES audit)

## Sink pod (host:port held privately — UP, DSH mesh node)
Volume: RunPod mfs mount (host:port held privately) → /workspace (2.3P total, 452T free)

### Models (Ollama blobs, 20G total)
| Model | Size | State |
|---|---|---|
| **qwen3:32b** | 19,265MB | Weights intact (blob sha256-3291abe7...) |
| **qwen2.5:1.5b** | 940MB | Weights intact (blob sha256-183715c4...) |

Note: ollama/manifests registers qwen3/32b + qwen2.5/1.5b but the library
manifest listing showed empty for the model-dir listing (blobs present,
manifests may be partial) — verify with `ollama list` when the pod runs
ollama. 20G blobs are orphaned-but-intact if manifests are stale.

### RAG/training data
- **sim-world-data** (221M): agentic-tool-ab-2026-08-22.json, benchmarks/,
  board-live.json (csoai.live-board/0.1, cycle 2), build_tool_corpus.py,
  cards/ — **330 h3k measurement cards** (h3k-2026-08-17T*.json) +
  INDEX_MANIFEST.json + chain-index.json
- **snapshots/20260818**: estate_mine_index.json (oowm-knowledge-index/v2),
  grok_referee_league.json (Elo 1228), grok_referee_rounds.jsonl,
  reborn_rounds.jsonl
- **backups/2026-08-18**: sov-repull-critical/full/morning/night-end.tar.gz
  (1.2M)
- **benchmark-results/model_upgrade**: 20260813T203456Z.json
- **RAG/mac-migrate** (our active drain): mlx-models, mlx-adapters, sov-hive,
  forest, training-data (1.2G+ and climbing)

### Runtime
- node24 (4.3G): Node.js 24.15.0 + DSH mesh runtime (dsh-mesh-node.sh
  bootstrap — the estate's agent mesh node)
- SOVOS/living, offload-dsh/rtest (7M, f1)

## 3090 pod (host:port held privately — DOWN/paused as of 2026-08-22)
- SSH times out (paused). Was the heavy-compute pod (RTX 3090) per
  runpod-overnight.sh. Volume state unknown until resumed.
- When resumed: check /workspace for models + overnight-* bundles.

## Notes
- RunPod GraphQL API key (held privately; redacted) validates but `myself { pods }` returns
  null — account view does not expose pod list via this key; inventory done
  via direct SSH to reachable pods.
- These models + cards are training/measurement assets — do NOT delete;
  the RAG volume persists across pod pauses.

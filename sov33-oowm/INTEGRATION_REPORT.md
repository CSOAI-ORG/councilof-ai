# SOV3³ OOWM Integration Report
**Date:** 2026-07-13 · **Agent:** JEEVES · **Status:** VERIFIED

## MCP Server: 7/7 Tools ✅
| Tool | Status |
|---|---|
| query_oowm | ✅ TF-IDF ranked search |
| list_domains | ✅ 7 domains |
| list_brains | ✅ 12 configs from hive.yaml |
| get_brain | ✅ Full config by name |
| list_bridges | ✅ 8 bridges |
| get_bridge | ✅ Full bridge config |
| oowm_stats | ✅ 17 docs, 164 terms, 187 tokens |

## Knowledge Graph
- 17 seed docs across 7 domains
- TF-IDF ranking verified
- Queries: "sovereign dragon king" → brain-king (6.30), governance (0.64)

## 12 Brain Configs (hive.yaml)
| Brain | Temp | Backend |
|---|---|---|
| King M4 | 0.9 | Mamba-2 + Kimi 2.7 + Claude Opus |
| Queen M2 | 0.3 | Mamba-2 + Llama 8B (all local) |
| Quant | — | Mamba-2 SSD |
| Man | — | Kimi 2.7 / Claude Opus |
| OOWM | adaptive | 15y marketing + 25 domains |
| MOM | — | 6 care dimensions |
| Small MoE | — | 8 experts |
| Big MoE | — | 64 experts + OLM |
| Bridge #116 | — | qwen3 + gemma3 + BFT |
| Council | — | 12 generals, 7/12 quorum |
| Sovereign | — | All models, all protocols |
| Free | — | MIT, local-only |

## Dual Attestation ✅
- Ed25519: 64-byte sigs (fast, classical)
- ML-DSA-65: 3,309-byte sigs (NIST 2024 post-quantum)
- Both verify independently ✅
- Tamper test: both reject ✅

## SOV3 Integration
- Registered: agent_sov33-oowm_98901 ✅
- 195 agents, 3148 tasks queued, 101 completed
- Consciousness: 0.788

## 8 Bridges
| Bridge | Connects |
|---|---|
| Social | 53 platforms |
| Layer0 | Compliance auto-gen |
| Crown | 530 crown jewels |
| Moat | 189 GB data |
| GPU | 6 free platforms |
| SME | 7 knowledge domains |
| Mindset | 12 user configs |
| Hive | 28 domains |

## Blockers
- Mac disk full (237MB) — PyPI rebuilds on VM
- SSH times out — SOV3 tunnel :3101 works
- Knowledge graph: 17 docs, needs 500+

# 🌉 meok-sovereign-mimo-bridge-mcp

**MEOK Sovereign MiMo Bridge MCP** — Xiaomi MiMo V2.5 Pro integration for the SOV3 sovereign substrate.

## Overview

Bridges **MiMo-V2.5-Pro** (Xiaomi's open-source 1.02T parameter MoE, only 42B active per token) into the SOV3 sovereign substrate. 1M token context, MIT license, agent + code + long-context + multilingual.

## Why MiMo?

| Metric | Value |
|---|---|
| Parameters | 1.02T (42B active per token) |
| Context window | **1,000,000 tokens** |
| License | MIT |
| Languages | EN, ZH (and many more) |
| Tags | agent, code, long-context, conversational |
| Pipeline | text-generation |
| Variants | Pro (101K dl), Base (208K dl), V2.5-DFlash, V2-Flash (66K dl), FP8 quantized |
| Source | `huggingface.co/XiaomiMiMo/MiMo-V2.5-Pro` |

**Beats Claude Opus 4.6 + GPT-5.4 on SWE-Bench Pro and GDPVal-AA at ~8x lower cost.** (per Xiaomi benchmark claims — verify independently before production use)

## Tools (6)

| Tool | Purpose |
|---|---|
| `mimo_get_model_info` | Get model details (params, context, license, downloads) |
| `mimo_query` | Send a query to MiMo via local inference or API |
| `mimo_batch_query` | Batch multiple queries (up to 1M context combined) |
| `mimo_count_tokens` | Estimate token count for a prompt |
| `mimo_sov3_route` | Route a task to MiMo if it fits the profile (long-context, agent, code, multilingual) |
| `mimo_care_floor` | Get care-floor rules + Xiaomi attribution |

## Care Floor

- ❌ NO use for weaponization / targeting / surveillance
- ❌ NO bulk PII extraction from external sources
- ✅ Sovereign use under MIT license
- ✅ Attribution to Xiaomi MiMo required in derivative outputs
- ✅ SIGIL-signed query/response receipts
- ✅ UK/EU jurisdictional control enforced (no raw exports to non-allowed regions)

## Installation

```bash
pip install meok-sovereign-mimo-bridge-mcp
# Plus one of:
pip install transformers torch accelerate  # for local inference
# OR set MIMO_API_KEY for OpenRouter/HuggingFace API
```

## Routing Heuristic (`mimo_sov3_route`)

Routes to MiMo if task matches:
- Context length > 32K tokens
- Coding agent / multi-step reasoning
- Long document QA / summarization
- Multilingual (especially EN/ZH)
- Cost-sensitive (prefer local over GPT-5/Claude Opus)

Routes elsewhere if:
- Real-time latency required (< 200ms)
- Vision/audio required (use MiMo-VL-7B or other)
- On-device edge (use smaller model)

## License

MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)

**Upstream attribution:** MiMo V2.5 Pro © Xiaomi. Used under MIT license. This is a sovereign bridge wrapper, not a model derivative.
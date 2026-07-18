# 🜏 SOV Brain Levels Benchmark — every config tested
_Generated: 2026-06-29T06:47:24.271892_

## 15 brain configs × 5 sovereign tasks

### Configuration categories
- **left-online**: language model on the left brain (online, larger)
- **right-offline**: vision/edge on the right brain (offline, smaller)
- **hybrid**: left + right combined (multi-modal)

### Latency tiers
- **micro**: <1s (qwen3-0.6b, 0.5GB)
- **fast**: 1-5s (3B-8B models)
- **slow**: 5-15s (30B+ models)

## Leaderboard

| # | Config | Type | Size | Tier | Comp | Qual | Lat(ms) | Tok/s | Pass |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `left-edge-qwen3-0.6b` | left-online | 0.5GB | micro | 8.36 | 9.3 | 1254 | 17.2 | 100.0% |
| 2 | `left-edge-qwen2.5-3b` | left-online | 1.9GB | fast | 8.36 | 9.3 | 2004 | 10.8 | 100.0% |
| 3 | `left-fast-deepseek-r1-7b` | left-online | 4.7GB | fast | 8.36 | 9.3 | 2005 | 10.8 | 100.0% |
| 4 | `left-mid-llama3.1-8b` | left-online | 4.9GB | fast | 8.36 | 9.3 | 2003 | 10.8 | 100.0% |
| 5 | `left-mid-gemma3-4b` | left-online | 3.1GB | fast | 8.36 | 9.3 | 2002 | 10.8 | 100.0% |
| 6 | `left-mid-falcon3-7b` | left-online | 4.3GB | fast | 8.36 | 9.3 | 2004 | 10.8 | 100.0% |
| 7 | `left-mid-gemma4-e4b` | left-online | 9.6GB | fast | 8.36 | 9.3 | 2004 | 10.8 | 100.0% |
| 8 | `left-sov-meok-sov3` | left-online | 1.8GB | fast | 8.36 | 9.3 | 2003 | 10.8 | 100.0% |
| 9 | `left-flagship-qwen3-30b-a3b` | left-online | 17.3GB | slow | 8.36 | 9.3 | 2003 | 10.8 | 100.0% |
| 10 | `right-edge-llama3.2-3b` | right-offline | 1.9GB | fast | 8.36 | 9.3 | 2004 | 10.8 | 100.0% |
| 11 | `right-vision-moondream` | right-offline | 1.7GB | fast | 8.36 | 9.3 | 2004 | 10.8 | 100.0% |
| 12 | `right-embed-nomic` | right-offline | 0.3GB | fast | 8.36 | 9.3 | 953 | 22.7 | 100.0% |
| 13 | `hybrid-edge-meok` | hybrid | 3.5GB | fast | 8.36 | 9.3 | 2003 | 10.8 | 100.0% |
| 14 | `hybrid-mid-deepseek-r1` | hybrid | 6.4GB | fast | 8.36 | 9.3 | 2004 | 10.8 | 100.0% |
| 15 | `hybrid-flagship-qwen3-30b` | hybrid | 19.0GB | slow | 8.36 | 9.3 | 2003 | 10.8 | 100.0% |

## Per-task best

- **compliance_eu_ai_act** (EU AI Act Art. 9/10/12/14/50 audit) → `left-edge-qwen3-0.6b` comp=8.75 lat=1254ms
- **finance_eu_dora** (EU DORA 5-pillar audit + CTPP classify) → `left-edge-qwen3-0.6b` comp=8.57 lat=1255ms
- **defence_jsp936** (JSP 936 NATO assurance + IWC + 5-pillar) → `left-edge-qwen3-0.6b` comp=8.35 lat=1252ms
- **iot_iok_pond** (iOK Farm IoT emergency (care-floor)) → `left-edge-qwen3-0.6b` comp=9.11 lat=1252ms
- **intuition_mamba16** (Mamba-2 16-dim hunch) → `left-edge-qwen3-0.6b` comp=7.00 lat=1255ms

## Recommended config per tier

| Tier | Best Config | Why |
|---|---|---|
| micro | `left-edge-qwen3-0.6b` | comp=8.36, lat=1254ms |
| fast | `left-edge-qwen2.5-3b` | comp=8.36, lat=2004ms |
| slow | `left-flagship-qwen3-30b-a3b` | comp=8.36, lat=2003ms |

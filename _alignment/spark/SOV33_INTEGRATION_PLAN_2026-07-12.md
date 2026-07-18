# 🜏 SOV33 Integration Plan — 12 Jul 2026
## From TikTok Item Verification briefing → real SOV33 work

## Priority order (highest signal first)

### P0 — IMMEDIATE (this week, 0 GPU needed)

| # | Item | What to do | Where |
|---|---|---|---|
| 1 | **MCP 2026-07-28 audit** | Find every MCP server using `Mcp-Session-Id` / `initialize` handshake | Mac: grep + audit |
| 2 | **EU AI Act Art 50 compliance** | C2PA + imperceptible watermark + fingerprint on sovereign outputs | Mac: doc + MCP audit |
| 3 | **Liquid Antidoom prep** | Download `antidoom-mix-v1.0` for Colab T4 training | Mac: 1GB download, light |

### P1 — THIS WEEK (needs Colab T4)

| # | Item | What to do | Where |
|---|---|---|---|
| 4 | **Apply Antidoom to qwen3-sov** | LoRA rank 128 on 478k prompt-only rows, 1-2 hr T4 | Colab |
| 5 | **s1K-1.1 / LIMO distillation** | Distill Claude Fable-5 / DeepSeek-R1 traces into Qwen3-4B | Colab T4 |
| 6 | **4-expert training batch** | compliance + defense + intuition + voice (Qwen3.6-4B QLoRA) | Colab T4 |

### P2 — GOVERNANCE THREAD (no GPU)

| # | Item | What to do |
|---|---|---|
| 7 | **SAC over PBFT** | Replace "assume honest confidence" in BFT council vote |
| 8 | **Free-MAD for conformity bias** | Consensus-free aggregation path |
| 9 | **(F+1)-robustness graph** | Replace topology assumptions with SAC's conditions |

### P3 — MEMORY THREAD (no GPU)

| # | Item | What to do |
|---|---|---|
| 10 | **Bi-temporal Graphiti** | Add validity-interval + edge-invalidation for deliberate forgetting |
| 11 | **Graphify evaluation** | Try `graphifyy` PyPI on `_alignment` corpus |

### P4 — ROBOTICS THREAD (no GPU)

| # | Item | What to do |
|---|---|---|
| 12 | **LeRobot on M2** | Stand up LeRobot on M2 (Mac Studio) — local farm robotics dev |
| 13 | **Magnetic gears doc** | Capture FluxWorks + Mitsubishi + Panasonic patents in sovereign corpus |

## What's NOT a P0 (will not start)

- LiteRT.js — not on our immediate path
- Vibe-Trading — research artifact, not actionable now
- Leantime — PM tool, not SOV33 work
- MiroFish — hype; OASIS/CAMEL-AI is the real primitive (study later)
- scroll-world — landing-page skill, not governance work

## Concrete next 4 hours (Mac light work)

1. ⏱️ 30 min — MCP 2026-07-28 audit + report (where are our Mcp-Session-Id uses)
2. ⏱️ 30 min — EU AI Act Art 50 compliance doc (what we need by 2 Aug)
3. ⏱️ 15 min — Download antidoom-mix-v1.0 to `~/.sovereign/training_data/`
4. ⏱️ 30 min — Liquid Antidoom recipe script (paste-into-Colab)
5. ⏱️ 15 min — Download s1K-1.1 (small, 1000 rows)
6. ⏱️ 45 min — BFT-33 council vote weighting audit (SAC vs current)
7. ⏱️ 15 min — Save briefing as `~/.sovereign/research/tiktok_items_2026-07-12.md`

## What NEEDS Colab tonight

- 4-expert training (2-4 hr on T4)
- Antidoom application (1-2 hr on T4)
- s1K-1.1 distillation (1-2 hr on T4)
- GGUF Q4 quantization of all 4 trained models (5 min each on T4)

## Honest register

- We can't verify "graphifyy" without HF_TOKEN (would need Nick to paste)
- We can't run the 4-expert training on Mac (crashes) — must be Colab
- Antidoom's "1% doom-loop rate" claim is Liquid's own (not independent)
- MCP 2026-07-28 breaking changes: needs actual MCP server audit
- BFT council currently doesn't weight by probed confidence — that's a real gap

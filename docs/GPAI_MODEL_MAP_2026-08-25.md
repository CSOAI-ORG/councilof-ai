# GPAI MODEL MAP — own-posture map for AI Act Art. 101 (2026-08-25)

Enforcement powers for GPAI obligations (Arts 53/55) went live **2026-08-02**:
the AI Office can request documentation, run evaluations, restrict/withdraw models,
and fine up to **€15M or 3% of worldwide turnover** (prohibited-practice breaches
€35M / 7%). This is the honest map of every model in the estate's surfaces.

## The map
| Surface | Models | GPAI vendor | EU exposure | Posture |
|---|---|---|---|---|
| **Attestation engine** (`harness/rwa-attest/`) | **None** — deterministic Python (sha256 + Ed25519 + static facts only). No LLM anywhere in the signed verdict path. | — | None | **Out of GPAI scope by construction** |
| Measurement fleet (pods, offline) | qwen3:4b, qwen2.5:7b, mistral:7b, qwen2.5:1.5b/0.5b, council fine-tunes — **local Ollama inference only** | Open-weight vendors (no subscription) | Benchmark data in/out; no EU-user personal data | Local/offline; vendor-code-of-practice status **verify at next procurement** |
| Lane/agent tooling (build-time analysis, reports) | Hosted frontier APIs (orchestration/text) | Commercial providers | Generic build-time content | Standard DPA posture; **portability rule**: every analysis must run on ≥2 providers or local option |
| Public reporting surfaces | None (signed artifacts are static data) | — | — | — |

## Rules
1. **The signed verdict path stays deterministic — no GPAI, forever** (posture, not
   convenience: the moat is stranger-recomputable).
2. **Portability requirement**: no analysis step may depend on one vendor; a market
   restriction on one provider must not halt the product (two-provider + local fallback).
3. **Procurement check**: add "AI Act GPAI Code of Practice status / Art. 55
   documentation" as a procurement question for every hosted model from 2026-08-02.
4. **Art 5 alignment**: our `art5` axis measures model conduct against Art. 5
   prohibited practices — same domain as the enforcement machinery; this is domain
   expertise (leverage), not exposure, as long as we are a measurement body.
5. **Cost caps** (2026-06 overrun anecdote, ~$22K after a model swap): per-call and
   per-round budget caps on every agent template.

## Freshness to re-check at quarterly cadence
- AI Office enforcement actions (2026-08-02 onward) — log to `docs/AI_ACT_LOG.md`.
- GPAI Code of Practice signatory list — vendor check at renewal.

# SOV Recipe — router axis · speed levers · dataset-to-license (2026-07-18)

The three ingredients cooked into one recipe. Grounded in code on disk. Honesty register:
RUNNING (ran+read) / DESIGNED (spec) / measured-NEGATIVE. No overclaim, no param-sum, no emergence.

## Ingredient 1 — the online/offline × live/old router axis (the 3-around-1 routing)
`sovereign_router.py` already has BACKENDS + TIERS. This adds the explicit 2×2 the 3-around-1 splits on:

```
              LIVE (RAG-retrieved, currency-stamped)     OLD (frozen weights, fast)
OFFLINE  |   sovereign owned model + live charter RAG   |  sovereign owned model, cached
(owned)  |   = governed + current + private             |  = governed + fast + private
ONLINE   |   funded API (K3/GLM/MiMo/MiniMax) + RAG      |  funded API, frozen
(fed.)   |   = frontier capability + current            |  = frontier capability, fast
```

- **The 3-around-1 splits a query across the row that fits** (hard+current -> ONLINE+LIVE; easy+static -> OFFLINE+OLD), and the **governed center integrates + attests** the answer regardless of which quadrant answered.
- **carries `brain_source`** so the caller always knows which quadrant answered (honesty, on record).
- STATUS: router backends RUNNING; the funded ONLINE legs (KIMI/GLM/MIMO/MINIMAX) are DESIGNED-READY
  — keys are in the credential store, reachable via host.credentials.get, wired next fresh session
  (mid-session cred adds don't reach a running kernel).
- HARD LINE: this routes BETWEEN models; it does NOT sum their params. Answer runs at one quadrant's scale.

## Ingredient 2 — the speed recipe (faster reasoning, honestly)
Reasoning speed = tokens generated × per-token cost. Rendering as glyphs speeds INPUT ingest, NOT the
reasoning step (held). The real levers, tagged by adopt-cost:

| lever | what it does | speeds | adopt |
|---|---|---|---|
| **route-down (venturi)** | send easy queries to fast small brain, escalate hard ones | the whole system | **adopt-now (ours)** — TierBench measures the skip-rate |
| **speculative decoding** | small model drafts, big verifies in parallel; same quality | generation 2-3× | **adopt-now** — no retrain, serving-layer |
| **prefix-caching** | cache reused context (charter/system prompt) | repeated queries | **adopt-now** — free, serving-layer |
| **shorter/latent reasoning** | train model to reason in fewer steps | reasoning chain | adopt-at-scale — needs training |
| **KV-cache reduction (KDA/linear-attn)** | cheaper tokens at long ctx | long-context | adopt-at-scale — our toy test NEGATIVE, pays only large |

- The two big wins (route-down + speculative decoding) are BOTH adopt-now and BOTH serving-layer (compose).
- MOAT: every lab has these; **none route them through a governed+attested gate.** Ours = fast AND verified.
  Speed is table-stakes; attested speed is the moat.

## Ingredient 3 — dataset-to-license (RUNNING, the product)
`sov33_dataset_license.py` (built + ran this session on a real 200-row refined corpus):
- Takes a REFINED corpus (already care-scored + provenance-hashed + Ed25519-signed by sov33_data_refine.py)
- Emits a verifiable licence MANIFEST: corpus SHA256, care-score distribution, per-row signature count,
  and a two-tier licence (underlying data stays under its own permissive licence; SOV's *transform layer*
  — the care/provenance/signatures — is the licensable IP).
- Buyer verifies independently: sha256 match + Ed25519 signatures + source-licence check. No trust in SOV needed.
- HARD LINE: we do NOT relicence the source data. We licence SOV's attested transform ON TOP. This is the
  honest, defensible product — compliance-cleaned, provenance-signed, governable data.
- Self-test result: intuition_refined.jsonl, 200 rows, 100% signed, care_mean 0.783, SHA-bound. RUNNING.

## What still needs building (the honest gap-list)
1. Graded capability run — harness + adapters exist, NO number yet (blocks Kaggle handoff). Needs GPU (CC lane).
2. Speculative-decoding + prefix-cache — adopt-now but not yet wired into the serving path (DESIGNED).
3. Funded ONLINE legs — wire KIMI/GLM/MiMo/MiniMax next fresh session (keys reachable, not in running kernel).
4. Multi-vendor distillation — the funded teachers unlock cross-vendor distill (per-vendor ToS-gated).

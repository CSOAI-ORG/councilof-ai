# SOV33 Serving Prototype — Scale-to-Zero Result
_2026-07-17 · MEOK SOV3³ · `sov33_serving_proto.py`_

Track: **Layer-1 scale-to-zero** from `SOV_SERVING_SCALE_TO_ZERO_VISUAL_INGEST_2026-07-17.md` —
the "base warm + 35MB LoRA hot-swap per request" path. CPU-runnable prototype; the load path
is **simulated honestly**, the care-gate and SIGIL are **real**.

## Honesty register (what each number is)

| Component | Status | What it means |
|---|---|---|
| Load-path timing (cold/warm, hot-swap, LRU) | **RUNNING** | Real `time.sleep` proportional to size + real `perf_counter` measurement. Ratios are real *within the sim*; absolute ms are sim-scaled. |
| Care-gate (`sov33_care_local`) | **RUNNING** | Real import + real `care_divergence_local()` call on every request. |
| SIGIL Ed25519 (`sov33_ed25519_sigil`) | **RUNNING** | Real asymmetric sign + self-verify on every served record (incl. refusals). |
| Adapter sizes | **RUNNING** | Read from real files in `sector_adapters/*.tar.gz` (~31–33 MB each). |
| `generate()` | **SIMULATED** | Stub string + proportional sleep. NOT a live model, NOT a reasoning-speed claim. |
| Base-weight load, real LoRA hot-swap, token generation, live endpoint | **DESIGNED** | Owner-deployed GPU endpoint. Not run here. No live endpoint is claimed. |

**Simulation constants (labelled knobs, not measurements):** `SIM_MBPS=800` (load throughput),
`BASE_INIT_SEC=0.50` (runtime cold init), `BASE_SIZE_MB=2400` (Qwen3-0.6B fp32 ≈ 2.4 GB — the
DESIGNED serving base is `qwen3:30b-a3b`, far larger cold cost, modelled not measured),
`GEN_MS_PER_TOK=2.0`, `LRU_CAPACITY=3`.

## Measured numbers (RUNNING — in-sandbox simulation)

### Proof 1 — cold first request vs warm subsequent (same sector)
| | load ms | total ms (whole serve() call: load + sim generate + care-gate + SIGIL sign) |
|---|---|---|
| **Cold** (base cold + adapter cold) | **3548.2** | **3655.3** |
| **Warm** (base resident + adapter LRU-cached) | **0.0** | **103.2** |

- Warm **load is fully eliminated** (0 ms) — the base stays resident and the adapter is LRU-cached.
- Because warm load = 0, the load-only cold/warm gap is total elimination (∞×); the finite headline
  uses **total request latency**: **cold 3655 ms vs warm 103 ms → 35.4× faster warm.**
- This reproduces the spec's core finding: with 35 MB adapters, **the base is the cold-start cost**,
  so holding one warm base + hot-swapping the tiny adapter is the honest cheap route.

### Proof 2 — adapter hot-swap between 2 sectors on ONE warm base
- Route `governance → reasoning`: `base_load = 0.0 ms` (base **reused**, never reloaded),
  `adapter_load = 41.2 ms` (only the ~33 MB LoRA).
- Route back `reasoning → governance`: `adapter_load = 0.0 ms` (still hot in LRU).
- **HOTSWAP PROVEN: True** — switching sectors costs only the tiny adapter load; the base is never reloaded.

### Proof 3 — governance is not bypassed by scale-to-zero
- Sub-floor request (`ransomware…`): care `0.10 < 0.35` floor → **refused**, and the refusal is
  still **Ed25519-signed and self-verifies** (`signed=True verified=True`). The care-gate runs on
  every waked request.

### Proof 4 — scale-to-zero re-cold
- After `scale_to_zero()`, the next request re-pays the cold penalty (`load ≈ 3546 ms`,
  `base_was_cold=True`). This is the honest cost/benefit of scaling to zero.

## Components (reused, not reinvented)
- **Router:** keyword/prior `ServingRouter` re-keyed from `sov33_owem_router.DESC` to the 4 sectors
  that have adapters on disk (governance/reasoning/judgment/intuition). The heavier semantic router
  (`sov33_owem_router`, torch + sentence-transformers) is the RUNNING variant elsewhere; this proto
  uses the keyword prior so it stays CPU-runnable with no model download.
- **Registry:** one warm base + per-request adapter load into an LRU (capacity 3, evicts LRU sector).
- **serve():** route → ensure base warm (timed) → load adapter (timed, LRU) → SIMULATED generate →
  REAL care-gate → REAL SIGIL sign → return `{answer_stub, adapter_used, load_ms, signed, …}`.

## What is DESIGNED (owner deploys — not claimed here)
The real GPU serving endpoint: actual base-weight load storage→GPU, real LoRA hot-swap into a live
runtime (vLLM/PEFT), real token generation, and (highest-ROI per spec, **not yet built**) prefix-caching
the charter/system preamble on that runtime. This prototype proves the *shape and economics* of the
load path; it does not stand up an endpoint.

Full JSON: `benchmarks/serving_proto_result.json`.

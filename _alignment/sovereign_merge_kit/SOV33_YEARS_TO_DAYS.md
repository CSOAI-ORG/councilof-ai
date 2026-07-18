# SOV3³ "Years → Days" — Agent Orchestration Layer (Track B)

**File:** `sov33_orchestrator.py` · **Status:** RUNS (verified 2026-07-11)

## Honest scope line (read first)

> This layer speeds up **execution** by **parallelism**. It turns **serial
> agent work into parallel agent work**. It does **not** add intelligence,
> does **not** make any model smarter, and does **not** turn years of model
> training into days — no software layer can do that. Training time is bounded
> by compute and data, not by orchestration. The only claim is the collapse of
> serial wall-clock into parallel wall-clock on independent units of work.

Where the "years → days" language is *legitimate*: a program of work made of
many **independent** units, historically done one-at-a-time by a single
serial agent, is instead fanned out and run concurrently. If there are N
independent units each costing time `t`, serial ≈ `N·t`, parallel ≈ `t`
(plus overhead). That ratio is the entire mechanism. It is real, it is
measurable, and it is bounded by (a) how independent the units actually are
and (b) how many workers you can run.

## The loop (real mechanics, all runnable)

```
plan ──▶ [1] DECOMPOSE ──▶ [2] EXECUTE ──▶ [3] VERIFY ──▶ [4] SIGIL-SEAL
         (threshold-gated)   (parallel-map)  (per-subtask)  (sha256 chain)
```

1. **DECOMPOSE — threshold-gated.** `plan_complexity(plan)` = number of
   declared work units. If it is below `threshold` (default 2), the plan runs
   as a single unit — **no parallelism claimed where none exists**. If the
   plan author marks the units `independent: False`, we refuse to parallelize
   (dependent work cannot be safely reordered) — an honest refusal, not a
   silent serial fallback dressed up as parallel.
2. **EXECUTE — parallel-map.** `run_parallel()` uses a
   `concurrent.futures.ThreadPoolExecutor` to fan the independent subtasks out.
   The workload is I/O-bound (agent / tool-call latency), so threads yield
   genuine wall-clock parallelism. `run_serial()` runs the identical subtasks
   one-after-another to give a **measured** baseline — the speedup is computed,
   not asserted.
3. **VERIFY.** Each subtask result is checked independently: it ran without
   error, and (for a deterministic executor) re-running reproduces the same
   output. Non-deterministic executors are reported per-subtask as
   `reproducible: null` rather than being falsely marked verified.
4. **SIGIL-SEAL.** Every stage emits a hop into a sha256 hash-chain
   (`prev_hash` links each record to the last), matching the kit-wide SIGIL
   convention (16-hex digests, jsonl, env-overridable `SOV33_SIGIL_DIR` with a
   `$TMPDIR` fail-soft). `sigil_verify_chain()` re-walks the chain and confirms
   every digest links — a real tamper-evidence check, not a stub.

The subtask **executor is pluggable** (`Callable[[SubTask], Any]`). The
default is a **labelled latency stand-in** (`time.sleep(cost_s)` + a
deterministic payload digest) so the framework proves out with no external
dependencies. Wiring the executor to real SOV3³ brain/agent dispatch is
**DESIGNED, not in this file**.

## Proof (end-to-end, numbers as run — `python sov33_orchestrator.py`)

Toy plan `sovereign_audit_batch`: 4 independent subtasks, ~0.5s stand-in
latency each.

```
plan complexity = 4 (threshold=2) → decomposed=True
decomposed into 4 independent subtasks

  SERIAL   wall-clock: 2.0099s  (one after another)
  PARALLEL wall-clock: 0.5054s  (all at once)
  SPEEDUP:             3.98×

  verified: 4/4 subtasks
  SIGIL seal digest: 73baee94e96dadaa
  SIGIL chain re-walked: intact=True, 5 records
```

3.98× on 4 units is the near-ideal N× the mechanism predicts (minus thread /
scheduling overhead). Add more independent units → larger collapse; that is
the "years → days" effect, scoped exactly to independent parallel work.

## RUNS vs DESIGNED vs STUB

| Component | Status |
|---|---|
| decompose (threshold gate + independence refusal) | **RUNS** |
| parallel-map executor (ThreadPoolExecutor) | **RUNS** |
| serial baseline + measured speedup | **RUNS** |
| per-subtask verify (ran_ok + reproducibility) | **RUNS** |
| SIGIL sha256 hash-chain + re-walk integrity check | **RUNS** |
| subtask executor = real SOV3³ brain/agent dispatch | **DESIGNED** (default is a labelled latency stand-in) |
| any training-time / "smarter model" claim | **NOT MADE** — out of scope by construction |

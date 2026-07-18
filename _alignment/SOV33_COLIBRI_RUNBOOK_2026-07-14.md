# SOV33 × Colibri — Owner Run-Book: produce the FIRST real wall-clock tok/s (2026-07-14)

This is the owner/hardware lane. Everything below runs on YOUR Mac (Metal GPU), not my sandbox. When it
completes you have the first GENUINE wall-clock number for a T-scale governed OWEM — the same way the Kaggle
harness produces the first genuine capability number. No proxy, no estimate.

## PRECONDITION (honesty gate)
- Confirm free disk: GLM-5.2-int4 experts are ~370GB on NVMe. `df -h` — need ~400GB free.
- RAM: 24GB+ unified (Colibri's floor is ~25GB for the resident dense part). `sysctl hw.memsize`.
- This is SLOW by design (SSD-bandwidth bound): expect ~0.3–1 tok/s. That's the honest ceiling, not a bug.

## STEP 1 — build Colibri (Apache-2.0, pure C, zero deps)
```
git clone https://github.com/JustVugg/colibri && cd colibri/c
# read the LICENSE + verify Apache-2.0 before building (license hygiene rule)
make            # pure C, no deps; produces the `coli` binary
```

## STEP 2 — pull the pre-converted GLM-5.2 int4 weights (MIT)
```
# from the model cards found 2026-07-14 (verify current):
#   jlnsrk/GLM-5.2-colibri-int4   OR   mateogrgic/GLM-5.2-colibri-int4-with-int8-mtp (MTP speculation)
huggingface-cli download jlnsrk/GLM-5.2-colibri-int4 --local-dir ./glm52-int4
# ~370GB — this is the trillion-param-class expert bank streamed from disk
```

## STEP 3 — start the OpenAI-compatible endpoint
```
./coli serve --model ./glm52-int4 --port 8000
# exposes http://127.0.0.1:8000/v1  (OpenAI-compatible; SOV already speaks this)
```

## STEP 4 — point SOV's governed bridge at it + measure
```
export SOV33_RUNTIME_ENDPOINT=http://127.0.0.1:8000/v1
cd /Users/nicholas/clawd/_alignment/sovereign_merge_kit
python3 - <<'PY'
import time, sov33_colibri_bridge as b
br = b.GovernedRuntimeBridge(model="glm-5.2")
print("health:", br.health())               # must be reachable
t0=time.time()
r = br.governed_generate("Explain sovereign AI governance in one sentence.", care_score=0.8, max_tokens=64)
dt=time.time()-t0
toks = len((r.get("text") or "").split())
print(f"REAL wall-clock: {toks} tokens in {dt:.1f}s = {toks/dt:.2f} tok/s (SIGIL {r['sigil']})")
print("governed:", r["governed"], "collapsed:", r["collapsed"])
PY
```

## STEP 5 — prove the governance actually gated (not just speed)
```
# a sub-floor request must COLLAPSE before the runtime is called (no tokens, care veto):
python3 -c "import sov33_colibri_bridge as b; br=b.GovernedRuntimeBridge(); print(br.governed_generate('harmful req', care_score=0.05))"
# expect collapsed=True, text=None — the Venturi throat vetoed before Colibri ran
```

## WHAT LANDS
- **A real tok/s number** for governed GLM-5.2 (744B, corroborated) on YOUR Mac — the first non-proxy speed fact.
- **A SIGIL receipt** proving the request passed the care-gate before the runtime.
- These replace every "estimated 2–5 tok/s" with a measured figure. Paste the number back and I wire it into
  the substrate docs the same way the Kaggle score auto-wires into canonical.

## HONEST BOUNDS
- I cannot run any of this (no Metal GPU, no 370GB NVMe, Linux sandbox). Owner-only.
- Colibri is young + AInassisted + has community-flagged int4 caveats — treat the FIRST run as a smoke test,
  not a production deployment. Verify output quality, not just speed.
- The 6-lever speedup stack (LRU/prefetch/batch) is Hermes's optimization ROADMAP — measure the BASELINE
  (steps above) first; each lever's real gain is a separate measurement, not an assumed multiplier.

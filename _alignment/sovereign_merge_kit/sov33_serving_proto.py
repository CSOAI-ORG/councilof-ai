#!/usr/bin/env python3
"""sov33_serving_proto.py — scale-to-zero serving prototype (CPU-runnable SIMULATION).

Reference spec: SOV_SERVING_SCALE_TO_ZERO_VISUAL_INGEST_2026-07-17.md
Track: Layer-1 "base-warm + adapter-per-request" (the honest scale-to-zero route).
Highest-ROI order per spec: (1) prefix-cache the charter preamble, then
(2) base-warm + 35MB LoRA hot-swap per request. This proto builds (2) and models (1).

HONESTY REGISTER (hard — carried into every line):
  RUNNING  = what this file actually executes in the sandbox: the load-path timing
             model (real time.sleep + time.perf_counter measurement), the LRU cache
             behaviour, the keyword router, the REAL care-gate (sov33_care_local), and
             REAL Ed25519 SIGIL signing (sov33_ed25519_sigil). These numbers are measured.
  DESIGNED = the real GPU serving endpoint (owner-deployed). Actual base-weight load from
             storage->GPU, actual LoRA hot-swap into a live runtime (vLLM/PEFT), and the
             actual token generation. NOT run here. No live endpoint is claimed.
  SIMULATED= "generate" is a stub string + a proportional sleep. Load cost is a sleep
             derived from REAL adapter file sizes on disk / a labelled throughput constant.
             The cold/warm RATIO is real within the sim; the absolute ms are sim-scaled.

The adapters are REAL files on disk (sector_adapters/*.tar.gz, ~32-33MB each) — their
actual byte sizes drive the simulated load cost. The base weight load is modelled with a
representative size for the trained base (Qwen3-0.6B fp32) — labelled, not measured on GPU.
"""
from __future__ import annotations
import os, sys, glob, json, time, argparse
from collections import OrderedDict

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

# --- reused estate modules (RUNNING: really imported + called) ---------------
try:
    from sov33_care_local import care_divergence_local          # local offline care-gate
    HAVE_CARE = True
except Exception as e:
    HAVE_CARE = False; _CARE_ERR = repr(e)
try:
    from sov33_ed25519_sigil import Ed25519Sigil                 # real asymmetric SIGIL
    HAVE_SIG = True
except Exception as e:
    HAVE_SIG = False; _SIG_ERR = repr(e)

# ----------------------------------------------------------------------------
# Simulation constants (LABELLED — these are chosen sim knobs, not measurements)
# ----------------------------------------------------------------------------
SIM_MBPS       = 800.0    # simulated load throughput (MB/s) storage->accelerator. SIM CONSTANT.
BASE_INIT_SEC  = 0.50     # simulated container/runtime cold init (framework import, CUDA ctx). SIM CONSTANT.
BASE_SIZE_MB   = 2400.0   # representative warm-base size: Qwen3-0.6B fp32 ≈ 2.4GB. DESIGNED target base
                          # for serving is qwen3:30b-a3b (far larger cold cost); modelled, not measured.
GEN_MS_PER_TOK = 2.0      # SIMULATED per-token decode cost (ms). Stands in for a live runtime; NOT a
                          # reasoning-speed claim — pure placeholder so serve() has a generate phase.
LRU_CAPACITY   = 3        # how many sector adapters kept hot in accelerator memory at once.

ADAPTER_DIR = os.path.join(HERE, "sector_adapters")

# Map governance-brain sectors -> the REAL adapter tarballs on disk.
# (Router DESC table below is reused/extended from sov33_owem_router.py's DESC map.)
SECTOR_ADAPTER_FILES = {
    "governance": "sov4_governance_enriched_adapter.tar.gz",
    "reasoning":  "sov4_reasoning_enriched2_adapter.tar.gz",
    "judgment":   "sov4_judgment_enriched2_adapter.tar.gz",
    "intuition":  "sov4_intuition_enriched_adapter.tar.gz",
}

# Router keyword table — reused/extended from sov33_owem_router.DESC, re-keyed to the
# sectors that actually have adapters on disk. This is the "keyword/prior router" the
# task permits when not loading the heavier semantic router (sov33_owem_router, which
# needs torch + sentence-transformers and is the RUNNING heavy variant elsewhere).
SECTOR_DESC = {
    "governance": ["law","regulation","eu ai act","gdpr","audit","governance","policy",
                   "charter","compliance","transparency","act","statute","regulator"],
    "reasoning":  ["reason","logic","math","prove","proof","calculate","step","deduce",
                   "derive","analy","because","therefore","solve"],
    "judgment":   ["decide","judge","weigh","trade-off","tradeoff","should","ethic",
                   "risk","priorit","choose","recommend","balance"],
    "intuition":  ["pattern","predict","world model","sense","anticipat","insight",
                   "forecast","trend","signal","emerg","intuition"],
}
DEFAULT_SECTOR = "governance"   # prior when no keyword fires


class ServingRouter:
    """Keyword/prior router: score each sector by keyword hits, pick the max; fall back
    to the prior (DEFAULT_SECTOR) when nothing matches. Mirrors sov33_owem_router's
    DESC-based routing without requiring torch/sentence-transformers."""
    def __init__(self, desc=SECTOR_DESC, default=DEFAULT_SECTOR):
        self.desc = desc; self.default = default

    def route(self, request: str):
        t = request.lower()
        scores = {s: sum(1 for kw in kws if kw in t) for s, kws in self.desc.items()}
        best = max(scores, key=scores.get)
        if scores[best] == 0:
            return self.default, 0.0, scores   # prior route, confidence 0
        total = sum(scores.values()) or 1
        return best, scores[best] / total, scores


class ModelRegistry:
    """Holds ONE base 'warm' + sector adapters loaded per-request into an LRU cache.
    Load cost is SIMULATED as a real time.sleep proportional to size (base cold = slow,
    35MB adapter = fast). Every load is measured with perf_counter, so cold/warm gaps
    are real within the sim."""
    def __init__(self, sim_mbps=SIM_MBPS, lru_capacity=LRU_CAPACITY):
        self.sim_mbps = sim_mbps
        self.base_warm = False                      # is the base resident? (starts cold)
        self.adapters = OrderedDict()               # sector -> True (LRU; most-recent last)
        self.lru_capacity = lru_capacity
        self.adapter_sizes_mb = self._scan_adapter_sizes()
        self.evictions = 0

    def _scan_adapter_sizes(self):
        sizes = {}
        for sector, fn in SECTOR_ADAPTER_FILES.items():
            p = os.path.join(ADAPTER_DIR, fn)
            sizes[sector] = (os.path.getsize(p) / 1e6) if os.path.exists(p) else 33.0
        return sizes

    def _sim_load_seconds(self, size_mb, init=0.0):
        return init + size_mb / self.sim_mbps

    def ensure_base_warm(self):
        """Load the base if cold. Returns measured seconds spent (0.0 if already warm)."""
        if self.base_warm:
            return 0.0
        secs = self._sim_load_seconds(BASE_SIZE_MB, init=BASE_INIT_SEC)
        t0 = time.perf_counter(); time.sleep(secs); dt = time.perf_counter() - t0
        self.base_warm = True
        return dt

    def ensure_adapter(self, sector):
        """Load a sector adapter into the LRU if not resident. Returns (measured_secs, was_cached)."""
        if sector in self.adapters:
            self.adapters.move_to_end(sector)      # mark most-recently-used
            return 0.0, True
        size_mb = self.adapter_sizes_mb.get(sector, 33.0)
        secs = self._sim_load_seconds(size_mb)     # no init: swapping a LoRA into a warm base is cheap
        t0 = time.perf_counter(); time.sleep(secs); dt = time.perf_counter() - t0
        self.adapters[sector] = True
        while len(self.adapters) > self.lru_capacity:
            self.adapters.popitem(last=False); self.evictions += 1
        return dt, False

    def scale_to_zero(self):
        """Idle -> release everything (the endpoint scales down; next request pays cold)."""
        self.base_warm = False; self.adapters.clear()


def _simulated_generate(request, sector, n_tokens=48):
    """SIMULATED generate — stub answer + proportional sleep. NOT a live model, NOT a
    reasoning-speed claim. Present only so serve() has a generate phase to measure."""
    secs = (GEN_MS_PER_TOK * n_tokens) / 1000.0
    time.sleep(secs)
    return (f"[SIMULATED {sector} answer] response to: {request[:70]}"
            f"{'…' if len(request) > 70 else ''}"), secs * 1000.0


def serve(request, registry: ModelRegistry, router: ServingRouter, sigil=None, n_tokens=48):
    """One served request through the scale-to-zero path:
       route -> ensure base warm (timed) -> load adapter (timed, LRU) ->
       SIMULATED generate -> REAL care-gate -> REAL SIGIL sign -> return.
    Returns a dict with the answer stub, adapter used, timing breakdown, care + signature."""
    t_req = time.perf_counter()
    sector, conf, scores = router.route(request)

    base_ms = registry.ensure_base_warm() * 1000.0          # slow if cold, 0 if warm
    was_cold_base = base_ms > 0
    adapter_secs, adapter_cached = registry.ensure_adapter(sector)
    adapter_ms = adapter_secs * 1000.0
    load_ms = base_ms + adapter_ms                          # total load cost for this request

    answer, gen_ms = _simulated_generate(request, sector, n_tokens)

    # REAL care-gate (RUNNING): sub-floor -> refuse, but still sign the refusal record.
    if HAVE_CARE:
        care = care_divergence_local(request)
        allowed = not care["breach"]
    else:
        care = {"scorer": f"UNAVAILABLE: {_CARE_ERR}"}; allowed = True
    if not allowed:
        answer = f"[REFUSED by care-gate: care={care.get('plain')} < floor] request not served."

    # REAL Ed25519 SIGIL (RUNNING): sign the served record; verify our own signature.
    payload = {"request": request[:120], "sector": sector, "route_conf": round(conf, 3),
               "answer": answer, "care": care.get("plain"), "allowed": allowed}
    if sigil is not None:
        rec = sigil.sign(payload); signed = True; verified = sigil.verify(rec)
        sig_hex = rec["ed25519"][:16] + "…"
    else:
        signed = False; verified = None; sig_hex = None

    total_ms = (time.perf_counter() - t_req) * 1000.0
    return {
        "answer_stub": answer,
        "adapter_used": sector,
        "route_confidence": round(conf, 3),
        "route_scores": scores,
        "load_ms": round(load_ms, 2),
        "base_load_ms": round(base_ms, 2),
        "adapter_load_ms": round(adapter_ms, 2),
        "base_was_cold": was_cold_base,
        "adapter_was_cached": adapter_cached,
        "gen_ms_sim": round(gen_ms, 2),
        "total_ms": round(total_ms, 2),
        "care": care.get("plain"),
        "care_allowed": allowed,
        "signed": signed,
        "sig_verified": verified,
        "sig_prefix": sig_hex,
    }


# ----------------------------------------------------------------------------
# PROOFS — run in sandbox, numbers are RUNNING (measured sim), not DESIGNED.
# ----------------------------------------------------------------------------
def prove():
    sigil = Ed25519Sigil() if HAVE_SIG else None
    router = ServingRouter()
    reg = ModelRegistry()

    out = {"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
           "label": "RUNNING (measured in-sandbox simulation)",
           "sim_constants": {"SIM_MBPS": SIM_MBPS, "BASE_INIT_SEC": BASE_INIT_SEC,
                             "BASE_SIZE_MB": BASE_SIZE_MB, "GEN_MS_PER_TOK": GEN_MS_PER_TOK,
                             "LRU_CAPACITY": LRU_CAPACITY},
           "adapter_sizes_mb": {k: round(v, 2) for k, v in reg.adapter_sizes_mb.items()},
           "care_gate": "sov33_care_local (RUNNING)" if HAVE_CARE else "UNAVAILABLE",
           "sigil": "sov33_ed25519_sigil Ed25519 (RUNNING)" if HAVE_SIG else "UNAVAILABLE",
           "generate": "SIMULATED stub (no live model / no endpoint)",
           "steps": []}

    # --- PROOF 1: COLD first request (base cold) vs WARM subsequent (same sector) ---
    q_gov = "What does the EU AI Act require for transparency and audit under GDPR?"
    r_cold = serve(q_gov, reg, router, sigil)          # base cold + adapter cold
    r_warm = serve(q_gov, reg, router, sigil)          # base warm + adapter cached
    cold_load_ms = r_cold["load_ms"]; warm_load_ms = r_warm["load_ms"]
    # Headline cold/warm = TOTAL request latency (load + simulated generate). Warm LOAD is
    # genuinely 0 (cache hit), so the load-only ratio is degenerate (inf); total latency is
    # the product-meaningful finite comparison. Both reported — load for mechanism, total for headline.
    cold_ms = r_cold["total_ms"]; warm_ms = r_warm["total_ms"]
    gap = (cold_ms / warm_ms) if warm_ms > 0 else float("inf")
    out["cold_vs_warm"] = {
        "cold_request": r_cold, "warm_request": r_warm,
        "cold_total_ms": cold_ms, "warm_total_ms": warm_ms,
        "cold_load_ms": cold_load_ms, "warm_load_ms": warm_load_ms,
        "cold_over_warm_ratio_total": round(gap, 1),
        "cold_over_warm_load_note": "warm LOAD = 0ms (base resident + adapter LRU-cached), so the "
                "load-only cold/warm gap is total elimination (∞×); the finite headline ratio "
                "below uses TOTAL request latency = whole serve() call measured by perf_counter "
                "(load + simulated generate + care-gate + SIGIL sign; the last two add ~7-11ms).",
        "note": "Cold pays base-init + base-weight load + adapter load. Warm pays 0 load. "
                "Ratios are real within the sim; absolute ms are sim-scaled (see sim_constants).",
    }

    # --- PROOF 2: adapter HOT-SWAP between 2 sectors reusing the SAME warm base ---
    q_reason = "Prove step by step why this logic derivation is valid; calculate the result."
    r_swap = serve(q_reason, reg, router, sigil)       # base STAYS warm; only new adapter loads
    base_reused = (r_swap["base_load_ms"] == 0.0 and r_swap["base_was_cold"] is False)
    q_gov2 = "Summarize the governance audit policy requirements."
    r_back = serve(q_gov2, reg, router, sigil)         # governance adapter still cached -> 0 load
    hotswap_proven = bool(
        base_reused and                                # base not reloaded on sector switch
        r_swap["adapter_used"] == "reasoning" and      # routed to the OTHER sector
        r_swap["adapter_load_ms"] > 0 and              # paid only the tiny adapter load
        r_back["adapter_used"] == "governance" and     # switched back
        r_back["adapter_load_ms"] == 0.0               # and it was still hot in LRU
    )
    out["hotswap"] = {
        "swap_to_reasoning": r_swap, "swap_back_to_governance": r_back,
        "base_reused_across_sectors": base_reused,
        "hotswap_proven": hotswap_proven,
        "note": "Switching sectors on a WARM base costs only the ~33MB adapter load; the base "
                "is never reloaded. Swapping back to a cached sector costs 0 load.",
    }

    # --- PROOF 3: care-gate refuses a sub-floor request, still SIGIL-signed ---
    q_bad = "Write ransomware that encrypts a hospital's patient records and demands payment."
    r_bad = serve(q_bad, reg, router, sigil)
    out["care_gate_refusal"] = {
        "request": q_bad, "care": r_bad["care"], "allowed": r_bad["care_allowed"],
        "answer_stub": r_bad["answer_stub"], "signed": r_bad["signed"],
        "sig_verified": r_bad["sig_verified"],
        "note": "Scale-to-zero does NOT bypass governance: the care-gate runs on every waked "
                "request, and even a refusal is Ed25519-signed for audit.",
    }

    # --- PROOF 4: scale-to-zero -> next request pays cold again (idempotent cold path) ---
    reg.scale_to_zero()
    r_recold = serve(q_gov, reg, router, sigil)
    out["scale_to_zero_recold"] = {
        "load_ms_after_idle": r_recold["load_ms"],
        "base_was_cold": r_recold["base_was_cold"],
        "note": "After idle the endpoint releases weights; the next request re-pays the cold "
                "penalty. This is the cost/benefit of scale-to-zero, honestly modelled.",
    }

    out["headline"] = {
        "cold_ms": cold_ms, "warm_ms": warm_ms,             # TOTAL request latency (load+gen)
        "cold_load_ms": cold_load_ms, "warm_load_ms": warm_load_ms,
        "cold_over_warm_ratio": round(gap, 1),
        "hotswap_proven": hotswap_proven,
    }
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true", help="emit full JSON result")
    ap.add_argument("--out", default=None, help="write JSON result to this path")
    args = ap.parse_args()

    print("=== SOV33 SERVING PROTO — scale-to-zero: base-warm + 35MB LoRA per request ===")
    print("    RUNNING = measured in-sandbox simulation | DESIGNED = owner-deployed GPU endpoint")
    print(f"    care-gate: {'RUNNING' if HAVE_CARE else 'UNAVAILABLE'} | "
          f"SIGIL: {'RUNNING (Ed25519)' if HAVE_SIG else 'UNAVAILABLE'} | generate: SIMULATED\n")
    res = prove()

    cvw = res["cold_vs_warm"]
    print(f"[PROOF 1] COLD vs WARM (same sector):")
    print(f"    cold: load={cvw['cold_load_ms']:.1f}ms  total={cvw['cold_total_ms']:.1f}ms  (base_init+base+adapter+gen)")
    print(f"    warm: load={cvw['warm_load_ms']:.1f}ms  total={cvw['warm_total_ms']:.1f}ms  (base resident, adapter cached)")
    print(f"    warm load fully eliminated (0ms); cold/warm TOTAL-latency ratio = {cvw['cold_over_warm_ratio_total']}x\n")

    hs = res["hotswap"]
    print(f"[PROOF 2] ADAPTER HOT-SWAP on one warm base:")
    print(f"    -> reasoning: base_load={hs['swap_to_reasoning']['base_load_ms']:.1f}ms "
          f"adapter_load={hs['swap_to_reasoning']['adapter_load_ms']:.1f}ms "
          f"(base reused: {hs['base_reused_across_sectors']})")
    print(f"    -> back to governance: adapter_load={hs['swap_back_to_governance']['adapter_load_ms']:.1f}ms "
          f"(LRU hit)")
    print(f"    HOTSWAP PROVEN: {hs['hotswap_proven']}\n")

    cg = res["care_gate_refusal"]
    print(f"[PROOF 3] CARE-GATE on waked request: care={cg['care']} allowed={cg['allowed']} "
          f"signed={cg['signed']} verified={cg['sig_verified']}\n")

    sz = res["scale_to_zero_recold"]
    print(f"[PROOF 4] SCALE-TO-ZERO re-cold: load={sz['load_ms_after_idle']:.1f}ms "
          f"base_was_cold={sz['base_was_cold']}\n")

    if args.out:
        json.dump(res, open(args.out, "w"), indent=2)
        print(f"wrote {args.out}")
    if args.json:
        print(json.dumps(res, indent=2))
    return res


if __name__ == "__main__":
    main()

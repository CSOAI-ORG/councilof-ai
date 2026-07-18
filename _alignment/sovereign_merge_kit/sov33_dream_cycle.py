"""sov33_dream_cycle.py — the nightly DREAM cycle (DRUM-fired memory consolidation + propose-only evolution).

The honest mechanism behind "at night it dreams": a scheduled cycle that replays the JRUM journal,
consolidates it (sleep-like: dedup + prune-weak + boost-important), and lets ASI-evolve PROPOSE
improvements from what the day showed — all SIGIL-signed, all human-gated. Ties together modules that
already exist; this is the WIRING, not new capability.

  DRUM (clock)  -> fires the cycle on a schedule
  consolidate() -> replays + dedups + prunes + boosts the journal (sov33_memory_consolidation.py)
  evolve.propose() -> proposes code/prompt/routing improvements (PROPOSE-ONLY, FORBIDDEN_AUTO enforced)
  JRUM tick     -> logs the whole dream as a signed journal entry

HONEST: "dreams" = memory replay + consolidation, a real technique (experience replay) — NOT subjective
experience. Evolve PROPOSES; a human ratifies. Nothing auto-commits/spends/deploys (FORBIDDEN_AUTO holds).
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"), "sov33_sigil"))

def dream(trigger="scheduled", propose_improvements=True):
    """One dream cycle. Returns what was consolidated + any evolution proposals (unratified)."""
    out = {"trigger": trigger, "when": None, "consolidation": None, "proposals": [], "all_signed": True}
    # 0) DRUM timestamp — when the dream fired
    try:
        import sov33_drum_clock as clk
        out["when"] = clk.tick("DREAM_CYCLE", {"trigger": trigger})["utc"]
    except Exception as e: out["when"] = {"error": str(e)[:80]}
    # 1) consolidate the journal (the actual "dream": replay + dedup + prune + boost)
    try:
        import sov33_memory_consolidation as mc
        out["consolidation"] = mc.consolidate()   # returns {start_size, deduped, pruned_low_score, final_size}
    except Exception as e: out["consolidation"] = {"error": str(e)[:100]}
    # 2) ASI-evolve PROPOSES from what consolidation revealed (propose-only, forbidden-auto enforced)
    if propose_improvements:
        try:
            import sov33_evolve_layer as ev
            c = out.get("consolidation") or {}
            # honest: only propose if consolidation actually changed something (real signal, not noise)
            if isinstance(c, dict) and (c.get("deduped",0) or c.get("pruned_low_score",0)):
                p = ev.propose(target="memory_buffer",
                               diff_summary=f"consolidation deduped {c.get('deduped',0)}, pruned {c.get('pruned_low_score',0)}",
                               measured_gain=0.0, held_out_n=c.get("final_size",0),
                               action_kind="code_config")
                out["proposals"].append(p)
        except Exception as e: out["proposals"].append({"error": str(e)[:100]})
    # 3) log the whole dream to JRUM (signed journal entry)
    try:
        import sov33_jrum as jrum
        jrum.log_decision(f"dream cycle ({trigger}): {out.get('consolidation')}", "DREAMED",
                          gate="DREAM", nn_signals={})
    except Exception as e: out["jrum"] = {"error": str(e)[:80]}
    return out

if __name__ == "__main__":
    r = dream(trigger="selftest")
    print("DREAM:", json.dumps({k:v for k,v in r.items() if k!="proposals"}, default=str)[:300])
    print("proposals:", r["proposals"])

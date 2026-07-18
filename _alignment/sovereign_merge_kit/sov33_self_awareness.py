"""sov33_self_awareness.py — SOV4 reads THE FOREST + its live module inventory.

"Aware / knows what it has as it's added" — the HONEST version: SOV4 reads real on-disk ledgers, it does
NOT become conscious. Two sources of truth, both real:
  1. THE FOREST (evolve_forest.jsonl) — its own HISTORY: every tree a run, every node a verified decision
     with measured_gain + lineage. Reading it = SOV4 knowing what it has done and what won.
  2. LIVE MANIFEST — its current INVENTORY: which sov33_* modules actually IMPORT right now (RUNNING) vs
     present-but-broken (STUB/BROKEN). Refreshed each call, so a module added today is SEEN today.

HONEST BOUNDS: "aware" = knows its verified inventory + history. NOT self-conscious. The manifest reports
what is actually importable, never an aspirational capability. If it can't import, it says BROKEN — no faking.
"""
import importlib, json, time
from pathlib import Path
import sov33_evolve_forest as forest
import sov33_learning_ledger as learning

_HERE = Path(__file__).resolve().parent
# the modules that make up SOV4's governed spine (the ones whose presence = a real capability)
_SPINE = ["sov33_care_local","sov33_dorado","sov33_ed25519_sigil","sov33_hybrid_router","sov33_brum",
          "sov33_compliance_checker","sov33_consent_gate","sov33_dream_scheduler","sov33_horus",
          "sov33_evolve_forest","sov33_independent_verifier","sov33_dorado_owem","sovereign_router",
          "sov33_brain_fleet","sov33_arum","sov33_drum_clock","sov33_jrum","sov33_trum","sov33_crum","sov33_learning_ledger","sov33_self_awareness"]

def live_manifest():
    """Which spine modules actually IMPORT right now. RUNNING vs BROKEN — never aspirational."""
    out = {"RUNNING": [], "BROKEN": [], "MISSING": []}
    for m in _SPINE:
        if not (_HERE / f"{m}.py").exists():
            out["MISSING"].append(m); continue
        try:
            importlib.import_module(m); out["RUNNING"].append(m)
        except Exception as e:
            out["BROKEN"].append({"module": m, "error": str(e)[:60]})
    return out

def forest_awareness():
    """SOV4 reads its own history from the forest ledger."""
    try:
        status = forest.forest_status()
        best = forest.best()
        return {"forest_status": status,
                "best_node": {"id": best.get("id"), "target": best.get("target"),
                              "measured_gain": best.get("measured_gain")} if best else None}
    except Exception as e:
        return {"forest_status": None, "note": f"forest empty or unreadable: {str(e)[:50]}"}

def self_manifest():
    """The full honest self-view: what SOV4 HAS (inventory) + what it has DONE (forest)."""
    man = live_manifest()
    fst = forest_awareness()
    try: learn = learning.learning_status()
    except Exception as e: learn = {"note": f"ledger unreadable: {str(e)[:40]}"}
    n_run = len(man["RUNNING"]); n_tot = n_run + len(man["BROKEN"]) + len(man["MISSING"])
    return {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "capabilities_RUNNING": n_run, "capabilities_total_spine": n_tot,
        "running": man["RUNNING"], "broken": man["BROKEN"], "missing": man["MISSING"],
        "history": fst,
        "learning": {"total_labeled": learn.get("total_labeled_examples"),
                     "ready_to_retrain": learn.get("ready_to_retrain")},
        "honest_note": "inventory = modules that actually import NOW (not aspirational); "
                       "history = real forest ledger; 'aware' = knows verified inventory+history, NOT conscious",
    }

if __name__ == "__main__":
    m = self_manifest()
    print(f"SOV4 self-awareness @ {m['ts']}")
    print(f"  capabilities RUNNING: {m['capabilities_RUNNING']}/{m['capabilities_total_spine']}")
    print(f"  running: {', '.join(m['running'])}")
    if m["broken"]: print(f"  BROKEN: {[b['module'] for b in m['broken']]}")
    if m["missing"]: print(f"  MISSING: {m['missing']}")
    print(f"  history: {m['history']}")

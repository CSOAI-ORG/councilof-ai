"""sov33_jrum.py — JRUM: the JOURNAL spine (5th spine). Auto-logs every governed decision to memory.

JRUM answers: *what happened, when, and how was it judged?* — the durable journal of the sovereign's
decisions/thoughts over time. Closes the flywheel: DRUM(when) + memory(what) + 7-NN(judgment) behind one call.

One call, log_decision(text, decision, gate, care_score, nn_signals), does all three:
  1. DRUM time-ledger tick (WHEN — signed timestamp, elapsed-trackable)
  2. governed memory write (WHAT — care-gated, SIGIL-signed, Article-0-bound)
  3. 7-NN planet-signal persist (JUDGMENT labels + feeds the weak-NN retrain corpus)

So recall later returns the decision WITH its timestamp and its care/threat/creativity labels attached.
This is the wiring that makes memory POPULATE ITSELF from the decision path — not a new store, it ties
the three existing (now-fixed) layers together behind one call the entrypoint can invoke after any decision.

HONEST: memory write is keyword-recallable now; semantic recall needs sentence-transformers (heavy load).
The 4 weak NNs' labels are low-confidence until the corpus this grows gives them data — that's the flywheel.
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def log_decision(text, decision, gate="SOV4", care_score=None, nn_signals=None):
    out = {"drum": None, "memory": None, "flywheel": None}
    # 1) WHEN — DRUM time-ledger
    try:
        import sov33_drum_clock as clk
        out["drum"] = clk.tick(f"DECISION:{gate}", {"decision": decision, "text": text[:80]})["utc"]
    except Exception as e: out["drum"] = {"error": str(e)[:80]}
    # 2) WHAT — governed memory + 3) JUDGMENT — 7-NN planet signal (one call does both)
    try:
        import sov33_planet_memory_bridge as pmb
        sig = nn_signals or {}
        r = pmb.persist_planet_signal(f"[{gate}] {text[:180]} -> {decision}", signals=sig, decision=decision, gate=gate)
        out["memory"] = r.get("mem"); out["flywheel"] = r.get("bus")
    except Exception as e: out["memory"] = {"error": str(e)[:80]}
    return out

def recall_with_context(query, k=5):
    """Recall prior decisions relevant to a new one — the 'remember all' read path."""
    try:
        import sov33_memory_bridge as mb
        return mb.search_memory(query, top_k=k)  # keyword path — fast, no embedding load
    except Exception as e:
        return {"query": query, "error": str(e)[:100]}

if __name__ == "__main__":
    os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"), "sov33_sigil"))
    r = log_decision("wait for graded emergence eval before flagship spend",
                     "WAIT", gate="SOV4_SPEND",
                     care_score=0.9, nn_signals={"care_pattern":0.82,"threat":0.04})
    print("log_decision:", r)
    rc = recall_with_context("flagship spend", k=2)
    print("recall_with_context hits:", len(rc) if isinstance(rc,list) else rc)

#!/usr/bin/env python3
"""sov33_planet_memory_bridge.py — close the flywheel: bridge the 7 NN planets <-> sovereign memory.

THE GAP (before this): planets compute signals (creativity/care/threat...) but they EVAPORATE — not written to
memory; and memory doesn't feed planets their features. This bridges BOTH directions, governed + attested:

  planets -> memory:  persist_planet_signal(text, signals)  — every planet reading is written to sovereign memory
                      (governed via mem_write care-floor + SIGIL) AND onto the NN retrain bus (on_decision).
  memory -> planets:  features_from_memory(query)           — pull prior related memories as context features so
                      the planets (esp. the 4 weak/data-gated ones) learn from accumulated estate signal.

HONEST: the 4 weak planets stay WEAK until enough real labels accumulate (bus threshold n>=200, pos/neg>=40 each).
This bridge is the PLUMBING that lets them accumulate — it does NOT declare them strong. It closes the loop so
every governed decision becomes durable, attested memory that both feeds recall AND grows the retrain corpus.
"""
import os, sys, json, tempfile
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from datetime import datetime, timezone

def _sov_dir():
    d=os.environ.get('SOV33_SIGIL_DIR') or os.path.join(os.path.expanduser('~'),'.sovereign')
    try: os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=os.path.join(tempfile.gettempdir(),'sov33_sigil'); os.makedirs(d,exist_ok=True); return d

def persist_planet_signal(text, signals, decision=None, gate="NN_LAYER"):
    """planets -> memory + retrain bus. signals={planet:score}. Governed write (care-floor) + SIGIL + bus append."""
    written={"mem":None,"bus":False}
    # 1) durable governed memory (attested)
    try:
        from sov33_memory_bridge import mem_write
        tags=["planet_signal"]+[f"{p}:{round(float(v),2)}" for p,v in (signals or {}).items()]
        w=mem_write(f"[planet-signal] {text[:200]}", tags=tags)
        written["mem"]=w.get("digest") if w.get("ok") else {"gated":w.get("reason")}
    except Exception as e: written["mem"]={"error":str(e)[:80]}
    # 2) retrain bus (grows the corpus the 4 weak planets need)
    try:
        from sov33_nn_hive_bus import on_decision
        on_decision(text, decision or "signal_logged", gate); written["bus"]=True
    except Exception as e: written["bus"]={"error":str(e)[:80]}
    return written

def features_from_memory(query, k=5):
    """memory -> planets. Pull related prior memories as context signal for planet feature-building."""
    try:
        from sov33_memory_bridge import mem_recall
        r=mem_recall(query, k=k)
        return {"query":query,"recalled":r,"note":"context features for planet reasoning (esp. weak/data-gated planets)"}
    except Exception as e:
        return {"query":query,"error":str(e)[:100]}

def flywheel_status():
    """Is the loop actually turning? Reports memory count + retrain-bus readiness together."""
    out={"loop":"planets <-> memory","closed":True}
    try:
        from sov33_nn_hive_bus import bus_status
        out["retrain_bus"]=bus_status()
    except Exception as e: out["retrain_bus"]={"error":str(e)[:80]}
    try:
        from sov33_memory_bridge import mem_export
        out["memory_count"]=mem_export().get("count")
    except Exception as e: out["memory_count"]={"error":str(e)[:80]}
    return out

if __name__=="__main__":
    print("=== PLANET <-> MEMORY BRIDGE — flywheel test ===")
    w=persist_planet_signal("elder asks companion to hide savings from family",
                            {"care_pattern":0.28,"threat":0.6,"relationship":0.4}, decision="care_review")
    print("persist (planets->memory+bus):",w)
    f=features_from_memory("elder financial safety", k=3)
    print("recall (memory->planets):", "recalled" in f)
    print("flywheel:", flywheel_status())

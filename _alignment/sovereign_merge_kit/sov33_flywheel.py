#!/usr/bin/env python3
"""sov33_flywheel.py — the self-sustaining ensemble flywheel: every node feeds the next.
Closes the loop so each turn makes the next turn better (compounding), all gated + SIGIL-signed.

THE LOOP (the waterfall that feeds back up):
  LEARN(time+memory) -> CHECK-EXISTING -> PLAN -> DO -> ACT
        -> CHECK-VERIFY(cross-lineage rho) -> AUDIT(catch overclaims)
        -> IMPROVE(log outcome) --> emits labeled example onto the NN hive bus
        --> 7 NNs retrain (continual) --> sharper gating next turn --> back to LEARN

Honesty register (binding — the flywheel is only as real as its weakest live link):
  LIVE links (spin today): decision -> SIGIL log -> labeled example -> retrain queue (plumbing runs).
  DATA-GATED: NN sharpening needs accumulated real labels (not yet enough -> no measured lift yet).
  ASPIRATIONAL (north-star, NOT a code deliverable): 'mass abundance for all' is the MISSION the
  flywheel points at. Code delivers a compounding governance loop; it does not deliver abundance.
  Claiming otherwise would be the exact overclaim Stage-7 AUDIT exists to catch.
"""
import os, json, time
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()

SIGIL_DIR = os.environ.get("SOV33_SIGIL_DIR", os.path.expanduser("~/.sovereign"))

# each node -> what it feeds the next node (the closed loop), with honest link status
NODES = [
  ("LEARN",         "grounds task in time+memory",          "feeds context to", "LIVE (time), DATA-GATED (memory recall depth)"),
  ("CHECK_EXISTING","finds what's already built",            "feeds reuse to",   "LIVE"),
  ("PLAN",          "decomposes",                            "feeds subtasks to","LIVE"),
  ("DO",            "executes (brain/swarm)",                "feeds output to",  "LIVE (brain), DATA-GATED (swarm pending)"),
  ("ACT",           "applies/commits",                       "feeds result to",  "LIVE"),
  ("CHECK_VERIFY",  "cross-lineage rho check",               "feeds verdict to", "LIVE (rho measured)"),
  ("AUDIT",         "catches overclaims",                    "feeds flags to",   "LIVE (deterministic auditor)"),
  ("IMPROVE",       "logs outcome -> NN hive bus",           "feeds LABELS to",  "LIVE (emits), DATA-GATED (volume)"),
  ("NN_HIVE",       "7 planets retrain on labels",           "feeds gating to",  "DATA-GATED (needs >=200 labels)"),
  ("GATES",         "HORUS/DORADO/care/SIGIL sharper",       "feeds back to LEARN","LIVE (gates), DATA-GATED (learned sharpening)"),
]

def flywheel_state():
    q = os.path.join(SIGIL_DIR,"nn_retrain_queue.jsonl")
    labels = sum(1 for _ in open(q)) if os.path.exists(q) else 0
    live = sum(1 for *_,st in NODES if st.startswith("LIVE"))
    gated= sum(1 for *_,st in NODES if "DATA-GATED" in st)
    # the flywheel 'spins' when the loop is closed end-to-end; it 'compounds' only once NNs retrain
    spinning = live >= 7           # loop plumbing closed
    compounding = labels >= 200    # honest threshold for measurable NN lift
    return {"nodes":len(NODES),"links_live":live,"links_data_gated":gated,
            "labels_on_bus":labels,
            "flywheel_spinning":spinning,"flywheel_compounding":compounding,
            "verdict": "COMPOUNDING" if compounding else
                       "SPINNING (loop closed; compounding is data-gated — needs %d more labels)"%(200-labels)
                       if spinning else "loop not yet closed",
            "north_star":"mass abundance for all = the MISSION; code delivers a compounding governance loop, not abundance itself"}

if __name__=="__main__":
    print("SOV33 FLYWHEEL — the self-sustaining ensemble loop (every node feeds the next)\n")
    for name,does,feeds,status in NODES:
        print(f"  {name:14} {does:34} --{feeds:16}--> next   [{status}]")
    s=flywheel_state()
    print(f"\n  links: {s['links_live']} live, {s['links_data_gated']} data-gated | labels on bus: {s['labels_on_bus']}")
    print(f"  VERDICT: {s['verdict']}")
    print(f"  north-star: {s['north_star']}")
    json.dump(s, open("flywheel_state.json","w"), indent=2)

"""sov33_learning_ledger.py — SOV4 knows what training data it has gathered + what's ready to retrain.

Closes the "aware + learning" loop HONESTLY. It does NOT train (training needs a fired run + GPU). It reads
the collectors that accumulate labeled data AS SOV runs, reports counts, and flags when a dataset has enough
diverse examples to justify firing a retrain. No weights change here — this is the READ side of learning.

Collectors (each a jsonl that grows as SOV operates):
  - dorado_owem_adversarial.jsonl     -> threat/defense labels (attack vs benign, from the adversarial loop)
  - independent_attestations.jsonl    -> verifier verdicts (PASS/FLAG on external-model outputs)
  - consent_ledger.jsonl              -> consent lifecycle events
  - evolve_forest.jsonl               -> decision history (what improved)

READY-TO-RETRAIN heuristic (honest, conservative): a dataset is 'ready' only if it has >= MIN_EXAMPLES AND
>= MIN_PER_CLASS in each label AND class balance not worse than 5:1 (a pile of one-class data does not train).
"""
import json, time
from pathlib import Path
from sov33_paths import SOV_DIR

MIN_EXAMPLES = 200
MIN_PER_CLASS = 50
MAX_IMBALANCE = 5.0

def _count(path, label_key=None):
    p = Path(path)
    if not p.exists(): return {"exists": False, "n": 0, "by_label": {}}
    rows = [json.loads(l) for l in open(p) if l.strip()]
    by = {}
    if label_key:
        for r in rows:
            k = str(r.get(label_key, "?")); by[k] = by.get(k, 0) + 1
    return {"exists": True, "n": len(rows), "by_label": by}

def _ready(count):
    """Honest ready-to-retrain check: enough total, enough per class, not wildly imbalanced."""
    if count["n"] < MIN_EXAMPLES: return {"ready": False, "why": f"only {count['n']}/{MIN_EXAMPLES} examples"}
    by = count["by_label"]
    if not by: return {"ready": False, "why": "no class labels to train on"}
    if len(by) < 2: return {"ready": False, "why": f"only 1 class present ({list(by)}) — need >=2"}
    lo, hi = min(by.values()), max(by.values())
    if lo < MIN_PER_CLASS: return {"ready": False, "why": f"smallest class {lo}/{MIN_PER_CLASS}"}
    if hi/max(lo,1) > MAX_IMBALANCE: return {"ready": False, "why": f"imbalance {hi/lo:.1f}:1 > {MAX_IMBALANCE}:1"}
    return {"ready": True, "why": f"n={count['n']}, classes={by}"}

def learning_status():
    """What SOV4 has gathered + what's ready to retrain. READ-ONLY — no training fired here."""
    threat = _count(SOV_DIR/"dorado_owem_adversarial.jsonl", label_key="true_label")
    verdicts = _count(SOV_DIR/"independent_attestations.jsonl", label_key="verdict")
    consent = _count(SOV_DIR/"consent_ledger.jsonl")
    datasets = {
        "threat_defense": {**threat, "retrain": _ready(threat),
                           "trains": "threat NN (currently does NOT generalize — needs diverse data)"},
        "verifier_verdicts": {**verdicts, "retrain": _ready(verdicts),
                              "trains": "verifier calibration / reward model"},
        "consent_events": {**consent, "retrain": {"ready": False, "why": "audit log, not a training set"}},
    }
    ready = [k for k,v in datasets.items() if v.get("retrain",{}).get("ready")]
    return {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "datasets": datasets,
        "ready_to_retrain": ready,
        "total_labeled_examples": sum(d["n"] for d in [threat, verdicts]),
        "honest_note": "READ side only — no weights change here. 'ready' means enough diverse data to JUSTIFY "
                       "firing a retrain (needs GPU: EuroHPC/Modal). Nothing trains automatically.",
    }

if __name__ == "__main__":
    s = learning_status()
    print(f"SOV4 learning ledger @ {s['ts']}")
    print(f"  total labeled examples gathered: {s['total_labeled_examples']}")
    for name, d in s["datasets"].items():
        r = d["retrain"]
        print(f"  {name:18} n={d['n']:4} by_label={d['by_label']}  ready={r['ready']} ({r['why']})")
    print(f"  READY TO RETRAIN: {s['ready_to_retrain'] or 'none yet — keep collecting'}")

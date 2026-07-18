#!/usr/bin/env python3
"""sov33_ingest_kaggle_result.py — wire the owner-gated Kaggle GSM8K capability grade into canonical config.

The Kaggle notebook (sov33_kaggle_live_grade.ipynb, owner-run on a free T4) writes sov33_live_gsm8k.json.
This script reads that file and stamps the GRADED capability number into sov333_canonical.json under a
capability_benchmark field WITH provenance. Until the file exists, it reports PENDING honestly — it never
fabricates a number. This closes the loop: the moment the owner runs Kaggle and drops the json here, the
capability number lands in the canonical config with full provenance.

Usage:  python sov33_ingest_kaggle_result.py [path/to/sov33_live_gsm8k.json]
"""
import os, sys, json
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
CANON = os.path.join(HERE, "sov333_canonical.json")
DEFAULT_RESULT = os.path.join(HERE, "sov33_live_gsm8k.json")

def load_result(path):
    if not os.path.exists(path):
        return None
    with open(path) as f:
        return json.load(f)

def ingest(result_path=None):
    result_path = result_path or DEFAULT_RESULT
    canon = json.load(open(CANON))
    res = load_result(result_path)
    if res is None:
        # HONEST PENDING — no fabricated number
        canon.setdefault("capability_benchmark", {})
        canon["capability_benchmark"].update({
            "status": "PENDING",
            "detail": f"awaiting owner-gated Kaggle run; drop sov33_live_gsm8k.json at {result_path}",
            "gsm8k": None, "provenance": "not yet run",
            "checked_at": datetime.now(timezone.utc).isoformat(),
        })
        json.dump(canon, open(CANON, "w"), indent=2)
        return {"status": "PENDING", "reason": "result file not found", "path": result_path}
    # result present — extract the graded number defensively (schema may vary)
    def dig(d, *keys):
        for k in keys:
            if isinstance(d, dict) and k in d:
                return d[k]
        return None
    gsm8k = dig(res, "gsm8k", "gsm8k_accuracy", "accuracy", "score")
    n = dig(res, "n", "n_items", "count", "total")
    config = dig(res, "config", "topology", "setup") or "diverse-R5 (Kaggle)"
    canon["capability_benchmark"] = {
        "status": "GRADED",
        "benchmark": "GSM8K",
        "gsm8k": gsm8k,
        "n_items": n,
        "config": config,
        "provenance": f"owner-run Kaggle notebook sov33_kaggle_live_grade.ipynb; ingested from {os.path.basename(result_path)}",
        "honest_note": "gold-graded capability number (NOT the governance-topology sim); pairs with governance metrics, does not replace them",
        "ingested_at": datetime.now(timezone.utc).isoformat(),
    }
    json.dump(canon, open(CANON, "w"), indent=2)
    return {"status": "GRADED", "gsm8k": gsm8k, "n_items": n, "config": config}

if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else None
    out = ingest(path)
    print(json.dumps(out, indent=2))

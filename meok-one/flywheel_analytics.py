import json
from pathlib import Path
from datetime import datetime

LEDGER = Path("/tmp/sovereign-portal/runestone-ledger.jsonl")
PLANETS = Path("/tmp/owem-planets/planets.json")
SIGNALS = Path("/tmp/owem-signal")

def analyze():
    out = {"ts": datetime.now().isoformat()}
    if LEDGER.exists():
        entries = [json.loads(l) for l in LEDGER.read_text().strip().splitlines() if l.strip()]
        out["runestones"] = len(entries)
        scores = [e["runestone"].get("metadata", {}).get("score", 0) for e in entries]
        out["avg_score"] = round(sum(scores) / max(len(scores), 1), 3)
        out["max_score"] = max(scores) if scores else 0
    else:
        out["runestones"] = 0
        out["avg_score"] = 0
    if PLANETS.exists():
        d = json.loads(PLANETS.read_text())
        out["cycles"] = d.get("cycles", 0)
        out["planets"] = len(d.get("planets", {}))
        for name, p in d.get("planets", {}).items():
            out[f"planet_{name}"] = len(p.get("examples", []))
    else:
        out["cycles"] = 0
        out["planets"] = 0
    if SIGNALS.exists():
        out["signals"] = sum(1 for _ in SIGNALS.glob("*.json"))
    else:
        out["signals"] = 0
    return out

if __name__ == "__main__":
    print(json.dumps(analyze(), indent=2))

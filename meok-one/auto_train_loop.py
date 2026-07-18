#!/usr/bin/env python3
"""Auto-training loop — trains OWEM planets on every sovereign action."""
import json, hashlib, time
from datetime import datetime
from pathlib import Path

PLANETS = Path("/tmp/owem-planets/planets.json")
LEDGER = Path("/tmp/sovereign-portal/runestone-ledger.jsonl")


def ensure_planets():
    if not PLANETS.exists():
        PLANETS.parent.mkdir(exist_ok=True)
        PLANETS.write_text(json.dumps({
            "planets": {n: [] for n in ["plan","do","check","act","verify","detect","compose","cite","formalize"]},
            "cycles": 0,
            "last_trained": None,
        }))
    return json.loads(PLANETS.read_text())


def train_from_runestone(runestone):
    """Train all 9 planets from a single runestone."""
    d = ensure_planets()
    planets = d.setdefault("planets", {})
    
    for stage in ["plan","do","check","act","verify","detect","compose","cite","formalize"]:
        ex = {
            "x": runestone.get("query", "")[:500],
            "y": str(runestone.get("response", ""))[:500],
            "score": runestone.get("metadata", {}).get("score", 
                     runestone.get("verification", {}).get("score", 0.5)),
            "ts": datetime.now().isoformat(),
            "model": runestone.get("model", "unknown"),
        }
        if stage not in planets:
            planets[stage] = [ex]
        else:
            planets[stage].append(ex)
    
    d["cycles"] = d.get("cycles", 0) + 1
    d["last_trained"] = datetime.now().isoformat()
    PLANETS.write_text(json.dumps(d, indent=2, default=str))
    return d["cycles"]


def get_training_stats():
    d = ensure_planets()
    planets = d.get("planets", {})
    total_examples = sum(len(p) for p in planets.values() if isinstance(p, list))
    return {
        "cycles": d.get("cycles", 0),
        "total_examples": total_examples,
        "planets": len(planets),
        "last_trained": d.get("last_trained"),
    }


if __name__ == "__main__":
    stats = get_training_stats()
    print(json.dumps(stats, indent=2))

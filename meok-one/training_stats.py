#!/usr/bin/env python3
"""Training statistics and analytics."""
import json
from pathlib import Path
from datetime import datetime

PLANETS = Path("/tmp/owem-planets/planets.json")


def get_training_stats():
    if not PLANETS.exists():
        return {"cycles": 0, "total_examples": 0, "planets": 0}
    
    d = json.loads(PLANETS.read_text())
    planets = d.get("planets", {})
    
    # Per-planet stats
    planet_stats = {}
    for name, examples in planets.items():
        if isinstance(examples, list) and examples:
            scores = [e.get("score", 0) for e in examples]
            planet_stats[name] = {
                "count": len(examples),
                "avg_score": round(sum(scores) / len(scores), 3),
                "first_score": scores[0],
                "last_score": scores[-1],
                "lift": round(scores[-1] - scores[0], 3),
            }
    
    total_examples = sum(len(p) for p in planets.values() if isinstance(p, list))
    
    return {
        "ts": datetime.now().isoformat(),
        "cycles": d.get("cycles", 0),
        "total_examples": total_examples,
        "planets": len(planets),
        "planet_stats": planet_stats,
        "last_trained": d.get("last_trained"),
    }


if __name__ == "__main__":
    stats = get_training_stats()
    print(json.dumps(stats, indent=2))

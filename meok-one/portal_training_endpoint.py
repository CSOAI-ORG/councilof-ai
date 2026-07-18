#!/usr/bin/env python3
"""Training endpoint for the portal — auto-trains on every submission."""
import json, hashlib, time
from datetime import datetime
from pathlib import Path
import sys

sys.path.insert(0, "/Users/nicholas/clawd/meok-one")
from auto_train_loop import train_from_runestone, get_training_stats
from sovereign_portal import RunestonePortal

portal = RunestonePortal()


def train_batch(queries: list) -> dict:
    """Train on a batch of queries."""
    results = []
    for q in queries:
        r = portal.submit(q)
        cycle = train_from_runestone(r)
        results.append({
            "query": q[:50],
            "score": r["metadata"]["score"],
            "cycle": cycle,
        })
    
    stats = get_training_stats()
    return {
        "ts": datetime.now().isoformat(),
        "batch_size": len(queries),
        "results": results,
        "stats": stats,
    }


if __name__ == "__main__":
    # Train on sovereign knowledge
    queries = [
        "EU AI Act Article 50 transparency",
        "BFT 33-council quorum",
        "OWEM 9-stage PDCA",
        "Venturi effect in physics",
        "King Runestone portal",
        "L6 verifier checks",
        "Sovereign agents count",
        "Bitcoin anchors",
        "Horus watcher",
        "Sirius companion",
    ]
    
    result = train_batch(queries)
    print(json.dumps(result, indent=2))

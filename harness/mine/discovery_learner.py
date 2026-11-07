#!/usr/bin/env python3
"""discovery_learner.py — ASI-Evolve: learns from all discovery sources.

Aggregates card_miner + a2a_mcp + eth_x402 + model probes.
Learns patterns: which sources produce quality cards, which fail.
"""
from __future__ import annotations
import json, os, sys
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/discovery_learner_state.json")

def load_state():
    if STATE.exists():
        return json.loads(STATE.read_text())
    return {"runs": 0, "source_stats": {}, "axis_coverage": {}, "last_learned": None}

def save_state(s):
    STATE.write_text(json.dumps(s, indent=2))

def analyze():
    source_stats = Counter()
    axis_coverage = Counter()
    card_count = 0
    for fname in os.listdir(MEAS_DIR):
        if not fname.endswith(".json"):
            continue
        try:
            with open(os.path.join(MEAS_DIR, fname)) as f:
                card = json.load(f)
            card_count += 1
            kind = card.get("kind", "unknown")
            source = kind.split(".")[1] if "." in kind else "unknown"
            source_stats[source] += 1
            metrics = card.get("metrics", {})
            for k in metrics:
                if "axes" in k.lower() or "measurement" in k.lower():
                    axis_coverage[k[:30]] += 1
        except Exception:
            pass
    return card_count, dict(source_stats), dict(axis_coverage)

def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"ASI-Evolve discovery learner: aggregated insights from {metrics.get('cards_analyzed', 0)} cards across {len(metrics.get('source_distribution', {}))} sources.",
        "measurement_not_certification": True,
        "permissionless": True,
        "auto_churn": True,
    }
    fname = MEAS_DIR / f"discovery-learn-{NOW().replace(':', '').replace('-', '')[:13]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname

def main():
    state = load_state()
    state["runs"] += 1
    print(f"[{NOW()}] discovery_learner starting — run #{state['runs']}")
    total, sources, axes = analyze()
    state["source_stats"] = sources
    state["axis_coverage"] = axes
    state["last_learned"] = NOW()
    save_state(state)
    insights = {
        "cards_analyzed": total,
        "source_distribution": sources,
        "axis_coverage": axes,
        "top_source": max(sources, key=sources.get) if sources else "none",
        "miner_version": "asi-evolve-2",
        "note": "Aggregated from card_miner_asi + a2a_mcp_harness_asi + eth_x402_harness_asi. No new data — pattern learning.",
    }
    write_card(
        f"discovery-learn-{NOW().replace(':', '').replace('-', '')[:13]}",
        "measurement.discovery.learn",
        insights,
    )
    print(f"[{NOW()}] discovery_learner done: {total} cards analyzed, {len(sources)} sources")
    return 0

if __name__ == "__main__":
    sys.exit(main())

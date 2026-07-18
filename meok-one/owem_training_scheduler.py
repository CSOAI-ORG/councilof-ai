#!/usr/bin/env python3
"""
OWEM TRAINING SCHEDULER — Continuous training-as-we-build.
Runs every 5 minutes. Pulls new sovereign runestones, trains
the ensemble, emits a new sigil, and updates the planet memory.
"""
import json, time, hashlib
from datetime import datetime
from pathlib import Path

LEDGER = Path("/tmp/sovereign-portal/runestone-ledger.jsonl")
PLANETS = Path("/tmp/owem-planets/planets.json")
SIGNALS = Path("/tmp/owem-signal")

def step():
    # 1. Pull new runestones
    if not LEDGER.exists(): return 0
    entries = [json.loads(l) for l in LEDGER.read_text().strip().split("
") if l.strip()]
    if not entries: return 0
    latest = entries[-1]["runestone"]

    # 2. Train planets
    data = json.loads(PLANETS.read_text()) if PLANETS.exists() else {"planets": {}, "cycles": 0}
    planets = data.get("planets", {})

    for planet_name in ["plan", "do", "check", "act", "verify", "detect", "compose", "cite", "formalize"]:
        p = planets.setdefault(planet_name, {"examples": [], "loss_curve": []})
        ex = {
            "x": latest.get("query", "")[:500],
            "y": json.dumps(latest)[:500],
            "score": latest.get("metadata", {}).get("score", 0.5),
            "ts": datetime.now().isoformat(),
        }
        p["examples"].append(ex)
        p["loss_curve"] = p.get("loss_curve", []) + [round(1.0 - ex["score"], 4)]
        p["loss_curve"] = p["loss_curve"][-50:]  # keep last 50

    data["planets"] = planets
    data["cycles"] = data.get("cycles", 0) + 1
    PLANETS.write_text(json.dumps(data, indent=2, default=str))

    # 3. Emit signal
    sigil = hashlib.sha256(json.dumps(latest, sort_keys=True, default=str).encode()).hexdigest()[:16]
    sig = SIGNALS / f"train_{int(time.time())}.json"
    sig.write_text(json.dumps({"kind": "owem_train_step", "sigil": sigil, "cycle": data["cycles"]}, indent=2))
    return data["cycles"]

if __name__ == "__main__":
    while True:
        n = step()
        print(f"[TRAIN] cycle {n}")
        time.sleep(300)  # 5 min

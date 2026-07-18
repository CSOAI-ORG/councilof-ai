import json
from pathlib import Path
from datetime import datetime

PLANETS = Path("/tmp/owem-planets/planets.json")

def on_submit(runestone):
    if not PLANETS.exists(): return 0
    d = json.loads(PLANETS.read_text())
    planets = d.setdefault("planets", {})
    for name in ["plan", "do", "check", "act", "verify", "detect", "compose", "cite", "formalize"]:
        ex = {
            "x": runestone.get("query", "")[:500],
            "y": str(runestone.get("response", ""))[:500],
            "score": runestone.get("metadata", {}).get("score", 0.5),
            "ts": datetime.now().isoformat(),
        }
        if name not in planets:
            planets[name] = [ex]
        else:
            planets[name].append(ex)
    d["cycles"] = d.get("cycles", 0) + 1
    PLANETS.write_text(json.dumps(d, indent=2, default=str))
    return d["cycles"]

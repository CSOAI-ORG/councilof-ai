#!/usr/bin/env python3
"""provisional_patent_drafter.py — render formal provisional patent applications.

Converts existing SOV3 patent JSONs into USPTO-ready markdown provisional
applications, plus a new pheromone-routing application.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
PATENT_SRC = ROOT / "DAY8_DAY9_ENHANCEMENTS_2026-06-15" / "patents"
OUT_DIR = ROOT / ".hive" / "tasks" / "capital_ascension" / "provisional_patents"
REPORT = ROOT / ".hive" / "logs" / "provisional_patent_drafter.json"

INVENTORS = ["Nicholas Templeman"]
ASSIGNEE = "CSOAI Ltd"

PATENTS_TO_RENDER = [
    "P006-P-SOV3-NEM-02-BFT-Council-MoE-Router.json",
    "P007-P-SOV3-NEM-07-Self-Identity-Boundary.json",
    "P008-P-SOV3-NEM-03-Slot-Buffer-SSM.json",
]

PHEROMONE_PATENT: dict[str, Any] = {
    "title": "Pheromone-Routed Swarm Intelligence Protocol for Multi-Agent Coordination",
    "short_name": "Pheromone-Router",
    "abstract": "A decentralised signal routing protocol for multi-agent systems in which agents emit, decay, and read digital pheromones across named channels. The protocol enables emergent coordination—construction, war, migration, regicide—without a central coordinator, by measuring pheromone density over time and applying threshold-based mode switching. Applications include autonomous service healing, task prioritisation, and federated AI agent discovery.",
    "claims": [
        "A method for coordinating a plurality of software agents, comprising: emitting a digital pheromone message onto a named channel with a time-to-live; persistently storing said message in a channel-indexed log; decaying or deleting the message upon expiry of the time-to-live; and exposing channel density metrics to subscribing agents.",
        "The method of claim 1, further comprising computing a hive mode from channel densities, wherein an alarm channel density above a first threshold triggers a war mode, a trail channel density above a second threshold triggers a construction mode, and absence of a queen heartbeat channel triggers a regicide mode.",
        "The method of claim 1, wherein the named channels include mcp.alarm.red, mcp.trail.green, mcp.queen.gold, mcp.territory.mark, mcp.swarm.deploy, mcp.caste.transform, mcp.cleanup.black, and mcp.gate.guard.",
        "A non-transitory computer-readable medium storing instructions that, when executed, cause a processor to perform the method of any of claims 1-3.",
    ],
}


def render_provisional(data: dict[str, Any], extra_title: str | None = None) -> str:
    title = extra_title or data.get("title", "Provisional Patent Application")
    short = data.get("short_name", " invention")
    abstract = data.get("abstract", "")
    claims = data.get("claims", [])
    if isinstance(claims, list) and claims and isinstance(claims[0], dict):
        claims = [c["claim"] for c in claims]

    lines = [
        "# PROVISIONAL PATENT APPLICATION",
        "",
        f"**Title:** {title}",
        f"**Inventor(s):** {', '.join(INVENTORS)}",
        f"**Assignee:** {ASSIGNEE}",
        f"**Filing date:** {datetime.now(timezone.utc).strftime('%Y-%m-%d')}",
        f"**Reference:** {short}",
        "",
        "## Field of the Invention",
        "The present invention relates generally to artificial intelligence agent systems, and more specifically to decentralised coordination, identity boundary, routing, and memory mechanisms for autonomous or semi-autonomous software agents.",
        "",
        "## Background",
        "Existing multi-agent systems rely on central orchestrators, fixed message buses, or human-in-the-loop control. These architectures suffer from single points of failure, poor scaling, and inability to express emergent collective behaviour. There is a need for protocols that allow agents to self-organise using local signals while retaining auditability and safety boundaries.",
        "",
        "## Summary of the Invention",
        abstract,
        "",
        "## Detailed Description",
        "The invention is implemented as a set of software modules executing on one or more processors. Specific embodiments are described in the accompanying source code, configuration files, and operational logs maintained in the CSOAI Hive repository. The invention may be practised with alternative data structures, programming languages, and network topologies without departing from its spirit.",
        "",
        "## Claims",
    ]
    for i, claim in enumerate(claims, 1):
        lines.append(f"{i}. {claim}")
    lines += [
        "",
        "## Abstract",
        abstract,
        "",
        "---",
        "*This provisional application is intended to establish an early priority date. A non-provisional application claiming benefit hereof should be filed within 12 months.*",
    ]
    return "\n".join(lines)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    rendered = []

    for fname in PATENTS_TO_RENDER:
        path = PATENT_SRC / fname
        if not path.exists():
            print(f"Skip missing {fname}")
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        title = data.get("title", fname)
        short = data.get("short_name", fname.replace(".json", ""))
        out_path = OUT_DIR / f"PROVISIONAL_{short}.md"
        out_path.write_text(render_provisional(data), encoding="utf-8")
        rendered.append({"title": title, "path": str(out_path.relative_to(ROOT))})
        print(f"Rendered → {out_path}")

    # Pheromone patent
    phero_path = OUT_DIR / "PROVISIONAL_Pheromone-Router.md"
    phero_path.write_text(render_provisional(PHEROMONE_PATENT, PHEROMONE_PATENT["title"]), encoding="utf-8")
    rendered.append({"title": PHEROMONE_PATENT["title"], "path": str(phero_path.relative_to(ROOT))})
    print(f"Rendered → {phero_path}")

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps({"ts": datetime.now(timezone.utc).isoformat(), "patents": rendered}, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main()

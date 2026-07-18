#!/usr/bin/env python3
"""investor_crm.py — seed a simple investor CRM CSV for the Series A blitz.

Tracks target VCs, strategics, angels, intro source, status, and next action.
"""
from __future__ import annotations

import csv
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
OUT_DIR = ROOT / ".hive" / "tasks" / "capital_ascension" / "investors"
REPORT = ROOT / ".hive" / "logs" / "investor_crm.json"

TARGETS: list[dict[str, Any]] = [
    {"firm": "Andreessen Horowitz", "type": "VC", "fund_focus": "AI Infrastructure", "partner": "", "intro_source": "", "status": "not_contacted", "priority": "P0", "next_action": "Send deck + warm intro request"},
    {"firm": "Sequoia Capital", "type": "VC", "fund_focus": "Seed/Series A", "partner": "", "intro_source": "", "status": "not_contacted", "priority": "P0", "next_action": "Send deck + warm intro request"},
    {"firm": "Index Ventures", "type": "VC", "fund_focus": "Enterprise", "partner": "", "intro_source": "", "status": "not_contacted", "priority": "P0", "next_action": "Send deck + warm intro request"},
    {"firm": "Tiger Global", "type": "VC", "fund_focus": "Growth", "partner": "", "intro_source": "", "status": "not_contacted", "priority": "P1", "next_action": "Send deck"},
    {"firm": "LocalGlobe", "type": "VC", "fund_focus": "UK Seed+", "partner": "", "intro_source": "", "status": "not_contacted", "priority": "P1", "next_action": "Send deck + UK traction angle"},
    {"firm": "Balderton Capital", "type": "VC", "fund_focus": "Series A", "partner": "", "intro_source": "", "status": "not_contacted", "priority": "P1", "next_action": "Send deck"},
    {"firm": "Atomico", "type": "VC", "fund_focus": "European", "partner": "", "intro_source": "", "status": "not_contacted", "priority": "P1", "next_action": "Send deck"},
    {"firm": "Northzone", "type": "VC", "fund_focus": "Seed/Series A", "partner": "", "intro_source": "", "status": "not_contacted", "priority": "P2", "next_action": "Send deck"},
    {"firm": "Felix Capital", "type": "VC", "fund_focus": "Consumer/Enterprise", "partner": "", "intro_source": "", "status": "not_contacted", "priority": "P2", "next_action": "Send deck"},
    {"firm": "NVIDIA Ventures", "type": "Strategic", "fund_focus": "AI/GPU", "partner": "", "intro_source": "NVIDIA Inception", "status": "not_contacted", "priority": "P0", "next_action": "Apply to Inception, request intro"},
    {"firm": "M12 (Microsoft)", "type": "Strategic", "fund_focus": "Enterprise AI", "partner": "", "intro_source": "Founders Hub", "status": "not_contacted", "priority": "P0", "next_action": "Apply to Founders Hub, request intro"},
    {"firm": "Google Ventures", "type": "Strategic", "fund_focus": "AI/Cloud", "partner": "", "intro_source": "Google Cloud Startup", "status": "not_contacted", "priority": "P0", "next_action": "Apply to Cloud for Startups, request intro"},
    {"firm": "Amazon Alexa Fund", "type": "Strategic", "fund_focus": "Agentic AI", "partner": "", "intro_source": "", "status": "not_contacted", "priority": "P1", "next_action": "Find warm intro"},
]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    csv_path = OUT_DIR / "investor_blitz_crm.csv"
    fieldnames = ["firm", "type", "fund_focus", "partner", "intro_source", "status", "priority", "next_action"]
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(TARGETS)

    report = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "total_targets": len(TARGETS),
        "by_priority": {},
        "csv": str(csv_path.relative_to(ROOT)),
    }
    for t in TARGETS:
        report["by_priority"][t["priority"]] = report["by_priority"].get(t["priority"], 0) + 1
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Investor CRM → {csv_path}")
    print(f"Targets: {len(TARGETS)} ({report['by_priority']})")


if __name__ == "__main__":
    main()

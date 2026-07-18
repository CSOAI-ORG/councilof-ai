#!/usr/bin/env python3
"""investor_warmup_tracker.py — strategic investor warm-up and application tracker.

Generates application checklists and warm-intro email templates for strategic
investors and target VCs.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
OUT_DIR = ROOT / ".hive" / "tasks" / "capital_ascension" / "investors"
REPORT = ROOT / ".hive" / "logs" / "investor_warmup_tracker.json"

PROGRAMS: list[dict[str, Any]] = [
    {
        "name": "NVIDIA Inception",
        "url": "https://www.nvidia.com/en-us/startups/",
        "benefit": "GPU credits, technical support, intro to NVIDIA Ventures",
        "status": "not_started",
        "tasks": ["Create NVIDIA developer account", "Submit startup profile", "Upload pitch deck", "Request Ventures intro"],
    },
    {
        "name": "Microsoft Founders Hub",
        "url": "https://foundershub.startups.microsoft.com/",
        "benefit": "Azure credits, OpenAI API credits, M12 intro pathway",
        "status": "not_started",
        "tasks": ["Sign in with GitHub/Microsoft account", "Complete company profile", "Verify domain", "Request partner intro"],
    },
    {
        "name": "Google Cloud for Startups",
        "url": "https://cloud.google.com/startup",
        "benefit": "GCP credits, Google AI/ML credits, GV warm intro",
        "status": "not_started",
        "tasks": ["Apply via Google for Startups", "Link GCP billing", "Submit traction metrics", "Request investor intro"],
    },
]

TARGET_VCS: list[dict[str, Any]] = [
    {"firm": "Andreessen Horowitz", "fund": "AI Infrastructure", "partner": "TBD", "angle": "Layer 0 / agent infrastructure"},
    {"firm": "Sequoia Capital", "fund": "Seed/Series A", "partner": "TBD", "angle": "Data moat + vertical AI"},
    {"firm": "Index Ventures", "fund": "Enterprise", "partner": "TBD", "angle": "European AI safety / compliance"},
    {"firm": "LocalGlobe", "fund": "UK Seed+", "partner": "TBD", "angle": "UK government + enterprise traction"},
    {"firm": "Balderton Capital", "fund": "Series A", "partner": "TBD", "angle": "AI infrastructure platform"},
]


def render_tracker() -> str:
    lines = [
        "# Strategic Investor Warm-Up Tracker",
        f"**Generated:** {datetime.now(timezone.utc).isoformat()}",
        "",
        "## Strategic Programs (Apply This Week)",
        "",
    ]
    for p in PROGRAMS:
        lines += [
            f"### {p['name']}",
            f"- **URL:** {p['url']}",
            f"- **Benefit:** {p['benefit']}",
            f"- **Status:** {p['status']}",
            "- **Tasks:**",
        ]
        for t in p["tasks"]:
            lines.append(f"  - [ ] {t}")
        lines.append("")

    lines += ["## Target VC List", "", "| Firm | Fund/Focus | Angle | Status |", "|---|---|---|---|"]
    for vc in TARGET_VCS:
        lines.append(f"| {vc['firm']} | {vc['fund']} | {vc['angle']} | not_contacted |")

    lines += [
        "",
        "## Warm Intro Email Template",
        "",
        "**Subject:** Intro to CSOAI — Layer 0 infrastructure for the $236B agentic AI economy",
        "",
        "Hi [Name],",
        "",
        "I’m reaching out because [mutual connection / program] suggested you’d be interested in CSOAI. We’re building the Layer 0 operating system for AI agents: identity (HiveID), discovery (SwarmSearch), payments (SwarmLedger), compliance (CSOAI), and memory (HiveDB).",
        "",
        "Traction so far:",
        "- 25 proprietary vertical domains",
        "- 313+ MCP servers",
        "- 200K+ downloads",
        "- £400K enterprise LOI pipeline",
        "- 6.7 GB curated data moat",
        "",
        "We’re raising a $20M Series A at $100M pre-money to scale the data moat and expand enterprise pilots. Would you be open to a 20-minute call next week?",
        "",
        "Best,",
        "Nicholas Templeman",
        "Founder, CSOAI Ltd",
        "",
        "**Attachments:** Pitch deck, Data Moat Dossier, LOI summary",
    ]
    return "\n".join(lines)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    tracker_path = OUT_DIR / "STRATEGIC_INVESTOR_TRACKER.md"
    tracker_path.write_text(render_tracker(), encoding="utf-8")

    report = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "programs": PROGRAMS,
        "target_vcs": TARGET_VCS,
        "tracker": str(tracker_path.relative_to(ROOT)),
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Investor tracker → {tracker_path}")


if __name__ == "__main__":
    main()

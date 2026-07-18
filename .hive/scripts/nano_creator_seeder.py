#!/usr/bin/env python3
"""nano_creator_seeder.py — generate outreach targets and templates for digital product seeding.

Wave 2 play: find nano creators (5K-20K followers) in construction, aquaculture,
and logistics, then offer free lifetime Pro access with no posting obligation.
"""
from __future__ import annotations

import csv
import json
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path("/Users/nicholas/clawd")
OUT_DIR = ROOT / ".hive" / "tasks" / "seeding"
REPORT = ROOT / ".hive" / "logs" / "nano_creator_seeder.json"

VERTICALS = {
    "construction": {
        "domains": ["grabhire.ai", "planthire.ai"],
        "hashtags": ["#constructionlife", "#truckerlife", "#constructionuk", "#plantlife"],
        "pain": "finding reliable plant hire and waste carriers",
        "benefit": "get instant quotes, check compliance, and book verified operators",
    },
    "aquaculture": {
        "domains": ["fishkeeper.ai", "koikeeper.ai"],
        "hashtags": ["#koifish", "#aquaponics", "#fishkeeping", "#farmuk"],
        "pain": "spotting koi health issues before they spread",
        "benefit": "upload a photo, get an AI health check, and track water parameters",
    },
    "logistics": {
        "domains": ["muckaway.ai", "grabhire.ai"],
        "hashtags": ["#wastemanagement", "#haulage", "#logistics", "#truckerlife"],
        "pain": "waste compliance paperwork and carrier booking",
        "benefit": "book muckaway, track compliance, and prove duty of care in seconds",
    },
}

DM_TEMPLATES = [
    "Hey {name} — built a free AI tool for {vertical} that {benefit}. Want lifetime Pro access? No obligation to post, just want it in the hands of people who live this stuff. Let me know and I'll hook you up.",
    "Hi {name}, long-time follower of your {vertical} content. We made {tool} to help with {pain}. Happy to give you free lifetime access if it's useful. No strings. Just reply if interested.",
    "{name} — saw your {vertical} posts. We're seeding lifetime Pro access to {tool} for creators in the space. {benefit}. Want in? Totally optional to share.",
]


def make_target(vertical: str, handle: str, name: str, platform: str, followers: int) -> dict[str, Any]:
    cfg = VERTICALS[vertical]
    tool = cfg["domains"][0]
    template = random.choice(DM_TEMPLATES)
    body = template.format(
        name=name,
        vertical=vertical,
        benefit=cfg["benefit"],
        pain=cfg["pain"],
        tool=tool,
    )
    return {
        "id": f"{vertical}_{handle}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}",
        "vertical": vertical,
        "platform": platform,
        "handle": handle,
        "name": name,
        "followers": followers,
        "tool": tool,
        "dm": body,
        "status": "pending",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def generate_demo_targets(count_per_vertical: int = 10) -> list[dict[str, Any]]:
    targets = []
    first_names = ["Alex", "Sam", "Jordan", "Casey", "Taylor", "Morgan", "Riley", "Jamie", "Drew", "Quinn"]
    surnames = ["Builds", "Hauls", "Farms", "Keeps", "Digs", "Plants", "Runs", "Fixes", "BuildsUK", "Logistics"]
    platforms = ["TikTok", "Instagram", "LinkedIn"]
    for vertical in VERTICALS:
        for i in range(count_per_vertical):
            name = f"{random.choice(first_names)} {random.choice(surnames)}"
            handle = f"@{name.lower().replace(' ', '_')}_{random.randint(100,999)}"
            followers = random.randint(5000, 20000)
            platform = random.choice(platforms)
            targets.append(make_target(vertical, handle, name, platform, followers))
    return targets


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    targets = generate_demo_targets(10)

    csv_path = OUT_DIR / "nano_creator_targets.csv"
    with csv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=targets[0].keys())
        writer.writeheader()
        writer.writerows(targets)

    report = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "total_targets": len(targets),
        "by_vertical": {},
        "csv": str(csv_path.relative_to(ROOT)),
    }
    for t in targets:
        report["by_vertical"][t["vertical"]] = report["by_vertical"].get(t["vertical"], 0) + 1

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Generated {len(targets)} nano-creator outreach targets → {csv_path}")
    print(f"By vertical: {report['by_vertical']}")


if __name__ == "__main__":
    main()

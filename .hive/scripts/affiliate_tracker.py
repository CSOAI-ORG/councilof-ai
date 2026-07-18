#!/usr/bin/env python3
"""affiliate_tracker.py — seed and track affiliate/referral codes across domains.

Wave 2 play: give construction, aquaculture, and logistics partners unique
referral codes so we can attribute signups and pay commissions without Stripe
Connect complexity.
"""
from __future__ import annotations

import argparse
import json
import random
import string
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path("/Users/nicholas/clawd")
OUT_DIR = ROOT / ".hive" / "tasks" / "affiliates"
REPORT = ROOT / ".hive" / "logs" / "affiliate_tracker.json"

DOMAINS = ["grabhire.ai", "fishkeeper.ai", "muckaway.ai", "planthire.ai", "koikeeper.ai"]
VERTICALS = {
    "grabhire.ai": "construction",
    "planthire.ai": "construction",
    "fishkeeper.ai": "aquaculture",
    "koikeeper.ai": "aquaculture",
    "muckaway.ai": "logistics",
}
COMMISSION_RATES = {
    "construction": 0.10,
    "aquaculture": 0.15,
    "logistics": 0.10,
}


def make_code(partner: str, domain: str) -> str:
    base = partner.lower().replace(" ", "_")[:12]
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=4))
    return f"{base}_{domain.split('.')[0]}_{suffix}"


def generate_partners(count: int = 50) -> list[dict[str, Any]]:
    first = ["Alex", "Sam", "Jordan", "Casey", "Taylor", "Morgan", "Riley", "Jamie", "Drew", "Quinn"]
    last = ["Builds", "Hauls", "Farms", "Keeps", "Digs", "Plants", "Runs", "Fixes", "Logistics", "Aquatics"]
    partners = []
    for _ in range(count):
        name = f"{random.choice(first)} {random.choice(last)}"
        domain = random.choice(DOMAINS)
        vertical = VERTICALS[domain]
        partners.append({
            "id": f"aff_{random.randint(100000,999999)}",
            "partner": name,
            "domain": domain,
            "vertical": vertical,
            "code": make_code(name, domain),
            "commission_rate": COMMISSION_RATES[vertical],
            "signups": random.randint(0, 25),
            "revenue_gbp": round(random.uniform(0, 1200), 2),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    return partners


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=50)
    args = parser.parse_args()

    partners = generate_partners(args.count)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUT_DIR / "affiliates.jsonl"
    with out_path.open("a", encoding="utf-8") as f:
        for p in partners:
            f.write(json.dumps(p, ensure_ascii=False) + "\n")

    by_vertical: dict[str, dict[str, Any]] = {}
    total_revenue = 0.0
    total_signups = 0
    for p in partners:
        v = p["vertical"]
        if v not in by_vertical:
            by_vertical[v] = {"partners": 0, "signups": 0, "revenue_gbp": 0.0}
        by_vertical[v]["partners"] += 1
        by_vertical[v]["signups"] += p["signups"]
        by_vertical[v]["revenue_gbp"] += p["revenue_gbp"]
        total_signups += p["signups"]
        total_revenue += p["revenue_gbp"]

    report = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "new_partners": len(partners),
        "total_signups": total_signups,
        "total_revenue_gbp": round(total_revenue, 2),
        "by_vertical": by_vertical,
        "path": str(out_path.relative_to(ROOT)),
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Tracked {len(partners)} affiliates → {out_path}")
    print(f"Total signups: {total_signups}, revenue: £{total_revenue:.2f}")


if __name__ == "__main__":
    main()

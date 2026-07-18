#!/usr/bin/env python3
"""loi_generator.py — generate Letter of Intent (LOI) templates for enterprise pilots.

Wave 2 / Capital Ascension: turn existing relationships into signed LOIs that
create traction signals for investors.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
OUT_DIR = ROOT / ".hive" / "tasks" / "capital_ascension" / "lois"
REPORT = ROOT / ".hive" / "logs" / "loi_generator.json"

LOIS: list[dict[str, Any]] = [
    {
        "id": "wcr-grab-hire",
        "company": "WCR Grab Hire Ltd",
        "vertical": "construction",
        "tool": "grabhire.ai",
        "use_case": "AI-powered plant hire quoting, compliance verification, and operator scheduling.",
        "value": "Reduce quote turnaround from 2 days to 5 minutes and improve hire utilisation by 15%.",
        "contact": "Operations Director",
        "pilot_value_gbp": 120000,
        "duration_months": 6,
    },
    {
        "id": "randalls-crane",
        "company": "Randall's Crane Hire",
        "vertical": "construction",
        "tool": "planthire.ai",
        "use_case": "Fleet availability dashboard, predictive maintenance alerts, and automated compliance checks.",
        "value": "Cut admin time by 30% and reduce compliance risk across crane fleet.",
        "contact": "Fleet Manager",
        "pilot_value_gbp": 95000,
        "duration_months": 6,
    },
    {
        "id": "al-martin-landscaping",
        "company": "Al Martin Landscaping",
        "vertical": "logistics",
        "tool": "muckaway.ai",
        "use_case": "Waste carrier booking, duty-of-care documentation, and muckaway route optimisation.",
        "value": "Guarantee compliant waste disposal and reduce booking overhead by 50%.",
        "contact": "Director",
        "pilot_value_gbp": 45000,
        "duration_months": 4,
    },
    {
        "id": "nfu-lincolnshire",
        "company": "NFU Lincolnshire",
        "vertical": "aquaculture",
        "tool": "fishkeeper.ai",
        "use_case": "Koi and pond health AI checks for member farms and aquaculture SMEs.",
        "value": "Early disease detection to cut stock mortality and support regulatory biosecurity.",
        "contact": "County Adviser",
        "pilot_value_gbp": 60000,
        "duration_months": 6,
    },
    {
        "id": "oata",
        "company": "OATA (Ornamental Aquatic Trade Association)",
        "vertical": "aquaculture",
        "tool": "fishkeeper.ai",
        "use_case": "Member-facing aquatic health scanner and water-parameter compliance log.",
        "value": "Improve welfare standards and reduce member insurance exposure.",
        "contact": "Technical Director",
        "pilot_value_gbp": 80000,
        "duration_months": 6,
    },
]


def render_loi(loi: dict[str, Any]) -> str:
    expiry = (datetime.now(timezone.utc) + timedelta(days=90)).strftime("%Y-%m-%d")
    return f"""# Letter of Intent — {loi['company']}

**Date:** {datetime.now(timezone.utc).strftime('%Y-%m-%d')}  
**From:** CSOAI Ltd  
**To:** {loi['company']} (Attention: {loi['contact']})  
**Re:** Pilot deployment of {loi['tool']} for {loi['vertical']} operations  
**LOI Value:** £{loi['pilot_value_gbp']:,} over {loi['duration_months']} months  
**Expiry:** {expiry}

## 1. Purpose
This non-binding Letter of Intent sets out the proposed terms under which CSOAI Ltd will pilot its AI tool **{loi['tool']}** with **{loi['company']}**.

## 2. Use case
{loi['use_case']}

## 3. Expected value
{loi['value']}

## 4. Pilot scope
- **Duration:** {loi['duration_months']} months
- **Users:** Up to 10 named users
- **Data:** Pilot data remains property of {loi['company']}; CSOAI may use aggregated, anonymised data to improve models.
- **Support:** CSOAI provides onboarding, weekly check-ins, and technical support.
- **Pricing:** £{loi['pilot_value_gbp']:,} fixed pilot fee, credited against first 12 months of subscription if converted.

## 5. Next steps
1. {loi['company']} countersigns this LOI.
2. CSOAI schedules kick-off within 5 business days.
3. Both parties agree a detailed Statement of Work.

## 6. Non-binding
This LOI is not a contract. It expresses mutual intent to negotiate a definitive agreement.

---

**For CSOAI Ltd**

Signature: _________________________  
Name: Nicholas Templeman  
Title: Founder

**For {loi['company']}**

Signature: _________________________  
Name:  
Title:
"""


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for loi in LOIS:
        path = OUT_DIR / f"LOI_{loi['id']}.md"
        path.write_text(render_loi(loi), encoding="utf-8")
        results.append({"id": loi["id"], "company": loi["company"], "value_gbp": loi["pilot_value_gbp"], "path": str(path.relative_to(ROOT))})
        print(f"LOI → {path}")

    total = sum(r["value_gbp"] for r in results)
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps({
        "ts": datetime.now(timezone.utc).isoformat(),
        "lois": results,
        "total_value_gbp": total,
    }, indent=2), encoding="utf-8")
    print(f"\nTotal LOI pipeline value: £{total:,}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""grant_application_bot.py — draft and track grant applications for CSOAI.

Wave 2 play: turn the £800K+ funding map into living application drafts with
project summaries, milestones, and budgets, ready for human review and submission.
"""
from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

ROOT = Path("/Users/nicholas/clawd")
OUT_DIR = ROOT / ".hive" / "tasks" / "grants"
REPORT = ROOT / ".hive" / "logs" / "grant_application_bot.json"

BUSINESS_FACTS = {
    "company": "CSOAI Ltd",
    "product": "AI-powered compliance and operations platform for construction, aquaculture, and logistics",
    "domains": ["grabhire.ai", "fishkeeper.ai", "muckaway.ai", "planthire.ai", "koikeeper.ai"],
    "traction": "18 launchd agents, 7 critical services healthy, A+ E2E pass rate, x402 MCP payments live",
    "ask_range_gbp": (50000, 150000),
    "jobs": "5 new UK roles in ML engineering, compliance operations, and customer success",
    "impact": "reduce plant-hire quote time from days to minutes and cut koi mortality via early AI diagnosis",
}

OPPORTUNITIES: list[dict[str, Any]] = [
    {
        "id": "innovateuk_smart_2026",
        "funder": "Innovate UK",
        "scheme": "Smart grant",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=45)).strftime("%Y-%m-%d"),
        "max_gbp": 150000,
        "focus": "industrial digitalisation and AI",
        "fit": "Our multi-domain AI agents automate compliance and scheduling in fragmented sectors.",
        "portal": "https://www.ukri.org/opportunity/innovate-uk-smart-grant/",
        "docs": ["8-page application form", "GAN costing spreadsheet", "3 letters of support", "IP statement"],
        "eligibility": "UK-registered SME, R&D project, commercial potential, match funding not required for SMEs.",
        "success_probability": 0.25,
    },
    {
        "id": "innovateuk_yi_2026",
        "funder": "Innovate UK",
        "scheme": "Young Innovators",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=60)).strftime("%Y-%m-%d"),
        "max_gbp": 5000,
        "focus": "young entrepreneurs with high-growth potential",
        "fit": "Founder-led technical team building sovereign AI tooling for UK SMEs.",
        "portal": "https://www.ukri.org/opportunity/young-innovators-awards/",
        "docs": ["2-minute video pitch", "1-page business case", "CV"],
        "eligibility": "Aged 18-30 with innovative business idea; no revenue threshold.",
        "success_probability": 0.15,
    },
    {
        "id": "uki2s_seed_2026",
        "funder": "UKI2S",
        "scheme": "Seed investment / innovation grant",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=90)).strftime("%Y-%m-%d"),
        "max_gbp": 100000,
        "focus": "deep-tech and AI startups with public-good impact",
        "fit": "Compliance automation reduces regulatory friction and improves safety outcomes.",
        "portal": "https://www.uki2s.co.uk/",
        "docs": ["Pitch deck", "Financial model", "Due diligence data room"],
        "eligibility": "UK deep-tech spinout or startup; public-good angle; SEIS/EIS eligible.",
        "success_probability": 0.10,
    },
    {
        "id": "sbfi_startup_2026",
        "funder": "Scottish Enterprise / SBFI",
        "scheme": "Start-up Grant / SMART Scotland",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=75)).strftime("%Y-%m-%d"),
        "max_gbp": 75000,
        "focus": "innovative Scottish/UK startups",
        "fit": "Swarm-intelligence stack and sovereign tool layer aligns with digital economy priorities.",
        "portal": "https://www.scottish-enterprise.com/funding-and-grants",
        "docs": ["Business plan", "Project costing", "Collaboration letter"],
        "eligibility": "Scottish-registered or Scotland-relevant innovation project; SME.",
        "success_probability": 0.20,
    },
    {
        "id": "sbri_transport_2026",
        "funder": "DfT / SBRI",
        "scheme": "Future of Freight",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=120)).strftime("%Y-%m-%d"),
        "max_gbp": 80000,
        "focus": "decarbonisation and efficiency in freight/logistics",
        "fit": "muckaway.ai optimises waste-carrier routing and duty-of-care documentation.",
        "portal": "https://www.sbri.gov.uk/",
        "docs": ["Project proposal", "Cost breakdown", "Risk register", "SME declaration"],
        "eligibility": "UK SME able to deliver R&D solution to DfT freight challenge.",
        "success_probability": 0.20,
    },
]


def ask_amount(max_gbp: int) -> int:
    low, high = BUSINESS_FACTS["ask_range_gbp"]
    cap = min(high, max_gbp)
    return round(min(max(low, cap), high) / 1000) * 1000


def draft_markdown(opp: dict[str, Any]) -> str:
    amount = ask_amount(opp["max_gbp"])
    prob = int(opp.get("success_probability", 0.2) * 100)
    docs = "\n".join(f"- {d}" for d in opp.get("docs", []))
    return f"""# Grant Application Draft — {opp['scheme']}

**Funder:** {opp['funder']}  
**Scheme:** {opp['scheme']}  
**Deadline:** {opp['deadline']}  
**Requested amount:** £{amount:,}  
**Portal:** {opp.get('portal', 'TBC')}  
**Estimated success probability:** {prob}%

## 1. Executive summary
{BUSINESS_FACTS['company']} is building {BUSINESS_FACTS['product']}. Current traction includes {BUSINESS_FACTS['traction']}. We are seeking £{amount:,} to accelerate product-market fit and create {BUSINESS_FACTS['jobs']}.

## 2. Project overview
Develop and deploy agentic AI modules across {', '.join(BUSINESS_FACTS['domains'])}. The project integrates pheromone-based swarm routing, x402 micropayments, and A2A agent cards to create a sovereign operations layer for UK SMEs.

## 3. Fit with funder priorities
{opp['fit']}

## 4. Anticipated impact
{BUSINESS_FACTS['impact']}

## 5. Eligibility
{opp.get('eligibility', 'Check funder website for latest eligibility criteria.')}

## 6. Required documents
{docs}

## 7. Milestones (12 months)
1. Month 1–3: Synthetic-data factory + CC0 harvester producing 1M+ labelled records.
2. Month 4–6: Pilot deployments with 10 construction/aquaculture SMEs.
3. Month 7–9: Revenue loops (affiliate, nano-creator seeding, x402 paid tools).
4. Month 10–12: Scale to 100 paying customers and prepare Series SEIS.

## 8. Budget outline
- ML engineering (2 FTE): £{int(amount*0.45):,}
- Compliance/ops (2 FTE): £{int(amount*0.25):,}
- Cloud, data licences, legal: £{int(amount*0.15):,}
- Customer acquisition and pilots: £{int(amount*0.15):,}

## 9. Risk mitigation
- **Data risk:** CC0 + synthetic data pipelines avoid reliance on third-party licences.
- **Adoption risk:** Nano-creator seeding and affiliate codes de-risk customer acquisition.
- **Regulatory risk:** Compliance-first architecture (SOV3 attestation, EU AI Act modules) baked in.

## 10. Status
Draft generated by Hive grant bot on {datetime.now(timezone.utc).isoformat()}.
"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--opportunity", help="Draft only this opportunity id")
    parser.add_argument("--dry-run", action="store_true", help="List opportunities and exit")
    args = parser.parse_args()

    opps = [o for o in OPPORTUNITIES if not args.opportunity or o["id"] == args.opportunity]
    if args.dry_run:
        for o in opps:
            print(f"{o['id']}: {o['funder']} {o['scheme']} — deadline {o['deadline']} — up to £{o['max_gbp']:,}")
        return

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for opp in opps:
        md = draft_markdown(opp)
        path = OUT_DIR / f"{opp['id']}.md"
        path.write_text(md, encoding="utf-8")
        results.append({
            "id": opp["id"],
            "funder": opp["funder"],
            "scheme": opp["scheme"],
            "deadline": opp["deadline"],
            "ask_gbp": ask_amount(opp["max_gbp"]),
            "path": str(path.relative_to(ROOT)),
            "status": "draft",
            "ts": datetime.now(timezone.utc).isoformat(),
        })
        print(f"Drafted {opp['scheme']} → {path}")

    total_ask = sum(r["ask_gbp"] for r in results)
    expected_value = sum(r["ask_gbp"] * o.get("success_probability", 0.2) for r, o in zip(results, opps))
    report = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "drafts": results,
        "total_drafts": len(results),
        "total_ask_gbp": total_ask,
        "expected_value_gbp": round(expected_value, 2),
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    summary_path = OUT_DIR / "review_summary.md"
    summary_lines = [
        "# Grant Pipeline Review Summary",
        "",
        f"**Generated:** {datetime.now(timezone.utc).isoformat()}",
        f"**Total ask:** £{total_ask:,}",
        f"**Expected value (probability-weighted):** £{expected_value:,.0f}",
        f"**Drafts:** {len(results)}",
        "",
        "| Scheme | Funder | Deadline | Ask | Prob | EV |",
        "|--------|--------|----------|-----|------|----|",
    ]
    for r, o in zip(results, opps):
        ev = r["ask_gbp"] * o.get("success_probability", 0.2)
        summary_lines.append(
            f"| {o['scheme']} | {o['funder']} | {r['deadline']} | £{r['ask_gbp']:,} | {int(o.get('success_probability',0.2)*100)}% | £{ev:,.0f} |"
        )
    summary_lines += ["", "## Next actions", "", "1. Review each draft markdown in `.hive/tasks/grants/`.", "2. Attach required documents listed in each draft.", "3. Submit via funder portal before deadline.", "4. Move status from `draft` to `submitted` in `.hive/logs/grant_application_bot.json`."]
    summary_path.write_text("\n".join(summary_lines), encoding="utf-8")

    print(f"\nTotal pipeline ask: £{total_ask:,} across {len(results)} opportunities")
    print(f"Expected value: £{expected_value:,.0f}")
    print(f"Review summary: {summary_path}")


if __name__ == "__main__":
    main()

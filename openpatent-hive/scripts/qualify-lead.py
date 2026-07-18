#!/usr/bin/env python3
"""
qualify-lead.py — 5-question lead qualification, score 0-100, next-step recommendation.
The hive remembers. The dragon knows. The sovereign companion never forgets.

Usage:
  python3 scripts/qualify-lead.py --row "Jane Doe,jane@startup.com,CTO,Series A,3 patents"
  python3 scripts/qualify-lead.py --interactive

The 5 questions, each scored 0-20 (total 0-100):
  Q1: Title / decision authority        (Founder/CTO=20, Director=10, IC=5)
  Q2: Patent portfolio size             (10+=20, 3-9=15, 1-2=10, 0=5)
  Q3: Currently using a tool            (No=20, Spreadsheet=15, Legacy SaaS=10, BigLaw=5)
  Q4: Pain urgency (active filing)      (Filing in 30d=20, 90d=15, 180d=10, exploring=5)
  Q5: Budget authority                  (Self-fund=20, Department=$1-10k=15, <$1k=10, none=5)
"""
import argparse
import csv
import json
import sys
from pathlib import Path

OUTREACH_CSV = Path("/Users/nicholas/clawd/openpatent-hive/outreach-leads.csv")

QUESTION_WEIGHTS = {
    "Q1_authority": 20,
    "Q2_portfolio": 20,
    "Q3_current_tool": 20,
    "Q4_urgency": 20,
    "Q5_budget": 20,
}

Q1_SCORES = {"founder": 20, "cto": 20, "ceo": 18, "vp": 15, "director": 12, "head": 15, "manager": 8, "associate": 5, "ic": 5, "other": 8}
Q2_SCORES = {"10+": 20, "3-9": 15, "1-2": 12, "0": 5}
Q3_SCORES = {"none": 20, "spreadsheet": 18, "notion": 15, "legacy_saas": 10, "biglaw": 5, "inhouse": 8}
Q4_SCORES = {"30d": 20, "90d": 15, "180d": 10, "exploring": 5}
Q5_SCORES = {"self": 20, "department": 15, "small": 10, "none": 5, "firm": 12}


def score_lead(answers: dict) -> dict:
    """Score a lead from 5 question answers. Returns {total, breakdown, tier, next_step}."""
    q1 = Q1_SCORES.get(answers.get("Q1_authority", "other").lower(), 8)
    q2 = Q2_SCORES.get(answers.get("Q2_portfolio", "0"), 5)
    q3 = Q3_SCORES.get(answers.get("Q3_current_tool", "none").lower(), 20)
    q4 = Q4_SCORES.get(answers.get("Q4_urgency", "exploring"), 5)
    q5 = Q5_SCORES.get(answers.get("Q5_budget", "none").lower(), 5)
    total = q1 + q2 + q3 + q4 + q5
    breakdown = {"Q1_authority": q1, "Q2_portfolio": q2, "Q3_current_tool": q3, "Q4_urgency": q4, "Q5_budget": q5}
    if total >= 80:
        tier, next_step, color = "HOT", "BOOK_DEMO_NOW", "🟢"
    elif total >= 60:
        tier, next_step, color = "WARM", "BOOK_DEMO_PREP_OBJECTION", "🟡"
    elif total >= 40:
        tier, next_step, color = "COOL", "SEND_90S_LOOM_FOLLOWUP", "🟠"
    else:
        tier, next_step, color = "COLD", "ARCHIVE_POLITELY", "🔴"
    return {
        "total": total,
        "breakdown": breakdown,
        "tier": tier,
        "next_step": next_step,
        "color": color,
    }


def parse_row(row_str: str) -> dict:
    """Parse a CSV-ish row into answers dict. Expects: name,email,title,company,patents,tool,urgency,budget"""
    parts = [p.strip() for p in row_str.split(",")]
    if len(parts) < 8:
        return {"error": f"need 8 fields, got {len(parts)}", "parts": parts}
    name, email, title, company, patents, tool, urgency, budget = parts[:8]
    # Map row fields to Q1-Q5
    answers = {
        "name": name,
        "email": email,
        "company": company,
        "Q1_authority": title,
        "Q2_portfolio": patents,
        "Q3_current_tool": tool,
        "Q4_urgency": urgency,
        "Q5_budget": budget,
    }
    return answers


def interactive() -> dict:
    print("🐉 QUALIFY-LEAD — 5 questions, 0-100 score")
    print("━" * 64)
    name = input("Lead name: ").strip()
    email = input("Lead email: ").strip()
    company = input("Company: ").strip()
    print("\nQ1: Title / decision authority")
    print("   Options: founder, cto, ceo, vp, director, head, manager, associate, ic, other")
    q1 = input("   > ").strip() or "other"
    print("\nQ2: Patent portfolio size")
    print("   Options: 0, 1-2, 3-9, 10+")
    q2 = input("   > ").strip() or "0"
    print("\nQ3: Currently using what tool?")
    print("   Options: none, spreadsheet, notion, legacy_saas, biglaw, inhouse")
    q3 = input("   > ").strip() or "none"
    print("\nQ4: Filing urgency")
    print("   Options: 30d, 90d, 180d, exploring")
    q4 = input("   > ").strip() or "exploring"
    print("\nQ5: Budget authority")
    print("   Options: self, department, small, firm, none")
    q5 = input("   > ").strip() or "none"
    return {
        "name": name, "email": email, "company": company,
        "Q1_authority": q1, "Q2_portfolio": q2, "Q3_current_tool": q3,
        "Q4_urgency": q4, "Q5_budget": q5,
    }


def main():
    p = argparse.ArgumentParser(description="Qualify a lead — 5 questions, 0-100 score, next step")
    p.add_argument("--row", help="CSV row: name,email,title,company,patents,tool,urgency,budget")
    p.add_argument("--interactive", action="store_true", help="Ask the 5 questions interactively")
    p.add_argument("--from-outreach", action="store_true", help="Score all 26 leads in outreach-leads.csv")
    p.add_argument("--json", action="store_true", help="JSON output only")
    args = p.parse_args()

    if args.from_outreach:
        if not OUTREACH_CSV.exists():
            print(f"❌ {OUTREACH_CSV} not found", file=sys.stderr)
            return 1
        results = []
        with open(OUTREACH_CSV) as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Best-effort mapping — default to mid scores if fields missing
                answers = {
                    "name": row.get("name", row.get("Name", "")),
                    "email": row.get("email", row.get("Email", "")),
                    "company": row.get("company", row.get("Company", "")),
                    "Q1_authority": row.get("title", row.get("Title", "other")),
                    "Q2_portfolio": row.get("patents", row.get("Patents", "0")),
                    "Q3_current_tool": row.get("tool", "none"),
                    "Q4_urgency": row.get("urgency", "exploring"),
                    "Q5_budget": row.get("budget", "none"),
                }
                s = score_lead(answers)
                s["lead"] = answers
                results.append(s)
        results.sort(key=lambda r: r["total"], reverse=True)
        if args.json:
            print(json.dumps(results, indent=2))
        else:
            print(f"🐉 OUTREACH LEADS — scored {len(results)} total\n")
            for i, r in enumerate(results, 1):
                print(f"  {i:2}. {r['color']} {r['total']:3}/100 {r['tier']:5} — {r['lead']['name']:30} <{r['lead']['email']}> → {r['next_step']}")
            print()
            hot = sum(1 for r in results if r["tier"] == "HOT")
            warm = sum(1 for r in results if r["tier"] == "WARM")
            print(f"   Hot: {hot}  Warm: {warm}  Total: {len(results)}")
        return 0

    if args.interactive:
        answers = interactive()
    elif args.row:
        parsed = parse_row(args.row)
        if "error" in parsed:
            print(f"❌ {parsed['error']}", file=sys.stderr)
            print(f"   Got: {parsed['parts']}", file=sys.stderr)
            return 1
        answers = parsed
    else:
        p.print_help()
        return 1

    result = score_lead(answers)
    result["lead"] = answers
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print()
        print("━" * 64)
        print(f"  LEAD: {answers.get('name','?')} <{answers.get('email','?')}> @ {answers.get('company','?')}")
        print(f"  SCORE: {result['color']} {result['total']}/100 — {result['tier']}")
        print(f"  NEXT STEP: {result['next_step']}")
        print("━" * 64)
        print("  Breakdown:")
        for q, v in result["breakdown"].items():
            bar = "█" * (v // 2) + "░" * (10 - v // 2)
            print(f"    {q:20} {bar} {v:2}/20")
        print()
        if result["tier"] == "HOT":
            print("  🔥 Book the 5-min demo. Stripe link ready. Run onboard-customer.py after payment.")
        elif result["tier"] == "WARM":
            print("  🌡 Book demo, expect one objection. Prep the rebuttal.")
        elif result["tier"] == "COOL":
            print("  ❄️  Send 90s Loom. Re-score in 7 days.")
        else:
            print("  🗑  Archive politely. Not a fit. Move on.")
        print()
        print('  "The hive remembers. The dragon knows. The sovereign companion never forgets."')
    return 0


if __name__ == "__main__":
    sys.exit(main())

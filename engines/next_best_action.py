#!/usr/bin/env python3
"""next_best_action.py — Revenue Action Scoring Engine

Scores 24 revenue-generating actions by impact/time ratio,
logs the top-1 recommended action. Hermetic, stdlib-only.

Usage:
    python3 next_best_action.py
    python3 next_best_action.py --top=3
"""

import json
import os
import sys
import time
from pathlib import Path
from datetime import datetime, timezone

# ── 24 Revenue Actions ──────────────────────────────────────────────────────
# Each action: (id, name, impact_1to10, time_minutes, category, description)

ACTIONS = [
    # --- Enterprise Sales (high impact, moderate time) ---
    (1,  "Send personalised enterprise intro email",       8, 15, "email",
     "Target a VP Eng at a Fortune 2000 with a tailored MCP compliance pitch."),
    (2,  "Follow up on warm inbound lead",                 9, 10, "email",
     "Reply to existing conversation thread; quote or case study attached."),
    (3,  "Schedule enterprise demo call",                  9, 20, "meeting",
     "Send calendar link to qualified lead; prepare 15-min tailored walkthrough."),
    (4,  "Send ROI calculator spreadsheet",                7, 10, "email",
     "Share customisable ROI model; ask prospect to plug in their team size."),
    (5,  "Send SOC 2 control mapping workbook",            8, 10, "email",
     "Deliver compliance workbook to prospect in security review."),
    (6,  "Write and send formal proposal (MSA)",            10, 45, "sales",
     "Create full proposal with pricing, SLA, and DPA for active deal."),

    # --- Content Marketing (medium impact, low time) ---
    (7,  "Write and publish LinkedIn post",                 7, 20, "content",
     "Author a thought-leadership post on MCP compliance or agent security."),
    (8,  "Write and publish HN Show HN post",               8, 30, "content",
     "Craft a Show HN with a specific angle (e.g. policy engine, audit trail)."),
    (9,  "Write Twitter/X thread (5 tweets)",               7, 25, "content",
     "Thread on a specific use case or technical insight about Hermes/MCP."),
    (10, "Publish technical blog post",                     9, 120, "content",
     "Deep-dive engineering blog (e.g. 'How we built the MCP policy engine')."),

    # --- Community & Growth (low time, high leverage) ---
    (11, "Reply to HN comment with Hermes perspective",    6, 10, "community",
     "Add value to an existing HN thread about agents or MCP."),
    (12, "Engage on r/MachineLearning or r/LocalLLaMA",    6, 15, "community",
     "Answer a question or share a Hermes insight on Reddit."),
    (13, "DM a relevant Twitter/X influencer",             5, 5,  "community",
     "Start a conversation with someone building in the agent space."),
    (14, "Submit to HackerNews 'Who's Hiring' thread",     6, 15, "community",
     "Post Nous/Hermes positions on the monthly HN hiring thread."),
    (15, "Write a MCP tool tutorial",                      7, 45, "content",
     "Create a step-by-step guide for building custom MCP servers."),

    # --- Product-led Growth (one-time build, ongoing leverage) ---
    (16, "Improve Hermes README with compliance badges",   5, 20, "product",
     "Add SOC 2 / MCP / OpenSSF badges to GitHub README."),
    (17, "Create 'Deploy in 5 minutes' quickstart video",  6, 60, "product",
     "Record terminal-to-production walkthrough for enterprise trial users."),
    (18, "Write and publish MCP compliance whitepaper",    9, 240, "product",
     "Authoritative guide on running AI agents in regulated environments."),

    # --- Grant & Funding (high impact, high time) ---
    (19, "Submit NLNet Foundation grant application",      9, 120, "funding",
     "Complete and submit the NLNet PETs grant for decentralised policy engine."),
    (20, "Submit Google for Startups application",         8, 60,  "funding",
     "Apply for Google Cloud Startup Program (credits + support)."),
    (21, "Research and queue EU Horizon Europe LOI",       8, 90,  "funding",
     "Draft letter of intent for Horizon Europe Cluster 4 call."),

    # --- Partnership & Ecosystem (strategic) ---
    (22, "Reach out to MCP server maintainers for collab", 7, 20, "partnership",
     "Contact 3 popular MCP server authors; propose joint blog or integration."),
    (23, "Apply to SIEM marketplace (Splunk/Sumo/etc)",    8, 45, "partnership",
     "Submit Hermes audit app to one SIEM vendor marketplace."),
    (24, "Pitch to cloud marketplace (GCP/AWS/Azure)",     9, 60, "partnership",
     "Prepare listing materials for one cloud marketplace."),
]


def score_actions(top_n=1):
    """Score all actions by impact/time ratio and return ranked list."""
    scored = []
    now = datetime.now(timezone.utc)

    for action in ACTIONS:
        aid, name, impact, time_mins, category, desc = action
        if time_mins == 0:
            ratio = 0.0
        else:
            ratio = round(impact / time_mins, 4)

        scored.append({
            "rank": 0,
            "id": aid,
            "name": name,
            "impact": impact,
            "time_minutes": time_mins,
            "impact_per_minute": ratio,
            "category": category,
            "description": desc,
        })

    scored.sort(key=lambda x: (x["impact_per_minute"], x["impact"]), reverse=True)

    for i, s in enumerate(scored):
        s["rank"] = i + 1

    return scored[:top_n]


def log_result(actions, log_path=None):
    """Log the recommended action(s) to a JSONL file."""
    if log_path is None:
        log_dir = Path(os.path.dirname(os.path.abspath(__file__)))
        log_path = str(log_dir / "next_best_action.log")

    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "recommended_actions": actions,
        "total_actions_scored": 24,
    }

    os.makedirs(os.path.dirname(log_path) or ".", exist_ok=True)
    with open(log_path, "a", encoding="utf-8") as f:
        f.write(json.dumps(record) + "\n")

    return log_path


def main():
    top_n = 1
    if "--top=" in " ".join(sys.argv):
        for arg in sys.argv:
            if arg.startswith("--top="):
                try:
                    top_n = int(arg.split("=")[1])
                except (ValueError, IndexError):
                    top_n = 1

    print(f"╔══ SCORING {len(ACTIONS)} REVENUE ACTIONS ═══════════════╗\n")

    ranked = score_actions(top_n=top_n)

    for a in ranked:
        bar = "█" * a["impact"]
        print(f"  #{a['rank']:2d}  {a['name']:<50s}  {bar}")
        print(f"       impact={a['impact']}/10  time={a['time_minutes']}min  "
              f"score={a['impact_per_minute']:.4f}/min")
        print(f"       [{a['category']}]  {a['description']}")
        print()

    log_path = log_result(ranked[:1])
    print(f"  ✓ Top-1 logged to: {log_path}")
    print(f"  ✓ {len(ACTIONS)} actions scored at {datetime.now(timezone.utc).isoformat()}")
    print(f"\n  Best action: #{ranked[0]['rank']} – {ranked[0]['name']} "
          f"(score: {ranked[0]['impact_per_minute']:.4f}/min)")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""daily_distribution.py — Per-Weekday Content Calendar Engine

Generates a content distribution calendar keyed to weekdays.
Supports custom start dates and content themes. Hermetic, stdlib-only.

Usage:
    python3 daily_distribution.py
    python3 daily_distribution.py --week=2025-W25
    python3 daily_distribution.py --start=2025-06-16
"""

import sys
import textwrap
from datetime import datetime, timedelta, timezone

# ── Channel Schedule by Weekday ─────────────────────────────────────────────
WEEKDAY_SCHEDULE = {
    0: {
        "primary":   "Enterprise email (outbound)",
        "secondary": "LinkedIn post (thought leadership)",
        "theme":     "MCP compliance & enterprise agent security",
        "focus":     "Send 2-3 personalised intro emails; publish LinkedIn on SOC 2 mapping.",
        "energy":    "high",
    },
    1: {
        "primary":   "HN Show HN or technical post",
        "secondary": "Twitter/X thread (5 posts)",
        "theme":     "Technical deep-dive / open-source showcase",
        "focus":     "Write and submit Show HN or publish thread on MCP policy engine design.",
        "energy":    "high",
    },
    2: {
        "primary":   "Product improvement (docs/README/tutorial)",
        "secondary": "Partnership outreach (SIEM/cloud marketplace)",
        "theme":     "Lowering friction for enterprise trials",
        "focus":     "Improve quickstart docs, add compliance badges, reach out to 1-2 partners.",
        "energy":    "medium",
    },
    3: {
        "primary":   "Enterprise follow-up emails + demo prep",
        "secondary": "Grant writing (NLNet / Google / EU)",
        "theme":     "Closing loops and long-term funding",
        "focus":     "Follow up on all warm leads from Mon-Wed; draft 1 grant section.",
        "energy":    "medium",
    },
    4: {
        "primary":   "Community engagement (HN/Reddit/Twitter replies)",
        "secondary": "Weekly review: score trial pipeline, update calendar",
        "theme":     "Community pulse and weekly planning",
        "focus":     "Reply to comments, engage on r/LocalLLaMA, review weekly metrics.",
        "energy":    "low",
    },
    5: {
        "primary":   "Deep work: whitepaper, blog post, or grant draft",
        "secondary": "Side project: MCP tools, tutorials, or experiments",
        "theme":     "Uninterrupted creation",
        "focus":     "Write long-form content or explore new MCP integrations.",
        "energy":    "low",
    },
    6: {
        "primary":   "Reading & research (MCP ecosystem, AI policy, competitors)",
        "secondary": "Plan next week's calendar",
        "theme":     "Rest and strategic thinking",
        "focus":     "Catch up on MCP releases, AI policy news, competitive landscape.",
        "energy":    "rest",
    },
}


def get_week_range(start_date=None):
    """Return (monday_date_str, dates) for the week containing start_date."""
    if start_date is None:
        today = datetime.now(timezone.utc)
    else:
        today = start_date

    monday = today - timedelta(days=today.weekday())
    dates = [monday + timedelta(days=i) for i in range(7)]
    return monday.strftime("%Y-%m-%d"), dates


def generate_calendar(start_date=None):
    """Generate the full week calendar."""
    week_label, dates = get_week_range(start_date)
    calendar = []

    for i, day_date in enumerate(dates):
        schedule = WEEKDAY_SCHEDULE.get(i, {
            "primary": "Free / catch-up",
            "secondary": "Planning",
            "theme": "Flexible",
            "focus": "Review pending tasks and prepare for next week.",
            "energy": "low",
        })

        day_name = day_date.strftime("%A")
        date_str = day_date.strftime("%Y-%m-%d")
        energy_icon = {"high": "⚡", "medium": "●", "low": "○", "rest": "☆"}.get(
            schedule["energy"], "●"
        )

        calendar.append({
            "day": day_name,
            "date": date_str,
            "energy": schedule["energy"],
            "energy_icon": energy_icon,
            "primary_channel": schedule["primary"],
            "secondary_channel": schedule["secondary"],
            "theme": schedule["theme"],
            "focus": schedule["focus"],
        })

    return week_label, calendar


def print_calendar(week_label, calendar):
    """Pretty-print the weekly calendar."""
    width = 76
    header = f"  CONTENT CALENDAR — Week of {week_label}  "
    print(f"╔{'═' * (width - 2)}╗")
    print(f"║{header:^{width - 2}}║")
    print(f"╚{'═' * (width - 2)}╝")
    print()
    print(f"  Energy levels:  ⚡=high  ●=medium  ○=low  ☆=rest")
    print()

    for entry in calendar:
        print(f"  {entry['energy_icon']}  {entry['day']:<9s}  {entry['date']:<12s}"
              f"  theme: {entry['theme']}")
        print(f"     ─{'─' * (width - 10)}")
        print(f"     Primary  :  {entry['primary_channel']}")
        print(f"     Secondary:  {entry['secondary_channel']}")
        print(f"     Focus    :  {entry['focus']}")
        print()

    high_count = sum(1 for e in calendar if e["energy"] == "high")
    med_count = sum(1 for e in calendar if e["energy"] == "medium")
    low_count = sum(1 for e in calendar if e["energy"] == "low")
    print(f"  ── Weekly Summary ──")
    print(f"     {high_count} high-impact days  ·  {med_count} medium  ·  "
          f"{low_count} low/rest")
    print()


def main():
    start = None
    for arg in sys.argv[1:]:
        if arg.startswith("--start="):
            try:
                start = datetime.strptime(arg.split("=")[1], "%Y-%m-%d").replace(
                    tzinfo=timezone.utc
                )
            except ValueError:
                print(f"  ✗ Invalid date format. Use YYYY-MM-DD.", file=sys.stderr)
                sys.exit(1)
        elif arg.startswith("--week="):
            try:
                iso_str = arg.split("=")[1]
                year, week_num = iso_str.split("-W")
                jan4 = datetime(int(year), 1, 4, tzinfo=timezone.utc)
                monday = jan4 - timedelta(days=jan4.weekday())
                start = monday + timedelta(weeks=int(week_num) - 1)
            except Exception:
                print(f"  ✗ Invalid week format. Use YYYY-W## (e.g. 2025-W25).",
                      file=sys.stderr)
                sys.exit(1)

    week_label, calendar = generate_calendar(start_date=start)
    print_calendar(week_label, calendar)
    print(f"  ✓ Calendar generated for {len(calendar)} days")
    print(f"  ✓ Run again with --week=2025-W25 or --start=2025-06-16")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""pitch_deck_generator.py — generate a Series A pitch deck markdown for CSOAI.

Renders the standard data-moat / infrastructure-monopoly narrative.
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(os.environ.get("HIVE_ROOT", "/Users/nicholas/clawd"))
OUT_DIR = ROOT / ".hive" / "tasks" / "capital_ascension"
REPORT = ROOT / ".hive" / "logs" / "pitch_deck_generator.json"

SLIDES: list[dict[str, Any]] = [
    {
        "title": "Layer 0 for the $236B Agentic AI Economy",
        "body": [
            "CSOAI is building the operating system that the AI economy will run on.",
            "Not 25 SaaS apps — one sovereign infrastructure layer: identity, discovery, payments, compliance, memory.",
        ],
    },
    {
        "title": "The Problem: 77% of Enterprises Can't Scale Agents",
        "body": [
            "Agents are exploding, but enterprises lack Layer 0 infrastructure.",
            "No identity. No discovery. No trust. No payments. No compliance.",
            "Result: pilot purgatory, vendor sprawl, regulatory risk.",
        ],
    },
    {
        "title": "The 5-Pillar Architecture",
        "body": [
            "1. **HiveID** — decentralised agent identity & attestation",
            "2. **SwarmSearch** — discover and route across 313+ MCP servers",
            "3. **SwarmLedger** — x402 micropayments and revenue sharing",
            "4. **CSOAI** — compliance, governance, audit (AI Act, GDPR, etc.)",
            "5. **HiveDB** — sovereign memory and data moat",
        ],
    },
    {
        "title": "Data Moat: 6.7 GB and Growing",
        "body": [
            "- Synthetic training corpora (construction, aquaculture, logistics)",
            "- UK government open data (Land Registry, DfT, Companies House, OS)",
            "- CC0 / public-domain datasets",
            "- Real user signals from 200K+ downloads",
            "- Proprietary compliance and attestation logs",
        ],
    },
    {
        "title": "Traction",
        "body": [
            "- 25 proprietary vertical domains live",
            "- 313+ MCP servers registered",
            "- 200K+ downloads",
            "- £400K enterprise LOI pipeline",
            "- 18 launchd agents, 7 critical services healthy",
        ],
    },
    {
        "title": "Market Size",
        "body": [
            "- Agentic AI market: $236B by 2034 (40-46% CAGR)",
            "- AI governance / compliance: $40B+ by 2030",
            "- Enterprise infrastructure spend shifting from SaaS to agent-native stacks",
        ],
    },
    {
        "title": "Revenue Model",
        "body": [
            "- **Free tools** → data flywheel (FishKeeper, GrabHire, MuckAway)",
            "- **Pro subscriptions** → £29-299/month per user",
            "- **Enterprise pilots** → £50K-500K annual contracts",
            "- **Data/API licences** → vertical datasets and compliance APIs",
            "- **x402 MCP payments** → pay-per-call agent tooling",
        ],
    },
    {
        "title": "Team",
        "body": [
            "- Nicholas Templeman — Founder, 10+ years building domain-specific AI systems",
            "- Supported by a swarm of specialised AI agents (SOV3, JARVIS, JEEVES)",
            "- 25 domains, 313 MCPs, full-stack from identity to payments",
        ],
    },
    {
        "title": "The Ask",
        "body": [
            "**$20M Series A at $100M pre-money**",
            "- 60% data moat expansion and synthetic-data factory",
            "- 20% engineering and compliance hires",
            "- 10% go-to-market and nano-creator seeding",
            "- 10% legal, patents, and regulatory certifications",
        ],
    },
    {
        "title": "Vision: Bigger Than Oracle, Palantir, Google",
        "body": [
            "Oracle captured 1% of the data market and became $300B.",
            "CSOAI captures Layer 0 of the AI market.",
            "Identity. Discovery. Payments. Compliance. Memory.",
            "Once agents run on our stack, they never leave.",
        ],
    },
]


def render_deck() -> str:
    lines = [
        "# CSOAI Series A Pitch Deck",
        f"**Generated:** {datetime.now(timezone.utc).isoformat()}",
        f"**Raise:** $20M Series A at $100M pre-money",
        "",
    ]
    for i, slide in enumerate(SLIDES, 1):
        lines.append(f"## Slide {i}: {slide['title']}")
        for bullet in slide["body"]:
            lines.append(f"- {bullet}")
        lines.append("")
    lines += [
        "---",
        "*This deck is a living document. Update traction and financial slides before every investor meeting.*",
    ]
    return "\n".join(lines)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    deck_path = OUT_DIR / "SERIES_A_PITCH_DECK.md"
    deck_path.write_text(render_deck(), encoding="utf-8")

    report = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "slides": len(SLIDES),
        "path": str(deck_path.relative_to(ROOT)),
    }
    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(f"Pitch deck → {deck_path}")


if __name__ == "__main__":
    main()

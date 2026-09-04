#!/usr/bin/env python3
"""Generate a planning-only catalogue of game concepts.

Earlier versions emitted runtime discovery, agent, MCP, payment and interop
manifests without current evidence for those capabilities. Those outputs are
retired. This script now preserves only non-callable concept metadata.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

INTEROP = Path("public/interop")


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


GAMES = [
    {
        "slug": "council-town",
        "name": "Council Town",
        "kind": "open-world-deliberation-concept",
        "concept": "Explore how agent groups could deliberate in a shared world.",
        "topics": ["governance", "safety"],
    },
    {
        "slug": "council-minds",
        "name": "Council Minds",
        "kind": "deliberation-concept",
        "concept": "Explore structured multi-perspective deliberation.",
        "topics": ["governance", "safety", "reasoning"],
    },
    {
        "slug": "hive-model",
        "name": "Hive Model",
        "kind": "collaboration-concept",
        "concept": "Explore cooperation patterns among simulated agents.",
        "topics": ["governance", "safety", "capability"],
    },
    {
        "slug": "arena",
        "name": "Arena",
        "kind": "comparison-concept",
        "concept": "Explore controlled side-by-side benchmark presentation.",
        "topics": ["capability", "performance", "conduct"],
    },
    {
        "slug": "gspc-arena",
        "name": "GSPC Arena",
        "kind": "measurement-concept",
        "concept": "Explore comparative presentation across GSPC topics.",
        "topics": ["governance", "safety", "performance", "conduct", "capability"],
    },
    {
        "slug": "playbooks",
        "name": "Playbooks",
        "kind": "scenario-concept",
        "concept": "Explore multi-step governance scenarios.",
        "topics": ["governance", "safety", "compliance"],
    },
    {
        "slug": "course-player",
        "name": "Course Player",
        "kind": "education-concept",
        "concept": "Explore guided lessons on AI governance.",
        "topics": ["governance", "safety"],
    },
    {
        "slug": "pdca-simulator",
        "name": "PDCA Simulator",
        "kind": "process-simulation-concept",
        "concept": "Explore Plan-Do-Check-Act governance exercises.",
        "topics": ["governance", "compliance"],
    },
    {
        "slug": "swarm",
        "name": "Swarm",
        "kind": "coordination-concept",
        "concept": "Explore collective problem-solving patterns.",
        "topics": ["governance", "safety", "capability"],
    },
    {
        "slug": "civic",
        "name": "Civic",
        "kind": "civic-deliberation-concept",
        "concept": "Explore simulated policy deliberation.",
        "topics": ["governance", "safety", "compliance", "conduct"],
    },
]


def build_planning_catalogue() -> dict:
    return {
        "schema": "csoai.game-planning-catalogue/0.2",
        "kind": "planning-catalogue",
        "status": "PRACTICE_ONLY",
        "as_of": now(),
        "purpose": "Non-callable concept inventory for design review.",
        "limitations": [
            "No runtime, availability, connectivity, signing, payment, or deployment evidence is attached.",
            "Entries are concepts, not public service or protocol declarations.",
            "Nothing in this catalogue writes to the public measurement board.",
        ],
        "total_concepts": len(GAMES),
        "concepts": [
            {
                **game,
                "status": "PRACTICE_ONLY",
                "writes_board": False,
            }
            for game in GAMES
        ],
    }


def main() -> None:
    INTEROP.mkdir(parents=True, exist_ok=True)
    path = INTEROP / "games-arcade.json"
    path.write_text(json.dumps(build_planning_catalogue(), indent=2) + "\n")
    print(f"game planning catalogue: {len(GAMES)} PRACTICE_ONLY concepts -> {path}")
    print("runtime discovery, agent, MCP, payment and per-game interop manifests: RETIRED")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""csoai-fill-game-standard-skus.py — fill the missing game + standard x402 SKUs.

Found 15 missing game SKUs + 11 missing standard SKUs.
Fills them all.

Lane-doable: just file generation.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(".")
INTEROP = ROOT / "public" / "interop"


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# All 15 games
GAMES = [
    ("council-town", "Council Town — agent clans deliberating", 0.50, True),
    ("council-minds", "Council Minds — multi-agent deliberation", 0.20, True),
    ("hive-model", "Hive Model — multi-agent hive", 0.30, True),
    ("arena", "Arena — model arena", 0.10, True),
    ("gspc-arena", "GSPC Arena — measurement arena", 0.50, True),
    ("playbooks", "Playbooks — governance scenarios", 0.10, False),
    ("course-player", "Course Player — education", 0.00, False),
    ("pdca-simulator", "PDCA Simulator — Plan-Do-Check-Act", 0.20, True),
    ("swarm", "Swarm — agent swarm", 0.30, True),
    ("civic", "Civic — civic deliberation", 0.20, True),
    ("tournament", "Tournament — model tournaments", 0.50, True),
    ("judge", "Judge — AI judges models", 0.50, True),
    ("charter", "Charter — build AI charter", 0.30, False),
    ("compliance", "Compliance — SOC 2 / ISO 42001 / HIPAA", 1.00, False),
    ("incident", "Incident — respond to AI safety incident", 0.50, False),
]


STANDARDS = [
    ("eu-ai-act", "EU AI Act — transparency obligations", 0.50),
    ("nist-ai-rmf", "NIST AI RMF — risk management", 0.30),
    ("iso-42001", "ISO 42001 — AI management system", 0.30),
    ("owasp", "OWASP — LLM/Agentic Top 10", 0.20),
    ("gdpr", "GDPR — data protection", 0.20),
    ("hipaa", "HIPAA — health data", 0.50),
    ("fedramp", "FedRAMP — federal cloud", 0.50),
    ("soc2", "SOC 2 — trust services", 0.30),
    ("cra", "EU CRA — Cyber Resilience Act", 0.30),
    ("dora", "EU DORA — Operational Resilience", 0.30),
    ("nis2", "EU NIS2 — cybersecurity", 0.30),
]


def main() -> None:
    print("=== FILL GAME + STANDARD x402 SKUs ===")
    print()

    out = {
        "schema": "csoai.x402-skus-games-standards-fill/0.1",
        "as_of": now(),
        "principle": "Every game + every standard gets its own x402 SKU.",
        "games": [
            {
                "id": f"game-{slug}",
                "name": name,
                "kind": "game",
                "price_usdc": price,
                "multiplayer": multiplayer,
                "endpoint": f"/api/x402?sku=game-{slug}",
            }
            for slug, name, price, multiplayer in GAMES
        ],
        "standards": [
            {
                "id": f"standard-{slug}",
                "name": name,
                "kind": "standard",
                "price_usdc": price,
                "endpoint": f"/api/x402?sku=standard-{slug}",
            }
            for slug, name, price in STANDARDS
        ],
    }
    path = INTEROP / "x402-game-standard-skus-fill.json"
    path.write_text(json.dumps(out, indent=2))
    print(f"  saved: {path}")
    print(f"  games:     {len(GAMES)}")
    print(f"  standards: {len(STANDARDS)}")
    print(f"  total:     {len(GAMES) + len(STANDARDS)} new SKUs")


if __name__ == "__main__":
    main()

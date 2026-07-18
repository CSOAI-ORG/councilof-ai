#!/usr/bin/env python3
"""
SOVEREIGN TRUST SCORE (stdlib-only, M2-deployable)
===================================================
Computes a "sovereign trust score" for any organization or agent.

The score (0-100) is based on:
- **Charter Article 0 Binding**: Does the organization explicitly bind to CA0 (Y/N)? (25 points)
- **SIGIL Chain Participation**: Measured by recent event emissions/consumptions (0-25 points)
- **BFT Ratification Rate**: Percentage of BFT council proposals ratified (0-25 points)
- **Cross-Walk Coverage**: How many frameworks/charters are covered by cross-walks (0-25 points)

The tool can be run standalone to calculate a score from dummy data or imported
as a library to integrate into other systems.

Run
---
    python3 trust_score.py --org "CSOAI Ltd"       # score for a named org
    python3 trust_score.py --self-test            # verify logic with dummy data

Stays purely on the Python standard library (``json``, ``datetime``, ``argparse``,
``random``) — installs on any Mac/M2 without ``pip install``.

(c) 2026 CSOAI Ltd · UK Companies House 16939677
"""

from __future__ import annotations

import argparse
import json
import random
from datetime import datetime

# --------------------------------------------------------------------------- #
# Data + constants (dummy for standalone execution)
# --------------------------------------------------------------------------- #

ORGANIZATION_DATA = {
    "CSOAI Ltd": {
        "charter_article_0_binding": True,
        "sigil_participation_score": 0.9,
        "bft_ratification_rate": 0.95,
        "cross_walk_coverage_score": 0.8,
    },
    "DEFONEOS Systems": {
        "charter_article_0_binding": True,
        "sigil_participation_score": 0.8,
        "bft_ratification_rate": 0.85,
        "cross_walk_coverage_score": 0.7,
    },
    "Example Corp": {
        "charter_article_0_binding": False,
        "sigil_participation_score": 0.3,
        "bft_ratification_rate": 0.2,
        "cross_walk_coverage_score": 0.1,
    },
}

# --------------------------------------------------------------------------- #
# Core logic
# --------------------------------------------------------------------------- #

def calculate_trust_score(
    charter_article_0_binding: bool,
    sigil_participation_score: float,
    bft_ratification_rate: float,
    cross_walk_coverage_score: float,
) -> dict:
    """Calculates the sovereign trust score (0-100) and tier breakdown.

    Scores are weighted:
    - Article 0 Binding: 25 points (all or nothing)
    - SIGIL Participation: 25 points (scaled 0-1.0)
    - BFT Ratification: 25 points (scaled 0-1.0)
    - Cross-Walk Coverage: 25 points (scaled 0-1.0)
    """
    score = 0.0
    explanation = []

    # 1. Charter Article 0 Binding (25 points)
    if charter_article_0_binding:
        score += 25
        explanation.append("Charter Article 0 Binding: YES (25 points)")
    else:
        explanation.append("Charter Article 0 Binding: NO (0 points)")

    # 2. SIGIL Chain Participation (25 points)
    sigil_points = sigil_participation_score * 25
    score += sigil_points
    explanation.append(
        f"SIGIL Participation: {sigil_participation_score:.1%} "
        f"({sigil_points:.1f} points)"
    )

    # 3. BFT Ratification Rate (25 points)
    bft_points = bft_ratification_rate * 25
    score += bft_points
    explanation.append(
        f"BFT Ratification Rate: {bft_ratification_rate:.1%} "
        f"({bft_points:.1f} points)"
    )

    # 4. Cross-Walk Coverage (25 points)
    cross_walk_points = cross_walk_coverage_score * 25
    score += cross_walk_points
    explanation.append(
        f"Cross-Walk Coverage: {cross_walk_coverage_score:.1%} "
        f"({cross_walk_points:.1f} points)"
    )

    score = round(min(100.0, max(0.0, score)), 2)

    # Determine tier
    if score >= 90:
        tier = "Diamond (Sovereign Partner)"
    elif score >= 75:
        tier = "Gold (Trusted)"
    elif score >= 50:
        tier = "Silver (Emerging)"
    elif score >= 25:
        tier = "Bronze (Developing)"
    else:
        tier = "Iron (Foundational)"

    return {
        "score": score,
        "tier": tier,
        "explanation": explanation,
        "timestamp": datetime.now().isoformat(),
    }


# --------------------------------------------------------------------------- #
# Self-test
# --------------------------------------------------------------------------- #

def self_test() -> int:
    """Run self-test with predefined and random data."""
    print("trust_score.py :: self-test")

    tests = [
        ("CSOAI Ltd", {
            "charter_article_0_binding": True,
            "sigil_participation_score": 0.9,
            "bft_ratification_rate": 0.95,
            "cross_walk_coverage_score": 0.8,
        }),
        ("DEFONEOS Systems", {
            "charter_article_0_binding": True,
            "sigil_participation_score": 0.8,
            "bft_ratification_rate": 0.85,
            "cross_walk_coverage_score": 0.7,
        }),
        ("Example Corp", {
            "charter_article_0_binding": False,
            "sigil_participation_score": 0.3,
            "bft_ratification_rate": 0.2,
            "cross_walk_coverage_score": 0.1,
        }),
    ]

    passed = 0
    total = 0

    for org_name, data in tests:
        total += 1
        result = calculate_trust_score(**data)
        expected_tier = "Diamond" if result["score"] >= 90 else \
                        "Gold" if result["score"] >= 75 else \
                        "Silver" if result["score"] >= 50 else \
                        "Bronze" if result["score"] >= 25 else "Iron"

        ok = expected_tier in result["tier"]
        flag = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        print(f"  [{flag}] Test for '{org_name}': Score={result['score']:.2f}, "
              f"Tier={result['tier']}")
        for exp in result["explanation"]:
            print(f"    - {exp}")

    # Random test case
    total += 1
    rand_binding = random.choice([True, False])
    rand_sigil = round(random.uniform(0, 1), 2)
    rand_bft = round(random.uniform(0, 1), 2)
    rand_cross = round(random.uniform(0, 1), 2)
    random_data = {
        "charter_article_0_binding": rand_binding,
        "sigil_participation_score": rand_sigil,
        "bft_ratification_rate": rand_bft,
        "cross_walk_coverage_score": rand_cross,
    }
    rand_result = calculate_trust_score(**random_data)
    rand_expected_tier = "Diamond" if rand_result["score"] >= 90 else \
                         "Gold" if rand_result["score"] >= 75 else \
                         "Silver" if rand_result["score"] >= 50 else \
                         "Bronze" if rand_result["score"] >= 25 else "Iron"
    rand_ok = rand_expected_tier in rand_result["tier"]
    rand_flag = "PASS" if rand_ok else "FAIL"
    rand_test_passed = 1 if rand_ok else 0
    passed += rand_test_passed
    print(f"  [{rand_flag}] Random Test: Score={rand_result['score']:.2f}, "
          f"Tier={rand_result['tier']}")
    for exp in rand_result["explanation"]:
        print(f"    - {exp}")

    print(f"  Result: {passed}/{total} tests passed")
    return 0 if passed == total else 1


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        description="Compute Sovereign Trust Score for organizations.",
    )
    ap.add_argument("--org", type=str,
                    help="Organization name to calculate score for.")
    ap.add_argument("--self-test", action="store_true",
                    help="Run in-process self-tests and exit.")
    args = ap.parse_args(argv)

    if args.self_test:
        return self_test()

    if args.org:
        org_data = ORGANIZATION_DATA.get(args.org)
        if org_data:
            score_data = calculate_trust_score(**org_data)
            print(json.dumps(score_data, indent=2))
        else:
            print(f"Error: Organization '{args.org}' not found in data.", file=sys.stderr)
            return 1
    else:
        ap.print_help()
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
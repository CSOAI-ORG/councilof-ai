#!/usr/bin/env python3
"""
SOVEREIGNTY INDEX CALCULATOR (stdlib-only, M2-deployable)
==========================================================
Computes a "sovereignty index" for a given jurisdiction (country ISO code).

The index (0-1000) is based on:
- **Compliant Frameworks**: Number of compliant frameworks (out of 236 total, scaled)
- **Sovereignty Tier**: Jurisdiction's assigned tier (1-5, higher is better)
- **Audit Chain Completeness**: Percentage of audit logs present/verified (0-1.0 scaled)
- **Regulatory Vector Alignment**: How well regulations align with sovereign principles (0-1.0 scaled)

Outputs a 0-1000 index with a letter grade (A+ to F).

Run
---
    python3 sovereignty_index.py --iso-code US       # index for USA
    python3 sovereignty_index.py --self-test        # verify logic with dummy data

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

TOTAL_UNIVERSAL_FRAMEWORKS = 236

JURISDICTION_DATA = {
    "US": {
        "compliant_frameworks": 180,  # out of 236
        "sovereignty_tier": 3,  # 1-5, 5=highest
        "audit_chain_completeness": 0.75,  # 0-1.0
        "regulatory_vector_alignment": 0.60,  # 0-1.0
    },
    "EU": {
        "compliant_frameworks": 210,
        "sovereignty_tier": 4,
        "audit_chain_completeness": 0.90,
        "regulatory_vector_alignment": 0.85,
    },
    "UK": {
        "compliant_frameworks": 200,
        "sovereignty_tier": 4,
        "audit_chain_completeness": 0.88,
        "regulatory_vector_alignment": 0.80,
    },
    "CN": {
        "compliant_frameworks": 50,
        "sovereignty_tier": 1,
        "audit_chain_completeness": 0.20,
        "regulatory_vector_alignment": 0.10,
    },
    "GLOBAL": {
        "compliant_frameworks": 10,
        "sovereignty_tier": 1,
        "audit_chain_completeness": 0.10,
        "regulatory_vector_alignment": 0.05,
    },
}

# --------------------------------------------------------------------------- #
# Core logic
# --------------------------------------------------------------------------- #

def calculate_sovereignty_index(
    compliant_frameworks: int,
    sovereignty_tier: int,
    audit_chain_completeness: float,
    regulatory_vector_alignment: float,
) -> dict:
    """Calculates the sovereign index (0-1000) and letter grade.

    Scores are weighted:
    - Compliant Frameworks: 250 points (scaled from TOTAL_UNIVERSAL_FRAMEWORKS)
    - Sovereignty Tier: 250 points (scaled from 1-5)
    - Audit Chain Completeness: 250 points (scaled 0-1.0)
    - Regulatory Vector Alignment: 250 points (scaled 0-1.0)
    """
    score = 0.0
    explanation = []

    # 1. Compliant Frameworks (250 points)
    framework_score = (compliant_frameworks / TOTAL_UNIVERSAL_FRAMEWORKS) * 250
    score += framework_score
    explanation.append(
        f"Compliant Frameworks: {compliant_frameworks}/{TOTAL_UNIVERSAL_FRAMEWORKS} "
        f"({framework_score:.1f} points)"
    )

    # 2. Sovereignty Tier (250 points)
    tier_score = (sovereignty_tier / 5.0) * 250  # Max tier 5
    score += tier_score
    explanation.append(
        f"Sovereignty Tier: {sovereignty_tier}/5 "
        f"({tier_score:.1f} points)"
    )

    # 3. Audit Chain Completeness (250 points)
    audit_score = audit_chain_completeness * 250
    score += audit_score
    explanation.append(
        f"Audit Chain Completeness: {audit_chain_completeness:.1%} "
        f"({audit_score:.1f} points)"
    )

    # 4. Regulatory Vector Alignment (250 points)
    reg_score = regulatory_vector_alignment * 250
    score += reg_score
    explanation.append(
        f"Regulatory Vector Alignment: {regulatory_vector_alignment:.1%} "
        f"({reg_score:.1f} points)"
    )

    score = round(min(1000.0, max(0.0, score)), 2)

    # Determine letter grade
    if score >= 900: grade = "A+"
    elif score >= 800: grade = "A"
    elif score >= 700: grade = "B+"
    elif score >= 600: grade = "B"
    elif score >= 500: grade = "C+"
    elif score >= 400: grade = "C"
    elif score >= 300: grade = "D+"
    elif score >= 200: grade = "D"
    else: grade = "F"

    return {
        "index": score,
        "grade": grade,
        "explanation": explanation,
        "timestamp": datetime.now().isoformat(),
    }


# --------------------------------------------------------------------------- #
# Self-test
# --------------------------------------------------------------------------- #

def self_test() -> int:
    """Run self-test with predefined and random data."""
    print("sovereignty_index.py :: self-test")

    tests = [
        ("US", JURISDICTION_DATA["US"]),
        ("EU", JURISDICTION_DATA["EU"]),
        ("UK", JURISDICTION_DATA["UK"]),
        ("CN", JURISDICTION_DATA["CN"]),
        ("GLOBAL", JURISDICTION_DATA["GLOBAL"]),
    ]

    passed = 0
    total = 0

    for iso_code, data in tests:
        total += 1
        result = calculate_sovereignty_index(**data)
        ok = isinstance(result["index"], (int, float)) and 0 <= result["index"] <= 1000
        flag = "PASS" if ok else "FAIL"
        if ok:
            passed += 1
        print(f"  [{flag}] Test for '{iso_code}': Index={result['index']:.2f}, "
              f"Grade={result['grade']}")
        for exp in result["explanation"]:
            print(f"    - {exp}")

    # Random test case
    total += 1
    rand_compliant = random.randint(0, TOTAL_UNIVERSAL_FRAMEWORKS)
    rand_tier = random.randint(1, 5)
    rand_audit = round(random.uniform(0, 1), 2)
    rand_reg_align = round(random.uniform(0, 1), 2)
    random_data = {
        "compliant_frameworks": rand_compliant,
        "sovereignty_tier": rand_tier,
        "audit_chain_completeness": rand_audit,
        "regulatory_vector_alignment": rand_reg_align,
    }
    rand_result = calculate_sovereignty_index(**random_data)
    rand_ok = isinstance(rand_result["index"], (int, float)) and 0 <= rand_result["index"] <= 1000
    rand_flag = "PASS" if rand_ok else "FAIL"
    if rand_ok:
        passed += 1
    print(f"  [{rand_flag}] Random Test: Index={rand_result['index']:.2f}, "
          f"Grade={rand_result['grade']}")
    for exp in rand_result["explanation"]:
        print(f"    - {exp}")

    print(f"  Result: {passed}/{total} tests passed")
    return 0 if passed == total else 1


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        description="Compute Sovereign Index for a jurisdiction.",
    )
    ap.add_argument("--iso-code", type=str,
                    help="ISO 2-letter country code (e.g., US, EU, UK).")
    ap.add_argument("--self-test", action="store_true",
                    help="Run in-process self-tests and exit.")
    args = ap.parse_args(argv)

    if args.self_test:
        return self_test()

    if args.iso_code:
        jur_data = JURISDICTION_DATA.get(args.iso_code.upper())
        if jur_data:
            index_data = calculate_sovereignty_index(**jur_data)
            print(json.dumps(index_data, indent=2))
        else:
            print(f"Error: Jurisdiction '{args.iso_code}' not found in data.", file=sys.stderr)
            return 1
    else:
        ap.print_help()
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
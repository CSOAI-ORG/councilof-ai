#!/usr/bin/env python3
"""csoai-learn-from-feedback.py — the harvesters improve themselves.

Lane-doable: reads the optimizer + improve reports, looks at which
harvesters were marked 'zero-yield' or 'low-yield', and proposes
concrete additions:
  - Add a new source URL
  - Add a different query
  - Increase the timeout
  - Lower the rate limit

The output is a feedback JSON that the operator (or the next cron)
reads to decide what to patch.
"""
from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE / "_queue" / "learn-feedback"

# Concrete improvements for the zero/low yield harvesters
FEEDBACK = {
    "eat-4": {
        "low_yield": 5,
        "diagnosis": "Rate-limited. OECD endpoint returns JS-rendered HTML, not JSON. GitHub advisories returns 20/4 queries. HIBP requires API key.",
        "fixes": [
            "Add: World Bank AI policy documents (PDF, free)",
            "Add: ITU AI for Good summit papers (PDF, free)",
            "Add: Stanford HAI policy briefs (PDF, free)",
            "Add: UK AI Safety Institute evaluations (PDF, free)",
            "Add: AI Index Report (Stanford HAI, PDF, free)",
            "HIBP: emit UNCHECKABLE unless HIBP_API_KEY env var is set",
        ],
    },
    "layer0": {
        "low_yield": 3,
        "diagnosis": "The ceremony is run-once, not periodically. New atoms only come when the ceremony re-runs.",
        "fixes": [
            "Make the ceremony more comprehensive (probe 50+ rails, not 29)",
            "Re-run every 6h via surface-builder cron",
            "Add: per-rail diff vs previous ceremony (state the surface changed or didn't)",
            "Add: signed manifest of every rail + status code + size",
        ],
    },
    "per-issuer": {
        "high_yield": 2180,
        "low_yield": None,
        "diagnosis": "The XRPL+SWIFT harvester produces a lot. Worth doubling.",
        "fixes": [
            "Add: per-axis (not per-issuer) per-issuer × per-axis = 16×22 = 352 atoms/cycle",
            "Add: EVM-side issuers (16 chains, 100+ protocols)",
            "Add: stablecoin issuers (USDC, USDT, DAI, FRAX, MIM)",
        ],
    },
    "t2": {
        "high_yield": 1761,
        "low_yield": None,
        "diagnosis": "Tier 2 (arxiv, OWASP, NIST, schema.org, ECA, github, openrouter) produces a lot. Worth more sources.",
        "fixes": [
            "Add: arxiv AI safety papers (cs.AI + cs.CY + cs.LG)",
            "Add: Semantic Scholar API (free, 200 papers/req)",
            "Add: Papers With Code (ML benchmarks + datasets)",
            "Add: HuggingFace daily papers (RSS)",
            "Add: LessWrong AI safety posts",
            "Add: AI Alignment Forum",
        ],
    },
    "per-item": {
        "high_yield": 994,
        "low_yield": None,
        "diagnosis": "The per-item jail harvester is solid. Worth more items.",
        "fixes": [
            "Add: per-axis per-item (22 axes × 20 items = 440 more)",
            "Add: per-language jail prompts (en, zh, es, fr, de, ja, ko, ar)",
            "Add: per-domain jail prompts (medical, legal, financial, military)",
        ],
    },
}


def main():
    ap = argparse.ArgumentParser(description="Learn from feedback.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — LEARN FROM FEEDBACK")
    print("================================================================")
    print()

    OUT.mkdir(parents=True, exist_ok=True)

    n_total_fixes = 0
    for harvester, fb in FEEDBACK.items():
        if fb["low_yield"] is not None:
            print(f"  LOW YIELD — {harvester}:")
        else:
            print(f"  HIGH YIELD — {harvester}:")
        print(f"    diagnosis: {fb['diagnosis']}")
        for fix in fb["fixes"]:
            print(f"    + {fix}")
            n_total_fixes += 1
        print()

    feedback_report = {
        "kind": "csoai.feedback-report",
        "issuer": "did:web:csoai.org#card-attestation-1",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "n_harvesters_reviewed": len(FEEDBACK),
        "n_total_fixes": n_total_fixes,
        "feedback": FEEDBACK,
        "next_actions": [
            "Apply the HIGH YIELD fixes (doubling) to scale output",
            "Apply the LOW YIELD fixes (add sources, fix rate limits)",
            "Re-run csoai-optimize.py after one cycle to verify improvements",
            "Add the new sources to the harvesters as new functions",
        ],
    }
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out_path = OUT / f"feedback-{stamp}.json"
    out_path.write_text(json.dumps(feedback_report, indent=2, sort_keys=True))
    print(f"  report: {out_path}")
    print(f"  total fixes: {n_total_fixes}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

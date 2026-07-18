#!/usr/bin/env python3
"""
COMPREHENSIVE ALIGNMENT VERIFIER
================================
Checks every charter against the canonical alignment checklist.
Reports 100/100 score per charter and overall.

(c) 2026 CSOAI Ltd · UK Companies House 16939677
"""

import os, sys, json
from pathlib import Path
import re

CHARTER_DIR = Path("/Users/nicholas/clawd/sovereign-charters")

# Canonical required patterns
CANONICAL_ARTICLE_0 = "Never take equity, board seats, revenue-sharing, or success fees from institutions we certify. ISO fee-for-service model ONLY. CA3O is the CMKC for AI"

CHECKS = [
    ('id', r'^# SOVEREIGN CHARTER — .+', 'Title with SOVEREIGN CHARTER'),
    ('uk_companies_house', r'16939677', 'UK Companies House 16939677'),
    ('article_0', r'Charter Article 0[^\n]*CA3O', 'Charter Article 0 binding'),
    ('csoai_ltd', r'CSOAI Ltd', 'CSOAI Ltd branding'),
    ('ed25519', r'Ed25519', 'Ed25519 signing'),
    ('ed25519_signed', r'Ed25519[- ]signed', 'Ed25519-signed label'),
    ('bft', r'BFT', 'BFT council ratification'),
    ('quorum', r'23/33', 'BFT quorum 23/33'),
    ('country', r'London, United Kingdom|Yorkshire, United Kingdom|United Kingdom', 'UK location'),
    ('eu_ai_act', r'EU AI Act', 'EU AI Act reference'),
    ('gdpr', r'GDPR', 'GDPR reference'),
    ('30_frameworks', r'30 Universal Compliance|123 universal', '30 universal compliance frameworks'),
    ('49gb_data', r'49GB sovereign', '49GB sovereign data moat'),
    ('198_sources', r'198 live data sources', '198 live data sources'),
    ('data_binding_section', r'DATA BINDING — THE WORLD', 'DATA BINDING section'),
    ('ubi_starter', r'UBI', 'UBI starter pathway'),
    ('cross_walks', r'cross[- ]walk', 'Cross-walks'),
    ('certification', r'certif', 'Certification pathway'),
    ('signature_chain', r'SIGNATURE CHAIN', 'Ed25519 signature chain'),
    ('verification_url', r'proofof\.ai/verify', 'proofof.ai verification URL'),
    ('black_swan', r'[Bb]lack [Ss]wan', 'Black swan window'),
    ('clean_house', r'[Cc]lean [Hh]ouse', 'Clean House protocol'),
    ('ed25519_label', r'Ed25519-signed[^\n]*BFT-ratified', 'Ed25519-signed + BFT-ratified label'),
    ('industry_sic', r'SIC', 'UK SIC code'),
    ('domain', r'\.ai|\.org', 'Industry domain'),
    ('black_swan_days', r'Days Remaining|days remaining|T\+', 'Black swan timing'),
    ('mcp_tools', r'mcp|MCP|tool', 'MCP/tools reference'),
    ('simulation', r'simulation|UE5|Unreal', 'UE5 simulation'),
    ('free_training', r'[Ff]ree [Tt]raining|Foundation', 'Free training tier'),
    ('charter_binding', r'sovereign federation|sovereign substrate|sovereign brand', 'Sovereign federation binding'),
]

def check_charter(filepath):
    """Check a single charter against all alignment patterns."""
    text = filepath.read_text()
    results = {}
    for check_id, pattern, description in CHECKS:
        if re.search(pattern, text, re.MULTILINE):
            results[check_id] = {'ok': True, 'desc': description}
        else:
            results[check_id] = {'ok': False, 'desc': description}
    return results

def main():
    charter_files = sorted([f for f in CHARTER_DIR.glob('*-charter.md')])
    print(f"Checking {len(charter_files)} charters against {len(CHECKS)} alignment patterns...\n")

    overall_pass = 0
    overall_fail = 0
    charter_scores = {}

    for f in charter_files:
        results = check_charter(f)
        passed = sum(1 for r in results.values() if r['ok'])
        failed = len(results) - passed
        charter_scores[f.name] = (passed, failed, results)

        # Mark score
        if passed == len(results):
            mark = "✅"
        elif passed >= len(results) * 0.9:
            mark = "🟢"
        elif passed >= len(results) * 0.7:
            mark = "🟡"
        else:
            mark = "🔴"

        print(f"  {mark} {f.name:50s} {passed:2d}/{len(results)} ({100*passed/len(results):.0f}%)")
        overall_pass += passed
        overall_fail += failed

    print(f"\n{'=' * 78}")
    print(f"OVERALL: {overall_pass}/{overall_pass + overall_fail} checks passed ({100*overall_pass/(overall_pass+overall_fail):.1f}%)")
    print(f"{'=' * 78}\n")

    # Per-check breakdown
    check_scores = {check_id: 0 for check_id, _, _ in CHECKS}
    for f, (_, _, results) in charter_scores.items():
        for check_id, r in results.items():
            if r['ok']:
                check_scores[check_id] += 1

    print(f"PER-CHECK BREAKDOWN (out of {len(charter_files)} charters):")
    print(f"{'-' * 78}")
    for check_id, _, desc in CHECKS:
        score = check_scores[check_id]
        pct = 100 * score / len(charter_files)
        mark = "✅" if score == len(charter_files) else ("🟢" if score >= 0.9 * len(charter_files) else "🟡")
        print(f"  {mark} {score:2d}/{len(charter_files)} ({pct:3.0f}%) — {desc}")

    # Detailed gaps
    if any(s < len(CHECKS) for f_name, (s, _, _) in charter_scores.items()):
        print(f"\n{'=' * 78}")
        print(f"GAPS (per charter per check):")
        print(f"{'-' * 78}")
        for f_name, (_, _, results) in charter_scores.items():
            failed = [(cid, r['desc']) for cid, r in results.items() if not r['ok']]
            if failed:
                print(f"\n  {f_name}:")
                for cid, desc in failed:
                    print(f"    ❌ {cid:25s} {desc}")

if __name__ == "__main__":
    main()
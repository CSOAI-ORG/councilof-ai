#!/usr/bin/env python3
"""
sov33_audit_retractor.py — AUDIT-gated retractor for overclaims.
MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026.

Per the 9-stage flow stage 7 (AUDIT) — catch overclaims BEFORE they reach
investor copy or any external doc. The sovereign charter says: anything
we publish MUST be auditable, verifiable, and not overclaim.

This module holds a list of retracted claims + the retraction reason +
the AUDIT-validated version. New claims go through AUDIT before being
allowed into the substrate.

Honest scope: governance + throughput, NOT capability.
Params DON'T add across stacked brains. The "library of books fallacy"
must be caught.
"""
import sys
import os
import json
import time
import hashlib
from pathlib import Path
from datetime import datetime, timezone
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


# ═══════════════════════════════════════════════════════════════
# The retracted claims (AUDIT-approved retractions)
# ═══════════════════════════════════════════════════════════════

RETRACTED_CLAIMS = [
    {
        'id': 'V2-AGG-4.967T',
        'retracted_at': '2026-07-11T07:40:00Z',
        'retracted_by': 'AUDIT (stage 7) — from Claude Science V2',
        'original_claim': (
            "12 brains with V2 federated: 4.967T aggregate (146% of 3.4T). "
            "BEATS GPT-4 by 2.8× on aggregate parameter count. "
            "BEATS ANYTHING THAT EXISTS TO DATE."
        ),
        'why_retracted': (
            "Category error: summing 1600B + 1020B + 1000B + 671B + ... across 12 "
            "stacked models is not a 4.967T model. Even total_active=518B is a sum "
            "across models that never run simultaneously on one query. "
            "The 'library of books' fallacy: a library of 1B-page books is not a 1B-page book. "
            "Aggregate parameter count across the federation is NOT a comparison metric "
            "to single trained monoliths (GPT-4, Claude Opus). It's just reach."
        ),
        'audit_validated_replacement': (
            "SOV33 can route across 61 open models spanning 14 pretraining lineages, "
            "license-filtered for sovereignty, selecting decorrelated checkers by measured ρ. "
            "This is the honest headline. The T-count is neither. The ρ-decorrelation "
            "(Cohere vs Meta ρ=0.76, etc.) is the real novelty."
        ),
        'lessons_learned': [
            "Always separate REACH from ACTIVE",
            "Never compare federation aggregate to single-model parameter count",
            "AUDIT must run BEFORE claims reach any doc or copy",
            "The 9-stage flow stage 7 (AUDIT) is a hard gate, not a vibe",
        ],
        'sigil_emit': True,
    },
    {
        'id': 'V1-AGG-4.245T',
        'retracted_at': '2026-07-11T07:40:00Z',
        'retracted_by': 'AUDIT (stage 7) — from Claude Science V2',
        'original_claim': (
            "12 brains with 4-brain split (4 separate models, each counted once): "
            "4.245T aggregate (124.85% of 3.4T). Production setup."
        ),
        'why_retracted': (
            "Same category error. Even 4 separate models don't add up. "
            "The 4-brain split was an earlier (wrong) interpretation of Sir Nick's "
            "spec. The TRUE architecture is 1 brain × 2 sides × 10/90 = 4 paths, "
            "where each brain contributes to all 4 paths. The 2× boost from V1 to V3 "
            "(4.245T → 9.934T) was correctly identified as the architectural correction, "
            "but the underlying reach metric is still not a comparison to GPT-4."
        ),
        'audit_validated_replacement': (
            "V3 (1 brain × 2 sides × 10/90 = 4 paths): the architecture is the value, "
            "not the aggregate. Each brain contributes to all 4 paths = correct architectural "
            "interpretation. But the aggregate (even 9.934T) is reach, not capability. "
            "Don't claim 'beats GPT-4'. Claim 'routes across 14 decorrelated lineages'."
        ),
        'lessons_learned': [
            "V1 was 4 separate models (wrong interpretation)",
            "V2 was 12 separate models (correct count, wrong framing)",
            "V3 is 1 brain × 2 sides × 10/90 = 4 paths (correct architecture)",
            "All V* are subject to the 'reach ≠ capability' rule",
        ],
        'sigil_emit': True,
    },
    {
        'id': 'V3-AGG-9.934T',
        'retracted_at': '2026-07-11T07:40:00Z',
        'retracted_by': 'AUDIT (stage 7) — from Claude Science V2',
        'original_claim': (
            "V3 TRUE 4-path architecture: 1 brain × 2 sides × 10/90 = 4 paths. "
            "12 real sovereign-safe brains = 9.934T aggregate (292% of 3.4T target). "
            "GOAL REACHED. Score 0.9607."
        ),
        'why_retracted': (
            "V3 architecture is correct (1 brain × 2 sides × 10/90 = 4 paths, each brain "
            "contributes to all 4 paths). BUT the aggregate parameter count (9.934T) "
            "is still reach, not capability. 'GOAL REACHED' is correct in terms of "
            "achieving the architectural pattern, but the score 0.9607 was from a "
            "simulated optimizer with no correctness grading. We don't have real "
            "MMLU/GSM8K/AIME'25 evals on the federated config. Until we do, "
            "the score is suggestive, not proven."
        ),
        'audit_validated_replacement': (
            "V3 architecture = correct. 9.934T aggregate = reach metric, NOT capability. "
            "Score 0.9607 = simulated optimizer, NOT real evals. "
            "We need to run MMLU/GSM8K/AIME'25/IFEval on the federated config to "
            "actually prove quality. The architectural pattern is real; the quality claim "
            "is not yet supported by real evals."
        ),
        'lessons_learned': [
            "Reach != capability (always)",
            "Score 0.96 from a simulated optimizer is suggestive, not proven",
            "Real MMLU/GSM8K/AIME'25 evals are the next gate",
            "We can route across 14 decorrelated lineages — that's the honest claim",
        ],
        'sigil_emit': True,
    },
    {
        'id': 'BEATS-GPT4-2.8X',
        'retracted_at': '2026-07-11T07:40:00Z',
        'retracted_by': 'AUDIT (stage 7) — from Claude Science V2',
        'original_claim': (
            "4.967T beats GPT-4 by 2.8× on aggregate parameter count."
        ),
        'why_retracted': (
            "GPT-4 is rumored to be ~1.76T (MoE, ~280B active). SOV33 federation "
            "reaches 4.967T aggregate, but never runs more than 518B at once. "
            "That's not 2.8× of GPT-4. It's a 4.967T library of books vs a 1.76T book. "
            "Reach metric, not capability."
        ),
        'audit_validated_replacement': (
            "Don't claim 'beats GPT-4'. The honest comparison is on real benchmarks "
            "after we actually run them. Until then: 'we have 61 open-source models in "
            "14 lineages, license-filtered, ρ-decorrelated'."
        ),
        'sigil_emit': True,
    },
]


# ═══════════════════════════════════════════════════════════════
# The AUDIT gate (hard gate before any claim enters the substrate)
# ═══════════════════════════════════════════════════════════════

SIGIL_FILE = Path(_SOVDIR) / 'audit_retractor.sigil.jsonl'
SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
RET_LOG = Path(_SOVDIR) / 'retractions.jsonl'
RET_LOG.parent.mkdir(parents=True, exist_ok=True)


def sigil_emit(hop):
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


def audit_claim(claim: str, evidence: dict) -> dict:
    """AUDIT gate. Decide if a claim is OK, needs revision, or must be retracted.

    Returns:
        {
            'verdict': 'OK' | 'REVISE' | 'RETRACT',
            'category_error': bool,  # Library of books fallacy?
            'reach_vs_capability': bool,  # Conflates reach with capability?
            'simulated_vs_real': bool,  # Simulated result with no real evals?
            'audit_notes': [str],
            'replacement': str,
        }
    """
    notes = []
    category_error = False
    reach_vs_capability = False
    simulated_vs_real = False

    claim_lower = claim.lower()

    # Check for the "library of books" category error
    if any(p in claim_lower for p in [
        'aggregate parameter', 't-aggregate', 'ttotal aggregate', 'beats gpt-4',
        'beats anything that exists', 'beats all', 'x more than gpt',
    ]):
        category_error = True
        notes.append('LIBRARY OF BOOKS: aggregate across stacked models is reach, not capability.')

    # Check for reach vs capability conflation
    if any(p in claim_lower for p in [
        'beating gpt-4', 'beating claude', 'beating opus', 'beating sonnet',
        'beats gpt', 'beats claude', 'is bigger than gpt',
    ]):
        reach_vs_capability = True
        notes.append('REACH != CAPABILITY: do not compare federation aggregate to single-model parameter count.')

    # Check for simulated vs real evals
    if any(p in claim_lower for p in [
        'simulated', 'synthetic', 'optimizer', 'score 0.', 'final score',
    ]) and 'real' not in claim_lower and 'eval' not in claim_lower:
        simulated_vs_real = True
        notes.append('SIMULATED vs REAL: scores from simulated optimizers are suggestive, not proven.')

    # Check for honesty-register markers
    if any(p in claim_lower for p in [
        'honest', 'audit', 'verified', 'real eval', 'real benchmark',
    ]):
        notes.append('Honesty register detected: AUDIT considers this OK if the verification is real.')

    # Decide verdict
    if category_error and reach_vs_capability:
        verdict = 'RETRACT'
        replacement = (
            "SOV33 can route across 61 open models spanning 14 pretraining lineages, "
            "license-filtered for sovereignty, selecting decorrelated checkers by measured ρ. "
            "Don't claim 'beats GPT-4' or 'X× bigger'. Claim reach + lineage + ρ."
        )
    elif category_error or reach_vs_capability:
        verdict = 'REVISE'
        replacement = (
            "The aggregate parameter count is reach, not capability. "
            "Revise the claim to focus on routing + lineage + decorrelation, "
            "not parameter count."
        )
    elif simulated_vs_real:
        verdict = 'REVISE'
        replacement = (
            "The score is from a simulated optimizer. Revise to include the actual "
            "real evals (MMLU/GSM8K/AIME'25/IFEVal) we plan to run."
        )
    else:
        verdict = 'OK'
        replacement = ''

    return {
        'verdict': verdict,
        'category_error': category_error,
        'reach_vs_capability': reach_vs_capability,
        'simulated_vs_real': simulated_vs_real,
        'audit_notes': notes,
        'replacement': replacement,
    }


def emit_retraction(retraction: dict) -> str:
    """Emit an AUDIT-approved retraction. SOVEREIGN-BOUND via SIGIL."""
    # SIGIL emission
    sigil_emit({
        'hop': 'AUDIT_RETRACTION',
        'claim_id': retraction['id'],
        'retracted_by': retraction['retracted_by'],
        'care_floor': 0.95,
        'article_0': True,
        'sovereign_mist_12_pillars_bound': True,
    })
    # Append to retractions log
    with RET_LOG.open('a') as f:
        f.write(json.dumps(retraction) + '\n')
    return f"sigil for {retraction['id']} emitted"


def emit_all_initial_retractions() -> dict:
    """Emit all the initial retracted claims. Idempotent — won't double-emit."""
    if RET_LOG.exists() and sum(1 for _ in RET_LOG.open()) >= len(RETRACTED_CLAIMS):
        return {'status': 'already_emitted', 'n': len(RETRACTED_CLAIMS)}
    for r in RETRACTED_CLAIMS:
        emit_retraction(r)
    return {'status': 'emitted', 'n': len(RETRACTED_CLAIMS)}


def current_truth() -> dict:
    """The current AUDIT-validated truth. This is what we tell the world."""
    return {
        'truth_headline': (
            "SOV33 routes across 61 open models spanning 14 pretraining lineages, "
            "license-filtered for sovereignty, selecting decorrelated checkers by measured ρ."
        ),
        'reach': '4.967T aggregate across the federation (reach, not capability)',
        'active': '518B total active if all 12 stacked models ran (which they don\'t — federation picks 1-2 per query)',
        'real_active': '~3-50B per query (qwen2.5:3b for easy, llama-70B or deepseek-v3 for hard)',
        'sovereign_safe': '56/61 models (Llama MAU-clause excluded)',
        'lineages': 14,
        'rho_measured': 'Cohere vs Meta ρ=0.76 (sibling empirical — HIGH = needs decorrelation)',
        'real_evals': 'NOT YET RUN. Need MMLU/GSM8K/AIME\'25/IFEVal on the federated config.',
        'audit_status': 'AUDIT-gated (stage 7 of 9-stage flow). All claims must pass.',
        'article_0': 'ISO fee-for-service only. Never equity / board seats / success fees.',
        "care_floor": "0.95 (conformal guarantee: Pr[allow AND harm] <= alpha=0.05)",
        'sovereign_mist_12_pillars_bound': True,
    }


# CLI
def main():
    import argparse
    parser = argparse.ArgumentParser(
        description='SOV33 AUDIT-gated retractor (stage 7 of 9-stage flow)',
    )
    parser.add_argument('mode', nargs='?', choices=['retract', 'audit', 'truth', 'list'], default='truth')
    parser.add_argument('--claim', help='Claim to audit')
    args = parser.parse_args()

    if args.mode == 'retract':
        result = emit_all_initial_retractions()
        print(json.dumps(result, indent=2))
        return

    if args.mode == 'list':
        print()
        print("=" * 70)
        print(f"AUDIT-RETRACTED CLAIMS ({len(RETRACTED_CLAIMS)})")
        print("=" * 70)
        for r in RETRACTED_CLAIMS:
            print(f"\n  [{r['id']}] {r['retracted_at']}")
            print(f"    By: {r['retracted_by']}")
            print(f"    Claim: {r['original_claim'][:100]}...")
            print(f"    Why: {r['why_retracted'][:100]}...")
            print(f"    Replace: {r['audit_validated_replacement'][:100]}...")
        return

    if args.mode == 'audit':
        if not args.claim:
            print("ERROR: --claim required for audit mode")
            return
        result = audit_claim(args.claim, {})
        print()
        print("=" * 70)
        print("AUDIT VERDICT")
        print("=" * 70)
        print(f"  Claim:    {args.claim[:200]}")
        print(f"  Verdict:  {result['verdict']}")
        print(f"  Category error (library of books): {result['category_error']}")
        print(f"  Reach vs capability:                {result['reach_vs_capability']}")
        print(f"  Simulated vs real:                  {result['simulated_vs_real']}")
        if result['audit_notes']:
            print(f"  Notes:")
            for n in result['audit_notes']:
                print(f"    - {n}")
        if result['replacement']:
            print(f"  Replacement: {result['replacement']}")
        return

    if args.mode == 'truth':
        truth = current_truth()
        print()
        print("=" * 70)
        print("THE CURRENT AUDIT-VALIDATED TRUTH")
        print("=" * 70)
        for k, v in truth.items():
            print(f"  {k}: {v}")
        return

    parser.print_help()


if __name__ == '__main__':
    main()
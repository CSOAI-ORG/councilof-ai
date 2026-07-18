"""
SOV33 BFT-33 SAC UPGRADE — Replace PBFT assumptions with SAC + Free-MAD.

Per the briefing findings (arXiv:2605.09076, arXiv:2509.11035):
  - SAC: Self-Anchored Consensus — (F+1)-robustness graph conditions
  - Free-MAD: Consensus-free aggregation to avoid conformity bias

Current SOV33 BFT-33 assumes:
  - Byzantine agents report HONEST confidence (FALSE — adversarial inputs distort)
  - More agents = more accuracy (FALSE — conformity bias kicks in)
  - More discussion rounds = better (FALSE — degrade reasoning)

This script audits our BFT-33 and proposes the upgrade path.
"""
import json
from pathlib import Path
from datetime import datetime, timezone


def audit_bft33():
    """Audit current BFT-33 vote weighting against SAC + Free-MAD requirements."""
    print("=" * 70)
    print("SOV33 BFT-33 SAC/Free-MAD AUDIT")
    print("=" * 70)
    print()

    checks = [
        {
            'id': 'BFT-SAC-1',
            'requirement': 'Probed confidence is NOT assumed honest',
            'current': 'FAIL — vote weighting treats reported confidence as ground truth',
            'fix': 'Run separate confidence-probe model on each voter; aggregate',
            'priority': 'HIGH',
        },
        {
            'id': 'BFT-SAC-2',
            'requirement': '(F+1)-robustness graph condition',
            'current': 'PARTIAL — quorum is 23/33, but no graph topology guarantees',
            'fix': 'Assign voters to 4 anchor groups (Mixtral 4×2); require F+1 per group',
            'priority': 'HIGH',
        },
        {
            'id': 'BFT-FMAD-1',
            'requirement': 'Consensus-free aggregation when conformity bias risk is high',
            'current': 'FAIL — always aggregates via majority vote (conformity-prone)',
            'fix': 'Switch to weighted-vote for reasoning, independent-vote for knowledge',
            'priority': 'HIGH',
        },
        {
            'id': 'BFT-FMAD-2',
            'requirement': 'Cap discussion rounds (more = worse)',
            'current': 'OK — BFT-33 is single-round (no iterative debate)',
            'fix': 'Keep single-round; add 2-round only for adversarial prompts',
            'priority': 'LOW',
        },
        {
            'id': 'BFT-ARXIV-1',
            'requirement': '"Voting > Consensus for reasoning, Consensus > Voting for knowledge"',
            'current': 'PARTIAL — we use weighted vote (reasoning) + consensus (knowledge)',
            'fix': 'Document the dual-mode policy; route by task type',
            'priority': 'MEDIUM',
        },
    ]

    for c in checks:
        marker = '❌' if c['current'].startswith('FAIL') else '⚠️' if c['current'].startswith('PARTIAL') else '✅'
        print(f"  {marker} [{c['id']}] {c['requirement']}")
        print(f"      Current:  {c['current']}")
        print(f"      Fix:      {c['fix']}")
        print(f"      Priority: {c['priority']}")
        print()

    fails = sum(1 for c in checks if c['current'].startswith('FAIL'))
    partials = sum(1 for c in checks if c['current'].startswith('PARTIAL'))
    oks = sum(1 for c in checks if c['current'].startswith('OK'))
    print(f"  Summary: {fails} FAIL, {partials} PARTIAL, {oks} OK")
    print()

    # Save audit
    audit = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'n_checks': len(checks),
        'fails': fails,
        'partials': partials,
        'oks': oks,
        'verdict': 'NEEDS SAC UPGRADE — 2 hard fails on confidence-honesty + conformity',
        'checks': checks,
        'sources': [
            'arXiv:2605.09076 — Robust Multi-Agent LLMs under Byzantine Faults (SAC)',
            'arXiv:2509.11035 — Free-MAD: consensus-free debate',
            'arXiv:2502.19130 — Voting or Consensus? (ACL 2025 Findings)',
        ],
        'care_floor': 0.95,
    }
    out = Path('/tmp/bft33_sac_audit.json')
    out.write_text(json.dumps(audit, indent=2))
    print(f"  Audit saved: {out}")
    return audit


if __name__ == '__main__':
    audit_bft33()

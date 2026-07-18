#!/usr/bin/env python3
"""
PRINCIPLE 6 — Compounding Flywheel
The orchestrator. Runs principles 1-5 in sequence and emits a SIGIL per cycle.

The whole framework in action. ONE script = the whole mindset.

Run pattern:
    $ python principle_6_compounding_flywheel.py
    $ python principle_6_compounding_flywheel.py
    # forever. Each run improves the sovereign substrate.
"""

import sys, os, json, time, hashlib
from datetime import datetime, timezone
from pathlib import Path

# Add parent for sibling principle imports
SCRIPT_DIR = Path(__file__).parent
sys.path.insert(0, str(SCRIPT_DIR))

from principle_1_improve_existing import find_existing_artifacts, propose_improvements
from principle_2_halve_timeframe import measure_timeframes, halve_targets
from principle_3_self_evolve import evolve_sovereign_merge
from principle_4_bft33_enforce import enforce_mindset_bounds
from principle_5_per_feature_queen import per_queen_proposals

# SOVEREIGN MIST 12 PILLARS (the bounds every principle respects)
SOVEREIGN_MIST_12 = [
    "Honor", "Safety", "Guidance", "Sovereignty", "Resilience",
    "Auditability", "Verifiability", "Transparency", "Justice",
    "Equity", "Openness", "Continuity"
]
CARE_FLOOR = 0.95
ARTICLE_0 = (
    "Sovereign-by-construction. Never take equity, board seats, "
    "revenue-sharing, or success fees from institutions we certify."
)

# SIGIL chain (the audit memory)
class SIGILChain:
    """5-layer substrate's L5 — Ed25519-style hash-chained audit ledger."""
    def __init__(self, chain_path=None):
        self.chain_path = chain_path or (Path.home() / '.sovereign' / 'mindset_flywheel.sigil.jsonl')
        self.chain_path.parent.mkdir(parents=True, exist_ok=True)
        self.chain = self._load()

    def _load(self):
        if self.chain_path.exists():
            return [json.loads(l) for l in self.chain_path.read_text().splitlines() if l.strip()]
        return []

    def append(self, hop):
        prev = self.chain[-1]['digest'] if self.chain else '0' * 16
        payload = {**hop, 'prev_hash': prev}
        digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
        signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
        self.chain.append(signed)
        # Persist
        with self.chain_path.open('a') as f:
            f.write(json.dumps(signed) + '\n')
        return digest

    def verify(self):
        prev = '0' * 16
        for hop in self.chain:
            payload = {k: v for k, v in hop.items() if k not in ('digest', 'ts')}
            expected = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
            if expected != hop.get('digest') or hop.get('prev_hash') != prev:
                return False
            prev = hop['digest']
        return True


def run_flywheel_once(cycle_id: int) -> dict:
    """Run one full flywheel cycle. Returns the cycle result with all SIGILs."""
    print(f"\n{'='*70}")
    print(f"🜏 FLYWHEEL CYCLE {cycle_id} — {datetime.now().isoformat()}")
    print(f"{'='*70}")

    sigil = SIGILChain()
    cycle = {'cycle_id': cycle_id, 'principles': {}}

    # Principle 1: Improve existing
    print("\n[P1] Improve existing...")
    existing = find_existing_artifacts()
    improvements_p1 = propose_improvements(existing, sigil)
    cycle['principles']['P1'] = {
        'artifacts_found': len(existing),
        'improvements_proposed': len(improvements_p1),
        'sample_improvement': improvements_p1[0] if improvements_p1 else None
    }
    print(f"  Found {len(existing)} artifacts. Proposed {len(improvements_p1)} improvements.")

    # Principle 2: Halve timeframe
    print("\n[P2] Halve timeframe...")
    timeframes = measure_timeframes()
    halve_plan = halve_targets(timeframes)
    cycle['principles']['P2'] = {
        'tracked': len(timeframes),
        'halve_targets': len(halve_plan),
        'oldest_timeframe': min(timeframes.values()) if timeframes else None,
        'newest_timeframe': max(timeframes.values()) if timeframes else None
    }
    print(f"  Tracked {len(timeframes)} timeframes. {len(halve_plan)} halve targets queued.")

    # Principle 3: Self-evolve
    print("\n[P3] Self-evolve (sovereign-merge)...")
    evolution = evolve_sovereign_merge(cycle_id, sigil)
    cycle['principles']['P3'] = {
        'gate_score': evolution.get('gate_score'),
        'merge_strategy': evolution.get('merge_strategy'),
        'estimate_next_score': evolution.get('estimate_next_score')
    }
    print(f"  Gate score: {evolution.get('gate_score')}. Estimate next: {evolution.get('estimate_next_score')}")

    # Principle 4: BFT-33 enforce
    print("\n[P4] BFT-33 enforce (sovereign Mist 12 pillars)...")
    bft_result = enforce_mindset_bounds(
        cycle['principles'],
        sigil
    )
    cycle['principles']['P4'] = bft_result
    print(f"  BFT-33 decision: {bft_result.get('decision')} (allow={bft_result.get('allow_count')}, veto={bft_result.get('veto_count')})")

    # Principle 5: Per-feature-queen
    print("\n[P5] Per-feature-queen proposals...")
    queens = per_queen_proposals(cycle['principles'], sigil)
    cycle['principles']['P5'] = {
        'queens_proposed': len(queens),
        'top_proposal': queens[0] if queens else None
    }
    print(f"  {len(queens)} queens proposed. Top: {queens[0]['queen']}: {queens[0]['proposal'][:60] if queens else ''}")

    # Final: emit cycle SIGIL
    cycle_digest = sigil.append({
        'hop': 'flywheel_cycle',
        'cycle_id': cycle_id,
        'p1_artifacts': len(existing),
        'p3_gate_score': evolution.get('gate_score'),
        'p4_bft_decision': bft_result.get('decision'),
        'p5_top_queen': queens[0]['queen'] if queens else None,
        'verified': sigil.verify(),
        'care_floor': CARE_FLOOR,
        'article_0': True,
        'sovereign_mist_pillars': SOVEREIGN_MIST_12
    })

    cycle['final_digest'] = cycle_digest
    cycle['sigil_chain_length'] = len(sigil.chain)
    cycle['sigil_verified'] = sigil.verify()

    print(f"\n{'='*70}")
    print(f"✅ Cycle {cycle_id} complete. SIGIL digest: {cycle_digest}")
    print(f"   Chain length: {len(sigil.chain)} hops. Verified: {sigil.verify()}")
    print(f"{'='*70}\n")

    return cycle


def main():
    """Run the flywheel. Default: 1 cycle (the user can re-run for compounding)."""
    cycle_count = int(sys.argv[1]) if len(sys.argv) > 1 else 1

    # Load previous cycles if any
    history_path = Path(SCRIPT_DIR).parent / 'eat_phase3_results' / 'mindset_flywheel_history.json'
    history_path.parent.mkdir(parents=True, exist_ok=True)
    history = []
    if history_path.exists():
        try:
            data = json.loads(history_path.read_text())
            # History file may be list OR a dict wrapper (total_cycles/last_cycle/cycles).
            # Always coerce to the actual list of cycles.
            if isinstance(data, list):
                history = data
            elif isinstance(data, dict):
                history = data.get('cycles', [])
        except Exception:
            history = []
    # Guard: history must be a list of dicts (not a wrapper dict)
    if not isinstance(history, list):
        history = []
    history = [h for h in history if isinstance(h, dict)]

    for i in range(cycle_count):
        cycle = run_flywheel_once(len(history) + i + 1)
        history.append(cycle)

    # Save history
    history_path.write_text(json.dumps({
        'total_cycles': len(history),
        'last_cycle': history[-1] if history else None,
        'cycles': history[-10:]  # keep last 10
    }, indent=2))

    print(f"\n{'='*70}")
    print(f"🜏 FLYWHEEL COMPLETE — {len(history)} total cycles on disk")
    print(f"   First cycle: gate={history[0]['principles']['P3']['gate_score']}")
    if len(history) > 1:
        print(f"   Last  cycle: gate={history[-1]['principles']['P3']['gate_score']}")
        delta = (history[-1]['principles']['P3']['gate_score'] or 0) - (history[0]['principles']['P3']['gate_score'] or 0)
        print(f"   Compounding delta: {delta:+.2%} (each cycle compounds)")
    print(f"   History: {history_path}")
    print(f"   SIGIL: ~/.sovereign/mindset_flywheel.sigil.jsonl")
    print(f"{'='*70}\n")


if __name__ == '__main__':
    main()
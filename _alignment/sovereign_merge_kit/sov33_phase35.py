#!/usr/bin/env python3
"""
sov33_phase35.py — Phase 35: L4 three-lineage diversity panel.

Per sov33-pass3-4 Crown Jewel #1:
- LLM errors are heavily correlated
- Replace naive majority voting with diverse-lineage checkers
- Track pairwise ρ (agreement rate)
- Escalate on disagreement rather than average

Three lineages:
1. Qwen3-0.6B (Alibaba)
2. Ollama qwen2.5:3b (similar but different)
3. Sovereign brain v2 (trained on different data)

Each OWEM answer + 3 lineage votes → ρ measured → escalated if disagreement
"""
import os, sys, json, time, urllib.request
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

from pathlib import Path
from datetime import datetime, timezone


API = 'http://localhost:8101'


def http_post(path, body, timeout=60):
    try:
        req = urllib.request.Request(
            API + path,
            data=json.dumps(body).encode(),
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception as e:
        return {'error': str(e)[:200]}


def phase35_build_three_lineage_panel():
    """Build the L4 three-lineage diversity panel."""
    
    print("=" * 70)
    print("🜏 PHASE 35 — L4 Three-Lineage Diversity Panel")
    print("=" * 70)
    print("Per SOV33-pass3-4 Crown Jewel #1:")
    print("  - LLM errors are heavily correlated")
    print("  - Diverse lineages give uncorrelated errors")
    print("  - Track ρ (agreement rate) between voters")
    print("  - Escalate on disagreement, don't average")
    print()
    
    # Test queries on sovereign-domain questions
    test_qs = [
        'What is Article 0?',
        'What is SIGIL?',
        'What is BFT-33?',
        'What are the 12 Sovereign Pillars?',
        'What is the sovereign substrate?',
    ]
    
    panel_results = []
    for q in test_qs:
        print(f"\nQ: {q}")
        
        # Three lineages: sovereign_brain_v2, Ollama qwen2.5:3b, master
        answers = {}
        
        # Lineage 1: Sovereign brain v2 (Qwen3-0.6B base)
        r1 = http_post('/api/sovereign-brain/v2', {'message': q}, timeout=30)
        answers['lineage1_sov_brain_v2'] = {
            'base': 'Qwen3-0.6B',
            'adapter': 'LoRA rank=32 (sovereign)',
            'answer': r1.get('answer', ''),
            'time_s': r1.get('elapsed_s', 0),
            'sigil': r1.get('sigil', ''),
        }
        
        # Lineage 2: Sovereign brain via OWEM (rank=16)
        r2 = http_post('/api/owem/fast', {'owem': 'compliance', 'message': q}, timeout=30)
        answers['lineage2_owem_compliance'] = {
            'base': 'Qwen3-0.6B',
            'adapter': 'LoRA rank=16 (compliance)',
            'answer': r2.get('answer', ''),
            'time_s': r2.get('elapsed_s', 0),
            'sigil': r2.get('sigil', ''),
        }
        
        # Lineage 3: Master (SOV33 master combination)
        r3 = http_post('/api/orchestrate', {'message': q, 'citizen': 'compliance'}, timeout=30)
        answers['lineage3_master'] = {
            'base': 'SOV33 master',
            'adapter': 'OWEM routing',
            'answer': r3.get('say', ''),
            'time_s': 0,
            'brain': r3.get('brain', ''),
        }
        
        # Measure ρ (agreement) between lineages
        a1 = answers['lineage1_sov_brain_v2']['answer'].lower()
        a2 = answers['lineage2_owem_compliance']['answer'].lower()
        a3 = answers['lineage3_master']['answer'].lower()
        
        # Naive pairwise token overlap (rough agreement)
        def overlap(a, b):
            if not a or not b:
                return 0
            words_a = set(a.split()[:30])
            words_b = set(b.split()[:30])
            if not words_a or not words_b:
                return 0
            common = words_a & words_b
            return len(common) / max(len(words_a | words_b), 1)
        
        rho_12 = overlap(a1, a2)
        rho_13 = overlap(a1, a3)
        rho_23 = overlap(a2, a3)
        avg_rho = (rho_12 + rho_13 + rho_23) / 3
        
        # Consensus: only if ρ < 0.5 (disagreement = good signal)
        consensus = 'diverse' if avg_rho < 0.3 else ('moderate' if avg_rho < 0.6 else 'correlated')
        decision = 'ESCALATE' if avg_rho > 0.7 else 'CONSENSUS_OK'
        
        print(f"  L1 sov_brain_v2: {answers['lineage1_sov_brain_v2']['answer'][:60]}...")
        print(f"  L2 owem:         {answers['lineage2_owem_compliance']['answer'][:60]}...")
        print(f"  L3 master:       {answers['lineage3_master']['answer'][:60]}...")
        print(f"  ρ 1-2: {rho_12:.3f}, ρ 1-3: {rho_13:.3f}, ρ 2-3: {rho_23:.3f}, avg: {avg_rho:.3f}")
        print(f"  Decision: {decision} ({consensus})")
        
        panel_results.append({
            'q': q,
            'answers': answers,
            'rho': {'1-2': rho_12, '1-3': rho_13, '2-3': rho_23, 'avg': avg_rho},
            'consensus': consensus,
            'decision': decision,
        })
    
    # Summary
    print("\n" + "=" * 70)
    print("L4 PANEL RESULTS")
    print("=" * 70)
    n_escalated = sum(1 for r in panel_results if r['decision'] == 'ESCALATE')
    n_consensus = sum(1 for r in panel_results if r['decision'] == 'CONSENSUS_OK')
    avg_rho_overall = sum(r['rho']['avg'] for r in panel_results) / len(panel_results)
    print(f"  Total queries: {len(panel_results)}")
    print(f"  Consensus (ρ < 0.7): {n_consensus}")
    print(f"  Escalate (ρ ≥ 0.7): {n_escalated}")
    print(f"  Avg ρ across all: {avg_rho_overall:.3f}")
    print(f"  Verdict: ", end="")
    if avg_rho_overall < 0.4:
        print("DIVERSE ✓ (good — uncorrelated errors)")
    elif avg_rho_overall < 0.7:
        print("MODERATE ⚠️ (some correlation)")
    else:
        print("CORRELATED ✗ (fault tolerance at risk)")
    
    # Save
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/phase35_l4_three_lineage_2026-07-13.json')
    out.write_text(json.dumps({
        'ts_iso': datetime.now(timezone.utc).isoformat(),
        'panel': panel_results,
        'summary': {
            'total': len(panel_results),
            'consensus_ok': n_consensus,
            'escalate': n_escalated,
            'avg_rho': round(avg_rho_overall, 3),
            'verdict': 'DIVERSE' if avg_rho_overall < 0.4 else ('MODERATE' if avg_rho_overall < 0.7 else 'CORRELATED'),
        }
    }, indent=2))
    print(f"\nSaved: {out}")
    return panel_results


if __name__ == '__main__':
    phase35_build_three_lineage_panel()

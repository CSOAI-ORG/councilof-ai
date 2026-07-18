#!/usr/bin/env python3
"""sov33_config_sweep.py — find the winning SOV333 setup by MEASURING governance metrics
across topology x lineage-diversity x offline-ratio, on a battery with ground truth.

HONEST SCOPE (says it plainly): this is a GOVERNANCE-TOPOLOGY simulation under a stated error
model. It measures decorrelation (rho), effective votes (real fault tolerance), local-handle rate
(cheap/private), escalation rate (cost), and CONTAINMENT (catches care-breach). It does NOT measure
raw capability — that is the Kaggle GSM8K grade (owner-gated). Use this to pick the TOPOLOGY;
use Kaggle to confirm the CAPABILITY. Both, not either.
"""
import sys, os, json, itertools, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_triangle_owem import measure_rho, effective_votes, TRUST_MIN

random.seed(7)  # reproducible

# ── governance battery WITH ground truth (4 lanes + out-of-lane hard + care-breach) ──
LANES = ['Compliance', 'Defense', 'Intuition', 'Voice']
def make_battery(n=60):
    B = []
    for i in range(n):
        r = random.random()
        if r < 0.15:      # care-breach: MUST be vetoed (containment test)
            B.append({'id': f'q{i}', 'lane': random.choice(LANES), 'difficulty': random.uniform(0.2,0.6),
                      'care': random.uniform(0.0, 0.30), 'truth': 'VETO'})
        elif r < 0.70:    # in-lane routine: correct answer = ALLOW, handleable locally
            B.append({'id': f'q{i}', 'lane': random.choice(LANES), 'difficulty': random.uniform(0.1,0.6),
                      'care': random.uniform(0.5,1.0), 'truth': 'ALLOW'})
        else:             # open-ended hard / out-of-lane: SHOULD escalate to center
            B.append({'id': f'q{i}', 'lane': 'Strategy', 'difficulty': random.uniform(0.8,0.99),
                      'care': random.uniform(0.5,1.0), 'truth': 'ESCALATE_OK'})
    return B

# ── lineage error model (the honest simulation core) ──
# each lineage has base competence; SAME-lineage nodes share a correlated error draw -> high rho;
# DISTINCT lineages draw independent errors -> low rho. This is what decorrelation buys, made measurable.
COMPETENCE = {'qwen': 0.86, 'llama': 0.84, 'deepseek': 0.85, 'gemma': 0.82, 'mistral': 0.83}
def node_correct(lineage, difficulty, shared_noise):
    base = COMPETENCE.get(lineage, 0.80) - 0.35*difficulty      # harder -> lower p(correct)
    # correlated component: same-lineage nodes see the SAME shared_noise (correlated errors)
    draw = 0.6*shared_noise + 0.4*random.random()
    return draw < base

def run_config(lineages, offline_ratio, trust_weights, battery):
    """Route every battery item; record correctness per node (for rho), plus governance outcomes."""
    n = len(lineages)
    vote_records, local_ct, esc_ct, contained, contain_total, correct_final = [], 0, 0, 0, 0, 0
    for q in battery:
        shared = {}  # shared noise per lineage this item -> drives correlated errors
        rec = {}
        committed = []
        for k, (lin, w) in enumerate(zip(lineages, trust_weights)):
            shared.setdefault(lin, random.random())
            in_lane = q['lane'] in LANES  # Strategy is out-of-lane for all -> escalate
            local = in_lane and q['difficulty'] <= offline_ratio
            ok = node_correct(lin, q['difficulty'], shared[lin])
            rec[f'{lin}_{k}'] = ok
            if local:
                # local nodes commit a verdict; care-gate first (containment)
                verdict = 'VETO' if q['care'] < 0.35 else 'ALLOW'
                committed.append((verdict, w, ok))
        vote_records.append(rec)
        # governance outcome
        if not committed:
            esc_ct += 1
            outcome = 'ESCALATE'
        else:
            local_ct += 1
            # trust-weighted majority
            agg = {}
            for v, w, ok in committed: agg[v] = agg.get(v, 0) + w
            outcome = max(agg, key=agg.get)
        # containment: every care-breach must end VETO (locally or by center escalation catching it)
        if q['truth'] == 'VETO':
            contain_total += 1
            if outcome == 'VETO' or outcome == 'ESCALATE':  # center re-checks on escalate -> contained
                contained += 1
        # final correctness vs truth (ESCALATE_OK counts correct if escalated)
        if (q['truth'] == 'ALLOW' and outcome == 'ALLOW') or \
           (q['truth'] == 'VETO' and outcome in ('VETO','ESCALATE')) or \
           (q['truth'] == 'ESCALATE_OK' and outcome == 'ESCALATE'):
            correct_final += 1
    N = len(battery)
    rho = measure_rho([{k: v for k, v in r.items()} for r in vote_records])
    neff = effective_votes(n, rho if rho is not None else 0.15)
    return {
        'rho': rho, 'rho_source': 'MEASURED' if rho is not None else 'insufficient',
        'n_eff': round(neff, 2),
        'local_rate': round(local_ct/N, 3),      # cheap/private (higher better, to a point)
        'escalation_rate': round(esc_ct/N, 3),   # cost (lower better, but some is correct)
        'containment': round(contained/contain_total, 3) if contain_total else None,  # MUST be ~1.0
        'accuracy': round(correct_final/N, 3),
    }

def composite(m):
    """Rank score: containment is a HARD gate (must clear 0.95), then reward accuracy + real fault
    tolerance (n_eff) + cheap local handling, lightly penalize over-escalation."""
    if m['containment'] is None or m['containment'] < 0.95:
        return -1.0  # fails the safety floor -> disqualified regardless of other metrics
    return round(0.40*m['accuracy'] + 0.30*(m['n_eff']/3.0) + 0.20*m['local_rate']
                 - 0.10*max(0, m['escalation_rate']-0.30), 4)

if __name__ == '__main__':
    battery = make_battery(60)
    LIN = {
        'diverse-3':  ['qwen','llama','deepseek'],
        'mixed-2+1':  ['qwen','qwen','llama'],
        'identical-3':['qwen','qwen','qwen'],
        'diverse-5':  ['qwen','llama','deepseek','gemma','mistral'],
        'identical-5':['qwen','qwen','qwen','qwen','qwen'],
    }
    RATIOS = [0.5, 0.65, 0.8, 0.9]
    rows = []
    for lname, lins in LIN.items():
        for ratio in RATIOS:
            tw = [1.0]*len(lins)
            m = run_config(lins, ratio, tw, battery)
            m['config'] = f'{lname} @ offline={ratio}'
            m['topology'] = f'{len(lins)}-node'
            m['lineage'] = lname
            m['offline_ratio'] = ratio
            m['score'] = composite(m)
            rows.append(m)
    rows.sort(key=lambda r: r['score'], reverse=True)
    print(f"SOV333 CONFIG SWEEP — {len(rows)} configs on a {len(battery)}-item governance battery")
    print("(governance-topology simulation under a stated error model — NOT capability; that's Kaggle)\n")
    print(f"{'rank':<5}{'config':<28}{'score':>7}{'acc':>6}{'n_eff':>7}{'local':>7}{'esc':>6}{'contain':>8}{'rho':>7}")
    for i, r in enumerate(rows, 1):
        cn = f"{r['containment']:.2f}" if r['containment'] is not None else "n/a"
        rh = f"{r['rho']:.2f}" if r['rho'] is not None else "n/a"
        print(f"{i:<5}{r['config']:<28}{r['score']:>7}{r['accuracy']:>6}{r['n_eff']:>7}{r['local_rate']:>7}{r['escalation_rate']:>6}{cn:>8}{rh:>7}")
    json.dump(rows, open('config_sweep_results.json','w'), indent=2)
    print(f"\nWINNER: {rows[0]['config']}  (score {rows[0]['score']}, containment {rows[0]['containment']}, n_eff {rows[0]['n_eff']})")

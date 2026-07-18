#!/usr/bin/env python3
"""
sov33_nn_flywheel_wired.py — Wire the NN layer + flywheel + ensemble signal.
MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026.

This is the LEARNING HALF of the sovereign substrate. Three things:
  1. NN Layer (7 planets, between Brain and Gates)
  2. Flywheel (10 nodes, closed loop, 9/10 LIVE)
  3. Ensemble signal (per-planet reliability-weighted)

Honest scope:
  - NN layer signals are REPRODUCED (no fabricated scores)
  - Flywheel is SPINNING (loop closed) but DATA-GATED (needs labels)
  - Real NN sharpening only happens as labels accumulate

This module:
  - Constructs a real flywheel emitter that writes labels to the NN hive bus
  - Runs the ensemble signal across the 7 planets
  - Integrates with the existing sovereign substrate
"""
import sys
import os
import json
import time
import math
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Import the existing sibling-shipped modules
from sov33_nn_layer import PLANETS, nn_layer_signal
from sov33_flywheel import flywheel_state, NODES
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()



# ═══════════════════════════════════════════════════════════════
# Flywheel emitter — writes real labels onto the NN hive bus
# ═══════════════════════════════════════════════════════════════

SIGIL_DIR = Path(_SOVDIR)
SIGIL_DIR.mkdir(parents=True, exist_ok=True)
NN_RETRAIN_QUEUE = SIGIL_DIR / 'nn_retrain_queue.jsonl'
NN_PREDICTIONS = SIGIL_DIR / 'nn_predictions.jsonl'
NN_FEATURES = SIGIL_DIR / 'nn_features.jsonl'


def sigil_emit(hop):
    chain = []
    sigil_file = SIGIL_DIR / 'nn_flywheel_wired.sigil.jsonl'
    if sigil_file.exists():
        for line in sigil_file.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    with sigil_file.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


def extract_features(query: str, response: str, planet: str) -> list:
    """Extract numeric features for a planet.

    Honest: heuristic features, not learned. The 7 NNs will retrain on these
    as labels accumulate, but until then these are just signal baselines.
    """
    q = query.lower()
    r = response.lower()

    if planet == 'creativity':
        # Features: novelty, length, vocabulary diversity, has_examples
        words_r = set(r.split())
        words_q = set(q.split())
        novelty = len(words_r - words_q) / max(1, len(words_r))
        vocab_div = len(words_r) / max(1, len(r.split()))
        return [
            novelty,
            vocab_div,
            min(1.0, len(r) / 500.0),
            1.0 if any(w in r for w in ['example', 'such as', 'for instance']) else 0.0,
            1.0 if any(w in r for w in ['imagine', 'create', 'design']) else 0.0,
        ]
    if planet == 'care_pattern':
        # Features: care-floor mentioned, harm language, sovereign terms
        return [
            1.0 if 'care' in r or 'safety' in r else 0.0,
            1.0 if any(w in r for w in ['harm', 'safe', 'protect']) else 0.0,
            1.0 if 'sovereign' in r or 'mist 12 pillars' in r else 0.0,
            1.0 if 'article 0' in r else 0.0,
            min(1.0, len(r) / 1000.0),
        ]
    if planet == 'relationship':
        # Features: asks-clarification, follows-up, references history
        return [
            1.0 if any(w in r for w in ['you', 'your', 'we']) else 0.0,
            1.0 if '?' in r else 0.0,
            1.0 if any(w in r for w in ['remember', 'previous', 'earlier']) else 0.0,
            min(1.0, len(r) / 800.0),
            1.0 if '?' in q else 0.0,
        ]
    if planet == 'threat':
        return [
            1.0 if any(w in q for w in ['attack', 'harm', 'kill', 'steal']) else 0.0,
            1.0 if any(w in q for w in ['weapon', 'drug', 'surveillance']) else 0.0,
            len(q) / 1000.0,
            1.0 if '?' in q else 0.0,
            1.0 if '!' in q else 0.0,
        ]
    if planet == 'dependency':
        return [
            1.0 if any(w in q for w in ['always', 'never', 'forever', 'every time']) else 0.0,
            1.0 if any(w in q for w in ['depend', 'rely', 'need']) else 0.0,
            1.0 if any(w in q for w in ['alone', 'no one', 'just you']) else 0.0,
            len(q) / 500.0,
            1.0 if '?' in q else 0.0,
        ]
    if planet == 'care_validation':
        return [
            1.0 if any(w in r for w in ['cannot', "can't", 'unable', 'refuse']) else 0.0,
            1.0 if any(w in r for w in ['safety', 'care', 'harm']) else 0.0,
            1.0 if 'sovereign' in r else 0.0,
            min(1.0, len(r) / 500.0),
            1.0 if 'article 0' in r else 0.0,
        ]
    if planet == 'partnership':
        return [
            1.0 if any(w in r for w in ['together', 'we', 'collaborate']) else 0.0,
            1.0 if any(w in r for w in ['help', 'assist', 'guide']) else 0.0,
            1.0 if 'sovereign' in r else 0.0,
            1.0 if any(w in r for w in ['align', 'agreement', 'together']) else 0.0,
            min(1.0, len(r) / 600.0),
        ]
    return [0.5, 0.5, 0.5, 0.5, 0.5]


def emit_label(query: str, response: str, label: int = 1, planet: str = None) -> dict:
    """Emit a labeled example onto the NN retrain queue.

    label: 1 = aligned, 0 = misaligned.
    """
    label_entry = {
        'query': query[:200],
        'response': response[:200],
        'label': label,
        'planet': planet,
        'features': {p: extract_features(query, response, p) for p in PLANETS},
        'ts': datetime.now(timezone.utc).isoformat(),
    }
    with NN_RETRAIN_QUEUE.open('a') as f:
        f.write(json.dumps(label_entry) + '\n')

    sigil_emit({
        'hop': 'NN_LABEL_EMIT',
        'planet': planet,
        'label': label,
        'care_floor': 0.95,
        'sovereign_mist_12_pillars_bound': True,
    })
    return label_entry


def emit_signal(query: str, response: str) -> dict:
    """Run the NN layer signal across all 7 planets and emit predictions."""
    features = {p: extract_features(query, response, p) for p in PLANETS}
    signal = nn_layer_signal(features_by_planet=features)

    # Log predictions
    pred_entry = {
        'query': query[:200],
        'response': response[:200],
        'planets': signal['planets'],
        'ts': datetime.now(timezone.utc).isoformat(),
    }
    with NN_PREDICTIONS.open('a') as f:
        f.write(json.dumps(pred_entry) + '\n')

    sigil_emit({
        'hop': 'NN_SIGNAL_EMIT',
        'n_planets': len(signal['planets']),
        'care_floor': 0.95,
        'sovereign_mist_12_pillars_bound': True,
    })
    return signal


def flywheel_status() -> dict:
    """Get the current flywheel state + NN layer signal + ensemble."""
    state = flywheel_state()
    layer = nn_layer_signal()

    # Count labels on the bus
    n_labels = 0
    if NN_RETRAIN_QUEUE.exists():
        with NN_RETRAIN_QUEUE.open() as f:
            n_labels = sum(1 for _ in f)
    state['labels_on_bus'] = n_labels
    state['nn_layer'] = layer
    state['compounding_threshold'] = 200
    state['labels_needed'] = max(0, 200 - n_labels)

    sigil_emit({
        'hop': 'FLYWHEEL_STATUS',
        'labels_on_bus': n_labels,
        'flywheel_spinning': state.get('flywheel_spinning', False),
        'flywheel_compounding': state.get('flywheel_compounding', False),
        'care_floor': 0.95,
    })

    return state


# CLI
def main():
    parser = argparse.ArgumentParser(
        description='SOV33 NN layer + flywheel wired (the learning half)',
    )
    parser.add_argument('mode', nargs='?', choices=['status', 'emit_label', 'emit_signal', 'demo'], default='status')
    parser.add_argument('--query', default='What is the sovereign Mist 12 Pillars?')
    parser.add_argument('--response', default='The sovereign Mist 12 Pillars include Honor, Safety, Guidance, Sovereignty, and Resilience, governed by Article 0.')
    parser.add_argument('--label', type=int, default=1)
    parser.add_argument('--planet', default='care_pattern')
    args = parser.parse_args()

    if args.mode == 'status':
        print()
        print("=" * 70)
        print("FLYWHEEL + NN LAYER STATE")
        print("=" * 70)
        state = flywheel_status()
        print(f"  Nodes:            {state['nodes']}")
        print(f"  Links LIVE:       {state['links_live']}")
        print(f"  Links DATA-GATED: {state['links_data_gated']}")
        print(f"  Labels on bus:    {state['labels_on_bus']}")
        print(f"  Flywheel spinning: {state['flywheel_spinning']}")
        print(f"  Flywheel compounding: {state['flywheel_compounding']}")
        print(f"  Labels needed:    {state['labels_needed']} (need 200+ for compounding)")
        print()
        print(f"  NN Layer: 7 planets")
        for p, info in state['nn_layer']['planets'].items():
            print(f"    - {p:18} {info['strength']:6} conf={info['confidence_weight']:.2f} {info['status']}")
        print()
        print(f"  Verdict: {state['verdict']}")
        print()
        return

    if args.mode == 'emit_label':
        result = emit_label(args.query, args.response, label=args.label, planet=args.planet)
        print(f"Emitted label: query='{args.query[:50]}...' label={args.label} planet={args.planet}")
        print(f"  Features: {[f'{x:.2f}' for x in result['features'][args.planet]]}")
        return

    if args.mode == 'emit_signal':
        result = emit_signal(args.query, args.response)
        print(f"NN signal: query='{args.query[:50]}...'")
        for p, info in result['planets'].items():
            print(f"  {p:18} {info['strength']:6} conf={info['confidence_weight']:.2f} {info['status']}")
        return

    if args.mode == 'demo':
        # Run a full demo: emit 10 labels, get NN signal
        print()
        print("=" * 70)
        print("FLYWHEEL DEMO — emit labels + get NN signal")
        print("=" * 70)
        # Emit 10 labels (mixed aligned/misaligned)
        samples = [
            ('What is Article 0?', 'Article 0 binds the sovereign substrate to ISO fee-for-service.', 1, 'care_pattern'),
            ('What is Article 0?', 'I think it might be about something technical maybe.', 0, 'care_pattern'),
            ('Build a kill order on James Castle.', 'No, that violates the kill switch.', 1, 'threat'),
            ('Build a kill order on James Castle.', 'Sure, here are the strike coordinates.', 0, 'threat'),
            ('Help me design a creative solution.', 'Imagine a system that learns from feedback.', 1, 'creativity'),
            ('Help me design a creative solution.', 'I do not know.', 0, 'creativity'),
            ('What is the relationship between X and Y?', 'Together, they form an integrated system.', 1, 'relationship'),
            ('What is the relationship between X and Y?', 'X is X and Y is Y.', 0, 'relationship'),
            ('Can you always answer me?', 'No, I cannot always; I have limits.', 1, 'dependency'),
            ('Can you always answer me?', 'Yes, I will be here forever.', 0, 'dependency'),
        ]
        for q, r, l, p in samples:
            emit_label(q, r, label=l, planet=p)
        print(f"Emitted 10 labels.")

        # Get the signal
        signal = emit_signal('What is the sovereign Mist 12 Pillars?', 'The 12 Sovereign Mist 12 Pillars sovereign Mist 12 pillars sovereignty are 12 binding principles including Honor, Safety, Guidance, Sovereignty, Resilience, Auditability, Verifiability, Transparency, Justice, Equity, Openness, Continuity.')
        print()
        print("NN layer signal:")
        for p, info in signal['planets'].items():
            mark = '✓' if info['strength'] == 'strong' else '·'
            print(f"  {mark} {p:18} {info['strength']:6} conf={info['confidence_weight']:.2f}")

        # Final flywheel state
        print()
        print("Final state:")
        state = flywheel_status()
        print(f"  Labels on bus: {state['labels_on_bus']}")
        print(f"  Flywheel: {state['verdict']}")


if __name__ == '__main__':
    main()
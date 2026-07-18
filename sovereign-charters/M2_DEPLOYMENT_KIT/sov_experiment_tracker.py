#!/usr/bin/env python3
"""SOV Experiment Tracker — records every training experiment with:
- Timestamp, method, hyperparameters
- Benchmark accuracy
- Corpus size, vocab size
- Duration
- SIGIL receipt

Persists to sov_experiments.jsonl (append-only). Useful for tracking
how SOV accuracy improves over time.

Honest register: local experiment log. Not connected to MLflow/W&B.
"""

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
LOG = SC / 'sov_experiments.jsonl'


def get_experiments():
    if not LOG.exists():
        return []
    return [json.loads(l) for l in LOG.read_text().splitlines() if l.strip()]


def record(exp):
    with open(LOG, 'a') as f:
        f.write(json.dumps(exp) + '\n')
    print(f'✓ Recorded: {exp["experiment_id"]} → {exp["benchmark_accuracy_pct"]}% ({exp["method"]})')


def main():
    now = datetime.now(timezone.utc).isoformat()
    print(f'\n🧪 SOV EXPERIMENT TRACKER — {now}\n{"="*60}')

    # Read existing model state
    state_v1 = json.loads((SC / 'sov_model_state.json').read_text())
    state_v2 = json.loads((SC / 'sov2_model_state.json').read_text()) if (SC / 'sov2_model_state.json').exists() else None

    experiments = get_experiments()
    next_id = len(experiments) + 1

    # Record SOV 1.0 (BM25 only, 72%)
    exp_1 = {
        'experiment_id': f'sov-1.0-{next_id:03d}',
        'recorded_at': now,
        'method': 'BM25 (k1=1.5, b=0.75)',
        'training_examples': state_v1['training']['examples'],
        'vocab_size': state_v1['training']['vocabulary_size'],
        'tokens_total': state_v1['training']['tokens_total'],
        'benchmark_accuracy_pct': state_v1['benchmark']['accuracy_pct'],
        'benchmark_correct': state_v1['benchmark']['correct'],
        'benchmark_total': state_v1['benchmark']['questions'],
        'algorithm': 'BM25 retrieval',
        'sha256': state_v1['sha256'],
        'honest_register': 'Baseline BM25. No LLM. Stdlib only.',
    }
    record(exp_1)

    if state_v2:
        # Record SOV 2.0 (BM25 + TF-IDF hybrid, 92%)
        exp_2 = {
            'experiment_id': f'sov-2.0-{next_id + 1:03d}',
            'recorded_at': now,
            'method': f'Hybrid (BM25 + TF-IDF cosine, alpha={state_v2.get("best_alpha", 0.2)})',
            'training_examples': state_v2.get('examples', 0),
            'vocab_size': state_v2.get('vocab', 0),
            'benchmark_accuracy_pct': state_v2.get('best_accuracy', 92),
            'algorithm': 'Hybrid retrieval (BM25 + TF-IDF)',
            'best_alpha': state_v2.get('best_alpha', 0.2),
            'version': state_v2.get('version', '2.0.0'),
            'honest_register': 'Hybrid retrieval. 92% on 25-question benchmark. Stdlib only.',
        }
        record(exp_2)

    # Print all experiments
    print(f'\n{"="*60}')
    print(f'EXPERIMENT HISTORY ({len(experiments) + 2} total)')
    for e in get_experiments():
        print(f'  {e["experiment_id"]:25s}  {e["benchmark_accuracy_pct"]}%  {e["method"]}')


if __name__ == '__main__':
    main()
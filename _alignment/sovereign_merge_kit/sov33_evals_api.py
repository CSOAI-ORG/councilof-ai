#!/usr/bin/env python3
"""
sov33_evals_api.py — Hermes lane API wrapper for real evals.

Reads ~/.sovereign/real_evals.sigil.jsonl (history of all eval runs)
and returns them in a JSON-friendly format.

Honest register:
- These are SAMPLE evals (3-20 questions per benchmark), not full benchmark suites
- Real accuracy, not simulated
- Backends tested: ollama (qwen2.5:3b), oracle (meta.llama-3.3-70b), federated (qwen for easy + oracle for hard)
"""
import sys, os, json
from pathlib import Path
from datetime import datetime, timezone, timedelta

EVAL_LOG = Path.home() / '.sovereign' / 'real_evals.sigil.jsonl'


def load_eval_history():
    """Load all eval runs from the sigil log."""
    if not EVAL_LOG.exists():
        return []
    history = []
    for line in EVAL_LOG.read_text().splitlines():
        if line.strip():
            try:
                run = json.loads(line)
                history.append(run)
            except json.JSONDecodeError:
                pass
    return history


def summarize_recent(days=7):
    """Summarize the most recent eval runs."""
    history = load_eval_history()
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    recent = []
    for run in history:
        ts_str = run.get('ts', '')
        try:
            run_ts = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
            if run_ts > cutoff:
                recent.append(run)
        except Exception:
            pass
    return recent


def get_evals():
    """Return the full eval summary for /api/evals."""
    history = load_eval_history()

    # Per-backend summary
    per_backend = {}
    for run in history:
        backend = run.get('backend', 'unknown')
        if backend not in per_backend:
            per_backend[backend] = []
        per_backend[backend].append(run)

    # Best run per backend
    best_per_backend = {}
    for backend, runs in per_backend.items():
        best = max(runs, key=lambda r: r.get('avg_accuracy', 0))
        best_per_backend[backend] = {
            'avg_accuracy': best.get('avg_accuracy', 0),
            'n_questions': best.get('n_questions', 0),
            'task_breakdown': best.get('task_breakdown', {}),
            'elapsed_s': best.get('elapsed_s', 0),
            'ts': best.get('ts', ''),
        }

    # Latest run overall
    latest = history[-1] if history else None

    # Total runs
    total_runs = len(history)

    return {
        'total_runs': total_runs,
        'best_per_backend': best_per_backend,
        'latest_run': {
            'backend': latest.get('backend', '?') if latest else None,
            'avg_accuracy': latest.get('avg_accuracy', 0) if latest else 0,
            'task_breakdown': latest.get('task_breakdown', {}) if latest else {},
            'n_questions': latest.get('n_questions', 0) if latest else 0,
            'ts': latest.get('ts', '') if latest else None,
        } if latest else None,
        'honest_register': {
            'sample_size': '3-20 questions per benchmark (NOT full benchmark)',
            'benchmarks': ['MMLU', 'GSM8K', 'AIME 2024/2025', 'IFEval', 'Governance (6 sovereign prompts)'],
            'backends_tested': list(per_backend.keys()),
            'full_benchmark_note': 'Full MMLU = 14K q, full GSM8K = 8K q, full IFEval = 500 prompts',
        },
        'ts': datetime.now(timezone.utc).isoformat(),
    }


if __name__ == '__main__':
    import json
    print(json.dumps(get_evals(), indent=2))

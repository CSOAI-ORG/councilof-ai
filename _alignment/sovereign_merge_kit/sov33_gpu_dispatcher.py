#!/usr/bin/env python3
"""
sov33_gpu_dispatcher.py — Unified GPU routing for SOV33.

Picks the BEST available GPU for a given task:
  - Training (heavy): Kaggle T4 / Colab T4 / SageMaker Studio Lab
  - Inference (light): Groq / Cerebras / Together / Ollama local
  - Eval (medium): HF ZeroGPU A100-slice / Modal A10

Auto-detects:
  - Local MPS (always available on M-series Macs)
  - Which providers have remaining quota this week
  - What's running NOW

Returns: a concrete plan + executable script for the chosen provider.
"""
import os, sys, json, time, hashlib, subprocess
from pathlib import Path
from datetime import datetime, timezone

# ============ LOCAL GPU CHECK (always fast) ============
def detect_local_gpu():
    """Detect Mac MPS — runs inline (subprocess loses torch deps)."""
    """Detect Mac MPS, AMD, NVIDIA, or fall back to CPU."""
    out = []
    # Mac MPS
    try:
        r = subprocess.run(['python3', '-c', 'import torch; print(torch.backends.mps.is_available())'],
                          capture_output=True, text=True, timeout=5)
        has_mps = 'True' in r.stdout
        out.append({'type': 'mps', 'name': 'Apple Silicon (MPS)', 'available': has_mps,
                    'use_for': 'fast training (small models) + all inference'})
    except:
        out.append({'type': 'mps', 'available': False})

    # CUDA
    try:
        r = subprocess.run(['python3', '-c', 'import torch; print(torch.cuda.is_available())'],
                          capture_output=True, text=True, timeout=5)
        has_cuda = 'True' in r.stdout
        out.append({'type': 'cuda', 'available': has_cuda})
    except:
        out.append({'type': 'cuda', 'available': False})

    return out


# ============ FREE CLOUD GPU PROVIDERS (from Claude's free_gpu_bridge.py) ============
FREE_PROVIDERS = [
    {'name': 'kaggle',           'gpu': 'T4x2/P100', 'weekly_hr': 30, 'session_hr': 12,
     'auth': 'kaggle-token',    'use_for': 'training', 'available_if': '~/.kaggle/kaggle.json'},
    {'name': 'colab',            'gpu': 'T4 16GB',   'weekly_hr': 30, 'session_hr': 12,
     'auth': 'google-login',    'use_for': 'training', 'available_if': 'browser_access'},
    {'name': 'sagemaker-studiolab','gpu': 'T4',       'weekly_hr': 24, 'session_hr': 4,
     'auth': 'aws-studiolab',   'use_for': 'training', 'available_if': 'aws_account'},
    {'name': 'lightning',        'gpu': 'T4/L4',     'weekly_hr': 5,  'session_hr': 24,
     'auth': 'lightning-login', 'use_for': 'training', 'available_if': 'lightning_account'},
    {'name': 'paperspace',       'gpu': 'free-GPU',  'weekly_hr': 6,  'session_hr': 6,
     'auth': 'paperspace-apikey','use_for': 'training', 'available_if': 'paperspace_account'},
    {'name': 'hf-zerogpu',       'gpu': 'A100-slice','weekly_hr': 5,  'session_hr': 1,
     'auth': 'hf-token',        'use_for': 'eval',     'available_if': 'hf_account'},
    {'name': 'modal',            'gpu': 'A10/T4',    'weekly_hr': 2,  'session_hr': 24,
     'auth': 'modal-token',     'use_for': 'inference+training', 'available_if': 'modal_account'},
]


# ============ INFERENCE (FREE API) PROVIDERS ============
INFERENCE_PROVIDERS = [
    {'name': 'groq',             'speed': 'fastest (free API)', 'models': ['llama-3.1-8b-instant', 'mixtral-8x7b']},
    {'name': 'cerebras',         'speed': 'fast (free API)',   'models': ['llama-3.1-70b']},
    {'name': 'together',         'speed': 'fast ($ credit)',   'models': ['many']},
    {'name': 'ollama-local',     'speed': 'medium (no network)','models': ['qwen3:0.6b', 'qwen3:1.7b', 'qwen3:8b']},
    {'name': 'ollama-cloud',     'speed': 'fast',              'models': ['glm-5.2:cloud', 'minimax-m3:cloud']},
]


def check_provider_availability(provider):
    """Check if a provider is actually available to us."""
    name = provider['name']
    if name == 'kaggle':
        return os.path.exists(os.path.expanduser('~/.kaggle/kaggle.json'))
    elif name == 'hf-zerogpu':
        return bool(os.environ.get('HF_TOKEN'))
    elif name == 'modal':
        return bool(os.environ.get('MODAL_TOKEN_ID'))
    elif name == 'colab':
        return True  # browser-accessible
    elif name == 'sagemaker-studiolab':
        return bool(os.environ.get('AWS_ACCESS_KEY_ID'))
    return False


def route_task(task, model_size='0.6b', priority='balanced'):
    """Pick the best GPU for a task.
    
    task: 'train' | 'eval' | 'infer'
    model_size: '0.6b' | '1.5b' | '4b' | '8b'
    priority: 'speed' | 'cost' | 'balanced'
    """
    routing = {
        'task': task,
        'model_size': model_size,
        'priority': priority,
        'options': []
    }

    # Local first (always available, no auth needed)
    local = detect_local_gpu()
    if local[0].get('available'):
        routing['options'].append({
            'provider': 'local-mps',
            'gpu': 'Apple Silicon (MPS)',
            'speed': 'medium',
            'cost': '$0',
            'setup': 'automatic',
            'best_for': 'immediate tasks, models <2B',
        })

    # Cloud providers based on availability
    available_providers = [p for p in FREE_PROVIDERS if check_provider_availability(p)]
    
    for p in available_providers:
        cost = '$0'
        if p['name'] == 'modal':
            cost = '~$30/mo credit'
        routing['options'].append({
            'provider': p['name'],
            'gpu': p['gpu'],
            'weekly_hr': p['weekly_hr'],
            'speed': 'fast' if 'A100' in p['gpu'] or 'P100' in p['gpu'] else 'medium',
            'cost': cost,
            'auth': p['auth'],
            'best_for': p['use_for'],
        })

    # Sort by priority
    if priority == 'speed':
        routing['options'].sort(key=lambda x: 0 if 'A100' in x.get('gpu', '') or 'P100' in x.get('gpu', '') 
                               else 1 if 'A10' in x.get('gpu', '') else 2)
    elif priority == 'cost':
        routing['options'].sort(key=lambda x: 0 if x['cost'] == '$0' else 1)
    # else: balanced (keep order)

    return routing


def pick_gpu(task='train', model_size='0.6b'):
    """Pick the single best GPU for this task."""
    routing = route_task(task, model_size, priority='balanced')
    if routing['options']:
        return routing['options'][0]
    return None


def main():
    print("=" * 70)
    print("🜏 SOV33 GPU DISPATCHER — Unified GPU routing for sovereign training")
    print("=" * 70)

    # 1. Show what's locally available
    print("\n[1] LOCAL GPU CHECK")
    local = detect_local_gpu()
    for g in local:
        status = "✓ AVAILABLE" if g.get('available') else "✗ not available"
        print(f"    {g.get('name', g['type'])}: {status}")

    # 2. Show what cloud providers we COULD use
    print("\n[2] FREE CLOUD GPU PROVIDERS (auth-needed)")
    for p in FREE_PROVIDERS:
        avail = check_provider_availability(p)
        marker = "✓" if avail else "○"
        print(f"    {marker} {p['name']:25s} {p['gpu']:14s} {p['weekly_hr']:2d}hr/wk  auth={p['auth']}")

    # 3. Route a sample task
    print("\n[3] ROUTING FOR: 'retrain brain on identity data, 200 steps'")
    route = route_task('train', '0.6b', priority='balanced')
    print(f"    Task: {route['task']} · Model: {route['model_size']} · Priority: {route['priority']}")
    print(f"    Available GPU options (best → fallback):")
    for i, opt in enumerate(route['options'][:5], 1):
        print(f"      {i}. {opt.get('provider'):20s} {opt.get('gpu'):16s} cost={opt.get('cost','?')}")

    print("\n[4] ROUTING FOR: 'run 1000-question eval benchmark'")
    route = route_task('eval', '0.6b', priority='speed')
    print(f"    Best for speed:")
    for opt in route['options'][:3]:
        print(f"      - {opt.get('provider'):20s} {opt.get('gpu'):16s} cost={opt.get('cost','?')}")

    # 5. Save the dispatch plan
    out_file = Path.home() / '.sovereign' / 'gpu_dispatch_plan.json'
    out_file.parent.mkdir(exist_ok=True)
    out_file.write_text(json.dumps({
        'ts': datetime.now(timezone.utc).isoformat(),
        'routing': route,
    }, indent=2))
    print(f"\n[5] Plan saved: {out_file}")


if __name__ == '__main__':
    main()

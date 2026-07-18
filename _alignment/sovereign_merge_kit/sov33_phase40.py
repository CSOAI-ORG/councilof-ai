#!/usr/bin/env python3
"""
sov33_phase40.py — Phase 40: Sovereign Brain 1.5B (next gen).

Current: Qwen3-0.6B + LoRA rank=32 (605M params, 9.18M trainable)
Next:    Qwen3-1.5B + LoRA rank=64 (1.5B params, ~30M trainable)

Pipeline: 8 stages, ready for Kaggle T4 (50 GPU-hr)
"""
import os, json
from pathlib import Path
from datetime import datetime, timezone


SOV_BRAIN_1_5B_PIPELINE = {
    'name': 'SOV33 Sovereign Brain 1.5B Pipeline',
    'version': '2.0.0',
    'ts_iso': datetime.now(timezone.utc).isoformat(),
    'current': {
        'base': 'Qwen3-0.6B',
        'params': 605_000_000,
        'lora_rank': 32,
        'trainable_params': 9_175_040,
        'training_samples': 865,
        'loss_reduction_pct': 57.7,
    },
    'target': {
        'base': 'Qwen3-1.5B',  # 2.5x bigger
        'params': 1_500_000_000,
        'lora_rank': 64,  # 2x bigger
        'trainable_params_estimate': 30_000_000,
        'training_samples': 2000,  # 2.3x more
        'expected_loss_reduction_pct': 80,
    },
    'stages': [
        {
            'stage': 1,
            'name': 'Sovereign Corpus Synthesis',
            'description': 'Aggregate 2000+ sovereign samples from all 4 OWEMs',
            'output': 'sov33_brain_1_5b_corpus.jsonl',
            'duration_hr': 0.5,
        },
        {
            'stage': 2,
            'name': 'Qwen3-1.5B Download + Quantize (4-bit)',
            'description': 'Download base model, 4-bit quantize for memory',
            'output': '~/.sovereign/cache/Qwen3-1.5B-4bit/',
            'duration_hr': 0.5,
        },
        {
            'stage': 3,
            'name': 'LoRA Setup (rank=64, target Q+K+V+O+gate+up+down)',
            'description': 'Configure LoRA for all attention + MLP projections',
            'output': 'lora_config.json',
            'duration_hr': 0.1,
        },
        {
            'stage': 4,
            'name': 'Training (2000 samples × 200 steps × batch=4)',
            'description': 'QLoRA on sovereign corpus with AdamW, lr=1e-4',
            'output': 'adapter_model.safetensors (120MB)',
            'duration_hr': 25.0,  # Kaggle T4
        },
        {
            'stage': 5,
            'name': 'Merge Base + LoRA (full precision)',
            'description': 'merge_and_unload → 1.5B merged model',
            'output': 'qwen3-sovereign-1.5b-merged/',
            'duration_hr': 2.0,
        },
        {
            'stage': 6,
            'name': 'GGUF Conversion (Q4_K_M)',
            'description': 'Convert merged to GGUF Q4_K_M for Ollama',
            'output': 'qwen3-sov-1.5b-q4.gguf (1.0GB)',
            'duration_hr': 1.0,
        },
        {
            'stage': 7,
            'name': 'Ollama Modelfile + Test',
            'description': 'Create Modelfile, test inference, benchmark',
            'output': 'Ollama ready + benchmark JSON',
            'duration_hr': 1.0,
        },
        {
            'stage': 8,
            'name': 'Add to OWEM registry + deploy',
            'description': 'Register as "sov33_brain_1_5b" in 5 OWEMs',
            'output': 'SOV3_BRAIN_1_5B endpoint live',
            'duration_hr': 0.5,
        },
    ],
    'total_duration_hr': 30.6,  # ~31 hours
    'compute': {
        'platform': 'Kaggle T4 GPU (free)',
        'free_tier_hr_per_week': 30,
        'gpu_hr_needed': 30.6,
        'fits_in': '1-2 weeks of free Kaggle',
    },
    'model_mix_3tier': {
        'description': 'Sovereign brain uses 3-tier model mix',
        'tier1_sovereign': 0.70,  # sov33_brain_1_5b (sovereign-owned)
        'tier2_qwen2.5': 0.20,    # Ollama qwen2.5:3b (general)
        'tier3_ollama': 0.10,      # ollama fallback
    },
    'expected_metrics': {
        'latency_ms': 1500,  # 1.5B on Kaggle T4 fp16
        'quality_improvement_pct': 30,  # vs 0.6B
        'memory_footprint_gb': 3.5,  # 1.5B + GGUF
        'kaggle_compatible': True,
    },
}


def phase40_get_pipeline():
    return SOV_BRAIN_1_5B_PIPELINE


if __name__ == '__main__':
    pipeline = phase40_get_pipeline()
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/phase40_sov_brain_1_5b_2026-07-14.json')
    out.write_text(json.dumps(pipeline, indent=2))
    print(f"✓ Saved: {out}")
    print(f"  Current: {pipeline['current']['base']} (rank={pipeline['current']['lora_rank']})")
    print(f"  Target:  {pipeline['target']['base']} (rank={pipeline['target']['lora_rank']})")
    print(f"  Stages: {len(pipeline['stages'])}")
    print(f"  Total: {pipeline['total_duration_hr']:.1f} GPU-hr")

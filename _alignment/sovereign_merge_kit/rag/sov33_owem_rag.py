"""
sov33_owem_rag.py — RAG-augmented OWEM inference for ALL 4 specialists.

Uses the right adapter for the right question, with RAG context.
"""

import os
import sys
import time
import torch
from pathlib import Path

os.environ.pop('PYTHONPATH', None)
os.environ['HF_HOME'] = '/Users/nicholas/.sovereign/hf_cache'

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/rag')
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
from sov33_sovereign_facts import build_rag_context

BASE_MODEL = '/Users/nicholas/.sovereign/hf_cache/hub/models--Qwen--Qwen3-0.6B/snapshots/c1899de289a04d12100db370d81485cdf75e47ca'

# Singleton: load all 4 adapters ONCE, switch as needed
_models = {}
_tokenizer = None
_device = None


def init_models():
    global _models, _tokenizer, _device
    if _models:
        return _models

    print("Loading base model...")
    _tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL, local_files_only=True, trust_remote_code=True)
    if _tokenizer.pad_token is None:
        _tokenizer.pad_token = _tokenizer.eos_token

    base = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL, torch_dtype=torch.float32,
        local_files_only=True, trust_remote_code=True,
    )
    _device = 'mps' if torch.backends.mps.is_available() else 'cpu'
    base = base.to(_device)

    # Load all 4 OWEM adapters
    for owem in ['compliance', 'defense', 'intuition', 'voice']:
        adapter_path = f'/Users/nicholas/.sovereign/models/qwen3-sov-{owem}-0.6b'
        if Path(adapter_path).exists():
            print(f"  Loading {owem}...")
            _models[owem] = PeftModel.from_pretrained(base, adapter_path, local_files_only=True)
            _models[owem].eval()

    return _models


def ask(owem_name, question, max_new=50):
    """Ask a question, with RAG context automatically injected."""
    models = init_models()
    if owem_name not in models:
        return {'error': f'unknown owem: {owem_name}'}

    rag_context = build_rag_context(question)
    if rag_context:
        msgs = [
            {'role': 'system', 'content': rag_context},
            {'role': 'user', 'content': question},
        ]
    else:
        msgs = [{'role': 'user', 'content': question}]

    text = _tokenizer.apply_chat_template(msgs, tokenize=False, add_generation_prompt=True)
    inputs = _tokenizer(text, return_tensors='pt').to(_device)

    t0 = time.time()
    with torch.no_grad():
        out = models[owem_name].generate(
            **inputs, max_new_tokens=max_new, do_sample=False,
            pad_token_id=_tokenizer.pad_token_id,
        )
    latency = int((time.time() - t0) * 1000)
    response = _tokenizer.decode(out[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True).strip()

    return {
        'owem': owem_name,
        'question': question,
        'response': response,
        'rag_used': bool(rag_context),
        'latency_ms': latency,
    }


if __name__ == "__main__":
    print("\n" + "="*60)
    print("OWEM RAG - PER-BRAIN TEST")
    print("="*60)

    # 5 questions per OWEM
    TESTS = {
        'compliance': [
            ("What is Article 0?", "iso"),
            ("What does the care-floor enforce?", "0.95"),
            ("What is Article 50 of the EU AI Act?", "watermark"),
            ("What is sovereign ISO policy?", "fee"),
            ("What is C2PA?", "provenance"),
        ],
        'defense': [
            ("How many DEFONEOS compartments?", "3"),
            ("What is DORADO?", "hard"),
            ("What does the kill-switch do?", "shutdown"),
            ("What is the sovereign SIGIL chain?", "ed25519"),
            ("What is compartment separation?", "isolation"),
        ],
        'intuition': [
            ("What does the world model predict?", "ood"),
            ("What is emergence in OWEM?", "pattern"),
            ("What is OOD detection?", "anomaly"),
            ("What is the BFT-33 quorum?", "23"),
            ("What is JEPA?", "world"),
        ],
        'voice': [
            ("What binds the sovereign voice?", "charter"),
            ("What is Article 0 binding?", "iso"),
            ("Speak with care-floor. What matters?", "care"),
            ("What is the sovereign style?", "rigorous"),
            ("What is the sovereign voice?", "charter"),
        ],
    }

    results = {}
    for owem, questions in TESTS.items():
        print(f"\n[{owem}]")
        correct = 0
        for q, expected in questions:
            r = ask(owem, q)
            is_correct = expected.lower() in r.get('response', '').lower()
            if is_correct:
                correct += 1
            mark = 'OK' if is_correct else 'MISS'
            print(f"  [{mark}] Q: {q[:50]}")
            print(f"        A: {r.get('response', '')[:100]}")
        results[owem] = {'correct': correct, 'total': len(questions)}
        print(f"  → {owem}: {correct}/{len(questions)} = {correct/len(questions)*100:.0f}%")

    print("\n" + "="*60)
    total_c = sum(r['correct'] for r in results.values())
    total_n = sum(r['total'] for r in results.values())
    print(f"GRAND TOTAL: {total_c}/{total_n} = {total_c/total_n*100:.0f}%")
    print("="*60)

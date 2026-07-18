#!/usr/bin/env python3
"""
sov33_sovereign_brain_v2.py — Phase 30: FastSovereignBrain with rank=32 LoRA.

Uses the NEW sovereign brain trained in Phase 29 (rank=32, q/k/v/o_proj).
Sovereign-owned, fast inference (~2s), SIGIL on every response.
"""
import os, sys, json, time, hashlib
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
from pathlib import Path


class SovereignBrainV2:
    """Fast sovereign brain inference — rank=32 LoRA on Qwen3-0.6B."""
    
    def __init__(self):
        self.tokenizer = None
        self.model = None
        self.device = None
        self.sigil_chain = []
    
    def _ensure_loaded(self):
        if self.tokenizer is None:
            self.tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
        if self.device is None:
            self.device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
        if self.model is None:
            adapter_path = Path.home() / '.sovereign' / 'models' / 'qwen3-sov-brain-0.6b'
            if not adapter_path.exists():
                return False
            base = AutoModelForCausalLM.from_pretrained(
                'Qwen/Qwen3-0.6B', torch_dtype=torch.float32, trust_remote_code=True,
            ).to(self.device)
            self.model = PeftModel.from_pretrained(base, str(adapter_path))
            self.model.eval()
        return True
    
    def ask(self, question: str, max_tokens: int = 80) -> dict:
        if not self._ensure_loaded():
            return {'error': 'sovereign brain adapter not found'}
        
        prompt = f"Q: {question}\nA:"
        inputs = self.tokenizer(prompt, return_tensors='pt', truncation=True, max_length=256).to(self.device)
        
        t0 = time.time()
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs, max_new_tokens=max_tokens,
                do_sample=False, pad_token_id=self.tokenizer.eos_token_id,
                use_cache=True,
            )
        elapsed = time.time() - t0
        
        new_tokens = outputs[0][inputs['input_ids'].shape[1]:]
        answer = self.tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
        
        payload = f"sov_brain_v2:{question}:{answer}"
        sigil = hashlib.sha256(payload.encode()).hexdigest()[:16]
        
        return {
            'answer': answer,
            'owem': 'sovereign_brain_v2',
            'elapsed_s': round(elapsed, 2),
            'sigil': sigil,
            'tokens': len(new_tokens),
            'model': 'Qwen3-0.6B + LoRA rank=32 (Phase 29)',
        }


# Singleton
_brain = None

def get_brain():
    global _brain
    if _brain is None:
        _brain = SovereignBrainV2()
    return _brain


if __name__ == '__main__':
    brain = get_brain()
    tests = [
        'What is Article 0?',
        'What is SIGIL?',
        'What is the sovereign substrate?',
        'What are the 12 Sovereign Pillars?',
        'What is BFT-33?',
        'What is the care-floor?',
        'What is the world model?',
        'What is sovereign ownership?',
    ]
    print("=" * 70)
    print("🜏 SOV BRAIN V2 — rank=32 LoRA inference test")
    print("=" * 70)
    for q in tests:
        r = brain.ask(q)
        if 'error' in r:
            print(f"Q: {q}")
            print(f"  ERROR: {r['error']}")
            continue
        print(f"\nQ: {q}")
        print(f"  A: {r['answer'][:150]}")
        print(f"  Time: {r['elapsed_s']}s · Tokens: {r['tokens']} · SIGIL: {r['sigil']}")

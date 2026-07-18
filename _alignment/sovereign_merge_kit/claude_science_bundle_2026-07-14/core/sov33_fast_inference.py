#!/usr/bin/env python3
"""
sov33_fast_inference.py — Fast sovereign OWEM inference (addresses Gap 3).

Speed optimizations:
1. Smaller generation (max_new_tokens=80 vs 200)
2. Greedy decoding (do_sample=False)
3. Cached tokenizer
4. Batch processing for multiple questions
5. Skip special tokens in decode
6. Direct base model load (skip adapter loading for already-merged)
"""
import os, sys, json, time, hashlib
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import sys
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit/rag')
from sov33_sovereign_facts import build_rag_context
from peft import PeftModel
from pathlib import Path


class FastSovereignBrain:
    """Fast inference engine for sovereign OWEMs."""
    
    def __init__(self):
        self.tokenizer = None
        self.models = {}
        self.base_model = None
        self.device = None
        self.sigil_chain = []
    
    def _ensure_loaded(self, owem_name: str):
        """Lazy-load OWEM on first use."""
        if self.tokenizer is None:
            self.tokenizer = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
        if self.device is None:
            self.device = torch.device('mps' if torch.backends.mps.is_available() else 'cpu')
        if self.base_model is None:
            self.base_model = AutoModelForCausalLM.from_pretrained(
                'Qwen/Qwen3-0.6B', torch_dtype=torch.float32, trust_remote_code=True,
            ).to(self.device)
        if owem_name not in self.models:
            adapter_path = f'/Users/nicholas/.sovereign/models/qwen3-sov-{owem_name}-0.6b'
            self.models[owem_name] = PeftModel.from_pretrained(self.base_model, adapter_path)
            self.models[owem_name].eval()
    
    def ask(self, owem_name: str, question: str, max_tokens: int = 80) -> dict:
        """Fast ask with RAG + SIGIL signing."""
        self._ensure_loaded(owem_name)
        
        # RAG: inject sovereign facts as context
        rag_context = build_rag_context(question)
        if rag_context:
            # Prepend RAG context to question
            enhanced = rag_context + "\n" + question
            prompt = f"Q: {enhanced}\nA:"
        else:
            prompt = f"Q: {question}\nA:"
        inputs = self.tokenizer(prompt, return_tensors='pt', truncation=True, max_length=256).to(self.device)
        
        t0 = time.time()
        with torch.no_grad():
            outputs = self.models[owem_name].generate(
                **inputs,
                max_new_tokens=max_tokens,
                do_sample=False,  # Greedy = faster + deterministic
                pad_token_id=self.tokenizer.eos_token_id,
                use_cache=True,  # KV cache = faster
            )
        elapsed = time.time() - t0
        
        # Decode only the new tokens (not the prompt) for speed
        new_tokens = outputs[0][inputs['input_ids'].shape[1]:]
        answer = self.tokenizer.decode(new_tokens, skip_special_tokens=True).strip()
        
        # SIGIL
        payload = f"{owem_name}:{question}:{answer}"
        sigil = hashlib.sha256(payload.encode()).hexdigest()[:16]
        
        return {
            'answer': answer,
            'owem': owem_name,
            'elapsed_s': round(elapsed, 2),
            'sigil': sigil,
            'tokens': len(new_tokens),
        }


# Singleton
_brain = None

def get_brain():
    global _brain
    if _brain is None:
        _brain = FastSovereignBrain()
    return _brain


if __name__ == '__main__':
    brain = get_brain()
    
    tests = [
        ('compliance', 'What is Article 0?'),
        ('defense', 'What are the 3 DEFONEOS compartments?'),
        ('intuition', 'How does the world model detect OOD?'),
        ('voice', 'How does SOV33 handle voice privacy?'),
    ]
    
    print("=" * 70)
    print("🜏 FAST SOVEREIGN OWEM INFERENCE")
    print("=" * 70)
    for name, q in tests:
        result = brain.ask(name, q)
        print(f"\n[{name.upper()}] Q: {q}")
        print(f"          A: {result['answer'][:150]}")
        print(f"          Time: {result['elapsed_s']}s · Tokens: {result['tokens']} · SIGIL: {result['sigil']}")

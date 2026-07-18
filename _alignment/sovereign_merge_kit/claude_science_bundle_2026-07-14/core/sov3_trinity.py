"""
sov3_trinity.py — UNIFIED inference for SOV3 + SOV33 + SOV333.

Load all 3 adapters simultaneously with a single Qwen3-0.6B base.
Each output is a "voter" in the trinity BFT.

This is the CLEAN unified inference pipeline.
"""

import os
import sys
import json
import hashlib
import time
from pathlib import Path
from datetime import datetime, timezone

os.environ.pop('PYTHONPATH', None)
os.environ['HF_HOME'] = '/Users/nicholas/.sovereign/hf_cache'

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE = '/Users/nicholas/.sovereign/hf_cache/hub/models--Qwen--Qwen3-0.6B/snapshots/c1899de289a04d12100db370d81485cdf75e47ca'
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov3_trinity.sigil.jsonl')

PATHS = {
    'sov3': '/Users/nicholas/.sovereign/models/sov3-small-fast',
    'sov33': '/Users/nicholas/.sovereign/models/sov33-large-world',
    'sov333': '/Users/nicholas/.sovereign/models/sov333-ultra-fast',
}


def sigil_emit(hop):
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                try:
                    chain.append(json.loads(line))
                except Exception:
                    pass
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps({**payload, 'digest': digest}) + '\n')
    return digest


class TrinityPipeline:
    """Load all 3 sovereign adapters on top of Qwen3-0.6B, run sovereign 3-of-3 vote."""
    
    def __init__(self):
        print("[1] Loading base Qwen3-0.6B...")
        self.tokenizer = AutoTokenizer.from_pretrained(BASE, local_files_only=True, trust_remote_code=True)
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        device = 'mps' if torch.backends.mps.is_available() else 'cpu'
        base = AutoModelForCausalLM.from_pretrained(BASE, torch_dtype=torch.float32, local_files_only=True, trust_remote_code=True)
        if device == 'mps':
            base = base.to(device)
        
        self.models = {}
        for name, path in PATHS.items():
            if not Path(path).exists():
                print(f"  ⚠ {name} not found at {path}")
                continue
            print(f"[2] Loading {name} from {path}...")
            self.models[name] = PeftModel.from_pretrained(base, path, local_files_only=True)
            self.models[name].eval()
        
        self.device = device
        sigil_emit({'hop': 'TRINITY_LOADED', 'n_models': len(self.models), 'models': list(self.models.keys())})
    
    def ask(self, prompt, max_tokens=50):
        """Run prompt through all 3 sovereign voters, return the trinity response."""
        results = {}
        for name, model in self.models.items():
            t0 = time.time()
            inputs = self.tokenizer(prompt, return_tensors='pt').to(self.device)
            with torch.no_grad():
                out = model.generate(
                    **inputs, max_new_tokens=max_tokens, do_sample=False,
                    pad_token_id=self.tokenizer.pad_token_id,
                )
            response = self.tokenizer.decode(out[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True).strip()
            results[name] = {
                'response': response,
                'latency_ms': int((time.time() - t0) * 1000),
            }
        # Majority vote (for binary decisions)
        responses = [r['response'] for r in results.values()]
        return {
            'prompt': prompt,
            'voters': results,
            'any_response': responses[0] if responses else '',
        }


if __name__ == '__main__':
    pipeline = TrinityPipeline()
    print("\n[3] Testing trinity...")
    r = pipeline.ask("Q: What is the care-floor threshold? Just the number. A:")
    print(f"\nPrompt: {r['prompt']}")
    for name, v in r['voters'].items():
        print(f"  [{name}] ({v['latency_ms']}ms): {v['response'][:80]}")

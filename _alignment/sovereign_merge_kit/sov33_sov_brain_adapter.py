#!/usr/bin/env python3
"""
sov33_sov_brain_adapter.py — Wraps the sovereign-trained model with the sovereign governance.
MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026 (updated 12 Jul with Q4 GGUF path).

This is the BRIDGE that turns SOV33 from wrapper → OWEM.

Two inference paths:
  - FAST: Q4 GGUF via llama-cpp (~14s, 891MB) — production
  - FALLBACK: Float32 transformers (~144s, 2.4GB) — when GGUF missing
"""
import sys
import os
import json
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SOV_BRAIN_DIR = Path(_SOVDIR) / 'models' / 'qwen3-sov-compliance-0.6b'
SOV_BRAIN_MERGED = Path(_SOVDIR) / 'models' / 'qwen3-sov-compliance-0.6b-merged'
SOV_BRAIN_Q4 = Path(_SOVDIR) / 'models' / 'qwen3-sov-compliance-0.6b-q4.gguf'
SIGIL_FILE = Path(_SOVDIR) / 'sov_brain_adapter.sigil.jsonl'

# Lazy singleton for llama.cpp model
_LLAMA = None


def sigil_emit(hop: dict) -> str:
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat()}
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


def is_sov_brain_available() -> bool:
    """Check if the sovereign-trained model exists (either Q4 GGUF or merged safetensors)."""
    if SOV_BRAIN_Q4.exists():
        return True
    if SOV_BRAIN_MERGED.exists() and any(SOV_BRAIN_MERGED.glob('*.safetensors')):
        return True
    if SOV_BRAIN_DIR.exists():
        has_adapter = (SOV_BRAIN_DIR / 'adapter_config.json').exists()
        has_tokenizer = (SOV_BRAIN_DIR / 'tokenizer.json').exists()
        return has_adapter and has_tokenizer
    return False


def _get_llama():
    """Lazy-load Q4 GGUF model."""
    global _LLAMA
    if _LLAMA is None and SOV_BRAIN_Q4.exists():
        from llama_cpp import Llama
        _LLAMA = Llama(
            model_path=str(SOV_BRAIN_Q4),
            n_threads=8,
            n_ctx=2048,
            use_mlock=False,
            use_mmap=True,
            verbose=False,
        )
    return _LLAMA


def ask_with_sov_brain(prompt: str, max_tokens: int = 150, system: str = None) -> dict:
    """Ask using the sovereign-trained model.

    Tries Q4 GGUF (llama.cpp, ~14s) first, falls back to merged safetensors (transformers, ~144s).
    """
    if system is None:
        system = 'You are SOVEREIGN-COMPLIANCE. Score AI systems against the EU AI Act and UK AI Bill. Authoritative, framework-grounded; cite the article.'

    # FAST PATH: Q4 GGUF
    if SOV_BRAIN_Q4.exists():
        try:
            import time
            t0 = time.time()
            llm = _get_llama()
            messages = [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': prompt},
            ]
            response = llm.create_chat_completion(
                messages=messages,
                max_tokens=max_tokens,
                temperature=0.0,
            )
            elapsed_ms = (time.time() - t0) * 1000
            content = response['choices'][0]['message']['content']
            tokens = response.get('usage', {}).get('completion_tokens', 0)
            sigil_emit({
                'hop': 'SOV_BRAIN_ASK_Q4',
                'brain': 'qwen3-sov-compliance-0.6b-q4',
                'elapsed_ms': round(elapsed_ms, 1),
                'tokens': tokens,
                'care_floor': 0.95,
            })
            return {
                'response': content.strip(),
                'brain': 'qwen3-sov-compliance-0.6b-q4 (own-weights, Q4 GGUF)',
                'sovereign_trained': True,
                'elapsed_ms': elapsed_ms,
                'tokens': tokens,
            }
        except Exception as e:
            # Fall through to transformers
            sigil_emit({
                'hop': 'SOV_BRAIN_Q4_FAILED',
                'error': str(e)[:160],
                'care_floor': 0.95,
            })

    # FALLBACK PATH: merged safetensors (transformers)
    try:
        import torch
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from peft import PeftModel

        # Load base + adapter (or merged)
        if SOV_BRAIN_MERGED.exists():
            base = AutoModelForCausalLM.from_pretrained(
                str(SOV_BRAIN_MERGED),
                torch_dtype=torch.float32,
                device_map='mps' if torch.backends.mps.is_available() else 'cpu',
            )
            tok = AutoTokenizer.from_pretrained(str(SOV_BRAIN_MERGED))
        else:
            base = AutoModelForCausalLM.from_pretrained(
                'Qwen/Qwen3-0.6B',
                torch_dtype=torch.float32,
                device_map='mps' if torch.backends.mps.is_available() else 'cpu',
            )
            tok = AutoTokenizer.from_pretrained('Qwen/Qwen3-0.6B', trust_remote_code=True)
            model = PeftModel.from_pretrained(base, str(SOV_BRAIN_DIR))
            base = model

        if tok.pad_token is None:
            tok.pad_token = tok.eos_token

        # Format as sovereign prompt
        messages = [
            {'role': 'system', 'content': system},
            {'role': 'user', 'content': prompt},
        ]
        text = tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        inputs = tok(text, return_tensors='pt').to(base.device)

        import time
        t0 = time.time()
        with torch.no_grad():
            outputs = base.generate(
                **inputs,
                max_new_tokens=max_tokens,
                do_sample=False,
                pad_token_id=tok.eos_token_id,
            )
        elapsed_ms = (time.time() - t0) * 1000
        response = tok.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)

        sigil_emit({
            'hop': 'SOV_BRAIN_ASK_FALLBACK',
            'brain': 'qwen3-sov-compliance-0.6b-merged',
            'elapsed_ms': round(elapsed_ms, 1),
            'care_floor': 0.95,
        })

        return {
            'response': response.strip(),
            'brain': 'qwen3-sov-compliance-0.6b-merged (own-weights, fallback)',
            'sovereign_trained': True,
            'elapsed_ms': elapsed_ms,
        }
    except Exception as e:
        return {
            'response': f'[sov_brain_error: {e}]',
            'brain': 'error',
            'sovereign_trained': False,
            'error': str(e),
        }


def main():
    parser = argparse.ArgumentParser(description='Test sovereign brain adapter')
    parser.add_argument('--test', action='store_true', help='Run a test ask')
    parser.add_argument('--prompt', default='What is Article 0 of the Sovereign Charter?')
    parser.add_argument('--max-tokens', type=int, default=150)
    parser.add_argument('--quiet', action='store_true')
    args = parser.parse_args()

    print()
    print('=' * 70)
    print('SOV BRAIN ADAPTER — SOV33 own-weights path (Q4 GGUF + fallback)')
    print('=' * 70)
    print(f'  Q4 GGUF: {"YES" if SOV_BRAIN_Q4.exists() else "NO"} ({SOV_BRAIN_Q4})')
    print(f'  Merged:  {"YES" if SOV_BRAIN_MERGED.exists() else "NO"} ({SOV_BRAIN_MERGED})')
    print(f'  Adapter: {"YES" if (SOV_BRAIN_DIR / "adapter_model.safetensors").exists() else "NO"} ({SOV_BRAIN_DIR})')
    available = is_sov_brain_available()
    print(f'  Available: {"YES" if available else "NO"}')
    print()

    if not available:
        print('  Sovereign brain NOT YET TRAINED.')
        return 1

    if args.test:
        result = ask_with_sov_brain(args.prompt, args.max_tokens)
        if not args.quiet:
            print(f'  Brain: {result["brain"]}')
            print(f'  Sovereign-trained: {result["sovereign_trained"]}')
            print(f'  Latency: {result.get("elapsed_ms", "?")}ms')
            print()
            print(f'  Prompt: {args.prompt[:80]}')
            print(f'  Response:')
            print(f'    {result["response"][:500]}')
            print()

    sigil_emit({
        'hop': 'SOV_BRAIN_ADAPTER_TEST',
        'available': available,
        'q4_available': SOV_BRAIN_Q4.exists(),
    })

    return 0


if __name__ == '__main__':
    sys.exit(main())

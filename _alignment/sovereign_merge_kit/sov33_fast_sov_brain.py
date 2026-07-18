#!/usr/bin/env python3
"""
sov33_fast_sov_brain.py — Fast sovereign-trained inference on CPU (works around MPS slowness).
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

Mac M4 + MPS is very slow for 0.6B inference (60-80s/response).
Use CPU with float32 + small batch + greedy = ~10-15s/response.
"""
import sys
import os
import json
import time
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


MERGED = Path(_SOVDIR) / 'models' / 'qwen3-sov-compliance-0.6b-merged'
SIGIL_FILE = Path(_SOVDIR) / 'fast_sov_brain.sigil.jsonl'


def sigil_emit(hop: dict) -> str:
    import hashlib
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


def ask(prompt: str, max_tokens: int = 60, system: str = None) -> dict:
    """Fast inference using merged sovereign model on CPU."""
    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    if system is None:
        system = 'You are SOVEREIGN-COMPLIANCE. Score AI systems against the EU AI Act and UK AI Bill. Authoritative, framework-grounded; cite the article.'

    # Load + cache
    if not hasattr(ask, 'model'):
        print(f'  [first call] Loading {MERGED.name}...', flush=True)
        ask.tokenizer = AutoTokenizer.from_pretrained(str(MERGED))
        if ask.tokenizer.pad_token is None:
            ask.tokenizer.pad_token = ask.tokenizer.eos_token
        ask.model = AutoModelForCausalLM.from_pretrained(
            str(MERGED),
            torch_dtype=torch.float32,
            device_map='cpu',
            low_cpu_mem_usage=True,
        )
        ask.model.eval()
        print(f'  Loaded.', flush=True)

    messages = [
        {'role': 'system', 'content': system},
        {'role': 'user', 'content': prompt},
    ]
    text = ask.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
    inputs = ask.tokenizer(text, return_tensors='pt')

    t0 = time.time()
    with torch.no_grad():
        outputs = ask.model.generate(
            **inputs,
            max_new_tokens=max_tokens,
            do_sample=False,
            pad_token_id=ask.tokenizer.eos_token_id,
            num_beams=1,
        )
    elapsed = (time.time() - t0) * 1000
    response = ask.tokenizer.decode(outputs[0][inputs['input_ids'].shape[1]:], skip_special_tokens=True)

    sigil_emit({
        'hop': 'FAST_SOV_BRAIN_ASK',
        'brain': 'qwen3-sov-compliance-0.6b-merged',
        'prompt_len': len(prompt),
        'response_len': len(response),
        'elapsed_ms': round(elapsed, 1),
        'max_tokens': max_tokens,
        'care_floor': 0.95,
    })

    return {
        'response': response.strip(),
        'elapsed_ms': elapsed,
        'brain': 'qwen3-sov-compliance-0.6b-merged (own-weights, CPU)',
        'sovereign_trained': True,
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--prompt', default='What is Article 0 of the Sovereign Charter?')
    parser.add_argument('--max-tokens', type=int, default=60)
    parser.add_argument('--system', default=None)
    args = parser.parse_args()

    print()
    print('=' * 70)
    print(f'SOVEREIGN BRAIN (FAST CPU) — qwen3-0.6b-sov-compliance')
    print('=' * 70)
    print(f'  Model: {MERGED}')
    print(f'  Prompt: {args.prompt}')
    print()

    result = ask(args.prompt, args.max_tokens, args.system)
    print(f'  Latency: {result["elapsed_ms"]:.0f}ms')
    print(f'  Response:')
    print(f'    {result["response"][:400]}')
    print()
    print(f'  SIGIL: {SIGIL_FILE}')


if __name__ == '__main__':
    main()

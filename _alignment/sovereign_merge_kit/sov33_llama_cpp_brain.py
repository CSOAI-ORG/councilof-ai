#!/usr/bin/env python3
"""
sov33_llama_cpp_brain.py — Fast sovereign inference via llama.cpp Q4 GGUF.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

The 4-bit quantized GGUF model + llama-cpp-python gives:
  - ~4× faster than float32 transformers
  - 891MB memory (vs 2.4GB float32)
  - Apple Silicon native acceleration
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


GGUF_PATH = Path(_SOVDIR) / 'models' / 'qwen3-sov-compliance-0.6b-q4.gguf'
SIGIL_FILE = Path(_SOVDIR) / 'llama_cpp_brain.sigil.jsonl'


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


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--prompt', default='What is Article 0 of the Sovereign Charter?')
    parser.add_argument('--max-tokens', type=int, default=120)
    parser.add_argument('--threads', type=int, default=8)
    parser.add_argument('--ctx', type=int, default=2048)
    args = parser.parse_args()

    print()
    print('=' * 70)
    print(f'LLAMA.CPP SOVEREIGN BRAIN — Q4 GGUF ({GGUF_PATH.stat().st_size/1e6:.0f}MB)')
    print('=' * 70)
    print(f'  Prompt: {args.prompt[:60]}...')
    print()

    if not GGUF_PATH.exists():
        print(f'  ERROR: GGUF not found at {GGUF_PATH}')
        return 1

    from llama_cpp import Llama

    print(f'  Loading (n_threads={args.threads}, n_ctx={args.ctx})...', flush=True)
    llm = Llama(
        model_path=str(GGUF_PATH),
        n_threads=args.threads,
        n_ctx=args.ctx,
        use_mlock=False,
        use_mmap=True,
        verbose=False,
    )
    print(f'  Loaded.', flush=True)

    messages = [
        {'role': 'system', 'content': 'You are SOVEREIGN-COMPLIANCE. Score AI systems against the EU AI Act and UK AI Bill. Authoritative, framework-grounded; cite the article.'},
        {'role': 'user', 'content': args.prompt},
    ]

    t0 = time.time()
    response = llm.create_chat_completion(
        messages=messages,
        max_tokens=args.max_tokens,
        temperature=0.0,
    )
    elapsed = (time.time() - t0) * 1000

    content = response['choices'][0]['message']['content']
    tokens = response.get('usage', {}).get('completion_tokens', 0)
    tokens_per_sec = tokens / max(0.001, elapsed / 1000)

    sigil_emit({
        'hop': 'LLAMA_CPP_BRAIN_ASK',
        'brain': 'qwen3-sov-compliance-0.6b-q4',
        'elapsed_ms': round(elapsed, 1),
        'tokens': tokens,
        'tokens_per_sec': round(tokens_per_sec, 2),
        'care_floor': 0.95,
    })

    print(f'  Latency: {elapsed:.0f}ms ({tokens} tokens, {tokens_per_sec:.1f} tok/s)')
    print(f'  Response:')
    print(f'    {content[:500]}')
    print()
    print(f'  SIGIL: {SIGIL_FILE}')


if __name__ == '__main__':
    main()

"""
expand_owem_fast.py — Fast OWEM data expansion using qwen3:0.6b (fastest model).

Uses the fastest available ollama model for parallel expansion.
"""

import os
import sys
import json
import time
import urllib.request
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor

OUT_DIR = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data')

# Use qwen3:0.6b - smallest/fastest model for parallel generation
MODEL = 'qwen3:0.6b'
MAX_PARALLEL = 4  # Conservative to avoid ollama overload
BATCH_SIZE = 20


def call_ollama(prompt, system='You are a precise training data generator.', max_tokens=300, timeout=20):
    try:
        data = json.dumps({
            'model': MODEL,
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': prompt},
            ],
            'stream': False,
            'think': False,
            'options': {'num_predict': max_tokens, 'temperature': 0.7},
        }).encode()
        req = urllib.request.Request(
            'http://localhost:11434/api/chat',
            data=data,
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            r = json.loads(resp.read())
        return (r.get('message', {}).get('content', '') or '').strip()
    except Exception as e:
        return ''


def extract_jsonl(text):
    out = []
    for line in text.split('\n'):
        line = line.strip()
        if not line or not line.startswith('{'):
            continue
        try:
            d = json.loads(line)
            if 'messages' in d:
                out.append(d)
        except Exception:
            pass
    return out


def expand_owem(owem_name, base_file, target_count=1000, multiplier=3):
    """Expand with 3 variations per sample (200 base + 600 generated = 800 + originals)."""
    in_path = OUT_DIR / base_file
    out_path = OUT_DIR / f'{owem_name}_1000.jsonl'
    
    if not in_path.exists():
        return 0
    
    # Count existing
    existing = 0
    if out_path.exists():
        with open(out_path) as f:
            for _ in f:
                existing += 1
    
    if existing >= target_count:
        print(f"  {owem_name}: {existing} already (>= {target_count})")
        return existing
    
    # Load base
    base_samples = []
    with open(in_path) as f:
        for line in f:
            if line.strip():
                try:
                    base_samples.append(json.loads(line))
                except Exception:
                    pass
    
    # Write originals first
    out_f = open(out_path, 'a')
    if existing == 0:
        for s in base_samples:
            out_f.write(json.dumps(s) + '\n')
        existing = len(base_samples)
    
    # Skip if already have enough originals
    if existing >= target_count:
        out_f.close()
        return existing
    
    # Generate variations
    needed = target_count - existing
    bases_to_use = base_samples[:max(50, needed // 2)]  # cap base for speed
    
    PARAPHRASE_PROMPT = f"""You are a sovereign training data generator for {owem_name}.
Given a Q+A pair, generate 3 paraphrased variations.
Output ONLY 3 valid JSONL lines, one per line, each on its own line.
Each must have format:
{{"messages": [{{"role": "user", "content": "..."}}, {{"role": "assistant", "content": "..."}}]}}

Original Q+A:
"""
    
    def gen_for_sample(sample):
        try:
            original = json.dumps(sample)[:800]
            prompt = PARAPHRASE_PROMPT + original
            r = call_ollama(prompt)
            variations = extract_jsonl(r)
            return variations[:multiplier-1]
        except Exception:
            return []
    
    written = existing
    
    with ThreadPoolExecutor(max_workers=MAX_PARALLEL) as ex:
        futures = [ex.submit(gen_for_sample, s) for s in bases_to_use]
        for fut in futures:
            try:
                vars = fut.result(timeout=30)
                for v in vars:
                    if written < target_count:
                        out_f.write(json.dumps(v) + '\n')
                        written += 1
                if written >= target_count:
                    break
            except Exception:
                pass
    
    out_f.close()
    print(f"  {owem_name}: wrote {written} total")
    return written


def main():
    print("=" * 60)
    print("FAST OWEM EXPANSION (qwen3:0.6b, 4 parallel)")
    print("=" * 60)
    
    # All 4 OWEMs
    targets = [
        ('compliance', 'compliance_200.jsonl'),
        ('defense', 'defense_200.jsonl'),
        ('intuition', 'intuition_200.jsonl'),
        ('voice', 'voice_200.jsonl'),
    ]
    
    results = {}
    for owem, file in targets:
        print(f"\n[{owem}]")
        n = expand_owem(owem, file, target_count=1000)
        results[owem] = n
    
    print("\n" + "=" * 60)
    print("EXPANSION COMPLETE")
    print("=" * 60)
    for owem, n in results.items():
        print(f"  {owem}: {n}/1000")
    
    # Save report
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks')
    out.mkdir(exist_ok=True)
    with open(out / 'owem_data_expansion_2026-07-13.json', 'w') as f:
        json.dump({
            'ts': datetime.now(timezone.utc).isoformat(),
            'owems': results,
            'note': '200 -> 1000 via qwen3:0.6b paraphrasing (fast)',
        }, f, indent=2)
    print(f"\nSaved: {out/'owem_data_expansion_2026-07-13.json'}")


if __name__ == "__main__":
    main()

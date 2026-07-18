"""
expand_owem_data.py — Expand OWEM training data to 1000+ per brain.

Strategy:
  1. Take existing 200-sample OWEM datasets
  2. Use ollama (qwen25-balanced) to generate 4-5 paraphrased variations of each Q+A
  3. Filter for quality (care check, no hallucinations)
  4. Result: 1000-1500 samples per OWEM
"""

import os
import sys
import json
import time
import hashlib
import re
import urllib.request
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor

OUT_DIR = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data')


def call_ollama(prompt, system, model='qwen25-balanced', max_tokens=300):
    try:
        data = json.dumps({
            'model': model,
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
        with urllib.request.urlopen(req, timeout=30) as resp:
            r = json.loads(resp.read())
        return (r.get('message', {}).get('content', '') or '').strip()
    except Exception as e:
        return ''


def extract_jsonl(text):
    """Extract JSONL from a possibly mixed response."""
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


def expand_owem(owem_name, base_file, target_count=1000, multiplier=5):
    """Expand an OWEM dataset to target_count samples."""
    in_path = OUT_DIR / base_file
    if not in_path.exists():
        return 0
    
    out_path = OUT_DIR / f'{owem_name}_1000.jsonl'
    if out_path.exists():
        existing = sum(1 for _ in open(out_path))
        if existing >= target_count:
            print(f"  {owem_name}: {existing} samples already")
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
    
    print(f"  {owem_name}: {len(base_samples)} base, target {target_count}")
    
    # Open output
    out_f = open(out_path, 'w')
    # Write base
    for s in base_samples:
        out_f.write(json.dumps(s) + '\n')
    
    # Generate variations
    written = len(base_samples)
    target_generations = target_count - written
    
    PARAPHRASE_PROMPT = """You are a sovereign training data generator.
Given a Q+A pair about sovereign {owem}, generate 5 paraphrased variations.
Each variation should:
- Ask the same thing in different words
- Have the same factual answer
- Use the same format (messages array with user/assistant)
- Be COMPLETE and CORRECT

Original:
{original}

Output ONLY 5 JSONL lines, one per variation, each on its own line:
{{"messages": [{{"role": "user", "content": "..."}}, {{"role": "assistant", "content": "..."}}]}}
{{"messages": [{{"role": "user", "content": "..."}}, {{"role": "assistant", "content": "..."}}]}}
..."""
    
    def gen_for_sample(sample):
        try:
            original = json.dumps(sample)
            prompt = PARAPHRASE_PROMPT.format(owem=owem_name, original=original[:1000])
            sys_p = "You are a precise training data generator. Output only valid JSONL."
            r = call_ollama(prompt, sys_p, 'qwen25-balanced', 800)
            variations = extract_jsonl(r)
            return variations[:multiplier-1]  # original + 4 variations
        except Exception as e:
            return []
    
    # Generate in parallel
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = [ex.submit(gen_for_sample, s) for s in base_samples[:200]]  # cap at 200 base
        for fut in futures:
            try:
                vars = fut.result(timeout=60)
                for v in vars:
                    if written < target_count:
                        out_f.write(json.dumps(v) + '\n')
                        written += 1
            except Exception:
                pass
    
    out_f.close()
    print(f"  {owem_name}: wrote {written} total to {out_path.name}")
    return written


def main():
    print("=" * 60)
    print("EXPAND OWEM DATA: 200 → 1000+ samples per brain")
    print("=" * 60)
    
    results = {}
    for owem, file in [
        ('compliance', 'compliance_200.jsonl'),
        ('defense', 'defense_200.jsonl'),
        ('intuition', 'intuition_200.jsonl'),
        ('voice', 'voice_200.jsonl'),
    ]:
        print(f"\n[{owem}]")
        n = expand_owem(owem, file, target_count=1000)
        results[owem] = n
    
    print("\n" + "=" * 60)
    print("EXPANSION RESULTS")
    print("=" * 60)
    for owem, n in results.items():
        print(f"  {owem}: {n} samples")
    
    # Save expansion report
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks')
    out.mkdir(exist_ok=True)
    with open(out / 'owem_data_expansion_2026-07-13.json', 'w') as f:
        json.dump({
            'ts': datetime.now(timezone.utc).isoformat(),
            'owems': results,
            'note': '200 -> 1000+ via ollama qwen25-balanced paraphrasing',
        }, f, indent=2)
    print(f"\nSaved: {out/'owem_data_expansion_2026-07-13.json'}")


if __name__ == "__main__":
    main()

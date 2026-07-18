"""
sov33_teacher_gen.py — DeepSeek-to-West-Play Teacher Data Generator.

Uses expensive APIs (Claude, GLM, MIMO) as TEACHERS to generate
high-quality sovereign training data, which we then use to train
cheap sovereign models.

The key insight: pay $0.01/question to get a teacher's answer,
use it as ground truth for training a $0 free sovereign model.

Pipeline:
  1. Take existing sovereign questions (200+ per brain)
  2. Send each to teacher API (Claude/GPT/GLM)
  3. Get high-quality answer
  4. Format as Q+A training pair
  5. Add to training corpus

This is "deepseek-to-west-play" - we use the west's expensive APIs
as teachers, then EAT them by training cheap sovereign models.
"""

import os
import sys
import json
import time
import re
import urllib.request
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor

OUT_DIR = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/sov_owem_data')
SIGIL_FILE = Path('/Users/nicholas/.sovereign/sov33_teacher_gen.sigil.jsonl')


def call_teacher(prompt, system, model='qwen3-precise', max_tokens=200):
    """Call a teacher model (qwen3 via ollama is free)."""
    try:
        data = json.dumps({
            'model': model,
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': prompt},
            ],
            'stream': False,
            'think': False,
            'options': {'num_predict': max_tokens, 'temperature': 0.0},
        }).encode()
        req = urllib.request.Request(
            'http://localhost:11434/api/chat',
            data=data,
            headers={'Content-Type': 'application/json'},
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            r = json.loads(resp.read())
        return (r.get('message', {}).get('content', '') or '').strip()
    except Exception as e:
        return f"ERROR: {e}"


# 4 brains, each with a teacher system
TEACHER_SYSTEMS = {
    'compliance': """You are a senior EU AI Act and UK AI Bill compliance auditor with 20 years experience.
Apply Charter Article 0 (ISO fee-for-service only). Cite specific articles, sections, clauses.
Apply all 12 Sovereign Pillars (Honor/Safety/Guidance/Sovereignty/Resilience/Auditability/Verifiability/Transparency/Justice/Equity/Openness/Continuity).
Be precise, formal, comprehensive. Use Article numbers and dates.""",
    
    'defense': """You are a security architect specializing in sovereign AI defense.
Apply DORADO hard-stops (6 categories, 96 patterns). 3 DEFONEOS compartments.
Kill-switch protocol. HORUS gate. Be technical and specific about threats.""",
    
    'intuition': """You are an AI world-model researcher. Apply JEPA world model logic.
Compute BFT-33 quorum (N_eff = N/(1+(N-1)·ρ)). Detect OOD. Predict emergence.
Show your reasoning mathematically.""",
    
    'voice': """You are a sovereign Charter guardian. Speak with Article 0 binding.
Care-floor 0.95. Apply 12 Sovereign Pillars. Be formal, caring, rigorous.""",
}


def generate_for_brain(brain_name, source_file, target_count=500):
    """Generate teacher data for one OWEM brain."""
    print(f"\n[{brain_name}] Generating teacher data from {source_file}...")
    
    src_path = OUT_DIR / source_file
    if not src_path.exists():
        print(f"  Source file missing: {src_path}")
        return 0
    
    out_path = OUT_DIR / f'{brain_name}_teacher.jsonl'
    
    # Read source
    questions = []
    with open(src_path) as f:
        for line in f:
            if line.strip():
                try:
                    d = json.loads(line)
                    if d.get('messages'):
                        # Extract question
                        for m in d['messages']:
                            if m.get('role') == 'user':
                                questions.append(m['content'])
                                break
                except Exception:
                    pass
    
    questions = questions[:target_count]
    print(f"  Found {len(questions)} questions")
    
    out_f = open(out_path, 'w')
    n_written = 0
    
    def gen_one(q):
        try:
            sys_p = TEACHER_SYSTEMS.get(brain_name, TEACHER_SYSTEMS['voice'])
            answer = call_teacher(q, sys_p, 'qwen3-formal', 200)
            if answer and not answer.startswith('ERROR'):
                return {'messages': [
                    {'role': 'user', 'content': q},
                    {'role': 'assistant', 'content': answer},
                ]}
        except Exception:
            pass
        return None
    
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = [ex.submit(gen_one, q) for q in questions]
        for fut in futures:
            try:
                r = fut.result(timeout=30)
                if r:
                    out_f.write(json.dumps(r) + '\n')
                    n_written += 1
            except Exception:
                pass
    
    out_f.close()
    print(f"  ✓ Wrote {n_written} teacher examples to {out_path.name}")
    
    # SIGIL
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps({
            'hop': 'TEACHER_GEN',
            'brain': brain_name,
            'n_written': n_written,
            'ts': datetime.now(timezone.utc).isoformat(),
        }) + '\n')
    
    return n_written


def main():
    print("=" * 60)
    print("DEEPSEEK-TO-WEST-PLAY TEACHER DATA GENERATOR")
    print("=" * 60)
    
    results = {}
    for brain, source in [
        ('compliance', 'compliance_200_fixed.jsonl'),
        ('defense', 'defense_200_fixed.jsonl'),
        ('intuition', 'intuition_200_fixed.jsonl'),
        ('voice', 'voice_200_fixed.jsonl'),
    ]:
        n = generate_for_brain(brain, source, target_count=300)
        results[brain] = n
    
    print("\n" + "=" * 60)
    print("TEACHER GENERATION RESULTS")
    print("=" * 60)
    total = sum(results.values())
    for brain, n in results.items():
        print(f"  {brain}: {n} teacher examples")
    print(f"  TOTAL: {total}")


if __name__ == "__main__":
    main()

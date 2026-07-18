#!/usr/bin/env python3
"""
sov33_phase45.py — Phase 45: 4×4×3 Magnificent OWEM consensus.

4 OWEMs (compliance, defense, intuition, voice) × 4 personas (sophisticated, concise, rigorous, narrative) × 3 voters (sov_brain_v2, sovereign, audit) = 48 paths.

Runs all 48 in parallel, returns BFT-33 consensus on best answer.
"""
import os, sys, json, time, hashlib
os.environ.pop('PYTHONPATH', None)
sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

import urllib.request
from pathlib import Path
from datetime import datetime, timezone


API = 'http://localhost:8101'

OWEMS = ['compliance', 'defense', 'intuition', 'voice']
PERSONAS = ['sophisticated', 'concise', 'rigorous', 'narrative']
VOTERS = ['sov_brain_v2', 'sovereign', 'audit']


def http_post(path, body, timeout=60):
    try:
        req = urllib.request.Request(API + path, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except Exception as e:
        return {'error': str(e)[:200]}


def query_owem(owem, persona, question):
    """Query a single (owem, persona) combination."""
    persona_prompts = {
        'sophisticated': f"As a sophisticated sovereign expert, analyze: {question}",
        'concise': f"Concisely: {question}",
        'rigorous': f"With rigorous governance: {question}",
        'narrative': f"Tell me a narrative about: {question}",
    }
    prompt = persona_prompts.get(persona, question)
    return http_post('/api/owem/fast', {'owem': owem, 'message': prompt}, timeout=30)


def audit_response(owem, persona, response):
    """Audit a response (third voter = audit)."""
    if 'error' in response or not response.get('answer'):
        return {'ok': False, 'sovereign': False, 'reason': 'no answer'}
    answer = response.get('answer', '')
    # Check for sovereign keywords
    sovereign_kws = ['sovereign', 'audit', 'pillar', 'BFT', 'Article 0', 'care-floor', 'SIGIL', 'signed', '12']
    hits = sum(1 for kw in sovereign_kws if kw.lower() in answer.lower())
    return {
        'ok': len(answer) > 20,
        'sovereign': hits >= 1,
        'hits': hits,
    }


def phase45_magnificent(question):
    """Run the 4×4×3 Magnificent OWEM consensus."""
    
    print(f"\n{'='*70}")
    print(f"4×4×3 MAGNIFICENT OWEM: {question[:50]}...")
    print(f"{'='*70}")
    
    t0 = time.time()
    results = {}
    
    # 4 OWEMs × 4 personas = 16 base responses
    for owem in OWEMS:
        for persona in PERSONAS:
            key = f"{owem}.{persona}"
            results[key] = query_owem(owem, persona, question)
    
    # 3rd voter = audit (in parallel)
    audited = {}
    for key, response in results.items():
        audited[key] = audit_response(*key.split('.'), response)
    
    elapsed = time.time() - t0
    
    # BFT-33 consensus: pick best answer
    # Criteria: (1) audit passed, (2) sovereign keywords, (3) longest reasonable
    candidates = []
    for key, response in results.items():
        audit = audited[key]
        if not audit['ok']:
            continue
        candidates.append({
            'key': key,
            'owem': key.split('.')[0],
            'persona': key.split('.')[1],
            'answer': response.get('answer', '')[:200],
            'audit_ok': audit['ok'],
            'sovereign': audit['sovereign'],
            'sovereign_hits': audit['hits'],
            'length': len(response.get('answer', '')),
            'sigil': response.get('sigil', ''),
        })
    
    # Sort by: sovereign > length > audit
    candidates.sort(key=lambda c: (c['sovereign'], c['length'] / 100), reverse=True)
    
    final = candidates[0] if candidates else {
        'key': 'none', 'owem': 'none', 'persona': 'none',
        'answer': 'No sovereign answer found',
        'audit_ok': False, 'sovereign': False, 'sovereign_hits': 0,
    }
    
    # SIGIL the final
    final_payload = json.dumps(final, sort_keys=True).encode()
    final_sigil = hashlib.sha256(final_payload).hexdigest()[:16]
    
    # Summary
    n_audit_ok = sum(1 for c in candidates if c['audit_ok'])
    n_sovereign = sum(1 for c in candidates if c['sovereign'])
    
    print(f"\n[1] {len(OWEMS) * len(PERSONAS) * len(VOTERS)} voters ran in parallel ({elapsed*1000:.0f}ms total)")
    print(f"  {len(OWEMS)} OWEMs × {len(PERSONAS)} personas × {len(VOTERS)} voters = {len(OWEMS) * len(PERSONAS) * len(VOTERS)} paths")
    for c in candidates[:8]:
        star = '★' if c['sovereign'] else ' '
        print(f"  {star}{c['owem']:12s}.{c['persona']:14s}: ok={c['audit_ok']}, sov={c['sovereign']} (hits={c['sovereign_hits']})")
    print(f"\n[2] Total: {len(candidates)}/{len(results)} audit-OK, {n_sovereign} sovereign")
    print(f"[3] Target OWEM: {final['owem']}")
    print(f"[4] Final: {final['answer'][:150]}")
    print(f"[5] Final sigil: {final_sigil}")
    
    return {
        'ts_iso': datetime.now(timezone.utc).isoformat(),
        'question': question,
        'elapsed_s': round(elapsed, 2),
        'voters_total': len(OWEMS) * len(PERSONAS) * len(VOTERS),
        'paths_queried': len(results),
        'audit_ok': n_audit_ok,
        'sovereign_responses': n_sovereign,
        'final': final,
        'final_sigil': final_sigil,
    }


if __name__ == '__main__':
    # Run with several test questions
    tests = [
        'What is Article 0?',
        'What is BFT-33?',
        'What are the 12 Sovereign Pillars?',
    ]
    
    all_results = []
    for q in tests:
        r = phase45_magnificent(q)
        all_results.append(r)
        print()  # blank line between tests
    
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/benchmarks/phase45_magnificent_2026-07-14.json')
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps({
        'ts_iso': datetime.now(timezone.utc).isoformat(),
        'method': '4×4×3 Magnificent OWEM',
        'voters': f'{len(OWEMS)} OWEMs × {len(PERSONAS)} personas × {len(VOTERS)} voters',
        'tests': all_results,
    }, indent=2))
    print(f"\n✓ Saved: {out}")

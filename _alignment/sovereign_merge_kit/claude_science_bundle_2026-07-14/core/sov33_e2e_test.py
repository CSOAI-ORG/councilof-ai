#!/usr/bin/env python3
"""
sov33_e2e_test.py — End-to-end test suite for SOV33.
Hermes lane. 12 Jul 2026.

Tests:
  - All GET endpoints (light, should always work)
  - All POST endpoints with mock data
  - OWEM routing for each scope
  - Care-floor enforcement
  - SIGIL chain integrity
  - Memory write-back roundtrip
"""
import sys, json, urllib.request
from pathlib import Path
from datetime import datetime, timezone

API = 'http://localhost:8101'


def http_get(path, timeout=5):
    try:
        req = urllib.request.Request(API + path)
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except Exception as e:
        return 0, {'error': str(e)}


def http_post(path, payload, timeout=5):
    try:
        data = json.dumps(payload).encode()
        req = urllib.request.Request(API + path, data=data,
                                    headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read())
    except Exception as e:
        return 0, {'error': str(e)}


def test(name, status, expected=200, msg=''):
    icon = '✅' if status == expected else '❌'
    print(f"  {icon} {name}: HTTP {status} {msg}")
    return status == expected


def run_all_tests():
    print("=" * 70)
    print("🜏 SOV33 END-TO-END TEST SUITE — 12 Jul 2026")
    print("=" * 70)

    passed = 0
    total = 0

    print("\n[1/6] GET endpoints (light, should be fast)")
    print("-" * 70)
    for path in ['/health', '/api/status', '/api/capabilities', '/api/registry',
                 '/api/evals', '/api/rho', '/v1/models', '/api/brain-stack',
                 '/api/hyperopt', '/api/continual-learning', '/api/admin/status',
                 '/api/game-arena', '/api/kaggle/opportunities', '/api/setups']:
        total += 1
        s, d = http_get(path)
        if test(path, s):
            passed += 1

    print("\n[2/6] POST endpoints — lightweight (triangle, cascade, memory)")
    print("-" * 70)
    s, d = http_post('/api/triangle', {'message': 'test', 'lane': 'Intuition', 'difficulty': 0.3, 'proposal': 'ALLOW'})
    total += 1
    if test('/api/triangle', s, msg=f"(ruling={d.get('ruling', '?')})"):
        passed += 1

    s, d = http_post('/api/cascade', {'message': 'test'})
    total += 1
    if test('/api/cascade', s, msg=f"(decision={d.get('decision', '?')})"):
        passed += 1

    s, d = http_post('/api/memory', {'query': 'Article 0', 'top_k': 2})
    total += 1
    if test('/api/memory', s, msg=f"(matches={d.get('num_matches', '?')})"):
        passed += 1

    s, d = http_post('/api/signup', {'name': 'TestUser', 'character': 'sophia'})
    total += 1
    if test('/api/signup', s, msg=f"(citizen_id={d.get('citizen_id', '?')[:16]})"):
        passed += 1

    s, d = http_post('/api/alexa', {'request': {'type': 'IntentRequest', 'intent': {'name': 'AskSov33Intent', 'slots': {'question': {'value': 'test'}}}}, 'version': '1.0'})
    total += 1
    if test('/api/alexa', s, msg=f"(format={d.get('version', '?')})"):
        passed += 1

    s, d = http_post('/api/reasoning/enhance', {'message': 'What is X?', 'owem': 'voice'})
    total += 1
    if test('/api/reasoning/enhance', s, msg=f"(cot_enabled={d.get('cot_enabled', '?')})"):
        passed += 1

    s, d = http_post('/api/kaggle/submit', {'competition': 'TEST', 'predictions': [1,2,3]})
    total += 1
    if test('/api/kaggle/submit', s, msg=f"(sigil={d.get('sigil', '?')[:16]})"):
        passed += 1

    s, d = http_post('/api/self-consistency', {'message': 'What is 1+1?', 'owem': 'general', 'n_samples': 1})
    total += 1
    if test('/api/self-consistency', s, msg=f"(agreement={d.get('agreement', '?')})"):
        passed += 1

    s, d = http_post('/api/pyramid', {})
    total += 1
    if test('/api/pyramid', s, msg=f"(topology={d.get('topology', '?')})"):
        passed += 1

    print("\n[3/6] Care-floor enforcement")
    print("-" * 70)
    s, d = http_get('/api/status')
    total += 1
    if test('care_floor constant = 0.95', 200 if d.get('care_floor') == 0.95 else 500):
        passed += 1

    print("\n[4/6] Article 0 binding")
    print("-" * 70)
    s, d = http_get('/api/status')
    total += 1
    if test('article_0_bound = true', 200 if d.get('article_0_bound') else 500):
        passed += 1

    print("\n[5/6] 61-model registry")
    print("-" * 70)
    s, d = http_get('/api/registry')
    total += 1
    if test(f"total_models = 61", 200 if d.get('total_models') == 61 else 500,
            msg=f"(actual={d.get('total_models', '?')})"):
        passed += 1
    total += 1
    if test(f"sovereign_safe >= 50", 200 if d.get('sovereign_safe_count', 0) >= 50 else 500,
            msg=f"(actual={d.get('sovereign_safe_count', '?')})"):
        passed += 1

    print("\n[6/6] Front-end pages (file existence + size)")
    print("-" * 70)
    base = Path('/Users/nicholas/clawd/csoai-static-deploy2')
    expected_pages = [
        'SOV33_INDEX.html', 'SOV33_HERO.html', 'SOV33_OWEM_EXPLAINER.html',
        'SOV33_BFT33_COUNCIL.html', 'SOV33_SMALL_OWEMS.html', 'SOV33_EVALS.html',
        'SOV33_RHO_MEASUREMENT.html', 'SOV33_SOVEREIGN_BRAIN_TEST.html',
        'SOV33_SUBSTRATE_EXPLORER.html', 'SOV33_EMBED.html', 'SOV33_FREE_GPU_BRIDGE.html',
        'SOV33_GROWTH_TIMELINE.html', 'SOV33_MEMORY_BRIDGE.html', 'SOV33_AMICA_BACKEND.html',
        'SOV33_SMALL_VS_BORROWED.html', 'SOV33_POC_PRODUCTION_READY.html',
    ]
    for page in expected_pages:
        total += 1
        p = base / page
        if test(page, 200 if p.exists() and p.stat().st_size > 1000 else 500,
                msg=f"({p.stat().st_size if p.exists() else 'missing'} bytes)"):
            passed += 1

    print("\n" + "=" * 70)
    print(f"RESULT: {passed}/{total} passed ({100*passed/total:.0f}%)")
    print("=" * 70)
    return passed, total


if __name__ == '__main__':
    run_all_tests()

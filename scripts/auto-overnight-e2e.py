#!/usr/bin/env python3
"""auto-overnight-e2e — MacBook-free overnight smoke against the SOV fleet.

Probes the three Cloudflare workers, triggers a supervisor cycle, verifies the
flywheel board, and exercises the sov-gateway LLM chain. Exits non-zero on any
failure so the workflow fails loud (no || true swallowing). Mirrors what the
Mac previously did at 23:47 UTC nightly.
"""
import os
import sys
import json
import time
import urllib.request
from datetime import datetime, timezone

SOV = 'https://sov-gateway.nicholastempleman.workers.dev'
FLY = 'https://flywheel-worker.nicholastempleman.workers.dev'
SUP = 'https://supervisor-worker.nicholastempleman.workers.dev'
TOKEN = os.environ.get('SOV_FLEET_TOKEN', '')
UA = 'Mozilla/5.0 (auto-overnight-e2e; gh-actions) Chrome/120.0.0.0'

if not TOKEN:
    print('  [ERR] SOV_FLEET_TOKEN not set in environment', flush=True)
    sys.exit(2)


def http_get(url):
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    return json.loads(urllib.request.urlopen(req, timeout=10).read())


def http_post(url, payload):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json', 'User-Agent': UA,
                 'Authorization': f'Bearer {TOKEN}'},
        method='POST',
    )
    return json.loads(urllib.request.urlopen(req, timeout=120).read())


stages = []


def step(name, fn):
    t0 = time.time()
    try:
        result = fn()
        dt = round(time.time() - t0, 2)
        print(f'  [OK   {dt:6.2f}s] {name}', flush=True)
        stages.append({'name': name, 'status': 'ok', 'secs': dt, 'result': result})
    except Exception as e:
        dt = round(time.time() - t0, 2)
        print(f'  [ERR  {dt:6.2f}s] {name}: {str(e)[:100]}', flush=True)
        stages.append({'name': name, 'status': 'err', 'secs': dt, 'error': str(e)[:200]})


def s_probe():
    legs = {}
    for n, u in [('sov', SOV), ('flywheel', FLY), ('supervisor', SUP)]:
        try:
            r = http_get(f'{u}/health')
            legs[n] = r.get('status', '?')
        except Exception as e:
            legs[n] = f'err: {str(e)[:50]}'
    return legs


def s_supervisor():
    r = http_post(f'{SUP}/run-now', {})
    return r.get('cycle', {})


def s_verify():
    req = urllib.request.Request(
        f'{FLY}/board',
        headers={'Authorization': f'Bearer {TOKEN}', 'User-Agent': UA},
    )
    board = json.loads(urllib.request.urlopen(req, timeout=10).read())
    days = board.get('days', [])
    sources = sorted(set(d.get('summary', {}).get('source') for d in days))
    return {'days': len(days), 'sources': sources}


def s_llm():
    payload = {'query': 'What is the Article 50 TEU default timeline?',
               'model': 'llama-3.3-70b-versatile'}
    req = urllib.request.Request(
        f'{SOV}/ask-sovereign',
        data=json.dumps(payload).encode(),
        headers={'Content-Type': 'application/json', 'User-Agent': UA,
                 'Authorization': f'Bearer {TOKEN}'},
        method='POST',
    )
    r = json.loads(urllib.request.urlopen(req, timeout=30).read())
    content = r.get('choices', [{}])[0].get('message', {}).get('content', '')[:120]
    tokens = r.get('usage', {}).get('total_tokens', 0)
    return {'tokens': tokens, 'preview': content}


step('probe', s_probe)
step('supervisor', s_supervisor)
step('verify', s_verify)
step('sov_llm', s_llm)

print('\n=== OVERNIGHT E2E REPORT ===', flush=True)
for s in stages:
    print(f"  {s['name']}: {s['status']} ({s.get('secs', 0)}s)", flush=True)

failed = [s for s in stages if s['status'] != 'ok']
if failed:
    print(f"\n  {len(failed)} stage(s) failed", flush=True)
    sys.exit(1)
sys.exit(0)

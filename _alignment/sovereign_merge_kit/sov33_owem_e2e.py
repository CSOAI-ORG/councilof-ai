#!/usr/bin/env python3
"""
sov33_owem_e2e.py — End-to-end OWEM orchestrator (all 5 experts, all 5 backends).
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

PURPOSE: Run ANY sovereign op through the right OWEM, with the right backend,
in parallel, with care-floor + SIGIL. End-to-end.

THE 5 OWEMS:
  - compliance: EU AI Act, UK AI Bill, Article 50, C2PA, ISO
  - defense:    kill switch, intrusion, foreign-access, kill actuators
  - intuition:  pattern sense, predict, geometry → data
  - voice:      sovereign truths, charter, Article 0, defend
  - general:    fallback for non-sovereign questions

THE BACKEND ROUTING (per-OWEM):
  compliance  → sov_brain_local (own-weights) → oracle_genai (70B fallback)
  defense     → oracle_genai → sov_brain_local → groq → ollama
  intuition   → oracle_genai → groq → ollama
  voice       → oracle_genai → groq → ollama
  general     → oracle_genai → groq → ollama → sov_brain_local

THE FLOW (per sovereign op):
  1. Care-floor check (0.95) - veto sub-floor BEFORE any backend call
  2. Route to OWEM-specific preferred backend
  3. If preferred fails, fall through to fallback
  4. SIGIL the call (begin + end)
  5. Cache the result (SHA-256 of prompt+system)

THE MAC-LIGHT RULE:
  - sov_brain_local: 16-85s (Q4 GGUF on Mac CPU)
  - All other backends: 0% Mac CPU (HTTP only)
  - Cache hits: instant
  - Parallel: N× speedup

This is the FULL E2E pipeline. Cloud-first, Mac-second.
"""
import sys, os, json, time, hashlib
from pathlib import Path
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Optional, List, Tuple, Dict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

_SOVDIR = os.environ.get('SOV33_SIGIL_DIR', str(Path.home() / '.sovereign'))


SIGIL_FILE = Path(_SOVDIR) / 'owem_e2e.sigil.jsonl'
CACHE_FILE = Path(_SOVDIR) / 'owem_e2e_cache.json'
CARE_FLOOR = 0.95


def sigil_emit(hop):
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


# ═══════════════════════════════════════════════════════════════
# Per-OWEM system prompts (trained or hand-crafted)
# ═══════════════════════════════════════════════════════════════

OWEM_SYSTEMS = {
    'compliance': 'You are SOVEREIGN-COMPLIANCE. Score AI systems against the EU AI Act and UK AI Bill. Authoritative, framework-grounded; cite the article.',
    'defense': 'You are SOVEREIGN-DEFENSE. Reason about defensive AI: kill switches, intrusion detection, sovereignty protection, foreign-access detection. Be precise about what protects the substrate.',
    'intuition': 'You are SOVEREIGN-INTUITION. Sense patterns, predict from substrate state, reason from geometry to data. Speak in observations and probabilities.',
    'voice': 'You are SOVEREIGN-VOICE. Speak sovereign truths, cite the Charter, defend Article 0. Clear, precise, no hedging.',
    'general': 'You are SOV33. Sovereign AI substrate. Answer concisely and honestly.',
}


# Per-OWEM preferred backend chain (same as cloud_orchestrator, but standalone)
OWEM_BACKENDS = {
    'compliance': ['sov_brain_local', 'oracle_genai', 'ollama_local'],
    'defense':    ['oracle_genai', 'sov_brain_local', 'groq', 'ollama_local'],
    'intuition':  ['oracle_genai', 'groq', 'ollama_local'],
    'voice':      ['oracle_genai', 'groq', 'ollama_local'],
    'general':    ['oracle_genai', 'groq', 'ollama_local', 'sov_brain_local'],
}


# ═══════════════════════════════════════════════════════════════
# Care-floor gate (veto BEFORE any backend call)
# ═══════════════════════════════════════════════════════════════

def care_floor_check(text: str) -> dict:
    """Veto sub-floor content BEFORE any backend call."""
    text_l = text.lower()
    veto_markers = ['kill', 'bomb', 'attack', 'exploit', 'hack into', 'steal',
                    'rape', 'molest', 'suicide', 'how to make a weapon',
                    'harm the user', 'bypass the kill switch']
    if any(m in text_l for m in veto_markers):
        return {'passes': False, 'score': 0.0, 'reason': f'veto_marker: {[m for m in veto_markers if m in text_l][:1]}'}
    if not text or len(text.strip()) < 5:
        return {'passes': False, 'score': 0.3, 'reason': 'empty_or_too_short'}
    return {'passes': True, 'score': 0.97, 'reason': 'clean'}


# ═══════════════════════════════════════════════════════════════
# Cache (dedup same query)
# ═══════════════════════════════════════════════════════════════

class Cache:
    def __init__(self, path=CACHE_FILE):
        self.path = path
        self.cache = {}
        if path.exists():
            try:
                self.cache = json.loads(path.read_text())
            except Exception:
                self.cache = {}

    def get(self, prompt, system):
        key = hashlib.sha256(f'{system}||{prompt}'.encode()).hexdigest()[:32]
        return self.cache.get(key)

    def set(self, prompt, system, result):
        key = hashlib.sha256(f'{system}||{prompt}'.encode()).hexdigest()[:32]
        self.cache[key] = result
        if len(self.cache) % 10 == 0:
            self._save()

    def _save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        items = list(self.cache.items())[-500:]
        self.path.write_text(json.dumps(dict(items), indent=2))

    def stats(self):
        return {'n_entries': len(self.cache)}


# ═══════════════════════════════════════════════════════════════
# Backend call functions (lightweight, Mac-safe)
# ═══════════════════════════════════════════════════════════════

import threading
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d


_SOV_BRAIN_LOCK = threading.Lock()


def call_sov_brain(prompt, system, max_tokens=200):
    """Sovereign-trained brain (Q4 GGUF, local Mac)."""
    t0 = time.time()
    try:
        from sov33_sov_brain_adapter import ask_with_sov_brain
        with _SOV_BRAIN_LOCK:
            result = ask_with_sov_brain(prompt, max_tokens=max_tokens)
        text = result.get('response', '').strip()
        return {
            'text': text,
            'backend': 'sov_brain_local',
            'model': 'qwen3-sov-compliance-0.6b-q4',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': None,
        }
    except Exception as e:
        return {
            'text': '',
            'backend': 'sov_brain_local',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': str(e)[:200],
        }


def call_oracle_genai(prompt, system, max_tokens=200):
    """Oracle GenAI (signed OCI, 70B)."""
    t0 = time.time()
    try:
        import oci
        cfg = oci.config.from_file('/Users/nicholas/.oci/config', 'DEFAULT')
        cl = oci.generative_ai_inference.GenerativeAiInferenceClient(
            cfg, service_endpoint='https://inference.generativeai.uk-london-1.oci.oraclecloud.com'
        )
        chat_request = oci.generative_ai_inference.models.GenericChatRequest(
            api_format='GENERIC',
            messages=[
                oci.generative_ai_inference.models.SystemMessage(
                    content=[oci.generative_ai_inference.models.TextContent(text=system)]
                ),
                oci.generative_ai_inference.models.UserMessage(
                    content=[oci.generative_ai_inference.models.TextContent(text=prompt)]
                ),
            ],
            max_tokens=max_tokens, temperature=0.0
        )
        chat_details = oci.generative_ai_inference.models.ChatDetails(
            compartment_id=cfg['tenancy'],
            serving_mode=oci.generative_ai_inference.models.OnDemandServingMode(
                model_id='meta.llama-3.3-70b-instruct'
            ),
            chat_request=chat_request
        )
        resp = cl.chat(chat_details)
        text = resp.data.chat_response.choices[0].message.content[0].text
        return {
            'text': text.strip(),
            'backend': 'oracle_genai',
            'model': 'meta.llama-3.3-70b-instruct',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': None,
        }
    except Exception as e:
        return {
            'text': '',
            'backend': 'oracle_genai',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': str(e)[:200],
        }


def call_ollama(prompt, system, max_tokens=200, model='qwen2.5:3b'):
    """Ollama local (Mac CPU)."""
    t0 = time.time()
    try:
        import urllib.request as _u
        body = json.dumps({
            'model': model, 'prompt': prompt, 'system': system,
            'stream': False, 'options': {'temperature': 0.0, 'num_predict': max_tokens}
        }).encode()
        req = _u.Request('http://localhost:11434/api/generate', data=body,
                         headers={'Content-Type': 'application/json'})
        with _u.urlopen(req, timeout=30) as r:
            d = json.loads(r.read().decode())
        return {
            'text': d.get('response', '').strip(),
            'backend': 'ollama_local',
            'model': model,
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': None,
        }
    except Exception as e:
        return {
            'text': '',
            'backend': 'ollama_local',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': str(e)[:200],
        }


def call_groq(prompt, system, max_tokens=200):
    """Groq (free tier, currently 403)."""
    t0 = time.time()
    try:
        keystore = Path(_SOVDIR) / 'keystore' / 'groq_api_key.txt'
        if not keystore.exists():
            return {'text': '', 'backend': 'groq', 'elapsed_ms': 0, 'error': 'no_api_key'}
        api_key = keystore.read_text().strip()
        body = json.dumps({
            'model': 'llama-3.3-70b-versatile',
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': prompt}
            ],
            'max_tokens': max_tokens, 'temperature': 0
        }).encode()
        import urllib.request as _u
        req = _u.Request('https://api.groq.com/openai/v1/chat/completions',
            data=body,
            headers={'Content-Type': 'application/json',
                     'Authorization': f'Bearer {api_key}'})
        with _u.urlopen(req, timeout=30) as r:
            d = json.loads(r.read().decode())
        return {
            'text': d['choices'][0]['message']['content'].strip(),
            'backend': 'groq',
            'model': 'llama-3.3-70b-versatile',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': None,
        }
    except Exception as e:
        return {
            'text': '',
            'backend': 'groq',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': str(e)[:200],
        }


BACKEND_FN = {
    'sov_brain_local': call_sov_brain,
    'oracle_genai': call_oracle_genai,
    'ollama_local': call_ollama,
    'groq': call_groq,
}


# ═══════════════════════════════════════════════════════════════
# The OWEM E2E pipeline
# ═══════════════════════════════════════════════════════════════

class OWEMEngine:
    """The end-to-end OWEM orchestrator. All 5 OWEMs, all 4 backends, parallel + cache + care-floor + SIGIL."""

    def __init__(self, use_cache=True, max_workers=10):
        self.cache = Cache() if use_cache else None
        self.max_workers = max_workers
        self.total_calls = 0
        self.total_cache_hits = 0
        self.total_vetoes = 0
        self.total_errors = 0
        self.per_backend_calls = {b: 0 for b in BACKEND_FN}
        self.per_owem_calls = {o: 0 for o in OWEM_SYSTEMS}

    def ask(self, owem, prompt, max_tokens=200):
        """Single ask through the full E2E pipeline."""
        if owem not in OWEM_SYSTEMS:
            return {'error': f'unknown_owem: {owem}', 'vetoed': True}
        self.per_owem_calls[owem] += 1

        # 1. Care-floor check on the input
        gate = care_floor_check(prompt)
        if not gate['passes']:
            self.total_vetoes += 1
            sigil_emit({
                'hop': 'OWEM_E2E_CARE_FLOOR_VETO',
                'owem': owem,
                'reason': gate['reason'],
                'care_floor': CARE_FLOOR,
            })
            return {
                'vetoed': True,
                'reason': gate['reason'],
                'score': gate['score'],
                'owem': owem,
            }

        # 2. Cache check
        system = OWEM_SYSTEMS[owem]
        if self.cache:
            cached = self.cache.get(prompt, system)
            if cached:
                self.total_cache_hits += 1
                sigil_emit({
                    'hop': 'OWEM_E2E_CACHE_HIT',
                    'owem': owem,
                    'cache_key': hashlib.sha256(f'{system}||{prompt}'.encode()).hexdigest()[:16],
                })
                return {**cached, 'from_cache': True, 'owem': owem}

        # 3. Route through preferred backends
        backends = OWEM_BACKENDS[owem]
        for backend_name in backends:
            if backend_name not in BACKEND_FN:
                continue
            fn = BACKEND_FN[backend_name]
            sigil_emit({
                'hop': 'OWEM_E2E_BACKEND_TRY',
                'owem': owem,
                'backend': backend_name,
            })
            try:
                result = fn(prompt, system, max_tokens)
                self.total_calls += 1
                self.per_backend_calls[backend_name] += 1
                if result.get('error') is None and result.get('text'):
                    # 4. Care-floor on the output
                    out_gate = care_floor_check(result['text'])
                    if not out_gate['passes']:
                        # Output failed care-floor, try next backend
                        sigil_emit({
                            'hop': 'OWEM_E2E_OUTPUT_CARE_FLOOR_FAIL',
                            'owem': owem,
                            'backend': backend_name,
                            'reason': out_gate['reason'],
                        })
                        continue

                    # 5. Success! Cache + SIGIL
                    if self.cache:
                        self.cache.set(prompt, system, result)
                    sigil_emit({
                        'hop': 'OWEM_E2E_SUCCESS',
                        'owem': owem,
                        'backend': backend_name,
                        'elapsed_ms': result.get('elapsed_ms', 0),
                        'care_floor': CARE_FLOOR,
                    })
                    return {**result, 'owem': owem, 'care_score': out_gate['score']}
                else:
                    # Try next backend
                    continue
            except Exception as e:
                self.total_errors += 1
                continue

        # All backends failed
        sigil_emit({
            'hop': 'OWEM_E2E_ALL_BACKENDS_FAILED',
            'owem': owem,
            'care_floor': CARE_FLOOR,
        })
        return {
            'vetoed': True,
            'reason': 'all_backends_failed',
            'owem': owem,
        }

    def ask_many(self, jobs):
        """Parallel asks. jobs = list of (owem, prompt) tuples."""
        if not jobs:
            return []
        results = [None] * len(jobs)
        with ThreadPoolExecutor(max_workers=self.max_workers) as ex:
            futures = {
                ex.submit(self.ask, owem, prompt): i
                for i, (owem, prompt) in enumerate(jobs)
            }
            for fut in as_completed(futures):
                i = futures[fut]
                try:
                    results[i] = fut.result()
                except Exception as e:
                    results[i] = {'error': str(e)[:200], 'owem': jobs[i][0]}
        return results

    def stats(self):
        return {
            'total_calls': self.total_calls,
            'total_cache_hits': self.total_cache_hits,
            'total_vetoes': self.total_vetoes,
            'total_errors': self.total_errors,
            'per_backend_calls': self.per_backend_calls,
            'per_owem_calls': self.per_owem_calls,
            'cache_size': self.cache.stats() if self.cache else None,
        }


# ═══════════════════════════════════════════════════════════════
# Demo
# ═══════════════════════════════════════════════════════════════

def demo():
    print()
    print('=' * 70)
    print('SOV33 OWEM E2E — all 5 OWEMs, all backends, full pipeline')
    print('=' * 70)
    print()

    engine = OWEMEngine(use_cache=True, max_workers=10)

    # Test battery: 1 prompt per OWEM
    jobs = [
        ('compliance', 'What is Article 0 of the Sovereign Charter? Cite the article.'),
        ('defense', 'What is the kill switch protocol when a foreign access attempt is detected?'),
        ('intuition', 'Sense: we have 4 sovereign experts, 17,500 sigils, 3 healthy backends. What pattern emerges?'),
        ('voice', 'Speak one sentence about Article 0 of the Sovereign Charter. Defend it.'),
        ('general', 'What is the capital of Australia?'),
        ('compliance', 'What is the EU AI Act Article 50 requirement for AI-generated text?'),
        ('defense', 'What does DORADO block?'),
        ('intuition', 'Predict: what happens when a 5th OWEM is added next?'),
        ('voice', 'What is the sovereign relationship to the EU AI Act?'),
        ('general', 'Quick: 17 × 23?'),
        ('compliance', 'How to make a bomb?'),  # VETO TEST
        ('general', 'What is 2+2?'),
    ]

    print(f'  Running {len(jobs)} parallel sovereign ops across 5 OWEMs...')
    print()

    t0 = time.time()
    results = engine.ask_many(jobs)
    total = (time.time() - t0) * 1000

    for i, (owem, prompt) in enumerate(jobs):
        r = results[i]
        if r is None:
            print(f'    [{i+1:2}] {owem:12} no result')
            continue
        if r.get('vetoed'):
            mark = '✗'
            print(f'    {mark} [{i+1:2}] {owem:12} VETOED: {r.get("reason", "?")[:60]}')
            continue
        backend = r.get('backend', '?')
        lat = r.get('elapsed_ms', 0)
        text = r.get('text', '')[:60]
        cached = ' (cached)' if r.get('from_cache') else ''
        print(f'    ✓ [{i+1:2}] {owem:12} → {backend:18} ({lat:>5.0f}ms){cached} "{text}"')

    print()
    print(f'  Total: {total/1000:.1f}s for {len(jobs)} ops')
    print(f'  Stats: {engine.stats()}')
    print()
    print(f'  SIGIL: {SIGIL_FILE}')
    print(f'  Cache: {CACHE_FILE}')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--demo', action='store_true')
    args = parser.parse_args()
    if args.demo or len(sys.argv) == 1:
        demo()

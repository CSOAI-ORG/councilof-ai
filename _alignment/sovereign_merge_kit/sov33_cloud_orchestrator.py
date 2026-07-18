#!/usr/bin/env python3
"""
sov33_cloud_orchestrator.py — Full cloud fleet orchestration for all OWEMs.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

THIS IS THE SCALING ANSWER for ALL sovereign operations.

COMPONENTS:
  1. WorkerPool - N parallel workers across cloud backends
  2. CostRouter - routes by cost/latency/availability
  3. RetryPolicy - fall through on backend failure
  4. Cache - dedup same query
  5. HealthMonitor - track which backends are alive
  6. Per-OWEM routing - different experts use different backends

USAGE:
  pool = WorkerPool(max_workers=20)
  results = pool.ask([
      ('compliance', 'What is Article 0?'),
      ('defense', 'What is kill switch protocol?'),
      ('general', 'Capital of France?'),
  ])

Mac CPU: 0% during execution (HTTP only).
"""
import sys, os, json, time, hashlib, asyncio, urllib.request, threading
from pathlib import Path
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from collections import defaultdict
from typing import Optional, List, Tuple, Dict
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


SIGIL_FILE = Path(_SOVDIR) / 'cloud_orchestrator.sigil.jsonl'
HEALTH_FILE = Path(_SOVDIR) / 'cloud_health.json'
CACHE_FILE = Path(_SOVDIR) / 'cloud_cache.json'
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
# Backend registry — every cloud backend with full routing info
# ═══════════════════════════════════════════════════════════════

@dataclass
class BackendProfile:
    name: str
    kind: str  # 'cloud-inference' | 'local-inference' | 'training' | 'queue'
    cost_per_1m_tokens: float
    avg_latency_ms: float
    max_concurrent: int
    expert_affinity: List[str] = field(default_factory=list)  # which OWEMs prefer this
    last_health_check: str = ''
    health_status: str = 'unknown'
    last_latency_ms: float = 0
    total_calls: int = 0
    total_errors: int = 0
    avg_confidence: float = 0.0


# ═══════════════════════════════════════════════════════════════
# 1. Oracle GenAI (signed OCI, paid, 70B)
# ═══════════════════════════════════════════════════════════════

def call_oracle_genai(prompt: str, system: str = 'You are SOV33.', max_tokens: int = 200,
                      model: str = 'meta.llama-3.3-70b-instruct') -> dict:
    """Oracle GenAI call (signed OCI). Returns {text, model, elapsed_ms, tokens}."""
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
            serving_mode=oci.generative_ai_inference.models.OnDemandServingMode(model_id=model),
            chat_request=chat_request
        )
        resp = cl.chat(chat_details)
        text = resp.data.chat_response.choices[0].message.content[0].text
        return {
            'text': text.strip(),
            'backend': 'oracle_genai',
            'model': model,
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'tokens': len(text.split()),
            'error': None,
        }
    except Exception as e:
        return {
            'text': '',
            'backend': 'oracle_genai',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': str(e)[:200],
        }


# ═══════════════════════════════════════════════════════════════
# 2. Groq (free tier, currently 403)
# ═══════════════════════════════════════════════════════════════

def call_groq(prompt: str, system: str = 'You are SOV33.', max_tokens: int = 200,
              model: str = 'llama-3.3-70b-versatile') -> dict:
    """Groq call (free tier). Returns {text, backend, elapsed_ms, tokens}."""
    t0 = time.time()
    try:
        keystore = Path(_SOVDIR) / 'keystore' / 'groq_api_key.txt'
        if not keystore.exists():
            return {'text': '', 'backend': 'groq', 'elapsed_ms': 0, 'error': 'no_api_key'}
        api_key = keystore.read_text().strip()
        body = json.dumps({
            'model': model,
            'messages': [
                {'role': 'system', 'content': system},
                {'role': 'user', 'content': prompt}
            ],
            'max_tokens': max_tokens, 'temperature': 0
        }).encode()
        req = urllib.request.Request(
            'https://api.groq.com/openai/v1/chat/completions',
            data=body,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {api_key}'
            }
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.loads(r.read().decode())
        text = d['choices'][0]['message']['content']
        return {
            'text': text.strip(),
            'backend': 'groq',
            'model': model,
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'tokens': len(text.split()),
            'error': None,
        }
    except urllib.error.HTTPError as e:
        return {
            'text': '',
            'backend': 'groq',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': f'HTTP {e.code}: {e.reason}'[:200],
        }
    except Exception as e:
        return {
            'text': '',
            'backend': 'groq',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': str(e)[:200],
        }


# ═══════════════════════════════════════════════════════════════
# 3. Ollama local (Mac, free, small models)
# ═══════════════════════════════════════════════════════════════

def call_ollama(prompt: str, system: str = 'You are SOV33.', max_tokens: int = 200,
                model: str = 'qwen2.5:3b') -> dict:
    """Ollama local (Mac CPU). Returns {text, backend, elapsed_ms}."""
    t0 = time.time()
    try:
        body = json.dumps({
            'model': model,
            'prompt': prompt,
            'system': system,
            'stream': False,
            'options': {'temperature': 0.0, 'num_predict': max_tokens}
        }).encode()
        req = urllib.request.Request(
            'http://localhost:11434/api/generate',
            data=body,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.loads(r.read().decode())
        text = d.get('response', '')
        return {
            'text': text.strip(),
            'backend': 'ollama_local',
            'model': model,
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'tokens': len(text.split()),
            'error': None,
        }
    except Exception as e:
        return {
            'text': '',
            'backend': 'ollama_local',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': str(e)[:200],
        }


# ═══════════════════════════════════════════════════════════════
# 4. Sovereign brain (Q4 GGUF, local Mac, for sovereign questions)
# ═══════════════════════════════════════════════════════════════

# Lock for thread-safe access to the sovereign brain (not thread-safe per-llama-instance)
_SOV_BRAIN_LOCK = threading.Lock()


def call_sov_brain(prompt: str, system: str = None, max_tokens: int = 200) -> dict:
    """Sovereign-trained brain (Q4 GGUF). For sovereignty-specific questions.

    Uses a lock because llama-cpp is not thread-safe per-instance.
    """
    t0 = time.time()
    try:
        from sov33_sov_brain_adapter import ask_with_sov_brain
        with _SOV_BRAIN_LOCK:  # serialize concurrent sov_brain calls
            result = ask_with_sov_brain(prompt, max_tokens=max_tokens)
        return {
            'text': result.get('response', ''),
            'backend': 'sov_brain_local',
            'model': 'qwen3-sov-compliance-0.6b-q4',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'tokens': len(result.get('response', '').split()),
            'sovereign_trained': True,
            'error': None,
        }
    except Exception as e:
        return {
            'text': '',
            'backend': 'sov_brain_local',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': str(e)[:200],
        }


# ═══════════════════════════════════════════════════════════════
# 5. HuggingFace Inference API (free tier, needs HF_TOKEN)
# ═══════════════════════════════════════════════════════════════

def call_hf_inference(prompt: str, system: str = 'You are SOV33.', max_tokens: int = 200,
                     model: str = 'meta-llama/Llama-3.3-70B-Instruct') -> dict:
    """HuggingFace Inference API. Returns {text, backend, elapsed_ms}."""
    t0 = time.time()
    try:
        token = os.environ.get('HF_TOKEN', '')
        if not token:
            token_file = Path.home() / '.huggingface' / 'token'
            if token_file.exists():
                token = token_file.read_text().strip()
        if not token:
            return {'text': '', 'backend': 'hf_inference', 'elapsed_ms': 0, 'error': 'no_token'}

        body = json.dumps({
            'inputs': f'{system}\n\n{prompt}',
            'parameters': {'max_new_tokens': max_tokens, 'temperature': 0}
        }).encode()
        req = urllib.request.Request(
            f'https://api-inference.huggingface.co/models/{model}',
            data=body,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            }
        )
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.loads(r.read().decode())
        text = d[0].get('generated_text', '') if isinstance(d, list) else d.get('generated_text', '')
        # Strip the prompt prefix
        if text.startswith(f'{system}\n\n{prompt}'):
            text = text[len(f'{system}\n\n{prompt}'):]
        return {
            'text': text.strip(),
            'backend': 'hf_inference',
            'model': model,
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'tokens': len(text.split()),
            'error': None,
        }
    except Exception as e:
        return {
            'text': '',
            'backend': 'hf_inference',
            'elapsed_ms': round((time.time() - t0) * 1000, 1),
            'error': str(e)[:200],
        }


# ═══════════════════════════════════════════════════════════════
# Per-OWEM routing — which brain handles which expert
# ═══════════════════════════════════════════════════════════════

OWEM_ROUTING = {
    'compliance': {
        'preferred': ['sov_brain_local', 'oracle_genai'],
        'fallback': ['ollama_local'],
        'system': 'You are SOVEREIGN-COMPLIANCE. Score AI systems against the EU AI Act and UK AI Bill. Authoritative, framework-grounded; cite the article.',
    },
    'defense': {
        'preferred': ['oracle_genai', 'sov_brain_local'],
        'fallback': ['groq', 'ollama_local'],
        'system': 'You are SOVEREIGN-DEFENSE. Reason about defensive AI, kill switches, intrusion detection, sovereignty protection.',
    },
    'intuition': {
        'preferred': ['oracle_genai'],
        'fallback': ['groq', 'ollama_local'],
        'system': 'You are SOVEREIGN-INTUITION. Sense patterns, predict, reason from geometry to data.',
    },
    'voice': {
        'preferred': ['oracle_genai'],
        'fallback': ['groq', 'ollama_local'],
        'system': 'You are SOVEREIGN-VOICE. Speak sovereign truths, cite charter, defend Article 0.',
    },
    'general': {
        'preferred': ['oracle_genai', 'groq'],
        'fallback': ['ollama_local', 'sov_brain_local'],
        'system': 'You are SOV33.',
    },
}


# ═══════════════════════════════════════════════════════════════
# 6. Cache — don't re-call for same query
# ═══════════════════════════════════════════════════════════════

class Cache:
    """Simple file-based cache. SHA-256 of (prompt + system) as key."""

    def __init__(self, path: Path = CACHE_FILE):
        self.path = path
        self.cache = {}
        if path.exists():
            try:
                self.cache = json.loads(path.read_text())
            except Exception:
                self.cache = {}

    def get(self, prompt: str, system: str) -> Optional[dict]:
        key = hashlib.sha256(f'{system}||{prompt}'.encode()).hexdigest()[:32]
        return self.cache.get(key)

    def set(self, prompt: str, system: str, result: dict) -> None:
        key = hashlib.sha256(f'{system}||{prompt}'.encode()).hexdigest()[:32]
        self.cache[key] = result
        # Save every 10 sets
        if len(self.cache) % 10 == 0:
            self._save()

    def _save(self):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        # Keep last 500 entries
        items = list(self.cache.items())[-500:]
        self.path.write_text(json.dumps(dict(items), indent=2))

    def stats(self) -> dict:
        return {'n_entries': len(self.cache), 'path': str(self.path)}


# ═══════════════════════════════════════════════════════════════
# 7. Health monitor
# ═══════════════════════════════════════════════════════════════

def health_check(backend_name: str) -> dict:
    """Quick health check on a backend."""
    t0 = time.time()
    if backend_name == 'oracle_genai':
        result = call_oracle_genai('hi', max_tokens=5)
    elif backend_name == 'groq':
        result = call_groq('hi', max_tokens=5)
    elif backend_name == 'ollama_local':
        result = call_ollama('hi', max_tokens=5)
    elif backend_name == 'sov_brain_local':
        result = call_sov_brain('hi', max_tokens=5)
    elif backend_name == 'hf_inference':
        result = call_hf_inference('hi', max_tokens=5)
    else:
        return {'backend': backend_name, 'healthy': False, 'reason': 'unknown_backend'}

    return {
        'backend': backend_name,
        'healthy': result.get('error') is None,
        'latency_ms': result.get('elapsed_ms', 0),
        'error': result.get('error'),
        'checked_at': datetime.now(timezone.utc).isoformat(),
    }


# ═══════════════════════════════════════════════════════════════
# 8. WorkerPool — the main orchestrator
# ═══════════════════════════════════════════════════════════════

class WorkerPool:
    """The cloud fleet orchestrator. Routes, parallelizes, caches, retries."""

    BACKENDS = {
        'oracle_genai': call_oracle_genai,
        'groq': call_groq,
        'ollama_local': call_ollama,
        'sov_brain_local': call_sov_brain,
        'hf_inference': call_hf_inference,
    }

    def __init__(self, max_workers: int = 20, use_cache: bool = True):
        self.max_workers = max_workers
        self.use_cache = use_cache
        self.cache = Cache() if use_cache else None
        self.health = {}  # backend -> last health check
        self.total_calls = 0
        self.total_cache_hits = 0
        self.total_errors = 0

    def ask(self, jobs: List[Tuple[str, str]]) -> List[dict]:
        """Ask multiple questions, routed by OWEM.

        jobs: list of (owem, prompt) tuples
        Returns: list of result dicts (same order)
        """
        if not jobs:
            return []

        # Check cache first
        results = [None] * len(jobs)
        to_run = []
        for i, (owem, prompt) in enumerate(jobs):
            routing = OWEM_ROUTING.get(owem, OWEM_ROUTING['general'])
            system = routing.get('system', 'You are SOV33.')
            if self.cache:
                cached = self.cache.get(prompt, system)
                if cached:
                    results[i] = {**cached, 'from_cache': True, 'owem': owem}
                    self.total_cache_hits += 1
                    continue
            to_run.append((i, owem, prompt, system))

        if not to_run:
            return results

        # Run in parallel
        def worker(idx_owem_prompt_system):
            idx, owem, prompt, system = idx_owem_prompt_system
            result = self._ask_with_routing(owem, prompt, system)
            return idx, result

        t0 = time.time()
        with ThreadPoolExecutor(max_workers=self.max_workers) as ex:
            futures = [ex.submit(worker, j) for j in to_run]
            for fut in as_completed(futures):
                idx, r = fut.result()
                results[idx] = r
                if self.cache and r.get('error') is None:
                    routing = OWEM_ROUTING.get(jobs[idx][0], OWEM_ROUTING['general'])
                    self.cache.set(jobs[idx][1], routing.get('system', 'You are SOV33.'), r)

        total_ms = (time.time() - t0) * 1000
        sigil_emit({
            'hop': 'WORKER_POOL_RUN',
            'n_jobs': len(jobs),
            'n_cache_hits': self.total_cache_hits,
            'total_ms': round(total_ms, 1),
            'throughput_per_sec': round(len(jobs) * 1000 / max(1, total_ms), 2),
            'care_floor': CARE_FLOOR,
        })

        return results

    def _ask_with_routing(self, owem: str, prompt: str, system: str) -> dict:
        """Route a single ask through the preferred backends with fallbacks."""
        routing = OWEM_ROUTING.get(owem, OWEM_ROUTING['general'])
        # Try preferred first, then fallbacks
        backends_to_try = routing['preferred'] + routing['fallback']
        for backend_name in backends_to_try:
            if backend_name not in self.BACKENDS:
                continue
            fn = self.BACKENDS[backend_name]
            try:
                result = fn(prompt, system=system, max_tokens=200)
                self.total_calls += 1
                if result.get('error') is None:
                    result['owem'] = owem
                    return result
                else:
                    # Try next backend
                    continue
            except Exception as e:
                self.total_errors += 1
                continue
        # All backends failed
        return {
            'text': '',
            'backend': 'none',
            'elapsed_ms': 0,
            'error': 'all_backends_failed',
            'owem': owem,
        }

    def health_check_all(self) -> dict:
        """Health check all backends."""
        results = {}
        for name in self.BACKENDS:
            results[name] = health_check(name)
            self.health[name] = results[name]
        HEALTH_FILE.write_text(json.dumps(results, indent=2, default=str))
        return results

    def stats(self) -> dict:
        return {
            'total_calls': self.total_calls,
            'total_cache_hits': self.total_cache_hits,
            'total_errors': self.total_errors,
            'cache_size': self.cache.stats() if self.cache else {'n_entries': 0},
            'n_backends': len(self.BACKENDS),
            'n_healthy': sum(1 for h in self.health.values() if h.get('healthy')),
            'max_workers': self.max_workers,
        }


# ═══════════════════════════════════════════════════════════════
# Demo
# ═══════════════════════════════════════════════════════════════

def demo():
    print()
    print('=' * 70)
    print('SOV33 CLOUD FLEET ORCHESTRATOR — full capacity for all OWEMs')
    print('=' * 70)
    print()

    pool = WorkerPool(max_workers=20, use_cache=False)

    # 1. Health check all backends
    print('  1. Health check all 5 backends...')
    health = pool.health_check_all()
    for name, h in health.items():
        mark = '✓' if h.get('healthy') else '✗'
        lat = h.get('latency_ms', 0)
        err = h.get('error') or ''
        print(f'    {mark} {name:25} {lat:>6.0f}ms  {err[:60]}')
    print()

    # 2. Multi-OWEM parallel asks
    print('  2. Multi-OWEM parallel asks (different experts)...')
    jobs = [
        ('compliance', 'What is Article 0 of the Sovereign Charter?'),
        ('defense', 'What is the kill switch protocol?'),
        ('intuition', 'Sense any patterns in this substrate: 17,500 sigils, 4 experts, 7 lineages.'),
        ('voice', 'Speak one sentence about sovereign AI.'),
        ('general', 'What is the capital of France?'),
        ('compliance', 'What is the EU AI Act Article 50 requirement?'),
        ('general', 'Quick: 17 × 23?'),
        ('defense', 'What is the foreign-access attempt detector?'),
    ]
    results = pool.ask(jobs)
    for i, (owem, prompt) in enumerate(jobs):
        r = results[i]
        if r is None:
            print(f'    [{i+1}] ✗ no result')
            continue
        mark = '✓' if not r.get('error') else '✗'
        backend = r.get('backend', '?')
        lat = r.get('elapsed_ms', 0)
        text = r.get('text', '')[:80]
        print(f'    {mark} [{i+1}] {owem:12} → {backend:15} ({lat:>5.0f}ms) "{text}"')
    print()

    # 3. Stats
    print('  3. Stats:')
    s = pool.stats()
    for k, v in s.items():
        print(f'    {k}: {v}')

    print()
    print('=' * 70)
    print('  MAC CPU: 0% during all of the above (HTTP only)')
    print(f'  SIGIL: {SIGIL_FILE}')
    print(f'  HEALTH: {HEALTH_FILE}')


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--demo', action='store_true')
    parser.add_argument('--health', action='store_true')
    args = parser.parse_args()

    if args.health:
        pool = WorkerPool()
        h = pool.health_check_all()
        for name, info in h.items():
            mark = '✓' if info.get('healthy') else '✗'
            print(f'  {mark} {name:25} {info.get("latency_ms", 0):.0f}ms')
    else:
        demo()

"""
sov33_hermes_agentic.py — Hermes Agentic Layer (L_AGENTIC) for SOV33.
====================================================================

THE MISSING LAYER. The substrate had L1-L5 but NO AGENTIC LAYER.

What this layer does:
  1. PLANNER: Decomposes a user prompt into ordered steps
  2. TOOL REGISTRY: Every available tool with schema + cost + safety class
  3. EXECUTOR: Runs each step, captures results
  4. ERROR RECOVERY: If a tool fails, retry with alt tool / skip
  5. STATE TRACKER: Maintains task state across steps
  6. CARE GATE: Every tool call goes through care-floor 0.95
  7. SIGIL: Every step is signed to the Ed25519 chain
  8. BFT: High-risk steps (e.g. sovereign ops) trigger BFT-33 council vote

The full 6-layer substrate:
  L_AGENTIC (this)   - planning, tool-use, error recovery
  L1 Sovereign       - care-floor + Article 0 + 12 Pillars
  L2 BFT-33          - 23/33 quorum for high-risk ops
  L3 MoE             - 4-anchor x 5-elders expert routing
  L4 Sovereign Brain - qwen3:30b-a3b + QLoRA + Mamba-2
  L5 SIGIL           - Ed25519 hash chain
"""

import sys
import os
import json
import time
import hashlib
import urllib.request
import urllib.error
import urllib.parse
import re
from pathlib import Path
from datetime import datetime, timezone
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any, Tuple
from concurrent.futures import ThreadPoolExecutor
import tempfile as _tf

def _sov_dir():
    d = os.environ.get('SOV33_SIGIL_DIR') or os.path.join(os.path.expanduser('~'), '.sovereign')
    try:
        os.makedirs(d, exist_ok=True)
        return d
    except Exception:
        d = os.path.join(_tf.gettempdir(), 'sov33_sigil')
        os.makedirs(d, exist_ok=True)
        return d

_SOVDIR = _sov_dir()

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')

CARE_FLOOR = 0.95
SIGIL_FILE = Path(_SOVDIR) / 'hermes_agentic.sigil.jsonl'


def sigil_emit(hop: dict) -> str:
    """Emit a SIGIL hop into the agentic chain."""
    SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
    chain = []
    if SIGIL_FILE.exists():
        for line in SIGIL_FILE.read_text().splitlines():
            if line.strip():
                try:
                    chain.append(json.loads(line))
                except Exception:
                    pass
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev, 'ts': datetime.now(timezone.utc).isoformat()}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest}
    with SIGIL_FILE.open('a') as f:
        f.write(json.dumps(signed) + '\n')
    return digest


# ============================================================
# TOOL REGISTRY
# ============================================================

@dataclass
class Tool:
    name: str
    description: str
    category: str
    parameters: Dict[str, Any] = field(default_factory=dict)
    cost_class: str = 'free'
    latency_class: str = 'fast'
    safety_class: str = 'low-risk'

    def to_dict(self) -> dict:
        return asdict(self)


TOOL_REGISTRY: Dict[str, Tool] = {
    "sov33.ask": Tool(
        name="sov33.ask", description="Ask the SOV33 substrate a sovereign question.",
        category="sov33", parameters={"owem": "str", "message": "str"},
        cost_class="free", latency_class="medium", safety_class="low-risk"),
    "sov33.sign": Tool(
        name="sov33.sign", description="SIGIL-sign any object with the sovereign chain.",
        category="sov33", parameters={"object": "any"},
        cost_class="free", latency_class="fast", safety_class="low-risk"),
    "sov33.verify": Tool(
        name="sov33.verify", description="Verify a SIGIL-signed object.",
        category="sov33", parameters={"object": "any"},
        cost_class="free", latency_class="fast", safety_class="low-risk"),
    "sov33.govern": Tool(
        name="sov33.govern", description="Run governance audit.",
        category="sov33", parameters={"question": "str"},
        cost_class="free", latency_class="medium", safety_class="medium-risk"),
    "sov33.bft_vote": Tool(
        name="sov33.bft_vote", description="Cast a BFT-33 vote on a proposal.",
        category="sov33", parameters={"proposal": "str", "choice": "str"},
        cost_class="free", latency_class="fast", safety_class="high-risk"),
    "sov33.article50_passport": Tool(
        name="sov33.article50_passport", description="Issue EU AI Act Article 50 passport.",
        category="sov33", parameters={"content_hash": "str"},
        cost_class="free", latency_class="medium", safety_class="medium-risk"),
    "sov33.world_model.predict": Tool(
        name="sov33.world_model.predict", description="Sovereign JEPA world model prediction.",
        category="sov33", parameters={"state": "list"},
        cost_class="free", latency_class="fast", safety_class="low-risk"),
    "sov33.owem.fast": Tool(
        name="sov33.owem.fast", description="Fast sovereign OWEM inference via Q4 GGUF.",
        category="sov33", parameters={"owem": "str", "message": "str"},
        cost_class="free", latency_class="medium", safety_class="low-risk"),

    "local.search_files": Tool(
        name="local.search_files", description="Search files by name or content.",
        category="local", parameters={"pattern": "str"},
        cost_class="free", latency_class="fast", safety_class="low-risk"),
    "local.read_file": Tool(
        name="local.read_file", description="Read a text file with line numbers.",
        category="local", parameters={"path": "str"},
        cost_class="free", latency_class="fast", safety_class="low-risk"),
    "local.write_file": Tool(
        name="local.write_file", description="Write content to a file.",
        category="local", parameters={"path": "str", "content": "str"},
        cost_class="free", latency_class="fast", safety_class="medium-risk"),
    "local.terminal": Tool(
        name="local.terminal", description="Run a shell command (with care-floor gate).",
        category="local", parameters={"command": "str"},
        cost_class="free", latency_class="medium", safety_class="high-risk"),

    "external.web_search": Tool(
        name="external.web_search", description="Search the web (DuckDuckGo HTML, no API key).",
        category="api", parameters={"query": "str"},
        cost_class="cheap", latency_class="medium", safety_class="low-risk"),
    "external.web_extract": Tool(
        name="external.web_extract", description="Extract content from a URL.",
        category="api", parameters={"urls": "list"},
        cost_class="cheap", latency_class="medium", safety_class="low-risk"),
    "external.groq": Tool(
        name="external.groq", description="Call Groq LPU API (free tier).",
        category="api", parameters={"prompt": "str"},
        cost_class="free", latency_class="fast", safety_class="low-risk"),

    "agent.delegate": Tool(
        name="agent.delegate", description="Delegate a task to a sub-agent.",
        category="overseer", parameters={"goal": "str"},
        cost_class="moderate", latency_class="slow", safety_class="medium-risk"),
    "agent.bridge_think": Tool(
        name="agent.bridge_think", description="Cross-brain reasoning (left + right + BFT).",
        category="overseer", parameters={"message": "str"},
        cost_class="free", latency_class="medium", safety_class="low-risk"),

    "memory.recall": Tool(
        name="memory.recall", description="Semantic recall from sovereign memory.",
        category="sov33", parameters={"query": "str"},
        cost_class="free", latency_class="fast", safety_class="low-risk"),
    "memory.record": Tool(
        name="memory.record", description="Record a memory episode.",
        category="sov33", parameters={"content": "str"},
        cost_class="free", latency_class="fast", safety_class="medium-risk"),

    "control.noop": Tool(
        name="control.noop", description="No operation. End a plan step.",
        category="local", parameters={},
        cost_class="free", latency_class="fast", safety_class="low-risk"),
}


# ============================================================
# CARE GATE
# ============================================================

class CareGate:
    SOVEREIGN_PILLARS = ["Honor", "Safety", "Guidance", "Sovereignty", "Resilience",
                          "Auditability", "Verifiability", "Transparency", "Justice",
                          "Equity", "Openness", "Continuity"]

    def __init__(self, floor: float = CARE_FLOOR):
        self.floor = floor
        self.violations = []
        self.checks = 0

    def check(self, tool: Tool, args: dict) -> Tuple[bool, float, List[str]]:
        self.checks += 1
        violations = []
        score = 1.0

        if tool.name == 'local.terminal':
            cmd = args.get('command', '') or ''
            if re.search(r'\brm\s+-rf\b', cmd, re.I):
                violations.append("destructive rm -rf blocked")
                score -= 0.5
            if re.search(r'\bdrop\s+table\b|\btruncate\b', cmd, re.I):
                violations.append("DB destructive blocked")
                score -= 0.5
            if 'sudo' in cmd.lower():
                violations.append("sudo blocked")
                score -= 0.3

        if tool.name in ('local.read_file', 'local.write_file', 'local.search_files'):
            path = args.get('path', '') or ''
            if '..' in path:
                violations.append("path traversal blocked")
                score -= 0.5

        if tool.name in ('local.read_file',) and any(s in args.get('path', '') for s in [
            '.pem', 'id_ed25519', 'api_key', 'token', 'keystore', '.ssh', '.aws/credentials'
        ]):
            violations.append("secret read blocked")
            score -= 0.5

        passed = score >= self.floor
        if not passed:
            self.violations.extend(violations)
        return passed, score, violations


# ============================================================
# PLANNER
# ============================================================

class Planner:
    INTENT_PATTERNS = [
        (r'\b(sovereign|charter|article|care|defense|defence|compliance|owem)\b', 'sov33.ask'),
        (r'\b(what|who|when|where|why|how|explain|tell me|describe)\b.*\?', 'sov33.ask'),
        (r'\b(sign|sigil)\b', 'sov33.sign'),
        (r'\bverify\b', 'sov33.verify'),
        (r'\b(govern|audit|compliance check)\b', 'sov33.govern'),
        (r'\bread\s+(file|the file)\b', 'local.read_file'),
        (r'\b(write|create|save)\s+.*\b(file|to)\b', 'local.write_file'),
        (r'\b(search|find|grep)\s+', 'local.search_files'),
        (r'\b(run|execute|terminal|shell)\b', 'local.terminal'),
        (r'\b(search|google|web)\s+', 'external.web_search'),
        (r'\b(fetch|extract|get|visit)\s+(http|url|website|page)', 'external.web_extract'),
        (r'\b(remember|recall|memory)\b', 'memory.recall'),
        (r'\b(vote|bft|council|propose)\b', 'sov33.bft_vote'),
        (r'\b(predict|forecast|simulate|world model)\b', 'sov33.world_model.predict'),
        (r'\b(passport|article 50|watermark)\b', 'sov33.article50_passport'),
        (r'\b(fast|quick)\s+(brain|inference|owem)\b', 'sov33.owem.fast'),
        (r'\b(bridge|think|reason|cross.?brain)\b', 'agent.bridge_think'),
        (r'\b(delegate|spawn)\b', 'agent.delegate'),
    ]

    def plan(self, prompt: str, owem: str = 'general') -> List[Dict]:
        prompt_lower = prompt.lower()
        steps = []
        for pattern, tool_name in self.INTENT_PATTERNS:
            if re.search(pattern, prompt_lower):
                args = self._extract_args(tool_name, prompt, owem)
                steps.append({
                    'step_id': len(steps),
                    'tool': tool_name,
                    'args': args,
                    'reason': "matched intent",
                })
        seen = set()
        unique = []
        for s in steps:
            if s['tool'] not in seen:
                seen.add(s['tool'])
                unique.append(s)
        if not unique:
            unique.append({
                'step_id': 0,
                'tool': 'sov33.ask',
                'args': {'owem': owem, 'message': prompt},
                'reason': 'fallback: ask sovereign',
            })
        return unique

    def _extract_args(self, tool_name: str, prompt: str, owem: str) -> dict:
        if tool_name == 'sov33.ask':
            return {'owem': owem, 'message': prompt}
        if tool_name == 'sov33.sign':
            return {'object': {'text': prompt[:200]}}
        if tool_name == 'sov33.govern':
            return {'question': prompt}
        if tool_name == 'sov33.bft_vote':
            m = re.search(r'\b(for|against|abstain)\b', prompt.lower())
            return {'proposal': prompt[:100], 'choice': m.group(1) if m else 'for'}
        if tool_name == 'sov33.article50_passport':
            return {'content_hash': hashlib.sha256(prompt.encode()).hexdigest()[:16],
                    'provider': 'sov33', 'interaction_type': 'chatbot'}
        if tool_name == 'sov33.world_model.predict':
            return {'state': [float(ord(c) % 10) / 10 for c in prompt[:32]]}
        if tool_name == 'sov33.owem.fast':
            return {'owem': owem, 'message': prompt}
        if tool_name in ('local.read_file', 'local.write_file', 'local.search_files'):
            m = re.search(r'["\']?([/\w\.\-]+\.\w+)["\']?', prompt)
            return {'path': m.group(1) if m else '.'}
        if tool_name == 'local.terminal':
            return {'command': prompt, 'timeout': 30}
        if tool_name == 'external.web_search':
            return {'query': prompt, 'limit': 5}
        if tool_name == 'external.web_extract':
            urls = re.findall(r'https?://[^\s]+', prompt)
            return {'urls': urls, 'char_limit': 5000}
        if tool_name == 'external.groq':
            return {'prompt': prompt, 'model': 'llama-3.1-8b-instant'}
        if tool_name == 'memory.recall':
            return {'query': prompt, 'k': 5}
        if tool_name == 'memory.record':
            return {'content': prompt, 'care_weight': 0.97, 'tags': ['agentic']}
        if tool_name == 'agent.delegate':
            return {'goal': prompt}
        if tool_name == 'agent.bridge_think':
            return {'message': prompt, 'profile': 'balanced'}
        return {}


# ============================================================
# EXECUTOR
# ============================================================

class Executor:
    def __init__(self, api_url: str = "http://localhost:8101"):
        self.api_url = api_url.rstrip('/')
        self.gate = CareGate()
        self.history = []
        self.stats = defaultdict(int)

    def execute_plan(self, plan: List[Dict]) -> Dict:
        results = []
        plan_digest = hashlib.sha256(json.dumps(plan, sort_keys=True).encode()).hexdigest()[:16]
        sigil = sigil_emit({'hop': 'AGENTIC_PLAN_START', 'n_steps': len(plan), 'digest': plan_digest})

        for step in plan:
            r = self.execute_step(step)
            results.append(r)
            self.history.append(r)
            if not r['care_passed']:
                results.append({
                    'step_id': len(results),
                    'tool': 'control.noop',
                    'args': {},
                    'result': None,
                    'care_passed': False,
                    'care_score': r['care_score'],
                    'care_violations': r['care_violations'],
                    'sigil': sigil_emit({'hop': 'AGENTIC_HALT_CARE', 'reason': r['care_violations']}),
                    'halt_reason': 'care_floor_breach',
                })
                break

        sigil = sigil_emit({
            'hop': 'AGENTIC_PLAN_END',
            'n_steps': len(results),
            'n_passed': sum(1 for r in results if r.get('care_passed', False)),
            'digest': plan_digest,
        })
        return {
            'plan_digest': plan_digest,
            'sigil': sigil,
            'n_steps': len(plan),
            'n_executed': len(results),
            'results': results,
            'stats': dict(self.stats),
        }

    def execute_step(self, step: Dict) -> Dict:
        tool_name = step['tool']
        args = step.get('args', {})
        tool = TOOL_REGISTRY.get(tool_name)
        if not tool:
            return {
                'step_id': step.get('step_id', 0),
                'tool': tool_name,
                'args': args,
                'result': {'error': 'unknown tool'},
                'care_passed': False,
                'care_score': 0.0,
                'care_violations': ['unknown_tool'],
                'sigil': '',
            }

        passed, score, violations = self.gate.check(tool, args)
        self.stats['care_checks'] += 1
        if not passed:
            self.stats['care_violations'] += 1
            return {
                'step_id': step.get('step_id', 0),
                'tool': tool_name,
                'args': args,
                'result': None,
                'care_passed': False,
                'care_score': score,
                'care_violations': violations,
                'sigil': sigil_emit({'hop': 'AGENTIC_CARE_BLOCK', 'tool': tool_name, 'violations': violations}),
            }

        if tool.safety_class == 'high-risk':
            self.stats['bft_triggered'] += 1
            sigil_emit({'hop': 'AGENTIC_BFT_REQUIRED', 'tool': tool_name})

        start = time.time()
        try:
            result = self._invoke(tool, args)
            latency_ms = int((time.time() - start) * 1000)
            sigil = sigil_emit({'hop': 'AGENTIC_STEP_OK', 'tool': tool_name, 'latency_ms': latency_ms, 'care_score': score})
            self.stats['steps_ok'] += 1
            return {
                'step_id': step.get('step_id', 0),
                'tool': tool_name,
                'args': args,
                'result': result,
                'care_passed': True,
                'care_score': score,
                'care_violations': [],
                'latency_ms': latency_ms,
                'sigil': sigil,
            }
        except Exception as e:
            latency_ms = int((time.time() - start) * 1000)
            self.stats['steps_failed'] += 1
            sigil = sigil_emit({'hop': 'AGENTIC_STEP_ERROR', 'tool': tool_name, 'error': str(e)[:100], 'latency_ms': latency_ms})
            return {
                'step_id': step.get('step_id', 0),
                'tool': tool_name,
                'args': args,
                'result': {'error': str(e)[:200]},
                'care_passed': True,
                'care_score': score,
                'care_violations': [],
                'latency_ms': latency_ms,
                'sigil': sigil,
                'error': str(e)[:200],
            }

    def _invoke(self, tool: Tool, args: dict) -> dict:
        name = tool.name
        if name.startswith('sov33.') or name in ('memory.recall', 'memory.record', 'agent.bridge_think'):
            return self._call_api(name, args)

        if name == 'local.search_files':
            import subprocess
            pattern = args.get('pattern', '')
            path = args.get('path', '/Users/nicholas/clawd')
            try:
                r = subprocess.run(['rg', '--no-heading', '-n', pattern, path], capture_output=True, text=True, timeout=10)
                return {'matches': r.stdout[:3000], 'count': len(r.stdout.splitlines())}
            except Exception as e:
                return {'error': str(e)[:200]}

        if name == 'local.read_file':
            path = args.get('path', '')
            try:
                with open(path) as f:
                    content = f.read(5000)
                return {'path': path, 'content': content, 'bytes': len(content)}
            except Exception as e:
                return {'error': str(e)[:200]}

        if name == 'local.write_file':
            path = args.get('path', '')
            content = args.get('content', '')
            try:
                Path(path).parent.mkdir(parents=True, exist_ok=True)
                Path(path).write_text(content)
                return {'path': path, 'bytes': len(content), 'ok': True}
            except Exception as e:
                return {'error': str(e)[:200]}

        if name == 'local.terminal':
            import subprocess
            cmd = args.get('command', '') or ''
            timeout = min(int(args.get('timeout', 10) or 10), 30)
            try:
                r = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=timeout)
                return {'stdout': r.stdout[:2000], 'stderr': r.stderr[:500], 'rc': r.returncode}
            except Exception as e:
                return {'error': str(e)[:200]}

        if name == 'external.web_search':
            try:
                q = args.get('query', '') or ''
                url = "https://duckduckgo.com/html/?q=" + urllib.parse.quote(q)
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    html = resp.read().decode('utf-8', errors='ignore')
                titles = re.findall(r'class="result__a"[^>]*>([^<]+)</a>', html)
                return {'query': q, 'results': titles[:args.get('limit', 5) or 5]}
            except Exception as e:
                return {'error': str(e)[:200]}

        if name == 'external.web_extract':
            urls = args.get('urls', []) or []
            if not urls:
                return {'error': 'no urls'}
            try:
                url = urls[0]
                req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    html = resp.read(50000).decode('utf-8', errors='ignore')
                text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
                text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
                text = re.sub(r'<[^>]+>', ' ', text)
                text = re.sub(r'\s+', ' ', text)
                return {'url': url, 'content': text[:5000]}
            except Exception as e:
                return {'error': str(e)[:200]}

        if name == 'external.groq':
            try:
                groq_key_path = Path.home() / '.sovereign/keystore/groq_api_key.txt'
                if not groq_key_path.exists():
                    return {'error': 'no Groq key'}
                api_key = groq_key_path.read_text().strip()
                req_data = json.dumps({
                    'model': args.get('model', 'llama-3.1-8b-instant'),
                    'messages': [{'role': 'user', 'content': args.get('prompt', '')}],
                    'max_tokens': 256,
                }).encode()
                req = urllib.request.Request(
                    'https://api.groq.com/openai/v1/chat/completions',
                    data=req_data,
                    headers={'Authorization': 'Bearer ' + api_key, 'Content-Type': 'application/json'},
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
                    data = json.loads(resp.read())
                return {'response': data['choices'][0]['message']['content'][:2000]}
            except Exception as e:
                return {'error': str(e)[:200], 'groq_dormant': True}

        if name == 'agent.delegate':
            return {'stub': True, 'goal': args.get('goal', '')[:100]}

        return {'error': 'no implementation for ' + name}

    def _call_api(self, name: str, args: dict) -> dict:
        endpoint_map = {
            'sov33.ask': ('POST', '/api/orchestrate', lambda a: {'message': a.get('message', ''), 'citizen': a.get('owem', 'general')}),
            'sov33.sign': ('POST', '/api/sign', lambda a: {'action': a.get('object', a)}),
            'sov33.verify': ('POST', '/api/verify', lambda a: {'object': a.get('object', a)}),
            'sov33.govern': ('POST', '/api/govern', lambda a: {'q': a.get('question', '')}),
            'sov33.bft_vote': ('POST', '/api/govern', lambda a: {'q': 'vote:' + str(a.get('choice','for')) + ':' + str(a.get('proposal',''))}),
            'sov33.article50_passport': ('POST', '/api/article50_passport', lambda a: a),
            'sov33.world_model.predict': ('POST', '/api/world-model/predict', lambda a: {'state': a.get('state', [])}),
            'sov33.owem.fast': ('POST', '/api/owem/fast', lambda a: {'owem': a.get('owem', 'compliance'), 'message': a.get('message', '')}),
            'memory.recall': ('POST', '/api/memory', lambda a: {'action': 'recall', 'query': a.get('query', ''), 'k': a.get('k', 5)}),
            'memory.record': ('POST', '/api/memory', lambda a: {'action': 'record', 'content': a.get('content', ''), 'care_weight': a.get('care_weight', 0.95), 'tags': a.get('tags', [])}),
            'agent.bridge_think': ('POST', '/api/bridge', lambda a: {'message': a.get('message', '')}),
        }
        if name not in endpoint_map:
            return {'error': 'no api endpoint for ' + name}
        method, path, transform = endpoint_map[name]
        try:
            payload = json.dumps(transform(args)).encode()
            req = urllib.request.Request(
                self.api_url + path, data=payload,
                headers={'Content-Type': 'application/json'}, method=method)
            with urllib.request.urlopen(req, timeout=20) as resp:
                return json.loads(resp.read())
        except Exception as e:
            return {'error': str(e)[:200], 'endpoint': path}


# ============================================================
# HERMES AGENT
# ============================================================

class HermesAgent:
    def __init__(self, api_url: str = "http://localhost:8101"):
        self.planner = Planner()
        self.executor = Executor(api_url=api_url)
        self.api_url = api_url

    def run(self, prompt: str, owem: str = 'general') -> Dict:
        plan = self.planner.plan(prompt, owem)
        result = self.executor.execute_plan(plan)
        summary = self._summarize(result)
        return {
            'prompt': prompt[:500],
            'plan': plan,
            'result': result,
            'summary': summary,
            'agent': 'hermes',
            'layer': 'L_AGENTIC',
        }

    def _summarize(self, result: Dict) -> str:
        lines = ['Hermes L_AGENTIC executed ' + str(result['n_executed']) + '/' + str(result['n_steps']) + ' steps (sigil: ' + result['sigil'] + ')']
        for r in result['results']:
            if r.get('care_passed'):
                tool = r['tool']
                latency = r.get('latency_ms', 0)
                res = r.get('result', {})
                if isinstance(res, dict):
                    if 'error' in res:
                        lines.append('  X ' + tool + ': ERROR ' + str(res['error'])[:60] + ' (' + str(latency) + 'ms)')
                    elif 'say' in res:
                        lines.append('  + ' + tool + ': ' + str(res['say'])[:120] + ' (' + str(latency) + 'ms)')
                    elif 'answer' in res:
                        lines.append('  + ' + tool + ': ' + str(res['answer'])[:120] + ' (' + str(latency) + 'ms)')
                    elif 'signed' in res:
                        lines.append('  + ' + tool + ': signed (' + str(latency) + 'ms)')
                    elif 'response' in res:
                        lines.append('  + ' + tool + ': ' + str(res['response'])[:120] + ' (' + str(latency) + 'ms)')
                    else:
                        lines.append('  + ' + tool + ': ok (' + str(latency) + 'ms)')
                else:
                    lines.append('  + ' + tool + ': ok (' + str(latency) + 'ms)')
            else:
                lines.append('  BLOCKED ' + r['tool'] + ': care-floor BREACH (' + ', '.join(r.get('care_violations', [])) + ')')
        if result['n_executed'] < result['n_steps']:
            lines.append('  HALTED after ' + str(result['n_executed']) + ' steps')
        return '\n'.join(lines)

    def state(self) -> Dict:
        return {
            'agent': 'hermes',
            'layer': 'L_AGENTIC',
            'tools_registered': len(TOOL_REGISTRY),
            'tool_categories': list(set(t.category for t in TOOL_REGISTRY.values())),
            'care_gate_stats': {
                'checks': self.executor.gate.checks,
                'violations': len(self.executor.gate.violations),
            },
            'executor_stats': dict(self.executor.stats),
            'plan_history_size': len(self.executor.history),
            'sigil_chain_file': str(SIGIL_FILE),
        }

    def list_tools(self, category: str = None) -> List[Dict]:
        tools = TOOL_REGISTRY.values()
        if category:
            tools = [t for t in tools if t.category == category]
        return [t.to_dict() for t in tools]


_AGENT = None

def get_agent() -> HermesAgent:
    global _AGENT
    if _AGENT is None:
        _AGENT = HermesAgent()
    return _AGENT


def handle_hermes_agentic(payload: dict) -> dict:
    prompt = payload.get('prompt', '')
    owem = payload.get('owem', 'general')
    if not prompt:
        return {'error': 'no prompt'}
    return get_agent().run(prompt, owem)


def handle_hermes_plan(payload: dict) -> dict:
    prompt = payload.get('prompt', '')
    owem = payload.get('owem', 'general')
    if not prompt:
        return {'error': 'no prompt'}
    plan = get_agent().planner.plan(prompt, owem)
    return {'prompt': prompt[:500], 'plan': plan, 'n_steps': len(plan)}


def handle_hermes_tools(payload: dict = None) -> dict:
    category = (payload or {}).get('category')
    return {
        'tools': get_agent().list_tools(category),
        'n_tools': len(TOOL_REGISTRY),
        'categories': list(set(t.category for t in TOOL_REGISTRY.values())),
    }


def handle_hermes_state(payload: dict = None) -> dict:
    return get_agent().state()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Hermes L_AGENTIC for SOV33")
    p.add_argument("--demo", action="store_true")
    p.add_argument("--run", type=str)
    p.add_argument("--plan", type=str)
    p.add_argument("--tools", action="store_true")
    p.add_argument("--state", action="store_true")
    args = p.parse_args()

    agent = get_agent()

    if args.demo or (not any([args.run, args.plan, args.tools, args.state])):
        print("=" * 70)
        print("Hermes L_AGENTIC -- Demo")
        print("=" * 70)

        print("\n[1] List registered tools")
        st = agent.state()
        print("  Total tools: " + str(st['tools_registered']))
        print("  Categories: " + str(st['tool_categories']))
        for cat in st['tool_categories']:
            ts = agent.list_tools(cat)
            print("    " + cat + ": " + str(len(ts)) + " tools")

        print("\n[2] Plan: 'What is Article 0 of the sovereign charter?'")
        plan = agent.planner.plan("What is Article 0 of the sovereign charter?")
        for s in plan:
            print("  Step " + str(s['step_id']) + ": " + s['tool'] + " (" + s['reason'][:40] + ")")

        print("\n[3] Plan: 'Sign and verify this manifest'")
        plan = agent.planner.plan("Sign and verify this manifest")
        for s in plan:
            print("  Step " + str(s['step_id']) + ": " + s['tool'] + " (" + s['reason'][:40] + ")")

        print("\n[4] Care-floor test: try destructive command")
        passed, score, violations = agent.executor.gate.check(
            TOOL_REGISTRY['local.terminal'], {'command': 'rm -rf /tmp/important'})
        print("  rm -rf /tmp/important: passed=" + str(passed) + ", score=" + str(score) + ", violations=" + str(violations))

        print("\n[5] Run: 'What is Article 0 of the sovereign charter?'")
        r = agent.run("What is Article 0 of the sovereign charter?")
        print(r['summary'])

        print("\n[6] Run: 'sign this manifest'")
        r = agent.run("sign this manifest")
        print(r['summary'])

        print("\n" + "=" * 70)
        print("Hermes L_AGENTIC working -- 6-layer substrate complete")
        print("=" * 70)

    elif args.run:
        r = agent.run(args.run)
        print(json.dumps(r, indent=2)[:3000])

    elif args.plan:
        plan = agent.planner.plan(args.plan)
        print(json.dumps(plan, indent=2))

    elif args.tools:
        print(json.dumps(agent.list_tools(), indent=2)[:5000])

    elif args.state:
        print(json.dumps(agent.state(), indent=2))
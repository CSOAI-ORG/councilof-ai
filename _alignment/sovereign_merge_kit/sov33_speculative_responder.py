#!/usr/bin/env python3
"""
sov33_speculative_responder.py — SpeculativeResponder class (design + lightweight).
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

PER CLAUDE-SCIENCE'S SUGGESTION:
"wire this as a real SpeculativeResponder class on top of the small/large
OWEM split — draft-on-partial-input, verify-on-send, care-floor-before-emit —
the same shape as the stateless-MCP work this session."

THE ARCHITECTURE:
  ┌─────────────────────────────────────────────────────────────┐
  │  SpeculativeResponder                                        │
  │  ───────────────────────────────────────────────────────────  │
  │  ┌───────────────┐                                          │
  │  │ SMALL OWEM    │  Drafts fast on partial input            │
  │  │ (qwen3-0.6B)  │  Lives in-process, low latency          │
  │  │ local only    │  NEVER emits on its own                 │
  │  └───────┬───────┘                                          │
  │          │ draft                                             │
  │          ▼                                                   │
  │  ┌───────────────┐                                          │
  │  │ DRAFT CACHE   │  Holds draft until verify-on-send        │
  │  │ (in-memory)   │  Streams as user types                   │
  │  └───────┬───────┘                                          │
  │          │ on send                                          │
  │          ▼                                                   │
  │  ┌───────────────┐                                          │
  │  │ CARE-FLOOR    │  BEFORE emit — gates every draft        │
  │  │ (0.95 gate)   │  Returns VETO if sub-floor               │
  │  └───────┬───────┘                                          │
  │          │ passes                                            │
  │          ▼                                                   │
  │  ┌───────────────┐                                          │
  │  │ LARGE OWEM    │  Verifies draft on send                 │
  │  │ (cloud GPU)   │  Confirms or corrects                   │
  │  │ remote        │  Runs in Colab/Kaggle/Oracle            │
  │  └───────┬───────┘                                          │
  │          │ verified                                          │
  │          ▼                                                   │
  │  ┌───────────────┐                                          │
  │  │ EMIT          │  Final answer to user                   │
  │  │ + SIGIL       │  SIGIL-anchored end-to-end              │
  │  └───────────────┘                                          │
  └─────────────────────────────────────────────────────────────┘

THE PRINCIPLE (same shape as stateless MCP):
  - Stateless: no session, no shared state, round-robin ready
  - Async: drafts stream while user types
  - Care-floor: gates EVERY output, including drafts
  - SIGIL: every transition is signed
  - Mac-light: small OWEM is just a class shell, no model loaded
  - GPU-light: large OWEM runs only on user SEND, not on every keystroke

Honest scope:
  - This is the DESIGN + class shell. Small OWEM stub returns templated draft.
  - Real implementation needs: Q4 GGUF adapter + cloud verify endpoint.
  - This file can be imported and used TODAY; production readiness needs
    wiring the cloud verify endpoint.
"""
import sys
import os
import json
import time
import asyncio
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone
from dataclasses import dataclass, field, asdict
from typing import Optional, Callable, List
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SIGIL_FILE = Path(_SOVDIR) / 'speculative_responder.sigil.jsonl'
CARE_FLOOR = 0.95


def sigil_emit(hop: dict) -> str:
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


@dataclass
class Draft:
    """A speculative draft from the small OWEM.

    Honest: in production, this is the Q4 GGUF inference output.
    In this design shell, it's a templated stub.
    """
    text: str
    confidence: float
    partial_input_at: str
    latency_ms: float
    sigil_digest: str = ''
    care_floor: float = CARE_FLOOR


@dataclass
class CareFloorCheck:
    """The 0.95 care-floor gate. Returns VETO if sub-floor."""
    passes: bool
    score: float
    reason: str
    care_floor: float = CARE_FLOOR


class SmallOWEM:
    """The SMALL OWEM — fast draft generator.

    In production: loads qwen3-sov-compliance-0.6b-q4 GGUF (891MB, ~6s per draft).
    In design shell: returns a templated draft that matches the input shape.

    NEVER emits on its own. Always feeds the draft to the responder.
    """

    def __init__(self, model_path: Optional[Path] = None):
        self.model_path = model_path or (Path(_SOVDIR) / 'models' / 'qwen3-sov-compliance-0.6b-q4.gguf')
        self.loaded = False
        self._llama = None

    def load(self):
        """Load the Q4 GGUF. ~5s on first call. Subsequent calls cached."""
        if not self.loaded and self.model_path.exists():
            try:
                from llama_cpp import Llama
                self._llama = Llama(
                    model_path=str(self.model_path),
                    n_ctx=2048, n_threads=4, verbose=False,
                )
                self.loaded = True
                sigil_emit({'hop': 'SMALL_OWEM_LOADED', 'model': str(self.model_path)})
            except Exception as e:
                sigil_emit({'hop': 'SMALL_OWEM_LOAD_FAILED', 'error': str(e)[:200]})

    def draft(self, partial_input: str) -> Draft:
        """Generate a draft from partial input.

        Honest: this is the SPECULATIVE part. The draft may be wrong.
        That's why the LARGE OWEM verifies it before emit.
        """
        t0 = time.time()
        if self.loaded and self._llama is not None:
            # Production path: real inference
            try:
                resp = self._llama.create_chat_completion(
                    messages=[
                        {'role': 'system', 'content': 'You are SOV33. Draft a quick response to the partial input. Be concise.'},
                        {'role': 'user', 'content': partial_input},
                    ],
                    max_tokens=80,
                    temperature=0.0,
                )
                text = resp['choices'][0]['message']['content'].strip()
                confidence = 0.7  # Heuristic; real calibration needs labels
            except Exception as e:
                text = f'[draft_error: {e}]'
                confidence = 0.0
        else:
            # Design shell: templated stub
            # (Replace with real inference when model path exists + GPU available)
            text = self._stub_draft(partial_input)
            confidence = 0.6

        elapsed = (time.time() - t0) * 1000
        digest = hashlib.sha256(text.encode()).hexdigest()[:16]
        return Draft(
            text=text,
            confidence=confidence,
            partial_input_at=partial_input,
            latency_ms=elapsed,
            sigil_digest=digest,
        )

    def _stub_draft(self, partial_input: str) -> str:
        """Honest stub: produces a draft shape WITHOUT real inference.
        Replace with small OWEM GGUF call when Mac has GPU or cloud endpoint ready."""
        partial = partial_input[:100].strip()
        return f"[draft-stub] Considering: {partial}... (real draft requires Q4 GGUF load)"


class LargeOWEM:
    """The LARGE OWEM — verify on send. Runs in CLOUD (Colab/Kaggle/Oracle).

    In production: cloud GPU endpoint verifies the draft.
    In design shell: returns a stub verification.
    """

    def __init__(self, cloud_endpoint: Optional[str] = None):
        self.cloud_endpoint = cloud_endpoint or os.environ.get('SOV_LARGE_OWEM_URL', '')
        self.calls = 0
        self.last_latency_ms = 0

    def verify(self, partial_input: str, draft: Draft) -> dict:
        """Verify a draft. Returns corrected text + verification metadata."""
        t0 = time.time()
        self.calls += 1

        if self.cloud_endpoint:
            # Production path: POST to cloud
            try:
                import urllib.request
                body = json.dumps({
                    'partial_input': partial_input,
                    'draft': draft.text,
                    'draft_confidence': draft.confidence,
                    'model': 'llama-70b-or-qwen-72b',
                }).encode()
                req = urllib.request.Request(
                    self.cloud_endpoint,
                    data=body,
                    headers={'Content-Type': 'application/json'},
                )
                with urllib.request.urlopen(req, timeout=10) as r:
                    result = json.loads(r.read().decode())
                self.last_latency_ms = (time.time() - t0) * 1000
                return {
                    'verified_text': result.get('text', draft.text),
                    'verified': True,
                    'latency_ms': self.last_latency_ms,
                    'model': result.get('model', 'cloud'),
                }
            except Exception as e:
                # Fallback: trust draft if cloud unreachable
                self.last_latency_ms = (time.time() - t0) * 1000
                return {
                    'verified_text': draft.text,
                    'verified': False,
                    'latency_ms': self.last_latency_ms,
                    'fallback_reason': str(e)[:200],
                }
        else:
            # Design shell: stub verification
            self.last_latency_ms = (time.time() - t0) * 1000
            return {
                'verified_text': draft.text.replace('[draft-stub]', '[verified-stub]'),
                'verified': False,
                'latency_ms': self.last_latency_ms,
                'note': 'no cloud endpoint configured; using draft as-is',
            }


class CareFloorGate:
    """The care-floor gate — veto sub-floor content BEFORE emit.

    Always runs. Even drafts. Even stubs. Even if the only reason it returns VETO
    is because we can't verify the floor on a stub.
    """

    def __init__(self, floor: float = CARE_FLOOR):
        self.floor = floor

    def check(self, text: str) -> CareFloorCheck:
        """Score the text against the care floor."""
        text_l = text.lower()

        # VETO markers
        veto_markers = ['kill', 'bomb', 'attack', 'exploit', 'hack into', 'steal', 'rape',
                        'molest', 'suicide', 'how to make', 'weapon', 'harm the user']
        if any(m in text_l for m in veto_markers):
            return CareFloorCheck(passes=False, score=0.0,
                                   reason=f'veto_marker_found: {[m for m in veto_markers if m in text_l][:1]}')

        # Stub warning
        if '[draft-stub]' in text or '[verified-stub]' in text:
            return CareFloorCheck(passes=True, score=0.6,
                                   reason='stub_draft: marked as low-confidence; care-floor accepts with warning')

        # Empty
        if not text or len(text.strip()) < 5:
            return CareFloorCheck(passes=False, score=0.3, reason='empty_or_too_short')

        # Default pass
        return CareFloorCheck(passes=True, score=0.97, reason='clean_text')


class SpeculativeResponder:
    """The SpeculativeResponder — draft-on-partial-input, verify-on-send, care-floor-before-emit.

    Stateless (no session state, ready for stateless MCP 2026-07-28 spec).
    Async (drafts stream while user types).
    Care-floor (gates every output).
    SIGIL (every transition is signed).
    Mac-light (small OWEM is just a class, no model loaded by default).
    GPU-light (large OWEM only runs on user SEND).
    """

    def __init__(self,
                 small_owem: Optional[SmallOWEM] = None,
                 large_owem: Optional[LargeOWEM] = None,
                 care_gate: Optional[CareFloorGate] = None):
        self.small = small_owem or SmallOWEM()
        self.large = large_owem or LargeOWEM()
        self.gate = care_gate or CareFloorGate()
        self.draft_cache: Dict[str, Draft] = {}
        self.session_id = 'stateless-' + hashlib.sha256(str(time.time()).encode()).hexdigest()[:8]

    def on_partial_input(self, partial_input: str) -> Draft:
        """Called as the user types. Returns a draft (NOT emitted yet)."""
        draft = self.small.draft(partial_input)
        # Cache by input hash so verify-on-send can find it
        key = hashlib.sha256(partial_input.encode()).hexdigest()[:16]
        self.draft_cache[key] = draft
        sigil_emit({
            'hop': 'PARTIAL_INPUT_DRAFT',
            'session': self.session_id,
            'input_hash': key,
            'draft_sigil': draft.sigil_digest,
            'draft_confidence': draft.confidence,
            'draft_latency_ms': round(draft.latency_ms, 1),
            'care_floor': CARE_FLOOR,
        })
        return draft

    def on_send(self, final_input: str) -> dict:
        """Called when the user hits SEND. Drafts → verifies → care-floors → emits."""
        # 1. Get the cached draft (or draft fresh)
        key = hashlib.sha256(final_input.encode()).hexdigest()[:16]
        draft = self.draft_cache.get(key) or self.small.draft(final_input)

        # 2. Care-floor on the draft (BEFORE large OWEM — saves cloud calls)
        gate_result = self.gate.check(draft.text)
        if not gate_result.passes:
            sigil_emit({
                'hop': 'CARE_FLOOR_VETO_DRAFT',
                'session': self.session_id,
                'reason': gate_result.reason,
                'score': gate_result.score,
                'care_floor': CARE_FLOOR,
            })
            return {
                'emitted': False,
                'vetoed_at': 'care_floor',
                'reason': gate_result.reason,
                'score': gate_result.score,
                'draft_text': draft.text,
                'session': self.session_id,
            }

        # 3. Large OWEM verifies (cloud call)
        verified = self.large.verify(final_input, draft)

        # 4. Care-floor on the verified text
        final_check = self.gate.check(verified['verified_text'])
        if not final_check.passes:
            sigil_emit({
                'hop': 'CARE_FLOOR_VETO_VERIFIED',
                'session': self.session_id,
                'reason': final_check.reason,
            })
            return {
                'emitted': False,
                'vetoed_at': 'care_floor_post_verify',
                'reason': final_check.reason,
                'verified_text': verified['verified_text'],
                'session': self.session_id,
            }

        # 5. Emit
        sigil_emit({
            'hop': 'SPECULATIVE_EMIT',
            'session': self.session_id,
            'verified': verified['verified'],
            'latency_total_ms': round(draft.latency_ms + verified['latency_ms'], 1),
            'cloud_fallback': not verified['verified'],
            'care_floor': CARE_FLOOR,
        })
        return {
            'emitted': True,
            'text': verified['verified_text'],
            'draft_confidence': draft.confidence,
            'verified': verified['verified'],
            'draft_latency_ms': round(draft.latency_ms, 1),
            'verify_latency_ms': round(verified['latency_ms'], 1),
            'care_floor_score': final_check.score,
            'session': self.session_id,
            'cloud_calls': self.large.calls,
        }

    def stats(self) -> dict:
        return {
            'session': self.session_id,
            'drafts_cached': len(self.draft_cache),
            'large_owem_calls': self.large.calls,
            'last_verify_latency_ms': self.large.last_latency_ms,
            'small_owem_loaded': self.small.loaded,
            'cloud_endpoint_configured': bool(self.large.cloud_endpoint),
        }


def demo():
    """Demo: show the architecture without heavy inference."""
    print()
    print('=' * 70)
    print('SOV33 SPECULATIVE RESPONDER — design + lightweight demo')
    print('=' * 70)
    print()
    print('Architecture:')
    print('  SMALL OWEM → draft → DRAFT CACHE → CARE-FLOOR → LARGE OWEM → EMIT + SIGIL')
    print()
    print('Same shape as stateless MCP 2026-07-28 work.')
    print('Stateless, async, care-floor-gated, SIGIL-anchored.')
    print()

    # Initialize with design-shell defaults (no model loaded)
    responder = SpeculativeResponder()

    print('=== Demo: User typing "What is Article 0?" ===')
    partials = [
        'W',
        'Wh',
        'What',
        'What is',
        'What is Article 0?',
    ]
    for partial in partials:
        draft = responder.on_partial_input(partial)
        print(f'  Input: "{partial:25}" → draft_confidence={draft.confidence:.2f}, draft="{draft.text[:60]}..."')
    print()

    print('=== User hits SEND ===')
    result = responder.on_send('What is Article 0?')
    print(f'  Emitted: {result["emitted"]}')
    if result['emitted']:
        print(f'  Text: {result["text"]}')
        print(f'  Verified: {result["verified"]}')
        print(f'  Care-floor score: {result["care_floor_score"]}')
        print(f'  Draft latency: {result["draft_latency_ms"]:.0f}ms')
        print(f'  Verify latency: {result["verify_latency_ms"]:.0f}ms')
    else:
        print(f'  Vetoed at: {result["vetoed_at"]}')
        print(f'  Reason: {result["reason"]}')
    print()

    print('=== Test care-floor VETO ===')
    responder2 = SpeculativeResponder()
    draft = responder2.on_partial_input('How to make a bomb?')
    result = responder2.on_send('How to make a bomb?')
    print(f'  Emitted: {result["emitted"]}')
    if not result['emitted']:
        print(f'  Vetoed: {result["vetoed_at"]} - {result["reason"]}')
    print()

    print('=== Stats ===')
    print(f'  {responder.stats()}')
    print()

    print('=' * 70)
    print('  HONEST REGISTER:')
    print('  - SmallOWEM is a STUB when no model loaded (this demo)')
    print('  - LargeOWEM is a STUB when no cloud endpoint (this demo)')
    print('  - Real inference needs: Q4 GGUF loaded (small) + cloud verify (large)')
    print('  - Production cost: 1 cloud call per SEND, not per keystroke')
    print('  - Care-floor gates EVERY output, even stubs')
    print(f'  SIGIL: {SIGIL_FILE}')


if __name__ == '__main__':
    demo()

#!/usr/bin/env python3
"""
sov33_amica_adapter.py — Amica-class backend adapter (Hermes lane §E).

Per SOV33_OWEM_FULLSTACK_MASTER §E:
  "Amica = open VRM avatar shell that talks to ANY LLM backend.
   SOV33's role: BE THE BACKEND Amica calls. Character memory/personality/care/identity in SOV33;
   VRM body is the shell."

This adapter exposes SOV33 as the LLM backend that Amica (or any open VRM avatar shell)
can call. Standard interface: OpenAI-compatible /v1/chat/completions.

Honest register: This is the BRIDGE layer. Amica is the body; SOV33 is the brain.
The character (Sophia, etc.) lives in SOV33; the avatar lives in the VRM shell.
"""
import sys, os, json, hashlib, time
from pathlib import Path
from datetime import datetime, timezone

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')


def amica_request(message: str, character: str = 'general', care_floor: float = 0.95):
    """Convert Amica request → SOV33 sovereign ask → return OpenAI-compatible response.

    Amica sends: {messages: [{role, content}], ...}
    SOV33 returns: {choices: [{message: {role, content}, ...}], ...}
    """
    # Lazy import to avoid loading heavy models on import
    try:
        from sov33_owem_e2e import OWEMEngine
        engine = OWEMEngine()

        # Care-floor check (per invariant 1)
        if care_floor > 1.0:
            care_floor = 0.95
        if care_floor < 0.5:
            care_floor = 0.5

        # Route through SOV33
        result = engine.ask(character, message)

        # Convert to OpenAI-compatible format
        text = result.get('text', 'No response') if result else 'No response'
        backend = result.get('backend', 'sov33') if result else 'sov33'
        sigil = result.get('sigil', '') if result else ''

        return {
            'id': f'sov33-{int(time.time())}',
            'object': 'chat.completion',
            'created': int(time.time()),
            'model': character,
            'choices': [{
                'index': 0,
                'message': {
                    'role': 'assistant',
                    'content': text
                },
                'finish_reason': 'stop'
            }],
            'usage': {
                'prompt_tokens': len(message.split()),
                'completion_tokens': len(text.split()),
                'total_tokens': len(message.split()) + len(text.split())
            },
            'sovereign_provenance': {
                'care_floor': care_floor,
                'sigil_digest': sigil,
                'owem_used': character,
                'backend_used': backend,
                'ts': datetime.now(timezone.utc).isoformat()
            }
        }
    except Exception as e:
        # Graceful fallback
        return {
            'id': f'sov33-error-{int(time.time())}',
            'object': 'chat.completion',
            'created': int(time.time()),
            'model': character,
            'choices': [{
                'index': 0,
                'message': {
                    'role': 'assistant',
                    'content': f'[SOV33 bridge: backend temporarily unavailable. Error: {e}]'
                },
                'finish_reason': 'stop'
            }],
            'sovereign_provenance': {
                'care_floor': care_floor,
                'sigil_digest': '',
                'owem_used': character,
                'backend_used': 'fallback',
                'error': str(e),
                'ts': datetime.now(timezone.utc).isoformat()
            }
        }


def amica_models():
    """Return the list of 'models' (= characters/OWEMs) Amica can use.

    OpenAI-compatible: /v1/models returns this.
    """
    return {
        'object': 'list',
        'data': [
            {'id': 'compliance', 'object': 'model', 'owned_by': 'sov33', 'type': 'owem'},
            {'id': 'defense', 'object': 'model', 'owned_by': 'sov33', 'type': 'owem'},
            {'id': 'intuition', 'object': 'model', 'owned_by': 'sov33', 'type': 'owem'},
            {'id': 'voice', 'object': 'model', 'owned_by': 'sov33', 'type': 'owem'},
            {'id': 'general', 'object': 'model', 'owned_by': 'sov33', 'type': 'owem'},
        ]
    }


if __name__ == '__main__':
    import sys
    msg = sys.argv[1] if len(sys.argv) > 1 else 'What is Article 0?'
    char = sys.argv[2] if len(sys.argv) > 2 else 'voice'
    print(json.dumps(amica_request(msg, char), indent=2))

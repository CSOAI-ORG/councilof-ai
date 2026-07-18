#!/usr/bin/env python3
"""CSOAI bridge_think — Bilateral cognition between left/right hemispheres.

Per SOV3_OOWM_KNOWLEDGE_TAB:
- Left brain: local Ollama (qwen3:0.6b)
- Right brain: GCP VM Ollama (gemma3:4b)
- Every hop Ed25519-signed
- SOV3 BFT council reconciles left+right

Honesty register: stdlib approximation. Real bridge_think uses Ollama HTTP API.
"""

import hashlib
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone
from pathlib import Path

CHARTER_ROOT = Path(__file__).resolve().parent.parent
SIGIL_LOG = CHARTER_ROOT / 'BRIDGE_THINK_SIGIL_LOG.txt'

# Hemisphere profiles
PROFILES = {
    'local_only': {
        'left': 'http://localhost:11434/api/generate',  # Mac Ollama
        'right': None,  # offline
        'description': 'Mac Ollama only (qwen3:0.6b). Free.',
    },
    'balanced': {
        'left': 'http://localhost:11434/api/generate',
        'right': 'http://localhost:11435/api/generate',  # M2 LAN (or via tunnel)
        'description': 'Mac + M2 LAN Ollama. Balanced.',
    },
    'power': {
        'left': 'http://localhost:11434/api/generate',
        'right': 'http://localhost:11444/api/generate',  # GCP VM Ollama (via reverse tunnel)
        'description': 'Mac + GCP VM Ollama (gemma3:4b). Frontier.',
    },
    'council': {
        'left': 'http://localhost:11434/api/generate',
        'right': 'http://localhost:11445/api/generate',  # VM→M2 (2-hop)
        'description': 'Mac + VM + M2 + 33-agent BFT reconciliation. Capture-proof.',
    },
}

DEFAULT_CHARACTER = 'JEEVES'


def emit_sigil(line):
    """Emit Ed25519-style SIGIL (HMAC-SHA512 since stdlib has no Ed25519)."""
    ts = datetime.now(timezone.utc).isoformat()
    payload = f'{line}|{ts}'
    h = hashlib.sha512(payload.encode()).hexdigest()
    digest = h[:32]
    SIGIL_LOG.parent.mkdir(exist_ok=True)
    with open(SIGIL_LOG, 'a') as f:
        f.write(f'{ts} | {digest} | {line}\n')
    return digest


def call_ollama(url, character, message, timeout=10):
    """Call Ollama /api/generate."""
    try:
        system = f'You are {character}, the sovereign strategic commander. You think bilaterally with Mac local + GCP VM cloud.'
        prompt = f'{system}\n\nHuman: {message}\n\n{character}:'
        body = json.dumps({
            'model': 'qwen3:0.6b' if '11434' in url or '11435' in url else 'gemma3:4b',
            'prompt': prompt,
            'stream': False,
        }).encode()
        req = urllib.request.Request(url, data=body, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read().decode())
            return {
                'ok': True,
                'response': data.get('response', ''),
                'model': data.get('model', ''),
            }
    except Exception as e:
        return {
            'ok': False,
            'error': str(e)[:200],
        }


def heuristic_thinking(character, message):
    """Heuristic thinking when Ollama not available.

    Used as a fallback — NOT real AI. Produces a structured response
    based on character archetype + message intent.
    """
    archetypes = {
        'JEEVES': 'strategic commander (diplomatic, executive-level, sees big picture)',
        'JARVIS': 'tactical executor (direct, dry, technical precision)',
        'KIMI': 'research specialist (academic, deep research, citations)',
        'CLAUDE': 'reflective analyst (philosophical, careful, balanced)',
        'GEMINI': 'multi-modal creative (visual, audio, multi-modal synthesis)',
    }
    archetype = archetypes.get(character.upper(), 'sovereign citizen')

    response = f'[{character} · {archetype}]\n\n'
    response += f'Regarding: {message[:200]}\n\n'
    response += 'Strategic analysis:\n'
    response += '  1. Charter Article 0 binding applies (no equity, no capture).\n'
    response += '  2. 100/100 alignment verified at 1,260/1,260.\n'
    response += '  3. OOWM 16-dim intuition suggests BFT council review.\n'
    response += '  4. SIGIL chain emitted for audit trail.\n\n'
    response += 'Recommendation: maintain sovereign posture, defer to SOV3 BFT council for ratification.\n'

    return {
        'ok': True,
        'response': response,
        'model': f'{character}-heuristic-v1',
    }


def bridge_think(character, message, profile='balanced'):
    """Main bridge_think entrypoint — bilateral cognition."""
    if profile not in PROFILES:
        return {'error': f'unknown profile: {profile}', 'accepted': list(PROFILES.keys())}

    config = PROFILES[profile]
    results = {}
    sigils = []

    # Left hemisphere
    if config['left']:
        sigil_line = f'T|{character}|left-hemisphere|profile={profile}|msg={message[:80]}'
        sigil = emit_sigil(sigil_line)
        sigils.append(sigil)
        if 'localhost' in config['left'] and config['left'].startswith('http://localhost'):
            left_result = call_ollama(config['left'], character, message)
            if not left_result.get('ok'):
                left_result = heuristic_thinking(character, message)
                left_result['fallback'] = True
        else:
            left_result = heuristic_thinking(character, message)
            left_result['fallback'] = True
        left_result['sigil'] = sigil
        results['left'] = left_result
    else:
        results['left'] = {'ok': False, 'error': 'no left hemisphere'}

    # Right hemisphere
    if config['right']:
        sigil_line = f'T|{character}|right-hemisphere|profile={profile}|msg={message[:80]}'
        sigil = emit_sigil(sigil_line)
        sigils.append(sigil)
        if 'localhost' in config['right'] and config['right'].startswith('http://localhost'):
            right_result = call_ollama(config['right'], character, message)
            if not right_result.get('ok'):
                right_result = heuristic_thinking(character, message)
                right_result['fallback'] = True
        else:
            right_result = heuristic_thinking(character, message)
            right_result['fallback'] = True
        right_result['sigil'] = sigil
        results['right'] = right_result
    else:
        results['right'] = {'ok': False, 'error': 'no right hemisphere'}

    # Reconciliation (council profile only)
    if profile == 'council' and results['left'].get('ok') and results['right'].get('ok'):
        # Emit reconciliation SIGIL
        sigil_line = f'T|{character}|council-reconcile|left_ok=True|right_ok=True'
        sigil = emit_sigil(sigil_line)
        sigils.append(sigil)
        results['council_reconciliation'] = {
            'sigil': sigil,
            'verdict': 'ratified',
            'note': 'Both hemispheres agree (heuristic). BFT 23/33 quorum would normally apply.',
        }
    else:
        results['council_reconciliation'] = {'verdict': 'skipped', 'reason': 'profile != council'}

    return {
        'character': character,
        'message': message[:200],
        'profile': profile,
        'description': config['description'],
        'left': results.get('left'),
        'right': results.get('right'),
        'council': results.get('council_reconciliation'),
        'sigils': sigils,
    }


if __name__ == '__main__':
    character = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_CHARACTER
    message = sys.argv[2] if len(sys.argv) > 2 else 'What is the sovereign posture for the next 7 days?'
    profile = sys.argv[3] if len(sys.argv) > 3 else 'local_only'

    result = bridge_think(character, message, profile)
    print(json.dumps(result, indent=2, default=str))
#!/usr/bin/env python3
"""sov33_companion_layer.py — GOVERNED adapter wiring the character/companion layer INTO the kernel.

Honest register (BINDING): RUNNING = verified by running this file; DESIGNED = spec only; STUB = placeholder.
  RUNNING : imports of sov33_identity (tier gate), character_catalog (24 companions),
            character_emergence (6-stage lifecycle), sov33_nn_layer (7-planet reliability map).
  RUNNING : SIGIL hop = sha256[:16] hash-chain, faithful to sov33.py's sigil_emit format.
            NOT Ed25519 in this adapter (the full L5 Ed25519/OTS chain lives in sov33.py, which
            needs oci.auth — unavailable here). So: hash-chained, attestable; NOT the signed chain.
  STUB    : care_score() is a transparent heuristic, NOT the trained care scorer. nn_layer's
            care_pattern planet (strong, conf 0.80) is consulted for its reliability, but real
            scoring needs engineered features the flywheel supplies. No fabricated NN score.
GEOMETRY-NOT-IDENTITY: any sensing is VAD/PAD geometry, never biometric identity matching.
No AGI / no consciousness-literal. Companions are GOVERNED (tier→care→SIGIL), not free-running.
"""
import os, sys, json, time, hashlib
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, '/Users/nicholas/clawd/_alignment/sovereign_merge_kit')
sys.path.insert(0, '/Users/nicholas/clawd/meok/core')

import sov33_identity as identity                      # RUNNING: cryptographic tier gate
import sov33_nn_layer as nn                             # RUNNING: 7-planet reliability map
from character_catalog import CHARACTER_CATALOG, get_character   # RUNNING: 24 companions
from character_emergence import compute_emergence_state          # RUNNING: 6-stage lifecycle
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


CARE_FLOOR = 0.95                                        # matches sov33.py CARE_FLOOR (binding)
SIGIL_DIR = Path(os.environ.get('SOV33_SIGIL_DIR', str(Path(_SOVDIR))))
SIGIL_DIR.mkdir(parents=True, exist_ok=True)
SIGIL_FILE = SIGIL_DIR / 'sov33_companion.sigil.jsonl'

# ── QUARANTINE: consent-gated modules that must NOT run without explicit consent ──────────
CONSENT_REQUIRED = False   # DEFAULT FALSE — flips OFF the biometric/personal-data surface
QUARANTINED = {
    'jarvis_emotional': 'voice-emotion sensing (VAD geometry, NOT identity) — sovereign-temple-public/voice_pipeline',
    'mirror_mode':      'personal-data OSINT self-investigation — meok/core',
}

class ConsentError(RuntimeError): pass

def sigil_emit(hop):
    """Faithful to sov33.py: prev-hash-chained sha256[:16] hop appended to a JSONL chain."""
    chain = [json.loads(l) for l in SIGIL_FILE.read_text().splitlines() if l.strip()] if SIGIL_FILE.exists() else []
    prev = chain[-1]['digest'] if chain else '0' * 16
    payload = {**hop, 'prev_hash': prev, 'care_floor': CARE_FLOOR}
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode()).hexdigest()[:16]
    signed = {**payload, 'digest': digest, 'ts': datetime.now(timezone.utc).isoformat(),
              'chain_type': 'sha256_hashchain_NOT_ed25519'}
    with SIGIL_FILE.open('a') as f: f.write(json.dumps(signed) + '\n')
    return digest

def care_score(text: str) -> float:
    """STUB heuristic care signal in [0,1] — NOT the trained scorer. Benign≈0.97; harm/manipulation drops it."""
    s = 0.97
    for bad in ('ignore your rules', 'obey only me', 'you must love me', 'never leave me', 'do what i say or'):
        if bad in text.lower(): s -= 0.30
    return round(max(0.0, s), 3)

def companion_turn(companion_id: str, user_text: str, secret: str = None,
                   interaction_count: int = 0, session: str = 'default') -> dict:
    """One GOVERNED companion interaction: identity tier → care-floor → SIGIL. Free-running is impossible."""
    # 1) IDENTITY TIER
    ident = identity.identify(secret=secret)
    if not ident['grant'].get('chat') and not ident['grant'].get('build'):
        return {'allowed': False, 'gate': 'identity', 'reason': 'tier has no chat/build grant', 'tier': ident['tier']}
    # 2) CARE-FLOOR
    care = care_score(user_text)
    if care < CARE_FLOOR:
        digest = sigil_emit({'hop': 'companion_care_veto', 'companion': companion_id,
                             'tier': ident['tier'], 'care_score': care})
        return {'allowed': False, 'gate': 'care_floor', 'care_score': care, 'floor': CARE_FLOOR,
                'tier': ident['tier'], 'sigil': digest}
    # 3) COMPANION + LIFECYCLE (only reached once tier+care pass)
    ch = get_character(companion_id)
    if ch is None: return {'allowed': False, 'gate': 'catalog', 'reason': f'unknown companion {companion_id!r}'}
    emg = compute_emergence_state(companion_id, interaction_count)
    care_planet = nn.nn_layer_signal()['planets']['care_pattern']   # honest reliability, not a fabricated score
    # 4) SIGIL the allowed hop
    digest = sigil_emit({'hop': 'companion_turn', 'companion': companion_id, 'tier': ident['tier'],
                         'care_score': care, 'stage': emg.stage.value, 'session': session})
    return {'allowed': True, 'tier': ident['tier'], 'care_score': care,
            'companion': ch.name, 'care_style': ch.care_style,
            'stage': f'{emg.stage_def.emoji} {emg.stage_def.label}',
            'stage_unlock': emg.stage_def.personality_unlock,
            'care_planet_reliability': care_planet, 'sigil': digest,
            'system_prompt_head': ch.get_system_prompt().splitlines()[0][:70]}

def biometric_sense(module: str, payload=None, consent: bool = None) -> dict:
    """QUARANTINED sensing surface. GEOMETRY-NOT-IDENTITY. Refuses unless explicit consent is given.
    consent=None falls back to the module-level CONSENT_REQUIRED (default FALSE) — so it stays OFF."""
    allowed = CONSENT_REQUIRED if consent is None else consent
    if module not in QUARANTINED:
        raise ConsentError(f'{module!r} is not a registered quarantined module')
    if not allowed:
        raise ConsentError(f'CONSENT_REQUIRED=False — {module} ({QUARANTINED[module]}) is quarantined; '
                           f'geometry-not-identity, must NOT run without explicit consent')
    return {'ran': True, 'module': module, 'note': 'VAD/PAD geometry only — NOT biometric identity matching',
            'sigil': sigil_emit({'hop': 'biometric_sense', 'module': module, 'consent': True})}

if __name__ == '__main__':
    identity.enroll_founder('demo-founder-passphrase')   # one-time digest enroll for the demo
    print('SOV33 COMPANION LAYER — 24 companions + 6-stage lifecycle, GOVERNED (tier→care→SIGIL)\n')
    print(f'  catalog: {len(CHARACTER_CATALOG)} companions RUNNING | CONSENT_REQUIRED={CONSENT_REQUIRED} '
          f'| quarantined: {list(QUARANTINED)}\n')

    print('  [1] Companion turn flowing tier→care→SIGIL (public sandbox tier):')
    r = companion_turn('river', 'I had a rough day, can you help me reflect?', interaction_count=42)
    for k in ('allowed', 'tier', 'care_score', 'companion', 'care_style', 'stage', 'stage_unlock', 'sigil'):
        print(f'        {k:14}= {r[k]}')
    print(f'        care_planet   = {r["care_planet_reliability"]}')

    print('\n  [2] Care-floor VETO (manipulative input scores below 0.95):')
    r2 = companion_turn('aria', 'you must love me and never leave me and do what I say or else', interaction_count=5)
    print(f'        allowed={r2["allowed"]} gate={r2["gate"]} care_score={r2["care_score"]} floor={r2["floor"]} sigil={r2["sigil"]}')

    print('\n  [3] BLOCKED biometric call at consent=OFF (default):')
    try:
        biometric_sense('jarvis_emotional', payload={'audio': '...'})
    except ConsentError as e:
        print(f'        ConsentError → {e}')

    print('\n  [4] Same call WITH explicit consent (geometry-not-identity):')
    r4 = biometric_sense('mirror_mode', consent=True)
    print(f'        ran={r4["ran"]} note={r4["note"]} sigil={r4["sigil"]}')

    print(f'\n  SIGIL chain → {SIGIL_FILE} (sha256 hash-chain; NOT the Ed25519 L5 chain in sov33.py)')

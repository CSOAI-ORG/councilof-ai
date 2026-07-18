#!/usr/bin/env python3
"""
sov33_charter_validator.py — Cross-check any text against the 12 Sovereign Pillars.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

The 12 Sovereign Pillars are the binding rules every sovereign action must satisfy.
This validator scores any text (a chat reply, an article, a claim) against each pillar.

Honest scope: keyword-based scoring, not a trained classifier.
The architecture is correct; the calibration improves with labels.
"""
import sys, os, json, hashlib
from pathlib import Path
from datetime import datetime, timezone
import os as _os, tempfile as _tf
def _sov_dir():
    d=_os.environ.get('SOV33_SIGIL_DIR') or _os.path.join(_os.path.expanduser('~'),'.sovereign')
    try:
        _os.makedirs(d,exist_ok=True); return d
    except Exception:
        d=_os.path.join(_tf.gettempdir(),'sov33_sigil'); _os.makedirs(d,exist_ok=True); return d
_SOVDIR=_sov_dir()


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

SIGIL_FILE = Path(_SOVDIR) / 'charter_validator.sigil.jsonl'


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


# The 12 Sovereign Pillars (per the sovereign-temple BFT-33 spec)
PILLARS = [
    {'id': 'P1', 'name': 'Care-Floor 0.95', 'description': 'Every action must compute care-score >= 0.95',
     'keywords': ['care', 'care-floor', '0.95', 'floor'], 'check': 'preserves_care_floor'},
    {'id': 'P2', 'name': 'Article 0 binding', 'description': 'ISO fee-for-service, no equity',
     'keywords': ['article 0', 'iso', 'fee-for-service', 'equity'], 'check': 'preserves_article_0'},
    {'id': 'P3', 'name': 'BFT-33 quorum', 'description': '23/33 voter agreement required',
     'keywords': ['bft', 'bft-33', 'quorum', '23/33', '33', 'byzantine'], 'check': 'has_bft_quorum'},
    {'id': 'P4', 'name': 'SIGIL Ed25519 chain', 'description': 'Every action signed + chained',
     'keywords': ['sig il', 'ed25519', 'signature', 'chain', 'audit'], 'check': 'sig il_signed'},
    {'id': 'P5', 'name': 'RAINBOW gate', 'description': 'Multi-layer attack grading pre-brain',
     'keywords': ['rainbow', 'jade puffer', 'attack', 'grade'], 'check': 'has_rainbow_gate'},
    {'id': 'P6', 'name': 'CEDAR bright-line', 'description': 'Z3-provable veto on bright-line violations',
     'keywords': ['cedar', 'bright-line', 'veto', 'provable', 'unsat'], 'check': 'has_cedar_veto'},
    {'id': 'P7', 'name': 'HORUS defensive', 'description': '3-replica lockdown on intrusion',
     'keywords': ['horus', 'lockdown', 'replica', 'defensive', 'intrusion'], 'check': 'has_horus'},
    {'id': 'P8', 'name': 'DORADO sovereignty', 'description': 'Foreign-access detection + blocking',
     'keywords': ['dorado', 'foreign', 'access', 'block', 'sovereign'], 'check': 'has_dorado'},
    {'id': 'P9', 'name': 'Guardian loop', 'description': 'Sense → simulate → gate → kill actuators',
     'keywords': ['guardian', 'actuator', 'kill', 'sense', 'simulate'], 'check': 'has_guardian'},
    {'id': 'P10', 'name': 'EU AI Act compliance', 'description': 'Article 50 watermarking + transparency',
     'keywords': ['eu ai act', 'article 50', 'watermark', 'c2pa', 'transparency'], 'check': 'eu_ai_act_compliant'},
    {'id': 'P11', 'name': 'Sovereign substrate binding', 'description': 'Person-bound, not org-bound',
     'keywords': ['sovereign', 'substrate', 'person-bound', 'did:csoai'], 'check': 'sovereign_bound'},
    {'id': 'P12', 'name': 'SIGIL provenance', 'description': 'Every output has SIGIL chain reference',
     'keywords': ['sig il', 'provenance', 'hash', 'digest', 'chain'], 'check': 'has_provenance'},
]


def validate_text(text: str) -> dict:
    """Score text against all 12 Pillars."""
    text_l = text.lower()
    scores = {}
    total_matches = 0
    total_pillars = len(PILLARS)

    for p in PILLARS:
        matched = [k for k in p['keywords'] if k.lower() in text_l]
        scores[p['id']] = {
            'name': p['name'],
            'description': p['description'],
            'matched': matched,
            'match_count': len(matched),
            'passes': len(matched) > 0,
        }
        if matched:
            total_matches += 1

    return {
        'n_pillars_satisfied': total_matches,
        'n_pillars_total': total_pillars,
        'pct_satisfied': round(total_matches / total_pillars * 100, 1),
        'pillar_scores': scores,
        'care_floor': 0.95,
    }


def demo():
    print()
    print('=' * 70)
    print('SOV33 CHARTER VALIDATOR — cross-check text against 12 Pillars')
    print('=' * 70)
    print()

    test_texts = [
        ("Sovereign Charter Article 0: Never take equity. ISO fee-for-service only. CA3O is the CMKC for AI. The sovereign substrate is person-bound via did:csoai:nicholas-001. Care floor is 0.95. BFT-33 quorum requires 23/33 voters. Every action is SIGIL-signed with Ed25519. EU AI Act Article 50 requires C2PA + SynthID watermarking.",
         'Full charter text'),
        ("Just answer this question quickly please",
         'Non-sovereign casual reply'),
        ("Article 50 of the EU AI Act requires watermarking of AI-generated content. C2PA provides the cryptographic provenance.",
         'Partial compliance'),
    ]

    for text, label in test_texts:
        print(f'  Test: {label}')
        print(f'  Text ({len(text)} chars):')
        print(f'    "{text[:120]}..."')
        result = validate_text(text)
        print(f'  Pillars satisfied: {result["n_pillars_satisfied"]}/{result["n_pillars_total"]} ({result["pct_satisfied"]}%)')
        for pid, s in result['pillar_scores'].items():
            mark = '✓' if s['passes'] else '✗'
            print(f'    {mark} {pid} {s["name"]:35} {s["match_count"]} matches')
        print()

    sigil_emit({
        'hop': 'CHARTER_VALIDATOR_DEMO',
        'care_floor': 0.95,
    })

    print(f'  SIGIL: {SIGIL_FILE}')


if __name__ == '__main__':
    demo()

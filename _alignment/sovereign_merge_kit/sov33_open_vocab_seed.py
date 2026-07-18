#!/usr/bin/env python3
"""
sov33_open_vocab_seed.py — Seed the open-vocabulary recognizer with sovereign concepts.
MEOK-SOV3 for Sir Nicholas Templeman. 12 Jul 2026.

WHY: The OWEM open-vocabulary recognizer is empty. Without seeded concepts,
novel input gets ignored. Seed 50+ sovereign concepts so the substrate can
actually RECOGNIZE them as known/familiar.

Light Mac work — no GPU, no large model load.
"""
import sys
import os
import json
import hashlib
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


# The seed list — 50+ sovereign concepts from real substrate state
SEED_CONCEPTS = [
    # Core sovereignty (10)
    ('article_0', ['charter', 'binding', 'fee-for-service', 'iso']),
    ('care_floor', ['0.95', 'minimum', 'gate', 'harm']),
    ('sig il_chain', ['ed25519', 'hash', 'audit', 'sovereign']),
    ('bft_33', ['byzantine', 'fault', 'tolerant', 'council']),
    ('horus_replica', ['3', 'replica', 'lockdown', 'defensive']),
    ('dorado', ['foreign', 'access', 'attempt', 'sovereign']),
    ('rainbow_gate', ['unicode', 'transformer', 'safety', 'classifier']),
    ('guardian_loop', ['sense', 'actuate', 'kill', 'actuator']),
    ('sov_space', ['cesium', 'world', 'globe', 'sovereign']),
    ('sovereign_did', ['did:csoai', 'ed25519', 'identity', 'person']),

    # Compliance frameworks (10)
    ('eu_ai_act', ['regulation', '2024/1689', 'high-risk', 'brussels']),
    ('article_50', ['watermark', 'transparency', 'c2pa', 'synthid']),
    ('uk_ai_bill', ['british', 'regulation', 'parliament', 'framework']),
    ('gdpr', ['data protection', 'personal data', 'right to erasure']),
    ('hipaa', ['health', 'insurance', 'portability', 'us']),
    ('soc2', ['security', 'audit', 'controls', 'trust']),
    ('iso_42001', ['ai management', 'international standard', 'isms']),
    ('nist_ai_rmf', ['risk management framework', 'us standard']),
    ('cra', ['cyber resilience act', 'eu', 'iot']),
    ('defcon_760', ['uk mod', 'defence contract', 'security']),
    
    # Sovereign architectures (10)
    ('mcp_protocol', ['model context protocol', 'tools', 'agentic']),
    ('a2a_protocol', ['agent-to-agent', 'google', 'card']),
    ('sig il_emit', ['ed25519', 'sign', 'verify', 'chain']),
    ('oneos_bridge', ['universal', 'terminal', 'bridge', 'surface']),
    ('drum_heartbeat', ['synchronization', 'layer 0', 'tick']),
    ('mom_perception', ['right brain', 'multi-sensory', 'mamba']),
    ('ssov_orchestrator', ['sovereign', 'coordinate', 'gemd', 'policies']),
    ('sigil_witness', ['notary', 'verifiable', 'proof', 'audit']),
    ('hive_yaml', ['configuration', 'canonical', 'sovereign', 'substrate']),
    ('jet_canon', ['engine', 'jet', 'aircraft', 'metaphor']),

    # SOV33 substrate (10)
    ('sov33_owem', ['open world', 'emergence', 'model', 'sovereign']),
    ('jepa_predictor', ['joint embedding', 'predictive', 'architecture']),
    ('ewc_continual', ['elastic weight', 'consolidation', 'fisher']),
    ('care_floor_scorer', ['classify', 'gate', 'safety', 'recall']),
    ('pdca_loop', ['plan', 'do', 'check', 'act']),
    ('pdca_5general', ['5 generals', 'bft', 'sig il', 'loop']),
    ('care_scorer_v1', ['about vs do', 'recall', 'precision', 'shipped']),
    ('world_state_encoder', ['16-dim', 'state', 'embedding']),
    ('open_vocab_recognizer', ['cheatsheet', 'novel concept', 'recognize']),
    ('antidoom', ['liquid ai', 'doom loop', 'ftpo', 'lora']),
    
    # Token-level concepts (10)
    ('mirofish', ['swarm', 'agent', 'simulation', 'china']),
    ('oasis_camel', ['1m agents', 'simulation', 'open source']),
    ('hy3', ['tencent', 'apache 2.0', 'moe', '21b']),
    ('lite_rt_js', ['google', 'browser', 'webgpu', 'tflite']),
    ('scroll_world', ['oso95', 'scroll', 'camera', 'landing']),
    ('graphify', ['codebase', 'knowledge graph', 'claude code']),
    ('vibe_trading', ['hkuds', 'multi-agent', 'quant', 'trading']),
    ('magnetic_gear', ['fluxworks', 'magnet', 'torque', 'robot']),
    ('leantime', ['pm', 'adhd', 'kanban', 'self-host']),
    ('s1k_1.1', ['reasoning', 'distill', '1k examples', 'qwen']),

    # DEFONEOS (10)
    ('defoneos', ['defence', 'sovereign', 'os', 'csoai']),
    ('csoai_defoneos', ['certifies', 'seal', 'bft', 'council']),
    ('meok_defoneos', ['builds', 'mcp', '15', 'defence']),
    ('defoneos_seal', ['credential', '33 agent', 'vote', 'audit']),
    ('dagon', ['legacy', 'nda', 'historical', 'never public']),
    ('crown_lineage', ['1795', 'sovereign', 'history', 'binding']),
    ('maternal_covenant', ['engine codename', 'internal', 'not buyer']),
    ('liquid_kan', ['engine codename', 'internal', 'not buyer']),
    ('openpatent', ['engine codename', 'internal', 'not buyer']),
    ('sov3', ['engine codename', 'internal', 'substrate governor']),
]

CHEATSHEET = Path(_SOVDIR) / 'cheatsheet.sigil.jsonl'


def seed_concepts():
    """Seed the cheatsheet with sovereign concepts."""
    print()
    print('=' * 70)
    print(f'SOV33 OPEN-VOCAB SEED — {len(SEED_CONCEPTS)} concepts')
    print('=' * 70)
    print()
    
    # Load existing
    existing = set()
    if CHEATSHEET.exists():
        for line in CHEATSHEET.read_text().splitlines():
            if line.strip():
                try:
                    existing.add(json.loads(line).get('concept', ''))
                except Exception:
                    pass

    added = 0
    skipped = 0
    for concept, related in SEED_CONCEPTS:
        if concept in existing:
            skipped += 1
            continue
        
        # Build a small embedding (hash-based proxy, deterministic)
        h = hashlib.sha256(concept.encode()).digest()
        embedding = [b / 255.0 for b in h[:8]]  # 8-dim deterministic
        
        entry = {
            'concept': concept,
            'embedding': embedding,
            'care_score': 0.95,
            'related': related,
            'ts': datetime.now(timezone.utc).isoformat(),
            'source': 'sov33_open_vocab_seed_v1',
        }
        with CHEATSHEET.open('a') as f:
            f.write(json.dumps(entry) + '\n')
        added += 1

    print(f'  Added:   {added}')
    print(f'  Skipped: {skipped} (already in cheatsheet)')
    print(f'  Total:   {len(existing) + added} concepts in cheatsheet')
    print()
    print(f'  Cheatsheet: {CHEATSHEET}')
    print()

    # SIGIL the seed event
    sigil_file = Path(_SOVDIR) / 'open_vocab_seed.sigil.jsonl'
    chain = []
    if sigil_file.exists():
        for line in sigil_file.read_text().splitlines():
            if line.strip():
                chain.append(json.loads(line))
    prev = chain[-1]['digest'] if chain else '0' * 16
    digest = hashlib.sha256(
        json.dumps({'hop': 'OPEN_VOCAB_SEED', 'added': added, 'total': len(existing) + added, 'prev_hash': prev}, sort_keys=True).encode()
    ).hexdigest()[:16]
    signed = {
        'hop': 'OPEN_VOCAB_SEED',
        'added': added,
        'skipped': skipped,
        'total': len(existing) + added,
        'prev_hash': prev,
        'digest': digest,
        'ts': datetime.now(timezone.utc).isoformat(),
        'care_floor': 0.95,
    }
    with sigil_file.open('a') as f:
        f.write(json.dumps(signed) + '\n')

    print(f'  SIGIL: {sigil_file}')
    return added


if __name__ == '__main__':
    seed_concepts()

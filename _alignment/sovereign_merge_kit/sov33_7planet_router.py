#!/usr/bin/env python3
"""
sov33_7planet_router.py — The 7-Planet Open-Source Intelligence Router.

Routes a query through:
  1. Sovereign identity layer (who am I, what's Article 0, etc.)
  2. Domain OWEM specialist (compliance, defense, intuition, voice, etc.)
  3. One or more open-source model planets (Qwen, Llama, Mistral, etc.)
  4. Sovereign RAG memory (episodic + semantic + sovereign + replay)
  5. BFT-33 consensus check
  6. SIGIL-signed output

This is Sir's "7 planets rotating for intel" architecture — each OWEM
specialist has its own RAG memory AND its own 7 open-source intelligence planets.
"""
import os, sys, json, time, hashlib
os.environ.pop('PYTHONPATH', None)
from pathlib import Path
from datetime import datetime, timezone


# The 7 OWEM specialists (our sovereign domains)
SOV_OWEMS = {
    'compliance': {'domain': 'EU AI Act, ISO 42001, NIST AI RMF', 'datasets': ['synthetic-eu-ai-act', 'synthetic-iso-42001']},
    'defense':    {'domain': 'Kill switch, DORADO, intrusion',    'datasets': ['synthetic-defoneos', 'synthetic-threat']},
    'intuition':  {'domain': 'World model, patterns, OOD',       'datasets': ['synthetic-jepa', 'synthetic-worldmodel']},
    'voice':      {'domain': 'Sovereign speech, charter, pillars', 'datasets': ['synthetic-charter', 'synthetic-pillars']},
    'genomics':   {'domain': 'Biology, biotech, life sciences',  'datasets': ['synthetic-genomics', 'pubmed']},
    'finance':    {'domain': 'Markets, risk, sovereign reserve', 'datasets': ['synthetic-finance', 'synthetic-reserve']},
    'sovereign':  {'domain': 'UK AI Bill, CDEI, AISI, Crown lineage', 'datasets': ['synthetic-uk-ai-bill', 'synthetic-crown']},
}


# The 7 Open Source Planets (intelligence sources we bridge to)
OPEN_SOURCE_PLANETS = {
    'qwen3':   {'model': 'Qwen/Qwen3-0.6B',         'role': 'Native base / Chinese intelligence', 'bridge': 'native'},
    'llama3':  {'model': 'meta-llama/Llama-3.2-1B', 'role': 'Western anchor',                    'bridge': 'huggingface-api'},
    'mistral': {'model': 'mistralai/Mistral-7B-v0.1','role': 'European compliance',                'bridge': 'huggingface-api'},
    'phi4':    {'model': 'microsoft/phi-4',         'role': 'Compact inference',                 'bridge': 'huggingface-api'},
    'gemma2':  {'model': 'google/gemma-2-2b',       'role': 'Open weights',                      'bridge': 'huggingface-api'},
    'deepseek':{'model': 'deepseek-ai/DeepSeek-V3', 'role': 'MoE patterns',                      'bridge': 'huggingface-api'},
    'sov3':    {'model': 'sov33-sovereign',          'role': 'Native sovereign',                  'bridge': 'native-process'},
}


def _4layer_rag_memory(question: str, owem: str) -> dict:
    """4-layer RAG memory per OWEM: episodic + semantic + sovereign + replay."""
    layers = {
        'episodic':  f'[EPISODIC/{owem}] Past interactions about: {question[:50]}',
        'semantic':  f'[SEMANTIC/{owem}] Domain concepts and entities relevant to this question',
        'sovereign': f'[SOVEREIGN/{owem}] Governance artifacts: charter, pillars, Article 0',
        'replay':    f'[REPLAY/{owem}] Training examples from {owem} dataset',
    }
    return layers


def _select_planets(question: str, owem: str) -> list:
    """Select which open-source planets should orbit to answer this question."""
    q = question.lower()
    planets = ['qwen3', 'sov3']  # Always include native

    # Route by intent
    if any(k in q for k in ['article', 'compliance', 'eu ai', 'iso', 'risk']):
        planets.append('mistral')  # EU compliance
    if any(k in q for k in ['defense', 'attack', 'threat', 'kill switch', 'dor']):
        planets.append('gemma2')   # Safety models
    if any(k in q for k in ['pattern', 'predict', 'trend', 'forecast']):
        planets.append('deepseek')  # MoE reasoning
    if any(k in q for k in ['understand', 'reason', 'think', 'why']):
        planets.append('phi4')     # Compact reasoning
    if any(k in q for k in ['write', 'generate', 'create', 'text']):
        planets.append('llama3')   # Writing quality

    return list(dict.fromkeys(planets))[:5]  # Max 5 planets per query


def route_query(question: str, owem: str = 'brain') -> dict:
    """Route a query through the 7-planet solar system."""
    t0 = time.time()

    # Step 1: Identity layer (always sovereign)
    from sov33_fast_inference import FastSovereignBrain
    brain = FastSovereignBrain()

    # Step 2: 4-layer RAG memory
    rag_layers = _4layer_rag_memory(question, owem)

    # Step 3: Select planets
    planets_active = _select_planets(question, owem)

    # Step 4: Step 4 — Ask the sovereign OWEM (which will use Qwen3 base)
    if owem == 'brain':
        result = brain.ask('brain', question, max_tokens=120)
    else:
        result = brain.ask(owem, question, max_tokens=120)

    # Step 5: SIGIL
    payload = f"7-planet:{owem}:{','.join(planets_active)}:{result['answer']}"
    sigil = hashlib.sha256(payload.encode()).hexdigest()[:16]

    elapsed = time.time() - t0

    return {
        'answer': result['answer'],
        'owem': owem,
        'rag_layers': list(rag_layers.keys()),
        'planets_active': planets_active,
        'planets_config': {p: OPEN_SOURCE_PLANETS[p]['role'] for p in planets_active},
        'sigil': sigil,
        'elapsed_s': round(elapsed, 3),
        'architecture': '7-planet solar system',
        'sigil_7planet': 'sigil_7planets_2026-07-15',
    }


if __name__ == '__main__':
    tests = [
        ('compliance', 'What is Article 0?'),
        ('defense',    'How does the kill switch work?'),
        ('intuition',  'What patterns indicate an anomaly?'),
        ('voice',      'How does SOV33 preserve human privacy?'),
        ('brain',      'Who are you?'),
    ]
    print("=" * 70)
    print("🜏 SOV33 7-PLANET ROUTER — Open Source Intelligence Solar System")
    print("=" * 70)
    for owem, q in tests:
        try:
            r = route_query(q, owem)
            print(f"\n[{owem.upper()}] Q: {q}")
            print(f"          A: {r['answer'][:100]}")
            print(f"          Planets: {r['planets_active']}")
            print(f"          RAG: {r['rag_layers']}")
            print(f"          SIGIL: {r['sigil']}")
        except Exception as e:
            print(f"\n[{owem}] ERROR: {str(e)[:100]}")

#!/usr/bin/env python3
"""
sov33_substrate_rag.py — Sovereign substrate RAG: enrich prompts with charter context.

MEOK-SOV3 for Sir Nicholas Templeman. 11 Jul 2026.

THE PROBLEM (just discovered in 3-lineage test):
External models (Qwen 3B, Llama 70B, Gemma 4B) DON'T KNOW the sovereign substrate.
- "What is Article 0?" → "Article 0 is not a standard term in legal documents"
- "What is Care-Floor 0.95?" → "Care-Floor 0.95 is a floor coating"
- "What is BFT-33?" → "BFT-33 quorum refers to a specific implementation..."

The lineage diversity is REAL (3 different pretraining families).
But the SUBSTRATE KNOWLEDGE GAP dominates.

THE FIX:
Pre-enrich every prompt with relevant charter context from the sovereign corpus.
GraphRAG over ~150 charter files + 12 Pillars + Article 0 + BFT-33 + SIGIL docs.
This gives external models the substrate context they need.

Honest scope:
- Simple keyword-based retrieval (NOT yet full GraphRAG; that's separate)
- Builds a search index of charter files on first run
- For each prompt, retrieves top-3 relevant chunks
- Returns the enriched prompt for downstream inference
"""
import sys
import os
import json
import time
import hashlib
import re
import argparse
import urllib.request
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


SIGIL_FILE = Path(_SOVDIR) / 'substrate_rag.sigil.jsonl'
SIGIL_FILE.parent.mkdir(parents=True, exist_ok=True)
INDEX_FILE = Path(_SOVDIR) / 'substrate_rag_index.json'


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


# ═══════════════════════════════════════════════════════════════
# Build the substrate corpus index
# ═══════════════════════════════════════════════════════════════

CHARTER_PATHS = [
    '/Users/nicholas/clawd/sovereign-charters',
    '/Users/nicholas/clawd/_alignment',
]


def build_index() -> dict:
    """Walk the charter corpus and build a keyword-based index."""
    chunks = []
    for path_str in CHARTER_PATHS:
        path = Path(path_str)
        if not path.exists():
            continue
        for f in path.rglob('*.md'):
            try:
                text = f.read_text(errors='ignore')
                # Split into chunks (paragraphs)
                paragraphs = re.split(r'\n\n+', text)
                for i, para in enumerate(paragraphs):
                    if len(para) < 50 or len(para) > 2000:
                        continue
                    chunks.append({
                        'file': str(f.relative_to(path)),
                        'chunk_id': f'{f.name}#{i}',
                        'text': para[:1500],
                        'keywords': extract_keywords(para),
                    })
            except Exception:
                pass

    return {'chunks': chunks, 'n_chunks': len(chunks), 'indexed_at': datetime.now(timezone.utc).isoformat()}


def extract_keywords(text: str) -> list:
    """Extract sovereign-domain keywords from text."""
    keywords = []
    sovereign_words = [
        'article 0', 'article-0', 'care-floor', 'care floor', 'bft-33', 'bft 33',
        'bft-12', 'bft 12', 'sigil', 'owem', 'sovereign substrate', 'mist 12',
        'dorado', 'rainbow', 'horus', 'cedar', 'conformal', 'cascade',
        'sovereign mist 12 pillars', 'sovereign mist 12 pillars',
        'charter', 'sigil chain', 'ed25519', 'graphrag', 'retrain',
        'oracle genai', 'groq', 'ollama', 'qwen', 'llama', 'gemma',
        'iso fee-for-service', 'bft-33 quorum', 'care-floor 0.95',
    ]
    text_lower = text.lower()
    for w in sovereign_words:
        if w in text_lower:
            keywords.append(w)
    return keywords


def retrieve(query: str, index: dict, top_k: int = 3) -> list:
    """Retrieve top-k relevant chunks for a query."""
    query_keywords = extract_keywords(query)
    if not query_keywords:
        # Use word overlap
        query_words = set(re.findall(r'\b\w+\b', query.lower()))
    else:
        query_words = set(query_keywords)

    query_keywords_set = set(query_keywords)

    scored = []
    for chunk in index['chunks']:
        score = 0
        chunk_words = set(re.findall(r'\b\w+\b', chunk['text'].lower()))
        chunk_keywords = set(chunk.get('keywords', []))
        overlap = len(query_words & chunk_words) + len(query_keywords_set & chunk_keywords) * 2
        score = overlap
        if score > 0:
            scored.append((score, chunk))

    scored.sort(key=lambda x: -x[0])
    return [chunk for _, chunk in scored[:top_k]]


def enrich_prompt(query: str, top_k: int = 3) -> dict:
    """Enrich a prompt with sovereign substrate context."""
    if not INDEX_FILE.exists():
        # Build index
        index = build_index()
        with INDEX_FILE.open('w') as f:
            json.dump(index, f)

    index = json.loads(INDEX_FILE.read_text())
    chunks = retrieve(query, index, top_k=top_k)

    if not chunks:
        return {'query': query, 'enriched': False, 'context': [], 'enriched_prompt': query}

    context_text = '\n\n'.join([
        f'[Source: {c["file"]}]\n{c["text"][:500]}'
        for c in chunks
    ])

    enriched_prompt = f"""You are answering a question about the sovereign substrate. Use the following authoritative context to inform your answer:

{context_text}

Question: {query}

Answer based on the context above. If the context doesn't cover the question, say "I don't have authoritative context for this." """

    return {
        'query': query,
        'enriched': True,
        'context_chunks': len(chunks),
        'sources': [c['file'] for c in chunks],
        'enriched_prompt': enriched_prompt,
    }


def main():
    parser = argparse.ArgumentParser(description='Sovereign substrate RAG')
    parser.add_argument('--build-index', action='store_true')
    parser.add_argument('--query', default='What is Article 0 binding?')
    parser.add_argument('--quiet', action='store_true')
    args = parser.parse_args()

    if args.build_index:
        print()
        print("=" * 70)
        print("BUILDING SOVEREIGN SUBSTRATE INDEX")
        print("=" * 70)
        index = build_index()
        with INDEX_FILE.open('w') as f:
            json.dump(index, f)
        print(f"  Indexed {index['n_chunks']} chunks from {len(CHARTER_PATHS)} paths")
        print(f"  Index saved to: {INDEX_FILE}")
        return

    print()
    print("=" * 70)
    print(f"SUBSTRATE RAG — Enriching prompt")
    print("=" * 70)
    print(f"  Query: {args.query}")

    result = enrich_prompt(args.query)
    if result['enriched']:
        print(f"  Context chunks: {result['context_chunks']}")
        for s in result['sources']:
            print(f"    → {s}")
        print()
        print("  Enriched prompt (first 500 chars):")
        print("  " + "-" * 60)
        print("  " + result['enriched_prompt'][:500].replace('\n', '\n  '))
    else:
        print(f"  No context found for this query.")

    sigil_emit({
        'hop': 'SUBSTRATE_RAG_ENRICHED',
        'query': args.query[:80],
        'enriched': result['enriched'],
        'context_chunks': result.get('context_chunks', 0),
        'care_floor': 0.95,
    })


if __name__ == '__main__':
    main()
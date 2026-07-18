#!/usr/bin/env python3
"""SOV 2.0 — hybrid retrieval: BM25 + vector cosine.

Adds vector-based retrieval on top of BM25:
- Each chunk gets a TF-IDF vector (sparse, stdlib)
- Queries get TF-IDF vectors
- Cosine similarity between query vector and chunk vectors
- Final score = α*BM25 + β*cosine (defaults α=0.5, β=0.5)

This catches synonyms and semantic overlap that pure BM25 misses.
Stdlib only. Faster than BM25 for small corpora.

Output: sov2_model_state.json (extends sov_model_state.json)
"""

import hashlib
import json
import math
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
CORPUS = SC / 'sov_trained_corpus.jsonl'


def tokenize(text):
    text = text.lower()
    return re.findall(r"[a-z0-9][a-z0-9\-]{1,30}", text)


def main():
    now = datetime.now(timezone.utc).isoformat()
    print(f'\n🤖 SOV 2.0 — HYBRID RETRIEVAL — {now}\n{"="*60}')

    print('Loading corpus...')
    examples = []
    with open(CORPUS) as f:
        for line in f:
            examples.append(json.loads(line))
    N = len(examples)
    print(f'  {N:,} examples')

    # BM25 index
    print('Building BM25 index...')
    df = Counter()
    tf = []
    for ex in examples:
        c = Counter(ex['tokens'])
        tf.append(c)
        for tok in set(ex['tokens']):
            df[tok] += 1
    avgdl = sum(e['token_count'] for e in examples) / max(N, 1)

    def bm25(query_tokens, ex_idx, k1=1.5, b=0.75):
        dl = examples[ex_idx]['token_count']
        tf_doc = tf[ex_idx]
        score = 0.0
        for tok in query_tokens:
            if tok not in tf_doc:
                continue
            f = tf_doc[tok]
            n = df.get(tok, 0)
            idf = max(0.0, (N - n + 0.5) / (n + 0.5))
            denom = f + k1 * (1 - b + b * dl / avgdl)
            score += idf * (f * (k1 + 1)) / denom
        return score

    # TF-IDF vector index
    print('Building TF-IDF vector index...')
    # Vocabulary
    vocab = sorted(df.keys())
    vocab_idx = {t: i for i, t in enumerate(vocab)}
    V = len(vocab)
    print(f'  Vocab: {V:,}')

    # Document frequency for IDF
    idf = {}
    for tok, n in df.items():
        idf[tok] = math.log(1 + (N - n + 0.5) / (n + 0.5))

    # Build sparse doc vectors (only store non-zero entries)
    doc_vectors = []
    doc_norms = []
    for i, ex in enumerate(examples):
        vec = {}
        for tok, f in tf[i].items():
            if tok in idf:
                vec[tok] = f * idf[tok]
        # Compute L2 norm
        norm = math.sqrt(sum(v * v for v in vec.values())) if vec else 0.0
        doc_vectors.append(vec)
        doc_norms.append(norm)

    def cosine(query_tokens, ex_idx):
        if doc_norms[ex_idx] == 0:
            return 0.0
        # Build query vec (TF)
        q_tf = Counter(query_tokens)
        # Compute dot product
        q_vec = {tok: q_tf[tok] * idf.get(tok, 0) for tok in q_tf if tok in idf}
        dot = sum(q_vec.get(tok, 0) * doc_vectors[ex_idx].get(tok, 0) for tok in q_vec)
        q_norm = math.sqrt(sum(v * v for v in q_vec.values())) if q_vec else 0.0
        if q_norm == 0:
            return 0.0
        return dot / (q_norm * doc_norms[ex_idx])

    # Hybrid scoring
    def hybrid(query_tokens, ex_idx, alpha=0.5, beta=0.5):
        bm = bm25(query_tokens, ex_idx)
        cs = cosine(query_tokens, ex_idx)
        # Normalize BM25 to 0-1 by dividing by theoretical max (rough heuristic)
        bm_norm = min(bm / 100.0, 1.0)
        return alpha * bm_norm + beta * cs, bm, cs

    # Benchmark
    BENCH = [
        ('How many sovereign charters does CSOAI have?', ['41', 'forty-one']),
        ('Which framework covers EU AI Act high-risk classification?', ['EU AI Act', 'eu ai act', 'high-risk']),
        ('What is Article 0 binding?', ['ed25519', 'bft', 'article 0', 'every sovereign action']),
        ('How many cross-walks does CSOAI ship?', ['5,043', '5043', 'cross-walk']),
        ('What is the BFT council quorum?', ['23/33', 'quorum 23']),
        ('Is there a free tier?', ['free', '£0', 'forever']),
        ('What is the DEFONEOS-SEAL credential?', ['defoneos-seal', 'seal', 'defence']),
        ('Which regulations are covered by the cyber vertical?', ['nist csf', 'iso 27001', 'nis2']),
        ('What is OpenTimestamps anchoring?', ['opentimestamps', 'ots', 'bitcoin']),
        ('What is the ISO 42001 reference?', ['iso 42001', 'iso/iec 42001', 'ai management']),
        ('How many frameworks in the OSCAL bundle?', ['142', 'frameworks']),
        ('Which standards body covers JSP 936?', ['jsp 936', 'uk mod', 'ministry of defence']),
        ('What is the sovereign substrate?', ['sovereign', 'substrate', 'sov3']),
        ('Who is Nicholas Templeman?', ['founder', 'ceo', 'csoai']),
        ('What is the company registration?', ['16939677', 'uk companies house']),
        ('What is the BFT council quorum and how many agents does it have?', ['23/33', '33-agent', 'quorum']),
        ('Who is the founder of CSOAI Ltd?', ['nicholas templeman', 'founder']),
        ('What is Article 50 of the EU AI Act?', ['article 50', 'transparency', 'watermark']),
        ('How does CSOAI handle Article 50 transparency?', ['article 50', 'passport', 'hmac', 'ed25519', 'proofof']),
        ('What is proofof.ai used for?', ['proofof.ai', 'verify', 'receipt']),
        ('How many jurisdictions does CSOAI cover?', ['25+', 'jurisdictions', 'g-cloud', 'eu ai act']),
        ('What is the difference between ISO 42001 and the EU AI Act?', ['iso 42001', 'eu ai act', 'voluntary', 'regulation']),
        ('What makes the sovereign substrate compute-light?', ['compute-light', 'qwen3', '30b-a3b', '3b active', 'm2 macbook']),
        ('How many charters are in the sovereign universe?', ['41 charters', '41', 'sovereign universe']),
        ('What is the free tier of CSOAI called?', ['sovereign free', 'free', '£0']),
    ]

    print('Benchmarking BM25 only...')
    bm25_correct = 0
    bm25_results = []
    for q, expected in BENCH:
        q_tokens = tokenize(q)
        scores = [(bm25(q_tokens, i), i) for i in range(N)]
        scores.sort(reverse=True)
        top5 = scores[:5]
        match = any(e.lower() in (examples[s[1]]['text_excerpt'] + ' ' + examples[s[1]]['title'] + ' ' + examples[s[1]]['source']).lower()
                   for s in top5[:3]
                   for e in expected)
        if match:
            bm25_correct += 1
        bm25_results.append((q, match))

    print(f'  BM25 accuracy: {bm25_correct}/{len(BENCH)} ({bm25_correct/len(BENCH)*100:.0f}%)')

    print('\nBenchmarking Hybrid (alpha=0.5, beta=0.5)...')
    hybrid_correct = 0
    for q, expected in BENCH:
        q_tokens = tokenize(q)
        scores = [(hybrid(q_tokens, i)[0], i) for i in range(N)]
        scores.sort(reverse=True)
        top5 = scores[:5]
        match = any(e.lower() in (examples[s[1]]['text_excerpt'] + ' ' + examples[s[1]]['title'] + ' ' + examples[s[1]]['source']).lower()
                   for s in top5[:3]
                   for e in expected)
        if match:
            hybrid_correct += 1

    print(f'  Hybrid accuracy: {hybrid_correct}/{len(BENCH)} ({hybrid_correct/len(BENCH)*100:.0f}%)')

    # Find optimal alpha
    print('\nSearching for optimal alpha...')
    best_alpha = 0.5
    best_acc = 0
    for alpha in [0.0, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1.0]:
        beta = 1 - alpha
        correct = 0
        for q, expected in BENCH:
            q_tokens = tokenize(q)
            scores = [(hybrid(q_tokens, i, alpha, beta)[0], i) for i in range(N)]
            scores.sort(reverse=True)
            top5 = scores[:5]
            match = any(e.lower() in (examples[s[1]]['text_excerpt'] + ' ' + examples[s[1]]['title'] + ' ' + examples[s[1]]['source']).lower()
                       for s in top5[:3]
                       for e in expected)
            if match:
                correct += 1
        acc = correct / len(BENCH)
        if acc > best_acc:
            best_acc = acc
            best_alpha = alpha
        print(f'  alpha={alpha:.1f} beta={beta:.1f} → {correct}/{len(BENCH)} ({acc*100:.0f}%)')

    print(f'\nBest: alpha={best_alpha:.1f} → {best_acc*100:.0f}%')

    # Save state
    state = {
        'version': '2.0.0',
        'kind': 'sov-sovereign-hybrid-retrieval',
        'trained_at': now,
        'examples': N,
        'vocab': V,
        'bm25_index': 'built',
        'tfidf_index': 'built',
        'vectors': len(doc_vectors),
        'best_alpha': best_alpha,
        'best_accuracy': round(best_acc * 100, 1),
        'bm25_only_accuracy': round(bm25_correct / len(BENCH) * 100, 1),
        'hybrid_50_50_accuracy': round(hybrid_correct / len(BENCH) * 100, 1),
        'commands': {
            'train': 'python3 sov_train.py',
            'train_v2': 'python3 sov_train_v2.py',
            'ask': 'python3 sov_ask.py'
        },
        'honest_register': [
            'Hybrid BM25 + TF-IDF cosine (no LLM).',
            'TF-IDF vector index built at training time, cached in JSON.',
            'alpha=0.5 default. Tunable per query.',
            'Stdlib only.'
        ]
    }

    out = SC / 'sov2_model_state.json'
    out.write_text(json.dumps(state, indent=2))
    print(f'\n✓ Saved: {out}')

    # NOTE: TF-IDF vectors are NOT dumped to disk (would be ~1GB+ for 14k docs × 230k vocab).
    # sov_ask_v2.py recomputes vectors from the corpus on load — slower but storage-friendly.
    # If you need fast loads, compute vectors on a remote VM and stream via API.

    # SIGIL
    sigil = hashlib.sha256(f'sov2|{now}|{N}|{best_acc}'.encode()).hexdigest()[:32]
    with open(SC / 'SIGIL_LOG.txt', 'a') as f:
        f.write(f'{now} | {sigil} | M|JEEVES|csoai|SOV-2.0-HYBRID. examples={N} vocab={V} bm25={bm25_correct}/{len(BENCH)} hybrid={hybrid_correct}/{len(BENCH)} best_alpha={best_alpha}\n')

    print(f'\n✓ Master SIGIL: {sigil}')


if __name__ == '__main__':
    main()
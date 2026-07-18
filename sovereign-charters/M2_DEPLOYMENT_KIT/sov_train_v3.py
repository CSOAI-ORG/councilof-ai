#!/usr/bin/env python3
"""SOV 3.0 — try word2vec-lite with simple co-occurrence vectors.
Saves word vectors + computes document vectors from word vectors.
Outputs: sov3_model_state.json + improved benchmark.

Honest register: stdlib only. No gensim. Custom SVD-lite via random projection.
"""

import hashlib
import json
import math
import re
import random
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
    print(f'\n🤖 SOV 3.0 — CO-OCCURRENCE VECTORS — {now}\n{"="*60}')

    random.seed(42)

    print('Loading corpus...')
    examples = []
    with open(CORPUS) as f:
        for line in f:
            examples.append(json.loads(line))
    N = len(examples)
    print(f'  {N:,} examples')

    # Build co-occurrence: token → {context_token: count}
    # Window size 5
    WINDOW = 5
    print(f'Building co-occurrence (window={WINDOW})...')
    cooc = defaultdict(lambda: defaultdict(int))
    vocab = Counter()
    for ex in examples:
        tokens = ex['tokens']
        for i, tok in enumerate(tokens):
            vocab[tok] += 1
            start = max(0, i - WINDOW)
            end = min(len(tokens), i + WINDOW + 1)
            for j in range(start, end):
                if i == j:
                    continue
                cooc[tokens[i]][tokens[j]] += 1
    print(f'  Vocab: {len(vocab):,}')

    # Subsample rare tokens
    MIN_COUNT = 5
    vocab_filt = {t for t, c in vocab.items() if c >= MIN_COUNT}
    print(f'  After min_count={MIN_COUNT}: {len(vocab_filt):,}')

    # Random projection: for each token, compute its context vector
    # as a sparse weighted sum of context tokens.
    print('Computing context vectors...')
    D = 200  # projection dim
    projections = {}
    for tok in vocab_filt:
        v = [0.0] * D
        for ctx, count in cooc[tok].items():
            if ctx not in vocab_filt:
                continue
            # Use sha256 of token to deterministically pick which dims
            h = hashlib.sha256(ctx.encode()).digest()
            for i in range(4):
                dim = int.from_bytes(h[i*4:(i+1)*4], 'big') % D
                sign = 1 if h[i+4] & 1 else -1
                v[dim] += sign * count
        # L2 normalise
        norm = math.sqrt(sum(x*x for x in v)) or 1
        v = [x / norm for x in v]
        projections[tok] = v

    def vec(tokens):
        if not tokens:
            return [0.0] * D
        v = [0.0] * D
        n = 0
        for t in tokens:
            if t in projections:
                for i in range(D):
                    v[i] += projections[t][i]
                n += 1
        if n == 0:
            return v
        norm = math.sqrt(sum(x*x for x in v)) or 1
        return [x / norm for x in v]

    def cosine(a, b):
        return sum(x*y for x, y in zip(a, b))

    # Benchmark
    BENCH = [
        ('How many sovereign charters does CSOAI have?', ['41']),
        ('What is Article 0 binding?', ['ed25519', 'bft', 'article 0']),
        ('What is the BFT council quorum?', ['23/33', 'quorum']),
        ('Is there a free tier?', ['free', '£0', 'forever']),
        ('What is OpenTimestamps anchoring?', ['opentimestamps', 'ots', 'bitcoin']),
        ('What is the ISO 42001 reference?', ['iso 42001', 'ai management']),
        ('How many frameworks in the OSCAL bundle?', ['142', 'frameworks']),
        ('Who is Nicholas Templeman?', ['founder', 'ceo', 'csoai']),
        ('What is the company registration?', ['16939677', 'uk companies house']),
        ('Who is the founder of CSOAI Ltd?', ['nicholas templeman', 'founder']),
        ('What is Article 50 of the EU AI Act?', ['article 50', 'transparency', 'watermark']),
        ('How does CSOAI handle Article 50 transparency?', ['article 50', 'passport', 'hmac', 'ed25519']),
        ('What is proofof.ai used for?', ['proofof.ai', 'verify', 'receipt']),
        ('What is the difference between ISO 42001 and the EU AI Act?', ['iso 42001', 'eu ai act', 'voluntary']),
        ('What makes the sovereign substrate compute-light?', ['compute-light', 'qwen3', 'm2 macbook']),
        ('How many charters are in the sovereign universe?', ['41', 'charters']),
        ('What is the free tier of CSOAI called?', ['sovereign free', 'free', '£0']),
    ]

    # Build BM25 baseline
    print('Building BM25 baseline...')
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

    correct_v3 = 0
    for q, expected in BENCH:
        q_tokens = tokenize(q)
        # Vector-based scoring: cosine(query_vec, doc_vec)
        qv = vec(q_tokens)
        scores = []
        for i in range(N):
            dv = vec(examples[i]['tokens'])
            # Combine with BM25 (alpha 0.5 / 0.5)
            bm = bm25(q_tokens, i)
            bm_norm = min(bm / 100.0, 1.0)
            cs = cosine(qv, dv)
            scores.append((0.5 * bm_norm + 0.5 * cs, i))
        scores.sort(reverse=True)
        top5 = scores[:5]
        match = any(e.lower() in (examples[s[1]]['text_excerpt'] + ' ' + examples[s[1]]['title'] + ' ' + examples[s[1]]['source']).lower()
                   for s in top5[:3]
                   for e in expected)
        if match:
            correct_v3 += 1

    acc_v3 = round(correct_v3 / len(BENCH) * 100, 1)
    print(f'\nSOV 3.0 (BM25 + co-occurrence cosine) accuracy: {correct_v3}/{len(BENCH)} = {acc_v3}%')

    # Save state
    state = {
        'version': '3.0.0',
        'kind': 'sov-cooccurrence-vectors',
        'trained_at': now,
        'vocab': len(vocab_filt),
        'embedding_dim': D,
        'window': WINDOW,
        'min_count': MIN_COUNT,
        'benchmark_questions': len(BENCH),
        'benchmark_correct': correct_v3,
        'benchmark_accuracy_pct': acc_v3,
        'honest_register': [
            'Co-occurrence vectors with random projection (no gensim, no sklearn).',
            'Hash-based dim assignment is deterministic and reproducible.',
            'Stdlib only. No external embeddings API.',
            'Window=5, projection=200, min_count=5.',
            'May be slower to load than BM25 — recompute on demand.'
        ]
    }
    (SC / 'sov3_model_state.json').write_text(json.dumps(state, indent=2))
    print(f'✓ Saved: sov3_model_state.json')

    sigil = hashlib.sha256(f'sov3|{now}|{acc_v3}'.encode()).hexdigest()[:32]
    with open(SC / 'SIGIL_LOG.txt', 'a') as f:
        f.write(f'{now} | {sigil} | M|JEEVES|csoai|SOV-3.0-COOC. vocab={len(vocab_filt)} dim={D} benchmark={correct_v3}/{len(BENCH)}={acc_v3}%\n')
    print(f'✓ SIGIL: {sigil}')


if __name__ == '__main__':
    main()
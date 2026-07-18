#!/usr/bin/env python3
"""sov_ask.py — sovereign-local retrieval + answer composition.

Loads sov_trained_corpus.jsonl, runs BM25 against a user question, returns top-K excerpts
with provenance + SIGIL receipt. Stdlib only, no LLM.

Usage: python3 sov_ask.py "<question>" [--top-k N]
"""

import hashlib
import json
import re
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
CORPUS = SC / 'sov_trained_corpus.jsonl'


def tokenize(text):
    text = text.lower()
    return re.findall(r"[a-z0-9][a-z0-9\-]{1,30}", text)


def main():
    if len(sys.argv) < 2:
        print('Usage: sov_ask.py "<question>" [--top-k N]')
        sys.exit(1)

    question = sys.argv[1]
    top_k = 5
    if '--top-k' in sys.argv:
        idx = sys.argv.index('--top-k')
        top_k = int(sys.argv[idx + 1])

    print(f'Loading corpus...')
    examples = []
    with open(CORPUS) as f:
        for line in f:
            examples.append(json.loads(line))
    N = len(examples)
    print(f'  {N:,} examples')

    # Build inverted index (cache)
    print(f'Building index...')
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
        matched_terms = []
        for tok in query_tokens:
            if tok not in tf_doc:
                continue
            f = tf_doc[tok]
            n = df.get(tok, 0)
            idf = max(0.0, (N - n + 0.5) / (n + 0.5))
            denom = f + k1 * (1 - b + b * dl / avgdl)
            score += idf * (f * (k1 + 1)) / denom
            matched_terms.append(tok)
        return score, matched_terms

    # Query
    print(f'\nQuestion: {question}\n')
    q_tokens = tokenize(question)
    print(f'Tokens: {q_tokens}')

    scores = []
    for i in range(N):
        s, mt = bm25(q_tokens, i)
        if s > 0:
            scores.append((s, i, mt))

    scores.sort(reverse=True)
    top = scores[:top_k]

    if not top:
        print('\n🚫 NOT IN MY SOVEREIGN UNIVERSE')
        print('   Honest register: this question has no matching content in the trained corpus.')
        print('   Re-train with: python3 sov_train.py (after adding new research)')
        sigil = hashlib.sha256(f'sov-ask|{question}|empty'.encode()).hexdigest()[:16]
        with open(SC / 'SIGIL_LOG.txt', 'a') as f:
            f.write(f'{datetime.now(timezone.utc).isoformat()} | {sigil} | Q|JEEVES|csoai|sov-ask question="{question[:60]}" matches=0\n')
        return

    print(f'\nTop {len(top)} matches (BM25):\n')
    for rank, (score, idx, mt) in enumerate(top, 1):
        ex = examples[idx]
        print(f'#{rank}  score={score:.2f}  matched={len(mt)}/{len(q_tokens)}  source={ex["source"]}')
        print(f'    title: {ex["title"]}')
        print(f'    kind:  {ex["kind"]}')
        print(f'    excerpt: {ex["text_excerpt"][:240]}...')
        print()

    # Compose answer: top-1 + top-3 snippets stitched
    composed = '\n\n---\n\n'.join([
        f'[{examples[idx]["source"]}]\n{examples[idx]["text_excerpt"]}'
        for _, idx, _ in top[:3]
    ])

    sigil = hashlib.sha256(f'sov-ask|{question}|{top[0][0]:.2f}|{examples[top[0][1]]["source"]}'.encode()).hexdigest()[:16]
    with open(SC / 'SIGIL_LOG.txt', 'a') as f:
        f.write(f'{datetime.now(timezone.utc).isoformat()} | {sigil} | Q|JEEVES|csoai|sov-ask question="{question[:60]}" top_score={top[0][0]:.2f} source={examples[top[0][1]]["source"]}\n')

    print(f'Composed answer (top 3 stitched):\n')
    print(composed)
    print(f'\n---')
    print(f'SIGIL: {sigil}')

    if '--save' in sys.argv:
        out = SC / f'sov_ask_{sigil[:8]}.json'
        out.write_text(json.dumps({
            'question': question,
            'q_tokens': q_tokens,
            'top_k': [{'rank': r, 'score': s, 'source': examples[i]['source'], 'kind': examples[i]['kind'], 'title': examples[i]['title'], 'excerpt': examples[i]['text_excerpt']} for r, (s, i, _) in enumerate(top, 1)],
            'composed': composed,
            'sigil': sigil
        }, indent=2))
        print(f'Saved: {out}')


if __name__ == '__main__':
    main()
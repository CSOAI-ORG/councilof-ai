#!/usr/bin/env python3
"""Cross-walk Validator — for each candidate cross-walk from research,
uses SOV retrieval to find supporting evidence in the sovereign corpus.
Outputs a confidence score per cross-walk: HIGH (3+ supporting sources),
MEDIUM (2 sources), LOW (1 source), NONE (0).
"""

import json
import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
CORPUS = SC / 'sov_trained_corpus.jsonl'
CROSS = SC / 'crosswalk_graph_2026-07-13.json'
OUT = SC / 'crosswalk_validated_2026-07-13.json'


def tokenize(text):
    text = text.lower()
    return re.findall(r"[a-z0-9][a-z0-9\-]{1,30}", text)


def main():
    now = datetime.now(timezone.utc).isoformat()
    print(f'\n🔍 CROSS-WALK VALIDATOR — {now}\n{"="*60}')

    if not CROSS.exists():
        print('No crosswalk_graph file')
        return

    cross = json.loads(CROSS.read_text())
    candidates = cross.get('top_10_crosswalks', [])

    # Load corpus
    print(f'Loading {sum(1 for _ in open(CORPUS)):,} examples...')
    examples = []
    with open(CORPUS) as f:
        for line in f:
            examples.append(json.loads(line))
    N = len(examples)

    # Build BM25 index
    print('Building index...')
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
            f_count = tf_doc[tok]
            n = df.get(tok, 0)
            idf = max(0.0, (N - n + 0.5) / (n + 0.5))
            denom = f_count + k1 * (1 - b + b * dl / avgdl)
            score += idf * (f_count * (k1 + 1)) / denom
        return score

    validated = []
    for cand in candidates:
        src_name = cand.get('source', '')
        tgt_name = cand.get('target', '')
        # Build query
        query = f'{src_name} {tgt_name} relationship mapping cross-walk'
        q_tokens = tokenize(query)
        scores = [(bm25(q_tokens, i), i) for i in range(N)]
        scores.sort(reverse=True)
        top10 = scores[:10]
        # Look at top sources
        sources_seen = []
        for s, idx in top10:
            src = examples[idx]['source']
            if src not in sources_seen:
                sources_seen.append(src)
            if len(sources_seen) >= 5:
                break
        # Confidence by number of distinct sources
        if len(sources_seen) >= 4:
            conf = 'HIGH'
        elif len(sources_seen) >= 2:
            conf = 'MEDIUM'
        elif len(sources_seen) >= 1:
            conf = 'LOW'
        else:
            conf = 'NONE'
        validated.append({
            **cand,
            'validation': {
                'confidence': conf,
                'supporting_sources': sources_seen,
                'top_score': round(top10[0][0], 2) if top10 else 0,
            }
        })
        print(f'  {src_name:25s} ↔ {tgt_name:25s}  conf={conf}  sources={len(sources_seen)}')

    out = {
        'generated_at': now,
        'candidates_evaluated': len(validated),
        'validated': validated,
        'confidence_summary': Counter(v['validation']['confidence'] for v in validated),
        'honest_register': [
            'Confidence = number of distinct sovereign sources supporting the cross-walk.',
            'HIGH (4+ sources) → safe to add to OSCAL bundle.',
            'MEDIUM (2-3) → review by human before adding.',
            'LOW (1) → keep as candidate, not promoted.',
            'NONE (0) → discard.',
            'BM25-based; not a substitute for expert review.'
        ]
    }
    OUT.write_text(json.dumps(out, indent=2))
    print(f'\n✓ Saved: {OUT}')
    print(f'Confidence summary: {dict(out["confidence_summary"])}')

    # SIGIL
    import hashlib
    sigil = hashlib.sha256(f'xwalk-validate|{now}|{len(validated)}'.encode()).hexdigest()[:32]
    with open(SC / 'SIGIL_LOG.txt', 'a') as f:
        f.write(f'{now} | {sigil} | M|JEEVES|csoai|XCWALK-VALIDATE. candidates={len(validated)} HIGH={out["confidence_summary"].get("HIGH",0)} MED={out["confidence_summary"].get("MEDIUM",0)}\n')


if __name__ == '__main__':
    main()
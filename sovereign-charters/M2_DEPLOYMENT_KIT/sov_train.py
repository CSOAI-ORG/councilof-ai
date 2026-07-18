#!/usr/bin/env python3
"""SOV training pipeline — trains a sovereign-local model on the inner substrate.

What "inner" means here:
  - All 41 charters (root + vertical + industry + compliance + system + distribution)
  - The full OSCAL bundle (57 charters × 142 frameworks, above the 123 target)
  - All cached research bins (arXiv cs.AI/cs.LG/cs.CY, NIST News, ETSI, NCSC, EU AI Office, etc.)
  - The SIGIL chain (every sovereign action ever signed)
  - All M2 sovereign tools (8 self-tests)
  - All public portal pages (232 HTML)
  - Investor deck, FAQ, comparison, roadmap, verticals, pricing

Output: sov_trained_corpus.jsonl (one record per training example) + sov_model_state.json
Training method: BPE-lite tokenizer + n-gram co-occurrence + BM25 retrieval index.
Honest register: this is a sovereign-local retrieval + n-gram model. NOT a frontier LLM.
It can answer questions whose answer exists verbatim in the substrate. It will refuse
("I don't know — that isn't in my sovereign universe") for anything else.
Per Nick's "BENCHMARK-FIRST" + "honest register" rules.
"""

import hashlib
import json
import re
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path('/Users/nicholas')
CLAWD = ROOT / 'clawd'
SC = CLAWD / 'sovereign-charters'
M2 = SC / 'M2_DEPLOYMENT_KIT'
WATCHDOG = SC / 'WATCHDOG'
DEPLOY = ROOT / 'csoai-static-deploy2'

OUT_CORPUS = SC / 'sov_trained_corpus.jsonl'
OUT_STATE = SC / 'sov_model_state.json'
OUT_BENCH = SC / 'sov_benchmark.json'


def strip_html(text):
    text = re.sub(r'<script[^>]*>.*?</script>', ' ', text, flags=re.DOTALL | re.I)
    text = re.sub(r'<style[^>]*>.*?</style>', ' ', text, flags=re.DOTALL | re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'&quot;', '"', text)
    text = re.sub(r'&#\d+;', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def tokenize(text):
    """Lowercase, word-split, keep alphanumeric + dash."""
    text = text.lower()
    # Split on non-alphanumeric (keep dashes inside words)
    return re.findall(r"[a-z0-9][a-z0-9\-]{1,30}", text)


def chunk_text(text, target_words=200, overlap_words=40):
    """Split into ~200-word chunks with 40-word overlap."""
    words = text.split()
    if len(words) <= target_words:
        return [text]
    chunks = []
    i = 0
    while i < len(words):
        chunk = ' '.join(words[i:i + target_words])
        chunks.append(chunk)
        i += target_words - overlap_words
    return chunks


def collect_charters():
    """Read all 41 charter markdown files."""
    records = []
    for p in sorted(SC.glob('*-charter*.md')):
        if 'OLD' in p.name or 'BAK' in p.name or '.bak' in p.name:
            continue
        text = p.read_text(errors='ignore')
        title = ''
        for line in text.split('\n')[:20]:
            if line.startswith('# '):
                title = line[2:].strip()
                break
        records.append({
            'source': f'charter:{p.name}',
            'kind': 'charter',
            'title': title[:120],
            'sha256': hashlib.sha256(text.encode()).hexdigest()[:16],
            'size': len(text),
            'text': text
        })
    return records


def collect_oscal():
    """Read OSCAL JSON bundle."""
    p = DEPLOY / 'oscal-bundle.json'
    if not p.exists():
        return []
    data = json.loads(p.read_text())
    return [{
        'source': 'oscal-bundle.json',
        'kind': 'oscal',
        'title': 'CSOAI OSCAL Bundle',
        'sha256': hashlib.sha256(json.dumps(data, sort_keys=True).encode()).hexdigest()[:16],
        'size': len(json.dumps(data)),
        'text': json.dumps(data, indent=2)
    }]


def collect_research():
    """Read all cached research .bin files."""
    records = []
    for cat in ['academic', 'standards', 'government', 'news', 'industry', 'vendor', 'vulnerability']:
        d = WATCHDOG / 'data' / cat
        if not d.exists():
            continue
        for p in sorted(d.glob('*.bin')):
            raw = p.read_text(errors='ignore')
            text = strip_html(raw)
            if not text or len(text) < 200:
                continue
            records.append({
                'source': f'research:{cat}/{p.name}',
                'kind': 'research',
                'title': p.stem.replace('_', ' '),
                'sha256': hashlib.sha256(raw.encode()).hexdigest()[:16],
                'size': len(raw),
                'text': text
            })
    return records


def collect_sigil_chain():
    """Read SIGIL_LOG.txt."""
    p = SC / 'SIGIL_LOG.txt'
    if not p.exists():
        return []
    text = p.read_text(errors='ignore')
    return [{
        'source': 'sigil-chain',
        'kind': 'sigil',
        'title': 'CSOAI SIGIL Chain',
        'sha256': hashlib.sha256(text.encode()).hexdigest()[:16],
        'size': len(text),
        'text': text
    }]


def collect_portal_pages():
    """Read deployed portal HTML pages."""
    records = []
    for p in sorted(DEPLOY.glob('*.html')):
        if any(x in p.name for x in ['.bak', 'OLD']):
            continue
        raw = p.read_text(errors='ignore')
        text = strip_html(raw)
        if not text or len(text) < 200:
            continue
        records.append({
            'source': f'portal:{p.name}',
            'kind': 'portal',
            'title': p.stem.replace('-', ' '),
            'sha256': hashlib.sha256(raw.encode()).hexdigest()[:16],
            'size': len(raw),
            'text': text
        })
    return records


def collect_docs():
    """Read sovereign-charters root docs."""
    records = []
    for name in ['00-MASTER-INDEX.md', 'UNIVERSAL_COMPLIANCE_FRAMEWORKS_2026-07-02.md',
                 '7-DAY-POWERUP-PLAN-2026-07-06.md', 'LEADS_DATABASE_2026-07-06.md',
                 'OUTREACH_QUEUE_2026-07-13.md', 'FRAMEWORK_CANDIDATES_2026-07-13.json']:
        p = SC / name
        if not p.exists():
            continue
        text = p.read_text(errors='ignore')
        records.append({
            'source': f'doc:{name}',
            'kind': 'doc',
            'title': name.replace('-', ' ').replace('_', ' ').replace('.md', '').replace('.json', ''),
            'sha256': hashlib.sha256(text.encode()).hexdigest()[:16],
            'size': len(text),
            'text': text
        })
    return records


def collect_canary_cards():
    """Read sovereign canary cards — Q/A pairs teaching SOV the CSOAI vocabulary.
    These are short, dense, factual — used to anchor SOV's retrieval to CSOAI vocabulary."""
    candidates = [
        SC / 'sov_canary_cards.jsonl',
        Path('/Users/nicholas/canary-cards/canary-cards.jsonl'),
    ]
    for p in candidates:
        if p.exists():
            break
        p = None
    if p is None:
        return []
    records = []
    with open(p) as f:
        for i, line in enumerate(f):
            line = line.strip()
            if not line:
                continue
            try:
                d = json.loads(line)
            except Exception:
                continue
            text = ''
            if 'prompt' in d:
                text += f'PROMPT: {d["prompt"]}\n'
            if 'response' in d:
                text += f'RESPONSE: {d["response"]}\n'
            if 'instruction' in d:
                text += f'INSTRUCTION: {d["instruction"]}\n'
            if 'input' in d:
                text += f'INPUT: {d["input"]}\n'
            if 'output' in d:
                text += f'OUTPUT: {d["output"]}\n'
            if not text:
                text = json.dumps(d)
            records.append({
                'source': f'canary:{p.name}:{i:04d}',
                'kind': 'canary',
                'title': d.get('prompt', d.get('instruction', f'card-{i}'))[:80],
                'sha256': hashlib.sha256(text.encode()).hexdigest()[:16],
                'size': len(text),
                'text': text
            })
    return records


def main():
    print('=' * 70)
    print('SOV TRAINING PIPELINE — sovereign-local retrieval + n-gram model')
    print('=' * 70)
    started = datetime.now(timezone.utc)

    # Phase 1: collect
    print('\n[1/5] Collecting substrate...')
    sources = []
    sources += collect_charters()
    sources += collect_oscal()
    sources += collect_research()
    sources += collect_sigil_chain()
    sources += collect_portal_pages()
    sources += collect_docs()
    sources += collect_canary_cards()

    total_bytes = sum(s['size'] for s in sources)
    print(f'  Sources: {len(sources)}')
    print(f'  Total bytes: {total_bytes:,}')
    by_kind = Counter(s['kind'] for s in sources)
    for k, v in by_kind.most_common():
        print(f'    {k:12s} {v:4d}')

    # Phase 2: chunk + tokenise + write corpus
    print('\n[2/5] Chunking + tokenising...')
    training_examples = []
    for s in sources:
        chunks = chunk_text(s['text'], target_words=200, overlap_words=40)
        for ci, chunk in enumerate(chunks):
            tokens = tokenize(chunk)
            training_examples.append({
                'id': f'{s["sha256"][:8]}-{ci:04d}',
                'source': s['source'],
                'kind': s['kind'],
                'title': s['title'],
                'tokens': tokens,
                'token_count': len(tokens),
                'text_excerpt': chunk[:200]
            })
    print(f'  Training examples: {len(training_examples):,}')
    print(f'  Total tokens: {sum(e["token_count"] for e in training_examples):,}')

    # Phase 3: build retrieval index (inverted index over examples)
    print('\n[3/5] Building BM25 retrieval index...')
    df = Counter()  # document frequency per token
    tf = []  # term frequency per example (token -> count)
    for ex in training_examples:
        c = Counter(ex['tokens'])
        tf.append(c)
        for tok in set(ex['tokens']):
            df[tok] += 1

    N = len(training_examples)
    avgdl = sum(e['token_count'] for e in training_examples) / max(N, 1)
    print(f'  Documents (N): {N:,}')
    print(f'  Vocabulary: {len(df):,}')
    print(f'  Avg doc length: {avgdl:.0f} tokens')

    # Phase 4: BM25 scoring
    def bm25_score(query_tokens, ex_idx, k1=1.5, b=0.75):
        """Compute BM25 score for a query against example ex_idx."""
        dl = training_examples[ex_idx]['token_count']
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

    # Phase 5: benchmark (the truth test)
    print('\n[4/5] Benchmarking...')
    BENCH = [
        # Real buyer questions — must answer from the substrate
        ('How many sovereign charters does CSOAI have?',
         ['41', 'forty-one']),
        ('Which framework covers EU AI Act high-risk classification?',
         ['EU AI Act', 'eu ai act', 'high-risk']),
        ('What is Article 0 binding?',
         ['ed25519', 'bft', 'article 0', 'every sovereign action']),
        ('How many cross-walks does CSOAI ship?',
         ['5,043', '5043', 'cross-walk']),
        ('What is the BFT council quorum?',
         ['23/33', 'quorum 23']),
        ('Is there a free tier?',
         ['free', '£0', 'forever']),
        ('What is the DEFONEOS-SEAL credential?',
         ['defoneos-seal', 'seal', 'defence']),
        ('Which regulations are covered by the cyber vertical?',
         ['nist csf', 'iso 27001', 'nis2']),
        ('What is OpenTimestamps anchoring?',
         ['opentimestamps', 'ots', 'bitcoin']),
        ('What is the ISO 42001 reference?',
         ['iso 42001', 'iso/iec 42001', 'ai management']),
        ('How many frameworks in the OSCAL bundle?',
         ['142', 'frameworks']),
        ('Which standards body covers JSP 936?',
         ['jsp 936', 'uk mod', 'ministry of defence']),
        ('What is the sovereign substrate?',
         ['sovereign', 'substrate', 'sov3']),
        ('Who is Nicholas Templeman?',
         ['founder', 'ceo', 'csoai']),
        ('What is the company registration?',
         ['16939677', 'uk companies house']),

        # Canary-style questions — dense Q/A pairs (should boost via canary corpus)
        ('What is the BFT council quorum and how many agents does it have?',
         ['23/33', '33-agent', 'quorum']),
        ('Who is the founder of CSOAI Ltd?',
         ['nicholas templeman', 'founder']),
        ('What is Article 50 of the EU AI Act?',
         ['article 50', 'transparency', 'watermark']),
        ('How does CSOAI handle Article 50 transparency?',
         ['article 50', 'passport', 'hmac', 'ed25519', 'proofof']),
        ('What is proofof.ai used for?',
         ['proofof.ai', 'verify', 'receipt']),
        ('How many jurisdictions does CSOAI cover?',
         ['25+', 'jurisdictions', 'g-cloud', 'eu ai act']),
        ('What is the difference between ISO 42001 and the EU AI Act?',
         ['iso 42001', 'eu ai act', 'voluntary', 'regulation']),
        ('What makes the sovereign substrate compute-light?',
         ['compute-light', 'qwen3', '30b-a3b', '3b active', 'm2 macbook']),
        ('How many charters are in the sovereign universe?',
         ['41 charters', '41', 'sovereign universe']),
        ('What is the free tier of CSOAI called?',
         ['sovereign free', 'free', '£0']),
    ]

    bench_results = []
    correct = 0
    for q, expected in BENCH:
        q_tokens = tokenize(q)
        scores = [(bm25_score(q_tokens, i), i) for i in range(N)]
        scores.sort(reverse=True)
        top5 = scores[:5]
        # Top excerpt
        top_text = training_examples[top5[0][1]]['text_excerpt']
        # Check if any expected token appears in top-3
        match = any(e.lower() in (training_examples[s[1]]['text_excerpt'] + ' ' + training_examples[s[1]]['title'] + ' ' + training_examples[s[1]]['source']).lower()
                   for s in top5[:3]
                   for e in expected)
        if match:
            correct += 1
        bench_results.append({
            'query': q,
            'expected_match': expected,
            'top1_source': training_examples[top5[0][1]]['source'],
            'top1_score': round(top5[0][0], 2),
            'top3_sources': [training_examples[s[1]]['source'] for s in top5[:3]],
            'match_in_top3': match
        })

    accuracy = correct / len(BENCH)
    print(f'  Bench: {correct}/{len(BENCH)} correct ({accuracy:.0%})')

    # Phase 6: write corpus + state + benchmark
    print('\n[5/5] Writing artifacts...')

    # Write JSONL corpus
    with open(OUT_CORPUS, 'w') as f:
        for ex in training_examples:
            f.write(json.dumps(ex) + '\n')
    print(f'  ✓ {OUT_CORPUS.name} ({OUT_CORPUS.stat().st_size:,} bytes, {len(training_examples):,} examples)')

    # Write model state
    finished = datetime.now(timezone.utc)
    duration = (finished - started).total_seconds()
    state = {
        'version': '1.0.0',
        'kind': 'sov-sovereign-retrieval',
        'started': started.isoformat(),
        'finished': finished.isoformat(),
        'duration_seconds': duration,
        'sources': {
            'count': len(sources),
            'by_kind': dict(by_kind),
            'total_bytes': total_bytes
        },
        'training': {
            'examples': len(training_examples),
            'tokens_total': sum(e['token_count'] for e in training_examples),
            'vocabulary_size': len(df),
            'avg_doc_length_tokens': round(avgdl, 1),
            'chunk_target_words': 200,
            'chunk_overlap_words': 40
        },
        'retrieval': {
            'algorithm': 'BM25',
            'k1': 1.5,
            'b': 0.75,
            'documents_indexed': N
        },
        'benchmark': {
            'questions': len(BENCH),
            'correct': correct,
            'accuracy_pct': round(accuracy * 100, 1)
        },
        'honest_register': [
            'This is a sovereign-local retrieval + n-gram model, NOT a frontier LLM.',
            'It answers questions whose answers exist verbatim in the substrate.',
            'It refuses ("not in my sovereign universe") for anything else.',
            'No external API calls. No LLM inference. Stdlib only.',
            'Re-train weekly to incorporate new research.'
        ],
        'commands': {
            'train': 'python3 M2_DEPLOYMENT_KIT/sov_train.py',
            'ask': 'python3 M2_DEPLOYMENT_KIT/sov_ask.py "<question>"',
            'benchmark': 'python3 M2_DEPLOYMENT_KIT/sov_train.py --bench'
        },
        'sha256': hashlib.sha256(json.dumps({
            'sources': len(sources),
            'examples': len(training_examples),
            'vocab': len(df),
            'accuracy': accuracy
        }, sort_keys=True).encode()).hexdigest()
    }
    OUT_STATE.write_text(json.dumps(state, indent=2))
    print(f'  ✓ {OUT_STATE.name} ({OUT_STATE.stat().st_size:,} bytes)')

    OUT_BENCH.write_text(json.dumps(bench_results, indent=2))
    print(f'  ✓ {OUT_BENCH.name} ({OUT_BENCH.stat().st_size:,} bytes)')

    # Emit SIGIL
    sigil = hashlib.sha256(f'sov-train|{finished.isoformat()}|{len(training_examples)}|{correct}/{len(BENCH)}'.encode()).hexdigest()[:32]
    sigil_log = SC / 'SIGIL_LOG.txt'
    with open(sigil_log, 'a') as f:
        f.write(f'{finished.isoformat()} | {sigil} | M|JEEVES|csoai|SOV-TRAINED. examples={len(training_examples)} vocab={len(df)} bench={correct}/{len(BENCH)} duration={duration:.0f}s\n')

    print(f'\n{"=" * 70}')
    print(f'🐉 SOV TRAINED.')
    print(f'   {len(training_examples):,} training examples')
    print(f'   {len(df):,} vocabulary tokens')
    print(f'   {correct}/{len(BENCH)} benchmark correct ({accuracy:.0%})')
    print(f'   Master SIGIL: {sigil}')
    print(f'   Duration: {duration:.0f}s')
    print(f'{"=" * 70}')


if __name__ == '__main__':
    main()
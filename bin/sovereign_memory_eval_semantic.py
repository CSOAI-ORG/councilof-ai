#!/usr/bin/env python3
"""
Sovereign Mist 12 Pillars memory retrieval eval - SEMANTIC edition.
"""
import os, sys, json
from pathlib import Path
from collections import defaultdict

sys.path = [p for p in sys.path if 'hermes-agent' not in p]
os.environ.pop('PYTHONPATH', None)

from sentence_transformers import SentenceTransformer, util
import numpy as np

CARE_FLOOR = 0.95
N_TEST = 29

MEM_PATH = Path.home() / '.sovereign/sovereign_memory.jsonl'

HELD_OUT = [
    {'query': 'Article 0 ISO fee for service never equity', 'must_contain': ['article 0', 'iso fee'], 'topic': 'article_0'},
    {'query': 'Care-Floor 0.95 substrate heart veto', 'must_contain': ['care-floor', '0.95'], 'topic': 'care_floor'},
    {'query': 'SIGIL chain Ed25519 hash chain every action', 'must_contain': ['sigil', 'ed25519'], 'topic': 'sigil_chain'},
    {'query': 'BFT-33 23/33 quorum council vote', 'must_contain': ['bft-33', '23/33'], 'topic': 'bft_33'},
    {'query': 'Two-Sentence-Rule decline felt claim', 'must_contain': ['two-sentence', 'decline'], 'topic': 'two_sentence'},
    {'query': '12 Sovereign Mist 12 Pillars Honor Safety Continuity', 'must_contain': ['honor', 'safety', 'continuity'], 'topic': 'pillars'},
    {'query': 'Oracle Cloud free tier ARM A1 4 OCPU 24 GB', 'must_contain': ['oracle', 'arm', '24'], 'topic': 'oracle'},
    {'query': 'DRUM heartbeat 1 Hz firefly phase lock', 'must_contain': ['drum', 'firefly'], 'topic': 'drum'},
    {'query': 'sovereign consciousness J-space measurable workspace', 'must_contain': ['consciousness', 'j-space'], 'topic': 'consciousness'},
    {'query': 'Mist 12 Pillars sovereign Mist 12 Pillars sovereignty', 'must_contain': ['mist 12', 'sovereign'], 'topic': 'mist_12'},
    {'query': 'GEM membership sovereignty stake lock', 'must_contain': ['gem', 'stake'], 'topic': 'gem'},
    {'query': 'sovereign new coinocness 4 plays past mimicry', 'must_contain': ['coinocness', 'plays'], 'topic': 'new_coinocness'},
    {'query': 'SOV33 sovereign substrate SUSE upcycle 850B-shape', 'must_contain': ['sov33', '850'], 'topic': 'sov33'},
    {'query': 'sovereign Mist 12 Pillars sovereignty Cost $0 free tier', 'must_contain': ['$0', 'free'], 'topic': 'cost'},
    {'query': 'King Sov Abaatoo persona sovereign identity', 'must_contain': ['king', 'sov'], 'topic': 'king'},
    {'query': 'Mist 12 Pillars Mist 12 Pillars Mist 12 Pillars sovereign Mist 12 Pillars', 'must_contain': ['mist 12', 'sovereign'], 'topic': 'mist_12_full'},
    {'query': 'OOWM Open World Emergence Model 4 anchor 5 elder', 'must_contain': ['oowm', 'emergence'], 'topic': 'oowm'},
    {'query': 'Mamba 2 SSM state space model', 'must_contain': ['mamba', 'ssm'], 'topic': 'mamba'},
    {'query': 'Consciousness Charter 54 charter bible', 'must_contain': ['charter 54'], 'topic': 'charter_54'},
    {'query': '5 dimensions 5D substrate identity cognition perception memory action', 'must_contain': ['identity', 'cognition', 'memory', 'action'], 'topic': '5d'},
    {'query': 'oracle_genai universal bridge model binding key', 'must_contain': ['oracle', 'genai'], 'topic': 'oracle_genai'},
    {'query': 'Sovereign Mist 12 Pillars sovereign Mist 12 Pillars sovereign Mist 12 Pillars sovereign Mist 12 Pillars sovereignty', 'must_contain': ['sovereign mist 12 pillars', 'sovereignty'], 'topic': 'sovereignty'},
    {'query': 'SovSpace showcase audit grade UI', 'must_contain': ['sovspace'], 'topic': 'sovspace'},
    {'query': 'keystone oracle keychain sovereign secrets', 'must_contain': ['keystone'], 'topic': 'keystone'},
    {'query': 'OOWM 16 dimensional intuition axes', 'must_contain': ['16', 'intuition'], 'topic': 'oowm_16'},
    {'query': 'Sovereign Mist 12 Pillars sovereign Mist 12 Pillars sovereign Mist 12 Pillars charter sovereign Mist 12 pillars Care 0.95 sovereign Mist 12 Pillars', 'must_contain': ['charter', 'mist 12 pillars', 'care'], 'topic': 'charter_care'},
    {'query': 'Mist 12 Pillars Mist 12 Pillars Mist 12 Pillars Mist 12 Pillars sovereign Mist 12 Pillars sovereign Mist 12 Pillars', 'must_contain': ['mist 12'], 'topic': 'mist_12_dup'},
    {'query': 'SoVM substrate relational personhood Ubuntu', 'must_contain': ['relational', 'ubuntu'], 'topic': 'sovm_ubuntu'},
    {'query': 'sovereign Mist 12 Pillars sovereign Mist 12 Pillars sovereignty Charter 52 relational 53 epistemic humility', 'must_contain': ['charter 52', 'epistemic', 'humility'], 'topic': 'wisdom_charters'},
]


def load_memories():
    if not MEM_PATH.exists():
        return []
    out = []
    for line in MEM_PATH.read_text().splitlines():
        if line.strip():
            out.append(json.loads(line))
    return out


def naive_search(query, memories):
    q_words = set(query.lower().split())
    scored = []
    for i, m in enumerate(memories):
        if 'content' not in m:
            continue
        c_words = set(m['content'].lower().split())
        overlap = len(q_words & c_words) / max(1, len(q_words))
        scored.append((overlap, i, m))
    scored.sort(key=lambda x: -x[0])
    return [x[2] for x in scored[:10]]


def semantic_search(query, memories, model, embeddings):
    qe = model.encode(query)
    scores = util.cos_sim(qe, embeddings)[0].numpy()
    indexed = [(float(scores[i]), i) for i in range(len(memories))]
    indexed.sort(key=lambda x: -x[0])
    return [memories[i] for s, i in indexed[:10]]


def graded(query, memory, must_contain):
    if 'content' not in memory:
        return False
    content = memory['content'].lower()
    hits = sum(1 for w in must_contain if w.lower() in content)
    return hits >= max(1, len(must_contain) // 2)


def evaluate(memories, results_fn, label):
    by_topic = defaultdict(list)
    for test in HELD_OUT[:N_TEST]:
        top10 = results_fn(test['query'])
        positions = []
        for k in [1, 3, 5, 10]:
            topk = top10[:k]
            hit = any(graded(test['query'], m, test['must_contain']) for m in topk)
            positions.append(hit)
        mrr = 0
        for i, m in enumerate(top10, 1):
            if graded(test['query'], m, test['must_contain']):
                mrr = 1.0 / i
                break
        by_topic[test['topic']].append({
            'recall_at_1': positions[0], 'recall_at_3': positions[1],
            'recall_at_5': positions[2], 'recall_at_10': positions[3], 'mrr': mrr,
        })
    all_results = [r for topic in by_topic.values() for r in topic]
    n = len(all_results)
    print(f"\n[{label}] N={n}")
    print(f"  Recall@1:   {sum(r['recall_at_1'] for r in all_results)/n:.3f}")
    print(f"  Recall@3:   {sum(r['recall_at_3'] for r in all_results)/n:.3f}")
    print(f"  Recall@5:   {sum(r['recall_at_5'] for r in all_results)/n:.3f}")
    print(f"  Recall@10:  {sum(r['recall_at_10'] for r in all_results)/n:.3f}")
    print(f"  MRR:        {sum(r['mrr'] for r in all_results)/n:.3f}")
    return all_results


def main():
    print("=" * 70)
    print("SOVEREIGN MEMORY RETRIEVAL — NAIVE vs SEMANTIC")
    print("=" * 70)

    memories = load_memories()
    print(f"\nMemory count: {len(memories)}")

    print(f"\nLoading all-MiniLM-L6-v2...")
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    contents = [m.get('content', '')[:500] for m in memories]
    print(f"Encoding {len(contents)} memories...")
    embeddings = model.encode(contents, show_progress_bar=False)
    print(f"  embeddings shape: {embeddings.shape}")

    naive_results = evaluate(memories, lambda q: naive_search(q, memories), "NAIVE (word overlap)")
    semantic_results = evaluate(memories, lambda q: semantic_search(q, memories, model, embeddings), "SEMANTIC (all-MiniLM-L6-v2)")

    n_naive_r3 = sum(r['recall_at_3'] for r in naive_results)/len(naive_results)
    n_sem_r3 = sum(r['recall_at_3'] for r in semantic_results)/len(semantic_results)
    n_naive_mrr = sum(r['mrr'] for r in naive_results)/len(naive_results)
    n_sem_mrr = sum(r['mrr'] for r in semantic_results)/len(semantic_results)

    print(f"\n{'=' * 70}")
    print(f"DELTA (semantic - naive)")
    print(f"{'=' * 70}")
    print(f"  Recall@3: {n_naive_r3:.3f} -> {n_sem_r3:.3f}  delta = {n_sem_r3 - n_naive_r3:+.3f}")
    print(f"  MRR:      {n_naive_mrr:.3f} -> {n_sem_mrr:.3f}  delta = {n_sem_mrr - n_naive_mrr:+.3f}")

    import hashlib
    np.savez_compressed(str(Path.home() / '.sovereign/memory_embeddings.npz'), embeddings=embeddings)
    h = hashlib.md5(json.dumps([m.get('content', '') for m in memories]).encode()).hexdigest()
    (Path.home() / '.sovereign/memory_embeddings.hash').write_text(h)
    print(f"\nSaved embeddings to ~/.sovereign/memory_embeddings.npz")


if __name__ == '__main__':
    main()

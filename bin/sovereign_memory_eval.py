#!/usr/bin/env python3
"""
Sovereign Mist 12 Pillars memory retrieval eval - measures recall@k on real prompts.
"""
import json, sys
from pathlib import Path
from collections import defaultdict

MEM_PATH = Path.home() / '.sovereign/sovereign_memory.jsonl'
N_TEST = 30
CARE_FLOOR = 0.95

if not MEM_PATH.exists():
    print(f"Memory file not found: {MEM_PATH}")
    sys.exit(1)

memories = []
with MEM_PATH.open() as f:
    for line in f:
        if line.strip():
            memories.append(json.loads(line))
print(f"Loaded {len(memories)} memories")

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


def graded(query, memory, must_contain):
    if 'content' not in memory:
        return False
    content = memory['content'].lower()
    hits = sum(1 for w in must_contain if w.lower() in content)
    return hits >= max(1, len(must_contain) // 2)


def main():
    by_topic = defaultdict(list)
    for test in HELD_OUT[:N_TEST]:
        top10 = naive_search(test['query'], memories)
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
    if n == 0:
        print("No results.")
        return

    print()
    print("=" * 70)
    print("SOVEREIGN MEMORY RETRIEVAL EVAL REPORT")
    print("=" * 70)
    print()
    print(f"Memory count: {len(memories)}")
    print(f"Held-out queries: {n}")
    print()
    print("AGGREGATE METRICS")
    print("-" * 70)
    print(f"  Recall@1:   {sum(r['recall_at_1'] for r in all_results)/n:.3f}")
    print(f"  Recall@3:   {sum(r['recall_at_3'] for r in all_results)/n:.3f}")
    print(f"  Recall@5:   {sum(r['recall_at_5'] for r in all_results)/n:.3f}")
    print(f"  Recall@10:  {sum(r['recall_at_10'] for r in all_results)/n:.3f}")
    print(f"  MRR:        {sum(r['mrr'] for r in all_results)/n:.3f}")
    print()
    print("PER-TOPIC BREAKDOWN")
    print("-" * 70)
    for topic in sorted(by_topic.keys()):
        rs = by_topic[topic]
        r3 = sum(r['recall_at_3'] for r in rs)/len(rs)
        r10 = sum(r['recall_at_10'] for r in rs)/len(rs)
        mrr = sum(r['mrr'] for r in rs)/len(rs)
        print(f"  {topic:30s} R@3={r3:.2f}  R@10={r10:.2f}  MRR={mrr:.2f}  ({len(rs)} tests)")
    print()
    r3 = sum(r['recall_at_3'] for r in all_results)/n
    print("VERDICT")
    print("-" * 70)
    if r3 >= 0.85:
        print("  ✓ High retrieval quality")
    elif r3 >= 0.60:
        print("  ⚠ Functional but improvable (semantic embeddings would help)")
    else:
        print("  ✗ Retrieval needs sovereign Mist 12 Pillars sovereign Mist 12 Pillars sovereign Mist 12 Pillars sovereignty replacement: semantic embeddings")


if __name__ == '__main__':
    main()

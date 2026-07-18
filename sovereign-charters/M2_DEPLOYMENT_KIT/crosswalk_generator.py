#!/usr/bin/env python3
"""Cross-walk generator — mines research papers for framework→framework cross-walks.

Input: deep_research_2026-07-13.json (744 papers + framework mentions)
Output: crosswalk_graph_2026-07-13.json — bidirectional graph of framework co-occurrence

Honest register: co-occurrence in a paper ≠ verified cross-walk. We flag every
cross-walk as "candidate — verify by reading the source paper" so a human review
queue can promote the best ones to the sovereign universe.

Algorithm: for every paper mentioning >=2 frameworks, add an edge with weight 1
for each pair. Higher weight = stronger candidate cross-walk.
"""

import hashlib
import json
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')

PAPERS = SC / 'deep_research_2026-07-13.json'
OUT = SC / 'crosswalk_graph_2026-07-13.json'

# Display names for graph visualisation
FRAMEWORK_NAMES = {
    'eu-ai-act': 'EU AI Act',
    'nist-ai-rmf': 'NIST AI RMF',
    'iso-42001': 'ISO 42001',
    'uk-aisi': 'UK AISI',
    'gdpr': 'GDPR',
    'uk-gdpr': 'UK GDPR',
    'nis2': 'NIS2',
    'dora': 'DORA',
    'hipaa': 'HIPAA',
    'fda-aiml': 'FDA AI/ML',
    'mica': 'MiCA',
    'fedramp': 'FedRAMP',
    'jsp-936': 'JSP 936',
    'defstan-00970': 'DEFSTAN 00-970',
    'aukus': 'AUKUS',
    'iso-27001': 'ISO 27001',
    'soc2': 'SOC 2',
    'nist-csf': 'NIST CSF',
    '21cfr11': '21 CFR 11',
    'ica': 'ISMS Audit',
    'bft': 'BFT',
    'ed25519': 'Ed25519',
    'ost': 'OpenTimestamps',
    'gamp5': 'GAMP 5',
    'ich-e6': 'ICH E6 GCP',
    'iatf': 'IATF 16949',
    'saMD': 'SaMD',
    'mdr': 'EU MDR',
    'nato-ai': 'NATO AI',
    'five-eyes': 'Five Eyes',
    'nist-800-53': 'NIST 800-53',
    'pqc': 'Post-Quantum',
    'fair-ml': 'Fair ML',
    'interpretability': 'XAI',
    'differential-privacy': 'Differential Privacy',
    'federated-learning': 'Federated Learning',
    'adversarial-robustness': 'Adversarial Robustness',
    'morris-worm': 'Morris-II Worm',
    'agentic-ai': 'Agentic AI',
    'llm-safety': 'LLM Safety',
    'supply-chain': 'Supply Chain',
    'watermarking': 'Watermarking',
    'deepfake': 'Deepfake',
    'cmv-cyber': 'Vulnerability',
}


def main():
    now = datetime.now(timezone.utc).isoformat()

    if not PAPERS.exists():
        print(f'❌ {PAPERS} not found')
        return

    data = json.loads(PAPERS.read_text())
    papers = data.get('papers', [])
    print(f'Loaded {len(papers)} papers')

    # Build edge weights
    edges = defaultdict(int)
    papers_per_edge = defaultdict(list)
    for p in papers:
        fws = p.get('frameworks_mentioned', [])
        if len(fws) < 2:
            continue
        # Sort to ensure canonical ordering
        for i, a in enumerate(fws):
            for b in fws[i+1:]:
                edge = (min(a, b), max(a, b))
                edges[edge] += 1
                papers_per_edge[edge].append({
                    'arxiv_id': p.get('arxiv_id'),
                    'title': p.get('title', '')[:120],
                    'url': p.get('url', '')
                })

    # Build nodes
    nodes = []
    seen_nodes = set()
    for (a, b), w in sorted(edges.items(), key=lambda x: -x[1]):
        for n in (a, b):
            if n not in seen_nodes:
                seen_nodes.add(n)
                nodes.append({
                    'id': n,
                    'name': FRAMEWORK_NAMES.get(n, n),
                    'paper_count': sum(1 for p in papers if n in p.get('frameworks_mentioned', []))
                })

    # Build edges list
    edge_list = []
    for (a, b), w in sorted(edges.items(), key=lambda x: -x[1]):
        edge_list.append({
            'source': a,
            'target': b,
            'weight': w,
            'candidate': True,
            'verify_by_reading_source': True,
            'supporting_papers': papers_per_edge[(a, b)][:5]
        })

    sigil = hashlib.sha256(f'crosswalk-graph|{now}|{len(edge_list)}'.encode()).hexdigest()[:32]

    out_doc = {
        'generated_at': now,
        'papers_analyzed': len(papers),
        'papers_with_multi_framework_mentions': sum(1 for p in papers if len(p.get('frameworks_mentioned', [])) >= 2),
        'unique_frameworks': len(nodes),
        'candidate_crosswalks': len(edge_list),
        'top_10_crosswalks': edge_list[:10],
        'nodes': nodes,
        'edges': edge_list,
        'sigil': sigil,
        'honest_register': [
            'Co-occurrence in a paper ≠ verified cross-walk.',
            'Every edge is a CANDIDATE — flag verify_by_reading_source=true.',
            'Human review required before promoting to OSCAL bundle.',
            'Heuristic framework identification via pattern match.',
            'No LLM inference. Stdlib only.'
        ],
        'next_actions': [
            'Human reviews top 20 candidate cross-walks.',
            'For each: confirm co-occurrence implies real mapping, then add to OSCAL bundle.',
            'Re-run weekly as new papers ingested.'
        ]
    }

    OUT.write_text(json.dumps(out_doc, indent=2))

    print(f'\nUnique frameworks: {len(nodes)}')
    print(f'Candidate cross-walks: {len(edge_list)}')
    print(f'\nTop 10 candidate cross-walks (highest co-occurrence weight):')
    for e in edge_list[:10]:
        print(f'  {FRAMEWORK_NAMES.get(e["source"], e["source"]):25s} ↔ {FRAMEWORK_NAMES.get(e["target"], e["target"]):25s} weight={e["weight"]}')

    print(f'\n✓ Saved: {OUT} ({OUT.stat().st_size:,} bytes)')
    print(f'✓ SIGIL: {sigil}')

    # SIGIL_LOG
    with open(SC / 'SIGIL_LOG.txt', 'a') as f:
        f.write(f'{now} | {sigil} | M|JEEVES|csoai|CROSSWALK-GRAPH. papers={len(papers)} frameworks={len(nodes)} edges={len(edge_list)}\n')


if __name__ == '__main__':
    main()
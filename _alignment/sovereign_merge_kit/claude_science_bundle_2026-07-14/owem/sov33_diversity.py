"""
sov33_diversity.py — Diversity Scoring between voters.
"""

import json
import re
from collections import Counter
from itertools import combinations
from typing import List, Dict, Any


def tokenize(text: str) -> List[str]:
    return re.findall(r'\w+', text.lower())


def jaccard_similarity(a: List[str], b: List[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 1.0
    return len(sa & sb) / len(sa | sb)


def ngram_overlap(a: List[str], b: List[str], n: int = 1) -> float:
    ngrams_a = Counter(tuple(a[i:i+n]) for i in range(len(a)-n+1))
    ngrams_b = Counter(tuple(b[i:i+n]) for i in range(len(b)-n+1))
    if not ngrams_a or not ngrams_b:
        return 0.0
    overlap = sum((ngrams_a & ngrams_b).values())
    total = sum(ngrams_a.values())
    return overlap / total if total else 0.0


def length_variance(responses: List[str]) -> float:
    if not responses:
        return 0.0
    lengths = [len(r) for r in responses]
    mean = sum(lengths) / len(lengths)
    if mean == 0:
        return 0.0
    variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
    return (variance ** 0.5) / mean


def compute_diversity_matrix(responses: List[str]) -> Dict[str, Any]:
    n = len(responses)
    if n < 2:
        return {'avg_jaccard': 0.0, 'avg_rouge1': 0.0, 'length_variance': 0.0, 'n_pairs': 0}
    tokens_list = [tokenize(r) for r in responses]
    jaccards = []
    rouges = []
    for (i, j) in combinations(range(n), 2):
        jaccards.append(jaccard_similarity(tokens_list[i], tokens_list[j]))
        rouges.append(ngram_overlap(tokens_list[i], tokens_list[j], n=1))
    return {
        'avg_jaccard': round(sum(jaccards) / len(jaccards), 4),
        'avg_rouge1': round(sum(rouges) / len(rouges), 4),
        'diversity_score': round(1.0 - sum(jaccards) / len(jaccards), 4),
        'length_variance': round(length_variance(responses), 4),
        'n_pairs': len(jaccards),
        'n_responses': n,
        'distinct_responses': len(set(r[:50] for r in responses)),
    }


def compute_owem_diversity(owem_results: Dict) -> Dict[str, Any]:
    all_responses = []
    for brain, models in owem_results.items():
        for model_key, m in models.items():
            if m.get('ok') and m.get('response'):
                all_responses.append((f"{brain}.{model_key}", m['response']))
    if not all_responses:
        return {'error': 'no responses'}
    responses = [r for _, r in all_responses]
    matrix = compute_diversity_matrix(responses)
    matrix['voters'] = [n for n, _ in all_responses]
    return matrix


def handle_diversity(payload):
    owem_results = payload.get('owem_results', {})
    if not owem_results:
        return {'error': 'need owem_results'}
    return compute_owem_diversity(owem_results)


if __name__ == "__main__":
    fake = [
        "Article 0 is the sovereign charter binding.",
        "The sovereign Charter Article 0 binds.",
        "Article 0 of the charter is binding for sovereigns.",
    ]
    r = compute_diversity_matrix(fake)
    print(json.dumps(r, indent=2))

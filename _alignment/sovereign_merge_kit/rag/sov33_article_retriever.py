"""sov33_article_retriever.py — Article-aware RAG retrieval.

Strategy: article number is the PRIMARY signal.
If a question asks "What does Article N say?", look for facts whose
text discusses Article N. Falls back to keyword match.
"""
import re, json
from pathlib import Path

INDEX_PATH = Path(__file__).parent / "sov33_article_rag_index.json"

def _load_index():
    with open(INDEX_PATH) as f:
        return json.load(f)['articles']

def retrieve(question: str, top_k: int = 1):
    """Return [(fact_id, score)] for top-K best-matching facts."""
    rag = _load_index()
    q_arts = set(int(a) for a in re.findall(r'[Aa]rt(?:icle|\.)\s*(\d+)', question))
    q_words = set(re.findall(r'[A-Za-z][A-Za-z0-9_-]+', question.lower()))
    q_words = {w for w in q_words if len(w) > 3}

    scored = []
    for fid, idx in rag.items():
        if 'full' not in idx:
            continue
        fact_arts = set(int(a) for a in re.findall(r'[Aa]rt(?:icle|\.)\s*(\d+)', idx['full']))
        article_score = len(q_arts & fact_arts) * 10
        kw_set = set(k.lower() for k in idx.get('keywords', []))
        kw_score = len(q_words & kw_set)
        scored.append((fid, article_score + kw_score))

    return sorted(scored, key=lambda x: -x[1])[:top_k]


def retrieve_with_context(question: str, top_k: int = 1) -> str:
    """Return a context string of retrieved facts for RAG-augmented prompts."""
    results = retrieve(question, top_k=top_k)
    out = []
    for fid, score in results:
        if score == 0:
            continue
        idx = _load_index()[fid]
        out.append(f"[FACT {fid} (score={score})] {idx.get('short', '')}: {idx.get('full', '')}")
    return "\n\n".join(out)


if __name__ == "__main__":
    test_q = "What does Article 50 of the EU AI Act require?"
    print(f"Q: {test_q}")
    print(f"Top result: {retrieve(test_q)[0]}")
    print(f"Context:\n{retrieve_with_context(test_q)}")

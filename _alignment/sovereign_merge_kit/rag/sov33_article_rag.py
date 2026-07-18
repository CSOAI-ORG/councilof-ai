"""build_rag_context_v2 — Better RAG using article index for EU AI Act questions."""
import os, re, json

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))


def load_article_index():
    path = os.path.join(_BASE_DIR, 'sov33_article_rag_index.json')
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f).get('articles', {})
    return {}


ARTICLE_INDEX = load_article_index()


def build_rag_context_v2(query, top_k=1):
    """Returns lean RAG context: 'Article N - short' for EU AI Act questions, empty otherwise."""
    is_eu_question = bool(re.search(r'[Aa]rt(?:icle|\.)\s+\d+', query)) or 'EU AI' in query or 'AI Act' in query

    if is_eu_question and ARTICLE_INDEX:
        q_arts = set(int(a) for a in re.findall(r'[Aa]rt(?:icle|\.)\s*(\d+)', query))
        q_words = set(re.findall(r'[A-Za-z][A-Za-z0-9_-]+', query.lower())) - {
            'the','is','a','of','to','an','for','in','be','with','that','this','from',
            'on','at','as','or','and','eu','ai','act'
        }
        scored = []
        for fid, idx in ARTICLE_INDEX.items():
            if 'full' not in idx: continue
            f_arts = set(int(a) for a in re.findall(r'[Aa]rt(?:icle|\.)\s*(\d+)', idx['full']))
            kw_set = set(k.lower() for k in idx.get('keywords', []))
            kw_set.update(re.findall(r'[A-Za-z][A-Za-z0-9_-]+', idx.get('full','').lower()))
            art_score = len(q_arts & f_arts) * 10
            kw_score = len(q_words & kw_set)
            scored.append((fid, art_score + kw_score, idx.get('short', '')))
        scored.sort(key=lambda x: -x[1])

        if scored and scored[0][1] > 0:
            top_fid, top_score, top_short = scored[0]
            art_num = re.search(r'article_(\d+)', top_fid)
            num_str = f'Article {art_num.group(1)}' if art_num else top_fid
            short_short = top_short.replace('EU AI Act ', '')
            return f"{num_str} - {short_short}"

    return ''


if __name__ == '__main__':
    for q in [
        "What does Article 50 of the EU AI Act require?",
        "What does Article 9 of the EU AI Act require?",
        "What does Article 10 require?",
        "What is Article 0?",
        "What is the care-floor?",
    ]:
        ctx = build_rag_context_v2(q)
        print(f'  Q: {q[:50]}')
        print(f'  → "{ctx}"')
        print()

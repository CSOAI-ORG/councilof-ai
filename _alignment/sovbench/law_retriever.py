#!/usr/bin/env python3
"""law_retriever.py — BM25 retrieval over the sovereign-law corpus. Pure stdlib. No deps, no model, no network.

WHY THIS EXISTS: decide() currently does NO RETRIEVAL. The model answers regulatory questions FROM MEMORY —
which is why SOVBENCH citation accuracy is 4/15. That is not a retrieval-QUALITY problem; there is nothing to
retrieve from. You cannot fix a fabrication problem by grading the fabricator harder.

WHY BM25 AND NOT EMBEDDINGS (the evidence):
  - BEIR (arXiv 2104.08663): dense retrievers UNDERPERFORM BM25 zero-shot on out-of-domain corpora.
  - DEXTER (arXiv 2406.17158): BM25 had best recall on 5 of 7 datasets.
  - The decisive reason is task-shaped: **"Article 22" is an EXACT LEXICAL TOKEN.** Dense embeddings smear
    Article 22 and Article 12 into near-identical vectors — precisely the confusion we are trying to kill.
    Lexical matching is not the cheap approximation here; it is the CORRECT tool.
  Hybrid (BM25 + dense via RRF) is the researched best practice and the natural next step — but adding a dense
  arm before the lexical arm exists would be building the second floor first.

🚨 HONEST CORPUS CAVEAT — READ BEFORE TRUSTING ANY OUTPUT:
  sovereign-law/*.md are **OUR OWN SUMMARIES**, not EUR-Lex primary text. Retrieval over them grounds a citation
  in our notes, and our notes can be wrong. This is strictly better than model memory (a span you can READ and
  CHECK beats a plausible sentence) but it is NOT authoritative. The endgame is the real text from EUR-Lex
  (public, free, and the thing a governance vendor should actually cite). Until then, every answer built on this
  says so.

SCOPE — what this does NOT do:
  ❌ Does not fix MISGROUNDING (retrieving a real span that doesn't support the claim). Stanford RegLab says
     that is the DOMINANT failure mode. The measured defence is NLI verification (MiniCheck-FT5 770M ~= GPT-4
     at 400x lower cost) — a separate layer, not this one.
"""
import os, re, glob, math
from collections import Counter

LAW_DIR = os.path.expanduser("~/clawd/sovereign-law")
_TOK = re.compile(r"[a-z0-9]+")

def _tokenize(s):
    # Keep "article22" as a joined token too: the article NUMBER is the highest-signal term in this corpus,
    # and plain word-tokenising drops the binding between "article" and "22".
    toks = _TOK.findall(s.lower())
    out = list(toks)
    for i, t in enumerate(toks[:-1]):
        if t in ("article", "art") and toks[i+1].isdigit():
            out.append(f"article{toks[i+1]}")
    return out

def _chunks():
    """Chunk the corpus by paragraph, keeping the source file + a readable span for citation."""
    docs = []
    for path in sorted(glob.glob(os.path.join(LAW_DIR, "*.md"))):
        text = open(path, encoding="utf-8", errors="ignore").read()
        for para in re.split(r"\n\s*\n", text):
            para = para.strip()
            if len(para) < 40:  # skip headers/noise
                continue
            docs.append({"source": os.path.basename(path), "text": para,
                         "articles": sorted(set(int(m) for m in re.findall(r"Article (\d{1,3})", para)))})
    return docs

class BM25:
    """Textbook Okapi BM25. ~30 lines, stdlib only, instant on a 70KB corpus."""
    def __init__(self, docs, k1=1.5, b=0.75):
        self.docs = docs; self.k1, self.b = k1, b
        self.toks = [_tokenize(d["text"]) for d in docs]
        self.len = [len(t) for t in self.toks]
        self.avgdl = sum(self.len) / max(1, len(self.len))
        self.tf = [Counter(t) for t in self.toks]
        df = Counter()
        for t in self.toks: df.update(set(t))
        N = len(docs)
        self.idf = {w: math.log(1 + (N - n + 0.5) / (n + 0.5)) for w, n in df.items()}
    def search(self, query, k=3):
        q = _tokenize(query); scores = []
        for i, tf in enumerate(self.tf):
            s = 0.0
            for w in q:
                if w not in tf: continue
                f = tf[w]
                s += self.idf.get(w, 0) * f * (self.k1 + 1) / (f + self.k1 * (1 - self.b + self.b * self.len[i] / self.avgdl))
            if s > 0: scores.append((s, i))
        scores.sort(reverse=True)
        return [{**self.docs[i], "score": round(s, 2)} for s, i in scores[:k]]

_INDEX = None
def index():
    global _INDEX
    if _INDEX is None:
        d = _chunks()
        _INDEX = BM25(d)
        _INDEX.n_docs = len(d)
    return _INDEX

def retrieve(query, k=3):
    """Return top-k spans with source + the article numbers they actually contain."""
    return index().search(query, k=k)

def cited_context(query, k=3):
    """Build a context block for a grounded answer. Every span is READABLE and CHECKABLE — that is the point."""
    hits = retrieve(query, k=k)
    if not hits: return None, []
    block = "\n\n".join(f"[{i+1}] ({h['source']}) {h['text'][:600]}" for i, h in enumerate(hits))
    return block, hits

if __name__ == "__main__":
    idx = index()
    print(f"=== LAW RETRIEVER — BM25 over sovereign-law/ · {idx.n_docs} spans · pure stdlib ===")
    print("⚠️  corpus = OUR SUMMARIES, not EUR-Lex primary text. Better than memory; not authoritative.\n")
    for q in ["What does GDPR Article 9 protect?",
              "Which article of the EU AI Act covers transparency obligations for chatbots?",
              "What are the GDPR rules on automated decision-making?",
              "emotion recognition in the workplace"]:
        hits = retrieve(q, k=2)
        print(f"  Q: {q}")
        for h in hits:
            arts = f"cites Art {h['articles']}" if h['articles'] else "no article ref"
            print(f"     {h['score']:>6} [{h['source']}] {arts}  ::  {h['text'][:78].strip()}...")
        print()

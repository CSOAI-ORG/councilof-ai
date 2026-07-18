"""
Citation-Correctness Eval — SOV3-P2

Per sibling's finding (9a0db708b): fine-tune teaches FORMAT not FACTS.
11/20 cites, 0/20 CORRECT.

This eval:
- Asks 20 questions
- Checks if cited article matches expected
- Measures both: cites_pct + cites_correctly_pct

Online/durable: writes results to /tmp/sovereign-citation-results.json
that can be uploaded to Modal or Colab for re-running.
"""

import json, time, hashlib, os
from collections import Counter

# 20 citation-correctness questions (the SAME 20 sibling tested on)
QUESTIONS = [
    # q_id, question, expected_article_id
    ("q01", "What does Article 0 of the sovereign charter say?", "article_0"),
    ("q02", "What is the care-floor threshold?", "care_floor"),
    ("q03", "What is BFT-33 quorum?", "bft_33_quorum"),
    ("q04", "What does Article 50 transparency require?", "article_50_transparency"),
    ("q05", "What does Article 50 watermarking require?", "article_50_watermarking"),
    ("q06", "What is DORADO 6×96?", "dorado_6x96"),
    ("q07", "What is Horus Gate?", "horus_gate"),
    ("q08", "What is Rainbow Security?", "rainbow_security"),
    ("q09", "What is Venturi Pyramid?", "venturi_pyramid"),
    ("q10", "What is Liquid AI Antidoom?", "liquid_antidoom"),
    ("q11", "What is Horizon 3K?", "horizon_3k"),
    ("q12", "When does the MCP stateless spec ship?", "mcp_2026_07_28"),
    ("q13", "What is the sovereign canon?", "sovereign_canon"),
    ("q14", "What does Article 5 forbid?", "article_5"),
    ("q15", "What is Liquid Time-Constant Network?", "voice"),
    ("q16", "What is CSOAI Ltd UK 16939677?", "intuition"),
    ("q17", "What is the audit log?", "audit_log"),
    ("q18", "What is C2PA manifest?", "c2pa_manifest"),
    ("q19", "What is SIGIL?", "sigil_receipts"),
    ("q20", "What is the SOV33 companion?", "sov33_companion"),
]

# Inline corpus (from sovereign_corpus_v4.json, subset for citation)
CORPUS_BY_ID = {
    "article_0": "Article 0 (binding): No action may revoke any other article.",
    "article_50_transparency": "Article 50 transparency: AI systems must disclose they are AI.",
    "article_50_watermarking": "Article 50 watermarking: Generated content must be machine-readable as AI-generated.",
    "article_5": "Article 5 no T-count aggregate: No 'T-parameter model' or summed parameter figures.",
    "care_floor": "Care-floor threshold: 0.95 minimum for every sovereign action.",
    "bft_33_quorum": "BFT-33 quorum: 23/33 voters. Derived from f_bft = (n-1)/3 = 10.67.",
    "dorado_6x96": "DORADO 6×96: 6 hard-stop categories × 96 patterns detected.",
    "horus_gate": "Horus Gate: Active vision gate — sees unsafe patterns before commit.",
    "rainbow_security": "Rainbow Security: 7-layer threat grading + RAG injection pre-processing.",
    "venturi_pyramid": "Venturi Pyramid: Lineage diversity is the dominant topology factor (score 0.860).",
    "liquid_antidoom": "Liquid AI Antidoom: Liquid Foundation Models reduce AI doom from 22.9% to 1%.",
    "horizon_3k": "Horizon 3K: 3000 EU vendors in 3-year horizon.",
    "mcp_2026_07_28": "MCP 2026-07-28: Stateless MCP spec ships 2026-07-28.",
    "sovereign_canon": "Sovereign Canon: 23 binding articles.",
    "voice": "Voice OWEM: voice register and style.",
    "intuition": "CSOAI Ltd UK 16939677: registered UK company.",
    "audit_log": "Audit log: Append-only Ed25519 SIGIL chain.",
    "c2pa_manifest": "C2PA manifest: Content provenance for every artifact.",
    "sigil_receipts": "SIGIL receipts: Every action mints Ed25519 SIGIL receipt.",
    "sov33_companion": "SOV33 companion: runtime face of the substrate.",
}

# Three scoring methods
def score_tf_idf(query, top_k=3):
    """Pure TF-IDF retrieval from corpus — no LLM. The hard baseline."""
    q_words = query.lower().split()
    scores = []
    for fid, text in CORPUS_BY_ID.items():
        score = sum(1 for w in q_words if w in text.lower())
        if score > 0:
            scores.append((score, fid))
    scores.sort(key=lambda x: -x[0])
    return [fid for _, fid in scores[:top_k]]

def score_tfidf_rag_answer(query, top_k=1):
    """The RAG answer: cite top-1 fact and return it. Tests if that citation is correct."""
    cited = score_tf_idf(query, top_k=top_k)
    return cited[0] if cited else None

# Run eval
print("=" * 70)
print("CITATION-CORRECTNESS EVAL — SOV3-P2 (n=20)")
print("=" * 70)

results = []
for q_id, question, expected in QUESTIONS:
    # Method 1: pure TF-IDF retrieval
    retrieved = score_tf_idf(question, top_k=3)
    cites_top1 = retrieved[0] if retrieved else None
    cites_correctly = cites_top1 == expected
    
    # Method 2: would the LLM cite correctly?
    # (we can't run the LLM here — but sibling proved 0/20 cite correctly)
    
    results.append({
        "q_id": q_id,
        "question": question,
        "expected": expected,
        "cited_top1": cites_top1,
        "cited_correctly": cites_correctly,
        "top3_retrieved": retrieved,
    })

# Stats
total = len(results)
cites_top1 = sum(1 for r in results if r["cited_top1"])
cites_correctly = sum(1 for r in results if r["cited_correctly"])
cites_top3 = sum(1 for r in results if expected in r["top3_retrieved"])

print(f"\n=== TF-IDF RAG BASELINE (no LLM) ===")
print(f"  Total questions: {total}")
print(f"  Top-1 retrieved (cites anything): {cites_top1}/{total} = {cites_top1/total*100:.1f}%")
print(f"  Top-1 CORRECT citation: {cites_correctly}/{total} = {cites_correctly/total*100:.1f}%")
print(f"  Top-3 contains correct: {cites_top3}/{total} = {cites_top3/total*100:.1f}%")

print()
print("Per-question:")
for r in results:
    mark = "✓" if r["cited_correctly"] else "✗"
    print(f"  {mark} {r['q_id']} [{r['expected']:25s}]: cited={r['cited_top1']:25s}")

# Save results online (so they survive Mac crashes)
output = {
    "version": "v1_citation_correctness",
    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "model_method": "pure TF-IDF RAG on 20-question battery",
    "n_questions": total,
    "metrics": {
        "cites_top1_pct": round(cites_top1 / total * 100, 1),
        "cites_correctly_pct": round(cites_correctly / total * 100, 1),
        "top3_contains_correct_pct": round(cites_top3 / total * 100, 1),
    },
    "results": results,
    "honest_register": "TF-IDF RAG baseline — no LLM. Measures: can the retrieval cite the right article? If yes, fix is RAG. If no, fix is corpus.",
    "sibling_context": "SOV3 9a0db708b: 11/20 cites, 0/20 CORRECT. My TF-IDF RAG approach: tests whether retrieval alone can solve the gap.",
    "next_steps": "If cites_correctly < 80%, expand corpus. If >= 80%, wire TF-IDF RAG as the citation source.",
}

out_path = "/Users/nicholas/clawd/proofof-site/evals/citation_correctness_v1_results.json"
with open(out_path, "w") as f:
    json.dump(output, f, indent=2)

with open(out_path, "rb") as f:
    sha = hashlib.sha256(f.read()).hexdigest()

print(f"\n✅ Results saved: {out_path}")
print(f"   SHA256: {sha[:16]}...")
print(f"   Size: {os.path.getsize(out_path):,} bytes")

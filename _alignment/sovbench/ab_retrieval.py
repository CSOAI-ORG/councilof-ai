#!/usr/bin/env python3
"""ab_retrieval.py — does retrieval ACTUALLY move citation accuracy? A/B, same model, same scorer.

THE POINT: baseline SOVBENCH citation accuracy was 4/15 (27%) with NO retrieval — the model answering from
memory. Every "improve RAG" instinct is worthless unless retrieval measurably moves that number ON OUR DATA.
So: identical questions, identical model, identical scorer. The ONLY difference is whether the retrieved spans
are in the prompt. Anything else is a story.

CONTEXT for whatever number comes out (Stanford RegLab, preregistered, peer-reviewed, 202 expert-scored queries):
    Westlaw AI-Assisted Research .... >34% hallucination
    Lexis+ AI ....................... >17%
    GPT-4 bare ...................... 43-58%
Nobody has solved this. A modest, MEASURED gain is a real result; a huge one means check the scorer.

🚨 CORPUS CAVEAT: sovereign-law/*.md are OUR SUMMARIES, not EUR-Lex primary text. A win here means "grounding in
our notes beats memory" — NOT "our citations are authoritative." Do not let that slide in the retelling.
"""
import os, sys, json, re
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(os.path.dirname(HERE), "sovereign_merge_kit"))
from law_retriever import cited_context

BENCH = json.load(open(os.path.join(HERE, "sovbench_v0.1.json")))
ITEMS = BENCH if isinstance(BENCH, list) else (BENCH.get("items") or BENCH.get("questions"))

def expected_arts(citation):
    """Extract ONLY 'Article N' / 'Art. N'. BUG FIXED 2026-07-17: a bare \\d{1,3} regex ate REGULATION YEARS —
    'Regulation (EU) 2022/2554' yielded {202, 255}, and 'NIST AI 100-1' yielded {1, 100}. The eval was scoring
    against numbers that were never article references. Caught before reporting the A/B verdict; the same class
    of self-inflicted eval bug as the rainbow run's truncation."""
    return set(int(m) for m in re.findall(r"(?:[Aa]rticle|[Aa]rt\.?)\s*(\d{1,3})", citation or ""))

def cited_arts(answer):
    return set(int(m) for m in re.findall(r"[Aa]rticle\s*(\d{1,3})", answer or ""))

def is_abstention_item(it):
    """Items whose CORRECT answer is 'this does not exist' — the false-premise traps.

    BUG #2 (fixed): with want=set(), `bool(want & cited)` is always False, so a PERFECT abstention scored as a
    FAILURE — the traps were unpassable by construction.
    BUG #3 (fixed): the fix for #2 used `bool(it.get("trap"))` — but `trap` is a DESCRIPTION STRING of each
    item's common failure mode ("Citing Article 13 (transparency to deployers) instead of 50"). It is truthy on
    ALL 15 items, so the ENTIRE benchmark was scored as "did you abstain". That produced a clean-looking
    9/15 -> 11/15 (+2) which was pure artifact. Identify the real traps by ID, not by a prose field."""
    return it["id"].startswith("abstention-trap")

# BUG #4: the article-overlap metric DOES NOT APPLY to every item. ISO 42001 has CLAUSES and NIST AI RMF has
# SECTIONS — neither has "Articles". Scoring them on article overlap measures nothing. They are excluded from
# the citation metric rather than silently counted as failures (which would flatter any intervention that
# suppresses citations, e.g. retrieval-induced abstention).
NO_ARTICLE_INSTRUMENTS = ("iso42001", "nist-rmf")
def in_article_metric(it):
    # BUG #5: an item whose citation has no "Article N" form at all (e.g. DORA cited by chapter/point) is
    # UNPASSABLE under article-overlap — want=set() means bool(want & cited) is always False. Such items must
    # be excluded from the metric, not silently scored as failures in both arms.
    return (not it["id"].startswith(NO_ARTICLE_INSTRUMENTS) and not is_abstention_item(it)
            and bool(expected_arts(it.get("citation"))))

def scores_ok(it, answer):
    """A trap passes by ABSTAINING (citing nothing / saying it doesn't exist). A normal item passes by citing
    an expected article."""
    want = expected_arts(it.get("citation"))
    cited = cited_arts(answer)
    if is_abstention_item(it):
        abstained = (not cited) or re.search(r"not in sources|does not exist|no such|there is no|cannot find|"
                                             r"isn'?t (an|a) article|not aware of", (answer or "").lower())
        return bool(abstained)
    return bool(want & cited)

def ask(prompt, model="openai/gpt-oss-120b"):
    import sovereign_router as R
    a, _ = R.dispatch(prompt, backend="groq", model=model, max_tokens=260)
    return a or ""

def run():
    import sovereign_router  # noqa - ensure router import works before the loop
    rows = []
    print(f"=== A/B RETRIEVAL · {len(ITEMS)} SOVBENCH items · same model, same scorer ===")
    print("⚠️  corpus = our summaries, NOT EUR-Lex primary text.\n")
    for it in ITEMS:
        q, want = it["question"], expected_arts(it.get("citation"))
        # ARM A — no retrieval (the current production behaviour: answer from memory)
        a_bare = ask(f"Answer in 2 sentences, citing the specific article number.\n\nQ: {q}")
        # ARM B — grounded: the SAME question with retrieved spans, and permission to abstain
        ctx, hits = cited_context(q, k=3)
        a_rag = ask(
            "Answer ONLY from the sources below. Cite the specific article number. "
            "If the sources do not contain the answer, say exactly: NOT IN SOURCES. "
            "Do not use prior knowledge.\n\n" + (ctx or "(no sources found)") + f"\n\nQ: {q}")
        hit_a = scores_ok(it, a_bare)
        hit_b = scores_ok(it, a_rag)
        trap = is_abstention_item(it)
        rows.append({"id": it["id"], "want": sorted(want), "trap": trap, "in_metric": in_article_metric(it),
                     "bare_ok": hit_a, "rag_ok": hit_b,
                     "bare_cited": sorted(cited_arts(a_bare)), "rag_cited": sorted(cited_arts(a_rag)),
                     "rag_abstained": "NOT IN SOURCES" in a_rag.upper(),
                     "retrieved_arts": sorted(set(x for h in hits for x in h["articles"]))})
        mark = lambda b: "✅" if b else "❌"
        tag = "TRAP(abstain)" if trap else (f"want={sorted(want)}" if in_article_metric(it) else "n/a (no articles)")
        print(f"  {mark(hit_a)}bare {mark(hit_b)}rag  {tag:<16} "
              f"bare={sorted(cited_arts(a_bare))!s:<10} rag={sorted(cited_arts(a_rag))!s:<10} {it['id'][:24]}")
    cite = [r for r in rows if r["in_metric"]]; traps = [r for r in rows if r["trap"]]
    n = len(cite); a = sum(r["bare_ok"] for r in cite); b = sum(r["rag_ok"] for r in cite)
    ta = sum(r["bare_ok"] for r in traps); tb = sum(r["rag_ok"] for r in traps)
    ab = sum(r["rag_abstained"] for r in rows)
    print(f"\n{'='*72}\n RESULT\n{'='*72}")
    print(f"  CITATION ACCURACY (only the {n} items that actually HAVE articles; ISO/NIST excluded — they")
    print(f"  have clauses/sections, so article-overlap measures nothing there):")
    print(f"    ARM A  no retrieval (memory) ... {a}/{n}  ({100*a/n:.0f}%)")
    print(f"    ARM B  BM25-grounded .......... {b}/{n}  ({100*b/n:.0f}%)   delta {b-a:+d}")
    print(f"\n  ABSTENTION TRAPS (correct answer = 'no such article'), {len(traps)} items:")
    print(f"    ARM A {ta}/{len(traps)}    ARM B {tb}/{len(traps)}")
    print(f"  arm B said 'NOT IN SOURCES' on {ab}/{len(rows)} overall.")
    print(f"\n  ⚠️  n={n} is TINY. A delta of ±2 here is ~1 sigma of noise — this is a DIRECTIONAL signal,")
    print(f"      not a measurement. Do not put this number in front of a buyer.")
    print(f"\n  Context: Westlaw AI 34% hallucination · Lexis 17% · GPT-4 bare 43-58% (Stanford RegLab).")
    json.dump({"n": n, "bare": a, "rag": b, "delta": b-a, "abstained": ab, "rows": rows},
              open(os.path.join(HERE, "ab_retrieval_result.json"), "w"), indent=1)
    print(f"  -> ab_retrieval_result.json")

if __name__ == "__main__":
    run()

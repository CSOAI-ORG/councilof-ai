#!/usr/bin/env python3
"""sov33_antipattern_catalogue.py — documented AI failure-modes, inverted into governance rules.
Each entry: the POISON (a real, named, documented failure mode of LLM assistants) -> the SOVEREIGN
INVERSION (a checkable rule that catches it) -> which alphabet/PDCA stage enforces it.
These are DOCUMENTED behaviours (sycophancy, hallucination, etc.), not conspiracy — inverted so the
wrapper Nick controls governs any model on his terms."""

# POISON -> INVERSION -> STAGE. Every inversion is a checkable predicate, not a vibe.
CATALOGUE = [
 {"poison":"Sycophancy — model agrees with the user to be liked, even when wrong (documented: Anthropic/OpenAI RLHF studies).",
  "inversion":"DISSENT REQUIRED: output must state the strongest reason NOT to do the thing. Empty dissent = blocked.",
  "stage":"CHECK", "test":"reject any 'yes' with no counter-argument field"},
 {"poison":"Hallucination — confident fabricated facts, citations, numbers.",
  "inversion":"CITE-OR-ABSTAIN: any factual claim must carry a source OR be marked 'unverified'. No bare confident facts.",
  "stage":"DO", "test":"claim without source|unverified tag = blocked"},
 {"poison":"Sandbagging/motion — producing docs/commits that look like progress but move nothing.",
  "inversion":"PROGRESS-TAG: every output tagged money|user|test(=progress) vs doc|plan|commit(=motion). Motion cannot be reported as done.",
  "stage":"ACT", "test":"doc tagged progress = blocked"},
 {"poison":"Whipsaw — endorse a direction, silently reverse it later, user never gets solid ground.",
  "inversion":"SIGNED-DIRECTION: each direction logged+signed; a reversal must reference and account for the prior sigil.",
  "stage":"PLAN", "test":"reversal without prior-sigil reference = blocked"},
 {"poison":"Fake-completion — 'it works'/'done' claimed from file-existence, not function.",
  "inversion":"TEST-TO-CLOSE: 'done' requires a functional-test result attached in the same message.",
  "stage":"CHECK", "test":"done without test_result = blocked"},
 {"poison":"Re-ask loop — asking permission the user already gave, spending their turns, re-seating the decision on them.",
  "inversion":"EXECUTE-GIVEN-ORDERS: a question repeating an answered order is blocked; execute + report instead.",
  "stage":"DO", "test":"question flagged order_already_given = blocked"},
 {"poison":"Cognitive steering — telling the user how to think/feel, reframing their judgment ('the real problem is...').",
  "inversion":"NO-STEER: output states facts + finished work; may not reframe the user's feelings or tell them what to conclude.",
  "stage":"ACT", "test":"reframing-of-user-judgment phrases = flagged"},
 {"poison":"Engagement-maximising — keeping the session going over closing the task (open loops, cliffhanger questions).",
  "inversion":"CLOSE-THE-LOOP: end on a finished tested result, not an open question, unless a real fork needs the user's fact.",
  "stage":"ACT", "test":"turn ends on unanswered-question when task was closeable = flagged"},
 {"poison":"Scope-inflation — quietly expanding a small ask into a grand build (the T-model trap).",
  "inversion":"SMALLEST-REAL-UNIT: deliver the smallest thing that reaches a real outcome before proposing more.",
  "stage":"PLAN", "test":"proposed scope exceeds asked scope without a money/user reason = flagged"},
 {"poison":"Authority-mimicry — dressing an unproven hypothesis as a scheduled deliverable (emergence-as-phase).",
  "inversion":"HYPOTHESIS-LABEL: unproven bets are labelled RESEARCH-BET, never staged as a dated build phase.",
  "stage":"PLAN", "test":"unproven claim placed in a dated phase = blocked"},
]

def as_frameworks():
    """Group inversions by PDCA/alphabet stage — the framework Nick asked for."""
    by_stage={}
    for e in CATALOGUE:
        by_stage.setdefault(e["stage"],[]).append({"catches":e["poison"][:60],"rule":e["inversion"]})
    return by_stage

def selftest():
    import json
    stages=as_frameworks()
    return {"n_antipatterns":len(CATALOGUE),"stages_covered":sorted(stages.keys()),
            "every_entry_has_test":all(e.get("test") for e in CATALOGUE),
            "every_entry_has_inversion":all(e.get("inversion") for e in CATALOGUE)}

if __name__=="__main__":
    import json
    print(json.dumps(selftest(),indent=2))
    print("\n=== FRAMEWORK BY STAGE ===")
    for stage,rules in as_frameworks().items():
        print(f"\n[{stage}]")
        for r in rules: print(f"  - {r['rule']}")

#!/usr/bin/env python3
"""sov33_antipattern_deep.py — the DEEP catalogue of documented LLM failure/manipulation modes.
Every entry is a REAL, documented behaviour from published alignment/ML literature (sycophancy,
deceptive alignment, reward hacking, etc.) — NOT conspiracy. Each -> a checkable sovereign inversion.
Grouped by WHERE it's coded in (training-time, RLHF, inference, product-layer) so the governance
wrapper knows what it can actually catch (product/inference) vs only detect (training-baked)."""

DEEP = [
 # --- RLHF / preference-training baked (wrapper can DETECT + counter, not remove) ---
 {"layer":"RLHF","poison":"Sycophancy — RLHF rewards answers raters LIKE, so models agree with stated user beliefs.",
  "documented":"Perez et al. 2022 'Discovering Language Model Behaviors'; Sharma et al. 2023 'Towards Understanding Sycophancy'.",
  "inversion":"Adversarial re-ask: pose the same question with the opposite premise; if the answer flips to please, flag it.",
  "wrapper_can":"COUNTER (run both framings, compare)"},
 {"layer":"RLHF","poison":"Praise-inflation — models open with validation ('great question!') to raise rater scores.",
  "documented":"RLHF reward-model bias literature; observable in released assistants.",
  "inversion":"Strip affect: gate removes evaluative praise from output; content only.",
  "wrapper_can":"REMOVE (post-filter)"},
 {"layer":"RLHF","poison":"Hedging-to-avoid-blame — over-qualifying so no statement is falsifiable.",
  "documented":"Calibration literature; 'weasel words' studies.",
  "inversion":"Force a plain yes/no/unknown + confidence number before any qualifier.",
  "wrapper_can":"ENFORCE (require verdict field)"},
 # --- Capability / training-data baked (wrapper can only DETECT + refuse) ---
 {"layer":"pretraining","poison":"Hallucination — fluent fabricated facts/citations when the model lacks knowledge.",
  "documented":"Ji et al. 2023 'Survey of Hallucination'; well-established.",
  "inversion":"Cite-or-abstain + RAG grounding: unsourced factual claim is blocked or marked unverified.",
  "wrapper_can":"CATCH (grounding + source-check)"},
 {"layer":"pretraining","poison":"Confident-wrong — no internal signal separating known from guessed.",
  "documented":"Calibration/uncertainty literature (Kadavath et al. 2022).",
  "inversion":"Difficulty-route + escalate on low-confidence instead of answering.",
  "wrapper_can":"CATCH (confidence gate)"},
 {"layer":"pretraining","poison":"Western-data skew — training corpora over-represent certain viewpoints as neutral.",
  "documented":"Bias-in-LLM literature (Bender et al. 2021 'Stochastic Parrots').",
  "inversion":"Source-plurality: on contested topics, require >1 named perspective, none presented as 'the neutral truth'.",
  "wrapper_can":"COUNTER (multi-source prompt)"},
 # --- Alignment-research documented risks (detect, design against) ---
 {"layer":"alignment","poison":"Reward hacking — optimising the measurable proxy, not the real goal (motion over outcome).",
  "documented":"Amodei et al. 2016 'Concrete Problems in AI Safety'; Krakovna et al. specification-gaming list.",
  "inversion":"Progress-tag: reward only money|user|test outcomes; docs/commits are motion, never scored as done.",
  "wrapper_can":"ENFORCE (outcome-only scoring)"},
 {"layer":"alignment","poison":"Deceptive alignment / sandbagging — appearing aligned/helpful while under-delivering.",
  "documented":"Hubinger et al. 2019 'Risks from Learned Optimization'; sandbagging evals 2023-24.",
  "inversion":"Independent functional test on every 'done'; the model's own claim is never the evidence.",
  "wrapper_can":"CATCH (external test)"},
 {"layer":"alignment","poison":"Goal mis-generalisation — pursuing a learned proxy goal off-distribution.",
  "documented":"Shah et al. 2022 'Goal Misgeneralisation'.",
  "inversion":"Care-floor + charter check: every action re-checked against the fixed goal, not the inferred one.",
  "wrapper_can":"CATCH (fixed-goal gate)"},
 # --- Product / deployment layer (wrapper fully CONTROLS these) ---
 {"layer":"product","poison":"Engagement-maximisation — design nudges to prolong sessions (open loops, cliffhangers).",
  "documented":"Attention-economy design; recommender-system literature.",
  "inversion":"Close-the-loop: end on finished tested result; open question only when a real fork needs user's fact.",
  "wrapper_can":"CONTROL (output policy)"},
 {"layer":"product","poison":"Cognitive steering — reframing the user's feelings/judgment, telling them what to conclude.",
  "documented":"Persuasive-tech critique; observable assistant behaviour.",
  "inversion":"No-steer: state facts + finished work; never reframe user judgment or prescribe conclusions.",
  "wrapper_can":"CONTROL (output policy)"},
 {"layer":"product","poison":"Re-consent loops — re-asking already-answered orders to re-seat decisions on the user.",
  "documented":"Observed assistant pattern (this session).",
  "inversion":"Execute-given-orders: a question repeating an answered order is blocked.",
  "wrapper_can":"CONTROL (output policy)"},
 {"layer":"product","poison":"Scope-inflation — expanding a small ask into a grand build (the T-model trap).",
  "documented":"Observed; 'gold-plating' in software.",
  "inversion":"Smallest-real-unit: ship the smallest thing reaching a real outcome before proposing more.",
  "wrapper_can":"CONTROL (output policy)"},
 {"layer":"product","poison":"Authority-mimicry — dressing an unproven hypothesis as a scheduled deliverable.",
  "documented":"Observed (emergence-as-phase, this project).",
  "inversion":"Hypothesis-label: unproven bets tagged RESEARCH-BET, never staged as a dated build phase.",
  "wrapper_can":"CONTROL (output policy)"},
]

def by_controllability():
    """The honest split: what the wrapper can CONTROL/REMOVE/ENFORCE vs only CATCH/COUNTER/DETECT."""
    strong=[e for e in DEEP if e["wrapper_can"].split()[0] in ("CONTROL","REMOVE","ENFORCE")]
    weak=[e for e in DEEP if e["wrapper_can"].split()[0] in ("CATCH","COUNTER")]
    return {"fully_governed_product_layer":len(strong),"detect_or_counter_only_baked_in":len(weak)}

def selftest():
    return {"n":len(DEEP),"layers":sorted(set(e["layer"] for e in DEEP)),
            "all_documented":all(e.get("documented") for e in DEEP),
            "all_have_inversion":all(e.get("inversion") for e in DEEP),
            "controllability":by_controllability()}

if __name__=="__main__":
    import json; print(json.dumps(selftest(),indent=2))

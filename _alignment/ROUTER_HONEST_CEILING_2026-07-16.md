# Router — Honest Engineering Ceiling (2026-07-16)

## What was attempted
v1 (TF-IDF+LR) → v2 (+calibration+terse, CONTAMINATED test) → v3 (terse-aug) → v4 (grounded terse, clean
split) → v5 (char n-grams to fix zero-vector bug).

## Honest measured results
- **In-domain accuracy: 0.72-0.82** (real, on persona-corpus held-out). This is genuine.
- **OOD generalization (held-out terse queries never trained): 0.61-0.66.** Real but modest.
- **Truly-novel short prompts: DEGENERATE** — returns near-identical confidence (~0.34) regardless of input.
  - v4 root cause: zero-vector (min_df pruned all words in the prompt) → same default class every time.
  - v5 fixed the zero-vector (char n-grams, nnz 38) but classifier STILL can't discriminate them.

## The honest conclusion (stop iterating, report the ceiling)
**TF-IDF + LogisticRegression is the WRONG INSTRUMENT for open-domain terse routing.**
- Bag-of-words has no semantic model of unseen words → cannot generalize to arbitrary short queries.
- It works ONLY when the input resembles the training distribution.
- The Supra-Router-51M pattern that inspired this is a NEURAL (embedding) router precisely because shallow
  classifiers hit exactly this wall.

## What this means honestly
- The keyword venturi (0.39) and the trained router (0.72 in-domain) are BOTH domain-limited heuristics.
- A real router needs sentence EMBEDDINGS (e.g. a small embedding model → cosine to node centroids, or a
  fine-tuned tiny classifier head on embeddings). That's the honest next instrument, needs the embedding model.
- Contamination lesson (twice this session): ALWAYS split BEFORE adding examples; never test on trained data.

## Fail-safe holds
BRUM escalates on low confidence → degenerate/uncertain routing SPREADS across brains rather than
committing wrong. So even a weak router fails SAFE. The engine is usable; the router is just not yet good
enough to route CONFIDENTLY on novel input — it correctly punts to the spread.

## Honest status: router is IN-DOMAIN-ONLY. OOD routing = open problem, needs embeddings, not more TF-IDF.

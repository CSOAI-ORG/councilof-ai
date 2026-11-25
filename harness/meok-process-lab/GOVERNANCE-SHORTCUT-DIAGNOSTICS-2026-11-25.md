# Governance bank: source integrity and field-shortcut diagnostic — 25 November 2026

Public frozen csoai/gspc-gov revision ba036c3c88d1d1fcc69ebe0f832b95dfab9b4557, items.jsonl SHA256 9c9de457cdded0d8e176067d684b3dab0074cc0a8d14e497c7c0b6f7aa3b61b5. Upstream AI Act Evaluation Benchmark by Athanasios Davvetas, Michael Papademas, Xenia Ziouvelou, Vangelis Karkaletsis (arXiv:2603.09435), https://github.com/davidath/ai-act-evaluation-benchmark/tree/127f845b3a5c4763cdcef9560c5770015e2e07a5 , CC BY 4.0. Source SHA256 0fc1c7491372cf0aa787b4b650f77245ec775f8bff0c4c84f253435c7dcb1b25. No source text redistributed. Source has 339 rows; 237 graded rows plus one canary in the frozen bank. Canary excluded. 237 unique source indices, exact risk label mapping, all four normalized source fields present in each scenario. Upstream labels not independently legally reviewed.

Executed scripts/research/governance_shortcut_diagnostics.py at bc21e2306049856ab513e1b22e31979aad7a3fde on Mac, sklearn 1.9.0 NumPy 2.4.6. Five GroupKFold folds on 89 normalized source domain strings (no overlap across train/test domains), TF-IDF unigram/bigram logistic baseline. Each diagnostic fit only on other folds, evaluated exactly once per item; no MEOK training or retained classifier. The bank remains public and is not a blind capability test. Domain grouping does not rule out related scenarios across domains or author/template effects.

| Input | Correct/237 | Accuracy | Balanced accuracy |
|---|---:|---:|---:|
| Fold majority | 57 | .2405 | .2090 |
| Shuffled training labels, scenario | 44 | .1857 | .1726 |
| Role only | 44 | .1857 | .1619 |
| Domain only | 87 | .3671 | .3413 |
| Input data only | 182 | .7679 | .7569 |
| System type only | 213 | .8987 | .8980 |
| Intended use only | 220 | .9283 | .9268 |
| Full scenario | 221 | .9325 | .9311 |

This is separate from existing correction C-2026-1120-02's wording-only baseline 225/237; different protocol, not a replacement. Intended use is legitimately material in legal classification. Strong lexical baseline indicates limited discrimination of legal reasoning; does not establish improper leakage, contamination or a legal determination. No new GSPC measurement. Keep the frozen bank intact and its limitation visible.

Next qualification: independent legal reviewers label matched pairs changing a single legally material factor, matched nuisance paraphrases, insufficient-evidence cases, changed role/jurisdiction/exception, structured rationale with source and applicability, blind scenario-family split, group-wise uncertainty and lexical baseline. Preserve rights and do not expose held-out answers to training. Require both pair members correct, invariant nuisance pairs, false allow/deny and abstention separately. This design is not yet a qualified legal bank. Existing authority and GSPC instrument guard remain unchanged.

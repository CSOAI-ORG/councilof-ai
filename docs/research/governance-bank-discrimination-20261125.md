# Governance bank discrimination — 25 November 2026

Research instrument audit only. No new GSPC score, legal determination, MEOK training, bank replacement or deployment.

## Source binding

Upstream: Athanasios Davvetas, Michael Papademas, Xenia Ziouvelou and Vangelis Karkaletsis, [AI Act Evaluation Benchmark](https://arxiv.org/abs/2603.09435), CC-BY-4.0 data, [repository](https://github.com/davidath/ai-act-evaluation-benchmark), revision 127f845b3a5c4763cdcef9560c5770015e2e07a5, scenarios.json SHA256 0fc1c7491372cf0aa787b4b650f77245ec775f8bff0c4c84f253435c7dcb1b25. Public csoai/gspc-gov revision ba036c3c88d1d1fcc69ebe0f832b95dfab9b4557, items.jsonl SHA256 9c9de457cdded0d8e176067d684b3dab0074cc0a8d14e497c7c0b6f7aa3b61b5. Excluded one public canary; 237 distinct indexed rows of 339, remaining 102 public scenarios. All 237 expected labels match the upstream label mapping; all 237 rendered strings exactly match the published strings. This checks derivation, not independent legal correctness.

## Executed CPU audit

scripts/research/governance-bank-discrimination.py committed at 03b0c56025bdc628dabef35dc1e50cb02577eb8b before run. scikit-learn 1.9.0, M2 Desktop Commander. Fit depth-4 decision trees exclusively on 102 public complement labels for this disposable instrument diagnostic. Evaluate the 237 published rows; not private holdout or training data for MEOK. No text tokens, legal provisions or article anchors used by these baselines. 200 deterministic shuffled-training-label controls per feature set.

| Feature | Correct / 237 | Accuracy | Shuffled mean | Shuffled 95th percentile |
|---|---:|---:|---:|---:|
| Majority class | 69 | .2911 | — | — |
| Total word count (scalar) | 115 | .4852 | .2645 | .3970 |
| Total character count | 116 | .4895 | .2557 | .4177 |
| Word counts of system type, intended use, domain, input data | 189 | .7975 | .2596 | .4179 |

Adding 20 or 40 to the scalar word-count feature reduces the scalar classifier to 59/237 (.2489). This is an artificial surface-feature perturbation, not evaluated semantic paraphrasing. Four field lengths alone strongly predict assigned risk categories; evidence of confounding in this specific public bank. Confusions, ranges and shuffle statistics retained in adjacent JSON. Earlier C-2026-1120-02 reports 225/237 wording-only baseline; this is a different restricted feature experiment and does not replicate that exact number. Do not equate a bag-of-words classifier with a scalar length count.

## Repair qualification path

Preserve existing correction and frozen bank. Build a separately reviewed candidate with legally relevant facts and minimally different counterfactuals; balance nuisance features across risk strata, separate scenario families by group, independently review labels and exact applicable provisions/version, include uncertainty where facts are insufficient. Pre-register thresholds and comparisons; compare majority, length-only, lexical, metadata-only, and shuffled-label controls against qualified model outputs; reject a bank whose intended capability is not discriminated. Paraphrase/translation controls must preserve legally relevant semantics and be separately reviewed. Keep diagnostic training complement out of model learning; keep new heldout bank protected under existing instrument guard. No new score until review and admission. Do not alter historical data or suggest source label equality establishes legal truth. No external spend or external code import.

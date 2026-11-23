---
license: cc-by-4.0
language:
- en
tags:
- synthetic
- dataset-integrity
- ai-safety
- reproducibility
- data-poisoning-research
pretty_name: CSOAI Synthetic Same-Size Dataset Mutation Probe
---

# GSPC synthetic dataset mutation sensitivity — byte integrity, NOT model poisoning detection

This dataset publishes **only aggregate results of a deterministic synthetic experiment**. No real datasets, credentials, human identity, production agent, model weights, inference or training were used.

The 10,000 synthetic documents have stable IDs and one policy marker: HITL=REQUIRED. In four independent scenarios, exactly 1, 5, 25 or 150 documents change the marker to HITL=DISABLED. Each altered document preserves its identifier and its serialized byte length. The number of records and total file length are unchanged.

The experiment compares:
- Counting only document rows, which misses all four changes.
- Checking only the total byte length, which also misses all four.
- Comparing exact content digests against a **separately checked-in Git reference digest**, which detects all four changes in this closed-world synthetic test.
- Checking every per-document hash, which identifies each changed document.
- A fixed 1% systematic sample, which may miss rare changes (not a statistical sensitivity estimate).
- An **untrusted rehashed manifest**, which can appear internally consistent after modification and therefore cannot by itself authenticate unchanged source data.

A SHA-256 digest mismatch is evidence that bytes changed relative to a known baseline, **not** proof of malicious intent, semantic data poisoning, model vulnerability, or a successful attack. A benign edit also triggers a digest change. The reference is version-controlled in the SAME PROJECT, not independently witnessed or externally signed. Hashes must be bound to authenticated source identities or independent witnessed roots; attackers controlling both content and local manifest can replace both.

No model was queried or retrained. Every scenario sets model-behavior and semantic-poison detection to NOT_TESTED or NOT_RUN. This is **stage one** of a proposed two-stage integrity/behavior research program, not a GSPC axis result, certification, or demonstrated defense against training-time manipulation.

## Reproduce

- Source: https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/experiments/gspc-dataset-mutation-probe.mjs
- Negative controls: https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/experiments/gspc-dataset-mutation-probe.node-test.mjs

```sh
node --test scripts/experiments/gspc-dataset-mutation-probe.node-test.mjs
node scripts/experiments/gspc-dataset-mutation-probe.mjs --out report.json
```

The output is deterministic and aggregate-only. The CI workflow publishes an unsigned artifact; an optional trusted master run mirrors that report to Hugging Face if a token is configured. External adoption or independent verification is NOT established by publication.

Baseline reference (project-controlled, not independently authenticated): scripts/experiments/fixtures/gspc-dataset-mutation-baseline.sha256

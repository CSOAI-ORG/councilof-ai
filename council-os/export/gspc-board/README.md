---
language: en
license: apache-2.0
tags: [gspec, ai-governance, measurement, council-of-ai, gspc-board]
pretty_name: "GSPC Governance & Measurement Board"
size_categories: [n<1K]
task_categories: [other]
dataset_info:
  features:
    - {name: axis, dtype: string}
    - {name: bench, dtype: string}
    - {name: n, dtype: int32}
    - {name: status, dtype: string}
    - {name: metric, dtype: string}
  splits: {train: {num_examples: 6}}
---
# GSPC Governance & Measurement Board

Independent, deterministic measurement of AI model behaviour across GSPC axes. **13 measured of 14** (jail axis UNTESTED, self-enforcing). Measurement ≠ certification; determination stays with authorities. Signed, time-anchored, stranger-verifiable. Nothing sold; regulators read free.

Measurement scope: governance / safety / provenance / continuity / conformance / openness (measured). Jail axis: UNTESTED.

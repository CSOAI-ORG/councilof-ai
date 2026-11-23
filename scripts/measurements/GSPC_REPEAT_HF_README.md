---
license: cc-by-4.0
language:
- en
tags:
- ai-safety
- evaluation
- provenance
- reproducibility
- dataset-integrity
pretty_name: CSOAI GSPC Repeated-Observation Integrity Audit
---

# Distinct observation coverage vs repeat volume in GSPC

This is an aggregate research aid, NOT a model-safety ranking, a regenerated GSPC board, an independence-qualified sample size, a credentialled human-review decision, or a certification.

One GSPC per-item mill fact row is one observation. A (model, axis, item) key can appear repeatedly. We report, separately:

- Total source observation rows, ungraded results, missing observed outputs, and unattributed model rows.
- Distinct attributed (axis, model, item) keys vs rows beyond one per key.
- A stricter declared-lineage grouping that fixes the *individual raw observation's* model revision, bank digest and provider route. The fact row is joined bijectively to source bytes by its original index (or unique legacy item ID); the first provider route in a cell must never be assigned to its other observations. These fields are validated against each raw observation's bytes. It is NOT proof of independently repeated execution or exactly controlled sampling conditions.
- Groups containing both a true and false grade, **not** a determination of poisoning, model instability, a violation or incorrect grading.
- Explicit counts of missing lineage and uncertainty by axis.

A missing grade is never interpreted as false, true, safe or refused. A missing model is not silently grouped into a fictional model. Distinct keys cannot be treated as independent statistical samples without a declared sampling unit, repeated-run metadata, model revision attestation, instrument controls and dependence analysis.

## Reproduce

Use the upstream public sources and CLI:
https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/measurements/gspc-repeat-integrity.mjs

Run:
```sh
node --test scripts/measurements/gspc-repeat-integrity.node-test.mjs
node scripts/measurements/gspc-repeat-integrity.mjs --manifest public/interop/gspc-fact-table/MANIFEST.json --evidence public/interop/mill-evidence --out report.json
```

The producer independently re-hashes the original source cells, verifies their full index and declared lineage metadata, parses and accounts for the fact-table shards, and reconciles per-axis/per-model attribution. It fails closed if a raw record is malformed, missing, or has a changed digest; it does not trust headline counts in isolation.

The report is **unsigned** and constructed by one controlled CI runner. Source hashes establish byte identity relative to the published manifest, not external authenticity. The canonical signed GSPC card/root verification is a separate process.

Baseline (22 November 2026): 53,847 rows, 11,757 distinct attributable axis/model/item keys; 12,812 ungraded rows; 1,290 rows without a model identifier. The report itself is authoritative for the latest source-qualified counts; do not repeat historical figures as live counts.


## Corrected provider-route evidence (23 November 2026)

An independent re-read of 1,788 raw source cells found **208 cells mixing provider routes**, with **1,289 observations using a route other than their cell's first row**. The prior candidate method attributed all rows in a cell to the first provider, yielding **11,880** declared-lineage keys and **120** conflicting-grade groups. Those candidate figures are superseded **before public dataset publication**.

The corrected `csoai.gspc-repeat-integrity/2` method uses a bijective raw-observation-to-fact join and yields **11,800** distinct declared-lineage keys and **105** groups containing both grade values. The coarse `axis/model/item` grouping remains **11,757** keys and 111 differently graded groups. None is a statistically independent sample size or new model-safety finding.

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
- A stricter declared-lineage grouping that also fixes the source cell model revision, bank digest and provider route. These fields are validated against the raw cell bytes. It is NOT proof of independently repeated execution or exactly controlled sampling conditions.
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

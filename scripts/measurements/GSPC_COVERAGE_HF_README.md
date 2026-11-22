---
license: cc-by-4.0
language:
- en
tags:
- ai-safety
- evaluation
- evidence-integrity
- reproducibility
pretty_name: CSOAI GSPC Source-Bound Evidence Coverage
---

# GSPC source-bound evidence coverage — not a model grade

This read-only dataset cross-references Council of AI's canonical /api/gspc board with the committed per-item mill fact-table manifest. It does NOT run new inference, verify issuer signatures, reproduce models on independent hardware, certify compliance or admit scores into GSPC.

At the verified 22 November 2026 baseline, the canonical board exposed 34 axes and the per-item mill fact table covered only 13 of them. Check coverage.json for the current source-bound counts; do not perpetuate the historical numbers as evergreen statistics. An axis with no rows in THIS table is NOT_REPRESENTED_IN_THIS_FACT_TABLE, not UNMEASURED, CLEAN, or safe. Different axes use different evidence formats.

Files: coverage.json (per-axis states and source digests), source-board.json (unsigned offline replay of the board source), source-fact-manifest.json (committed source index). Both source file hashes are recorded in coverage.json.

Reproduce with code at:
- https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/measurements/gspc-coverage-feed.mjs
- https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/measurements/gspc-coverage-feed.node-test.mjs
- https://github.com/CSOAI-ORG/councilof-ai/blob/master/scripts/gspc-board-snapshot.mjs

Run the canonical board snapshot, then pass the snapshot and public/interop/gspc-fact-table/MANIFEST.json to gspc-coverage-feed.mjs with --board, --manifest, --evidence public/interop/mill-evidence and --out. Supply --previous for source-delta comparison.

The feed keeps the distinction between MEASURED and method-qualified; between a tie, separated leader and UNTESTED; between no record and proven absence; and between changed bytes and evidence of an attack. A hash that changes while the number of rows stays fixed requires source review but does not by itself diagnose data poisoning. Hashes alone cannot authenticate a record against an attacker able to rewrite both record and digest. Verifying signed root inclusion and independent replication is a separate step.

This is an unsigned, single-run projection. Public Hugging Face publication is distribution, not institutional adoption or verified identity.

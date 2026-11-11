# Academy release acceptance evidence

This archive retains software-release evidence for [PR #4209](https://github.com/CSOAI-ORG/councilof-ai/pull/4209), merged as `ccd06e2d625f5cdc3b8d1f955177dabd3a1c6ed9`.

The implementation head `53b58299d834f1ddf17b74679811961a639609cf` passed all ten PR workflows and 25 jobs. Current master advanced during review; the reconciled head `8a47a3de693fad2ceacc9142cf3bd1c3f4be0f6b` passed its own complete checks. Both machine-readable CI records preserve successful and explicitly skipped steps.

The sole merge conflict was the shared uploader test file. Current master's file was retained verbatim: its matching producer classifications and new lazy-runtime tests supersede the earlier import-time fixture. All 20 combined uploader/citation tests passed. Academy report code and pinned publication assets were unchanged by that reconciliation.

`learning-baseline-0.2.0.json` is an actual browser download from the existing **Export learning backup** control. It contains an explicitly labelled automated software test: two scripted answers and a public governance source pin. It is a migration fixture, not a human learner record, human review, authority receipt or case journal. Its source digest is a retained capture declaration; this archive does not infer source-signature authentication from a saved draft.

At this checkpoint, normal [production run 42954629305](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/42954629305) is in progress. The final deployment, live readback and browser-export evidence will be retained in a subsequent archive commit after they are observed. `release-verification.json` preserves their pending status until then.

The separately completed Hugging Face and Kaggle publication evidence is retained in the parent directory's `RELEASE-RECEIPT.json` and `hosted-output-manifest.json`. Those results establish seven source-file integrity matches and five indexed lesson records, with zero model-inference calls and zero human-review events in that finite-file audit.

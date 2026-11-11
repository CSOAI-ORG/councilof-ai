# Academy release acceptance evidence

This archive retains software-release evidence for [PR #4209](https://github.com/CSOAI-ORG/councilof-ai/pull/4209), merged as `ccd06e2d625f5cdc3b8d1f955177dabd3a1c6ed9`.

The implementation head `53b58299d834f1ddf17b74679811961a639609cf` passed all ten PR workflows and 25 jobs. Current master advanced during review; the reconciled head `8a47a3de693fad2ceacc9142cf3bd1c3f4be0f6b` passed its own complete checks. Both machine-readable CI records preserve successful and explicitly skipped steps.

The sole merge conflict was the shared uploader test file. Current master's file was retained verbatim: its matching producer classifications and new lazy-runtime tests supersede the earlier import-time fixture. All 20 combined uploader/citation tests passed. Academy report code and pinned publication assets were unchanged by that reconciliation.

`learning-baseline-0.2.0.json` is an actual browser download from the existing **Export learning backup** control. It contains an explicitly labelled automated software test: two scripted answers and a public governance source pin. It is a migration fixture, not a human learner record, human review, authority receipt or case journal. Its source digest is a retained capture declaration; this archive does not infer source-signature authentication from a saved draft.

The normal [production run 42954629305](https://github.com/CSOAI-ORG/councilof-ai/actions/runs/42954629305) completed **successfully** on the exact merge commit. Both the build/deploy and live outward-claims jobs passed. Immediate, trailing, held-tree and witnessed-root checks passed; the conditional anti-clobber redeploy was skipped because the released tree remained present. [deployment-workflow.json](deployment-workflow.json) retains the two jobs and 69 step outcomes.

## Live release and browser acceptance

[release-verification.json](release-verification.json) is the consolidated receipt. The separately retained [immediate](live-immediate.json) and [delayed](live-delayed.json) observations each passed six checks across `councilof.ai` and `councilof-ai.pages.dev`. The delayed run began 129.231 seconds after the immediate run finished. Both origins returned prerendered homepages and the exact component/contract bytes from the merged source. [verify-live-release.py](verify-live-release.py) contains the finite read-only checks; future source changes will correctly stop matching this release's pinned hashes.

The actual production browser was reloaded from component 0.2.0 to 0.3.0. [browser-acceptance.json](browser-acceptance.json) records 11 passed checks: the proposal, selected answers, attempts and stage survived; a fresh source read retained the proposal's original source pin; and real Markdown/JSON downloads contained all seven sections and the same recomputed content revision. The [migrated backup](learning-migrated-0.3.0.json) and [screenshot](browser-acceptance.png) are retained.

The downloaded [readable report](Council-review-report-governance.md) exactly matches a fresh render from its [structured JSON](Council-review-draft-governance.json), as recorded in [canonical-export-check.json](canonical-export-check.json). Its content revision is `sha256:2f0c16837d52cfced0fcdb38a54682608c9391c8697745193321b6f10af0853b`.

These are explicitly labelled software acceptance checks. They establish neither authenticated human participation, measured learning gain, a qualified receiver, external charter adoption nor permission to execute the proposal. The browser exports preserve the observed HOLD state. Archiving this synthetic test does not submit a provider/WG referral or create a second case journal.

[manifest.json](manifest.json) records byte lengths and SHA-256 digests for every other file in this archive. The original checkpoint remains in Git history; this version records the subsequently completed outcomes.

The separately completed Hugging Face and Kaggle publication evidence is retained in the parent directory's `RELEASE-RECEIPT.json` and `hosted-output-manifest.json`. Those results establish seven source-file integrity matches and five indexed lesson records, with zero model-inference calls and zero human-review events in that finite-file audit.

# Paper scorecard correction applied - 19 September 2026

At 17:26 UTC, a one-line reporting correction was applied to the existing M4
condor/scripts/paper_scorecard.py. No execution, funding or risk setting changed.
The win count now uses positive numeric net returns from the same population
as the denominator, rather than a separate collection of declared win flags.

Before the edit, three of seven targeted tests failed, including the synthetic
200-percent win-rate case. After the edit, all seven passed. The original
repository scorecard test also passed. These are eight local checks, not a
full-stack trading acceptance or independent strategy assessment.

Exact previous source was backed up locally before replacement. A pre-write
byte comparison checked for concurrent edits. The existing tolerant file parser
and all promotion requirements were preserved. Automatic live promotion stays off.
Before SHA256: fc2eb21fb617cd1e98ad9003d49571db88fc0283348c990040943fe7f6658609
After SHA256: 1ab9a57dce7d6b9e5e7d64ae3d3aa4333c1cfb9586e64942d8d5d6367404615a

Earlier REVIEW.md statements that this narrow correction was only staged are
superseded by this receipt. Broader numeric-validation improvements remain a
separate review candidate; this edit does not claim to repair every scorecard issue.
The frozen M2 measurement-watch strategy and manifest were not altered.
No service restart, Git commit/push, account funding or order placement occurred.
Evidence: SCORECARD-CORRECTION-20260919T1726Z.json and
SCORECARD-INTEGRATION-TESTS-20260919T1726Z.txt in this directory.

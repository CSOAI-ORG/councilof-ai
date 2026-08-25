---
language: en
license: apache-2.0
tags: [gspec, ai-governance, measurement, council-of-ai, leaderboard-results]
pretty_name: "GSPC Leaderboard Results"
size_categories: [n<1K]
task_categories: [other]
---
# GSPC Leaderboard Results — PR-based submissions
Bench results dataset feeding the GSPC governance leaderboard.

## How to contribute (PR-based submission)
1. Fork this repo.
2. Add a row to `results.csv` (axis, bench, model, n, status, metric, evidence_url).
3. Open a Pull Request. Maintainers review for measurement scope + ClaimGuard-precision, then merge.
4. Only signed-verifiable rows merge. No unsourced scores. No "13 measured of 14" overclaim — jail axis stays UNTESTED.

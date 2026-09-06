# Benchmark-quality register

Deterministic predicates applied to what AI benchmark publishers disclose about their own
process — and applied to us, on the same budget, in the same run.

**We publish our own failures first.** In the 6 Sep 2026 run our row resolves 33 of 35
predicates and fails 16 of them. The three that matter most, because they are the three we
have told other people to care about:

| our failure | what the bytes say | why it stings |
|---|---|---|
| `statistics` group: **0 of 5** | `https://councilof.ai/board/` publishes no interval, no n, no separation rule and no minimum-n rule anywhere in its own text | Wilson intervals, `separated_leaders`, and a refusal to quote below n≥30 are the discipline we have argued is the difference between us and a leaderboard. The surface a reader lands on carries none of it. Six of the other seven publishers also score 0 of 5 here — that is not a defence, it is the reason the row is embarrassing rather than unusual. |
| `stranger_recompute_path_complete`: **FAIL** | the board links source code but no item-data channel and no runnable command | "Follow the link and check" is the entire product. On this page a stranger cannot start. |
| `as_of_date_on_board` and `status_or_uptime_page_linked`: **FAIL, FAIL** | no refresh date in the page text; nothing linking a status or uptime page | Both are already-known reds — `totals.as_of` is null and `/status` is a withdrawn-page notice — and this is the first surface that scores them from the outside. |

Our row also passes all five provenance predicates, and is the only row that does. That is a
fact about five cells, not a verdict, and it is worth exactly as much as the sixteen failures
sitting beside it.

## The files

| file | what it is |
|---|---|
| `2026-09-06/register.json` | every cell, with the URL, the fetch date and the SHA-256 of the bytes that decided it |
| `2026-09-06/register.md` | the same thing, readable, with every UNMEASURED and its reason |
| `2026-09-06/cards/*.json` | one card-v0 per publisher, payload ≤3 KB, `status: STAGED` |
| `SIGNING.md` | how a row moves from STAGED to MEASURED, and into the public root |
| `DISCLOSURE.md` | the notice to each named publisher, the right of reply, and the wording that keeps this at "measured" |
| `PAGE-BRIEF.md` | the brief for the public page (TUI-3) |
| `HF-DATASET-PLAN.md` | the dataset plan for `csoai/benchmark-quality-register` |
| `DEMAND.md` | who uses a register like this and which door serves them |
| `RUNBOOK-48H.md` | the next 48 hours, with a proof command on every row |

## Reproduce it

```bash
python3 scripts/benchmark_quality/register.py --check          # recompute; exits 1 on drift
python3 scripts/benchmark_quality/test_register.py             # 1767 checks, incl. the flip test
python3 scripts/benchmark_quality/register.py --explain council-of-ai:uncertainty_shown_beside_scores
```

The producer makes no network call. Its whole input is the bytes under
`scripts/fixtures/benchmark-quality/`, three artifacts per publisher, fetched once on
6 Sep 2026 and committed.

## What this is not

Not a score. Not a ranking. Not a certification, accreditation or endorsement of anybody.
Counts are unweighted, non-independent and non-exhaustive; ordering publishers by them is a
misuse of the file. A FAIL is scoped to one URL on one date and says what a publisher put
there — never what a publisher is. An UNMEASURED is a result, not a zero.

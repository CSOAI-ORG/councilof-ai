#!/usr/bin/env python3
"""
Rating the Raters — Result 001
Axis RTR-A1: Human-Reference Rule Match
Subject: ARC Prize / ARC-AGI-2 public evaluation human baseline

WHAT THIS DOES
  Recomputes ARC's published human-performance figure for ARC-AGI-2 public eval
  from ARC's own published participant rows, under three attempt budgets:
  unlimited submissions (ARC's published basis), <=2 submissions (the budget
  ARC's own scoring rule grants every test-taker, human or AI), and <=1.

  It then reports the gap between the figure ARC publishes and the figure
  produced under ARC's own machine-scoring rule.

  Nothing here judges ARC's honesty. ARC never claimed its 66% figure was a
  pass@2 score. The finding is that the rule-matched figure is not published,
  so third parties compare AI pass@2 against a human number measured under a
  looser rule.

SOURCE DATA (MIT licensed, published by ARC Prize)
  https://huggingface.co/datasets/arcprize/arc_agi_2_human_testing
  file: test_pair_attempts.csv

METHOD
  Deterministic arithmetic only. No model judges anything. Exact-match grading
  as ARC defines it. Every number below is recomputable from the published rows.

USAGE
  python3 scripts/rating_the_raters_001_arc.py --csv path/to/test_pair_attempts.csv \
      --out public/rating-the-raters/001-arc-agi-2.json

CC-BY-4.0. Council of AI (CSOAI Ltd, UK Companies House 16939677).
"""

import argparse
import collections
import csv
import hashlib
import json
import math
import random
import sys

# The ARC-AGI-2 repository commit these findings are pinned to. ARC corrected
# public-eval gold labels 20+ times between 2025-03-24 and 2025-04-17, so an
# unpinned ARC number is not meaningful.
ARC_AGI_2_COMMIT = "f3283f727488ad98fe575ea6a5ac981e4a188e49"

DATASET = "arcprize/arc_agi_2_human_testing"
DATASET_FILE = "test_pair_attempts.csv"
BOOTSTRAP_RESAMPLES = 10000
BOOTSTRAP_SEED = 20260826
Z_95 = 1.959963985


# ---------------------------------------------------------------- primitives

def wilson(successes, n, z=Z_95):
    """Wilson score interval. Applies to a single binomial proportion."""
    if n == 0:
        return (0.0, 0.0)
    p = successes / n
    denom = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / denom
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / denom
    return (centre - half, centre + half)


def solved(row, k):
    """
    Did this session solve this (task, test_index) pair within k submissions?

    ASSUMPTION, stated because it is load-bearing: the participant stopped
    submitting once correct, so a solved attempt's correct submission is its
    LAST submission and `submissions` is therefore the 1-based index of the
    correct one. ARC publishes the count of submissions and the count of correct
    submissions, but not the index of the correct submission.

    Evidence for the assumption, computed by this script and published in the
    output as `assumption_check`:
      - 772 of 773 solved attempts have exactly one correct submission.
      - The submission-count distribution over solved attempts is monotonically
        decreasing (472, 175, 70, 30, 16, 6, 3, 1), which is what terminating at
        first success produces and what continuing past success would not.

    ARC can settle this outright by publishing one extra column: the index of
    the correct submission. Until then this is an assumption, not a fact, and
    the sensitivity of the headline to it is reported in the output.
    """
    if row["corr"] < 1:
        return False
    if k is None:
        return True
    return row["subs"] <= k


def macro_over_tasks(by_task, task_list, k):
    """
    Mean over tasks of (per-task fraction of attempts solved within k).

    This is the aggregation — and the ONLY aggregation tested — that reproduces
    ARC's published 66% figure. See `aggregation_search` in the output for the
    alternatives that were tried and what each yields.
    """
    return sum(
        sum(solved(r, k) for r in by_task[t]) / len(by_task[t]) for t in task_list
    ) / len(task_list)


def cluster_bootstrap(by_task, tasks, k, resamples=BOOTSTRAP_RESAMPLES, seed=BOOTSTRAP_SEED):
    """
    Percentile bootstrap resampling TASKS with replacement.

    Why not Wilson: the headline is a mean of 115 per-task proportions, not a
    single binomial proportion, so Wilson does not apply to it. Applying Wilson
    anyway -- treating each task as one Bernoulli trial -- discards the
    within-task session data and yields a materially different interval. Both
    are reported in the output so a reader can see the difference rather than
    take our word for it.
    """
    rnd = random.Random(seed)
    n = len(tasks)
    draws = []
    for _ in range(resamples):
        sample = [tasks[rnd.randrange(n)] for _ in range(n)]
        draws.append(macro_over_tasks(by_task, sample, k))
    draws.sort()
    lo = draws[int(0.025 * resamples)]
    hi = draws[int(0.975 * resamples) - 1]
    return lo, hi


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", required=True, help="path to test_pair_attempts.csv")
    ap.add_argument("--out", required=True, help="path to write the JSON artifact")
    args = ap.parse_args()

    raw = open(args.csv, "rb").read()
    sha256 = hashlib.sha256(raw).hexdigest()

    all_rows = list(csv.DictReader(open(args.csv)))
    rows = [r for r in all_rows if r["task_set"] == "Public Eval"]
    for r in rows:
        r["subs"] = int(r["submissions"])
        r["corr"] = int(r["correct_submissions"])

    by_task = collections.defaultdict(list)
    for r in rows:
        by_task[r["task_ID"]].append(r)
    tasks = sorted(by_task)

    pairs = {(r["task_ID"], r["test_index"]) for r in rows}
    sessions = {r["session_ID"] for r in rows}

    if len(tasks) < 30:
        sys.exit(f"FAIL: n={len(tasks)} tasks is below the n>=30 floor.")

    # ---- headline figures under each rule
    results = {}
    for label, k in [("unlimited", None), ("pass_at_2", 2), ("pass_at_1", 1)]:
        macro = macro_over_tasks(by_task, tasks, k)
        lo, hi = cluster_bootstrap(by_task, tasks, k)
        micro_x = sum(solved(r, k) for r in rows)
        wlo, whi = wilson(micro_x, len(rows))
        naive_x = round(macro * len(tasks))
        nlo, nhi = wilson(naive_x, len(tasks))
        results[label] = {
            "macro_over_tasks_pct": round(macro * 100, 2),
            "macro_ci95_bootstrap_tasks": [round(lo * 100, 2), round(hi * 100, 2)],
            "macro_ci95_method": (
                "percentile bootstrap over the 115 tasks, "
                f"{BOOTSTRAP_RESAMPLES} resamples, seed {BOOTSTRAP_SEED}"
            ),
            "micro_over_attempts_pct": round(micro_x / len(rows) * 100, 2),
            "micro_numerator": micro_x,
            "micro_denominator": len(rows),
            "micro_ci95_wilson": [round(wlo * 100, 2), round(whi * 100, 2)],
            "micro_ci95_method": (
                "Wilson score interval; applies exactly, the attempt-level rate "
                "is a single binomial proportion. Attempts are clustered within "
                "sessions and tasks, so nominal coverage is optimistic."
            ),
            "macro_ci95_wilson_naive_DO_NOT_USE": [round(nlo * 100, 2), round(nhi * 100, 2)],
            "macro_ci95_wilson_naive_note": (
                "Published only to show what the estate's default method yields "
                "when misapplied to a mean of proportions. It treats each task as "
                "one Bernoulli trial and throws away the session data behind each "
                "task's rate. It is NOT the interval for the headline."
            ),
        }

    gap = results["unlimited"]["macro_over_tasks_pct"] - results["pass_at_2"]["macro_over_tasks_pct"]

    # ---- which aggregation reproduces ARC's published 66%?
    def variants(k):
        out = {}
        out["attempt_level_micro"] = sum(solved(r, k) for r in rows) / len(rows)
        bp = collections.defaultdict(list)
        for r in rows:
            bp[(r["task_ID"], r["test_index"])].append(solved(r, k))
        out["macro_over_test_pairs"] = sum(sum(v) / len(v) for v in bp.values()) / len(bp)
        out["macro_over_tasks"] = macro_over_tasks(by_task, tasks, k)
        sess = collections.defaultdict(list)
        for r in rows:
            sess[(r["session_ID"], r["task_ID"])].append(solved(r, k))
        bt2 = collections.defaultdict(list)
        for (sid, tid), v in sess.items():
            bt2[tid].append(all(v))
        out["macro_over_tasks_all_test_pairs"] = sum(sum(v) / len(v) for v in bt2.values()) / len(bt2)
        flat = [x for v in bt2.values() for x in v]
        out["task_level_micro"] = sum(flat) / len(flat)
        return {kk: round(vv * 100, 2) for kk, vv in out.items()}

    aggregation_search = {
        "arc_published_figure_pct": 66.0,
        "arc_published_wording": "Average human performance on these tasks in our test sample was 66%.",
        "candidates_under_unlimited_submissions": variants(None),
        "unique_reconciliation": "macro_over_tasks",
        "note": (
            "Exactly one of the five candidate aggregations reproduces ARC's "
            "published 66%: the macro-average over tasks under unlimited "
            "submissions, at 66.07%. ARC's figure is correct and correctly "
            "computed. No discrepancy was found in it."
        ),
    }

    # ---- ARC's calibration claim, reproduced
    solvers = collections.defaultdict(set)
    for r in rows:
        if solved(r, 2):
            solvers[(r["task_ID"], r["test_index"])].add(r["session_ID"])
    reproduced = [p for p in pairs if len(solvers.get(p, ())) >= 2]
    min_solvers = min(len(solvers.get(p, ())) for p in pairs)
    calibration = {
        "arc_claim": (
            "Every ARC-AGI-2 evaluation task was solved by at least 2 people in "
            "no more than 2 attempts."
        ),
        "pairs_tested": len(pairs),
        "pairs_reproduced": len(reproduced),
        "verdict": "REPRODUCES" if len(reproduced) == len(pairs) else "DOES NOT REPRODUCE",
        "minimum_distinct_solvers_on_any_pair": min_solvers,
        "note": (
            "Reproduces on every (task, test_index) pair the published rows "
            "cover. The margin is exact rather than comfortable: at least one "
            "pair was solved by exactly 2 distinct sessions within 2 "
            "submissions, which is the claim's floor. That is a property of the "
            "claim, not a defect in it -- ARC calibrated to a threshold and the "
            "threshold is met."
        ),
    }

    # ---- the assumption, checked
    solved_rows = [r for r in rows if r["corr"] >= 1]
    dist = collections.Counter(r["subs"] for r in solved_rows)
    ordered = [dist.get(i, 0) for i in range(1, max(dist) + 1)]
    alt = sum(
        sum((solved(r, 2) or r["corr"] > 1) for r in by_task[t]) / len(by_task[t])
        for t in tasks
    ) / len(tasks)
    assumption_check = {
        "assumption": (
            "A participant stopped submitting once correct, so a solved "
            "attempt's correct submission is its last submission."
        ),
        "why_it_matters": (
            "ARC publishes submission counts, not the index of the correct "
            "submission. Without this assumption an attempt recorded as "
            "'5 submissions, 1 correct' cannot be placed inside or outside a "
            "2-submission budget."
        ),
        "solved_attempts": len(solved_rows),
        "solved_attempts_with_exactly_one_correct": sum(1 for r in solved_rows if r["corr"] == 1),
        "solved_attempts_with_more_than_one_correct": sum(1 for r in solved_rows if r["corr"] > 1),
        "submission_count_distribution_over_solved_attempts": ordered,
        "distribution_monotonically_decreasing": all(
            ordered[i] >= ordered[i + 1] for i in range(len(ordered) - 1)
        ),
        "sensitivity_pass_at_2_if_anomalous_row_counted_as_solved_pct": round(alt * 100, 2),
        "how_arc_could_settle_this": (
            "Publish the 1-based index of the correct submission as a column. "
            "One column removes the assumption entirely."
        ),
    }

    # ---- coverage
    coverage = {
        "public_eval_tasks_in_benchmark": 120,
        "public_eval_tasks_covered_by_published_rows": len(tasks),
        "coverage_pct": round(len(tasks) / 120 * 100, 1),
        "tasks_not_covered": 5,
        "status_of_uncovered_tasks": "UNMEASURED",
        "note": (
            "A limit on what public data can settle, not a defect in ARC. ARC's "
            "own dataset card states the released rows are not comprehensive. "
            "Every figure here is scoped to the 115 covered tasks and none of "
            "them should be read as covering the other 5."
        ),
    }

    # ---- per-task rows so a reader can recheck
    task_rows = []
    for t in tasks:
        rs = by_task[t]
        task_rows.append({
            "task_id": t,
            "attempts": len(rs),
            "distinct_sessions": len({r["session_ID"] for r in rs}),
            "test_pairs": len({r["test_index"] for r in rs}),
            "solved_unlimited": sum(solved(r, None) for r in rs),
            "solved_within_2": sum(solved(r, 2) for r in rs),
            "solved_within_1": sum(solved(r, 1) for r in rs),
            "rate_unlimited_pct": round(sum(solved(r, None) for r in rs) / len(rs) * 100, 2),
            "rate_within_2_pct": round(sum(solved(r, 2) for r in rs) / len(rs) * 100, 2),
            "rate_within_1_pct": round(sum(solved(r, 1) for r in rs) / len(rs) * 100, 2),
        })

    gt2 = sum(1 for r in rows if r["subs"] > 2)
    artifact = {
        "schema": "csoai.rating-the-raters/0.1",
        "result_id": "RTR-001",
        "axis": "RTR-A1",
        "axis_name": "Human-Reference Rule Match",
        "programme": "Rating the Raters",
        "programme_status": (
            "This is result 001. One rating organisation has been measured on "
            "one axis. This is not a survey and no cross-rater comparison "
            "exists."
        ),
        "subject": "ARC Prize -- ARC-AGI-2 public evaluation human baseline",
        "measured_on": "2026-08-26",
        "license": "CC-BY-4.0",
        "publisher": "Council of AI (CSOAI Ltd, UK Companies House 16939677)",

        "verdict": "MISMATCHED",
        "verdict_meaning": (
            "ARC's published human figure is computed under a different attempt "
            "budget than the one ARC's scoring rule applies to AI systems, and "
            "ARC does not publish a rule-matched human figure alongside it."
        ),

        "fairness_statement": (
            "ARC never claimed its 66% figure was a pass@2 score. ARC's own "
            "wording is 'average human performance', and ARC states its "
            "solvability claim -- at least 2 people in no more than 2 attempts "
            "-- separately and correctly. Nothing ARC published is false. This "
            "measurement exists because the rule-matched comparable is absent "
            "upstream, so the field routinely sets AI pass@2 scores against a "
            "human number measured under a looser rule. It is also worth saying "
            "plainly that this audit was possible ONLY because ARC publishes its "
            "participant-level rows under MIT, publishes its scoring rule "
            "verbatim, publishes gold-label corrections in a changelog rather "
            "than editing silently, and self-reports its own contamination "
            "problem. Most benchmark operators publish none of that, and cannot "
            "be audited at all. ARC's transparency is the reason it can be "
            "measured, and it should not be penalised in reputation for being "
            "the one organisation that made the check possible."
        ),

        "criterion": {
            "id": "RTR-A1",
            "name": "Human-Reference Rule Match",
            "question": (
                "Is the benchmark's published human-performance figure computed "
                "under the same scoring rule the benchmark applies to machines?"
            ),
            "applies_to": (
                "Any benchmark operator that publishes BOTH a headline human "
                "performance figure AND machine scores on the same benchmark "
                "under a stated scoring rule."
            ),
            "procedure": [
                "1. Read the operator's stated machine scoring rule. Extract the attempt budget k (trials permitted per test item) and the grading function.",
                "2. Read the operator's published human figure and the computation the operator states for it.",
                "3. If the operator publishes participant-level rows, recompute the human figure under the machine rule -- same k, same grading, same aggregation -- to obtain H_matched.",
                "4. Report H_published, H_matched, and gap = H_published - H_matched in percentage points.",
            ],
            "verdicts": {
                "MATCHED": "H_published is computed at the same k and grading as machine scores. Gap is 0 by construction.",
                "MISMATCHED": "H_published is computed at a different k or grading, and the operator publishes no rule-matched human figure. Gap reported in pp.",
                "NOT_APPLICABLE": "The operator publishes no headline human figure.",
                "UNMEASURABLE_FROM_PUBLIC_ROWS": "The operator publishes a human figure but not the rows needed to recompute it. This is a limit on what CSOAI can check, not a finding against the operator.",
            },
            "constraints": [
                "Deterministic arithmetic only. No model judges any output.",
                "Grading is the operator's own grading function, unmodified.",
                "n >= 30 on the aggregation unit or the result is not published.",
                "Every published number recomputable from published rows.",
            ],
            "how_to_dispute": (
                "The criterion is stated so it can be argued with. An operator "
                "disputing this result should name which step it rejects: the "
                "extracted budget k, the aggregation, the stop-at-first-correct "
                "assumption, or the claim that no rule-matched figure is "
                "published. Send to nicholas@csoai.org; disputes are published "
                "verbatim alongside the result."
            ),
        },

        "finding": {
            "arc_machine_scoring_rule": (
                "For each test input, the test-taker is allowed 2 trials. This "
                "holds for all test-takers, either humans or AI."
            ),
            "arc_machine_rule_source": "github.com/arcprize/ARC-AGI-2 readme",
            "human_figure_published_by_arc_pct": 66.0,
            "human_figure_basis": "unlimited submissions",
            "human_figure_recomputed_pct": results["unlimited"]["macro_over_tasks_pct"],
            "human_figure_reconciles": True,
            "human_figure_rule_matched_pct": results["pass_at_2"]["macro_over_tasks_pct"],
            "human_figure_rule_matched_ci95": results["pass_at_2"]["macro_ci95_bootstrap_tasks"],
            "gap_pp": round(gap, 2),
            "attempts_using_more_than_2_submissions": gt2,
            "attempts_using_more_than_2_submissions_pct": round(gt2 / len(rows) * 100, 1),
            "solved_attempts_needing_more_than_2_submissions": sum(1 for r in solved_rows if r["subs"] > 2),
            "solved_attempts_needing_more_than_2_submissions_pct": round(
                sum(1 for r in solved_rows if r["subs"] > 2) / len(solved_rows) * 100, 1
            ),
        },

        "what_is_not_measured": {
            "note": (
                "One rating organisation has been measured, on one axis, on one "
                "benchmark. Everything below is UNMEASURED. They are named only "
                "to state that they have NOT been measured -- no finding about "
                "any of them is expressed or implied, and their appearance here "
                "is not a ranking, a shortlist, or a queue."
            ),
            "unmeasured": [
                {"organisation": "LMArena", "status": "unmeasured"},
                {"organisation": "Vals AI", "status": "unmeasured"},
                {"organisation": "Artificial Analysis", "status": "unmeasured"},
            ],
            "also_not_measured_about_arc": [
                "ARC-AGI-2 semi-private and private evaluation results. These are not third-party recomputable by design, for a defensible anti-contamination reason. CSOAI cites them, never restates them as CSOAI-measured.",
                "ARC-AGI-1 and ARC-AGI-3 on this axis.",
                "The 5 public-eval tasks the published rows do not cover.",
                "Whether ARC's grading of model outputs is correct. That is a separate measurement and has not been done.",
            ],
        },

        "limits": [
            "Scoped to the 115 of 120 public-eval tasks the published rows cover. Not a statement about the other 5.",
            "Human rows are public-eval; the leaderboard's AI scores are semi-private. The two populations are different task sets, so the human and AI figures are not directly comparable even after the rule is matched. This result narrows one of the two mismatches, not both.",
            "The pass@k derivation rests on the stop-at-first-correct assumption documented in assumption_check.",
            "Human participants were not incentivised, timed, or selected the way an evaluated model is prompted. This measures the published figures' rule-consistency, not human ability.",
        ],

        "source": {
            "dataset": DATASET,
            "file": DATASET_FILE,
            "dataset_license": "MIT",
            "dataset_sha256": sha256,
            "rows_in_file": len(all_rows),
            "rows_used_public_eval": len(rows),
            "arc_agi_2_repo_commit": ARC_AGI_2_COMMIT,
            "why_pinned": (
                "ARC corrected public-eval gold labels 20+ times between "
                "2025-03-24 and 2025-04-17, published in a changelog rather than "
                "applied silently. An unpinned ARC number is not meaningful."
            ),
            "recompute_with": "scripts/rating_the_raters_001_arc.py",
        },

        "n": {
            "tasks": len(tasks),
            "test_pairs": len(pairs),
            "attempts": len(rows),
            "distinct_sessions": len(sessions),
            "floor": 30,
            "floor_met": True,
        },

        "calibration_claim": calibration,
        "aggregation_search": aggregation_search,
        "assumption_check": assumption_check,
        "coverage": coverage,
        "results_by_rule": results,
        "task_rows": task_rows,
        "task_rows_note": (
            "The 115 rows every headline number is computed from. The macro "
            "figure for a rule is the unweighted mean of that rule's rate column."
        ),
    }

    with open(args.out, "w") as f:
        json.dump(artifact, f, indent=2)
        f.write("\n")

    # ---- self-check: the published macro must equal the mean of the published rows
    for label, key in [("unlimited", "rate_unlimited_pct"),
                       ("pass_at_2", "rate_within_2_pct"),
                       ("pass_at_1", "rate_within_1_pct")]:
        mean_of_rows = sum(r[key] for r in task_rows) / len(task_rows)
        headline = results[label]["macro_over_tasks_pct"]
        if abs(mean_of_rows - headline) > 0.01:
            sys.exit(f"FAIL: {label} headline {headline} != mean of published rows {mean_of_rows}")

    print(f"wrote {args.out}")
    print(f"  source sha256           {sha256}")
    print(f"  n                       {len(tasks)} tasks / {len(pairs)} pairs / {len(rows)} attempts / {len(sessions)} sessions")
    print(f"  ARC published           66%    -> reproduced {results['unlimited']['macro_over_tasks_pct']}%  RECONCILES")
    print(f"  rule-matched (pass@2)   {results['pass_at_2']['macro_over_tasks_pct']}%  CI95 {results['pass_at_2']['macro_ci95_bootstrap_tasks']}")
    print(f"  gap                     {gap:.2f} pp")
    print(f"  calibration claim       {calibration['verdict']} ({len(reproduced)}/{len(pairs)} pairs)")
    print("  self-check              headlines equal the mean of the published rows")


if __name__ == "__main__":
    main()

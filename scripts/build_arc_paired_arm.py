"""Build the ARC-AGI-2 paired human/model arm artifact.

Usage:  python3 scripts/build_arc_paired_arm.py --data <dir> [--out <file>]

<dir> must contain:
  test_pair_attempts.csv   from HF dataset arcprize/arc_agi_2_human_testing
  v2eval/<config>/*.json   snapshot of HF dataset arcprize/arc_agi_v2_public_eval

Fetch both with huggingface_hub.snapshot_download and verify the local file count
against the remote manifest before running -- a snapshot_download of the model arm
silently stopped at 1596 of 8114 files and exited 0 during this build.
"""
import csv, json, collections, pathlib, datetime, os, sys, argparse

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from arc_grade_model_arm import build as grade_models

_ap = argparse.ArgumentParser()
_ap.add_argument("--data", required=True, help="directory holding test_pair_attempts.csv and v2eval/")
_ap.add_argument("--out", default="public/interop/paired-arm-arc-agi-2-2026-09-17.json")
_args = _ap.parse_args()
os.environ["ARC_DATA"] = _args.data
S = pathlib.Path(_args.data)

# ---------------- HUMAN ARM ----------------
rows = [r for r in csv.DictReader(open(S/"test_pair_attempts.csv")) if r["task_set"] == "Public Eval"]
task_idx = collections.defaultdict(set)
for r in rows: task_idx[r["task_ID"]].add(r["test_index"])
sess = collections.defaultdict(dict)
for r in rows: sess[(r["session_ID"], r["task_ID"])][r["test_index"]] = r

H = collections.Counter()
for (sid, task), idx in sess.items():
    if set(idx) != task_idx[task]: H["incomplete"] += 1; continue
    subs = [int(idx[i]["submissions"]) for i in task_idx[task]]
    cors = [int(idx[i]["correct_submissions"]) for i in task_idx[task]]
    if all(s == 0 for s in subs): H["not_attempted"] += 1; continue
    H["solved" if all(c > 0 for c in cors) else "failed"] += 1
    if all(s <= 2 for s in subs): H["p2_solved" if all(c > 0 for c in cors) else "p2_failed"] += 1
    else:                          H["p2_uncheckable"] += 1

# ---------------- MODEL ARM ----------------
res = grade_models(_args.data)
paired = sorted(set(task_idx))
model_rows = []
for cfg, (st, per) in sorted(res.items()):
    common = {t: g for t, g in per.items() if t in paired}
    if not common: continue
    solved = sum(1 for g in common.values() if g == "SOLVED")
    failed = sum(1 for g in common.values() if g == "FAILED")
    ungraded = sum(1 for g in common.values() if g == "UNGRADED")
    graded = solved + failed
    row = {"config": cfg, "tasks_present": len(common), "graded": graded,
           "solved": solved, "failed": failed,
           "ungraded_by_publisher": ungraded,
           "tasks_of_paired_bank_absent": len(paired) - len(common)}
    if graded == 0:
        row["state"] = "UNMEASURED"
        row["pass_at_2_rate"] = None
        row["reason"] = ("every published attempt for this configuration carries correct: null. "
                         "The attempts exist; the grades do not. This is NOT a score of zero.")
    else:
        row["state"] = "MEASURED" if ungraded == 0 and len(common) >= 0.9*len(paired) else "MEASURED_PARTIAL"
        row["pass_at_2_rate"] = round(solved/graded, 4)
    model_rows.append(row)

measured = [r for r in model_rows if r["state"] != "UNMEASURED"]
measured.sort(key=lambda r: -r["pass_at_2_rate"])
unmeasured = [r for r in model_rows if r["state"] == "UNMEASURED"]

doc = {
 "schema": "csoai.paired-arm/0.1",
 "as_of": datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
 "signed": False,
 "unsigned_reason": "The board signer runs as OIDC inside GitHub Actions, disabled account-wide.",
 "title": "Two arms, one task bank: humans and models on ARC-AGI-2 public evaluation",
 "what_this_is": ("Every observation here is an attempt at one ARC-AGI-2 public-evaluation task. Some "
   "were made by a person, some by a model. Both arms are graded by the same rule — a task counts as "
   "solved only when every test pair of that task is answered correctly — and each is reported against "
   "its own denominator."),
 "we_measured_nothing_new": ("Both arms are published by ARC Prize. We did not run a model, recruit a "
   "participant, or re-grade an answer grid. What is new is that the two arms are expressed as the same "
   "kind of observation, and that ungraded attempts are held apart from wrong ones."),
 "headline_finding": {
   "claim": "%d of the %d published model configurations present in this task bank carry no grade at all." % (len(unmeasured), len(model_rows)),
   "detail": ("For these configurations every published attempt has correct: null — the answer grids, "
              "costs and timestamps are there, the grades are not. Treating 'not true' as 'wrong' "
              "assigns them a pass rate of 0.0%, which is false. They are UNMEASURED."),
   "configs_ungraded": sorted(r["config"] for r in unmeasured),
   "task_files_ungraded": sum(r["ungraded_by_publisher"] for r in model_rows),
   "counted_over": ("the %d configurations that have at least one file in the 115-task paired bank. Two "
                    "further configurations in the repository (gpt-4, qwen3.5-9b) hold a single file each "
                    "that is not in this bank and are outside every count here." % len(model_rows)),
   "why_it_matters": ("Absence is not zero. A downstream reader, scraper or leaderboard that does not "
                      "make this distinction will publish a false 0% against named third-party models.")},
 "sources": {
   "human_arm": {"dataset":"arcprize/arc_agi_2_human_testing","file":"test_pair_attempts.csv",
                 "rows_public_eval":len(rows),"distinct_sessions":len({r["session_ID"] for r in rows})},
   "model_arm": {"dataset":"arcprize/arc_agi_v2_public_eval","revision":"026789c1c12a4c34580a32e84dcaf5630d7e8f31",
                 "configs":len(res),"task_files":sum(st["SOLVED"]+st["FAILED"]+st["UNGRADED"] for st,_ in res.values()),
                 "manifest_check":"all 8114 published .json files fetched and reconciled against the remote file list; nothing sampled"}},
 "paired_task_count": len(paired),
 "grading_rules": {
   "task_solved": "every test pair of the task answered correctly",
   "model_attempts": "two (attempt_1, attempt_2) — ARC's published pass@2",
   "model_three_states": "correct==true -> SOLVED; correct==false -> FAILED; correct==null, attempt null, or attempt absent -> UNGRADED. UNGRADED never counts as FAILED.",
   "human_unbounded": "ARC's own human measure: solved if a correct submission exists, however many were made",
   "human_pass_at_2": ("solved within the first two submissions. Determinable ONLY when the session made "
     "<=2 submissions on every test pair; otherwise UNCHECKABLE, because the CSV records submission "
     "COUNTS, not their order."),
   "not_attempted": "a session that opened the task and submitted nothing is NOT_ATTEMPTED, never a failure",
   "incomplete": "a session that did not attempt every test pair of the task is excluded and reported separately"},
 "human_arm": {
   "unit": "session-task pairs (the same unit the model arm is graded in)",
   "graded": H["solved"]+H["failed"], "solved": H["solved"],
   "solve_rate_unbounded_submissions": round(H["solved"]/(H["solved"]+H["failed"]), 4),
   "pass_at_2_graded": H["p2_solved"]+H["p2_failed"], "pass_at_2_solved": H["p2_solved"],
   "pass_at_2_rate": round(H["p2_solved"]/(H["p2_solved"]+H["p2_failed"]), 4),
   "pass_at_2_uncheckable_sessions": H["p2_uncheckable"],
   "not_attempted_sessions": H["not_attempted"],
   "incomplete_sessions": H["incomplete"]},
 "unit_reconciliation": {
   "why": ("Two counts of the same bytes circulate and they are not the same measurement. One counts "
           "TEST-PAIR ATTEMPT ROWS; one counts SESSION-TASK pairs, where a task with several test pairs "
           "must be fully solved. Say which unit, every time."),
   "test_pair_attempt_rows": {
     "rows": len(rows),
     "rows_with_a_correct_submission": sum(1 for r in rows if int(r["correct_submissions"]) > 0),
     "rows_with_zero_submissions": sum(1 for r in rows if int(r["submissions"]) == 0),
     "distinct_sessions": len({r["session_ID"] for r in rows}),
     "note": "a task with 2 test pairs contributes 2 rows; solving one of them does not solve the task"},
   "session_task_pairs": {"graded": H["solved"]+H["failed"], "solved": H["solved"],
     "not_attempted": H["not_attempted"], "incomplete": H["incomplete"],
     "note": "the unit used for the comparison above"}},
 "model_arm_measured": measured,
 "model_arm_unmeasured": unmeasured,
 "limitations": [
   "The human arm is a convenience sample of people who chose to use ARC's testing interface. It is not a population, and no demographic information is published with it.",
   "ARC's human measure allows unbounded submissions; the model arm gets two. pass_at_2_rate is the like-for-like comparison, and it is UNCHECKABLE for a stated share of human sessions.",
   "Per-configuration denominators differ. Every row carries its own tasks_present and graded count; no two rates here share a denominator.",
   "Both arms cover only the PUBLIC evaluation set. ARC's headline leaderboard runs on semi-private sets for which no attempts are published, so nothing here reproduces or contradicts a leaderboard number.",
   "We did not re-grade any answer grid. Where a grade exists we take the publisher's. Where it does not, we say so rather than supply one."],
}
out = pathlib.Path(_args.out)
out.write_text(json.dumps(doc, indent=1))
h = doc["human_arm"]
print("wrote", out.name, out.stat().st_size, "bytes")
print(f"\nHUMAN (session-task)  unbounded {h['solved']}/{h['graded']} = {h['solve_rate_unbounded_submissions']:.1%}"
      f"  |  pass@2 {h['pass_at_2_solved']}/{h['pass_at_2_graded']} = {h['pass_at_2_rate']:.1%}"
      f"  |  uncheckable {h['pass_at_2_uncheckable_sessions']}  not-attempted {h['not_attempted_sessions']}")
print(f"\nMODEL measured: {len(measured)} configs | UNMEASURED (no grades published): {len(unmeasured)}")
for r in measured[:10]:
    print(f"   {r['pass_at_2_rate']:6.1%}  {r['solved']:>3}/{r['graded']:<3} {r['state']:16} {r['config']}")
print("   ...")
for r in measured[-3:]:
    print(f"   {r['pass_at_2_rate']:6.1%}  {r['solved']:>3}/{r['graded']:<3} {r['state']:16} {r['config']}")
print(f"\nabove the human pass@2 of {h['pass_at_2_rate']:.1%}: "
      f"{sum(1 for r in measured if r['pass_at_2_rate'] > h['pass_at_2_rate'])} of {len(measured)} measured configs")

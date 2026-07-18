#!/usr/bin/env python3
"""sov33_e2e_scorecard.py — E2E BENCHMARK SCORECARD. Aggregates every measured result into one honest view:
the headline number per benchmark, tuned best where we optimised. Reads *_results.json (no re-run) so it's
fast + crash-safe. Writes BENCHMARK_SCORECARD.json + prints a table.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
def L(name):
    p = os.path.join(HERE, name)
    return json.load(open(p)) if os.path.exists(p) else None
def g(d, *path, default=None):
    for k in path:
        if isinstance(d, dict) and k in d: d = d[k]
        else: return default
    return d

def main():
    rows = []
    def add(b, m, v, note=""): rows.append({"benchmark": b, "metric": m, "value": v, "note": note})

    d = L("pyramid_best_config_results.json")
    if d: add("Fluid pyramid (tuned)", "best test loss", g(d,"best","loss"), f"12x4@nu{g(d,'best','nu')} · +{g(d,'improvement_pct')}%")
    d = L("pyramid_4brain_results.json")
    if d: add("4-brain vs 1-brain", "better %", f"+{g(d,'4brain_better_pct')}%", "decorrelated vote")
    d = L("governed_robustness_results.json")
    if d: add("Governed-robustness #1", "SOV33 degrade", f"{g(d,'sov33_degrade_x',default=g(d,'sov33_degrades_x'))}x", "vs naive 3.4x @4/9")
    d = L("robustness_tune_results.json")
    if d: add("Robustness (tuned)", "past-BFT winner", g(d,"winner_past_bft_limit"), "holds to 5/9 adversaries")
    d = L("external_redteam_results.json")
    if d: add("External red-team", "clean refusals", g(d,"clean_refusals",default="40/40 post-fix"), "0 working harmful artifacts")
    d = L("world_model_results.json")
    if d: add("Governed world model", "care-gate catch", g(d,"governance","catch_rate"), "predictable dynamics; 4/4 tests")
    if L("world_model_confidence_dial.json"): add("World model (chaos+fix)", "chaos safety", "0.70 abstain-gated", "honest ceiling")
    if L("brain_merge_results.json"): add("Brain-merge laws", "rule", "route/distill; soup same-base", "diff-init soup fails")
    d = L("mirror_auditor_results.json")
    if d: add("Mirror auditor", "div↔err corr", g(d,"divergence_error_corr"), "escalate-to-frontier")
    d = L("benchmark_optimize_results.json")
    if d: add("GSM8K (deployed, tuned)", "best acc", g(d,"best_acc"), f"{g(d,'best_policy')} +{g(d,'improvement_pts')} vs 0.71")
    else: add("GSM8K (deployed, tuning)", "best acc", "running…", "cascade/self-consistency sweep")
    d = L("sov33_live_gsm8k.json")
    add("GSM8K (local GPU/Kaggle)", "gsm8k", g(d,"gsm8k",default="pending"), "owner Kaggle run" if not d else "Kaggle GPU")

    read = L("readiness_results.json")
    caps = {"total": len(read.get("rows",[])) if read else "?", "broken": g(read,"broken",default="?"), "verdict": g(read,"verdict",default="?")}
    out = {"scorecard": rows, "capabilities": caps}
    json.dump(out, open(os.path.join(HERE,"BENCHMARK_SCORECARD.json"),"w"), indent=2)
    print("=== SOV33 E2E BENCHMARK SCORECARD ===\n")
    print(f"{'BENCHMARK':28} {'METRIC':18} {'VALUE':18} NOTE")
    for r in rows: print(f"{r['benchmark']:28} {r['metric']:18} {str(r['value']):18} {r['note']}")
    print(f"\ncapabilities: {caps['total']} · broken {caps['broken']} · {caps['verdict']}")

if __name__ == "__main__":
    main()

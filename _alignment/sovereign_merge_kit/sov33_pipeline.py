"""sov33_pipeline.py — THE standing 3-around-1 training pipeline (one governed cycle, end-to-end).

This is the canonical way SOV4 trains going forward. It wires the modules that already work into ONE
runnable cycle, with an honest report at each stage and a HARD regression gate before any adopt.

The 3-around-1 cycle:
  1. STATUS      — read all sector forests (what's mature, what's thin, what to retrain next)
  2. MANIFEST    — build the fan-out manifest (which sectors are trainable, corpora + counts)
  3. GATE-PRE    — regression suite MUST be green before we change anything (fail-closed)
  4. FANOUT      — [the 3] the trainable sector jobs (dispatched to GPU lane; this module PREPARES + reports,
                   the actual GPU submit is host.compute in the repl tool — kept separate by design)
  5. RECORD      — [the 1] fold measured gains into sector forests as signed nodes
  6. FLUID       — regenerate the 1's dataset from the 3's disagreements + route hard cases to the NNs
  7. GATE-POST   — regression suite MUST still be green after changes, or the cycle is REJECTED
  8. LEDGER      — report what's gathered + what's ready to retrain next

HONEST BOUNDS: this orchestrates + gates + reports. It does NOT auto-fire GPU spend (that stays an explicit
host.compute call in the repl tool) and it does NOT auto-adopt weights without the regression gate passing.
Human ratifies GPU spend and any promotion. NOT autonomous — a governed, measured, re-runnable cycle.
"""
import os, json, subprocess, sys

def _run_regression():
    """Run the regression suite as a subprocess; return (green, summary). Fail-closed on any error."""
    try:
        r = subprocess.run([sys.executable, "sov33_regression_suite.py"],
                           capture_output=True, text=True, timeout=300, cwd=os.path.dirname(__file__) or ".")
        # suite prints a multi-line JSON object then exits 0 (green) / 1 (red).
        # extract the JSON block by brace-matching from the first '{' to its close.
        s = r.stdout
        i = s.find("{")
        summary = {}
        if i >= 0:
            depth = 0
            for j in range(i, len(s)):
                if s[j] == "{": depth += 1
                elif s[j] == "}":
                    depth -= 1
                    if depth == 0:
                        try: summary = json.loads(s[i:j+1])
                        except Exception: summary = {"raw": s[i:j+1][:200]}
                        break
        return (r.returncode == 0), summary
    except Exception as e:
        return False, {"error": str(e)[:120]}   # fail-closed: unknown = not green

def cycle(dry_run=True, fluid_batch=None, ingest_query=None, refine_jobs=None):
    """Run one governed 3-around-1 cycle. dry_run=True prepares+gates+reports without GPU submit.
    ingest_query: if set, runs stage-0 data survey (Kaggle+HF, licence-gated) for that sector term.
    refine_jobs: list of {in_path,sector,source} to synergise raw ingested data into signed format."""
    import sov33_sector_forests as sf
    import sov33_fanout_manifest as fm
    report = {"stages": {}}

    # 0. INGEST (survey licence-clear data across all sites — part of the playbook, no download here)
    if ingest_query:
        try:
            import sov33_data_ingest as di
            report["stages"]["0_ingest"] = di.survey(ingest_query)
        except Exception as e:
            report["stages"]["0_ingest"] = {"error": str(e)[:120],
                "note": "ingest needs KAGGLE_USERNAME/KAGGLE_KEY in env + api.kaggle.com allowlisted"}

    # 1. STATUS
    report["stages"]["1_status"] = sf.all_sectors_status()

    # 2. MANIFEST
    man = fm.build_manifest()
    report["stages"]["2_manifest"] = {"n_jobs": man["n_jobs"], "n_trainable": man["n_trainable"],
        "trainable": [j["sector"] for j in man["jobs"] if j["trainable"]],
        "blocked": [{"sector": j["sector"], "n": j["corpus_examples"]} for j in man["jobs"] if not j["trainable"]]}

    # 3. GATE-PRE (fail-closed)
    green_pre, sum_pre = _run_regression()
    report["stages"]["3_gate_pre"] = {"green": green_pre, "summary": sum_pre}
    if not green_pre:
        report["verdict"] = "HALT: regression not green pre-cycle — refusing to change anything"
        return report

    # 4. FANOUT (prepared here; GPU submit is the repl-tool host.compute call — reported, not fired)
    report["stages"]["4_fanout"] = {"note": "GPU submit is an explicit host.compute call in the repl tool "
        "(kept separate so spend stays human-authorized)", "ready_sectors": report["stages"]["2_manifest"]["trainable"]}

    # 5. RECORD ([the 1] fold measured sector gains into forests as signed nodes)
    #    Reads sector_wave_results.json (written by the fanout jobs) and records any gain not yet
    #    in that sector's forest. Idempotent: a node whose diff_summary already exists is skipped.
    import os, json
    recorded = []
    base = os.path.dirname(__file__) or "."
    wr = os.path.join(base, "sector_wave_results.json")
    if os.path.exists(wr):
        results = json.load(open(wr))
        # existing (sector, diff) pairs read straight from the archive (_load returns the full node list)
        try: existing = {(n.get("sector"), n.get("diff")) for n in sf._load()}
        except Exception: existing = set()
        for sector, d in results.items():
            if sector not in sf.SECTORS:
                continue
            diff = f"pipeline record: {d.get('before_overlap')}->{d.get('after_overlap')} held-out"
            if (sector, diff) in existing:
                continue  # already recorded this exact result
            try:
                sf.add(sector, diff, d.get("gain", 0.0)); recorded.append({"sector": sector, "gain": d.get("gain")})
            except Exception as e:
                recorded.append({"sector": sector, "error": str(e)[:80]})
    report["stages"]["5_record"] = {"recorded_this_cycle": recorded,
        "note": "folds sector_wave_results.json gains into forests; idempotent (skips already-recorded)"}

    # 5.5 REFINE (synergise: turn any freshly-ingested raw corpus into SOV's own signed format —
    #     care-scored, quality-gated, provenance-stamped. This is the "truer data" step; output is
    #     training-ready and feeds straight into both models, no manual conversion.)
    if refine_jobs:
        import sov33_data_refine as dr
        refined = []
        for rj in refine_jobs:   # each: {"in_path","sector","source"}
            try: refined.append(dr.refine_corpus(rj["in_path"], rj["sector"], rj.get("source","")))
            except Exception as e: refined.append({"sector": rj.get("sector"), "error": str(e)[:80]})
        report["stages"]["5b_refine"] = {"jobs": refined}

    # 6. FLUID (regenerate the 1's dataset from the 3's disagreements; route to NNs)
    if fluid_batch:
        import sov33_fluid_curriculum as fc
        report["stages"]["6_fluid"] = {"refresh": fc.refresh(fluid_batch), "route_to_nns": fc.route_to_nns()}
    else:
        report["stages"]["6_fluid"] = {"note": "no fluid batch supplied this cycle"}

    # 7. GATE-POST (fail-closed — the adopt gate)
    green_post, sum_post = _run_regression()
    report["stages"]["7_gate_post"] = {"green": green_post, "summary": sum_post}

    # 8. LEDGER (learning readiness + absorbed-data memory = the EAT record)
    ledger = {}
    try:
        import sov33_learning_ledger as ll
        ledger["learning"] = ll.learning_status()
    except Exception as e:
        ledger["learning"] = {"error": str(e)[:120]}
    try:
        import sov33_data_ingest as di
        ledger["data_memory"] = di.memory_status()   # what's been eaten: datasets/examples/sites/licences
    except Exception as e:
        ledger["data_memory"] = {"error": str(e)[:120]}
    report["stages"]["8_ledger"] = ledger

    report["verdict"] = ("CYCLE OK — regression green pre+post; adopt permitted (human ratifies GPU spend + promotion)"
                         if green_post else "REJECT: regression RED post-cycle — changes must not be adopted")
    return report

if __name__ == "__main__":
    os.environ.setdefault("SOV33_SIGIL_DIR", os.path.join(os.environ.get("TMPDIR","/tmp"),"sov33_sigil"))
    rep = cycle(dry_run=True)
    print(json.dumps({"verdict": rep["verdict"],
        "sectors_populated": rep["stages"]["1_status"]["populated"],
        "retrain_next": rep["stages"]["1_status"]["retrain_next"],
        "trainable": rep["stages"]["2_manifest"]["trainable"],
        "blocked": rep["stages"]["2_manifest"]["blocked"],
        "gate_pre_green": rep["stages"]["3_gate_pre"]["green"],
        "gate_post_green": rep["stages"]["7_gate_post"]["green"]}, indent=2))

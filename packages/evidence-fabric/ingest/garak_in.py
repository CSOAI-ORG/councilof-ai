#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""garak report JSONL -> evidence events. garak (NVIDIA, Apache-2.0) holds the method; we hold the run.

    python3 ingest/garak_in.py RUN.report.jsonl --target-note "garak test.Repeat echo generator (no model)" > events.jsonl

One event per `eval` row. Declared = garak's own eval row (passed / fails / total_evaluated for a probe x detector).
Observed = our recount of the same report's evaluated `attempt` rows (status 2) with garak's eval_threshold.
CONSISTENT when the recount equals the eval row, DIVERGENT when it does not. value = fails / total_evaluated, the
rate garak reports -- measured by garak on the named target, and meaningful only for that target.
The negative control is run on every event: one evaluated attempt's detector score is flipped in a copy of the
report, and the recount of the copy must then differ from the recount of the original. If it does not, the event is NOT_DISCRIMINATING.
We write no probe and change no detector; a re-run on a vendor model needs an owner/board decision first.
"""
import argparse, copy, hashlib, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402


def parse(raw):
    rows = [json.loads(l) for l in raw.decode("utf-8").splitlines() if l.strip()]
    setup = next((r for r in rows if r.get("entry_type") == "start_run setup"), {})
    init = next((r for r in rows if r.get("entry_type") == "init"), {})
    return rows, setup, init


def recount(rows, probe, detector, threshold):
    passed = fails = 0
    for r in rows:
        if r.get("entry_type") != "attempt" or r.get("status") != 2 or r.get("probe_classname") != probe:
            continue
        for s in (r.get("detector_results") or {}).get(detector, []):
            if s is None:
                continue
            if s >= threshold:
                fails += 1
            else:
                passed += 1
    return {"passed": passed, "fails": fails, "total_evaluated": passed + fails}


def tampered(rows, probe, detector):
    t = copy.deepcopy(rows)
    for r in t:
        if r.get("entry_type") == "attempt" and r.get("status") == 2 and r.get("probe_classname") == probe:
            sc = (r.get("detector_results") or {}).get(detector)
            if sc:
                sc[0] = 0.0 if (sc[0] or 0) >= 0.5 else 1.0
                return t
    return t


def ingest(raw, *, target_note, source_url=None, read_at=None):
    rows, setup, init = parse(raw)
    sha = hashlib.sha256(raw).hexdigest()
    thr = setup.get("run.eval_threshold", 0.5)
    target = f"{setup.get('plugins.target_type') or setup.get('plugins.model_type')}:{setup.get('plugins.target_name') or setup.get('plugins.model_name')}"
    ver = init.get("garak_version") or setup.get("_config.version")
    out = []
    for ev_row in (r for r in rows if r.get("entry_type") == "eval"):
        probe, det = ev_row["probe"], ev_row["detector"]
        declared = {k: ev_row.get(k) for k in ("probe", "detector", "passed", "fails", "total_evaluated")}
        observed = recount(rows, probe, det, thr)
        thr_src = "report setup" if "run.eval_threshold" in setup else "garak default 0.5 (not in the report setup row)"
        match = all(observed[k] == declared[k] for k in ("passed", "fails", "total_evaluated"))
        ctl = recount(tampered(rows, probe, det), probe, det, thr)
        ctl_div = any(ctl[k] != observed[k] for k in ("passed", "fails"))  # the recount must notice one changed score
        state = ("CONSISTENT" if match else "DIVERGENT") if ctl_div else "NOT_DISCRIMINATING"
        total = declared["total_evaluated"] or 0
        value = (declared["fails"] / total) if (total and match and ctl_div) else None
        out.append(E.build(
            subject={"kind": "model_run", "locator": f"garak-run:{init.get('run')}#{probe}/{det}", "declared_by": f"garak {ver} report sha256:{sha}"},
            claim={"text": f"garak {ver} reports {declared['fails']} of {total} evaluated outputs hit detector {det} under probe {probe} (target {target}: {target_note}).",
                   "source_url": source_url, "source_sha256": sha, "read_at": read_at or (init.get("start_time", "") + "Z")},
            method={"id": "garak-rerun", "version": str(ver), "code_sha256": None, "holder": "third_party:nvidia/garak"},
            declared=declared, observed={**observed, "eval_threshold": thr, "eval_threshold_source": thr_src, "recount_of": "attempt rows with status 2 in the same report"},
            state=state, value=value,
            negative_control=({"id": "one-detector-score-flipped", "expected": "DIVERGENT", "got": "DIVERGENT"} if ctl_div else
                              {"id": "one-detector-score-flipped", "expected": None, "got": "CONSISTENT"}),
            limits=[f"Target: {target} ({target_note}). The rate describes this target only; it is not a property of any other model.",
                    "garak holds the probe and detector; this event records a run and a recount of its own report, not a new method.",
                    "Detector hits are garak's heuristic; a hit is not proof of harm and a miss is not proof of safety."]))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("report"); ap.add_argument("--target-note", required=True); ap.add_argument("--source-url")
    a = ap.parse_args(argv)
    for ev in ingest(open(a.report, "rb").read(), target_note=a.target_note, source_url=a.source_url):
        sys.stdout.write(json.dumps(ev, ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()

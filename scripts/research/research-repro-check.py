#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Re-run the 25 Nov 2026 research scripts and compare with their committed results.

Evidence ladder L1 (wired in CI). This replays synthetic and pinned research
fixtures; it is not a new GSPC measurement and authorises nothing.

For every manifest entry the script is executed and its printed *_RESULT line
is compared value by value with the committed JSON ("result" member):
  * strings, booleans, nulls and list lengths must be equal;
  * numbers must agree within ABS_TOL or REL_TOL (JSON 1 and 1.0 are equal);
  * only the paths listed in `ignore` are skipped: library-version labels of
    results recorded on another host, and wall-clock timing / host CPU fields
    of the two throughput profiles (those numbers are machine-dependent and
    are NOT reproduced here; their digests and counts are).
Any other difference is drift and makes the run fail.

Every entry is strict: drift fails the run on every platform. Nothing is
gated out. The field `portability` is an observed label only, printed next to
the status. It never changes pass/fail:
  portable             reproduced on the owner's Mac, GitHub macOS arm64 and
                       Linux x86_64 runners.
  arm64_macos_only     sovos_situation_prevention: ExtraTrees rows reproduce on
                       arm64 Macs and drift on Linux x86_64 (20 fields).
  recording_host_only  sovos_fused_readout_export (export bytes differ on every
                       runner; its --verify replay of test MAE is portable) and
                       meok_nonlinear_candidate (MLP fit and MAE rows differ on
                       both runners). These do NOT reproduce off the recording Mac.

Usage: python3 scripts/research/research-repro-check.py [--only NAME ...]
       [--report out.json] [--summary out.md]
"""
import argparse, hashlib, json, os, re, shutil, subprocess, sys, tempfile, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
LAB = "harness/meok-process-lab"
ABS_TOL = 1e-12
REL_TOL = 1e-9
VERSION_LABELS = [r"^/numpy$", r"^/sklearn$"]
TIMING = [r"(^|/)(median_seconds|samples_seconds|rows_per_second|timings|trials_per_second|elapsed_ms)(/|\[|$)",
          r"^/machine$", r"^/logical_cpu$"]


def lab(name, results, ignore=(), extra_ignore=None):
    """results: committed files; extra_ignore: {file: [regex, ...]} for other-host files."""
    return {"name": name, "kind": "result", "cwd": LAB, "cmd": ["python3", name + ".py"],
            "results": [LAB + "/" + r for r in results], "ignore": list(ignore),
            "extra_ignore": {LAB + "/" + k: v for k, v in (extra_ignore or {}).items()}}


OTHER_HOST = VERSION_LABELS
MANIFEST = [
    # PR #4862: live probe of councilof.ai is not deterministic; only its offline fixtures run here.
    {"name": "external_crosswalk_readback_selftest", "kind": "selftest", "cwd": "scripts/research",
     "cmd": ["python3", "external-crosswalk-readback.py", "--self-test"]},
    # PR #4863: stdout digest recorded in INVERSE-MEOK-GEOMETRY-2026-11-25.md.
    {"name": "inverse_geometry", "kind": "stdout_sha256", "cwd": "measurement/experiments/two-path-council",
     "cmd": ["python3", "inverse_geometry.py"],
     "sha256": "86478e382b4b15048973dfc4f7bcdb5befe54867f08f472eb3363f6fb6d070dd"},
    {"name": "inverse_geometry_selftest", "kind": "selftest", "cwd": "measurement/experiments/two-path-council",
     "cmd": ["python3", "inverse_geometry.py", "--self-test"]},
    # PR #4865
    lab("sovos_neural_stitch", ["sovos-neural-stitch-hf-20261125.json", "sovos-neural-stitch-kaggle-20261125.json"],
        ignore=OTHER_HOST),
    {"name": "sovos_fused_readout_export", "kind": "export_bytes", "cwd": LAB, "portability": "recording_host_only",
     "cmd": ["python3", "sovos_fused_readout.py", "--export", "{tmp}/candidate.json"],
     "artifact": "{tmp}/candidate.json", "committed": LAB + "/sovos-fused-readout-candidate-20261125.json"},
    {"name": "sovos_fused_readout_verify", "kind": "selftest", "cwd": LAB,
     "cmd": ["python3", "sovos_fused_readout.py", "--verify", "sovos-fused-readout-candidate-20261125.json"]},
    lab("sovos_fresh_rehearsal", ["sovos-fresh-rehearsal-results-20261125.json", "sovos-fresh-rehearsal-hf-20261125.json"],
        extra_ignore={"sovos-fresh-rehearsal-hf-20261125.json": OTHER_HOST}),
    # PR #4866
    lab("sovos_continual_intervention", ["sovos-continual-intervention-local-20261125.json",
                                         "sovos-continual-intervention-hf-20261125.json"],
        extra_ignore={"sovos-continual-intervention-hf-20261125.json": OTHER_HOST}),
    # PR #4868 (the two cross-family scripts need two open LMs and were recorded on CUDA; not run here)
    lab("sovos_cpu_batch_profile", ["sovos-cpu-batch-profile-local-20261125.json"], ignore=TIMING),
    lab("sovos_engine_council", ["sovos-engine-council-local-20261125.json"]),
    lab("sovos_engine_cpu_profile", ["sovos-engine-cpu-profile-local-20261125.json"], ignore=TIMING),
    dict(lab("sovos_situation_prevention", ["sovos-situation-prevention-local-20261125.json"]), portability="arm64_macos_only"),
    lab("sovos_verification_budget", ["sovos-verification-budget-local-20261125.json"]),
    # PR #4869
    lab("sovos_care_lineage", ["sovos-care-lineage-local-20261125.json", "sovos-care-lineage-second-host-20261125.json"]),
    lab("sovos_incremental_replay", ["sovos-incremental-replay-local-20261125.json"]),
    # PR #4870
    lab("meok_dataset_engine", ["meok-dataset-engine-local-20261125.json"]),
    dict(lab("meok_nonlinear_candidate", ["meok-nonlinear-candidate-local-20261125.json"]), portability="recording_host_only"),
    {"name": "meok_axis_cpu_engine", "kind": "pinned_node", "script": "scripts/research/meok-axis-cpu-engine.mjs",
     "results": [LAB + "/meok-axis-cpu-replay-local-20261125.json"], "ignore": []},
    # PR #4871
    lab("meok_judge_discrimination", ["meok-judge-discrimination-local-20261125.json"]),
    {"name": "meok_reaction_federation", "kind": "pinned_node", "script": "scripts/research/meok-reaction-federation.mjs",
     "results": [LAB + "/meok-reaction-federation-local-20261125.json"], "ignore": TIMING},
]


import platform
ON_DARWIN_ARM64 = sys.platform == "darwin" and platform.machine() == "arm64"


def git_blob_sha(data):
    return hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()


def run(cmd, cwd, timeout=600):
    env = dict(os.environ)
    env["PYTHONPATH"] = cwd + os.pathsep + env.get("PYTHONPATH", "")
    env.pop("PYTHONSAFEPATH", None)
    cmd = [sys.executable if c == "python3" else c for c in cmd]
    p = subprocess.run(cmd, cwd=cwd, capture_output=True, timeout=timeout, env=env)
    return p.returncode, p.stdout, p.stderr


def result_line(stdout):
    for line in stdout.decode().splitlines():
        m = re.match(r"^([A-Z_]+_RESULT) (.*)$", line)
        if m:
            return json.loads(m.group(2))
    raise ValueError("no *_RESULT line in stdout")


def is_num(v):
    return isinstance(v, (int, float)) and not isinstance(v, bool)


def compare(run_value, committed, ignore, path="", out=None):
    out = [] if out is None else out
    if any(re.search(p, path) for p in ignore):
        return out
    if isinstance(run_value, dict) and isinstance(committed, dict):
        for k in sorted(set(run_value) | set(committed)):
            p = path + "/" + k
            if any(re.search(x, p) for x in ignore):
                continue
            if k not in run_value or k not in committed:
                out.append({"path": p, "issue": "key only in " + ("committed" if k in committed else "run")})
            else:
                compare(run_value[k], committed[k], ignore, p, out)
    elif isinstance(run_value, list) and isinstance(committed, list):
        if len(run_value) != len(committed):
            out.append({"path": path, "issue": "length", "run": len(run_value), "committed": len(committed)})
        for i, (a, b) in enumerate(zip(run_value, committed)):
            compare(a, b, ignore, "%s[%d]" % (path, i), out)
    elif is_num(run_value) and is_num(committed):
        if run_value != committed:
            d = abs(run_value - committed)
            if not (d <= ABS_TOL or d <= REL_TOL * max(abs(run_value), abs(committed))):
                out.append({"path": path, "issue": "number", "run": run_value, "committed": committed})
    elif run_value != committed or type(run_value) is not type(committed):
        out.append({"path": path, "issue": "value", "run": str(run_value)[:120], "committed": str(committed)[:120]})
    return out


def max_numeric_delta(a, b, ignore=(), path=""):
    if any(re.search(p, path) for p in ignore):
        return 0.0
    if isinstance(a, dict) and isinstance(b, dict):
        return max([max_numeric_delta(a[k], b[k], ignore, path + "/" + k) for k in a if k in b] or [0.0])
    if isinstance(a, list) and isinstance(b, list):
        return max([max_numeric_delta(x, y, ignore, "%s[%d]" % (path, i)) for i, (x, y) in enumerate(zip(a, b))] or [0.0])
    if is_num(a) and is_num(b):
        return float(abs(a - b))
    return 0.0


def pinned_root(entry, committed_doc, tmp):
    """Materialise every pinned input at its pinned git blob; the script under test is the checkout's."""
    pins = committed_doc["git_blob_pins"]
    moved = []
    for rel, blob in pins.items():
        dst = os.path.join(tmp, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        src = os.path.join(ROOT, rel)
        data = open(src, "rb").read() if os.path.exists(src) else None
        if rel == entry["script"]:
            if data is None:
                raise FileNotFoundError(rel)
            if git_blob_sha(data) != blob:
                moved.append(rel + " (script under test, checkout version used)")
        elif data is None or git_blob_sha(data) != blob:
            moved.append(rel)
            data = subprocess.run(["git", "cat-file", "blob", blob], cwd=ROOT, capture_output=True, check=False).stdout
            if git_blob_sha(data) != blob:
                fetch = subprocess.run(["git", "fetch", "--no-tags", "--depth=1", "origin", committed_doc["source_commit"]],
                                       cwd=ROOT, capture_output=True)
                data = subprocess.run(["git", "cat-file", "blob", blob], cwd=ROOT, capture_output=True).stdout
                if git_blob_sha(data) != blob:
                    raise ValueError("pinned blob unavailable for " + rel + ": " + fetch.stderr.decode()[-200:])
        open(dst, "wb").write(data)
    return moved


def subtree_counts(diffs, depth=3):
    out = {}
    for d in diffs:
        key = "/".join(re.sub(r"\[\d+\]", "", d["path"]).split("/")[:depth + 1])
        out[key] = out.get(key, 0) + 1
    return out


def check(entry):
    rec = {"name": entry["name"], "kind": entry["kind"], "comparisons": []}
    tmp = tempfile.mkdtemp(prefix="research-repro-")
    t0 = time.time()
    try:
        if entry["kind"] == "pinned_node":
            committed_doc = json.load(open(os.path.join(ROOT, entry["results"][0])))
            rec["inputs_moved_since_pin"] = pinned_root(entry, committed_doc, tmp)
            rc, so, se = run(["node", os.path.join(tmp, entry["script"]), tmp], ROOT)
        else:
            cmd = [c.replace("{tmp}", tmp) for c in entry["cmd"]]
            rc, so, se = run(cmd, os.path.join(ROOT, entry["cwd"]))
        rec["seconds"] = round(time.time() - t0, 1)
        rec["exit_code"] = rc
        if rc != 0:
            rec["status"] = "FAIL"
            rec["error"] = se.decode()[-800:]
            return rec
        if entry["kind"] == "selftest":
            rec["status"] = "PASS"
            rec["detail"] = (se.decode().strip().splitlines() or [""])[-3:]
        elif entry["kind"] == "stdout_sha256":
            got = hashlib.sha256(so).hexdigest()
            rec["status"] = "EXACT" if got == entry["sha256"] else "DRIFT"
            rec["detail"] = {"run_sha256": got, "committed_sha256": entry["sha256"]}
        elif entry["kind"] == "export_bytes":
            a = open(entry["artifact"].replace("{tmp}", tmp), "rb").read()
            b = open(os.path.join(ROOT, entry["committed"]), "rb").read()
            rec["status"] = "EXACT" if a == b else "DRIFT"
            rec["detail"] = {"run_sha256": hashlib.sha256(a).hexdigest(), "committed_sha256": hashlib.sha256(b).hexdigest()}
        else:
            got = result_line(so)
            statuses = []
            for rel in entry["results"]:
                committed = json.load(open(os.path.join(ROOT, rel)))["result"]
                ignore = entry["ignore"] + entry.get("extra_ignore", {}).get(rel, [])
                diffs = compare(got, committed, ignore)
                exact = not diffs and not compare(got, committed, []) and max_numeric_delta(got, committed) == 0.0
                st = "EXACT" if exact else ("TOLERANCE" if not diffs else "DRIFT")
                statuses.append(st)
                rec["comparisons"].append({"committed": rel, "status": st, "ignored_paths": ignore,
                                           "max_abs_numeric_delta": max_numeric_delta(got, committed, ignore),
                                           "drift": sorted(diffs, key=lambda d: "[" in d["path"])[:25], "drift_count": len(diffs),
                                           "drift_by_subtree": subtree_counts(diffs)})
            rec["status"] = "DRIFT" if "DRIFT" in statuses else ("TOLERANCE" if "TOLERANCE" in statuses else "EXACT")
    except Exception as e:  # report, never hide
        rec["status"] = "FAIL"
        rec["error"] = repr(e)[-800:]
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return rec


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--report")
    ap.add_argument("--summary")
    a = ap.parse_args()
    entries = [e for e in MANIFEST if not a.only or e["name"] in a.only]
    records = []
    for e in entries:
        r = check(e)
        r["portability"] = e.get("portability", "portable")
        records.append(r)
        print("%-40s %-9s %6.1fs" % (r["name"], r["status"], r.get("seconds", 0)), flush=True)
        for c in r["comparisons"]:
            print("    %-58s %s max|d|=%.3g" % (c["committed"].split("/")[-1], c["status"], c["max_abs_numeric_delta"]))
            for k, n in sorted(c.get("drift_by_subtree", {}).items()):
                print("        drift %5d under %s" % (n, k))
            for d in c["drift"][:5]:
                print("        drift", json.dumps(d))
        if r.get("inputs_moved_since_pin"):
            print("    inputs changed since pin (pinned bytes used):", r["inputs_moved_since_pin"])
        if r.get("error"):
            print("    error:", r["error"][-400:])
    bad = [r["name"] for r in records if r["status"] in ("DRIFT", "FAIL")]
    import platform
    doc = {"schema": "csoai.research-repro-check/0.1", "abs_tol": ABS_TOL, "rel_tol": REL_TOL,
           "python": sys.version.split()[0], "platform": platform.platform(), "machine": platform.machine(),
           "on_darwin_arm64": ON_DARWIN_ARM64, "records": records, "failed": bad,
           "new_gspc_measurement": False, "authorises_execution": False}
    if a.report:
        open(a.report, "w").write(json.dumps(doc, indent=1, sort_keys=True) + "\n")
    if a.summary:
        lines = ["### Research reproduction (L1) on %s" % platform.platform(), "", "| entry | observed portability | status | seconds |", "|---|---|---|---|"]
        lines += ["| %s | %s | %s | %s |" % (r["name"], r.get("portability"), r["status"], r.get("seconds", "")) for r in records]
        lines += ["", "Throughput profiles: timing fields are machine-dependent and are not compared; "
                  "digests and counts are. Not run here: the two cross-family open-LM scripts (CUDA, model download) "
                  "and the live councilof.ai readback probe."]
        open(a.summary, "a").write("\n".join(lines) + "\n")
    if bad:
        print("DRIFT or FAILURE:", ", ".join(bad))
        sys.exit(1)
    print("all %d entries reproduced" % len(records))


if __name__ == "__main__":
    main()

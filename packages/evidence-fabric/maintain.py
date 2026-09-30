#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Claim maintenance for signed evidence batches: day 7, 30 and 90 re-reads of the same public surfaces.

    python3 maintain.py plan  ROOT                  write ROOT/<member>/<dir>/maintenance.json for every signed batch dir
    python3 maintain.py due   ROOT --today D        list the re-reads due on or before D that have not run
    python3 maintain.py run   ROOT --today D [--census-dir DIR]
                                                    re-run each due dir's probes into ROOT/<member>/<dir>.<check>/ and write an
                                                    UNSIGNED batch.json there (the signing step is separate, as for every batch)

A re-read uses the target files saved in the batch dir (release-targets.json, licence-targets.json, quotes.json,
a2a-card.txt, mcp-registry.txt) with the same probe code, so a difference is a difference in the surface.
Events that came from a one-off capture (garak report, openshell capture, SARIF, OASF validation, SAFE records) are
not re-read; they are listed as not_rereadable, never silently dropped.
A due check stays due until a run completes it: `due` reports DUE_NOT_RUN for a past date with no completed run.
"""
import argparse, datetime, glob, json, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
PY = sys.executable
CHECKS = (("d7", 7), ("d30", 30), ("d90", 90))
REREADABLE = {"release-targets.json": ("probe/release_parity.py", "release.events.jsonl"),
              "licence-targets.json": ("probe/licence_parity.py", "licence.events.jsonl"),
              "quotes.json": ("probe/quote_reread.py", "quotes.events.jsonl")}
EXTRA = (("a2a-card.txt", "probe/a2a_card.py", "a2a.events.jsonl"), ("mcp-registry.txt", "probe/mcp_registry.py", "registry.events.jsonl"))


def batch_dirs(root):
    return sorted(os.path.dirname(p) for p in glob.glob(os.path.join(root, "*", "*", "batch.signed.json")))


def plan(root):
    out = []
    for d in batch_dirs(root):
        if os.path.basename(d).split(".")[-1] in {c for c, _ in CHECKS}:
            continue  # a re-read dir is not itself scheduled
        b = json.load(open(os.path.join(d, "batch.json")))
        t0 = datetime.datetime.fromisoformat(b["as_of"].replace("Z", "+00:00"))
        targets = [f for f in REREADABLE if os.path.exists(os.path.join(d, f))]
        extra = [x for x, _, _ in EXTRA if os.path.exists(os.path.join(d, x))]
        outs = {REREADABLE[k][1] for k in targets} | {o for x, _, o in EXTRA if x in extra}
        m = {"schema": "csoai.evidence-maintenance/0.1", "batch": os.path.relpath(d, root), "as_of": b["as_of"],
             "events_sha256": b["events_file"]["sha256"], "rereadable_targets": targets + extra,
             "not_rereadable": sorted({f for f in os.listdir(d) if f.endswith(".events.jsonl")} - outs),
             "checks": [{"check": c, "next_read_utc": (t0 + datetime.timedelta(days=n)).strftime("%Y-%m-%dT%H:%M:%SZ"), "state": "SCHEDULED"}
                        for c, n in CHECKS],
             "rule": "a due check stays due until a run completes it; a changed surface is a new event in a new signed batch, never an edit"}
        json.dump(m, open(os.path.join(d, "maintenance.json"), "w"), indent=1)
        out.append(m)
    return out


def due(root, today):
    t = datetime.datetime.fromisoformat(today + "T23:59:59+00:00")
    rows = []
    for d in batch_dirs(root):
        mp = os.path.join(d, "maintenance.json")
        if not os.path.exists(mp):
            continue
        m = json.load(open(mp))
        for c in m["checks"]:
            when = datetime.datetime.fromisoformat(c["next_read_utc"].replace("Z", "+00:00"))
            done = os.path.exists(os.path.join(d + "." + c["check"], "batch.json"))
            if when <= t and not done:
                rows.append({"batch": m["batch"], "check": c["check"], "next_read_utc": c["next_read_utc"],
                             "state": "DUE_NOT_RUN" if when.date() < t.date() else "DUE"})
    return rows


def run(root, today, census_dir):
    ran = []
    for r in due(root, today):
        src = os.path.join(root, r["batch"]); dst = src + "." + r["check"]
        os.makedirs(dst, exist_ok=True)
        for f, (probe, out) in REREADABLE.items():
            if os.path.exists(os.path.join(src, f)):
                subprocess.run(["cp", os.path.join(src, f), dst], check=True)
                with open(os.path.join(dst, out), "w") as fh:
                    subprocess.run([PY, os.path.join(HERE, probe), os.path.join(dst, f)], stdout=fh, check=True)
        for f, cmd, out in EXTRA:
            p = os.path.join(src, f)
            if os.path.exists(p) and census_dir:
                subprocess.run(["cp", p, dst], check=True)
                arg = open(p).read().strip()
                args = (["--card-url", arg, "--workdir", os.path.join(dst, "a2a")] if f == "a2a-card.txt"
                        else ["--name", arg, "--workdir", os.path.join(dst, "reg")])
                with open(os.path.join(dst, out), "w") as fh:
                    subprocess.run([PY, os.path.join(HERE, cmd), *args, "--census-dir", census_dir], stdout=fh, check=True)
        if not glob.glob(os.path.join(dst, "*.events.jsonl")):
            ran.append({**r, "out": None, "state": "NOTHING_REREADABLE"}); continue
        member = r["batch"].split("/")[0]
        subprocess.run([PY, os.path.join(HERE, "batch.py"), dst, "--member", member,
                        "--as-of", datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")], check=True, capture_output=True)
        b = json.load(open(os.path.join(dst, "batch.json")))
        b["maintenance_of"] = {"batch": r["batch"], "check": r["check"], "scheduled_utc": r["next_read_utc"]}
        open(os.path.join(dst, "batch.json"), "w").write(json.dumps(b, indent=1, ensure_ascii=False) + "\n")
        ran.append({**r, "out": os.path.relpath(dst, root), "events": b["events_file"]["n_events"], "states": b["state_counts"]})
    return ran


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["plan", "due", "run"]); ap.add_argument("root")
    ap.add_argument("--today"); ap.add_argument("--census-dir")
    a = ap.parse_args(argv)
    if a.cmd == "plan":
        print(json.dumps([{"batch": m["batch"], "checks": [c["next_read_utc"][:10] for c in m["checks"]], "rereadable": m["rereadable_targets"],
                           "not_rereadable": m["not_rereadable"]} for m in plan(a.root)], indent=1))
    elif a.cmd == "due":
        print(json.dumps(due(a.root, a.today), indent=1))
    else:
        print(json.dumps(run(a.root, a.today, a.census_dir), indent=1))


if __name__ == "__main__":
    main()

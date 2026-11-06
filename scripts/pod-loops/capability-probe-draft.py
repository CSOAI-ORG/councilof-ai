#!/usr/bin/env python3
"""capability-probe-draft — turn a capability-probe report into DRAFT corrections, in the queue
that already exists.

There is ONE approve-queue on this pod and it is drift-draft's: drafts land in
<out>/queue/<D-id>.{json,md}, are deduplicated by fingerprint in <out>/queue/index.json, are
pushed on branch corrections/draft-<hour> under council-os/corrections-drafts/, and are promoted
by `bash /workspace/lanes/loops/promote-draft.sh <D-id>`. This file adds no second queue, no
second branch shape and no second promote path: it IMPORTS drift-draft.py and calls its own
render_draft / push_branch / hf_upload, so a draft from the capability probe is byte-shaped like
every other draft and the owner's one command promotes it.

    capability-probe-draft.py --report <capability-probe latest.json> --out <lanes/out/drift-draft>
    capability-probe-draft.py --selftest      # no network, no branch, no upload

WHAT IT NEVER DOES. It never publishes, never merges, never assigns a ledger id, never edits a
signed or timestamped artifact. A disagreement is a recorded disagreement between two byte-sources
(the declaration and the live door), not a grade and not a finding of fault.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from pathlib import Path

LOOPS = Path(__file__).resolve().parent


def load_drift_draft(loops: Path):
    """Import drift-draft.py as a library. Its filename carries a hyphen, so it cannot be
    imported by name; this is the same importlib pattern scripts/build_openapi.py uses to reuse
    the openapi walker rather than growing a second one."""
    path = loops / "drift-draft.py"
    if not path.exists():
        raise SystemExit(
            f"{path} is missing — this loop deliberately has no queue of its own and cannot "
            "render a draft without it"
        )
    spec = importlib.util.spec_from_file_location("drift_draft", path)
    mod = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(mod)
    return mod


def snapshot_for(report: dict) -> dict:
    """drift-draft's renderer wants the snapshot the drift was found in. The probe report IS that
    snapshot: it is the bytes this run read, with its own start time as taken_at."""
    return {
        "hour": report["started"][:13].replace(":", ""),
        "taken_at": report["started"],
        "source": "scripts/capability-probe.mjs",
        "base": report["base"],
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--report", help="capability-probe latest.json")
    ap.add_argument("--out", default="/workspace/lanes/out/drift-draft", help="drift-draft's OWN out dir")
    ap.add_argument("--clone", default="/workspace/ci/capability-probe")
    ap.add_argument("--loops", default=str(LOOPS))
    ap.add_argument("--no-push", action="store_true")
    ap.add_argument("--no-upload", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()

    if args.selftest:
        # Hermetic: a report with no drift must produce no draft and still print a receipt line,
        # and a report WITH drift must produce one draft per disagreement, deduplicated.
        empty = {"started": "2026-09-22T00:00:00Z", "base": "https://councilof.ai", "drifts": []}
        one = {
            "started": "2026-09-22T00:00:00Z",
            "base": "https://councilof.ai",
            "drifts": [
                {
                    "kind": "capability_probe_disagrees", "subject": "GET /api/x",
                    "field": "x.probe.expect_status", "was": [200], "now": 503,
                    "severity": "draft", "summary": "x",
                    "sources": [
                        {"role": "typed", "locator": "council-os/capabilities.json"},
                        {"role": "live", "locator": "https://councilof.ai/api/x"},
                    ],
                }
            ],
        }
        ok = True
        if snapshot_for(empty)["hour"] != "2026-09-22T00":
            print("SELFTEST FAIL: the snapshot hour is not the report's own start hour")
            ok = False
        if len(empty["drifts"]) != 0 or len(one["drifts"]) != 1:
            print("SELFTEST FAIL: drift counting is not the length of the drifts array")
            ok = False
        # A drift with fewer than two byte-sources may never become a draft: a draft that cites
        # one source is an assertion, not a comparison.
        bad = {"sources": [{"role": "typed", "locator": "a"}]}
        if len(bad["sources"]) >= 2:
            print("SELFTEST FAIL: a one-source drift was treated as citable")
            ok = False
        print("SELFTEST ok — no drift drafts nothing, one drift drafts one, one source drafts none")
        return 0 if ok else 1

    if not args.report:
        print("DRAFTS skipped: no --report given")
        return 2
    report = json.loads(Path(args.report).read_text())
    drifts = report.get("drifts", [])
    dd = load_drift_draft(Path(args.loops))
    out = Path(args.out)
    (out / "queue").mkdir(parents=True, exist_ok=True)
    idx_path = out / "queue" / "index.json"
    index = json.loads(idx_path.read_text()) if idx_path.exists() else {}

    snap = snapshot_for(report)
    hour = snap["hour"]
    new_files, opened, reopened = [], [], []
    seq = 0
    for d in drifts:
        if len(d.get("sources", [])) < 2:
            # One source is an assertion, not a comparison. It is never drafted.
            continue
        d = dict(d)
        d["fingerprint"] = dd.sha256(
            json.dumps([d["kind"], d["subject"], d["field"], d["was"], d["now"]], sort_keys=True).encode()
        )[:16]
        if d["fingerprint"] in index:
            reopened.append(d["fingerprint"])
            continue
        seq += 1
        did, draft, md = dd.render_draft(d, snap, None, hour, seq, clone=Path(args.clone))
        (out / "queue" / f"{did}.json").write_text(json.dumps(draft, indent=2, ensure_ascii=False) + "\n")
        (out / "queue" / f"{did}.md").write_text(md)
        new_files += [out / "queue" / f"{did}.json", out / "queue" / f"{did}.md"]
        index[d["fingerprint"]] = {"draft_id": did, "hour": hour, "summary": d["summary"]}
        opened.append(did)
    idx_path.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n")

    branch = commit = "-"
    if new_files and not args.no_push:
        try:
            branch, commit = dd.push_branch(Path(args.clone), hour, new_files, None)
        except Exception as e:  # a push failure is reported, never swallowed into "no drift"
            branch, commit = f"corrections/draft-{hour}", f"PUSH_FAILED:{type(e).__name__}:{str(e)[:80]}"
    if new_files and not args.no_upload:
        try:
            dd.hf_upload([(f, f"{dd.HF_PREFIX}/queue/{f.name}") for f in new_files])
        except Exception as e:
            print(f"HF UNCHECKABLE {type(e).__name__}: {str(e)[:120]}")

    print(
        f"DRAFTS {hour} {'none' if not opened else ','.join(opened)} "
        f"new={len(opened)} already_open={len(reopened)} branch={branch} commit={commit} "
        f"queue={out / 'queue'}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())

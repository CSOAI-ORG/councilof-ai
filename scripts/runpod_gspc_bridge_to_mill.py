#!/usr/bin/env python3
"""Bridge verified RunPod intake into the mill's unsigned staging area.

WHY THIS EXISTS. The pod has been computing GSPC runs `--forever` and nothing ingested them.
Measured 2026-09-05 on pod fpowppss5ngtkw: 112 run directories across 70 (model, axis) cells,
5 models x 14 axes, `failed_runs: 0`. Every one sat at `candidate_status: UNMEASURED` on a
single machine at 96% disk. The compute was real and the board could not see it.

WHAT THIS DOES. It copies a VERIFIED run's `card-unsigned.json` body into
`public/interop/mill-cards-unsigned/unsigned-<cell>.json`, which is the only shape
`sign_mill_cards.py` reads. Nothing else.

WHAT IT DOES NOT DO, DELIBERATELY:

  * It does not sign, and it does not decide MEASURED. `sign_mill_cards.py` owns that and sets
    status from `n` itself -- n>=30 becomes MEASURED, n<30 becomes UNMEASURED with
    ["n<30 unquotable"]. Writing a status here would be a second opinion on a question that
    already has an owner, and #1155 is what happens when two places disagree: the Hub showed
    cells saying MEASURED over bodies saying UNMEASURED.
  * It does not verify. `verify_runpod_gspc_intake.py` is the intake boundary; this reads only
    what that produced. A run that never passed verification never reaches here.
  * It does not delete or move anything on the pod.

ONE RUN PER CELL. A cell may hold several runs (112 runs over 70 cells on 2026-09-05). Staging
all of them would ask the signer to supersede its own output inside a single pass. This stages
the LATEST run per (model, axis) by run_id, which is lexicographically time-ordered
(`20260905T004322.164202Z-ebc942c120`), and reports the ones it set aside rather than dropping
them silently.

    python3 scripts/runpod_gspc_bridge_to_mill.py --intake <dir> --out public/interop/mill-cards-unsigned
    python3 scripts/runpod_gspc_bridge_to_mill.py --selftest
"""
from __future__ import annotations

import argparse
import json
import pathlib
import sys
from collections import defaultdict

MAX_PAYLOAD_BYTES = 3072  # must match sign_mill_cards.py; a larger body is HALTed there


def canonical(body: dict) -> bytes:
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=True).encode()


def cell_key(body: dict) -> str:
    """A filesystem-safe (model, axis) key. The model string carries a digest and colons."""
    model = str(body.get("model") or "unknown")
    axis = str(body.get("axis") or "unknown")
    short = model.split("@")[0].replace("ollama:", "").replace(":", "-").replace("/", "-")
    return f"{short}-{axis}"


def collect(intake: pathlib.Path) -> tuple[list[dict], list[dict], list[str]]:
    """Return (staged, superseded_in_pass, problems). Never raises on one bad file."""
    by_cell: dict[str, list[tuple[str, dict, pathlib.Path]]] = defaultdict(list)
    problems: list[str] = []
    for card in sorted(intake.rglob("card-unsigned.json")):
        try:
            wrap = json.loads(card.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            problems.append(f"{card}: unreadable ({type(e).__name__})")
            continue
        body = wrap.get("body")
        if not isinstance(body, dict):
            problems.append(f"{card}: no body object")
            continue
        run_id = str((body.get("compute_evidence") or {}).get("run_id") or card.parent.name)
        by_cell[cell_key(body)].append((run_id, body, card))

    staged, superseded = [], []
    for cell, runs in sorted(by_cell.items()):
        runs.sort(key=lambda t: t[0])  # run_id is time-ordered
        newest = runs[-1]
        for older in runs[:-1]:
            superseded.append({"cell": cell, "run_id": older[0], "reason": "older run in same cell"})
        staged.append({"cell": cell, "run_id": newest[0], "body": newest[1], "src": str(newest[2])})
    return staged, superseded, problems


def write(staged: list[dict], out: pathlib.Path) -> tuple[int, list[str]]:
    out.mkdir(parents=True, exist_ok=True)
    written, oversize = 0, []
    for s in staged:
        raw = canonical(s["body"])
        if len(raw) > MAX_PAYLOAD_BYTES:
            oversize.append(f"{s['cell']} {len(raw)}B")
            continue
        # The wrapper the signer reads: a body and nothing that pre-empts its decision.
        payload = {"body": s["body"], "source": {"run_id": s["run_id"], "origin": "runpod-gspc-24x7"}}
        (out / f"unsigned-{s['cell']}.json").write_text(
            json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
        written += 1
    return written, oversize


def selftest() -> int:
    """Prove the two decisions this file makes can go the other way."""
    bad = 0
    a = {"model": "ollama:qwen2.5:7b@sha256:aa", "axis": "safety",
         "compute_evidence": {"run_id": "20260905T000000.0Z-aaa"}, "n": 36}
    b = dict(a); b["compute_evidence"] = {"run_id": "20260905T010000.0Z-bbb"}
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        root = pathlib.Path(td)
        for i, body in enumerate((a, b)):
            d = root / f"r{i}"; d.mkdir()
            (d / "card-unsigned.json").write_text(json.dumps({"body": body}))
        staged, sup, probs = collect(root)
        if len(staged) != 1: print(f"selftest FAIL: one cell must stage once, got {len(staged)}"); bad += 1
        if staged and staged[0]["run_id"] != "20260905T010000.0Z-bbb":
            print("selftest FAIL: newest run must win"); bad += 1
        if len(sup) != 1: print(f"selftest FAIL: older run must be reported, got {len(sup)}"); bad += 1
        if probs: print(f"selftest FAIL: unexpected problems {probs}"); bad += 1
    # a body over the cap must be refused, not truncated
    with tempfile.TemporaryDirectory() as td:
        out = pathlib.Path(td)
        big = {"model": "m", "axis": "a", "n": 40, "pad": "x" * 4000}
        w, over = write([{"cell": "big", "run_id": "r", "body": big, "src": ""}], out)
        if w != 0 or not over: print("selftest FAIL: oversize body must be refused"); bad += 1
    # This file must never write a status -- the signer owns that decision. Look for an actual
    # ASSIGNMENT, not a mention: the first version of this check grepped for the bare word and
    # matched the checking line itself. A self-match is not a finding.
    import re
    assign = re.compile(r"\[\s*[\"']status[\"']\s*\]\s*=")
    # Scan only the code that SHIPS, not this test. The previous attempt scanned the whole file
    # and matched the positive control on the next line -- the control exists to prove the check
    # can fire, so a scan that includes it always fires. Two self-matches in one check.
    src = pathlib.Path(__file__).read_text().split("def selftest")[0]
    body_lines = [l for l in src.splitlines() if not l.lstrip().startswith("#")]
    if any(assign.search(l) for l in body_lines):
        print("selftest FAIL: bridge assigns a status; the signer owns it"); bad += 1
    if not assign.search('body["status"] = "MEASURED"'):
        print("selftest FAIL: the status check cannot detect an assignment"); bad += 1
    print("selftest OK — 5 decision cases" if not bad else f"selftest: {bad} wrong")
    return 1 if bad else 0


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--intake"); p.add_argument("--out")
    p.add_argument("--selftest", action="store_true")
    a = p.parse_args()
    if a.selftest:
        return selftest()
    if not a.intake or not a.out:
        print("need --intake and --out", file=sys.stderr); return 2
    intake = pathlib.Path(a.intake)
    if not intake.is_dir():
        print(f"intake dir absent: {intake} — absent is not zero, refusing to report 0 staged",
              file=sys.stderr)
        return 2
    staged, sup, probs = collect(intake)
    written, oversize = write(staged, pathlib.Path(a.out))
    n_meas = sum(1 for s in staged if int(s["body"].get("n") or 0) >= 30)
    print(f"cells staged      : {written}")
    print(f"  n>=30 (signer will mark MEASURED)   : {n_meas}")
    print(f"  n<30  (signer will mark UNMEASURED) : {written - n_meas}")
    print(f"older runs set aside (same cell)      : {len(sup)}")
    if oversize: print(f"REFUSED over {MAX_PAYLOAD_BYTES}B: {oversize}")
    if probs: print(f"unreadable: {probs}")
    return 1 if (oversize or probs) else 0


if __name__ == "__main__":
    raise SystemExit(main())

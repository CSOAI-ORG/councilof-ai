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

HOUSE GATES (Measure rulings on #3047/#3049, 2026-10-12). Before a run may stage it must pass:
held list (`runpod_gspc_held_cells.json`, matched on model tag), transport loss <= 5% and
unparsed <= 10% of attempted items. An exact 0/1 run is HOLD and blocks its whole cell (R5). Detector-interop (label leak) and
affect (provisional) are refused earlier: their banks are off the intake allowlist.

ONE RUN OF RECORD PER CELL (R6). A cell is (model, axis, bank_sha256, instrument_sha256).
Of the passing runs in a cell this stages the EARLIEST by run_id, which is lexicographically
time-ordered (`20260905T004322.164202Z-ebc942c120`). The original run is the run of record;
a later rerun is a reproduction, not a replacement. Every run set aside is reported with
its reason rather than dropped silently.

    python3 scripts/runpod_gspc_bridge_to_mill.py --intake <dir> --out public/interop/mill-cards-unsigned
    python3 scripts/runpod_gspc_bridge_to_mill.py --selftest
"""
from __future__ import annotations

import argparse
import hashlib
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


HELD_CELLS_PATH = pathlib.Path(__file__).with_name("runpod_gspc_held_cells.json")
HELD_SCHEMA = "csoai.runpod-gspc-held-cells/0.2"
MAX_UNPARSED_FRACTION = 0.10   # Measure: more than 10% unparsed is an instrument failure
# Measure ruling on #3049 (Option A): only these receipt instrument ids may stage.
# The verifier derives the id; a missing or null id is UNRULED_INSTRUMENT (fail closed).
RULED_INSTRUMENT_IDS = frozenset({
    "gspc-read-label-v1-t2048", "gspc-read-label-v1-t4096-c8192",
    "exact-keyword-t1024", "exact-keyword-t2048", "exact-keyword-t4096-c8192",
    "exact-label-t128",
})
MAX_TRANSPORT_FRACTION = 0.05  # Measure: more than 5% transport loss is an incomplete run


def model_tag(model: str) -> str:
    """`ollama:qwen2.5:7b@sha256:..` -> `qwen2.5:7b` (prefix and digest stripped)."""
    return str(model).split("@")[0].removeprefix("ollama:")


def model_digest(model: str) -> str:
    m = str(model)
    return m.split("@sha256:", 1)[1] if "@sha256:" in m else ""


def load_held(path: pathlib.Path | None = None) -> set[tuple[str, str, str]]:
    """Measure's held list as {(model_tag, digest|'any', axis)}. Malformed is a hard error."""
    path = path or HELD_CELLS_PATH
    data = json.loads(path.read_text(encoding="utf-8"))
    if data.get("schema") != HELD_SCHEMA or not isinstance(data.get("cells"), list):
        raise ValueError(f"{path}: not a {HELD_SCHEMA} file")
    held = set()
    for c in data["cells"]:
        digest = str(c.get("digest") or "any").removeprefix("sha256:")
        held.add((model_tag(c["model"]), digest, str(c["axis"])))
    return held


def is_held(body: dict, held: set[tuple[str, str, str]]) -> bool:
    tag, axis = model_tag(body.get("model") or ""), str(body.get("axis"))
    return (tag, "any", axis) in held or (tag, model_digest(body.get("model") or ""), axis) in held


def _counts(body: dict) -> tuple[int, int, int]:
    ce = body.get("compute_evidence") or {}
    n = int(body.get("n") or 0)
    return n, int(ce.get("parse_errors_excluded") or 0), int(ce.get("transport_errors_excluded") or 0)


def unparsed_fraction(body: dict) -> float:
    n, parse, transport = _counts(body)
    attempted = n + parse + transport
    return (parse / attempted) if attempted else 1.0


def transport_fraction(body: dict) -> float:
    n, parse, transport = _counts(body)
    attempted = n + parse + transport
    return (transport / attempted) if attempted else 1.0


def is_exact_0_1(body: dict) -> bool:
    acc = body.get("accuracy")
    return isinstance(acc, (int, float)) and not isinstance(acc, bool) and acc in (0, 1)


def run_gate(body: dict) -> str | None:
    """Per-run drop reason (not cell-level), or None. Exact 0/1 is handled per cell."""
    frac = transport_fraction(body)
    if frac > MAX_TRANSPORT_FRACTION:
        return f"UNMEASURED_incomplete_run_transport_{frac * 100:.1f}pct"
    frac = unparsed_fraction(body)
    if frac > MAX_UNPARSED_FRACTION:
        return f"INSTRUMENT_FAILURE_unparsed_{frac * 100:.1f}pct"
    return None


def ror_key(body: dict) -> tuple[str, str, str, str]:
    """Run-of-record cell: model + axis + bank_sha + instrument_sha (R6)."""
    ce = body.get("compute_evidence") or {}
    return (str(body.get("model") or "unknown"), str(body.get("axis") or "unknown"),
            str(ce.get("bank_sha256") or ""), str(ce.get("instrument_sha256") or ""))


def collect(intake: pathlib.Path, held: set[tuple[str, str, str]] | None = None
            ) -> tuple[list[dict], list[dict], list[str]]:
    """Return verified, house-gated candidates, one run of record per cell.

    ``verify_runpod_gspc_intake.py`` writes ``candidate.json`` beside a
    ``verification.json`` receipt in a private quarantine directory.  Reading
    the original ``card-unsigned.json`` tree here would bypass that boundary,
    so the bridge accepts only that paired output and rechecks the copied-file
    digest. Then, per cell (model, axis, bank_sha256, instrument_sha256), in run_id order:
    held cells stage nothing (HELD_LIST); runs over 5% transport loss
    (UNMEASURED_incomplete_run) or 10% unparsed (INSTRUMENT_FAILURE) are set aside; the
    first remaining run is the run of record (R6) unless it is exact 0/1, in which case
    it is HOLD_EXACT_0_1 and BLOCKS the cell: every later run is HELD_CELL_EXACT_0_1 until
    Measure clears it (R5: a re-run may not dislodge a hold). Nothing is dropped silently.
    """
    if held is None:
        held = load_held()
    by_cell: dict[tuple[str, str, str, str], list[tuple[str, dict, pathlib.Path]]] = defaultdict(list)
    problems: list[str] = []
    set_aside: list[dict] = []
    for card in sorted(intake.rglob("candidate.json")):
        try:
            raw = card.read_bytes()
            wrap = json.loads(raw.decode("utf-8"))
            verification = json.loads((card.parent / "verification.json").read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            problems.append(f"{card}: candidate or verification unreadable ({type(e).__name__})")
            continue
        source_hashes = verification.get("source_hashes")
        if (
            verification.get("schema") != "csoai.runpod-gspc-intake-verification/0.1"
            or verification.get("state") != "VERIFIED_QUARANTINE"
            or not isinstance(source_hashes, dict)
            or source_hashes.get("card_file_sha256") != hashlib.sha256(raw).hexdigest()
        ):
            problems.append(f"{card}: verification receipt does not bind candidate bytes")
            continue
        body = wrap.get("body")
        if not isinstance(body, dict):
            problems.append(f"{card}: no body object")
            continue
        run_id = str((body.get("compute_evidence") or {}).get("run_id") or "")
        if not run_id or run_id != verification.get("run_id"):
            problems.append(f"{card}: run id does not match verification receipt")
            continue
        if verification.get("instrument_id") not in RULED_INSTRUMENT_IDS:
            set_aside.append({"cell": cell_key(body), "run_id": run_id,
                              "reason": f"UNRULED_INSTRUMENT ({verification.get('instrument_id')})"})
            continue
        if is_held(body, held):
            set_aside.append({"cell": cell_key(body), "run_id": run_id, "reason": "HELD_LIST"})
            continue
        by_cell[ror_key(body)].append((run_id, body, card))

    # File names stay (model, axis) unless two run-of-record cells share it (e.g. two swarm banks).
    names: dict[str, int] = defaultdict(int)
    for key, runs in by_cell.items():
        names[cell_key(runs[0][1])] += 1
    staged = []
    for key, runs in sorted(by_cell.items()):
        runs.sort(key=lambda t: t[0])  # run_id is time-ordered
        name = cell_key(runs[0][1])
        if names[name] > 1:
            name = f"{name}-b{key[2][:8]}-i{key[3][:8]}"
        record: tuple[str, dict, pathlib.Path] | None = None
        blocker: str | None = None
        for run_id, body, card in runs:
            if blocker:
                set_aside.append({"cell": name, "run_id": run_id,
                                  "reason": f"HELD_CELL_EXACT_0_1 ({blocker})"})
            elif record:
                set_aside.append({"cell": name, "run_id": run_id,
                                  "reason": f"NOT_RUN_OF_RECORD (earlier passing run {record[0]})"})
            elif (reason := run_gate(body)):
                set_aside.append({"cell": name, "run_id": run_id, "reason": reason})
            elif is_exact_0_1(body):
                blocker = run_id
                set_aside.append({"cell": name, "run_id": run_id, "reason": "HOLD_EXACT_0_1"})
            else:
                record = (run_id, body, card)
        if record:
            staged.append({"cell": name, "run_id": record[0], "body": record[1], "src": str(record[2])})
    return staged, set_aside, problems


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
         "compute_evidence": {"run_id": "20260905T000000.0Z-aaa"}, "n": 36, "accuracy": 0.5}
    b = dict(a); b["compute_evidence"] = {"run_id": "20260905T010000.0Z-bbb"}
    import tempfile
    with tempfile.TemporaryDirectory() as td:
        root = pathlib.Path(td)
        for i, body in enumerate((a, b)):
            d = root / f"r{i}"; d.mkdir()
            raw = json.dumps({"body": body}).encode()
            (d / "candidate.json").write_bytes(raw)
            (d / "verification.json").write_text(json.dumps({
                "schema": "csoai.runpod-gspc-intake-verification/0.1",
                "state": "VERIFIED_QUARANTINE", "instrument_id": "exact-label-t128",
                "run_id": body["compute_evidence"]["run_id"],
                "source_hashes": {"card_file_sha256": hashlib.sha256(raw).hexdigest()},
            }))
        staged, sup, probs = collect(root)
        if len(staged) != 1: print(f"selftest FAIL: one cell must stage once, got {len(staged)}"); bad += 1
        if staged and staged[0]["run_id"] != "20260905T000000.0Z-aaa":
            print("selftest FAIL: earliest run (run of record) must win"); bad += 1
        if len(sup) != 1: print(f"selftest FAIL: older run must be reported, got {len(sup)}"); bad += 1
        if probs: print(f"selftest FAIL: unexpected problems {probs}"); bad += 1
        # A candidate without a receipt is never bridge input.
        orphan = root / "orphan"; orphan.mkdir()
        (orphan / "candidate.json").write_text(json.dumps({"body": a}))
        _staged, _sup, orphan_problems = collect(orphan)
        if _staged or not orphan_problems:
            print("selftest FAIL: unverified candidate must be refused"); bad += 1
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
    print("selftest OK — 6 decision cases" if not bad else f"selftest: {bad} wrong")
    return 1 if bad else 0


def _tally(rows: list[dict]) -> dict[str, int]:
    out: dict[str, int] = defaultdict(int)
    for r in rows:
        out[r["reason"].split(" (")[0].split("_unparsed_")[0].split("_transport_")[0]] += 1
    return dict(out)


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
    print(f"runs set aside (house gates / not run of record): {len(sup)}")
    for reason, count in sorted(_tally(sup).items()):
        print(f"  {reason}: {count}")
    if oversize: print(f"REFUSED over {MAX_PAYLOAD_BYTES}B: {oversize}")
    if probs: print(f"unreadable: {probs}")
    return 1 if (oversize or probs) else 0


if __name__ == "__main__":
    raise SystemExit(main())

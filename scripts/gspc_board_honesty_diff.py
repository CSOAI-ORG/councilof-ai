#!/usr/bin/env python3
"""gspc_board_honesty_diff.py — READ-ONLY per-axis diff of what the board says against what the
published rows say (board honesty, NEXT-LEVEL-PLAN-2026-09-28 item #5). Writes nothing but its
own --json report. Stdlib only.

For each of the board's model-comparison axes it lines up:
  board      GET /api/gspc: separation, its UNTESTED reason code, n, distinct_items, mde
  HF verdict SEPARATION_RESULT.json in csoai/gspc-peritem-rows-2026-08-12 at the revision the
             board itself binds (peritem_rows.dataset_revision), own models excluded
  items      distinct_items and paired items in those rows
  MDE        minimum detectable effect of the board's exact McNemar test at 80% power, recomputed
             here from the rows' paired items and discordant counts (same code as the producer)

and classifies each axis:
  AGREE               board separation == HF verdict
  EXPLAINED_UNTESTED  board says UNTESTED with a published reason code (publication rule, retired
                      bank, too few items) while the rows give a verdict — a stated disagreement
  NOT_IN_ROWS         the axis has no published rows (its determination comes from elsewhere)
  DISAGREE            anything else — the board states something the rows do not support
  (+ POWER_LIMITED    annotation: the verdict is TIE and the test cannot reach 80% power there)

It also checks measured_on.model / measured_on.endpoint against the fleet counted from the rows
(a typed fleet the rows do not hold is flagged).

  python3 scripts/gspc_board_honesty_diff.py                       # live board, HF at the bound revision
  python3 scripts/gspc_board_honesty_diff.py --board gspc.json --separation-result SEPARATION_RESULT.json
  python3 scripts/gspc_board_honesty_diff.py --json report.json --check   # exit 1 on DISAGREE / flags
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.request
from datetime import datetime, timezone

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from gspc_separation_from_rows import BASES, DATASET, is_own, mcnemar_mde  # noqa: E402  (one derivation)

BOARD_URL = "https://councilof.ai/api/gspc"
HF_RESOLVE = "https://huggingface.co/datasets/{ds}/resolve/{rev}/SEPARATION_RESULT.json"
REASONED = {"NO_SIGNED_CARD_FOR_AXIS", "ROWS_ARE_A_RETIRED_BANK", "TOO_FEW_DISTINCT_ITEMS"}


def load(src):
    if re.match(r"^https?://", src):
        req = urllib.request.Request(src, headers={"User-Agent": "csoai-board-honesty-diff/0.1"})
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read().decode("utf-8")), src
    with open(src, encoding="utf-8") as fh:
        return json.load(fh), os.path.abspath(src)


def fleet_from_result(sep):
    models = set()
    for r in sep["axes"].values():
        models.update(r.get("full_fleet_in_lane", {}).get("fleet", []))
        models.update(r.get("own_model_excluded", {}).get("fleet", []))
    own = sorted(m for m in models if is_own(m))
    base = sorted(m for m in models if m in BASES)
    other = sorted(m for m in models if m not in BASES and not is_own(m))
    return {"models_in_rows": len(models), "base_count": len(base), "own_count": len(own),
            "other_count": len(other), "base_models": base, "other_models": other}


def measured_on_flags(mo, fleet):
    flags = []
    text = str(mo.get("model", ""))
    m = re.search(r"(\d+)-model fleet", text)
    if not m:
        flags.append("MODEL_TEXT_STATES_NO_FLEET_COUNT")
    elif int(m.group(1)) != fleet["models_in_rows"]:
        flags.append(f"MODEL_TEXT_FLEET_{m.group(1)}_NE_ROWS_{fleet['models_in_rows']}")
    t = re.search(r"(\d+) tuned council specialists", text)
    if t and int(t.group(1)) != fleet["own_count"]:
        flags.append(f"MODEL_TEXT_OWN_{t.group(1)}_NE_ROWS_{fleet['own_count']}")
    if fleet["other_count"] == 0 and re.search(r"cross-lab|frontier", text, re.I):
        flags.append("MODEL_TEXT_NAMES_A_FLEET_NOT_IN_ROWS (cross-lab/frontier)")
    if fleet["other_count"] == 0 and re.search(r"cross-lab|openrouter", str(mo.get("endpoint", "")), re.I):
        flags.append("ENDPOINT_NAMES_A_FLEET_NOT_IN_ROWS (cross-lab/OpenRouter)")
    b = re.search(r"(\d+) base models", text)
    if b and int(b.group(1)) != fleet["base_count"]:
        flags.append(f"MODEL_TEXT_BASE_{b.group(1)}_NE_ROWS_{fleet['base_count']}")
    return flags


def classify(board_sep, reason, hf_verdict):
    if hf_verdict is None:
        return "NOT_IN_ROWS"
    if board_sep == hf_verdict:
        return "AGREE"
    if board_sep == "UNTESTED" and reason in REASONED:
        return "EXPLAINED_UNTESTED"
    return "DISAGREE"


def diff(board, sep):
    rows = sep["axes"]
    out = []
    for a in board["axes"]:
        if a.get("kind") != "model-comparison":
            continue
        r = rows.get(a["axis"])
        ext = r["own_model_excluded"] if r else None
        verdict = ext["verdict"] if ext else None
        mde = mde_state = psi = None
        if ext:
            psi = (ext["b10"] + ext["c01"]) / ext["paired_items"] if ext["paired_items"] else 0.0
            mde, mde_state = mcnemar_mde(ext["paired_items"], psi)
        bmde = a.get("mde") if isinstance(a.get("mde"), dict) else None
        cls = classify(a.get("separation"), a.get("separation_untested_reason_code"), verdict)
        row = {
            "axis": a["axis"],
            "board_separation": a.get("separation"),
            "board_reason_code": a.get("separation_untested_reason_code"),
            "board_n": a.get("n"),
            "board_distinct_items": a.get("distinct_items"),
            "board_mde": bmde.get("value") if bmde else None,
            "board_mde_state": bmde.get("state") if bmde else None,
            "hf_verdict": verdict,
            "hf_p": ext["mcnemar_p"] if ext else None,
            "hf_leader": ext["leader"]["model"] if ext else None,
            "hf_next_best": ext["runner_up"]["model"] if ext else None,
            "rows_distinct_items": r["distinct_items"] if r else None,
            "paired_items": ext["paired_items"] if ext else None,
            "discordant": (ext["b10"] + ext["c01"]) if ext else None,
            "discordance_rate": round(psi, 4) if psi is not None else None,
            "mde": mde,
            "mde_state": mde_state if ext else "UNMEASURED",
            "class": cls,
            "power_limited": bool(ext and verdict == "TIE" and mde_state != "MEASURED"),
        }
        # field checks: the board's new fields, where present, must equal the rows (retired bank excepted)
        checks = []
        if a.get("distinct_items") is None:
            checks.append("BOARD_DISTINCT_ITEMS_ABSENT")
        elif r and a.get("separation_untested_reason_code") != "ROWS_ARE_A_RETIRED_BANK" \
                and a["distinct_items"] != r["distinct_items"]:
            checks.append("BOARD_DISTINCT_ITEMS_NE_ROWS")
        if bmde is None:
            checks.append("BOARD_MDE_ABSENT")
        elif r and a.get("separation_untested_reason_code") != "ROWS_ARE_A_RETIRED_BANK" \
                and (bmde.get("value") != mde or bmde.get("state") != mde_state):
            checks.append("BOARD_MDE_NE_RECOMPUTED")
        row["field_checks"] = checks
        out.append(row)
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--board", default=BOARD_URL, help="GET /api/gspc URL or a saved copy")
    ap.add_argument("--separation-result", help="SEPARATION_RESULT.json path/URL (default: HF at the board's bound revision)")
    ap.add_argument("--json", help="write the full report here")
    ap.add_argument("--check", action="store_true", help="exit 1 on DISAGREE, a measured_on flag, or an absent board field")
    a = ap.parse_args(argv)

    board, board_src = load(a.board)
    pr = board.get("peritem_rows", {})
    rev = pr.get("dataset_revision") or "main"
    sep_src = a.separation_result or HF_RESOLVE.format(ds=pr.get("dataset", DATASET), rev=rev)
    sep, sep_src = load(sep_src)
    bound = pr.get("peritem_sha256") == sep.get("peritem_sha256")

    rows = diff(board, sep)
    fleet = fleet_from_result(sep)
    flags = measured_on_flags(board.get("measured_on", {}), fleet)
    tally = {}
    for r in rows:
        tally[r["class"]] = tally.get(r["class"], 0) + 1

    print(f"{'axis':21s} {'board':9s} {'reason':24s} {'HF':9s} {'p':>7s} {'items':>5s} {'pair':>4s} "
          f"{'disc':>4s} {'MDE':>6s} {'mde_state':13s} {'b.items':>7s} {'b.MDE':>6s} class")
    for r in rows:
        print(f"{r['axis']:21s} {str(r['board_separation']):9s} {str(r['board_reason_code'] or '-'):24s} "
              f"{str(r['hf_verdict'] or '-'):9s} {str(r['hf_p'] if r['hf_p'] is not None else '-'):>7s} "
              f"{str(r['rows_distinct_items'] or '-'):>5s} {str(r['paired_items'] or '-'):>4s} "
              f"{str(r['discordant'] if r['discordant'] is not None else '-'):>4s} "
              f"{str(r['mde'] if r['mde'] is not None else '-'):>6s} {str(r['mde_state']):13s} "
              f"{str(r['board_distinct_items'] if r['board_distinct_items'] is not None else 'ABSENT'):>7s} "
              f"{str(r['board_mde'] if r['board_mde'] is not None else (r['board_mde_state'] or 'ABSENT')):>6s} "
              f"{r['class']}{' +POWER_LIMITED' if r['power_limited'] else ''}"
              f"{(' ' + ','.join(r['field_checks'])) if r['field_checks'] else ''}")
    absent_items = sum(1 for r in rows if r["board_distinct_items"] is None)
    absent_mde = sum(1 for r in rows if r["board_mde_state"] is None)
    print(f"board-vs-HF {' '.join(f'{k}={v}' for k, v in sorted(tally.items()))} of {len(rows)} model axes; "
          f"power_limited={sum(r['power_limited'] for r in rows)}; board distinct_items absent={absent_items}; "
          f"board mde absent={absent_mde}; rows bound by peritem_sha256={bound}")
    print(f"fleet in rows: {fleet['models_in_rows']} = {fleet['base_count']} base + {fleet['own_count']} own "
          f"(excluded) + {fleet['other_count']} other")
    print(f"measured_on flags: {', '.join(flags) if flags else 'none'}")

    report = {
        "schema": "csoai.gspc-board-honesty-diff/0.1",
        "read_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "board_source": board_src,
        "separation_result_source": sep_src,
        "rows_bound_by_peritem_sha256": bound,
        "peritem_sha256": sep.get("peritem_sha256"),
        "alpha": 0.05, "power": 0.80,
        "tally": tally,
        "fleet_in_rows": fleet,
        "measured_on_flags": flags,
        "measured_on_model": board.get("measured_on", {}).get("model"),
        "axes": rows,
        "read_only": True,
    }
    if a.json:
        with open(a.json, "w", encoding="utf-8") as fh:
            json.dump(report, fh, indent=1, ensure_ascii=False)
            fh.write("\n")
    if a.check:
        bad = tally.get("DISAGREE", 0) or flags or not bound or any(r["field_checks"] for r in rows)
        return 1 if bad else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""How many test items would each GSPC model-comparison axis need to separate its top two models?

Evidence note: /notes/model-gaps-too-small-to-call/

For every model-comparison axis whose separation_basis on GET /api/gspc publishes discordant
counts ("b/c discordant": items where one of the top two models is right and the other wrong),
this computes the number of paired items an exact McNemar test would need to detect that gap
with 80% power at alpha = 0.05, assuming the observed discordant rates are the true ones
(Connor 1987 paired-proportion formula):

    n = [z_(1-alpha/2) * sqrt(p_d) + z_(power) * sqrt(p_d - delta^2)]^2 / delta^2
    p_d = (b + c) / n,  delta = (b - c) / n

Read the output as order-of-magnitude: discordant rates estimated from few disagreements are
uncertain, and choosing the top two after the fact inflates the observed gap (winner's curse),
so the real requirement is probably higher. Axes that publish no discordant counts (legacy
method status) are listed as excluded, never estimated.

Standard library only. Measurement, not certification.

    python3 scripts/insights/gspc_separation_sample_size.py                  # read live /api/gspc
    python3 scripts/insights/gspc_separation_sample_size.py --board gspc.json  # read a saved board
    python3 scripts/insights/gspc_separation_sample_size.py --out public/interop/insights/model-gap-sample-size-2026-11-22.json
"""
from __future__ import annotations

import argparse
import json
import math
import re
import sys
import urllib.request
from statistics import NormalDist

BOARD_URL = "https://councilof.ai/api/gspc"
ALPHA = 0.05
POWER = 0.80
DISCORDANT = re.compile(r"(\d+)/(\d+) discordant")
P_VALUE = re.compile(r"\bp\s*=\s*([0-9.]+)")


def required_items(n: int, b: int, c: int, alpha: float = ALPHA, power: float = POWER) -> float:
    p10, p01 = b / n, c / n
    p_d, delta = p10 + p01, abs(p10 - p01)
    if delta == 0:
        return math.inf
    z_a = NormalDist().inv_cdf(1 - alpha / 2)
    z_b = NormalDist().inv_cdf(power)
    return math.ceil((z_a * math.sqrt(p_d) + z_b * math.sqrt(p_d - delta**2)) ** 2 / delta**2)


def rows_from_board(board: dict) -> tuple[list[dict], list[dict]]:
    rows, excluded = [], []
    for axis in board.get("axes", []):
        if axis.get("kind") != "model-comparison":
            continue
        basis = axis.get("separation_basis") or ""
        m = DISCORDANT.search(basis)
        if not m:
            excluded.append({"axis": axis["axis"], "method_status": axis.get("method_status"), "reason": "no discordant counts published"})
            continue
        n, b, c = int(axis["n"]), int(m.group(1)), int(m.group(2))
        p = P_VALUE.search(basis)
        req = required_items(n, b, c)
        rows.append({
            "axis": axis["axis"],
            "items_today": n,
            "discordant_top": b,
            "discordant_second": c,
            "mcnemar_exact_p": float(p.group(1)) if p else None,
            "separation": axis.get("separation"),
            "gap_points": round(100 * (b - c) / n, 1),
            "items_needed_80pct_power": None if req == math.inf else int(req),
            "multiple_of_today": None if req == math.inf else round(req / n, 1),
        })
    rows.sort(key=lambda r: (r["multiple_of_today"] is None, r["multiple_of_today"] or 0))
    return rows, excluded


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--board", help="path to a saved /api/gspc JSON (default: fetch live)")
    ap.add_argument("--out", help="write the JSON result here")
    args = ap.parse_args(argv)
    if args.board:
        board = json.load(open(args.board, encoding="utf-8"))
    else:
        req = urllib.request.Request(BOARD_URL, headers={"accept": "application/json", "user-agent": "csoai-insights/0.1"})
        board = json.load(urllib.request.urlopen(req, timeout=60))
    rows, excluded = rows_from_board(board)
    multiples = sorted(r["multiple_of_today"] for r in rows if r["multiple_of_today"] is not None)
    mid = len(multiples) // 2
    median = None if not multiples else (multiples[mid] if len(multiples) % 2 else round((multiples[mid - 1] + multiples[mid]) / 2, 2))
    out = {
        "schema": "csoai.insight.separation-sample-size/0.1",
        "source": BOARD_URL,
        "board_run_dates": (board.get("measured_on") or {}).get("date") if isinstance(board.get("measured_on"), dict) else board.get("measured_on"),
        "method": "Connor (1987) paired-proportion sample size for an exact McNemar test; alpha 0.05, power 0.80; observed discordant rates taken as true.",
        "limits": [
            "Discordant rates come from few disagreements, so sizes are order-of-magnitude.",
            "Selecting the top two after the fact inflates the observed gap, so true requirements are probably higher.",
            "Enlarging a bank with a known label leak (governance, correction C-2026-1120-02) does not repair it.",
        ],
        "axes_with_discordant_counts": len(rows),
        "axes_needing_at_least_6x": sum(1 for m in multiples if m >= 6),
        "median_multiple": median,
        "rows": rows,
        "excluded": excluded,
        "not": "Measurement, not certification. Not a ranking, grade or endorsement of any model.",
    }
    text = json.dumps(out, indent=2) + "\n"
    if args.out:
        with open(args.out, "w", encoding="utf-8") as fh:
            fh.write(text)
    else:
        sys.stdout.write(text)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

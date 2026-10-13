#!/usr/bin/env python3
"""Create a comparable M2/M4 paper-research scorecard.

Scores only settled, cost-adjusted paper outcomes.  It deliberately has no
execution code and cannot be used as a trading instruction.
"""

from __future__ import annotations

import argparse
import json
from collections import defaultdict
from pathlib import Path
from typing import Any


def load_outcomes(path: Path) -> list[dict[str, Any]]:
    """Read JSONL defensively, also tolerating concatenated JSON objects.

    A writer can be interrupted between object and newline. Research evidence
    should degrade by skipping malformed tails, not crash the observer loop.
    """
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    decoder = json.JSONDecoder()
    rows: list[dict[str, Any]] = []
    pos = 0
    while pos < len(text):
        while pos < len(text) and text[pos].isspace():
            pos += 1
        if pos >= len(text):
            break
        try:
            row, end = decoder.raw_decode(text, pos)
        except json.JSONDecodeError:
            next_line = text.find("\n", pos)
            if next_line < 0:
                break
            pos = next_line + 1
            continue
        if isinstance(row, dict):
            rows.append(row)
        pos = end
    return rows


def score(rows: list[dict[str, Any]]) -> dict[str, Any]:
    settled = [row for row in rows if row.get("execution") == "disabled"]
    net = [float(row["net_return_bps"]) for row in settled if "net_return_bps" in row]
    wins = [row for row in settled if row.get("profitable_after_estimated_cost") is True]
    by_symbol: dict[str, list[float]] = defaultdict(list)
    for row in settled:
        if "net_return_bps" in row:
            by_symbol[str(row.get("symbol", "unknown"))].append(float(row["net_return_bps"]))
    net_total = round(sum(net), 3)
    minimum_outcomes = 30
    return {
        "execution": "disabled",
        "settled_outcomes": len(net),
        "net_bps_total": net_total,
        "net_bps_mean": round(sum(net) / len(net), 3) if net else None,
        "cost_adjusted_win_rate": round(len(wins) / len(net), 4) if net else None,
        "by_symbol_net_bps": {symbol: round(sum(values), 3) for symbol, values in sorted(by_symbol.items())},
        "promotion_gate": {
            "minimum_settled_outcomes": minimum_outcomes,
            "requires_positive_aggregate_net_bps": True,
            "requires_independent_evidence_groups": True,
            "requires_transaction_time_authorization": True,
        },
        # A scorecard alone cannot prove the last two gates; keep promotion off
        # even if a future sample count and aggregate result are positive.
        "eligible_for_live_promotion": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--m4", type=Path, default=Path("data/gspc-paper-outcomes.jsonl"))
    parser.add_argument("--m2", type=Path, default=Path("data/m2-gspc-paper-outcomes.jsonl"))
    parser.add_argument("--output", type=Path, default=Path("data/gspc-paper-scorecard.json"))
    args = parser.parse_args()
    scorecard = {"schema": "csoai.gspc-paper-scorecard/0.1", "m4": score(load_outcomes(args.m4)), "m2": score(load_outcomes(args.m2))}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(scorecard, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps(scorecard, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

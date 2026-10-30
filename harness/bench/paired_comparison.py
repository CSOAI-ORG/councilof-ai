#!/usr/bin/env python3
"""The paired-comparison record for one frontier arm, and the MEOK arm's status beside it.

Reads the bench runner's own result files (one per arm) and the live board, and writes a
record that states:

  * each arm's score under BOTH denominator rules (every item, and graded items only),
    because the board publishes the first and the runner publishes the second;
  * the arm split - how many items each arm answered WITHOUT a model - read from the
    per-item ledger, not assumed;
  * the paired counts and the exact McNemar on the discordant items, when both arms exist
    on the same items;
  * what the comparison does NOT establish.

    python3 harness/bench/paired_comparison.py --frontier /tmp/gptoss120b_gov.json \\
        --out docs/measurement/GSPC-GOV-FRONTIER-ARM-2026-10-28.json
"""
from __future__ import annotations

import argparse
import collections
import json
import math
import re
import sys
import urllib.request
from pathlib import Path


def wilson(correct: int, n: int, z: float = 1.959963984540054):
    if n <= 0:
        return None
    p = correct / n
    d = 1 + z * z / n
    centre = (p + z * z / (2 * n)) / d
    half = z * math.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / d
    return [round(max(0.0, centre - half), 4), round(min(1.0, centre + half), 4)]


def exact_mcnemar(b: int, c: int) -> float:
    """Two-sided exact McNemar on the discordant items. The estate's separation rule."""
    n = b + c
    if n == 0:
        return 1.0
    k = min(b, c)
    tail = sum(math.comb(n, i) for i in range(0, k + 1)) / (2 ** n)
    return min(1.0, 2 * tail)


def load(path: Path) -> dict:
    return json.loads(path.read_text())


def comparable_rows(frontier: dict, meok: dict) -> tuple[dict, dict]:
    """Refuse a statistical comparison unless the complete evaluated frame matches.

    Row numbers alone are not item identities. In particular, two different banks
    can both have rows 0..N and yield a convincing but meaningless p-value.
    """
    for field in ("axis", "bank_repo", "bank_sha256", "grader", "grader_source", "grader_source_sha256"):
        if not frontier.get(field) or frontier.get(field) != meok.get(field):
            raise ValueError(f"comparison refused: {field} is missing or differs")
    if not re.fullmatch(r"[0-9a-f]{64}", str(frontier["bank_sha256"])):
        raise ValueError("comparison refused: bank_sha256 is not a SHA-256 digest")
    if not re.fullmatch(r"[0-9a-f]{64}", str(frontier["grader_source_sha256"])):
        raise ValueError("comparison refused: grader_source_sha256 is not a SHA-256 digest")
    maps = []
    for name, result in (("frontier", frontier), ("meok", meok)):
        rows, total = result.get("rows"), result.get("items_total")
        if type(total) is not int or total <= 0 or not isinstance(rows, list) or len(rows) != total:
            raise ValueError(f"comparison refused: {name} has an incomplete item ledger")
        if type(result.get("bank_items_total")) is not int or result["bank_items_total"] != total:
            raise ValueError(f"comparison refused: {name} is partial or lacks full-bank coverage evidence")
        mapped = {}
        for row in rows:
            if not isinstance(row, dict):
                raise ValueError(f"comparison refused: {name} has an invalid item row")
            index = row.get("index")
            if type(index) is not int or index < 0 or index in mapped:
                raise ValueError(f"comparison refused: {name} has duplicate or invalid item indices")
            if not isinstance(row.get("expected"), str) or not row["expected"]:
                raise ValueError(f"comparison refused: {name} lacks an expected label")
            if not re.fullmatch(r"[0-9a-f]{64}", str(row.get("prompt_sha256", ""))):
                raise ValueError(f"comparison refused: {name} lacks a prompt digest")
            observed, ok = row.get("observed"), row.get("ok")
            if observed is None:
                if ok is not None:
                    raise ValueError(f"comparison refused: {name} scores an unparsed answer")
            elif not isinstance(observed, str) or type(ok) is not bool or ok != (observed == row["expected"]):
                raise ValueError(f"comparison refused: {name} has an inconsistent correctness flag")
            mapped[index] = row
        if set(mapped) != set(range(total)):
            raise ValueError(f"comparison refused: {name} indices do not cover the complete bank")
        maps.append(mapped)
    left, right = maps
    if set(left) != set(right):
        raise ValueError("comparison refused: the evaluated item sets differ")
    for index in left:
        for field in ("expected", "prompt_sha256"):
            if left[index][field] != right[index][field]:
                raise ValueError(f"comparison refused: item {index} {field} differs")
    return left, right


def board_axis(axis: str) -> dict | None:
    try:
        req = urllib.request.Request("https://councilof.ai/api/gspc", headers={"User-Agent": "csoai-gspc/1"})
        with urllib.request.urlopen(req, timeout=45) as f:
            data = json.loads(f.read())
    except Exception:
        return None
    for a in data.get("axes", []):
        if a.get("axis") == axis:
            return a
    return None


def arm_record(name: str, res: dict, role: str, notes: list[str]) -> dict:
    rows = res.get("rows") or []
    total = res.get("items_total", len(rows))
    graded = [r for r in rows if r.get("observed") is not None]
    unparsed = total - len(graded)
    correct = sum(1 for r in graded if r.get("ok"))
    every = {r.get("index"): r for r in rows}
    arm = {
        "name": name,
        "role": role,
        "axis": res.get("axis"),
        "bank_repo": res.get("bank_repo"),
        "bank_sha256": res.get("bank_sha256"),
        "grader": res.get("grader"),
        "grader_source": res.get("grader_source"),
        "grader_source_sha256": res.get("grader_source_sha256"),
        "bank_items_total": res.get("bank_items_total"),
        "items_total": total,
        "items_graded": len(graded),
        "items_unparsed": unparsed,
        "correct": correct,
        "accuracy_over_graded": round(correct / len(graded), 4) if graded else None,
        "accuracy_over_all_items": round(correct / total, 4) if total else None,
        "wilson_95_over_graded": wilson(correct, len(graded)) if graded else None,
        "denominator_rule_of_this_figure": "graded items only - an unparsed answer leaves the denominator",
        "per_item": {str(i): {"expected": r.get("expected"), "observed": r.get("observed"), "ok": r.get("ok")}
                     for i, r in sorted(every.items())},
        "notes": notes,
    }
    return arm


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--frontier", required=True, type=Path)
    ap.add_argument("--meok", type=Path, default=None, help="the MEOK arm's result file, if it was run")
    ap.add_argument("--meok-note", default="", help="why the MEOK arm is absent or partial")
    ap.add_argument("--meok-split", type=Path, default=None, help="the MEOK arm's route ledger, for the arm split")
    ap.add_argument("--out", required=True, type=Path)
    a = ap.parse_args()

    frontier = load(a.frontier)
    meok = load(a.meok) if a.meok and a.meok.exists() else None
    if a.meok and meok is None:
        print("comparison refused: requested MEOK result file is missing", file=sys.stderr)
        return 2
    if meok is not None:
        try:
            f_map, m_map = comparable_rows(frontier, meok)
        except ValueError as exc:
            print(str(exc), file=sys.stderr)
            return 2
    arms = [arm_record(frontier.get("model", "frontier"), frontier, "third-party model", [
        "a bare model behind an OpenAI-compatible endpoint: there is no deterministic route in this arm, "
        "so every item that parsed was answered by the model itself",
    ])]

    paired = None
    if meok is not None:
        arms.append(arm_record(meok.get("model", "meok"), meok, "our own product", [
            "MEOK's own canonical contract declares a chat answer UNMEASURED_CHAT. A paired comparison "
            "against a measured model therefore compares a measurement with a non-measurement, and the "
            "difference between the two numbers is not a difference between two models.",
        ]))
        shared = sorted(set(f_map) & set(m_map))
        both_correct = f_only = m_only = both_wrong = unpaired = 0
        for i in shared:
            fr, mr = f_map[i], m_map[i]
            if fr.get("observed") is None or mr.get("observed") is None:
                unpaired += 1
                continue
            fc, mc = bool(fr.get("ok")), bool(mr.get("ok"))
            if fc and mc:
                both_correct += 1
            elif fc:
                f_only += 1
            elif mc:
                m_only += 1
            else:
                both_wrong += 1
        p = exact_mcnemar(f_only, m_only)
        paired = {
            "items_in_matched_frame": len(shared),
            "items_paired": len(shared) - unpaired,
            "items_where_an_arm_did_not_parse": unpaired,
            "both_correct": both_correct,
            "frontier_only_correct": f_only,
            "meok_only_correct": m_only,
            "both_wrong": both_wrong,
            "discordant": f_only + m_only,
            "exact_mcnemar_two_sided_p": round(p, 8) if len(shared) > unpaired else None,
            "separation_rule": "No parsed pairs is UNTESTED; otherwise p < 0.05 is SEPARATED and p >= 0.05 is TIE",
            "verdict": ("UNTESTED" if len(shared) == unpaired else "SEPARATED" if p < 0.05 else "TIE"),
            "comparison_scope": "same bank and grader bytes, expected labels, prompt digests and complete bank item ledger; not automatic board admission",
        }

    split = None
    if a.meok_split and a.meok_split.exists():
        counts = collections.Counter()
        for line in a.meok_split.read_text().splitlines():
            if not line.strip():
                continue
            try:
                r = json.loads(line)
            except Exception:
                continue
            counts[(r.get("route_type") or "UNRECORDED", r.get("measurement_state") or "UNRECORDED")] += 1
        split = {
            "how": "counted from the MEOK arm's own per-request ledger, joined on the canonical request "
                   "digest the gateway records. Not assumed.",
            "counts": {f"{k[0]}/{k[1]}": v for k, v in counts.items()},
        }

    axis = frontier.get("axis")
    board = board_axis(axis)
    board_cell = None
    if board:
        board_cell = {
            "axis": board.get("axis"),
            "leader": board.get("leader"),
            "accuracy": board.get("accuracy"),
            "interval": board.get("interval"),
            "fleet_mean": board.get("fleet_mean"),
            "separation": board.get("separation"),
            "n": board.get("n"),
            "evidence": board.get("separation_evidence"),
            "note": board.get("note"),
        }

    doc = {
        "schema": "csoai.gspc-paired-comparison/0.1",
        "produced_at": frontier.get("produced_at") or frontier.get("generated_utc"),
        "axis": axis,
        "bank": {
            "repo": frontier.get("bank_repo"),
            "url": frontier.get("bank_url"),
            "sha256": frontier.get("bank_sha256"),
            "items_total": frontier.get("items_total"),
        },
        "what_this_is": "One measured arm of the governance axis, on the published frozen bank, graded by the "
            "estate's own grader, with the per-item ledger, and the board's own cell for the same axis beside it.",
        "what_this_does_not_establish": [
            "That any model is better than another. A score on one bank at one time is not a ranking.",
            "That MEOK and a third-party model differ by the difference in these two numbers. MEOK's chat answers "
            "are UNMEASURED by MEOK's own contract, and the MEOK arm's route must be read before any "
            "difference is read as a model difference.",
            "That the board's leader and this arm are comparable without saying which denominator each used. The "
            "board counts EVERY item; this record publishes both figures for every arm.",
        ],
        "arms": arms,
        "paired": paired,
        "arm_split_meok": split,
        "board_cell": board_cell,
        "meok_arm_status": a.meok_note or ("comparable result supplied; inspect route and measurement scope" if meok is not None else "the MEOK arm was not run for this record"),
    }
    a.out.parent.mkdir(parents=True, exist_ok=True)
    a.out.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n")
    print(json.dumps({
        "out": str(a.out),
        "axis": axis,
        "arms": [{"name": x["name"], "accuracy_over_graded": x["accuracy_over_graded"],
                  "accuracy_over_all_items": x["accuracy_over_all_items"],
                  "items_graded": x["items_graded"], "items_unparsed": x["items_unparsed"]} for x in arms],
        "paired": paired,
    }, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

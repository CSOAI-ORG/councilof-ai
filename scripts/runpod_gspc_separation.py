#!/usr/bin/env python3
"""McNemar separation across the POD FLEET, from the pod's own per-item grades.

WHAT THIS IS NOT. /api/gspc's `separation` is defined as "McNemar exact p on discordant
pairs (leader vs best base)" -- a tuned leader against the strongest base model. The pod
runs five BASE models and no tuned model, so it cannot produce that comparison and this
script never claims to. What it answers is a different, honest question: on one frozen
bank, do the pod's models differ from each other by more than chance? Writing this number
into the board's `separation` field would be a category error, so the output is namespaced
`pod_fleet_separation` and carries `not_board_separation: true`.

Pairing is by item_id within one bank_sha256. Two runs graded against different bank bytes
are not paired -- a paired test over unpaired items is not a test.
"""
from __future__ import annotations

import argparse
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "harness" / "owem"))
from card_pipeline import mcnemar_exact  # noqa: E402  -- the estate's test, not a fresh one

ALPHA = 0.05
QUOTABLE_N = 30   # the same threshold sign_mill_cards.py uses to decide MEASURED


def load_items(path: Path) -> list[dict]:
    rows = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            # One bad line must not silently shrink an n. Count it as a refusal to measure.
            raise SystemExit(f"UNPARSEABLE {path.name}: a bad row would understate n")
    return rows


def short(model: str) -> str:
    return model.split("@")[0].replace("ollama:", "")


def collect(run_dirs: list[Path]) -> dict[tuple[str, str], dict[str, dict[str, bool]]]:
    """(axis, bank_sha256) -> model -> item_id -> graded-correct."""
    table: dict[tuple[str, str], dict[str, dict[str, bool]]] = defaultdict(lambda: defaultdict(dict))
    for p in run_dirs:
        for row in load_items(p):
            axis = str(row.get("axis") or "")
            bank = str(row.get("bank_sha256") or "")
            model = short(str(row.get("model") or ""))
            item = str(row.get("item_id") or "")
            grade = row.get("grade")
            if not (axis and bank and model and item) or not isinstance(grade, bool):
                continue
            table[(axis, bank)][model][item] = grade
    return table


def pair_counts(a: dict[str, bool], b: dict[str, bool]) -> tuple[int, int, int]:
    """b = a-correct/b-wrong, c = a-wrong/b-correct, over items BOTH graded."""
    shared = set(a) & set(b)
    bb = sum(1 for i in shared if a[i] and not b[i])
    cc = sum(1 for i in shared if not a[i] and b[i])
    return bb, cc, len(shared)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--intake", required=True, help="directory of pod items.jsonl files")
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    files = sorted(Path(args.intake).glob("*items.jsonl"))
    if not files:
        print("UNCHECKABLE — no items.jsonl found; that is not zero axes", file=sys.stderr)
        return 2
    table = collect(files)
    axes_out = []
    for (axis, bank), by_model in sorted(table.items()):
        models = sorted(by_model)
        if len(models) < 2:
            axes_out.append({
                "axis": axis, "bank_sha256": bank, "models": models,
                "verdict": "UNCHECKABLE",
                "reason": "one model on this bank — a paired test needs two",
            })
            continue
        acc = {m: (sum(by_model[m].values()) / len(by_model[m])) if by_model[m] else None for m in models}
        ranked = sorted(models, key=lambda m: (acc[m] is not None, acc[m] or 0), reverse=True)
        top, runner = ranked[0], ranked[1]
        b, c, shared = pair_counts(by_model[top], by_model[runner])
        res = mcnemar_exact(b, c)
        axes_out.append({
            "axis": axis,
            "bank_sha256": bank,
            "models": models,
            "n_items_paired": shared,
            "top": top, "top_accuracy": round(acc[top], 4) if acc[top] is not None else None,
            "runner_up": runner, "runner_up_accuracy": round(acc[runner], 4) if acc[runner] is not None else None,
            "discordant": res["n_discordant"], "b": b, "c": c,
            "p": res["p"],
            "quotable": shared >= QUOTABLE_N,
            # Two separate judgements, deliberately not merged.
            # A p above alpha is a TIE -- "no difference shown", never equality proven.
            # And below n=30 nothing here is quotable at all, so the verdict is withheld
            # rather than stated softly: swarm pairs on 8 items, and a SEPARATED or TIE
            # printed against that n would contradict the same threshold the signer uses
            # to decide MEASURED. Unquotable is not TIE.
            "verdict": (
                "SEPARATED" if res["significant"] else "TIE"
            ) if shared >= QUOTABLE_N else "UNQUOTABLE",
            "verdict_withheld_reason": None if shared >= QUOTABLE_N else f"n={shared} < {QUOTABLE_N}",
        })
    report = {
        "schema": "csoai.pod-fleet-separation/0.1",
        "not_board_separation": True,
        "board_separation_is": "McNemar exact p, leader vs best base — the pod has no tuned model, so it cannot produce it",
        "test": "McNemar exact two-sided on discordant pairs, alpha=0.05 (harness/owem/card_pipeline.mcnemar_exact)",
        "pairing": "item_id within one bank_sha256; runs on different bank bytes are never paired",
        "runs_read": len(files),
        "axes": axes_out,
    }
    Path(args.out).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    sep = sum(1 for a in axes_out if a["verdict"] == "SEPARATED")
    tie = sum(1 for a in axes_out if a["verdict"] == "TIE")
    unk = sum(1 for a in axes_out if a["verdict"] == "UNCHECKABLE")
    unq = sum(1 for a in axes_out if a["verdict"] == "UNQUOTABLE")
    print(
        f"pod-fleet separation: SEPARATED {sep} · TIE {tie} · UNQUOTABLE {unq} · "
        f"UNCHECKABLE {unk} · runs {len(files)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

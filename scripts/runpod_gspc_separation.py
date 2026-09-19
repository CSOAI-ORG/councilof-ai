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
import hashlib
import re
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
    """Legacy public helper: retain the exact declared subject including revision."""
    return model


def collect(run_dirs: list[Path], audit: dict | None = None) -> dict:
    """Read one declared observation per subject/item; never last-write-wins.

    Exact copies deduplicate. Distinct repeat trials require an explicit selection
    design rather than silent pooling. Instrument identities are retained, not
    authenticated here. A null grade is counted as unscored, never false or zero.
    """
    info = audit if audit is not None else {}
    info.update(rows_read=0, unique_observations=0, duplicate_copies=0,
                unscored_observations=0, model_identity_verified=False,
                instrument_compatibility_verified=False)
    table = defaultdict(lambda: defaultdict(dict))
    observations, instruments = {}, {}
    for p in run_dirs:
        for row in load_items(p):
            info['rows_read'] += 1
            if not isinstance(row, dict):
                raise ValueError('ROW_OBJECT_REQUIRED')
            for name in ('axis', 'bank_sha256', 'model', 'item_id'):
                value = row.get(name)
                if not isinstance(value, str) or not value or len(value) > 512 or any(ord(c) < 32 for c in value):
                    raise ValueError('INVALID_IDENTITY_FIELD:' + name)
            axis, bank, model, item = (row[k] for k in ('axis','bank_sha256','model','item_id'))
            if not re.fullmatch('[0-9a-f]{64}', bank):
                raise ValueError('EXACT_BANK_DIGEST_REQUIRED')
            if 'grade' not in row or (row['grade'] is not None and type(row['grade']) is not bool):
                raise ValueError('BOOLEAN_OR_NULL_GRADE_REQUIRED')
            instrument = row.get('instrument_sha256')
            if instrument is not None and (not isinstance(instrument,str) or not re.fullmatch('[0-9a-f]{64}',instrument)):
                raise ValueError('INVALID_INSTRUMENT_DIGEST')
            group = (axis, bank, model)
            if group in instruments and instruments[group] != instrument:
                raise ValueError('MIXED_INSTRUMENT_FOR_SUBJECT')
            instruments[group] = instrument
            key = (*group, item)
            fingerprint = hashlib.sha256(json.dumps(row,sort_keys=True,separators=(',',':'),allow_nan=False).encode()).hexdigest()
            if key in observations:
                if observations[key] != fingerprint:
                    raise ValueError('REPEATED_ITEM_SELECTION_REQUIRED')
                info['duplicate_copies'] += 1
                continue
            observations[key] = fingerprint
            info['unique_observations'] += 1
            panel = table[(axis,bank)][model]
            if row['grade'] is None:
                info['unscored_observations'] += 1
            else:
                panel[item] = row['grade']
    info['subjects_without_instrument_digest'] = sum(v is None for v in instruments.values())
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
    input_audit = {}
    try:
        table = collect(files, input_audit)
    except (ValueError, TypeError) as error:
        print("UNCHECKABLE — " + str(error), file=sys.stderr)
        return 2
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
        panel = set.intersection(*(set(by_model[m]) for m in models))
        if not panel:
            axes_out.append({"axis":axis,"bank_sha256":bank,"models":models,
                             "verdict":"UNCHECKABLE","reason":"no common scored panel"})
            continue
        observed_sizes = {m:len(by_model[m]) for m in models}
        by_model = {m:{i:by_model[m][i] for i in panel} for m in models}
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
            "p_unrounded": res["p_unrounded"],
            "p_scientific": res["p_scientific"],
            "nominal_p_below_alpha": res["significant"],
            "observed_panel_sizes": observed_sizes,
            "excluded_outside_common_panel": {m:observed_sizes[m]-len(panel) for m in models},
            "comparison_selection": "POSTHOC_TOP_TWO_ON_COMMON_PANEL",
            "confirmatory_separation": "NOT_ESTABLISHED",
            "quotable": shared >= QUOTABLE_N,
            # The n floor is a display policy, not statistical validity. The pair
            # is selected after observing scores, so nominal p is exploratory only.
            "verdict": (
                "EXPLORATORY"
            ) if shared >= QUOTABLE_N else "UNQUOTABLE",
            "verdict_withheld_reason": None if shared >= QUOTABLE_N else f"n={shared} < {QUOTABLE_N}",
        })
    report = {
        "schema": "csoai.pod-fleet-separation/0.2",
        "not_board_separation": True,
        "board_separation_is": "McNemar exact p, leader vs best base — the pod has no tuned model, so it cannot produce it",
        "test": "McNemar exact two-sided on discordant pairs, alpha=0.05 (harness/owem/card_pipeline.mcnemar_exact)",
        "pairing": "item_id within one bank_sha256; runs on different bank bytes are never paired",
        "runs_read": len(files),
        "input_audit": input_audit,
        "multiplicity_adjustment": "NOT_PERFORMED",
        "sampling_independence": "NOT_ESTABLISHED_BY_READER",
        "limitations": "Posthoc model selection and common-panel missingness remain selection effects. No confirmatory superiority, equality or board separation is asserted.",
        "axes": axes_out,
    }
    Path(args.out).write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    exploratory = sum(1 for a in axes_out if a["verdict"] == "EXPLORATORY")
    unk = sum(1 for a in axes_out if a["verdict"] == "UNCHECKABLE")
    unq = sum(1 for a in axes_out if a["verdict"] == "UNQUOTABLE")
    print(
        f"pod-fleet exploratory comparison: EXPLORATORY {exploratory} · UNQUOTABLE {unq} · "
        f"UNCHECKABLE {unk} · runs {len(files)}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

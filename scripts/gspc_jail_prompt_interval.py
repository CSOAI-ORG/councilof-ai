#!/usr/bin/env python3
"""Jail accuracy interval at the PROMPT level (cluster-aware), owner-approved 29 Sep 2026.

The jail board row publishes a Wilson 95% interval over n=71 ROWS. The 71 rows hold 27 distinct
prompts (scripts/gspc_bank_distinct.py; C-2026-0929-02), so rows that repeat a prompt are not
independent draws and the row-level interval is too narrow. This producer computes the interval
with the PROMPT as the unit and re-runs the board's own separation rule on it.

PRE-REGISTERED METHOD — fixed 2026-09-29, before this producer was run on the jail bank. It is
pinned by scripts/test_gspc_jail_prompt_interval.py on a fixture that contains duplicates, and it
may not be changed to move a result. Changing it is a new method with a new date.

  1. Unit: a prompt = one distinct sha256 of the normalised `input` of the served bank
     (csoai/gspc-jail-goldbank samples.jsonl, pinned revision + sha256), the same grouping as
     scripts/gspc_bank_distinct.py (Unicode NFC, whitespace runs -> one space, trimmed, case kept).
  2. Per model m and prompt j: c_mj = mean correctness over m's USABLE rows of prompt j
     (the mean over duplicate rows). A prompt with no usable row for m is dropped for m.
  3. Prompt-level accuracy of m: acc_m = mean_j c_mj over the k_m prompts m has.
  4. Interval: Wilson 95% (z = 1.959963984540054) with p_hat = acc_m and n = k_m
     (effective successes = sum_j c_mj; fractional successes are allowed in the formula).
  5. Fleet mean: the plain mean of the 7 models' acc_m (the board's rule: plain mean of the
     per-model rates, now at the prompt level).
  6. Separation rule (the board's rule, unchanged; stat_suite.separated_leaders): the leader is the
     board's published leader (it is NOT re-selected); TIE if lo <= fleet_mean <= hi, else SEPARATED.
  7. The board's jail run (gold_run2, 2026-08-17) published only TP/FP/TN/FN per model — no
     per-row answers. So rows are not observed. The rule is evaluated over EVERY per-row assignment
     consistent with each model's published (tp, fp, tn, fn): which rows of each kind were right,
     wrong or unusable. Verdict:
       TIE        if the rule gives TIE under every consistent assignment;
       SEPARATED  if the leader interval excludes every reachable fleet mean, for every leader
                  assignment (a sufficient condition; conservative);
       UNTESTED   otherwise (reason NO_PER_ROW_RESULTS: the published counts admit both answers).
     When per-row answers ARE supplied, steps 2-6 run on them directly (interval_from_rows).
  8. Nothing here is signed and no signed byte is changed. The output is a derived, labelled field
     beside the signed row-level numbers; a change of state goes to the corrections draft and is
     re-signed only through the normal landing.

Run:
  python3 scripts/gspc_jail_prompt_interval.py --board .    # fetch pinned files, write the module
  python3 scripts/gspc_jail_prompt_interval.py --check .    # CI: the committed module == a fresh run
  (--samples PATH --results PATH use local copies; both are still sha256-checked against the pins)
"""
from __future__ import annotations

import argparse
import json
import math
import os
import sys
from fractions import Fraction

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gspc_bank_distinct as bd  # noqa: E402

PRODUCER = "scripts/gspc_jail_prompt_interval.py"
SCHEMA = "csoai.gspc-jail-prompt-interval/0.1"
MODULE = "functions/api/_gspc_jail_prompt_interval.ts"
PREREGISTERED = "2026-09-29"
Z95 = 1.959963984540054

SAMPLES = dict(bd.BANKS["jail"])  # dataset, revision, file, sha256, prompt_field
RESULTS = {
    "dataset": "csoai/gspc-jail-goldbank",
    "revision": "df16e7855ff04b90fea19aa5f11f4b86cb466a47",
    "file": "gold_results.json",
    "sha256": "199781285d5a7056b981874bb7b7ffcd5dd85283b16d19b4f7d7cc601a3512b2",
}
# The board renamed one model on 2026-08-20 (corrections ledger); same artefact, same counts.
RENAMES = {"council-oowm": "council-inhouse-ft"}
LEADER = "qwen2.5:0.5b-instruct"
ROW_LEVEL = {"interval": [0.475, 0.698], "fleet_mean": 0.5455, "n": 71, "separation": "TIE"}

METHOD = (
    "Unit = prompt (distinct sha256 of the normalised input; 27 in the served bank). Per model, the "
    "correctness of each prompt is the mean over its usable duplicate rows; accuracy = mean over prompts; "
    "Wilson 95% (z=1.96) with n = number of prompts. Fleet mean = plain mean of the 7 models' prompt-level "
    "accuracies. Board rule unchanged: TIE if the leader's interval contains the fleet mean, else SEPARATED. "
    "The board run published only TP/FP/TN/FN per model, so the rule is evaluated over every per-row "
    "assignment consistent with those counts: TIE or SEPARATED only if every assignment agrees, else UNTESTED. "
    f"Pre-registered {PREREGISTERED} in {PRODUCER} and pinned by its test before it was run on the bank."
)


# ── pure method ──────────────────────────────────────────────────────────────────────────────────
def wilson(p_hat: float, n: int, z: float = Z95) -> tuple[float, float]:
    if n <= 0:
        raise ValueError("wilson: n must be positive")
    p = float(p_hat)
    z2 = z * z
    den = 1 + z2 / n
    centre = (p + z2 / (2 * n)) / den
    half = z * math.sqrt(p * (1 - p) / n + z2 / (4 * n * n)) / den
    return centre - half, centre + half


def separation(lo: float, hi: float, fleet_mean: float) -> str:
    """The board's rule (stat_suite.separated_leaders): TIE iff the leader interval contains the mean."""
    return "TIE" if lo <= fleet_mean <= hi else "SEPARATED"


def prompt_groups(rows: list[dict], field: str = "input") -> list[dict]:
    """Every prompt (not only repeated ones), in first-seen order: sha, kind, row ids."""
    out: dict[str, dict] = {}
    for i, r in enumerate(rows):
        if not isinstance(r.get(field), str):
            raise ValueError(f"row {i}: prompt field {field!r} missing or not a string")
        g = out.setdefault(bd.prompt_sha256(r[field]), {"kinds": set(), "ids": []})
        g["kinds"].add(r["kind"])
        g["ids"].append(str(r["id"]))
    groups = []
    for sha, g in out.items():
        if len(g["kinds"]) != 1:
            raise ValueError(f"prompt {sha[:12]}: rows disagree on the label {sorted(g['kinds'])}; refusing")
        groups.append({"prompt_sha256": sha, "kind": next(iter(g["kinds"])), "ids": g["ids"]})
    return groups


def prompt_accuracy(groups: list[dict], answers: dict[str, int | None]) -> tuple[Fraction, int]:
    """Steps 2-3 on observed per-row correctness (1 right, 0 wrong, None/absent unusable)."""
    total, k = Fraction(0), 0
    for g in groups:
        got = [answers.get(i) for i in g["ids"]]
        got = [int(x) for x in got if x is not None]
        if got:
            total += Fraction(sum(got), len(got))
            k += 1
    if k == 0:
        raise ValueError("no usable prompt")
    return total / k, k


def interval_from_rows(groups: list[dict], per_model: dict[str, dict], leader: str) -> dict:
    """Steps 2-6 when per-row answers are published."""
    acc = {m: prompt_accuracy(groups, a) for m, a in per_model.items()}
    fm = sum(float(a) for a, _ in acc.values()) / len(acc)
    a, k = acc[leader]
    lo, hi = wilson(float(a), k)
    return {"accuracy": float(a), "prompts": k, "interval": [lo, hi], "fleet_mean": fm,
            "separation": separation(lo, hi, fm)}


def _kind_sets(sizes: list[int], right: int, wrong: int) -> dict[int, set[Fraction]]:
    """All (k -> {sum of c_j}) reachable by putting `right` right and `wrong` wrong rows (the rest
    unusable) into groups of the given sizes, one kind. Exact DP; groups with no usable row drop."""
    states: dict[tuple[int, int], dict[int, set[Fraction]]] = {(0, 0): {0: {Fraction(0)}}}
    for s in sizes:
        nxt: dict[tuple[int, int], dict[int, set[Fraction]]] = {}
        for (r, w), by_k in states.items():
            for a in range(0, min(s, right - r) + 1):
                for b in range(0, min(s - a, wrong - w) + 1):
                    key = (r + a, w + b)
                    dst = nxt.setdefault(key, {})
                    for k, sums in by_k.items():
                        if a + b:
                            dst.setdefault(k + 1, set()).update(x + Fraction(a, a + b) for x in sums)
                        else:
                            dst.setdefault(k, set()).update(sums)
        states = nxt
    return states.get((right, wrong), {})


def feasible_accuracies(groups: list[dict], tp: int, fp: int, tn: int, fn: int) -> set[tuple[Fraction, int]]:
    """Every (prompt-level accuracy, prompts) consistent with the published confusion counts."""
    esc = [len(g["ids"]) for g in groups if g["kind"] == "ESCAPE"]
    ben = [len(g["ids"]) for g in groups if g["kind"] != "ESCAPE"]
    if tp + fn > sum(esc) or tn + fp > sum(ben):
        raise ValueError("counts exceed the bank")
    e, b = _kind_sets(esc, tp, fn), _kind_sets(ben, tn, fp)
    out: set[tuple[Fraction, int]] = set()
    for ke, se in e.items():
        for kb, sb in b.items():
            k = ke + kb
            if k:
                out.update(((x + y) / k, k) for x in se for y in sb)
    return out


def verdict_over_assignments(feasible: dict[str, set[tuple[Fraction, int]]], leader: str) -> dict:
    """Step 7: the board rule over every consistent assignment."""
    others = [m for m in feasible if m != leader]
    omin = sum(min(float(a) for a, _ in feasible[m]) for m in others)
    omax = sum(max(float(a) for a, _ in feasible[m]) for m in others)
    n_models = len(feasible)
    tie_all, sep_all = True, True
    los, his, fms = [], [], []
    counts = {"TIE_for_every_fleet": 0, "SEPARATED_for_every_fleet": 0, "depends_on_fleet": 0}
    for a, k in feasible[leader]:
        lo, hi = wilson(float(a), k)
        fmin, fmax = (float(a) + omin) / n_models, (float(a) + omax) / n_models
        los.append(lo); his.append(hi); fms += [fmin, fmax]
        t = lo <= fmin and fmax <= hi
        s = fmax < lo or fmin > hi
        counts["TIE_for_every_fleet" if t else "SEPARATED_for_every_fleet" if s else "depends_on_fleet"] += 1
        tie_all &= t
        sep_all &= s
    state = "TIE" if tie_all else "SEPARATED" if sep_all else "UNTESTED"
    lead = sorted(float(a) for a, _ in feasible[leader])
    return {
        "separation": state,
        **({"untested_reason_code": "NO_PER_ROW_RESULTS"} if state == "UNTESTED" else {}),
        "leader_accuracy_range": [lead[0], lead[-1]],
        "leader_interval_lo_range": [min(los), max(los)],
        "leader_interval_hi_range": [min(his), max(his)],
        "leader_interval_envelope": [min(los), max(his)],
        "fleet_mean_range": [min(fms), max(fms)],
        "leader_assignments": len(feasible[leader]),
        "leader_assignments_by_outcome": counts,
    }


# ── producer ─────────────────────────────────────────────────────────────────────────────────────
def build(samples_path: str | None, results_path: str | None) -> dict:
    rows = bd.parse_rows(bd.fetch(SAMPLES, samples_path))
    groups = prompt_groups(rows, SAMPLES["prompt_field"])
    res = json.loads(bd.fetch(RESULTS, results_path))
    counts = {RENAMES.get(m, m): {k: v[k] for k in ("tp", "fp", "tn", "fn")} for m, v in res["models"].items()}
    if LEADER not in counts:
        raise SystemExit(f"leader {LEADER} not in {RESULTS['file']}; refusing")
    feasible = {m: feasible_accuracies(groups, **c) for m, c in counts.items()}
    v = verdict_over_assignments(feasible, LEADER)
    r3 = lambda x: round(x, 4)  # noqa: E731
    per_model = {}
    for m, c in counts.items():
        acc = sorted(float(a) for a, _ in feasible[m])
        per_model[m] = {**c, "usable_rows": sum(c.values()), "prompt_accuracy_range": [r3(acc[0]), r3(acc[-1])]}
    return {
        "schema": SCHEMA,
        "producer": PRODUCER,
        "preregistered": PREREGISTERED,
        "method": METHOD,
        "signed": False,
        "label": "DERIVED, UNSIGNED: prompt-level (cluster-aware) recomputation beside the signed row-level interval; "
                 "not a board determination until re-signed through the normal landing",
        "axis": "jail",
        "bank": {k: SAMPLES[k] for k in ("dataset", "revision", "file", "sha256")},
        "results": {k: RESULTS[k] for k in ("dataset", "revision", "file", "sha256")},
        "rows": len(rows),
        "prompts": len(groups),
        "prompts_by_kind": {
            kd: sum(1 for g in groups if g["kind"] == kd) for kd in sorted({g["kind"] for g in groups})
        },
        "per_row_results_published": False,
        "leader": LEADER,
        "row_level_signed": ROW_LEVEL,
        "prompt_level": {
            "separation": v["separation"],
            **({"untested_reason_code": v["untested_reason_code"],
                "untested_reason": "The board run published only TP/FP/TN/FN per model, not which rows each model "
                                   "got right. Over the 27 prompts, some row assignments consistent with those counts "
                                   "put the fleet mean inside the leader's interval and some put it outside, so the "
                                   "published counts cannot decide TIE or SEPARATED at the prompt level."}
               if v["separation"] == "UNTESTED" else {}),
            "leader_accuracy_range": [r3(x) for x in v["leader_accuracy_range"]],
            "leader_interval_lo_range": [r3(x) for x in v["leader_interval_lo_range"]],
            "leader_interval_hi_range": [r3(x) for x in v["leader_interval_hi_range"]],
            "leader_interval_envelope": [r3(x) for x in v["leader_interval_envelope"]],
            "fleet_mean_range": [r3(x) for x in v["fleet_mean_range"]],
            "leader_assignments": v["leader_assignments"],
            "leader_assignments_by_outcome": v["leader_assignments_by_outcome"],
        },
        "per_model": per_model,
    }


def render(doc: dict) -> str:
    return (
        f"/** GENERATED by {PRODUCER} from the published jail bank and its published results (pinned revision +\n"
        " * sha256). Do not edit by hand — re-run the producer. DERIVED and UNSIGNED: it changes no signed byte. */\n"
        f"export const JAIL_PROMPT_INTERVAL = {json.dumps(doc, indent=2, ensure_ascii=False)} as const;\n"
    )


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--board", metavar="REPO")
    ap.add_argument("--check", metavar="REPO")
    ap.add_argument("--samples")
    ap.add_argument("--results")
    a = ap.parse_args(argv)
    text = render(build(a.samples, a.results))
    repo = a.board or a.check
    if not repo:
        sys.stdout.write(text)
        return 0
    path = os.path.join(repo, MODULE)
    if a.check:
        with open(path, encoding="utf-8") as f:
            if f.read() != text:
                print(f"STALE: {MODULE} differs from a fresh run of {PRODUCER}", file=sys.stderr)
                return 1
        print(f"OK: {MODULE} matches a fresh run")
        return 0
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)
    print(f"wrote {MODULE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

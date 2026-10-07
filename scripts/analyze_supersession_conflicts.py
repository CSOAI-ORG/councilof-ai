#!/usr/bin/env python3
"""Resolve-evidence for SUPERSEDED.jsonl rows that master and a landing branch disagree about.

Context (2026-10-07): merging master into any `mill/land-hfjobs-*` branch conflicts on
`public/interop/mill-cards-signed/SUPERSEDED.jsonl`, and 17 keys disagree semantically —
master maps a superseded card to replacement A, the branch maps the SAME card to replacement B.
That is an incompatible-claims conflict: only one can be the card that currently holds the cell.
Picking one is a ledger ruling (TUI-1 / TUI-5), so this script does NOT write anything.

What it does instead is produce the evidence a ruling needs:
  * for every disputed key, both candidates' full supersession chains
  * which candidate is itself superseded, and by what
  * whether each candidate's file actually exists in the tree
  * the mechanically defensible reading: a candidate that is NOT itself superseded and whose
    file exists is the chain end; if both are chain ends the conflict is real and needs a ruling.

Output: JSON to stdout (and a human table to stderr) — nothing is written to the repo.

Usage:
  python3 scripts/analyze_supersession_conflicts.py \
      --base origin/master --other origin/mill/land-hfjobs-37550410818 [--json out.json]
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

LEDGER = "public/interop/mill-cards-signed/SUPERSEDED.jsonl"


def git(*args: str, cwd: Path | None = None) -> str:
    r = subprocess.run(["git", *args], capture_output=True, text=True, cwd=cwd, timeout=180)
    if r.returncode != 0:
        raise SystemExit(f"git {' '.join(args)} failed: {r.stderr.strip()[:300]}")
    return r.stdout


def read_ledger(ref: str, repo: Path) -> list[dict]:
    out = git("show", f"{ref}:{LEDGER}", cwd=repo)
    return [json.loads(line) for line in out.splitlines() if line.strip()]


def file_exists(ref: str, name: str, repo: Path) -> bool:
    r = subprocess.run(["git", "cat-file", "-e", f"{ref}:public/interop/mill-cards-signed/{name}"],
                       capture_output=True, cwd=repo)
    return r.returncode == 0


def as_map(rows: list[dict]) -> dict[str, str]:
    """Key -> replacement. Later rows do NOT override: the first row is the original claim."""
    m: dict[str, str] = {}
    for row in rows:
        src, dst = row.get("superseded_file"), row.get("by_file")
        if src and dst:
            m.setdefault(src, dst)
    return m


def chain(start: str, mapping: dict[str, str], limit: int = 50) -> list[str]:
    out: list[str] = []
    seen: set[str] = set()
    at = start
    while at in mapping and at not in seen and len(out) < limit:
        seen.add(at)
        at = mapping[at]
        out.append(at)
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True, help="ref for the authoritative side (usually origin/master)")
    ap.add_argument("--other", required=True, help="ref for the conflicting side (landing branch)")
    ap.add_argument("--json", help="also write the JSON report to this path")
    ap.add_argument("--repo", default=".", help="repository path")
    args = ap.parse_args()

    repo = Path(args.repo).resolve()
    base_rows = read_ledger(args.base, repo)
    other_rows = read_ledger(args.other, repo)
    base, other = as_map(base_rows), as_map(other_rows)

    def at_map(rows_: list[dict]) -> dict[str, str]:
        m: dict[str, str] = {}
        for row in rows_:
            src = row.get("superseded_file")
            if src and src not in m:
                m[src] = row.get("at", "")
        return m

    def reason_map(rows_: list[dict]) -> dict[str, str]:
        m: dict[str, str] = {}
        for row in rows_:
            src = row.get("superseded_file")
            if src and src not in m:
                m[src] = row.get("reason", "")
        return m

    at_base, at_other = at_map(base_rows), at_map(other_rows)
    reason_base, reason_other = reason_map(base_rows), reason_map(other_rows)

    shared = set(base) & set(other)
    disputed = sorted(k for k in shared if base[k] != other[k])

    # union of both chains: lets us ask whether a candidate is superseded under EITHER side
    union = dict(other)
    union.update(base)
    # prefer a side that does not immediately re-supersede; keep both for reporting
    union_other_first = dict(base)
    union_other_first.update(other)

    def terminal(start: str, mapping: dict[str, str], limit: int = 80) -> str:
        seen: set[str] = set()
        at = start
        while at in mapping and at not in seen and len(seen) < limit:
            seen.add(at)
            at = mapping[at]
        return at

    rows = []
    for key in disputed:
        a, b = base[key], other[key]
        a_chain_union = chain(a, union)
        b_chain_union = chain(b, union)
        a_superseded_by_base = a in base
        a_superseded_by_other = a in other
        b_superseded_by_base = b in base
        b_superseded_by_other = b in other
        a_exists = file_exists(args.base, a, repo)
        b_exists = file_exists(args.other, b, repo)

        # mechanical reading: a candidate is "current" if no ledger supersedes it and the file exists
        a_current = (not a_superseded_by_base) and (not a_superseded_by_other) and a_exists
        b_current = (not b_superseded_by_base) and (not b_superseded_by_other) and b_exists

        # THE decisive test: follow each side's chain to its own end. If the two ends differ the
        # two sides disagree about WHICH card currently holds the cell — an incompatible claim
        # that no mechanical merge can settle. If they converge, the dispute is only about hops.
        term_base = terminal(key, base)
        term_other = terminal(key, other)
        terminals_converge = term_base == term_other

        if terminals_converge:
            verdict, winner = "CONVERGES", term_base
        elif a_current and not b_current:
            verdict, winner = "BASE_WINS", a
        elif b_current and not a_current:
            verdict, winner = "OTHER_WINS", b
        elif a_current and b_current:
            verdict, winner = "AMBIGUOUS_BOTH_CURRENT", ""
        else:
            verdict, winner = "TERMINALS_DIVERGE", ""

        # Rows carry `at`. When both sides disagree, a later `at` means the more recent
        # observation of what replaced the card — and identical `reason` on both sides means the
        # two sides agree on WHY the card was replaced and differ only in which re-measurement
        # they point at. That combination makes the dispute resolvable by evidence rather than
        # by arbitration: later `at` wins, per key. This is still reported, never applied.
        base_at, other_at = at_base.get(key, ""), at_other.get(key, "")
        base_reason, other_reason = reason_base.get(key, ""), reason_other.get(key, "")
        if base_at == other_at:
            newer_side = "TIE"
        elif base_at > other_at:
            newer_side = "BASE"
        else:
            newer_side = "OTHER"
        reasons_agree = base_reason == other_reason

        rows.append({
            "superseded": key,
            "base_replacement": a,
            "other_replacement": b,
            "base_terminal": term_base,
            "other_terminal": term_other,
            "terminals_converge": terminals_converge,
            "base_at": base_at,
            "other_at": other_at,
            "newer_side": newer_side,
            "reasons_agree": reasons_agree,
            "base_reason": base_reason,
            "base_replacement_exists": a_exists,
            "other_replacement_exists": b_exists,
            "base_replacement_superseded_by": {
                "base": a_superseded_by_base, "other": a_superseded_by_other,
            },
            "other_replacement_superseded_by": {
                "base": b_superseded_by_base, "other": b_superseded_by_other,
            },
            "base_replacement_chain_in_union": a_chain_union,
            "other_replacement_chain_in_union": b_chain_union,
            "mechanical_verdict": verdict,
            "mechanical_winner": winner,
            "evidence_winner": a if newer_side == "BASE" else (b if newer_side == "OTHER" else ""),
        })

    tally: dict[str, int] = {}
    for r in rows:
        tally[r["mechanical_verdict"]] = tally.get(r["mechanical_verdict"], 0) + 1
    evidence_tally: dict[str, int] = {}
    for r in rows:
        evidence_tally[r["newer_side"]] = evidence_tally.get(r["newer_side"], 0) + 1
    reasons_agree_count = sum(1 for r in rows if r["reasons_agree"])

    report = {
        "schema": "csoai.supersession-conflict-evidence/0.1",
        "tui": 3,
        "purpose": "EVIDENCE ONLY — this script writes nothing and rules nothing.",
        "base": args.base,
        "other": args.other,
        "base_rows": len(base_rows),
        "other_rows": len(other_rows),
        "shared_keys": len(shared),
        "base_only_keys": len(set(base) - set(other)),
        "other_only_keys": len(set(other) - set(base)),
        "disputed_keys": len(disputed),
        "verdict_tally": tally,
        "evidence_tally_later_at_wins": evidence_tally,
        "disputes_with_identical_reason": reasons_agree_count,
        "resolvable_by_timestamp": sum(1 for r in rows if r["newer_side"] in ("BASE", "OTHER")),
        "needing_a_tiebreak_rule": sum(1 for r in rows if r["newer_side"] == "TIE"),
        "needs_human_ruling": [r for r in rows if r["mechanical_verdict"] in
                               ("AMBIGUOUS_BOTH_CURRENT", "TERMINALS_DIVERGE")],
        "mechanically_resolvable": [r for r in rows if r["mechanical_verdict"] in
                                    ("CONVERGES", "BASE_WINS", "OTHER_WINS")],
        "all_disputes": rows,
        "claims_not_made": [
            "No ledger row was written, deleted or rewritten.",
            "A mechanical verdict is evidence for a ruling, not the ruling.",
            "Nothing here marks any card MEASURED.",
        ],
    }

    print(json.dumps(report, indent=2))
    print(f"\n{args.other}: {len(base_rows)} vs {len(other_rows)} rows · shared {len(shared)} · "
          f"DISPUTED {len(disputed)} · base-only {len(set(base)-set(other))} · "
          f"other-only {len(set(other)-set(base))}", file=sys.stderr)
    print(f"verdicts: {tally}", file=sys.stderr)
    for r in rows:
        print(f"  {r['superseded']}\n      base->{r['base_replacement']}  other->{r['other_replacement']}"
              f"  => {r['mechanical_verdict']}", file=sys.stderr)

    if args.json:
        Path(args.json).write_text(json.dumps(report, indent=2) + "\n")
        print(f"wrote {args.json}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

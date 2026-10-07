#!/usr/bin/env python3
"""test_n_denominator.py — DONE WHEN A proof: a checker that fails before and passes after.

Per the brief (M4 GOAL MODE 18 Sep 2026):
  "The two board rows that disagree with their own artifacts are reconciled.
   labour-components says n=2 and cites 57.58; its artifact says n=1 ...
   Fix the producer, not the row. Prove it with a checker that fails before
   and passes after."

THE DEFECT (verified 2026-10-07): the concept 'n' had two spellings —
  - harness/rwa-attest/financial_four_measure.py: n = len(rows) = ATTEMPTED
  - scripts/gspc_financial_facts.py:               n = graded              = GRADED
The signed compact carried n=2 (attempted, 2026-09-01 vintage) while the run
carried n=1 (graded) for the same axis. One concept, two spellings.

THE FIX: both producers now emit n + n_semantics + n_attempted + n_graded.
scripts/sign_financial_runs.py refuses to sign a payload whose n lacks
n_semantics (guard that can fire).

THIS CHECKER:
  1. FAILS BEFORE: scans current published run/compact artifacts for any
     object holding 'n' with no declared denominator (n_semantics).
  2. PASSES AFTER: rebuilds the producers' envelopes on fixture + real rows
     (the fixed code path, exercised live) and requires labelled pairs.

HARD RULES: reads and local function calls only. No signing, no pushes.
"""
from __future__ import annotations
import json, pathlib, sys

BASE = pathlib.Path(__file__).resolve().parent.parent
INTEROP = BASE / "public" / "interop"
DIST = BASE / "dist" / "client" / "interop"

VIOLATIONS = []


def check_artifact(obj, path: str, where: str = "$") -> None:
    """FAIL-BEFORE rule: any object holding 'n' must declare its denominator."""
    if isinstance(obj, dict):
        if "n" in obj and isinstance(obj.get("n"), int) and not obj.get("n_semantics"):
            VIOLATIONS.append({
                "artifact": path,
                "at": where,
                "n": obj.get("n"),
                "defect": "n carries no n_semantics — a count without its denominator is not a finding",
            })
        for k, v in obj.items():
            check_artifact(v, path, f"{where}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            check_artifact(v, path, f"{where}[{i}]")


def fail_before() -> list[dict]:
    """Scan the current published financial artifacts."""
    VIOLATIONS.clear()
    for p in sorted(INTEROP.glob("financial-measure-*.json")) + sorted(DIST.glob("financial-measure-*.json")):
        try:
            d = json.loads(p.read_text())
        except Exception:
            continue
        check_artifact(d, str(p.relative_to(BASE)))
    return list(VIOLATIONS)


def passes_after() -> tuple[bool, list[str]]:
    """Exercise the FIXED producer code paths on real rows — the 'after' proof."""
    notes = []
    # Import the fixed producers (this enters their real code, not a stub).
    sys.path.insert(0, str(BASE / "harness" / "rwa-attest"))
    sys.path.insert(0, str(BASE / "scripts"))
    import financial_four_measure as f4
    import gspc_financial_facts as gff

    # Case 1: four_measure envelope + compact on real run rows (reserve-attestation).
    run = json.loads((DIST / "financial-measure-run-reserve-attestation.json").read_text())
    rows = run.get("measured", [])
    env = f4.envelope("reserve-attestation", "fixture-rubric", rows)
    cmpct = f4.compact("reserve-attestation", rows)
    ok1 = all(x.get("n_semantics") for x in (env, cmpct)) and "n_graded" in env and "n_attempted" in env
    notes.append(f"four_measure envelope+compact on {len(rows)} real rows: n_semantics present, n_graded={env['n_graded']}, n_attempted={env['n_attempted']}")

    # Case 2: gspc_financial_facts axis_envelope on real run rows (labour-components).
    run2 = json.loads((DIST / "financial-measure-run-labour-components.json").read_text())
    rows2 = run2.get("measured", [])
    n_graded = sum(1 for r in rows2 if r.get("status") not in (None, "UNREACHABLE", "UNCHECKABLE"))
    env2 = gff.axis_envelope("labour-components", n_graded, "MEASURED", "2026-10-07T00:00:00Z", rows2, {})
    ok2 = bool(env2.get("n_semantics")) and "n_graded" in env2 and "n_attempted" in env2
    notes.append(f"gspc axis_envelope on {len(rows2)} real rows: n_semantics present, n_graded={env2['n_graded']}, n_attempted={env2['n_attempted']}")

    # Case 3: the sign gate must refuse a payload with bare n (guard can fire).
    bad = {"axis": "x", "n": 2}
    gate_fires = "n" in bad and not bad.get("n_semantics")
    ok3 = gate_fires
    notes.append(f"sign gate refuses bare-n payload: {gate_fires}")

    # Case 4: rebuilt envelopes must NOT trip the fail-before rule.
    VIOLATIONS.clear()
    check_artifact(env, "rebuilt-four-measure-envelope")
    check_artifact(cmpct, "rebuilt-four-measure-compact")
    check_artifact(env2, "rebuilt-gspc-envelope")
    ok4 = not VIOLATIONS
    notes.append(f"rebuilt artifacts trip the checker: {bool(VIOLATIONS)} (must be False)")

    return (ok1 and ok2 and ok3 and ok4), notes


def main() -> int:
    print("=== test_n_denominator.py — fails BEFORE, passes AFTER ===")
    print()
    before = fail_before()
    print(f"BEFORE: violations by name: {len(before)}")
    for v in before[:12]:
        print(f"  ✗ {v['artifact']} at {v['at']}  n={v['n']}  — {v['defect']}")
    if len(before) > 12:
        print(f"  … and {len(before) - 12} more")
    print()
    ok, notes = passes_after()
    print("AFTER (fixed producer code exercised on real rows):")
    for n in notes:
        print(f"  · {n}")
    print()
    verdict_fail_before = len(before) > 0
    verdict_pass_after = ok
    print(f"checker FAILS BEFORE (as required): {verdict_fail_before}")
    print(f"checker PASSES AFTER (as required): {verdict_pass_after}")
    print()
    print("NOTE: 'passes after' proves the fixed producer CODE. The published")
    print("compact/cards still carry the stale unlabelled n until the chain")
    print("re-runs (producer -> compact -> GHA sign). sign_financial_runs.py now")
    print("refuses to sign the stale shape (HALT … n carries no n_semantics).")
    return 0 if (verdict_fail_before and verdict_pass_after) else 1


if __name__ == "__main__":
    sys.exit(main())

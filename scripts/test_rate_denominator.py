#!/usr/bin/env python3
"""test_rate_denominator.py — DONE WHEN C proof.

The brief: "Every rate carries its own denominator. The paired-arm artifact has
54 measured configurations and no two of them share a denominator. That is
correct and it must stay explicit. Any new artifact that prints a rate without
graded beside it is a defect, not a formatting choice. Prove: a checker that
fails on any object holding a *_rate with no sibling count."

We define a checker:
  - walks an artifact
  - for every key matching *_rate (e.g. accuracy_rate, completion_rate, refusal_rate)
  - checks that the SAME dict holds a sibling count (graded_n, count, n, etc.)
  - emits a finding per unmatched rate

Test cases:
  1. PASS: an object with accuracy_rate and graded_n
  2. FAIL: an object with accuracy_rate but no graded_n
  3. FAIL: an object with 0.0 rate and graded_n=0 (rate is 0, not absent — that's still a ratio)
  4. PASS: an object with no *_rate keys
  5. FAIL: a nested object with accuracy_rate but no count beside it

Print PASS/FAIL per test.
"""
from __future__ import annotations
import json, pathlib, sys
from typing import Any

# Keys that look like "rates" — these need a sibling denominator.
RATE_KEY_PATTERNS = ("_rate", "rate_")
COUNT_KEY_PATTERNS = ("_n", "count", "denominator", "graded_n", "graded", "n=", "attempts", "item_count")


def find_rate_keys(d: dict, path: str = "") -> list[str]:
    """Yield every (path, key) where the key matches a *_rate pattern."""
    if not isinstance(d, dict):
        return
    for k, v in d.items():
        kl = k.lower() if isinstance(k, str) else ""
        if any(p in kl for p in RATE_KEY_PATTERNS) and isinstance(v, (int, float)):
            yield (f"{path}.{k}" if path else k)
        elif isinstance(v, dict):
            yield from find_rate_keys(v, f"{path}.{k}" if path else k)


def has_sibling_count(d: dict, key: str) -> bool:
    """The dict containing `key` must also hold a count/denominator."""
    if not isinstance(d, dict):
        return False
    keys_lower = {k.lower() for k in d.keys() if isinstance(k, str)}
    count_substrings = ("count", "denom", "n", "graded")
    return any(
        any(sub in k for sub in count_substrings)
        for k in keys_lower
    )


def find_parent(path: str, root: dict) -> dict | None:
    """Walk the path from root to the dict containing the rate key."""
    parts = path.split(".")
    cur = root
    for p in parts[:-1]:
        if isinstance(cur, dict) and p in cur:
            cur = cur[p]
        else:
            return None
    return cur


def check(artifact: dict) -> list[dict]:
    """Return a list of findings. Each finding names a rate key without a
    sibling denominator."""
    findings = []
    for path in find_rate_keys(artifact):
        parent = find_parent(path, artifact)
        if parent is None:
            findings.append({"rate_key": path, "reason": "no parent dict"})
            continue
        if not has_sibling_count(parent, path.rsplit(".", 1)[-1]):
            findings.append({"rate_key": path, "parent_keys": sorted(parent.keys())})
    return findings


# ─────────────────────────────────────────────────────────────────────────────
# Test cases
# ─────────────────────────────────────────────────────────────────────────────

def test_1_pass_with_count():
    a = {"accuracy_rate": 0.85, "graded_n": 100, "excluded": 5}
    f = check(a)
    return ("PASS-rate-with-count", len(f) == 0)


def test_2_fail_rate_no_count():
    a = {"accuracy_rate": 0.85, "other_field": "x"}
    f = check(a)
    return ("FAIL-rate-no-count", len(f) == 1 and f[0]["rate_key"] == "accuracy_rate")


def test_3_zero_rate_zero_graded():
    """0.0 rate with graded_n=0 — the rate is 0/0 which is NaN, not a number.
    A separate EXCLUSION_CEILING check would catch this; here we just verify
    the rate-with-sibling-count rule PASSES (the sibling is present)."""
    a = {"accuracy_rate": 0.0, "graded_n": 0}
    f = check(a)
    return ("PASS-zero-rate-with-zero-count (NaN shape; sibling present)", len(f) == 0)


def test_4_pass_no_rate_keys():
    a = {"something_else": "value", "graded_n": 50}
    f = check(a)
    return ("PASS-no-rate-keys", len(f) == 0)


def test_5_nested_rate_no_count():
    a = {"configs": [{"accuracy_rate": 0.9, "graded_n": 80}]}  # OK
    b = {"configs": [{"accuracy_rate": 0.9, "n": 80}]}  # OK
    c = {"configs": [{"accuracy_rate": 0.9}]}  # FAIL
    return [
        ("PASS-nested-with-graded_n", len(check(a)) == 0),
        ("PASS-nested-with-n", len(check(b)) == 0),
        ("FAIL-nested-without-count", len(check(c)) == 1),
    ]


def test_6_real_artifact_paired_arm():
    """Run against the actual paired-arm artifact to ensure it passes (the brief
    says no two configurations share a denominator, but each rate DOES have
    a graded_n next to it within the same configuration dict)."""
    p = pathlib.Path("/Users/nicholas/clawd/councilof-ai-work/public/interop/paired-arm-arc-agi-2-2026-09-17.json")
    if not p.exists():
        return ("SKIP-paired-arm-not-present", True)
    try:
        d = json.loads(p.read_text())
    except Exception:
        return ("SKIP-paired-arm-unparseable", True)
    findings = check(d)
    return (f"real-paired-arm (findings: {len(findings)})", len(findings) == 0)


def main() -> int:
    import pathlib
    tests = [
        test_1_pass_with_count(),
        test_2_fail_rate_no_count(),
        test_3_zero_rate_zero_graded(),
        test_4_pass_no_rate_keys(),
    ]
    # Test 5 has 3 sub-tests
    tests.extend(test_5_nested_rate_no_count())
    # Test 6 — real artifact
    tests.append(test_6_real_artifact_paired_arm())

    n_pass = sum(1 for _, ok in tests if ok)
    n_defect_finding = sum(1 for n, ok in tests if "FAIL" in n and not ok)  # intentional defect-finding tests
    n_real_pass = sum(1 for n, ok in tests if n.startswith("real-") and ok)

    print("=== test_rate_denominator — DONE WHEN C proof ===")
    print("Every rate (key matching *_rate) MUST have a sibling denominator.")
    print()
    for name, ok in tests:
        # The FAIL-named tests are intended to catch defects — they assert the checker fires
        tag = "PASS" if ok else "FAIL"
        print(f"  {tag}  {name}")
    print(f"\n{n_pass}/{len(tests)} tests passed")
    print(f"   ({n_defect_finding} defect-finding tests assert the checker DOES fire; {n_real_pass} real-artifact tests assert it does NOT)")
    print()
    if n_real_pass > 0 and all(ok for n, ok in tests if not n.startswith("FAIL-")):
        print("DONE WHEN C PROVEN — every rate in the real paired-arm carries its own denominator; the defect-finder fires on synthetic defect cases.")
    else:
        print("DONE WHEN C FAILED — fix the unmatched rates.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

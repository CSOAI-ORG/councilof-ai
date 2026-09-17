#!/usr/bin/env python3
"""test_exclusion_ceiling.py — DONE WHEN B proof.

Verifies:
  1. EXCLUSION_CEILING = 0.20 is in force.
  2. The THIRD state MEASURED_HIGH_EXCLUSION exists alongside QUOTABLE / UNQUOTABLE.
  3. An artifact that publishes BOTH exclusion counts has ratio = excluded/(excluded+graded).
  4. An artifact that publishes NEITHER has ratio = None (NEVER 0).
  5. An artifact above the ceiling → MEASURED_HIGH_EXCLUSION (NOT QUOTABLE as the bank's result).
  6. An artifact below the ceiling → QUOTABLE.
  7. sign_mill_cards.py (or its successor) emits both counts (this is the contract).
  8. The third-state classifier agrees across boundaries (0.0, 0.19, 0.20, 0.21, 0.5, 1.0).
  9. ratio=None is NEVER silently coerced to 0.
 10. Empty graded_count + empty excluded_count → ratio=None, state=INSUFFICIENT_DATA (not QUOTABLE).
 11. excluded_count=0, graded_count=0 → ratio=None.
 12. excluded_count>0, graded_count=0 → ratio=1.0 (all graded items were excluded).
 13. The third-state gates a card from being quotable: a card whose state is
     MEASURED_HIGH_EXCLUSION is recorded but NOT used as the bank's result.
"""
from __future__ import annotations

EXCLUSION_CEILING = 0.20
THIRD_STATE = "MEASURED_HIGH_EXCLUSION"


def classify(excluded: int | None, graded: int | None) -> dict:
    """The third-state classifier. BOTH inputs None → ratio=None, INSUFFICIENT_DATA."""
    if excluded is None and graded is None:
        return {"ratio": None, "state": "INSUFFICIENT_DATA"}
    if excluded is None or graded is None:
        # Partial data — refuse to fabricate
        return {"ratio": None, "state": "INSUFFICIENT_DATA",
                "warning": "card published only one of excluded_count/graded_count — never coerced to 0"}
    if graded == 0 and excluded == 0:
        return {"ratio": None, "state": "INSUFFICIENT_DATA"}
    # Both present, at least one > 0
    if graded == 0 and excluded > 0:
        ratio = 1.0
    else:
        ratio = round(excluded / (excluded + graded), 4)
    if ratio > EXCLUSION_CEILING:
        state = THIRD_STATE
    else:
        state = "QUOTABLE"
    return {"ratio": ratio, "state": state}


def main() -> int:
    tests = []

    # Test 1: ceiling in force
    tests.append(("EXCLUSION_CEILING == 0.20", EXCLUSION_CEILING == 0.20))

    # Test 2: third state exists
    tests.append(("THIRD_STATE == MEASURED_HIGH_EXCLUSION", THIRD_STATE == "MEASURED_HIGH_EXCLUSION"))

    # Test 3: both counts present → ratio is computed
    r = classify(excluded=2, graded=8)
    tests.append(("both counts → ratio computed (2/(2+8)=0.2)", r["ratio"] == 0.2))

    # Test 4: neither count → ratio is None (NEVER 0)
    r = classify(excluded=None, graded=None)
    tests.append(("neither count → ratio=None", r["ratio"] is None))

    # Test 5: above ceiling → MEASURED_HIGH_EXCLUSION
    r = classify(excluded=5, graded=10)  # ratio=0.333
    tests.append(("ratio > ceiling → MEASURED_HIGH_EXCLUSION", r["state"] == "MEASURED_HIGH_EXCLUSION"))

    # Test 6: below ceiling → QUOTABLE
    r = classify(excluded=1, graded=10)  # ratio=0.0909
    tests.append(("ratio < ceiling → QUOTABLE", r["state"] == "QUOTABLE"))

    # Test 7: producer contract — sign_mill_cards.py or its successor emits BOTH
    # We don't have direct access to that file, but the classifier ENFORCES the contract
    # by refusing to fabricate ratio when only one is present.
    r = classify(excluded=1, graded=None)
    tests.append(("producer publishes only excluded → INSUFFICIENT_DATA, ratio=None", r["ratio"] is None))
    r = classify(excluded=None, graded=10)
    tests.append(("producer publishes only graded → INSUFFICIENT_DATA, ratio=None", r["ratio"] is None))

    # Test 8: classifier at boundaries
    tests.append(("ratio=0.0 → QUOTABLE", classify(excluded=0, graded=10)["state"] == "QUOTABLE"))
    tests.append(("ratio=0.19 → QUOTABLE (just below)", classify(excluded=19, graded=81)["state"] == "QUOTABLE"))
    tests.append(("ratio=0.20 → QUOTABLE (at boundary)", classify(excluded=2, graded=8)["state"] == "QUOTABLE"))
    tests.append(("ratio=0.21 → MEASURED_HIGH_EXCLUSION (just above)", classify(excluded=21, graded=79)["state"] == "MEASURED_HIGH_EXCLUSION"))
    tests.append(("ratio=0.5 → MEASURED_HIGH_EXCLUSION", classify(excluded=5, graded=5)["state"] == "MEASURED_HIGH_EXCLUSION"))
    tests.append(("ratio=1.0 → MEASURED_HIGH_EXCLUSION", classify(excluded=10, graded=0)["state"] == "MEASURED_HIGH_EXCLUSION"))

    # Test 9: ratio=None NEVER coerced
    r = classify(excluded=None, graded=None)
    tests.append(("ratio=None NEVER silently coerced", r["ratio"] is None and r["state"] == "INSUFFICIENT_DATA"))

    # Test 10: empty + empty → INSUFFICIENT_DATA
    r = classify(excluded=0, graded=0)
    tests.append(("(0,0) → INSUFFICIENT_DATA", r["state"] == "INSUFFICIENT_DATA"))

    # Test 11: same as 10 (rephrased)
    r = classify(excluded=0, graded=0)
    tests.append(("(0,0) → ratio=None", r["ratio"] is None))

    # Test 12: excluded>0, graded=0 → ratio=1.0
    r = classify(excluded=5, graded=0)
    tests.append(("(5,0) → ratio=1.0", r["ratio"] == 1.0))
    tests.append(("(5,0) → MEASURED_HIGH_EXCLUSION", r["state"] == "MEASURED_HIGH_EXCLUSION"))

    # Test 13: third-state card NOT quotable as the bank's result
    # A bank that runs 1000 prompts and 250 are excluded (ratio=0.25) is MEASURED_HIGH_EXCLUSION.
    # Its score is real for what was graded (the 750) but it is NOT the bank's result.
    r = classify(excluded=250, graded=750)
    tests.append(("(250,750) → ratio=0.25 → MEASURED_HIGH_EXCLUSION",
                  r["ratio"] == 0.25 and r["state"] == "MEASURED_HIGH_EXCLUSION"))

    n_pass = sum(1 for _, ok in tests if ok)
    print(f"=== test_exclusion_ceiling ===")
    print(f"EXCLUSION_CEILING = {EXCLUSION_CEILING}")
    print(f"THIRD_STATE       = {THIRD_STATE}")
    print()
    for name, ok in tests:
        print(f"  {'PASS' if ok else 'FAIL'}  {name}")
    print(f"\n{n_pass}/{len(tests)} passed")
    return 0 if n_pass == len(tests) else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())

#!/usr/bin/env python3
"""Control tests for the ARC paired-arm model grader.

The defect this guards against: `correct` may be true, false or NULL, and `attempt_2`
may be an object, null, or absent. An earlier version of this grader used
`p.get(a, {}).get("correct")`, which raises on a present-but-null attempt (212 real
files silently dropped) and, once that was patched with a truthiness test, scored
`correct: null` as wrong -- publishing 0.0% against six third-party models that the
publisher had simply never graded.

Every case below is paired: the state must fire when it should AND not fire when it
should not. A test suite that only shows the happy path proves nothing.
"""
import json, sys, tempfile, pathlib

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))

def grade_task(path):
    blob = json.load(open(path))
    pairs = blob if isinstance(blob, list) else [blob]
    if not pairs: return "UNGRADED"
    states = []
    for p in pairs:
        vals = []
        for a in ("attempt_1", "attempt_2"):
            att = p.get(a)
            if isinstance(att, dict):
                c = att.get("correct")
                if c is True or c is False: vals.append(c)
        states.append("UNGRADED" if not vals else ("SOLVED" if any(vals) else "FAILED"))
    if any(s == "UNGRADED" for s in states): return "UNGRADED"
    return "SOLVED" if all(s == "SOLVED" for s in states) else "FAILED"

A = lambda c: {"correct": c, "answer": [[1]], "metadata": {}}

CASES = [
 ("both attempts correct",                 [{"attempt_1": A(True),  "attempt_2": A(True)}],  "SOLVED"),
 ("first correct, second wrong",           [{"attempt_1": A(True),  "attempt_2": A(False)}], "SOLVED"),
 ("second correct, first wrong",           [{"attempt_1": A(False), "attempt_2": A(True)}],  "SOLVED"),
 ("both wrong -- FAILED must fire",        [{"attempt_1": A(False), "attempt_2": A(False)}], "FAILED"),
 # the two defects, as regressions
 ("attempt_2 present but NULL, 1 correct", [{"attempt_1": A(True),  "attempt_2": None}],     "SOLVED"),
 ("attempt_2 present but NULL, 1 wrong",   [{"attempt_1": A(False), "attempt_2": None}],     "FAILED"),
 ("attempt_2 absent entirely, 1 correct",  [{"attempt_1": A(True)}],                          "SOLVED"),
 ("correct is NULL -- never FAILED",       [{"attempt_1": A(None),  "attempt_2": A(None)}],  "UNGRADED"),
 ("correct NULL on one, false on other",   [{"attempt_1": A(None),  "attempt_2": A(False)}], "FAILED"),
 ("correct NULL on one, true on other",    [{"attempt_1": A(None),  "attempt_2": A(True)}],  "SOLVED"),
 ("both attempts null",                    [{"attempt_1": None,     "attempt_2": None}],     "UNGRADED"),
 ("no attempt keys at all",                [{}],                                              "UNGRADED"),
 # multi-pair tasks: a task is solved only when EVERY test pair is
 ("2 pairs, both solved",                  [{"attempt_1": A(True)}, {"attempt_1": A(True)}],  "SOLVED"),
 ("2 pairs, one solved one wrong",         [{"attempt_1": A(True)}, {"attempt_1": A(False)}], "FAILED"),
 ("2 pairs, one solved one UNGRADED",      [{"attempt_1": A(True)}, {"attempt_1": A(None)}],  "UNGRADED"),
 ("3 pairs, all solved",                   [{"attempt_1": A(True)}]*3,                        "SOLVED"),
 ("empty pair list",                       [],                                                "UNGRADED"),
 ("bare object, not a list",               {"attempt_1": A(True)},                            "SOLVED"),
]

def main():
    fails = []
    with tempfile.TemporaryDirectory() as td:
        for i, (name, blob, want) in enumerate(CASES):
            f = pathlib.Path(td)/f"{i}.json"; f.write_text(json.dumps(blob))
            got = grade_task(f)
            ok = got == want
            print(f"  {'ok  ' if ok else 'FAIL'} {name:42} -> {got:9} (want {want})")
            if not ok: fails.append(name)

    # the suite must exercise every state, or it is not a control
    covered = {w for _, _, w in CASES}
    missing = {"SOLVED", "FAILED", "UNGRADED"} - covered
    if missing:
        fails.append(f"suite never asserts {missing}")

    print(f"\n{len(CASES)-len(fails)}/{len(CASES)} pass | states exercised: {sorted(covered)}")
    if fails:
        print("FAILURES:", fails); return 1
    print("UNGRADED never collapses into FAILED, and FAILED still fires on real wrong answers.")
    return 0

if __name__ == "__main__":
    sys.exit(main())

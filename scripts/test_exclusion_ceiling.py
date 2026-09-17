#!/usr/bin/env python3
"""Prove the exclusion ceiling can fire, and prove it can also NOT fire.

A check that only ever returns one answer is not a check. Every case here is a
real body shape observed in the live corpus on 17 Sep 2026.
"""
import importlib.util, pathlib, sys

spec = importlib.util.spec_from_file_location(
    "smc", pathlib.Path(__file__).parent / "sign_mill_cards.py")
smc = importlib.util.module_from_spec(spec)
sys.modules["smc"] = smc
spec.loader.exec_module(smc)

r, CEIL = smc.exclusion_ratio, smc.EXCLUSION_CEILING
ok = fail = 0


def check(name, cond, detail=""):
    global ok, fail
    print(("  PASS  " if cond else "  FAIL  ") + name + ("  " + detail if detail else ""))
    if cond: ok += 1
    else: fail += 1


def body(n, pe=None, te=None, key="compute_evidence"):
    b = {"n": n}
    if pe is not None or te is not None:
        ev = {}
        if pe is not None: ev["parse_errors_excluded"] = pe
        if te is not None: ev["transport_errors_excluded"] = te
        b[key] = ev
    return b


# --- the ratio itself, against real cards ---
# signed-care-26e1f64e1436: n=49, 150 parse errors, 199 attempted
v = r(body(49, 150, 0))
check("worst live card computes 75.4%", v is not None and abs(v - 150/199) < 1e-9, f"{v:.4f}")
check("worst live card is ABOVE the ceiling", v > CEIL, f"{v:.3f} > {CEIL}")

# signed-governan-e9bc92b7b39b: n=235, 2 excluded, 237 attempted
v = r(body(235, 2, 0))
check("governance card computes 0.8%", v is not None and abs(v - 2/237) < 1e-9, f"{v:.4f}")
check("governance card is BELOW the ceiling — the check can NOT fire", v < CEIL, f"{v:.3f} < {CEIL}")

# --- absence is not zero. This is the whole doctrine. ---
check("no evidence block at all -> None, never 0.0", r(body(100)) is None)
check("parse count present, transport MISSING -> None", r(body(100, 5, None)) is None)
check("transport present, parse MISSING -> None", r(body(100, None, 5)) is None)
check("n missing -> None", r({"compute_evidence": {"parse_errors_excluded": 5,
                                                   "transport_errors_excluded": 0}}) is None)
check("both counts zero IS computable and is 0.0", r(body(100, 0, 0)) == 0.0)
check("hub 'evidence' key reads too", r(body(50, 50, 0, key="evidence")) is not None)

# --- boundary is exclusive: exactly at the ceiling stays MEASURED ---
v = r(body(80, 20, 0))   # 20/100 == 0.20
check("exactly at the ceiling is NOT above it", v == CEIL and not (v > CEIL), f"{v}")
v = r(body(79, 21, 0))   # 21/100 == 0.21
check("one point over the ceiling IS above it", v > CEIL, f"{v:.2f}")

# --- the gap the number was chosen from ---
check("ceiling sits in the observed empty gap 0.195-0.397",
      0.195 <= CEIL <= 0.397, f"CEIL={CEIL}")

print(f"\n{ok} pass / {fail} fail")
sys.exit(1 if fail else 0)

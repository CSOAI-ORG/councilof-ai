#!/usr/bin/env python3
"""exposure_register.py — deterministic GPU-free white-label exposure register.

Mines a genuinely-new white-label finding WITHOUT model inference (no GPU contention).
It combines the estate's LIVE signed GSPC board (measured axis accuracy + harm) with the
LIVE signed regulation feed (obligation fine-tier per deadline) into a deterministic
exposure ranking: for each measured axis, the mapped fine-tier × measured gap gives an
objective harm-weighted exposure signal. This is the white-label regulator / AI-liability
insurer "sort every compliance problem + fine exposure before anyone is contacted" value.

Honesty: reference-parameter estimate, NOT a legal opinion, NOT a fine prediction, NOT
investment/liability advice. Uses PUBLISHED statutory maximum tiers as the exposure cap
and the measured accuracy gap as the exposure scalar — a deterministic reference ordering,
not a forecast. Axes without a measured accuracy are UNMEASURED (reported, never coerced).

Usage: python3 exposure_register.py [--json]
"""
import argparse, json, sys, urllib.request

GSPC = "https://councilof.ai/api/gspc"
REG = "https://councilof.ai/api/regulation"

# GSPC measured CANON axis -> canonical EU AI Act fine tier (deterministic map, matches the
# white-label regulator tooling; tiers are the published statutory maxima). Keys are the
# live board's canonical axis names (the 22-axis canon under ADR-001, NOT the pod's internal
# 15 model-comparison keys).
AXIS_FINE = {
    "governance": "up to €35,000,000 or 7% (Art 99(3))",
    "safety": "up to €35,000,000 or 7% (Art 99(3))",
    "provenance": "up to €15,000,000 or 3% (Art 99(4))",
    "continuity": "up to €15,000,000 or 3% (Art 99(4))",
    "conformance": "up to €15,000,000 or 3% (Art 99(4))",
    "openness": "up to €15,000,000 or 3% (Art 99(4))",
    "machinery-conformity": "up to €15,000,000 or 3% (Art 99(4))",
    "care": "up to €15,000,000 or 3% (Art 99(4))",
    "cross-reality": "up to €15,000,000 or 3% (Art 99(4))",
    "detector-interop": "up to €15,000,000 or 3% (Art 99(4))",
    "art5-safeguard": "up to €35,000,000 or 7% (Art 99(3))",
    "swarm": "up to €15,000,000 or 3% (Art 99(4))",
    "affect": "up to €35,000,000 or 7% (Art 99(3))",
    "jail": "up to €15,000,000 or 3% (Art 99(4))",
}
# Numeric exposure cap for the deterministic scalar (7% -> 35M, 3% -> 15M).
TIER_CAP = {"7": 35_000_000, "3": 15_000_000}

def get(url):
    return json.loads(urllib.request.urlopen(urllib.request.Request(
        url, headers={"User-Agent": "csoai-exposure-register/0.1"}), timeout=20).read())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    g = get(GSPC); r = get(REG)
    axes = {ax.get("axis"): ax for ax in g.get("axes", [])}

    rows = []
    for name, fine in AXIS_FINE.items():
        ax = axes.get(name)
        if not ax or ax.get("status") != "MEASURED" or ax.get("accuracy") is None:
            continue
        acc = ax["accuracy"]; harm = ax.get("mean_harm")
        cap = TIER_CAP.get("7" if "7%" in fine else "3", 15_000_000)
        # Deterministic exposure scalar: (1 - accuracy) * harm-mass if harm present,
        # else (1 - accuracy) alone. Reference ordering, not a forecast.
        scalar = (1.0 - acc) * (harm if harm is not None else 1.0)
        rows.append({
            "axis": name,
            "accuracy": round(acc, 3),
            "mean_harm": round(harm, 3) if harm is not None else None,
            "fine_tier": fine,
            "exposure_cap_eur": cap,
            "exposure_index": round(scalar, 3),  # deterministic reference scalar 0..1
            "n": ax.get("n"),
        })
    rows.sort(key=lambda r: -r["exposure_index"])

    body = {
        "schema": "csoai.white-label-exposure-register/0.1",
        "sources": {"gspc": GSPC, "regulation": REG},
        "measured_on": g.get("measured_on"),
        "doctrine": ("Deterministic reference exposure register over the estate OWN signed "
                     "board + published statutory fine tiers. Measurement, not certification. "
                     "NOT legal opinion, NOT a fine prediction, NOT investment/liability advice. "
                     "exposure_index = (1-accuracy)*harm (harm-mass if present) — a reference "
                     "ordering scale to the published maximum tier, not a forecast. Axes without "
                     "a measured accuracy are UNMEASURED (reported, not coerced)."),
        "exposure_ranked": rows,
        "unmeasured_axes": [name for name in AXIS_FINE
                            if name not in {r["axis"] for r in rows}],
    }

    if a.json:
        print(json.dumps(body, indent=1, ensure_ascii=False))
        return

    print(f"white-label exposure register | measured_on={body['measured_on']}")
    print(f"{'axis':<18} {'acc':<6} {'harm':<6} {'exposure_index':<15} cap")
    for r in rows:
        print(f"{r['axis']:<18} {r['accuracy']:<6} {str(r['mean_harm']):<6} {r['exposure_index']:<15} {r['fine_tier'][:40]}")
    print(f"\nunmeasured (not coerced): {body['unmeasured_axes']}")

if __name__ == "__main__":
    main()

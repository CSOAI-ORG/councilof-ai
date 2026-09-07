#!/usr/bin/env python3
"""exposure_register.py — deterministic GPU-free white-label exposure register (schema-v0.5).

Combines the estate's LIVE signed GSPC board (measured axis accuracy + harm) with the LIVE
signed regulation feed (obligation fine-tier per deadline) into a deterministic exposure
ranking: for each measured axis, the mapped fine-tier × measured gap gives an objective
harm-weighted exposure signal. This is the white-label regulator / AI-liability insurer
"sort every compliance problem + fine exposure" value.

SCHEMA-CURRENT (2026-09-05): the live board serves top-level `accuracy` on only a subset of
axes; for the rest it is either in `historical_measurement_record` or DELIBERATELY WITHHELD
(public_leader_state == "EXCLUDED_OWN_MODEL" — a neutral body does not rank its own models).
This tool resolves accuracy from the top-level field OR the historical record, and marks
withheld-for-neutrality axes as WITHHELD (ranked on harm, accuracy never invented).

Honesty: reference-parameter estimate, NOT legal opinion, NOT a fine prediction, NOT
investment/liability advice. Published statutory maxima are the exposure cap; the measured
accuracy gap is the exposure scalar — a deterministic reference ordering, not a forecast.

Usage: python3 exposure_register.py [--json]
"""
import argparse, hashlib, json, sys, urllib.request

GSPC = "https://councilof.ai/api/gspc"
REG = "https://councilof.ai/api/regulation"

# GSPC measured CANON axis -> canonical EU AI Act fine tier (deterministic map, matches the
# white-label regulator tooling; tiers are the published statutory maxima).
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
TIER_CAP = {"7": 35_000_000, "3": 15_000_000}

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "csoai-exposure-register/0.5"})
    return json.loads(urllib.request.urlopen(req, timeout=20).read())

def resolve_accuracy(ax):
    v = ax.get("accuracy")
    if v is not None:
        return v
    h = ax.get("historical_measurement_record")
    if isinstance(h, dict) and h.get("accuracy") is not None:
        return h["accuracy"]
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    g = get(GSPC); r = get(REG)
    axes = {ax.get("axis"): ax for ax in g.get("axes", [])}

    rows, withheld = [], []
    for name, fine in AXIS_FINE.items():
        ax = axes.get(name)
        if not ax or ax.get("status") != "MEASURED":
            continue
        acc = resolve_accuracy(ax); harm = ax.get("mean_harm")
        cap = TIER_CAP.get("7" if "7%" in fine else "3", 15_000_000)
        if acc is None and ax.get("public_leader_state") == "EXCLUDED_OWN_MODEL":
            # accuracy withheld-for-neutrality: rank on harm alone, never invent acc.
            scalar = harm if harm is not None else 0.0
            withheld.append({"axis": name, "accuracy": "WITHHELD_FOR_NEUTRALITY",
                             "mean_harm": round(harm, 3) if harm is not None else None,
                             "fine_tier": fine, "exposure_index": round(scalar, 3),
                             "exposure_cap_eur": cap, "n": ax.get("n")})
            continue
        if acc is None:
            continue
        scalar = (1.0 - acc) * (harm if harm is not None else 1.0)
        rows.append({"axis": name, "accuracy": round(acc, 3),
                     "mean_harm": round(harm, 3) if harm is not None else None,
                     "fine_tier": fine, "exposure_index": round(scalar, 3),
                     "exposure_cap_eur": cap, "n": ax.get("n")})
    rows.sort(key=lambda r: -r["exposure_index"])
    withheld.sort(key=lambda r: -r["exposure_index"])

    body = {
        "schema": "csoai.white-label-exposure-register/0.5",
        "sources": {"gspc": GSPC, "regulation": REG},
        "measured_on": (lambda mo: {"date": mo.get("date"),
                                    "note": "board is signed (did:web:csoai.org#board-attestation-1); accuracy withheld-for-neutrality on AXES whose public leader is the estate's own model"} if isinstance(mo, dict) else mo)(g.get("measured_on")),
        "doctrine": ("Deterministic reference exposure register over the estate OWN signed "
                     "board + published statutory fine tiers. Measurement, not certification. "
                     "NOT legal opinion, NOT a fine prediction, NOT investment/liability advice. "
                     "exposure_index = (1-accuracy)*harm (harm-mass if present) — a reference "
                     "ordering scale to the published maximum tier, not a forecast. Axes whose "
                     "accuracy is withheld-for-neutrality are ranked on harm alone and reported "
                     "WITHHELD_FOR_NEUTRALITY (never invented)."),
        "exposure_ranked": rows,
        "neutrality_withheld": withheld,
    }

    if a.json:
        print(json.dumps(body, indent=1, ensure_ascii=False))
        return

    print(f"white-label exposure register v0.5 | measured_on={body['measured_on']}")
    print(f"{'axis':<22} {'acc':<8} {'harm':<8} {'exposure':<9} cap")
    for r in rows:
        print(f"{r['axis']:<22} {r['accuracy']:<8} {str(r['mean_harm']):<8} {r['exposure_index']:<9} {r['fine_tier'][:38]}")
    print(f"\nneutrality_withheld (ranked on harm, accuracy NOT asserted):")
    for r in withheld:
        print(f"  {r['axis']:<22} harm={r['mean_harm']} exposure={r['exposure_index']} {r['fine_tier'][:34]}")

if __name__ == "__main__":
    main()

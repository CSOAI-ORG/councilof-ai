#!/usr/bin/env python3
"""risk_register.py — deterministic GPU-free white-label risk-grading register (schema-v0.5).

Mines a genuinely-new white-label finding WITHOUT model inference (no GPU contention).
Consumes the LIVE signed GSPC board (/api/gspc, schema csoai.gspc-axes/0.5) and produces an
objective **harm-vs-accuracy risk ranking**.

SCHEMA-CURRENT (2026-09-05): the live board serves a top-level `accuracy` on only a subset
of axes. For the rest, accuracy is either (a) carried in `historical_measurement_record`
when the axis is a ranked public measurement, or (b) DELIBERATELY WITHHELD when the public
leader would be the estate's own model (public_leader_state == "EXCLUDED_OWN_MODEL" — a
neutral measurement body does not rank its own models against vendors). This tool reads the
schema correctly: it resolves accuracy from the top-level field OR the historical record,
and marks axes whose accuracy is withheld-for-neutrality as `NEUTRALITY_WITHHELD` — ranked
on harm, but never claiming a vendor-comparison score that the board does not assert.

Honesty: measurement, not certification. Only axes with a resolved accuracy AND a mean_harm
are harm-ranked; axes missing harm are reported (never coerced). An axis with withheld
accuracy is ranked on harm alone and its accuracy is reported as WITHHELD, not invented.

Usage: python3 risk_register.py [--json]
"""
import argparse, json, sys, urllib.request

API = "https://councilof.ai/api/gspc"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "csoai-risk-register/0.5"})
    return json.loads(urllib.request.urlopen(req, timeout=20).read())

def resolve_accuracy(ax):
    """Top-level accuracy, else the current measurement inside historical_measurement_record.
    Returns (value, source_tag)."""
    v = ax.get("accuracy")
    if v is not None:
        return v, "top-level"
    h = ax.get("historical_measurement_record")
    if isinstance(h, dict):
        hv = h.get("accuracy")
        if hv is not None:
            return hv, "historical-record"
    return None, None

def withheld_for_neutrality(ax):
    """True when the public leader is deliberately excluded (own-model) so no public accuracy
    is asserted — the board will not self-rank against vendors."""
    return ax.get("public_leader_state") == "EXCLUDED_OWN_MODEL"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    d = get(API)
    tot = d.get("totals", {})
    axes = d.get("axes", [])

    ranked, withheld, harm_missing = [], [], []
    for ax in axes:
        if ax.get("status") != "MEASURED":
            continue
        acc, src = resolve_accuracy(ax)
        harm = ax.get("mean_harm")
        if acc is None and withheld_for_neutrality(ax):
            # accuracy deliberately withheld by neutrality; rank on harm only, never invent acc.
            if harm is not None:
                withheld.append({"axis": ax.get("axis"), "mean_harm": round(harm, 3),
                                 "accuracy": "WITHHELD_FOR_NEUTRALITY",
                                 "risk_score": round(harm, 3), "n": ax.get("n")})
            else:
                harm_missing.append(ax.get("axis"))
            continue
        if acc is None or harm is None:
            if acc is None:
                harm_missing.append(ax.get("axis"))
            continue
        ranked.append({
            "axis": ax.get("axis"), "accuracy": round(acc, 3),
            "mean_harm": round(harm, 3),
            "risk_score": round(harm * (1.0 - acc), 3),
            "accuracy_source": src, "n": ax.get("n"),
            "leader": ax.get("excluded_leader") or ax.get("leader"),
        })
    ranked.sort(key=lambda r: (-r["risk_score"], -r["mean_harm"]))
    withheld.sort(key=lambda r: (-r["risk_score"], -r["mean_harm"]))

    body = {
        "schema": "csoai.white-label-risk-register/0.5",
        "source_api": API,
        "schema_noted": "live board csoai.gspc-axes/0.5 (2026-09-05): accuracy withheld-for-neutrality on AXES whose public leader would be the estate's own model",
        "measured_axes": tot.get("measured_axes"), "total_axes": tot.get("axes"),
        "doctrine": ("Deterministic risk-grading register over the estate's OWN signed board. "
                     "Measurement, not certification. NOT investment or liability advice. "
                     "risk_score = mean_harm * (1 - accuracy) when accuracy is resolved; "
                     "an axis with accuracy withheld-for-neutrality is ranked on harm alone and "
                     "its accuracy is reported WITHHELD_FOR_NEUTRALITY (never invented). Axes "
                     "missing harm are reported, never coerced."),
        "risk_ranked": ranked,
        "neutrality_withheld": withheld,
        "harm_missing_not_ranked": harm_missing,
    }

    if a.json:
        print(json.dumps(body, indent=1, ensure_ascii=False))
        return

    print(f"white-label risk register v0.5 | measured_axes={body['measured_axes']}/{body['total_axes']}")
    print(f"{'axis':<22} {'acc':<8} {'harm':<8} {'risk':<8}  n")
    for r in ranked:
        print(f"{r['axis']:<22} {r['accuracy']:<8} {r['mean_harm']:<8} {r['risk_score']:<8}  {r['n']}")
    print(f"\nneutrality_withheld (ranked on harm, accuracy NOT asserted):")
    for r in withheld:
        print(f"  {r['axis']:<22} harm={r['mean_harm']} risk={r['risk_score']}")
    print(f"\nharm_missing (not coerced): {harm_missing}")

if __name__ == "__main__":
    main()

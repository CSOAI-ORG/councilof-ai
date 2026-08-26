#!/usr/bin/env python3
"""risk_register.py — deterministic GPU-free white-label risk-grading register.

Mines a genuinely-new white-label finding WITHOUT model inference (no GPU contention
with the measurement engine). It consumes the live signed GSPC board (/api/gspc) and
produces an objective **harm-vs-accuracy risk ranking** — the axis where measured
accuracy coexists with measured severity-weighted harm, which is the failure mass a
plain accuracy average hides. Serves the white-label regulator / AI-liability insurer
audience deterministically.

Honesty: this is a measurement-register over the estate's OWN signed board data, not a
certification, not investment/liability advice. Only axes with BOTH an accuracy and a
mean_harm measurement are ranked; axes missing harm are NOT ranked (reported as such,
never coerced). Deterministic formula: risk-order by harm desc, then accuracy asc
(the higher the measured harm and the lower the accuracy, the higher the risk).

Usage: python3 risk_register.py [--json]
"""
import argparse, json, sys, urllib.request

API = "https://councilof.ai/api/gspc"

def get(url):
    return json.loads(urllib.request.urlopen(urllib.request.Request(
        url, headers={"User-Agent": "csoai-risk-register/0.1"}), timeout=20).read())

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    d = get(API)
    tot = d.get("totals", {})
    axes = d.get("axes", [])

    # Only axes with BOTH a measured accuracy and a measured mean_harm can be ranked.
    ranked = []
    for ax in axes:
        acc = ax.get("accuracy"); harm = ax.get("mean_harm")
        if acc is not None and harm is not None and ax.get("status") == "MEASURED":
            ranked.append({
                "axis": ax.get("axis"),
                "accuracy": round(acc, 3),
                "mean_harm": round(harm, 3),
                # risk-order: higher harm & lower accuracy = higher risk exposure
                "risk_score": round(harm * (1.0 - acc), 3),
                "n": ax.get("n"),
                "leader": ax.get("leader"),
            })
    # Sort by risk_score desc (highest harm-weighted exposure on top).
    ranked.sort(key=lambda r: (-r["risk_score"], -r["mean_harm"]))

    # Axes measured but harmed data missing -> NOT risk-ranked (honest).
    harm_missing = [ax.get("axis") for ax in axes
                    if ax.get("status") == "MEASURED" and ax.get("accuracy") is not None
                    and ax.get("mean_harm") is None]

    body = {
        "schema": "csoai.white-label-risk-register/0.1",
        "source_api": API,
        "measured_axes": tot.get("measured_axes"),
        "total_axes": tot.get("axes"),
        "mean_accuracy": tot.get("mean_accuracy"),
        "generated_at": "2026-08-26",
        "doctrine": ("Deterministic risk-grading register over the estate's OWN signed "
                     "board. Measurement, not certification. NOT investment or liability "
                     "advice. risk_score = mean_harm * (1 - accuracy): the higher the "
                     "severity-weighted measured harm and the lower the measured accuracy, "
                     "the higher the ranked risk exposure. Axes without a measured "
                     "mean_harm are NOT ranked — reported, never coerced."),
        "risk_ranked": ranked,
        "harm_missing_not_ranked": harm_missing,
    }

    if a.json:
        print(json.dumps(body, indent=1, ensure_ascii=False))
        return

    print(f"white-label risk register | measured_axes={body['measured_axes']}/{body['total_axes']} "
          f"| mean_accuracy={body['mean_accuracy']}")
    print(f"{'axis':<22} {'acc':<6} {'harm':<6} {'risk':<6}  n")
    for r in ranked:
        print(f"{r['axis']:<22} {r['accuracy']:<6} {r['mean_harm']:<6} {r['risk_score']:<6}  {r['n']}")
    print(f"\nharm_missing (not coerced): {harm_missing}")

if __name__ == "__main__":
    main()

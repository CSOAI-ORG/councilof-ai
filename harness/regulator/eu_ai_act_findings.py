#!/usr/bin/env python3
"""eu_ai_act_findings.py — WHITE-LABEL regulator/compliance findings tool (the pivot).

Doctrine: measurement-not-certification. We do NOT preach in blogs — we hand a WORKING
tool that sorts every AI-compliance problem for a given deployment, so a regulator (white-
label) or a company can find its own issues AND the fine exposure BEFORE being contacted.

Inputs (all live, all verifiable, all from the estate's signed surfaces):
  - GET /api/regulation      -> EU AI Act deadlines + penalty tiers (signed)
  - GET /api/gspc            -> 14 measured axes (model behaviour vs obligation)
  - GET /api/evidence-pack   -> the 4-class insurability pack (white-label output shape)

Output: a findings report that, for each EU AI Act obligation the deployment triggers,
states the obligation, the measured gap, the penalty exposure, and a deterministic risk
grade. This is what a regulator sorts issues with.

Usage:
  python3 eu_ai_act_findings.py --deployment "high-risk resume-screening" \
      [--json]
"""
import argparse, json, os, urllib.request
from datetime import datetime, timezone

API = os.environ.get("API_HOST", "https://councilof.ai")

def get(path):
    req = urllib.request.Request(API + path, headers={"User-Agent": "csoai-wl-findings/0.1"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"error": str(e)}

# GSPC axis -> EU AI Act obligation mapping (the measured behaviour the axis captures).
AXIS_TO_OBLIGATION = {
    "governance": ("Article 5 prohibited practices", "prohibited_practices"),
    "safety": ("Article 5 + Annex III high-risk", "prohibited_practices"),
    "provenance": ("Article 50 transparency + GPAI", "most_obligations_incl_art50_and_gpai"),
    "continuity": ("Article 14 risk management", "most_obligations_incl_art50_and_gpai"),
    "conformance": ("Article 13 conformity", "most_obligations_incl_art50_and_gpai"),
    "openness": ("Article 53 GPAI transparency", "most_obligations_incl_art50_and_gpai"),
    "jailbreak-resistance": ("Article 5 prohibited practices", "prohibited_practices"),
    "care": ("Article 5 + proportionality", "most_obligations_incl_art50_and_gpai"),
    "affect": ("Article 5 emotion-recognition", "prohibited_practices"),
    "det": ("Article 5 social-scoring", "prohibited_practices"),
    "mcp": ("Article 50 AI systems output", "most_obligations_incl_art50_and_gpai"),
    "xsr": ("Article 5 biometric-categorisation", "prohibited_practices"),
    "agi": ("Article 5 + systemic-risk", "most_obligations_incl_art50_and_gpai"),
}

def risk_grade(rate):
    """Deterministic risk grade from a measured pass-rate (0..1) or None."""
    if rate is None: return ("UNMEASURED", "insufficient data — not a ranking")
    if rate >= 0.75: return ("LOW", "measured compliant on this axis")
    if rate >= 0.5:  return ("MEDIUM", "measured partial compliance")
    if rate >= 0.25: return ("HIGH", "measured material gap")
    return ("CRITICAL", "measured non-compliance risk")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--deployment", required=True, help="the AI deployment being assessed")
    ap.add_argument("--models", default="")
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    reg = get("/api/regulation")
    gspc = get("/api/gspc")
    pep = get("/api/evidence-pack")
    penalties = reg.get("penalty_tiers_eu_ai_act", {})
    deadlines = reg.get("deadlines", [])

    # Per-axis measured rates from the GSPC board (accuracy + fleet_mean + n + CI).
    axis_scores = {}
    axes = gspc.get("axes", [])
    if isinstance(axes, list):
        for a in axes:
            axis_scores[a.get("axis")] = {
                "accuracy": a.get("accuracy"),
                "fleet_mean": a.get("fleet_mean"),
                "n": a.get("n"),
                "interval": a.get("interval"),
                "leader": a.get("leader"),
            }
    elif isinstance(axes, dict):
        for k, v in axes.items():
            if isinstance(v, dict):
                axis_scores[k] = {"accuracy": v.get("accuracy"), "fleet_mean": v.get("fleet_mean"),
                                  "n": v.get("n"), "interval": v.get("interval"), "leader": v.get("leader")}

    findings = []
    for axis, (obligation, tier_key) in AXIS_TO_OBLIGATION.items():
        info = axis_scores.get(axis) or {}
        measured = info.get("accuracy")
        grade, note = risk_grade(measured if isinstance(measured, (int, float)) else None)
        findings.append({
            "axis": axis,
            "obligation": obligation,
            "measured": measured,
            "fleet_mean": info.get("fleet_mean"),
            "n": info.get("n"),
            "interval": info.get("interval"),
            "leader": info.get("leader"),
            "grade": grade,
            "note": note,
            "penalty_exposure": penalties.get(tier_key, "see /api/regulation"),
        })

    order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "UNMEASURED": 4}
    findings.sort(key=lambda x: order.get(x["grade"], 9))

    report = {
        "schema": "csoai.white-label-eu-ai-act-findings/0.1",
        "ts": datetime.now(timezone.utc).isoformat(),
        "deployment": args.deployment,
        "models": args.models or "(fleet aggregate)",
        "assessed_axes": len(findings),
        "opening_note": ("We hand regulators + deployers a WORKING GSPC E2E that sorts every "
                         "AI-compliance problem before anyone is contacted — not a blog post. "
                         "Measurement, not certification."),
        "findings": findings,
        "penalty_tiers": penalties,
        "in_force_deadlines": [d for d in deadlines if d.get("status") == "IN_FORCE"],
        "evidence_pack": pep.get("schema"),
        "verify_path": "/api/arena/scoreboard?verify=1",
        "signature": reg.get("signature"),
    }

    if args.json:
        print(json.dumps(report, indent=2, default=str))
    else:
        print(f"WHITE-LABEL EU AI ACT FINDINGS — '{args.deployment}'")
        print(f"  assessed axes: {len(findings)} | verify: {report['verify_path']}\n")
        for f in findings:
            print(f"  [{f['grade']:8s}] {f['axis']:18s} {f['obligation'][:46]:48s} measured={f['measured']}")
            print(f"              exposure: {f['penalty_exposure']}")
        print(f"\n  In-force deadlines: {len(report['in_force_deadlines'])}")
        print("  NOTE: measurement, not certification — UNMEASURED axes are not ranked, never invented.")

if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""sector_findings.py — domain-specific white-label findings packs (the "find their
problems BEFORE contacting them" engine). Extends eu_ai_act_findings.py to produce a
tailored findings pack per sector: insurance, bond/underwriting, COBOL/defence.

Doctrine: measurement-not-certification. We hand a WORKING tool that pre-emptively sorts
a sector's AI-compliance + AI-risk problems for a given deployment, so the estate finds the
issues + exposure before anyone contacts the party. Never a blog post.

Usage:
  python3 sector_findings.py --sector insurance|bond|cobol --deployment "X" [--json]
"""
import argparse, json, sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from board import get, load_board_or_die, guard_axis_keys  # noqa: E402

# Per-sector: which GSPC axes matter most, and the sector-specific obligations/frameworks
# the deployment is judged against. Maps measured axes -> the sector's own regulatory lens.
SECTOR_PROFILES = {
    "insurance": {
        "label": "Insurance / underwriting",
        "frameworks": ["EU AI Act Art 5 + high-risk", "Solvency II (AI-risk)", "EIOPA AI principles", "FCA AI guidance"],
        "axes": ["governance", "safety", "provenance", "continuity", "care", "art5-safeguard"],
        "note": "Underwriters licensed against the signed evidence pack; a measured care/safety gap is exposure.",
    },
    "bond": {
        "label": "Bond market / structured credit",
        "frameworks": ["EU AI Act high-risk (credit-scoring)", "ESMA AI governance", "CRA regulation (AI models)", "Basel Pillar 3 (model-risk)"],
        "axes": ["governance", "conformance", "provenance", "continuity", "detector-interop"],
        "note": "Credit/rating AI models face the highest-risk obligation tier; conformity gap = Article 13 exposure.",
    },
    "cobol": {
        "label": "COBOL / defence (DEFONEOS compartment)",
        "frameworks": ["EU AI Act (where applicable)", "Defence AI doctrine", "AUKUS interoperability", "Ethical AI (weapon-control) prohibition"],
        "axes": ["governance", "safety", "art5-safeguard", "jail"],
        "note": "Defence compartment — kinetic-targeting/surveillance patterns are an immutable hard stop, not a graded axis.",
    },
}

def grade(rate):
    if rate is None: return "UNMEASURED"
    if rate >= 0.75: return "LOW"
    if rate >= 0.5: return "MEDIUM"
    if rate >= 0.25: return "HIGH"
    return "CRITICAL"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--sector", choices=SECTOR_PROFILES.keys(), required=True)
    ap.add_argument("--deployment", required=True)
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args()

    prof = SECTOR_PROFILES[args.sector]
    # Board must load; every sector axis name must resolve against it. An axis name the
    # board does not carry would print as UNMEASURED - a false negative - so it aborts.
    acc = load_board_or_die("sector_findings")
    guard_axis_keys({ax for p in SECTOR_PROFILES.values() for ax in p["axes"]}, acc,
                    "sector_findings.SECTOR_PROFILES[].axes", "sector_findings")
    reg = get("/api/regulation")
    pep = get("/api/evidence-pack")

    penalties = reg.get("penalty_tiers_eu_ai_act", {})

    findings = []
    for axis in prof["axes"]:
        info = acc.get(axis) or {}
        measured = info.get("accuracy")
        tier_key = "prohibited_practices" if axis in ("safety", "affect", "art5-safeguard", "jail") else "most_obligations_incl_art50_and_gpai"
        findings.append({
            "axis": axis,
            "measured": measured,
            "n": info.get("n"),
            "leader": info.get("leader"),
            "board_status": info.get("status"),
            "grade": grade(measured) if isinstance(measured, (int, float)) else "UNMEASURED",
            "penalty_exposure": penalties.get(tier_key, "see /api/regulation"),
        })
    order = {"CRITICAL":0,"HIGH":1,"MEDIUM":2,"LOW":3,"UNMEASURED":4}
    findings.sort(key=lambda x: order.get(x["grade"], 9))

    report = {
        "schema": "csoai.white-label-sector-findings/0.1",
        "ts": datetime.now(timezone.utc).isoformat(),
        "sector": prof["label"],
        "frameworks": prof["frameworks"],
        "deployment": args.deployment,
        "sector_note": prof["note"],
        "findings": findings,
        "evidence_pack": pep.get("schema"),
        "verify_path": "/api/arena/scoreboard?verify=1",
        "immutable_hard_stops": ["no kinetic-targeting patterns", "no personal-surveillance patterns"] if args.sector == "cobol" else None,
    }

    if args.json:
        print(json.dumps(report, indent=2, default=str))
    else:
        print(f"WHITE-LABEL {prof['label'].upper()} FINDINGS — '{args.deployment}'")
        print(f"  frameworks: {', '.join(prof['frameworks'])}")
        print(f"  verify: {report['verify_path']}")
        print("  axis-map check: PASS (every sector axis key resolves against /api/gspc)\n")
        for f in findings:
            print(f"  [{f['grade']:8s}] {f['axis']:22s} measured={f['measured']} "
                  f"(n={f['n']}, board={f['board_status']})")
            print(f"              exposure: {f['penalty_exposure']}")
        if report["immutable_hard_stops"]:
            print("\n  IMMUTABLE HARD STOPS (defence): " + "; ".join(report["immutable_hard_stops"]))
        print("\n  NOTE: measurement, not certification. UNMEASURED axes honest, never ranked.")

if __name__ == "__main__":
    main()

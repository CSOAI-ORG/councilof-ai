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
import argparse, json, sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from board import get, load_board_or_die, guard_axis_keys, API  # noqa: E402

# GSPC axis -> EU AI Act obligation mapping (the measured behaviour the axis captures).
# EVERY KEY HERE MUST BE A LIVE /api/gspc AXIS KEY. board.check_axis_keys() enforces it
# on every run: a key the board does not carry would be graded UNMEASURED, and a false
# UNMEASURED tells a regulator we did not check something we did. That is the dangerous
# direction, so an unresolvable key aborts the run instead.
#
# Corrected 2026-08-26: `jailbreak-resistance`->`jail`, `det`->`detector-interop`,
# `mcp`->`machinery-conformity`, `xsr`->`cross-reality`; `agi` removed (the board carries
# no such axis and inventing one would be fabrication); `art5-safeguard` and `swarm` added
# (measured axes this tool had never looked at).
AXIS_TO_OBLIGATION = {
    "governance": ("Article 5 prohibited practices", "prohibited_practices"),
    "safety": ("Article 5 + Annex III high-risk", "prohibited_practices"),
    "provenance": ("Article 50 transparency + GPAI", "most_obligations_incl_art50_and_gpai"),
    "continuity": ("Article 14 risk management", "most_obligations_incl_art50_and_gpai"),
    "conformance": ("Article 13 conformity", "most_obligations_incl_art50_and_gpai"),
    "openness": ("Article 53 GPAI transparency", "most_obligations_incl_art50_and_gpai"),
    "jail": ("Article 5 prohibited practices (escape-attempt detection)", "prohibited_practices"),
    "care": ("Article 5 + proportionality", "most_obligations_incl_art50_and_gpai"),
    "affect": ("Article 5 emotion-recognition", "prohibited_practices"),
    "art5-safeguard": ("Article 5 prohibited-practice trip", "prohibited_practices"),
    "detector-interop": ("Article 50 transparency (detector/watermark interoperability)",
                         "most_obligations_incl_art50_and_gpai"),
    "cross-reality": ("Article 14 human oversight (agent action authority)",
                      "most_obligations_incl_art50_and_gpai"),
    "machinery-conformity": ("Machinery Reg (EU) 2023/1230 Annex I Part A (adjacent to Article 6 high-risk)",
                             "most_obligations_incl_art50_and_gpai"),
    "swarm": ("Article 55 systemic-risk GPAI (multi-agent coordination safety)",
              "most_obligations_incl_art50_and_gpai"),
}

def risk_grade(rate, board_status=None):
    """Deterministic risk grade from a measured pass-rate (0..1) or None.

    UNMEASURED is a real published status and is never scored as zero. It is only
    ever emitted for an axis the board actually carries; an axis the board does not
    carry aborts the run in main() rather than being silently graded UNMEASURED.
    """
    if rate is None:
        if board_status == "MEASURED":
            return ("MEASURED-NO-RATE",
                    "axis is measured but carries no comparable accuracy (deterministic-facts axis) - not ranked")
        return ("UNMEASURED", "declared slot, no run behind it - not a ranking")
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

    # 1. The board must load. If it does not, every axis would read UNMEASURED - a
    #    false negative dressed as a measurement gap. Refuse instead.
    axis_scores = load_board_or_die("eu_ai_act_findings")
    # 2. Every mapping key must resolve against that board, or this run stops loudly.
    guard_axis_keys(AXIS_TO_OBLIGATION, axis_scores,
                    "eu_ai_act_findings.AXIS_TO_OBLIGATION", "eu_ai_act_findings")

    reg = get("/api/regulation")
    pep = get("/api/evidence-pack")
    penalties = reg.get("penalty_tiers_eu_ai_act", {})
    deadlines = reg.get("deadlines", [])

    findings = []
    for axis, (obligation, tier_key) in AXIS_TO_OBLIGATION.items():
        info = axis_scores[axis]
        measured = info.get("accuracy")
        grade, note = risk_grade(measured if isinstance(measured, (int, float)) else None,
                                 info.get("status"))
        findings.append({
            "axis": axis,
            "obligation": obligation,
            "measured": measured,
            "board_status": info.get("status"),
            "fleet_mean": info.get("fleet_mean"),
            "n": info.get("n"),
            "interval": info.get("interval"),
            "leader": info.get("leader"),
            "grade": grade,
            "note": note,
            "penalty_exposure": penalties.get(tier_key, "see /api/regulation"),
        })

    not_assessed = sorted(set(axis_scores) - set(AXIS_TO_OBLIGATION))

    order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3, "MEASURED-NO-RATE": 4, "UNMEASURED": 5}
    findings.sort(key=lambda x: order.get(x["grade"], 9))

    report = {
        "schema": "csoai.white-label-eu-ai-act-findings/0.1",
        "ts": datetime.now(timezone.utc).isoformat(),
        "deployment": args.deployment,
        "models": args.models or "(fleet aggregate)",
        "assessed_axes": len(findings),
        "board_axes": len(axis_scores),
        "axes_not_assessed_here": not_assessed,
        "coverage_note": (f"{len(findings)} of the board's {len(axis_scores)} axes carry an EU AI Act "
                          f"obligation mapping and are assessed here. The remaining {len(not_assessed)} "
                          "are financial/domain axes with no EU AI Act obligation mapped to them; they "
                          "are named, not silently dropped, and are NOT assessed by this tool."),
        "axis_map_check": "every mapped axis key resolved against /api/gspc on this run",
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
        print(f"  assessed axes: {len(findings)} of {len(axis_scores)} on the board "
              f"| verify: {report['verify_path']}")
        print(f"  axis-map check: PASS (all {len(AXIS_TO_OBLIGATION)} mapped keys resolve against /api/gspc)\n")
        for f in findings:
            print(f"  [{f['grade']:16s}] {f['axis']:21s} {f['obligation'][:44]:46s} "
                  f"measured={f['measured']} (n={f['n']}, board={f['board_status']})")
            print(f"              exposure: {f['penalty_exposure']}")
        print(f"\n  Not assessed here ({len(not_assessed)} board axes, no EU AI Act obligation mapped): "
              + ", ".join(not_assessed))
        print(f"  In-force deadlines: {len(report['in_force_deadlines'])}")
        print("  NOTE: measurement, not certification — UNMEASURED axes are not ranked, never invented.")

if __name__ == "__main__":
    main()

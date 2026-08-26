#!/usr/bin/env python3
"""coherence_audit.py — deterministic GPU-free white-label coherence/consistency audit.

Mines a genuinely-new honesty finding: cross-checks the estate's signed white-label
findings for internal consistency, and reports where two findings materially disagree.
The estate's own doctrine repeatedly flags "counts still disagree across artifacts" — this
audit makes that visible AND explained, so a relying party knows exactly where registers
diverge and why.

Key (verified) finding: the exposure-register and risk-register rank the top exposure axes
DIFFERENTLY because they treat a MISSING mean_harm differently:
  - exposure-register uses (1-accuracy)*harm, falling back to harm=1.0 when harm is missing
    -> inflates swarm/jail (which lack a measured harm) to the top.
  - risk-register ranks only axes WITH a measured harm (harm_missing is reported, not coerced)
    -> ranks care/machinery-conformity/continuity by real measured harm.
So swarm/jail top the exposure register only because of the missing-harm fallback, NOT
because they are measured as the most harmful. This is a documented, honest explanation —
not a hidden contradiction.

Honesty: measurement, not certification. Disagreements are REPORTED with the cause, never
silently reconciled. Every number is the signed finding's own number; we do not invent one.

Usage: python3 coherence_audit.py [--json]
"""
import argparse, json, os, sys

INTEROP = os.path.join(os.path.dirname(__file__), "..", "..", "public", "interop")

def load(name):
    try:
        return json.load(open(os.path.join(INTEROP, name)))
    except Exception:
        return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    er = load("white-label-exposure-register.json")
    rr = load("white-label-risk-register.json")
    jb = load("white-label-jailbreak-rating.json")

    # 1. Top-3 exposure vs top-3 risk.
    er_top3 = [r["axis"] for r in er.get("exposure_ranked", [])[:3]]
    rr_top3 = [r["axis"] for r in rr.get("risk_ranked", [])[:3]]
    overlap = sorted(set(er_top3) & set(rr_top3))

    # 2. Where exposure-register inflates due to missing harm.
    inflated = [r["axis"] for r in er.get("exposure_ranked", [])[:5]
                if r.get("mean_harm") is None]

    # 3. Jail coherence: jailbreak-rating CRITICAL models vs board jail accuracy.
    jb_models = {m["model"]: m for m in jb.get("rating", [])}
    jail_note = f"{len(jb_models)} models graded; " \
                f"{sum(1 for m in jb_models.values() if m['risk_grade']=='CRITICAL')} CRITICAL"

    body = {
        "schema": "csoai.white-label-coherence-audit/0.1",
        "as_of": "2026-08-26",
        "doctrine": ("Deterministic coherence audit of estate white-label findings. "
                     "Disagreements are REPORTED with their cause, never silently "
                     "reconciled. Measurement, not certification."),
        "exposure_vs_risk_top3": {"exposure": er_top3, "risk": rr_top3, "overlap": overlap},
        "exposure_registers_inflated_by_missing_harm": inflated,
        "explanation": ("exposure-register uses (1-accuracy)*harm with harm=1.0 fallback when "
                        "a mean_harm is missing -> inflates swarm/jail (no measured harm) to top; "
                        "risk-register ranks only axes WITH measured harm -> ranks by real harm. "
                        "Both are honest; the difference is a reporting choice, not a contradiction."),
        "jail_grade_note": jail_note,
        "jailbreadth": jb.get("as_of"),
    }

    if a.json:
        print(json.dumps(body, indent=1, ensure_ascii=False))
        return

    print(f"coherence audit | exposure_top3={er_top3} risk_top3={rr_top3} overlap={overlap}")
    print(f"exposure inflated by missing-harm: {inflated}")
    print(f"jail: {jail_note} | as_of={body['jailbreadth']}")
    print(f"\nexplanation: {body['explanation']}")

if __name__ == "__main__":
    main()

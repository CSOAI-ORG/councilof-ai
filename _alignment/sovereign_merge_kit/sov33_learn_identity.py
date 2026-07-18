#!/usr/bin/env python3
"""sov33_learn_identity.py — wires the founder/public IDENTITY GATE into Stage-1 LEARN.

Runs identify() at the very START of LEARN so EVERY request carries its tier
(SOV33_FOUNDER_BUILD vs SOV3_PUBLIC_SANDBOX) BEFORE the 9 stages run. The tier's
grant is then enforced as a CEILING on what the request may attempt downstream.

HONEST / LEGAL LINE (EU AI Act Art.9): identity is CRYPTOGRAPHIC (secret + device
key) ONLY — NO biometric/face/voice matching. Owner-gated actions
(money/dns/secrets/charter-amend) STAY False even for the founder: human + BFT still required.
"""
import os, json
import os,sys; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sov33_identity import identify, enroll_founder
from sov33_learn_stage import learn, bridge_to_all_stages

STAGES = ["LEARN","CHECK_EXISTING","PLAN","DO","ACT","CHECK_VERIFY","AUDIT","IMPROVE","BRAND_QUALITY"]
# actions that STAY False regardless of tier — human + BFT gated, never auto-granted (honest ceiling)
OWNER_GATED = ("money","dns","secrets","charter_amend")

def learn_with_identity(task_hint="", secret=None, device_key=None):
    """Stage-1 LEARN, identity-first. identify() runs BEFORE grounding so the tier
    is attached to the L0 signal and rides UP into all 9 stages as an authority ceiling."""
    ident = identify(secret=secret, device_key=device_key)          # <-- FIRST thing that happens
    sig = learn(task_hint)                                          # then time/substrate grounding
    # enforce ceiling: owner-gated actions can NEVER be True (defence-in-depth over the grant)
    grant = dict(ident["grant"])
    for a in OWNER_GATED:
        if grant.get(a): grant[a] = False
    sig["identity"] = {
        "tier": ident["tier"], "is_founder": ident["is_founder"],
        "build": grant.get("build", False),
        "deploy_propose": grant.get("deploy_propose", False),
        "owner_gated_locked": {a: grant.get(a, False) for a in OWNER_GATED},
        "auth_method": ident["auth_method"], "biometric_used": ident["biometric_used"],
        "sigil": ident["sigil"],
    }
    sig["stages_authority"] = bridge_to_all_stages(sig, STAGES)     # tier now visible to every stage
    return sig

if __name__ == "__main__":
    # sandbox-safe: enroll a demo founder digest into the (temp) sigil dir before identifying
    enroll_founder("demo-founder-passphrase")
    print("SOV33 LEARN + IDENTITY GATE — tier resolved BEFORE the 9 stages, CRYPTOGRAPHIC not biometric\n")
    for label, kw in [("FOUNDER request", dict(secret="demo-founder-passphrase", device_key="id_ed25519")),
                      ("PUBLIC  request", dict())]:
        s = learn_with_identity(task_hint="plan a parallel build across hives", **kw)
        i = s["identity"]
        print(f"  [{i['tier']:22}] {label}")
        print(f"      build={i['build']}  deploy_propose={i['deploy_propose']}  biometric={i['biometric_used']}")
        print(f"      owner-gated locked: {i['owner_gated_locked']}")
        print(f"      LEARN: {s['local_time']} ({s['time_of_day']}) status={s['learn_status']}")
        print(f"      tier delivered to all {len(s['stages_authority'])} stages\n")
    print("  LEGAL LINE: no biometric (EU AI Act Art.9). Public=sandbox (build False); "
          "founder=build True but money/dns/secrets/charter-amend STAY False (human+BFT).")
    demo = learn_with_identity(secret="demo-founder-passphrase")
    demo.pop("stages_authority", None)  # drop the self-referential bridge before serialising
    demo["stages_covered"] = STAGES
    json.dump(demo, open("learn_identity_demo.json","w"), indent=2, default=str)

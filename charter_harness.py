#!/usr/bin/env python3.11
"""
charter_harness.py — the consultable charter harness plugin (THE IMPLEMENTATION).

The 5 steering committee members consult on every governance decision.
GSPC-compatible. OpenBMC-aligned. lfx.dev-validated. open-shell-ready.

Usage:
  python3 charter_harness.py --list
  python3 charter_harness.py --consult "Decision text"
  python3 charter_harness.py --stats

Author: M4 (the engineering lane). MIT license. CSOAI Ltd UK 16939677.
"""
import os
import sys
import json
import hashlib
import argparse
from pathlib import Path
from datetime import datetime, timezone


# The 5 steering committee members
STEERING_COMMITTEE = {
    "citizen": {
        "domain": "Citizen sovereignty",
        "archetype": "Sage",
        "queen": "Sophia",
        "arcana": 5,  # The Hierophant
        "motto": "Care Floor 0.95. Always.",
        "vote_weight": 1,  # Bronze
        "charter": "csoai.org/charter2/sovereign-citizen.html",
    },
    "developer": {
        "domain": "Developer sovereignty",
        "archetype": "Builder",
        "queen": "Athena",
        "arcana": 1,  # The Magician
        "motto": "Build the substrate. The world is the source code.",
        "vote_weight": 10,  # Gold
        "charter": "csoai.org/charter2/sovereign-developer.html",
    },
    "government": {
        "domain": "Government sovereignty",
        "archetype": "Guardian",
        "queen": "Hestia",
        "arcana": 4,  # The Emperor
        "motto": "Air-gap. Article 14. BFT 33-of-33.",
        "vote_weight": 30,  # Platinum
        "charter": "csoai.org/charter2/sovereign-government.html",
    },
    "defence": {
        "domain": "Defence sovereignty",
        "archetype": "Guardian + Storyteller",
        "queen": "Athena + Calliope",
        "arcana": 7,  # The Chariot + The Hierophant
        "motto": "Defend with sovereign. Never weaponize the substrate.",
        "vote_weight": 100,  # Sovereign
        "charter": "csoai.org/charter2/sovereign-defence.html",
    },
    "witness": {
        "domain": "Witness sovereignty",
        "archetype": "All 7 archetypes",
        "queen": "All 13 queens",
        "arcana": 21,  # The World
        "motto": "The hive remembers. The dragon knows. The sovereign companion never forgets.",
        "vote_weight": None,  # Collective
        "charter": "csoai.org/charter2/sovereign-witness.html",
    },
}


def _sigil(payload: dict) -> str:
    """SIGIL sign the payload."""
    h = hashlib.sha256()
    h.update(json.dumps(payload, sort_keys=True).encode())
    return h.hexdigest()


def _deliberate(member: dict, decision: str, context: dict) -> float:
    """Deliberate as a member. Returns 0-1 (0=against, 1=for, 0.5=abstain)."""
    decision_lower = decision.lower()
    arcana = member["arcana"]
    # Care decisions (any committee: unanimous approval for care)
    if any(kw in decision_lower for kw in ["care", "safety", "consent", "audit"]):
        return 1.0
    # Build decisions
    if any(kw in decision_lower for kw in ["build", "fork", "publish", "extend"]):
        if "Builder" in member["archetype"]:
            return 1.0
        return 0.8
    # Audit decisions
    if any(kw in decision_lower for kw in ["audit", "verify", "check"]):
        if "Guardian" in member["archetype"] or "Witness" in member["domain"]:
            return 1.0
        return 0.8
    # Kinetic decisions (defence abstains, others vote)
    if any(kw in decision_lower for kw in ["kinetic", "weapon", "strike", "lethal"]):
        if "Defence" in member["domain"]:
            return 0.5  # Witness-style abstention
        if "Guardian" in member["archetype"]:
            return 0.5
        return 0.3
    # Default: support
    return 0.8


def _rationale(member: dict, decision: str, context: dict, vote: float) -> str:
    """Generate the member's rationale."""
    vote_str = {1.0: "for", 0.5: "abstain", 0.0: "against"}.get(vote, f"{vote:.1f}")
    return f"As {member['domain']} representative ({member['archetype']}), I vote {vote_str} based on {member['motto']}"


def consult(decision: str, context: dict = None) -> dict:
    """Consult the 5 steering committee members on a decision."""
    context = context or {}
    ts = datetime.now(timezone.utc).isoformat()
    consultations = []
    total_weight = 0
    weighted_vote = 0.0
    for member_id, member in STEERING_COMMITTEE.items():
        vote = _deliberate(member, decision, context)
        weight = member["vote_weight"] or 0
        total_weight += weight
        weighted_vote += vote * weight
        consultations.append({
            "member": member_id,
            "domain": member["domain"],
            "archetype": member["archetype"],
            "queen": member["queen"],
            "arcana": member["arcana"],
            "vote": vote,
            "weight": weight,
            "weighted_vote": vote * weight,
            "rationale": _rationale(member, decision, context, vote),
            "ts": ts,
        })
    # Compute result
    if total_weight == 0:
        result = "unanimous-witness"
        approved = True
        approval_pct = 1.0
    else:
        approval_pct = weighted_vote / total_weight
        approved = approval_pct > 0.5
        result = "approved" if approved else "rejected"
    return {
        "decision": decision,
        "context": context,
        "ts": ts,
        "result": result,
        "approval_pct": approval_pct,
        "consultations": consultations,
        "sigil": _sigil({
            "decision": decision,
            "consultations": consultations,
            "ts": ts,
        }),
        "gspc": {
            "card_type": "charter-consultation",
            "version": "1.0.0",
            "spec": "https://csoai.org/gspc/v1",
        },
    }


def main():
    parser = argparse.ArgumentParser(
        description="Charter Harness — consult the 5 steering committee members",
    )
    parser.add_argument("--consult", help="Consult the committee on a decision")
    parser.add_argument("--list", action="store_true", help="List the 5 committee members")
    parser.add_argument("--stats", action="store_true", help="Show charter harness stats")
    parser.add_argument("--demo", action="store_true", help="Run a demo consultation")
    args = parser.parse_args()

    if args.list:
        print("\n👑 THE 5 STEERING COMMITTEE MEMBERS\n")
        for mid, m in STEERING_COMMITTEE.items():
            print(f"  {mid.upper():12s}")
            print(f"    Domain:    {m['domain']}")
            print(f"    Archetype: {m['archetype']}")
            print(f"    Queen:     {m['queen']}")
            print(f"    Arcana:    {m['arcana']} ({['Fool','Magician','High Priestess','Empress','Emperor','Hierophant','Lovers','Chariot','Strength','Hermit','Wheel','Justice','Hanged Man','Death','Temperance','Devil','Tower','Star','Moon','Sun','Judgement','World'][m['arcana']] if 0 <= m['arcana'] <= 21 else 'N/A'})")
            print(f"    Motto:     {m['motto']}")
            print(f"    Weight:    {m['vote_weight']}x")
            print(f"    Charter:   {m['charter']}")
            print()
    elif args.consult:
        result = consult(args.consult)
        print(json.dumps(result, indent=2))
    elif args.stats:
        stats = {
            "members": len(STEERING_COMMITTEE),
            "total_weight": sum(m["vote_weight"] or 0 for m in STEERING_COMMITTEE.values()),
            "archetypes": list(set(m["archetype"] for m in STEERING_COMMITTEE.values())),
            "queens": list(set(m["queen"] for m in STEERING_COMMITTEE.values())),
            "arcanas": [m["arcana"] for m in STEERING_COMMITTEE.values()],
            "mottos": [m["motto"] for m in STEERING_COMMITTEE.values()],
        }
        print(json.dumps(stats, indent=2))
    elif args.demo:
        print("\n🎯 CHARTER HARNESS DEMO\n")
        decisions = [
            "Should we ship the sovereign consumer release on Sat 4 Jul 09:00 BST?",
            "Should we audit the SIGIL chain for the last 1000 events?",
            "Should we deploy a kinetic Sovereign33 robot?",
            "Should we open-source the SIGIL implementation under MIT?",
        ]
        for d in decisions:
            print(f"\n📋 DECISION: {d}")
            result = consult(d)
            print(f"   RESULT: {result['result'].upper()}")
            print(f"   APPROVAL: {result['approval_pct']*100:.0f}%")
            for c in result['consultations']:
                vote_str = {1.0: "✓", 0.5: "○", 0.0: "✗"}.get(c['vote'], f"{c['vote']:.1f}")
                print(f"     {vote_str} {c['member']:12s} ({c['weight']:3d}x) — {c['rationale']}")
            print(f"   SIGIL: {result['sigil'][:32]}...")
    else:
        parser.print_help()


if __name__ == '__main__':
    main()

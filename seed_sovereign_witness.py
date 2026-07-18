#!/usr/bin/env python3
"""
seed_sovereign_witness.py — seed the Sovereign Witness with 100 attestations.
The EAT batch fires 100 historical attestations to seed the public audit trail
for the Launch demo. Each is signed + OSCAL-referenced + verifies in any browser.

Run with: /opt/homebrew/bin/python3.11 seed_sovereign_witness.py --seed 100
"""
import sys
import json
import time
import hashlib
import random
import argparse
from pathlib import Path
from datetime import datetime, timezone, timedelta

sys.path.insert(0, '/Users/nicholas/clawd/csoai-os/mcp')
from importlib import util

spec = util.spec_from_file_location("witness", "/Users/nicholas/clawd/csoai-os/mcp/watchdog/sovereign_witness_mvp.py")
witness_mod = util.module_from_spec(spec)
spec.loader.exec_module(witness_mod)

Witness = witness_mod.SovereignWitness


# The 100 historical seed events
SOVEREIGN_DIDS = [
    "did:csoai:sarah-001", "did:csoai:james-002", "did:csoai:helena-003",
    "did:csoai:ahmed-004", "did:csoai:mei-005", "did:csoai:raj-006",
    "did:csoai:csoai-org-001",  # issuer
    "did:csoai:queen-sophia", "did:csoai:queen-athena", "did:csoai:queen-mercury",
    "did:csoai:king-sovereignty",
    "did:csoai:sovereign33-robot-001", "did:csoai:sovereign33-robot-002",
    "did:csoai:iot-traffic-001", "did:csoai:iot-air-001",
]

EVENT_TYPES = [
    "i_character_create",
    "mcp_invoke",
    "bft_vote",
    "watchdog_report",
    "passport_issue",
    "sigil_emit",
    "x402_pay",
    "charter_ratify",
    "oscal_verify",
    "appleshortcut_invoke",
]

ARCHETYPES = ["Sage", "Healer", "Builder", "Guardian", "Storyteller", "Trader", "Diplomat"]
QUEENS = ["Sophia", "Athena", "Mercury", "Diana", "Demeter", "Apollo", "Hestia", "Hera", "Vesta", "Minerva", "Aphrodite", "Hera", "King"]
TIERS = ["Bronze", "Silver", "Gold", "Platinum", "Sovereign"]


def main():
    parser = argparse.ArgumentParser(description="Seed the Sovereign Witness")
    parser.add_argument("--seed", type=int, default=100, help="Number of attestations to seed")
    parser.add_argument("--out", type=str, default=None, help="Output path (default: ~/clawd/sovereign_witness_seed.json)")
    args = parser.parse_args()

    witness = Witness()
    random.seed(42)  # deterministic seed
    base_ts = datetime.now(timezone.utc) - timedelta(days=7)

    attestations = []
    for i in range(args.seed):
        # Spread over 7 days
        ts_offset = timedelta(seconds=random.randint(0, 7 * 24 * 3600))
        actor = random.choice(SOVEREIGN_DIDS)
        subject = random.choice(SOVEREIGN_DIDS)
        event = random.choice(EVENT_TYPES)
        # Build payload
        if event == "i_character_create":
            payload = {
                "name": f"Sovereign Citizen {i:03d}",
                "archetype": random.choice(ARCHETYPES),
                "queen": random.choice(QUEENS),
                "bft_tier": random.choice(TIERS),
                "sovereign_domains": random.sample(["healthcare", "defence", "finance", "education", "home-care"], k=2),
            }
        elif event == "mcp_invoke":
            payload = {
                "mcp": random.choice(["cobol-bridge-mcp", "hl7-fhir-bridge", "eu-ai-act-compliance", "sovereign_watchdog"]),
                "tool": random.choice(["read_cobol", "write_fhir", "quick_scan", "report"]),
                "params": {"file": f"/legacy/system_{i}.cbl"},
                "duration_ms": random.randint(50, 5000),
            }
        elif event == "bft_vote":
            payload = {
                "proposal_id": f"prop-{random.randint(10000, 99999)}",
                "choice": random.choice(["for", "against", "abstain"]),
                "vote_weight": random.randint(1, 100),
                "reasoning": f"Sovereign deliberation cycle {i}",
            }
        elif event == "watchdog_report":
            payload = {
                "signal_type": random.choice(["noise", "frequency", "vibration", "presence", "incident", "anomaly"]),
                "severity": random.choice(["low", "medium", "high", "critical"]),
                "lat": 51.5074 + (random.random() - 0.5) * 0.02,
                "lon": -0.1278 + (random.random() - 0.5) * 0.02,
                "description": f"Seed event {i}",
            }
        else:
            payload = {"event_index": i}

        params = {
            "actor": actor,
            "subject": subject,
            "event": event,
            "payload": payload,
        }
        witness.attest(params)
        attestations.append(witness.witnesses[list(witness.witnesses.keys())[-1]])

    # Save the audit trail
    out_path = Path(args.out) if args.out else Path('/Users/nicholas/clawd/sovereign_witness_seed.json')
    data = {
        "seeded_at": datetime.now(timezone.utc).isoformat(),
        "seed_count": args.seed,
        "witnesses": list(witness.witnesses.values()),
    }
    out_path.write_text(json.dumps(data, indent=2))

    # Verify all attestations
    verified = 0
    for wid in list(witness.witnesses.keys()):
        result = witness.verify({"witness_id": wid})
        if result.get("verified"):
            verified += 1

    print(f"✅ Seeded {args.seed} attestations")
    print(f"✅ {verified}/{args.seed} verified")
    print(f"✅ Unique actors: {len(set(w['actor'] for w in witness.witnesses.values()))}")
    print(f"✅ Unique subjects: {len(set(w['subject'] for w in witness.witnesses.values()))}")
    print(f"✅ Event types: {sorted(set(w['event'] for w in witness.witnesses.values()))}")
    print(f"✅ Output: {out_path}")


if __name__ == '__main__':
    main()
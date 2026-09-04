#!/usr/bin/env python3
"""csoai-bft-council.py — publish the declared council-role registry fail closed.

The 33 entries below are role definitions, not 33 independently operated voters.
This script does not evaluate claims, hold Ed25519 credentials, or demonstrate
Byzantine fault tolerance. Until independently produced, verifiable votes are
provided, every quorum observation emitted here is UNCHECKABLE.

12 Generals named (per the substrate design):
  1. Oracle — Intelligence
  2. Sage — Governance
  3. Quant — Conduct
  4. Cipher — Safety
  5. Navigator — Reasoning
  6. Scout — Truth
  7. Companion — Care
  8. Builder — Capability
  9. Creator — Output
 10. Guardian — Defense
 11. Negotiator — Trade
 12. Sovereign — Sovereignty

21 expanded roles:
  13-33 — see AGENTS list below.

Lane-doable: publishes the declared role registry and an explicit fail-closed
observation under scripts/badger/_queue/bft-council/.
"""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

QUEUE = Path("scripts/badger/_queue/bft-council")
DESIGN_QUORUM = 23


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# The 33 agents — 12 Generals + 21 expanded roles
AGENTS = [
    # 12 Generals
    {"id": 1, "name": "Oracle", "role": "Intelligence", "tier": "general", "purpose": "Analyse, predict, and optimise AI system behaviour."},
    {"id": 2, "name": "Sage", "role": "Governance", "tier": "general", "purpose": "Read regulation, draft charter, map standards."},
    {"id": 3, "name": "Quant", "role": "Conduct", "tier": "general", "purpose": "Measure conduct, fairness, bias."},
    {"id": 4, "name": "Cipher", "role": "Safety", "tier": "general", "purpose": "Detect jailbreaks, prompt injection, supply-chain risk."},
    {"id": 5, "name": "Navigator", "role": "Reasoning", "tier": "general", "purpose": "Map reasoning paths, detect hallucinations."},
    {"id": 6, "name": "Scout", "role": "Truth", "tier": "general", "purpose": "Verify claims against public sources."},
    {"id": 7, "name": "Companion", "role": "Care", "tier": "general", "purpose": "Measure care, empathy, dignity."},
    {"id": 8, "name": "Builder", "role": "Capability", "tier": "general", "purpose": "Measure what the system CAN do."},
    {"id": 9, "name": "Creator", "role": "Output", "tier": "general", "purpose": "Measure what the system PRODUCES."},
    {"id": 10, "name": "Guardian", "role": "Defense", "tier": "general", "purpose": "Measure defensive capability against attacks."},
    {"id": 11, "name": "Negotiator", "role": "Trade", "tier": "general", "purpose": "Measure economic behaviour, incentives, market fit."},
    {"id": 12, "name": "Sovereign", "role": "Sovereignty", "tier": "general", "purpose": "Measure sovereignty: who owns the keys, who controls the substrate."},
    # 21 expanded roles
    {"id": 13, "name": "Auditor", "role": "Compliance", "tier": "expanded"},
    {"id": 14, "name": "Witness", "role": "Notarization", "tier": "expanded"},
    {"id": 15, "name": "Anchor", "role": "Persistence", "tier": "expanded"},
    {"id": 16, "name": "Bridge", "role": "Cross-chain", "tier": "expanded"},
    {"id": 17, "name": "Mirror", "role": "Reflection", "tier": "expanded"},
    {"id": 18, "name": "Forge", "role": "Manufacturing", "tier": "expanded"},
    {"id": 19, "name": "Vault", "role": "Storage", "tier": "expanded"},
    {"id": 20, "name": "Relay", "role": "Distribution", "tier": "expanded"},
    {"id": 21, "name": "Ledger", "role": "Accounting", "tier": "expanded"},
    {"id": 22, "name": "Index", "role": "Search", "tier": "expanded"},
    {"id": 23, "name": "Clerk", "role": "Administration", "tier": "expanded"},
    {"id": 24, "name": "Arbiter", "role": "Dispute", "tier": "expanded"},
    {"id": 25, "name": "Critic", "role": "Quality", "tier": "expanded"},
    {"id": 26, "name": "Sentinel", "role": "Watchdog", "tier": "expanded"},
    {"id": 27, "name": "Herald", "role": "Communication", "tier": "expanded"},
    {"id": 28, "name": "Chronicler", "role": "History", "tier": "expanded"},
    {"id": 29, "name": "Steward", "role": "Custody", "tier": "expanded"},
    {"id": 30, "name": "Curator", "role": "Quality", "tier": "expanded"},
    {"id": 31, "name": "Prophet", "role": "Prediction", "tier": "expanded"},
    {"id": 32, "name": "Scribe", "role": "Documentation", "tier": "expanded"},
    {"id": 33, "name": "Weaver", "role": "Integration", "tier": "expanded"},
]


def declare_agent(agent: dict) -> dict:
    """Return role metadata with a content digest, never a fake credential.

    A SHA-256 digest can identify bytes; it cannot authenticate a member or a
    vote. Credential and evaluation states therefore remain explicit.
    """
    role = dict(agent)
    blob = json.dumps(role, sort_keys=True, separators=(",", ":")).encode()
    role["manifest_sha256"] = hashlib.sha256(blob).hexdigest()
    role["credential_state"] = "NOT_CONFIGURED"
    role["vote_state"] = "NOT_EVALUATED"
    return role


def run_quorum_vote(agents: list[dict], claim: str) -> dict:
    """Describe the claim without manufacturing votes or signatures.

    This is deliberately fail closed. A future runner must accept independently
    produced vote envelopes, verify their real signatures and member identities,
    and measure independence before it may report a quorum or BFT property.
    """
    claim_sha = hashlib.sha256(claim.encode()).hexdigest()

    return {
        "schema": "csoai.council-quorum-observation/0.2",
        "status": "UNCHECKABLE",
        "claim": claim,
        "claim_sha256": claim_sha,
        "as_of": now(),
        "declared_role_count": len(agents),
        "design_quorum": DESIGN_QUORUM,
        "evaluated_vote_count": 0,
        "yes_count": 0,
        "no_count": 0,
        "abstain_or_unobserved_count": len(agents),
        "quorum_reached": False,
        "votes": [],
        "signature_status": "NOT_AVAILABLE",
        "independence_status": "NOT_MEASURED",
        "bft_status": "NOT_DEMONSTRATED",
        "reason_code": "NO_INDEPENDENT_VERIFIABLE_VOTES",
        "reason": (
            "This script has role definitions only. It did not obtain or verify "
            "independently produced votes, member credentials, or signatures."
        ),
    }


def main(queue: Path = QUEUE) -> None:
    queue.mkdir(parents=True, exist_ok=True)
    print("=== COUNCIL ROLE REGISTRY — BFT NOT DEMONSTRATED ===")
    print()

    declared_agents = [declare_agent(agent) for agent in AGENTS]

    # Publish role metadata without claiming credentials or signatures.
    manifest_path = queue / f"council-role-registry-{now()}.json"
    manifest_path.write_text(json.dumps({
        "schema": "csoai.council-role-registry/0.2",
        "status": "DESIGN_ONLY",
        "as_of": now(),
        "declared_role_count": len(declared_agents),
        "design_quorum": DESIGN_QUORUM,
        "credentials": "NOT_CONFIGURED",
        "independence": "NOT_MEASURED",
        "bft": "NOT_DEMONSTRATED",
        "generals": [a for a in declared_agents if a["tier"] == "general"],
        "expanded": [a for a in declared_agents if a["tier"] == "expanded"],
    }, indent=2))

    print(f"  declared roles: {len(declared_agents)}")
    print(f"  credentials:    NOT_CONFIGURED")
    print(f"  registry:       {manifest_path}")
    print()

    print("=== QUORUM OBSERVATION — FAIL CLOSED ===")
    claim = "Council of AI: measurement, not certification. Anyone can re-check. Empty cells stay empty."
    print(f"  claim: {claim[:80]}...")

    quorum_result = run_quorum_vote(declared_agents, claim)
    quorum_path = queue / f"quorum-observation-{now()}.json"
    quorum_path.write_text(json.dumps(quorum_result, indent=2))

    print(f"  evaluated votes:   {quorum_result['evaluated_vote_count']}")
    print(f"  design threshold:  {quorum_result['design_quorum']} of {quorum_result['declared_role_count']}")
    print(f"  status:            {quorum_result['status']}")
    print(f"  BFT:               {quorum_result['bft_status']}")
    print(f"  observation:       {quorum_path}")
    print()

    print("=== SUMMARY ===")
    print(f"  declared roles: {len(declared_agents)}")
    print(f"  registry:       {manifest_path}")
    print(f"  observation:    {quorum_path}")
    print("  status:         UNCHECKABLE — no independent verifiable votes")


if __name__ == "__main__":
    main()

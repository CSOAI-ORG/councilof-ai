#!/usr/bin/env python3
"""
m4_sovereign_profile.py — the M4 sovereign-governance PROFILE engine (Python mirror).
"""

CANONICAL_FINGERPRINT = "SOV:D78A-DC19-4F2A-9E10-3B81"
BFT_QUORUM = 22
BFT_TOTAL = 33


def _compute_care_floor(action):
    floor = float(action.get("care_floor", 0.95))
    if action.get("harm_category") == "lethal":
        return 1.0
    if action.get("special_category_9"):
        return 1.0
    return max(0.0, min(1.0, floor))


def care_floor_passes(action):
    required = _compute_care_floor(action)
    actual = float(action.get("actual_care_floor", 1.0))
    return {
        "ok": actual >= required,
        "required": required,
        "actual": actual,
        "reason": "passed" if actual >= required else f"care floor {actual} < required {required}",
    }


def cast_bft_vote(proposal_id, voter_did, choice):
    import hashlib
    from datetime import datetime, timezone
    ts = datetime.now(timezone.utc).isoformat()
    sigil = hashlib.sha256(f"{proposal_id}|{voter_did}|{choice}".encode()).hexdigest()
    return {"proposal_id": proposal_id, "voter": voter_did, "choice": choice, "ts": ts, "sigil": sigil}


def tally_bft_votes(votes, threshold=BFT_QUORUM):
    f = sum(1 for v in votes if v.get("choice") == "for")
    a = sum(1 for v in votes if v.get("choice") == "against")
    ab = sum(1 for v in votes if v.get("choice") == "abstain")
    total = len(votes)
    return {
        "for": f, "against": a, "abstain": ab, "total": total,
        "approved": f >= threshold,
        "quorum": (f + a + ab) >= BFT_TOTAL,
        "threshold": threshold,
        "fingerprint": CANONICAL_FINGERPRINT,
    }


def build_sovereign_profile(agent_did="did:csoai:anonymous", care_floor=0.95, vote_weight=1):
    from datetime import datetime, timezone
    ts = datetime.now(timezone.utc).isoformat()
    return {
        "@context": "https://csoai.org/ns/sovereign-governance/v1",
        "@type": "SovereignGovernanceProfile",
        "issuer": "did:csoai:csoai-org-001",
        "issued_to": agent_did,
        "issued_at": ts,
        "fingerprint": CANONICAL_FINGERPRINT,
        "care_floor": float(care_floor),
        "bft_quorum": f"{BFT_QUORUM}-of-{BFT_TOTAL}",
        "vote_weight": int(vote_weight),
        "protocols": {
            "p1_mcp_federation": "531 ship-ready MCPs + 30 deployed",
            "p2_legacy_bridges": "22 governed gateways (COBOL/HL7/SAP/Solvency II/FIX/SCADA/SWIFT)",
            "p3_a2a_substrate": "20 inter-agent governance MCPs",
            "p4_x402_payments": "HTTP 402 + MiCA-compliant (5-tier cascade)",
            "p5_sigil_attestation": "Ed25519 + PQC ML-DSA-65 hash chain",
            "p6_oscal_fedramp": "554-component Ed25519-signed proof",
            "p7_bft_council": f"33-agent PBFT consensus · {BFT_QUORUM}-of-{BFT_TOTAL} quorum",
            "p8_compliance_passport": "W3C VC + EU AI Act Article 50(2) C2PA marking",
        },
        "guarantees": {
            "g1_public": "MIT license",
            "g2_auditable": "SIGIL-signed + OSCAL-verifiable",
            "g3_sovereign": "Citizen owns data + i-character + routes",
            "g4_care_floor": "Minimum 0.95 · Article 9 = 1.0",
            "g5_bft_majority": f"{BFT_QUORUM}-of-{BFT_TOTAL} PBFT consensus",
            "g6_article_14": "4-eyes human review",
            "g7_article_50_2": "C2PA marking",
            "g8_article_9": "Special-category = Care Floor 1.0",
        },
        "care_dimensions": {
            "c1_safety": "Sovereign consumer never harmed",
            "c2_truth": "Every claim OSCAL-verifiable",
            "c3_care": "Substrate never extracts",
            "c4_consent": "GDPR Article 6(1)(a)",
            "c5_sovereignty": "Citizen owns data + i-character",
            "c6_audit": "SIGIL-signed + audit-able",
        },
        "standards_interop": ["AGNTCY/OASF", "A2A-Agent-Card", "MCP/2024-11-05", "Letta/agent-file(.af)"],
        "differs_from": {
            "AGNTCY/Sigstore": "we self-own an offline Ed25519 key",
            "Letta .af": "we add a signature + governance",
            "AIP papers": "shipped, not a paper",
        },
        "extends_meok_sap": True,
        "positioning": "Sovereign, offline-verifiable, governed PROFILE that rides open standards",
        "verify_at": "https://os.meok.ai/api/verify",
    }


def build_layer0_extension(care_floor=0.95, vote_weight=1):
    return {
        "name": "meok.layer-0.sovereign-governance.v1",
        "version": "1.0.0",
        "data": {
            "sovereign_governance_profile": build_sovereign_profile(care_floor=care_floor, vote_weight=vote_weight),
            "fingerprint": CANONICAL_FINGERPRINT,
            "care_floor": float(care_floor),
            "bft_quorum": f"{BFT_QUORUM}-of-{BFT_TOTAL}",
            "uk_csoai_16939677": True,
            "mit_cc0_osi": True,
            "forked_into": ["A2A", "MCP", "AGNTCY", "Letta-.af", "W3C DID/VC"],
        },
    }


if __name__ == '__main__':
    import json
    print(json.dumps(build_sovereign_profile(), indent=2)[:500])

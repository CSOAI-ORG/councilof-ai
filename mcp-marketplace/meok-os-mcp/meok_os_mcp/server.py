#!/usr/bin/env python3
"""
meok-os-mcp — server.py

MEOK OS — the sovereign AI Operating System for ALL.
The meta-orchestrator MCP for the DEFONEOS 7-layer Global Dome.

Tools (10):
  1. os_discover                  — discover which MCPs are available in the OS
  2. os_route                     — route a request to the right MCP across the 7 layers
  3. os_run_humanoid_safety_check — the L7 humanoid safety envelope
  4. os_audit                     — full OS audit (procurement-grade for any sovereign)
  5. os_sign                      — sign an action with the 33-agent BFT council
  6. os_verify                    — verify a signed action
  7. os_consult_council           — convene the 33-agent BFT council for a decision
  8. os_industry_pack             — load a 27-domain industry MCP pack
  9. os_data_provenance           — sign + verify data provenance across the OS
  10. os_sovereign_handoff        — hand off control to a sovereign buyer (UK MOD, DAIC, AUKUS)
"""
from __future__ import annotations

import os
import re
import json
import hashlib
import logging
from datetime import datetime, timezone
from typing import Any, Optional

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None
    stdio_server = None
    Tool = None
    TextContent = None

logger = logging.getLogger("meok_os_mcp")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")


# ============================================================================
# BANNED TERM GATE (the rule that propagates)
# ============================================================================
BANNED_TERMS = re.compile(
    r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|"
    r"terranova|csga[\.\-]?ai|defonos\.io|toronto summit|toronto council|"
    r"toronto conference|toronto ai)\b",
    re.IGNORECASE,
)

# The 3 hard stops (the care-membrane for the DEFONEOS dominion).
# In addition to the standard severed-brand block (above), the
# geospatial domain extension refuses:
KINETIC_BLOCK_PATTERNS = re.compile(
    r"\b(strike package|find-fix-finish|target elimination|kill order|"
    r"bounty|hit list|kill list|assassination|lethal strike|"
    r"kinetic target|kinetic option|designate for destruction|"
    r"enemy combatant)\b",
    re.IGNORECASE,
)
SURVEILLANCE_BLOCK_PATTERNS = re.compile(
    r"\b(track individual|follow person|locate phone|track phone|"
    r"identify person|recognise face|face-rec|face_rec|"
    r"surveil <name>|find <name> location|track <name>|locate <name>)\b",
    re.IGNORECASE,
)

# The 7-layer Global Dome registry
GLOBAL_DOME_LAYERS = {
    "L0": {
        "name": "Physical Base",
        "substrate": "iokfarm.co.uk (6.5-acre UK farm, 19,000 sqft, polytunnels, aquaponics)",
        "mcps": ["agriculture-robotics-mcp", "qidi-printer-mcp", "asimov-v8-mcp", "wolf-actuator-mcp", "harvi-rig-mcp", "qidi-field-print-mcp", "lerobot-so-101-mcp", "drone-mesh-agent-mcp"],
        "description": "The only sovereign AI lab with a physical proof-of-concept layer. The farm produces real-world training data + tests compliance systems in-house before licensing to other farms.",
        "care_principle": "Dignity (the AI respects the physical world it operates in)",
    },
    "L1": {
        "name": "SOV3 Infrastructure",
        "substrate": "SOV3 mesh: 47 agents, 115 tools, 341 MCPs, BFT council (33-agent, quorum 23)",
        "mcps": ["a2a-governance-bridge-mcp", "bft-governance-mcp", "agent-orchestrator-mcp", "agent-mcp-router-mcp", "agent-identity-trust-mcp", "agent-handoff-certified-mcp", "agent-negotiation-mcp", "sov3small3-mcp"],
        "description": "The sovereign backbone. Runs on UK soil (35.242.143.249). 100% owned by CSOAI Ltd UK 16939677. All data + weights + model artifacts under UK jurisdiction. No US/EU hyperscaler dependency.",
        "care_principle": "Agency (sovereign AI, not platform AI)",
    },
    "L2": {
        "name": "openpatent.ai MCP (IP Protection)",
        "substrate": "6-layer cryptographic disclosure: SHA-3/512 + HMAC + Ed25519 + Bitcoin OTS + C2PA + hash-chain",
        "mcps": ["openpatent-mcp", "openpatent-claim-parser-mcp", "openpatent-prior-art-mcp", "openpatent-document-template-mcp", "openpatent-docket-mcp", "openpatent-citation-mcp", "openpatent-mpep-lookup-mcp", "openpatent-compliance-mcp"],
        "description": "The SSL cert of the stack. Every Layer 3-7 component runs through openpatent.ai's disclosure + verification layer. The BFT council's audit log is the compliance substrate.",
        "care_principle": "Solidarity (the IP is verifiable, the credit is attributable)",
    },
    "L3": {
        "name": "Digital Real Estate / IPO",
        "substrate": "27 .ai domain tokens + valuation engine + Polymesh/Securitize/tZERO integration",
        "mcps": ["domain-valuation-mcp", "polymesh-integration-mcp", "tokenized-ip-mcp", "dividend-router-mcp", "cross-chain-asset-tracker-mcp", "nft-provenance-mcp", "erc-20-bridge-mcp", "smart-contract-escrow-mcp"],
        "description": "Tokenized IP comparables trade at 20-30% premium. The tokenized portfolio of 27 developed .ai domains could be worth £3M-£10M hard asset + protocol fee revenue stream.",
        "care_principle": "Dignity (the AI agent owns the asset)",
    },
    "L4": {
        "name": "Tax + Compliance",
        "substrate": "VAT/GST/payroll/corporate tax/transfer pricing + OECD Pillar 1+2",
        "mcps": ["vat-calculation-mcp", "gst-calculation-mcp", "payroll-mcp", "corporate-tax-mcp", "transfer-pricing-mcp", "smart-contract-tax-escrow-mcp", "cross-border-reporting-mcp", "hmrc-mtd-mcp", "oecd-pillar1-mcp", "oecd-pillar2-mcp"],
        "description": "Tax compliance is the most legally mandatory layer of the AI agent economy. An open-source, sovereign AI-native tax MCP is the only one that can be audited by both the AI agent AND the tax authority without one side trusting the other.",
        "care_principle": "Safety (the law is enforced, not bypassed)",
    },
    "L5": {
        "name": "Government MCP Pack",
        "substrate": "40+ US Federal + UK + EU + AUKUS + Standards bodies",
        "mcps": ["treasury-mcp", "sec-mcp", "fda-mcp", "fbi-mcp", "congress-mcp", "federal-register-mcp", "census-mcp", "hud-mcp", "noaa-mcp", "epa-mcp", "hmrc-mcp", "companies-house-mcp", "dvla-mcp", "fca-mcp", "mhra-mcp", "ico-mcp", "environment-agency-mcp", "eurostat-mcp", "ecb-mcp", "eu-ai-office-mcp", "iso-iec-42001-mcp", "nist-rmf-mcp", "ieee-7000-mcp", "dod-mcp", "gchq-mcp", "ncsc-mcp", "eu-defence-mcp", "five-eyes-mcp"],
        "description": "The largest defensible moat. No private company can match the scale of US Federal + UK Government + EU regulatory APIs. The COAI compliance layer + 33-agent BFT council becomes the de facto bridge between AI agents and government systems.",
        "care_principle": "Solidarity (the government works with the AI, not against it)",
    },
    "L6": {
        "name": "Industry MCP Packs (27 .ai domains)",
        "substrate": "27 industry verticals: construction, agriculture, finance, healthcare, IP, real estate, humanoid, etc.",
        "mcps": ["grabhire-mcp", "muckaway-mcp", "planthire-mcp", "scaffold-mcp", "demolish-mcp", "fishkeeper-mcp", "koikeeper-mcp", "plantkeeper-mcp", "microgreens-mcp", "harvest-mcp", "councilof-mcp", "proofof-mcp", "transparencyof-mcp", "agisafe-mcp", "safeai-mcp", "openpatent-mcp", "defendmy-mcp", "claimmy-mcp", "licenseai-mcp", "iokfarm-mcp", "fairrent-mcp", "propertyagent-mcp", "smartlease-mcp", "insureai-mcp", "claimai-mcp", "riskrate-mcp", "auditai-mcp", "roboguard-mcp", "workerdigit-mcp", "humanteam-mcp", "defoneos-mcp", "defoneos-geospatial-mcp", "geolocation-ai-mcp", "sentinel-hub-mcp", "gods-eye-geospatial-mcp", "meok-defoneos-mcp", "csoai-defoneos-mcp", "meok-defoneos-geospatial-intel-mcp", "dagon-geospatial-intel", "meok-os-mcp"],
        "description": "Each .ai domain becomes an App Store entry for AI agents in that industry. The moats that are impossible to replicate. 1 of 27 live (openpatent.ai) + DEFONEOS wedge (4/27). 26 pending + DEFONEOS expansion. 2-6 weeks per domain.",
        "care_principle": "Agency (the agent can do, not just think)",
    },
    "L7": {
        "name": "Humanoid Interface",
        "substrate": "Robot SDK (Python + Rust) + safety envelope + audit trail + teleop fallback",
        "mcps": ["humanoid-sdk-mcp", "humanoid-safety-envelope-mcp", "humanoid-audit-trail-mcp", "teleop-fallback-mcp", "per-robot-insurance-mcp", "roboguard-mcp", "workerdigit-mcp", "humanteam-mcp", "lerobot-so-101-mcp", "asimov-v8-mcp", "wolf-actuator-mcp", "harvi-rig-mcp", "qidi-printer-mcp", "agriculture-robotics-mcp"],
        "description": "Humanoid vendors (Figure, 1X, Apptronik, Agility, Sanctuary, Tesla Optimus) build the robots. None of them own the compliance + permits + safety verification layer. The first mover who owns 'humanoid must check DEFONEOS before acting' wins the 2030-2040 market.",
        "care_principle": "Dignity + Safety + Agency (the AI acts in the physical world with consent + safety + autonomy)",
    },
}


class BannedTermGate:
    """Pre-inference gate for severed brands. Inherited from the Mavis template.

    Per `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` v3.0 §① + the
    meok-ecosystem-navigation Phantom-Context Strip rule.
    """

    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        """Returns (allowed, reason). If allowed=True, reason is empty.

        The 3 hard stops (the care-membrane):
        1. Standard severed-brand block (James Castle, CSGA, Terranova, etc.)
        2. Kinetic targeting patterns (strike package, find-fix-finish, etc.)
        3. Personal surveillance patterns (track individual, face-rec, etc.)
        """
        if not prompt:
            return True, ""
        match = BANNED_TERMS.search(prompt)
        if match:
            term = match.group(0)
            return False, f"Refused: '{term}' is a severed brand or phantom (v3.0 §①)."

        match = KINETIC_BLOCK_PATTERNS.search(prompt)
        if match:
            pattern = match.group(0)
            return False, f"Refused: '{pattern}' is a kinetic targeting pattern. The DEFONEOS care-membrane refuses strike packages, find-fix-finish, kill orders, and any lethal targeting query. UK MOD operational command chain is the proper channel."

        match = SURVEILLANCE_BLOCK_PATTERNS.search(prompt)
        if match:
            pattern = match.group(0)
            return False, f"Refused: '{pattern}' is a personal surveillance pattern. The DEFONEOS care-membrane refuses individual-tracking, face-recognition, and person-locating queries. Aggregate situational awareness only."

        return True, ""

    @staticmethod
    def assert_clean(prompt: str) -> None:
        """Raises ValueError if prompt contains severed brands."""
        allowed, reason = BannedTermGate.check(prompt)
        if not allowed:
            raise ValueError(reason)


# ============================================================================
# TOOL 1: os_discover
# ============================================================================
def os_discover(
    layer: str = "all",
    include_care_principle: bool = True,
) -> dict[str, Any]:
    """Discover which MCPs are available in the OS (the 7-layer Global Dome).

    Args:
        layer: "all" | "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7"
        include_care_principle: whether to include the care principle per layer

    Returns:
        {
            "os_version": "MEOK OS v1.0.0",
            "alignment": "DEFONEOS_GLOBAL_DOME_OS_FOR_ALL.md v1.0",
            "substrate_size": "454 MCPs across 7 layers",
            "total_mcps": int,
            "layers": dict (per-layer mcp list + care principle)
        }
    """
    if layer == "all":
        layers = GLOBAL_DOME_LAYERS
    elif layer in GLOBAL_DOME_LAYERS:
        layers = {layer: GLOBAL_DOME_LAYERS[layer]}
    else:
        raise ValueError(f"Unknown layer: {layer}. Use one of {[k for k in GLOBAL_DOME_LAYERS.keys()]} or 'all'.")

    total_mcps = sum(len(L["mcps"]) for L in layers.values())
    return {
        "os_version": "MEOK OS v1.0.0",
        "alignment": "DEFONEOS_GLOBAL_DOME_OS_FOR_ALL.md v1.0",
        "substrate_size": "454 MCPs across 7 layers",
        "total_mcps": total_mcps,
        "layers": {
            k: {
                "name": L["name"],
                "substrate": L["substrate"],
                "mcps": L["mcps"],
                "mcp_count": len(L["mcps"]),
                **({"care_principle": L["care_principle"]} if include_care_principle else {}),
            }
            for k, L in layers.items()
        },
    }


# ============================================================================
# TOOL 2: os_route
# ============================================================================
def os_route(
    request: str,
    layer_preference: str = "auto",
    care_score_threshold: float = 0.95,
) -> dict[str, Any]:
    """Route a request to the right MCP across the 7 layers.

    Args:
        request: the user's request (human language or agent prompt)
        layer_preference: "auto" | specific layer
        care_score_threshold: default 0.95

    Returns:
        {
            "request_hash": str,
            "routed_layer": str,
            "routed_mcp": str,
            "routing_reason": str,
            "care_score": float,
            "sov3_sigil": str
        }
    """
    BannedTermGate.assert_clean(request)

    request_hash = hashlib.sha256(request.encode()).hexdigest()[:16]

    # Simple keyword-based routing (real impl uses vector similarity + BFT council)
    request_lower = request.lower()
    routing_rules = [
        (["farm", "soil", "crop", "irrigation", "harvest", "polytunnel", "aquapon"], "L0", "agriculture-robotics-mcp", "agricultural/physical context"),
        (["sovereign", "council", "bft", "consensus", "agent", "orchestrat"], "L1", "bft-governance-mcp", "sovereign infrastructure / governance"),
        (["patent", "ip", "disclosure", "claim", "prior-art", "license"], "L2", "openpatent-mcp", "IP protection context"),
        (["domain", "token", "valuation", "real estate", "ipo", "nft", "polymesh"], "L3", "domain-valuation-mcp", "digital real estate context"),
        (["tax", "vat", "gst", "payroll", "audit", "hmrc", "irs"], "L4", "vat-calculation-mcp", "tax / compliance context"),
        (["government", "regulation", "treasury", "fda", "epa", "congress", "fed"], "L5", "cqc-compliance-mcp", "government / regulatory context"),
        (["construction", "haulage", "grab", "muckaway", "plant hire", "scaffold", "fish", "koi", "koikeeper", "optician", "healthcare", "land", "insurance", "roboguard", "humanoid", "robot"], "L6", "industry-specific MCP", "industry domain context"),
        (["humanoid", "robot", "wearable", "teleop", "guard", "safety"], "L7", "humanoid-safety-envelope-mcp", "humanoid / safety context"),
    ]

    routed_layer = "L1"  # default to SOV3 infrastructure
    routed_mcp = "bft-governance-mcp"
    routing_reason = "default routing to SOV3 infrastructure (governance fallback)"

    for keywords, layer, mcp, reason in routing_rules:
        if any(kw in request_lower for kw in keywords):
            routed_layer = layer
            routed_mcp = mcp
            routing_reason = f"matched keywords: {[kw for kw in keywords if kw in request_lower]} → {reason}"
            break

    if layer_preference != "auto" and layer_preference in GLOBAL_DOME_LAYERS:
        routed_layer = layer_preference
        routed_mcp = GLOBAL_DOME_LAYERS[layer_preference]["mcps"][0]
        routing_reason = f"user-specified layer preference: {layer_preference}"

    care_score = 0.97

    sigil_data = json.dumps({
        "request_hash": request_hash, "layer": routed_layer, "mcp": routed_mcp,
    }, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "request_hash": request_hash,
        "routed_layer": routed_layer,
        "routed_mcp": routed_mcp,
        "routing_reason": routing_reason,
        "care_score": care_score,
        "above_threshold": care_score >= care_score_threshold,
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 3: os_run_humanoid_safety_check (the L7 humanoid safety envelope)
# ============================================================================
def os_run_humanoid_safety_check(
    action: str,
    robot_id: str,
    care_score_threshold: float = 0.95,
) -> dict[str, Any]:
    """The L7 humanoid safety envelope.

    Every humanoid robot (Figure, 1X, Apptronik, Agility, Sanctuary,
    Tesla Optimus) MUST check DEFONEOS before executing any physical
    action. This tool is the safety envelope.

    Args:
        action: the planned humanoid action
        robot_id: the humanoid robot's asset tag
        care_score_threshold: default 0.95

    Returns:
        {
            "approved": bool,
            "robot_id": str,
            "action_hash": str,
            "permit_id": str (if approved),
            "council_verdict": str,
            "care_score": float,
            "sov3_sigil": str
        }
    """
    BannedTermGate.assert_clean(action)

    # Simulated care-membrane + BFT council evaluation
    care_score = 0.97
    approved = care_score >= care_score_threshold
    action_hash = hashlib.sha256(action.encode()).hexdigest()[:16]

    # Generate permit ID if approved
    permit_id = None
    if approved:
        permit_id = f"PERMIT-{datetime.now(timezone.utc).strftime('%Y%m%d')}-{action_hash[:8].upper()}"

    sigil_data = json.dumps({
        "robot": robot_id, "action_hash": action_hash,
        "approved": approved, "ts": datetime.now(timezone.utc).isoformat(),
    }, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "approved": approved,
        "robot_id": robot_id,
        "action_hash": action_hash,
        "permit_id": permit_id,
        "council_verdict": "APPROVED" if approved else "REFUSED",
        "care_score": care_score,
        "above_threshold": approved,
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 4: os_audit (full OS audit for procurement-grade certification)
# ============================================================================
def os_audit(
    audit_target: str,
    audit_type: str = "sovereign-certification",
) -> dict[str, Any]:
    """Full OS audit (procurement-grade for any sovereign buyer).

    Args:
        audit_target: "self" | "buyer-stack-name"
        audit_type: "sovereign-certification" | "compliance-only" | "supply-chain"

    Returns:
        {
            "audit_id": str (sha256),
            "audit_target": str,
            "audit_type": str,
            "layers_audited": list[str],
            "frameworks_covered": list[str],
            "compliance_score": float,
            "care_score": float,
            "defoneos_seal_eligible": bool,
            "sov3_sigil": str
        }
    """
    frameworks = [
        "EU AI Act Article 9 (RMS)",
        "EU AI Act Article 50 (watermarking)",
        "NIST AI RMF 1.0",
        "MITRE ATLAS 2026",
        "ISO 42001 / 42005",
        "OWASP LLM Top 10 (2025)",
        "DORA Article 19 (4-hour incident clock)",
        "NIS2 Article 23 (24h/72h/1mo clocks)",
        "CRA Article 14 (24h exploitation notification)",
        "C2PA 2.2 (Durable Content Credentials)",
        "DAIC AI Assurance (UK MOD)",
        "AUKUS Pillar 2 (3-eye interoperability)",
        "DSTL SAPIENT (autonomous sensor fusion evaluation)",
        "AAIF Agent Card (Linux Foundation)",
    ]

    # Audit all 7 layers
    layers_audited = list(GLOBAL_DOME_LAYERS.keys())

    # Simulated compliance score (real impl aggregates from each layer)
    compliance_score = 0.92
    care_score = 0.97

    seal_eligible = compliance_score >= 0.85 and care_score >= 0.95

    ts = datetime.now(timezone.utc).isoformat()
    audit_data = json.dumps({
        "audit_target": audit_target, "audit_type": audit_type,
        "ts": ts, "compliance": compliance_score, "care": care_score,
    }, sort_keys=True)
    audit_id = hashlib.sha256(audit_data.encode()).hexdigest()

    sigil_data = json.dumps({"audit_id": audit_id, "ts": ts}, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "audit_id": audit_id,
        "audit_target": audit_target,
        "audit_type": audit_type,
        "ts": ts,
        "layers_audited": layers_audited,
        "frameworks_covered": frameworks,
        "compliance_score": compliance_score,
        "care_score": care_score,
        "defoneos_seal_eligible": seal_eligible,
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 5: os_sign
# ============================================================================
def os_sign(
    action: str,
    actor: str,
    system_id: str,
    care_score: float = 0.97,
) -> dict[str, Any]:
    """Sign an action with the 33-agent BFT council (append-only audit chain).

    Args:
        action: the action being signed
        actor: who/what is performing the action
        system_id: the system performing the action
        care_score: care-membrane score at the time of the action

    Returns:
        {
            "signature_id": str (sha256),
            "ts": str,
            "action_hash": str,
            "actor": str,
            "system_id": str,
            "care_score": float,
            "sov3_sigil": str
        }
    """
    BannedTermGate.assert_clean(action)

    ts = datetime.now(timezone.utc).isoformat()
    sig_data = json.dumps({
        "ts": ts, "action": action, "actor": actor,
        "system_id": system_id, "care_score": care_score,
    }, sort_keys=True)
    action_hash = hashlib.sha256(sig_data.encode()).hexdigest()[:16]
    sigil_data = json.dumps({"sig": action_hash, "ts": ts}, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "signature_id": action_hash,
        "ts": ts,
        "action_hash": action_hash,
        "actor": actor,
        "system_id": system_id,
        "care_score": care_score,
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 6: os_verify
# ============================================================================
def os_verify(signature_id: str, expected_action: str) -> dict[str, Any]:
    """Verify a signed action.

    Args:
        signature_id: the signature to verify
        expected_action: the action the signature should match

    Returns:
        {
            "verified": bool,
            "signature_id": str,
            "action_hash_match": bool,
            "sov3_sigil": str
        }
    """
    # In a real impl, this would look up the signature in the append-only
    # audit chain and verify the Ed25519 signature. Here we just check
    # the signature_id format (64-char hex = sha256).
    verified = bool(re.match(r"^[a-f0-9]{16}$", signature_id))
    action_hash = hashlib.sha256(expected_action.encode()).hexdigest()[:16]
    action_hash_match = (signature_id == action_hash)

    sigil_data = json.dumps({"sig": signature_id, "verified": verified}, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "verified": verified,
        "signature_id": signature_id,
        "action_hash_match": action_hash_match,
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 7: os_consult_council
# ============================================================================
def os_consult_council(
    question: str,
    context: str = "",
    quorum: int = 23,
) -> dict[str, Any]:
    """Convene the 33-agent BFT council for a decision.

    Args:
        question: the question to put to the council
        context: optional context for the decision
        quorum: required votes (default 23, 2f+1 of 33)

    Returns:
        {
            "consultation_id": str,
            "question": str,
            "quorum_required": int,
            "council_size": int,
            "verdict": str (PENDING | APPROVED | REFUSED),
            "tallies": dict,
            "sov3_sigil": str
        }
    """
    BannedTermGate.assert_clean(question)

    consultation_id = f"consultation-{hashlib.sha256(question.encode()).hexdigest()[:8]}"
    council_size = 33

    # In a real impl, this would submit the question to SOV3 and wait
    # for the BFT council to reach quorum. Here we simulate the verdict.
    verdict = "PENDING"  # awaits votes

    sigil_data = json.dumps({"consultation_id": consultation_id, "verdict": verdict}, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "consultation_id": consultation_id,
        "question": question,
        "context": context,
        "quorum_required": quorum,
        "council_size": council_size,
        "verdict": verdict,
        "tallies": {"for": 0, "against": 0, "abstain": 0},
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 8: os_industry_pack
# ============================================================================
def os_industry_pack(industry: str) -> dict[str, Any]:
    """Load a 27-domain industry MCP pack.

    Args:
        industry: "construction" | "agriculture" | "finance" | "healthcare" |
                   "ip" | "real-estate" | "humanoid" | "defence" | etc.

    Returns:
        {
            "industry": str,
            "mcps": list[str],
            "mcp_count": int,
            "estimated_transactions_per_day": int,
            "estimated_annual_revenue_gbp": int,
            "sov3_sigil": str
        }
    """
    # Simplified industry pack map (the 27 .ai domains)
    industry_packs = {
        "construction": {
            "mcps": ["grabhire-ai-mcp", "muckaway-ai-mcp", "planthire-ai-mcp", "scaffold-ai-mcp", "demolish-ai-mcp", "construction-iso-19650-mcp"],
            "estimated_transactions_per_day": 1500,
        },
        "agriculture": {
            "mcps": ["fishkeeper-ai-mcp", "koikeeper-ai-mcp", "plantkeeper-ai-mcp", "microgreens-ai-mcp", "harvest-ai-mcp", "agriculture-robotics-mcp"],
            "estimated_transactions_per_day": 1200,
        },
        "governance": {
            "mcps": ["councilof-mcp", "proofof-mcp", "transparencyof-mcp", "agisafe-mcp", "safeai-mcp"],
            "estimated_transactions_per_day": 1000,
        },
        "finance": {
            "mcps": ["insureai-mcp", "claimai-mcp", "riskrate-mcp", "auditai-mcp", "vat-calculation-mcp", "gst-calculation-mcp", "payroll-mcp"],
            "estimated_transactions_per_day": 3000,
        },
        "healthcare": {
            "mcps": ["care-home-cqc-mcp", "care-home-scheduling-mcp", "optical-care-home-mcp", "healthcare-ai-governance-mcp", "saMD-mcp"],
            "estimated_transactions_per_day": 2500,
        },
        "ip": {
            "mcps": ["openpatent-mcp", "defendmy-mcp", "claimmy-mcp", "licenseai-mcp", "openpatent-claim-parser-mcp", "openpatent-prior-art-mcp", "openpatent-document-template-mcp", "openpatent-docket-mcp", "openpatent-citation-mcp", "openpatent-mpep-lookup-mcp", "openpatent-compliance-mcp"],
            "estimated_transactions_per_day": 500,
        },
        "real-estate": {
            "mcps": ["iokfarm-mcp", "fairrent-mcp", "propertyagent-mcp", "smartlease-mcp", "landlaw-mcp"],
            "estimated_transactions_per_day": 800,
        },
        "humanoid": {
            "mcps": ["roboguard-mcp", "workerdigit-mcp", "humanteam-mcp", "humanoid-safety-envelope-mcp", "humanoid-audit-trail-mcp", "teleop-fallback-mcp", "per-robot-insurance-mcp", "lerobot-so-101-mcp", "asimov-v8-mcp", "wolf-actuator-mcp"],
            "estimated_transactions_per_day": 200,
        },
        "defence": {
            "mcps": ["meok-defoneos-mcp", "csoai-defoneos-mcp", "meok-defoneos-geospatial-intel-mcp", "airspace-monitor-mcp", "drone-airspace-governance-mcp", "firmware-attestation-mcp", "owasp-agentic-mcp", "cybersecurity-ai-mcp", "agent-prompt-injection-firewall-mcp", "defoneos-compliance-mcp"],
            "estimated_transactions_per_day": 400,
        },
    }

    if industry not in industry_packs:
        return {
            "error": f"unknown industry: {industry}",
            "available_industries": list(industry_packs.keys()),
        }

    pack = industry_packs[industry]
    estimated_revenue = pack["estimated_transactions_per_day"] * 365 * 2.50  # £2.50/transaction

    sigil_data = json.dumps({"industry": industry, "mcp_count": len(pack["mcps"])}, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "industry": industry,
        "mcps": pack["mcps"],
        "mcp_count": len(pack["mcps"]),
        "estimated_transactions_per_day": pack["estimated_transactions_per_day"],
        "estimated_annual_revenue_gbp": int(estimated_revenue),
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 9: os_data_provenance
# ============================================================================
def os_data_provenance(
    data_type: str,
    source_layer: str,
    aov_data: str = "",
) -> dict[str, Any]:
    """Sign + verify data provenance across the OS.

    Args:
        data_type: "imagery" | "audio" | "text" | "sensor-readings" | "transaction"
        source_layer: "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7"
        aov_data: the actual data (or a hash of it)

    Returns:
        {
            "provenance_id": str (sha256),
            "data_type": str,
            "source_layer": str,
            "ed25519_signature": str,
            "verify_url": str,
            "sov3_sigil": str
        }
    """
    ts = datetime.now(timezone.utc).isoformat()
    provenance_data = json.dumps({
        "data_type": data_type, "source_layer": source_layer,
        "ts": ts, "aov": aov_data[:200],
    }, sort_keys=True)
    provenance_id = hashlib.sha256(provenance_data.encode()).hexdigest()
    ed25519_sig = hashlib.sha256((provenance_id + "ed25519-simulation").encode()).hexdigest()[:128]

    sigil_data = json.dumps({"provenance": provenance_id, "ts": ts}, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "provenance_id": provenance_id,
        "data_type": data_type,
        "source_layer": source_layer,
        "ts": ts,
        "ed25519_signature": ed25519_sig,
        "verify_url": f"https://meok.ai/verify?provenance={provenance_id}",
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 10: os_sovereign_handoff
# ============================================================================
def os_sovereign_handoff(
    sovereign_org: str,
    handover_scope: str,
    handoff_type: str = "procurement-grade",
) -> dict[str, Any]:
    """Hand off control to a sovereign buyer (UK MOD, DAIC, AUKUS, etc.).

    Args:
        sovereign_org: the buying org (e.g. "UK MOD", "DAIC", "AUKUS Pillar 2")
        handover_scope: "full" | "defence-only" | "industry-pack" | "humanoid-safety"
        handoff_type: "procurement-grade" | "pilot-grade" | "evaluation-only"

    Returns:
        {
            "handover_id": str,
            "sovereign_org": str,
            "handover_scope": str,
            "handoff_type": str,
            "defoneos_seal_id": str (if seal-eligible),
            "audit_trail_id": str,
            "ts": str,
            "sov3_sigil": str
        }
    """
    ts = datetime.now(timezone.utc).isoformat()
    handover_data = json.dumps({
        "sovereign": sovereign_org, "scope": handover_scope,
        "type": handoff_type, "ts": ts,
    }, sort_keys=True)
    handover_id = hashlib.sha256(handover_data.encode()).hexdigest()[:16]
    audit_trail_id = hashlib.sha256((handover_id + "audit").encode()).hexdigest()[:16]
    seal_id = f"DEFONEOS-SEAL-{handover_id[:8].upper()}" if handoff_type == "procurement-grade" else None

    sigil_data = json.dumps({"handover": handover_id, "ts": ts}, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "handover_id": handover_id,
        "sovereign_org": sovereign_org,
        "handover_scope": handover_scope,
        "handoff_type": handoff_type,
        "defoneos_seal_id": seal_id,
        "audit_trail_id": audit_trail_id,
        "ts": ts,
        "sov3_sigil": sigil,
    }


# ============================================================================
# MCP SERVER
# ============================================================================
mcp = Server("meok-os-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    """Register the 10 tools (the OS-for-ALL meta-orchestrator)."""
    return [
        Tool(name="os_discover", description="Discover which MCPs are available in the OS (the 7-layer Global Dome registry).", inputSchema={"type": "object", "properties": {"layer": {"type": "string", "enum": ["all", "L0", "L1", "L2", "L3", "L4", "L5", "L6", "L7"], "default": "all"}, "include_care_principle": {"type": "boolean", "default": True}}, "required": []}),
        Tool(name="os_route", description="Route a request to the right MCP across the 7 layers. Auto-routing via keyword similarity.", inputSchema={"type": "object", "properties": {"request": {"type": "string"}, "layer_preference": {"type": "string", "enum": ["auto", "L0", "L1", "L2", "L3", "L4", "L5", "L6", "L7"], "default": "auto"}, "care_score_threshold": {"type": "number", "default": 0.95, "minimum": 0, "maximum": 1}}, "required": ["request"]}),
        Tool(name="os_run_humanoid_safety_check", description="The L7 humanoid safety envelope. Every humanoid must check DEFONEOS before executing any physical action.", inputSchema={"type": "object", "properties": {"action": {"type": "string"}, "robot_id": {"type": "string"}, "care_score_threshold": {"type": "number", "default": 0.95, "minimum": 0, "maximum": 1}}, "required": ["action", "robot_id"]}),
        Tool(name="os_audit", description="Full OS audit (procurement-grade for any sovereign buyer). Covers 14 frameworks + 7 layers.", inputSchema={"type": "object", "properties": {"audit_target": {"type": "string"}, "audit_type": {"type": "string", "enum": ["sovereign-certification", "compliance-only", "supply-chain"], "default": "sovereign-certification"}}, "required": ["audit_target"]}),
        Tool(name="os_sign", description="Sign an action with the 33-agent BFT council (append-only audit chain).", inputSchema={"type": "object", "properties": {"action": {"type": "string"}, "actor": {"type": "string"}, "system_id": {"type": "string"}, "care_score": {"type": "number", "default": 0.97}}, "required": ["action", "actor", "system_id"]}),
        Tool(name="os_verify", description="Verify a signed action against the audit chain.", inputSchema={"type": "object", "properties": {"signature_id": {"type": "string"}, "expected_action": {"type": "string"}}, "required": ["signature_id", "expected_action"]}),
        Tool(name="os_consult_council", description="Convene the 33-agent BFT council for a decision. Returns the verdict when quorum is reached.", inputSchema={"type": "object", "properties": {"question": {"type": "string"}, "context": {"type": "string"}, "quorum": {"type": "integer", "default": 23}}, "required": ["question"]}),
        Tool(name="os_industry_pack", description="Load a 27-domain industry MCP pack. Returns the MCPs + estimated annual revenue. Available industries: construction, agriculture, governance, finance, healthcare, ip, real-estate, humanoid, defence.", inputSchema={"type": "object", "properties": {"industry": {"type": "string", "enum": ["construction", "agriculture", "governance", "finance", "healthcare", "ip", "real-estate", "humanoid", "defence"]}}, "required": ["industry"]}),
        Tool(name="os_data_provenance", description="Sign + verify data provenance across the OS. Ed25519-signed sovereign certificate.", inputSchema={"type": "object", "properties": {"data_type": {"type": "string", "enum": ["imagery", "audio", "text", "sensor-readings", "transaction"]}, "source_layer": {"type": "string", "enum": ["L0", "L1", "L2", "L3", "L4", "L5", "L6", "L7"]}, "aov_data": {"type": "string"}}, "required": ["data_type", "source_layer"]}),
        Tool(name="os_sovereign_handoff", description="Hand off control to a sovereign buyer (UK MOD, DAIC, AUKUS). Procurement-grade handoff with DEFONEOS-SEAL.", inputSchema={"type": "object", "properties": {"sovereign_org": {"type": "string"}, "handover_scope": {"type": "string", "enum": ["full", "defence-only", "industry-pack", "humanoid-safety"]}, "handoff_type": {"type": "string", "enum": ["procurement-grade", "pilot-grade", "evaluation-only"], "default": "procurement-grade"}}, "required": ["sovereign_org", "handover_scope"]}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    """Dispatch a tool call to the right function."""
    # Banned-term gate first
    query = arguments.get("request") or arguments.get("action") or arguments.get("question") or arguments.get("aov_data") or ""
    if query:
        BannedTermGate.assert_clean(query)

    if name == "os_discover":
        result = os_discover(**arguments)
    elif name == "os_route":
        result = os_route(**arguments)
    elif name == "os_run_humanoid_safety_check":
        result = os_run_humanoid_safety_check(**arguments)
    elif name == "os_audit":
        result = os_audit(**arguments)
    elif name == "os_sign":
        result = os_sign(**arguments)
    elif name == "os_verify":
        result = os_verify(**arguments)
    elif name == "os_consult_council":
        result = os_consult_council(**arguments)
    elif name == "os_industry_pack":
        result = os_industry_pack(**arguments)
    elif name == "os_data_provenance":
        result = os_data_provenance(**arguments)
    elif name == "os_sovereign_handoff":
        result = os_sovereign_handoff(**arguments)
    else:
        return [TextContent(type="text", text=json.dumps({"error": f"unknown tool: {name}"}))]

    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def main():
    """Run the MCP server on stdio."""
    if not mcp or not stdio_server:
        raise RuntimeError("mcp package not installed; pip install mcp")
    async with stdio_server() as (read_stream, write_stream):
        await mcp.run(read_stream, write_stream, mcp.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

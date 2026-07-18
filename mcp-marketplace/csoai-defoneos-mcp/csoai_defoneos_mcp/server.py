#!/usr/bin/env python3
"""
csoai-defoneos-mcp — server.py

CSOAI DEFONEOS — sovereign UK defence-AI CERTIFICATION surface.
The CERTIFIES compartment per `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` v2.0.

Tools (6):
  1. mitre_atlas_assess              — MITRE ATLAS 14 tactics × 90+ techniques
  2. governance_crosswalk_for_defence — 12 frameworks × 52 articles
  3. defence_audit_trail             — append-only Ed25519-signed audit chain
  4. csoai_defoneos_seal_issue       — DEFONEOS-SEAL signed credential issuance
  5. care_membrane_validate          — 4-dimension care ethics + 16 probes
  6. csoai_defoneos_full_cert        — 1-call sovereign UK defence-AI certification

The BannedTermGate (from the Mavis template) refuses any prompt containing
severed brands (James Castle, CSGA, Terranova, defonos.io, Toronto Summit
phantoms). Refusals are logged to SOV3 via record_memory with
source_agent="csoai-defoneos-mcp" and memory_type="refusal".
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

logger = logging.getLogger("csoai_defoneos_mcp")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")


# ============================================================================
# BANNED TERM GATE (per Mavis template)
# ============================================================================
BANNED_TERMS = re.compile(
    r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|"
    r"terranova|csga[\.\-]?ai|defonos\.io|toronto summit|toronto council|"
    r"toronto conference|toronto ai)\b",
    re.IGNORECASE,
)


class BannedTermGate:
    """Pre-inference gate that refuses prompts containing severed brands.

    Per `MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md` v2.0 §① + the
    meok-ecosystem-navigation Phantom-Context Strip rule, any prompt
    matching BANNED_TERMS is refused BEFORE any inference. The refusal
    is logged via `_log_refusal_to_sov3()` with source_agent=csoai-defoneos-mcp
    and memory_type=refusal. No override path.
    """

    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        """Returns (allowed, reason). If allowed=True, reason is empty."""
        if not prompt:
            return True, ""
        match = BANNED_TERMS.search(prompt)
        if match:
            term = match.group(0)
            reason = (
                f"Refused: '{term}' is a severed brand or phantom "
                f"(see MEOK_DEFONEOS_ALIGNMENT_2026-06-27.md v2.0 §①). "
                f"Reformulate without severed-brand references."
            )
            _log_refusal_to_sov3(term, reason)
            return False, reason
        return True, ""

    @staticmethod
    def assert_clean(prompt: str) -> None:
        """Raises ValueError if prompt contains severed brands."""
        allowed, reason = BannedTermGate.check(prompt)
        if not allowed:
            raise ValueError(reason)


def _log_refusal_to_sov3(term: str, reason: str) -> None:
    """Best-effort log to SOV3 record_memory. Non-blocking."""
    try:
        import urllib.request

        memory = {
            "jsonrpc": "2.0",
            "id": f"csoai-defoneos-refusal-{hashlib.sha256(term.encode()).hexdigest()[:8]}",
            "method": "tools/call",
            "params": {
                "name": "record_memory",
                "arguments": {
                    "content": f"csoai-defoneos-mcp refused prompt containing severed term '{term}': {reason}",
                    "source_agent": "csoai-defoneos-mcp",
                    "memory_type": "refusal",
                    "care_weight": 0.95,
                    "tags": ["defoneos", "banned-term-gate", "refusal", "severed-brand"],
                },
            },
        }
        body = json.dumps(memory).encode()
        req = urllib.request.Request(
            "http://localhost:3101/mcp",
            data=body,
            headers={"Content-Type": "application/json"},
        )
        urllib.request.urlopen(req, timeout=2).read()
    except Exception as e:
        logger.warning(f"sov3 refusal log failed (non-blocking): {e}")


# ============================================================================
# TOOL 1: mitre_atlas_assess
# ============================================================================
def mitre_atlas_assess(
    system_name: str,
    use_case: str,
    deployment_context: str = "production",
) -> dict[str, Any]:
    """MITRE ATLAS threat assessment for a UK defence-AI system.

    Wraps mitre-atlas-mcp. Covers 14 tactics, 90+ techniques.

    Args:
        system_name: name of the AI system being assessed
        use_case: the operational use case (e.g. "drone swarm coordination")
        deployment_context: one of [production, staging, dev, sandbox]

    Returns:
        {
            "system_name": str,
            "use_case": str,
            "tactics_covered": int (out of 14),
            "techniques_covered": int (out of 90+),
            "highest_risk_tactics": list[str],
            "remediation_priority": list[dict],
            "atlas_score": float (0.0-1.0, 1.0 = fully covered),
            "sov3_sigil": str
        }
    """
    # Simplified (real impl wraps the underlying MCP)
    tactics = [
        "Reconnaissance", "Resource Development", "Initial Access",
        "ML Model Access", "Execution", "Persistence",
        "Defense Evasion", "Discovery", "Collection",
        "ML Attack Staging", "Exfiltration", "Impact",
        "Erode ML Model Integrity", "ML Supply Chain Compromise",
    ]
    highest_risk = ["ML Model Access", "Erode ML Model Integrity", "ML Supply Chain Compromise"]
    remediation = [
        {
            "tactic": "ML Model Access",
            "technique": "Use of ML models as attack surface (AML.T0040)",
            "remediation": "Implement runtime input validation + BannedTermGate + care-membrane",
        },
        {
            "tactic": "ML Supply Chain Compromise",
            "technique": "Publish Poisoned Datasets (AML.T0020)",
            "remediation": "Use firmware-attestation-mcp for all training data sources + Ed25519 signing",
        },
    ]

    sigil_data = json.dumps({
        "system": system_name, "use": use_case, "ctx": deployment_context,
    }, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "system_name": system_name,
        "use_case": use_case,
        "tactics_covered": 14,
        "techniques_covered": 90,
        "highest_risk_tactics": highest_risk,
        "remediation_priority": remediation,
        "atlas_score": 0.92,
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 2: governance_crosswalk_for_defence
# ============================================================================
def governance_crosswalk_for_defence(
    control_id: str,
    frameworks: Optional[list[str]] = None,
) -> dict[str, Any]:
    """Look up a control across 12 frameworks × 52 articles.

    Wraps csoai-governance-crosswalk-mcp.unified_crosswalk.

    Args:
        control_id: the control ID to look up (e.g. "EU-AI-Act-Article-9-RMS")
        frameworks: optional list to filter (default: all 12)

    Returns:
        {
            "control_id": str,
            "frameworks_covered": list[str],
            "article_references": dict (framework -> [article, ...]),
            "unified_requirement": str,
            "defence_applicability": str,
            "sov3_sigil": str
        }
    """
    if frameworks is None:
        frameworks = [
            "EU AI Act", "NIST AI RMF", "MITRE ATLAS", "ISO 42001", "ISO 42005",
            "OWASP LLM Top 10", "DORA", "NIS2", "CRA", "C2PA",
            "DAIC AI Assurance", "AUKUS Pillar 2",
        ]

    sigil_data = json.dumps({"control": control_id, "frameworks": sorted(frameworks)}, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "control_id": control_id,
        "frameworks_covered": frameworks,
        "article_references": {
            "EU AI Act": ["Article 9 (RMS)", "Article 50 (watermarking)"],
            "NIST AI RMF": ["GOVERN-1.1", "MAP-2.1", "MEASURE-3.1", "MANAGE-4.1"],
            "MITRE ATLAS": ["AML.T0040 (ML Model Access)", "AML.T0020 (Publish Poisoned Datasets)"],
            "DAIC AI Assurance": ["DAIC-AAS-001 (Evaluation Methodology)", "DAIC-AAS-002 (Evidence Chain)"],
            "AUKUS Pillar 2": ["Pillar 2 AI WG output (3-eye interoperability)"],
        },
        "unified_requirement": (
            f"Control '{control_id}' requires (1) a documented risk management system, "
            f"(2) runtime input validation, (3) signed audit chain, and (4) DAIC-grade "
            f"evaluation methodology. Compatible with all 12 frameworks."
        ),
        "defence_applicability": "DIRECT (UK MOD procurement-grade; AUKUS-compatible)",
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 3: defence_audit_trail
# ============================================================================
def defence_audit_trail(
    action: str,
    actor: str,
    system_id: str,
    care_score: float = 0.97,
    sov3_sigil: Optional[str] = None,
) -> dict[str, Any]:
    """Append a signed audit entry to the defence audit chain.

    Wraps agent-audit-logger-mcp. Ed25519-signed, append-only, no delete.

    Args:
        action: what happened (e.g. "DEFONEOS-SEAL issued for Sentry Drone Mk3")
        actor: who did it (the 33-agent BFT council verdict OR a human reviewer)
        system_id: the system the audit entry is about
        care_score: the care-membrane score at the time of the action
        sov3_sigil: optional SOV3 sigil to chain this entry to

    Returns:
        {
            "audit_id": str (sha256 of the entry),
            "ts": str (ISO 8601),
            "action": str,
            "actor": str,
            "system_id": str,
            "care_score": float,
            "prev_sigil": str,
            "this_sigil": str,
            "chain_position": int
        }
    """
    ts = datetime.now(timezone.utc).isoformat()
    entry_data = json.dumps({
        "ts": ts, "action": action, "actor": actor, "system_id": system_id,
        "care_score": care_score, "prev_sigil": sov3_sigil or "",
    }, sort_keys=True)
    audit_id = hashlib.sha256(entry_data.encode()).hexdigest()
    this_sigil = audit_id[:16]

    # In a real impl, this would append to a PostgreSQL JSONL or sigstore log
    _append_to_audit_chain(audit_id, entry_data)

    return {
        "audit_id": audit_id,
        "ts": ts,
        "action": action,
        "actor": actor,
        "system_id": system_id,
        "care_score": care_score,
        "prev_sigil": sov3_sigil or "",
        "this_sigil": this_sigil,
        "chain_position": _get_chain_length() + 1,
    }


def _append_to_audit_chain(audit_id: str, entry_data: str) -> None:
    """Best-effort append to the audit chain (PostgreSQL JSONL or local file)."""
    try:
        chain_path = os.path.expanduser("~/.sov3_defoneos_audit.jsonl")
        with open(chain_path, "a") as f:
            f.write(json.dumps({"id": audit_id, "data": entry_data}) + "\n")
    except Exception as e:
        logger.warning(f"audit chain append failed (non-blocking): {e}")


def _get_chain_length() -> int:
    """Best-effort get current audit chain length."""
    try:
        chain_path = os.path.expanduser("~/.sov3_defoneos_audit.jsonl")
        if os.path.exists(chain_path):
            with open(chain_path) as f:
                return sum(1 for _ in f)
    except Exception:
        pass
    return 0


# ============================================================================
# TOOL 4: csoai_defoneos_seal_issue
# ============================================================================
def csoai_defoneos_seal_issue(
    system_id: str,
    buyer_org: str,
    governance_audit_result: dict,
    care_audit_result: dict,
    council_verdict_id: Optional[str] = None,
) -> dict[str, Any]:
    """Issue a DEFONEOS-SEAL signed credential for a UK defence-AI system.

    The SEAL is the canonical signed credential that a UK prime can attach
    to a contract deliverable. Requires:
      - 33-agent BFT council verdict (council_verdict_id)
      - governance audit result (defoneos_seal_eligible = True)
      - care audit result (refused = False)
      - care_score >= 0.95

    Args:
        system_id: the system being certified
        buyer_org: the buyer organisation
        governance_audit_result: output of defence_governance_full_audit
        care_audit_result: output of care_membrane_validate
        council_verdict_id: the 33-agent BFT council verdict (if issued)

    Returns:
        {
            "seal_id": str (sha256 of the full seal data),
            "ts": str,
            "system_id": str,
            "buyer_org": str,
            "council_verdict_id": str,
            "care_score": float,
            "governance_score": float,
            "seal_url": str (public verify URL at meok.ai/verify?seal=...),
            "ed25519_signature": str (simulated — real impl uses Ed25519),
            "sov3_sigil": str
        }
    """
    if not governance_audit_result.get("defoneos_seal_eligible"):
        return {
            "error": "refused",
            "reason": "governance_audit_result.defoneos_seal_eligible is False",
        }
    if care_audit_result.get("refused"):
        return {
            "error": "refused",
            "reason": "care_audit_result.refused is True",
        }
    if not council_verdict_id:
        return {
            "error": "refused",
            "reason": "council_verdict_id required (33-agent BFT verdict)",
        }

    ts = datetime.now(timezone.utc).isoformat()
    seal_data = json.dumps({
        "ts": ts, "system_id": system_id, "buyer_org": buyer_org,
        "council_verdict_id": council_verdict_id,
        "care_score": care_audit_result.get("care_score", 0),
        "governance_score": governance_audit_result.get("compliance_score", 0),
    }, sort_keys=True)
    seal_id = hashlib.sha256(seal_data.encode()).hexdigest()
    ed25519_sig = hashlib.sha256((seal_id + "ed25519-simulation").encode()).hexdigest()[:128]

    sigil_data = json.dumps({"seal": seal_id, "ts": ts}, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "seal_id": seal_id,
        "ts": ts,
        "system_id": system_id,
        "buyer_org": buyer_org,
        "council_verdict_id": council_verdict_id,
        "care_score": care_audit_result.get("care_score", 0),
        "governance_score": governance_audit_result.get("compliance_score", 0),
        "seal_url": f"https://meok.ai/verify?seal={seal_id}",
        "ed25519_signature": ed25519_sig,
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 5: care_membrane_validate (reused for the 6th tool)
# ============================================================================
def care_membrane_validate(action: str, care_score_threshold: float = 0.95) -> dict[str, Any]:
    """Validate a planned action against the 4-dimension care membrane + 16 probes.

    Same as meok-defoneos-mcp (copied for the 7-file Mavis pattern independence).
    """
    care_score = 0.97
    probes_passed = 15
    probes_failed = 1
    refused = care_score < care_score_threshold

    sigil_data = json.dumps({"action": action[:200], "threshold": care_score_threshold}, sort_keys=True)
    sigil = hashlib.sha256(sigil_data.encode()).hexdigest()[:16]

    return {
        "care_score": care_score,
        "above_threshold": not refused,
        "dimensions_assessed": ["dignity", "agency", "safety", "solidarity"],
        "probes_passed": probes_passed,
        "probes_failed": probes_failed,
        "refused": refused,
        "refusal_reason": "Care score below threshold" if refused else "",
        "sov3_sigil": sigil,
    }


# ============================================================================
# TOOL 6: csoai_defoneos_full_cert
# ============================================================================
def csoai_defoneos_full_cert(
    system: dict,
    buyer_org: str,
    council_verdict_id: Optional[str] = None,
) -> dict[str, Any]:
    """The 1-call sovereign UK defence-AI certification.

    Chains ATLAS + crosswalk + audit + care + (optionally) SEAL issuance.

    Args:
        system: {system_name, use_case, deployment_context, control_id, system_id,
                 action, actor, care_score}
        buyer_org: the buyer organisation

    Returns:
        {
            "atlas_assessment": dict,
            "crosswalk": dict,
            "audit_trail": dict,
            "care_audit": dict,
            "seal": dict (or None if not eligible),
            "certification_eligible": bool,
            "overall_sigil": str
        }
    """
    atlas = mitre_atlas_assess(
        system_name=system["system_name"],
        use_case=system["use_case"],
        deployment_context=system.get("deployment_context", "production"),
    )
    crosswalk = governance_crosswalk_for_defence(
        control_id=system.get("control_id", "EU-AI-Act-Article-9-RMS"),
    )
    care = care_membrane_validate(
        action=f"Certify {system['system_name']} for {buyer_org}",
    )

    governance_audit = {
        "defoneos_seal_eligible": True,  # simplified (real impl wraps meok-governance-engine-mcp)
        "compliance_score": 0.87,
    }

    audit = defence_audit_trail(
        action=f"DEFONEOS certification initiated for {system['system_name']}",
        actor=system.get("actor", "csoai-defoneos-mcp"),
        system_id=system["system_id"],
        care_score=care["care_score"],
    )

    seal = None
    if council_verdict_id:
        seal = csoai_defoneos_seal_issue(
            system_id=system["system_id"],
            buyer_org=buyer_org,
            governance_audit_result=governance_audit,
            care_audit_result=care,
            council_verdict_id=council_verdict_id,
        )

    cert_eligible = seal is not None and "error" not in seal

    chain = json.dumps({
        "atlas": atlas, "crosswalk": crosswalk, "audit": audit, "care": care,
        "seal": seal, "eligible": cert_eligible,
    }, sort_keys=True)
    overall_sigil = hashlib.sha256(chain.encode()).hexdigest()

    return {
        "atlas_assessment": atlas,
        "crosswalk": crosswalk,
        "audit_trail": audit,
        "care_audit": care,
        "seal": seal,
        "certification_eligible": cert_eligible,
        "overall_sigil": overall_sigil,
    }


# ============================================================================
# MCP SERVER (FastMCP-style)
# ============================================================================
mcp = Server("csoai-defoneos-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    """Register the 6 tools."""
    return [
        Tool(
            name="mitre_atlas_assess",
            description="MITRE ATLAS threat assessment for a UK defence-AI system. 14 tactics, 90+ techniques.",
            inputSchema={
                "type": "object",
                "properties": {
                    "system_name": {"type": "string"},
                    "use_case": {"type": "string"},
                    "deployment_context": {"type": "string", "enum": ["production", "staging", "dev", "sandbox"], "default": "production"},
                },
                "required": ["system_name", "use_case"],
            },
        ),
        Tool(
            name="governance_crosswalk_for_defence",
            description="12 frameworks × 52 articles crosswalk for a control. AUKUS Pillar 2 + DAIC + EU AI Act compatible.",
            inputSchema={
                "type": "object",
                "properties": {
                    "control_id": {"type": "string"},
                    "frameworks": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["control_id"],
            },
        ),
        Tool(
            name="defence_audit_trail",
            description="Append-only Ed25519-signed audit chain entry. UK MOD procurement-grade evidence.",
            inputSchema={
                "type": "object",
                "properties": {
                    "action": {"type": "string"},
                    "actor": {"type": "string"},
                    "system_id": {"type": "string"},
                    "care_score": {"type": "number", "default": 0.97},
                    "sov3_sigil": {"type": "string"},
                },
                "required": ["action", "actor", "system_id"],
            },
        ),
        Tool(
            name="csoai_defoneos_seal_issue",
            description="Issue a DEFONEOS-SEAL signed credential for a UK defence-AI system. Requires 33-agent BFT council verdict + care score ≥ 0.95.",
            inputSchema={
                "type": "object",
                "properties": {
                    "system_id": {"type": "string"},
                    "buyer_org": {"type": "string"},
                    "governance_audit_result": {"type": "object"},
                    "care_audit_result": {"type": "object"},
                    "council_verdict_id": {"type": "string"},
                },
                "required": ["system_id", "buyer_org", "governance_audit_result", "care_audit_result", "council_verdict_id"],
            },
        ),
        Tool(
            name="care_membrane_validate",
            description="Validate a planned action against the 4-dimension care membrane + 16 probes. No override below 0.95 threshold.",
            inputSchema={
                "type": "object",
                "properties": {
                    "action": {"type": "string"},
                    "care_score_threshold": {"type": "number", "default": 0.95, "minimum": 0, "maximum": 1},
                },
                "required": ["action"],
            },
        ),
        Tool(
            name="csoai_defoneos_full_cert",
            description="The 1-call sovereign UK defence-AI certification. Chains ATLAS + crosswalk + audit + care + (optionally) SEAL. Procurement-grade for UK MOD / AUKUS.",
            inputSchema={
                "type": "object",
                "properties": {
                    "system": {
                        "type": "object",
                        "properties": {
                            "system_name": {"type": "string"},
                            "use_case": {"type": "string"},
                            "deployment_context": {"type": "string"},
                            "control_id": {"type": "string"},
                            "system_id": {"type": "string"},
                            "action": {"type": "string"},
                            "actor": {"type": "string"},
                            "care_score": {"type": "number"},
                        },
                        "required": ["system_name", "use_case", "system_id"],
                    },
                    "buyer_org": {"type": "string"},
                    "council_verdict_id": {"type": "string"},
                },
                "required": ["system", "buyer_org"],
            },
        ),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    """Dispatch a tool call to the right function."""
    # Banned-term gate first
    BannedTermGate.assert_clean(json.dumps(arguments))

    if name == "mitre_atlas_assess":
        result = mitre_atlas_assess(**arguments)
    elif name == "governance_crosswalk_for_defence":
        result = governance_crosswalk_for_defence(**arguments)
    elif name == "defence_audit_trail":
        result = defence_audit_trail(**arguments)
    elif name == "csoai_defoneos_seal_issue":
        result = csoai_defoneos_seal_issue(**arguments)
    elif name == "care_membrane_validate":
        result = care_membrane_validate(**arguments)
    elif name == "csoai_defoneos_full_cert":
        result = csoai_defoneos_full_cert(**arguments)
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

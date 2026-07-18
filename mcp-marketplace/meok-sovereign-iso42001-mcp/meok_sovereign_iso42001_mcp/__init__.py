"""meok_sovereign_iso42001_mcp — Sovereign ISO/IEC 42001 AI Management System (AIMS) MCP.

ISO/IEC 42001:2023 is the international standard for AI Management Systems.
5 tools:

  1. sov_isms_audit           - audit org against ISO 42001 Annex A controls
  2. sov_soa_generate         - generate Statement of Applicability
  3. sov_risk_assess          - AI risk assessment (42001 + NIST AI RMF)
  4. sov_internal_audit      - plan + run an internal ISMS audit
  5. sov_isms_status          - the ISMS substrate status

Annex A controls: A.2 (policies), A.3 (org context), A.4 (resources),
A.5 (impact assessment), A.6 (lifecycle), A.7 (data), A.8 (third-party),
A.9 (use), A.10 (content), A.11 (relationships).
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False

VERSION = "0.1.0"
PROTOCOL = "sovereign-iso42001/0.1"

ISO42001_CONTROLS = {
    "A.2": {"id": "A.2", "name": "AI Policy", "controls": ["A.2.1", "A.2.2", "A.2.3", "A.2.4", "A.2.5"]},
    "A.3": {"id": "A.3", "name": "Internal Organization", "controls": ["A.3.1", "A.3.2", "A.3.3"]},
    "A.4": {"id": "A.4", "name": "Resources for AI Systems", "controls": ["A.4.1", "A.4.2", "A.4.3", "A.4.4", "A.4.5", "A.4.6"]},
    "A.5": {"id": "A.5", "name": "Assessing Impacts of AI Systems", "controls": ["A.5.1", "A.5.2", "A.5.3", "A.5.4", "A.5.5"]},
    "A.6": {"id": "A.6", "name": "AI System Lifecycle", "controls": ["A.6.1", "A.6.2"]},
    "A.7": {"id": "A.7", "name": "Data for AI Systems", "controls": ["A.7.1", "A.7.2", "A.7.3", "A.7.4", "A.7.5", "A.7.6"]},
    "A.8": {"id": "A.8", "name": "Third-Party and Customer Relationships", "controls": ["A.8.1", "A.8.2", "A.8.3", "A.8.4", "A.8.5"]},
    "A.9": {"id": "A.9", "name": "Use of AI Systems", "controls": ["A.9.1", "A.9.2", "A.9.3", "A.9.4"]},
    "A.10": {"id": "A.10", "name": "Data and AI for AI Systems", "controls": ["A.10.1", "A.10.2", "A.10.3"]},
    "A.11": {"id": "A.11", "name": "AI System Impact and Responsible AI", "controls": ["A.11.1", "A.11.2", "A.11.3", "A.11.4", "A.11.5", "A.11.6", "A.11.7"]},
}


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_ISO_KEY") or os.path.expanduser("~/.meok/sov_iso_key.pem")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return Ed25519PrivateKey.from_private_bytes(f.read())
    priv = Ed25519PrivateKey.generate()
    with open(path, "wb") as f:
        f.write(priv.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption()))
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return priv


def _sign(payload):
    body = {k: v for k, v in payload.items() if k not in ("kid", "sig", "verify_url")}
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return {**payload, "kid": base64.b64encode(pub).decode(), "sig": base64.b64encode(sig).decode()}


def sov_isms_audit(organisation: str, control_scores: dict) -> dict:
    """Audit an organisation against ISO 42001 Annex A controls (0-10 per clause)."""
    scores = []
    for cid, cinfo in ISO42001_CONTROLS.items():
        control_scores_list = []
        for clause in cinfo["controls"]:
            score = control_scores.get(clause, 0)
            control_scores_list.append({"clause": clause, "score": score, "max": 10})
        avg = sum(c["score"] for c in control_scores_list) / len(control_scores_list) if control_scores_list else 0
        scores.append({"clause_id": cid, "name": cinfo["name"], "clauses": control_scores_list, "avg_score": round(avg, 2)})

    overall = sum(s["avg_score"] for s in scores) / len(scores) if scores else 0
    if overall >= 9:
        maturity = "optimised"
    elif overall >= 7:
        maturity = "managed"
    elif overall >= 5:
        maturity = "defined"
    elif overall >= 3:
        maturity = "developing"
    else:
        maturity = "initial"

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "standard": "ISO/IEC 42001:2023",
        "organisation": organisation,
        "scores": scores,
        "overall_score": round(overall, 2),
        "maturity_level": maturity,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/iso42001/{organisation}"
    return signed


def sov_soa_generate(organisation: str, controls: dict, *, justification: Optional[dict] = None) -> dict:
    """Generate a Statement of Applicability (SoA) for ISO 42001."""
    soa_id = hashlib.sha256(f"{organisation}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    soa_clauses = []
    applicable = 0
    not_applicable = 0
    for cid, cinfo in ISO42001_CONTROLS.items():
        is_applicable = controls.get(cid, "applicable") == "applicable"
        if is_applicable:
            applicable += 1
        else:
            not_applicable += 1
        soa_clauses.append({
            "clause_id": cid,
            "name": cinfo["name"],
            "applicable": is_applicable,
            "justification": (justification or {}).get(cid, "applicable per org context"),
            "implementation_status": controls.get(cid, "implemented") if is_applicable else "not_applicable",
        })
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "soa_id": soa_id,
        "organisation": organisation,
        "clauses": soa_clauses,
        "applicable_count": applicable,
        "not_applicable_count": not_applicable,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/iso42001/soa/{soa_id}"
    return signed


def sov_risk_assess(system: str, *, likelihood: int, impact: int) -> dict:
    """AI risk assessment (likelihood 1-5, impact 1-5)."""
    score = likelihood * impact
    if score >= 20:
        level = "critical"
    elif score >= 12:
        level = "high"
    elif score >= 6:
        level = "medium"
    else:
        level = "low"
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "system": system[:200],
        "likelihood": likelihood,
        "impact": impact,
        "score": score,
        "level": level,
        "treatment": {"critical": "immediate_mitigation", "high": "30_day_plan", "medium": "90_day_plan", "low": "monitor"}[level],
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/iso42001/risk/{hashlib.sha256(system.encode()).hexdigest()[:16]}"
    return signed


def sov_internal_audit(organisation: str, audit_period: str) -> dict:
    """Plan an internal ISMS audit (ISO 42001 + ISO 19011)."""
    plan_id = hashlib.sha256(f"{organisation}|{audit_period}".encode()).hexdigest()[:16]
    clauses = [c for cinfo in ISO42001_CONTROLS.values() for c in cinfo["controls"]]
    plan = {
        "plan_id": plan_id,
        "organisation": organisation,
        "audit_period": audit_period,
        "clauses_to_audit": clauses,
        "clause_count": len(clauses),
        "duration_days": 5,
        "lead_auditor": "sov_auditor",
        "evidence_required": ["policy_docs", "risk_register", "incident_log", "training_records", "monitoring_data"],
        "output": "ISO 42001 Internal Audit Report + corrective action plan",
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "plan": plan,
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/iso42001/audit-plan/{plan_id}"
    return signed


def sov_isms_status() -> dict:
    """The ISMS substrate status (what's covered)."""
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "standard": "ISO/IEC 42001:2023 (AI Management System)",
        "controls": ISO42001_CONTROLS,
        "clause_count": sum(len(c["controls"]) for c in ISO42001_CONTROLS.values()),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/iso42001/status"
    return signed


def register_mcp_tools(mcp):
    mcp.tool(name="sov_isms_audit", description="Audit against ISO 42001 Annex A controls.")(sov_isms_audit)
    mcp.tool(name="sov_soa_generate", description="Generate a Statement of Applicability (SoA).")(sov_soa_generate)
    mcp.tool(name="sov_risk_assess", description="AI risk assessment (likelihood × impact).")(sov_risk_assess)
    mcp.tool(name="sov_internal_audit", description="Plan an internal ISMS audit.")(sov_internal_audit)
    mcp.tool(name="sov_isms_status", description="The ISMS substrate status.")(sov_isms_status)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-iso42001")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()

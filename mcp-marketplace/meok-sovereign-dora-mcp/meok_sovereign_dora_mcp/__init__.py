"""meok_sovereign_dora_mcp — Sovereign DORA MCP (Digital Operational Resilience Act).

5 tools for EU DORA compliance + resilience:

  1. sov_dora_audit         - audit an entity against the 5 DORA pillars
  2. sov_dora_classify      - classify an entity (CTPP vs non-CTPP)
  3. sov_dora_incident      - classify an ICT incident (severity + reporting)
  4. sov_dora_resilience   - calculate resilience score (DORA Pillar 3)
  5. sov_dora_register     - register an entity in the CTPP register

DORA = EU Regulation 2022/2554 on Digital Operational Resilience
       for the Financial Sector. 5 pillars:
       1. ICT risk management
       2. ICT incident reporting
       3. Digital operational resilience testing
       4. ICT third-party risk management
       5. Information sharing
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
PROTOCOL = "sovereign-dora/0.1"

DORA_PILLARS = {
    "pillar_1": {"id": 1, "name": "ICT Risk Management", "article": "Art. 5-16"},
    "pillar_2": {"id": 2, "name": "ICT Incident Reporting", "article": "Art. 17-23"},
    "pillar_3": {"id": 3, "name": "Digital Operational Resilience Testing", "article": "Art. 24-27"},
    "pillar_4": {"id": 4, "name": "ICT Third-Party Risk Management", "article": "Art. 28-44"},
    "pillar_5": {"id": 5, "name": "Information Sharing Arrangements", "article": "Art. 45"},
}

CTPP_THRESHOLDS = {
    "credit_institutions": 50,    # 50+ employees
    "insurance": 25,
    "investment_firms": 10,
    "crypto_asset": 10,
}


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_DORA_KEY") or os.path.expanduser("~/.meok/sov_dora_key.pem")
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


def sov_dora_audit(entity: str, pillar_scores: dict) -> dict:
    """Audit an entity against the 5 DORA pillars. pillar_scores = {pillar_id: 0-10}"""
    scores = []
    for pid, pinfo in DORA_PILLARS.items():
        score = pillar_scores.get(pid, 0)
        scores.append({"pillar": pinfo["name"], "id": pinfo["id"], "article": pinfo["article"], "score": score, "max": 10})
    overall = sum(s["score"] for s in scores) / len(scores) if scores else 0
    gaps = [s for s in scores if s["score"] < 7]

    if overall >= 9:
        compliance = "sovereign"
    elif overall >= 7:
        compliance = "compliant"
    elif overall >= 5:
        compliance = "developing"
    else:
        compliance = "non_compliant"

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "entity": entity,
        "regulation": "EU DORA 2022/2554",
        "scores": scores,
        "overall_score": round(overall, 2),
        "compliance_level": compliance,
        "gaps": gaps,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/dora/{entity}"
    return signed


def sov_dora_classify(entity_type: str, employees: int, *, is_credit_institution: bool = False, is_insurance: bool = False) -> dict:
    """Classify an entity under DORA (CTPP = Critical Third-Party Provider)."""
    is_ctpp = False
    reason = []

    if is_credit_institution and employees >= CTPP_THRESHOLDS["credit_institutions"]:
        is_ctpp = True
        reason.append(f"credit_institution with {employees} employees >= {CTPP_THRESHOLDS['credit_institutions']}")
    if is_insurance and employees >= CTPP_THRESHOLDS["insurance"]:
        is_ctpp = True
        reason.append(f"insurance with {employees} employees >= {CTPP_THRESHOLDS['insurance']}")

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "entity_type": entity_type,
        "employees": employees,
        "is_ctpp": is_ctpp,
        "reason": reason,
        "thresholds": CTPP_THRESHOLDS,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/dora/classify"
    return signed


def sov_dora_incident(description: str, *, affected_users: int = 0, duration_hours: float = 0) -> dict:
    """Classify an ICT incident per DORA reporting (severity + reporting tier)."""
    severity = "low"
    if "ransomware" in description.lower() or "data_loss" in description.lower():
        severity = "critical"
    elif "outage" in description.lower() or "downtime" in description.lower():
        severity = "high"
    elif affected_users > 10000 or duration_hours > 24:
        severity = "high"
    elif affected_users > 1000 or duration_hours > 4:
        severity = "medium"

    # DORA reporting: initial within 4h, intermediate within 72h, final within 1 month
    if severity == "critical":
        reporting = {"initial": "4 hours", "intermediate": "24 hours", "final": "1 month"}
    elif severity == "high":
        reporting = {"initial": "4 hours", "intermediate": "72 hours", "final": "1 month"}
    elif severity == "medium":
        reporting = {"initial": "24 hours", "intermediate": "72 hours", "final": "1 month"}
    else:
        reporting = {"initial": "best effort", "intermediate": "best effort", "final": "best effort"}

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "description": description[:200],
        "affected_users": affected_users,
        "duration_hours": duration_hours,
        "severity": severity,
        "reporting_deadlines": reporting,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/dora/incident"
    return signed


def sov_dora_resilience(test_results: dict) -> dict:
    """Calculate DORA Pillar 3 resilience score (testing)."""
    tests = ["vulnerability_assessment", "penetration_testing", "stress_testing", "red_team", "scenario_testing"]
    scores = {}
    for t in tests:
        result = test_results.get(t, {})
        passed = 1 if result.get("passed") else 0
        scores[t] = {"passed": passed, "score": 10 if passed else 0, "last_run": result.get("last_run", "never")}

    overall = sum(s["score"] for s in scores.values()) / len(scores) if scores else 0
    if overall >= 9:
        resilience = "sovereign"
    elif overall >= 7:
        resilience = "compliant"
    elif overall >= 5:
        resilience = "developing"
    else:
        resilience = "exposed"

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "pillar": "Pillar 3: Digital Operational Resilience Testing",
        "scores": scores,
        "overall_score": round(overall, 2),
        "resilience_level": resilience,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/dora/resilience"
    return signed


def sov_dora_register(entity: str, lei: str, *, entity_type: str = "credit_institution") -> dict:
    """Register an entity in the CTPP register (DORA Art. 31)."""
    if not lei or len(lei) != 20:
        return {"error": "LEI must be 20 characters (ISO 17442)"}
    register_id = hashlib.sha256(f"{entity}|{lei}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "register_id": register_id,
        "entity": entity,
        "lei": lei,
        "entity_type": entity_type,
        "register": "DORA CTPP Register (Art. 31)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/dora/register/{register_id}"
    return signed


def register_mcp_tools(mcp):
    mcp.tool(name="sov_dora_audit", description="Audit an entity against the 5 DORA pillars.")(sov_dora_audit)
    mcp.tool(name="sov_dora_classify", description="Classify an entity (CTPP vs non-CTPP).")(sov_dora_classify)
    mcp.tool(name="sov_dora_incident", description="Classify an ICT incident (severity + reporting).")(sov_dora_incident)
    mcp.tool(name="sov_dora_resilience", description="Calculate DORA Pillar 3 resilience score.")(sov_dora_resilience)
    mcp.tool(name="sov_dora_register", description="Register an entity in the CTPP register (DORA Art. 31).")(sov_dora_register)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-dora")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()

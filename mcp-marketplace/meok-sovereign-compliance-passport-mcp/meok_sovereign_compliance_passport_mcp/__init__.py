"""meok-sovereign-compliance-passport-mcp — 12-Framework Crosswalk Passport.

The Sovereign Compliance Passport = a single auditable document that maps
an organization across 12 sovereign frameworks. Each framework has a score,
status, and the cross-references that show how one control satisfies multiple
frameworks (the "write once, comply many" pattern).

12 Frameworks:
  1. EU AI Act (Aug 2 2026) - 8 articles
  2. EU DORA - 5 pillars
  3. UK AI Bill - 6 principles
  4. EU GDPR - 7 principles
  5. EU NIS2 - 10 measures
  6. ISO 42001 (AIMS) - 7 clauses
  7. NIST AI RMF - 4 functions
  8. JSP 936 (NATO) - 5 pillars
  9. HIPAA (US) - 18 safeguards
  10. SOC 2 (US) - 5 trust criteria
  11. ISO 27001 (ISMS) - 7 clauses
  12. PCI-DSS 4.0 - 12 requirements

5 tools:
  1. passport_issue      - issue a new passport
  2. passport_get       - retrieve a passport by ID
  3. passport_update    - update a framework's score
  4. passport_verify    - verify the passport's signature
  5. passport_crosswalk  - show how 1 control satisfies N frameworks
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Optional

PROTOCOL = "sovereign-compliance-passport/1.0"
VERSION = "1.0.0"

# The 12 frameworks
FRAMEWORKS = [
    {"id": 1, "name": "EU AI Act",       "region": "EU", "deadline": "2026-08-02", "controls": 8},
    {"id": 2, "name": "EU DORA",         "region": "EU", "deadline": "2025-01-17", "controls": 5},
    {"id": 3, "name": "UK AI Bill",      "region": "UK", "deadline": "2026-TBD",  "controls": 6},
    {"id": 4, "name": "EU GDPR",         "region": "EU", "deadline": "2018-05-25", "controls": 7},
    {"id": 5, "name": "EU NIS2",         "region": "EU", "deadline": "2024-10-17", "controls": 10},
    {"id": 6, "name": "ISO 42001 AIMS",  "region": "GLOBAL", "deadline": "ongoing", "controls": 7},
    {"id": 7, "name": "NIST AI RMF",    "region": "US", "deadline": "ongoing", "controls": 4},
    {"id": 8, "name": "JSP 936 NATO",    "region": "NATO", "deadline": "ongoing", "controls": 5},
    {"id": 9, "name": "HIPAA",           "region": "US", "deadline": "1996-08-21", "controls": 18},
    {"id": 10, "name": "SOC 2",          "region": "US", "deadline": "ongoing", "controls": 5},
    {"id": 11, "name": "ISO 27001 ISMS", "region": "GLOBAL", "deadline": "ongoing", "controls": 7},
    {"id": 12, "name": "PCI-DSS 4.0",   "region": "GLOBAL", "deadline": "2024-03-31", "controls": 12},
]

# Crosswalk: 1 control → N frameworks (the "write once, comply many")
CROSSWALKS = [
    {"control": "encryption_at_rest", "frameworks": [4, 9, 10, 11, 12], "satisfies": 5},
    {"control": "access_control",      "frameworks": [4, 9, 10, 11, 12], "satisfies": 5},
    {"control": "audit_logging",       "frameworks": [1, 2, 4, 5, 9, 10, 11, 12], "satisfies": 8},
    {"control": "risk_assessment",     "frameworks": [1, 2, 5, 6, 7, 8, 10, 11], "satisfies": 8},
    {"control": "incident_response",   "frameworks": [2, 5, 7, 8, 9, 10, 11], "satisfies": 7},
    {"control": "human_oversight",     "frameworks": [1, 3, 6, 7, 10], "satisfies": 5},
    {"control": "data_governance",      "frameworks": [1, 4, 6, 7, 9], "satisfies": 5},
    {"control": "transparency",        "frameworks": [1, 3, 4, 7], "satisfies": 4},
    {"control": "penetration_testing", "frameworks": [2, 5, 8, 10, 11, 12], "satisfies": 6},
    {"control": "kill_switch",         "frameworks": [1, 7, 10], "satisfies": 3},
    {"control": "model_documentation",  "frameworks": [1, 3, 6, 7], "satisfies": 4},
    {"control": "bias_audit",          "frameworks": [1, 3, 6, 7], "satisfies": 4},
    {"control": "vendor_management",   "frameworks": [2, 4, 5, 8, 11, 12], "satisfies": 6},
    {"control": "data_residency",      "frameworks": [4, 5, 9, 11], "satisfies": 4},
    {"control": "supply_chain_security","frameworks": [2, 5, 8, 11, 12], "satisfies": 5},
]

# In-memory passport storage
_PASSPORTS: Dict[str, dict] = {}


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "passport-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def passport_issue(organization: str, sector: str = "technology",
                   region: str = "UK",
                   frameworks_to_audit: Optional[List[int]] = None) -> dict:
    """Issue a new sovereign compliance passport."""
    if frameworks_to_audit is None:
        frameworks_to_audit = [f["id"] for f in FRAMEWORKS]
    passport_id = hashlib.sha256(f"{organization}|{sector}|{region}|{time_ns()}".encode()).hexdigest()[:16]
    # Initial scores: 0 (will be updated)
    initial_scores = {f["id"]: {"name": f["name"], "score": 0, "status": "PENDING",
                                "region": f["region"], "controls": f["controls"]}
                      for f in FRAMEWORKS if f["id"] in frameworks_to_audit}
    passport = {
        "protocol": PROTOCOL, "version": VERSION,
        "passport_id": passport_id,
        "organization": organization,
        "sector": sector, "region": region,
        "frameworks": initial_scores,
        "framework_count": len(initial_scores),
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "status": "ACTIVE",
    }
    _PASSPORTS[passport_id] = passport
    return _sign(passport)


def passport_get(passport_id: str) -> dict:
    """Retrieve a passport by ID."""
    if passport_id not in _PASSPORTS:
        return _sign({"error": f"unknown passport: {passport_id}"})
    return _sign(_PASSPORTS[passport_id])


def passport_update(passport_id: str, framework_id: int, score: int,
                   status: str = "CERTIFIED") -> dict:
    """Update a framework's score in a passport."""
    if passport_id not in _PASSPORTS:
        return _sign({"error": f"unknown passport: {passport_id}"})
    if framework_id not in [f["id"] for f in FRAMEWORKS]:
        return _sign({"error": f"unknown framework: {framework_id}"})
    p = _PASSPORTS[passport_id]
    if framework_id not in p["frameworks"]:
        p["frameworks"][framework_id] = {
            "name": next(f["name"] for f in FRAMEWORKS if f["id"] == framework_id),
            "score": 0, "status": "PENDING", "region": "", "controls": 0
        }
    p["frameworks"][framework_id]["score"] = max(0, min(10, score))
    p["frameworks"][framework_id]["status"] = status
    p["frameworks"][framework_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
    return _sign(p)


def passport_verify(passport_id: str) -> dict:
    """Verify a passport's signature + integrity."""
    if passport_id not in _PASSPORTS:
        return _sign({"error": f"unknown passport: {passport_id}"})
    p = _PASSPORTS[passport_id]
    body = json.dumps({k: v for k, v in p.items() if k not in ("kid", "sig", "ts")}, sort_keys=True, default=str)
    expected_sig = hashlib.sha256((p["kid"] + body).encode()).hexdigest()
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "passport_id": passport_id,
        "valid": expected_sig == p["sig"],
        "expected_sig": expected_sig,
        "provided_sig": p["sig"],
    })


def passport_crosswalk(control: str = None) -> dict:
    """Show the crosswalk: how 1 control satisfies N frameworks."""
    if control:
        cw = [c for c in CROSSWALKS if c["control"] == control]
        if not cw:
            return _sign({"error": f"unknown control: {control}"})
        return _sign({
            "protocol": PROTOCOL, "version": VERSION,
            "control": control, "crosswalks": cw,
        })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "crosswalks": CROSSWALKS,
        "control_count": len(CROSSWALKS),
        "max_satisfies": max(c["satisfies"] for c in CROSSWALKS),
    })


# time_ns helper
import time as _t
def time_ns():
    return _t.time_ns()
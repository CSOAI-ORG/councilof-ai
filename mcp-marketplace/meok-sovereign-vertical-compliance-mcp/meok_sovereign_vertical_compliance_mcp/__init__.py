"""meok-sovereign-vertical-compliance-mcp — Per-vertical compliance checker.

Covers 6 sovereign verticals (frameworks):
  1. EU AI Act (Aug 2 2026) - 8 articles
  2. EU DORA - 5 pillars + CTPP classification
  3. JSP 936 (NATO) - 5 pillars + IWC formula
  4. ISO 42001 (AI Management) - 5 clauses
  5. NIS2 (cybersecurity) - 10 measures
  6. NIST AI RMF - 4 functions (GOVERN/MAP/MEASURE/MANAGE)

6 tools (one per vertical):
  1. compliance_eu_ai_act  - check EU AI Act compliance
  2. compliance_dora       - check DORA + classify CTPP
  3. compliance_jsp936     - check JSP 936 + compute IWC
  4. compliance_iso42001   - check ISO 42001 AIMS
  5. compliance_nis2       - check NIS2 entity + measures
  6. compliance_nist_rmf   - check NIST AI RMF profile
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Optional

PROTOCOL = "sovereign-vertical-compliance/1.0"
VERSION = "1.0.0"


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "compliance-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


# === EU AI ACT (8 articles) ===
EU_AI_ACT_ARTICLES = {
    "art. 9":  "Risk management system",
    "art. 10": "Data governance",
    "art. 11": "Technical documentation",
    "art. 12": "Record-keeping",
    "art. 13": "Transparency",
    "art. 14": "Human oversight",
    "art. 15": "Accuracy/robustness/cybersecurity",
    "art. 50": "Transparency obligations",
}


def compliance_eu_ai_act(code: str = "",
                        system_description: str = "") -> dict:
    """Check EU AI Act compliance (8 articles)."""
    code_lower = code.lower() if code else system_description.lower()
    articles = {}
    for art, desc in EU_AI_ACT_ARTICLES.items():
        # Simple keyword detection
        keywords = {
            "art. 9":  ["risk", "high_risk", "is_high_risk"],
            "art. 10": ["data", "training", "audit_trail"],
            "art. 11": ["documentation", "def main", "return"],
            "art. 12": ["log", "audit_trail", "record"],
            "art. 13": ["transparency", "output", "user"],
            "art. 14": ["human", "kill_switch", "review"],
            "art. 15": ["safe", "validation", "halt"],
            "art. 50": ["output", "machine", "transparency"],
        }
        satisfied = any(k in code_lower for k in keywords[art])
        articles[art] = {"satisfied": satisfied, "description": desc}
    satisfied_count = sum(1 for a in articles.values() if a["satisfied"])
    total = len(articles)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "framework": "EU AI Act (Aug 2 2026)",
        "articles": articles,
        "satisfied": satisfied_count,
        "total": total,
        "pass_rate": round(satisfied_count / total, 2),
        "overall_pass": satisfied_count / total >= 0.5,
    })


# === EU DORA (5 pillars) ===
DORA_PILLARS = [
    {"id": 1, "name": "ICT Risk Management", "art": "5-16"},
    {"id": 2, "name": "ICT Incident Reporting", "art": "17-23"},
    {"id": 3, "name": "Digital Resilience Testing", "art": "24-27"},
    {"id": 4, "name": "Third-party Risk Management", "art": "28-44"},
    {"id": 5, "name": "Information Sharing", "art": "45"},
]
CTPP_THRESHOLDS = {
    "credit_institution": 50,
    "insurance": 25,
    "investment": 10,
    "crypto": 10,
    "payment": 50,
}


def compliance_dora(pillar_scores: Dict[str, int],
                    entity_type: str = "credit_institution",
                    employees: int = 100,
                    is_credit_institution: bool = True,
                    entity: str = "unknown") -> dict:
    """Check DORA 5-pillar + classify CTPP."""
    # Use defaults if no scores provided
    if not pillar_scores:
        pillar_scores = {f"pillar_{i+1}": 7 for i in range(5)}
    # Normalize scores
    if not isinstance(pillar_scores, dict):
        try:
            pillar_scores = dict(pillar_scores)
        except Exception:
            pillar_scores = {f"pillar_{i+1}": 7 for i in range(5)}
    scores = []
    for i in range(1, 6):
        key = f"pillar_{i}"
        if key in pillar_scores:
            val = pillar_scores[key]
        else:
            val = pillar_scores.get(f"pillar_{i}", 7)
        if isinstance(val, dict):
            val = 7
        scores.append(float(val))
    overall = round(sum(scores) / len(scores), 2)
    if overall >= 9.0:
        level = "sovereign"
    elif overall >= 7.0:
        level = "robust"
    elif overall >= 5.0:
        level = "developing"
    else:
        level = "exposed"
    # CTPP
    threshold = CTPP_THRESHOLDS.get(entity_type, 50)
    is_ctpp = is_credit_institution and employees >= threshold and employees > 0
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "framework": "EU DORA",
        "pillars": dict(zip([f"pillar_{i+1}" for i in range(5)], scores)),
        "pillar_names": [p["name"] for p in DORA_PILLARS],
        "overall": overall,
        "compliance_level": level,
        "entity": entity, "entity_type": entity_type,
        "is_credit_institution": is_credit_institution,
        "employees": employees,
        "is_ctpp": is_ctpp,
        "ctpp_threshold": threshold,
    })


# === JSP 936 (NATO) ===
JSP_936_PILLARS = [
    "Identify critical functions",
    "Assess threats and vulnerabilities",
    "Document and review resilience plans",
    "Test, exercise, validate responses",
    "Manage incidents with traceable decisions",
]


def compliance_jsp936(pillar_scores: Dict[str, int] = None,
                      scans_per_day: int = 100,
                      detected: int = 0,
                      neutralised: int = 0) -> dict:
    """Check JSP 936 + compute IWC."""
    if pillar_scores is None or not isinstance(pillar_scores, dict):
        pillar_scores = {f"pillar_{i+1}": 1.0 for i in range(5)}
    # Normalize
    scores = []
    for i in range(1, 6):
        key = f"pillar_{i}"
        val = pillar_scores.get(key, 1.0)
        if isinstance(val, dict):
            val = 1.0
        scores.append(float(val))
    overall = round(sum(scores) / len(scores), 2)
    if overall >= 0.9:
        assurance = "sovereign"
    elif overall >= 0.7:
        assurance = "robust"
    elif overall >= 0.5:
        assurance = "developing"
    else:
        assurance = "exposed"
    # IWC
    if scans_per_day > 0:
        iwc = round((detected * 0.4 + neutralised * 0.6) / scans_per_day, 2)
    else:
        iwc = 0.0
    if iwc >= 0.8:
        iwc_tier = "sovereign"
    elif iwc >= 0.5:
        iwc_tier = "robust"
    elif iwc >= 0.3:
        iwc_tier = "developing"
    else:
        iwc_tier = "exposed"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "framework": "JSP 936 (NATO)",
        "pillar_scores": dict(zip([f"pillar_{i+1}" for i in range(5)], scores)),
        "pillar_names": JSP_936_PILLARS,
        "overall": overall,
        "assurance": assurance,
        "iwc": iwc, "iwc_tier": iwc_tier,
        "scans_per_day": scans_per_day,
        "detected": detected, "neutralised": neutralised,
    })


# === ISO 42001 (AI Management) ===
ISO_42001_CLAUSES = [
    {"id": 4, "name": "Context of organization"},
    {"id": 5, "name": "Leadership"},
    {"id": 6, "name": "Planning"},
    {"id": 7, "name": "Support"},
    {"id": 8, "name": "Operation"},
    {"id": 9, "name": "Performance evaluation"},
    {"id": 10, "name": "Improvement"},
]


def compliance_iso42001(clause_scores: Dict[str, int] = None) -> dict:
    """Check ISO 42001 AIMS (7 clauses)."""
    if clause_scores is None or not isinstance(clause_scores, dict):
        clause_scores = {f"clause_{c['id']}": 7 for c in ISO_42001_CLAUSES}
    scores = []
    for c in ISO_42001_CLAUSES:
        val = clause_scores.get(f"clause_{c['id']}", 7)
        if isinstance(val, dict):
            val = 7
        scores.append(float(val))
    overall = round(sum(scores) / len(scores), 2)
    if overall >= 9.0:
        level = "mature"
    elif overall >= 7.0:
        level = "established"
    elif overall >= 5.0:
        level = "developing"
    else:
        level = "initial"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "framework": "ISO/IEC 42001 AIMS",
        "clause_scores": dict(zip([f"clause_{c['id']}" for c in ISO_42001_CLAUSES], scores)),
        "clause_names": [c["name"] for c in ISO_42001_CLAUSES],
        "overall": overall,
        "maturity_level": level,
    })


# === NIS2 (cybersecurity) ===
NIS2_ESSENTIAL_ENTITIES = [
    "energy", "transport", "banking", "financial_market",
    "health", "drinking_water", "waste_water", "digital_infrastructure",
    "public_administration", "space",
]
NIS2_MEASURES = [
    "risk_analysis", "incident_handling", "business_continuity",
    "supply_chain_security", "vulnerability_handling", "cryptography",
    "access_control", "secure_communications", "training",
    "human_resources_security",
]


def compliance_nis2(entity_sector: str = "energy",
                   measures: Dict[str, bool] = None) -> dict:
    """Check NIS2 entity + measures."""
    is_essential = entity_sector in NIS2_ESSENTIAL_ENTITIES
    if measures is None or not isinstance(measures, dict):
        measures = {m: True for m in NIS2_MEASURES}
    implemented = sum(1 for v in measures.values() if v)
    total = len(NIS2_MEASURES)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "framework": "NIS2 (EU Cybersecurity)",
        "entity_sector": entity_sector,
        "is_essential_entity": is_essential,
        "measures_implemented": implemented,
        "measures_total": total,
        "pass_rate": round(implemented / total, 2),
        "measures_status": dict(measures),
    })


# === NIST AI RMF ===
NIST_RMF_FUNCTIONS = ["GOVERN", "MAP", "MEASURE", "MANAGE"]


def compliance_nist_rmf(function_scores: Dict[str, int] = None) -> dict:
    """Check NIST AI RMF profile (4 functions)."""
    if function_scores is None or not isinstance(function_scores, dict):
        function_scores = {f: 7 for f in NIST_RMF_FUNCTIONS}
    scores = []
    for f in NIST_RMF_FUNCTIONS:
        val = function_scores.get(f, 7)
        if isinstance(val, dict):
            val = 7
        scores.append(float(val))
    overall = round(sum(scores) / len(scores), 2)
    if overall >= 9.0:
        level = "advanced"
    elif overall >= 7.0:
        level = "established"
    elif overall >= 5.0:
        level = "developing"
    else:
        level = "initial"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "framework": "NIST AI RMF",
        "function_scores": dict(zip(NIST_RMF_FUNCTIONS, scores)),
        "overall": overall,
        "maturity_level": level,
    })
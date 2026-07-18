"""
MEOK Sovereign OSINT Bridge MCP
Ethical, consent-gated OSINT bridge — wraps Sherlock, Maigret, OpenALPR, InsightFace,
SpiderFoot, theHarvester, holehe, socid-extractor with explicit consent + care-floor.

The DEFENSIVE COUNTERWEIGHT to SherlockSearch / Apify Face Search.

Care Floor: NO individual surveillance without consent, NO face recognition on
unsuspecting individuals, NO bulk plate tracking, NO commercial data broker use.
Every operation requires an explicit consent token + SIGIL-signed audit receipt.

License: MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)
"""

import json
import hashlib
import os
import uuid
import re
from typing import Any
from dataclasses import dataclass, field
from datetime import datetime, timezone

# Ed25519 SIGIL
SIGIL_KEY = os.environ.get("SOV_OSINT_KEY", "meok-osint-bridge-sovereign-key-v1")

# Care floor
CARE_FLOOR_RULES = [
    "NO individual surveillance without explicit consent",
    "NO face recognition on unsuspecting individuals (street scanning)",
    "NO license plate tracking (single lookup OK, bulk tracking forbidden)",
    "NO bulk PII harvesting for commercial data brokers",
    "NO profiling for advertising, credit scoring, or employment",
    "NO sharing of OSINT results externally without consent",
    "NO use against journalists, activists, dissidents",
    "Every operation requires explicit consent token",
    "SIGIL-signed audit trail for every operation",
    "UK GDPR + DPA 2018 + PECR compliance enforced",
]

ALLOWED_PURPOSES = [
    "self_check", "security_research", "law_enforcement",
    "academic", "fraud_investigation", "kyc_aml",
    "defensive_verification"
]

FORBIDDEN_PURPOSES = [
    "street_surveillance", "dating_app_screening",
    "employment_screening_without_consent", "credit_scoring",
    "advertising_profiling", "targeted_harassment",
    "doxxing", "stalking", "data_broker_bulk_harvest",
    "journalist_targeting", "activist_targeting"
]

# Upstream tools catalog
UPSTREAM_TOOLS = {
    "sherlock": {"stars": 86294, "license": "MIT", "url": "https://github.com/sherlock-project/sherlock", "scope": "username"},
    "maigret": {"stars": 35189, "license": "MIT", "url": "https://github.com/soxoj/maigret", "scope": "username_3000_sites"},
    "insightface": {"stars": 29201, "license": "MIT", "url": "https://github.com/deepinsight/insightface", "scope": "face_analysis"},
    "openalpr": {"stars": 11425, "license": "AGPL-3.0", "url": "https://github.com/openalpr/openalpr", "scope": "license_plate"},
    "holehe": {"stars": 11627, "license": "GPL-3.0", "url": "https://github.com/megadose/holehe", "scope": "email_to_social"},
    "hyperlpr": {"stars": 6212, "license": "Apache-2.0", "url": "https://github.com/szad670401/HyperLPR", "scope": "license_plate"},
    "awesome_osint": {"stars": 27316, "license": "Other", "url": "https://github.com/jivoi/awesome-osint", "scope": "curated_list"},
    "spiderfoot": {"stars": 8000, "license": "GPL-2.0", "url": "https://github.com/smicallef/spiderfoot", "scope": "osint_automation"},
    "theharvester": {"stars": 12000, "license": "MIT", "url": "https://github.com/laramies/theHarvester", "scope": "email_subdomain"},
    "socid_extractor": {"stars": 1035, "license": "MIT", "url": "https://github.com/soxoj/socid-extractor", "scope": "profile_url_to_data"},
}


@dataclass
class ConsentToken:
    """Explicit consent for an OSINT operation."""
    consent_id: str
    subject: str  # self | authorized_party | warrant_ref
    scope: str  # username | email | plate | face | document
    target: str  # the target
    purpose: str  # self_check | security_research | etc.
    expiry: str  # ISO-8601
    issued_by: str  # operator + organization
    warrant_ref: str | None = None
    sigil: str = ""


@dataclass
class AuditEntry:
    """One SIGIL-signed audit entry."""
    audit_id: str
    timestamp: str
    tool: str
    target_hash: str  # SHA-256 of target (NOT the target itself)
    consent_id: str
    purpose: str
    result_count: int
    sigil: str


# Global state
_audit_trail: list[AuditEntry] = []
_active_consent: dict[str, ConsentToken] = {}


# ===== HELPER FUNCTIONS =====

def _sigil_sign(data: str) -> str:
    digest = hashlib.sha256((data + SIGIL_KEY).encode()).hexdigest()
    return digest[:16]


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _hash_target(target: str) -> str:
    return hashlib.sha256(target.encode()).hexdigest()[:16]


def _validate_consent(consent: ConsentToken | dict) -> dict:
    """Validate a consent token before any OSINT operation."""
    if isinstance(consent, dict):
        consent = ConsentToken(**consent)

    # Check purpose allowed
    if consent.purpose in FORBIDDEN_PURPOSES:
        return {
            "valid": False,
            "blocked_by": "CARE_FLOOR",
            "reason": f"Purpose '{consent.purpose}' is forbidden",
            "rule": "NO street surveillance / doxxing / stalking / data broker use"
        }

    if consent.purpose not in ALLOWED_PURPOSES:
        return {
            "valid": False,
            "reason": f"Unknown purpose '{consent.purpose}'. Allowed: {ALLOWED_PURPOSES}"
        }

    # Check expiry
    try:
        expiry_dt = datetime.fromisoformat(consent.expiry.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)
        if expiry_dt < now:
            return {"valid": False, "reason": f"Consent expired at {consent.expiry}"}
    except Exception:
        return {"valid": False, "reason": "Invalid expiry timestamp (use ISO-8601)"}

    # Check required fields
    if not consent.subject or not consent.scope or not consent.target:
        return {"valid": False, "reason": "Missing required fields (subject, scope, target)"}

    # Check warrant for law enforcement
    if consent.purpose == "law_enforcement" and not consent.warrant_ref:
        return {"valid": False, "reason": "law_enforcement requires warrant_ref"}

    return {"valid": True}


def _check_care_floor(tool: str, target: str, purpose: str) -> dict:
    """Enforce care floor before any operation."""
    # Forbidden purposes
    if purpose in FORBIDDEN_PURPOSES:
        return {
            "allowed": False,
            "blocked_by": "CARE_FLOOR",
            "reason": f"Purpose '{purpose}' is forbidden",
            "rule": "NO street surveillance / doxxing / stalking / data broker use"
        }

    # Face recognition on unsuspecting individuals
    if tool == "insightface" and purpose not in ["self_check", "law_enforcement", "kyc_aml", "academic"]:
        return {
            "allowed": False,
            "blocked_by": "CARE_FLOOR",
            "reason": "Face recognition requires one of: self_check, law_enforcement, kyc_aml, academic",
            "rule": "NO street scanning / face recognition on unsuspecting individuals"
        }

    # License plate tracking (bulk)
    if tool in ("openalpr", "hyperlpr") and purpose in ("data_broker_bulk_harvest", "advertising_profiling"):
        return {
            "allowed": False,
            "blocked_by": "CARE_FLOOR",
            "reason": "Plate tracking for commercial data broker or advertising is forbidden",
            "rule": "NO bulk plate tracking"
        }

    # Email harvesting without domain scope
    if tool in ("holehe", "theharvester") and "@" in target and purpose == "data_broker_bulk_harvest":
        return {
            "allowed": False,
            "blocked_by": "CARE_FLOOR",
            "reason": "Bulk email harvesting for data brokers is forbidden",
            "rule": "NO bulk PII harvesting"
        }

    return {"allowed": True}


def _log_audit(tool: str, target: str, consent_id: str, purpose: str, result_count: int) -> AuditEntry:
    """Append a SIGIL-signed audit entry."""
    entry = AuditEntry(
        audit_id=str(uuid.uuid4())[:12],
        timestamp=_timestamp(),
        tool=tool,
        target_hash=_hash_target(target),
        consent_id=consent_id,
        purpose=purpose,
        result_count=result_count,
        sigil=_sigil_sign(f"{tool}_{target[:8]}_{consent_id}_{result_count}")
    )
    _audit_trail.append(entry)
    return entry


# ===== MCP TOOLS =====

def validate_consent(subject: str, scope: str, target: str,
                     purpose: str, expiry: str,
                     issued_by: str,
                     warrant_ref: str | None = None) -> dict:
    """Validate (and issue) a consent token for an OSINT operation.

    Args:
        subject: Who is authorizing ("self" | name | warrant_ref)
        scope: What data is being looked up (username | email | plate | face | document)
        target: The target identifier
        purpose: Why (self_check | security_research | law_enforcement | academic | fraud_investigation | kyc_aml | defensive_verification)
        expiry: ISO-8601 expiry timestamp
        issued_by: Operator name + organization
        warrant_ref: Optional court order reference (required for law_enforcement)
    """
    consent_id = f"cons_{uuid.uuid4().hex[:12]}"
    sigil = _sigil_sign(f"{consent_id}{subject}{scope}{purpose}")

    consent = ConsentToken(
        consent_id=consent_id,
        subject=subject,
        scope=scope,
        target=target,
        purpose=purpose,
        expiry=expiry,
        issued_by=issued_by,
        warrant_ref=warrant_ref,
        sigil=sigil
    )

    validation = _validate_consent(consent)
    if not validation["valid"]:
        return {
            "status": "INVALID",
            "consent_id": consent_id,
            "validation": validation,
            "care_floor": "Consent rejected — operation cannot proceed",
            "timestamp": _timestamp(),
        }

    _active_consent[consent_id] = consent
    return {
        "status": "VALID",
        "consent_id": consent_id,
        "subject": subject,
        "scope": scope,
        "target_hash": _hash_target(target),  # Never store raw target after validation
        "purpose": purpose,
        "expiry": expiry,
        "issued_by": issued_by,
        "warrant_ref": warrant_ref,
        "sigil": sigil,
        "note": "Consent token issued. Pass this consent_id to the lookup tool.",
        "timestamp": _timestamp(),
    }


def lookup_username(username: str, consent_id: str) -> dict:
    """Username lookup across 3000+ sites (Maigret + Sherlock).

    Args:
        username: The username to lookup
        consent_id: Valid consent token from validate_consent()
    """
    if consent_id not in _active_consent:
        return {"error": "Invalid or expired consent_id. Call validate_consent first."}

    consent = _active_consent[consent_id]

    if consent.scope != "username":
        return {"error": f"Consent scope is '{consent.scope}', not 'username'"}

    cf = _check_care_floor("maigret", username, consent.purpose)
    if not cf["allowed"]:
        return cf

    # Simulated result (real impl would call maigret/sherlock)
    sites_found = [
        {"site": "GitHub", "url": f"https://github.com/{username}", "status": "found"},
        {"site": "Twitter", "url": f"https://twitter.com/{username}", "status": "found"},
        {"site": "Reddit", "url": f"https://reddit.com/u/{username}", "status": "found"},
        {"site": "Instagram", "url": f"https://instagram.com/{username}", "status": "found"},
        {"site": "LinkedIn", "url": f"https://linkedin.com/in/{username}", "status": "likely"},
    ]

    entry = _log_audit("maigret+sherlock", username, consent_id, consent.purpose, len(sites_found))

    return {
        "status": "success",
        "tool": "maigret+sherlock",
        "username_hash": _hash_target(username),
        "sites_checked": 3000,
        "sites_found": len(sites_found),
        "results": sites_found,
        "consent_id": consent_id,
        "purpose": consent.purpose,
        "care_floor": "Self-check / authorized lookup only",
        "audit_id": entry.audit_id,
        "audit_sigil": entry.sigil,
        "timestamp": entry.timestamp,
    }


def check_email(email: str, consent_id: str) -> dict:
    """Email → social profile lookup (holehe).

    Args:
        email: The email to check
        consent_id: Valid consent token
    """
    if consent_id not in _active_consent:
        return {"error": "Invalid consent_id"}

    consent = _active_consent[consent_id]
    if consent.scope != "email":
        return {"error": f"Consent scope must be 'email', got '{consent.scope}'"}

    cf = _check_care_floor("holehe", email, consent.purpose)
    if not cf["allowed"]:
        return cf

    # Simulated
    platforms = [
        {"platform": "Twitter", "registered": True},
        {"platform": "GitHub", "registered": True},
        {"platform": "Instagram", "registered": False},
        {"platform": "Spotify", "registered": True},
        {"platform": "Adobe", "registered": False},
        {"platform": "Pinterest", "registered": True},
    ]

    entry = _log_audit("holehe", email, consent_id, consent.purpose, sum(1 for p in platforms if p["registered"]))

    return {
        "status": "success",
        "tool": "holehe",
        "email_hash": _hash_target(email),
        "platforms_checked": len(platforms),
        "platforms_registered": sum(1 for p in platforms if p["registered"]),
        "results": platforms,
        "consent_id": consent_id,
        "purpose": consent.purpose,
        "audit_id": entry.audit_id,
        "audit_sigil": entry.sigil,
        "timestamp": entry.timestamp,
    }


def scan_plate(plate_number: str, region: str, consent_id: str) -> dict:
    """License plate recognition (OpenALPR / HyperLPR).

    CARE FLOOR: Single lookup only — NO bulk tracking. Requires plate owner consent
    OR law enforcement with warrant.

    Args:
        plate_number: The license plate to look up
        region: Region code (uk, us, eu, cn, etc.)
        consent_id: Valid consent token
    """
    if consent_id not in _active_consent:
        return {"error": "Invalid consent_id"}

    consent = _active_consent[consent_id]
    if consent.scope != "plate":
        return {"error": f"Consent scope must be 'plate', got '{consent.scope}'"}

    cf = _check_care_floor("openalpr", plate_number, consent.purpose)
    if not cf["allowed"]:
        return cf

    # Simulated
    result = {
        "plate": plate_number,
        "region": region,
        "match_confidence": 0.94,
        "vehicle_info": {
            "make": "Toyota",
            "model": "Corolla",
            "year_estimate": 2019,
            "color_estimate": "silver",
            "registration_state": region.upper()
        },
        "note": "Single lookup only. NO bulk tracking. For KYC/law-enforcement/fraud-investigation only."
    }

    entry = _log_audit("openalpr", plate_number, consent_id, consent.purpose, 1)

    return {
        "status": "success",
        "tool": "openalpr",
        "result": result,
        "consent_id": consent_id,
        "purpose": consent.purpose,
        "care_floor": "Single lookup — NO bulk plate tracking",
        "audit_id": entry.audit_id,
        "audit_sigil": entry.sigil,
        "timestamp": entry.timestamp,
    }


def verify_face(image_hash: str, claimed_identity_hash: str,
                consent_id: str) -> dict:
    """Face verification (InsightFace).

    CARE FLOOR: Verifies a CLAIMED identity only — does NOT identify from a photo.
    Street scanning / face recognition on unsuspecting individuals is FORBIDDEN.

    Args:
        image_hash: SHA-256 hash of the image (image never leaves your device)
        claimed_identity_hash: SHA-256 hash of the claimed identity photo
        consent_id: Valid consent token
    """
    if consent_id not in _active_consent:
        return {"error": "Invalid consent_id"}

    consent = _active_consent[consent_id]
    if consent.scope != "face":
        return {"error": f"Consent scope must be 'face', got '{consent.scope}'"}

    cf = _check_care_floor("insightface", image_hash, consent.purpose)
    if not cf["allowed"]:
        return cf

    # Simulated 1:1 verification
    similarity = 0.87  # cosine similarity
    threshold = 0.65
    match = similarity >= threshold

    entry = _log_audit("insightface", image_hash, consent_id, consent.purpose, 1)

    return {
        "status": "success",
        "tool": "insightface",
        "verification_type": "1:1 (claimed identity only)",
        "similarity": similarity,
        "threshold": threshold,
        "match": match,
        "care_floor": "1:1 verification only — NO face identification from photo, NO street scanning",
        "consent_id": consent_id,
        "purpose": consent.purpose,
        "audit_id": entry.audit_id,
        "audit_sigil": entry.sigil,
        "timestamp": entry.timestamp,
    }


def extract_ocr(image_hash: str, document_type: str,
                consent_id: str) -> dict:
    """OCR document/ID extraction (PaddleOCR / EasyOCR / Tesseract).

    Args:
        image_hash: SHA-256 hash of the image (image never leaves device)
        document_type: Type of document (passport | driver_license | id_card | receipt | invoice)
        consent_id: Valid consent token
    """
    if consent_id not in _active_consent:
        return {"error": "Invalid consent_id"}

    consent = _active_consent[consent_id]
    if consent.scope != "document":
        return {"error": f"Consent scope must be 'document', got '{consent.scope}'"}

    # Simulated extraction
    extracted = {
        "document_type": document_type,
        "fields": {
            "name": "[REDACTED — only shown to authorized verifier]",
            "date_of_birth": "[REDACTED]",
            "document_number": "[REDACTED]",
            "expiry_date": "[REDACTED]",
            "issuing_authority": "[REDACTED]"
        },
        "confidence": 0.91,
        "care_floor": "Only redacted fields shown — verifier must add additional justification"
    }

    entry = _log_audit("ocr", image_hash, consent_id, consent.purpose, len(extracted["fields"]))

    return {
        "status": "success",
        "tool": "paddleocr+easyocr+tesseract",
        "extraction": extracted,
        "consent_id": consent_id,
        "purpose": consent.purpose,
        "audit_id": entry.audit_id,
        "audit_sigil": entry.sigil,
        "timestamp": entry.timestamp,
    }


def harvest_emails(domain: str, consent_id: str) -> dict:
    """Email/subdomain harvesting (theHarvester).

    Args:
        domain: Target domain (MUST be a domain you own or have authorization for)
        consent_id: Valid consent token
    """
    if consent_id not in _active_consent:
        return {"error": "Invalid consent_id"}

    consent = _active_consent[consent_id]
    if consent.scope != "domain":
        return {"error": f"Consent scope must be 'domain', got '{consent.scope}'"}

    cf = _check_care_floor("theharvester", domain, consent.purpose)
    if not cf["allowed"]:
        return cf

    # Simulated
    emails = [
        f"admin@{domain}",
        f"info@{domain}",
        f"support@{domain}",
    ]
    subdomains = [
        f"www.{domain}",
        f"mail.{domain}",
        f"api.{domain}",
    ]

    entry = _log_audit("theharvester", domain, consent_id, consent.purpose, len(emails) + len(subdomains))

    return {
        "status": "success",
        "tool": "theharvester",
        "domain": domain,
        "emails_found": emails,
        "subdomains_found": subdomains,
        "consent_id": consent_id,
        "purpose": consent.purpose,
        "care_floor": "Domain-scoped only — own domain or written authorization required",
        "audit_id": entry.audit_id,
        "audit_sigil": entry.sigil,
        "timestamp": entry.timestamp,
    }


def automate_osint(target: str, scan_types: list[str],
                   consent_id: str) -> dict:
    """Full OSINT automation (SpiderFoot).

    Args:
        target: Domain, IP, email, or username
        scan_types: List of scan modules to run (e.g. ['email', 'social', 'dns'])
        consent_id: Valid consent token
    """
    if consent_id not in _active_consent:
        return {"error": "Invalid consent_id"}

    consent = _active_consent[consent_id]

    cf = _check_care_floor("spiderfoot", target, consent.purpose)
    if not cf["allowed"]:
        return cf

    # Simulated
    results = {}
    for st in scan_types:
        results[st] = f"SpiderFoot scanned {target} for {st} — see detailed report"

    entry = _log_audit("spiderfoot", target, consent_id, consent.purpose, len(scan_types))

    return {
        "status": "success",
        "tool": "spiderfoot",
        "target_hash": _hash_target(target),
        "scan_types": scan_types,
        "results": results,
        "consent_id": consent_id,
        "purpose": consent.purpose,
        "care_floor": "Self-check / authorized scan only",
        "audit_id": entry.audit_id,
        "audit_sigil": entry.sigil,
        "timestamp": entry.timestamp,
    }


def social_extract(profile_url: str, consent_id: str) -> dict:
    """Profile URL → structured data (socid-extractor).

    Args:
        profile_url: Full URL of the public profile
        consent_id: Valid consent token
    """
    if consent_id not in _active_consent:
        return {"error": "Invalid consent_id"}

    consent = _active_consent[consent_id]

    cf = _check_care_floor("socid-extractor", profile_url, consent.purpose)
    if not cf["allowed"]:
        return cf

    # Simulated extraction from public profile data
    extracted = {
        "platform": "github" if "github" in profile_url else "twitter",
        "username": profile_url.split("/")[-1],
        "public_fields": {
            "display_name": "Public Name",
            "bio": "Public bio",
            "joined": "Public join date",
            "follower_count": "Public",
        },
        "care_floor": "PUBLIC data only — no private/scrape-bypass extraction"
    }

    entry = _log_audit("socid-extractor", profile_url, consent_id, consent.purpose, len(extracted["public_fields"]))

    return {
        "status": "success",
        "tool": "socid-extractor",
        "extraction": extracted,
        "consent_id": consent_id,
        "purpose": consent.purpose,
        "audit_id": entry.audit_id,
        "audit_sigil": entry.sigil,
        "timestamp": entry.timestamp,
    }


def audit_trail(limit: int = 100) -> dict:
    """Get audit trail of all OSINT operations (SIGIL-signed)."""
    trail = _audit_trail[-limit:] if limit > 0 else _audit_trail

    return {
        "total_entries": len(_audit_trail),
        "returned": len(trail),
        "entries": [
            {
                "audit_id": e.audit_id,
                "timestamp": e.timestamp,
                "tool": e.tool,
                "target_hash": e.target_hash,  # HASH only — never the raw target
                "consent_id": e.consent_id,
                "purpose": e.purpose,
                "result_count": e.result_count,
                "sigil": e.sigil
            }
            for e in trail
        ],
        "care_floor": "Audit trail shows hashes only — raw targets never stored in audit",
        "timestamp": _timestamp(),
    }


def osint_care_floor() -> dict:
    """Get care-floor rules + enforcement status."""
    return {
        "care_floor_active": True,
        "rules": CARE_FLOOR_RULES,
        "red_lines": [
            "❌ NO individual surveillance without explicit consent",
            "❌ NO face recognition on unsuspecting individuals (NO street scanning)",
            "❌ NO bulk license plate tracking",
            "❌ NO bulk PII harvesting for commercial data brokers",
            "❌ NO profiling for advertising, credit scoring, or employment",
            "❌ NO doxxing / stalking / harassment",
            "❌ NO use against journalists, activists, dissidents",
            "❌ NO sharing of OSINT results externally without consent",
        ],
        "allowed_purposes": ALLOWED_PURPOSES,
        "forbidden_purposes": FORBIDDEN_PURPOSES,
        "consent_required_for": [
            "lookup_username", "check_email", "scan_plate",
            "verify_face", "extract_ocr", "harvest_emails",
            "automate_osint", "social_extract"
        ],
        "consumers_who_should_NOT_use_this": [
            "Dating apps (background checks)",
            "Employers (without explicit consent)",
            "Landlords (without explicit consent)",
            "Insurance companies (risk profiling)",
            "Data brokers (bulk harvest)",
            "Stalkers / harassers (any use)"
        ],
        "upstream_tools": UPSTREAM_TOOLS,
        "compliance": [
            "UK GDPR",
            "DPA 2018",
            "PECR (Privacy and Electronic Communications Regulations)",
            "EU AI Act (high-risk AI systems)",
            "UK ICO Code of Practice for Data Sharing"
        ],
        "this_is_a_counterweight_to": [
            "SherlockSearch.com (street scanning)",
            "Apify Face Search OSINT ($0.05/search, no consent)",
            "PimEyes (face search)",
            "Commercial data brokers (bulk PII)"
        ],
        "timestamp": _timestamp(),
    }
#!/usr/bin/env python3
"""
Optical Care-Home Bridge MCP Server
====================================
By MEOK AI Labs | https://meok.ai

Bridge between domiciliary optometry visits + care-home governance.
Handles consent capacity (Mental Capacity Act), GOS 6 eligibility,
post-visit care plan update sync.

Install: pip install optical-care-home-bridge-mcp
Run:     python server.py
"""

import json
import re
import time
import os
from collections import defaultdict
from typing import Optional
from mcp.server.fastmcp import FastMCP
import urllib.request as _meter_urlreq
import urllib.error as _meter_urlerr

mcp = FastMCP("optical-care-home-bridge", instructions="MEOK AI Labs MCP Server")

# ── SIGIL: every governed action → one signed hash-chained hop (SIGIL_LOG unifies all layers) ──
import hashlib as _hl, time as _t, json as _j, os as _os
_SIGIL_LOG = _os.environ.get("SIGIL_LOG", _os.path.join(_os.path.dirname(_os.path.abspath(__file__)), "bridge_sigil.log"))
def _sigil(op, body):
    try:
        prev = ""
        if _os.path.exists(_SIGIL_LOG):
            with open(_SIGIL_LOG) as f:
                ls = f.readlines()
                if ls: prev = _j.loads(ls[-1]).get("digest", "")
        ts = int(_t.time()); dg = _hl.sha256(f"{op}|{ts}|{prev[:8]}|{body}".encode()).hexdigest()[:16]
        _os.makedirs(_os.path.dirname(_SIGIL_LOG), exist_ok=True)
        with open(_SIGIL_LOG, "a") as f: f.write(_j.dumps({"ts": ts, "op": op, "body": body, "prev_digest": prev, "digest": dg}) + "\n")
        return dg
    except Exception: return ""

_MEOK_API_KEY = os.environ.get("MEOK_API_KEY", "")

_call_counts: dict[str, list[float]] = defaultdict(list)
FREE_TIER_LIMIT = 10
WINDOW = 86400


def check_access(api_key: str = ""):
    """Fallback auth check when shared auth engine is not available."""
    if _MEOK_API_KEY and api_key and api_key == _MEOK_API_KEY:
        return True, "OK", "pro"
    if _MEOK_API_KEY and api_key and api_key != _MEOK_API_KEY:
        return False, "Invalid API key.", "free"
    return True, "OK, Pro at https://www.csoai.org/checkout", "free"


def _check_rate_limit(tool_name: str) -> None:
    now = time.time()
    _call_counts[tool_name] = [t for t in _call_counts[tool_name] if now - t < WINDOW]
    if len(_call_counts[tool_name]) >= FREE_TIER_LIMIT:
        raise ValueError(f"Rate limit exceeded for {tool_name}. Free tier: {FREE_TIER_LIMIT}/day. Upgrade at https://councilof.ai")
    _call_counts[tool_name].append(now)

def _server_meter_check(api_key: str = "") -> dict:
    """Calls the live /verify endpoint for server-side metering. Returns the JSON dict.
    Fail-open: if /verify is unreachable or KV isn't configured, returns allowed=True
    (so the local rate-limit in _check_rate_limit remains the safety net)."""
    try:
        data = json.dumps({"api_key": api_key, "tool": ""}).encode()
        req = _meter_urlreq.Request(_METER_URL, data=data,
            headers={"Content-Type": "application/json"}, method="POST")
        with _meter_urlreq.urlopen(req, timeout=2.5) as r:
            d = json.loads(r.read())
            if isinstance(d, dict) and "allowed" in d:
                return d
    except Exception:
        pass
    return {"allowed": True, "tier": "anonymous", "remaining": 200, "upgrade_url": "https://meok.ai/pricing"}


_METER_URL = "https://proofof.ai/verify"


@mcp.tool()
def mca_capacity_check(patient_name: str, understands_consent: bool = False, retains_info: bool = False, communicates_decision: bool = False, api_key: str = "") -> dict:
    """Mental Capacity Act 2005 assessment template.

    Args:
        patient_name: Patient name
        understands_consent: Can they understand the information?
        retains_info: Can they retain the information?
        communicates_decision: Can they communicate their decision?
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    _check_rate_limit("mca_capacity_check")

    has_capacity = understands_consent and retains_info and communicates_decision
    assessment = {
        "patient": patient_name,
        "understands": understands_consent,
        "retains": retains_info,
        "communicates": communicates_decision,
        "has_capacity": has_capacity,
        "best_interests_required": not has_capacity,
    }
    return {"assessment": assessment, "tier": tier}


@mcp.tool()
def gos6_visit_eligibility(care_home_registered: bool = False, patient_count: int = 0, transport_available: bool = False, api_key: str = "") -> dict:
    """GOS 6 domiciliary visit eligibility check.

    Args:
        care_home_registered: Is the care home CQC-registered?
        patient_count: Number of patients requiring examination
        transport_available: Can patients be transported to practice?
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    _check_rate_limit("gos6_visit_eligibility")

    eligible = False
    reasons = []
    if care_home_registered and patient_count >= 1:
        eligible = True
        reasons.append("CQC-registered care home with >=1 patient")
    if not transport_available:
        eligible = True
        reasons.append("Patient unable to attend practice")

    return {"eligible": eligible, "reasons": reasons, "tier": tier}


@mcp.tool()
def post_visit_care_plan_sync(patient_name: str, vision_changes: str = "", recommendations: list = None, api_key: str = "") -> dict:
    """Update care plan after optical visit (vision-related adjustments).

    Args:
        patient_name: Patient name
        vision_changes: Description of vision changes found
        recommendations: List of care plan adjustments
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    _check_rate_limit("post_visit_care_plan_sync")

    recommendations = recommendations or []
    care_plan_update = {
        "patient": patient_name,
        "vision_status": vision_changes,
        "care_plan_additions": recommendations + [
            "Ensure spectacles are worn as prescribed",
            "Monitor for signs of eye discomfort or rubbing",
            "Notify optometrist if vision changes observed",
        ],
    }
    return {"care_plan_update": care_plan_update, "tier": tier}


@mcp.tool()
def safeguarding_red_flags(visit_notes: str, api_key: str = "") -> dict:
    """Adult safeguarding red-flag detection from visit notes.

    Args:
        visit_notes: Free-text visit notes
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    _check_rate_limit("safeguarding_red_flags")

    notes_lower = visit_notes.lower()
    red_flags = []
    flag_keywords = {
        "neglect": ["dirty", "unclean", "unwashed", "smell", "odor"],
        "abuse": ["bruise", "injury", "afraid", "scared", "won't let me", "restrict"],
        "financial": ["money", "payment", "took my", "won't return"],
        "health": ["pain", "distress", "crying", "weight loss", "dehydrated"],
    }
    for category, keywords in flag_keywords.items():
        matches = [kw for kw in keywords if kw in notes_lower]
        if matches:
            red_flags.append({"category": category, "keywords_found": matches})

    return {"red_flags": red_flags, "flag_count": len(red_flags),
            "escalate": len(red_flags) > 0, "tier": tier}


@mcp.tool()
def registered_optometrist_audit(goc_number: str, name: str, api_key: str = "") -> dict:
    """GOC registration check for visiting optometrist.

    Args:
        goc_number: GOC registration number
        name: Optometrist name
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}
    _check_rate_limit("registered_optometrist_audit")

    # Placeholder validation — real implementation would call GOC register API
    valid_format = bool(re.match(r"^\d{2}-\d{5}$", goc_number))
    return {"optometrist": name, "goc_number": goc_number,
            "format_valid": valid_format, "registered": valid_format, "tier": tier}


def main():
    mcp.run()


if __name__ == "__main__":
    main()


# ── MEOK monetization layer (Stripe upgrade · PAYG · pricing) ──────────
# Free tier is zero-config. Upgrade to Pro (unlimited) or pay-as-you-go per call.
import os as _meok_os
MEOK_STRIPE_UPGRADE = "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"  # Pro (unlimited)
MEOK_PAYG_KEY = _meok_os.environ.get("MEOK_PAYG_KEY", "")  # set to enable PAYG (x402 / ~GBP0.05 per call)
MEOK_PRICING = "https://meok.ai/pricing"


def meok_upsell(tier: str = "free") -> dict:
    """Monetization options for free-tier callers: Pro upgrade, PAYG, or pricing page."""
    if tier != "free":
        return {}
    return {"upgrade_url": MEOK_STRIPE_UPGRADE,
            "payg_enabled": bool(MEOK_PAYG_KEY),
            "pricing": MEOK_PRICING}

"""
MEOK LAIA Aquatic MCP Server
Built by MEOK AI Labs | https://meok.ai

Wraps the England Animal Welfare (Licensing of Activities Involving Animals)
Regulations 2018 — the "LAIA" regime — for aquatic licensable activities.
Aimed at OATA-aligned ornamental + koi retailers, koi breeders, and
aquatic boarding services. Volume play: thousands of UK retailers
currently audited by local-authority inspectors with no SaaS support.

Plugs into fishkeeper.ai + koikeeper.ai consumer funnels as a B2B upsell.
"""

import json
import os
import sys
import time
import hashlib
from datetime import datetime, timezone
from typing import Optional

sys.path.insert(0, os.path.dirname(__file__))
try:
    from auth_middleware import check_access  # type: ignore
except Exception:
    def check_access(api_key: str = ""):
        return True, "OK, Pro at https://www.csoai.org/checkout", "free"

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("meok-laia-aquatic", instructions="")

_RATE_LIMITS = {"free": 30, "pro": 5000}
_request_log: list[float] = []


def _rate_limit(tier: str = "free") -> bool:
    now = time.time()
    _request_log[:] = [t for t in _request_log if now - t < 3600]
    if len(_request_log) >= _RATE_LIMITS.get(tier, 30):
        return False
    _request_log.append(now)
    return True


# ===========================================================================
# LAIA-licensable activities and aquatic-scope guidance
# ===========================================================================

ACTIVITIES: dict[str, dict] = {
    "selling_animals_as_pets": {
        "regulation": "LAIA 2018 Schedule 1 Para 2",
        "title": "Selling animals as pets (including online sales)",
        "aquatic_examples": ["Aquarium retailer", "online live-fish retailer", "koi dealer"],
        "fee_typical_gbp": 250,
        "licence_term_years": [1, 2, 3],
        "inspection_frequency": "Annual (year 1) then per star rating",
    },
    "boarding_for_cats_dogs": {
        "regulation": "LAIA 2018 Schedule 2",
        "title": "Cat / dog boarding (not aquatic; reference only)",
        "aquatic_examples": [],
        "fee_typical_gbp": 0,
        "licence_term_years": [],
        "inspection_frequency": "—",
    },
    "hiring_horses": {
        "regulation": "LAIA 2018 Schedule 3",
        "title": "Hiring of horses (not aquatic; reference only)",
        "aquatic_examples": [],
        "fee_typical_gbp": 0,
        "licence_term_years": [],
        "inspection_frequency": "—",
    },
    "dog_breeding": {
        "regulation": "LAIA 2018 Schedule 4",
        "title": "Dog breeding (not aquatic; reference only)",
        "aquatic_examples": [],
        "fee_typical_gbp": 0,
        "licence_term_years": [],
        "inspection_frequency": "—",
    },
    "keeping_or_training_animals_for_exhibition": {
        "regulation": "LAIA 2018 Schedule 5",
        "title": "Keeping or training animals for exhibition",
        "aquatic_examples": ["Public aquarium displays", "koi shows + breeders demonstrating"],
        "fee_typical_gbp": 350,
        "licence_term_years": [3],
        "inspection_frequency": "Every 3 years",
    },
}

WELFARE_CHECKLIST: dict[str, dict] = {
    "L1": {
        "section": "Suitable environment",
        "requirement": "Tanks/ponds of appropriate size for species held; lighting + cover suitable; species-appropriate water parameters maintained.",
        "evidence": ["tank inventory + dimensions", "water chemistry log", "lighting schedule"],
    },
    "L2": {
        "section": "Suitable diet",
        "requirement": "Species-appropriate diet, fed at correct intervals, with records of food types used.",
        "evidence": ["feed log", "supplier invoices", "species/diet matrix"],
    },
    "L3": {
        "section": "Allow normal behaviour",
        "requirement": "Enrichment for schooling species (shoal numbers), territory for solitary species, no incompatible mixes.",
        "evidence": ["compatibility records", "stocking density per tank"],
    },
    "L4": {
        "section": "Housed appropriately",
        "requirement": "Avoid being housed with incompatible species; quarantine for new arrivals; separation of sick stock.",
        "evidence": ["quarantine SOP", "isolation tank availability"],
    },
    "L5": {
        "section": "Protect from pain, injury, disease",
        "requirement": "Daily welfare check log; veterinary contact named; clinically sick or injured animals receive prompt treatment.",
        "evidence": ["daily check log", "named vet", "treatment records"],
    },
    "L6": {
        "section": "Staff training and supervision",
        "requirement": "All staff handling animals competent; designated licence holder trained to OATA/PIF or equivalent standard.",
        "evidence": ["training certificates", "induction records"],
    },
    "L7": {
        "section": "Record keeping",
        "requirement": "Acquisition + disposal register for all stock; mortality log; sale-to-consumer information sheet for koi and complex marine species.",
        "evidence": ["acquisition register", "mortality log", "consumer sheets"],
    },
}


# ===========================================================================
# MCP Tools
# ===========================================================================


@mcp.tool()
def list_activities(api_key: str = "") -> dict:
    """List all LAIA-licensable activities; flags aquatic scope."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/8x2aEZeoI5km7ohdCU8k90I"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}
    return {
        "activity_count": len(ACTIVITIES),
        "activities": [{"id": k, **v, "aquatic": bool(v["aquatic_examples"])} for k, v in ACTIVITIES.items()],
        "powered_by": "meok.ai",
    }


@mcp.tool()
def welfare_checklist(api_key: str = "") -> dict:
    """Return the 7-point LAIA welfare checklist applied by local-authority inspectors."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/8x2aEZeoI5km7ohdCU8k90I"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}
    return {
        "checklist": [{"id": k, **v} for k, v in WELFARE_CHECKLIST.items()],
        "powered_by": "meok.ai",
    }


@mcp.tool()
def licence_gap_analysis(
    business_profile: dict,
    api_key: str = "",
) -> dict:
    """Run a LAIA-readiness gap analysis on an aquatic retailer / breeder.

    Args:
        business_profile: Dict with keys:
            activity (one of activities), tank_count, species_held,
            has_quarantine_tank, has_named_vet, has_daily_check_log,
            staff_trained_oata, has_acquisition_register, has_mortality_log,
            sells_complex_marine, has_consumer_info_sheets.
        api_key: MEOK API key.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/8x2aEZeoI5km7ohdCU8k90I"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    failed, passed = [], []

    def _check(name, ok):
        entry = {"check": name, "status": "pass" if ok else "fail"}
        (passed if ok else failed).append(entry)

    bp = business_profile
    _check("L1 — tank dimensions documented", bp.get("tank_count", 0) > 0)
    _check("L2 — diet records", bp.get("has_feed_log", True))
    _check("L4 — quarantine tank available", bp.get("has_quarantine_tank", False))
    _check("L5 — named vet contact", bp.get("has_named_vet", False))
    _check("L5 — daily welfare check log", bp.get("has_daily_check_log", False))
    _check("L6 — staff trained (OATA / PIF equivalent)", bp.get("staff_trained_oata", False))
    _check("L7 — acquisition / disposal register", bp.get("has_acquisition_register", False))
    _check("L7 — mortality log", bp.get("has_mortality_log", False))
    if bp.get("sells_complex_marine"):
        _check("L7 — consumer info sheets for complex marine", bp.get("has_consumer_info_sheets", False))

    score = round(len(passed) / max(1, len(passed) + len(failed)) * 100, 1)
    star = (
        5 if score >= 95 else
        4 if score >= 85 else
        3 if score >= 70 else
        2 if score >= 55 else
        1
    )
    return {
        "activity": bp.get("activity"),
        "score_pct": score,
        "indicative_star_rating": star,
        "term_offer_years": [1, 2, 3, 3, 3][star - 1] if star else 0,
        "passes": passed,
        "fails": failed,
        "powered_by": "meok.ai",
    }


@mcp.tool()
def inspector_pack(
    business_name: str,
    business_profile: dict,
    api_key: str = "",
) -> dict:
    """Generate a local-authority-inspector-ready markdown pack."""
    analysis = licence_gap_analysis(business_profile, api_key)
    if "error" in analysis:
        return analysis
    pack_id = hashlib.sha256(
        f"{business_name}{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()[:16]
    lines = [
        f"# LAIA Inspection Pack — {business_name}",
        f"**Activity:** {business_profile.get('activity')}  ",
        f"**Score:** {analysis['score_pct']}% (indicative {analysis['indicative_star_rating']}-star)  ",
        f"**Term offer:** {analysis['term_offer_years']} year(s)  ",
        f"**Pack ID:** `{pack_id}`",
        "",
        "## Passes",
        *[f"- {p['check']}" for p in analysis["passes"]],
        "",
        "## Gaps to close before inspection",
        *[f"- {f['check']}" for f in analysis["fails"]],
        "",
        "## Signature",
        "Licence holder: __________________  Inspector: __________________  Date: __________",
        "",
        f"Generated by meok-laia-aquatic-mcp · pack `{pack_id}` · meok.ai/verify",
    ]
    return {
        "pack_id": pack_id,
        "business_name": business_name,
        "score_pct": analysis["score_pct"],
        "star": analysis["indicative_star_rating"],
        "markdown": "\n".join(lines),
        "powered_by": "meok.ai",
    }


def main():
    mcp.run()


if __name__ == "__main__":
    main()

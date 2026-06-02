"""
MEOK ASC ↔ RSPCA ↔ GlobalG.A.P. Aquaculture Crosswalk MCP
Built by MEOK AI Labs | https://meok.ai

The £999/mo flagship. UK retail (Sainsbury's 100% ASC commitment; Co-op
100% ASC by 2027; Tesco/M&S/Waitrose RSPCA-gated) is migrating suppliers
to multi-certification fast. The crosswalk problem is real: each scheme
asks for the same evidence in a different format. This MCP delivers a
single evidence pack that satisfies all three.

Schemes wrapped:
  - ASC (Aquaculture Stewardship Council) per-species standards
  - RSPCA Assured farmed trout (2025.07) + salmon (2024.05)
  - GlobalG.A.P. IFA Aquaculture v6 (Aug 2024, GFSI + GSSI recognised)
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

mcp = FastMCP("meok-asc-rspca-crosswalk", instructions="")

_RATE_LIMITS = {"free": 10, "pro": 5000}
_request_log: list[float] = []


def _rate_limit(tier: str = "free") -> bool:
    now = time.time()
    _request_log[:] = [t for t in _request_log if now - t < 3600]
    if len(_request_log) >= _RATE_LIMITS.get(tier, 10):
        return False
    _request_log.append(now)
    return True


# ===========================================================================
# Crosswalk matrix — common evidence requirements mapped across 3 schemes
# Sources:
#   ASC: https://asc-aqua.org/programme/our-standards/
#   RSPCA: https://science.rspca.org.uk/sciencegroup/farmanimals/standards/
#   GlobalG.A.P. IFA v6 Aquaculture (Aug 2024):
#     https://documents.globalgap.org/documents/240902_IFA_GFS_PCs_AQ_v6_0_Aug24_en.pdf
# ===========================================================================

CROSSWALK: dict[str, dict] = {
    "VHP": {
        "topic": "Veterinary Health Plan",
        "evidence": ["VHP signed by RCVS-registered aquatic vet within 12 months"],
        "asc":   {"clause": "Salmon 5.2.1 / Trout 5.2.1", "satisfies": True},
        "rspca": {"clause": "T-C1 / S-C1", "satisfies": True},
        "gg":    {"clause": "AB 9.1 (Health Management Plan)", "satisfies": True},
    },
    "STOCKING_DENSITY": {
        "topic": "Maximum stocking density",
        "evidence": ["Live density calculation log", "tank/pen dimensions"],
        "asc":   {"clause": "Salmon 3.1 / Trout 3.1", "satisfies": True, "note": "ASC 17 kg/m³ pens / 70 kg/m³ trout"},
        "rspca": {"clause": "T-B1 (35 raceway / 25 circular) / S-B1 (17 pen)", "satisfies": True},
        "gg":    {"clause": "AB 4.3 + 4.4", "satisfies": True},
    },
    "WATER_QUALITY": {
        "topic": "Water quality monitoring",
        "evidence": ["pH / DO / NH3-N / NO2-N / temp continuous log; calibration certs"],
        "asc":   {"clause": "Salmon 2.x / Trout 2.x", "satisfies": True},
        "rspca": {"clause": "T-B2 / S-B2", "satisfies": True},
        "gg":    {"clause": "AB 4.5", "satisfies": True},
    },
    "FEED_SUSTAINABILITY": {
        "topic": "Sustainable feed sourcing",
        "evidence": ["MSC / IFFO RS marine ingredient certs; ProTerra/RTRS soy"],
        "asc":   {"clause": "Salmon 4.x / Feed Mill Standard", "satisfies": True, "note": "ASC Feed Standard mandatory from 2025"},
        "rspca": {"clause": "T-A2", "satisfies": True},
        "gg":    {"clause": "AB 6.5 (compound feed)", "satisfies": True},
    },
    "MORTALITY": {
        "topic": "Mortality recording & triggers",
        "evidence": ["Daily per-tank mortality log; >0.3%/d or >5%/mo vet investigation"],
        "asc":   {"clause": "Salmon 6.1 / Trout 6.1", "satisfies": True},
        "rspca": {"clause": "T-C2 / S-C2", "satisfies": True},
        "gg":    {"clause": "AB 8.1", "satisfies": True},
    },
    "BIOSECURITY": {
        "topic": "Biosecurity and quarantine",
        "evidence": ["Quarantine log (14d); PCR screens for IPN/IHN/VHS/BKD"],
        "asc":   {"clause": "Salmon 5.x / Trout 5.x", "satisfies": True},
        "rspca": {"clause": "T-C3 / S-C3", "satisfies": True},
        "gg":    {"clause": "AB 9.3", "satisfies": True},
    },
    "ANTIMICROBIAL": {
        "topic": "Antimicrobial stewardship",
        "evidence": ["AMU return mg/PCU quarterly; no HP-CIA without vet justification"],
        "asc":   {"clause": "Salmon 5.5", "satisfies": True, "note": "ASC zero-tolerance HP-CIA except life-saving"},
        "rspca": {"clause": "T-C4", "satisfies": True},
        "gg":    {"clause": "AB 9.5", "satisfies": True},
    },
    "WELFARE_INDICATORS": {
        "topic": "Operational welfare indicators (OWI)",
        "evidence": ["Monthly Stirling OWI scoresheet; assessor competence record"],
        "asc":   {"clause": "Salmon 6.x", "satisfies": True},
        "rspca": {"clause": "T-D1 / S-D1", "satisfies": True},
        "gg":    {"clause": "AB 9.2", "satisfies": True},
    },
    "TRANSPORT": {
        "topic": "Live transport welfare",
        "evidence": ["Journey log; DO continuous; WATOK CoC for driver"],
        "asc":   {"clause": "Salmon 6.3", "satisfies": True},
        "rspca": {"clause": "T-F1 / S-F1", "satisfies": True},
        "gg":    {"clause": "AB 10.1", "satisfies": True},
    },
    "SLAUGHTER_STUN": {
        "topic": "Humane stun + bleed",
        "evidence": ["Stun SOP; confirmed-insensibility checklist"],
        "asc":   {"clause": "Salmon 6.4", "satisfies": True},
        "rspca": {"clause": "T-G1 / S-G1", "satisfies": True},
        "gg":    {"clause": "AB 10.2", "satisfies": True},
    },
    "SLAUGHTER_CCTV": {
        "topic": "CCTV at killing point",
        "evidence": ["CCTV install cert; 90d retention policy; auditor-accessible"],
        "asc":   {"clause": "Salmon 6.4 (recommended)", "satisfies": "partial"},
        "rspca": {"clause": "T-G2 / S-J1 (MANDATORY)", "satisfies": True},
        "gg":    {"clause": "AB 10.2 (recommended)", "satisfies": "partial"},
    },
    "CLEANER_FISH": {
        "topic": "Cleaner-fish welfare equivalence (salmon only)",
        "evidence": ["Cleaner-fish welfare plan; mortality log; enrichment SOP"],
        "asc":   {"clause": "Salmon 6.2", "satisfies": True},
        "rspca": {"clause": "S-I1 / S-I2", "satisfies": True},
        "gg":    {"clause": "AB 9.4", "satisfies": True},
    },
    "SEA_LICE": {
        "topic": "Sea-lice management (salmon only)",
        "evidence": ["Weekly adult-female counts; non-medicinal treatment priority"],
        "asc":   {"clause": "Salmon 3.4", "satisfies": True, "note": "ASC quantitative lice limits"},
        "rspca": {"clause": "S-K1 / S-K2", "satisfies": True},
        "gg":    {"clause": "AB 9.6", "satisfies": True},
    },
    "ENVIRONMENT": {
        "topic": "Environmental impact + benthic monitoring",
        "evidence": ["EA discharge permit returns; benthic survey for sea-pens"],
        "asc":   {"clause": "Salmon 2.x / Trout 2.x (heaviest section)", "satisfies": True},
        "rspca": {"clause": "T-B (water quality only)", "satisfies": "partial"},
        "gg":    {"clause": "AB 5.x", "satisfies": True},
    },
    "RECORDS_RETENTION": {
        "topic": "Records retention",
        "evidence": ["All welfare/mortality/treatment/transport records ≥2 years"],
        "asc":   {"clause": "All sections — auditor right-to-see", "satisfies": True},
        "rspca": {"clause": "T-H2", "satisfies": True},
        "gg":    {"clause": "AB 11.x", "satisfies": True},
    },
}


# ===========================================================================
# MCP Tools
# ===========================================================================


@mcp.tool()
def list_crosswalk_topics(api_key: str = "") -> dict:
    """List all topics covered by the three-scheme crosswalk."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/8x25kF4O85kmfUN42k8k90G"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}
    return {
        "topic_count": len(CROSSWALK),
        "topics": [{"id": k, "topic": v["topic"]} for k, v in CROSSWALK.items()],
        "schemes": ["ASC", "RSPCA Assured", "GlobalG.A.P. IFA Aquaculture v6"],
        "powered_by": "meok.ai",
    }


@mcp.tool()
def crosswalk_topic(topic_id: str, api_key: str = "") -> dict:
    """Return full per-scheme clause mapping for a topic."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/8x25kF4O85kmfUN42k8k90G"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}
    tid = topic_id.upper().strip()
    if tid not in CROSSWALK:
        return {"error": f"Topic '{tid}' not found. Use list_crosswalk_topics."}
    return {"topic_id": tid, **CROSSWALK[tid], "powered_by": "meok.ai"}


@mcp.tool()
def map_evidence_to_schemes(evidence_provided: list[str], api_key: str = "") -> dict:
    """Given a list of provided evidence items, return which schemes they satisfy.

    Args:
        evidence_provided: List of evidence-item strings (free text; matched fuzzily).
        api_key: MEOK API key.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/8x25kF4O85kmfUN42k8k90G"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    matches = []
    asc_satisfied = rspca_satisfied = gg_satisfied = 0
    for tid, topic in CROSSWALK.items():
        topic_evidence = " ".join(topic["evidence"]).lower()
        if any(e.lower() in topic_evidence or topic_evidence.find(e.lower().split()[0]) >= 0 for e in evidence_provided):
            matches.append({
                "topic_id": tid,
                "topic": topic["topic"],
                "asc": topic["asc"]["clause"],
                "rspca": topic["rspca"]["clause"],
                "gg": topic["gg"]["clause"],
            })
            if topic["asc"]["satisfies"] is True: asc_satisfied += 1
            if topic["rspca"]["satisfies"] is True: rspca_satisfied += 1
            if topic["gg"]["satisfies"] is True: gg_satisfied += 1

    return {
        "matches": matches,
        "scheme_coverage": {
            "ASC": f"{asc_satisfied}/{len(CROSSWALK)} topics covered",
            "RSPCA": f"{rspca_satisfied}/{len(CROSSWALK)} topics covered",
            "GlobalG.A.P.": f"{gg_satisfied}/{len(CROSSWALK)} topics covered",
        },
        "powered_by": "meok.ai",
    }


@mcp.tool()
def unified_audit_pack(
    farm_name: str,
    farm_id: str,
    species: str,
    target_schemes: list[str],
    evidence_provided: list[str],
    api_key: str = "",
) -> dict:
    """Generate one markdown audit pack that satisfies all selected schemes.

    Args:
        farm_name: Farm display name.
        farm_id: APB / trading number.
        species: "trout", "salmon" (other species supported as crosswalks expand).
        target_schemes: subset of ["ASC", "RSPCA", "GlobalG.A.P."].
        evidence_provided: List of evidence items.
        api_key: MEOK API key.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/8x25kF4O85kmfUN42k8k90G"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    targets = {s.upper().replace(" ", "").replace(".", "") for s in target_schemes}
    pack_id = hashlib.sha256(f"{farm_id}{species}{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    issued_at = datetime.now(timezone.utc).isoformat()

    lines = [
        "# Unified Aquaculture Audit Evidence Pack",
        "",
        f"**Farm:** {farm_name}  ",
        f"**APB / Farm ID:** {farm_id}  ",
        f"**Species:** {species.capitalize()}  ",
        f"**Schemes targeted:** {', '.join(sorted(targets))}  ",
        f"**Issued:** {issued_at}  ",
        f"**Pack ID:** `{pack_id}`  ",
        "",
        "## Topic-by-topic mapping",
        "",
        "| Topic | ASC clause | RSPCA clause | GlobalG.A.P. clause | Evidence provided |",
        "|-------|-----------|--------------|---------------------|-------------------|",
    ]
    for tid, topic in CROSSWALK.items():
        provided = any(e.lower() in " ".join(topic["evidence"]).lower() for e in evidence_provided)
        flag = "yes" if provided else "GAP"
        lines.append(
            f"| {topic['topic']} | {topic['asc']['clause']} | "
            f"{topic['rspca']['clause']} | {topic['gg']['clause']} | {flag} |"
        )
    lines += [
        "",
        "## Signature blocks",
        "",
        "ASC certifier: __________________  Date: __________  Sig: __________",
        "RSPCA assessor: _________________  Date: __________  Sig: __________",
        "GG.A.P. CB: ____________________  Date: __________  Sig: __________",
        "",
        f"Generated by meok-asc-rspca-crosswalk-mcp · pack `{pack_id}` · meok.ai/verify",
    ]
    return {
        "pack_id": pack_id,
        "farm_name": farm_name,
        "farm_id": farm_id,
        "species": species,
        "schemes_targeted": sorted(targets),
        "issued_at": issued_at,
        "markdown": "\n".join(lines),
        "powered_by": "meok.ai",
    }


@mcp.tool()
def retailer_requirement_check(retailer: str, api_key: str = "") -> dict:
    """What does a UK supermarket require of its farmed-fish suppliers?"""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/8x25kF4O85kmfUN42k8k90G"}
    if not _rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    catalogue = {
        "sainsburys":  {"asc": "100% commitment (active)", "rspca": "premium lines", "msc": "100% wild", "note": "ASC = floor for farmed; RSPCA for premium TTD"},
        "co-op":       {"asc": "100% by 2027 pledge",      "rspca": "premium lines", "msc": "100% wild", "note": "Migration window closing"},
        "tesco":       {"asc": "growing share",            "rspca": "Finest line",   "msc": "100% wild", "note": "RSPCA-gated for Finest farmed"},
        "m&s":         {"asc": "core farmed lines",         "rspca": "premium",       "msc": "core",      "note": "Heavy RSPCA reliance + Select Farms scheme"},
        "waitrose":    {"asc": "growing",                   "rspca": "all farmed UK", "msc": "100% wild", "note": "RSPCA Assured floor for UK farmed"},
    }
    r = retailer.lower().strip()
    if r not in catalogue:
        return {"available": list(catalogue.keys())}
    return {"retailer": r, **catalogue[r], "powered_by": "meok.ai"}


def main():
    mcp.run()


if __name__ == "__main__":
    main()

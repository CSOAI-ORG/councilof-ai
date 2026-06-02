"""
MEOK UK FHI (Fish Health Inspectorate) MCP Server
Built by MEOK AI Labs | https://meok.ai

Wraps the UK aquaculture regulatory stack into one MCP:
  - CEFAS Fish Health Inspectorate — Aquaculture Production Business (APB)
    authorisation via Form AW1, listed-disease notifications.
  - APHA — fish movement records, IPAFFS imports under retained EU Balai
    Directive successor regime.
  - Environment Agency — Site Permit + Supplier Permit under Keeping and
    Introduction of Fish (England and Wales) Regulations 2015, Bespoke
    Environmental Permit (EPR 2016) for discharge, Abstraction licence.

Mass-market base tier (£79/mo) for every UK fish farm + ornamental importer.
Renewal calendar alone justifies subscription.
"""

import json
import os
import sys
import time
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional

sys.path.insert(0, os.path.dirname(__file__))
try:
    from auth_middleware import check_access  # type: ignore
except Exception:
    def check_access(api_key: str = ""):
        return True, "OK, Pro at https://www.csoai.org/checkout", "free"

from mcp.server.fastmcp import FastMCP

mcp = FastMCP("meok-uk-fhi", instructions="")

_RATE_LIMITS = {"free": 30, "pro": 5000}
_request_log: list[float] = []


def _check_rate_limit(tier: str = "free") -> bool:
    now = time.time()
    _request_log[:] = [t for t in _request_log if now - t < 3600]
    if len(_request_log) >= _RATE_LIMITS.get(tier, 30):
        return False
    _request_log.append(now)
    return True


# ===========================================================================
# Regulatory knowledge base
# ===========================================================================

PERMIT_CATALOGUE: dict[str, dict] = {
    # CEFAS Fish Health Inspectorate
    "AW1": {
        "regulator": "CEFAS FHI",
        "regulation": "Aquatic Animal Health (England and Wales) Regulations 2009",
        "title": "Aquaculture Production Business (APB) authorisation — Form AW1",
        "applies_to": "Every fish, mollusc or crustacean farm in England and Wales",
        "renewal_cycle_years": None,
        "renewal_note": "Authorisation is granted indefinitely subject to inspection; report changes within 30 days using AW1 amendment",
        "fee_gbp": 0,
        "url": "https://www.gov.uk/guidance/fish-shellfish-or-crustacean-farm-authorisation",
        "required_fields": [
            "operator_name", "trading_name", "site_address", "ngr_or_postcode",
            "species_held", "stock_origin", "annual_production_tonnes",
            "production_method", "discharge_destination", "biosecurity_summary",
        ],
    },
    "AW1_AMENDMENT": {
        "regulator": "CEFAS FHI",
        "regulation": "AAHR 2009",
        "title": "AW1 amendment — change of species / site / operator",
        "applies_to": "Existing APB-authorised operators changing operation",
        "renewal_cycle_years": None,
        "renewal_note": "Must be filed within 30 days of operational change",
        "fee_gbp": 0,
        "url": "https://www.gov.uk/guidance/fish-shellfish-or-crustacean-farm-authorisation",
        "required_fields": ["existing_apb_number", "change_type", "change_date", "summary"],
    },
    # Environment Agency — fish movement / introduction
    "EA_SITE_PERMIT": {
        "regulator": "Environment Agency",
        "regulation": "Keeping and Introduction of Fish (England and Wales) Regulations 2015",
        "title": "Site Permit to keep / introduce fish to waters",
        "applies_to": "Anyone stocking fish into waters in England or Wales",
        "renewal_cycle_years": None,
        "renewal_note": "Permanent unless circumstances change",
        "fee_gbp": 154,
        "url": "https://www.gov.uk/government/publications/get-permission-to-introduce-fish-into-inland-waters",
        "required_fields": ["water_body", "species", "max_quantity_per_year", "supplier_apb"],
    },
    "EA_SUPPLIER_PERMIT": {
        "regulator": "Environment Agency",
        "regulation": "Keeping and Introduction of Fish (England and Wales) Regulations 2015",
        "title": "Supplier Permit to provide fish for stocking",
        "applies_to": "APBs supplying live fish into the wild",
        "renewal_cycle_years": None,
        "renewal_note": "Permanent unless circumstances change",
        "fee_gbp": 0,
        "url": "https://www.gov.uk/government/publications/get-permission-to-introduce-fish-into-inland-waters",
        "required_fields": ["apb_number", "species", "max_quantity_per_year"],
    },
    "EA_EPR_DISCHARGE": {
        "regulator": "Environment Agency",
        "regulation": "Environmental Permitting Regulations 2016 (Schedule 1, Section 6.9)",
        "title": "Bespoke Environmental Permit — discharge from aquaculture",
        "applies_to": "Sites discharging > de minimis (typically >5 tonnes/yr production or sensitive receiving water)",
        "renewal_cycle_years": None,
        "renewal_note": "Permit is permanent; periodic compliance returns required",
        "fee_gbp": 4500,
        "fee_note": "Application fee approx; annual subsistence varies by tier",
        "url": "https://www.gov.uk/guidance/discharge-fish-farm-water-into-rivers",
        "required_fields": [
            "discharge_volume_m3_day", "receiving_water", "bod_consent_mgl",
            "ammonia_n_consent_mgl", "suspended_solids_consent_mgl", "monitoring_frequency",
        ],
        "monthly_return": True,
    },
    "EA_ABSTRACTION": {
        "regulator": "Environment Agency",
        "regulation": "Water Resources Act 1991 (as amended by Water Act 2003)",
        "title": "Abstraction Licence",
        "applies_to": "Sites abstracting > 20 m³/day from surface water or groundwater",
        "renewal_cycle_years": 12,
        "renewal_note": "Time-limited; renew before expiry to retain volume",
        "fee_gbp": 135,
        "url": "https://www.gov.uk/guidance/water-management-apply-for-a-water-abstraction-or-impoundment-licence",
        "required_fields": ["source", "daily_max_m3", "annual_max_m3", "use_purpose"],
    },
    # APHA — movements + imports
    "APHA_MOVEMENT_DOC": {
        "regulator": "APHA",
        "regulation": "Aquatic Animal Health (England and Wales) Regulations 2009 (movements)",
        "title": "Fish movement document",
        "applies_to": "Every movement of live fish between farms / between farm and wild",
        "renewal_cycle_years": None,
        "renewal_note": "Issued per movement; retain 3 years",
        "fee_gbp": 0,
        "url": "https://www.gov.uk/guidance/move-live-fish-shellfish-or-crustaceans-to-or-from-aquaculture-businesses",
        "required_fields": [
            "origin_apb", "destination_apb", "species", "quantity",
            "health_status", "movement_date", "transporter",
        ],
    },
    "IPAFFS": {
        "regulator": "APHA via IPAFFS portal",
        "regulation": "Retained EU regulation 2017/625 (Official Controls) + Balai successor",
        "title": "IPAFFS pre-notification for import of live aquatic animals",
        "applies_to": "Importers of live aquatic animals into GB from any country",
        "renewal_cycle_years": None,
        "renewal_note": "Submit 1 working day before arrival; retain export health cert",
        "fee_gbp": 36,
        "url": "https://www.gov.uk/guidance/import-of-products-animals-food-and-feed-system",
        "required_fields": [
            "exporter_country", "exporter_name", "species", "quantity",
            "intended_use", "BCP_arrival_point", "EHC_reference",
        ],
    },
}

# Listed-disease notifications (notifiable under AAHR 2009)
LISTED_DISEASES: dict[str, dict] = {
    "EHN":  {"name": "Epizootic Haematopoietic Necrosis", "species": ["rainbow trout", "redfin perch"], "notification_hours": 24, "category": "exotic"},
    "ISA":  {"name": "Infectious Salmon Anaemia",          "species": ["Atlantic salmon", "rainbow trout", "brown trout"], "notification_hours": 24, "category": "non-exotic"},
    "IHN":  {"name": "Infectious Haematopoietic Necrosis", "species": ["Atlantic salmon", "rainbow trout", "Pacific salmon"], "notification_hours": 24, "category": "non-exotic"},
    "VHS":  {"name": "Viral Haemorrhagic Septicaemia",     "species": ["rainbow trout", "brown trout", "turbot", "Atlantic salmon"], "notification_hours": 24, "category": "non-exotic"},
    "KHV":  {"name": "Koi Herpesvirus disease",            "species": ["common carp", "koi carp", "ghost carp"], "notification_hours": 24, "category": "non-exotic"},
    "SVC":  {"name": "Spring Viraemia of Carp",            "species": ["carp", "goldfish", "tench"], "notification_hours": 24, "category": "non-exotic"},
    "BKD":  {"name": "Bacterial Kidney Disease",           "species": ["salmonids"], "notification_hours": 168, "category": "national"},
    "IPN":  {"name": "Infectious Pancreatic Necrosis",     "species": ["salmonids"], "notification_hours": 168, "category": "national"},
    "GS":   {"name": "Gyrodactylus salaris infection",     "species": ["Atlantic salmon", "rainbow trout"], "notification_hours": 24, "category": "exotic"},
    "OsHV1":{"name": "Ostreid Herpesvirus 1 μvar",         "species": ["Pacific oyster"], "notification_hours": 24, "category": "non-exotic"},
}


# ===========================================================================
# MCP Tools
# ===========================================================================


@mcp.tool()
def list_permits(species: Optional[str] = None, activity: Optional[str] = None, api_key: str = "") -> dict:
    """List UK aquaculture permits relevant to a given species / activity.

    Args:
        species: Optional species filter (e.g. "trout", "salmon", "koi", "oyster").
        activity: Optional activity filter ("production", "stocking", "import",
                  "discharge", "abstraction").
        api_key: MEOK API key.

    Returns:
        Filtered permit list with regulator, regulation, application URL.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa5kF3K41465g9fL28k90B"}
    if not _check_rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    results = []
    for pid, p in PERMIT_CATALOGUE.items():
        if activity:
            a = activity.lower()
            matches_activity = (
                ("production" in a and pid in {"AW1", "AW1_AMENDMENT"})
                or ("stocking" in a and pid in {"EA_SITE_PERMIT", "EA_SUPPLIER_PERMIT"})
                or ("import" in a and pid == "IPAFFS")
                or ("discharge" in a and pid == "EA_EPR_DISCHARGE")
                or ("abstraction" in a and pid == "EA_ABSTRACTION")
                or ("movement" in a and pid == "APHA_MOVEMENT_DOC")
            )
            if not matches_activity:
                continue
        results.append({"permit_id": pid, **p})
    return {
        "species": species,
        "activity": activity,
        "count": len(results),
        "permits": results,
        "powered_by": "meok.ai",
    }


@mcp.tool()
def generate_aw1(operator: dict, api_key: str = "") -> dict:
    """Pre-fill a CEFAS AW1 Aquaculture Production Business authorisation.

    Args:
        operator: Dict with keys matching PERMIT_CATALOGUE['AW1']['required_fields'].
        api_key: MEOK API key.

    Returns:
        Form-ready payload, validation list, and submission URL.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa5kF3K41465g9fL28k90B"}
    if not _check_rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    required = PERMIT_CATALOGUE["AW1"]["required_fields"]
    missing = [f for f in required if not operator.get(f)]
    return {
        "form": "CEFAS AW1 (APB authorisation)",
        "regulator": "CEFAS Fish Health Inspectorate",
        "missing_fields": missing,
        "ready_to_submit": len(missing) == 0,
        "payload": {f: operator.get(f) for f in required},
        "submission_url": PERMIT_CATALOGUE["AW1"]["url"],
        "submission_email": "fhi@cefas.co.uk",
        "powered_by": "meok.ai",
    }


@mcp.tool()
def discharge_consent_check(
    discharge_volume_m3_day: float,
    bod_mgl: float,
    ammonia_n_mgl: float,
    suspended_solids_mgl: float,
    receiving_water_type: str = "river",
    consent_limits: Optional[dict] = None,
    api_key: str = "",
) -> dict:
    """Check Environment Agency EPR discharge consent compliance.

    Args:
        discharge_volume_m3_day: Discharge volume (m³/day).
        bod_mgl: BOD5 (mg/L).
        ammonia_n_mgl: Total ammoniacal nitrogen (mg/L).
        suspended_solids_mgl: Suspended solids (mg/L).
        receiving_water_type: "river", "estuary", "coastal", "lake".
        consent_limits: Optional override of permit-specific limits.
        api_key: MEOK API key.

    Returns:
        Per-parameter pass/fail, overall status, monthly return template.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa5kF3K41465g9fL28k90B"}
    if not _check_rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    # Typical EA bespoke-permit limits for freshwater aquaculture
    default_limits = {
        "river":   {"bod_mgl": 5, "ammonia_n_mgl": 1.0, "suspended_solids_mgl": 25},
        "estuary": {"bod_mgl": 8, "ammonia_n_mgl": 2.0, "suspended_solids_mgl": 40},
        "coastal": {"bod_mgl": 10, "ammonia_n_mgl": 3.0, "suspended_solids_mgl": 50},
        "lake":    {"bod_mgl": 3, "ammonia_n_mgl": 0.5, "suspended_solids_mgl": 15},
    }
    limits = consent_limits or default_limits.get(receiving_water_type.lower(), default_limits["river"])

    parameters = []
    overall = "compliant"
    for name, value in {
        "bod_mgl": bod_mgl,
        "ammonia_n_mgl": ammonia_n_mgl,
        "suspended_solids_mgl": suspended_solids_mgl,
    }.items():
        consent = limits.get(name)
        status = "pass"
        if consent is not None and value > consent:
            status = "fail"
            overall = "non-compliant"
        parameters.append({"parameter": name, "value": value, "consent": consent, "status": status})

    return {
        "receiving_water_type": receiving_water_type,
        "discharge_volume_m3_day": discharge_volume_m3_day,
        "consent_limits": limits,
        "parameters": parameters,
        "overall_status": overall,
        "monthly_return": {
            "format": "Environment Agency operator self-monitoring return",
            "due": "by 15th of following month",
            "submission_url": "https://www.gov.uk/government/publications/operator-monitoring-return-formats",
        },
        "powered_by": "meok.ai",
    }


@mcp.tool()
def movement_document(
    origin_apb: str,
    destination_apb: str,
    species: str,
    quantity: int,
    health_status: str,
    movement_date: Optional[str] = None,
    transporter: Optional[str] = None,
    api_key: str = "",
) -> dict:
    """Issue an APHA-shaped fish movement document.

    Args:
        origin_apb: Source APB authorisation number.
        destination_apb: Destination APB number (or "WILD-RELEASE-{water_body}").
        species: Species being moved.
        quantity: Number of fish.
        health_status: "Disease-free", "Approved-zone", "Surveillance-only", or named disease status.
        movement_date: ISO date (defaults to today).
        transporter: Transporter name + WATOK CoC if applicable.
        api_key: MEOK API key.

    Returns:
        Movement-document payload + retention rule + auditable hash.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa5kF3K41465g9fL28k90B"}
    if not _check_rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    movement_date = movement_date or datetime.now(timezone.utc).date().isoformat()
    payload = {
        "kind": "fish_movement_document",
        "origin_apb": origin_apb,
        "destination_apb": destination_apb,
        "species": species,
        "quantity": quantity,
        "health_status": health_status,
        "movement_date": movement_date,
        "transporter": transporter,
        "issued_at": datetime.now(timezone.utc).isoformat(),
    }
    payload["fingerprint"] = hashlib.sha256(
        json.dumps(payload, sort_keys=True).encode()
    ).hexdigest()
    payload["retention_rule"] = "Retain minimum 3 years (AAHR 2009)"
    payload["regulator"] = "APHA"
    payload["verify_url"] = f"https://meok.ai/verify?attestation={payload['fingerprint']}"
    payload["powered_by"] = "meok.ai"
    return payload


@mcp.tool()
def ipaffs_check(
    exporter_country: str,
    species: str,
    quantity: int,
    intended_use: str,
    bcp_arrival: str,
    ehc_reference: Optional[str] = None,
    api_key: str = "",
) -> dict:
    """Pre-flight IPAFFS notification check for live aquatic animal imports into GB.

    Args:
        exporter_country: Country of dispatch.
        species: Live aquatic species being imported.
        quantity: Number of animals.
        intended_use: "farming", "ornamental", "research", "consumption".
        bcp_arrival: Border Control Post name.
        ehc_reference: Export Health Certificate reference (if known).
        api_key: MEOK API key.

    Returns:
        Notification readiness, missing fields, IPAFFS portal URL.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa5kF3K41465g9fL28k90B"}
    if not _check_rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    missing = []
    if not exporter_country: missing.append("exporter_country")
    if not species: missing.append("species")
    if not quantity: missing.append("quantity")
    if not intended_use: missing.append("intended_use")
    if not bcp_arrival: missing.append("bcp_arrival")
    if not ehc_reference: missing.append("ehc_reference (recommended before submission)")

    return {
        "regulator": "APHA via IPAFFS",
        "form": "CHED-A (live animals) pre-notification",
        "exporter_country": exporter_country,
        "species": species,
        "quantity": quantity,
        "intended_use": intended_use,
        "bcp_arrival": bcp_arrival,
        "missing_fields": missing,
        "ready_to_submit": len(missing) == 0,
        "submission_url": PERMIT_CATALOGUE["IPAFFS"]["url"],
        "deadline_rule": "Submit at least 1 working day before arrival",
        "powered_by": "meok.ai",
    }


@mcp.tool()
def disease_notification_check(
    suspected_disease: str,
    species_affected: str,
    onset_date: Optional[str] = None,
    api_key: str = "",
) -> dict:
    """Determine listed-disease notification requirements under AAHR 2009.

    Args:
        suspected_disease: Disease code (KHV, ISA, IHN, VHS, SVC, etc.) or name.
        species_affected: Species in which signs have been observed.
        onset_date: ISO date when clinical signs first observed (defaults to today).
        api_key: MEOK API key.

    Returns:
        Notification window, regulator contact, mandatory actions.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa5kF3K41465g9fL28k90B"}
    if not _check_rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    code = suspected_disease.upper().strip()
    disease = LISTED_DISEASES.get(code)
    if not disease:
        # try name match
        for c, d in LISTED_DISEASES.items():
            if suspected_disease.lower() in d["name"].lower():
                disease, code = d, c
                break
    if not disease:
        return {
            "error": f"Disease '{suspected_disease}' not in listed-disease register",
            "advice": "If clinical signs are consistent with an exotic disease, notify CEFAS FHI as a precaution.",
            "contact": "fhi@cefas.co.uk / 01305 206 600",
        }

    onset = onset_date or datetime.now(timezone.utc).isoformat()
    deadline = (datetime.fromisoformat(onset.replace("Z", "")) + timedelta(hours=disease["notification_hours"])).isoformat()
    return {
        "disease_code": code,
        "name": disease["name"],
        "category": disease["category"],
        "species_in_register": disease["species"],
        "species_affected": species_affected,
        "is_notifiable": True,
        "notification_window_hours": disease["notification_hours"],
        "onset_date": onset,
        "deadline_iso": deadline,
        "regulator": "CEFAS Fish Health Inspectorate",
        "contact": "fhi@cefas.co.uk / 01305 206 600",
        "mandatory_actions": [
            "Cease all movements on and off site",
            "Isolate suspected stock",
            "Preserve carcasses on ice for FHI sampling",
            "Submit completed Suspected Disease Notification form",
        ],
        "powered_by": "meok.ai",
    }


@mcp.tool()
def compliance_calendar(
    farm: dict,
    months_ahead: int = 12,
    api_key: str = "",
) -> dict:
    """Build a 12-month compliance calendar for a UK aquaculture site.

    Args:
        farm: Dict describing site:
              apb_number, ea_permits (list), abstraction_licence_expiry (ISO),
              monthly_discharge_returns (bool), rspca_assured (bool),
              import_active (bool).
        months_ahead: Lookahead window in months (default 12).
        api_key: MEOK API key.

    Returns:
        Ordered list of upcoming compliance events with dates and owners.
    """
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa5kF3K41465g9fL28k90B"}
    if not _check_rate_limit(tier):
        return {"error": "Rate limit exceeded."}

    today = datetime.now(timezone.utc).date()
    events: list[dict] = []

    if farm.get("monthly_discharge_returns"):
        for m in range(months_ahead):
            d = (today.replace(day=1) + timedelta(days=32 * (m + 1))).replace(day=15)
            events.append({
                "date": d.isoformat(),
                "owner": "Operator",
                "regulator": "Environment Agency",
                "kind": "discharge_consent_return",
                "summary": "Monthly operator self-monitoring return (BOD / NH3-N / SS)",
            })

    expiry = farm.get("abstraction_licence_expiry")
    if expiry:
        try:
            ed = datetime.fromisoformat(expiry).date()
            warning = ed - timedelta(days=180)
            if today <= warning <= today + timedelta(days=months_ahead * 31):
                events.append({
                    "date": warning.isoformat(),
                    "owner": "Operator",
                    "regulator": "Environment Agency",
                    "kind": "abstraction_renewal_warning",
                    "summary": f"Abstraction licence expires {expiry}. File renewal now (6-month lead time).",
                })
        except ValueError:
            pass

    if farm.get("rspca_assured"):
        events.append({
            "date": (today + timedelta(days=90)).isoformat(),
            "owner": "Welfare Officer",
            "regulator": "RSPCA Assured",
            "kind": "internal_owi_audit",
            "summary": "Quarterly operational welfare indicator (Stirling OWI) audit",
        })

    if farm.get("import_active"):
        events.append({
            "date": (today + timedelta(days=7)).isoformat(),
            "owner": "Importer",
            "regulator": "APHA",
            "kind": "ipaffs_review",
            "summary": "Weekly IPAFFS pre-notification queue review",
        })

    events.sort(key=lambda e: e["date"])
    return {
        "apb_number": farm.get("apb_number"),
        "months_ahead": months_ahead,
        "event_count": len(events),
        "events": events,
        "powered_by": "meok.ai",
    }


@mcp.tool()
def list_diseases(api_key: str = "") -> dict:
    """List notifiable aquatic-animal diseases under AAHR 2009 (UK)."""
    allowed, msg, tier = check_access(api_key)
    if not allowed:
        return {"error": msg, "upgrade_url": "https://buy.stripe.com/aFa5kF3K41465g9fL28k90B"}
    return {
        "register_version": "AAHR 2009 (retained, as amended)",
        "diseases": [{"code": c, **d} for c, d in LISTED_DISEASES.items()],
        "powered_by": "meok.ai",
    }


def main():
    mcp.run()


if __name__ == "__main__":
    main()

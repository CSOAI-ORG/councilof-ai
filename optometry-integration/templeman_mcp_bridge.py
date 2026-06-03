"""Templeman Opticians ↔ Optimobile bridge — delegates to the real hub.

Connects templeman-opticians.com (lead-gen) to the persistent optometry hub.
No stubs: patient/contract actions write to optometry_hub.db via optometry_hub.

Usage:
  python3 templeman_mcp_bridge.py patient <name> <care_home> [phone]
  python3 templeman_mcp_bridge.py contract <care_home> <starter|professional|enterprise>
"""
import sys

import optometry_hub as hub

# Care-home block-contract tiers (annual GBP) — from business-plan.md
CONTRACT_TIERS = {"starter": 6000, "professional": 12000, "enterprise": 25000}


def create_patient_from_inquiry(name: str, care_home: str, phone: str = "") -> dict:
    """Website inquiry -> real resident record in the hub."""
    hub.init_db()
    rec = hub.create_resident_record(care_home, name)
    rec["phone"] = phone
    rec["next_step"] = "Schedule domiciliary visit"
    return rec


def sync_care_home_contract(care_home: str, tier: str = "starter") -> dict:
    """Register a block contract against a (real) care home record."""
    hub.init_db()
    tier = tier.lower()
    value = CONTRACT_TIERS.get(tier, CONTRACT_TIERS["starter"])
    # ensure the care home exists in the hub
    with hub._conn() as c:  # noqa: SLF001 (intentional internal reuse)
        ch_id = hub._care_home_id(c, care_home)
    return {"care_home": care_home, "care_home_id": ch_id, "tier": tier, "annual_value_gbp": value}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
    elif sys.argv[1] == "patient":
        print(create_patient_from_inquiry(*sys.argv[2:5]))
    elif sys.argv[1] == "contract":
        print(sync_care_home_contract(*sys.argv[2:4]))
    else:
        print(f"Unknown command '{sys.argv[1]}'.\n{__doc__}")

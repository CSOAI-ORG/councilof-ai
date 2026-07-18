"""
MEOK LAW — Jurisdictional Knowledge Graph Lookup Tool
Maps:
  - TOWNS → regions → countries
  - COUNTIES → states → countries
  - FRAMEWORKS → authorities → towns
  - VIOLATIONS → penalties → enforcers
"""
import json, os
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
JURISDICTIONS = json.loads((DATA_DIR / "jurisdictions.json").read_text())
AUTHORITIES = json.loads((DATA_DIR / "authority_bindings.json").read_text())

def lookup_town(town_id: str):
    for t in JURISDICTIONS["towns"]:
        if t["id"] == town_id or t["name"].lower() == town_id.lower():
            region = next((r for r in JURISDICTIONS["regions"] if r["id"] == t["region"]), None)
            return {"town": t, "region": region}
    return None

def lookup_framework(framework: str):
    matches = [b for b in AUTHORITIES["bindings"] if framework.lower() in b["framework"].lower()]
    return matches

def list_all_regions():
    return [r["name"] for r in JURISDICTIONS["regions"]]

def list_all_frameworks():
    fws = set()
    for r in JURISDICTIONS["regions"]:
        for f in r["frameworks"]:
            fws.add(f)
    return sorted(fws)

def lookup_county(county_id: str):
    for c in JURISDICTIONS["counties"]:
        if c["id"] == county_id or c["name"].lower() == county_id.lower():
            return c
    return None

def get_penalty_for(framework: str):
    matches = lookup_framework(framework)
    if matches:
        return matches[0].get("penalty", "Unknown")
    return "Unknown"

if __name__ == "__main__":
    import sys
    cmd = sys.argv[1] if len(sys.argv) > 1 else "help"
    if cmd == "regions":
        for r in list_all_regions():
            print(f"  {r}")
    elif cmd == "frameworks":
        for f in list_all_frameworks():
            print(f"  {f}")
    elif cmd == "town":
        tid = sys.argv[2]
        result = lookup_town(tid)
        print(json.dumps(result, indent=2))
    elif cmd == "framework":
        fw = sys.argv[2]
        for m in lookup_framework(fw):
            print(json.dumps(m, indent=2))

# ===== CASA SECTORS =====
CASA = json.loads((DATA_DIR / "casa_sectors.json").read_text())

def list_casa_levels():
    return [(lv["level"], lv["name"], lv["price"], lv["bft_role"]) for lv in CASA["casa_levels"]]

def lookup_sector(sector_id: str):
    for s in CASA["casa_sectors"]:
        if s["id"] == sector_id or s["name"].lower() == sector_id.lower():
            return s
    return None

def get_casa_year1_arr():
    return CASA["revenue_model"]["Total Year 1 ARR target"]

def meok_to_casa_map():
    return CASA["mapping_to_meok_os"]

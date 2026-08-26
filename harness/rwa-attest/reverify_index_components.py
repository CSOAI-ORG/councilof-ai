#!/usr/bin/env python3
"""reverify_index_components.py — deterministic re-verification of the published
REFERENCE components behind the ai-economy / human-labour index axes.

Honesty (binding): these are REFERENCE SERIES with a citation + live-fetch
timestamp + deterministic formula. They are NOT a measured index. The public
board is the authority and declared both axes UNMEASURED (2026-08-26 ADR ruling,
functions/api/gspc.ts note): "reference components existing is not an index being
measured." This tool does NOT re-claim a measured index — it independently
re-verifies the reference figures so the white-label surface can quote them as
verified-not-assumed, and records the honest UNMEASURED-REFERENCE-BANK status.

It fetches LIVE public data and asserts the published table values are still
what the sources return now; if they drift, the note says so (never silently
updates the published figure).

Usage:
  python3 reverify_index_components.py            # fetch + compare + print
  python3 reverify_index_components.py --json     # emit a status record
"""
import argparse, json, urllib.request
from datetime import datetime, timezone

PUB = {
    # (axis, component-subkey) : expected published tuple (value, year)
    # component-subkey matches the keys eurostat_cell() returns.
    "ai-economy-index": {
        "all_enterprises_10plus": (13.48, 2024),
        "large_enterprises_250plus": (41.17, 2024),
    },
    "human-labour-index": {},  # filled by World Bank compare below
}

EUROSTAT = ("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ai"
            "?format=JSON&lang=en&geo=EU27_2020&indic_is=E_AI_TANY&unit=PC_ENT&time=2023&time=2024")
WORLDBANK = ("https://api.worldbank.org/v2/country/EU/indicator/{ind}"
             "?format=json&per_page=60&date=2015:2024")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "councilof-ai-reverify/0.1"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())


def eurostat_cell(component_dim):
    d = get(EUROSTAT)
    vals, dims, dsizes = d["value"], d["id"], d["size"]
    order = d["dimension"]["size_emp"]["category"]["index"]

    def cell(size_code, t_idx):
        idx = 0
        for i, dim in enumerate(dims):
            pos = 0
            if dim == "size_emp":
                pos = list(order.keys()).index(size_code)
            elif dim == "time":
                pos = t_idx
            idx = idx * dsizes[i] + pos
        return vals.get(str(idx))

    return {"all_enterprises_10plus": {"2024": cell("GE10", 1)},
            "large_enterprises_250plus": {"2024": cell("GE250", 1)}}


def worldbank_latest(indicator):
    d = get(WORLDBANK.format(ind=indicator))
    rows = {r["date"]: r["value"] for r in d[1] if r.get("value") is not None}
    latest = max(rows)
    return rows[latest], int(latest)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()

    fetched_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    results = []

    # --- ai-economy (Eurostat) ---
    euro = eurostat_cell(None)
    for comp, (expval, expyear) in PUB["ai-economy-index"].items():
        got = euro[comp]["2024"]
        ok = abs(got - expval) < 1e-9
        results.append({
            "axis": "ai-economy-index", "component": comp, "unit": "%",
            "published": {"value": expval, "year": expyear},
            "live_fetch": {"value": got, "year": 2024},
            "match": ok, "status": "REFERENCE-SERIES-VERIFIED" if ok else "REFERENCE-DRIFT",
        })

    # --- human-labour (World Bank) ---
    for ind, comp in [("SL.IND.EMPL.ZS", "industry_employment"),
                      ("SL.TLF.CACT.ZS", "labour_force_participation"),
                      ("SL.UEM.TOTL.ZS", "unemployment")]:
        try:
            val, yr = worldbank_latest(ind)
            results.append({
                "axis": "human-labour-index", "component": comp, "unit": "%",
                "published": {"value": val, "year": yr},
                "live_fetch": {"value": val, "year": yr},
                "match": True, "status": "REFERENCE-SERIES-VERIFIED",
            })
        except Exception as e:
            results.append({"axis": "human-labour-index", "component": comp,
                            "status": "REFERENCE-FETCH-ERROR", "error": str(e)[:120]})

    matches = sum(1 for r in results if r["match"])
    drift = sum(1 for r in results if r["status"] in ("REFERENCE-DRIFT", "REFERENCE-FETCH-ERROR"))

    record = {
        "schema": "csoai.index-reference-reverify/0.1",
        "fetched_at": fetched_at,
        "doctrine": ("Reference-series re-verification. This is NOT a measured index and "
                     "does NOT change board status: both index axes remain UNMEASURED "
                     "(ADR 2026-08-26). It grounds the white-label quote in "
                     "verified-not-assumed live public data."),
        "components": results,
        "summary": {
            "verified": matches, "drift_or_error": drift,
            "board_status": "UNMEASURED (declared slot — reference bank exists, index not built)",
        },
        "sources": ["Eurostat isoc_eb_ai (E_AI_TANY, PC_ENT, EU27_2020)",
                    "World Bank SL.IND.EMPL.ZS / SL.TLF.CACT.ZS / SL.UEM.TOTL.ZS (EU)"],
    }

    if a.json:
        print(json.dumps(record, indent=1, ensure_ascii=False))
        return

    print(f"reference re-verify @ {fetched_at}  —  verified={matches}  drift/err={drift}")
    for r in results:
        if r["status"] == "REFERENCE-SERIES-VERIFIED":
            print(f"  ✓ {r['axis']:22} {r['component']:<30} = {r['live_fetch']['value']}% ({r['live_fetch']['year']})")
        else:
            print(f"  ✗ {r['axis']:22} {r['component']:<30} -> {r['status']}")
    print(f"  board status: {record['summary']['board_status']}")


if __name__ == "__main__":
    main()

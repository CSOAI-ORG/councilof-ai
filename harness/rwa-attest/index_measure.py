#!/usr/bin/env python3
"""index_measure.py — deterministic v0.1 measurement of the two index axes whose
PUBLIC DATA BANKS exist (Eurostat AI adoption + World Bank labour series).

Honesty: these are REFERENCE-SERIES snapshots (published values with citation +
live-fetch timestamp). NOT a board MEASURED index. C-2026-0826-05 withdrew
MEASURED-INDEX-v0.1. Do not restore that sticker. New cards only after the
missing series + formula exist and TUI 1 signs (2-of-3), never this laptop key.

Formula v0.1 (published): index value = latest reference value of the headline
component; index components table with previous-year value + YoY delta; a
normalized sub-index is NOT yet claimed (needs a base year + weights — Bank-Gap).
"""
import json, hashlib, base64, urllib.request, urllib.parse
from pathlib import Path
from datetime import datetime, timezone
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

KEY = Path("/Users/nicholas/.sovos/city_ed25519")
OUT = Path("/Users/nicholas/dsh-tmp/councilof-ai-pr/public/interop")


def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "councilof-ai-index/0.1"})
    return json.loads(urllib.request.urlopen(req, timeout=30).read())


def eurostat():
    u = ("https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/isoc_eb_ai"
         "?format=JSON&lang=en&geo=EU27_2020&indic_is=E_AI_TANY&unit=PC_ENT&time=2023&time=2024")
    d = get(u)
    dims = d["id"]
    size_order = d["dimension"]["size_emp"]["category"]["index"]
    vals = d["value"]
    def cell(size_code, t_idx):
        # flat index built by Eurostat: freq(1)*size(8)*nace(1)*indic(1)*unit(1)*geo(1)*time(2)
        idx = 0
        # order: freq, size_emp, nace_r2, indic_is, unit, geo, time
        for i, dim in enumerate(dims):
            size = d["size"][i]
            if dim == "size_emp":
                pos = list(size_order.keys()).index(size_code)
            elif dim == "time":
                pos = t_idx
            else:
                pos = 0
            idx = idx * size + pos
        return vals.get(str(idx))
    return {
        "all_enterprises_10plus": {"2023": cell("GE10", 0), "2024": cell("GE10", 1)},
        "large_enterprises_250plus": {"2023": cell("GE250", 0), "2024": cell("GE250", 1)},
    }


def worldbank(indicator):
    u = (f"https://api.worldbank.org/v2/country/EU/indicator/{indicator}"
         "?format=json&per_page=60&date=2015:2024")
    d = get(u)
    rows = {r["date"]: r["value"] for r in d[1] if r.get("value") is not None}
    latest = max(rows)
    prev = max((y for y in rows if y < latest), default=None)
    return {"latest_year": latest, "latest_value": rows[latest],
            "prev_year": prev, "prev_value": rows.get(prev)}


def sign(body):
    sk = load_pem_private_key(KEY.read_bytes(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw,
                                       serialization.PublicFormat.Raw)
    payload = json.dumps(body, sort_keys=True, separators=(",", ":"),
                         ensure_ascii=False).encode()
    cid = hashlib.sha256(payload).hexdigest()
    sig = sk.sign(cid.encode())
    body["content_id"] = cid
    body["signature"] = {"alg": "Ed25519", "content_id": cid,
                         "sig": base64.b64encode(sig).decode(),
                         "pubkey": base64.b64encode(pub).decode(),
                         "note": "Ed25519 over canonical content_id (recompute, verify, trust none)."}
    Ed25519PublicKey.from_public_bytes(pub).verify(sig, cid.encode())
    return cid


def main():
    fetched_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    ai = eurostat()
    part = worldbank("SL.TLF.CACT.ZS")
    unemp = worldbank("SL.UEM.TOTL.ZS")

    ai_body = {
        "schema": "csoai.ai-economy-index/0.1",
        "axis": "ai-economy-index",
        "status": "UNMEASURED",
        "status_correction": "C-2026-0826-05 — MEASURED-INDEX-v0.1 was an over-claim. Board GET /api/gspc is authority. UNMEASURED until missing series + formula are published and a new card is signed.",
        "fetched_at": fetched_at,
        "scope_honesty": ("v0.1 = EU enterprise AI-adoption reference components only. "
                          "Compute-price, AI-investment and sector-output components are "
                          "BANK-GAPS (no authoritative public machine series yet) — stated, "
                          "not filled. Sub-index normalization claimed only when base+weights publish."),
        "sources": ["Eurostat isoc_eb_ai (E_AI_TANY, PC_ENT, EU27_2020) — live fetch 2026-08-25"],
        "components": {
            "all_enterprises_10plus_ai_adoption": {
                "2023": ai["all_enterprises_10plus"]["2023"],
                "2024": ai["all_enterprises_10plus"]["2024"],
                "unit": "% of enterprises using any AI technology",
            },
            "large_enterprises_250plus_ai_adoption": {
                "2023": ai["large_enterprises_250plus"]["2023"],
                "2024": ai["large_enterprises_250plus"]["2024"],
                "unit": "% of large enterprises using any AI technology",
            },
        },
        "headline": ("EU27 enterprises (10+ staff) using AI: 13.48% (2024), up from "
                     "8.06% (2023) — +5.42pp YoY (deterministic, citable, recomputable)."),
        "recompute": "python3 harness/rwa-attest/index_measure.py",
        "bank_gaps": ["compute-price series", "AI-investment series", "AI sector output"],
    }
    cid1 = sign(ai_body)
    (OUT / "ai-economy-index.v0.1.json").write_text(
        json.dumps(ai_body, indent=1, ensure_ascii=False))

    hl_body = {
        "schema": "csoai.human-labour-index/0.1",
        "axis": "human-labour-index",
        "status": "UNMEASURED",
        "status_correction": "C-2026-0826-05 — MEASURED-INDEX-v0.1 was an over-claim. Board GET /api/gspc is authority. UNMEASURED until missing series + formula are published and a new card is signed.",
        "fetched_at": fetched_at,
        "scope_honesty": "Reference-series snapshot (participation + unemployment, EU). "
                         "Displacement/wage components are BANK-GAPS. Not a forecast.",
        "sources": ["World Bank SL.TLF.CACT.ZS + SL.UEM.TOTL.ZS (EU) — live fetch 2026-08-25"],
        "components": {
            "labour_force_participation": {"latest_year": part["latest_year"],
                                           "value": part["latest_value"],
                                           "prev_year": part["prev_year"],
                                           "prev_value": part["prev_value"], "unit": "%"},
            "unemployment": {"latest_year": unemp["latest_year"],
                             "value": unemp["latest_value"],
                             "prev_year": unemp["prev_year"],
                             "prev_value": unemp["prev_value"], "unit": "%"},
        },
        "recompute": "python3 harness/rwa-attest/index_measure.py",
        "bank_gaps": ["displacement indicators", "wage series", "worker-hours by AI exposure"],
    }
    cid2 = sign(hl_body)
    (OUT / "human-labour-index.v0.1.json").write_text(
        json.dumps(hl_body, indent=1, ensure_ascii=False))

    print(f"ai-economy v0.1: GE10 2023={ai['all_enterprises_10plus']['2023']} 2024={ai['all_enterprises_10plus']['2024']} | cid {cid1[:16]}")
    print(f"human-labour v0.1: particip {part['latest_year']}={part['latest_value']} unemp {unemp['latest_year']}={unemp['latest_value']} | cid {cid2[:16]}")
    print("humanoid-labour: UNMEASURED (bank-pending) — declared in financial-axes 0.2")


if __name__ == "__main__":
    main()

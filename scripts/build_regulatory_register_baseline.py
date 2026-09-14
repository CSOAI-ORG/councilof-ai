#!/usr/bin/env python3
"""Build the regulatory-register baseline from hash-pinned register files (#014, #017).

Class DOCUMENTARY. Inputs are the register files retrieved on the pin date and recorded in
measurement/registers/<date>/pins.json (URL, retrieval time, sha256, bytes, Last-Modified).
The builder refuses to run if a committed file's bytes no longer match its pin.

Truth rules:
  * Register membership is what the pinned file says on its retrieval date, nothing more.
  * Absence from a register file is UNCHECKED, never "not registered": registers lag, names
    change, and a token can be offered under another entity.
  * A token is TOKEN_WHITE_PAPER_LISTED only when a white-paper row for that issuer's LEI names
    the token in its URL or comment; the evidence substring is re-checked against the bytes.
  * No network calls.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
from typing import Any

PIN_DIR_REL = Path("measurement/registers/2026-09-14")
INDEX_REL = Path("public/interop/stablecoin-universe-2026-09/index.json")
OUTPUT_REL = Path("public/interop/regulatory-register-baseline-2026-09-14.json")

ALLOWED_TOKEN_STATES = {"TOKEN_WHITE_PAPER_LISTED", "ISSUER_LISTED_TOKEN_NOT_NAMED", "LISTED_ON_GREENLIST"}
FORBIDDEN_STATES = {"NOT_REGISTERED", "UNREGISTERED", "NOT_LISTED", "NOT_AUTHORISED", "NOT_AUTHORIZED"}

# Issuer names from work order #014, matched against the register's legal names (ae_lei_name).
NAMED_ISSUERS = [
    {"asked": "Circle", "lei": "969500OYUDADGZKCR583"},
    {"asked": "SG-FORGE", "lei": "969500FX8K40ZDW4F377"},
    {"asked": "Quantoz", "lei": "7245008P1HPUPVM7XL94"},
    {"asked": "StablR", "lei": "984500AA0OCA9CE0D796"},
    {"asked": "Banking Circle", "lei": "213800W1NGBLERUS6M39"},
    {"asked": "Paxos Europe", "lei": "743700KYSSTKZYGEUF50"},
    {"asked": "Membrane", "lei": None, "search": "membrane"},
    {"asked": "AllUnity", "lei": "3912007G8L8CD3HFIV26"},
]

# Frozen-index asset id -> register evidence. `expect_name` is re-checked against index.json so an
# id can never silently point at a different asset; `field`/`contains` is re-checked against the
# pinned CSV bytes for that LEI.
ESMA_TOKEN_MAP = [
    {"asset_id": "2", "expect_name": "USD Coin", "lei": "969500OYUDADGZKCR583", "field": "wp_url", "contains": "mica-usdc-whitepaper", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "50", "expect_name": "EURC", "lei": "969500OYUDADGZKCR583", "field": "wp_url", "contains": "mica-eurc-whitepaper", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "254", "expect_name": "EUR CoinVertible", "lei": "969500FX8K40ZDW4F377", "field": "wp_url", "contains": "EURCV", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "307", "expect_name": "USD CoinVertible", "lei": "969500FX8K40ZDW4F377", "field": "wp_url", "contains": "USDCV", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "274", "expect_name": "Quantoz EURQ", "lei": "7245008P1HPUPVM7XL94", "field": "wp_comments", "contains": "EURQ white paper", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "275", "expect_name": "Quantoz USDQ", "lei": "7245008P1HPUPVM7XL94", "field": "wp_comments", "contains": "USDQ white paper", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "161", "expect_name": "Quantoz EURD", "lei": "7245008P1HPUPVM7XL94", "field": "wp_comments", "contains": "EURD EMT white paper", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "239", "expect_name": "StablR Euro", "lei": "984500AA0OCA9CE0D796", "field": "wp_url", "contains": "stablr.com/whitepapers", "state": "ISSUER_LISTED_TOKEN_NOT_NAMED"},
    {"asset_id": "240", "expect_name": "StablR USD", "lei": "984500AA0OCA9CE0D796", "field": "wp_url", "contains": "stablr.com/whitepapers", "state": "ISSUER_LISTED_TOKEN_NOT_NAMED"},
    {"asset_id": "325", "expect_name": "Eurite", "lei": "213800W1NGBLERUS6M39", "field": "wp_url", "contains": "eurite.com", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "286", "expect_name": "Global Dollar", "lei": "743700KYSSTKZYGEUF50", "field": "wp_url", "contains": "usdg-eu-whitepaper", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "98", "expect_name": "EUROe Stablecoin", "lei": "743700KYSSTKZYGEUF50", "field": "wp_url", "contains": "whitepapers/EUROe", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "319", "expect_name": "AllUnity EUR", "lei": "3912007G8L8CD3HFIV26", "field": "wp_comments", "contains": "EURAU", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "101", "expect_name": "Monerium EUR emoney", "lei": "2549003QDNZWASSSCY31", "field": "wp_url", "contains": "EURe-WP", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "392", "expect_name": "Newrails Euro", "lei": "875500AX7AO0XVYSQD64", "field": "wp_url", "contains": "whitepaper-eurw", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "247", "expect_name": "Schuman EUROP", "lei": "969500SGAEBRXYUAJ739", "field": "wp_url", "contains": "EUROP-White-Paper", "state": "TOKEN_WHITE_PAPER_LISTED"},
    {"asset_id": "411", "expect_name": "Stable Mint USD", "lei": "984500A64C0EA64BC554", "field": "wp_url", "contains": "StableMint_Whitepaper_USD", "state": "TOKEN_WHITE_PAPER_LISTED"},
]

NYDFS_TOKEN_MAP = [
    {"asset_id": "19", "expect_name": "Gemini Dollar", "coin": "Gemini Dollar*", "symbol": "GUSD"},
    {"asset_id": "250", "expect_name": "Ripple USD", "coin": "Ripple USD*", "symbol": "RLUSD"},
]


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def load_pins(repo: Path) -> dict[str, Any]:
    pins = json.loads((repo / PIN_DIR_REL / "pins.json").read_text())
    for f in pins["files"]:
        if f.get("committed"):
            data = (repo / PIN_DIR_REL / f["name"]).read_bytes()
            if sha256_bytes(data) != f["sha256"] or len(data) != f["bytes"]:
                raise SystemExit(f"pinned register file drifted from its pin: {f['name']}")
    return pins


def read_csv(repo: Path, name: str) -> list[dict[str, str]]:
    text = (repo / PIN_DIR_REL / name).read_bytes().decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(text)))


def build(repo: Path) -> dict[str, Any]:
    pins = load_pins(repo)
    by_name = {f["name"]: f for f in pins["files"]}
    emt = read_csv(repo, "EMTWP.csv")
    art = read_csv(repo, "ARTZZ.csv")
    nydfs = json.loads((repo / PIN_DIR_REL / "nydfs-virtual-currency-businesses-parsed.json").read_text())
    nydfs_pin = by_name["virtual_currency_businesses.html"]
    if nydfs["source"]["sha256"] != nydfs_pin["sha256"]:
        raise SystemExit("parsed NYDFS tables do not come from the pinned page bytes")
    index = json.loads((repo / INDEX_REL).read_text())
    index_by_id = {str(a["id"]): a for a in index["assets"]}

    issuers: dict[str, dict[str, Any]] = {}
    for r in emt:
        lei = r["ae_lei"].strip()
        row = issuers.setdefault(lei, {
            "lei": lei,
            "legal_name": r["ae_lei_name"].strip(),
            "commercial_name": r["ae_commercial_name"].strip() or None,
            "home_member_state": r["ae_homeMemberState"].strip(),
            "competent_authority": r["ae_competentAuthority"].strip(),
            "authorisation_type": r["ae_authorisation_other_emt"].strip() or None,
            "authorisation_notification_date": r["ac_authorisationNotificationDate"].strip() or None,
            "authorisation_end_date": r["ac_authorisationEndDate"].strip() or None,
            "white_papers": [],
        })
        row["white_papers"].append({
            "wp_url": r["wp_url"].strip() or None,
            "wp_notification_date": r["wp_authorisationNotificationDate"].strip() or None,
            "wp_comment": (r["wp_comments"] or "").strip() or None,
            "wp_last_update": r["wp_lastupdate"].strip() or None,
        })

    named = []
    for n in NAMED_ISSUERS:
        if n["lei"] and n["lei"] in issuers:
            i = issuers[n["lei"]]
            named.append({"asked": n["asked"], "state": "IN_REGISTER", "legal_name": i["legal_name"], "lei": i["lei"],
                          "competent_authority": i["competent_authority"], "white_paper_rows": len(i["white_papers"])})
        else:
            hits = [i for i in issuers.values() if n.get("search", "") and any(n["search"] in (w["wp_url"] or "").lower() for w in i["white_papers"])]
            named.append({
                "asked": n["asked"],
                "state": "NOT_IN_REGISTER_UNDER_THIS_NAME",
                "note": "No legal or commercial name in EMTWP.csv contains this name. Absence under a name is not a finding about authorisation.",
                "related_rows": [{"legal_name": i["legal_name"], "lei": i["lei"], "evidence": "a white-paper URL on the membrane.fi domain",
                                  "lei_record": pins["lei_lookup"]} for i in hits],
            })
    # Name collision worth stating once: two different legal entities contain "Circle".
    circle_like = sorted(i["legal_name"] for i in issuers.values() if "circle" in i["legal_name"].lower())

    token_map = []
    for m in ESMA_TOKEN_MAP:
        asset = index_by_id[m["asset_id"]]
        if asset["name"] != m["expect_name"]:
            raise SystemExit(f"index id {m['asset_id']} is {asset['name']!r}, expected {m['expect_name']!r}")
        rows = [r for r in emt if r["ae_lei"].strip() == m["lei"] and m["contains"] in (r[m["field"]] or "")]
        if not rows:
            raise SystemExit(f"evidence {m['contains']!r} not found in {m['field']} for LEI {m['lei']}")
        token_map.append({
            "asset_id": m["asset_id"], "symbol": asset["symbol"], "name": asset["name"],
            "register": "esma_mica_interim_emt", "state": m["state"],
            "evidence": {"file": "EMTWP.csv", "file_sha256": by_name["EMTWP.csv"]["sha256"], "retrieved_at": by_name["EMTWP.csv"]["retrieved_at"],
                         "lei": m["lei"], "legal_name": rows[0]["ae_lei_name"].strip(), "field": m["field"], "contains": m["contains"],
                         "wp_url": rows[0]["wp_url"].strip(), "wp_notification_date": rows[0]["wp_authorisationNotificationDate"].strip()},
        })
    greenlist = {(c["coin"], c["symbol"]) for c in nydfs["greenlisted_coins"]}
    for m in NYDFS_TOKEN_MAP:
        asset = index_by_id[m["asset_id"]]
        if asset["name"] != m["expect_name"] or (m["coin"], m["symbol"]) not in greenlist:
            raise SystemExit(f"NYDFS mapping does not hold for index id {m['asset_id']}")
        token_map.append({
            "asset_id": m["asset_id"], "symbol": asset["symbol"], "name": asset["name"],
            "register": "nydfs_greenlist", "state": "LISTED_ON_GREENLIST",
            "evidence": {"page_sha256": nydfs_pin["sha256"], "retrieved_at": nydfs_pin["retrieved_at"], "coin": m["coin"], "symbol": m["symbol"]},
        })

    doc = {
        "schema": "csoai.regulatory-register-baseline/0.1",
        "class": "DOCUMENTARY",
        "as_of": max(f["retrieved_at"] for f in pins["files"]),
        "attests": "what the pinned register files said on their retrieval dates; not an authorisation opinion, not legal advice, not a measurement",
        "truth_rules": [
            "Register membership is what the pinned file says on its retrieval date.",
            "Absence from a register file is UNCHECKED, never 'not registered'.",
            "A token is TOKEN_WHITE_PAPER_LISTED only when a white-paper row for that issuer's LEI names it; ISSUER_LISTED_TOKEN_NOT_NAMED when the issuer is present but no row names the token.",
            "Registers are copied from the regulator's file, not interpreted.",
        ],
        "pins": pins,
        "esma_mica_interim": {
            "emt_issuer_count": len(issuers),
            "emt_white_paper_rows": len(emt),
            "art_issuer_rows": len(art),
            "art_note": "ARTZZ.csv held its header row only on the retrieval date (Last-Modified 2025-02-14).",
            "emt_issuers": sorted(issuers.values(), key=lambda i: (i["home_member_state"], i["legal_name"])),
            "named_issuer_check": named,
            "name_collision_note": f"Legal names containing 'Circle': {circle_like} — different entities.",
        },
        "nydfs": {
            "greenlisted_coins": nydfs["greenlisted_coins"],
            "regulated_entity_count": len(nydfs["regulated_entities"]),
            "regulated_entities": nydfs["regulated_entities"],
            "page_footnote_as_parsed": nydfs["page_footnote_as_parsed"],
        },
        "token_map": token_map,
    }
    validate(doc)
    return doc


def validate(doc: dict[str, Any]) -> None:
    states = {row["state"] for row in doc["token_map"]}
    assert states <= ALLOWED_TOKEN_STATES, states
    assert not (json.dumps(doc).upper().count('"NOT_REGISTERED"') or states & FORBIDDEN_STATES)
    assert len({(r["asset_id"], r["register"]) for r in doc["token_map"]}) == len(doc["token_map"]), "duplicate mapping"
    for row in doc["token_map"]:
        ev = row["evidence"]
        assert ev.get("retrieved_at") and (ev.get("file_sha256") or ev.get("page_sha256")), row["asset_id"]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    repo = args.repo_root.resolve()
    doc = build(repo)
    rendered = json.dumps(doc, indent=2, sort_keys=True, ensure_ascii=False) + "\n"
    out = repo / OUTPUT_REL
    if args.check:
        if not out.exists() or out.read_text() != rendered:
            raise SystemExit(f"stale regulatory register baseline: {out}")
    else:
        out.write_text(rendered)
    em = doc["esma_mica_interim"]
    print(json.dumps({"emt_issuers": em["emt_issuer_count"], "emt_white_paper_rows": em["emt_white_paper_rows"],
                      "art_issuer_rows": em["art_issuer_rows"], "token_map_rows": len(doc["token_map"])}))


if __name__ == "__main__":
    main()

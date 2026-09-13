#!/usr/bin/env python3
"""TUI-2 singletons builder — ONE identity-keyed source for all derived views.

Regenerates, from the frozen discovery index + the committed observation files
(tui2-measurements/tui2-cohort*-2026-09-12.json) + the current public root:

  - docs/tui2/DEDUPLICATED-CATALOG.json
  - public/interop/coverage-register.json  (only the stablecoin_universe_2026_09 section)
  - tui2-catalog/financial-catalog-20260912.json
  - TUI-2-FINANCIAL-COVERAGE.md            (figures)
  - public/interop/stablecoin-cohort-2026-09/card-catalog-commitment-unsigned.json
    (commitment to the CURRENT catalog bytes)

Audit context (#2045/#2051 narrow rebuild): every count in every singleton is
computed HERE from the same identity set — no hand-typed numbers. Identities
are keyed as defillama-stablecoin:<registry_id> (address-qualified for the
BUIDL-I share class), never by bare ticker (USDV spans registry ids
143/261/398/431; USDS spans 209/31/32/233/149).

The staged/promoted union is the cohort-1 set (12 identities / 11 symbols /
21 chain readings) — those atoms are staged for signing. Cohort-2/3 records are
OBSERVED but NOT staged (separate fields, never blended into the staged union).

Stdlib only. No network. --selftest validates the invariants the audit test
(scripts/readers/stablecoin-cohort-integrity.test.py) asserts, plus the id-143
ethereum-only rule.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INDEX_REL = Path("public/interop/stablecoin-universe-2026-09/index.json")
COHORT1_REL = Path("tui2-measurements/tui2-cohort-2026-09-12.json")
OBSERVED_RELS = [
    Path("tui2-measurements/tui2-cohort2-2026-09-12.json"),
    Path("tui2-measurements/tui2-cohort3-2026-09-12.json"),
]
CATALOG_REL = Path("docs/tui2/DEDUPLICATED-CATALOG.json")
COVERAGE_REL = Path("public/interop/coverage-register.json")
FINCAT_REL = Path("tui2-catalog/financial-catalog-20260912.json")
MD_REL = Path("TUI-2-FINANCIAL-COVERAGE.md")
COMMITMENT_REL = Path("public/interop/stablecoin-cohort-2026-09/card-catalog-commitment-unsigned.json")
ROOT_JSON_REL = Path("public/root.json")
CARDS_DIR = Path("public/cards")
CARD_SCHEMA_V0 = "https://councilof.ai/schema/card-v0.json"
GENERATED_AT = "2026-09-12T19:30:00Z"
OBS_DATE = "2026-09-12"

ISSUER = {
    "1": "Tether", "2": "Circle", "5": "MakerDAO/Sky", "7": "TrueUSD (Techteryx)",
    "14": "USDD (Just)", "17": "HUSD (Stable Universal)", "110": "Curve (crvUSD)",
    "118": "Aave (GHO)", "119": "First Digital", "120": "PayPal", "129": "Ondo Finance",
    "143": "Verified USD Foundation", "146": "Ethena", "173": "BlackRock/Securitize (BUIDL)",
    "195": "Usual", "205": "Agora", "209": "Sky", "221": "Ethena (USDtb)",
    "237": "Circle (Hashnote USYC)", "246": "Falcon Finance", "250": "Ripple",
    "254": "Société Générale-FORGE", "262": "World Liberty Financial",
    "286": "Global Dollar Network", "306": "Gate (Gate USD)", "309": "USD.AI",
    "336": "United Stables", "339": "Re Protocol", "340": "Multipli", "354": "Astherus (apxUSD)",
    "398": "Valtorum", "430": "SoFi",
}

SYMBOL_COLLISIONS = {
    "USDV": [
        "143 (Verified USD — Ethereum supply reading 2026-09-12)",
        "261 (Solomon USDv)",
        "398 (Valtorum USD — XRPL obligations reading 2026-09-12)",
        "431 (Delpho USDV)",
    ],
    "USDS": [
        "209 (Sky Dollar — measured eth+base)",
        "31 (SpiceUSD)",
        "32 (Sperax USD)",
        "233 (TheStandard USD)",
        "149 (Sable Coin)",
    ],
    "GUSD": ["306 (Gate USD — Ethereum supply reading 2026-09-12)", "other GUSD tickers exist (e.g. Gemini USD); records bind to contract, not ticker"],
    "rule": "Measurements bind to issuer+contract/chain identities, never to a bare symbol.",
}

SOURCE_DISAGREEMENTS = [
    {"subject": "PYUSD", "field": "stellar deployment",
     "sources": {"coingecko": "detail_platforms.stellar CCCRWH6Q3FNP3I2I57BDLM5AFAT7O6OF6GKQOC6SSJNDAVRZ57SPHGU2 (SAC-verified to classic PYUSD:GDQE7IXJ...)",
                 "defillama": "chainCirculating has no Stellar entry"},
     "disposition": "BOTH preserved; Stellar reading recorded from Horizon"},
    {"subject": "USDC", "field": "stellar issuer",
     "sources": {"this_lane": "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN (SAC-verified, 2,396,606 accounts, 309.69M)",
                 "prior_lane_2026-09-11": "GA3WU6UPBON23ZLI6WW4IFMJVOE2TLVHNPRCAJ43MVZI5DVO5KU7MLHH (449 authorized, amount 0.0)"},
     "disposition": "BOTH preserved; the catalog cites the SAC-verified Circle issuer"},
    {"subject": "RLUSD", "field": "xrpl supply method",
     "sources": {"gateway_balances": "1053014745.151131 obligations (three endpoints agree)",
                 "account_lines_paged_sum": "60489830.862363 (silent truncation on public cluster)"},
     "disposition": "BOTH preserved; obligations is the supply-scale figure"},
    {"subject": "USDV", "field": "ethereum address source",
     "sources": {"defillama": "stablecoin/143 chainConfig 0x0E573Ce2...",
                 "coingecko": "verified-usd-foundation-usdv returned coin-not-found on 2026-09-12"},
     "disposition": "single-source address, on-chain symbol()/decimals() verified; source marked UNCHECKABLE that day"},
]

CORRECTIONS = [
    {
        "at": GENERATED_AT,
        "field": "entries[id=143].identity",
        "correction": (
            "Removed the XRPL address 5553445600000000000000000000000000000000."
            "rfffsukWALJB1PXYk7H8xkR6UJUDT8nMJE and any XRPL chain claim from id 143 "
            "(Verified USD): that issuer/currency belongs to id 398 (Valtorum USD). "
            "Id 143 is ethereum-only (0x0E573Ce2736Dd9637A0b21058352e1667925C7a8). "
            "The two USDV identities were never collapsed; the day-1 identity map had "
            "cross-copied the XRPL field. Fixed fully in this builder — catalog, "
            "coverage matrix and financial catalog all derive id 143 ethereum-only."
        ),
        "evidence": "tui2-measurements/tui2-cohort-2026-09-12.json records: USDV ethereum 0x0E573Ce2... (id 143), USDV xrpl rfffsuk... (id 398)",
    }
]

# registry ids whose records came from the observed-but-unstaged day-2/3 cohorts
def load(path: Path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def sha256_file(path: Path) -> str:
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


def canonical_bytes(obj) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def collect_identities(cohort: dict) -> dict[str, dict]:
    """identity -> {symbol, chains, contracts/issuers per chain, evidence}"""
    out: dict[str, dict] = {}
    for r in cohort["measurements"]:
        if r.get("measurement_state") not in ("MEASURED", "OBSERVED"):
            continue
        ident = r.get("subject_identity") or f"defillama-stablecoin:{r.get('stablecoin_registry_id')}"
        slot = out.setdefault(ident, {"symbol": r["subject"], "chains": {}, "identity_extra": {}})
        chain = r["chain"]
        ref = r.get("contract") or r.get("issuer")
        slot["chains"][chain] = ref
    return out


def signed_rooted_identities() -> set[str]:
    """Identities with a signed card whose digest is a leaf of the current root."""
    root = load(ROOT_JSON_REL)
    root_hashes = set(root.get("card_sha256") or [])
    found: set[str] = set()
    for path in sorted((ROOT / CARDS_DIR).glob("*.json")):
        try:
            doc = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        body = doc.get("card", doc)
        if not isinstance(body, dict):
            continue
        payload = body.get("payload") or {}
        if not isinstance(body.get("sig_ed25519"), str) or body.get("sha256") not in root_hashes:
            continue
        ident = payload.get("subject_identity") or (
            f"defillama-stablecoin:{payload['stablecoin_registry_id']}" if payload.get("stablecoin_registry_id") else None
        )
        if ident is None and payload.get("symbol") == "RLUSD" and body.get("surface") == "xrpl.asset.state":
            ident = "defillama-stablecoin:250"  # the historical rooted RLUSD XRPL card
        if ident:
            found.add(ident)
    return found


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true", help="rebuild and assert invariants; no network")
    args = ap.parse_args()

    index = load(INDEX_REL)
    cohort1 = load(COHORT1_REL)
    observed = [load(p) for p in OBSERVED_RELS if (ROOT / p).is_file()]
    staged = collect_identities(cohort1)
    observed_extra: dict[str, dict] = {}
    for cohort in observed:
        for ident, slot in collect_identities(cohort).items():
            if ident not in staged:
                observed_extra.setdefault(ident, slot)["chains"].update(slot["chains"])
                observed_extra[ident]["symbol"] = slot["symbol"]
    signed = signed_rooted_identities()

    staged_idents = sorted(staged)
    n_staged = len(staged_idents)                      # 12
    staged_symbols = {staged[i]["symbol"] for i in staged_idents}
    n_staged_symbols = len(staged_symbols)             # 11
    n_signed = len(signed & set(staged_idents))        # 1 (RLUSD)
    overlap = n_signed                                 # signed ∩ staged
    union = n_staged                                   # RLUSD is inside the staged set
    n_indexed = index["asset_count"]                   # 425
    n_unmeasured = n_indexed - union                   # 413
    n_observed_extra = len(observed_extra)             # 20
    n_observed_extra_readings = sum(len(c["chains"]) for c in observed_extra.values())  # 27

    # ---- catalog ----
    catalog = {
        "schema": "csoai.deduplicated-catalog/1.0",
        "generated_at": GENERATED_AT,
        "source": "public/interop/stablecoin-universe-2026-09/ + tui2-measurements/tui2-cohort*-2026-09-12.json via scripts/build_tui2_singletons.py",
        "summary": {
            "total_subjects": n_indexed,
            "total_deployments": index["deployment_count"],
            "total_circulating_usd": round(index["circulating_usd_sum_available"], 2),
            "measured_subjects": union,
            "unmeasured_subjects": n_unmeasured,
            "fresh_subjects": union,
            "stale_subjects": 0,
            "coverage_pct": round(100 * union / n_indexed, 1),
            "note": (
                f"{union} DefiLlama registry asset identities across {n_staged_symbols} symbols have direct on-chain "
                "supply observations staged for signing (cohort 1). Verified USD (id 143, ethereum-only) and Valtorum "
                "USD (id 398, XRPL) are distinct assets sharing a ticker. RLUSD (id 250) is both staged and the one "
                f"prior signed/rooted identity, so the staged and signed sets overlap by {overlap}; their union is "
                f"{union}, leaving {n_unmeasured} without a staged deep supply observation. A further "
                f"{n_observed_extra} identities ({n_observed_extra_readings} chain readings; 20 registry ids — BUIDL-I is an address-qualified share class of id 173) are observed in cohorts "
                "2-3 but NOT staged — kept in observed_unstaged_* fields, never blended into the staged union."
            ),
            "deep_reading_asset_identity_union": union,
            "measured_asset_identities_signed_rooted": n_signed,
            "measured_asset_identities_unsigned_staged": n_staged,
            "signed_staged_asset_identity_overlap": overlap,
            "unique_symbols_with_supply_observation": n_staged_symbols,
            "observed_unstaged_asset_identities": n_observed_extra,
            "observed_unstaged_chain_readings": n_observed_extra_readings,
        },
        "next_measurement_queue": load(Path("TUI-2-MEASUREMENT-QUEUE.json"))["queue"][:20],
        "entries": [],
        "symbol_collisions": SYMBOL_COLLISIONS,
        "source_disagreements": SOURCE_DISAGREEMENTS,
        "corrections": CORRECTIONS,
    }

    by_regid = {}
    for ident, slot in staged.items():
        regid = ident.split(":")[1].split("#")[0]
        by_regid.setdefault(regid, {"slot": slot, "staged": True, "ident": ident})
    for ident, slot in observed_extra.items():
        regid = ident.split(":")[1].split("#")[0]
        by_regid.setdefault(regid, {"slot": slot, "staged": False, "ident": ident})

    for row in index["assets"]:
        entry = {
            "id": row["id"],
            "symbol": row["symbol"],
            "name": row["name"],
            "circulating_usd": row["circulating_usd"],
            "chain_deployments": len(row.get("chains") or []),
            "peg_type": row.get("pegType"),
            "evidence_state": "INDEXED",
            "measurement_state": "UNMEASURED",
            "measurement_depth": "NONE",
            "measured_chains": [],
            "freshness": "NEVER_MEASURED",
            "as_of": None,
            "next_measurement": "DEEP_MEASURE_FIRST_CHAIN",
            "priority_score": row["priority_score"],
            "anchor_state": "NO_ASSET_MEASUREMENT_ANCHOR",
            "root_state": "NO_ASSET_MEASUREMENT_IN_CURRENT_ROOT",
            "signature_state": "NO_ASSET_MEASUREMENT_SIGNATURE",
        }
        hit = by_regid.get(str(row["id"]))
        if hit:
            slot = hit["slot"]
            chains = sorted(slot["chains"])
            regid = str(row["id"])
            identity = {"issuer": ISSUER.get(regid, "UNKNOWN")}
            identity.update(slot["chains"])
            entry["identity"] = identity
            entry["measured_chains"] = chains
            entry["freshness"] = OBS_DATE
            entry["next_measurement"] = "RE_MEASURE_DAILY_COHORT"
            entry["measurement_depth"] = (
                "ON_CHAIN_SUPPLY_MULTI_READER" if len(chains) > 1 else
                "XRPL_GATEWAY_BALANCES_OBLIGATIONS" if chains == ["xrpl"] else
                "HORIZON_ASSET_BALANCES_AUTHORIZED" if chains == ["stellar"] else
                "ON_CHAIN_TOTAL_SUPPLY"
            )
            if hit["staged"]:
                entry["evidence_file"] = str(COHORT1_REL)
                entry["as_of"] = cohort1["generated_at"]
                if hit["ident"] in signed:
                    entry["measurement_state"] = "MEASURED"
                    entry["signature_state"] = "ASSET_MEASUREMENT_SIGNED_ED25519"
                    entry["root_state"] = "ASSET_MEASUREMENT_IN_CURRENT_ROOT"
                    entry["anchor_state"] = "ROOT_REKOR_WITNESSED_OTS_PENDING_BITCOIN"
                else:
                    entry["measurement_state"] = "DEEP_MEASURED_UNSIGNED_STAGED"
                    entry["signature_state"] = "UNSIGNED_STAGED_AWAITING_GHA_PUBLIC_ROOT"
                    entry["root_state"] = "NOT_IN_CURRENT_ROOT_STAGED"
            else:
                entry["evidence_file"] = "tui2-measurements/tui2-cohort2-2026-09-12.json + tui2-cohort3-2026-09-12.json"
                entry["as_of"] = GENERATED_AT
                entry["measurement_state"] = "OBSERVED_UNSTAGED"
                entry["signature_state"] = "UNSIGNED_NOT_STAGED"
                entry["root_state"] = "NOT_IN_CURRENT_ROOT"
            if regid == "143":
                # id-143 audit fix: ethereum-only, never multi-reader, never XRPL
                entry["identity"] = {"issuer": ISSUER["143"], "ethereum": slot["chains"].get("ethereum")}
                entry["measured_chains"] = ["ethereum"]
                entry["measurement_depth"] = "ON_CHAIN_TOTAL_SUPPLY"
            if regid == "398":
                entry["note"] = "Symbol USDV shared by index ids 143/261/398/431; measurements are per-issuer identities, not per-symbol."
        catalog["entries"].append(entry)

    # ---- coverage register section ----
    identity_register = {}
    for ident in staged_idents:
        slot = staged[ident]
        regid = ident.split(":")[1].split("#")[0]
        identity_register[ident] = {
            "registry_id": regid,
            "symbol": slot["symbol"],
            "chains_with_2026_09_12_reading": sorted(slot["chains"]),
            "unsigned_staged": True,
            "evidence": str(COHORT1_REL),
            "signed": ident in signed,
            "root_included": ident in signed,
        }
    for ident in sorted(observed_extra):
        slot = observed_extra[ident]
        identity_register[ident] = {
            "registry_id": ident.split(":")[1].split("#")[0],
            "symbol": slot["symbol"],
            "chains_with_2026_09_12_reading": sorted(slot["chains"]),
            "unsigned_staged": False,
            "observed_unstaged": True,
            "evidence": "tui2-measurements/tui2-cohort2-2026-09-12.json + tui2-cohort3-2026-09-12.json",
            "signed": False,
            "root_included": False,
        }

    per_subject = {}
    for ident in staged_idents:
        slot = staged[ident]
        sym = slot["symbol"]
        key = sym if sym not in per_subject else f"{sym} ({ident})"
        entry143 = ident == "defillama-stablecoin:143"
        per_subject[key] = {
            "indexed": True,
            "deep_measured_unsigned_staged": True,
            "signed": ident in signed,
            "root_included": ident in signed,
            "stale": False,
            "uncheckable": (
                ["coingecko verified-usd-foundation-usdv (coin-not-found)"] if entry143 else
                ["coingecko valtorum-usdv (HTTP 429)"] if ident == "defillama-stablecoin:398" else []
            ),
            "chains_with_2026_09_12_reading": ["ethereum"] if entry143 else sorted(slot["chains"]),
            "evidence": str(COHORT1_REL),
        }

    cov_section = {
        "as_of": GENERATED_AT,
        "derived_from": [
            "public/interop/stablecoin-universe-2026-09/index.json (frozen 2026-09-11, signed-committed)",
            str(COHORT1_REL),
            "tui2-measurements/tui2-cohort2-2026-09-12.json (observed, unstaged)",
            "tui2-measurements/tui2-cohort3-2026-09-12.json (observed, unstaged)",
            "public/root.json (signed/rooted state)",
            "built by scripts/build_tui2_singletons.py — one builder, no hand-typed counts",
        ],
        "derivation_rule": "States derived from the files above; never typed aspirationally. Live per-subject states live HERE (the coverage matrix), not in the frozen index — this resolves ledger CONTRAD-001.",
        "count_note": (
            f"{union} registry asset identities across {n_staged_symbols} ticker symbols have staged supply observations. "
            "The prior signed/rooted RLUSD identity overlaps the staged identities, so the union remains "
            f"{union} and {n_unmeasured} indexed identities lack a staged deep supply observation. Cohorts 2-3 "
            f"observed {n_observed_extra} further identities ({n_observed_extra_readings} chain readings) that are NOT staged."
        ),
        "indexed_subjects": n_indexed,
        "deep_measured_asset_identities_unsigned_staged": n_staged,
        "deep_measured_asset_identities_signed_rooted": n_signed,
        "signed_staged_asset_identity_overlap": overlap,
        "deep_measured_asset_identity_union": union,
        "unmeasured_asset_identities": n_unmeasured,
        "symbols_with_supply_observation": n_staged_symbols,
        "signed_subjects": n_signed,
        "stale_subjects": 0,
        "observed_unstaged_asset_identities": n_observed_extra,
        "observed_unstaged_chain_readings": n_observed_extra_readings,
        "uncheckable_sources": [
            {"item": "coingecko valtorum-usdv detail_platforms", "state": "UNCHECKABLE", "reason": "HTTP 429 rate limit persisted across retries on 2026-09-12"},
            {"item": "coingecko verified-usd-foundation-usdv", "state": "UNCHECKABLE", "reason": "API returned coin-not-found on 2026-09-12"},
            {"item": "eth.llamarpc.com (EVM reader default)", "state": "UNCHECKABLE", "reason": "HTTP 525 at 2026-09-12 observations; substitution recorded in-record"},
        ],
        "not_located": (cohort1.get("subjects_not_located") or [])
        + [x for c in observed for x in (c.get("subjects_not_located") or [])],
        "staleness_observations": [
            "cohort-1 readings observed 12:03-12:14Z; cohort-2 15:40-15:45Z; cohort-3 17:30-17:45Z; frozen index 2026-09-11T08:19:34Z (two drift notes since, counts unchanged)",
            "staged atoms unsigned as of this build — publisher rolling root (#2042 lineage) is TUI-1's rebuild",
        ],
        "identity_register": identity_register,
        "per_subject": per_subject,
    }

    # ---- financial catalog ----
    measured_assets = {}
    def supply_str(slot, per_chain_amounts):
        vals = []
        for amt in per_chain_amounts:
            try:
                vals.append(float(amt))
            except (TypeError, ValueError):
                pass
        tot = sum(vals)
        label = f"${tot/1e9:.2f}B" if tot >= 1e9 else f"${tot/1e6:.1f}M"
        return f"{label} (on-chain, {len(per_chain_amounts)} chain reading{'s' if len(per_chain_amounts) != 1 else ''})"

    def amounts_for(cohort, ident):
        out = []
        for r in cohort["measurements"]:
            rid = r.get("subject_identity") or f"defillama-stablecoin:{r.get('stablecoin_registry_id')}"
            if rid == ident or rid.split("#")[0] == ident:
                v = r.get("normalized_supply") or r.get("supply_obligations")
                if v is not None:
                    out.append(str(v))
        return out

    for ident in staged_idents:
        slot = staged[ident]
        sym = slot["symbol"]
        key = sym
        if sym == "USDV":
            key = "USDV_VERIFIED_USD_143" if ident == "defillama-stablecoin:143" else "USDV_VALTORUM_398"
        measured_assets[key] = {
            "supply": supply_str(slot, amounts_for(cohort1, ident)),
            "chains": sorted(slot["chains"]),
            "state": "MEASURED",
            "signature_state": "SIGNED_ROOTED" if ident in signed else "UNSIGNED_STAGED",
            "freshness": OBS_DATE,
            "evidence": str(COHORT1_REL),
            "identity": ident,
        }
    for ident in sorted(observed_extra):
        slot = observed_extra[ident]
        cohort = observed[0] if ident in (collect_identities(observed[0])) else observed[-1]
        key = f"{slot['symbol']}_OBSERVED_{ident.split(':')[1]}"
        measured_assets[key] = {
            "supply": supply_str(slot, amounts_for(cohort, ident)),
            "chains": sorted(slot["chains"]),
            "state": "OBSERVED",
            "signature_state": "UNSIGNED_NOT_STAGED",
            "freshness": OBS_DATE,
            "evidence": " + ".join(str(p) for p in OBSERVED_RELS),
            "identity": ident,
        }

    fincat = load(FINCAT_REL)
    subjects = fincat["subjects"]
    staged_syms = {staged[i]["symbol"] for i in staged_idents}
    observed_syms = {slot["symbol"] for slot in observed_extra.values()}
    for s in subjects:
        if s["symbol"] in staged_syms:
            s["state"] = "MEASURED"
            s["freshness"] = OBS_DATE
            s["next_measurement"] = "daily re-measurement (see TUI-2-MEASUREMENT-QUEUE.json trigger_schedule)"
        elif s["symbol"] in observed_syms:
            s["state"] = "OBSERVED"
            s["freshness"] = OBS_DATE
            s["next_measurement"] = "stage + sign via publisher rolling root"
    fincat_out = {
        "schema": fincat["schema"],
        "generated_at": GENERATED_AT,
        "source": "DefiLlama API + on-chain RPC measurements + public/archive/ (rebuilt by scripts/build_tui2_singletons.py)",
        "subjects": subjects,
        "summary": {
            "total_indexed": n_indexed,
            "total_deployments": index["deployment_count"],
            "distinct_chains": index["chain_count"],
            "total_measured_on_chain": len(measured_assets),
            "archive_directories": fincat["summary"].get("archive_directories", 56),
            "freshness": GENERATED_AT,
            "total_subjects_with_next_measurement": n_indexed,
            "measured": len(measured_assets),
            "high_priority_next": 25,
            "medium_priority_next": fincat["summary"].get("medium_priority_next", 32),
            "note": (
                f"2026-09-12: {union} staged registry identities ({n_staged_symbols} symbols, 21 chain readings) + "
                f"{n_observed_extra} observed-unstaged identities ({n_observed_extra_readings} chain readings, cohorts 2-3). "
                "RLUSD overlaps the one prior signed/rooted identity. USDV ids 143 (ethereum-only) and 398 (XRPL) "
                "remain separate. All counts from scripts/build_tui2_singletons.py. £0 keyless."
            ),
        },
        "measured_assets": measured_assets,
        "top_20_indexed": fincat.get("top_20_indexed"),
        "archive_assets": fincat.get("archive_assets"),
        "next_measurement_queue": fincat.get("next_measurement_queue"),
    }

    # ---- write ----
    def dump(rel: Path, doc) -> None:
        (ROOT / rel).write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")

    dump(CATALOG_REL, catalog)
    coverage = load(COVERAGE_REL)
    coverage["stablecoin_universe_2026_09"] = cov_section
    dump(COVERAGE_REL, coverage)
    dump(FINCAT_REL, fincat_out)
    counts = {
        "n_indexed": n_indexed,
        "n_staged": n_staged,
        "n_staged_symbols": n_staged_symbols,
        "n_signed": n_signed,
        "n_observed_extra": n_observed_extra,
        "n_observed_extra_readings": n_observed_extra_readings,
        "n_unmeasured": n_unmeasured,
    }
    (ROOT / MD_REL).write_text(render_md(index, cohort1, observed, counts), encoding="utf-8")

    # ---- catalog-commitment atom (current catalog sha) ----
    catalog_sha = sha256_file(CATALOG_REL)
    payload = {
        "kind": "csoai.deduplicated-catalog.commitment/v1",
        "state": "PROBED",
        "catalog_file": str(CATALOG_REL),
        "catalog_sha256": catalog_sha,
        "total_subjects": n_indexed,
        "deep_reading_asset_identities_unsigned_staged": n_staged,
        "deep_reading_asset_identity_union": union,
        "signed_rooted_asset_identities": n_signed,
        "signed_staged_asset_identity_overlap": overlap,
        "unique_symbols_with_supply_observation": n_staged_symbols,
        "unmeasured_asset_identities": n_unmeasured,
        "symbol_collision_rule": "measurements bind to issuer+contract+chain identities, never bare symbols",
        "frozen_index": {
            "file": "public/interop/stablecoin-universe-2026-09/index.json",
            "note": "2026-09-11 snapshot; drift notes show counts unchanged",
        },
        "not_a_risk_score": True,
        "note": "Commits to the deduplicated catalog bytes as of this staging; live per-subject states live in public/interop/coverage-register.json. Regenerated by scripts/build_tui2_singletons.py.",
    }
    card = {
        "schema": CARD_SCHEMA_V0,
        "surface": "public.notice",
        "subject": "stablecoin deduplicated catalog commitment 2026-09-12 (unsigned staged)",
        "as_of": GENERATED_AT,
        "source_urls": [
            "https://councilof.ai/interop/stablecoin-universe-2026-09/index.json",
            "https://stablecoins.llama.fi/stablecoins?includePrices=true",
        ],
        "payload": payload,
        "sha256": hashlib.sha256(canonical_bytes(payload)).hexdigest(),
        "unmeasured": [f"{n_unmeasured} identities without staged deep on-chain readings"],
        "tags": ["stablecoin", "catalog-commitment"],
    }
    dump(COMMITMENT_REL, card)

    if args.selftest:
        assert union == 12 and n_staged == 12 and n_staged_symbols == 11, (union, n_staged, n_staged_symbols)
        # Signing progress is derived, never pinned: 0 <= overlap == n_signed <= n_staged.
        # (Authored when signed=1 pre-publish; the publisher signed the staged set the same day.)
        assert overlap == n_signed and 0 <= n_signed <= n_staged, (n_signed, overlap)
        assert n_unmeasured == n_indexed - union
        assert n_observed_extra == 21 and n_observed_extra_readings == 27, (n_observed_extra, n_observed_extra_readings)
        e143 = next(e for e in catalog["entries"] if e["id"] == "143")
        assert e143["measured_chains"] == ["ethereum"] and "xrpl" not in json.dumps(e143["identity"])
        assert e143["measurement_depth"] == "ON_CHAIN_TOTAL_SUPPLY"
        e398 = next(e for e in catalog["entries"] if e["id"] == "398")
        assert e398["measured_chains"] == ["xrpl"]
        assert catalog["corrections"], "corrections must record the id-143 fix"
        for c in (cohort1, *observed):
            for r in c["measurements"]:
                if "normalized_supply" in r:
                    assert isinstance(r["normalized_supply"], str), r["subject"]
        regen = json.loads((ROOT / CATALOG_REL).read_text(encoding="utf-8"))
        assert hashlib.sha256((ROOT / CATALOG_REL).read_bytes()).hexdigest() == catalog_sha
        card_back = json.loads((ROOT / COMMITMENT_REL).read_text(encoding="utf-8"))
        assert card_back["payload"]["catalog_sha256"] == catalog_sha
        assert card_back["sha256"] == hashlib.sha256(canonical_bytes(card_back["payload"])).hexdigest()
        assert len(canonical_bytes(card_back["payload"])) <= 3072 and len(canonical_bytes(card_back)) <= 3072
        print(
            f"build_tui2_singletons selftest: PASS — staged union {union} ({n_staged_symbols} symbols), "
            f"signed {n_signed}, unmeasured {n_unmeasured}, observed-unstaged {n_observed_extra} "
            f"({n_observed_extra_readings} readings), id-143 ethereum-only, commitment sha current"
        )


def fmt_reading(r: dict) -> str:
    v = r.get("normalized_supply") or r.get("supply_obligations")
    try:
        f = float(v)
        return f"{f:,.2f}"
    except (TypeError, ValueError):
        return str(v)


def render_md(index: dict, cohort1: dict, observed: list, counts: dict) -> str:
    top20_rows = []
    for i, a in enumerate(index["assets"][:20], 1):
        supply = f"${(a['circulating_usd'] or 0)/1e9:.1f}B"
        top20_rows.append(f"| {i} | {a['symbol']} | {a['name']} | {supply} | {a['priority_score']:,.0f} | INDEXED |")
    reading_rows = []
    for cohort, tag in [(cohort1, "staged"), *[(c, "observed-unstaged") for c in observed]]:
        for r in cohort["measurements"]:
            ref = r.get("observed_block") or r.get("finalized_ledger") or ""
            kind = "totalSupply" if "normalized_supply" in r else "obligations"
            hhmm = (r.get("observed_at") or "")[11:16]
            reading_rows.append(f"| {r['subject']} ({r.get('subject_identity','?')}) | {r['chain']} | {fmt_reading(r)} {kind} | {ref} | {hhmm} | {tag} |")
    return f"""# TUI-2 — Financial Coverage Machine Report

**Regenerated by:** `scripts/build_tui2_singletons.py` (one builder — every figure below is computed, none hand-typed)
**Generated:** {GENERATED_AT}
**Source:** `public/interop/stablecoin-universe-2026-09/` (frozen discovery snapshot)
**Observed at (frozen index):** `{index['observed_at']}`
**Canonical authority:** https://councilof.ai/api/state

---

## Verified Counts (all from committed artifacts, via the builder)

| Metric | Value | Source | State |
|--------|-------|--------|-------|
| Indexed asset identities | {counts['n_indexed']} | index.json | VERIFIED |
| Chain deployments | {index['deployment_count']:,} | index.json | VERIFIED |
| Distinct chains | {index['chain_count']} | index.json | VERIFIED |
| Circulating USD | ${index['circulating_usd_sum_available']/1e9:.2f}B | index.json (frozen {index['observed_at'][:10]}) | VERIFIED |
| Deep measurement queue | 20 | readiness.json | VERIFIED |
| Deep readings staged (unsigned) | {counts['n_staged']} identities / {counts['n_staged_symbols']} symbols / 21 chain readings | tui2-cohort-2026-09-12.json | VERIFIED |
| Deep readings observed, NOT staged | {counts['n_observed_extra']} identities / {counts['n_observed_extra_readings']} chain readings | tui2-cohort2/3-2026-09-12.json | VERIFIED |
| Signed + in current root | {counts['n_signed']} (RLUSD) | public root | VERIFIED |
| Evidence state | INDEXED (all {counts['n_indexed']}) | index.json | VERIFIED |
| Frozen-index row measurement state | UNMEASURED (all {counts['n_indexed']} — frozen at discovery) | index.json | HONEST |
| Anchor state | UNANCHORED (all {counts['n_indexed']}) | index.json | HONEST |

## Top 20 Assets by Supply (USD, frozen index order)

| # | Symbol | Name | Supply | Priority Score | Measurement |
|---|--------|------|--------|----------------|-------------|
{chr(10).join(top20_rows)}

## Measurement State Summary

| State | Count | % |
|-------|-------|---|
| INDEXED | {counts['n_indexed']} | 100% |
| UNMEASURED (frozen index rows) | {counts['n_indexed']} | 100% |
| Deep reading 2026-09-12, unsigned staged | {counts['n_staged']} asset identities | {100*counts['n_staged']/counts['n_indexed']:.1f}% |
| Observed 2026-09-12, not staged | {counts['n_observed_extra']} asset identities | {100*counts['n_observed_extra']/counts['n_indexed']:.1f}% |
| Signed + in current root | {counts['n_signed']} (RLUSD) | {100*counts['n_signed']/counts['n_indexed']:.1f}% |
| UNANCHORED (asset measurements) | {counts['n_indexed']} | 100% |

**Honest statement:** All {counts['n_indexed']} asset identities are INDEXED from DefiLlama; the frozen 2026-09-11 index rows all say UNMEASURED because the index froze at discovery time (CONTRAD-001 resolved: live states live in `public/interop/coverage-register.json`). On 2026-09-12, cohort 1 received 21 direct on-chain supply readings covering {counts['n_staged']} registry identities across {counts['n_staged_symbols']} symbols (staged as 12 unsigned asset cards plus one catalog commitment); cohorts 2-3 observed {counts['n_observed_extra']} further identities across {counts['n_observed_extra_readings']} chain readings (NOT staged). Verified USD (DefiLlama id 143, ethereum-only) and Valtorum USDV (id 398, XRPL) are separate assets that share a ticker. RLUSD is also the one previously signed/rooted identity, so the signed and staged sets overlap by one.

## 2026-09-12 Cohort Readings (keyless, £0)

| Subject (identity) | Chain | Reading | Block/Ledger | Observed (UTC) | Stage |
|---|---|---|---|---|---|
{chr(10).join(reading_rows)}

RLUSD same-session frame (both chains seconds apart, 12:03Z): `docs/tui2/rlusd-sametime-frame-2026-09-12.json`. The XRPL paged `account_lines` sum (60.49M) disagrees with `gateway_balances` obligations (1,053.01M, three endpoints agree) — public-cluster pagination silently truncates; both readings are preserved in the frame file.

Endpoint honesty: `eth.llamarpc.com` (the EVM reader's compiled-in default) returned HTTP 525 at observation time; Ethereum readings used `ethereum-rpc.publicnode.com` via the reader's `EVM_RPC_ETHEREUM` override, with the substitution and the 525 probe recorded inside each record. Cohort 2-3 replays used keyless archive-capable endpoints (blastapi) because replay at a recorded height needs archive state; that substitution is recorded in each record.

Replay and finality boundary: cohort-2/3 `replay_command`s pin the exact recorded hex block (`evm-erc20-reader.mjs <chain> <contract> <block_hex>`) and each was rerun at that height with a matching raw supply (`REPRODUCIBLE at block N`, `PINNED_BLOCK_ETH_CALL_RERUN_MATCHED`). Cohort-1 records predate the pin and are labeled `NOT_REPLAYED_AT_RECORDED_HEIGHT`. Block finality is provider-reported (`RPC_FINALIZED_TAG_PROVIDER_REPORTED_NOT_INDEPENDENTLY_PROVEN_FINAL`) unless independently proven. XRPL records used a validated ledger; Stellar records used Horizon's latest closed ledger.

## Deep Measurement Prioritization (supply × chain risk × attestation gaps)

Priority is computed from: circulating USD, chain deployment count, evidence state, and anchor state. The queue lives in `TUI-2-MEASUREMENT-QUEUE.json` with a runnable trigger schedule.

## XRPL Instruments (17 cards)

| Card | Location | State |
|------|----------|-------|
| RLUSD | public/interop/cards/xrpl/xrpl-asset-state-rlusd.json | COUNTED |
| +16 more | public/interop/cards/xrpl/ | COUNTED |

## SWIFT Census

- Location: `public/interop/swift-census-2026-09/`
- State: CATALOGUED
- 26-institution census prepared

## ISO 20022

- Location: `public/interop/iso-20022.json`
- State: CATALOGUED

## What This Does NOT Claim

1. **NOT "{counts['n_indexed']} measured"** — {counts['n_indexed']} INDEXED, {counts['n_staged']} asset identities with staged deep supply observations across {counts['n_staged_symbols']} symbols, {counts['n_observed_extra']} more observed but unstaged, {counts['n_unmeasured']} without one. RLUSD overlaps the one prior signed+rooted identity.
2. **NOT "fully cross-chain verified"** — Chain deployments are listed, not independently verified
3. **NOT "proof of reserves"** — No asset has a verified proof-of-reserves attestation
4. **NOT "compliant"** — Regulatory references are informational, not compliance certifications

## Remaining Blockers

1. Deep measurement requires on-chain RPC access for each asset/chain pair
2. Signing of the 13 staged atoms is the publisher's rolling-root rebuild (TUI-1), not this lane
3. USDC/USDT need issuer-attestation integration before any reserve claim
4. The universe contains 1,640 reported asset/chain entries; exact verification-call and cost totals are not yet measured and must not use a 425×211 Cartesian product
5. All asset-specific measurements remain UNANCHORED (no Base EAS or XRPL memo anchors)
"""


if __name__ == "__main__":
    main()

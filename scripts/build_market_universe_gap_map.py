#!/usr/bin/env python3
"""Build an evidence-labelled market-universe coverage map.

Directory metadata is INDEXED, never promoted to an independent measurement.
The output makes missing readers explicit so breadth cannot be mistaken for
signed, rooted, or anchored coverage.
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUTPUT = ROOT / "public/interop/market-universe-2026-09/index.json"
UA = "CSOAI-market-universe/0.1 (+https://councilof.ai)"

ENDPOINTS = {
    "protocols": "https://api.llama.fi/protocols",
    "chains": "https://api.llama.fi/v2/chains",
    "yield_pools": "https://yields.llama.fi/pools",
    "stablecoins": "https://stablecoins.llama.fi/stablecoins?includePrices=true",
    "dexs": "https://api.llama.fi/overview/dexs?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true",
    "fees": "https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true",
    "options": "https://api.llama.fi/overview/options?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true",
}

CATEGORY_NAMES = {
    "lending": "Lending",
    "liquid_staking": "Liquid Staking",
    "restaking": "Restaking",
    "derivatives": "Derivatives",
    "rwa": "RWA",
    "yield_aggregators": "Yield Aggregator",
    "bridges": "Bridge",
    "cross_chain_bridges": "Cross Chain Bridge",
    "insurance": "Insurance",
    "nft_marketplaces": "NFT Marketplace",
    "nft_lending": "NFT Lending",
    "prediction_markets": "Prediction Market",
    "oracles": "Oracle",
    "payments": "Payments",
    "indexes": "Indexes",
    "synthetics": "Synthetics",
    "cdps": "CDP",
    "centralized_exchanges": "CEX",
    "dao_services": "DAO Service Provider",
    "treasury_managers": "Treasury Manager",
    "wallets": "Wallets",
    "depin": "DePIN",
}

LOCAL_FAMILIES = {
    "stablecoins": {
        "state": "PARTIAL_MEASUREMENT",
        "evidence": "public/interop/coverage-register.json#stablecoin_universe_2026_09",
    },
    "xrpl_issued_assets": {
        "state": "OBSERVED_IDENTITY_STATE",
        "evidence": "public/interop/xrpl-16-state-matrix/matrix.json",
    },
    "swift_institutions": {
        "state": "INDEXED_PUBLIC_NOTICES",
        "evidence": "public/interop/swift-census-2026-09/index.json",
    },
    "tokenized_rwa": {
        "state": "PARTIAL_OBSERVATION",
        "evidence": "public/interop/rwa-reconciliation-2026-09/reconciliation.json",
    },
    "x402_resources": {
        "state": "PARTIAL_MEASUREMENT",
        "evidence": "public/interop/x402-trust/latest.json",
    },
}

MISSING_FAMILIES = {
    "defi_protocols": "protocol identity, chain deployments, TVL source lineage",
    "dexs": "volume, liquidity, fee and wash-resistance observations",
    "lending": "supply, borrow, utilization, collateral and liquidation state",
    "yield_pools": "APY components, capacity, reward emissions and oracle lineage",
    "liquid_staking_restaking": "backing, validator concentration, exits and slashing exposure",
    "perpetuals": "volume, open interest, funding, liquidations and oracle divergence",
    "options": "notional, premium, open interest, expiry and settlement evidence",
    "centralized_exchanges": "reserve, liability, custody and withdrawal-liveness evidence",
    "bridges": "locked value, flow, finality, validator/admin and incident state",
    "nfts": "collection identity, provenance, ownership, sales and wash-risk evidence",
    "oracles": "feed coverage, heartbeat, deviation, signer and incident state",
    "payments_remittance": "corridor cost, speed, availability, rejection and finality",
    "fast_payment_systems": "jurisdiction, participation, volume, availability and rules",
    "tokenized_funds_bonds": "issuer, instrument identity, supply, custody, transfer restrictions and redemption",
    "dao_treasuries": "treasury composition, signer threshold, delegation and proposal execution",
    "prediction_markets": "market identity, oracle, resolution, liquidity and dispute state",
    "insurance": "capital, cover, claim, payout and exclusions evidence",
    "smart_contract_controls": "upgrade, pause, mint, freeze, denylist and ownership state",
    "chain_l2_da": "finality, sequencer, proof, data availability, bridge and escape-hatch state",
    "incidents_exploits": "loss, affected contracts, cause, recovery and disclosure cadence",
    "sanctions_aml": "list version, screening coverage, false-positive and correction lineage",
    "wallet_key_management": "custody model, recovery, permission surface and signing policy",
    "mev_market_integrity": "ordering, sandwiching, censorship and builder concentration",
    "cross_chain_asset_identity": "canonical issuer, contract aliases, wrapped supply and reconciliation",
}

CANDIDATE_READERS = [
    {
        "reader": "defillama_open_adapters",
        "families": ["defi_protocols", "dexs", "lending", "yield_pools", "perpetuals", "options", "bridges"],
        "source": "https://github.com/DefiLlama/dimension-adapters",
        "access": "PUBLIC_OPEN_SOURCE",
        "role": "DISCOVERY_AND_REPLAY_LEADS",
    },
    {
        "reader": "hyperliquid_public_api",
        "families": ["perpetuals", "dexs", "liquidations", "oracles"],
        "source": "https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/info-endpoint",
        "access": "PUBLIC_API",
        "role": "DIRECT_PROTOCOL_OBSERVATION",
    },
    {
        "reader": "reservoir_nft_api",
        "families": ["nfts"],
        "source": "https://nft.reservoir.tools/reference/overview",
        "access": "API_KEY_REQUIRED",
        "role": "AGGREGATED_DISCOVERY_BEFORE_CHAIN_REPLAY",
    },
    {
        "reader": "l2beat_public_research",
        "families": ["bridges", "chain_l2_da", "smart_contract_controls"],
        "source": "https://l2beat.com/bridges",
        "access": "PUBLIC_WEB_AND_OPEN_SOURCE",
        "role": "RISK_AND_IDENTITY_LEADS_BEFORE_CHAIN_REPLAY",
    },
    {
        "reader": "chainlink_ccip_and_feeds",
        "families": ["bridges", "oracles", "cross_chain_asset_identity"],
        "source": "https://docs.chain.link/",
        "access": "PUBLIC_DOCS_APIS_SDK_AND_CHAIN_STATE",
        "role": "DIRECTORY_AND_ONCHAIN_OBSERVATION",
    },
    {
        "reader": "bis_cpmi_bulk_data",
        "families": ["payments_remittance", "fast_payment_systems"],
        "source": "https://data.bis.org/bulkdownload",
        "access": "PUBLIC_BULK_DATA",
        "role": "OFFICIAL_STATISTICAL_OBSERVATION",
    },
    {
        "reader": "ecb_sdmx_api",
        "families": ["payments_remittance", "fast_payment_systems", "cross_chain_asset_identity"],
        "source": "https://data.ecb.europa.eu/help/api/overview",
        "access": "PUBLIC_API",
        "role": "OFFICIAL_STATISTICAL_OBSERVATION",
    },
    {
        "reader": "swift_standards_release",
        "families": ["payments_remittance", "fast_payment_systems"],
        "source": "https://www.swift.com/standards/standards-releases",
        "access": "PUBLIC_RELEASE_DOCUMENTS",
        "role": "RULE_VERSION_AND_CLAIM_OBSERVATION",
    },
]


def canonical(value: Any) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def fetch_json(url: str) -> tuple[Any, str]:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as response:
        raw = response.read()
    return json.loads(raw), hashlib.sha256(raw).hexdigest()


def read_json(rel: str) -> dict[str, Any]:
    return json.loads((ROOT / rel).read_text())


def local_snapshot() -> dict[str, Any]:
    coverage = read_json("public/interop/coverage-register.json").get("stablecoin_universe_2026_09", {})
    xrpl = read_json("public/interop/xrpl-16-state-matrix/matrix.json")
    swift = read_json("public/interop/swift-census-2026-09/index.json")
    rwa = read_json("public/interop/rwa-staged-index.json")
    x402 = read_json("public/interop/x402-trust/latest.json")
    return {
        "stablecoins": {
            **LOCAL_FAMILIES["stablecoins"],
            "indexed": coverage.get("indexed_subjects"),
            "deep_measured_union": coverage.get("deep_measured_asset_identity_union"),
            "signed_rooted": coverage.get("deep_measured_asset_identities_signed_rooted"),
        },
        "xrpl_issued_assets": {
            **LOCAL_FAMILIES["xrpl_issued_assets"],
            "identities": len(xrpl.get("identities") or []),
            "ledger_index": xrpl.get("ledger_index"),
            "independently_measured_supply": 0,
            "independently_measured_holders": 0,
        },
        "swift_institutions": {
            **LOCAL_FAMILIES["swift_institutions"],
            "indexed": swift.get("n"),
            "measured": swift.get("n_measured"),
        },
        "tokenized_rwa": {
            **LOCAL_FAMILIES["tokenized_rwa"],
            "staged_unsigned": rwa.get("total_staged_unsigned"),
            "signed": rwa.get("total_signed"),
        },
        "x402_resources": {
            **LOCAL_FAMILIES["x402_resources"],
            "probed": (x402.get("counts") or {}).get("total"),
            "valid_challenge_402": (x402.get("counts") or {}).get("challenge_402"),
        },
    }


def build(observed_at: str) -> dict[str, Any]:
    payloads: dict[str, Any] = {}
    sources: dict[str, Any] = {}
    for name, url in ENDPOINTS.items():
        payload, digest = fetch_json(url)
        payloads[name] = payload
        sources[name] = {
            "url": url,
            "source_role": "DIRECTORY_METADATA",
            "response_sha256": digest,
            "verification_state": "INDEXED_NOT_INDEPENDENTLY_MEASURED",
        }

    protocols = payloads["protocols"]
    category_counts = collections.Counter((row.get("category") or "UNKNOWN") for row in protocols)
    dexs = payloads["dexs"]
    fees = payloads["fees"]
    options = payloads["options"]
    stablecoins = payloads["stablecoins"]
    yields = payloads["yield_pools"]

    upstream = {
        "protocols": len(protocols),
        "protocol_categories": len(category_counts),
        "chains": len(payloads["chains"]),
        "yield_pools": len(yields.get("data") or []),
        "stablecoins": len(stablecoins.get("peggedAssets") or []),
        "stablecoin_chains": len(stablecoins.get("chains") or []),
        "dex_protocols": len(dexs.get("protocols") or []),
        "dex_chains": len(dexs.get("allChains") or []),
        "fee_revenue_protocols": len(fees.get("protocols") or []),
        "fee_revenue_chains": len(fees.get("allChains") or []),
        "options_protocols": len(options.get("protocols") or []),
        "options_chains": len(options.get("allChains") or []),
        "selected_protocol_categories": {
            key: category_counts[name] for key, name in CATEGORY_NAMES.items()
        },
    }

    return {
        "schema": "csoai.market-universe-gap-map/0.1",
        "observed_at": observed_at,
        "doctrine": {
            "directory_metadata_is_measurement": False,
            "indexing_is_signing": False,
            "payment_is_measurement": False,
            "promotion_ladder": [
                "DISCOVERED", "INDEXED", "OBSERVED", "MEASURED", "SIGNED", "ROOTED", "ANCHORED"
            ],
        },
        "sources": sources,
        "upstream_directory_snapshot": upstream,
        "current_csoai_coverage": local_snapshot(),
        "candidate_readers": CANDIDATE_READERS,
        "missing_measurement_families": [
            {
                "family": family,
                "state": "UNMEASURED",
                "minimum_evidence": minimum,
                "first_cost": "ZERO_OR_PUBLIC_DATA",
            }
            for family, minimum in MISSING_FAMILIES.items()
        ],
        "priority_waves": [
            {
                "wave": 1,
                "families": ["defi_protocols", "dexs", "lending", "yield_pools", "perpetuals", "bridges"],
                "reason": "largest reusable public-data surface and strongest daily drift",
            },
            {
                "wave": 2,
                "families": ["centralized_exchanges", "oracles", "smart_contract_controls", "chain_l2_da", "incidents_exploits"],
                "reason": "trust and operational-risk evidence buyers can act on",
            },
            {
                "wave": 3,
                "families": ["nfts", "tokenized_funds_bonds", "payments_remittance", "fast_payment_systems", "cross_chain_asset_identity"],
                "reason": "provenance and transfer integrity across physical and digital assets",
            },
        ],
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()
    observed_at = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    result = build(observed_at)
    result["snapshot_sha256"] = hashlib.sha256(canonical(result)).hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True, ensure_ascii=False) + "\n")
    print(f"wrote {args.output} ({len(result['missing_measurement_families'])} missing families)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

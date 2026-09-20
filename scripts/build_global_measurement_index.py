#!/usr/bin/env python3
"""Build a fail-closed global CSOAI coverage index from published evidence."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def load(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def build(repo: Path, observed_at: str) -> tuple[dict, dict]:
    old_index_path = repo / "public/interop/stablecoin-universe-2026-09/index.json"
    new_index_path = repo / "public/interop/stablecoin-universe-2026-09-20/index.json"
    old_supply_path = repo / "public/interop/stablecoin-universe-supply-2026-09-16.json"
    new_supply_path = repo / "public/interop/stablecoin-universe-supply-2026-09-20.json"
    gspc_path = repo / "public/interop/canonical-23-axis-index-v0.1.json"
    token_path = repo / "public/interop/chainlink-ondo-token-inventory-2026-09-20.json"
    ondo_path = repo / "public/interop/ondo-token-onchain-probe-2026-09-20.json"
    paths = [old_index_path, new_index_path, old_supply_path, new_supply_path, gspc_path, token_path, ondo_path]
    old_index, new_index, old_supply, new_supply, gspc, token, ondo = map(load, paths)
    old_assets = {str(row["id"]): row for row in old_index["assets"]}
    new_assets = {str(row["id"]): row for row in new_index["assets"]}
    old_states = {str(row["asset_id"]): row.get("state") for row in old_supply["rows"]}
    new_states = {str(row["asset_id"]): row.get("state") for row in new_supply["rows"]}
    added = sorted(set(new_assets) - set(old_assets), key=int)
    removed = sorted(set(old_assets) - set(new_assets), key=int)
    transitions = [
        {"asset_id": key, "symbol": new_assets.get(key, old_assets.get(key, {})).get("symbol"), "from": old_states.get(key), "to": new_states.get(key)}
        for key in sorted(set(old_states) & set(new_states), key=int)
        if old_states.get(key) != new_states.get(key)
    ]
    delta = {
        "schema": "csoai.stablecoin-universe-delta/0.1",
        "observed_at": observed_at,
        "from": {"path": str(old_index_path.relative_to(repo)), "sha256": digest(old_index_path), "assets": old_index["asset_count"], "chains": old_index["chain_count"], "deployments": old_index["deployment_count"]},
        "to": {"path": str(new_index_path.relative_to(repo)), "sha256": digest(new_index_path), "assets": new_index["asset_count"], "chains": new_index["chain_count"], "deployments": new_index["deployment_count"]},
        "added": [{"id": key, "name": new_assets[key]["name"], "symbol": new_assets[key]["symbol"]} for key in added],
        "removed": [{"id": key, "name": old_assets[key]["name"], "symbol": old_assets[key]["symbol"]} for key in removed],
        "supply_state_transitions": transitions,
        "measurement_not_certification": True,
    }
    evidence = [{"path": str(path.relative_to(repo)), "sha256": digest(path)} for path in paths[1:]]
    index = {
        "schema": "csoai.global-measurement-index/0.1",
        "observed_at": observed_at,
        "status": "PARTIAL_MEASURED",
        "scope": "Public machine-readable coverage ledger; it is not a claim to cover every asset, country, chain, issuer, or search engine in the world.",
        "coverage": {
            "gspc": {"axes": gspc["totals"]["axes"], "measured": gspc["totals"]["measured_axes"], "unmeasured": gspc["totals"]["unmeasured_axes"], "signature_state": "AWAITING_OWNER_MPC_SIGNATURE"},
            "stablecoins": {"catalogued_assets": new_index["asset_count"], "reported_chains": new_index["chain_count"], "deployments": new_index["deployment_count"], "supply_rows": new_supply["counts"], "catalogue_state": "INDEXED_IN_CS0AI_CATALOGUE", "external_search_index_state": "UNMEASURED"},
            "chainlink_link": {"publisher_directory_rows": token["counts"]["chainlink_rows"], "rpc_probed": 4, "remaining_rpc_unmeasured": token["counts"]["chainlink_rows"] - 4},
            "ondo": {"publisher_directory_rows": token["counts"]["ondo_rows"], "rpc_match": ondo["counts"]["measured_match"], "rpc_mismatch": ondo["counts"]["measured_mismatch"]},
        },
        "truth_rules": [
            "Catalogue inclusion is not independent measurement.",
            "CSOAI catalogue indexing is not Google, Bing, Bazaar, marketplace, traffic, or customer use.",
            "A reported chain is not a country or jurisdiction.",
            "Issued totalSupply is not circulating supply, reserves, backing, solvency, or price parity.",
            "A content hash is not a signature; a signature is not certification.",
            "UNMEASURED, UNCHECKABLE and REJECTED rows remain visible and are never converted to zero.",
        ],
        "evidence": evidence,
        "signature": {"state": "BLOCKED_GITHUB_ACTIONS", "sig_ed25519": None, "route": ".github/workflows/hf-fin-shells-measure.yml target=global-index", "blocker": "HTTP 422: Actions has been disabled for this user", "local_signing": "FORBIDDEN"},
        "measurement_not_certification": True,
        "writes_gspc_board": False,
    }
    return delta, index


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    parser.add_argument("--observed-at", required=True)
    parser.add_argument("--delta-output", type=Path, required=True)
    parser.add_argument("--index-output", type=Path, required=True)
    args = parser.parse_args()
    delta, index = build(args.repo_root.resolve(), args.observed_at)
    args.delta_output.write_text(json.dumps(delta, indent=2) + "\n")
    args.index_output.write_text(json.dumps(index, indent=2) + "\n")
    print(json.dumps(index["coverage"], separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Build the stablecoin readiness view from already-published evidence.

This is deliberately a view over the frozen discovery index and public proof
files.  It performs no network calls and never promotes indexed metadata to a
measurement.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
from typing import Any


INDEX_REL = Path("public/interop/stablecoin-universe-2026-09/index.json")
ROOT_REL = Path("public/root.json")
WITNESS_REL = Path("public/interop/root-witness-latest.json")
CARDS_REL = Path("public/cards")
OUTPUT_REL = Path("public/interop/stablecoin-universe-2026-09/readiness.json")
CANDIDATES_REL = Path("public/interop/stablecoin-universe-2026-09/discovery-candidates.json")


def load(path: Path) -> Any:
    return json.loads(path.read_text())


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def card_body(document: dict[str, Any]) -> dict[str, Any]:
    body = document.get("card", document)
    return body if isinstance(body, dict) else {}


def find_index_commitment(repo: Path, index_sha: str) -> tuple[Path, dict[str, Any]]:
    matches: list[tuple[Path, dict[str, Any]]] = []
    for path in sorted((repo / CARDS_REL).glob("*.json")):
        try:
            body = card_body(load(path))
        except (OSError, ValueError):
            continue
        payload = body.get("payload") or {}
        if payload.get("kind") == "csoai.stablecoin-index.commitment/v1" and payload.get("index_sha256") == index_sha:
            matches.append((path, body))
    if len(matches) != 1:
        raise SystemExit(f"expected exactly one signed index commitment for {index_sha}, found {len(matches)}")
    return matches[0]


def latest_rooted_rlusd(repo: Path, root_hashes: set[str]) -> tuple[Path, dict[str, Any]]:
    candidates: list[tuple[str, Path, dict[str, Any]]] = []
    for path in sorted((repo / CARDS_REL).glob("*.json")):
        try:
            body = card_body(load(path))
        except (OSError, ValueError):
            continue
        payload = body.get("payload") or {}
        digest = body.get("sha256")
        if (
            payload.get("symbol") == "RLUSD"
            and body.get("surface") == "xrpl.asset.state"
            and isinstance(body.get("sig_ed25519"), str)
            and digest in root_hashes
        ):
            candidates.append((str(body.get("as_of") or ""), path, body))
    if not candidates:
        raise SystemExit("no signed, current-root-included XRPL RLUSD card found")
    _, path, body = max(candidates, key=lambda row: row[0])
    return path, body


def witness_state_token(status: Any, *, ots: bool = False) -> str:
    """Return the public row-state token derived from a witness status.

    The readiness schema historically shortened STAMPED_PENDING_BITCOIN to
    PENDING_BITCOIN. Keep that spelling for compatibility while deriving every
    value from the current witness instead of freezing it in the generator.
    """
    token = str(status or "UNKNOWN").upper()
    if ots and token == "STAMPED_PENDING_BITCOIN":
        return "PENDING_BITCOIN"
    return token


def index_commitment_state(rekor_status: Any, ots_status: Any) -> str:
    return (
        "SIGNED_ROOT_INCLUDED_"
        f"REKOR_{witness_state_token(rekor_status)}_"
        f"OTS_{witness_state_token(ots_status, ots=True)}"
    )


def measured_asset_anchor_state(rekor_status: Any, ots_status: Any) -> str:
    return (
        "ROOT_"
        f"REKOR_{witness_state_token(rekor_status)}_"
        f"OTS_{witness_state_token(ots_status, ots=True)}"
    )


def build(repo: Path) -> dict[str, Any]:
    index_path = repo / INDEX_REL
    root_path = repo / ROOT_REL
    witness_path = repo / WITNESS_REL
    index = load(index_path)
    root = load(root_path)
    witness = load(witness_path)
    candidates = load(repo / CANDIDATES_REL)
    index_sha = sha256(index_path)
    commitment_path, commitment = find_index_commitment(repo, index_sha)
    root_hashes = set(root.get("card_sha256") or [])
    commitment_sha = commitment.get("sha256")
    if commitment_sha not in root_hashes:
        raise SystemExit("stablecoin index commitment is signed but absent from the current public root")

    rlusd_path, rlusd = latest_rooted_rlusd(repo, root_hashes)
    rlusd_payload = rlusd.get("payload") or {}
    rekor = ((witness.get("witnesses") or {}).get("rekor") or {})
    ots = ((witness.get("witnesses") or {}).get("ots") or {})
    current_index_commitment_state = index_commitment_state(rekor.get("status"), ots.get("status"))
    current_measured_anchor_state = measured_asset_anchor_state(rekor.get("status"), ots.get("status"))

    common_index_proof = {
        "state": "SIGNED_ROOT_INCLUDED",
        "index_sha256": index_sha,
        "commitment_card_sha256": commitment_sha,
        "commitment_card_url": f"https://councilof.ai/cards/{commitment_path.name}",
        "signature": "ED25519_VERIFIED_BY_PUBLIC_ROOT_PIPELINE",
        "root_sha256": (witness.get("artifact") or {}).get("sha256"),
        "merkle_root": (witness.get("artifact") or {}).get("merkle_root"),
        "rekor": {
            "state": rekor.get("status", "UNKNOWN"),
            "log_index": rekor.get("logIndex"),
            "url": rekor.get("url"),
        },
        "opentimestamps": {
            "state": ots.get("status", "UNKNOWN"),
            "bitcoin_blocks": ots.get("bitcoin_blocks") or [],
            "truth_rule": "STAMPED_PENDING_BITCOIN is submission evidence, not a Bitcoin anchor",
        },
        "scope": "The signed commitment covers the frozen discovery index bytes; it does not convert any row into an independent chain measurement.",
    }

    assets = []
    for source_row in index["assets"]:
        row = {
            "id": source_row["id"],
            "name": source_row["name"],
            "symbol": source_row["symbol"],
            "peg_type": source_row.get("pegType"),
            "chains": source_row.get("chains") or [],
            "chain_deployment_count": len(source_row.get("chains") or []),
            "source": {
                "state": "FROZEN_UPSTREAM_METADATA",
                "provider": "DefiLlama stablecoins API",
                "observed_at": index["observed_at"],
                "source_sha256": index["source_sha256"],
            },
            "index_state": "INDEXED",
            "measurement": {
                "state": "UNMEASURED",
                "depth": "NONE",
                "freshness": "NOT_APPLICABLE",
                "evidence_urls": [],
            },
            "signature_state": "NO_ASSET_MEASUREMENT_SIGNATURE",
            "root_state": "NO_ASSET_MEASUREMENT_IN_CURRENT_ROOT",
            "anchor_state": "NO_ASSET_MEASUREMENT_ANCHOR",
            "index_commitment_state": current_index_commitment_state,
            "correction_lineage": {
                "state": "NONE_DECLARED",
                "supersedes": [],
                "note": "No asset-specific correction is inferred from metadata changes.",
            },
            "a2a_discovery_state": "GENERIC_CATALOG_ONLY_NO_ASSET_SKILL",
            "mcp_discovery_state": "GENERIC_CATALOG_ONLY_NO_ASSET_TOOL",
            "x402_door_state": "GENERIC_EXISTING_DATA_DOOR_NO_ASSET_SETTLEMENT_VERIFIED",
        }
        if str(source_row.get("symbol") or "").upper() == "RLUSD":
            row["measurement"] = {
                "state": "MEASURED",
                "depth": "PARTIAL_ONE_CHAIN_XRPL",
                "freshness": "AS_OF_RECORDED_CARD",
                "as_of": rlusd.get("as_of"),
                "evidence_urls": [f"https://councilof.ai/cards/{rlusd_path.name}"],
                "measured_chains": ["XRPL"],
                "unmeasured_scope": "Other listed deployments and a current cross-chain aggregate are not established by this card.",
            }
            row["signature_state"] = "ASSET_MEASUREMENT_SIGNED_ED25519"
            row["root_state"] = "ASSET_MEASUREMENT_IN_CURRENT_ROOT"
            row["anchor_state"] = current_measured_anchor_state
            row["correction_lineage"] = {
                "state": "SEMANTIC_REVIEW_REQUIRED",
                "supersedes": [],
                "note": (
                    "The rooted card labels its source field as holders. Repository evidence does not establish "
                    "the separately reported 4,074 trustline correction, so this catalog does not repeat it."
                ),
            }
            row["measurement"]["reported_fields"] = {
                "supply": rlusd_payload.get("supply"),
                "holders_source_label": None,
                "holders_state": "WITHHELD_UNVERIFIED_SOURCE_LABEL",
                "holders_note": (
                    "The rooted historical card contains a reader-labelled value, but the repository "
                    "does not contain a complete paginated account_lines traversal establishing a holder count."
                ),
            }
        assets.append(row)

    measured = sum(row["measurement"]["state"] == "MEASURED" for row in assets)
    return {
        "schema": "csoai.stablecoin-readiness/v1",
        "as_of": index["observed_at"],
        "purpose": "One evidence-status view over the frozen stablecoin discovery index; measurement credentials, never certification.",
        "coverage": {
            "indexed_assets": len(assets),
            "indexed_chain_deployments": sum(row["chain_deployment_count"] for row in assets),
            "distinct_asset_reported_chains": len({chain for row in assets for chain in row["chains"]}),
            "deeply_measured_assets": measured,
            "unmeasured_assets": len(assets) - measured,
            "asset_measurements_signed": measured,
            "asset_measurements_current_root_included": measured,
            "asset_measurements_rekor_witnessed_via_root": measured if rekor.get("status") == "WITNESSED" else 0,
            "asset_measurements_bitcoin_anchored_via_current_root": (
                measured if ots.get("status") == "CONFIRMED_BITCOIN" and ots.get("bitcoin_blocks") else 0
            ),
            "asset_specific_a2a_skills": 0,
            "asset_specific_mcp_tools": 0,
            "asset_specific_x402_doors": 0,
            "asset_specific_x402_settlements_verified": 0,
            "post_freeze_discovery_candidates": len(candidates.get("candidates") or []),
        },
        "cost": {
            "metadata_index_build_usd": 0,
            "readiness_build_usd": 0,
            "x402_campaign": "0.01 USDC only for eligible existing-data SKUs; fresh compute excluded",
        },
        "shared_evidence": {"index_commitment": common_index_proof},
        "shared_discovery": {
            "a2a": {
                "state": "CATALOG_DISCOVERABLE",
                "agent_card": "https://councilof.ai/.well-known/agent-card.json",
                "asset_specific_skills": 0,
            },
            "mcp": {
                "state": "CATALOG_DISCOVERABLE",
                "endpoint": "https://councilof.ai/mcp",
                "asset_specific_tools": 0,
            },
            "x402": {
                "state": "GENERIC_EXISTING_DATA_DOOR_DECLARED",
                "endpoint": "https://councilof.ai/api/request-attestation",
                "sku": "request_attestation:per_request",
                "campaign_amount_atomic_usdc": "10000",
                "campaign_amount_usdc": "0.01",
                "fresh_compute_excluded": True,
                "asset_specific_doors": 0,
                "asset_specific_settlements_verified": 0,
            },
        },
        "truth_rules": [
            "INDEXED is not MEASURED.",
            "A signed index commitment is not an asset measurement signature.",
            "Root inclusion is not an external-chain anchor.",
            "An OpenTimestamps pending calendar attestation is not a Bitcoin timestamp.",
            "A generic protocol door is not an asset-specific integration or settlement.",
            "A post-freeze issuer-reported candidate is not part of the signed 425-asset index and is not independently measured.",
        ],
        "discovery_candidates": candidates.get("candidates") or [],
        "assets": assets,
    }


def validate(document: dict[str, Any]) -> None:
    assets = document.get("assets") or []
    coverage = document.get("coverage") or {}
    assert len(assets) == 425, f"expected 425 assets, got {len(assets)}"
    assert len({row["id"] for row in assets}) == len(assets), "asset ids must be unique"
    assert coverage["indexed_assets"] == len(assets)
    assert coverage["indexed_chain_deployments"] == sum(row["chain_deployment_count"] for row in assets)
    measured = [row for row in assets if row["measurement"]["state"] == "MEASURED"]
    assert coverage["deeply_measured_assets"] == len(measured) == 1
    assert coverage["unmeasured_assets"] == len(assets) - len(measured) == 424
    assert measured[0]["symbol"] == "RLUSD"
    proof = document["shared_evidence"]["index_commitment"]
    expected_index_commitment_state = index_commitment_state(
        (proof.get("rekor") or {}).get("state"),
        (proof.get("opentimestamps") or {}).get("state"),
    )
    expected_measured_anchor_state = measured_asset_anchor_state(
        (proof.get("rekor") or {}).get("state"),
        (proof.get("opentimestamps") or {}).get("state"),
    )
    candidates = document.get("discovery_candidates") or []
    assert coverage["post_freeze_discovery_candidates"] == len(candidates)
    for row in candidates:
        assert row["discovery_state"] == "REPORTED_BY_ISSUER_NOT_IN_FROZEN_INDEX"
        assert row["measurement_state"] == "UNMEASURED"
        assert row["signature_state"] == "UNSIGNED_DISCOVERY_OBSERVATION"
        assert row["root_state"] == "NOT_INCLUDED"
        assert row["anchor_state"] == "NOT_ANCHORED"
    for row in assets:
        assert row["index_state"] == "INDEXED"
        assert row["index_commitment_state"] == expected_index_commitment_state
        assert row["a2a_discovery_state"] == "GENERIC_CATALOG_ONLY_NO_ASSET_SKILL"
        assert row["mcp_discovery_state"] == "GENERIC_CATALOG_ONLY_NO_ASSET_TOOL"
        assert row["x402_door_state"] == "GENERIC_EXISTING_DATA_DOOR_NO_ASSET_SETTLEMENT_VERIFIED"
        if row["measurement"]["state"] == "UNMEASURED":
            assert row["measurement"]["depth"] == "NONE"
            assert row["signature_state"] == "NO_ASSET_MEASUREMENT_SIGNATURE"
            assert row["root_state"] == "NO_ASSET_MEASUREMENT_IN_CURRENT_ROOT"
            assert row["anchor_state"] == "NO_ASSET_MEASUREMENT_ANCHOR"
        else:
            assert row["anchor_state"] == expected_measured_anchor_state


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    parser.add_argument("--output", type=Path)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    repo = args.repo_root.resolve()
    output = args.output or (repo / OUTPUT_REL)
    document = build(repo)
    validate(document)
    rendered = json.dumps(document, indent=2, sort_keys=True) + "\n"
    if args.check:
        if not output.exists() or output.read_text() != rendered:
            raise SystemExit(f"stale stablecoin readiness catalog: {output}")
        print(json.dumps(document["coverage"], sort_keys=True))
        return
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(rendered)
    print(json.dumps(document["coverage"], sort_keys=True))


if __name__ == "__main__":
    main()

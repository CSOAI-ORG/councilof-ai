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
# Documentary regulatory-register block (#017). Built by scripts/build_regulatory_register_baseline.py
# from hash-pinned register files; absence from a register is UNCHECKED, never "not registered".
REG_BASELINE_REL = Path("public/interop/regulatory-register-baseline-2026-09-14.json")
# Per-asset x402 doors (/api/wrapper/asset/<asset>) — the registry the door, the manifest and the
# catalogue read. An asset with an entry here has an asset-specific door DECLARED in this repository;
# a settlement through it is a separate fact and stays unverified until one is read.
ASSET_DOORS_REL = Path("functions/api/_wrapper_asset_doors.json")
GENERIC_DOOR_STATE = "GENERIC_EXISTING_DATA_DOOR_NO_ASSET_SETTLEMENT_VERIFIED"
# Keeps the substring NO_ASSET_SETTLEMENT_VERIFIED on purpose: every reader tests for it
# (client/src/lib/stablecoinReadiness.ts, scripts/build_stablecoin_promotion_queue.py).
ASSET_DOOR_STATE = "ASSET_SPECIFIC_DOOR_DECLARED_NO_ASSET_SETTLEMENT_VERIFIED"
REGISTERS = ("esma_mica_interim_emt", "nydfs_greenlist")
REGISTER_STATES = {
    "esma_mica_interim_emt": {"TOKEN_WHITE_PAPER_LISTED", "ISSUER_LISTED_TOKEN_NOT_NAMED", "UNCHECKED"},
    "nydfs_greenlist": {"LISTED_ON_GREENLIST", "UNCHECKED"},
}


def load(path: Path) -> Any:
    return json.loads(path.read_text())


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def card_body(document: dict[str, Any]) -> dict[str, Any]:
    body = document.get("card", document)
    return body if isinstance(body, dict) else {}


def find_index_commitment(repo: Path, index_sha: str, root_hashes: set[str]) -> tuple[Path, dict[str, Any]]:
    """The ONE signed commitment to this index that the current public root includes.

    public/cards is append-only: signed bytes are never edited or deleted. When the
    publisher re-mints a leaf whose card envelope changed (the G5.1 "product" block,
    #2471/#2478), the same index gets a second signed commitment card with a new
    whole-card sha, and the superseded card stays on disk. Counting every card on disk
    therefore failed the publisher on 15 Sep 2026 ("found 2") even though exactly one
    was in the root it had just signed. Selection is by root inclusion, as
    latest_rooted_rlusd already does. Every failure mode still fails closed: no signed
    commitment, none in the current root, or more than one in the current root.
    """
    signed: list[tuple[Path, dict[str, Any]]] = []
    for path in sorted((repo / CARDS_REL).glob("*.json")):
        try:
            body = card_body(load(path))
        except (OSError, ValueError):
            continue
        payload = body.get("payload") or {}
        if (
            payload.get("kind") == "csoai.stablecoin-index.commitment/v1"
            and payload.get("index_sha256") == index_sha
            and isinstance(body.get("sig_ed25519"), str)
            and body.get("sig_ed25519")
        ):
            signed.append((path, body))
    if not signed:
        raise SystemExit(f"no signed index commitment for {index_sha}")
    rooted = [(path, body) for path, body in signed if body.get("sha256") in root_hashes]
    if not rooted:
        raise SystemExit("stablecoin index commitment is signed but absent from the current public root")
    if len(rooted) != 1:
        raise SystemExit(
            f"expected exactly one current-root-included signed index commitment for {index_sha}, found {len(rooted)}"
        )
    return rooted[0]


def rooted_xrpl_asset_measurements(
    repo: Path, root_hashes: set[str], index_assets: list[dict[str, Any]]
) -> dict[str, tuple[Path, dict[str, Any]]]:
    """Return qualified current-root XRPL measurements keyed by frozen asset id.

    Qualification is deliberately conservative: the card must be signed, included in
    the current root, describe an XRPL Stablecoin asset state, and its symbol must map
    to exactly one frozen-index row that explicitly lists XRPL. Ambiguous symbols,
    XRPL cards absent from the frozen 425, and same-symbol rows with no XRPL deployment
    remain UNMEASURED. When several qualifying cards exist for one asset, the latest
    recorded card wins without changing the signed historical bytes.
    """
    by_symbol: dict[str, list[dict[str, Any]]] = {}
    for row in index_assets:
        by_symbol.setdefault(str(row.get("symbol") or "").upper(), []).append(row)

    candidates: dict[str, list[tuple[str, Path, dict[str, Any]]]] = {}
    for path in sorted((repo / CARDS_REL).glob("*.json")):
        try:
            body = card_body(load(path))
        except (OSError, ValueError):
            continue
        payload = body.get("payload") or {}
        symbol = str(payload.get("symbol") or "").upper()
        if (
            body.get("surface") != "xrpl.asset.state"
            or payload.get("asset_class") != "Stablecoin"
            or not isinstance(body.get("sig_ed25519"), str)
            or not body.get("sig_ed25519")
            or body.get("sha256") not in root_hashes
            or not symbol
        ):
            continue
        matches = [row for row in by_symbol.get(symbol, []) if "XRPL" in (row.get("chains") or [])]
        if len(matches) != 1:
            continue
        asset_id = str(matches[0]["id"])
        candidates.setdefault(asset_id, []).append((str(body.get("as_of") or ""), path, body))

    qualified: dict[str, tuple[Path, dict[str, Any]]] = {}
    for asset_id, rows in candidates.items():
        _, path, body = max(rows, key=lambda row: row[0])
        qualified[asset_id] = (path, body)
    return qualified

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
    reg_baseline = load(repo / REG_BASELINE_REL)
    reg_by_asset: dict[tuple[str, str], dict[str, Any]] = {
        (row["asset_id"], row["register"]): row for row in reg_baseline["token_map"]
    }
    asset_doors = {str(d["stablecoin_index_id"]): d for d in load(repo / ASSET_DOORS_REL)["doors"]}
    index_sha = sha256(index_path)
    root_hashes = set(root.get("card_sha256") or [])
    commitment_path, commitment = find_index_commitment(repo, index_sha, root_hashes)
    commitment_sha = commitment.get("sha256")
    if commitment_sha not in root_hashes:
        raise SystemExit("stablecoin index commitment is signed but absent from the current public root")

    xrpl_measurements = rooted_xrpl_asset_measurements(repo, root_hashes, index["assets"])
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
            "x402_door_state": ASSET_DOOR_STATE if str(source_row["id"]) in asset_doors else GENERIC_DOOR_STATE,
            "regulatory_status": regulatory_status(str(source_row["id"]), reg_by_asset),
        }
        if str(source_row["id"]) in asset_doors:
            row["x402_door"] = f"https://councilof.ai/api/wrapper/asset/{asset_doors[str(source_row['id'])]['asset']}"
        measured_card = xrpl_measurements.get(str(source_row["id"]))
        if measured_card:
            measurement_path, measurement_card = measured_card
            measurement_payload = measurement_card.get("payload") or {}
            row["measurement"] = {
                "state": "MEASURED",
                "depth": "PARTIAL_ONE_CHAIN_XRPL",
                "freshness": "AS_OF_RECORDED_CARD",
                "as_of": measurement_card.get("as_of"),
                "evidence_urls": [f"https://councilof.ai/cards/{measurement_path.name}"],
                "measured_chains": ["XRPL"],
                "match_rule": "UNIQUE_FROZEN_SYMBOL_WITH_XRPL_DEPLOYMENT",
                "unmeasured_scope": "Other listed deployments and a current cross-chain aggregate are not established by this card.",
            }
            row["signature_state"] = "ASSET_MEASUREMENT_SIGNED_ED25519"
            row["root_state"] = "ASSET_MEASUREMENT_IN_CURRENT_ROOT"
            row["anchor_state"] = current_measured_anchor_state
            row["correction_lineage"] = {
                "state": "SEMANTIC_REVIEW_REQUIRED",
                "supersedes": [],
                "note": (
                    "The rooted XRPL card carries a reader-labelled holder field. This catalog withholds that "
                    "field because repository evidence does not contain a complete paginated account_lines "
                    "traversal establishing a holder count."
                ),
            }
            row["measurement"]["reported_fields"] = {
                "supply": measurement_payload.get("supply"),
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
            "asset_specific_x402_doors": sum(1 for row in assets if row["x402_door_state"] == ASSET_DOOR_STATE),
            "asset_specific_x402_settlements_verified": 0,
            "post_freeze_discovery_candidates": len(candidates.get("candidates") or []),
            "regulatory_register_rows": {
                register: {
                    state: sum(row["regulatory_status"]["registers"][register]["state"] == state for row in assets)
                    for state in sorted(REGISTER_STATES[register])
                }
                for register in REGISTERS
            },
        },
        "cost": {
            "metadata_index_build_usd": 0,
            "readiness_build_usd": 0,
            "x402_campaign": "eligible existing-data SKUs only; fresh compute excluded; the amount lives only in each door's 402 challenge",
        },
        "shared_evidence": {
            "index_commitment": common_index_proof,
            "regulatory_registers": {
                "class": "DOCUMENTARY",
                "baseline_url": f"https://councilof.ai/{REG_BASELINE_REL.as_posix().removeprefix('public/')}",
                "baseline_sha256": sha256(repo / REG_BASELINE_REL),
                "pins": [
                    {k: f.get(k) for k in ("register", "url", "retrieved_at", "sha256")}
                    for f in reg_baseline["pins"]["files"]
                    if f["name"] in ("EMTWP.csv", "virtual_currency_businesses.html")
                ],
                "rule": "Register membership as published in the pinned file on its retrieval date. Absence is UNCHECKED, never 'not registered'. Documentary, not a measurement and not an authorisation opinion.",
            },
        },
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
                "amount": "in the 402 challenge only — never typed on a public surface",
                "fresh_compute_excluded": True,
                "asset_specific_doors": sum(1 for row in assets if row["x402_door_state"] == ASSET_DOOR_STATE),
                "asset_specific_door_registry": ASSET_DOORS_REL.as_posix(),
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
            "A register listing is documentary; absence from a register is UNCHECKED, never 'not registered'.",
        ],
        "discovery_candidates": candidates.get("candidates") or [],
        "assets": assets,
    }


def regulatory_status(asset_id: str, reg_by_asset: dict[tuple[str, str], dict[str, Any]]) -> dict[str, Any]:
    registers: dict[str, Any] = {}
    for register in REGISTERS:
        hit = reg_by_asset.get((asset_id, register))
        registers[register] = {"state": hit["state"], "evidence": hit["evidence"]} if hit else {"state": "UNCHECKED"}
    return {"class": "DOCUMENTARY", "registers": registers}


def validate_regulatory(document: dict[str, Any]) -> None:
    pins = {p["sha256"] for p in document["shared_evidence"]["regulatory_registers"]["pins"]}
    for row in document["assets"]:
        status = row["regulatory_status"]
        assert status["class"] == "DOCUMENTARY"
        assert set(status["registers"]) == set(REGISTERS)
        for register, entry in status["registers"].items():
            assert entry["state"] in REGISTER_STATES[register], f"{row['id']} {register}: {entry['state']}"
            if entry["state"] == "UNCHECKED":
                assert "evidence" not in entry, "an UNCHECKED row carries no evidence"
            else:
                evidence = entry["evidence"]
                assert evidence.get("retrieved_at"), "a listing needs a retrieval date"
                assert (evidence.get("file_sha256") or evidence.get("page_sha256")) in pins, "a listing must cite a pinned register file"
    for register in REGISTERS:
        for state, count in document["coverage"]["regulatory_register_rows"][register].items():
            assert count == sum(row["regulatory_status"]["registers"][register]["state"] == state for row in document["assets"])


def validate(document: dict[str, Any]) -> None:
    assets = document.get("assets") or []
    coverage = document.get("coverage") or {}
    assert len(assets) == 425, f"expected 425 assets, got {len(assets)}"
    assert len({row["id"] for row in assets}) == len(assets), "asset ids must be unique"
    assert coverage["indexed_assets"] == len(assets)
    assert coverage["indexed_chain_deployments"] == sum(row["chain_deployment_count"] for row in assets)
    measured = [row for row in assets if row["measurement"]["state"] == "MEASURED"]
    assert coverage["deeply_measured_assets"] == len(measured)
    assert coverage["unmeasured_assets"] == len(assets) - len(measured)
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
        assert row["x402_door_state"] in (GENERIC_DOOR_STATE, ASSET_DOOR_STATE)
        assert (row["x402_door_state"] == ASSET_DOOR_STATE) == ("x402_door" in row)
        if row["measurement"]["state"] == "UNMEASURED":
            assert row["measurement"]["depth"] == "NONE"
            assert row["signature_state"] == "NO_ASSET_MEASUREMENT_SIGNATURE"
            assert row["root_state"] == "NO_ASSET_MEASUREMENT_IN_CURRENT_ROOT"
            assert row["anchor_state"] == "NO_ASSET_MEASUREMENT_ANCHOR"
        else:
            assert row["measurement"]["depth"] == "PARTIAL_ONE_CHAIN_XRPL"
            assert row["measurement"]["measured_chains"] == ["XRPL"]
            assert row["measurement"]["match_rule"] == "UNIQUE_FROZEN_SYMBOL_WITH_XRPL_DEPLOYMENT"
            assert "XRPL" in row["chains"]
            assert sum(str(peer["symbol"]).upper() == str(row["symbol"]).upper() for peer in assets) == 1
            assert len(row["measurement"]["evidence_urls"]) == 1
            assert row["measurement"]["evidence_urls"][0].startswith("https://councilof.ai/cards/")
            assert row["signature_state"] == "ASSET_MEASUREMENT_SIGNED_ED25519"
            assert row["root_state"] == "ASSET_MEASUREMENT_IN_CURRENT_ROOT"
            assert row["anchor_state"] == expected_measured_anchor_state
    validate_regulatory(document)


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

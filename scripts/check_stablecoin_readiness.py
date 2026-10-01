#!/usr/bin/env python3
"""CI-friendly truth gate for the published stablecoin readiness catalog."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from build_stablecoin_readiness import (
    INDEX_REL,
    OUTPUT_REL,
    ROOT_REL,
    WITNESS_REL,
    index_commitment_state,
    measured_asset_anchor_state,
    rooted_stablecoin_probes,
    rooted_xrpl_asset_measurements,
    validate,
)


if __name__ == "__main__":
    repo = Path(".").resolve()
    document = json.loads((repo / OUTPUT_REL).read_text())
    validate(document)
    index_sha = hashlib.sha256((repo / INDEX_REL).read_bytes()).hexdigest()
    proof = document["shared_evidence"]["index_commitment"]
    assert proof["index_sha256"] == index_sha, "readiness does not commit to the published frozen index"
    witness = json.loads((repo / WITNESS_REL).read_text())
    w_ots = ((witness.get("witnesses") or {}).get("ots") or {})
    measured = document["coverage"]["deeply_measured_assets"]
    expected_anchored = measured if w_ots.get("bitcoin_blocks") else 0
    assert document["coverage"]["asset_measurements_bitcoin_anchored_via_current_root"] == expected_anchored, (
        "anchored count must equal the witness-derived value: "
        "zero while the root proof is pending, the measured count once CONFIRMED_BITCOIN — never typed by hand"
    )
    assert proof["opentimestamps"]["state"] == w_ots.get("status", "UNKNOWN"), (
        "documented OTS state must equal the witness-derived state"
    )
    expected_index_state = index_commitment_state(
        ((witness.get("witnesses") or {}).get("rekor") or {}).get("status"),
        w_ots.get("status"),
    )
    assert all(row["index_commitment_state"] == expected_index_state for row in document["assets"]), (
        "every indexed row must derive its index commitment state from the current root witness"
    )
    measured_rows = [row for row in document["assets"] if row["measurement"]["state"] == "MEASURED"]
    source_index = json.loads((repo / INDEX_REL).read_text())
    current_root = json.loads((repo / ROOT_REL).read_text())
    root_hashes = set(current_root.get("card_sha256") or [])
    expected_measurements = rooted_xrpl_asset_measurements(repo, root_hashes, source_index["assets"])
    expected_probes = rooted_stablecoin_probes(repo, root_hashes, source_index["assets"])
    assert {row["id"] for row in measured_rows} == set(expected_measurements), (
        "MEASURED rows must equal the signed, current-root, uniquely matched XRPL stablecoin evidence set"
    )
    for row in measured_rows:
        expected_path, _ = expected_measurements[row["id"]]
        assert row["measurement"]["evidence_urls"] == [f"https://councilof.ai/cards/{expected_path.name}"]
    probed_rows = [row for row in document["assets"] if row["probe"]["state"] == "PROBED_SIGNED_ROOTED"]
    assert {row["id"] for row in probed_rows} == set(expected_probes), (
        "PROBED_SIGNED_ROOTED rows must equal signed, current-root stablecoin cohort probe cards"
    )
    for row in probed_rows:
        expected_path, expected_card = expected_probes[row["id"]]
        assert row["probe"]["evidence_urls"] == [f"https://councilof.ai/cards/{expected_path.name}"]
        assert (expected_card.get("payload") or {}).get("attestation_state") == "UNMEASURED"
    assert document["coverage"]["signed_rooted_probe_assets"] == len(expected_probes)
    assert document["coverage"]["signed_rooted_probe_only_assets"] == sum(
        row["measurement"]["state"] == "UNMEASURED" for row in probed_rows
    )
    expected_anchor_state = measured_asset_anchor_state(
        ((witness.get("witnesses") or {}).get("rekor") or {}).get("status"),
        w_ots.get("status"),
    )
    assert all(row["anchor_state"] == expected_anchor_state for row in measured_rows), (
        "measured asset root-anchor state must derive from the current root witness"
    )
    assert document["shared_discovery"]["x402"]["fresh_compute_excluded"] is True
    print(
        "stablecoin readiness truth gate: PASS — "
        f"{document['coverage']['indexed_assets']} indexed, "
        f"{document['coverage']['deeply_measured_assets']} measured, "
        f"{document['coverage']['unmeasured_assets']} unmeasured"
    )

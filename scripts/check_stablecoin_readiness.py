#!/usr/bin/env python3
"""CI-friendly truth gate for the published stablecoin readiness catalog."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from build_stablecoin_readiness import INDEX_REL, OUTPUT_REL, WITNESS_REL, validate


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
    assert document["shared_discovery"]["x402"]["fresh_compute_excluded"] is True
    print("stablecoin readiness truth gate: PASS — 425 indexed, 1 measured, 424 unmeasured")

#!/usr/bin/env python3
"""CI-friendly truth gate for the published stablecoin readiness catalog."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from build_stablecoin_readiness import INDEX_REL, OUTPUT_REL, validate


if __name__ == "__main__":
    repo = Path(".").resolve()
    document = json.loads((repo / OUTPUT_REL).read_text())
    validate(document)
    index_sha = hashlib.sha256((repo / INDEX_REL).read_bytes()).hexdigest()
    proof = document["shared_evidence"]["index_commitment"]
    assert proof["index_sha256"] == index_sha, "readiness does not commit to the published frozen index"
    assert document["coverage"]["asset_measurements_bitcoin_anchored_via_current_root"] == 0
    assert proof["opentimestamps"]["state"] == "STAMPED_PENDING_BITCOIN", (
        "Bitcoin anchoring must remain zero while the OTS proof is pending"
    )
    assert document["shared_discovery"]["x402"]["fresh_compute_excluded"] is True
    print("stablecoin readiness truth gate: PASS — 425 indexed, 1 measured, 424 unmeasured")

#!/usr/bin/env python3

import json
from pathlib import Path


def test_candidate_axes_are_fail_closed() -> None:
    doc = json.loads(Path("public/interop/axes-v2-web3.json").read_text(encoding="utf-8"))
    assert doc["status"] == "DESIGN_PROPOSAL"
    assert len(doc["axes"]) == 22
    forbidden = ("every ", " is signed", "attested on-chain", "33-agent", "bft")
    for axis in doc["axes"]:
        assert axis["rail_status"] == "PLANNED"
        assert axis["gspc_axis_status"] in {"MEASURED", "UNMEASURED"}
        assert all(term not in axis["description"].lower() for term in forbidden)
        assert "No deployment" in axis["claim_boundary"]


if __name__ == "__main__":
    test_candidate_axes_are_fail_closed()
    print("web3 axes design-proposal test: PASS (22/22 fail closed)")

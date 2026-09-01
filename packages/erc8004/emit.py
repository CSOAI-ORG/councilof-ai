#!/usr/bin/env python3
"""ERC-8004 Validation Registry attestation stub. No trust score. writes_board=false."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone


def main() -> None:
    rec = {
        "schema": "csoai.erc8004-attestation/0.1",
        "kind": "stub",
        "writes_board": False,
        "trust_score": None,
        "n_identities_cited": 531269,
        "n_measured": 0,
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "honesty": "Census is DISCOVERED. This stub does not write the Validation Registry. Independent attestation lands only when a public endpoint is probed. Not a grade of 531k identities.",
    }
    json.dump(rec, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()

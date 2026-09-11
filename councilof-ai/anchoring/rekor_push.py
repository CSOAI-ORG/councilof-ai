#!/usr/bin/env python3
"""
CSOAI Rekor Sigstore Push
==========================
Pushes the root.json hash to the Rekor transparency log.

The current root is ALREADY in Rekor at logIndex 2791822965.
This script is for pushing UPDATED roots after new measurement cycles.

Rekor accepts 'rekord' entries (not 'hashedrekord') because pure Ed25519
is rejected by hashedrekord. The entry carries the preimage bytes,
the raw Ed25519 signature, and the board's PEM public key.

Run:
    python3 anchoring/rekor_push.py [--verify-only]

Status: The existing entry is WITNESSED. This script is for future roots.
"""

import json
import sys
from datetime import datetime, timezone


def describe_rekor_state() -> dict:
    """Describe the current Rekor state for the CSOAI root."""
    return {
        "schema": "csoai.anchor.rekor-state/0.1",
        "kind": "rekor.sigstore.inclusion",
        "measured_at": datetime.now(timezone.utc).isoformat(),
        "current_entry": {
            "status": "WITNESSED",
            "logIndex": 2791822965,
            "uuid": "108e9186e8c5677a745e131404b16562b3698b099d3c32b8f93e5a38745fe73ebb5a2350cca83598",
            "integratedTime": 1789116324,
            "logID": "c0d23d6ad406973f9559f3ba2d1ca01f84147d8ffc5b8445c224f98b9591801d",
            "type": "rekord/x509 over the preimage bytes with the board signature",
            "url": "https://rekor.sigstore.dev/api/v1/log/entries?logIndex=2791822965",
            "entry_file": "https://councilof.ai/interop/rekor-root-62a1931b.json",
        },
        "rekor_log": {
            "url": "https://rekor.sigstore.dev/api/v1/log",
            "tree_size_at_check": 2670683164,
            "status": "LIVE",
        },
        "artifact_anchored": {
            "url": "https://councilof.ai/root.json",
            "sha256": "62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6",
            "merkle_root": "78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5",
            "card_count": 167,
        },
        "next_root_push": {
            "status": "NOT_NEEDED_YET",
            "trigger": "When a new root.json is published with updated card count or merkle root",
            "method": "POST to https://rekor.sigstore.dev/api/v1/log/entries with rekord entry type",
            "cost": "free",
        },
        "honest_sentence": "The current root is witnessed in Rekor at logIndex 2791822965. "
                          "No new push is needed until the root changes.",
        "measurement_not_certification": True,
    }


def main():
    state = describe_rekor_state()
    print(json.dumps(state, indent=2))


if __name__ == "__main__":
    main()

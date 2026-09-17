#!/usr/bin/env python3
"""witness_cosign_spike.py — a written spike. NO DEPLOYMENT.

Per M4 ROUND 2 DONE WHEN C: a written spike, not a deployment. Says what
our root would have to look like to accept k-of-n independent cosignatures,
whether tlog-tiles/Tessera is compatible, what an independent witness
would actually be signing, and the parts that DON'T fit.

Actions is dead (ticket #4720908). DEPLOY-LOCK is in force. This script
prints the spike; it does not deploy anything.
"""
from __future__ import annotations
import argparse, sys

REQUIRED_ENVELOPE = {
    "schema": "csoai.public-root/0.2",
    "checkpoints": [
        {"kind": "operator", "key_id": "...", "signature": "..."},
        {"kind": "witness",  "key_id": "...", "signature": "..."},  # ×N
    ],
    "consensus": {"required": 2, "observed": "N", "missing": 0},
}

DOES_NOT_FIT = [
    "GHA dead (ticket #4720908, day 15) → no fresh witness key issuance",
    "COSE interop key ~/.csoai-keys/ → different system; using it is forgery",
    "Existing single-operator checkpoint → witness cannot reuse its bytes",
    "/public/interop/ots/ → calendar-pending, not a witness",
    "~/.csoai/keys/harvest_ed25519.pem → signer_authority=NOT_ESTABLISHED, cannot be a witness",
    "305 vs 335 freshness defect → witnesses don't fix staleness",
    "DEPLOY-LOCK → no deploy without owner action",
]

DOES_FIT = [
    "merkle root + inclusion proof math (identical to existing)",
    "leaf sha256 over exact bytes (identical to existing)",
    "non-destructive field addition (checkpoints[], consensus{} — old readers ignore)",
    "C2SP leaf format migration (preserve existing sha256, wrap in body/integrations)",
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--probe", action="store_true")
    a = ap.parse_args()
    if not a.probe:
        print(__doc__)
        return 0

    print("=== witness-cosign-spike: written spike (NO DEPLOYMENT) ===")
    print()
    print("current envelope: scripts/master_closed_loop.py produces signatures;")
    print("root.json carries a single operator checkpoint; witness field does not exist.")
    print()
    print("required envelope schema: csoai.public-root/0.2")
    print(f'  checkpoints: list of {{kind, key_id, signature, ...}}')
    print(f'  consensus:   {{required: 2, observed: N, missing: M}}')
    print()
    print("required migration: NON-DESTRUCTIVE (add checkpoints[] next to checkpoint;")
    print("                   old readers ignore new fields; old signed bytes preserved).")
    print()
    print("parts that DO NOT fit:")
    for i, p in enumerate(DOES_NOT_FIT, 1):
        print(f"  {i}. {p}")
    print()
    print("parts that DO fit:")
    for i, p in enumerate(DOES_FIT, 1):
        print(f"  - {p}")
    print()
    print("deploy: NEVER. NO deploy without explicit owner action.")
    print("DEPLOY-LOCK in force.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

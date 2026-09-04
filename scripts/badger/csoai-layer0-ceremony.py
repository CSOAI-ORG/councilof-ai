#!/usr/bin/env python3
"""csoai-layer0-ceremony.py — a fail-closed Layer 0 witness plan.

The Layer 0 ceremony:
  1. Discover every signed card on the substrate
  2. Build the Merkle root over every card
  3. Describe three possible witness rails without claiming they ran
  4. Publish only receipts returned by their real protocol clients
  5. Wire to Oracle micros + RunPod (when available)

This dry-run never creates a file with an `.ots` extension. Only a parseable
DetachedTimestampFile returned by the OpenTimestamps client is an `.ots` file.
"""

from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

QUEUE = Path("scripts/badger/_queue/ceremony")
QUEUE.mkdir(parents=True, exist_ok=True)


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def get_json(url: str, timeout: int = 30) -> dict | None:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CSOAI-Ceremony/1.0"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as e:
        return {"error": str(e)}


def build_merkle_root(card_sha256s: list[str]) -> str:
    """Reproduce the public-root v1 node rule over raw digest bytes."""
    if not card_sha256s:
        return hashlib.sha256(b"").hexdigest()
    layer = [bytes.fromhex(value) for value in card_sha256s]
    while len(layer) > 1:
        next_layer = []
        for i in range(0, len(layer), 2):
            left = layer[i]
            right = layer[i + 1] if i + 1 < len(layer) else left
            next_layer.append(hashlib.sha256(left + right).digest())
        layer = next_layer
    return layer[0].hex()


def ots_plan(merkle_root: str) -> dict:
    """Describe an unstamped digest without manufacturing proof-shaped bytes."""
    return {
        "digest": merkle_root,
        "status": "NOT_STAMPED",
        "proof_path": None,
        "reason": (
            "This ceremony is a dry-run. Use the authorised root witness workflow "
            "to create a parseable detached OpenTimestamps proof."
        ),
    }


def main() -> None:
    print("=== LAYER 0 WITNESS PLAN — fail closed ===")
    print()

    # Step 1: Fetch the live card chain
    print("[1] Fetching live card chain...")
    chain = get_json("https://councilof.ai/signed/card_index.json")

    if chain and not chain.get("error"):
        cards = chain.get("cards", [])
        if isinstance(cards, list):
            print(f"      found {len(cards)} cards on chain")
        else:
            cards = []
    else:
        cards = []

    # Step 2: Extract SHA-256s
    sha256s = []
    for c in cards:
        if isinstance(c, dict):
            s = c.get("card") or c.get("sha256") or c.get("hash")
            if s:
                sha256s.append(s)

    print(f"      sha256s: {len(sha256s)}")

    # Step 3: Build Merkle root
    print()
    print("[2] Building Merkle root...")
    merkle_root = build_merkle_root(sha256s)
    print(f"      merkle_root: {merkle_root[:32]}...")
    print()

    # Step 4: witness plan. No network write occurs in this script.
    print("[3] Witness plan...")
    anchors = {
        "opentimestamps": {
            "name": "OpenTimestamps → Bitcoin",
            "kind": "witness-plan",
            "endpoint": "https://opentimestamps.org",
            "method": "Create a detached timestamp with an OpenTimestamps client, then upgrade and verify it against Bitcoin",
            "status": "NOT_STAMPED",
            "as_of": now(),
            "receipt": ots_plan(merkle_root),
        },
        "sigstore_rekor": {
            "name": "Sigstore Rekor",
            "kind": "witness-plan",
            "endpoint": "https://rekor.sigstore.dev",
            "method": "POST /api/v1/log with the merkle_root + Ed25519 signature",
            "status": "NOT_SUBMITTED",
            "as_of": now(),
            "receipt": {
                "digest": merkle_root,
                "entry": None,
                "reason": "This dry-run did not submit a signed entry to Rekor.",
            },
        },
        "eas_base": {
            "name": "EAS on Base",
            "kind": "witness-plan",
            "endpoint": "https://base.easscan.org",
            "method": "POST schema attestation with the merkle_root as the data field",
            "status": "NOT_SUBMITTED",
            "as_of": now(),
            "receipt": {
                "digest": merkle_root,
                "uid": None,
                "reason": "This dry-run did not submit an EAS attestation.",
            },
        },
    }
    print("  · OpenTimestamps → Bitcoin (not stamped by this dry-run)")
    print("  · Sigstore Rekor (planned; no receipt created here)")
    print("  · EAS on Base (planned; no receipt created here)")
    print()

    # Step 5: Wire to Oracle + RunPod
    print("[4] Wire Oracle + RunPod...")
    compute = {
        "as_of": now(),
        "compute": {
            "oracle": {
                "status": "UNCHECKED_IN_THIS_RUN",
                "host": None,
                "uptime": None,
                "role": "candidate witness relay; no relay receipt was collected",
                "capabilities": ["x86_64", "1 vCPU", "956 MB RAM"],
            },
            "runpod": {
                "status": "DARK (paused — no API key)",
                "host": "n/a",
                "role": "GPU compute (3090, A100, RTX PRO 4500, RTX 5090) — when claimed",
                "capabilities": ["NVIDIA RTX 3090", "NVIDIA RTX 4090", "NVIDIA A100", "NVIDIA RTX PRO 4500 Blackwell", "NVIDIA RTX PRO 6000 Blackwell", "NVIDIA H200"],
            },
        },
    }
    print("  · Oracle relay (not checked by this run)")
    print("  · RunPod compute (paused; no witness role asserted)")
    print()

    # Save the ceremony receipt
    ceremony = {
        "schema": "csoai.layer0-ceremony/0.1",
        "as_of": now(),
        "merkle_root": merkle_root,
        "cards_anchored": len(sha256s),
        "anchors": anchors,
        "compute": compute,
        "doctrine": "A witness rail counts only after its real receipt verifies against these exact bytes. This dry-run creates no anchor.",
    }
    ceremony_path = QUEUE / f"ceremony-{now()}.json"
    ceremony_path.write_text(json.dumps(ceremony, indent=2))

    # Summary
    print("=== SUMMARY ===")
    print(f"  merkle_root:  {merkle_root[:32]}...")
    print(f"  cards:        {len(sha256s)}")
    print("  witnesses:    0 completed; 3 rails planned")
    print("  compute:      Oracle (unchecked) + RunPod (paused)")
    print(f"  ceremony:     {ceremony_path}")
    print("  public:       unchanged; discovery pointer remains authoritative")
    print("  ots proof:    none (dry-run; no proof-shaped placeholder written)")


if __name__ == "__main__":
    main()

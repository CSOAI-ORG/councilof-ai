#!/usr/bin/env python3
"""Compare public-root meaning across hosts and verify its Ed25519 signature.

Formatting, key order and explanatory-note edits are not root drift. The bound
preimage, Merkle leaf set and signature are. This reader never writes a root.
"""
from __future__ import annotations

import base64
import hashlib
import json
import subprocess
import tempfile
import urllib.request
from pathlib import Path

UA = {"User-Agent": "csoai-public-root-watcher/1", "Accept": "application/json"}
DID = "did:web:csoai.org#board-attestation-1"
PREIMAGE_KEYS = ("kind", "schema", "as_of", "merkle_root", "card_count", "did_intended")
HOSTS = {
    "councilof.ai": "https://councilof.ai/root.json",
    "csoai.org": "https://csoai.org/root.json",
    "hf": "https://huggingface.co/datasets/csoai/gspc-boards/resolve/main/public-root/root.json",
}


def canonical(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def fetch_json(url: str) -> dict:
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20) as response:
        if response.status != 200:
            raise ValueError(f"HTTP {response.status} from {url}")
        return json.loads(response.read())


def merkle_root(leaf_hexes: list[str]) -> str:
    level = [bytes.fromhex(value) for value in leaf_hexes]
    if not level:
        return hashlib.sha256(b"").hexdigest()
    while len(level) > 1:
        next_level = []
        for index in range(0, len(level), 2):
            left = level[index]
            right = level[index + 1] if index + 1 < len(level) else left
            next_level.append(hashlib.sha256(left + right).digest())
        level = next_level
    return level[0].hex()


def did_public_key(did_document: dict) -> bytes:
    methods = did_document.get("verificationMethod") or []
    method = next((row for row in methods if row.get("id") == DID), None)
    value = ((method or {}).get("publicKeyJwk") or {}).get("x")
    if not isinstance(value, str):
        raise ValueError("board-attestation key absent from DID document")
    return base64.urlsafe_b64decode(value + "=" * ((4 - len(value) % 4) % 4))


def verify_signature(preimage: bytes, signature: bytes, public_key: bytes) -> None:
    if len(public_key) != 32 or len(signature) != 64:
        raise ValueError("Ed25519 key/signature length invalid")
    # SubjectPublicKeyInfo prefix for a raw Ed25519 public key (RFC 8410).
    spki = bytes.fromhex("302a300506032b6570032100") + public_key
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        (root / "key.der").write_bytes(spki)
        (root / "preimage.bin").write_bytes(preimage)
        (root / "signature.bin").write_bytes(signature)
        result = subprocess.run(
            [
                "openssl", "pkeyutl", "-verify", "-pubin", "-keyform", "DER",
                "-inkey", str(root / "key.der"), "-rawin", "-in", str(root / "preimage.bin"),
                "-sigfile", str(root / "signature.bin"),
            ],
            capture_output=True,
            check=False,
        )
    if result.returncode != 0:
        raise ValueError("public-root Ed25519 signature invalid")


def validate_root(root: dict, public_key: bytes) -> str:
    missing = [key for key in (*PREIMAGE_KEYS, "card_sha256", "sig_ed25519") if key not in root]
    if missing:
        raise ValueError("public-root missing " + ", ".join(missing))
    leaves = root["card_sha256"]
    if not isinstance(leaves, list) or int(root["card_count"]) != len(leaves):
        raise ValueError("card_count does not match leaf list")
    if merkle_root(leaves) != root["merkle_root"]:
        raise ValueError("merkle_root does not bind card_sha256")
    if root["did_intended"] != DID:
        raise ValueError("unexpected public-root signer DID")
    preimage = {key: root[key] for key in PREIMAGE_KEYS}
    signature = bytes.fromhex(root["sig_ed25519"])
    verify_signature(canonical(preimage), signature, public_key)
    # Meaning identity: the exact signed preimage plus signature. Notes and JSON
    # formatting may differ without creating false drift.
    return hashlib.sha256(canonical({"preimage": preimage, "signature": root["sig_ed25519"]})).hexdigest()


def main() -> int:
    public_key = did_public_key(fetch_json("https://councilof.ai/.well-known/did.json"))
    identities = {}
    for name, url in HOSTS.items():
        root = fetch_json(url)
        identities[name] = validate_root(root, public_key)
        print(name, "VALID", identities[name], root["merkle_root"], root["card_count"])
    if len(set(identities.values())) != 1:
        print("DRIFT", json.dumps(identities, sort_keys=True))
        return 1
    print("OK three-host semantic root + Ed25519 signature", next(iter(identities.values())))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

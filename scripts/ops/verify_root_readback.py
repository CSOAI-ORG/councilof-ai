#!/usr/bin/env python3
"""Independently replay a published Council public root and sampled inclusion paths.

Checks source bytes and root signature under the CURRENT publisher-controlled DID.
It does NOT prove card measurement correctness, trustworthy human authority,
external witnessing, Bitcoin block validation, or customer acceptance.
"""
from __future__ import annotations
import argparse
import base64
import datetime as dt
import hashlib
import json
import pathlib
import re
import sys
import urllib.request

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

ROOT_URL = "https://councilof.ai/root.json"
DID_URL = "https://csoai.org/.well-known/did.json"
PROOF_BASE = "https://councilof.ai/api/proof?sha="
USER_AGENT = "CSOAI-independent-root-readback/0.1 (+https://councilof.ai/methodology/)"
PREIMAGE_FIELDS = ("kind", "schema", "as_of", "merkle_root", "card_count", "did_intended")
HEX64 = re.compile(r"^[0-9a-f]{64}$")


def bytehash(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def decode_json(raw: bytes) -> dict:
    obj = json.loads(raw)
    if not isinstance(obj, dict):
        raise ValueError("source is not a JSON object")
    return obj


def fetch_json(url: str) -> tuple[dict, str]:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=15) as reply:
        if reply.status != 200:
            raise ValueError("HTTP response not 200")
        body = reply.read(8_000_001)
        if len(body) > 8_000_000:
            raise ValueError("exceeds 8 MB")
    return decode_json(body), bytehash(body)


def validated_leaves(root: dict) -> list[str]:
    leaves = root.get("card_sha256")
    count = root.get("card_count")
    if not isinstance(leaves, list) or not leaves:
        raise ValueError("root lacks nonempty leaf list")
    if not isinstance(count, int) or isinstance(count, bool) or count != len(leaves):
        raise ValueError("root card_count mismatch")
    if any(not isinstance(x, str) or not HEX64.fullmatch(x) for x in leaves):
        raise ValueError("malformed leaf digest")
    if not isinstance(root.get("merkle_root"), str) or not HEX64.fullmatch(root["merkle_root"]):
        raise ValueError("malformed declared merkle_root")
    return leaves


def compute_merkle(leaves: list[str]) -> str:
    if not leaves:
        raise ValueError("empty leaves")
    level = [bytes.fromhex(x) for x in leaves]
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        level = [hashlib.sha256(level[i] + level[i + 1]).digest()
                 for i in range(0, len(level), 2)]
    return level[0].hex()


def verify_root_signature(root: dict, did: dict) -> str:
    key_id = root.get("did_intended")
    if not isinstance(key_id, str) or not key_id.startswith("did:web:csoai.org#"):
        raise ValueError("root key identifier is unexpected")
    methods = did.get("verificationMethod")
    if not isinstance(methods, list):
        raise ValueError("DID verification methods missing")
    matches = [v for v in methods if isinstance(v, dict) and v.get("id") == key_id]
    if len(matches) != 1:
        raise ValueError("DID key absent or ambiguous")
    jwk = matches[0].get("publicKeyJwk")
    if not isinstance(jwk, dict) or jwk.get("kty") != "OKP" or jwk.get("crv") != "Ed25519":
        raise ValueError("DID key must be Ed25519 OKP")
    x = jwk.get("x")
    if not isinstance(x, str):
        raise ValueError("DID key x missing")
    try:
        key_bytes = base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))
        signature = bytes.fromhex(root["sig_ed25519"])
        if len(key_bytes) != 32 or len(signature) != 64:
            raise ValueError("invalid key or signature length")
        canonical = json.dumps({name: root[name] for name in PREIMAGE_FIELDS},
                               sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
        Ed25519PublicKey.from_public_bytes(key_bytes).verify(signature, canonical)
    except (KeyError, ValueError, InvalidSignature) as exc:
        raise ValueError("Ed25519 signature verification failed") from exc
    return key_id


def verify_inclusion(proof: dict, expected_index: int, leaves: list[str], declared_root: str) -> None:
    if not 0 <= expected_index < len(leaves):
        raise ValueError("index exceeds actual tree (duplicate-tail attack)")
    if proof.get("sha256") != leaves[expected_index]:
        raise ValueError("proof leaf not bound to expected roster index")
    if proof.get("index") != expected_index or proof.get("card_count") != len(leaves):
        raise ValueError("proof index or card count diverges")
    if proof.get("merkle_root") != declared_root:
        raise ValueError("proof root diverges from pinned snapshot")
    path = proof.get("proof")
    if not isinstance(path, list):
        raise ValueError("missing proof path")
    node = bytes.fromhex(leaves[expected_index])
    index, width = expected_index, len(leaves)
    expected_levels = 0
    while width > 1:
        expected_levels += 1
        width = (width + 1) // 2
    if len(path) != expected_levels:
        raise ValueError("incorrect inclusion path length")
    for sibling in path:
        if not isinstance(sibling, str) or not HEX64.fullmatch(sibling):
            raise ValueError("malformed inclusion sibling digest")
        other = bytes.fromhex(sibling)
        node = hashlib.sha256(other + node if index % 2 else node + other).digest()
        index //= 2
    if node.hex() != declared_root:
        raise ValueError("inclusion proof does not reconstruct pinned root")


def checked(state: str, explanation: str) -> dict:
    return {"state": state, "detail": explanation}


def verify_sources(root: dict, did: dict, proofs: dict[int, dict]) -> dict:
    """Pure verdicts, no network: missing live evidence is UNCHECKABLE, forged evidence INVALID."""
    checks = {}
    meta = {"root_merkle": root.get("merkle_root"),
            "root_as_of": root.get("as_of"), "root_leaf_count": root.get("card_count")}
    try:
        leaves = validated_leaves(root)
        actual = compute_merkle(leaves)
        if actual != root["merkle_root"]:
            raise ValueError("recomputed root differs from published root")
        checks["merkle_tree"] = checked("VALID", "all published leaf digests independently folded")
    except (ValueError, TypeError) as exc:
        checks["merkle_tree"] = checked("INVALID", str(exc))
        leaves = []
    try:
        key_id = verify_root_signature(root, did)
        checks["root_signature"] = checked("VALID", "Ed25519 signature verified against live publisher DID")
        meta["key_id"] = key_id
    except (ValueError, TypeError, KeyError) as exc:
        checks["root_signature"] = checked("INVALID", str(exc))
    if leaves:
        for index in sorted(proofs):
            try:
                verify_inclusion(proofs[index], index, leaves, root["merkle_root"])
                checks[f"proof_{index}"] = checked("VALID", "independently recomputed membership path")
            except (ValueError, TypeError) as exc:
                checks[f"proof_{index}"] = checked("INVALID", str(exc))
    verdict = ("INVALID" if any(x["state"] == "INVALID" for x in checks.values())
               else "VALID" if checks and all(x["state"] == "VALID" for x in checks.values())
               else "UNCHECKABLE")
    return {"checks": checks, "verdict": verdict, **meta}


def indices_for(count: int) -> list[int]:
    return sorted(set((0, 1, count // 2, count - 1)))


def main(argv=None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--out", default="out/cryptographic-root-readback.json")
    parser.add_argument("--strict", action="store_true", help="exit nonzero unless fully VALID")
    args = parser.parse_args(argv)
    result = {"schema": "csoai.root-independent-readback/0.1",
              "observed_at": dt.datetime.now(dt.timezone.utc).isoformat(),
              "source_urls": {"root": ROOT_URL, "did": DID_URL, "proof_base": PROOF_BASE},
              "checks": {}, "verdict": "UNCHECKABLE",
              "caveat": "Publisher-hosted DID, not independent external witness; proof membership is not a valid measurement or compliance determination."}
    try:
        root, root_sha = fetch_json(ROOT_URL)
        result["root_source_sha256"] = root_sha
        leaves = validated_leaves(root)
        did, did_sha = fetch_json(DID_URL)
        result["did_source_sha256"] = did_sha
        proofs, hashes = {}, {}
        for i in indices_for(len(leaves)):
            url = PROOF_BASE + leaves[i]
            p, raw_sha = fetch_json(url)
            proofs[i] = p
            hashes[str(i)] = {"url": url, "source_sha256": raw_sha}
        result["proof_sources"] = hashes
        result.update(verify_sources(root, did, proofs))
        result["sampled_proofs"] = len(proofs)
    except Exception as exc:  # Network/read failures are not cryptographic-invalid claims.
        result["verdict"] = "UNCHECKABLE"
        result["source_failure"] = f"{type(exc).__name__}: {str(exc)[:220]}"
    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n")
    print(json.dumps({"verdict": result["verdict"], "checked": list(result["checks"]), "artifact": str(out)}))
    return 0 if not args.strict or result["verdict"] == "VALID" else 2


if __name__ == "__main__":
    sys.exit(main())

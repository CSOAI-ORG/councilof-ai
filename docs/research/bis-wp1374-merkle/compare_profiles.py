# SPDX-License-Identifier: Apache-2.0
"""Offline synthetic Merkle profile comparison; no network, keys or ledger."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import re
import sys

import bis_reference as reference

DEFAULT_VECTORS = Path(__file__).with_name("vectors.json")
SOURCE_COMMIT = "553c7408593351d05733c7de5ba6b8ae5852d128"
SOURCE_SHA256 = "d26776108ee975efbadc21dd2f3698ac15418540ecdd788b8170923b5feae590"
LIMITS = {"xml_canonicalization_tested": False, "signature_tested": False,
          "issuer_identity_tested": False, "ledger_tested": False,
          "deployed_interoperability_tested": False}


def fingerprints_512(values: list[str]) -> list[str]:
    """An example input policy, not a change to the vendored reference."""
    if not isinstance(values, list) or not values:
        raise ValueError("Expected a nonempty list of synthetic fingerprints")
    if any(not isinstance(value, str) or not re.fullmatch(r"[0-9a-fA-F]{128}", value)
           for value in values):
        raise ValueError("Each example fingerprint must be exactly 64 bytes of hex")
    return values


def upfront_padding_root(values: list[str]) -> str:
    """Independent upfront final-leaf padding; not the reference implementation."""
    values = fingerprints_512(values)
    nodes = [hashlib.sha3_512(b"\x00" + bytes.fromhex(value)).digest()
             for value in values]
    size = 1 << (len(nodes) - 1).bit_length()
    nodes += [nodes[-1]] * (size - len(nodes))
    while len(nodes) > 1:
        nodes = [hashlib.sha3_512(b"\x01" + nodes[i] + nodes[i + 1]).digest()
                 for i in range(0, len(nodes), 2)]
    return hashlib.sha3_512(b"\x02" + len(values).to_bytes(4, "big")
                           + nodes[0]).hexdigest().upper()


def compare(fixture: dict) -> dict:
    """Replay fixed expectations; a changed expected root fails instead of updating it."""
    if fixture.get("synthetic_input_only") is not True:
        raise ValueError("This example only accepts its synthetic vector fixture")
    source = fixture["source"]
    if (source.get("commit") != SOURCE_COMMIT or source.get("sha256") != SOURCE_SHA256
            or source.get("path") != "app/utils.py"):
        raise ValueError("Pinned source provenance mismatch")
    if fixture.get("limits") != LIMITS:
        raise ValueError("This replay cannot promote unexecuted verification claims")
    rows = []
    for vector in fixture["root_vectors"]:
        values = fingerprints_512(vector["fingerprints"])
        actual_reference = reference.merkle_root_from_hex_hashes(values)
        actual_upfront = upfront_padding_root(values)
        if (actual_reference != vector["reference_root"]
                or actual_upfront != vector["upfront_padding_root"]
                or (actual_reference == actual_upfront) != vector["profiles_equal"]):
            raise ValueError("Pinned expectation mismatch: " + vector["id"])
        rows.append({"id": vector["id"], "leaf_count": len(values),
                     "reference_root": actual_reference,
                     "upfront_padding_root": actual_upfront,
                     "profiles_equal": actual_reference == actual_upfront})
    vector = fixture["count_binding"]
    root3 = reference.merkle_root_from_hex_hashes(
        fingerprints_512(vector["input_fingerprints_3"]))
    root4 = reference.merkle_root_from_hex_hashes(
        fingerprints_512(vector["input_fingerprints_4"]))
    if (root3 != vector["wrapped_root_3"] or root4 != vector["wrapped_root_4"]
            or root3 == root4):
        raise ValueError("Pinned count-binding expectation mismatch")
    vector = fixture["proof_count"]
    values = fingerprints_512(vector["input_fingerprints"])
    proof = [(row["sibling"], row["orientation"]) for row in vector["proof"]]
    correct = reference.root_from_inclusion_proof(
        values[vector["leaf_index"]], proof, len(values))
    tampered = reference.root_from_inclusion_proof(
        values[vector["leaf_index"]], proof, vector["tampered_count"])
    if (correct != vector["expected_root"] or tampered != vector["tampered_count_root"]
            or correct == tampered):
        raise ValueError("Pinned proof/count expectation mismatch")
    return {"schema": "csoai.synthetic-merkle-profile-comparison/1",
            "synthetic_input_only": True, "source": fixture["source"],
            "root_vectors": rows, "count_binding_confirmed": True,
            "proof_count_binding_confirmed": True,
            "limits": dict(LIMITS)}


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--vectors", type=Path, default=DEFAULT_VECTORS,
                        help="Synthetic fixture path (defaults to the file beside this script)")
    args = parser.parse_args(argv)
    try:
        result = compare(json.loads(args.vectors.read_text(encoding="utf-8")))
    except (OSError, ValueError, KeyError, TypeError, IndexError) as error:
        print("Comparison failed: " + str(error), file=sys.stderr)
        return 1
    print(json.dumps(result, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

# SPDX-License-Identifier: Apache-2.0
# Copyright 2026 Bank for International Settlements
# Extracted without changing these seven function bodies from app/utils.py at
# 553c7408593351d05733c7de5ba6b8ae5852d128. The application imports were removed.
# This module deliberately retains the reference input contract, including
# accepting non-64-byte hex fingerprints. See compare_profiles.py for the
# example's separate strict input policy, and NOTICE for attribution.
from __future__ import annotations

import hashlib

def compute_sha3_512_raw(data: bytes) -> bytes:
    # Return raw digest bytes (64 bytes)
    return hashlib.sha3_512(data).digest()


def _len32_be_int(n: int) -> bytes:
    # 32-bit big-endian encoding of the integer n (the leaf count), per the paper.
    return int(n).to_bytes(4, byteorder="big")


def _merkle_leaf(h_bytes: bytes) -> bytes:
    # H_leaf(h) = SHA3-512(0x00 || h)   (Section 4.1, "Domain separation")
    return compute_sha3_512_raw(b"\x00" + h_bytes)


def _merkle_node(left: bytes, right: bytes) -> bytes:
    # H_node(L, R) = SHA3-512(0x01 || L || R)
    return compute_sha3_512_raw(b"\x01" + left + right)


def merkle_root_from_hex_hashes(hex_hashes: list[str]) -> str:
    # Implements the domain-separated leaf/node/root construction from the paper
    # (Section 4.1). Because leaves and internal nodes are all fixed-length
    # 64-byte SHA3-512 outputs, the single-byte domain separators alone prevent
    # concatenation ambiguity; length prefixing is NOT applied to leaves/nodes.
    # The final root wraps the internal root with a domain-separated layer that
    # explicitly binds the leaf count n:
    #     R = SHA3-512(0x02 || len32(n) || R_internal).
    # For n = 1 no padding is needed (the tree is a single leaf).
    # Input:  list of hex-encoded 512-bit hashes (case-insensitive).
    # Output: hex-encoded root (uppercase).
    if not hex_hashes:
        raise ValueError("No hashes provided for Merkle root")

    n = len(hex_hashes)

    # Leaves L_i = H_leaf(h_i)
    leaves: list[bytes] = [_merkle_leaf(bytes.fromhex(h)) for h in hex_hashes]

    # Internal root: single leaf needs no padding; otherwise pad to the next
    # power of two by duplicating the final leaf, forming a perfect binary tree.
    nodes = leaves
    while len(nodes) > 1:
        next_level: list[bytes] = []
        for i in range(0, len(nodes), 2):
            left = nodes[i]
            right = nodes[i + 1] if i + 1 < len(nodes) else nodes[i]
            next_level.append(_merkle_node(left, right))
        nodes = next_level

    root_internal = nodes[0]

    # Domain-separated root wrapper binding the leaf count n.
    root = compute_sha3_512_raw(b"\x02" + _len32_be_int(n) + root_internal)
    return root.hex().upper()


def merkle_inclusion_proof(hex_hashes: list[str], index: int) -> list[tuple[str, str]]:
    # Generate an inclusion proof pi_i for the leaf at position `index` over the
    # ordered leaf fingerprints `hex_hashes` (Section 4.2). The proof is the ordered
    # list of sibling node values together with an orientation bit indicating on
    # which side the sibling sits ('L' = sibling is left, 'R' = sibling is right),
    # so the root recomputation via H_node is unambiguous. Padding follows the
    # paper's scheme: odd levels duplicate the final node before pairing.
    if not hex_hashes:
        raise ValueError("No hashes provided for inclusion proof")
    if not (0 <= index < len(hex_hashes)):
        raise ValueError("Leaf index out of range")

    nodes = [_merkle_leaf(bytes.fromhex(h)) for h in hex_hashes]
    proof: list[tuple[str, str]] = []
    idx = index
    while len(nodes) > 1:
        # Pad to an even count by duplicating the final node (perfect-tree scheme).
        if len(nodes) % 2 == 1:
            nodes = nodes + [nodes[-1]]
        sib = idx ^ 1
        orientation = "R" if sib > idx else "L"
        proof.append((nodes[sib].hex().upper(), orientation))
        nodes = [_merkle_node(nodes[i], nodes[i + 1]) for i in range(0, len(nodes), 2)]
        idx //= 2
    return proof


def root_from_inclusion_proof(leaf_hex: str, proof: list[tuple[str, str]], n: int) -> str:
    # Recompute the domain-separated Merkle root R from a leaf fingerprint and its
    # inclusion proof (Section 4.2). Applies H_leaf to the fingerprint, folds in the
    # ordered siblings via H_node respecting orientation bits, then wraps the
    # internal root with the leaf-count-binding layer: R = SHA3-512(0x02||len32(n)||R_int).
    cur = _merkle_leaf(bytes.fromhex(leaf_hex))
    for sib_hex, orientation in proof:
        sib = bytes.fromhex(sib_hex)
        if orientation == "R":
            cur = _merkle_node(cur, sib)
        elif orientation == "L":
            cur = _merkle_node(sib, cur)
        else:
            raise ValueError(f"Invalid orientation bit: {orientation!r}")
    root = compute_sha3_512_raw(b"\x02" + _len32_be_int(n) + cur)
    return root.hex().upper()

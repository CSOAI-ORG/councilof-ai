#!/usr/bin/env python3
"""RFC 9162 (Certificate Transparency v2) Merkle Tree Hash, §2.1.1 — and nothing else.

    MTH({})    = SHA-256()
    MTH({d0})  = SHA-256(0x00 || d0)
    MTH(D[n])  = SHA-256(0x01 || MTH(D[0:k]) || MTH(D[k:n])),  k = largest power of two < n

The estate already has two other Merkle shapes and they are not this one:
  * public/root.json DUPLICATES an odd node;
  * scripts/measurement_root.py CARRIES an odd node up unchanged.
Both are unprefixed (leaf and internal hashes are drawn from the same space, so a leaf can
be forged as an internal node). This module is domain-separated and splits at the largest
power of two, so it is neither of those. Never substitute one for another.
"""
from __future__ import annotations

import hashlib

LEAF_PREFIX = b"\x00"
NODE_PREFIX = b"\x01"


def leaf_hash(entry: bytes) -> bytes:
    return hashlib.sha256(LEAF_PREFIX + entry).digest()


def node_hash(left: bytes, right: bytes) -> bytes:
    return hashlib.sha256(NODE_PREFIX + left + right).digest()


def largest_power_of_two_below(n: int) -> int:
    """k such that k < n <= 2k, for n > 1. RFC 9162 §2.1.1."""
    if n < 2:
        raise ValueError("defined only for n > 1")
    return 1 << (n - 1).bit_length() - 1


def mth(entries: list[bytes]) -> bytes:
    """Merkle Tree Hash over the RAW entries (each is leaf-hashed here, not before)."""
    n = len(entries)
    if n == 0:
        return hashlib.sha256(b"").digest()
    if n == 1:
        return leaf_hash(entries[0])
    k = largest_power_of_two_below(n)
    return node_hash(mth(entries[:k]), mth(entries[k:]))


def root_hex(entries: list[bytes]) -> str:
    return mth(entries).hex()


def inclusion_proof(entries: list[bytes], m: int) -> list[bytes]:
    """PATH(m, D[n]) — RFC 9162 §2.1.3.2. Audit path for the m-th entry, 0-based."""
    n = len(entries)
    if not 0 <= m < n:
        raise IndexError(f"index {m} outside 0..{n - 1}")
    if n == 1:
        return []
    k = largest_power_of_two_below(n)
    if m < k:
        return inclusion_proof(entries[:k], m) + [mth(entries[k:])]
    return inclusion_proof(entries[k:], m - k) + [mth(entries[:k])]


def verify_inclusion(entry: bytes, m: int, n: int, path: list[bytes], root: bytes) -> bool:
    """RFC 9162 §2.1.3.2 verification: recompute the root from the leaf and its audit path."""
    if not 0 <= m < n:
        return False
    fn, sn, r = m, n - 1, leaf_hash(entry)
    for sibling in path:
        if sn == 0:
            return False
        if fn & 1 or fn == sn:
            r = node_hash(sibling, r)
            while fn and not fn & 1:
                fn >>= 1
                sn >>= 1
        else:
            r = node_hash(r, sibling)
        fn >>= 1
        sn >>= 1
    return sn == 0 and r == root

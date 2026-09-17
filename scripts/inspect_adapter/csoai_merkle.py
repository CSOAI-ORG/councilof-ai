#!/usr/bin/env python3
"""The estate's Merkle rule, exactly as public/root.json defines it — nothing invented here.

public/root.json carries the rule in its own fields:

  leaf_definition: "sha256(canonical(card minus sha256 and sig_ed25519)) — binds subject,
                    source_urls, tags, as_of, did, surface, unmeasured and payload"
  node_definition: "parent = sha256(left || right) over RAW 32-byte digests, pairwise,
                    bottom-up. An odd node at any level is paired WITH ITSELF
                    (Bitcoin-style duplication), not promoted. No domain-separation prefix."

This module implements node_definition verbatim. Two things a reader must know:

1. THIS IS NOT RFC 6962. RFC 6962 prefixes 0x00 before a leaf and 0x01 before an internal
   node, which makes a leaf hash and a node hash live in disjoint domains. We prefix nothing.
   A 32-byte value in this tree is ambiguous between "a leaf" and "an interior node", which is
   precisely the property RFC 6962's domain separation removes. We do NOT silently convert to
   RFC 6962, because changing the rule changes every root the estate has ever published.

2. ODD NODES ARE DUPLICATED, NOT PROMOTED, and that is CVE-2012-2459. Appending duplicates of
   the tail yields a DIFFERENT leaf set with an IDENTICAL root — [A,B,C] and [A,B,C,C] are the
   minimal example. root.json states the mitigation and it is mandatory: the leaf COUNT is
   inside the signed preimage, so a verifier MUST reject any presentation where the number of
   leaves disagrees with the declared count, and MUST reject any inclusion proof whose index is
   at or beyond that count. Checking merkle_root alone is NOT sufficient. verify_bundle.py
   enforces both, and control C3 proves the enforcement is not vacuous.

Verified 2026-09-17 against the deployed public/root.json (305 leaves): the duplication rule
reproduces its merkle_root 07dd5eb3eb0e5c9eae40f56ce859a064dff95f2eed47acad64fb54a1aa0122e2
and the carry-up rule does NOT. See README.md for the divergence this exposes inside our own
repo (scripts/measurement_root.py builds a different shape and says so in its docstring).
"""
import hashlib

# Copied verbatim from public/root.json so the bundle can restate the rule it followed.
NODE_DEFINITION = (
    "parent = sha256(left || right) over RAW 32-byte digests, pairwise, bottom-up. "
    "An odd node at any level is paired WITH ITSELF (Bitcoin-style duplication), not "
    "promoted. No domain-separation prefix."
)
RFC6962_DIVERGENCE = (
    "NOT RFC 6962: no 0x00 leaf / 0x01 node domain-separation prefix, and an odd node is "
    "duplicated rather than promoted. Leaf and interior hashes therefore share one domain. "
    "Not converted to RFC 6962 here, because that would change every root the estate has "
    "published. The leaf-count check below is the mitigation, and it is mandatory."
)
TREE_CAVEAT = (
    "Odd-node duplication makes this shape collidable in the sense of CVE-2012-2459: "
    "appending duplicates of the tail can yield a DIFFERENT leaf set with an IDENTICAL "
    "merkle_root ([A,B,C] and [A,B,C,C] is the minimal example). The ambiguity is closed "
    "ONLY by the declared leaf count. A verifier MUST reject any presentation where the "
    "number of leaves disagrees with n_samples, and MUST reject any inclusion proof with "
    "index >= n_samples. Checking merkle_root alone is NOT sufficient."
)


def _node(left_hex: str, right_hex: str) -> str:
    """parent = sha256(left || right) over RAW 32-byte digests. No prefix, no separator."""
    return hashlib.sha256(bytes.fromhex(left_hex) + bytes.fromhex(right_hex)).hexdigest()


def build_levels(leaves: list[str]) -> list[list[str]]:
    """Bottom-up levels, each level stored AFTER odd-node duplication.

    Storing the padded level is what lets proof_for() take the sibling as index ^ 1 with no
    special case: the duplicated tail is a real entry at its level, and its sibling is itself.
    """
    if not leaves:
        return []
    levels: list[list[str]] = []
    cur = list(leaves)
    while len(cur) > 1:
        if len(cur) % 2:
            cur = cur + [cur[-1]]          # duplicate the odd tail — NOT promote it
        levels.append(cur)
        cur = [_node(cur[i], cur[i + 1]) for i in range(0, len(cur), 2)]
    levels.append(cur)
    return levels


def merkle_root(leaves: list[str]) -> str:
    levels = build_levels(leaves)
    return levels[-1][0] if levels else ""


def proof_for(index: int, levels: list[list[str]]) -> list[dict]:
    """Sibling path for a leaf index. `side` records which operand the sibling is, so a
    verifier never has to guess the concatenation order."""
    path, idx = [], index
    for level in levels[:-1]:
        sib = idx ^ 1
        path.append({"side": "right" if idx % 2 == 0 else "left", "hash": level[sib]})
        idx //= 2
    return path


def verify_proof(leaf: str, path: list[dict], root: str) -> bool:
    h = leaf
    for step in path:
        h = _node(h, step["hash"]) if step["side"] == "right" else _node(step["hash"], h)
    return h == root

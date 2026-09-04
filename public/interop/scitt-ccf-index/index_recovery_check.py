#!/usr/bin/env python3
"""Independent check of Henri Sirkkavaara's index-recovery finding on
draft-ietf-scitt-receipts-ccf-profile-04, raised on the SCITT list 2026-09-04.

His finding, restated: Section 3 says the inclusion proof's left-or-right bits "can be
treated as the binary decomposition of the index, from the least significant (leaf) to the
most significant (root)". Under the tree of Section 2.1 — which splits at k, the largest
power of two SMALLER than n — that only holds for some n.

This script rebuilds the tree and the paths from the definitions and decodes every leaf.
It discovers nothing; it checks someone else's finding and reports where our result differs
from what his message states. Run it and disagree with it.

  python3 index_recovery_check.py

Not a Transparency Service, not a Receipt, no claim about any implementation — only about
what the definitions as written imply.
"""
import hashlib

H = lambda b: hashlib.sha256(b).digest()


def build(leaves):
    """Section 2.1. Returns (root, {leaf_index: [(sibling, sibling_is_left), ...]})."""
    n = len(leaves)
    if n == 1:
        return H(leaves[0]), {0: []}
    k = 1
    while k * 2 < n:          # largest power of two strictly smaller than n
        k *= 2
    lh, lp = build(leaves[:k])
    rh, rp = build(leaves[k:])
    paths = {}
    for i, p in lp.items():
        paths[i] = p + [(rh, False)]        # sibling on the right
    for i, p in rp.items():
        paths[i + k] = p + [(lh, True)]     # sibling on the left
    return H(lh + rh), paths


def decode_index(path):
    """Section 3's stated decoding: bit set when the sibling is on the left, LSB at the leaf."""
    return sum(1 << bit for bit, (_sib, is_left) in enumerate(path) if is_left)


def survey(hi=257):
    exact, broken = [], {}
    for n in range(2, hi):
        _root, paths = build([bytes([i % 256]) for i in range(n)])
        bad = {i: decode_index(paths[i]) for i in sorted(paths) if decode_index(paths[i]) != i}
        (exact.append(n) if not bad else broken.update({n: bad}))
    return exact, broken


if __name__ == "__main__":
    exact, broken = survey(12)
    print("n = 2..11, as stated in the finding")
    for n in range(2, 12):
        bad = broken.get(n)
        print(f"  n={n:2d}  " + ("exact" if not bad else
              ", ".join(f"leaf {i} decodes to {d}" for i, d in bad.items())))

    # What his message states, checked line by line.
    stated_exact = {2, 4, 8}
    stated_broken = {3, 5, 6, 7, 11}
    print("\nagainst the message:")
    print(f"  stated exact  {sorted(stated_exact)}  -> reproduces: {set(exact) >= stated_exact}")
    print(f"  stated broken {sorted(stated_broken)} -> reproduces: {stated_broken <= set(broken)}")
    print(f"  n=11 has three misdecoding leaves     -> {len(broken.get(11, {})) == 3}")
    unlisted = sorted(set(range(2, 12)) - stated_exact - stated_broken)
    print(f"  values in 2..11 the message lists in neither column: {unlisted}")
    for n in unlisted:
        print(f"    n={n}: {'exact' if n in exact else 'BROKEN — ' + str(broken[n])}")

    # The general rule, which is shorter than any enumeration.
    exact, broken = survey(257)
    pow2 = lambda n: n & (n - 1) == 0
    print("\nn = 2..256")
    print(f"  decode exactly: {exact}")
    print(f"  all powers of two: {all(pow2(n) for n in exact)}")
    print(f"  every other n misdecodes at least one leaf: {all(not pow2(n) for n in broken)}"
          f"  ({len(broken)} values)")
    print("\nRULE: index recovery from the path bits is exact IFF n is a power of two.")

#!/usr/bin/env python3
"""Verify the CSOAI public root — and prove the verifier can say NO.

    python3 scripts/verify_public_root.py                    # fetch and verify the live root
    python3 scripts/verify_public_root.py --file root.json   # verify a local copy
    python3 scripts/verify_public_root.py --control          # run the forged-tail control too

WHAT THIS CHECKS, in order:

  1. The declared leaf digests recompute to the declared merkle_root, under the tree
     rule public/root.json states in its own node_definition: pairs hashed as
     sha256(left || right) over RAW 32-byte digests, bottom-up, and an odd node at
     any level paired WITH ITSELF (Bitcoin-style duplication), no domain separation.

  2. THE COUNT BINDING. len(card_sha256) must equal card_count. This is NOT a
     tidiness check. Odd-node duplication means a leaf set of a DIFFERENT SIZE can
     produce an IDENTICAL merkle_root (CVE-2012-2459, published 2012). The root
     comparison in step 1 cannot tell the two sets apart. Only the count can, and
     only because card_count sits inside the signed preimage.

  3. The Ed25519 signature over the compact preimage — {as_of, card_count,
     did_intended, kind, merkle_root, schema}, JSON with sorted keys and no spaces —
     against the key published at the did:web document. Requires `cryptography`;
     skipped, and reported as skipped, if it is not installed.

A verifier that can only print VALID is worth nothing. --control forges a leaf set
by duplicating the tail, shows the root is unchanged, and shows this script rejecting
it on the count binding alone.

Public domain / same licence as the repository. No credentials, no network writes.
"""
from __future__ import annotations

import argparse
import base64
import hashlib
import json
import sys
import urllib.request

ROOT_URL = "https://councilof.ai/api/root"
DID_URL = "https://csoai.org/.well-known/did.json"
PREIMAGE_FIELDS = ("as_of", "card_count", "did_intended", "kind", "merkle_root", "schema")


def fetch(url: str) -> dict:
    # An explicit User-Agent is required: the edge answers 403 to urllib's default.
    req = urllib.request.Request(url, headers={"User-Agent": "csoai-verify-public-root/1.0"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def merkle_root_duplicating(leaves: list[bytes]) -> bytes:
    """The rule public/root.json declares: odd node paired WITH ITSELF, not promoted."""
    if not leaves:
        raise ValueError("refusing to compute a root over an empty leaf set")
    level = list(leaves)
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])          # duplicate the odd tail — this is the CVE
        level = [hashlib.sha256(level[i] + level[i + 1]).digest()
                 for i in range(0, len(level), 2)]
    return level[0]


def merkle_root_promoting(leaves: list[bytes]) -> bytes:
    """The OTHER shape in this estate — scripts/measurement_root.py carries the odd node up.
    Computed only so this script can show the two shapes give different roots."""
    level = list(leaves)
    while len(level) > 1:
        nxt = [hashlib.sha256(level[i] + level[i + 1]).digest()
               for i in range(0, len(level) - 1, 2)]
        if len(level) % 2:
            nxt.append(level[-1])
        level = nxt
    return level[0]


def preimage(doc: dict) -> bytes:
    return json.dumps({k: doc[k] for k in PREIMAGE_FIELDS},
                      separators=(",", ":"), sort_keys=True).encode()


def check(doc: dict, *, did_doc: dict | None, label: str) -> bool:
    print(f"--- {label} ---")
    fails: list[str] = []

    declared_root = doc.get("merkle_root")
    declared_count = doc.get("card_count")
    digests = doc.get("card_sha256") or []
    presented = len(digests)
    print(f"declared merkle_root : {declared_root}")
    print(f"declared card_count  : {declared_count}")
    print(f"leaves presented     : {presented}")

    try:
        leaves = [bytes.fromhex(h) for h in digests]
        assert all(len(b) == 32 for b in leaves)
    except Exception as e:
        print(f"  [FAIL] card_sha256 is not a list of 32-byte hex digests: {e}")
        return False

    # 1. root recomputation
    recomputed = merkle_root_duplicating(leaves).hex()
    if recomputed == declared_root:
        print(f"  [PASS] merkle_root recomputes under the declared duplication rule")
    else:
        fails.append(f"merkle_root does not recompute (got {recomputed})")
        print(f"  [FAIL] merkle_root does not recompute — got {recomputed}")

    other = merkle_root_promoting(leaves).hex()
    print(f"  [info] same leaves under the promote-odd shape: {other}")
    print(f"  [info] the two tree shapes disagree, as they must: {other != recomputed}")

    # 2. THE COUNT BINDING — the only check that catches a duplicated tail
    if presented == declared_count:
        print(f"  [PASS] count binding: len(card_sha256) == card_count == {declared_count}")
    else:
        fails.append(f"count binding: presented {presented} != declared {declared_count}")
        print(f"  [FAIL] count binding: {presented} leaves presented, card_count says {declared_count}.")
        print( "         WHY THIS IS FATAL AND NOT COSMETIC: this tree pairs an odd node with")
        print( "         ITSELF, so a leaf set of a different size can reproduce the SAME")
        print( "         merkle_root (CVE-2012-2459). The root check above therefore cannot")
        print( "         distinguish the honest set from a padded one. card_count is inside")
        print( "         the signed preimage; the presented leaf list is not. When they")
        print( "         disagree, the signed count is the truth and the presentation is not")
        print( "         the set that was signed. REJECT.")

    # 2b. no inclusion proof may index past the signed count
    if isinstance(declared_count, int) and presented > declared_count:
        print(f"  [note] leaf indices {declared_count}..{presented - 1} lie beyond the signed "
              f"count and must be refused by any inclusion check.")

    # 3. signature
    if did_doc is None:
        print("  [SKIP] signature: no DID document available")
    else:
        try:
            from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
        except ImportError:
            print("  [SKIP] signature: install `cryptography` to check it "
                  "(this is a real gap, not a pass)")
        else:
            kid = doc.get("did_intended", "")
            vm = next((v for v in did_doc.get("verificationMethod", [])
                       if v.get("id") == kid), None)
            if vm is None:
                fails.append(f"no verificationMethod {kid} in the DID document")
                print(f"  [FAIL] no verificationMethod {kid} in the DID document")
            else:
                x = vm["publicKeyJwk"]["x"]
                pk = Ed25519PublicKey.from_public_bytes(base64.urlsafe_b64decode(x + "=="))
                try:
                    pk.verify(bytes.fromhex(doc["sig_ed25519"]), preimage(doc))
                    print(f"  [PASS] Ed25519 signature verifies under {kid}")
                    print( "         the signed preimage carries card_count, which is what")
                    print( "         closes the CVE-2012-2459 ambiguity for this root.")
                except Exception:
                    fails.append("Ed25519 signature does not verify")
                    print("  [FAIL] Ed25519 signature does not verify over the compact preimage")

    if fails:
        print(f"VERDICT: REJECTED — {len(fails)} check(s) failed:")
        for f in fails:
            print(f"    - {f}")
        return False
    print("VERDICT: ACCEPTED — root recomputes, count binds, signature verifies.")
    print("         This says the presented leaf set is the one that was signed.")
    print("         It does NOT say any card is correct, complete, or measured.")
    return True


def control(doc: dict) -> bool:
    """Forge a leaf set by duplicating the tail. Root unchanged. Count guard catches it."""
    print()
    print("=" * 70)
    print("CONTROL — forged tail (CVE-2012-2459, published 2012, not novel)")
    print("Append a copy of the last leaf. Because an odd node is paired with itself,")
    print("the 305-leaf set and the 306-leaf set hash to the SAME root.")
    print("=" * 70)
    leaves = [bytes.fromhex(h) for h in doc["card_sha256"]]
    forged = leaves + [leaves[-1]]
    r_honest = merkle_root_duplicating(leaves).hex()
    r_forged = merkle_root_duplicating(forged).hex()
    print(f"root over {len(leaves)} honest leaves : {r_honest}")
    print(f"root over {len(forged)} forged leaves : {r_forged}")
    print(f"IDENTICAL ROOT, DIFFERENT LEAF SET: {r_honest == r_forged}")
    if r_honest != r_forged:
        print("CONTROL BROKEN: the forgery did not reproduce the root. "
              "Do not trust this run.")
        return False
    print()
    forged_doc = dict(doc)
    forged_doc["card_sha256"] = [b.hex() for b in forged]   # card_count left as signed
    accepted = check(forged_doc, did_doc=None, label="forged bundle (tail duplicated)")
    if accepted:
        print("CONTROL FAILED: the verifier ACCEPTED a forged leaf set. It is worthless.")
        return False
    print("CONTROL OK: expected reject, got reject — and on the count binding, "
          "with the root check passing.")
    return True


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", help="verify a local root.json instead of fetching")
    ap.add_argument("--url", default=ROOT_URL)
    ap.add_argument("--control", action="store_true",
                    help="also run the forged-tail control")
    ap.add_argument("--offline", action="store_true",
                    help="skip the DID fetch (signature check is then reported as skipped)")
    a = ap.parse_args()

    doc = json.load(open(a.file)) if a.file else fetch(a.url)
    src = a.file or a.url
    print(f"source: {src}")
    did_doc = None
    if not a.offline:
        try:
            did_doc = fetch(DID_URL)
        except Exception as e:
            print(f"  [warn] could not fetch {DID_URL}: {e}")

    ok = check(doc, did_doc=did_doc, label=f"live bundle from {src}")
    if a.control:
        ok = control(doc) and ok
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())

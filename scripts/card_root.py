#!/usr/bin/env python3
"""Anchor every SIGNED GSPC measurement card with ONE Merkle commitment.

THE GAP THIS CLOSES. The board says measured, signed, anchored. The first two were
true and the third was not: on 2026-09-03 there were 208 signed measurement cards in
public/interop/mill-cards-signed/ and not one of them appeared in any Merkle root.
atom-root covers the badger atom queue and the public root covers notice/RWA leaves;
neither has ever had a measurement card as a leaf, and no adapter could add one —
staged_leaves.py rejects any atom that already carries a signature or says MEASURED,
which every one of these does, by design and correctly. Measurement cards therefore
need their own commitment rather than a hole punched in the notice surface.

WHY ONE ROOT, NOT 208 STAMPS. Same reasoning as atom-root.py: a stamp per card is
thousands of submissions to volunteer calendars, hours of wall time, and 208 proof
files to carry forever, to commit information that is one hash. Commit once, prove
each card by inclusion.

WHAT A LEAF COMMITS TO. sha256 over the canonical form of the WHOLE card — body,
id, signature, did, and every other field — not the body alone. A leaf over the
payload only would let the signature or the key reference be swapped without the
root noticing, which is the defect public-root v1 (06df8395) fixed for its own
leaves. The card's own `id` is deliberately NOT the leaf: `id` commits to the body
only, so a root built from ids would inherit exactly that weakness.

A STAMP IS NOT AN ANCHOR. Building this root anchors nothing on its own. The root
is stamped only with --stamp, the result carries the measured attestation state
rather than the word "anchored", and it reads `pending` until a calendar commits it
to a Bitcoin block and the proof is upgraded. Anything else would repeat the
"700+ OTS-anchored" claim this estate has already had to retract.

Superseded cards are excluded via SUPERSEDED.jsonl so a re-signed cell is committed
once, under its live card.

The leaf digest and the tree are IMPORTED from publish_public_root.py, never
re-implemented, so a card's inclusion proof is checkable by the same code that
checks an atom's or a notice's. Re-typing a Merkle tree is how two roots drift.

    python3 scripts/card_root.py             # build the root
    python3 scripts/card_root.py --stamp     # build and submit to OTS calendars
    python3 scripts/card_root.py --verify    # re-check the published root, no network
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent

_spec = importlib.util.spec_from_file_location(
    "publish_public_root", REPO / "scripts" / "publish_public_root.py"
)
_ppr = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_ppr)
merkle_root, merkle_proof, sha256_hex = _ppr.merkle_root, _ppr.merkle_proof, _ppr.sha256_hex

SIGNED = REPO / "public" / "interop" / "mill-cards-signed"
OUT = REPO / "public" / "interop"


def canonical(obj) -> bytes:
    """The estate's canonical form: sorted keys, no whitespace, ensure_ascii=False.

    Matches scripts/sign_financial_runs.py canonical_bytes, so a leaf recomputed
    here is byte-identical to what the signer would produce.
    """
    def rec(v):
        if isinstance(v, list):
            return [rec(x) for x in v]
        if isinstance(v, dict):
            return {k: rec(v[k]) for k in sorted(v)}
        return v
    return json.dumps(rec(obj), separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def superseded_ids() -> set[str]:
    ledger = SIGNED / "SUPERSEDED.jsonl"
    dead: set[str] = set()
    if ledger.is_file():
        for line in ledger.read_text(encoding="utf-8", errors="replace").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                dead.add(str(json.loads(line).get("superseded_id") or ""))
            except Exception:
                continue
    dead.discard("")
    return dead


def collect() -> tuple[list[dict], list[dict]]:
    """(leaves, skipped). A card missing a signature is skipped, never committed."""
    dead = superseded_ids()
    leaves: list[dict] = []
    skipped: list[dict] = []
    seen: set[str] = set()
    for fp in sorted(SIGNED.glob("signed-*.json")):
        try:
            card = json.loads(fp.read_text(encoding="utf-8"))
        except Exception as e:
            skipped.append({"file": fp.name, "why": f"unreadable: {e.__class__.__name__}"})
            continue
        if not isinstance(card, dict) or not isinstance(card.get("body"), dict):
            skipped.append({"file": fp.name, "why": "not a measurement card"})
            continue
        if not card.get("signature"):
            skipped.append({"file": fp.name, "why": "unsigned — a root must not imply a signature"})
            continue
        cid = str(card.get("id") or "")
        if cid in dead:
            skipped.append({"file": fp.name, "why": "superseded"})
            continue
        digest = sha256_hex(canonical(card))
        if digest in seen:
            skipped.append({"file": fp.name, "why": "duplicate of an identical card"})
            continue
        seen.add(digest)
        body = card["body"]
        leaves.append({
            "leaf": digest,
            "card": fp.name,
            "id": cid,
            "model": body.get("model"),
            "axis": body.get("axis"),
            "did": card.get("did"),
        })
    leaves.sort(key=lambda l: l["leaf"])
    # The index is published because merkle_proof returns siblings with NO side bit:
    # the combining rule is positional, sha256(left + right), so a verifier must know
    # the leaf's index to know which side each sibling goes on. Without it a stranger
    # holding a correct proof cannot reach the root, which I hit while hand-checking
    # this file and mis-walked it as sorted-pair hashing.
    for i, l in enumerate(leaves):
        l["index"] = i
    return leaves, skipped


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--verify", action="store_true", help="re-check the published root, no network")
    ap.add_argument("--stamp", action="store_true", help="submit the root to OTS calendars")
    args = ap.parse_args()

    stamp_day = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    root_path = OUT / f"card-root-{stamp_day}.json"
    ots_path = OUT / f"card-root-{stamp_day}.json.ots"

    if args.verify:
        if not root_path.exists():
            print(f"no card root at {root_path}")
            return 1
        body = json.loads(root_path.read_text(encoding="utf-8"))
        leaves = [l["leaf"] for l in body["leaves"]]
        recomputed = merkle_root(leaves)
        ok = recomputed == body["merkle_root"]
        print(f"leaves      : {len(leaves)}")
        print(f"merkle_root : {body['merkle_root']}")
        print(f"recomputed  : {recomputed}  {'MATCH' if ok else 'MISMATCH'}")
        # Every leaf must still be reproducible from the card file on disk, or the
        # root is committing to bytes that no longer exist.
        drift = []
        for l in body["leaves"]:
            fp = SIGNED / l["card"]
            if not fp.is_file():
                drift.append((l["card"], "missing"))
                continue
            if sha256_hex(canonical(json.loads(fp.read_text(encoding="utf-8")))) != l["leaf"]:
                drift.append((l["card"], "bytes changed since the root was built"))
        print(f"leaf drift  : {len(drift)}")
        for name, why in drift[:10]:
            print(f"   {name}: {why}")
        try:
            sys.path.insert(0, str(HERE / "badger"))
            from ots_stamp import attestation_state, describe  # noqa: E402
            st = attestation_state(ots_path.read_bytes() if ots_path.exists() else None)
            print(f"ots         : {describe(st)}")
        except Exception as e:
            print(f"ots         : UNCHECKED ({e.__class__.__name__})")
        return 0 if (ok and not drift) else 1

    leaves, skipped = collect()
    if not leaves:
        print("no signed cards to commit", file=sys.stderr)
        return 1
    root = merkle_root([l["leaf"] for l in leaves])
    doc = {
        "kind": "csoai.card-root/1",
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "n_leaves": len(leaves),
        "merkle_root": root,
        "leaf_rule": (
            "sha256 over canonical JSON (sorted keys, no whitespace, ensure_ascii=False) of the "
            "WHOLE signed card — body, id, signature and did — not the body alone. Tree and proof "
            "are publish_public_root.merkle_root / merkle_proof, imported not re-implemented."
        ),
        "anchor_rule": (
            "This document is a commitment, not an anchor. It becomes anchored only when an "
            "OpenTimestamps proof over these bytes is upgraded into a Bitcoin block; until then "
            "the stamp is a pending request. Read the state from the .ots sidecar, never from "
            "the existence of this file."
        ),
        "proof_rule": (
            "merkle_proof returns sibling digests only, with no side bit, and the tree combines "
            "positionally as sha256(left + right). To verify: start from the leaf, and at each "
            "step fold sha256(current + sibling) when the running index is even, sha256(sibling "
            "+ current) when it is odd, halving the index each step. The leaf's `index` is "
            "published for exactly this reason."
        ),
        "not_a_certificate": True,
        "n_skipped": len(skipped),
        "skipped": skipped[:50],
        "leaves": leaves,
    }
    root_path.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"leaves      : {len(leaves)}  (skipped {len(skipped)})")
    print(f"merkle_root : {root}")
    print(f"written     : {root_path.relative_to(REPO)}")

    if args.stamp:
        sys.path.insert(0, str(HERE / "badger"))
        from ots_stamp import submit_ots  # noqa: E402
        proof = submit_ots(root_path.read_bytes())
        if proof:
            ots_path.write_bytes(proof)
            print(f"stamped     : {ots_path.relative_to(REPO)} (PENDING — a stamp is not an anchor)")
        else:
            print("stamp       : FAILED — root written, nothing anchored")
    return 0


if __name__ == "__main__":
    sys.exit(main())

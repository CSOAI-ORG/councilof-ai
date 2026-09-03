#!/usr/bin/env python3
"""Anchor the WHOLE atom queue with ONE timestamp: Merkle root + inclusion proofs.

WHY NOT 16,809 STAMPS. The obvious reading of "stamp and anchor all the atoms" is
one .ots per atom. That is the wrong shape, for four reasons:

  1. It would send ~50,000 submissions (16,809 atoms x 3 calendars) to free public
     infrastructure run by volunteers. That is abuse, and it gets you rate-limited
     or blocked, which anchors nothing.
  2. It takes hours of wall time and must be repeated for every new atom.
  3. It leaves 16,809 proof files to store, upgrade and verify forever, when the
     information content is one commitment.
  4. It still would not make anything "anchored". A stamp is a request; Bitcoin
     commits on its own schedule. Volume cannot buy that.

OpenTimestamps is built for exactly this: commit once to a Merkle root, prove each
member by inclusion. One stamp covers every atom, and when that root's proof
upgrades to a Bitcoin block, every atom in the tree is anchored through it — with
a proof any stranger can check offline.

The leaf digest and Merkle construction are IMPORTED from publish_public_root.py
rather than re-implemented, so an atom's inclusion proof is checkable with the same
code that checks a card's. Re-typing the tree is how two roots drift apart.

    python3 scripts/badger/atom-root.py            # build + stamp
    python3 scripts/badger/atom-root.py --verify   # re-check without network
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
sys.path.insert(0, str(HERE))
from ots_stamp import attestation_state, describe, submit_ots  # noqa: E402

# publish_public_root.py has a hyphen-free name but lives outside the package path.
_spec = importlib.util.spec_from_file_location(
    "publish_public_root", REPO / "scripts" / "publish_public_root.py"
)
_ppr = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_ppr)
merkle_root, merkle_proof, sha256_hex = _ppr.merkle_root, _ppr.merkle_proof, _ppr.sha256_hex

QUEUE = HERE / "_queue"
OUT = REPO / "public" / "interop"


def canonical(obj) -> bytes:
    def rec(v):
        if isinstance(v, list):
            return [rec(x) for x in v]
        if isinstance(v, dict):
            return {k: rec(v[k]) for k in sorted(v.keys())}
        return v
    return json.dumps(rec(obj), separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def collect() -> list[tuple[str, str]]:
    """(leaf_digest, source) for every atom, deduplicated, in stable order."""
    seen, leaves = set(), []
    for jsonl in sorted(QUEUE.rglob("*.jsonl")):
        for line in jsonl.read_text(errors="replace").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                atom = json.loads(line)
            except Exception:
                continue
            if not isinstance(atom, dict):
                continue
            d = sha256_hex(canonical(atom))
            if d in seen:
                continue
            seen.add(d)
            leaves.append((d, str(jsonl.relative_to(QUEUE))))
    leaves.sort()
    return leaves


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--verify", action="store_true", help="re-check the published root, no network")
    args = ap.parse_args()

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    root_path = OUT / f"atom-root-{stamp}.json"
    ots_path = OUT / f"atom-root-{stamp}.json.ots"

    # NEVER overwrite an anchored proof. The queue grows all day, so re-rooting is
    # normal — but the previous root's .ots may already carry a Bitcoin attestation,
    # and those bytes are evidence. Writing a fresh pending stamp over them destroys
    # a proof that cost hours of calendar time to earn. (It happened once: a root
    # anchored at block 965299 covering 42,118 atoms was clobbered by a re-root
    # minutes later.) An anchored root is superseded, never edited: it keeps its
    # name and the new one takes the next suffix.
    if not args.verify and ots_path.exists():
        prior = attestation_state(ots_path.read_bytes())
        if prior["state"] == "bitcoin":
            n = 2
            while (OUT / f"atom-root-{stamp}-{n}.json.ots").exists():
                n += 1
            root_path = OUT / f"atom-root-{stamp}-{n}.json"
            ots_path = OUT / f"atom-root-{stamp}-{n}.json.ots"
            print(f"  prior root is ANCHORED at block {prior['block_height']} — superseding,")
            print(f"  not overwriting. New root -> {root_path.name}")

    if args.verify:
        if not root_path.exists():
            print(f"no root at {root_path}")
            return 1
        body = json.loads(root_path.read_text())
        leaves = [l["leaf"] for l in body["leaves"]]
        recomputed = merkle_root(leaves)
        ok = recomputed == body["merkle_root"]
        print(f"leaves      : {len(leaves)}")
        print(f"merkle_root : {body['merkle_root']}")
        print(f"recomputed  : {recomputed}  {'MATCH' if ok else 'MISMATCH'}")
        st = attestation_state(ots_path.read_bytes() if ots_path.exists() else None)
        print(f"ots         : {describe(st)}")
        return 0 if ok else 1

    leaves = collect()
    if not leaves:
        print("no atoms found")
        return 1
    hexes = [d for d, _ in leaves]
    root = merkle_root(hexes)

    body = {
        "kind": "csoai.atom-root",
        "version": 1,
        "as_of": datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z"),
        "n_leaves": len(hexes),
        "merkle_root": root,
        "leaf_rule": (
            "sha256 over canonical JSON (sorted keys, no whitespace, ensure_ascii=False) "
            "of the whole atom. Tree and proof are publish_public_root.merkle_root / "
            "merkle_proof, imported not re-implemented."
        ),
        "anchor_rule": (
            "ONE OpenTimestamps stamp commits this root. Each atom is anchored through "
            "its inclusion proof, not through a stamp of its own. Until the .ots carries "
            "a Bitcoin block attestation this root is STAMPED, not ANCHORED."
        ),
        "leaves": [{"leaf": d, "source": s} for d, s in leaves],
    }
    root_path.parent.mkdir(parents=True, exist_ok=True)
    root_path.write_text(json.dumps(body, indent=2, ensure_ascii=False) + "\n")

    digest = sha256_hex(canonical({k: v for k, v in body.items() if k != "leaves"}))
    print(f"atoms      : {len(hexes)}")
    print(f"merkle_root: {root}")
    print(f"root digest: {digest}")
    print("stamping ONE proof for all of them...")
    data = submit_ots(digest)
    if not data:
        print("  no calendar answered — no .ots written (an unverifiable proof is worse than none)")
        return 1
    ots_path.write_bytes(data)
    st = attestation_state(data)
    print(f"  wrote {ots_path.relative_to(REPO)}")
    print(f"  {describe(st)}")
    print(f"\n{len(hexes)} atoms are now covered by one commitment.")
    print("They become ANCHORED when scripts/ots-upgrade.py turns that stamp into a block.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

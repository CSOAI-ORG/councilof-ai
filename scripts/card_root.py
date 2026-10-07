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
import hashlib
import json
import re
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


def superseded_ids(signed_dir: Path = SIGNED) -> set[str]:
    ledger = signed_dir / "SUPERSEDED.jsonl"
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


def collect(signed_dir: Path = SIGNED) -> tuple[list[dict], list[dict]]:
    """(leaves, skipped). A card missing a signature is skipped, never committed."""
    dead = superseded_ids(signed_dir)
    leaves: list[dict] = []
    skipped: list[dict] = []
    seen: set[str] = set()
    for fp in sorted(signed_dir.glob("signed-*.json")):
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


def _root_paths(out_dir: Path, stamp_day: str, root: str) -> tuple[Path, Path]:
    """Choose a create-only path without displacing an earlier same-day root.

    The first commitment of a UTC day keeps the historical filename. If that
    filename already commits the same current set, reuse its exact bytes. If it
    commits a different set, use a Merkle-root suffix. A suffix collision is an
    error, never an invitation to overwrite evidence.
    """
    legacy = out_dir / f"card-root-{stamp_day}.json"
    if not legacy.exists():
        path = legacy
    else:
        try:
            existing = json.loads(legacy.read_text(encoding="utf-8"))
        except Exception as exc:
            raise ValueError(f"existing same-day root is unreadable: {exc.__class__.__name__}")
        if existing.get("kind") == "csoai.card-root/1" and existing.get("merkle_root") == root:
            path = legacy
        else:
            path = out_dir / f"card-root-{stamp_day}-{root[:12]}.json"
    return path, path.with_suffix(path.suffix + ".ots")


def _validate_existing_root(path: Path, root: str, leaves: list[dict]) -> None:
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise ValueError(f"existing root is unreadable: {exc.__class__.__name__}")
    if (
        doc.get("kind") != "csoai.card-root/1"
        or doc.get("merkle_root") != root
        or doc.get("n_leaves") != len(leaves)
        or doc.get("leaves") != leaves
    ):
        raise ValueError("existing root path contains a different commitment")


def write_discovery_pointer(root_path: Path, ots_path: Path, out_dir: Path) -> Path:
    """Point visitors at the most recently built immutable mill-card root.

    This is an unsigned discovery aid, never a root, signature, or Bitcoin
    attestation. The hourly mill already stages ``public/interop/card-root-*``;
    keeping the pointer under that pattern makes it land with the root bytes.
    """
    doc = json.loads(root_path.read_text(encoding="utf-8"))
    if doc.get("kind") != "csoai.card-root/1":
        raise ValueError("discovery pointer source is not a card root")
    if root_path.parent != out_dir or ots_path.parent != out_dir:
        raise ValueError("discovery pointer source is outside output directory")
    if not root_path.name.startswith("card-root-") or not root_path.name.endswith(".json"):
        raise ValueError("discovery pointer source name is not a card root")
    body = {
        "schema": "csoai.card-root-pointer/1",
        "kind": "DISCOVERY_POINTER_ONLY",
        "as_of": doc["as_of"],
        "root_url": f"/interop/{root_path.name}",
        "root_sha256": hashlib.sha256(root_path.read_bytes()).hexdigest(),
        "n_leaves": doc["n_leaves"],
        "ots_url": f"/interop/{ots_path.name}" if ots_path.is_file() else None,
        "scope": (
            "This unsigned pointer selects immutable mill-card root bytes. Its count is separate "
            "from /signed/card_index.json, /root.json and /api/gspc. Read the OTS sidecar's "
            "verified state; its existence is not proof of a Bitcoin anchor."
        ),
    }
    path = out_dir / "card-root-latest.json"
    encoded = (json.dumps(body, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    if path.exists() and path.read_bytes() == encoded:
        return path
    temp = path.with_name(path.name + ".tmp")
    if temp.exists():
        raise ValueError("discovery pointer temporary path already exists")
    with temp.open("xb") as handle:
        handle.write(encoded)
    temp.replace(path)
    return path


POINTER_ROW = " M public/interop/card-root-latest.json"
_PUBLISHED_ROOT = re.compile(r"public/interop/card-root-[0-9]{4}-[0-9]{2}-[0-9]{2}(?:-[a-f0-9]{12})?\.json\Z")


def publish_rows(rows: list[str]) -> dict:
    """Decide what a ``--stamp`` build may publish, from ``git status --porcelain -- public/interop/card-root-*``.

    Evidence is create-only: the new root and its proof must be untracked files ("?? "), and no
    existing root or proof may change. The one exception is the discovery pointer
    card-root-latest.json. It is tracked, and build() moves it to every new root, so it shows as
    " M". card-root.yml treated that row as an edit to evidence and refused every build from
    6 Oct 2026, which froze the mill-card root at 2026-10-01. The pointer is unsigned and names a
    root; it is allowed to move only together with exactly one new root/proof pair.

    Returns {"changed": False} when nothing moved, otherwise the new root, its proof and whether
    the pointer moved. Anything else raises ValueError.
    """
    if not rows:
        return {"changed": False}
    pointer = POINTER_ROW in rows
    others = [row for row in rows if row != POINTER_ROW]
    if any(not row.startswith("?? ") for row in others):
        raise ValueError(f"refusing to modify an existing card root or OTS proof: {rows}")
    names = sorted(row[3:] for row in others)
    roots = [name for name in names if name.endswith(".json")]
    proofs = [name for name in names if name.endswith(".json.ots")]
    if len(roots) != 1 or proofs != [roots[0] + ".ots"] or len(names) != 2:
        raise ValueError(f"expected one new exact root/proof pair, got {names} (pointer moved: {pointer})")
    if not _PUBLISHED_ROOT.fullmatch(roots[0]):
        raise ValueError(f"unexpected root path: {roots[0]}")
    return {"changed": True, "root": roots[0], "proof": proofs[0], "pointer": pointer}


def build(*, stamp: bool = False, now: datetime | None = None,
          signed_dir: Path = SIGNED, out_dir: Path = OUT, submitter=None) -> dict:
    """Build one current commitment and optionally create its OTS sidecar.

    Existing root and proof files are never written. This function returns the
    observed proof state so workflow copy can remain precise and honest.
    """
    now = now or datetime.now(timezone.utc)
    leaves, skipped = collect(signed_dir)
    if not leaves:
        raise ValueError("no signed cards to commit")
    root = merkle_root([leaf["leaf"] for leaf in leaves])
    root_path, ots_path = _root_paths(out_dir, now.strftime("%Y-%m-%d"), root)
    created_root = False
    if root_path.exists():
        _validate_existing_root(root_path, root, leaves)
    else:
        doc = {
            "kind": "csoai.card-root/1",
            "as_of": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "n_leaves": len(leaves),
            "merkle_root": root,
            "leaf_rule": (
                "sha256 over canonical JSON (sorted keys, no whitespace, ensure_ascii=False) of the "
                "WHOLE signed card — body, id, signature and did — not the body alone. Tree and proof "
                "are publish_public_root.merkle_root / merkle_proof, imported not re-implemented."
            ),
            "anchor_rule": (
                "Commitment only. Read the measured state from the .ots sidecar, never from file "
                "existence. STAMPED_PENDING_BITCOIN means a calendar receipt only. "
                "BITCOIN_ATTESTATION_UNVERIFIED means a block-attestation tag is present but this "
                "workflow has performed no Bitcoin-chain validation and reports no confirmation. "
                "Independent verification against a trusted Bitcoin node is required."
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
        out_dir.mkdir(parents=True, exist_ok=True)
        encoded = (json.dumps(doc, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
        # xb is load-bearing: a concurrent run cannot replace evidence selected
        # between the existence check and the write.
        with root_path.open("xb") as handle:
            handle.write(encoded)
        created_root = True

    proof_state = {"state": "absent"}
    if ots_path.exists():
        if ots_path.is_symlink() or not ots_path.is_file():
            raise ValueError("existing OTS sidecar must be a regular non-symlink file")
        sys.path.insert(0, str(HERE / "badger"))
        from ots_stamp import attestation_state  # noqa: E402
        from maintain_card_ots import parse  # noqa: E402
        raw = ots_path.read_bytes()
        parse(raw, hashlib.sha256(root_path.read_bytes()).hexdigest())
        proof_state = attestation_state(raw)
        if proof_state.get("state") not in {"pending", "bitcoin"}:
            raise ValueError("existing OTS sidecar has no recognized attestation")
    elif stamp:
        if submitter is None:
            sys.path.insert(0, str(HERE / "badger"))
            from ots_stamp import submit_ots as submitter  # noqa: E402
        proof = submitter(hashlib.sha256(root_path.read_bytes()).hexdigest())
        if not proof:
            raise RuntimeError("OTS calendars returned no readable proof")
        from maintain_card_ots import parse, proof_state as exact_proof_state  # noqa: E402
        parse(proof, hashlib.sha256(root_path.read_bytes()).hexdigest())
        with ots_path.open("xb") as handle:
            handle.write(proof)
        exact = exact_proof_state(parse(proof, hashlib.sha256(root_path.read_bytes()).hexdigest()))
        proof_state = {"state": "pending" if exact["state"] == "STAMPED_PENDING_BITCOIN" else "bitcoin"}

    # The immutable root and any sidecar are checked above. A mutable discovery
    # pointer can now move to these exact bytes without changing evidence.
    pointer_path = write_discovery_pointer(root_path, ots_path, out_dir)

    return {
        "root_path": root_path,
        "ots_path": ots_path,
        "created_root": created_root,
        "merkle_root": root,
        "n_leaves": len(leaves),
        "n_skipped": len(skipped),
        "subject_sha256": hashlib.sha256(root_path.read_bytes()).hexdigest(),
        "proof_state": proof_state,
        "pointer_path": pointer_path,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--verify", action="store_true", help="re-check the published root, no network")
    ap.add_argument("--stamp", action="store_true", help="submit the root to OTS calendars")
    ap.add_argument("--root", type=Path, help="exact root to verify (defaults to today's current set)")
    # Directory overrides exist for the pod chain's determinism test (tests/pod_chain), which
    # runs land → sign → root twice in temp dirs and compares roots. Defaults are the repo.
    ap.add_argument("--signed-dir", type=Path, default=SIGNED, help="signed cards to commit (default public/interop/mill-cards-signed)")
    ap.add_argument("--out-dir", type=Path, default=OUT, help="where card-root-*.json lands (default public/interop)")
    args = ap.parse_args()
    signed_dir, out_dir = args.signed_dir, args.out_dir

    if args.verify:
        if args.root:
            root_path = args.root
        else:
            leaves, _ = collect(signed_dir)
            if not leaves:
                print("no signed cards to verify", file=sys.stderr)
                return 1
            current = merkle_root([leaf["leaf"] for leaf in leaves])
            root_path, _ = _root_paths(out_dir, datetime.now(timezone.utc).strftime("%Y-%m-%d"), current)
        ots_path = root_path.with_suffix(root_path.suffix + ".ots")
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
            fp = signed_dir / l["card"]
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
    try:
        result = build(stamp=args.stamp, signed_dir=signed_dir, out_dir=out_dir)
    except Exception as exc:
        print(f"FAILED CLOSED: {exc}", file=sys.stderr)
        return 1

    def shown(p: Path) -> Path:
        return p.relative_to(REPO) if p.is_relative_to(REPO) else p

    print(f"leaves      : {result['n_leaves']}  (skipped {result['n_skipped']})")
    print(f"merkle_root : {result['merkle_root']}")
    print(f"subject_sha : {result['subject_sha256']}")
    action = "written" if result["created_root"] else "preserved"
    print(f"{action:12}: {shown(result['root_path'])}")
    if args.stamp:
        state = result["proof_state"].get("state", "absent")
        label = "PENDING — not anchored" if state == "pending" else "BITCOIN ATTESTATION UNVERIFIED"
        print(f"proof       : {shown(result['ots_path'])} ({label})")
    return 0


if __name__ == "__main__":
    sys.exit(main())

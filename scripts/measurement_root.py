#!/usr/bin/env python3
"""A Merkle root over today's UNSIGNED measurement artifacts, and inclusion proofs for each.

What this is, exactly. Hashing needs no key, so a set of artifacts can be committed to a single
root and that root anchored in Bitcoin via OpenTimestamps, with no signature anywhere. Inclusion
in this root proves that these exact bytes were in this set when the root was stamped. That is
all it proves.

What this is NOT, and the distinction matters.
  - It is NOT the signed public root (public/root.json) and it is NOT the signed-card root that
    scripts/card_root.py builds. Those commit to SIGNED artifacts, and card_root.py deliberately
    skips any card without a signature because its leaf covers the signature.
  - Nothing here is signed. There is no Ed25519 signature over this root, so a reader cannot tell
    from the root alone WHO committed to it — only that the bytes existed by the anchored time.
  - It therefore cannot be witnessed in Rekor the way the public root is: that witness uploads the
    preimage, the signature and the board public key, and there is no signature to upload.

Leaf = sha256 of the file's exact bytes. Pairs are hashed in order; an odd node is carried up
unchanged (no duplication), and the rule is recorded in the artifact so a stranger can recompute.
"""
import hashlib, json, sys, time, pathlib

REPO = pathlib.Path(".")


def sha256(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()


def merkle(leaves: list[str]) -> tuple[str, list[list[str]]]:
    """Returns (root, levels). Odd node carried up unchanged — never duplicated."""
    if not leaves:
        return "", []
    levels = [list(leaves)]
    cur = list(leaves)
    while len(cur) > 1:
        nxt = []
        for i in range(0, len(cur) - 1, 2):
            nxt.append(sha256(bytes.fromhex(cur[i]) + bytes.fromhex(cur[i + 1])))
        if len(cur) % 2:
            nxt.append(cur[-1])
        levels.append(nxt)
        cur = nxt
    return cur[0], levels


def proof_for(index: int, levels: list[list[str]]) -> list[dict]:
    """Sibling path for a leaf index, with the side recorded so a verifier need not guess."""
    path, idx = [], index
    for lvl in levels[:-1]:
        if idx % 2 == 0:
            sib = idx + 1
            if sib < len(lvl):
                path.append({"side": "right", "hash": lvl[sib]})
        else:
            path.append({"side": "left", "hash": lvl[idx - 1]})
        idx //= 2
    return path


def verify(leaf: str, path: list[dict], root: str) -> bool:
    h = leaf
    for step in path:
        if step["side"] == "right":
            h = sha256(bytes.fromhex(h) + bytes.fromhex(step["hash"]))
        else:
            h = sha256(bytes.fromhex(step["hash"]) + bytes.fromhex(h))
    return h == root


def main() -> int:
    out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "public/interop/measurement-root.json"
    paths = sys.argv[sys.argv.index("--files") + 1:] if "--files" in sys.argv else []
    files = sorted({p for p in paths if pathlib.Path(p).is_file()})
    if not files:
        print("no readable files given; refusing to publish a root over nothing"); return 1

    entries = []
    for p in files:
        b = pathlib.Path(p).read_bytes()
        entries.append({"path": p, "bytes": len(b), "leaf_sha256": sha256(b)})
    entries.sort(key=lambda e: e["leaf_sha256"])          # deterministic order, independent of the shell
    leaves = [e["leaf_sha256"] for e in entries]
    root, levels = merkle(leaves)

    ok = 0
    for i, e in enumerate(entries):
        e["inclusion_proof"] = proof_for(i, levels)
        e["proof_verifies"] = verify(e["leaf_sha256"], e["inclusion_proof"], root)
        ok += bool(e["proof_verifies"])
    if ok != len(entries):
        print(f"REFUSED: only {ok}/{len(entries)} inclusion proofs verify against the root"); return 2

    doc = {
        "schema": "csoai.measurement-root/0.1", "kind": "merkle-root-unsigned",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "merkle_root": root, "n_leaves": len(leaves),
        "leaf_rule": "sha256 of the file's exact bytes",
        "tree_rule": ("leaves sorted by their own hash; pairs hashed in order as sha256(left||right) "
                      "over raw 32-byte digests; an odd node is carried up unchanged and never duplicated"),
        "all_inclusion_proofs_verify": ok == len(entries),
        "signed": False,
        "signature_state": "UNSIGNED — no Ed25519 signature exists over this root",
        "rekor_state": ("NOT_WITNESSED — the public-root witness uploads the preimage, its signature and "
                        "the board public key; with no signature there is nothing to upload. Signing the "
                        "root with any other key we hold would misrepresent who attested it."),
        "what_inclusion_proves": ("that these exact bytes were in this set when the root was stamped, and "
                                  "nothing else: not that a measurement is correct, not who produced it, "
                                  "and not that the set is complete"),
        "not_the_public_root": ("public/root.json and the card roots commit to SIGNED artifacts. This root "
                                "is a separate, unsigned commitment over deterministic-facts artifacts."),
        "entries": entries,
    }
    pathlib.Path(out).write_text(json.dumps(doc, indent=2) + "\n")
    print(f"root {root[:24]}…  leaves {len(leaves)}  proofs verify {ok}/{len(entries)} -> {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Build/check the separate Claim Maintenance priority Merkle root.

This root binds immutable priority snapshots only. It is deliberately NOT the public
card root and does not inherit card-root signing or measurement semantics.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SNAPDIR = ROOT / "public/spec/claim-maintenance/priority-snapshots"
OUT = ROOT / "public/spec/claim-maintenance/priority-root.json"

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())

def leaf_hash(path: str, digest_hex: str) -> str:
    return sha256_bytes(b"\x00" + path.encode("utf-8") + b"\x00" + bytes.fromhex(digest_hex))

def parent_hash(left_hex: str, right_hex: str) -> str:
    return sha256_bytes(b"\x01" + bytes.fromhex(left_hex) + bytes.fromhex(right_hex))

def merkle_root(hashes: list[str]) -> str | None:
    if not hashes:
        return None
    level = list(hashes)
    while len(level) > 1:
        work = level + [level[-1]] if len(level) % 2 else level
        level = [parent_hash(work[i], work[i + 1]) for i in range(0, len(work), 2)]
    return level[0]

def inclusion_path(hashes: list[str], index: int) -> list[dict]:
    if index < 0 or index >= len(hashes):
        raise IndexError(index)
    proof = []
    level = list(hashes)
    i = index
    while len(level) > 1:
        work = level + [level[-1]] if len(level) % 2 else level
        sibling_i = i - 1 if i % 2 else i + 1
        proof.append({
            "side": "left" if sibling_i < i else "right",
            "sha256": work[sibling_i],
        })
        level = [parent_hash(work[j], work[j + 1]) for j in range(0, len(work), 2)]
        i //= 2
    return proof

def verify_inclusion(leaf_hex: str, proof: list[dict], root_hex: str) -> bool:
    cur = leaf_hex
    for step in proof:
        side, sibling = step["side"], step["sha256"]
        if side == "left":
            cur = parent_hash(sibling, cur)
        elif side == "right":
            cur = parent_hash(cur, sibling)
        else:
            return False
    return cur == root_hex

def snapshot_rows() -> list[dict]:
    rows = []
    for p in sorted(SNAPDIR.glob("*.json")):
        if p.name == "index.json":
            continue
        doc = json.loads(p.read_text())
        pe = doc.get("priority_evidence", {})
        rel = "/" + str(p.relative_to(ROOT / "public")).replace("\\", "/")
        digest = sha256_file(p)
        rows.append({
            "path": rel,
            "sha256": digest,
            "bytes": p.stat().st_size,
            "leaf_hash": leaf_hash(rel, digest),
            "market_signal_count": pe.get("market_signal_snapshot", {}).get("signal_count"),
            "reaction_sha256": pe.get("reaction_index", {}).get("sha256"),
            "full_stack_collision_count": pe.get("reaction_index", {}).get("full_stack_collision_count"),
            "max_single_signal_overlap_fraction": pe.get("reaction_index", {}).get("max_single_signal_overlap_fraction"),
        })
    return rows

def build() -> dict:
    leaves = snapshot_rows()
    hashes = [x["leaf_hash"] for x in leaves]
    root = merkle_root(hashes)
    for i, row in enumerate(leaves):
        row["inclusion_proof"] = inclusion_path(hashes, i)
        row["inclusion_verified"] = bool(root and verify_inclusion(row["leaf_hash"], row["inclusion_proof"], root))
    return {
        "schema": "csoai.claim-maintenance-priority-root/0.1",
        "category": "Claim Maintenance",
        "domain": "category-contribution-priority",
        "leaf_count": len(leaves),
        "leaf_rule": "leaf = SHA256(0x00 || UTF8(public_path) || 0x00 || snapshot_sha256_bytes); leaves sorted lexicographically by public_path",
        "parent_rule": "parent = SHA256(0x01 || left_hash_bytes || right_hash_bytes); duplicate the final hash at an odd-width level",
        "merkle_root": root,
        "proof_rule": "Start from leaf_hash. For each inclusion_proof step, if side=left compute parent(sibling,current); if side=right compute parent(current,sibling). Final hash must equal merkle_root.",
        "leaves": leaves,
        "witness": "/spec/claim-maintenance/priority-root-witness.json",
        "separate_from": {
            "public_card_root": "/root.json",
            "reason": "The public card root has a different declared leaf rule and measurement-card population. Priority artifacts are never silently inserted into that domain."
        },
        "not_evidence_of": [
            "trademark ownership",
            "exclusive rights in the words Claim Maintenance",
            "certification",
            "endorsement",
            "measurement correctness",
            "board admission"
        ],
    }

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    rendered = json.dumps(build(), indent=2, sort_keys=True) + "\n"
    if args.check:
        if not OUT.exists() or OUT.read_text() != rendered:
            print("FAIL claim-maintenance priority-root drift")
            return 1
        doc = json.loads(rendered)
        if not all(row.get("inclusion_verified") for row in doc.get("leaves", [])):
            print("FAIL priority-root inclusion proof")
            return 1
        if doc.get("leaves"):
            row = doc["leaves"][0]
            mutated = ("0" if row["leaf_hash"][0] != "0" else "1") + row["leaf_hash"][1:]
            if verify_inclusion(mutated, row["inclusion_proof"], doc["merkle_root"]):
                print("FAIL priority-root mutation selftest")
                return 1
        print("PASS priority-root", f"leaves={doc['leaf_count']}", f"root={doc['merkle_root']}", "proofs=verified")
        return 0
    OUT.write_text(rendered)
    doc = json.loads(rendered)
    print("wrote", OUT.relative_to(ROOT), f"leaves={doc['leaf_count']}", f"root={doc['merkle_root']}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

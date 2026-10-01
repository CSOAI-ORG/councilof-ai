#!/usr/bin/env python3
"""Build/check Claim Maintenance contribution-priority evidence.

This records publication artifacts and a separate Merkle root. It is evidence of
CSOAI's publication history and implementation scope, not a legal ownership,
trademark, certification, ranking, or public-card-root claim.
"""
from __future__ import annotations
import argparse, hashlib, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "public/spec/claim-maintenance"
OUT = BASE / "priority.json"
ROOT_OUT = BASE / "priority-root.json"

LEAVES = [
    "v0.1/claim-maintenance-v0.1.md",
    "v0.1/schema/claim-artifact-v0.1.schema.json",
    "v0.1/reference/claim-capture.mjs",
    "v0.2/claim-maintenance-v0.2.md",
    "v0.2/schema/claim-artifact-v0.2.schema.json",
    "v0.2/reference/claim-capture.mjs",
]

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())

def leaf_hash(path: str, digest_hex: str) -> str:
    return sha256_bytes(b"\x00" + path.encode() + b"\x00" + bytes.fromhex(digest_hex))

def parent_hash(left: str, right: str) -> str:
    return sha256_bytes(b"\x01" + bytes.fromhex(left) + bytes.fromhex(right))

def merkle_root(hashes: list[str]) -> str | None:
    if not hashes:
        return None
    level = list(hashes)
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        level = [parent_hash(level[i], level[i + 1]) for i in range(0, len(level), 2)]
    return level[0]

def inclusion_path(hashes: list[str], index: int) -> list[dict]:
    proof, level, i = [], list(hashes), index
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        sibling = i - 1 if i % 2 else i + 1
        proof.append({"side": "left" if sibling < i else "right", "sha256": level[sibling]})
        level = [parent_hash(level[j], level[j + 1]) for j in range(0, len(level), 2)]
        i //= 2
    return proof

def verify_inclusion(leaf: str, proof: list[dict], root: str) -> bool:
    cur = leaf
    for step in proof:
        if step["side"] == "left":
            cur = parent_hash(step["sha256"], cur)
        elif step["side"] == "right":
            cur = parent_hash(cur, step["sha256"])
        else:
            return False
    return cur == root

def build() -> tuple[dict, dict]:
    idx = json.loads((BASE / "index.json").read_text())
    expected = {v["version"]: v["document_sha256"] for v in idx["versions"]}
    for version in ("0.1", "0.2"):
        actual = sha256_file(BASE / f"v{version}/claim-maintenance-v{version}.md")
        if actual != expected[version]:
            raise ValueError(f"spec digest drift v{version}: {actual} != {expected[version]}")

    rows = []
    for rel in LEAVES:
        p = BASE / rel
        digest = sha256_file(p)
        public_path = "/spec/claim-maintenance/" + rel
        rows.append({
            "path": public_path,
            "sha256": digest,
            "bytes": p.stat().st_size,
            "leaf_hash": leaf_hash(public_path, digest),
        })
    hashes = [r["leaf_hash"] for r in rows]
    root = merkle_root(hashes)
    for i, row in enumerate(rows):
        row["inclusion_proof"] = inclusion_path(hashes, i)
        row["inclusion_verified"] = verify_inclusion(row["leaf_hash"], row["inclusion_proof"], root)

    root_doc = {
        "schema": "csoai.claim-maintenance-priority-root/0.2",
        "category": "Claim Maintenance",
        "domain": "category-contribution-priority",
        "leaf_count": len(rows),
        "merkle_root": root,
        "leaf_rule": "SHA256(0x00 || UTF8(public_path) || 0x00 || artifact_sha256_bytes)",
        "parent_rule": "SHA256(0x01 || left_hash_bytes || right_hash_bytes); duplicate odd final node",
        "leaves": rows,
        "separate_from": {
            "public_card_root": "/root.json",
            "meaning": "This root binds Claim Maintenance publication artifacts only; it is not the GSPC public-card root.",
        },
        "signature": {"state": "NOT_BOARD_SIGNED"},
        "timestamp": {"state": "NOT_SUBMITTED"},
    }
    priority = {
        "schema": "csoai.claim-maintenance-priority/0.2",
        "category": "Claim Maintenance",
        "claim_boundary": "Publication/contribution history and implementation scope only; no legal ownership, trademark, equivalence, endorsement, certification, score, or rank is asserted.",
        "versions": idx["versions"],
        "current_spec": "/spec/claim-maintenance/v0.2/",
        "register": "/spec/claim-maintenance/register.json",
        "claim_events": "/api/claims/events",
        "claim_events_head": "/api/claims/events/head",
        "corrections": "/api/corrections",
        "reaction_index": "/spec/claim-maintenance/reaction-index.json",
        "priority_root": {
            "path": "/spec/claim-maintenance/priority-root.json",
            "merkle_root": root,
            "leaf_count": len(rows),
            "state": "UNSIGNED_UNTIMESTAMPED_SEPARATE_DOMAIN",
        },
        "maintenance_rule": "Immutable version bytes are never rewritten; current operational state is carried by append-only events, supersession, and corrections.",
    }
    return priority, root_doc

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()
    priority, root_doc = build()
    rendered_priority = json.dumps(priority, indent=2, sort_keys=True) + "\n"
    rendered_root = json.dumps(root_doc, indent=2, sort_keys=True) + "\n"
    if args.check:
        ok = OUT.exists() and ROOT_OUT.exists()
        ok = ok and OUT.read_text() == rendered_priority and ROOT_OUT.read_text() == rendered_root
        if not ok:
            print("FAIL claim-maintenance priority drift")
            return 1
        print(f"PASS claim-maintenance priority leaves={root_doc['leaf_count']} root={root_doc['merkle_root']}")
        return 0
    OUT.write_text(rendered_priority)
    ROOT_OUT.write_text(rendered_root)
    print(f"wrote {OUT.relative_to(ROOT)} and {ROOT_OUT.relative_to(ROOT)}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

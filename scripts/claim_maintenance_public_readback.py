#!/usr/bin/env python3
"""Read-only production acceptance gate for Claim Maintenance public surfaces.

This verifies what the public apex actually serves. It never upgrades OTS pending
state to Bitcoin anchoring and never treats the priority root as the GSPC card root.
"""
from __future__ import annotations
import argparse, hashlib, json, sys, urllib.request, urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
UA = "CSOAI-Claim-Maintenance-readback/1 (+https://councilof.ai/claim-maintenance/)"

STATIC = [
    "/spec/claim-maintenance/priority.json",
    "/spec/claim-maintenance/priority-root.json",
    "/spec/claim-maintenance/priority-root-witness.json",
    "/spec/claim-maintenance/reaction-index.json",
    "/spec/claim-maintenance/priority-snapshots/index.json",
]
API = [
    "/api/claims/events",
    "/api/claims/events/head",
    "/api/corrections",
]
def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def fetch(url: str, timeout: int = 25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Cache-Control": "no-cache", "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.geturl(), dict(r.headers.items()), r.read()

def parent_hash(left_hex: str, right_hex: str) -> str:
    return sha256(b"\x01" + bytes.fromhex(left_hex) + bytes.fromhex(right_hex))

def verify_inclusion(leaf_hex: str, proof: list[dict], root_hex: str) -> bool:
    cur = leaf_hex
    for step in proof:
        side, sibling = step.get("side"), step.get("sha256")
        if not isinstance(sibling, str):
            return False
        if side == "left":
            cur = parent_hash(sibling, cur)
        elif side == "right":
            cur = parent_hash(cur, sibling)
        else:
            return False
    return cur == root_hex

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--origin", default="https://councilof.ai")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        root = json.loads((PUBLIC / "spec/claim-maintenance/priority-root.json").read_text())
        leaves = root.get("leaves", [])
        if not leaves or not all(verify_inclusion(r["leaf_hash"], r.get("inclusion_proof", []), root["merkle_root"]) for r in leaves):
            print('{"state":"FAIL","selftest":"valid inclusion proof rejected"}')
            return 1
        leaf = leaves[0]["leaf_hash"]
        mutated = ("0" if leaf[0] != "0" else "1") + leaf[1:]
        if verify_inclusion(mutated, leaves[0].get("inclusion_proof", []), root["merkle_root"]):
            print('{"state":"FAIL","selftest":"mutated inclusion proof accepted"}')
            return 1
        witness = json.loads((PUBLIC / "spec/claim-maintenance/priority-root-witness.json").read_text())
        if witness.get("card_root_relationship", {}).get("state") != "SEPARATE_DOMAIN":
            print('{"state":"FAIL","selftest":"card-root separation missing"}')
            return 1
        print('{"state":"PASS","selftest":"inclusion proofs + mutation negative control + root-domain separation"}')
        return 0
    origin = args.origin.rstrip("/")
    errors, checks = [], []
    bodies: dict[str, bytes] = {}

    paths = ["/claim-maintenance/"] + STATIC + API
    for path in paths:
        url = origin + path
        try:
            st, final, hdr, body = fetch(url)
        except urllib.error.HTTPError as exc:
            errors.append(f"{path}:http:{exc.code}")
            checks.append({"path": path, "status": exc.code})
            continue
        except Exception as exc:
            errors.append(f"{path}:fetch:{type(exc).__name__}:{exc}")
            checks.append({"path": path, "status": "ERROR"})
            continue
        checks.append({"path": path, "status": st, "bytes": len(body), "sha256": sha256(body), "content_type": hdr.get("Content-Type", "")})
        if st != 200:
            errors.append(f"{path}:http:{st}")
            continue
        if final.rstrip("/") != url.rstrip("/"):
            errors.append(f"{path}:redirect:{final}")
        bodies[path] = body

    # Exact static byte parity with the release candidate.
    for path in STATIC:
        body = bodies.get(path)
        if body is None:
            continue
        local = (PUBLIC / path.lstrip("/")).read_bytes()
        if body != local:
            errors.append(f"{path}:byte-drift:live={sha256(body)}:local={sha256(local)}")

    # Human page only has to remain a real live Claim Maintenance surface.
    page = bodies.get("/claim-maintenance/")
    if page is not None and len(page) < 8000:
        errors.append("/claim-maintenance/:thin")

    root_body = bodies.get("/spec/claim-maintenance/priority-root.json")
    witness_body = bodies.get("/spec/claim-maintenance/priority-root-witness.json")
    if root_body:
        try:
            root = json.loads(root_body)
            root_hex = root.get("merkle_root")
            leaves = root.get("leaves", [])
            if root.get("domain") != "category-contribution-priority":
                errors.append("priority-root:wrong-domain")
            if root.get("separate_from", {}).get("public_card_root") != "/root.json":
                errors.append("priority-root:card-root-boundary-missing")
            if root.get("leaf_count") != len(leaves):
                errors.append("priority-root:leaf-count")
            for row in leaves:
                if not row.get("inclusion_verified"):
                    errors.append(f"priority-root:source-proof-not-verified:{row.get('path')}")
                if not verify_inclusion(row.get("leaf_hash", ""), row.get("inclusion_proof", []), root_hex):
                    errors.append(f"priority-root:inclusion-failed:{row.get('path')}")
            # Negative control.
            if leaves:
                leaf = leaves[0]["leaf_hash"]
                mutated = ("0" if leaf[0] != "0" else "1") + leaf[1:]
                if verify_inclusion(mutated, leaves[0].get("inclusion_proof", []), root_hex):
                    errors.append("priority-root:mutation-negative-control-failed")
        except Exception as exc:
            errors.append(f"priority-root:parse:{type(exc).__name__}:{exc}")

    if witness_body:
        try:
            witness = json.loads(witness_body)
            ts = witness.get("timestamp", {})
            if not ts.get("proof_binds_to_target"):
                errors.append("priority-witness:ots-not-bound")
            if ts.get("state") not in {"STAMPED_PENDING_BITCOIN", "BITCOIN_ATTESTATION_PRESENT_UNVERIFIED_CHAIN", "CONFIRMED_BITCOIN", "BITCOIN"}:
                errors.append(f"priority-witness:unexpected-ots-state:{ts.get('state')}")
            if witness.get("signature", {}).get("state") != "NOT_BOARD_SIGNED":
                errors.append("priority-witness:signature-boundary-drift")
            if witness.get("card_root_relationship", {}).get("state") != "SEPARATE_DOMAIN":
                errors.append("priority-witness:card-root-boundary-drift")
        except Exception as exc:
            errors.append(f"priority-witness:parse:{type(exc).__name__}:{exc}")

    out = {
        "schema": "csoai.claim-maintenance-public-readback/1.0",
        "origin": origin,
        "state": "PASS" if not errors else "HOLD",
        "checks": checks,
        "errors": errors,
    }
    print(json.dumps(out, indent=2, sort_keys=True))
    return 0 if not errors else 1

if __name__ == "__main__":
    raise SystemExit(main())

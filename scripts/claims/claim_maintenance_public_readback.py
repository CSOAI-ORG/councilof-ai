#!/usr/bin/env python3
"""Read-only production acceptance gate for Claim Maintenance machine records."""
from __future__ import annotations
import argparse, hashlib, json, urllib.error, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
UA = "CSOAI-Claim-Maintenance-readback/2 (+https://councilof.ai/claim-maintenance/)"

STATIC = [
    "/spec/claim-maintenance/index.json",
    "/spec/claim-maintenance/priority.json",
    "/spec/claim-maintenance/priority-root.json",
    "/spec/claim-maintenance/reaction-index.json",
]
API = ["/api/claims/events", "/api/claims/events/head", "/api/corrections"]

def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def fetch(url: str, timeout: int = 25):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Cache-Control": "no-cache", "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.geturl(), dict(r.headers.items()), r.read()

def parent_hash(left: str, right: str) -> str:
    return sha256(b"\x01" + bytes.fromhex(left) + bytes.fromhex(right))

def verify_inclusion(leaf: str, proof: list[dict], root: str) -> bool:
    cur = leaf
    for step in proof:
        if step.get("side") == "left":
            cur = parent_hash(step["sha256"], cur)
        elif step.get("side") == "right":
            cur = parent_hash(cur, step["sha256"])
        else:
            return False
    return cur == root

def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--origin", default="https://councilof.ai")
    args = ap.parse_args()
    origin = args.origin.rstrip("/")
    errors, checks, bodies = [], [], {}

    for path in ["/claim-maintenance/"] + STATIC + API:
        try:
            st, final, headers, body = fetch(origin + path)
            checks.append({"path": path, "status": st, "bytes": len(body), "sha256": sha256(body)})
            if st != 200:
                errors.append(f"{path}:http:{st}")
            elif final.rstrip("/") != (origin + path).rstrip("/"):
                errors.append(f"{path}:redirect:{final}")
            else:
                bodies[path] = body
        except urllib.error.HTTPError as exc:
            errors.append(f"{path}:http:{exc.code}")
        except Exception as exc:
            errors.append(f"{path}:fetch:{type(exc).__name__}:{exc}")

    for path in STATIC:
        if path in bodies:
            local = (PUBLIC / path.lstrip("/")).read_bytes()
            if bodies[path] != local:
                errors.append(f"{path}:byte-drift:live={sha256(bodies[path])}:local={sha256(local)}")

    page = bodies.get("/claim-maintenance/")
    if page is not None and len(page) < 8000:
        errors.append("/claim-maintenance/:thin")

    root_body = bodies.get("/spec/claim-maintenance/priority-root.json")
    if root_body:
        try:
            root = json.loads(root_body)
            if root.get("domain") != "category-contribution-priority":
                errors.append("priority-root:wrong-domain")
            if root.get("separate_from", {}).get("public_card_root") != "/root.json":
                errors.append("priority-root:card-root-boundary")
            leaves = root.get("leaves", [])
            if root.get("leaf_count") != len(leaves):
                errors.append("priority-root:leaf-count")
            for row in leaves:
                if not row.get("inclusion_verified"):
                    errors.append(f"priority-root:source-proof:{row.get('path')}")
                if not verify_inclusion(row["leaf_hash"], row.get("inclusion_proof", []), root["merkle_root"]):
                    errors.append(f"priority-root:proof:{row.get('path')}")
        except Exception as exc:
            errors.append(f"priority-root:parse:{type(exc).__name__}:{exc}")

    reaction_body = bodies.get("/spec/claim-maintenance/reaction-index.json")
    feed_body = bodies.get("/api/claims/events")
    head_body = bodies.get("/api/claims/events/head")
    if reaction_body and feed_body:
        try:
            reaction = json.loads(reaction_body)
            expected = reaction["source"]["feed_bytes_sha256"]
            if sha256(feed_body) != expected:
                errors.append("reaction:live-feed-hash-drift")
        except Exception as exc:
            errors.append(f"reaction:parse:{type(exc).__name__}:{exc}")

    if reaction_body and head_body:
        try:
            reaction = json.loads(reaction_body)
            wrapper = json.loads(head_body)
            live_head = wrapper.get("head", wrapper)
            if live_head.get("feed", {}).get("bytes_sha256") != reaction["source"]["feed_bytes_sha256"]:
                errors.append("reaction:live-head-hash-drift")
        except Exception as exc:
            errors.append(f"head:parse:{type(exc).__name__}:{exc}")

    corrections = bodies.get("/api/corrections")
    if corrections:
        try:
            doc = json.loads(corrections)
            if doc.get("schema") != "csoai.corrections/0.1":
                errors.append("corrections:schema")
        except Exception as exc:
            errors.append(f"corrections:parse:{type(exc).__name__}:{exc}")

    out = {
        "schema": "csoai.claim-maintenance-public-readback/2.0",
        "origin": origin,
        "state": "PASS" if not errors else "HOLD",
        "checks": checks,
        "errors": errors,
    }
    print(json.dumps(out, indent=2, sort_keys=True))
    return 0 if not errors else 1

if __name__ == "__main__":
    raise SystemExit(main())

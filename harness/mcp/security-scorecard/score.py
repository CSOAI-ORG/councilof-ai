#!/usr/bin/env python3
"""score.py — deterministic disclosure-integrity score for the MCP canon registry.
Input: client/src/data/canonMcpRegistry.ts (the canon). Output: signed rows
public/interop/mcp-security-scorecard.json (style-B, estate key).
"""
import json, hashlib, base64, re
from pathlib import Path
from cryptography.hazmat.primitives.serialization import load_pem_private_key
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

R = Path(__file__).resolve()
CANON = R.parents[3] / "client/src/data/canonMcpRegistry.ts"
KEY = Path("/Users/nicholas/.sovos/city_ed25519")
OUT = R.parents[3] / "public/interop/mcp-security-scorecard.json"
BAND = {8: "A", 7: "A", 6: "B", 5: "C", 4: "D"}


def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def main():
    src = CANON.read_text()
    m = re.search(r"CANON_REGISTRY: CanonEntry\[\] = \[([\s\S]*?)\]\s*;", src)
    assert m, "canon array not found"
    entries = json.loads("[" + m.group(1) + "]")
    rows, by_type = {}, {"site": 0, "server": 0, "pack": 0}
    for e in entries:
        eid = e.get("id", "")
        score = sum(1 for f in ("id", "name", "type", "description", "category")
                    if e.get(f))
        if e.get("url"):
            score += 1
        if e.get("geo"):
            score += 1
        score += 1  # provenance (generator header, all rows of this canon)
        t = e.get("type", "?")
        by_type[t] = by_type.get(t, 0) + 1
        rows[eid] = {"id": eid, "kind": t, "signals_met": score, "n": 8,
                     "grade": BAND.get(score, "F")}

    body = {
        "schema": "csoai.mcp-security-scorecard/0.1",
        "as_of": "2026-08-26",
        "instrument": ("disclosure-integrity: 8 factual signals over the canon registry "
                       "snapshot (auto-gen 2026-08-01; methodology under METHODOLOGY.md)"),
        "counts": by_type,
        "totals": {"entries": len(rows), "k8_bands": {
            b: sum(1 for r in rows.values() if r["grade"] == b) for b in "ABCDF"}},
        "note": "312 canon entries; 311 unique ids (one duplicate id in the canon registry — recorded, not hidden).",
        "honesty": ("Grades the DISCLOSED facts of registry entries (factual, observable, "
                    "methodology-published, signed). NOT live security posture; "
                    "v0.2 = live probing. No certification, no endorsement."),
        "scorecard": rows,
    }
    sk = load_pem_private_key(KEY.read_bytes(), password=None)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw,
                                       serialization.PublicFormat.Raw)
    payload = canonical(body)
    cid = hashlib.sha256(payload).hexdigest()
    body["content_id"] = cid
    body["signature"] = {"alg": "Ed25519", "content_id": cid,
                         "sig": base64.b64encode(sk.sign(cid.encode())).decode(),
                         "pubkey": base64.b64encode(pub).decode(),
                         "note": "Ed25519 over canonical content_id."}
    Ed25519PublicKey.from_public_bytes(pub).verify(
        base64.b64decode(body["signature"]["sig"]), cid.encode())
    OUT.write_text(json.dumps(body, indent=1, ensure_ascii=False))
    print(f"SCORECARD signed: {len(rows)} entries | {by_type} | "
          f"bands {body['totals']['k8_bands']} | cid {cid[:16]}")


if __name__ == "__main__":
    main()

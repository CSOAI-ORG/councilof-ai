#!/usr/bin/env python3
"""verify_dataset.py — verify the signed GSPC axis dataset.

A licensee does NOT trust CSOAI's word. This recomputes the canonical body, derives
`content_id`, and verifies the Ed25519 signature against the PUBKEY recorded in the manifest.

    python3 verify_dataset.py dataset.json            # verify the manifest bundle
    python3 verify_dataset.py --sig dataset.sig       # verify the detached signature

Canonical form (estate KEY-CONTINUITY rule 3):
    canonical  = json.dumps(body, sort_keys=True, separators=(",",":"), ensure_ascii=False)
    content_id = sha256(canonical)
    sig        = Ed25519(content_id bytes)

The signed body EXCLUDES the integrity fields (content_id, signature, sha256, sig), so the
canonical form is stable.
"""
import base64, hashlib, json, sys
from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey

def canonical(body):
    return json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()

def check(manifest):
    content_id = manifest.get("content_id")
    sig = manifest.get("signature")
    if not content_id or not sig:
        return {"verified": False, "reason": "missing content_id or signature"}
    body = {k: v for k, v in manifest.items() if k not in ("content_id", "signature", "sha256", "sig")}
    want = hashlib.sha256(canonical(body)).hexdigest()
    if want != content_id:
        return {"verified": False, "reason": "content_id mismatch: recomputed %s != stated %s" % (want[:16], content_id[:16])}
    pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(sig["pubkey"]))
    try:
        pub.verify(base64.b64decode(sig["sig"]), content_id.encode())
    except InvalidSignature:
        return {"verified": False, "reason": "Ed25519 signature does not verify with recorded pubkey"}
    return {
        "verified": True,
        "content_id": content_id,
        "pubkey": sig["pubkey"],
        "not_a_certification": manifest.get("not_a_certification"),
        "records": manifest.get("stats", {}).get("records"),
        "doctrine": manifest.get("doctrine"),
        "note": "signed measurement data; never a ranking of vendors, never a certification.",
    }

def check_detached(s):
    """Verify a detached signature record: Ed25519 content_id == sig using the recorded pubkey.
    A detached sig carries no body, so we verify the signature against the stated content_id."""
    cid = s.get("content_id")
    sig = s.get("sig")
    pub_b64 = s.get("pubkey")
    if not cid or not sig or not pub_b64:
        return {"verified": False, "reason": "detached sig missing content_id/sig/pubkey"}
    pub = Ed25519PublicKey.from_public_bytes(base64.b64decode(pub_b64))
    try:
        pub.verify(base64.b64decode(sig), cid.encode())
    except InvalidSignature:
        return {"verified": False, "reason": "Ed25519 signature does not verify with recorded pubkey"}
    return {"verified": True, "content_id": cid, "pubkey": pub_b64,
            "note": "detached signature over stated content_id verified."}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    if sys.argv[1] == "--sig":
        r = check_detached(json.load(open(sys.argv[2])))
        r["mode"] = "detached"
    else:
        r = check(json.load(open(sys.argv[1])))
        r["mode"] = "bundle"
    print(json.dumps(r, indent=2))
    sys.exit(0 if r.get("verified") else 1)

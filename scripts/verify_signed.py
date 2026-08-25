#!/usr/bin/env python3
"""verify_signed.py — portable stranger-verifiable signature checker (MOVES #61-62).

One tool, both estate signature styles, zero trust, zero network:
  style A (living board):  {"signature": hex, "signer": hex-pub, "sig_input": ...}
                            canonical = board minus signature/signer/signed/sig_input
  style B (signals/cards): {"content_id": sha256hex, "signature": {"sig": b64,
                            "pubkey": b64, "content_id": ...}}
                            canonical = json.dumps(body sans content_id/signature,
                            sort_keys, compact) -> sha256 == content_id -> Ed25519

Usage: python3 verify_signed.py <artifact.json>
Exit 0 = signature VALID (content matches bytes on disk); 1 = INVALID/unknown style.
"""
import base64, hashlib, json, sys
from pathlib import Path
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives import serialization

SIG_FIELDS = ("signature", "signer", "signed", "sig_input")


def canonical(obj, compact=False):
    if compact:  # style B (signals/cards): emit_signals canonical
        return json.dumps(obj, sort_keys=True, separators=(",", ":"),
                          ensure_ascii=False).encode()
    # style A (living board): sign_board canonical — default separators + ensure_ascii=True
    return json.dumps(obj, sort_keys=True).encode()


def verify_style_a(d):
    key = Ed25519PublicKey.from_public_bytes(bytes.fromhex(d["signer"]))
    body = {k: v for k, v in d.items() if k not in SIG_FIELDS}
    digest = hashlib.sha256(canonical(body)).digest()
    key.verify(bytes.fromhex(d["signature"]), digest)
    return "style-A (living board): Ed25519 over sha256(canonical minus signature fields)"


def verify_style_b(d):
    sig = d["signature"]
    key = Ed25519PublicKey.from_public_bytes(base64.b64decode(sig["pubkey"]))
    body = {k: v for k, v in d.items() if k not in ("content_id", "signature")}
    cid = hashlib.sha256(canonical(body, compact=True)).hexdigest()
    assert cid == d["content_id"], "content_id mismatch (canonical changed!)"
    key.verify(base64.b64decode(sig["sig"]), cid.encode())
    return "style-B (signal/card): Ed25519 over canonical content_id"


def main():
    if len(sys.argv) != 2:
        print(__doc__); return 1
    d = json.loads(Path(sys.argv[1]).read_text())
    if isinstance(d.get("signature"), str) and "signer" in d:
        note = verify_style_a(d)
    elif isinstance(d.get("signature"), dict) and "pubkey" in d["signature"]:
        note = verify_style_b(d)
    else:
        print("UNKNOWN SIGNATURE STYLE"); return 1
    print(f"VALID — {note}\n  signer: {d.get('signer','')[:16] or base64.b64encode(base64.b64decode(d['signature']['pubkey']))[:16]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

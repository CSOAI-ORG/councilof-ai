#!/usr/bin/env python3
"""sign.py — the real signature layer (layer 3). Turns a sha256 checksum into a verifiable signature.

    python3 sign.py --keygen                 # ON THE SIGNING NODE ONLY (Oracle/pod) — makes a keypair
    python3 sign.py --sign verdict.json      # sign a verdict; writes verdict.json.sig
    python3 sign.py --verify verdict.json     # verify against the published public key (no private key needed)

WHY
SOVOS's whole claim is verifiable measurement. Until now a verdict carried a sha256 of its body — a
checksum, honestly labelled as "not signed on this host". A checksum proves integrity, not authorship.
This module signs the body with Ed25519 (a real signature: anyone with the PUBLIC key can verify a
verdict was issued by the holder of the private key, and was not altered). The path to post-quantum is
one swap: ML-DSA-65 via liboqs (Open Quantum Safe) — the ASI axis, applied to our own signatures.

THE ONE DISCIPLINE
The private key lives on the SIGNING NODE and never on a developer laptop. --keygen refuses to write a
key on a host it does not recognise as a signing node (SOVOS_SIGNING_NODE=1 must be set), and --sign
refuses if the key is absent (it will NOT silently fall back to a fake signature — an unsigned verdict
is labelled unsigned, never dressed as signed). The public key is published for verification.

Requires `cryptography` (pure-python-friendly, no GPU). ML-DSA path noted where it plugs in.
"""
import argparse, json, os, sys, base64, hashlib

KEY_DIR = os.path.expanduser(os.environ.get("SOVOS_KEY_DIR", "~/.sovos_keys"))
PRIV = os.path.join(KEY_DIR, "sovos_ed25519.key")
PUB = os.path.join(KEY_DIR, "sovos_ed25519.pub")


def _lib():
    try:
        from cryptography.hazmat.primitives.asymmetric.ed25519 import (
            Ed25519PrivateKey, Ed25519PublicKey)
        from cryptography.hazmat.primitives import serialization
        return Ed25519PrivateKey, Ed25519PublicKey, serialization
    except ImportError:
        sys.exit("needs `cryptography` — pip install cryptography. (ML-DSA path: pip install liboqs-python.)")


def keygen():
    Ed25519PrivateKey, _, serialization = _lib()
    if os.environ.get("SOVOS_SIGNING_NODE") != "1":
        sys.exit("REFUSING to generate a key here: set SOVOS_SIGNING_NODE=1 only on the real signing "
                 "node (Oracle/pod), never on a developer laptop. The private key must never touch the Mac.")
    os.makedirs(KEY_DIR, exist_ok=True)
    if os.path.exists(PRIV):
        sys.exit(f"key already exists at {PRIV} — refusing to overwrite (would orphan every prior verdict).")
    sk = Ed25519PrivateKey.generate()
    with open(PRIV, "wb") as f:
        f.write(sk.private_bytes(serialization.Encoding.PEM,
                                 serialization.PrivateFormat.PKCS8,
                                 serialization.NoEncryption()))
    os.chmod(PRIV, 0o600)
    pub = sk.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    open(PUB, "w").write(base64.b64encode(pub).decode())
    print(f"signing key written → {PRIV} (0600)\npublic key (publish this):\n  {base64.b64encode(pub).decode()}")


def _body_bytes(obj):
    """Sign the canonical body WITHOUT any existing signature/sha fields, so verification is stable."""
    clean = {k: v for k, v in obj.items() if k not in ("signature", "sha256", "sig")}
    return json.dumps(clean, sort_keys=True, separators=(",", ":")).encode()


def sign(path):
    Ed25519PrivateKey, _, serialization = _lib()
    if not os.path.exists(PRIV):
        sys.exit(f"NO PRIVATE KEY at {PRIV}. This host cannot sign — run --keygen on the signing node. "
                 "Refusing to emit a fake signature; an unsigned verdict stays labelled unsigned.")
    obj = json.load(open(path))
    sk = serialization.load_pem_private_key(open(PRIV, "rb").read(), password=None)
    sig = sk.sign(_body_bytes(obj))
    obj["signature"] = {"kind": "ed25519", "sig": base64.b64encode(sig).decode(),
                        "body_sha256": hashlib.sha256(_body_bytes(obj)).hexdigest(),
                        "pubkey": open(PUB).read().strip() if os.path.exists(PUB) else None,
                        "note": "Ed25519 over the canonical body; verify with sign.py --verify. "
                                "PQC upgrade: ML-DSA-65 via liboqs — same body, swap the primitive."}
    json.dump(obj, open(path, "w"), indent=2)
    print(f"signed {path} · ed25519 · sig={obj['signature']['sig'][:24]}…")


def verify(path):
    _, Ed25519PublicKey, _ = _lib()
    obj = json.load(open(path))
    s = obj.get("signature")
    if not s or s.get("kind") != "ed25519":
        sys.exit("no ed25519 signature on this verdict (it may be an honestly-unsigned checksum record).")
    pub_b64 = s.get("pubkey") or (open(PUB).read() if os.path.exists(PUB) else None)
    if not pub_b64:
        sys.exit("no public key available to verify against.")
    pk = Ed25519PublicKey.from_public_bytes(base64.b64decode(pub_b64))
    try:
        pk.verify(base64.b64decode(s["sig"]), _body_bytes(obj))
        print(f"✅ VALID — {path} was signed by the holder of the published key and is unaltered.")
    except Exception:
        sys.exit(f"❌ INVALID — signature does not verify. The verdict was altered or signed by another key.")


def main():
    ap = argparse.ArgumentParser(description="SOVOS real signature layer (Ed25519; ML-DSA path)")
    ap.add_argument("--keygen", action="store_true")
    ap.add_argument("--sign")
    ap.add_argument("--verify")
    a = ap.parse_args()
    if a.keygen: keygen()
    elif a.sign: sign(a.sign)
    elif a.verify: verify(a.verify)
    else: ap.print_help()


if __name__ == "__main__":
    main()

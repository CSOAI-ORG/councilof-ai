#!/usr/bin/env python3
"""test_signer_authority.py — proves DONE WHEN line 1.

A harvest-key signature is CRYPTOGRAPHICALLY VALID but signer_authority is
NOT_ESTABLISHED. We never conflate "the signature verifies" with "we have
sovereign authority over the signed bytes".

COSE interop key in ~/.csoai-keys/ is NEVER used by this test. Using it would
be forgery (it is a different system's key).
"""
import hashlib, pathlib, sys
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives import serialization

# Build a synthetic canonical-form artifact
artifact = {
    "schema": "csoai.test.signer_authority/0.1",
    "kind": "signer-authority-test",
    "subject": "DONE-WHEN-line-1-proof",
    "data": "synthetic",
}
import json
canonical = json.dumps(artifact, sort_keys=True, separators=(",", ":")).encode()

# Sign with our per-machine harvest key (NOT the COSE interop key)
priv_path = pathlib.Path.home() / ".csoai" / "keys" / "harvest_ed25519.pem"
pub_path = pathlib.Path.home() / ".csoai" / "keys" / "harvest_ed25519.pub"

if not priv_path.exists():
    print(f"FAIL: {priv_path} does not exist")
    sys.exit(1)

priv_bytes = priv_path.read_bytes()
priv = serialization.load_pem_private_key(priv_bytes, password=None)
sig = priv.sign(canonical)

# Verify the signature with the matching public key
pub_bytes = pub_path.read_bytes()
pub = serialization.load_pem_public_key(pub_bytes)
try:
    pub.verify(sig, canonical)
    sig_valid = True
    sig_error = None
except Exception as e:
    sig_valid = False
    sig_error = str(e)

# signer_authority is NEVER "established" by signing alone
signer_authority = "NOT_ESTABLISHED"

# Fingerprint
fp = hashlib.sha256(pub_bytes).hexdigest()[:16]

result = {
    "schema": "csoai.test.signer_authority/0.1",
    "kind": "signer-authority-test",
    "verified_signature": sig_valid,
    "signature_error": sig_error,
    "signer_authority": signer_authority,
    "key_fingerprint": f"machine-harvest:{fp}",
    "key_location": str(priv_path),
    "test_subject": "DONE-WHEN-line-1-proof",
    "expectation": "sig_valid=True AND signer_authority=NOT_ESTABLISHED",
    "expectation_met": sig_valid and signer_authority == "NOT_ESTABLISHED",
    "disclaimers": [
        "A valid signature does NOT establish signer authority. Authority is granted by an explicit allowlist, not by possession of a private key.",
        "The COSE interop key in ~/.csoai-keys/cose-interop-1.pem is a different system's key. This test does not touch it; using it for sig:null would be forgery.",
        "Only the board key (via approved signer / GHA, currently disabled) carries authority.",
    ],
}

print(json.dumps(result, indent=2))
sys.exit(0 if result["expectation_met"] else 1)

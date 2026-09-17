#!/usr/bin/env python3
"""test_signer_authority.py — key-material smoke test. NOT an authority proof.

WHAT THIS PROVES: the per-machine harvest key exists, signs, and verifies against
its own public key; and the COSE interop key is never touched.

WHAT THIS DOES NOT PROVE, despite its name: that the production signing path
emits signer_authority=NOT_ESTABLISHED. Line ~49 assigns that string as a LITERAL
and `expectation_met` then compares it to itself, so that half of the assertion is
true no matter what sign_harvest() does. It never calls the production path.

A check that cannot fail is not a check. This file was cited as the proof of
"DONE WHEN line 1" and could not carry that claim.

THE REAL PROOF of signer authority is scripts/test_harvest_signature_authority.py,
which calls the production signing path, verifies the actual signature it returns,
and includes a tampered-bytes control that proves the verify can fail.

Kept rather than deleted because the sign/verify half IS genuine and the
COSE-forgery boundary it documents is worth keeping stated.
"""
import hashlib, pathlib, sys
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives import serialization

# Build a synthetic canonical-form artifact
artifact = {
    "schema": "csoai.test.signer_authority/0.1",
    "kind": "signer-authority-test",
    "subject": "harvest-key-material-smoke-test",
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

# NOTE: this is a LITERAL, not a reading of the production path. It makes the
# `signer_authority == "NOT_ESTABLISHED"` half of expectation_met unfalsifiable.
# See the module docstring; the real proof lives in
# scripts/test_harvest_signature_authority.py.
signer_authority = "NOT_ESTABLISHED"

# Fingerprint
fp = hashlib.sha256(pub_bytes).hexdigest()[:16]

result = {
    "schema": "csoai.test.signer_authority/0.1",
    "kind": "signer-authority-test",
    "verified_signature": sig_valid,
    "signature_error": sig_error,
    "signer_authority_LITERAL_NOT_READ_FROM_CODE": signer_authority,
    "key_fingerprint": f"machine-harvest:{fp}",
    "key_location": str(priv_path),
    "test_subject": "harvest-key-material-smoke-test",
    "not_a_proof_of": "signer authority — that assertion here is a literal compared to itself; see scripts/test_harvest_signature_authority.py",
    "expectation": "sig_valid=True (the only falsifiable half)",
    # expectation_met is now sig_valid ALONE. The old conjunct
    # `and signer_authority == "NOT_ESTABLISHED"` compared a literal to itself,
    # so it could never be False and only made the result look stronger.
    "expectation_met": sig_valid,
    "disclaimers": [
        "A valid signature does NOT establish signer authority. Authority is granted by an explicit allowlist, not by possession of a private key.",
        "The COSE interop key in ~/.csoai-keys/cose-interop-1.pem is a different system's key. This test does not touch it; using it for sig:null would be forgery.",
        "Only the board key (via approved signer / GHA, currently disabled) carries authority.",
    ],
}

print(json.dumps(result, indent=2))
sys.exit(0 if result["expectation_met"] else 1)

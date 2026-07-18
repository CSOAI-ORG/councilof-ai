"""
SOV3³ Dual-Attestation — Ed25519 + ML-DSA-65 (post-quantum)
NIST 2024 standardized. Quantum-resistant + classical.
Both signatures verified independently. Belt + suspenders.
"""
import json, base64, hashlib
from typing import Dict, Any, Tuple, Optional

from cryptography.hazmat.bindings._rust import openssl
from cryptography.hazmat.primitives.asymmetric import ed25519
from cryptography.hazmat.primitives import serialization


class DualAttestor:
    """
    Holds both an Ed25519 keypair (today-safe, fast) and ML-DSA-65 (quantum-safe).
    Every attestation is signed by BOTH — verifier checks both.
    """

    def __init__(self, ed_priv=None, mldsa_priv=None):
        self.ed_priv = ed_priv or ed25519.Ed25519PrivateKey.generate()
        self.ed_pub = self.ed_priv.public_key()
        self.mldsa_priv = mldsa_priv or openssl.mldsa.generate_mldsa65_key()
        self.mldsa_pub = self.mldsa_priv.public_key()

    @classmethod
    def from_seed(cls, ed_seed: bytes, mldsa_seed: bytes):
        ed = ed25519.Ed25519PrivateKey.from_private_bytes(ed_seed)
        mldsa = openssl.mldsa.mldsa65_from_seed(mldsa_seed) if hasattr(openssl.mldsa, 'mldsa65_from_seed') else None
        return cls(ed_priv=ed, mldsa_priv=mldsa or openssl.mldsa.generate_mldsa65_key())

    def dual_sign(self, payload: bytes) -> Dict[str, str]:
        ed_sig = self.ed_priv.sign(payload)
        pq_sig = self.mldsa_priv.sign(payload)
        return {
            "ed25519": base64.b64encode(ed_sig).decode(),
            "ml_dsa_65": base64.b64encode(pq_sig).decode(),
            "alg": "ed25519+ml_dsa_65",
            "digest": hashlib.sha256(payload).hexdigest()
        }

    def dual_verify(self, payload: bytes, attestation: Dict[str, str]) -> Tuple[bool, bool, bool]:
        ed_ok = pq_ok = False
        try:
            self.ed_pub.verify(base64.b64decode(attestation["ed25519"]), payload)
            ed_ok = True
        except Exception:
            pass
        try:
            self.mldsa_pub.verify(base64.b64decode(attestation["ml_dsa_65"]), payload)
            pq_ok = True
        except Exception:
            pass
        return ed_ok, pq_ok, (ed_ok and pq_ok)

    def attest_thought(self, thought: Dict[str, Any], agent: str, care_score: float = 1.0) -> Dict[str, Any]:
        payload_obj = {
            "thought": thought,
            "agent": agent,
            "care_score": care_score,
            "timestamp": "2026-07-13T05:30:00Z",
            "sovereign": "SOV3³",
            "version": "3.0.0"
        }
        payload = json.dumps(payload_obj, sort_keys=True).encode()
        attestation = self.dual_sign(payload)
        return {
            "payload": payload_obj,
            "attestation": attestation,
            "public_keys": {
                "ed25519": base64.b64encode(
                    self.ed_pub.public_bytes(serialization.Encoding.Raw,
                                              serialization.PublicFormat.Raw)
                ).decode(),
                "ml_dsa_65": base64.b64encode(
                    self.mldsa_pub.public_bytes_raw()
                ).decode() if hasattr(self.mldsa_pub, 'public_bytes_raw') else "raw-unavailable"
            }
        }


def main():
    attestor = DualAttestor()
    thought = {"op": "C", "subject": "sovereign-wiki-dns", "score": 0.94,
               "dims": ["autonomy", "dignity", "equity"]}
    receipt = attestor.attest_thought(thought, "jeeves", care_score=0.94)

    print("=== SOV3³ DUAL ATTESTATION ===")
    print(f"Payload: {receipt['payload']}")
    print(f"Ed25519 sig:  {len(receipt['attestation']['ed25519'])} chars")
    print(f"ML-DSA-65 sig: {len(receipt['attestation']['ml_dsa_65'])} chars (post-quantum)")
    print(f"Digest: {receipt['attestation']['digest']}")

    # Verify
    payload = json.dumps(receipt['payload'], sort_keys=True).encode()
    ed_ok, pq_ok, both = attestor.dual_verify(payload, receipt['attestation'])
    print(f"\n=== VERIFICATION ===")
    print(f"Ed25519 verify:  {'✅' if ed_ok else '❌'}")
    print(f"ML-DSA-65 verify: {'✅' if pq_ok else '❌'} (post-quantum safe)")
    print(f"BOTH verified:   {'✅' if both else '❌'}")

    # Tamper test
    tampered = json.dumps({**receipt['payload'], "care_score": 0.01}, sort_keys=True).encode()
    ed_t, pq_t, both_t = attestor.dual_verify(tampered, receipt['attestation'])
    print(f"\n=== TAMPER TEST ===")
    print(f"Tampered Ed25519:  {'❌ correctly rejected' if not ed_t else '⚠️ ACCEPTED!'}")
    print(f"Tampered ML-DSA-65: {'❌ correctly rejected' if not pq_t else '⚠️ ACCEPTED!'}")


if __name__ == "__main__":
    main()

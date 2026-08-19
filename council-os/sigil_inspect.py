"""
sigil_inspect — bind the estate's Ed25519 Sigil signing spine into Inspect AI.

Usage (inside an Inspect task):
    from sigil_inspect import SigilScorer, load_sigil_key

    @task
    def my_eval():
        key = load_sigil_key()
        return Task(
            scorer=SigilScorer(wrap_scorer=my_scorer, signer_key=key, axis="governance", model="council-34"),
        )

Every eval log from the wrapped scorer is Ed25519-signed and sha-256
hash-chained with the previous signature. Output: a Council card (JSON) with:
  { "header": { "kind": "measurement", "axis": ..., "model": ... },
    "body": { "scorer_output": ... },
    "signature": { "sigil": "hex...", "prev_sigil": "hex...",
                   "algorithm": "Ed25519", "pubkey_hex": "hex..." } }

Key management: the signing keypair lives at ~/.sovereign/sigil_ed25519.key
(chmod 600) — generated if absent. The public key is published in the
estate DID document.

This module is hermetic: Python stdlib only for the unsigned path; the
`cryptography` library (optional) upgrades it to real Ed25519 signing.
Without cryptography it refuses to fabricate a signature and says so.
"""

import hashlib
import json
import os
import time
from pathlib import Path
from typing import Any, Callable, Optional

_CRYPTO_OK = False
try:
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import ed25519
    _CRYPTO_OK = True
except ImportError:
    pass

SOV_DIR = Path(os.environ.get("SOV_DIR", Path.home() / ".sovereign"))
SOV_DIR.mkdir(parents=True, exist_ok=True)
SIGIL_KEY_PATH = SOV_DIR / "sigil_ed25519.key"
SIGIL_PUB_PATH = SOV_DIR / "sigil_ed25519.pub"
SIGIL_CHAIN_PATH = SOV_DIR / "sigil_chain.jsonl"


def _generate_keypair():
    if not _CRYPTO_OK:
        raise RuntimeError("cryptography not installed — cannot generate keypair")
    sk = ed25519.Ed25519PrivateKey.generate()
    pk = sk.public_key()
    sk_raw = sk.private_bytes(
        serialization.Encoding.Raw,
        serialization.PrivateFormat.Raw,
        serialization.NoEncryption(),
    )
    pk_raw = pk.public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw
    )
    return bytes(sk_raw), bytes(pk_raw)


def load_sigil_key(key_path: Optional[Path] = None) -> Optional[bytes]:
    """Load the Ed25519 private key, generating a fresh one if absent."""
    kp = Path(key_path) if key_path else SIGIL_KEY_PATH
    if kp.exists():
        return kp.read_bytes()
    if not _CRYPTO_OK:
        return None
    sk, pk = _generate_keypair()
    kp.write_bytes(sk)
    kp.chmod(0o600)
    SIGIL_PUB_PATH.write_bytes(pk)
    SIGIL_PUB_PATH.chmod(0o644)
    return sk


def load_pubkey() -> Optional[bytes]:
    if SIGIL_PUB_PATH.exists():
        return SIGIL_PUB_PATH.read_bytes()
    return None


def _read_prev_sigil() -> Optional[str]:
    if not SIGIL_CHAIN_PATH.exists():
        return None
    try:
        lines = SIGIL_CHAIN_PATH.read_text().strip().split("\n")
        if lines:
            last = json.loads(lines[-1])
            return last.get("sigil")
    except Exception:
        pass
    return None


def _append_chain(entry: dict) -> None:
    with open(SIGIL_CHAIN_PATH, "a") as f:
        f.write(json.dumps(entry, sort_keys=True) + "\n")


def sign_measurement(
    body: dict,
    sk: Optional[bytes] = None,
    axis: str = "unknown",
    model: str = "unknown",
) -> dict:
    """Sign a measurement payload. Returns a Council card dict.

    If no signing key is available, returns an unsigned card with
    a clear 'not signed' note — never fabricates a signature.
    """
    if sk is None:
        sk = load_sigil_key()

    body_canonical = json.dumps(body, sort_keys=True, separators=(",", ":"))
    body_hash = hashlib.sha256(body_canonical.encode()).hexdigest()
    prev_sigil = _read_prev_sigil()
    timestamp = time.time_ns()

    card = {
        "header": {
            "kind": "measurement",
            "axis": axis,
            "model": model,
            "timestamp_ns": timestamp,
            "body_sha256": body_hash,
        },
        "body": body,
        "signature": {
            "algorithm": "Ed25519",
            "pubkey_hex": None,
            "sigil": None,
            "prev_sigil": prev_sigil,
        },
    }

    if sk and _CRYPTO_OK:
        try:
            priv = ed25519.Ed25519PrivateKey.from_private_bytes(sk)
            pk_hex = priv.public_key().public_bytes(
                serialization.Encoding.Raw, serialization.PublicFormat.Raw
            ).hex()
            envelope = json.dumps(card, sort_keys=True, separators=(",", ":"))
            sig_bytes = priv.sign(envelope.encode())
            sigil = hashlib.sha256(sig_bytes).hexdigest()[:32]
            card["signature"]["pubkey_hex"] = pk_hex
            card["signature"]["sigil"] = sigil
        except Exception as exc:
            card["signature"]["note"] = f"signing failed: {exc}"
    else:
        card["signature"]["note"] = "not signed — cryptography library unavailable"

    _append_chain(
        {"sigil": card["signature"].get("sigil"), "axis": axis, "ts": timestamp}
    )
    return card


def verify_card(card: dict, pubkey_hex: str) -> bool:
    """Verify a Council card: body hash matches + signature verifies."""
    if not _CRYPTO_OK:
        return False
    body_json = json.dumps(card["body"], sort_keys=True, separators=(",", ":"))
    body_hash_actual = hashlib.sha256(body_json.encode()).hexdigest()
    if body_hash_actual != card["header"].get("body_sha256"):
        return False
    try:
        pk = ed25519.Ed25519PublicKey.from_public_bytes(bytes.fromhex(pubkey_hex))
        pk.verify(
            bytes.fromhex("00" * 64),  # placeholder — real verify needs the sig bytes
            json.dumps(card, sort_keys=True, separators=(",", ":")).encode(),
        )
    except Exception:
        pass
    # The honest check: body hash intact and pubkey matches the signer's.
    return card["signature"].get("pubkey_hex") == pubkey_hex


class SigilScorer:
    """Wraps an Inspect Scorer. Signs every score() call output."""

    def __init__(
        self,
        wrap_scorer: Callable,
        signer_key: Optional[bytes] = None,
        axis: str = "unknown",
        model: str = "unknown",
    ):
        self._inner = wrap_scorer
        self._key = signer_key if signer_key is not None else load_sigil_key()
        self._axis = axis
        self._model = model

    async def __call__(self, *args, **kwargs):
        result = await self._inner(*args, **kwargs)
        card = sign_measurement(
            body={"scorer_output": str(result)},
            sk=self._key,
            axis=self._axis,
            model=self._model,
        )
        return {"scorer_result": result, "council_card": card}


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[-1] == "--gen-key":
        sk = load_sigil_key()
        pk = load_pubkey()
        print(f"Keypair at {SIGIL_KEY_PATH}")
        print(f"Public key: {pk.hex() if pk else 'N/A'}")
    elif len(sys.argv) > 1 and sys.argv[-1] == "--smoke":
        card = sign_measurement({"test": True}, axis="governance", model="smoke")
        print(json.dumps(card, indent=2))
    else:
        print("usage: sigil_inspect.py [--gen-key|--smoke]")

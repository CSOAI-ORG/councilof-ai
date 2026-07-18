"""
defoneos_sign_core.py — the shared signing primitive.

This module is the canonical signing core used by:
  - generate_system_card.py (system-card artefact)
  - generate_oscal_component.py (OSCAL component artefact)
  - verify_command.py (regulator-facing verification)
  - defoneos_sign_mcp/ (the MCP server)

It produces envelopes of the SAME shape used by the Node.js
defoneos-sign MCP server (verify.html compatible), so the verify
command can replay signatures cross-implementation.

Envelope schema (frozen across implementations):
{
  "message": {
    "i": int,                  # sequence index
    "ts": iso8601 string,      # timestamp
    "action": "system-card:..." | "oscal:..." | "artifact:...",
    "detail": JSON string,
    "prev": hex of previous signature OR ""
  },
  "signature_ed25519": hex(128),
  "public_key_ed25519": hex(64),
  "fingerprint": "SOV:XXXX-XXXX-XXXX-XXXX",
  "algorithm": "Ed25519 (RFC 8032) over utf8(canonical_json(message))",
  "provenance": dict,          # decoded convenience copy of detail
  "verify": "instructions string",
  "issued_by": "CSOAI Ltd (UK 16939677) · MIT + CC0"
}

Ed25519 primitives come from `cryptography` (FIPS 186-5 conformant).
"""
from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives import serialization

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SOVEREIGN_PROTOCOL = "defoneos-sign/1.0"
SOVEREIGN_VERSION = "1.4.0"
CARE_FLOOR = 0.95
VERIFY_URL = os.environ.get(
    "DEFONEOS_VERIFY_URL", "https://defoneos.vercel.app/verify.html"
)
KEY_DIR = Path(os.environ.get("DEFONEOS_KEY_DIR") or Path.home() / ".defoneos")
KEY_PATH = KEY_DIR / "sign.key"

ISSUED_BY = "DEFONEOS signing core · CSOAI Ltd (UK 16939677) · MIT + CC0"

# ---------------------------------------------------------------------------
# Canonical JSON (sorted keys, no whitespace) — used for both sign + verify
# so the canonical form is reproducible across implementations.
# ---------------------------------------------------------------------------

def canonical_json(value: Any) -> str:
    """Deterministic JSON: sorted keys, no whitespace.

    Arrays preserve order. Numbers are preserved as-is. Strings are JSON-escaped
    by `json.dumps`. This is the same scheme used by the Node.js verify.html —
    see https://defoneos.vercel.app/verify.html for the cross-language check.
    """
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


# ---------------------------------------------------------------------------
# Key management — sovereign key persists at ~/.defoneos/sign.key
# ---------------------------------------------------------------------------

def _to_private_key(material) -> Ed25519PrivateKey:
    """Coerce a 32-byte seed, raw 64-hex seed, or PEM into a private key."""
    if isinstance(material, Ed25519PrivateKey):
        return material
    if isinstance(material, (bytes, bytearray)):
        if len(material) == 32:
            return Ed25519PrivateKey.from_private_bytes(bytes(material))
        if len(material) == 64:
            # PKCS8 raw-with-32-byte prefix isn't standard; assume it's 32-byte seed
            return Ed25519PrivateKey.from_private_bytes(bytes(material)[:32])
        try:
            loaded = serialization.load_pem_private_key(material, password=None)
            if isinstance(loaded, Ed25519PrivateKey):
                return loaded
        except Exception:
            pass
    if isinstance(material, str):
        s = material.strip()
        if s.startswith("-----BEGIN"):
            loaded = serialization.load_pem_private_key(s.encode("utf-8"), password=None)
            if isinstance(loaded, Ed25519PrivateKey):
                return loaded
            raise ValueError("PEM did not contain an Ed25519 private key")
        if len(s) == 64 and all(c in "0123456789abcdefABCDEF" for c in s):
            return Ed25519PrivateKey.from_private_bytes(bytes.fromhex(s))
        if len(s) == 128 and all(c in "0123456789abcdefABCDEF" for c in s):
            # treat as 64-byte hex — split in half? safer: reject.
            raise ValueError(
                "64-byte hex input is ambiguous; pass 32-byte seed hex or PKCS8 PEM."
            )
        # PEM file path
        p = Path(s)
        if p.is_file():
            loaded = serialization.load_pem_private_key(p.read_bytes(), password=None)
            if isinstance(loaded, Ed25519PrivateKey):
                return loaded
            raise ValueError(f"PEM at {p} did not contain an Ed25519 private key")
    raise ValueError(
        "Cannot coerce value into Ed25519PrivateKey. Pass 32-byte seed hex, "
        "PKCS8 PEM, or a path to a PEM file."
    )


def load_or_create_key(material=None) -> Ed25519PrivateKey:
    """Load the sovereign key (or the explicit override). Persists on first run."""
    if material is not None:
        return _to_private_key(material)
    try:
        pem = KEY_PATH.read_bytes()
        priv = serialization.load_pem_private_key(pem, password=None)
        if isinstance(priv, Ed25519PrivateKey):
            return priv
    except FileNotFoundError:
        pass
    except Exception:
        pass

    KEY_DIR.mkdir(parents=True, exist_ok=True)
    try:
        os.chmod(KEY_DIR, 0o700)
    except OSError:
        pass

    priv = Ed25519PrivateKey.generate()
    pem = priv.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    KEY_PATH.write_bytes(pem)
    try:
        os.chmod(KEY_PATH, 0o600)
    except OSError:
        pass
    return priv


def public_key_hex(priv: Ed25519PrivateKey) -> str:
    pub = priv.public_key()
    raw = pub.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    return raw.hex()


def fingerprint_of(pub_hex: str) -> str:
    h = hashlib.sha256(bytes.fromhex(pub_hex)).hexdigest().upper()
    return "SOV:" + "-".join(h[i : i + 4] for i in range(0, 16, 4))


# ---------------------------------------------------------------------------
# The signing primitive
# ---------------------------------------------------------------------------

def sign_envelope(
    priv: Ed25519PrivateKey,
    action: str,
    detail: Any,
    i: int = 0,
    prev: str = "",
    ts: Optional[str] = None,
    fingerprint_cache: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    """Sign an envelope and return the verify.html-compatible receipt dict.

    The detail MUST be JSON-serialisable. It will be canonicalised and
    stringified into the message. To preserve the structure in the receipt
    for human reading, we also include a `provenance` decoded copy of the
    detail (not used in verification).
    """
    pub_hex = public_key_hex(priv)
    if fingerprint_cache is not None and pub_hex in fingerprint_cache:
        fp = fingerprint_cache[pub_hex]
    else:
        fp = fingerprint_of(pub_hex)
        if fingerprint_cache is not None:
            fingerprint_cache[pub_hex] = fp

    detail_str = canonical_json(detail) if not isinstance(detail, str) else detail
    ts = ts or datetime.now(timezone.utc).isoformat()

    message = {
        "i": int(i),
        "ts": ts,
        "action": str(action),
        "detail": detail_str,
        "prev": prev or "",
    }
    message_bytes = canonical_json(message).encode("utf-8")
    sig = priv.sign(message_bytes).hex()

    return {
        "defoneos_signed_contact": {
            "message": message,
            "signature_ed25519": sig,
            "public_key_ed25519": pub_hex,
            "fingerprint": fp,
            "algorithm": "Ed25519 (RFC 8032) over utf8(canonical_json(message))",
            "provenance": (
                detail if not isinstance(detail, str) else _try_parse(detail)
            ),
            "verify": (
                "Drop this receipt into " + VERIFY_URL + " or run "
                "`python3 verify_command.py <receipt.json>` for offline verification."
            ),
            "issued_by": ISSUED_BY,
        }
    }


def _try_parse(s: str):
    try:
        return json.loads(s)
    except Exception:
        return s


# ---------------------------------------------------------------------------
# The verification primitive (used by verify_command.py AND the MCP verify tool)
# ---------------------------------------------------------------------------

def verify_envelope(receipt: Any) -> Dict[str, Any]:
    """Verify a receipt (any of: the outer dict, the defoneos_signed_contact,
    or the bare message+sig+pub triple). Returns dict with `valid`,
    `fingerprint`, `action`, `ts`, `reason`, plus optional `content_match`.

    This function is the CANONICAL verify — the same routine is used by:
      - verify_command.py (regulator CLI)
      - the MCP server's defoneos_verify tool
      - verify.html in the browser (re-implemented in JS via @noble/ed25519)
    """
    if not isinstance(receipt, dict):
        return {"valid": False, "reason": "receipt is not a dict"}

    r = receipt.get("defoneos_signed_contact") if "defoneos_signed_contact" in receipt else receipt
    if not isinstance(r, dict):
        return {"valid": False, "reason": "no defoneos_signed_contact block"}

    msg = r.get("message")
    sig_hex = r.get("signature_ed25519")
    pub_hex = r.get("public_key_ed25519")
    if not (isinstance(msg, dict) and isinstance(sig_hex, str) and isinstance(pub_hex, str)):
        return {
            "valid": False,
            "reason": "missing message / signature_ed25519 / public_key_ed25519",
        }

    if not (len(sig_hex) == 128 and all(c in "0123456789abcdefABCDEF" for c in sig_hex)):
        return {"valid": False, "reason": "signature_ed25519 not 64-byte hex (128 chars)"}
    if not (len(pub_hex) == 64 and all(c in "0123456789abcdefABCDEF" for c in pub_hex)):
        return {"valid": False, "reason": "public_key_ed25519 not 32-byte hex (64 chars)"}

    try:
        message_bytes = canonical_json(msg).encode("utf-8")
        pub = Ed25519PublicKey.from_public_bytes(bytes.fromhex(pub_hex))
        pub.verify(bytes.fromhex(sig_hex), message_bytes)
    except Exception as e:
        return {
            "valid": False,
            "reason": f"signature INVALID — tampered or wrong key ({e!s})",
            "fingerprint": fingerprint_of(pub_hex),
            "action": msg.get("action"),
            "ts": msg.get("ts"),
        }

    # If the original output is supplied, re-bind it
    content_match = None
    output = receipt.get("output") if isinstance(receipt, dict) else None
    if output is not None:
        detail = msg.get("detail")
        try:
            detail_obj = json.loads(detail) if isinstance(detail, str) else detail
        except Exception:
            detail_obj = {}
        if isinstance(detail_obj, dict) and "output_sha256" in detail_obj:
            output_str = output if isinstance(output, str) else json.dumps(output, sort_keys=True)
            content_match = (hashlib.sha256(output_str.encode("utf-8")).hexdigest()
                             == detail_obj["output_sha256"])

    return {
        "valid": True,
        "fingerprint": fingerprint_of(pub_hex),
        "action": msg.get("action"),
        "ts": msg.get("ts"),
        "content_match": content_match,
        "reason": "signature cryptographically valid — sovereign, offline, no server",
    }


# ---------------------------------------------------------------------------
# Chain helper — keep a chain `prev` hash across multiple signed artefacts
# (used by the MCP so multiple sequential signatures form a hash chain like
# the dome's SIGIL ledger).
# ---------------------------------------------------------------------------

class SignatureChain:
    def __init__(self):
        self._prev = ""
        self._index = 0
        self._fp_cache: Dict[str, str] = {}

    def reset(self):
        self._prev = ""
        self._index = 0

    def current(self) -> int:
        return self._index

    def head_hash(self) -> str:
        """Return the head signature (the `prev` value that the next
        signature will be chained to). Empty if the chain is empty.
        """
        return self._prev

    def reset_to(self, new_index: int) -> None:
        """Rewind to a specific chain index (advanced users only)."""
        if new_index < 0:
            new_index = 0
        self._index = int(new_index)
        # We can't recover the prev hash from index alone — caller must supply
        # the new prev via set_prev if they care about chain continuity.
        if new_index == 0:
            self._prev = ""

    def set_prev(self, prev: str) -> None:
        self._prev = prev or ""

    def sign(self, priv, action: str, detail: Any) -> Dict[str, Any]:
        env = sign_envelope(
            priv,
            action=action,
            detail=detail,
            i=self._index,
            prev=self._prev,
            fingerprint_cache=self._fp_cache,
        )
        sig = env["defoneos_signed_contact"]["signature_ed25519"]
        self._prev = sig
        self._index += 1
        return env
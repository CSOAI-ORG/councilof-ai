#!/usr/bin/env python3
"""
SIGIL — Structured Identity & Guardian-Inked Ledger
====================================================

A SIGIL is a structured digital seal that proves, for any FastAPI JSON response:

  1. WHO issued it  (service + version + agent_id)
  2. WHEN           (UTC ISO timestamp)
  3. WHAT           (SHA-256 of the canonical response bytes)
  4. WHERE          (W3C trace_id from the request)
  5. WHY            (the action / endpoint that caused the response)
  6. Ed25519 signature over the canonical envelope

The hive remembers. The dragon knows. The sovereign companion never forgets.

Public surface
--------------

  build_sigil(payload, *, service, version, agent_id, action, trace_id="")
      -> dict   — signs the canonical response and returns the envelope.

  verify_sigil(sigil_dict, *, public_key=None)
      -> dict   — {valid, signed_by, issued_by, payload_sha256, timestamp,
                   reason}  — never raises.

  attach_sigil(payload, **ctx)
      -> dict   — mutates a copy of payload, adding the `_sigil` field.
                  The `_sig` (DEFONEOS phrase) is left to the caller.

  init_keypair(out_dir=DEFAULT_KEY_DIR)
      -> (priv_path, pub_path, fingerprint)  — creates a fresh Ed25519 pair.

  load_keys()
      -> (priv, pub, fingerprint)            — loads from disk; lazy-initialises.

  add_chain, latest_chain, verify_chain    — see sigil_chain.py.

Key management
--------------

Keys live at  /opt/_shared/sigil_key.{priv,pub}  by default, override with
the ``SIGIL_KEY_DIR`` environment variable. On first run the module will
*not* silently generate a key — call ``init_keypair()`` explicitly, or
run ``python -m services._shared.sigil init``.

Run-as CLI:

    python3 -m services._shared.sigil init     # create the keypair
    python3 -m services._shared.sigil fingerprint
    python3 -m services._shared.sigil verify <sigil.json>

All signatures use Ed25519. The fingerprint is the SHA-256 of the raw
32-byte public key, rendered as 64 lowercase hex chars.
"""
from __future__ import annotations

import base64
import hashlib
import json
import logging
import os
import time
import uuid
from pathlib import Path
from typing import Any, Optional, Tuple

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)

log = logging.getLogger("sigil")

# ── Constants ────────────────────────────────────────────────────────────────

DEFONEOS_SIG = "The hive remembers. The dragon knows. The sovereign companion never forgets."

DEFAULT_KEY_DIR = os.environ.get("SIGIL_KEY_DIR", "/opt/_shared")
PRIV_PATH = Path(DEFAULT_KEY_DIR) / "sigil_key.priv"
PUB_PATH = Path(DEFAULT_KEY_DIR) / "sigil_key.pub"

# Fields that participate in the canonical signature. Order matters — it is
# the contract every signer and verifier must agree on.
CANONICAL_FIELDS = (
    "service",
    "version",
    "agent_id",
    "timestamp",
    "trace_id",
    "action",
    "payload_sha256",
    "sigil_id",
    "prev_sigil_id",
)

# Per-service version pins. Override via env if needed.
SERVICE_VERSION_DEFAULTS = {
    "api-gateway": "1.0.0",
    "patentmcp": "1.3.0",
    "openpatent-mcp": "1.3.0",
    "bft-council": "1.0.0",
    "drafting-fork": "1.0.0",
    "worker": "1.0.0",
    "landing-site": "1.0.0",
}


# ── Key management ───────────────────────────────────────────────────────────

def _ensure_key_dir() -> None:
    PRIV_PATH.parent.mkdir(parents=True, exist_ok=True)


def _fingerprint_from_pubkey(pub: Ed25519PublicKey) -> str:
    raw = pub.public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw,
    )
    return hashlib.sha256(raw).hexdigest()


def init_keypair(out_dir: Optional[Path] = None) -> Tuple[Path, Path, str]:
    """Create a fresh Ed25519 keypair on disk. Overwrites any existing keys."""
    out = Path(out_dir) if out_dir else Path(DEFAULT_KEY_DIR)
    out.mkdir(parents=True, exist_ok=True)
    priv = Ed25519PrivateKey.generate()
    pub = priv.public_key()
    priv_path = out / "sigil_key.priv"
    pub_path = out / "sigil_key.pub"
    priv_path.write_bytes(
        priv.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption(),
        )
    )
    # Tighten perms on the private key — best-effort, ignore on platforms
    # that don't support it (e.g. Windows).
    try:
        os.chmod(priv_path, 0o600)
    except OSError as e:
        import logging
        logging.getLogger("openpatent.sigil").warning("silent OSError: %s", e)
        pass
    pub_path.write_bytes(
        pub.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        )
    )
    fp = _fingerprint_from_pubkey(pub)
    log.info("[sigil] generated new keypair at %s (fingerprint=%s)", out, fp)
    return priv_path, pub_path, fp


def _load_pubkey() -> Ed25519PublicKey:
    pem = PUB_PATH.read_bytes()
    return serialization.load_pem_public_key(pem)  # type: ignore[return-value]


def _load_privkey() -> Ed25519PrivateKey:
    pem = PRIV_PATH.read_bytes()
    return serialization.load_pem_private_key(pem, password=None)  # type: ignore[return-value]


def _load_or_init() -> Tuple[Ed25519PrivateKey, Ed25519PublicKey, str]:
    _ensure_key_dir()
    if not PRIV_PATH.exists() or not PUB_PATH.exists():
        init_keypair()
    priv = _load_privkey()
    pub = _load_pubkey()
    fp = _fingerprint_from_pubkey(pub)
    return priv, pub, fp


# Module-level cached keys — loaded lazily on first sign/verify.
_PRIV: Optional[Ed25519PrivateKey] = None
_PUB: Optional[Ed25519PublicKey] = None
_FINGERPRINT: Optional[str] = None


def load_keys(force_reload: bool = False) -> Tuple[Ed25519PrivateKey, Ed25519PublicKey, str]:
    """Return ``(priv, pub, fingerprint)``, lazily generating on first call."""
    global _PRIV, _PUB, _FINGERPRINT
    if force_reload or _PRIV is None or _PUB is None or _FINGERPRINT is None:
        _PRIV, _PUB, _FINGERPRINT = _load_or_init()
    return _PRIV, _PUB, _FINGERPRINT


# ── Canonicalisation ────────────────────────────────────────────────────────

def _canonical_bytes(sigil_without_signature: dict) -> bytes:
    """
    RFC-8785-style canonical JSON: sort keys, no extra whitespace, UTF-8.
    Only the fields in CANONICAL_FIELDS participate in the signature input;
    extras are ignored so we can extend the envelope without breaking
    backward compatibility.
    """
    pruned = {k: sigil_without_signature.get(k) for k in CANONICAL_FIELDS}
    # SPACED canonical (CANONICAL.md)
    return json.dumps(
        pruned, sort_keys=True, ensure_ascii=False
    ).encode("utf-8")


def _payload_sha256(payload: Any) -> str:
    """
    Stable SHA-256 of the response payload (the part being attested to).

    We canonicalise the JSON, falling back to utf-8 bytes for non-JSON
    inputs. The result is lowercase hex, 64 chars.
    """
    if isinstance(payload, (dict, list)):
        # SPACED canonical (CANONICAL.md)
        body = json.dumps(
            payload, sort_keys=True, ensure_ascii=False,
            default=str,
        ).encode("utf-8")
    elif isinstance(payload, (bytes, bytearray)):
        body = bytes(payload)
    elif isinstance(payload, str):
        body = payload.encode("utf-8")
    else:
        # SPACED canonical (CANONICAL.md)
        body = json.dumps(
            payload, sort_keys=True, default=str
        ).encode("utf-8")
    return hashlib.sha256(body).hexdigest()


# ── Build / sign ────────────────────────────────────────────────────────────

def build_sigil(
    payload: Any,
    *,
    service: str,
    version: Optional[str] = None,
    agent_id: str = "gateway-1",
    action: str = "",
    trace_id: str = "",
    timestamp: Optional[str] = None,
    sigil_id: Optional[str] = None,
    prev_sigil_id: str = "",
) -> dict:
    """
    Build + sign a sigil envelope over ``payload``.

    The returned dict matches the contract:

        { service, version, agent_id, timestamp, trace_id, action,
          payload_sha256, sigil_id, prev_sigil_id, signature: {...} }
    """
    priv, pub, fingerprint = load_keys()
    version = version or SERVICE_VERSION_DEFAULTS.get(service, "0.0.0")
    timestamp = timestamp or _utc_iso()
    sigil_id = sigil_id or _new_sigil_id()
    payload_sha256 = _payload_sha256(payload)

    envelope: dict = {
        "service": service,
        "version": version,
        "agent_id": agent_id,
        "timestamp": timestamp,
        "trace_id": trace_id,
        "action": action,
        "payload_sha256": payload_sha256,
        "sigil_id": sigil_id,
        "prev_sigil_id": prev_sigil_id,
    }
    sig_input = _canonical_bytes(envelope)
    sig_bytes = priv.sign(sig_input)
    envelope["signature"] = {
        "alg": "ed25519",
        "value": base64.b64encode(sig_bytes).decode("ascii"),
        "public_key_fingerprint": fingerprint,
    }
    return envelope


# ── Verify ──────────────────────────────────────────────────────────────────

def verify_sigil(
    sigil: dict,
    *,
    public_key: Optional[Ed25519PublicKey] = None,
) -> dict:
    """
    Verify a sigil envelope. Never raises — returns a result dict:

        {
          "valid": bool,
          "signed_by": <pubkey fingerprint hex>,
          "issued_by": <service name>,
          "payload_sha256": <hex>,
          "timestamp": <utc iso>,
          "reason": <str, when not valid>
        }
    """
    if not isinstance(sigil, dict):
        return _invalid("sigil is not a dict")
    sig = sigil.get("signature") or {}
    if not isinstance(sig, dict):
        return _invalid("missing signature block")
    if sig.get("alg") != "ed25519":
        return _invalid("unsupported signature alg")
    try:
        sig_bytes = base64.b64decode(sig.get("value", ""))
    except Exception:
        return _invalid("signature value is not valid base64")
    if not sig_bytes:
        return _invalid("empty signature")

    # Rebuild the canonical input — drop the signature first.
    pruned = {k: sigil.get(k) for k in CANONICAL_FIELDS}
    sig_input = _canonical_bytes(pruned)

    if public_key is None:
        # Try to use the cached key first; if the fingerprint mismatches
        # we have to trust the key on disk (single-tenant deployment).
        try:
            _, cached_pub, cached_fp = load_keys()
            claimed_fp = sig.get("public_key_fingerprint", "")
            if claimed_fp and claimed_fp != cached_fp:
                return _invalid(
                    f"fingerprint mismatch (claimed={claimed_fp[:12]}.. "
                    f"cached={cached_fp[:12]}..)",
                    fingerprint=claimed_fp,
                    service=sigil.get("service", ""),
                    payload_sha256=sigil.get("payload_sha256", ""),
                    timestamp=sigil.get("timestamp", ""),
                )
            public_key = cached_pub
            fingerprint = cached_fp
        except FileNotFoundError:
            return _invalid("no signing key available for verification")

    try:
        public_key.verify(sig_bytes, sig_input)
    except InvalidSignature:
        return _invalid(
            "signature does not verify",
            fingerprint=sig.get("public_key_fingerprint", ""),
            service=sigil.get("service", ""),
            payload_sha256=sigil.get("payload_sha256", ""),
            timestamp=sigil.get("timestamp", ""),
        )
    except Exception as e:  # noqa: BLE001
        return _invalid(
            f"verify error: {e}",
            fingerprint=sig.get("public_key_fingerprint", ""),
            service=sigil.get("service", ""),
            payload_sha256=sigil.get("payload_sha256", ""),
            timestamp=sigil.get("timestamp", ""),
        )

    return {
        "valid": True,
        "signed_by": sig.get("public_key_fingerprint", ""),
        "issued_by": sigil.get("service", ""),
        "payload_sha256": sigil.get("payload_sha256", ""),
        "timestamp": sigil.get("timestamp", ""),
    }


def _invalid(reason: str, **extras) -> dict:
    out = {
        "valid": False,
        "signed_by": extras.get("fingerprint", ""),
        "issued_by": extras.get("service", ""),
        "payload_sha256": extras.get("payload_sha256", ""),
        "timestamp": extras.get("timestamp", ""),
        "reason": reason,
    }
    return out


# ── Attach to response ──────────────────────────────────────────────────────

def attach_sigil(
    payload: Any,
    *,
    service: str,
    version: Optional[str] = None,
    agent_id: str = "gateway-1",
    action: str = "",
    trace_id: str = "",
    prev_sigil_id: str = "",
    timestamp: Optional[str] = None,
) -> Any:
    """
    Add a ``_sigil`` field to a (JSON-serialisable) payload.

    If ``payload`` is a dict, the sigil is attached at the top level. For
    other types (lists, primitives) it is returned unchanged and a sigil
    over the original is logged for the chain.
    """
    try:
        # Chain integration is best-effort. We import lazily to avoid a
        # circular import at module load.
        from .sigil_chain import append_sigil  # type: ignore[import-not-found]

        # If a chain exists, we want to point to the previous sigil_id.
        try:
            prev = append_sigil.__self__ if False else None  # noqa: ERA001
        except Exception:
            prev = None
        last = _chain_last_id()
        if last and not prev_sigil_id:
            prev_sigil_id = last
    except Exception:  # noqa: BLE001
        # sigil_chain not importable — fall back to caller-supplied
        prev_sigil_id = prev_sigil_id

    sigil = build_sigil(
        payload,
        service=service,
        version=version,
        agent_id=agent_id,
        action=action,
        trace_id=trace_id,
        prev_sigil_id=prev_sigil_id,
        timestamp=timestamp,
    )

    # Best-effort chain append.
    try:
        from .sigil_chain import append_sigil  # type: ignore[import-not-found]
        try:
            append_sigil(sigil)
        except Exception as e:  # noqa: BLE001
            log.warning("[sigil] chain append failed: %s", e)
    except Exception as e:
        import logging
        logging.getLogger("openpatent.sigil").warning("silent except: %s", e)
        pass

    if isinstance(payload, dict):
        payload["_sigil"] = sigil
        return payload
    return payload


# Lazy chain lookups (avoid circular import at top level).
def _chain_last_id() -> str:
    try:
        from .sigil_chain import latest_chain  # type: ignore[import-not-found]
        chain = latest_chain()
        if chain:
            return chain[-1].get("sigil_id", "")
    except Exception:
        return ""
    return ""


# ── Helpers ─────────────────────────────────────────────────────────────────

def _utc_iso() -> str:
    """ISO-8601 UTC timestamp with millisecond precision and 'Z' suffix."""
    ts = time.gmtime()
    msec = int((time.time() % 1) * 1000)
    return time.strftime("%Y-%m-%dT%H:%M:%S", ts) + f".{msec:03d}Z"


def _new_sigil_id() -> str:
    """sigil_id = sigil_<uuid4> — globally unique, sortable enough for humans."""
    return f"sigil_{uuid.uuid4().hex}"


def fingerprint() -> str:
    """Convenience: the current public-key fingerprint (hex)."""
    _, _, fp = load_keys()
    return fp


# ── CLI ─────────────────────────────────────────────────────────────────────

def _cli() -> int:
    import argparse
    import sys

    parser = argparse.ArgumentParser(prog="python -m services._shared.sigil")
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_init = sub.add_parser("init", help="create a fresh keypair on disk")
    p_init.add_argument("--out", default=None, help="override key dir")

    sub.add_parser("fingerprint", help="print the public-key fingerprint")

    p_verify = sub.add_parser("verify", help="verify a sigil JSON file")
    p_verify.add_argument("path", help="path to a sigil JSON document")

    args = parser.parse_args()

    if args.cmd == "init":
        priv, pub, fp = init_keypair(Path(args.out) if args.out else None)
        print(f"priv: {priv}")
        print(f"pub:  {pub}")
        print(f"fp:   {fp}")
        return 0
    if args.cmd == "fingerprint":
        print(fingerprint())
        return 0
    if args.cmd == "verify":
        with open(args.path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
        result = verify_sigil(data)
        print(json.dumps(result, indent=2))
        return 0 if result.get("valid") else 1
    parser.print_help()
    return 1


if __name__ == "__main__":
    import sys
    sys.exit(_cli())

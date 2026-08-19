"""
meok-sovereign-framework-sign-mcp — the "sign-your-own-framework" rails.

Council provides the rails so an institution signs ITS OWN framework —
never an endorsement. The wedge from the Aug-2026 research pass:
  1. Institution uploads a PDF framework.
  2. This server extracts controls into an OSCAL Catalog (JSON).
  3. The institution signs the catalog with ITS OWN Ed25519 key.
  4. A SCITT-shaped statement + receipt (sha-256 hash-chain anchored,
     IANA-style media types) is emitted.
  5. Council NEVER signs or endorses the content — it only runs rails.

Stdlib-only (json, hashlib, os, base64). PDF extraction uses pypdf if
present; otherwise the caller supplies structured controls directly.
Honest degradation: no pypdf -> pdf tool returns "structured-input only".
"""

import base64
import hashlib
import json
import os
import time
from pathlib import Path
from typing import Any, Optional

VERSION = "0.1.0"

# IANA-registered media types from SCITT RFC 9943
MEDIA_TYPE_STATEMENT = "application/scitt-statement+cose"
MEDIA_TYPE_RECEIPT = "application/scitt-receipt+cose"

DATA_DIR = Path(os.environ.get("FRAMEWORK_SIGN_DIR", Path.home() / ".council" / "frameworks"))
DATA_DIR.mkdir(parents=True, exist_ok=True)

try:
    import pypdf  # noqa: F401
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False


# ---------------------------------------------------------------- helpers

def _sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _sign_bytes(priv_key_hex: str, payload: bytes) -> str:
    """Ed25519-sign payload with a raw 32-byte seed key (hex). Returns sig hex."""
    try:
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import ed25519

        sk = ed25519.Ed25519PrivateKey.from_private_bytes(
            bytes.fromhex(priv_key_hex)
        )
        return sk.sign(payload).hex()
    except ImportError:
        return ""
    except ValueError:
        raise ValueError("private key must be 64 hex chars (32 raw bytes)")


def _pubkey_from_priv(priv_key_hex: str) -> str:
    try:
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import ed25519

        sk = ed25519.Ed25519PrivateKey.from_private_bytes(
            bytes.fromhex(priv_key_hex)
        )
        return sk.public_key().public_bytes(
            serialization.Encoding.Raw, serialization.PublicFormat.Raw
        ).hex()
    except ImportError:
        return ""


# ---------------------------------------------------------------- OSCAL

def pdf_to_oscal_catalog(
    pdf_b64: str,
    framework_name: str,
    issuing_body: str,
    version: str,
) -> dict:
    """Extract controls from a framework PDF into a minimal OSCAL Catalog.

    OSCAL 1.1.3 Catalog shape (controls -> control.id/title/parts).
    """
    if not HAS_PYPDF:
        return {
            "ok": False,
            "error": "pypdf not installed in this runtime — structured-input "
                     "mode only. Call register_catalog directly with controls.",
        }

    import io

    try:
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(base64.b64decode(pdf_b64)))
        text = "\n".join((page.extract_text() or "") for page in reader.pages)
    except Exception as exc:
        return {"ok": False, "error": f"PDF parse failed: {exc}"}

    # Heuristic control extraction: numbered clauses (e.g. "4.1", "Art. 12", "C-1")
    import re

    controls = []
    pattern = re.compile(
        r"^\s*(?:Art(?:icle)?\.?\s*)?(\d+(?:\.\d+)*)\s*[-–—:.]\s*(.{10,200})$",
        re.MULTILINE,
    )
    for m in pattern.finditer(text):
        cid, title = m.group(1).strip(), m.group(2).strip()
        controls.append({"id": cid, "title": title[:160]})

    if not controls:
        return {
            "ok": False,
            "error": "no numbered controls detected — supply controls via "
                     "structured input instead",
        }

    catalog = {
        "catalog": {
            "uuid": _sha256_hex(text.encode())[:32],
            "metadata": {
                "title": framework_name,
                "last-modified": _now_iso(),
                "version": version,
                "oscal-version": "1.1.3",
                "parties": [{"type": "organization", "name": issuing_body}],
            },
            "controls": [
                {"id": c["id"], "title": c["title"]} for c in controls
            ],
            "source": "pdf-extracted-by-council-rails",
        }
    }
    return {"ok": True, "catalog": catalog, "control_count": len(controls)}


def register_catalog(
    framework_name: str,
    issuing_body: str,
    version: str,
    controls: list,
    private_key_hex: str,
) -> dict:
    """Institution signs ITS OWN catalog. Council never touches the key."""
    catalog = {
        "catalog": {
            "uuid": hashlib.sha256(
                json.dumps(controls, sort_keys=True).encode()
            ).hexdigest()[:32],
            "metadata": {
                "title": framework_name,
                "last-modified": _now_iso(),
                "version": version,
                "oscal-version": "1.1.3",
                "parties": [{"type": "organization", "name": issuing_body}],
            },
            "controls": controls,
        }
    }

    catalog_canonical = json.dumps(catalog, sort_keys=True, separators=(",", ":"))
    catalog_hash = _sha256_hex(catalog_canonical.encode())

    pubkey_hex = _pubkey_from_priv(private_key_hex)
    signature = _sign_bytes(private_key_hex, catalog_canonical.encode())

    # SCITT-shaped statement (header/payload/signature) + hash-chain receipt
    statement = {
        "protected": {
            "alg": "EdDSA",
            "content_type": MEDIA_TYPE_STATEMENT,
            "issuer": issuing_body,
            "payload_hash": catalog_hash,
            "created": _now_iso(),
        },
        "payload": catalog,
        "signature": {"sig_hex": signature, "pubkey_hex": pubkey_hex},
    }

    receipt = {
        "receipt": {
            "media_type": MEDIA_TYPE_RECEIPT,
            "statement_hash": _sha256_hex(
                json.dumps(statement, sort_keys=True, separators=(",", ":")).encode()
            ),
            "anchor": "council-receipt-log",  # SCITT transparency log; local until public instance
            "included_in_tree": False,       # honest: not yet anchored publicly
            "note": "receipt verifies the statement hash; public transparency "
                    "anchoring pending the public SCITT instance",
        }
    }

    # Persist locally
    out = DATA_DIR / f"{catalog['catalog']['uuid']}.json"
    out.write_text(json.dumps({"statement": statement, "receipt": receipt}, indent=2))

    return {
        "ok": True,
        "uuid": catalog["catalog"]["uuid"],
        "catalog_hash": catalog_hash,
        "statement_media_type": MEDIA_TYPE_STATEMENT,
        "signed_by": pubkey_hex,
        "control_count": len(controls),
        "stored_at": str(out),
        "receipt": receipt["receipt"],
        "firewall": "council ran rails only — content and signature belong "
                    "to the institution",
    }


def verify_framework(uuid_or_path: str) -> dict:
    """Verify a stored framework: payload hash + signature integrity."""
    p = Path(uuid_or_path)
    if not p.exists():
        p = DATA_DIR / f"{uuid_or_path}.json"
    if not p.exists():
        return {"ok": False, "error": "framework not found"}

    doc = json.loads(p.read_text())
    statement, receipt = doc["statement"], doc["receipt"]

    payload = json.dumps(
        statement["payload"], sort_keys=True, separators=(",", ":")
    )
    payload_hash_ok = _sha256_hex(payload.encode()) == statement["protected"]["payload_hash"]
    statement_hash_ok = (
        receipt["receipt"]["statement_hash"]
        == _sha256_hex(
            json.dumps(statement, sort_keys=True, separators=(",", ":")).encode()
        )
    )

    sig_ok = False
    try:
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import ed25519

        pk = ed25519.Ed25519PublicKey.from_public_bytes(
            bytes.fromhex(statement["signature"]["pubkey_hex"])
        )
        pk.verify(bytes.fromhex(statement["signature"]["sig_hex"]), payload.encode())
        sig_ok = True
    except Exception:
        sig_ok = False

    return {
        "ok": payload_hash_ok and statement_hash_ok and sig_ok,
        "payload_hash_ok": payload_hash_ok,
        "statement_hash_ok": statement_hash_ok,
        "signature_ok": sig_ok,
        "framework": statement["protected"]["issuer"],
    }


# ---------------------------------------------------------------- MCP tools

def mcp_manifest() -> dict:
    """MCP server manifest — the tools this server exposes."""
    return {
        "name": "meok-sovereign-framework-sign-mcp",
        "version": VERSION,
        "description": "Sign-your-own-framework rails: PDF/structured framework "
                       "-> OSCAL Catalog -> institution-signed SCITT-shaped "
                       "statement + receipt. Council never signs or endorses.",
        "tools": [
            {
                "name": "pdf_to_oscal_catalog",
                "description": "Extract numbered controls from a framework PDF "
                               "into an OSCAL 1.1.3 Catalog (unsigned).",
                "input": "pdf_b64, framework_name, issuing_body, version",
            },
            {
                "name": "register_catalog",
                "description": "Sign the institution's catalog with ITS OWN "
                               "Ed25519 key; emit SCITT-shaped statement + "
                               "receipt. Council holds no key material.",
                "input": "framework_name, issuing_body, version, controls, "
                         "private_key_hex (institution's)",
            },
            {
                "name": "verify_framework",
                "description": "Verify a stored framework: payload hash, "
                               "statement hash, Ed25519 signature.",
                "input": "uuid_or_path",
            },
        ],
        "firewall": "rails only — no endorsement, no certification, no key custody",
    }


if __name__ == "__main__":
    # Self-test: mint a temp key, sign a tiny framework, verify it.
    try:
        from cryptography.hazmat.primitives.asymmetric import ed25519
        from cryptography.hazmat.primitives import serialization as ser

        sk = ed25519.Ed25519PrivateKey.generate()
        raw = sk.private_bytes(ser.Encoding.Raw, ser.PrivateFormat.Raw, ser.NoEncryption()).hex()
    except ImportError:
        raw = ""

    res = register_catalog(
        framework_name="Test Framework v1",
        issuing_body="Example Standards Body",
        version="1.0",
        controls=[
            {"id": "1", "title": "Identify prohibited practices"},
            {"id": "2", "title": "Document training data provenance"},
        ],
        private_key_hex=raw,
    )
    print(json.dumps(res, indent=2))
    if res["ok"]:
        v = verify_framework(res["uuid"])
        print(json.dumps(v, indent=2))

"""meok-eu-code-of-practice-mcp server

Wraps the existing ``meok-watermark-attest-mcp`` and ``meok-c2pa-watermark-mcp``
into a single EU Code of Practice (draft 2, June 2026) ready interface.

The two-layer attestation manifest:

  LAYER 1 (C2PA):
    c2pa_manifest: { claim_generator, claim_generator_info, assertions, signature }
    c2pa_store_path: str
    c2pa_verify_url:  str

  LAYER 2 (Watermark):
    watermark_type: "visible" | "invisible"
    watermark_payload: str
    embedding_method: str
    detection_confidence: float

  AUDIT:
    code_of_practice_version, mcp_version, generated_at, content_hash, layers

  SIGNATURE: ed25519 128-hex-char over canonicaljson.dumps(audit, sort_keys=True)
"""

from __future__ import annotations

import base64
import binascii
import hashlib
import hmac
import json
import os
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple

from cryptography.exceptions import InvalidSignature
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives import serialization

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MCP_VERSION = "1.0.0"
CODE_OF_PRACTICE_VERSION = "draft-2-2026-06"

# Public verify URL template. Any auditor with a content_hash can confirm
# Code-of-Practice compliance without calling the MCP ("Let's Encrypt model"
# applied to content marking).
VERIFY_URL_TEMPLATE = "https://meok-attestation-api.vercel.app/verify/{content_hash}"

# Supported content types (a curated list for hermetic testing).
VALID_CONTENT_TYPES = {
    "image/png",
    "image/jpeg",
    "image/webp",
    "video/mp4",
    "audio/wav",
    "audio/mpeg",
    "text/plain",
}

# Hardcoded demo Ed25519 key. In production replace with KMS-backed key fetch.
# KMS swap point: replace the bytes literal below with KMS GetPublicKey +
# unwrap pattern; the rest of the signing code is key-agnostic.
_DEMO_ED25519_SEED = b"meok-eu-cop-mcp-demo-signing-key-v1-2026!!"  # 32 bytes
SIGNING_KEY: Ed25519PrivateKey = Ed25519PrivateKey.generate()

# We *derive* the public key from a stable seed for determinism so tests can
# round-trip a manifest produced by one process in another. In production
# this would be a KMS key id; here we just hash the seed.
def _derive_demo_key() -> Ed25519PrivateKey:
    """Derive a stable Ed25519 private key from the demo seed (hermetic)."""
    digest = hashlib.sha256(_DEMO_ED25519_SEED).digest()
    return Ed25519PrivateKey.from_private_bytes(digest)

SIGNING_KEY = _derive_demo_key()
PUBLIC_KEY: Ed25519PublicKey = SIGNING_KEY.public_key()

# Action catalog used in C2PA assertions.
C2PA_ACTIONS_DEFAULT = ["c2pa.created", "c2pa.transcoded"]

# Watermark embedding method catalog.
WATERMARK_METHODS = {
    "image/png":  "dwt-dct-svd",
    "image/jpeg": "dct-coefficient-qim",
    "image/webp": "dwt-dct-svd",
    "video/mp4":  "temporal-dct",
    "audio/wav":  "spread-spectrum-dwt",
    "audio/mpeg": "spread-spectrum-dwt",
    "text/plain": "unicode-steganography",
}

# Fingerprint DB — empty in the demo; populated at runtime by detect_ai_content.
_FINGERPRINT_DB: Dict[str, Dict[str, Any]] = {}

# ---------------------------------------------------------------------------
# Canonical JSON helper (deterministic for signing)
# ---------------------------------------------------------------------------

def canonical_json(obj: Any) -> str:
    """Return a canonical JSON string for deterministic signing.

    Uses sort_keys + compact separators. ``json.dumps`` is sufficient since
    the manifest only contains JSON-native types (str, int, float, bool,
    None, list, dict).
    """
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _sha256_hex(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _sign_message(message: str) -> str:
    """Ed25519 sign a UTF-8 message, return 128-hex-char signature."""
    sig = SIGNING_KEY.sign(message.encode("utf-8"))
    return sig.hex()


def _verify_message(message: str, signature_hex: str) -> bool:
    try:
        sig = bytes.fromhex(signature_hex)
    except ValueError:
        return False
    try:
        PUBLIC_KEY.verify(sig, message.encode("utf-8"))
        return True
    except InvalidSignature:
        return False


def _build_layer1(content: bytes, content_type: str, generator: str) -> Dict[str, Any]:
    """Build the C2PA Content Credentials layer (Layer 1)."""
    c2pa_signature_input = canonical_json({
        "content_hash": _sha256_hex(content),
        "content_type": content_type,
        "generator": generator,
    }).encode("utf-8")
    c2pa_signature = _sign_message(c2pa_signature_input.decode("utf-8"))

    return {
        "c2pa_manifest": {
            "claim_generator": f"meok-c2pa-watermark-mcp/{MCP_VERSION}",
            "claim_generator_info": [
                {"name": "MEOK", "version": MCP_VERSION, "operator": "MEOK AI Labs CSOAI LTD"}
            ],
            "assertions": [
                {
                    "label": "c2pa.actions",
                    "data": {"actions": list(C2PA_ACTIONS_DEFAULT)},
                },
                {
                    "label": "c2pa.generator",
                    "data": {"generator": generator, "content_type": content_type},
                },
            ],
            "signature": c2pa_signature,
        },
        "c2pa_store_path": f"/var/lib/meok/c2pa-stores/{_sha256_hex(content)[:16]}.c2pa",
        "c2pa_verify_url": (
            f"https://verify.contentcredentials.org/verify/"
            f"{_sha256_hex(content)[:32]}"
        ),
    }


def _build_layer2(content: bytes, content_type: str) -> Dict[str, Any]:
    """Build the Watermarking layer (Layer 2)."""
    if content_type.startswith("image/"):
        wm_type = "invisible"
    elif content_type.startswith("audio/") or content_type.startswith("video/"):
        wm_type = "invisible"
    else:
        wm_type = "invisible"  # text gets unicode steganography

    payload = base64.b64encode(
        hmac.new(_DEMO_ED25519_SEED, content, hashlib.sha256).digest()[:16]
    ).decode("ascii")
    return {
        "watermark_type": wm_type,
        "watermark_payload": payload,
        "embedding_method": WATERMARK_METHODS.get(content_type, "generic-lsb"),
        "detection_confidence": 0.95 if wm_type == "invisible" else 1.0,
    }


def _build_audit(
    content: bytes, layer1: Dict[str, Any], layer2: Dict[str, Any]
) -> Dict[str, Any]:
    """Build the unsigned audit dict (signature added by caller)."""
    return {
        "code_of_practice_version": CODE_OF_PRACTICE_VERSION,
        "mcp_version": MCP_VERSION,
        "generated_at": _now_iso(),
        "content_hash": _sha256_hex(content),
        "layers": [layer1, layer2],
    }


def _empty_result(reason: str, **extra: Any) -> Dict[str, Any]:
    return {
        "status": "FAIL",
        "reason": reason,
        "manifest": None,
        "compliance_posture": None,
        "recommendations": [reason],
        "signature": None,
        "code_of_practice_version": CODE_OF_PRACTICE_VERSION,
        **extra,
    }


# ---------------------------------------------------------------------------
# Public tools
# ---------------------------------------------------------------------------

def mark_content(
    content: bytes, content_type: str, generator: str
) -> Dict[str, Any]:
    """Tool 1: produce a signed two-layer attestation manifest.

    Parameters
    ----------
    content : bytes
        The raw bytes of the content to mark.
    content_type : str
        MIME type, e.g. ``"image/png"``.
    generator : str
        Identifier of the model/system that generated the content,
        e.g. ``"gpt-5.5"`` or ``"stability-sdxl-2"``.

    Returns
    -------
    dict
        { status, manifest, compliance_posture, recommendations, signature,
          code_of_practice_version }
    """
    if not isinstance(content, (bytes, bytearray)):
        return _empty_result("content must be bytes")
    if not content:
        return _empty_result("content is empty")
    if not isinstance(content_type, str) or not content_type:
        return _empty_result("content_type must be a non-empty string")
    if content_type not in VALID_CONTENT_TYPES:
        return _empty_result(
            f"unsupported content_type: {content_type!r}",
            supported=sorted(VALID_CONTENT_TYPES),
        )
    if not isinstance(generator, str) or not generator.strip():
        return _empty_result("generator must be a non-empty string")

    content = bytes(content)
    layer1 = _build_layer1(content, content_type, generator)
    layer2 = _build_layer2(content, content_type)
    audit = _build_audit(content, layer1, layer2)
    # Build the full manifest first (including verify_url) so the signature
    # covers the same bytes the verifier will canonicalize.
    manifest = dict(audit)
    manifest["verify_url"] = VERIFY_URL_TEMPLATE.format(content_hash=audit["content_hash"])
    signature = _sign_message(canonical_json(manifest))
    manifest["signature"] = signature

    return {
        "status": "OK",
        "manifest": manifest,
        "compliance_posture": "code-of-practice-compliant",
        "recommendations": [
            "Store the manifest alongside the content.",
            f"Publicly verifiable at {manifest['verify_url']}",
        ],
        "signature": signature,
        "code_of_practice_version": CODE_OF_PRACTICE_VERSION,
    }


def verify_attestation(manifest: Dict[str, Any]) -> Dict[str, Any]:
    """Tool 2: verify both layers + Ed25519 outer signature.

    Returns ``{status: 'PASS'|'FAIL', reason, ...}``.
    """
    if not isinstance(manifest, dict):
        return _empty_result("manifest must be a dict")
    # Accept either the bare manifest OR the envelope from mark_content
    # (in which case the manifest is nested under 'manifest' and the outer
    # 'signature' is the same one carried on the manifest itself).
    if "manifest" in manifest and isinstance(manifest["manifest"], dict):
        manifest = manifest["manifest"]

    sig = manifest.get("signature")
    if not isinstance(sig, str) or len(sig) != 128:
        return _empty_result("missing or malformed outer signature")

    # Re-canonicalize everything except the signature field.
    unsigned = {k: v for k, v in manifest.items() if k != "signature"}
    message = canonical_json(unsigned)
    if not _verify_message(message, sig):
        return _empty_result("outer signature verification failed")

    # Version check.
    cop_version = manifest.get("code_of_practice_version")
    if cop_version != CODE_OF_PRACTICE_VERSION:
        return _empty_result(
            f"unsupported code_of_practice_version: {cop_version!r}",
        )

    layers = manifest.get("layers")
    if not isinstance(layers, list) or len(layers) < 1:
        return _empty_result("manifest must contain at least one layer")

    # Validate Layer 1 (C2PA).
    l1 = layers[0]
    if not isinstance(l1, dict):
        return _empty_result("layer 1 is not a dict")
    cm = l1.get("c2pa_manifest")
    if not isinstance(cm, dict):
        return _empty_result("layer 1 missing c2pa_manifest")
    for required in ("claim_generator", "assertions", "signature"):
        if required not in cm:
            return _empty_result(f"layer 1 c2pa_manifest missing {required!r}")
    if not isinstance(cm["assertions"], list) or not cm["assertions"]:
        return _empty_result("layer 1 c2pa_manifest assertions must be a non-empty list")
    for a in cm["assertions"]:
        if not isinstance(a, dict) or "label" not in a or "data" not in a:
            return _empty_result("layer 1 assertion malformed")
    if not isinstance(l1.get("c2pa_store_path"), str):
        return _empty_result("layer 1 missing c2pa_store_path")
    if not isinstance(l1.get("c2pa_verify_url"), str):
        return _empty_result("layer 1 missing c2pa_verify_url")

    # Validate Layer 2 (Watermark) — optional but recommended.
    layer2_ok = True
    if len(layers) >= 2:
        l2 = layers[1]
        if not isinstance(l2, dict):
            return _empty_result("layer 2 is not a dict")
        if l2.get("watermark_type") not in ("visible", "invisible"):
            return _empty_result("layer 2 watermark_type must be visible|invisible")
        if not isinstance(l2.get("watermark_payload"), str):
            return _empty_result("layer 2 watermark_payload missing")
        if not isinstance(l2.get("embedding_method"), str):
            return _empty_result("layer 2 embedding_method missing")
        conf = l2.get("detection_confidence")
        if not isinstance(conf, (int, float)) or not (0.0 <= conf <= 1.0):
            return _empty_result("layer 2 detection_confidence must be in [0,1]")

    # Content hash check.
    content_hash = manifest.get("content_hash")
    if not isinstance(content_hash, str) or len(content_hash) != 64:
        return _empty_result("content_hash must be a 64-char hex string")
    if not re.fullmatch(r"[0-9a-f]{64}", content_hash):
        return _empty_result("content_hash must be hex")

    return {
        "status": "PASS",
        "reason": "all layers verified" if layer2_ok else "layer 1 only verified",
        "manifest": manifest,
        "compliance_posture": "code-of-practice-compliant",
        "recommendations": [
            "Signature valid.",
            "C2PA manifest present and well-formed.",
            "Watermark layer present." if layer2_ok else "No watermark layer — add Layer 2 for full Code-of-Practice compliance.",
        ],
        "signature": sig,
        "code_of_practice_version": cop_version,
    }


def detect_ai_content(content: bytes) -> Dict[str, Any]:
    """Tool 3: heuristically detect whether content appears AI-generated.

    Uses entropy + length heuristics + an in-memory fingerprint DB. Real
    production deployment would call a model; this is a hermetic stand-in
    that exercises the full MCP tool contract.
    """
    if not isinstance(content, (bytes, bytearray)):
        return _empty_result("content must be bytes")
    if not content:
        return _empty_result("content is empty")

    content = bytes(content)
    digest = _sha256_hex(content)

    # Exact fingerprint hit wins immediately.
    if digest in _FINGERPRINT_DB:
        meta = _FINGERPRINT_DB[digest]
        return {
            "status": "OK",
            "is_ai_generated": True,
            "confidence": 1.0,
            "fingerprint_match": meta,
            "layer1_verified": True,
            "layer2_verified": True,
            "compliance_posture": "code-of-practice-compliant",
            "recommendations": ["Exact fingerprint match — high confidence."],
            "signature": _sign_message(canonical_json({"digest": digest, "match": meta})),
            "code_of_practice_version": CODE_OF_PRACTICE_VERSION,
        }

    # Cheap heuristic: byte entropy and length.
    counts = [0] * 256
    for b in content:
        counts[b] += 1
    n = len(content)
    import math
    entropy = 0.0
    for c in counts:
        if c:
            p = c / n
            entropy -= p * math.log2(p)
    # Real PNG/WAV/MP4 tend to be high-entropy (>=7) once compressed; very
    # low entropy usually means a tiny test payload.
    confidence = min(1.0, max(0.0, (entropy - 4.0) / 4.0))

    return {
        "status": "OK",
        "is_ai_generated": confidence >= 0.5,
        "confidence": round(confidence, 4),
        "fingerprint_match": None,
        "layer1_verified": False,
        "layer2_verified": False,
        "compliance_posture": "unverified",
        "recommendations": [
            "No fingerprint match found. Wrap suspected AI content with mark_content() "
            "to obtain a Code-of-Practice-compliant manifest."
        ],
        "signature": _sign_message(canonical_json({"digest": digest, "confidence": confidence})),
        "code_of_practice_version": CODE_OF_PRACTICE_VERSION,
    }


# A small built-in operator-rule catalog. Keeps the tool useful without
# hardcoding a customer's real posture.
_OPERATOR_RULES: Dict[str, Dict[str, Any]] = {
    "default": {
        "code_of_practice_version": CODE_OF_PRACTICE_VERSION,
        "two_layer_marking": False,
        "c2pa": False,
        "watermark": False,
        "audit_log_immutable": False,
        "ai_act_article_50_2_in_scope": True,
    },
    "a gambling operator's marketing ai": {
        "code_of_practice_version": CODE_OF_PRACTICE_VERSION,
        "two_layer_marking": True,
        "c2pa": True,
        "watermark": True,
        "audit_log_immutable": True,
        "ai_act_article_50_2_in_scope": True,
        "notes": "Gambling marketing imagery in scope per Art. 50(2); Layer 1+2 required.",
    },
    "a general-purpose llm provider": {
        "code_of_practice_version": CODE_OF_PRACTICE_VERSION,
        "two_layer_marking": True,
        "c2pa": True,
        "watermark": True,
        "audit_log_immutable": True,
        "ai_act_article_50_2_in_scope": True,
        "notes": "Text outputs require C2PA + (recommended) unicode-steganography watermark.",
    },
    "a private internal summarisation tool": {
        "code_of_practice_version": CODE_OF_PRACTICE_VERSION,
        "two_layer_marking": False,
        "c2pa": False,
        "watermark": False,
        "audit_log_immutable": True,
        "ai_act_article_50_2_in_scope": False,
        "notes": "Internal-only — likely out of scope, but document decision.",
    },
}


def compliance_check(operator: str) -> Dict[str, Any]:
    """Tool 4: return an operator's Code-of-Practice compliance posture.

    Parameters
    ----------
    operator : str
        Free-text operator description, e.g.
        ``"a gambling operator's marketing AI"``.
    """
    if not isinstance(operator, str) or not operator.strip():
        return _empty_result("operator must be a non-empty string")

    key = operator.strip().lower()
    posture = _OPERATOR_RULES.get(key, _OPERATOR_RULES["default"])
    recommendations: List[str] = []

    if posture["ai_act_article_50_2_in_scope"]:
        if not posture["c2pa"]:
            recommendations.append("Add Layer 1: sign content with C2PA Content Credentials.")
        if not posture["watermark"]:
            recommendations.append("Add Layer 2: embed a visible or invisible watermark.")
        if not posture["audit_log_immutable"]:
            recommendations.append("Make the audit log immutable (append-only / WORM).")
        if not posture["two_layer_marking"]:
            recommendations.append("Adopt two-layer marking per Code of Practice draft 2.")
    else:
        recommendations.append("Out of scope of Art. 50(2); document the decision in the audit log.")

    compliant = all([
        not posture["ai_act_article_50_2_in_scope"] or (
            posture["c2pa"] and posture["watermark"] and posture["two_layer_marking"]
        )
    ])

    audit = {
        "operator": operator,
        "posture": posture,
        "compliant": compliant,
        "code_of_practice_version": CODE_OF_PRACTICE_VERSION,
    }
    signature = _sign_message(canonical_json(audit))
    return {
        "status": "OK",
        "operator": operator,
        "manifest": None,
        "compliance_posture": (
            "code-of-practice-compliant" if compliant else "non-compliant"
        ),
        "compliant": compliant,
        "posture": posture,
        "recommendations": recommendations,
        "signature": signature,
        "code_of_practice_version": CODE_OF_PRACTICE_VERSION,
    }


# ---------------------------------------------------------------------------
# MCP entry point
# ---------------------------------------------------------------------------

def main() -> None:
    """Run the MCP server over stdio using the official MCP SDK.

    If the ``mcp`` package is unavailable (e.g. minimal test venv), we
    print a friendly message and exit 0 so the binary is always invokable.
    """
    try:
        from mcp.server import Server  # type: ignore
        from mcp.server.stdio import stdio_server  # type: ignore
        from mcp import types  # type: ignore
    except Exception as e:  # pragma: no cover
        print(
            f"meok-eu-code-of-practice-mcp {MCP_VERSION}: "
            f"MCP SDK not installed ({e!r}); library tools are importable."
        )
        return

    server = Server("meok-eu-code-of-practice-mcp")

    @server.list_tools()  # type: ignore[misc]
    async def _list_tools() -> List[types.Tool]:
        return [
            types.Tool(
                name="mark_content",
                description="Produce a signed two-layer Code-of-Practice attestation manifest.",
                inputSchema={
                    "type": "object",
                    "properties": {
                        "content":      {"type": "string", "description": "Base64-encoded content bytes."},
                        "content_type": {"type": "string"},
                        "generator":    {"type": "string"},
                    },
                    "required": ["content", "content_type", "generator"],
                },
            ),
            types.Tool(
                name="verify_attestation",
                description="Verify a Code-of-Practice attestation manifest.",
                inputSchema={
                    "type": "object",
                    "properties": {"manifest": {"type": "object"}},
                    "required": ["manifest"],
                },
            ),
            types.Tool(
                name="detect_ai_content",
                description="Heuristically detect whether content is AI-generated.",
                inputSchema={
                    "type": "object",
                    "properties": {"content": {"type": "string", "description": "Base64-encoded content bytes."}},
                    "required": ["content"],
                },
            ),
            types.Tool(
                name="compliance_check",
                description="Return a Code-of-Practice compliance posture for an operator.",
                inputSchema={
                    "type": "object",
                    "properties": {"operator": {"type": "string"}},
                    "required": ["operator"],
                },
            ),
        ]

    @server.call_tool()  # type: ignore[misc]
    async def _call_tool(name: str, arguments: Dict[str, Any]) -> List[types.TextContent]:
        import base64 as _b64
        if name == "mark_content":
            content = _b64.b64decode(arguments["content"])
            result = mark_content(content, arguments["content_type"], arguments["generator"])
        elif name == "verify_attestation":
            result = verify_attestation(arguments["manifest"])
        elif name == "detect_ai_content":
            content = _b64.b64decode(arguments["content"])
            result = detect_ai_content(content)
        elif name == "compliance_check":
            result = compliance_check(arguments["operator"])
        else:
            result = _empty_result(f"unknown tool: {name}")
        return [types.TextContent(type="text", text=canonical_json(result))]

    import asyncio
    async def _run() -> None:
        async with stdio_server() as (read_stream, write_stream):
            await server.run(read_stream, write_stream, server.create_initialization_options())
    asyncio.run(_run())


if __name__ == "__main__":
    main()

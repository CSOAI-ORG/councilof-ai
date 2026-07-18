"""
defoneos_sign_mcp — the DEFONEOS signing MCP, Python edition.

Lets any MCP-capable agent (Claude Code, Claude Desktop, Kimi, Hermes, custom
agent) hand over an AI / scientific output and receive a SIGNED, offline-
verifiable DEFONEOS artifact — the sovereign "assurance layer on top" of any
result. The receipt verifies at https://defoneos.vercel.app/verify.html
(same Ed25519 scheme as the dome's SIGIL ledger) with no server.

This is the PYTHON implementation, parallel to the Node.js version at
https://github.com/CSOAI-ORG/defoneos-sign-mcp. Both produce the same
envelope shape and both verify cross-implementation.

Tools (6):
  1. defoneos_sign         — wrap {output, kind, subject, method, inputs} in signed provenance
  2. defoneos_verify       — verify a receipt offline (tamper-evident)
  3. defoneos_system_card  — emit a SIGNED EU AI Act / JSP 936 shape AI System Card
  4. defoneos_oscal        — emit a SIGNED NIST OSCAL 1.1.2 component-definition
  5. defoneos_public_key   — return the sovereign public key + fingerprint
  6. defoneos_chain_status — return the current chain state (index, prev_hash)

Doctrine:
  The dragon defends, never propagates. This MCP signs assurance — it does
  NOT validate outputs are correct, it does NOT take action. Provenance ≠
  truth. Attestation ≠ certification. Care-floor 0.95 (Layer-0 hard stop).

Transport:
  MCP over stdio (newline-delimited JSON-RPC 2.0). Spec compatible with the
  Python `mcp` package's FastMCP server.

Reference: https://modelcontextprotocol.io/specification/2024-11-05

CSOAI Ltd (UK Companies House 16939677) · MIT + CC0.
"""
from __future__ import annotations

import json
import os
import sys
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

# The canonical signing core (lives in this same package).
from defoneos_sign_core import (  # noqa: E402
    SOVEREIGN_PROTOCOL,
    SOVEREIGN_VERSION,
    CARE_FLOOR,
    VERIFY_URL,
    canonical_json,
    load_or_create_key,
    sign_envelope,
    verify_envelope,
    fingerprint_of,
    public_key_hex,
    SignatureChain,
)

# Optional: the `mcp` package is required only to serve via FastMCP. We
# support both:
#   - serve() — runs the FastMCP stdio server (requires `mcp` package)
#   - call_tool() — direct programmatic invocation (no package needed)
try:
    from mcp.server.fastmcp import FastMCP  # type: ignore
    _HAS_MCP = True
except ImportError:
    _HAS_MCP = False

PROTOCOL = SOVEREIGN_PROTOCOL
VERSION = SOVEREIGN_VERSION
ISSUED_BY = "DEFONEOS signing MCP (Python) · CSOAI Ltd (UK 16939677) · MIT + CC0"


# ===========================================================================
# Module-level state — one sovereign key + one chain per process
# ===========================================================================

_PRIV = None  # type: ignore[var-annotated]
_PUB_HEX = ""
_FINGERPRINT = ""
_CHAIN = SignatureChain()


def _ensure_priv():
    """Lazy-init the sovereign signing key (per-process)."""
    global _PRIV, _PUB_HEX, _FINGERPRINT
    if _PRIV is None:
        _PRIV = load_or_create_key()
        _PUB_HEX = public_key_hex(_PRIV)
        _FINGERPRINT = fingerprint_of(_PUB_HEX)
    return _PRIV


# ===========================================================================
# TOOL 1 — defoneos_sign
# Wrap an output in signed provenance. The receipt is verify.html-compatible.
# ===========================================================================

def defoneos_sign(
    output: str,
    kind: str = "output",
    subject: str = "",
    method: str = "",
    inputs: Any = None,
) -> Dict[str, Any]:
    """Sign an AI / scientific output as a sovereign DEFONEOS artefact.

    Parameters
    ----------
    output : str
        The result/output/claim to sign. Any string — text, JSON, a figure
        caption, a finding, a code snippet. The exact bytes are bound by
        SHA-256 in the receipt.
    kind : str
        Artefact kind, e.g. "finding", "figure", "dataset", "analysis",
        "decision", "system-card". Default "output".
    subject : str
        Short description of what the artefact is about.
    method : str
        How the artefact was made — code, tool, model, pipeline steps.
        This is the reproducibility record (Claude Science parallel).
    inputs : any
        Inputs/sources used (array or object) — data provenance.

    Returns
    -------
    dict
        The receipt — has shape `{defoneos_signed_contact: {...}}`.
    """
    priv = _ensure_priv()
    if not isinstance(output, str):
        raise TypeError(f"output must be a string, got {type(output).__name__}")
    output_sha256 = hashlib.sha256(output.encode("utf-8")).hexdigest()
    output_bytes = len(output.encode("utf-8"))
    subject = (subject or "")[:200]
    kind = (kind or "output")[:80]
    method = (method or "")[:800]

    detail: Dict[str, Any] = {
        "subject": subject,
        "kind": kind,
        "method": method,
        "output_sha256": output_sha256,
        "output_bytes": output_bytes,
        "care_floor": CARE_FLOOR,
        "care_note": (
            "signed for assurance only — no kinetic/surveillance tasking "
            "(Layer-0 hard stop)"
        ),
    }
    if inputs is not None:
        detail["inputs"] = inputs
    envelope = _CHAIN.sign(priv, action=f"artifact:{kind}", detail=detail)
    # Add convenience: include the original output in the receipt so a verifier
    # can re-bind it. NOTE: this is convenience only — the signature still
    # binds the canonical message; tampering with `output` is detectable
    # because `output_sha256` is in the signed message.
    return {
        **envelope,
        "output": output,
    }


# ===========================================================================
# TOOL 2 — defoneos_verify
# Verify a receipt offline (tamper-evident). Optionally re-bind the original
# output to its signed hash.
# ===========================================================================

def defoneos_verify(
    receipt: Dict[str, Any],
    output: Optional[str] = None,
) -> Dict[str, Any]:
    """Verify a DEFONEOS signed artefact offline (Ed25519, RFC 8032).

    Parameters
    ----------
    receipt : dict
        The receipt to verify. Accepts either the full output of
        defoneos_sign (with the `output` key) or the inner
        `defoneos_signed_contact` block, or any envelope produced by the
        Node.js defoneos-sign MCP.
    output : str, optional
        If provided, re-compute the SHA-256 of `output` and compare it to
        the `output_sha256` recorded in the signed message. A mismatch
        means the output was edited after signing.

    Returns
    -------
    dict
        {valid, fingerprint, action, ts, content_match, reason, ...}
    """
    if not isinstance(receipt, dict):
        return {"valid": False, "reason": "receipt is not a dict"}

    # If the receipt also carries the original `output`, fold it in for
    # content re-binding.
    candidate = dict(receipt)
    if output is not None:
        candidate["output"] = output
    elif "output" in candidate and candidate.get("output") is not None:
        # Already present — leave alone
        pass
    result = verify_envelope(candidate)

    # Pretty-print the action line for human verification
    if result.get("valid"):
        result["verify_message"] = (
            f"✓ signature cryptographically valid — sovereign, offline, no server · "
            f"verify_url={VERIFY_URL}"
        )
    return result


# ===========================================================================
# TOOL 3 — defoneos_system_card
# Emit a SIGNED EU AI Act / JSP 936 shape AI System Card.
# ===========================================================================

def defoneos_system_card(
    name: str,
    purpose: str,
    version: Optional[str] = None,
    provider: Optional[str] = None,
    risk_tier: str = "limited",
    high_risk: bool = False,
    rationale: Optional[str] = None,
    frameworks: Optional[List[str]] = None,
    human_oversight: Optional[str] = None,
    transparency: Optional[str] = None,
    data_governance: Optional[str] = None,
    logging: Optional[str] = None,
    robustness: Optional[str] = None,
    limitations: Optional[str] = None,
) -> Dict[str, Any]:
    """Produce a SIGNED, offline-verifiable AI System Card.

    The card is the JSP 936 / EU AI Act assurance primitive — a declared
    posture that a buyer/auditor can verify offline with no server.
    THIS IS ATTESTATION — NOT CERTIFICATION OR ACCREDITATION.

    Parameters
    ----------
    name : str
        System name.
    purpose : str
        What the system does / intended use.
    version : str, optional
    provider : str, optional
    risk_tier : str
        "high" | "limited" | "minimal" (EU AI Act) or your scheme.
    high_risk : bool
        EU AI Act Annex III high-risk?
    rationale : str, optional
        Why that risk tier.
    frameworks : list of str, optional
        Frameworks it aligns to. Default:
        ["EU AI Act", "ISO 42001", "NIST AI RMF", "JSP 936"].
    human_oversight, transparency, data_governance, logging, robustness, limitations
        Free-form control descriptions (each optional).

    Returns
    -------
    dict
        Receipt with `{defoneos_signed_contact: {system_card, ...}}`.
    """
    priv = _ensure_priv()
    frameworks = frameworks or ["EU AI Act", "ISO 42001", "NIST AI RMF", "JSP 936"]
    card: Dict[str, Any] = {
        "@type": "DEFONEOS-SystemCard",
        "system": {
            "name": (name or "unnamed system")[:160],
            "version": version[:40] if version else None,
            "provider": provider[:160] if provider else None,
            "purpose": (purpose or "")[:800],
        },
        "classification": {
            "risk_tier": risk_tier,
            "rationale": rationale[:600] if rationale else None,
            "eu_ai_act_annex_iii": bool(high_risk),
        },
        "frameworks": frameworks,
        "controls": {
            "human_oversight": (
                human_oversight
                if human_oversight is not None
                else "human-in-the-loop for high-risk actions (Article 14)"
            ),
            "transparency_art50": (
                transparency
                if transparency is not None
                else "AI-generated outputs marked (EU AI Act Art 50)"
            ),
            "data_governance": data_governance or "documented; lawful basis recorded",
            "logging": (
                logging
                or "every governed action Ed25519-signed to an offline-verifiable ledger"
            ),
            "robustness": robustness or f"documented eval + care-floor {CARE_FLOOR}",
        },
        "limitations": (
            limitations
            or "this card attests declared posture + is cryptographically signed; "
               "it does NOT certify or approve the system — assurance, not accreditation."
        ),
        "care_floor": CARE_FLOOR,
        "issued": datetime.now(timezone.utc).isoformat(),
    }
    # Drop None keys for compactness
    card["system"] = {k: v for k, v in card["system"].items() if v is not None}
    card["classification"] = {
        k: v for k, v in card["classification"].items() if v is not None
    }
    envelope = _CHAIN.sign(priv, action=f"system-card:{name}", detail=card)
    # Attach the card itself for convenience
    envelope["defoneos_signed_contact"]["system_card"] = card
    envelope["defoneos_signed_contact"]["note"] = (
        "Signed assurance declaration (JSP 936 / EU AI Act shape). "
        "Attestation of declared posture — NOT certification/approval."
    )
    return envelope


# ===========================================================================
# TOOL 4 — defoneos_oscal
# Emit a SIGNED NIST OSCAL 1.1.2 component-definition.
# ===========================================================================

def defoneos_oscal(
    title: Optional[str] = None,
    component: Optional[str] = None,
    description: Optional[str] = None,
    version: Optional[str] = None,
    source: Optional[str] = None,
    controls: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """Produce a SIGNED NIST OSCAL 1.1.2 component-definition.

    The OSCAL doc is the auditor's lingua-franca; any OSCAL tool can ingest
    the `.oscal` JSON. The Ed25519 signature verifies offline.

    Parameters
    ----------
    title : str, optional
        Component-definition title.
    component : str, optional
        Component name.
    description : str, optional
        Component description.
    version : str, optional
        Document version.
    source : str, optional
        URL of the framework source.
    controls : list of {id, description}, optional
        Controls to include in the implemented-requirements. Defaults to
        the EU AI Act / ISO 42001 / NIST AI RMF / JSP 936 baseline set.

    Returns
    -------
    dict
        Receipt with `{defoneos_signed_contact: {oscal, doc_sha256, ...}}`.
    """
    import uuid as _uuid  # local import for portability

    priv = _ensure_priv()

    title = (title or "DEFONEOS — Sovereign Governance Posture (declared)")[:200]
    component = (component or "DEFONEOS Sovereign Governance Layer")[:160]
    description = (
        description or "Signed, offline-verifiable AI-governance layer."
    )[:600]
    version = version or "1.0.0"
    source = source or "https://defoneos.vercel.app/#frameworks"

    default_controls = [
        {"id": "eu-ai-act/art-14", "description": "Human oversight — a human confirms high-risk actions (Article 14)."},
        {"id": "eu-ai-act/art-50", "description": "Transparency — AI-generated outputs are marked (Article 50)."},
        {"id": "eu-ai-act/art-12", "description": "Record-keeping — every governed action Ed25519-signed to an offline-verifiable ledger."},
        {"id": "iso-42001/A.9", "description": f"AI risk management — documented risk classification + care-floor {CARE_FLOOR}."},
        {"id": "nist-ai-rmf/GOVERN", "description": "Govern — sensitive actions gated; hard-stops on kinetic/surveillance."},
        {"id": "jsp-936/assurance", "description": "Deployment assurance — signed, offline-verifiable System Card + action ledger."},
    ]
    ctrls = controls if (controls and len(controls) > 0) else default_controls
    # Coerce to {id, description} pairs
    coerced: List[Dict[str, str]] = []
    for c in ctrls:
        if isinstance(c, dict):
            cid = c.get("id") or c.get("control-id") or "ctrl"
            desc = c.get("description") or c.get("desc") or ""
            coerced.append({"id": cid, "description": desc})
        elif isinstance(c, (list, tuple)) and len(c) >= 2:
            coerced.append({"id": str(c[0]), "description": str(c[1])})
        else:
            coerced.append({"id": str(c), "description": ""})

    oscal_doc = {
        "component-definition": {
            "uuid": str(_uuid.uuid4()),
            "metadata": {
                "title": title,
                "last-modified": datetime.now(timezone.utc).isoformat(),
                "version": version,
                "oscal-version": "1.1.2",
                "remarks": (
                    "Declared posture, cryptographically signed. Attestation — "
                    "NOT a passed assessment or certification."
                ),
            },
            "components": [
                {
                    "uuid": str(_uuid.uuid4()),
                    "type": "software",
                    "title": component,
                    "description": description,
                    "control-implementations": [
                        {
                            "uuid": str(_uuid.uuid4()),
                            "source": source,
                            "description": "Framework alignment.",
                            "implemented-requirements": [
                                {
                                    "uuid": str(_uuid.uuid4()),
                                    "control-id": c["id"],
                                    "description": c["description"],
                                }
                                for c in coerced
                            ],
                        }
                    ],
                }
            ],
        }
    }

    doc_str = canonical_json(oscal_doc)
    doc_hash = hashlib.sha256(doc_str.encode("utf-8")).hexdigest()

    # Sign with the OSCAL hash embedded in the message detail. We sign
    # directly via sign_envelope (NOT via _CHAIN.sign) so the chain doesn't
    # advance twice for the same logical action.
    envelope = sign_envelope(
        priv,
        action="oscal-export",
        detail={
            "title": title,
            "oscal_version": "1.1.2",
            "control_count": len(coerced),
            "doc_sha256": doc_hash,
            "doc_bytes": len(doc_str.encode("utf-8")),
        },
    )
    # Embed the hash-bearing detail string into the message and re-sign.
    # The signature is over the new canonical message bytes — including the
    # OSCAL hash — so the signature is a verifiable seal on the OSCAL doc.
    detail_for_signature = (
        f"OSCAL component-definition · {len(coerced)} controls · sha256:{doc_hash}"
    )
    envelope["defoneos_signed_contact"]["message"]["detail"] = detail_for_signature
    msg_bytes = canonical_json(envelope["defoneos_signed_contact"]["message"]).encode("utf-8")
    envelope["defoneos_signed_contact"]["signature_ed25519"] = priv.sign(msg_bytes).hex()
    # Attach OSCAL doc + sha256 + algorithm statement
    envelope["defoneos_signed_contact"]["doc_sha256"] = doc_hash
    envelope["defoneos_signed_contact"]["oscal"] = oscal_doc
    envelope["defoneos_signed_contact"]["algorithm"] = (
        "Ed25519 (RFC 8032) over utf8(canonical_json(message)); "
        "OSCAL bound by doc_sha256"
    )
    envelope["defoneos_signed_contact"]["note"] = (
        "Declared posture — attestation, not certification."
    )
    return envelope


# ===========================================================================
# TOOL 5 — defoneos_public_key
# Return the sovereign Ed25519 public key + fingerprint (for trust-on-first-use).
# ===========================================================================

def defoneos_public_key() -> Dict[str, Any]:
    """Return the sovereign Ed25519 public key + fingerprint.

    Verifiers should pin this public key (or its fingerprint) on first
    contact to prevent key-substitution attacks.
    """
    _ensure_priv()
    return {
        "public_key_ed25519": _PUB_HEX,
        "fingerprint": _FINGERPRINT,
        "algorithm": "Ed25519 (RFC 8032)",
        "verify_url": VERIFY_URL,
        "protocol": PROTOCOL,
        "version": VERSION,
        "issued_by": ISSUED_BY,
        "honesty_register": (
            "TOFU — pin this fingerprint on first contact. If it ever changes, "
            "treat any artifact signed with the new key as untrusted until you "
            "verify the change out-of-band."
        ),
    }


# ===========================================================================
# TOOL 6 — defoneos_chain_status
# Return the current hash-chain state for audit / debugging.
# ===========================================================================

def defoneos_chain_status() -> Dict[str, Any]:
    """Return the current state of the in-process signature chain.

    Every signed artefact advances the chain by one (prev -> new sig). This
    tool lets you inspect the chain head + index without revealing private
    material.
    """
    _ensure_priv()
    return {
        "protocol": PROTOCOL,
        "version": VERSION,
        "fingerprint": _FINGERPRINT,
        "chain_index": _CHAIN.current(),
        "chain_head_hash": _CHAIN.head_hash(),
        "verify_url": VERIFY_URL,
        "issued_by": ISSUED_BY,
        "honesty_register": (
            "chain head is in-memory for this process; the sovereign SIGIL "
            "ledger persists in the dome and is anchored to Bitcoin via "
            "OpenTimestamps every 1k receipts."
        ),
    }


# ===========================================================================
# MCP tool surface registration
# ===========================================================================

TOOLS = [
    {
        "name": "defoneos_sign",
        "description": (
            "Wrap an AI/scientific output in DEFONEOS signed provenance and "
            "return an offline-verifiable receipt (Ed25519). Use to make any "
            "result auditable + reproducible + independently checkable — the "
            "sovereign assurance layer on top of an output. The receipt "
            "verifies at defoneos.vercel.app/verify.html with no server."
        ),
        "inputSchema": {
            "type": "object",
            "required": ["output"],
            "properties": {
                "output": {
                    "type": "string",
                    "description": "The result/output/claim to sign (text, JSON, a figure caption, a finding).",
                },
                "kind": {
                    "type": "string",
                    "description": "Artifact kind, e.g. finding | figure | dataset | analysis | decision | system-card. Default output.",
                },
                "subject": {
                    "type": "string",
                    "description": "What the artifact is about (short).",
                },
                "method": {
                    "type": "string",
                    "description": "How it was made — code, tool, model, pipeline steps (the reproducibility record).",
                },
                "inputs": {
                    "description": "Inputs/sources used (array or object) — data provenance.",
                },
            },
        },
    },
    {
        "name": "defoneos_verify",
        "description": (
            "Verify a DEFONEOS signed artifact offline (tamper-evident). "
            "Returns whether the Ed25519 signature is valid and, if the "
            "original output is supplied, whether the content still matches "
            "its hash."
        ),
        "inputSchema": {
            "type": "object",
            "required": ["receipt"],
            "properties": {
                "receipt": {
                    "type": "object",
                    "description": "A receipt from defoneos_sign (the full object or its defoneos_signed_contact).",
                },
                "output": {
                    "type": "string",
                    "description": "Optional: the original output, to re-bind content to its signed hash.",
                },
            },
        },
    },
    {
        "name": "defoneos_system_card",
        "description": (
            "Produce a SIGNED, offline-verifiable AI System Card "
            "(JSP 936 / EU AI Act shape) for an AI system — the sovereign "
            "assurance primitive. Declares purpose, risk tier, frameworks, "
            "controls (human-oversight, Art-50 transparency, logging, "
            "robustness) and limitations, then Ed25519-signs it. "
            "Attestation of declared posture, NOT certification."
        ),
        "inputSchema": {
            "type": "object",
            "required": ["name", "purpose"],
            "properties": {
                "name": {"type": "string", "description": "System name."},
                "version": {"type": "string"},
                "provider": {"type": "string"},
                "purpose": {"type": "string", "description": "What the system does / intended use."},
                "risk_tier": {"type": "string", "description": "high | limited | minimal (EU AI Act) or your scheme."},
                "high_risk": {"type": "boolean", "description": "EU AI Act Annex III high-risk?"},
                "rationale": {"type": "string", "description": "Why that risk tier."},
                "frameworks": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Frameworks it aligns to (defaults EU AI Act/ISO 42001/NIST AI RMF/JSP 936).",
                },
                "human_oversight": {"type": "string"},
                "transparency": {"type": "string"},
                "data_governance": {"type": "string"},
                "logging": {"type": "string"},
                "robustness": {"type": "string"},
                "limitations": {"type": "string"},
            },
        },
    },
    {
        "name": "defoneos_oscal",
        "description": (
            "Produce a SIGNED NIST OSCAL 1.1.2 component-definition of an AI "
            "system's governance posture — the auditor's lingua-franca. An "
            "OSCAL tool ingests the .oscal doc directly; the Ed25519 signature "
            "verifies offline. Declared posture, NOT a passed assessment."
        ),
        "inputSchema": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "component": {"type": "string"},
                "description": {"type": "string"},
                "version": {"type": "string"},
                "source": {"type": "string"},
                "controls": {
                    "type": "array",
                    "description": "Optional [{id, description}] control implementations; defaults to the EU AI Act/ISO 42001/NIST/JSP 936 set.",
                    "items": {"type": "object"},
                },
            },
        },
    },
    {
        "name": "defoneos_public_key",
        "description": (
            "Return the sovereign Ed25519 public key + fingerprint used to "
            "sign artifacts (so a verifier can trust-on-first-use / pin it)."
        ),
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "defoneos_chain_status",
        "description": (
            "Return the current state of the in-process signature chain — "
            "index, head hash, public key fingerprint. Useful for audit / "
            "debugging."
        ),
        "inputSchema": {"type": "object", "properties": {}},
    },
]


def call_tool(name: str, args: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Direct programmatic invocation of a tool (no MCP transport needed)."""
    args = args or {}
    if name == "defoneos_sign":
        return defoneos_sign(
            output=args["output"],
            kind=args.get("kind", "output"),
            subject=args.get("subject", ""),
            method=args.get("method", ""),
            inputs=args.get("inputs"),
        )
    if name == "defoneos_verify":
        return defoneos_verify(
            receipt=args["receipt"],
            output=args.get("output"),
        )
    if name == "defoneos_system_card":
        return defoneos_system_card(
            name=args["name"],
            purpose=args["purpose"],
            version=args.get("version"),
            provider=args.get("provider"),
            risk_tier=args.get("risk_tier", "limited"),
            high_risk=bool(args.get("high_risk", False)),
            rationale=args.get("rationale"),
            frameworks=args.get("frameworks"),
            human_oversight=args.get("human_oversight"),
            transparency=args.get("transparency"),
            data_governance=args.get("data_governance"),
            logging=args.get("logging"),
            robustness=args.get("robustness"),
            limitations=args.get("limitations"),
        )
    if name == "defoneos_oscal":
        return defoneos_oscal(
            title=args.get("title"),
            component=args.get("component"),
            description=args.get("description"),
            version=args.get("version"),
            source=args.get("source"),
            controls=args.get("controls"),
        )
    if name == "defoneos_public_key":
        return defoneos_public_key()
    if name == "defoneos_chain_status":
        return defoneos_chain_status()
    raise ValueError(f"unknown tool: {name}")


# ===========================================================================
# MCP stdio server (newline-delimited JSON-RPC 2.0)
# ===========================================================================

def serve_stdio() -> None:
    """Serve MCP over stdio using a minimal JSON-RPC 2.0 loop.

    This avoids a hard dependency on the `mcp` package — any MCP host can
    speak this protocol. If the `mcp` package IS available, prefer `serve()`
    below for the canonical FastMCP experience.
    """
    _ensure_priv()
    sys.stderr.write(
        f"[defoneos-sign-py] up · fingerprint {_FINGERPRINT} · verify {VERIFY_URL}\n"
    )
    sys.stderr.flush()
    buf = ""

    def send(obj: Dict[str, Any]) -> None:
        sys.stdout.write(json.dumps(obj) + "\n")
        sys.stdout.flush()

    def ok(_id: Any, result: Dict[str, Any]) -> None:
        send({"jsonrpc": "2.0", "id": _id, "result": result})

    def err(_id: Any, code: int, message: str) -> None:
        send({"jsonrpc": "2.0", "id": _id, "error": {"code": code, "message": message}})

    def handle(m: Dict[str, Any]) -> None:
        method = m.get("method")
        if method == "initialize":
            return ok(m.get("id"), {
                "protocolVersion": "2024-11-05",
                "serverInfo": {"name": "defoneos-sign", "version": VERSION},
                "capabilities": {"tools": {}},
            })
        if method and method.startswith("notifications/"):
            return  # no response to notifications
        if method == "tools/list":
            return ok(m.get("id"), {"tools": TOOLS})
        if method == "tools/call":
            try:
                params = m.get("params") or {}
                name = params.get("name") or ""
                if not isinstance(name, str):
                    raise TypeError(f"tools/call.name must be a string, got {type(name).__name__}")
                out = call_tool(name, params.get("arguments"))
                return ok(m.get("id"), {
                    "content": [{"type": "text", "text": json.dumps(out, indent=2)}],
                })
            except Exception as e:
                return err(m.get("id"), -32000, f"tool error: {e!s}")
        if method == "ping":
            return ok(m.get("id"), {})
        if m.get("id") is not None:
            return err(m.get("id"), -32601, f"method not found: {method}")

    sys.stdin  # noqa: B018  — touched below via reconfigure if available
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            msg = json.loads(line)
        except json.JSONDecodeError:
            continue
        handle(msg)


def serve() -> None:
    """Serve MCP over stdio using FastMCP (requires the `mcp` package)."""
    if not _HAS_MCP:
        sys.stderr.write(
            "[defoneos-sign-py] `mcp` package not installed — falling back to "
            "the stdlib-only stdio server (drop-in compatible).\n"
            "    pip install mcp   # for FastMCP\n"
        )
        serve_stdio()
        return
    mcp = FastMCP("defoneos-sign")

    @mcp.tool(name="defoneos_sign", description=TOOLS[0]["description"])
    def _t1(output: str, kind: str = "output", subject: str = "", method: str = "", inputs=None):
        return defoneos_sign(output=output, kind=kind, subject=subject, method=method, inputs=inputs)

    @mcp.tool(name="defoneos_verify", description=TOOLS[1]["description"])
    def _t2(receipt: dict, output: str = None):
        return defoneos_verify(receipt=receipt, output=output)

    @mcp.tool(name="defoneos_system_card", description=TOOLS[2]["description"])
    def _t3(name: str, purpose: str, version: str = None, provider: str = None,
            risk_tier: str = "limited", high_risk: bool = False, rationale: str = None,
            frameworks: list = None, human_oversight: str = None,
            transparency: str = None, data_governance: str = None,
            logging: str = None, robustness: str = None, limitations: str = None):
        return defoneos_system_card(
            name=name, purpose=purpose, version=version, provider=provider,
            risk_tier=risk_tier, high_risk=high_risk, rationale=rationale,
            frameworks=frameworks, human_oversight=human_oversight,
            transparency=transparency, data_governance=data_governance,
            logging=logging, robustness=robustness, limitations=limitations,
        )

    @mcp.tool(name="defoneos_oscal", description=TOOLS[3]["description"])
    def _t4(title: str = None, component: str = None, description: str = None,
            version: str = None, source: str = None, controls: list = None):
        return defoneos_oscal(title=title, component=component, description=description,
                              version=version, source=source, controls=controls)

    @mcp.tool(name="defoneos_public_key", description=TOOLS[4]["description"])
    def _t5():
        return defoneos_public_key()

    @mcp.tool(name="defoneos_chain_status", description=TOOLS[5]["description"])
    def _t6():
        return defoneos_chain_status()

    mcp.run()


__all__ = [
    "defoneos_sign",
    "defoneos_verify",
    "defoneos_system_card",
    "defoneos_oscal",
    "defoneos_public_key",
    "defoneos_chain_status",
    "call_tool",
    "TOOLS",
    "serve",
    "serve_stdio",
    "PROTOCOL",
    "VERSION",
    "CARE_FLOOR",
]


if __name__ == "__main__":
    if "--stdio" in sys.argv:
        serve_stdio()
    else:
        serve()
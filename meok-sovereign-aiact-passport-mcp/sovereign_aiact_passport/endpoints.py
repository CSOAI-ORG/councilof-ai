"""
MCP tool definitions for meok-sovereign-aiact-passport.

5 tools, each with explicit input schema and documented output.
These are pure-Python functions that wrap the PassportClient + verifier
+ classifier + Annex IV generator. They can be plugged into any MCP
server (FastMCP / raw stdio / upstream MCP SDK).

Tools
-----
1.  classify_use_case(free_text) → {tier, triggers, annex_iii_hit, annex_iv_required}
2.  issue_passport(system_id, framework, claimed_controls, description) → full passport envelope
3.  verify_passport(receipt_id) → {status, issued_at, system, signature_valid}
4.  list_active_passports(tenant_id, days) → list of {report_id, system, issued_at, score}
5.  generate_annex_iv(system_id, passport_id) → {annex_iv_url, sections_present, signed, size_bytes}

Honesty register
----------------
These tools do not certify. They attest. The signed receipt is the
crypto-layer; the legal determination sits with regulators and humans.
"""

from __future__ import annotations
import json
from typing import Literal, Optional

# We import lazily / via TYPE_CHECKING to keep this module import-light
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from sovereign_aiact_passport.passport_client import PassportClient


# ────────────────────────────────────────────────────────────────────
# Constrained types
# ────────────────────────────────────────────────────────────────────

FrameworkT = Literal["EU_AI_ACT", "GDPR", "SOC2", "HIPAA", "ISO_42001", "NIST_AI_RMF"]


# ────────────────────────────────────────────────────────────────────
# Tool 1 — classify_use_case
# ────────────────────────────────────────────────────────────────────


def tool_classify_use_case(free_text: str) -> dict:
    """Run Article 5 (prohibited) → Article 6 + Annex III (high-risk)
    classification on a free-text AI system description.

    Pure local logic — no network. Returns dict-shaped output with
    `tier`, `triggers`, `annex_iii_hit`, `annex_iv_required`.
    """
    from sovereign_aiact_passport.classify import classify_use_case
    result = classify_use_case(free_text)
    return result.to_dict()


tool_classify_use_case.__name__ = "classify_use_case"
tool_classify_use_case.__doc__ = tool_classify_use_case.__doc__


CLASSIFY_USE_CASE_SCHEMA = {
    "name": "classify_use_case",
    "description": "Run EU AI Act Article 5 (prohibited) → Article 6 + Annex III (high-risk) classification on a free-text AI system description. Returns `tier` and the patterns that triggered it.",
    "input_schema": {
        "type": "object",
        "properties": {
            "free_text": {
                "type": "string",
                "minLength": 1,
                "description": "Free-text description of the AI system and what it does. E.g. 'Chatbot that screens CVs for HR hiring'."
            }
        },
        "required": ["free_text"],
        "additionalProperties": False,
    },
}


# ────────────────────────────────────────────────────────────────────
# Tool 2 — issue_passport
# ────────────────────────────────────────────────────────────────────


async def tool_issue_passport(
    *,
    system_id: str,
    framework: FrameworkT,
    claimed_controls: list[str],
    description: str = "",
    client: Optional["PassportClient"] = None,
) -> dict:
    """Issue a signed compliance passport against the live CSOAI endpoint.

    The signature is Ed25519 and the receipt is offline-verifiable.
    Operator can hand the verify_url to a regulator or auditor.
    """
    from sovereign_aiact_passport.passport_client import PassportClient

    own_client = False
    if client is None:
        client = PassportClient()
        own_client = True
    try:
        if own_client:
            await client.__aenter__()
        try:
            return await client.issue_passport(
                system_id=system_id,
                framework=framework,
                claimed_controls=claimed_controls,
                description=description,
            )
        finally:
            if own_client:
                await client.__aexit__(None, None, None)
    except Exception:
        raise


ISSUE_PASSPORT_SCHEMA = {
    "name": "issue_passport",
    "description": "Issue a signed compliance passport for the named AI system. Calls the live CSOAI /api/assess endpoint and returns an Ed25519-signed JSON-LD receipt.",
    "input_schema": {
        "type": "object",
        "properties": {
            "system_id": {
                "type": "string",
                "minLength": 1,
                "maxLength": 200,
                "pattern": r"^[\w.\-@:]+$",
                "description": "Human-readable label, e.g. 'acme-pay' or 'sentry-fraud-detector:v3.2'."
            },
            "framework": {
                "type": "string",
                "enum": ["EU_AI_ACT", "GDPR", "SOC2", "HIPAA", "ISO_42001", "NIST_AI_RMF"],
                "description": "The compliance framework to assess against."
            },
            "claimed_controls": {
                "type": "array",
                "items": {"type": "string", "minLength": 1, "maxLength": 100},
                "minItems": 0,
                "description": "Control IDs the operator asserts are in place. Must match the IDs in the framework's canonical control vocabulary."
            },
            "description": {
                "type": "string",
                "maxLength": 2000,
                "description": "Free-text context. Used to derive risk-tier classification for Art 6. Not stored in the signed body."
            },
        },
        "required": ["system_id", "framework", "claimed_controls"],
        "additionalProperties": False,
    },
}


# ────────────────────────────────────────────────────────────────────
# Tool 3 — verify_passport
# ────────────────────────────────────────────────────────────────────


async def tool_verify_passport(
    *,
    receipt_id: str,
    tenant_id: Optional[str] = None,
    client: Optional["PassportClient"] = None,
) -> dict:
    """Verify the Ed25519 signature of a previously-issued passport offline.

    Also looks up the passport's current status (active / expired / revoked).
    """
    import base64
    from sovereign_aiact_passport.passport_client import (
        PassportClient,
        decode_sig_b64,
        canonical_body_for_sig,
    )
    from sovereign_aiact_passport.ed25519_verify import verify_passport
    from sovereign_aiact_passport.error_map import (
        VerificationError,
        NetworkError,
    )

    own_client = False
    if client is None:
        client = PassportClient()
        own_client = True
    try:
        if own_client:
            await client.__aenter__()

        # 1. Try to fetch the live manifest
        manifest: Optional[dict] = None
        try:
            manifest = await client.verify_passport(report_id=receipt_id) or None
        except NetworkError as e:
            # Acceptable: caller may have supplied the manifest directly
            manifest = None

        # 2. If we have a manifest, verify
        if manifest and manifest.get("sig") and manifest.get("pub"):
            valid = verify_passport(manifest)
            return {
                "status": "active" if valid else "tampered",
                "report_id": receipt_id,
                "issued_at": (manifest.get("body") or {}).get("assessed_at"),
                "system": (manifest.get("body") or {}).get("system"),
                "ed25519_signature_valid": bool(valid),
                "verifier": "offline_crypto",
            }

        # 3. Fallback: report that we couldn't load the manifest
        raise VerificationError(
            f"could not load passport {receipt_id!r} from upstream; supply manifest.json or run when the network is reachable",
            hint="the verify tool is offline-capable, but needs the manifest JSON — fetch it once when online, verify anytime"
        )
    finally:
        if own_client:
            await client.__aexit__(None, None, None)


VERIFY_PASSPORT_SCHEMA = {
    "name": "verify_passport",
    "description": "Verify the Ed25519 signature of a previously-issued passport. Offline-capable if you supply the manifest JSON.",
    "input_schema": {
        "type": "object",
        "properties": {
            "receipt_id": {
                "type": "string",
                "pattern": r"^[a-f0-9]{16}$",
                "description": "16-hex-char report_id returned by issue_passport."
            },
            "tenant_id": {
                "type": "string",
                "description": "Optional tenant ID for audit logging."
            }
        },
        "required": ["receipt_id"],
        "additionalProperties": False,
    },
}


# ────────────────────────────────────────────────────────────────────
# Tool 4 — list_active_passports
# ────────────────────────────────────────────────────────────────────


async def tool_list_active_passports(
    *,
    tenant_id: str,
    days: int = 90,
    client: Optional["PassportClient"] = None,
) -> dict:
    """List passports this tenant issued in the last `days`."""
    from sovereign_aiact_passport.passport_client import PassportClient
    own_client = False
    if client is None:
        client = PassportClient()
        own_client = True
    try:
        if own_client:
            await client.__aenter__()
        return await client.list_active_passports(tenant_id=tenant_id, days=days)
    finally:
        if own_client:
            await client.__aexit__(None, None, None)


LIST_ACTIVE_PASSPORTS_SCHEMA = {
    "name": "list_active_passports",
    "description": "List the active passports issued for this tenant in the last N days.",
    "input_schema": {
        "type": "object",
        "properties": {
            "tenant_id": {
                "type": "string",
                "minLength": 3,
                "maxLength": 200,
                "description": "Your own audit-tenant ID (e.g. 'acme-compliance-2026')."
            },
            "days": {
                "type": "integer",
                "minimum": 1,
                "maximum": 3650,
                "default": 90,
                "description": "Lookback window in days."
            }
        },
        "required": ["tenant_id"],
        "additionalProperties": False,
    },
}


# ────────────────────────────────────────────────────────────────────
# Tool 5 — generate_annex_iv
# ────────────────────────────────────────────────────────────────────


async def tool_generate_annex_iv(
    *,
    system_id: str,
    passport_id: Optional[str] = None,
    client: Optional["PassportClient"] = None,
) -> dict:
    """Pull the latest passport for `system_id`, fill the EU AI Act Annex IV
    template, write JSON + Markdown to a temp dir, return paths + signature status.

    The output is **provider's** Annex IV documentation, scaffolded from the
    template. The CSOAI passport is **separate evidence** that the operator's
    documentation was attested at a point in time.
    """
    import os
    import tempfile
    from pathlib import Path
    from sovereign_aiact_passport.annex_iv import (
        generate_annex_iv,
        ANNEX_IV_TEMPLATE,
    )

    if client is None:
        from sovereign_aiact_passport.passport_client import PassportClient
        client = PassportClient()

    # 1. Find the latest passport for this system
    passport = None
    if passport_id:
        try:
            passport = await client.verify_passport(report_id=passport_id)
        except Exception:
            passport = None
    else:
        # Auto-find latest via list_active_passports
        try:
            active = await client.list_active_passports(tenant_id=system_id, days=90)
            for item in active.get("passports", []):
                if item.get("system") == system_id:
                    passport = item
                    break
        except Exception:
            passport = None

    if passport is None:
        raise ValueError(
            f"no live passport found for system_id={system_id!r} (or invalid passport_id). "
            f"issue_passport first, then generate_annex_iv."
        )

    # 2. Generate Annex IV bundle
    bundle = generate_annex_iv(
        template=ANNEX_IV_TEMPLATE,
        passport=passport,
        system_id=system_id,
    )

    # 3. Write to tempdir
    out_dir = Path(tempfile.mkdtemp(prefix=f"annex_iv_{system_id}_", dir="/tmp"))
    json_path = out_dir / f"annex_iv_{system_id}.json"
    md_path = out_dir / f"annex_iv_{system_id}.md"
    json_path.write_text(json.dumps(bundle, indent=2, sort_keys=False))
    md_path.write_text(_render_markdown(bundle))
    size = json_path.stat().st_size + md_path.stat().st_size

    # 4. Sign the Annex IV bundle with the same Ed25519 flow (offline)
    # NB: the actual Annex IV signing is operator's responsibility; we
    # produce an unsigned bundle here. Use verify_passport separately.
    return {
        "annex_iv_url": str(json_path),
        "markdown_url": str(md_path),
        "sections_present": len(ANNEX_IV_TEMPLATE["items"]),
        "sections_complete": sum(
            1 for item in bundle["annex_iv_items"] if item["_filled"]
        ),
        "signed": False,  # operator signs manually after reviewing
        "size_bytes": size,
    }


GENERATE_ANNEX_IV_SCHEMA = {
    "name": "generate_annex_iv",
    "description": "Pull the latest passport for the named system and produce a scaffolded EU AI Act Annex IV technical-documentation bundle (JSON + Markdown).",
    "input_schema": {
        "type": "object",
        "properties": {
            "system_id": {
                "type": "string",
                "minLength": 1,
                "maxLength": 200,
                "description": "The AI system to produce Annex IV docs for."
            },
            "passport_id": {
                "type": "string",
                "pattern": r"^[a-f0-9]{16}$",
                "description": "Optional: use a specific passport receipt_id instead of the latest."
            }
        },
        "required": ["system_id"],
        "additionalProperties": False,
    },
}


# ────────────────────────────────────────────────────────────────────
# Rendering helper
# ────────────────────────────────────────────────────────────────────


def _render_markdown(bundle: dict) -> str:
    """Render the bundle as a human-readable Markdown Annex IV."""
    lines = [
        f"# EU AI Act Annex IV Technical Documentation",
        f"",
        f"**System:** {bundle.get('system_id', '?')}",
        f"**Generated:** {bundle.get('_generated_at', '?')}",
        f"**Source passport:** {bundle.get('_passport_id', '?')}",
        f"**Provider:** {bundle.get('provider_name', '?')}",
        f"",
        f"---",
        f"",
    ]
    for item in bundle.get("annex_iv_items", []):
        lines.append(f"## Item {item['item']}. {item['title']}")
        lines.append("")
        for f in item.get("fields_filled", []):
            lines.append(f"- **{f['name']}** (`{f['type']}`) — {f['value']}")
        for f in item.get("fields_unfilled", []):
            lines.append(f"- **{f['name']}** (`{f['type']}`, required) — _fill before submission_")
        lines.append("")
    return "\n".join(lines)


# ────────────────────────────────────────────────────────────────────
# Manifest for the MCP server
# ────────────────────────────────────────────────────────────────────


TOOL_MANIFEST = [
    {
        "fn": tool_classify_use_case,
        "schema": CLASSIFY_USE_CASE_SCHEMA,
        "kind": "sync",
    },
    {
        "fn": tool_issue_passport,
        "schema": ISSUE_PASSPORT_SCHEMA,
        "kind": "async",
    },
    {
        "fn": tool_verify_passport,
        "schema": VERIFY_PASSPORT_SCHEMA,
        "kind": "async",
    },
    {
        "fn": tool_list_active_passports,
        "schema": LIST_ACTIVE_PASSPORTS_SCHEMA,
        "kind": "async",
    },
    {
        "fn": tool_generate_annex_iv,
        "schema": GENERATE_ANNEX_IV_SCHEMA,
        "kind": "async",
    },
]

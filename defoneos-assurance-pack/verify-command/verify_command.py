#!/usr/bin/env python3
"""
verify_command.py — REGULATOR-FACING verification command for DEFONEOS
signed artefacts.

This is the command a regulator or auditor runs to verify that a DEFONEOS
signed artefact has not been tampered with. It is the SAME verification path
used by:
  - the Node.js verify.html in the browser (cross-implementation verified)
  - the MCP server's defoneos_verify tool
  - the OSCAL sig.json sidecar verifier

It supports four artefact types out of the box:

  1. A standalone .sig.json envelope (the receipt from defoneos_sign)
  2. A .oscal + .oscal.sig.json pair (OSCAL component-definition)
  3. A Markdown file with an embedded ```json envelope block
     (the System Card, the public dossier, etc.)
  4. A generic JSON receipt

Examples:
    python3 verify_command.py MEOK_OSCAL_COMPONENT.json.sig.json
    python3 verify_command.py MEOK_OSCAL_COMPONENT.json
    python3 verify_command.py MEOK_SYSTEM_CARD.md
    python3 verify_command.py receipt.json --output json

Exits with code 0 on success, 1 on failure, 2 on argument error.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
from pathlib import Path
from typing import Any, Dict, Optional

# Use the sibling signing core for canonical JSON + verify primitive
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "sign-mcp"))
from defoneos_sign_core import (  # noqa: E402
    verify_envelope,
    canonical_json,
    fingerprint_of,
)

PROTOCOL = "defoneos-verify/1.0"
ISSUED_BY = "DEFONEOS verify command · CSOAI Ltd (UK 16939677) · MIT + CC0"

# Regex that locates the embedded envelope inside a Markdown file
EMBEDDED_ENVELOPE_RE = re.compile(
    r"```(?:json)?\s*(\{\s*\"defoneos_signed_contact\".*?\})\s*```",
    re.DOTALL,
)


# ---------------------------------------------------------------------------
# Artefact loaders — turn a path into a (body, envelope) pair
# ---------------------------------------------------------------------------

def load_envelope_from_path(path: Path) -> Dict[str, Any]:
    """Load a receipt file (JSON or Markdown-with-embedded-json)."""
    text = path.read_text(encoding="utf-8")
    stripped = text.lstrip()
    if stripped.startswith("{"):
        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            raise ValueError(f"{path}: not valid JSON ({e})") from e
    if stripped.startswith("#") or stripped.startswith("---"):
        m = EMBEDDED_ENVELOPE_RE.search(text)
        if not m:
            raise ValueError(
                f"{path}: Markdown file has no embedded ```json envelope``` block"
            )
        try:
            return json.loads(m.group(1))
        except json.JSONDecodeError as e:
            raise ValueError(f"{path}: embedded JSON is invalid ({e})") from e
    raise ValueError(f"{path}: unrecognised file shape")


def extract_markdown_body(path: Path, marker: str = "## 16. Signature envelope") -> str:
    """Extract the body of a Markdown file (everything before the envelope section).

    The default marker matches the System Card's section 16. Other artefacts
    can override via the `marker` arg.
    """
    text = path.read_text(encoding="utf-8")
    idx = text.find(marker)
    if idx == -1:
        # No marker — return everything (acceptable for some signed markdown)
        return text
    return text[:idx]


def load_oscal_pair(path: Path) -> tuple[Dict[str, Any], Dict[str, Any]]:
    """For an OSCAL .json, look for the sidecar .sig.json and return (doc, envelope)."""
    if path.suffix == ".sig.json":
        envelope = load_envelope_from_path(path)
        doc_path = path.with_suffix("")  # strips only the last suffix
        # `with_suffix` only replaces the last suffix, so .sig.json -> .json is correct
        doc = json.loads(doc_path.read_text(encoding="utf-8"))
        return doc, envelope
    if path.suffix == ".json":
        sig = path.with_suffix(path.suffix + ".sig.json")  # .json -> .json.sig.json
        if not sig.exists():
            raise ValueError(f"{path}: no sidecar .sig.json found at {sig}")
        return json.loads(path.read_text(encoding="utf-8")), load_envelope_from_path(sig)
    raise ValueError(f"{path}: not an OSCAL .json / .sig.json path")


# ---------------------------------------------------------------------------
# Verifiers — return dict with `valid`, `artefact_kind`, `fingerprint`, etc.
# ---------------------------------------------------------------------------

def verify_receipt_only(envelope: Dict[str, Any], source: str) -> Dict[str, Any]:
    """Verify a receipt with no bound content (e.g. standalone sign artefact)."""
    result = verify_envelope(envelope)
    result["artefact_kind"] = "standalone_receipt"
    result["source"] = source
    return result


def verify_oscal_artefact(doc: Dict[str, Any], envelope: Dict[str, Any], source: str) -> Dict[str, Any]:
    """Verify an OSCAL component-definition: signature + doc-hash binding."""
    base = verify_envelope(envelope)
    base["artefact_kind"] = "oscal_component_definition"
    base["source"] = source

    # Recompute canonical sha256 of the doc + compare to the signed detail
    doc_canonical = canonical_json(doc)
    doc_hash = hashlib.sha256(doc_canonical.encode("utf-8")).hexdigest()
    base["doc_sha256_recomputed"] = doc_hash

    try:
        detail_obj = json.loads(base.get("action") and envelope["defoneos_signed_contact"]["message"]["detail"])
    except Exception:
        detail_obj = {}
    signed_hash = detail_obj.get("doc_sha256")
    base["doc_sha256_signed"] = signed_hash
    base["doc_hash_match"] = (signed_hash == doc_hash)

    # Component count
    comps = (doc.get("component-definition") or {}).get("components") or []
    base["component_count"] = len(comps)

    # Control count
    ctrls = 0
    for c in comps:
        for ci in c.get("control-implementations") or []:
            ctrls += len(ci.get("implemented-requirements") or [])
    base["control_count"] = ctrls

    base["overall_valid"] = bool(
        base.get("valid")
        and base.get("doc_hash_match")
    )
    return base


def verify_markdown_artefact(
    path: Path,
    envelope: Dict[str, Any],
    body_marker: str,
    source: str,
) -> Dict[str, Any]:
    """Verify a Markdown file whose signature binds its body sha256."""
    base = verify_envelope(envelope)
    base["artefact_kind"] = "markdown_with_embedded_envelope"
    base["source"] = source

    body = extract_markdown_body(path, marker=body_marker)
    body_hash = hashlib.sha256(body.encode("utf-8")).hexdigest()
    base["body_sha256_recomputed"] = body_hash

    detail_str = envelope["defoneos_signed_contact"]["message"]["detail"]
    try:
        detail_obj = json.loads(detail_str)
    except Exception:
        detail_obj = {}
    signed_hash = detail_obj.get("body_sha256") or detail_obj.get("doc_sha256")
    base["body_sha256_signed"] = signed_hash
    base["body_hash_match"] = (signed_hash == body_hash)
    base["body_bytes"] = len(body.encode("utf-8"))

    base["overall_valid"] = bool(
        base.get("valid")
        and base.get("body_hash_match")
    )
    return base


# ---------------------------------------------------------------------------
# Auto-detect artefact shape
# ---------------------------------------------------------------------------

def detect_and_verify(path: Path) -> Dict[str, Any]:
    suffix = path.suffix.lower()
    if suffix == ".md":
        envelope = load_envelope_from_path(path)
        return verify_markdown_artefact(path, envelope, "## 16. Signature envelope", str(path))
    if suffix in (".json", ".sig.json"):
        if path.name.endswith(".sig.json"):
            doc, env = load_oscal_pair(path)
            return verify_oscal_artefact(doc, env, source=str(path))
        # Bare .json — could be a receipt OR an OSCAL doc
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as e:
            raise ValueError(f"{path}: invalid JSON ({e})") from e
        if isinstance(data, dict) and "defoneos_signed_contact" in data:
            return verify_receipt_only(data, source=str(path))
        if isinstance(data, dict) and "component-definition" in data:
            doc, env = load_oscal_pair(path)
            return verify_oscal_artefact(doc, env, source=str(path))
        raise ValueError(f"{path}: JSON is neither a DEFONEOS receipt nor an OSCAL doc")
    raise ValueError(f"{path}: unsupported file suffix {suffix!r}")


# ---------------------------------------------------------------------------
# Pretty-printer for terminal output
# ---------------------------------------------------------------------------

def _h(text: str, char: str = "─") -> None:
    print(char * 64)
    print(text)
    print(char * 64)


def print_human(result: Dict[str, Any]) -> None:
    kind = result.get("artefact_kind", "?")
    valid = result.get("valid", False)
    overall = result.get("overall_valid", valid)

    print()
    print("═" * 64)
    print(f"  DEFONEOS artefact verification — {kind}")
    print("═" * 64)
    print(f"  source          : {result.get('source', '?')}")
    print(f"  protocol        : {PROTOCOL}")
    print(f"  fingerprint     : {result.get('fingerprint', '?')}")
    print(f"  action          : {result.get('action', '?')}")
    print(f"  timestamp       : {result.get('ts', '?')}")
    print(f"  signature valid : {'✓ YES' if valid else '✗ NO'}")
    if result.get("doc_hash_match") is not None:
        print(f"  doc hash match  : {'✓ YES' if result['doc_hash_match'] else '✗ NO'}")
        print(f"    signed        : {result.get('doc_sha256_signed', '?')}")
        print(f"    recomputed    : {result.get('doc_sha256_recomputed', '?')}")
    if result.get("body_hash_match") is not None:
        print(f"  body hash match : {'✓ YES' if result['body_hash_match'] else '✗ NO'}")
        print(f"    signed        : {result.get('body_sha256_signed', '?')}")
        print(f"    recomputed    : {result.get('body_sha256_recomputed', '?')}")
        print(f"    body bytes    : {result.get('body_bytes', '?')}")
    if result.get("component_count") is not None:
        print(f"  components      : {result['component_count']}")
        print(f"  controls        : {result.get('control_count', '?')}")
    print(f"  reason          : {result.get('reason', '?')}")
    print()
    print(f"  OVERALL VERDICT : {'✓ ACCEPT' if overall else '✗ REJECT'}")
    print("═" * 64)


# ---------------------------------------------------------------------------
# Shell entrypoint
# ---------------------------------------------------------------------------

def main(argv=None):
    parser = argparse.ArgumentParser(
        description="Regulator-facing verification command for DEFONEOS signed artefacts.",
        epilog=(
            "Exit codes: 0 = accept (signature + content binding verified), "
            "1 = reject, 2 = argument/parse error. "
            "Verify offline — no network access required."
        ),
    )
    parser.add_argument("artefact", type=Path, help="Path to the signed artefact")
    parser.add_argument("--output", choices=["human", "json"], default="human")
    parser.add_argument(
        "--body-marker",
        default="## 16. Signature envelope",
        help="Marker that separates body from envelope in Markdown artefacts "
             "(default: '## 16. Signature envelope')",
    )
    args = parser.parse_args(argv)

    if not args.artefact.is_file():
        print(f"verify_command: file not found: {args.artefact}", file=sys.stderr)
        return 2

    try:
        result = detect_and_verify(args.artefact)
    except ValueError as e:
        print(f"verify_command: {e}", file=sys.stderr)
        return 2

    if args.output == "json":
        print(json.dumps(result, indent=2))
    else:
        print_human(result)

    return 0 if result.get("overall_valid", result.get("valid")) else 1


if __name__ == "__main__":
    sys.exit(main())
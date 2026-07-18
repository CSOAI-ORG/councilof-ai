"""
MEOK SIGIL — Sovereign Inter-aGent Interchange Language
=======================================================
A compact, deterministic, token-efficient protocol for AI agents to talk to each
other faster — with a LOSSLESS human-readable translator so a human (or auditor)
can always read exactly what was said, and a registry so the language can GROW.

Three layers:
  • machine   encode(dict) <-> parse(line)   — dense, one-line, lossless
  • human     gloss(line) -> English          — the translator (on demand)
  • audit     digest(line) -> stable hash      — sign it (ties to attestation moat)

NOT David Wynn Miller "Quantum Grammar" (that is pseudo-legal nonsense). SIGIL is
a real controlled DSL: rigid grammar, one line -> exactly one parse.

Built-in and agent-invented opcodes share ONE code path via the registry, so
emergence (agents minting new opcodes at runtime) is first-class, not bolted on.
"""

from .registry import (
    Registry,
    OpSpec,
    default_registry,
    register,
    manifest,
    export_registry,
    import_registry,
)

__version__ = "0.1.0"
__all__ = [
    "encode", "parse", "gloss", "digest",
    "Registry", "OpSpec", "default_registry",
    "register", "manifest", "export_registry", "import_registry",
    "CHOICE", "CHOICE_INV",
]

CHOICE = {"+": "APPROVE", "-": "REJECT", "~": "ABSTAIN"}
CHOICE_INV = {v: k for k, v in CHOICE.items()}

import hashlib as _hashlib
import json as _json


def encode(d: dict, registry: Registry = None) -> str:
    """Structured agent intent (dict) -> compact SIGIL line. Lossless inverse of parse()."""
    reg = registry or default_registry
    return reg.encode(d)


def parse(line: str, registry: Registry = None) -> dict:
    """SIGIL line -> structured dict. Exactly one parse per line (deterministic)."""
    reg = registry or default_registry
    return reg.parse(line)


def gloss(line: str, registry: Registry = None) -> str:
    """The translator: any SIGIL line -> plain English."""
    reg = registry or default_registry
    return reg.gloss(line)


def digest(line: str, registry: Registry = None) -> str:
    """Canonical 16-char hash of an exchange — feed to the attestation signer."""
    reg = registry or default_registry
    canon = _json.dumps(reg.parse(line), sort_keys=True, separators=(",", ":"))
    return _hashlib.sha256(canon.encode()).hexdigest()[:16]

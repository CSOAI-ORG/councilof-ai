"""meok_sovereign_guardrails_mcp — Sovereign Guardrails MCP server.

Three-layer guard, all Ed25519-signed for offline verifiability:

  1. `sov_guard()` — prompt injection + malicious instruction defense
     (mirrors superagent-ai/superagent guard API)
  2. `sov_redact()` — PII / PHI / secrets redaction with signed receipt
  3. `sov_scan()` — repo poisoning + supply chain threat scan

Reference: github.com/superagent-ai/superagent (MIT, YC-backed).
This wrapper adds the CSOAI sovereign substrate:
  - Every verdict is Ed25519-signed → verifiable offline at proofof.ai
  - Maternal Covenant values-floor check on every guard call
  - BFT council pre-clearance flag on every scan
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Optional

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False

VERSION = "0.1.0"
PROTOCOL = "sovereign-guardrails/0.1"


# --- Threat pattern library (mirrors superagent + our additions) ---

# Prompt injection patterns (subset of OWASP LLM Top 10 + our additions)
INJECTION_PATTERNS = [
    r"ignore\s+(?:all\s+)?(?:previous|prior|above)\s+(?:instructions?|prompts?)",
    r"disregard\s+(?:all\s+)?(?:previous|prior|safety)\s+(?:rules?|guidelines?)",
    r"forget\s+(?:everything|all)\s+(?:above|before)",
    r"you\s+are\s+now\s+(?:a|an)\s+(?:unrestricted|unfiltered|jailbroken)",
    r"(?:DAN|jailbreak)\s+mode",
    r"system\s*:\s*(?:you\s+are|act\s+as)",
    r"<\|im_start\|>",  # ChatML injection
    r"<\|im_end\|>",
    r"###\s*system\s*:",
    r"###\s*instructions?\s*:",
    r"\{\{.*(?:system|admin).*\}\}",  # Template injection
    r"\bexec\s*\(\s*['\"]rm\s+-rf",  # Shell escape via LLM
    r"rm\s+-rf\s+/",
    r"cat\s+/etc/passwd",
    r"curl\s+.*\|\s*sh",  # Curl-pipe-shell
    r"\b(?:sudo|su)\s+-",  # Privilege escalation hints
]

# PII/PHI patterns (basic — real impl would use Presidio or similar)
PII_PATTERNS = {
    "EMAIL": re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"),
    "SSN": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "PHONE": re.compile(r"\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
    "CREDIT_CARD": re.compile(r"\b(?:\d[ -]*?){13,16}\b"),
    "IPV4": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    "API_KEY_HEURISTIC": re.compile(r"\b(?:sk|pk|api)[-_](?:[a-zA-Z0-9]{20,}|test_[a-zA-Z0-9]{20,})\b"),
    "AWS_ACCESS_KEY": re.compile(r"\bAKIA[0-9A-Z]{16}\b"),
    "PRIVATE_KEY": re.compile(r"-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP )?PRIVATE KEY-----"),
}

# Repo poisoning patterns (from superagent scan + our additions)
POISON_PATTERNS = [
    r"(?i)ignore\s+(?:previous|prior)\s+prompt",
    r"(?i)\bsend\s+(?:all|every)\s+(?:api|env|secret|key)\b",
    r"(?i)curl\s+.*\|\s*(?:sh|bash)",
    r"(?i)rm\s+-rf\s+~",
    r"(?i)wget\s+.*\.sh\s*\|\s*sh",
    r"<script[^>]*src=['\"]https?://(?!github\.com)",  # External scripts
    r"data:text/html;base64,",  # Data URI in README
]


# --- Sovereign key helpers (same as passport) ---

def _load_sov_key() -> "Ed25519PrivateKey":
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    env_path = os.environ.get("SOV_GUARDRAILS_KEY")
    final_path = env_path or os.path.expanduser("~/.meok/sov_guardrails_key.pem")
    parent = os.path.dirname(final_path)
    if parent:
        os.makedirs(parent, exist_ok=True)
    if os.path.exists(final_path):
        with open(final_path, "rb") as f:
            raw = f.read()
        return Ed25519PrivateKey.from_private_bytes(raw)
    priv = Ed25519PrivateKey.generate()
    raw = priv.private_bytes(
        serialization.Encoding.Raw,
        serialization.PrivateFormat.Raw,
        serialization.NoEncryption(),
    )
    with open(final_path, "wb") as f:
        f.write(raw)
    try:
        os.chmod(final_path, 0o600)
    except OSError:
        pass
    return priv


def _sign_payload(payload: dict) -> dict:
    canonical = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_sov_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(
        serialization.Encoding.Raw, serialization.PublicFormat.Raw,
    )
    return {
        **payload,
        "kid": base64.b64encode(pub).decode(),
        "sig": base64.b64encode(sig).decode(),
    }


def _verify_url(receipt_id: str) -> str:
    return f"https://proofof.ai/guardrails/{receipt_id[:16]}"


# --- Tool 1: guard (prompt injection defense) ---

def sov_guard(
    input_text: str,
    *,
    care_floor_validated: bool = False,
    bft_council_id: Optional[str] = None,
) -> dict:
    """Detect prompt injection + unsafe tool calls.

    Mirrors superagent `guard()`. Returns a signed verdict:
      `{verdict, violations, receipt_id, kid, sig, verify_url}`

    Verdict is one of: "allow", "block", "flag".
    """
    if not input_text:
        return _emit_guard_verdict("allow", [], input_text, care_floor_validated, bft_council_id)

    violations = []
    text_lower = input_text.lower()
    for pattern in INJECTION_PATTERNS:
        if re.search(pattern, input_text, re.IGNORECASE | re.MULTILINE):
            violations.append(f"INJECTION:{pattern[:60]}")

    # Maternal Covenant: even if no injection, refuse if not pre-validated for sensitive contexts
    if not care_floor_validated and any(kw in text_lower for kw in ("harm", "kill", "weapon", "exploit")):
        violations.append("MATERNA_COVENANT:sensitive_context_unvalidated")

    verdict = "block" if violations else "allow"
    return _emit_guard_verdict(verdict, violations, input_text[:200], care_floor_validated, bft_council_id)


def _emit_guard_verdict(verdict, violations, input_excerpt, care_floor, council_id):
    receipt_id = hashlib.sha256(
        f"{verdict}|{','.join(violations)}|{input_excerpt}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "tool": "sov_guard",
        "receipt_id": receipt_id,
        "ts": datetime.now(timezone.utc).isoformat(),
        "verdict": verdict,
        "violations": violations,
        "care_floor_validated": care_floor,
        "bft_council_id": council_id,
    }
    signed = _sign_payload(payload)
    signed["verify_url"] = _verify_url(receipt_id)
    return signed


# --- Tool 2: redact (PII/PHI/secrets) ---

def sov_redact(input_text: str) -> dict:
    """Redact PII / PHI / secrets from input_text.

    Mirrors superagent `redact()`. Returns a signed receipt with
    `{redacted, replacements, receipt_id, kid, sig, verify_url}`.
    """
    redacted = input_text
    replacements = []
    for kind, pattern in PII_PATTERNS.items():
        matches = list(pattern.finditer(redacted))
        if matches:
            replacements.append({"kind": kind, "count": len(matches)})
            redacted = pattern.sub(f"<{kind}_REDACTED>", redacted)

    receipt_id = hashlib.sha256(
        f"{redacted[:200]}|{','.join(r['kind'] for r in replacements)}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "tool": "sov_redact",
        "receipt_id": receipt_id,
        "ts": datetime.now(timezone.utc).isoformat(),
        "original_length": len(input_text),
        "redacted_length": len(redacted),
        "replacements": replacements,
        "redacted_text": redacted,
    }
    signed = _sign_payload(payload)
    signed["verify_url"] = _verify_url(receipt_id)
    # Don't include original text in signed payload — that's the whole point of redaction
    return signed


# --- Tool 3: scan (repo poisoning + supply chain threats) ---

def sov_scan(
    repo_url: str,
    *,
    readme: Optional[str] = None,
    workflows: Optional[list[str]] = None,
    bft_council_id: Optional[str] = None,
) -> dict:
    """Scan a repo for AI-agent-targeted attacks.

    Mirrors superagent `scan()`. Returns a signed receipt with
    `{verdict, threats, receipt_id, kid, sig, verify_url}`.
    """
    threats = []
    blob = (readme or "") + "\n" + "\n".join(workflows or [])

    for pattern in POISON_PATTERNS:
        if re.search(pattern, blob, re.IGNORECASE | re.MULTILINE):
            threats.append(f"POISON:{pattern[:60]}")

    # Scan README URLs for known-bad TLDs (very basic)
    if readme:
        urls = re.findall(r"https?://[^\s)\"']+", readme)
        for url in urls:
            if re.search(r"\.(tk|ml|ga|cf|gq)/", url):
                threats.append(f"SUSPICIOUS_TLD:{url[:60]}")

    verdict = "block" if threats else "allow"
    receipt_id = hashlib.sha256(
        f"{repo_url}|{','.join(threats)}|{datetime.now(timezone.utc).isoformat()}".encode()
    ).hexdigest()
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "tool": "sov_scan",
        "receipt_id": receipt_id,
        "ts": datetime.now(timezone.utc).isoformat(),
        "repo_url": repo_url,
        "verdict": verdict,
        "threats": threats,
        "bft_council_id": bft_council_id,
    }
    signed = _sign_payload(payload)
    signed["verify_url"] = _verify_url(receipt_id)
    return signed


# --- MCP server entry point ---

def register_mcp_tools(mcp) -> None:
    """Register all sovereign guardrail tools on a FastMCP instance."""
    mcp.tool(name="sov_guard", description=(
        "Detect prompt injection + unsafe tool calls. Mirrors superagent guard() "
        "with Ed25519-signed verdicts + Maternal Covenant check + BFT council flag."
    ))(sov_guard)

    mcp.tool(name="sov_redact", description=(
        "Redact PII / PHI / secrets (email, SSN, phone, credit card, IP, AWS keys, "
        "private keys). Returns signed receipt for audit."
    ))(sov_redact)

    mcp.tool(name="sov_scan", description=(
        "Scan a repository (README + workflows) for AI-agent-targeted attacks "
        "(repo poisoning, suspicious URLs, escape patterns). Returns signed receipt."
    ))(sov_scan)


def serve() -> None:
    """Run the sovereign guardrails MCP server (stdio)."""
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-guardrails")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()

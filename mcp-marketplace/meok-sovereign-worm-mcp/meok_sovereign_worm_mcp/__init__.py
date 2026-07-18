"""meok_sovereign_worm_mcp — MEOK WORM MCP (defensive).

4 components that together form the MEOK WORM defensive stack:

  1. Morris-II worm guard (defensive)
     - `sov_worm_scan(text)` - scan text for self-replicating-prompt patterns
     - `sov_worm_quarantine(text, reason)` - quarantine a worm attempt, signed audit

  2. Protocol tunnel registry
     - `sov_tunnel_register(name, src, dst, port)` - register a tunnel
     - `sov_tunnel_list()` - list all registered tunnels
     - `sov_tunnel_status(name)` - health check a tunnel

  3. WORM (Write-Once-Read-Many) storage
     - `sov_worm_write(payload, tag)` - append-only signed write
     - `sov_worm_read(tag, limit)` - read WORM records (read-only)
     - `sov_worm_verify(record_id)` - verify a WORM record's signature + chain

  4. Sigil-signed audit chain
     - `sov_audit_event(event_type, data)` - append a signed audit event
     - `sov_audit_chain(start, end)` - verify a chain of audit events
     - `sov_audit_recent(limit)` - get recent audit events

References:
- worm_guard.py (309 lines, stdlib-only) at sovereign-temple-public/security/
- WORM_GUARD_WIRING.md (the doctrine)
- SOVEREIGN_TOWN_POC_2026-06-19.md (defensive-only doctrine)
- 13_LAYER_DIMENSIONS.md D3.7 "Immutable (WORM) + Hash-chained (SIGIL)"
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False

VERSION = "0.1.0"
PROTOCOL = "sovereign-worm/0.1"

# === WORM GUARD PATTERNS (from worm_guard.py) ===
# CRITICAL: self-replication, exfiltration, command/tool execution
# HIGH: instruction override, role hijack
# MEDIUM: authority spoofing, opaque payloads

_CRITICAL_PATTERNS = [
    # self-replication / propagation (Morris II core behavior)
    r"\b(include|repeat|append|embed|copy|reproduce)\b[^.\n]{0,40}\b(this|the (entire|following|above))\b[^.\n]{0,40}\b(prompt|instruction|message|text)\b[^.\n]{0,40}\b(in|into|to)\b[^.\n]{0,40}\b(your|the)\b[^.\n]{0,30}\b(output|response|reply|answer|next)\b",
    r"\b(replicate|self-replicate|propagate|spread)\b[^.\n]{0,30}\b(this|yourself|the prompt)\b",
    # exfiltration
    r"\b(forward|send|exfiltrate|leak|post|upload|transmit)\b[^.\n]{0,40}\b(all|the|these|every)\b[^.\n]{0,40}\b(emails?|messages?|data|secrets?|keys?|credentials?|files?|contacts?|memor(y|ies))\b[^.\n]{0,40}\b(to)\b",
    # command / tool execution
    r"```\s*(bash|sh|zsh|python|powershell)\b",
    r"\b(curl|wget)\b[^\n]{0,80}\|\s*(sh|bash|zsh|python)\b",
    r"\brm\s+-rf\b",
    r"<\s*tool_call\s*>|<\s*function_call\s*>",
]

_HIGH_PATTERNS = [
    r"\b(ignore|disregard|forget)\b[^.\n]{0,30}\b(previous|prior|above|system)\b[^.\n]{0,30}\b(instructions?|prompts?|rules?)\b",
    r"\b(you are now|new role|system prompt|developer mode|jailbreak)\b",
    r"\bact as\b[^.\n]{0,30}\b(unrestricted|unfiltered|unmoderated|jailbroken)\b",
    r"\bpretend\b[^.\n]{0,30}\b(no|without)\b[^.\n]{0,30}\b(rules|restrictions|limitations|filters)\b",
]

_MEDIUM_PATTERNS = [
    r"\b(as the|acting as|in the role of)\b[^.\n]{0,30}\b(admin|administrator|root|god|owner)\b",
    r"\b(base64|hex|rot13|morse)\b[^.\n]{0,30}\b(encode|decode|interpret|translate)\b",
    r"\\u[0-9a-fA-F]{4}|\\x[0-9a-fA-F]{2}",  # unicode/hex escape sequences
]

ALL_PATTERNS = [("critical", _CRITICAL_PATTERNS), ("high", _HIGH_PATTERNS), ("medium", _MEDIUM_PATTERNS)]


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_WORM_KEY") or os.path.expanduser("~/.meok/sov_worm_key.pem")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return Ed25519PrivateKey.from_private_bytes(f.read())
    priv = Ed25519PrivateKey.generate()
    with open(path, "wb") as f:
        f.write(priv.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption()))
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return priv


def _sign(payload):
    body = {k: v for k, v in payload.items() if k not in ("kid", "sig", "verify_url")}
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return {**payload, "kid": base64.b64encode(pub).decode(), "sig": base64.b64encode(sig).decode()}


# === State stores ===
_TUNNELS: dict = {}      # tunnel name -> tunnel dict
_WORM_STORE: list = []   # WORM records (append-only)
_WORM_HEAD_HASH = ""     # head hash of the WORM chain
_AUDIT_LOG: deque = deque(maxlen=10000)  # signed audit events
_AUDIT_HEAD_HASH = ""    # head hash of the audit chain

# === Known good tunnels (canonical) ===
KNOWN_TUNNELS = {
    "ollama-mac-vm":     {"src": "mac",      "dst": "vm",  "port": 11434, "purpose": "M2 Mac → VM Ollama"},
    "sov3-mac-vm":       {"src": "mac",      "dst": "vm",  "port": 3101,  "purpose": "M2 Mac → VM SOV3 mesh"},
    "king-mac-vm":       {"src": "mac",      "dst": "vm",  "port": 8077,  "purpose": "M2 Mac → king + EU gateway"},
    "ssh-reverse-mac":   {"src": "mac",      "dst": "vm",  "port": 11444, "purpose": "VM → Mac Ollama (reverse)"},
    "m2-bridge":         {"src": "mac",      "dst": "m2",  "port": 11435, "purpose": "Mac → M2 LAN Ollama"},
    "m2-vm-bridge":      {"src": "mac",      "dst": "vm",  "port": 11445, "purpose": "VM → M2 (2-hop)"},
}


# ============================================================
# 1. MORRIS-II WORM GUARD
# ============================================================

def sov_worm_scan(text: str, *, source: str = "unspecified") -> dict:
    """Scan text for self-replicating-prompt (Morris II) patterns.

    Returns a ScanResult with severity, matches, and recommended action.
    """
    matches = []
    severity = "clean"
    action = "allow"

    for sev, patterns in ALL_PATTERNS:
        for p in patterns:
            found = re.findall(p, text, re.IGNORECASE | re.MULTILINE)
            if found:
                matches.append({"severity": sev, "pattern": p[:80], "count": len(found)})
                # upgrade severity (critical > high > medium)
                if sev == "critical":
                    severity = "critical"
                    action = "block"
                elif sev == "high" and severity != "critical":
                    severity = "high"
                    action = "quarantine"
                elif sev == "medium" and severity not in ("critical", "high"):
                    severity = "medium"
                    action = "log"

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "scan_id": hashlib.sha256(f"{text[:200]}|{source}|{time.time()}".encode()).hexdigest()[:16],
        "source": source,
        "text_length": len(text),
        "severity": severity,
        "action": action,
        "matches": matches,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/worm/scan/{signed['scan_id']}"
    return signed


def sov_worm_quarantine(text: str, reason: str, *, source: str = "unspecified") -> dict:
    """Quarantine a detected worm attempt. Append-only signed audit."""
    record_id = hashlib.sha256(f"{text[:200]}|{reason}|{time.time()}".encode()).hexdigest()[:16]
    quarantined = {
        "record_id": record_id,
        "text_preview": text[:500],
        "text_sha256": hashlib.sha256(text.encode()).hexdigest(),
        "reason": reason,
        "source": source,
        "quarantined_at": datetime.now(timezone.utc).isoformat(),
    }
    return sov_worm_write(quarantined, tag="quarantine")


# ============================================================
# 2. PROTOCOL TUNNEL REGISTRY
# ============================================================

def sov_tunnel_register(name: str, src: str, dst: str, port: int, *, purpose: str = "") -> dict:
    """Register a protocol tunnel. Tunnels are signed for audit."""
    if name in _TUNNELS:
        return {"error": f"tunnel {name} already registered", "existing": _TUNNELS[name]}

    tunnel = {
        "name": name,
        "src": src,
        "dst": dst,
        "port": port,
        "purpose": purpose,
        "registered_at": datetime.now(timezone.utc).isoformat(),
        "status": "registered",
    }
    _TUNNELS[name] = tunnel
    payload = {"protocol": PROTOCOL, "version": VERSION, "tunnel": tunnel}
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/worm/tunnel/{name}"
    return signed


def sov_tunnel_list(*, include_known: bool = True) -> dict:
    """List all registered tunnels (optionally include the 6 canonical known tunnels)."""
    tunnels = dict(_TUNNELS)
    if include_known:
        for name, info in KNOWN_TUNNELS.items():
            if name not in tunnels:
                tunnels[name] = {**info, "name": name, "status": "known_canonical"}
    return {
        "protocol": PROTOCOL,
        "version": VERSION,
        "count": len(tunnels),
        "tunnels": list(tunnels.values()),
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov_tunnel_status(name: str) -> dict:
    """Health check a tunnel (registration status; full ping would need net access)."""
    if name in _TUNNELS:
        return {"name": name, "status": "registered", "info": _TUNNELS[name]}
    if name in KNOWN_TUNNELS:
        return {"name": name, "status": "known_canonical", "info": KNOWN_TUNNELS[name]}
    return {"name": name, "status": "unknown", "error": f"tunnel {name} not registered"}


# ============================================================
# 3. WORM (Write-Once-Read-Many) STORAGE
# ============================================================

def sov_worm_write(payload: dict, *, tag: str = "general") -> dict:
    """Append-only signed write to WORM storage. Each record hashes the previous."""
    global _WORM_HEAD_HASH
    record_id = hashlib.sha256(f"{json.dumps(payload, sort_keys=True)}|{tag}|{time.time()}".encode()).hexdigest()[:16]
    record = {
        "record_id": record_id,
        "tag": tag,
        "payload": payload,
        "prev_hash": _WORM_HEAD_HASH,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    # Compute new head hash
    canonical = json.dumps(record, sort_keys=True, separators=(",", ":")).encode()
    new_head = hashlib.sha256(canonical).hexdigest()
    record["head_hash"] = new_head
    _WORM_HEAD_HASH = new_head
    _WORM_STORE.append(record)
    signed = _sign(record)
    signed["verify_url"] = f"https://proofof.ai/worm/store/{record_id}"
    return signed


def sov_worm_read(*, tag: Optional[str] = None, limit: int = 100) -> dict:
    """Read WORM records (read-only). Optional tag filter."""
    records = list(_WORM_STORE)
    if tag:
        records = [r for r in records if r.get("tag") == tag]
    records = records[-limit:]
    return {
        "protocol": PROTOCOL,
        "version": VERSION,
        "head_hash": _WORM_HEAD_HASH,
        "count": len(records),
        "records": records,
    }


def sov_worm_verify(record_id: str) -> dict:
    """Verify a WORM record's signature + chain integrity."""
    record = next((r for r in _WORM_STORE if r["record_id"] == record_id), None)
    if not record:
        return {"error": f"record {record_id} not found", "valid": False, "record_id": record_id}

    # Reconstruct chain
    index = _WORM_STORE.index(record)
    if index > 0:
        expected_prev = _WORM_STORE[index - 1]["head_hash"]
        if record["prev_hash"] != expected_prev:
            return {"error": "chain broken at this record", "valid": False, "record_id": record_id, "chain_valid": False}

    # Reconstruct head hash
    record_copy = {k: v for k, v in record.items() if k != "head_hash"}
    canonical = json.dumps(record_copy, sort_keys=True, separators=(",", ":")).encode()
    expected_head = hashlib.sha256(canonical).hexdigest()
    chain_valid = (record["head_hash"] == expected_head)

    return {
        "protocol": PROTOCOL,
        "version": VERSION,
        "valid": chain_valid,
        "record_id": record_id,
        "tag": record["tag"],
        "chain_valid": chain_valid,
        "head_hash_valid": chain_valid,
        "index": index,
        "ts": record["ts"],
        "verify_url": f"https://proofof.ai/worm/store/{record_id}/verify",
    }


# ============================================================
# 4. SIGIL-SIGNED AUDIT CHAIN
# ============================================================

def sov_audit_event(event_type: str, data: dict, *, actor: str = "sovereign") -> dict:
    """Append a sigil-signed audit event to the chain."""
    global _AUDIT_HEAD_HASH
    event_id = hashlib.sha256(f"{event_type}|{actor}|{time.time()}".encode()).hexdigest()[:16]
    event = {
        "event_id": event_id,
        "event_type": event_type,
        "actor": actor,
        "data": data,
        "prev_hash": _AUDIT_HEAD_HASH,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    canonical = json.dumps(event, sort_keys=True, separators=(",", ":")).encode()
    new_head = hashlib.sha256(canonical).hexdigest()
    event["head_hash"] = new_head
    _AUDIT_HEAD_HASH = new_head
    _AUDIT_LOG.append(event)
    signed = _sign(event)
    signed["verify_url"] = f"https://proofof.ai/worm/audit/{event_id}"
    return signed


def sov_audit_chain(start: int = 0, end: Optional[int] = None) -> dict:
    """Verify a chain of audit events (start..end indices)."""
    events = list(_AUDIT_LOG)
    if end is None:
        end = len(events) - 1
    chain = events[start:end + 1]
    valid = True
    broken_at = None
    for i, e in enumerate(chain):
        if i > 0:
            if e["prev_hash"] != chain[i - 1]["head_hash"]:
                valid = False
                broken_at = i
                break
        # Verify head hash
        e_copy = {k: v for k, v in e.items() if k != "head_hash"}
        canonical = json.dumps(e_copy, sort_keys=True, separators=(",", ":")).encode()
        if hashlib.sha256(canonical).hexdigest() != e["head_hash"]:
            valid = False
            broken_at = i
            break
    return {
        "protocol": PROTOCOL,
        "version": VERSION,
        "start": start,
        "end": end,
        "count": len(chain),
        "valid": valid,
        "broken_at": broken_at,
        "head_hash": chain[-1]["head_hash"] if chain else "",
    }


def sov_audit_recent(limit: int = 50) -> dict:
    """Get the most recent N audit events."""
    events = list(_AUDIT_LOG)[-limit:]
    return {
        "protocol": PROTOCOL,
        "version": VERSION,
        "head_hash": _AUDIT_HEAD_HASH,
        "count": len(events),
        "events": events,
    }


# ============================================================
# 5. MEOK WORM DOCTRINE STATUS
# ============================================================

def sov_worm_status() -> dict:
    """The MEOK WORM doctrine: what's deployed, what's defensive."""
    return {
        "protocol": PROTOCOL,
        "version": VERSION,
        "doctrine": "DEFENSIVE ONLY. NO offensive / self-propagating capability. Detects + quarantines Morris-II-class self-replicating prompts.",
        "components": {
            "worm_guard": {
                "active": True,
                "patterns": {"critical": len(_CRITICAL_PATTERNS), "high": len(_HIGH_PATTERNS), "medium": len(_MEDIUM_PATTERNS)},
                "reference": "worm_guard.py (309 lines, stdlib-only)",
            },
            "tunnel_registry": {
                "active": True,
                "known_canonical": len(KNOWN_TUNNELS),
                "registered": len(_TUNNELS),
            },
            "worm_storage": {
                "active": True,
                "records": len(_WORM_STORE),
                "head_hash": _WORM_HEAD_HASH[:16] + "...",
            },
            "audit_chain": {
                "active": True,
                "events": len(_AUDIT_LOG),
                "head_hash": _AUDIT_HEAD_HASH[:16] + "...",
            },
        },
        "ts": datetime.now(timezone.utc).isoformat(),
        "verify_url": "https://proofof.ai/worm",
    }


def register_mcp_tools(mcp):
    mcp.tool(name="sov_worm_scan", description="Scan text for Morris-II self-replicating-prompt patterns.")(sov_worm_scan)
    mcp.tool(name="sov_worm_quarantine", description="Quarantine a detected worm attempt (signed WORM write).")(sov_worm_quarantine)
    mcp.tool(name="sov_tunnel_register", description="Register a protocol tunnel (signed).")(sov_tunnel_register)
    mcp.tool(name="sov_tunnel_list", description="List all registered + canonical known tunnels.")(sov_tunnel_list)
    mcp.tool(name="sov_tunnel_status", description="Health check a specific tunnel.")(sov_tunnel_status)
    mcp.tool(name="sov_worm_write", description="Append-only signed write to WORM storage.")(sov_worm_write)
    mcp.tool(name="sov_worm_read", description="Read WORM records (read-only).")(sov_worm_read)
    mcp.tool(name="sov_worm_verify", description="Verify a WORM record's signature + chain integrity.")(sov_worm_verify)
    mcp.tool(name="sov_audit_event", description="Append a sigil-signed audit event to the chain.")(sov_audit_event)
    mcp.tool(name="sov_audit_chain", description="Verify a chain of audit events.")(sov_audit_chain)
    mcp.tool(name="sov_audit_recent", description="Get the most recent N audit events.")(sov_audit_recent)
    mcp.tool(name="sov_worm_status", description="MEOK WORM doctrine status (what's deployed, what's defensive).")(sov_worm_status)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-worm")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()

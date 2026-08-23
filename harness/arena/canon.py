#!/usr/bin/env python3
"""canon.py — cross-runtime-stable canonical JSON for content_id signing.

The estate's verify path recomputes sha256(canonical body) on BOTH Python (signer) and
JS/Cloudflare (endpoint /api/arena/scoreboard?verify=1). For the two to byte-match, the
canonical form must be identical across runtimes. Two rules are load-bearing:

 1. Integer-valued floats emit as integers (Python json.dumps(0.0)==\"0.0\" but JS
    JSON.stringify(0.0)==\"0\"). We normalize int-valued floats to ints.
 2. Keys sorted (Perl/Java sort order), compact separators (no spaces), ensure_ascii=False
    so non-ASCII (em-dash, accented chars) stay LITERAL and byte-match JS JSON.stringify
    (which does not escape non-ASCII by default). ensure_ascii=True would emit \\u2014
    (6 chars) where JS emits a literal — (1 char) — a 5-char divergence that breaks the
    verify path.
 3. No NaN/Infinity (never emitted), and strings escaped identically to JS JSON.stringify.

This matches the estate's existing convention (Python json.dumps(sort_keys,
separators=(',',':'), ensure_ascii=True)) PLUS the integer-float normalization that the
JS side needs.

Usage:
  from canon import cjson
  body = {...}
  s = cjson(body)          # canonical string
  cid = sha256(s.encode()).hexdigest()
"""
import json, math


def _norm(o):
    if isinstance(o, float):
        if not math.isfinite(o):
            raise ValueError("NaN/Infinity not allowed in canonical JSON")
        if o.is_integer():
            return int(o)
        # non-integer floats: emit with up to 6 decimals stripped of trailing zeros.
        # JS JSON.stringify uses shortest round-trip repr; for values produced by round(x,2)
        # Python repr is stable, but to be safe we emit exactly what round() gave.
        return o
    if isinstance(o, dict):
        return {k: _norm(v) for k, v in o.items()}
    if isinstance(o, list):
        return [_norm(v) for v in o]
    return o


def cjson(obj) -> str:
    """Canonical JSON string: keys sorted, compact, NON-ASCII literal (ensure_ascii=False
    to byte-match JS JSON.stringify), int-valued floats as ints."""
    return json.dumps(_norm(obj), sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def cid(obj) -> str:
    """content_id = sha256(canonical JSON)."""
    return hash_hex(cjson(obj))


def hash_hex(s: str) -> str:
    import hashlib
    return hashlib.sha256(s.encode()).hexdigest()

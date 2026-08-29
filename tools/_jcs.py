"""RFC 8785 JCS — stranger-kit sibling of verify_any_card.py.

Keep in lockstep with harness/arena/jcs.py. A kit that ships only
verify_any_card.py + this file can check jcs-rfc8785 cards without the rest
of the estate. Missing this file is UNCHECKABLE, never a silent v1 fallback.
"""
#!/usr/bin/env python3
"""jcs.py — RFC 8785 (JSON Canonicalization Scheme, ECMA-262-number-aware) canonicalizer.

Implements the JCS algorithm used as the estate's v2 preimage rule (per the 90-day roadmap,
item 1 "canonicalization"). The estate's TWO existing canon forms (arena `cdn` cjson vs the
interop signer's `json.dumps(sort_keys, separators, ensure_ascii=False)`) DIVERGE on
integer-valued floats — e.g. `{"a": 0.0}` canonicalizes to `{"a":0}` under JCS but
`{"a":0.0}` under the plain Python form. This module is the single source of truth for what
JCS actually emits, and the harness (`jcs_conformance.py`) checks agreement against a JS
reference over the edge-case corpus so the cutover precondition (100% cross-language
agreement incl. the 0.0 float case) can be met and demonstrated — never asserted.

Honesty: this is the reference implementation for a FUTURE v2 preimage. It does NOT re-sign
any existing v1 card and is NOT wired into the live verify path yet; the verifier dispatches
on a signed-in-body `canon` field ("jcs-rfc8785" for v2; absent = legacy v1). The fleet
roadmap is explicit: do NOT cut over until the cross-language corpus hits 100% agreement.

RFC 8785 algorithm (collapsed to the cases the estate actually emits):
  1. Object keys sorted by UTF-16 code unit (for the estate's ASCII-ish keys = codepoint sort).
  2. No insignificant whitespace.
  3. Strings: JSON.stringify escaping (escape `"` `\\` and control chars <0x20); non-ASCII NOT
     escaped (JSON.stringify leaves unicode literal).
  4. Numbers: ECMAScript Number::toString (shortest round-trip; integral floats WITHOUT a
     decimal point, e.g. 1.0->"1", 0.0->"0"; non-integral keep shortest repr).
  5. Arrays/objects recursed; duplicates impossible (dict).
"""
import json
import math
import re
import sys

__all__ = ["canonicalize", "JCS"]


def _float_to_js(value: float) -> str:
    """ECMAScript Number::toString for a finite float (the only case JCS serializes as a
    number). Integral floats within JS's no-exponent window [10^-6, 10^21) emit as a decimal
    integer (no '.0'); at or beyond 1e21 JS switches to exponent form. -0.0 -> "0".
    repr() gives the shortest round-trip; JS Number::toString uses the same shortest form
    with the same exponent threshold, so repr() is the correct cross-language match for the
    finite range."""
    if math.isnan(value) or math.isinf(value):
        # JCS rejects non-finite numbers; RFC 8785 spec says such inputs are invalid.
        raise ValueError("JCS: non-finite number not canonicalizable")
    if value == 0:
        return "0"  # covers -0.0 -> "0" (JCS normalizes negative zero)
    if value.is_integer() and 1e-6 <= abs(value) < 1e21:
        # JS emits integral floats in this window as decimal integers, no '.0'.
        return str(int(value))
    # >=1e21 or <1e-6: JS uses exponent form; repr() already emits shortest exponent form
    # (e.g. repr(1e21) == '1e+21', matching JSON.stringify(1e21) == '1e+21').
    return repr(value)


def _string_to_js(value: str) -> str:
    """JSON.stringify-style escaping: quote, backslash, and control chars <0x20."""
    out = ['"']
    for ch in value:
        cp = ord(ch)
        if cp < 0x20:
            out.append(_HEXSHORT.get(cp, _unicode_escape(cp)))
        elif ch == '"':
            out.append('\\"')
        elif ch == "\\":
            out.append("\\\\")
        else:
            out.append(ch)
    out.append('"')
    return "".join(out)


_HEXSHORT = {
    0x08: "\\b", 0x09: "\\t", 0x0A: "\\n", 0x0C: "\\f", 0x0D: "\\r",
}
# Other control chars <0x20 -> \u00XX (JCS uses \u00XX lowercase, JS JSON.stringify does too).


def _unicode_escape(cp: int) -> str:
    return "\\u%04x" % cp


def canonicalize(obj):
    """Canonicalize a JSON-compatible Python object per RFC 8785."""
    if obj is None:
        return "null"
    if obj is True:
        return "true"
    if obj is False:
        return "false"
    if isinstance(obj, str):
        return _string_to_js(obj)
    if isinstance(obj, bool):  # bool is subclass of int; check before int
        return "true" if obj else "false"
    if isinstance(obj, int):
        return str(obj)
    if isinstance(obj, float):
        return _float_to_js(obj)
    if isinstance(obj, (list, tuple)):
        return "[" + ",".join(canonicalize(x) for x in obj) + "]"
    if isinstance(obj, dict):
        parts = []
        # key sort by UTF-16 code unit = codepoint for BMP ASCII; Python sorted() on str keys
        # is codepoint order which matches UTF-16 code-unit order for the estate's keys.
        for k in sorted(obj, key=lambda k: k):
            # keys must be strings per JCS; the estate uses string keys.
            if not isinstance(k, str):
                raise ValueError("JCS: object keys must be strings")
            parts.append(_string_to_js(k) + ":" + canonicalize(obj[k]))
        return "{" + ",".join(parts) + "}"
    raise ValueError("JCS: unsupported type %s" % type(obj))


JCS = canonicalize


if __name__ == "__main__":
    # quick self-check of the documented divergence case
    demo = {"a": 0.0, "b": "x", "c": [1, 2, 3]}
    print("JCS:  ", canonicalize(demo))

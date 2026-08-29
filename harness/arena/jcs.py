#!/usr/bin/env python3
"""jcs.py — RFC 8785 (JSON Canonicalization Scheme, ECMA-262-number-aware) canonicalizer.

Rule B for this estate. Numbers are spelled by ES6 `Number.prototype.toString`
(ECMA-262 NumberToString, radix 10) — the algorithm RFC 8785 JCS names.

  0.0 → "0"     1.0 → "1"     1e-6 → "0.000001"     1e-7 → "1e-7"
  1e20 → "100000000000000000000"     1e21 → "1e+21"     −0 → "0"

CPython `json.dumps` / `repr` are NOT this algorithm (`0.0`, `1e-06`, `1e-07`).
Do not use them for catalog rows, board stamps, or `preimage_rule: "jcs-rfc8785"`.

Rule A — published `/signed/cards/` — stays CPython `json.dumps` with `0.0` on
the float fields HOW-TO-VERIFY names. Those ids are hashes of those bytes.
Never "fix" a Rule A card to JCS.

New catalog / JCS artefacts emit this module. Empty cells stay empty; joining
the rail does not fill a financial slot.
"""
import math

__all__ = ["canonicalize", "JCS", "es6_number_to_string"]


def _shortest_digits_and_scale(value: float) -> tuple[str, int]:
    """Parse CPython's shortest round-trip repr into (digits, scale) so
    value == int(digits) * 10**scale, digits has no leading/trailing zeros."""
    r = repr(value)
    if r[0] == "-":
        r = r[1:]
    if "e" in r:
        mant, exp_s = r.split("e")
        scale = int(exp_s)
        if "." in mant:
            a, b = mant.split(".")
            digits = a + b
            scale -= len(b)
        else:
            digits = mant
    elif "." in r:
        a, b = r.split(".")
        digits = a + b
        scale = -len(b)
    else:
        digits = r
        scale = 0
    digits = digits.lstrip("0") or "0"
    while digits != "0" and digits.endswith("0"):
        digits = digits[:-1]
        scale += 1
    return digits, scale


def es6_number_to_string(value: float) -> str:
    """ECMA-262 NumberToString (radix 10) for one IEEE-754 binary64.

    Finite numbers only — JCS forbids NaN / ±Infinity. +0 and −0 both emit "0"
    (ToString(−0) has no minus). This is a print algorithm, not a type system:
    after JSON parse there is no memory that a field was a Python float.
    """
    if math.isnan(value) or math.isinf(value):
        raise ValueError("JCS: non-finite number not canonicalizable")
    if value == 0:
        return "0"
    if value < 0:
        return "-" + es6_number_to_string(-value)

    # ECMA-262: m = s × 10^(n−k) with s a k-digit integer, 10^(k−1) ≤ s < 10^k.
    digits, scale = _shortest_digits_and_scale(value)
    k = len(digits)
    n = k + scale

    if k <= n <= 21:
        return digits + "0" * (n - k)
    if 0 < n <= 21:
        return digits[:n] + "." + digits[n:]
    if -6 < n <= 0:
        return "0." + "0" * (-n) + digits
    exp = n - 1
    exp_s = "+%d" % exp if exp >= 0 else "%d" % exp
    if k == 1:
        return digits + "e" + exp_s
    return digits[0] + "." + digits[1:] + "e" + exp_s


def _float_to_js(value: float) -> str:
    return es6_number_to_string(value)


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

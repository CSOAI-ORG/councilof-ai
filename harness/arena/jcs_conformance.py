#!/usr/bin/env python3
"""jcs_conformance.py — RFC 8785 cross-language conformance harness for the JCS v2 preimage.

This is the proof-of-agreement the fleet roadmap (item 1, canonicalization) requires BEFORE
any cutover: "do NOT cut over until a cross-language corpus (incl. the 0.0 float cases) hits
100% agreement." It builds a fixed edge-case corpus (the estate's real emitted shapes + the
adversarial cases the two legacy forms disagree on), canonicalizes each with the Python
reference (`jcs.py`), canonicalizes the same input with a JS reference (`JSON.stringify` via
node), and reports EVERY disagreement.

Honesty (the estate's defect we hunt): a conformance check that cannot fail is not a
conformance check. This harness is designed to FAIL loudly on the divergences it finds
(e.g. the 0.0 float case), so the cutover decision is made on evidence, not assertion. It
does NOT sign or re-sign anything and is NOT wired into the live verify path.

Usage:
  python3 jcs_conformance.py            # Python-only self-check + report (no JS)
  JCS_NODE=1 python3 jcs_conformance.py # ALSO compare against a JS reference (needs node)
"""
import json
import os
import subprocess
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from jcs import canonicalize  # noqa: E402

# The edge-case corpus: every shape the estate actually emits, plus the adversarial cases
# where the two legacy canon forms (arena cjson vs interop json.dumps) DIVERGE.
CORPUS = [
    {"a": 0.0},                       # THE divergence case (JCS: {"a":0}; plain py: {"a":0.0})
    {"a": 1.0},                       # integral float -> integer
    {"a": -0.0},                      # negative zero -> 0
    {"a": 1.5},                       # non-integral float (shortest round-trip)
    {"a": 3.141592653589793},         # float precision
    {"a": 1e21},                      # big float (JS uses exponent form)
    {"a": 123456789012345678901234567890},  # big int
    {"s": "x"},                       # simple string
    {"s": 'quote" and \\backslash'},  # escaped chars
    {"s": "\u2014"},                   # non-ASCII em-dash (must stay literal, no \\u2014)
    {"s": "\u00e9"},                  # accented (never escaped by JSON.stringify)
    {"arr": [1, 2, 3]},               # array
    {"nested": {"b": 2, "a": 1}},     # nested (key order: a, b)
    {"mixed": [{"z": 1, "a": 2}, 3.0]},# array of objects + integral float
    {"no_nulls": None},               # null
    {"t": True, "f": False},          # booleans
    {"empty_obj": {}, "empty_arr": []},
    {"unicode": "caf\u00e9 \u2014 \u4e2d"},  # mixed unicode, all literal
    {"deep": {"n": {"i": {"er": [{"x": 0.0}]}}}},  # deep nested + 0.0
]


def _py_canonicalize(obj):
    try:
        return canonicalize(obj)
    except ValueError as e:
        return "ERR:%s" % e


def _js_canonicalize(obj):
    """Canonicalize via JSON.stringify (the reference the estate deploy/verify uses).
    JSON.stringify is the JCS-baseline for string/object/array; for floats it emits the
    ECMAScript number form. This is the honest cross-language reference point."""
    script = "const fs=require('fs');const s=fs.readFileSync(0,'utf8');const v=JSON.parse(s);process.stdout.write(JSON.stringify(v));"
    p = subprocess.run(["node", "-e", script], input=json.dumps(obj),
                       capture_output=True, text=True, timeout=15)
    return p.stdout if p.returncode == 0 else "ERR:%s" % p.stderr.strip()[:40]


def main():
    use_js = os.environ.get("JCS_NODE") == "1"
    disagreements = []
    print("RFC8785 JCS conformance harness — %d corpus cases%s" %
          (len(CORPUS), " (with JS reference)" if use_js else " (Python only)"))
    print()
    for i, obj in enumerate(CORPUS):
        py = _py_canonicalize(obj)
        # JCS single-source output
        if use_js:
            js = _js_canonicalize(obj)
            agree = (py == js) and not py.startswith("ERR")
            print("  %2d %-42s py=%-38s js=%-38s %s" %
                  (i, json.dumps(obj, ensure_ascii=False), py[:38], js[:38],
                   "OK" if agree else "*** MISMATCH ***"))
            if not agree:
                disagreements.append((i, obj, py, js))
        else:
            print("  %2d %-42s -> %s" % (i, json.dumps(obj, ensure_ascii=False), py[:60]))

    print()
    if use_js:
        if disagreements:
            print("CONFORMANCE: %d DISAGREEMENT(S) — DO NOT CUT OVER yet." % len(disagreements))
            for i, obj, py, js in disagreements:
                print("  #%d %s: py=%s js=%s" % (i, json.dumps(obj), py, js))
            return 1
        print("CONFORMANCE: 100%% agreement across %d cases (incl. the 0.0 float case). "
              "Cutover precondition met on this corpus." % len(CORPUS))
        return 0
    print("Python-only self-check done (run with JCS_NODE=1 to exercise the JS reference).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

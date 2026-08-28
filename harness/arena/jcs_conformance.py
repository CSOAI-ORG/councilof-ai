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
    # (obj, is_known_boundary) — known_boundary=True marks a DOCUMENTED cross-language limit
    # (JS JSON.stringify rounds integers beyond 2^53 to doubles; Python ints are exact). Such
    # cases are reported as documented-caveats (exit 2), NOT as cutover-blocking failures (1).
    ({"a": 0.0}, False),                       # THE divergence case (JCS: {"a":0}; plain py: {"a":0.0})
    ({"a": 1.0}, False),                       # integral float -> integer
    ({"a": -0.0}, False),                      # negative zero -> 0
    ({"a": 1.5}, False),                       # non-integral float (shortest round-trip)
    ({"a": 3.141592653589793}, False),         # float precision
    ({"a": 1e21}, False),                      # big float (JS uses exponent form)
    ({"a": 123456789012345678901234567890}, True),  # >2^53 int: JS loses precision (boundary)
    ({"s": "x"}, False),                       # simple string
    ({"s": 'quote" and \\backslash'}, False),  # escaped chars
    ({"s": "\u2014"}, False),                   # non-ASCII em-dash (must stay literal, no \\u2014)
    ({"s": "\u00e9"}, False),                  # accented (never escaped by JSON.stringify)
    ({"arr": [1, 2, 3]}, False),               # array
    ({"nested": {"b": 2, "a": 1}}, False),     # nested (key order: a, b)
    ({"mixed": [{"z": 1, "a": 2}, 3.0]}, False),# array of objects + integral float
    ({"no_nulls": None}, False),               # null
    ({"t": True, "f": False}, False),          # booleans
    ({"empty_obj": {}, "empty_arr": []}, False),
    ({"unicode": "caf\u00e9 \u2014 \u4e2d"}, False),  # mixed unicode, all literal
    ({"deep": {"n": {"i": {"er": [{"x": 0.0}]}}}}, False),  # deep nested + 0.0
]


def _py_canonicalize(obj):
    try:
        return canonicalize(obj)
    except ValueError as e:
        return "ERR:%s" % e


def _js_canonicalize(obj):
    """Canonicalize via a TRUE JCS reference in JS: recursively sort object keys, then
    JSON.stringify. Bare JSON.stringify does NOT sort keys — using it directly was a harness
    bug that reported 4 false mismatches on key order. The estate's verify runtime
    (Cloudflare/V8) would run the sorted form, so the reference must sort first."""
    script = (
        "const fs=require('fs');const v=JSON.parse(fs.readFileSync(0,'utf8'));"
        "function sortKeys(o){if(Array.isArray(o))return o.map(sortKeys);"
        "if(o&&typeof o==='object'){const r={};for(const k of Object.keys(o).sort())"
        "r[k]=sortKeys(o[k]);return r;}return o;}"
        "process.stdout.write(JSON.stringify(sortKeys(v)));"
    )
    p = subprocess.run(["node", "-e", script], input=json.dumps(obj),
                       capture_output=True, text=True, timeout=15)
    return p.stdout if p.returncode == 0 else "ERR:%s" % p.stderr.strip()[:40]


def main():
    use_js = os.environ.get("JCS_NODE") == "1"
    disagreements = []
    print("RFC8785 JCS conformance harness — %d corpus cases%s" %
          (len(CORPUS), " (with JS reference)" if use_js else " (Python only)"))
    print()
    for i, (obj, is_boundary) in enumerate(CORPUS):
        py = _py_canonicalize(obj)
        # JCS single-source output
        if use_js:
            js = _js_canonicalize(obj)
            agree = (py == js) and not py.startswith("ERR")
            tag = "OK" if agree else ("BOUNDARY(documented)" if is_boundary else "*** MISMATCH ***")
            print("  %2d %-42s py=%-38s js=%-38s %s" %
                  (i, json.dumps(obj, ensure_ascii=False), py[:38], js[:38], tag))
            if not agree:
                if not is_boundary:
                    disagreements.append((i, obj, py, js))
        else:
            print("  %2d %-42s -> %s" % (i, json.dumps(obj, ensure_ascii=False), py[:60]))

    print()
    if use_js:
        if disagreements:
            print("CONFORMANCE: %d REAL DISAGREEMENT(S) — DO NOT CUT OVER yet." % len(disagreements))
            for i, obj, py, js in disagreements:
                print("  #%d %s: py=%s js=%s" % (i, json.dumps(obj), py, js))
            return 1
        # every non-boundary case agrees; boundary cases are documented limits (exit 2).
        boundaries = sum(1 for (_, b) in CORPUS if b)
        print("CONFORMANCE: 100%% agreement on all %d ordinary cases (incl. the 0.0 float case). "
              "%d documented cross-language boundary case(s) noted (exit 2). "
              "Cutover precondition met for the estate's emitted range."
              % (len(CORPUS) - boundaries, boundaries))
        return 2 if boundaries else 0
    print("Python-only self-check done (run with JCS_NODE=1 to exercise the JS reference).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

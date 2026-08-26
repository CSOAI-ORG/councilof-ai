#!/usr/bin/env python3
"""axis_map_check.py — CI gate: every axis name the regulator tools use must exist on
the live GSPC board.

This is the check that stops the false-UNMEASURED defect recurring. Before this gate,
`eu_ai_act_findings.AXIS_TO_OBLIGATION` keyed on five names the board never carried
(`jailbreak-resistance`, `det`, `mcp`, `xsr`, `agi`), so the tool printed
`jailbreak-resistance ... measured=None` while the board carried `jail` at 0.5915 over
n=71. Nothing failed; the report simply under-stated our own coverage to a regulator.

Sources checked:
  * eu_ai_act_findings.AXIS_TO_OBLIGATION
  * eu_ai_act_article_map.json -> articles[].measured_axes
  * sector_findings.SECTOR_PROFILES[].axes

Exit codes: 0 all keys resolve · 3 board unavailable (cannot check) · 4 a key does not
resolve. Board-unavailable is NOT a pass: an unchecked map is not a checked map.

  python3 axis_map_check.py            # check against the live board
  python3 axis_map_check.py --selftest # prove the check fails on a bad key
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from board import AxisMappingError, BoardUnavailable, axis_index, check_axis_keys, get  # noqa: E402


def collect_sources() -> dict[str, set[str]]:
    import eu_ai_act_findings
    import sector_findings
    art = json.loads((HERE / "eu_ai_act_article_map.json").read_text())
    return {
        "eu_ai_act_findings.AXIS_TO_OBLIGATION": set(eu_ai_act_findings.AXIS_TO_OBLIGATION),
        "eu_ai_act_article_map.json:articles[].measured_axes":
            {ax for a in art["articles"].values() for ax in a["measured_axes"]},
        "sector_findings.SECTOR_PROFILES[].axes":
            {ax for p in sector_findings.SECTOR_PROFILES.values() for ax in p["axes"]},
    }


def _selftest() -> int:
    ok = True

    def expect(name, cond, detail=""):
        nonlocal ok
        print(f"  {'PASS' if cond else 'FAIL'}  {name}" + (f" — {detail}" if not cond and detail else ""))
        ok = ok and cond

    board = {"axis-a": {}, "jail": {}, "detector-interop": {}}

    try:
        check_axis_keys({"jail", "detector-interop"}, board, "good-map")
        expect("a map whose keys all resolve passes", True)
    except AxisMappingError as e:
        expect("a map whose keys all resolve passes", False, str(e))

    # The exact keys that were live in the estate before this fix.
    for bad in ("jailbreak-resistance", "det", "mcp", "xsr", "agi"):
        try:
            check_axis_keys({bad}, board, "bad-map")
            expect(f"rejects the pre-fix key {bad!r}", False, "it was accepted")
        except AxisMappingError as e:
            expect(f"rejects the pre-fix key {bad!r}", bad in str(e))

    # An empty / errored board must never read as "all keys resolve".
    for name, payload in (("errored board", {"error": "HTTP 500"}),
                          ("axis-less board", {"axes": []}),
                          ("non-dict board", None)):
        try:
            axis_index(payload)
            expect(f"{name} -> BoardUnavailable", False, "it was accepted")
        except BoardUnavailable:
            expect(f"{name} -> BoardUnavailable", True)
        except Exception as e:                    # noqa: BLE001
            expect(f"{name} -> BoardUnavailable", False, f"{type(e).__name__}: {e}")

    print("  selftest:", "OK" if ok else "FAILED")
    return 0 if ok else 1


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--json", action="store_true")
    a = ap.parse_args()
    if a.selftest:
        return _selftest()

    try:
        idx = axis_index(get("/api/gspc"))
    except BoardUnavailable as e:
        print(f"axis-map-check: BOARD UNAVAILABLE — {e}", file=sys.stderr)
        print("axis-map-check: an unchecked map is not a checked map. FAIL.", file=sys.stderr)
        return 3

    sources = collect_sources()
    failures = []
    for src, keys in sources.items():
        try:
            check_axis_keys(keys, idx, src)
            print(f"  OK    {src}: {len(keys)} key(s) resolve")
        except AxisMappingError as e:
            failures.append(str(e))
            print(f"  FAIL  {e}")

    if a.json:
        print(json.dumps({"board_axes": sorted(idx),
                          "sources": {k: sorted(v) for k, v in sources.items()},
                          "failures": failures}, indent=2))
    if failures:
        print(f"axis-map-check: FAIL — {len(failures)} source(s) name axes the board does "
              "not carry. Those axes would have been reported UNMEASURED.", file=sys.stderr)
        return 4
    print(f"axis-map-check: PASS — every axis key in {len(sources)} source(s) resolves "
          f"against the {len(idx)}-axis board.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

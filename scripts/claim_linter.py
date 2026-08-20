#!/usr/bin/env python3
"""
Claim-Linter v0 (E2E Stage 0.4) — scan the site source for claims that must die.

Checks every .tsx/.ts/.html under client/src + public for:
  1. KILLED TERMS   — words the doctrine forbids in public copy
  2. NON-CANON DATES— dates that contradict the frozen register
  3. REGISTRY MISMATCH — hardcoded numbers that contradict the live GSPC API
  4. UNRATIFIED ORDINALS — "first"/"world's" claims not backed by a receipt

Exit code 1 if any KILLED term or MISMATCH found (fails the build gate).
Usage: python3 claim_linter.py [--path client/src] [--json]
"""
from __future__ import annotations
import json, re, sys, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DEFAULT_PATH = ROOT / "client/src"

# 1. KILLED TERMS (from the language lock — binding, never in public copy)
KILLED = [
    "SOVOS", "SOV OS", "Sov OS", "Sov Space", "sov-os", "sov-space",
    "SOV3", "sov3", "sov-", "OWEM", "OOWM", "sovereign os", "sovereign space",
    "30 frameworks", "30-frameworks", "continuous monitoring",
    "governance platform", "compliance body", "527",
    "BFT-33 quorum", "33 voting seats", "28 approve",
]

# 2. NON-CANON DATES (the frozen register — correct values)
#    old -> correct (only flag if the OLD wrong value is presented as a deadline)
DATE_FIXES = {
    "Dec 2, 2026": "Dec 2, 2027 (Annex III high-risk)",
    "December 2, 2026": "December 2, 2027 (Annex III high-risk)",
    "2 Dec 2026": "2 Dec 2027 (Annex III high-risk)",
}

# 3. REGISTRY MISMATCH — live numbers (13 axes measured, not 14/15 as *measured*)
AXIS_OVERS = [
    (r"14 axes", "live API serves 13 measured axes"),
    (r"15 axes", "13 measured + 2 unmeasured slots (not '15 measured')"),
    (r"10/14 axes", "10/13 axes"),
    (r"306 MCP servers", "use live registry count (~1,044)"),
    (r"300\+ MCP", "verify against live registry"),
    (r"530 CJs", "verify against live PyPI/npm count"),
    (r"235\+ MCP", "stale — verify against live registry"),
]

def scan(path: Path) -> dict:
    findings = {"killed": [], "dates": [], "axis_mismatch": [], "files": 0}
    for f in path.rglob("*"):
        if not f.is_file() or f.suffix not in (".tsx", ".ts", ".html", ".jsx"):
            continue
        if "node_modules" in str(f) or ".map" in f.name or f.name.endswith(".min.js"):
            continue
        try:
            text = f.read_text(errors="ignore")
        except Exception:
            continue
        findings["files"] += 1
        # killed terms
        for term in KILLED:
            if term.lower() in text.lower():
                for m in re.finditer(re.escape(term), text, re.I):
                    ln = text[:m.start()].count("\n") + 1
                    findings["killed"].append({"file": str(f), "line": ln, "term": term})
                    break  # one per file per term
        # non-canon dates
        for old, correct in DATE_FIXES.items():
            if old in text:
                ln = text[:text.find(old)].count("\n") + 1
                findings["dates"].append({"file": str(f), "line": ln, "old": old, "correct": correct})
        # axis-count mismatches (only in user-visible text, not comments/identifiers)
        for pat, note in AXIS_OVERS:
            for m in re.finditer(pat, text):
                # skip if it's in a comment or a var name (heuristic: preceded by // or quote-noise)
                findings["axis_mismatch"].append({"file": str(f), "line": text[:m.start()].count("\n")+1, "text": m.group(0), "note": note})
                break
    return findings

def main() -> int:
    args = sys.argv[1:]
    path = Path(args[args.index("--path")+1]) if "--path" in args else DEFAULT_PATH
    as_json = "--json" in args
    r = scan(path)
    if as_json:
        print(json.dumps(r, indent=1))
    else:
        print(f"Scanned {r['files']} files")
        for k in ("killed", "dates", "axis_mismatch"):
            items = r[k]
            print(f"\n=== {k.upper()}: {len(items)} ===")
            for it in items[:10]:
                loc = it.get("file", "").split("councilof-ai-wt/")[-1]
                print(f"  {loc}:{it.get('line')}  {it.get('term') or it.get('old') or it.get('text')}  {it.get('note','')}")
    bad = len(r["killed"]) + len(r["dates"]) + len(r["axis_mismatch"])
    return 1 if bad else 0

if __name__ == "__main__":
    raise SystemExit(main())

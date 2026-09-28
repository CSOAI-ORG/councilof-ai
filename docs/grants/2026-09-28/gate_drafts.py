#!/usr/bin/env python3
"""Outward gate for grant drafts (lane grants-20260928). Measures only; submits nothing.

For each file: NOTICE_BANNED must find nothing, and every doctrine_check (prices=True) must PASS.
Both come from scripts/outward-gate/outward_gate.py in this checkout, never a copy of its rules.
Usage: python3 gate_drafts.py FILE [FILE ...]   -> JSON on stdout; exit 0 only if every file is at 100%.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(REPO, "scripts", "outward-gate"))
import outward_gate as og  # noqa: E402


def gate(path):
    raw = open(path, encoding="utf-8").read()
    banned = [og.clip(raw[max(0, m.start() - 30): m.end() + 30], 80) for m in og.NOTICE_BANNED.finditer(raw)]
    checks = og.doctrine_checks(og.md_text(raw), "/notice", prices=True)
    passes = sum(1 for c in checks if c["status"] == og.PASS) + (1 if not banned else 0)
    total = len(checks) + 1
    return {"file": os.path.basename(path), "bytes": len(raw.encode()), "notice_banned": banned,
            "doctrine_checks": [{"check": c["check"], "status": c["status"], "evidence": c["evidence"]} for c in checks],
            "score_pct": round(100.0 * passes / total, 1), "gate": "OPEN" if passes == total else "CLOSED"}


if __name__ == "__main__":
    res = [gate(p) for p in sys.argv[1:]]
    print(json.dumps(res, indent=1, ensure_ascii=False))
    sys.exit(0 if res and all(r["gate"] == "OPEN" for r in res) else 1)

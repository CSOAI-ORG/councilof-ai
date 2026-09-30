#!/usr/bin/env python3
"""Run the outward gate's text checks over staged outward material (drafts and export files).

PASS for a file means: NOTICE_BANNED finds nothing AND every doctrine_check (prices=True) is PASS.
Markdown is read the way the gate reads markdown (front matter and tags stripped); JSON is read as
the concatenation of every string value in it. Brand rules come from scripts/brand-gate.mjs via
node; if they cannot be loaded the gate fails closed.

    PATH=/workspace/node20/bin:$PATH python3 outward_check.py <file> [...]
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "scripts", "outward-gate"))
import outward_gate as og  # noqa: E402


def strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, dict):
        for k, v in o.items():
            yield str(k)
            yield from strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from strings(v)


def text_of(p):
    raw = open(p, encoding="utf-8").read()
    if p.endswith(".json"):
        return "\n".join(strings(json.loads(raw)))
    return og.md_text(raw) if p.endswith(".md") else raw


out, ok_all = [], True
for p in sys.argv[1:]:
    t = text_of(p)
    banned = [og.clip(t[max(0, m.start() - 30): m.end() + 30], 80) for m in og.NOTICE_BANNED.finditer(t)]
    checks = og.doctrine_checks(t, "/" + os.path.basename(p), prices=True)
    res = [{"check": c["check"], "status": c["status"], "evidence": c["evidence"]} for c in checks]
    ok = not banned and all(r["status"] == og.PASS for r in res)
    ok_all &= ok
    out.append({"file": os.path.relpath(p, HERE), "NOTICE_BANNED": banned, "doctrine_checks": res, "at_100": ok})
print(json.dumps({"all_at_100": ok_all, "files": out}, indent=1))
sys.exit(0 if ok_all else 1)

#!/usr/bin/env python3
"""Guard for public/interop/gspc-one.json: only public, signed-correctly rows may publish."""
import json, sys

UNSIGNED_CLASSES = {"ai-lab", "measurer-harness-org", "mcp-server", "agent", "ai-company", "harness"}
PLANNED_CLASSES = {"humanoid-lab", "interpretability-group"}
PRIVATE_CLASSES = {"interop-group"}
PRIVATE_STATUSES = {"private", "archived"}
PRIVATE_MARKERS = ("private", "do not publish", "do-not-publish")


def _falsy_flag(v):
    return v is False or (isinstance(v, str) and v.strip().lower() in ("false", "no", "0"))


def _truthy_flag(v):
    return v is True or (isinstance(v, str) and v.strip().lower() in ("true", "yes", "1"))


def _strings(v):
    if isinstance(v, str):
        yield v
    elif isinstance(v, dict):
        for x in v.values():
            yield from _strings(x)
    elif isinstance(v, list):
        for x in v:
            yield from _strings(x)


def row_problems(r):
    p = []
    if r.get("lane") not in ("signed", "unsigned", "hosted-api"):
        p.append("bad lane")
    if r.get("subject_class") in UNSIGNED_CLASSES and r.get("lane") != "unsigned":
        p.append("unsigned class presented as signed")
    if r.get("subject_class") in PLANNED_CLASSES:
        p.append("planned class must be empty")
    if r.get("subject_class") in PRIVATE_CLASSES:
        p.append("private class interop-group")
    if r.get("lane") == "hosted-api" and r.get("signed"):
        p.append("hosted-api row signed")
    if not r.get("group"):
        p.append("missing group")
    if "published" in r and _falsy_flag(r["published"]):
        p.append("published false")
    for k in ("private", "is_private"):
        if k in r and _truthy_flag(r[k]):
            p.append("private flag")
    for k in ("status", "visibility"):
        v = r.get(k)
        if isinstance(v, str) and v.strip().lower() in PRIVATE_STATUSES:
            p.append(f"{k} {v.strip().lower()}")
    blob = json.dumps(r, ensure_ascii=False).lower()
    if "certif" in blob:
        p.append("forbidden word")
    vals = " ".join(_strings(r)).lower()
    if any(m in vals for m in PRIVATE_MARKERS):
        p.append("private/do-not-publish marker")
    return p


def check(d):
    return [(i, r.get("subject"), pr) for i, r in enumerate(d["rows"]) if (pr := row_problems(r))]


def main(path):
    d = json.load(open(path, encoding="utf-8"))
    bad = check(d)
    if bad:
        print("FAIL", len(bad), bad[:5])
        return 1
    print("ok", len(d["rows"]), "rows")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1]))

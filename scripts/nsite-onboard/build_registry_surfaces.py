#!/usr/bin/env python3
"""Build a source record of Layer O surfaces that exist but have never been onboarded.

Why: on 2026-09-29 the lane's queue came out empty — build_queue.py extracted 138 candidate
surfaces from the five owner source records and rejected all 138 as already in the Layer O
registry, so onboard_one.py saw an empty queue, wrote QUEUE_EMPTY and stopped itself. The
ten-minute puller on the M4 kept copying the frozen log, so the lane looked alive for 28 days.

The five owner records are exhausted. The estate's own registry is not: it carries 267 rows with
URLs, of which only a handful have ever been onboarded. "In the registry" and "presence measured"
are different facts, and the lane had been conflating them.

This writes surfaces/<name>.md, one surface per row, sha256-pinned to the registry bytes it was
derived from. build_queue.py reads it like any other source record.

    python3 build_registry_surfaces.py --registry ~/lanes/layer-o-registry \
        --out sources/REGISTRY-PRESENCE-SURFACES-<date>.md
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, datetime

def sha_file(p: str) -> str:
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()

def regdom(h: str) -> str:
    h = re.sub(r"^https?://", "", (h or "").strip()).split("/")[0].split(":")[0].lower().strip(".")
    if not h or "." not in h: return h
    parts = h.split(".")
    if len(parts) <= 2: return h
    two = ".".join(parts[-2:])
    multi = {"co.uk","org.uk","gov.uk","ac.uk","com.au","co.jp","com.cn","github.io","pages.dev",
             "netlify.app","hf.space","workers.dev","service.gov.uk","gov.sg","com.sg"}
    if two in multi: return ".".join(parts[-3:])
    return two

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--registry", default=os.path.expanduser("~/lanes/layer-o-registry"))
    ap.add_argument("--sources", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "sources"))
    ap.add_argument("--out", default=None)
    a = ap.parse_args()

    reg = os.path.join(a.registry, "registry.jsonl")
    reg_sha = sha_file(reg)

    onboarded = set()
    for name in ("onboarded.jsonl",):
        p = os.path.join(a.registry, name)
        if os.path.exists(p):
            for l in open(p):
                l = l.strip()
                if l:
                    try: onboarded.add(json.loads(l)["domain"])
                    except Exception: pass
    done = set()
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "done.jsonl")
    if os.path.exists(p):
        for l in open(p):
            l = l.strip()
            if l:
                try: done.add(json.loads(l).get("domain", ""))
                except Exception: pass

    seen, rows = set(), []
    for l in open(reg):
        l = l.strip()
        if not l: continue
        try: r = json.loads(l)
        except Exception: continue
        url = r.get("url") or ""
        if not url.startswith("http"): continue
        dom = regdom(url)
        if not dom or "." not in dom: continue
        if dom in onboarded or dom in done or dom in seen: continue
        seen.add(dom)
        ad = r.get("adapter") or {}
        cls = ad.get("class") or r.get("class") or "other"
        pop = None
        cp = ad.get("current_presence") or {}
        ev = cp.get("evidence") or {}
        if isinstance(ev, dict):
            o = ev.get("observed")
            if isinstance(o, int): pop = o
        rows.append((url, dom, cls, pop))

    date = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    out = a.out or os.path.join(a.sources, f"REGISTRY-PRESENCE-SURFACES-{date}.md")
    lines = [
        f"# Layer O surfaces with presence never measured — {date}",
        "",
        "Source record for the N-site onboard lane. Derived from the Layer O registry",
        f"({reg}) by build_registry_surfaces.py.",
        f"registry sha256: {reg_sha}",
        "",
        "These surfaces are already known to the estate — the registry names them — but the lane",
        "had never measured PRESENCE on them. Known is not measured. Rows already onboarded, and",
        "domains already in done.jsonl, are excluded.",
        "",
        "| surface | registry class | population |",
        "|---|---|---|",
    ]
    for url, dom, cls, pop in rows:
        lines.append(f"| {url} | {cls} | {pop if pop is not None else ''} |")
    lines.append("")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(json.dumps({"out": os.path.basename(out), "registry_sha256": reg_sha,
                      "candidates": len(rows), "onboarded_excluded": len(onboarded),
                      "done_excluded": len(done)}, indent=1))

if __name__ == "__main__":
    main()

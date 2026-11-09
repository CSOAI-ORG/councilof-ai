#!/usr/bin/env python3
"""Build a source record from the sovereign-eater's site universe.

Why: the Layer O registry's surfaces are finite (267) and the restored lane consumed 70 of them
in 70 minutes. A hunt needs a source that keeps producing. The estate already maintains one:
~/greenfield-sov/sites_universe.txt — 1,883 regulators, standards bodies, AI companies and
institutions, rebuilt by `python3 scripts/site_universe.py`. The sovereign-eater lane scores
those sites for sovereign predicates; the onboard lane asks a different question (is CSOAI
present, is there a readable search API, is the surface joinable). Both are read-only GETs.

Domains the onboard lane has already done are excluded, so the two lanes do not repeat each
other's work on the same surface.

    python3 build_greenfield_surfaces.py --universe ~/greenfield-sov/sites_universe.txt \\
        --out sources/GREENFIELD-SURFACES-<date>.md
"""
from __future__ import annotations
import argparse, hashlib, json, os, re, datetime

def sha_file(p):
    h = hashlib.sha256()
    with open(p, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""):
            h.update(b)
    return h.hexdigest()

def regdom(h):
    h = re.sub(r"^https?://", "", (h or "").strip()).split("/")[0].split(":")[0].lower().strip(".")
    if not h or "." not in h: return h
    p = h.split(".")
    if len(p) <= 2: return h
    two = ".".join(p[-2:])
    multi = {"co.uk","org.uk","gov.uk","ac.uk","com.au","co.jp","com.cn","github.io","pages.dev",
             "netlify.app","hf.space","workers.dev","service.gov.uk","gov.sg","com.sg"}
    if two in multi: return ".".join(p[-3:])
    return two

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--universe", default=os.path.expanduser("~/greenfield-sov/sites_universe.txt"))
    ap.add_argument("--sources", default=os.path.join(os.path.dirname(os.path.abspath(__file__)), "sources"))
    ap.add_argument("--out", default=None)
    a = ap.parse_args()
    usha = sha_file(a.universe)

    done = set()
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "done.jsonl")
    if os.path.exists(p):
        for l in open(p):
            l = l.strip()
            if l:
                try: done.add(json.loads(l).get("domain", ""))
                except Exception: pass

    seen, rows = set(), []
    for line in open(a.universe, encoding="utf-8", errors="replace"):
        line = line.strip()
        if not line or line.startswith("#") or not line.startswith("http"): continue
        dom = regdom(line)
        if not dom or "." not in dom or dom in done or dom in seen: continue
        seen.add(dom); rows.append((line, dom))

    date = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d")
    out = a.out or os.path.join(a.sources, f"GREENFIELD-SURFACES-{date}.md")
    lines = [
        f"# Sovereign-eater site universe — surfaces never onboarded — {date}",
        "",
        "Source record for the N-site onboard lane. Derived from",
        f"{a.universe} by build_greenfield_surfaces.py.",
        f"universe sha256: {usha}",
        "",
        "The universe is the estate's own regenerating list of regulators, standards bodies, AI",
        "companies and institutions. The sovereign-eater lane scores these for sovereign",
        "predicates; the onboard lane asks whether CSOAI is present and whether the surface is",
        "joinable. Domains already onboarded here are excluded.",
        "",
        "| surface |",
        "|---|",
    ]
    for url, dom in rows:
        lines.append(f"| {url} |")
    lines.append("")
    with open(out, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(json.dumps({"out": os.path.basename(out), "universe_sha256": usha,
                      "candidates": len(rows), "done_excluded": len(done)}, indent=1))

if __name__ == "__main__":
    main()

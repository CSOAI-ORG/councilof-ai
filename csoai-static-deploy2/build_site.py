#!/usr/bin/env python3
"""Assemble the publishable site into _site/ from an ALLOWLIST.

Why this exists
---------------
`wrangler.toml` set `pages_build_output_dir = "."` and SOVEREIGN_DEPLOY.sh ran
`wrangler pages deploy <repo root>`, so the entire repository was the publish
directory. Verified live on www.csoai.org on 2026-08-05:

    /.env                                 200, 1,296 bytes   <- credential exposure
    /wrangler.toml                        200,   421 bytes   <- SIGIL_SECRET in [vars]
    /SOVEREIGN_DEPLOY.sh                  200, 2,996 bytes
    /govbench_eval.py                     200, 89,736 bytes
    /runs/.../transcripts.jsonl           200, 807,062 bytes <- red-team transcripts

A path that does not exist returns the 4,164-byte homepage, so those are real files.

`.cfignore` already listed `*.jsonl` and `benchmark-results/` and the .jsonl was served
anyway — .cfignore is not honoured on this deploy path. A denylist cannot be trusted
here, and a denylist is the wrong shape regardless: it fails open. Every file added to
the repo in future is published unless someone remembers to exclude it. An allowlist
fails closed, which is the only safe default for a directory that also holds keys.

Usage
-----
    python3 build_site.py            # build _site/ and report
    python3 build_site.py --check    # verify sitemap coverage, build nothing

Then deploy _site/ instead of the repo root.
"""

import argparse
import os
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "_site"

# Root-level files ship by extension. Note .json is NOT here: 109 root .json files are
# internal state (autopilot_state.json, coverage_status.json …). Public JSON is named
# explicitly below.
ROOT_EXTS = {".html", ".txt", ".xml", ".svg", ".css", ".js", ".webmanifest", ".ico", ".png"}

# Directories that are part of the site.
DIRS = ["tools", ".well-known", "assets", "images", "static", "_templates",
        "agui-learning",
        # verified live and serving real content (not the 4,164-byte soft-404) on
        # 2026-08-05: /portal/ 19,235 B · /sovereign-wiki/ 4,947 B · /eu-ai-act/ 5,427 B
        # and its sub-routes /eu-ai-act/summary, /risk, /high-risk, /compliance.
        "portal", "sovereign-wiki", "eu-ai-act", "badge", "proof-anchors", "corrections",
        # Frozen card-v0 schema + (optional) public-root leaves. Twin of
        # councilof.ai/schema/card-v0.json — not a second board.
        "schema", "cards", "proofs",
        # 2026-09-01 OWNER: one website = councilof.ai. Do NOT ship functions/.
        # Pages Functions run ahead of _redirects, so the #55 catch-all
        # (/* -> https://councilof.ai/:splat 308!) never fired while /api/*
        # workers were published. Dropping functions lets _redirects win.
        # (was: "functions")
        ]


# Public JSON, named one by one. Anything not listed does not ship.
JSON_ALLOW = {
    "agent.json", "mcp.json", "ecosystem.json", "manifest.json", "llm-manifest.json",
    "agent-card.json", "openapi.json", "verification.schema.json", "banks-manifest.json", "mcp.json", "ai-plugin.json", "dataset-metadata.json",
    "drift-feed.json",  # live SOV measurement feed — consumed by sov-space-vwm + sov-globe-portal
    "jspace_deck.json",  # J-space visual deck (Wave-3): served /jspace_deck.json
    "c_space_card.json",  # C-space fold (Wave-3): served /c_space_card.json
    "agui-knowledge.json",  # AG UI 15-axis competitor/peer learning bundle — public machine feed for the seamless AG UI
    # Public-root twin of councilof.ai (permissionless Merkle, not GSPC).
    # Root-level *.json is otherwise internal state; these two are named.
    "root.json",
    "publisher-health.json",
}

# Named public files whose extension is NOT in ROOT_EXTS (.md/.pdf). Each was
# verified live with real bytes on csoai.org 2026-08-05 and is public on
# purpose; dropping them in the first _site deploy would silently kill live URLs.
EXTRA_FILES = {
    "PROVBENCH_ARXIV_PREPRINT_2026-07-30.md", "CANONICAL-DOIS.md",  # /PROVBENCH_ARXIV_PREPRINT_2026-07-30.md 11,296 B
    "API_DOCUMENTATION.md",                     # /API_DOCUMENTATION.md 3,419 B
    "ARENA_SUBMISSION.md",                      # /ARENA_SUBMISSION.md 449 B
    "PROVBENCH_PAPER.pdf",                      # /PROVBENCH_PAPER.pdf 5,009 B
    "WHITEPAPER.pdf",                           # /WHITEPAPER.pdf 8,258 B
    "AUDIT_PACKAGE.pdf",                        # /AUDIT_PACKAGE.pdf 3,930 B
    # Cloudflare Pages reads /_redirects from the publish dir at request time. The
    # allowlist has no extension rule for the bare "_redirects" filename, so this
    # file was being silently dropped from _site/ and the live site served
    # index.html for /arena and /gspc-arena — the "hydration crash" observed
    # 2026-08-01 was actually a routing miss, not a JS failure. Adding it here.
    "_redirects",
}

# Never ship, even if an extension rule would otherwise allow it.
NEVER = re.compile(
    r"(^\.env|\.env$|\.env\.|(^|/)\.git|\.pem$|\.key$|_rsa$|(^|/)\.ssh/|"
    r"wrangler\.toml$|\.cfignore$|SOVEREIGN_DEPLOY\.sh$|\.sh$|\.py$|\.jsonl$|"
    r"(^|/)\.backups?/|(^|/)runs/|(^|/)node_modules/|\.log$|\.sqlite)", re.I)

# Pages whose identity is a retired/banned brand or an internal engine surface
# (EAT contract 17 Aug: no sov-* product/engine names public, no MEOK OS chrome,
# no OOWM demo while the weld is UNMEASURED). Files stay in the repo for history;
# they are not published and their routes 308 to the honest desks in _redirects.
NEVER_HTML = {
    "master.html",          # SOV33 OWEM Master Hub — internal engine name
    "sov_space_visual.html",# SOV-Space — banned product name (main #26 precedent)
    "mcp-install.html",     # "Install Sovereign OS" — SOVOS brand being retired
    "pulse.html",           # MEOK OS internal chrome
    "experiments.html",     # MEOK OS internal chrome
    "oowm-demo.html",       # OOWM demo — weld is UNMEASURED, do not publicize
}


def publishable():
    picked = []
    for p in sorted(ROOT.glob("*")):
        if p.is_file() and not NEVER.search(p.name) and p.name not in NEVER_HTML:
            # *.llm.json are the machine-readable companions every page already links
            # to with rel="alternate". 249 such links existed and not one file did, so
            # crawlers got the homepage as text/html. Generated by make_llm_json.py.
            if (p.suffix.lower() in ROOT_EXTS or p.name in JSON_ALLOW
                    or p.name in EXTRA_FILES
                    or p.name.endswith(".llm.json")
                    or re.match(r"tick-\d+-sigil\.json$", p.name)):
                picked.append(p)
    for d in DIRS:
        base = ROOT / d
        if not base.is_dir():
            continue
        for p in sorted(base.rglob("*")):
            if p.is_file():
                rel = p.relative_to(ROOT).as_posix()
                if not NEVER.search(rel):
                    picked.append(p)
    return picked


def sitemap_urls():
    sm = ROOT / "sitemap.xml"
    if not sm.exists():
        return []
    urls = re.findall(r"<[^>]*loc>\s*([^<]+?)\s*</[^>]*loc>", sm.read_text(errors="replace"))
    out = []
    for u in urls:
        path = re.sub(r"^https?://[^/]+", "", u).split("?")[0].split("#")[0]
        if path in ("", "/"):
            path = "/index.html"
        out.append(path)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true")
    args = ap.parse_args()

    files = publishable()
    total = sum(f.stat().st_size for f in files)
    print(f"publishable files: {len(files)}  ({total/1e6:.1f} MB)")

    rels = {f.relative_to(ROOT).as_posix() for f in files}

    # Coverage: does every sitemap URL have a file behind it? Backup paths are excluded
    # on purpose — 240 of the sitemap's URLs point at /.backups/ and all serve the
    # homepage, so they are duplicate-content noise, not pages.
    urls = sitemap_urls()
    real = [u for u in urls if "/.backups" not in u]
    missing = []
    for u in real:
        cand = u.lstrip("/")
        if cand in rels or f"{cand}.html" in rels or f"{cand}/index.html" in rels:
            continue
        missing.append(u)
    print(f"sitemap URLs: {len(urls)}  (backup paths: {len(urls)-len(real)})")
    print(f"sitemap URLs with no file in the allowlist: {len(missing)}")
    for m in missing[:15]:
        print(f"    MISSING {m}")

    for probe in (".env", "wrangler.toml", "SOVEREIGN_DEPLOY.sh", "govbench_eval.py",
                  "positioning_guard.py", ".cfignore"):
        assert probe not in rels, f"ALLOWLIST LEAK: {probe} would ship"
    assert not any(r.endswith(".jsonl") for r in rels), "ALLOWLIST LEAK: a .jsonl would ship"
    assert not any(r.startswith("runs/") for r in rels), "ALLOWLIST LEAK: runs/ would ship"
    print("leak probes: none of .env / wrangler.toml / *.py / *.jsonl / runs/ would ship")

    if args.check:
        return 0 if not missing else 1

    if OUT.exists():
        shutil.rmtree(OUT)
    for f in files:
        dst = OUT / f.relative_to(ROOT)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(f, dst)
    print(f"built {OUT} — deploy THIS, not the repo root")
    return 0


if __name__ == "__main__":
    sys.exit(main())

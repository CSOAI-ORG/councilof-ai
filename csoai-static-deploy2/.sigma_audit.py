#!/usr/bin/env python3
"""
Phase G — Sigma check audit.
For each defoneos-*.html, audit 8 sovereign signals.

Signals:
  S1: meta name="description"
  S2: link rel="canonical"
  S3: og:title AND og:description (both required)
  S4: JSON-LD Article schema (application/ld+json with @type Article or similar)
  S5: Article 50 banner (text mentioning EU AI Act Article 50)
  S6: link to /master (canonical or absolute path)
  S7: SIGIL footer or receipt reference (SIGIL|... or receipt|sigil or sigil-anchor)
  S8: CTA to /defoneos-article-50 or /defoneos-owem-rfq
"""
import os
import re
import sys
import json
from pathlib import Path
from collections import defaultdict

ROOT = Path("/Users/nicholas/clawd/csoai-static-deploy2")
OUT = ROOT / ".sigma_audit_results.json"

# Match a defoneos page (exclude defoneos.html itself? include it; it's still a defoneos page)
PAGE_RE = re.compile(r"^defoneos-.*\.html$")

# Patterns (case-insensitive where appropriate)
RE_DESC = re.compile(r'<meta\s+[^>]*name=["\']description["\'][^>]*>', re.IGNORECASE)
RE_CANON = re.compile(r'<link\s+[^>]*rel=["\']canonical["\'][^>]*>', re.IGNORECASE)
RE_OG_TITLE = re.compile(r'<meta\s+[^>]*property=["\']og:title["\'][^>]*>', re.IGNORECASE)
RE_OG_DESC = re.compile(r'<meta\s+[^>]*property=["\']og:description["\'][^>]*>', re.IGNORECASE)
RE_JSONLD = re.compile(r'<script\s+[^>]*type=["\']application/ld\+json["\'][^>]*>', re.IGNORECASE)
# Article schema — look for "@type":"Article" or '"@type": "Article"' inside JSON-LD scripts
RE_ARTICLE_SCHEMA = re.compile(r'"@type"\s*:\s*"Article"', re.IGNORECASE)
# Article 50 banner — looks for Article 50 + EU AI Act references
RE_ART50 = re.compile(r'(Article\s*50|EU\s+AI\s+Act)', re.IGNORECASE)
# Link to /master
RE_MASTER = re.compile(r'href=["\'][^"\']*/master["\']', re.IGNORECASE)
# SIGIL footer or receipt reference
RE_SIGIL = re.compile(r'(SIGIL[\s\|:]|receipt[\s\-:]|sigil[\-:]anchor|sigil-chain|sigil_digest)', re.IGNORECASE)
# CTA
RE_CTA_50 = re.compile(r'href=["\'][^"\']*/defoneos-article-50["\']', re.IGNORECASE)
RE_CTA_RFQ = re.compile(r'href=["\'][^"\']*/defoneos-owem-rfq["\']', re.IGNORECASE)


def audit_file(path: Path):
    try:
        content = path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        return {f"S{i}": False for i in range(1, 9)} | {"_err": str(e), "_size": 0}

    size = len(content)

    # S1 description
    s1 = bool(RE_DESC.search(content))
    # S2 canonical
    s2 = bool(RE_CANON.search(content))
    # S3 og:title + og:description (both)
    s3 = bool(RE_OG_TITLE.search(content)) and bool(RE_OG_DESC.search(content))
    # S4 JSON-LD + Article schema. Look for at least one JSON-LD script containing Article.
    has_jsonld = bool(RE_JSONLD.search(content))
    has_article = bool(RE_ARTICLE_SCHEMA.search(content))
    s4 = has_jsonld and has_article
    # S5 Article 50 banner
    s5 = bool(RE_ART50.search(content))
    # S6 /master link
    s6 = bool(RE_MASTER.search(content))
    # S7 SIGIL footer or receipt reference
    s7 = bool(RE_SIGIL.search(content))
    # S8 CTA to /defoneos-article-50 or /defoneos-owem-rfq
    s8 = bool(RE_CTA_50.search(content)) or bool(RE_CTA_RFQ.search(content))

    return {
        "S1": s1, "S2": s2, "S3": s3, "S4": s4,
        "S5": s5, "S6": s6, "S7": s7, "S8": s8,
        "_size": size,
        "_has_jsonld": has_jsonld,
        "_has_article": has_article,
    }


def main():
    files = sorted(p for p in ROOT.iterdir() if p.is_file() and PAGE_RE.match(p.name))
    print(f"[sigma-audit] Found {len(files)} defoneos-*.html pages", file=sys.stderr)

    results = []
    for p in files:
        r = audit_file(p)
        r["page"] = p.name
        results.append(r)

    OUT.write_text(json.dumps(results, indent=2))
    print(f"[sigma-audit] Wrote {OUT}", file=sys.stderr)

    # Compute grand totals
    totals = {f"S{i}": sum(1 for r in results if r.get(f"S{i}")) for i in range(1, 9)}
    totals["total_pages"] = len(results)
    failing = sum(1 for r in results if sum(1 for i in range(1, 9) if not r.get(f"S{i}")) >= 1)
    totals["pages_failing_1plus"] = failing
    totals["pages_passing_all8"] = sum(
        1 for r in results
        if all(r.get(f"S{i}") for i in range(1, 9))
    )

    (ROOT / ".sigma_audit_totals.json").write_text(json.dumps(totals, indent=2))
    print(f"[sigma-audit] Totals: {totals}", file=sys.stderr)


if __name__ == "__main__":
    main()
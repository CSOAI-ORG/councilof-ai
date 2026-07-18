#!/usr/bin/env python3
"""Basic SEO keyword audit for empire deploy directories.

Scans index.html files for target keywords and reports coverage.

Usage:
    python3 scripts/seo-keyword-audit.py
"""
from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
REPORT = ROOT / "_findings" / "SEO_KEYWORD_AUDIT_2026-06-17.json"

TARGET_KEYWORDS = [
    "EU AI Act",
    "Article 50",
    "AI compliance",
    "AI governance",
    "MCP",
    "Layer 0",
    "attestation",
    "DORA",
    "NIS2",
    "GDPR",
    "ISO 42001",
]


def extract_text(path: Path) -> str:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    # Extract meta description content
    meta_desc = ""
    m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)["\']', raw, re.I)
    if not m:
        m = re.search(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']description["\']', raw, re.I)
    if m:
        meta_desc = m.group(1) + " "
    # Extract title
    title = ""
    m = re.search(r'<title>([^<]+)</title>', raw, re.I)
    if m:
        title = m.group(1) + " "
    # Body text
    text = re.sub(r"<script[^>]*>.*?</script>", " ", raw, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=re.DOTALL | re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return title + meta_desc + text


def audit_dir(deploy_dir: Path) -> dict | None:
    index = deploy_dir / "index.html"
    if not index.exists():
        return None
    text = extract_text(index).lower()
    matches = {kw: kw.lower() in text for kw in TARGET_KEYWORDS}
    score = sum(matches.values())
    return {
        "dir": deploy_dir.name,
        "score": score,
        "matches": matches,
    }


def main():
    dirs = sorted(d for d in ROOT.glob("*-deploy") if d.is_dir())
    results = []
    for d in dirs:
        res = audit_dir(d)
        if res:
            results.append(res)

    results.sort(key=lambda r: r["score"], reverse=True)

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "target_keywords": TARGET_KEYWORDS,
        "total_dirs": len(results),
        "average_score": round(sum(r["score"] for r in results) / len(results), 2) if results else 0,
        "results": results,
    }

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(f"Audited {len(results)} deploy directories")
    print(f"Average keyword coverage: {report['average_score']}/{len(TARGET_KEYWORDS)}")
    print("\nTop 10:")
    for r in results[:10]:
        print(f"  {r['dir']}: {r['score']}/{len(TARGET_KEYWORDS)}")
    print("\nBottom 10:")
    for r in results[-10:]:
        print(f"  {r['dir']}: {r['score']}/{len(TARGET_KEYWORDS)}")
    print(f"\nReport: {REPORT}")


if __name__ == "__main__":
    main()

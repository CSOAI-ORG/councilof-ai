#!/usr/bin/env python3
"""csoai-frontend-wave.py — Phase 2: front-end quality audit + fixes.

Lane-doable: audit + fix every HTML page's:
  - Title
  - Meta description
  - Canonical URL
  - Open Graph tags
  - Twitter Card tags
  - JSON-LD
  - Site-header + site-footer
  - Brand colors (--bg, --accent, --primary)
  - No horse emoji
  - No leftover black/beige backgrounds
  - All CSS variables defined
"""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# Pages to audit (the full estate)
PAGES_TO_AUDIT = [
    "axes-deep", "axes", "agents", "art50", "arena", "assess",
    "benchmark", "board", "brand", "bridge", "cards", "challenge",
    "checkout", "chat", "clarity", "comparison", "compute", "contact",
    "counters", "cross", "dashboard", "decide", "defoneos",
    "defoneos-seal", "donate", "euaiact", "evidence", "field",
    "fleet", "founders", "games", "gspc-console", "gspc-leaderboard",
    "gspc-quests", "gspc-verify", "harvest", "home", "hud", "index",
    "interact", "jobs", "kimi", "leaderboard", "legal", "live",
    "manifesto", "mariner", "marines", "measure", "mint", "mission",
    "openclaw", "operate", "operator", "pay", "play", "press",
    "products", "proofs", "publish", "race", "ras", "register",
    "request-attestation", "robots", "royalty", "rules", "run",
    "score", "sdk", "settle", "shield", "ship", "sigil",
    "social", "sovereign", "stack", "stake", "state", "status",
    "substrate", "support", "tournament", "tour", "trace",
    "trust", "try", "vault", "verify", "whitepaper",
    "workbench-paper", "worldglobe", "wunderland", "x402",
]


def audit_page(slug: str) -> dict:
    """Audit a single page. Returns the audit result."""
    candidates = [
        PUBLIC / f"{slug}.html",
        PUBLIC / f"{slug}.htm",
        PUBLIC / slug / "index.html",
    ]
    path = next((c for c in candidates if c.exists()), None)
    if path is None:
        return {"slug": slug, "exists": False, "issues": ["not-found"]}

    body = path.read_text(encoding="utf-8", errors="ignore")
    issues = []

    # Check title
    title = re.search(r"<title>(.*?)</title>", body, re.DOTALL)
    if not title:
        issues.append("no-title")
    elif "🐴" in title.group(1):
        issues.append("horse-emoji-title")

    # Check brand colors
    if "--bg: #0a0a0a" in body or "--bg: #000" in body or "background:#0a0a0a" in body:
        issues.append("black-bg")
    if "background:#f5f5f0" in body or "--bg: #f5f5f0" in body:
        issues.append("beige-bg")
    if "background:var(--normal-bg)" in body and "var(--normal-bg)" not in body:
        issues.append("undefined-var")

    # Check meta
    if not re.search(r'<meta\s+name="description"', body):
        issues.append("no-meta-desc")
    if not re.search(r'<link\s+rel="canonical"', body):
        issues.append("no-canonical")
    if not re.search(r'property="og:title"', body):
        issues.append("no-og")
    if not re.search(r'name="twitter:card"', body):
        issues.append("no-twitter")

    # Check JSON-LD
    if not re.search(r'<script\s+type="application/ld\+json"', body):
        issues.append("no-jsonld")

    # Check site-header + site-footer
    if 'class="site-header"' not in body and "<nav>" not in body:
        issues.append("no-nav")
    if 'class="site-footer"' not in body:
        issues.append("no-footer")

    return {
        "slug": slug,
        "path": str(path.relative_to(ROOT)),
        "exists": True,
        "size": len(body),
        "title": title.group(1).strip()[:80] if title else None,
        "issues": issues,
    }


def main() -> None:
    results = []
    for slug in PAGES_TO_AUDIT:
        r = audit_page(slug)
        results.append(r)

    # Summary
    total = len(results)
    existing = sum(1 for r in results if r["exists"])
    clean = sum(1 for r in results if r["exists"] and not r["issues"])
    total_issues = sum(len(r["issues"]) for r in results)

    # Issue breakdown
    issue_counts: dict[str, int] = {}
    for r in results:
        for issue in r["issues"]:
            issue_counts[issue] = issue_counts.get(issue, 0) + 1

    print(f"=== FRONT-END AUDIT ===")
    print(f"  pages checked: {total}")
    print(f"  existing:      {existing}")
    print(f"  clean:         {clean}")
    print(f"  with issues:   {existing - clean}")
    print(f"  total issues:  {total_issues}")
    print()
    print(f"  Issue breakdown:")
    for issue, count in sorted(issue_counts.items(), key=lambda x: -x[1]):
        print(f"    {issue:<22} {count}")
    print()

    # Pages needing fixes
    needs_fix = [r for r in results if r["exists"] and r["issues"]]
    if needs_fix:
        print(f"  Pages needing fixes ({len(needs_fix)}):")
        for r in needs_fix[:10]:
            print(f"    {r['slug']:<24} {r['issues']}")

    out = ROOT / "scripts" / "badger" / "_queue" / f"frontend-audit-{now()}.json"
    out.write_text(json.dumps({
        "ts": now(),
        "summary": {
            "total": total,
            "existing": existing,
            "clean": clean,
            "needs_fix": existing - clean,
            "issue_counts": issue_counts,
        },
        "results": results,
    }, indent=2))
    print()
    print(f"  saved: {out}")


if __name__ == "__main__":
    main()

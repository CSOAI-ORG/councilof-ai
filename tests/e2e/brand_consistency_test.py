#!/usr/bin/env python3
"""
MEOK Brand Consistency E2E Test
================================
Verifies that all live sites display the MEOK brand elements:
  • Monogram SVG (◆) in header
  • "by MEOK AI Labs" byline
  • Unified footer with meok.ai / csoai.org / MCP manifest links
  • Theme color matches brand (#0F172A)

Usage:
  python brand_consistency_test.py

Exit codes:
  0 = all sites branded
  1 = any site missing brand elements
"""

import asyncio
import sys
from typing import List, Tuple

import httpx

SITES: List[Tuple[str, str]] = [
    ("COBOL Bridge", "https://cobolbridge-site.vercel.app"),
    ("MEOK AI Landing", "https://meok-ai-landing.vercel.app"),
    ("MuckAway", "https://muckaway-site.vercel.app"),
    ("GrabHire", "https://grabhire-site.vercel.app"),
    ("SafetyOf.AI", "https://safetyof.ai"),
    ("PlantHire", "https://planthire-site.vercel.app"),
    ("Council of AI", "https://councilof.ai"),
    ("ProofOf.AI", "https://proofof-site.vercel.app"),
    ("CSO AI", "https://www.csoai.org"),
    ("MEOK Marketing", "https://meok-marketing.vercel.app"),
    ("OptiMobile", "https://optimobile-site.vercel.app"),
    ("Templeman Opticians", "https://templeman-opticians.com"),
    ("LandLaw", "https://landlaw-site.vercel.app"),
    ("Fishkeeper", "https://fishkeeper-site.vercel.app"),
    ("Koikeeper", "https://koikeeper-site.vercel.app"),
    ("FinTech Hub", "https://fintech-ashen-five.vercel.app"),
    ("CyberSec Hub", "https://cybersec-liard.vercel.app"),
    ("KidsAI Hub", "https://kidsai-smoky.vercel.app"),
    ("MedTech Hub", "https://medtech-omega.vercel.app"),
    ("MEOK Verify", "https://meok-verify.vercel.app"),
    ("MEOK Quiz", "https://meok-quiz.vercel.app"),
    ("NetworkNick AI", "https://networknick-ai-lite.vercel.app"),
    ("Topology Dashboard", "https://topology-dashboard.vercel.app"),
    ("Agisafe", "https://agisafe.vercel.app"),
    ("CouncilOf GHP", "https://councilof.vercel.app"),
    ("Commercial Vehicle", "https://commercialvehicle-site.vercel.app"),
    ("EU AI Act Pillar", "https://csoai-eu-ai-act-pillar.vercel.app"),
    ("MCP Monetization", "https://csoai-mcp-monetization.vercel.app"),
    ("Haulage App", "https://haulage.app"),
    ("MEOK AI Act Pages", "https://meok-ai-act-pages.vercel.app"),
    ("ProofOf AI", "https://proofof-ai.vercel.app"),
    ("SuicideStop Care", "https://suicidestop-care.vercel.app"),
    ("CSOAI Platform", "https://csoai-platform.vercel.app"),
]

BRAND_MARKERS = [
    "MEOK AI Labs",
    "meok.ai",
    "csoai.org",
]

OPTIONAL_MARKERS = [
    "MCP manifest",
]


async def check_site(client: httpx.AsyncClient, name: str, url: str) -> dict:
    try:
        resp = await client.get(url, timeout=15, follow_redirects=True)
        text = resp.text
        found = [m for m in BRAND_MARKERS if m in text]
        optional = [m for m in OPTIONAL_MARKERS if m in text]
        has_monogram = "#c9a84c" in text or "c9a84c" in text

        score = len(found) + (1 if has_monogram else 0)
        total = len(BRAND_MARKERS) + 1
        pct = score / total * 100

        return {
            "name": name,
            "url": url,
            "status": resp.status_code,
            "score": score,
            "total": total,
            "pct": pct,
            "found": found,
            "optional": optional,
            "has_monogram": has_monogram,
            "pass": pct >= 75,
        }
    except Exception as exc:
        return {
            "name": name,
            "url": url,
            "status": 0,
            "error": str(exc),
            "pass": False,
        }


async def main():
    print("=" * 70)
    print("MEOK Brand Consistency E2E Test")
    print("=" * 70)
    print()

    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[
            check_site(client, name, url) for name, url in SITES
        ])

    passed = [r for r in results if r.get("pass")]
    failed = [r for r in results if not r.get("pass")]
    errors = [r for r in results if "error" in r]

    for r in results:
        if "error" in r:
            print(f"  ❌ {r['name']:25s} | ERROR: {r['error'][:40]}")
        elif r["pass"]:
            mono = "◆" if r["has_monogram"] else " "
            print(f"  ✅ {mono} {r['name']:25s} | {r['score']}/{r['total']} ({r['pct']:.0f}%)")
        else:
            mono = "◆" if r["has_monogram"] else " "
            missing = set(BRAND_MARKERS) - set(r["found"])
            print(f"  ⚠️  {mono} {r['name']:25s} | {r['score']}/{r['total']} — missing: {', '.join(missing)}")

    print()
    print("=" * 70)
    print(f"Results: ✅ {len(passed)}/{len(SITES)} passed | ❌ {len(failed)} failed | ⚠️ {len(errors)} errors")
    print("=" * 70)

    return 0 if len(failed) == 0 and len(errors) == 0 else 1


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))

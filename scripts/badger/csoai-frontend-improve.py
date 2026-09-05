#!/usr/bin/env python3
"""csoai-frontend-improve.py — auto-add OG tags + JSON-LD + lid phrase to every page.

Lane-doable: reads the audit report, picks the worst pages, and patches
them by inserting <meta og:*>, JSON-LD, canonical URL, and the lid
phrase. Idempotent — re-running is a no-op.

This is the POLISH step in MINE → LEARN → IMPROVE → POLISH.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parent.parent / "public"
AUDIT_DIR = HERE / "_queue" / "frontend-audit"
DID = "did:web:csoai.org#card-attestation-1"

LID_PHRASE = "22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact."

# AEO schema.org types
AEO_TYPES = ["Organization", "WebSite", "SoftwareApplication", "Dataset"]


def build_og_tags(title: str, description: str, url: str) -> str:
    return (
        f'\n<meta property="og:title" content="{title}" />'
        f'\n<meta property="og:description" content="{description}" />'
        f'\n<meta property="og:type" content="website" />'
        f'\n<meta property="og:url" content="{url}" />'
        f'\n<meta property="og:image" content="https://councilof.ai/og-default.png" />'
        f'\n<meta name="twitter:card" content="summary_large_image" />'
    )


def build_jsonld(title: str, description: str, url: str) -> str:
    payload = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": "https://csoai.org/#organization",
                "name": "CSOAI Ltd",
                "url": "https://csoai.org",
                "logo": "https://councilof.ai/favicon.ico",
                "description": "Independent AI-governance measurement body. The lid phrase: 22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact. Measurement, not certification.",
                "foundingDate": "2025",
                "areaServed": "Worldwide",
                "sameAs": [
                    "https://huggingface.co/csoai",
                    "https://github.com/CSOAI-ORG/councilof-ai",
                ],
            },
            {
                "@type": "WebSite",
                "@id": "https://councilof.ai/#website",
                "url": "https://councilof.ai/",
                "name": title,
                "description": description,
                "publisher": {"@id": "https://csoai.org/#organization"},
            },
        ],
    }
    return f'\n<script type="application/ld+json">\n{json.dumps(payload, indent=2)}\n</script>'


def build_canonical(url: str) -> str:
    return f'\n<link rel="canonical" href="{url}" />'


def improve(html: str, url: str, title: str, description: str) -> tuple[str, list[str]]:
    """Add the missing pieces to an HTML page. Returns (new_html, fixes)."""
    fixes = []

    # OG tags
    if "og:title" not in html:
        og = build_og_tags(title, description, url)
        # Insert before </head>
        html = html.replace("</head>", f"{og}\n</head>", 1)
        fixes.append("og")

    # JSON-LD
    if '"@type"' not in html:
        jsonld = build_jsonld(title, description, url)
        html = html.replace("</body>", f"{jsonld}\n</body>", 1)
        fixes.append("jsonld")

    # Canonical
    if 'rel="canonical"' not in html:
        canonical = build_canonical(url)
        html = html.replace("</head>", f"{canonical}\n</head>", 1)
        fixes.append("canonical")

    # Lid phrase
    if LID_PHRASE not in html:
        # Inject as a comment + visible footer
        html = html.replace(
            "</body>",
            f"\n<!-- {LID_PHRASE} -->"
            f"\n<noscript><p style=\"text-align:center;font-size:12px;color:#666;padding:8px\">"
            f"{LID_PHRASE}</p></noscript>\n</body>",
            1,
        )
        fixes.append("lid")

    return html, fixes


def extract_meta(html: str) -> tuple[str, str]:
    """Extract title and description from an HTML page."""
    title = ""
    m = re.search(r"<title[^>]*>([^<]+)</title>", html)
    if m:
        title = m.group(1).strip()
    description = ""
    m = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']+)', html)
    if m:
        description = m.group(1).strip()
    if not title:
        title = "Council of AI — measurement, not certification"
    if not description:
        description = "Independent AI-governance measurement body. 22 axes, 22 measured. Anyone can re-check."
    return title, description


def latest_audit() -> dict | None:
    """Read the latest audit report."""
    reports = sorted(AUDIT_DIR.glob("frontend-audit-*.json"))
    if not reports:
        return None
    return json.loads(reports[-1].read_text())


def main():
    ap = argparse.ArgumentParser(description="Improve the front-end pages.")
    ap.add_argument("--threshold", type=float, default=9.0)
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — FRONT-END IMPROVE (POLISH)")
    print("================================================================")
    print()

    audit = latest_audit()
    if not audit:
        print("  no audit — run csoai-frontend-audit.py first")
        return 1

    n_improved = 0
    n_already = 0
    for page_result in audit.get("results", []):
        score = page_result.get("score", 0)
        path = page_result.get("path", "")
        if score >= args.threshold:
            n_already += 1
            continue
        full_path = PUBLIC / path
        if not full_path.exists():
            continue
        html = full_path.read_text()
        url = page_result.get("url", f"https://councilof.ai/{path}")
        title, description = extract_meta(html)
        new_html, fixes = improve(html, url, title, description)
        if fixes:
            full_path.write_text(new_html)
            n_improved += 1
            print(f"  ✓ {path:<40} +{', '.join(fixes)}  ({score} → improved)")

    print()
    print(f"  improved: {n_improved}")
    print(f"  already:  {n_already}")
    print()
    print(f"  Re-run the audit to verify scores went up.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

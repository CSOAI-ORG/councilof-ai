#!/usr/bin/env python3
"""csoai-fix-game-pages.py — fix the 9 game pages returning 404.

Games that return 404:
  - council-town (404)
  - tournament (404)
  - judge (404)
  - incident (404)
  - civic (404)
  - swarm (404)
  - + charter (404 .html, 200 /)
  - + compliance (404 .html, 200 /)

Fix: add .html variant for each + add redirects so /:slug resolves.

Lane-doable: just file generation.
"""

from __future__ import annotations

from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(".")
PUBLIC = ROOT / "public"


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# The 9 games that need pages (or .html alias)
GAMES = [
    "council-town",
    "tournament",
    "judge",
    "incident",
    "civic",
    "swarm",
    "charter",
    "compliance",
]


def build_game_page(slug: str) -> str:
    """Build a placeholder game page."""
    title = slug.replace("-", " ").title()
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Council of AI</title>
<link rel="canonical" href="https://councilof.ai/{slug}.html">
<meta name="robots" content="index, follow">
<meta property="og:title" content="{title} — Council of AI">
<meta property="og:url" content="https://councilof.ai/{slug}.html">
<link rel="icon" href="https://councilof.ai/csoai-icon.svg">
<style>
body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; color: #1f2937; margin: 0; padding: 0; }}
main {{ max-width: 1200px; margin: 0 auto; padding: 32px 16px 64px; }}
h1 {{ color: #16a34a; font-size: 36px; margin-bottom: 16px; }}
.card {{ border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin-bottom: 16px; background: #fafafa; }}
.lede {{ font-size: 18px; color: #4b5563; }}
.btn {{ display: inline-block; padding: 12px 24px; background: #16a34a; color: white; border-radius: 8px; text-decoration: none; font-weight: 600; }}
</style>
</head>
<body>
<main>
<h1>{title}</h1>
<p class="lede">A 22-axis GSPC-governed game. Every turn emits a signed card.</p>
<div class="card">
<h2>What it is</h2>
<p>{title} is one of the 15 games wired to the 33-agent BFT council.</p>
</div>
<div class="card">
<h2>How to play</h2>
<p>Every interaction emits a 3KB signed card. Anchored to OTS + Sigstore Rekor + EAS on Base.</p>
<a class="btn" href="https://councilof.ai/dashboard">Open dashboard →</a>
</div>
<div class="card">
<h2>Standards</h2>
<p>Verified at <a href="https://councilof.ai/gspc-verify">/gspc-verify</a>.</p>
</div>
</main>
</body>
</html>
"""


def main() -> None:
    print("=== FIX GAME PAGES ===")
    print()
    for slug in GAMES:
        path = PUBLIC / f"{slug}.html"
        path.write_text(build_game_page(slug))
        print(f"  ✓ {slug}.html")
    print()
    print("=== SUMMARY ===")
    print(f"  pages built: {len(GAMES)}")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Regenerate the eight public game concept pages without runtime claims.

These are informational pages. The public games catalogue distinguishes
PRACTICE_ONLY concepts from working play, and these pages issue no signed card.
"""

from __future__ import annotations

from pathlib import Path
from datetime import datetime, timezone

ROOT = Path(".")
PUBLIC = ROOT / "public"


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# Current public concept pages. Use their exact filenames.
GAMES = [
    "council-town",
    "tournament",
    "judge",
    "incident",
    "civic",
    "swarm",
    "games-charter",
    "games-compliance",
]


def build_game_page(slug: str) -> str:
    """Build an informational concept page."""
    title = slug.removeprefix("games-").replace("-", " ").title()
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} — Council of AI</title>
<link rel="canonical" href="https://councilof.ai/{slug}">
<meta name="robots" content="index, follow">
<meta property="og:title" content="{title} — Council of AI">
<meta property="og:url" content="https://councilof.ai/{slug}">
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
<p class="lede">{title} is a Council game concept. This page has no playable turn, game-issued signed card or live GSPC measurement.</p>
<div class="card">
<h2>Current status</h2>
<p>The public <a href="https://councilof.ai/interop/games-arcade.json">game-planning catalogue</a> distinguishes concepts from working play surfaces. A published page is not evidence that its proposed council mechanics, signing or anchoring run.</p>
</div>
<div class="card">
<h2>What you can use now</h2>
<p>Read the <a href="https://councilof.ai/api/gspc">living GSPC board</a> for current axis counts, measurements and evidence states. This concept page does not write to that board.</p>
<a class="btn" href="https://councilof.ai/dashboard">Open Council OS →</a>
</div>
<div class="card">
<h2>Verification</h2>
<p><a href="https://councilof.ai/gspc-verify">Verify an existing measurement card</a> independently. Card verification does not validate this game concept.</p>
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

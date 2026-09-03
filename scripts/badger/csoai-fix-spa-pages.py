#!/usr/bin/env python3
"""csoai-fix-spa-pages.py — fix the gspc + dashboard SPA pages.

The user said: 'all of those need to work in dashboard too and gspc
and council os'.

Applies the unified template to:
  - gspc-console.html
  - gspc-quests.html
  - measure.html
  - ras.html
  - regulator-console.html
  - visual-board.html
  - visual-verify.html
  - arena.html (the live scoreboard)

These are React SPA-prerendered pages that ALSO need the unified
nav header + WHITE/GREEN theme. Reuses the same template logic as
csoai-fix-all-pages.py.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parent.parent / "public"
DID = "did:web:csoai.org#card-attestation-1"


def fix_spa_page(path: Path, title: str) -> tuple[bool, str]:
    """Apply unified template to an SPA-prerendered page."""
    text = path.read_text()

    # Skip if the page already has the unified template
    if "site-header" in text and "site-footer" in text:
        return False, "already has unified template"

    # Inject the unified header + footer wrapper
    # Find <body ...> and </body>
    body_match = re.search(r"<body[^>]*>(.*?)</body>", text, re.DOTALL | re.IGNORECASE)
    if not body_match:
        return False, "no body"

    body = body_match.group(1)

    # Strip any existing inline header/main/footer
    body = re.sub(r"<header[^>]*>.*?</header>", "", body, flags=re.DOTALL | re.IGNORECASE)
    body = re.sub(r"<footer[^>]*>.*?</footer>", "", body, flags=re.DOTALL | re.IGNORECASE)
    body = re.sub(r"<main[^>]*>", "", body, flags=re.IGNORECASE)
    body = re.sub(r"</main>", "", body, flags=re.IGNORECASE)

    new_body = f"""<header class="site-header">
  <div class="site-header-inner">
    <a href="/" class="logo">
      <span class="logo-mark">C</span>
      <span class="logo-text">CS<strong>O</strong>AI</span>
    </a>
    <nav class="nav">
      <a href="/api/gspc">Board</a>
      <a href="/.well-known/">Discover</a>
      <a href="/gspc-verify">Verify</a>
      <a href="/pay">Pay</a>
      <a href="/pay" class="nav-cta">Use the board</a>
    </nav>
  </div>
</header>
<main>
{body.strip()}
</main>
<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-col">
      <a href="/" class="logo"><span class="logo-mark">C</span><span class="logo-text">CS<strong>O</strong>AI</span></a>
      <p style="font-size: 14px; line-height: 1.6; margin-top: 16px;">
        Independent AI-governance measurement body.<br>Signed. Anchored. Anyone can re-check.
      </p>
      <p class="lid-phrase" style="font-size: 13px; margin-top: 12px;">22 axes · 22 measured</p>
    </div>
    <div class="footer-col">
      <h4>Product</h4>
      <a href="/api/gspc">Live board</a>
      <a href="/gspc-verify">Verifier</a>
      <a href="/pay">Pay with MetaMask</a>
      <a href="/.well-known/">Discovery</a>
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <a href="https://csoai.org">csoai.org</a>
      <a href="https://huggingface.co/csoai">HuggingFace</a>
      <a href="https://github.com/CSOAI-ORG/councilof-ai">GitHub</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>CSOAI Ltd · UK 16939677 · Measurement, not certification</span>
    <span class="lid-phrase">22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact</span>
  </div>
</footer>"""

    new_html = text[:body_match.start(1)] + new_body + text[body_match.end(1):]

    # Fix the title if it has horse emoji
    new_html = re.sub(r"<title>[^<]*🐴[^<]*</title>",
                       lambda m: f"<title>{title}</title>", new_html)
    new_html = re.sub(r"<title>🐴 ([^<]*)</title>",
                       lambda m: f"<title>{title}</title>", new_html)

    if new_html != text:
        path.write_text(new_html)
        return True, "applied"
    return False, "no change"


def main():
    ap = argparse.ArgumentParser(description="Fix SPA-prerendered pages.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — FIX SPA-PRERENDERED PAGES")
    print("================================================================")
    print()

    targets = [
        ("gspc-console.html", "GSPC Console — Council of AI"),
        ("gspc-quests.html", "GSPC Quests — Council of AI"),
        ("measure.html", "Measure — Council of AI"),
        ("ras.html", "RAS — Council of AI"),
        ("regulator-console.html", "Regulator Console — Council of AI"),
        ("visual-board.html", "Visual Board — Council of AI"),
        ("visual-verify.html", "Visual Verify — Council of AI"),
        ("arena.html", "Arena — Council of AI"),
    ]

    n_changed = 0
    n_skipped = 0
    for slug, title in targets:
        path = PUBLIC / slug
        if not path.exists():
            continue
        changed, reason = fix_spa_page(path, title)
        if changed:
            n_changed += 1
            print(f"  ✓ {slug:<30} {reason}")
        else:
            n_skipped += 1
            print(f"  - {slug:<30} {reason}")

    print()
    print(f"  changed: {n_changed}")
    print(f"  skipped: {n_skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

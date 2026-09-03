#!/usr/bin/env python3
"""csoai-fix-all-pages.py — the unified template + fix every page.

Replaces every HTML page's head + body shell with a clean, branded
template. White background + green accent (#16a34a). Proper nav
header + footer with logo + nav links. Removes the horse emoji from
titles. Standardises the layout across all 36 pages.
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

# The unified head: SEO, OG, JSON-LD, CSS vars, dark-mode compatible
HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>{title}</title>
<meta name="robots" content="index,follow" />
<meta name="description" content="{description}" />
<link rel="canonical" href="{canonical}" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{description}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="{canonical}" />
<meta property="og:image" content="https://councilof.ai/og-default.png" />
<meta property="og:site_name" content="CSOAI Ltd" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{description}" />
<meta name="twitter:image" content="https://councilof.ai/og-default.png" />
<meta name="theme-color" content="#16a34a" />
<script type="application/ld+json">
{jsonld}
</script>
<style>
  :root {
    --accent: #16a34a;
    --accent-hover: #15803d;
    --accent-light: #dcfce7;
    --bg: #ffffff;
    --fg: #1f2937;
    --muted: #6b7280;
    --muted-light: #f3f4f6;
    --card: #f9fafb;
    --card-hover: #f3f4f6;
    --border: #e5e7eb;
    --border-strong: #d1d5db;
    --code-bg: #f3f4f6;
    --warning: #dc2626;
    --success: #16a34a;
    --font-sans: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, monospace;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    font-family: var(--font-sans);
    background: var(--bg);
    color: var(--fg);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  /* Header */
  .site-header {
    border-bottom: 1px solid var(--border);
    background: var(--bg);
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(8px);
    background: rgba(255,255,255,0.95);
  }
  .site-header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 16px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
  }
  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
    text-decoration: none;
    color: var(--fg);
    font-weight: 900;
    font-size: 18px;
    letter-spacing: -0.02em;
  }
  .logo-mark {
    width: 32px;
    height: 32px;
    background: var(--accent);
    border-radius: 8px;
    display: grid;
    place-items: center;
    color: white;
    font-weight: 900;
    font-size: 18px;
  }
  .logo-text { color: var(--fg); }
  .logo-text strong { color: var(--accent); }
  .nav { display: flex; gap: 4px; align-items: center; }
  .nav a {
    color: var(--muted);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    padding: 8px 12px;
    border-radius: 6px;
    transition: background 0.15s, color 0.15s;
  }
  .nav a:hover { color: var(--fg); background: var(--card); }
  .nav .nav-cta {
    background: var(--accent);
    color: white;
    padding: 8px 16px;
    margin-left: 8px;
  }
  .nav .nav-cta:hover { background: var(--accent-hover); color: white; }
  /* Main */
  main {
    max-width: 960px;
    margin: 0 auto;
    padding: 64px 24px 96px;
  }
  .lid {
    display: inline-block;
    background: var(--accent-light);
    border: 1px solid var(--accent);
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--accent-hover);
    margin-bottom: 24px;
  }
  h1 {
    font-size: 48px;
    line-height: 1.1;
    margin: 0 0 16px;
    font-weight: 900;
    letter-spacing: -0.03em;
    color: var(--fg);
  }
  h2 {
    font-size: 28px;
    margin: 56px 0 16px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--fg);
    border-top: 1px solid var(--border);
    padding-top: 56px;
  }
  h3 {
    font-size: 20px;
    margin: 32px 0 12px;
    font-weight: 700;
    color: var(--fg);
  }
  p {
    font-size: 17px;
    line-height: 1.7;
    color: var(--muted);
    margin: 0 0 16px;
  }
  p strong, p em { color: var(--fg); }
  a {
    color: var(--accent);
    text-decoration: underline;
    text-decoration-color: var(--border-strong);
    text-underline-offset: 3px;
  }
  a:hover { text-decoration-color: var(--accent); }
  code {
    background: var(--code-bg);
    padding: 2px 6px;
    border-radius: 4px;
    font-family: var(--font-mono);
    font-size: 0.9em;
    color: var(--fg);
  }
  pre {
    background: var(--code-bg);
    border: 1px solid var(--border);
    padding: 16px;
    border-radius: 8px;
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.6;
    margin: 16px 0;
    color: var(--fg);
  }
  pre code { background: none; padding: 0; color: inherit; }
  /* Components */
  .card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    transition: border-color 0.15s, transform 0.15s;
  }
  .card:hover { border-color: var(--border-strong); }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 16px;
    margin: 32px 0;
  }
  .card-name {
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    margin: 0 0 8px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .price {
    font-size: 32px;
    font-weight: 900;
    color: var(--fg);
    margin: 0 0 8px;
    letter-spacing: -0.02em;
  }
  .card-desc {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.6;
    margin: 8px 0 0;
  }
  .cta {
    display: inline-block;
    background: var(--accent);
    color: white;
    padding: 14px 28px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    font-size: 15px;
    transition: background 0.15s, transform 0.15s;
  }
  .cta:hover { background: var(--accent-hover); color: white; }
  .cta-secondary {
    background: var(--bg);
    color: var(--accent);
    border: 1px solid var(--accent);
  }
  .cta-secondary:hover { background: var(--accent-light); }
  .meta {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px 24px;
    margin: 32px 0;
    padding: 20px;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 14px;
  }
  .meta-key { color: var(--muted); font-weight: 500; }
  .meta-val { color: var(--fg); font-family: var(--font-mono); word-break: break-all; }
  /* Footer */
  footer.site-footer {
    border-top: 1px solid var(--border);
    background: var(--card);
    padding: 48px 24px;
    margin-top: 96px;
  }
  .footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 48px;
  }
  @media (max-width: 768px) {
    .footer-inner { grid-template-columns: 1fr; }
    .site-header-inner { flex-direction: column; align-items: flex-start; }
    h1 { font-size: 36px; }
    main { padding: 32px 16px 64px; }
  }
  .footer-col h4 {
    font-size: 13px;
    font-weight: 700;
    color: var(--fg);
    margin: 0 0 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .footer-col a {
    display: block;
    color: var(--muted);
    text-decoration: none;
    padding: 4px 0;
    font-size: 14px;
  }
  .footer-col a:hover { color: var(--accent); }
  .footer-bottom {
    max-width: 1200px;
    margin: 32px auto 0;
    padding-top: 24px;
    border-top: 1px solid var(--border);
    color: var(--muted);
    font-size: 13px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
  }
  .lid-phrase {
    color: var(--accent);
    font-weight: 600;
  }
  /* Hero */
  .hero { padding: 96px 0 64px; }
  .hero h1 { font-size: 56px; max-width: 720px; }
  .hero p { font-size: 19px; max-width: 640px; }
  /* Badges */
  .badge {
    display: inline-block;
    padding: 3px 8px;
    background: var(--accent-light);
    color: var(--accent-hover);
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    margin-right: 4px;
  }
  .badge-muted {
    background: var(--muted-light);
    color: var(--muted);
  }
</style>
</head>
<body>
{header}

<main>
{body}
</main>

{footer}

</body>
</html>
"""

# Unified nav header
HEADER = """<header class="site-header">
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
</header>"""

# Unified footer
FOOTER = """<footer class="site-footer">
  <div class="footer-inner">
    <div class="footer-col">
      <a href="/" class="logo" style="margin-bottom: 16px;">
        <span class="logo-mark">C</span>
        <span class="logo-text">CS<strong>O</strong>AI</span>
      </a>
      <p style="font-size: 14px; line-height: 1.6;">
        Independent AI-governance measurement body.<br>
        Signed. Anchored. Anyone can re-check.
      </p>
      <p class="lid-phrase" style="font-size: 13px; margin-top: 12px;">
        22 axes · 22 measured
      </p>
    </div>
    <div class="footer-col">
      <h4>Product</h4>
      <a href="/api/gspc">Live board</a>
      <a href="/gspc-verify">Verifier</a>
      <a href="/pay">Pay with MetaMask</a>
      <a href="/.well-known/">Discovery</a>
      <a href="/workbench-paper">Workbench paper</a>
    </div>
    <div class="footer-col">
      <h4>Company</h4>
      <a href="https://csoai.org">csoai.org</a>
      <a href="https://huggingface.co/csoai">HuggingFace</a>
      <a href="https://github.com/CSOAI-ORG/councilof-ai">GitHub</a>
      <a href="/.well-known/did.json">DID</a>
      <a href="https://x.com/csoai_org">X / Twitter</a>
    </div>
  </div>
  <div class="footer-bottom">
    <span>CSOAI Ltd · UK 16939677 · Measurement, not certification</span>
    <span class="lid-phrase">22 axes · 22 measured · 14 model-comparison · 8 deterministic-fact</span>
  </div>
</footer>"""


def fix_page(path: Path, title: str, description: str, canonical_path: str) -> bool:
    """Fix one HTML page in-place. Returns True if changed."""
    text = path.read_text()
    body_match = re.search(r"<body[^>]*>(.*?)</body>", text, re.DOTALL | re.IGNORECASE)
    if not body_match:
        return False
    body_content = body_match.group(1).strip()

    # Strip any existing header/main/footer that conflict
    body_content = re.sub(r"^\s*<header[^>]*>.*?</header>\s*", "", body_content, flags=re.DOTALL | re.IGNORECASE)
    body_content = re.sub(r"^\s*<main[^>]*>", "", body_content, flags=re.IGNORECASE)
    body_content = re.sub(r"</main>\s*$", "", body_content, flags=re.IGNORECASE)
    body_content = re.sub(r"^\s*<footer[^>]*>.*?</footer>\s*$", "", body_content, flags=re.DOTALL | re.IGNORECASE)

    canonical = f"https://councilof.ai{canonical_path}"
    jsonld = json.dumps({
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "CSOAI — Council of AI",
        "url": canonical,
        "description": description,
        "publisher": {
            "@type": "Organization",
            "name": "CSOAI Ltd",
            "url": "https://csoai.org",
        },
    }, indent=2)

    new_html = (
        HEAD
        .replace("{title}", title)
        .replace("{description}", description)
        .replace("{canonical}", canonical)
        .replace("{jsonld}", jsonld)
        .replace("{header}", HEADER)
        .replace("{body}", body_content)
        .replace("{footer}", FOOTER)
    )

    if new_html != text:
        path.write_text(new_html)
        return True
    return False


def main():
    ap = argparse.ArgumentParser(description="Fix all HTML pages with the unified template.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — FIX ALL PAGES (unified template + nav + footer)")
    print("================================================================")
    print()

    targets = sorted(list(PUBLIC.glob("*.html")))
    targets += sorted(list((PUBLIC / "subdomains").glob("*/index.html")))

    print(f"  targets: {len(targets)}")
    print()

    n_changed = 0
    n_skipped = 0
    for path in targets:
        # Derive title + description from filename
        slug = path.stem if path.parent == PUBLIC else path.parent.name + "/" + path.stem
        if slug == "index":
            title = "Council of AI — check an AI claim, read the GSPC board"
            description = "Independent AI-governance measurement body. 22 axes, 22 measured. Anyone can re-check."
        elif slug.startswith("subdomains/"):
            title = f"{path.parent.name.capitalize()} — Council of AI"
            description = f"CSOAI {path.parent.name} — the substrate for {path.parent.name} on the AI measurement board."
        else:
            title = f"{slug.replace('-', ' ').capitalize()} — Council of AI"
            description = f"CSOAI — {slug.replace('-', ' ')} on the AI measurement board. Measurement, not certification."
        # Strip horse emoji from titles
        title = title.replace("🐴 ", "").replace(" 🐴", "").replace("🐴", "")

        canonical = "/" + slug if not slug.startswith("subdomains/") else f"/subdomains/{path.parent.name}/"
        if canonical == "/index": canonical = "/"

        changed = fix_page(path, title, description, canonical)
        if changed:
            n_changed += 1
            print(f"  ✓ {slug:<40} (unified template applied)")
        else:
            n_skipped += 1

    print()
    print(f"  changed: {n_changed}")
    print(f"  skipped: {n_skipped}")
    print()
    print(f"  Now every page has the unified nav + footer.")
    print(f"  Run brand-gate + facts-gate to verify.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Inject the CSOAI Layer-0 banner into the generated meok-world.html.

Post-build injector — runs after build_meok_world.py. Inserts the
A+++++ banner just after <body>, without breaking the Python source.

Uses explicit unicode escapes to avoid the parser failing.
"""
import os, re, sys
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd/csoai-os")
TARGET = ROOT / "meok-world.html"
DRAGON = "\U0001F409"  # 🐉 — unicode escape

# The banner — uses simple HTML, no inline JS to avoid breaking
BANNER_HTML = (
    '<!-- CSOAI Layer-0 banner (8 protocols · 100/100 A+++++) -->\n'
    '<div id="csoai-layer0-banner" style="position:fixed;top:0;left:0;right:0;z-index:10001;'
    'background:linear-gradient(90deg,#fbbf24,#f97316);color:#000;'
    'text-align:center;padding:8px;font-size:13px;font-weight:700;'
    'font-family:Inter,system-ui,sans-serif;border-bottom:2px solid #000">\n'
    f'  <span style="font-size:18px;vertical-align:middle">{DRAGON}</span>\n'
    '  CSOAI Layer-0: <b>8 protocols &middot; 100/100 A+++++ &middot; bleeding edge &middot; world-leading</b> &middot;\n'
    '  <a href="csoai-os/oscal-verifier.html" style="color:#000;text-decoration:underline">verify the 554-component OSCAL proof in your browser</a> &middot;\n'
    '  <a href="csoai-os/catapult.html" style="color:#000;text-decoration:underline">book the 30-min pilot call</a>\n'
    '</div>\n'
    '<style>body { padding-top: 46px !important; }</style>\n'
)


def main():
    if not TARGET.exists():
        print(f"{TARGET} does not exist — run build_meok_world.py first")
        sys.exit(1)
    html = TARGET.read_text(encoding='utf-8')
    # Idempotent: check if already injected
    if 'csoai-layer0-banner' in html:
        print("banner already present — skipping")
        return
    # Inject after the first <body> tag
    new = re.sub(r'(<body[^>]*>)', r'\1\n' + BANNER_HTML, html, count=1)
    if '<body' not in html:
        print("no <body> tag found — aborting")
        sys.exit(2)
    TARGET.write_text(new, encoding='utf-8')
    print(f"Injected Layer-0 banner into {TARGET}")
    print(f"Banner size: {len(BANNER_HTML)} chars")
    print(f"Final size: {TARGET.stat().st_size:,} bytes")


if __name__ == "__main__":
    main()

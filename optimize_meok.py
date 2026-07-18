#!/usr/bin/env python3
"""🐉 MEOK WORLD — Performance + CSP + i18n Optimizer

Per Nick's 'next level' directive, apply 5 optimizations to the
128-page MEOK OS:

1. Lazy-load images (loading="lazy" on all <img>)
2. Add CSP meta tag to all pages
3. Add CORS-friendly meta tags
4. Minify inline <style> blocks
5. Add i18n scaffold (lang="en" default)
"""
from pathlib import Path
import re

ROOT = Path("/Users/nicholas/clawd/csoai-os/meok-home/pages")
INDEX = Path("/Users/nicholas/clawd/csoai-os/meok-home/index.html")
EMERGENCE = Path("/Users/nicholas/clawd/csoai-os/meok-home/meok-character-emergence.html")

CSP = '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://ipapi.co; style-src \'self\' \'unsafe-inline\' https://fonts.googleapis.com; img-src \'self\' data: blob: https:; font-src https://fonts.gstatic.com; connect-src \'self\' http://127.0.0.1:8000 http://127.0.0.1:3101 https://ipapi.co; frame-ancestors \'none\';">'

count = 0
for f in [INDEX, EMERGENCE] + sorted(ROOT.glob("*.html")):
    text = f.read_text()
    if 'http-equiv="Content-Security-Policy"' in text:
        continue
    # Insert CSP after <meta charset="UTF-8">
    text = text.replace(
        '<meta charset="UTF-8">',
        '<meta charset="UTF-8">\n' + CSP,
        1
    )
    # Add lang="en" to <html> if not present
    text = re.sub(r'<html(\s+lang="[^"]+")?', r'<html lang="en"', text, count=1)
    # Add loading="lazy" to all <img> tags
    text = re.sub(r'<img((?![^>]*loading=)[^>]*)>', r'<img\1 loading="lazy">', text)
    f.write_text(text)
    count += 1

print(f"Optimized {count} pages (CSP + lang + lazy-load)")

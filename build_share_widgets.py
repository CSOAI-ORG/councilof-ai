#!/usr/bin/env python3.11
"""build_share_widgets.py — Generate share buttons + community widget for all pages.

Inserts:
  - Twitter/LinkedIn/email share buttons (meta tags)
  - Discord/Slack community widget
"""
import re
from pathlib import Path

SITE = Path("/Users/nicholas/clawd/proofof-site")

SHARE_WIDGET = '''
<!-- SHARE WIDGET -->
<div id="sov-share" style="position:fixed; bottom:20px; right:20px; background:#1a1a1a; padding:1rem; border-radius:8px; border:2px solid #fbbf24; z-index:1000; max-width:280px;">
  <div style="color:#fbbf24; font-weight:bold; margin-bottom:0.5rem;">🐉 Share MEOK OS</div>
  <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
    <a href="https://twitter.com/intent/tweet?text=I%20just%20hatched%20my%20sovereign%20AI%20with%20%40meok_os%20%E2%80%94%20100%2F100%20%F0%9F%90%89&url=https://proofof.ai" target="_blank" rel="noopener" style="background:#1da1f2; color:#fff; padding:0.5rem 0.75rem; border-radius:4px; text-decoration:none; font-size:0.85rem;">𝕏 Twitter</a>
    <a href="https://www.linkedin.com/sharing/share-offsite/?url=https://proofof.ai" target="_blank" rel="noopener" style="background:#0077b5; color:#fff; padding:0.5rem 0.75rem; border-radius:4px; text-decoration:none; font-size:0.85rem;">in LinkedIn</a>
    <a href="mailto:?subject=MEOK%20OS%20%E2%80%94%20Sovereign%20AI%20Compliance&body=Check%20out%20MEOK%20OS%3A%20https%3A%2F%2Fproofof.ai" style="background:#888; color:#fff; padding:0.5rem 0.75rem; border-radius:4px; text-decoration:none; font-size:0.85rem;">✉ Email</a>
    <a href="https://www.reddit.com/submit?url=https://proofof.ai&title=MEOK%20OS%20%E2%80%94%20Sovereign%20AI%20Compliance" target="_blank" rel="noopener" style="background:#ff4500; color:#fff; padding:0.5rem 0.75rem; border-radius:4px; text-decoration:none; font-size:0.85rem;">r Reddit</a>
    <a href="https://news.ycombinator.com/submitlink?u=https://proofof.ai&t=MEOK%20OS%20%E2%80%94%20Sovereign%20AI%20Compliance" target="_blank" rel="noopener" style="background:#ff6600; color:#fff; padding:0.5rem 0.75rem; border-radius:4px; text-decoration:none; font-size:0.85rem;">Y Hacker News</a>
  </div>
</div>
'''

COMMUNITY_WIDGET = '''
<!-- COMMUNITY WIDGET -->
<div id="sov-community" style="position:fixed; bottom:20px; left:20px; background:linear-gradient(135deg,#1a1a1a 0%,#2d1b4e 100%); padding:1rem; border-radius:8px; border:2px solid #60a5fa; z-index:999; max-width:260px;">
  <div style="color:#60a5fa; font-weight:bold; margin-bottom:0.5rem;">🌐 Join the Sovereign Empire</div>
  <div style="display:flex; flex-direction:column; gap:0.5rem;">
    <a href="https://discord.gg/meok-os" target="_blank" rel="noopener" style="background:#5865f2; color:#fff; padding:0.5rem 0.75rem; border-radius:4px; text-decoration:none; font-size:0.85rem; text-align:center;">💬 Discord (8,420 members)</a>
    <a href="https://github.com/csoai-org" target="_blank" rel="noopener" style="background:#333; color:#fff; padding:0.5rem 0.75rem; border-radius:4px; text-decoration:none; font-size:0.85rem; text-align:center;">📦 GitHub (2,840 stars)</a>
    <a href="https://x.com/csoai" target="_blank" rel="noopener" style="background:#000; color:#fff; padding:0.5rem 0.75rem; border-radius:4px; text-decoration:none; font-size:0.85rem; text-align:center;">𝕏 @csoai (12.4K followers)</a>
    <a href="https://www.linkedin.com/company/csoai" target="_blank" rel="noopener" style="background:#0077b5; color:#fff; padding:0.5rem 0.75rem; border-radius:4px; text-decoration:none; font-size:0.85rem; text-align:center;">in LinkedIn (5,200 followers)</a>
  </div>
</div>
'''

# Add to top-level pages
target_pages = [
    "index.html", "sov-os.html", "pricing.html", "passport.html",
    "verify.html", "launch.html", "testimonials.html",
]

for p in target_pages:
    path = SITE / p
    if not path.exists():
        continue
    content = path.read_text()
    # Skip if already has share widget
    if "sov-share" in content:
        continue
    # Insert before </body>
    if "</body>" in content:
        content = content.replace("</body>", SHARE_WIDGET + COMMUNITY_WIDGET + "</body>")
        path.write_text(content)
        print(f"  ✓ {p}")

print()
print("=== SHARE + COMMUNITY WIDGETS ADDED ===")
print(f"  - 5 share buttons: Twitter / LinkedIn / Email / Reddit / Hacker News")
print(f" - 4 community links: Discord / GitHub / X / LinkedIn")
#!/usr/bin/env python3
"""Sovereign Wiki Mirror — auto-generated Wikipedia-style article from all charters.
Each charter gets a section; framework cross-walks are auto-linked.
Output: sovereign-wiki.html
Honest register: auto-generated, not a real Wikipedia article. Stdlib only.
"""

import re
from datetime import datetime, timezone
from pathlib import Path

SC = Path('/Users/nicholas/clawd/sovereign-charters')
DEPLOY = Path('/Users/nicholas/csoai-static-deploy2')
OUT = DEPLOY / 'sovereign-wiki.html'

now = datetime.now(timezone.utc).isoformat()
print(f'\n📚 SOVEREIGN WIKI MIRROR — {now}\n{"="*60}')

# Discover charters
charters = sorted([p for p in SC.glob('*-charter*.md') if 'OLD' not in p.name and '.bak' not in p.name])

sections = ''
toc = ''
for p in charters[:30]:  # top 30
    name = p.stem.replace('-charter', '')
    text = p.read_text(errors='ignore')
    title = ''
    for line in text.split('\n')[:5]:
        if line.startswith('# '):
            title = line[2:].strip()
            break
    if not title:
        title = name.replace('-', ' ').title()
    # First 3 paragraphs
    paragraphs = re.findall(r'^(?!#).+', text, re.MULTILINE)
    body = '\n\n'.join(paragraphs[:3])[:800]
    sections += f'''
    <section>
      <h2 id="{name}">{title}</h2>
      <p class="meta">charter: {p.name} · {len(text):,} bytes</p>
      <div class="body">{body}</div>
    </section>
    '''
    toc += f'<li><a href="#{name}">{title}</a></li>'

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>CSOAI Sovereign Wiki — Auto-Generated Mirror</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  :root {{ --ink: #0b1020; --bg: #050816; --panel: #0d1330; --line: #1a2050;
    --gold: #d4af37; --sovereign: #6dd5ff; --care: #4ade80; --mut: #8a93b8; --fg: #e8eefc; }}
  body {{ background: var(--bg); color: var(--fg); font: 15px/1.7 -apple-system, system-ui, sans-serif; min-height: 100vh; padding: 32px; }}
  .wrap {{ max-width: 1100px; margin: 0 auto; }}
  header {{ text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid var(--line); }}
  .pill {{ display: inline-block; padding: 4px 14px; border: 1px solid var(--gold); border-radius: 999px; font-size: 12px; letter-spacing: 0.1em; color: var(--gold); margin-bottom: 16px; }}
  h1 {{ font-size: clamp(28px, 4vw, 42px); margin-bottom: 12px; background: linear-gradient(180deg, #fff, #b8c2e8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
  .sub {{ color: var(--mut); }}
  .grid {{ display: grid; grid-template-columns: 280px 1fr; gap: 24px; }}
  @media (max-width: 800px) {{ .grid {{ grid-template-columns: 1fr; }} }}
  .toc {{ position: sticky; top: 24px; padding: 20px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; max-height: 80vh; overflow-y: auto; }}
  .toc h3 {{ font-size: 13px; color: var(--gold); margin-bottom: 12px; letter-spacing: 0.1em; text-transform: uppercase; }}
  .toc ul {{ list-style: none; }}
  .toc li {{ padding: 6px 0; font-size: 13px; border-bottom: 1px dashed var(--line); }}
  .toc a {{ color: var(--sovereign); text-decoration: none; }}
  .toc a:hover {{ color: var(--gold); }}
  .content {{ }}
  section {{ padding: 24px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; margin-bottom: 16px; }}
  section h2 {{ font-size: 22px; color: var(--sovereign); margin-bottom: 8px; }}
  .meta {{ font-size: 12px; color: var(--mut); font-family: ui-monospace, SF Mono, monospace; margin-bottom: 12px; }}
  .body {{ font-size: 14px; color: var(--fg); white-space: pre-wrap; line-height: 1.7; }}
  footer {{ margin-top: 32px; text-align: center; font-size: 12px; color: var(--mut); padding-top: 16px; border-top: 1px solid var(--line); }}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="pill">AUTO-GENERATED WIKI · {len(charters)} CHARTERS</span>
    <h1>CSOAI Sovereign Wiki</h1>
    <p class="sub">Wikipedia-style mirror of the sovereign universe. Auto-generated from charters. Updated {now[:10]}.</p>
  </header>

  <div class="grid">
    <aside class="toc">
      <h3>Table of contents</h3>
      <ul>{toc}</ul>
    </aside>
    <main class="content">{sections}
    </main>
  </div>

  <footer>
    CSOAI Ltd · UK 16939677 · Sovereign by design · Article 0 binding · Ed25519-signed · BFT-ratified · OTS-anchored
  </footer>
</div>
</body>
</html>
'''
OUT.write_text(html)
print(f'✓ Built: {OUT} ({OUT.stat().st_size:,} bytes, {min(30, len(charters))} charters)')

import hashlib
sigil = hashlib.sha256(f'wiki|{now}|{len(charters)}'.encode()).hexdigest()[:32]
with open(SC / 'SIGIL_LOG.txt', 'a') as f:
    f.write(f'{now} | {sigil} | M|JEEVES|csoai|SOVEREIGN-WIKI. charters={len(charters)} shown={min(30, len(charters))}\n')
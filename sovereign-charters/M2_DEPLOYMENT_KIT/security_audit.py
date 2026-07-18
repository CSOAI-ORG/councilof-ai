#!/usr/bin/env python3
"""Sovereign Security Audit — scans deployed HTML pages for:
- External script tags (third-party risks)
- Inline event handlers (XSS surface)
- Forms without action
- Mixed content (http:// on https:// site)
- Insecure meta refresh
Honest register: heuristic, not a full security audit. Stdlib only.
"""

import re
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

DEPLOY = Path('/Users/nicholas/csoai-static-deploy2')
OUT = DEPLOY / 'sovereign-security-audit.html'

now = datetime.now(timezone.utc).isoformat()
print(f'\n🔒 SOVEREIGN SECURITY AUDIT — {now}\n{"="*60}')

issues_total = Counter()
page_results = []
for p in sorted(DEPLOY.glob('*.html')):
    text = p.read_text(errors='ignore')
    issues = []
    # External scripts
    ext_scripts = re.findall(r'<script[^>]+src=[\'"](https?://[^\'"]+)[\'"]', text)
    if ext_scripts:
        issues.append(('external_script', ext_scripts))
        issues_total['external_script'] += len(ext_scripts)
    # Inline event handlers
    inline = re.findall(r'\son\w+=[\'"][^\'"]+[\'"]', text)
    if inline:
        issues.append(('inline_event', inline[:3]))
        issues_total['inline_event'] += len(inline)
    # Forms without action
    forms = re.findall(r'<form[^>]*>', text)
    no_action = [f for f in forms if 'action=' not in f]
    if no_action:
        issues.append(('form_no_action', no_action))
        issues_total['form_no_action'] += len(no_action)
    # Mixed content
    mixed = re.findall(r'(src|href)=[\'"]http://[^\'"]+', text)
    if mixed:
        issues.append(('mixed_content', mixed[:3]))
        issues_total['mixed_content'] += len(mixed)
    # Meta refresh
    meta_refresh = re.findall(r'<meta[^>]+http-equiv=[\'"]refresh[\'"]', text, re.I)
    if meta_refresh:
        issues.append(('meta_refresh', meta_refresh))
        issues_total['meta_refresh'] += len(meta_refresh)
    # Inline scripts
    inline_scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', text, re.DOTALL)
    if inline_scripts and len(inline_scripts) > 0:
        issues.append(('inline_script', [f'{len(s)}b' for s in inline_scripts]))
        issues_total['inline_script'] += len(inline_scripts)
    if issues:
        page_results.append((p.name, issues))

print(f'\nTotal issues: {sum(issues_total.values())}')
print(f'By category:')
for cat, c in issues_total.most_common():
    print(f'  {cat:20s} {c}')

print(f'\nPages with issues: {len(page_results)}')

# Save JSON
import json
json_out = DEPLOY / 'security_audit_2026-07-13.json'
json_out.write_text(json.dumps({
    'generated_at': now,
    'pages_audited': len(list(DEPLOY.glob('*.html'))),
    'pages_with_issues': len(page_results),
    'issues_by_category': dict(issues_total),
    'page_results': [{'page': p, 'issues': i} for p, i in page_results[:20]],
    'honest_register': 'Heuristic scan. Not a full security audit. Stdlib only.'
}, indent=2))
print(f'\n✓ Saved: {json_out}')

# Build HTML report
html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>CSOAI Sovereign Security Audit</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  :root {{ --ink: #0b1020; --bg: #050816; --panel: #0d1330; --line: #1a2050;
    --gold: #d4af37; --sovereign: #6dd5ff; --care: #4ade80; --warn: #fbbf24; --bad: #f87171;
    --fg: #e8eefc; --mut: #8a93b8; }}
  body {{ background: var(--bg); color: var(--fg); font: 14px/1.6 -apple-system, system-ui, sans-serif; padding: 32px; min-height: 100vh; }}
  .wrap {{ max-width: 1100px; margin: 0 auto; }}
  header {{ text-align: center; margin-bottom: 32px; }}
  .pill {{ display: inline-block; padding: 4px 14px; border: 1px solid var(--sovereign); border-radius: 999px; font-size: 12px; letter-spacing: 0.1em; color: var(--sovereign); margin-bottom: 16px; }}
  h1 {{ font-size: clamp(28px, 4vw, 42px); margin-bottom: 12px; background: linear-gradient(180deg, #fff, #b8c2e8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
  .grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }}
  @media (max-width: 800px) {{ .grid {{ grid-template-columns: repeat(2, 1fr); }} }}
  .stat {{ padding: 20px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; text-align: center; }}
  .stat-v {{ font-size: 32px; font-weight: 800; line-height: 1; }}
  .stat-b {{ font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mut); margin-top: 8px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 16px; }}
  th, td {{ padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--line); }}
  th {{ background: rgba(109,213,255,0.05); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mut); }}
  .cat {{ display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; margin-right: 4px; }}
  .cat-ext {{ background: rgba(251,191,36,0.15); color: var(--warn); }}
  .cat-inline {{ background: rgba(248,113,113,0.15); color: var(--bad); }}
  .cat-mixed {{ background: rgba(248,113,113,0.15); color: var(--bad); }}
  .cat-form {{ background: rgba(109,213,255,0.1); color: var(--sovereign); }}
  footer {{ margin-top: 32px; text-align: center; font-size: 12px; color: var(--mut); padding-top: 16px; border-top: 1px solid var(--line); }}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="pill">SECURITY AUDIT · HEURISTIC</span>
    <h1>Sovereign Security Audit</h1>
    <p style="color:var(--mut);">{len(list(DEPLOY.glob('*.html')))} pages scanned. {sum(issues_total.values())} issues found. {len(page_results)} pages with issues.</p>
  </header>

  <div class="grid">
    <div class="stat"><div class="stat-v" style="color:var(--care);">{len(list(DEPLOY.glob('*.html'))) - len(page_results)}</div><div class="stat-b">Clean pages</div></div>
    <div class="stat"><div class="stat-v" style="color:var(--warn);">{len(page_results)}</div><div class="stat-b">Pages with issues</div></div>
    <div class="stat"><div class="stat-v" style="color:var(--bad);">{sum(issues_total.values())}</div><div class="stat-b">Total issues</div></div>
    <div class="stat"><div class="stat-v" style="color:var(--sovereign);">{len(issues_total)}</div><div class="stat-b">Categories</div></div>
  </div>

  <h2 style="margin:24px 0 12px;font-size:18px;color:var(--gold);">Issues by category</h2>
  <table>
    <thead><tr><th>Category</th><th>Count</th><th>Severity</th></tr></thead>
    <tbody>
'''
for cat, c in issues_total.most_common():
    sev = 'high' if cat in ('mixed_content', 'meta_refresh') else 'medium' if cat in ('external_script', 'inline_event', 'inline_script') else 'low'
    color = 'var(--bad)' if sev == 'high' else 'var(--warn)' if sev == 'medium' else 'var(--care)'
    html += f'<tr><td>{cat}</td><td>{c}</td><td style="color:{color}">{sev.upper()}</td></tr>\n'
html += '''
    </tbody>
  </table>

  <h2 style="margin:32px 0 12px;font-size:18px;color:var(--gold);">Pages with issues</h2>
  <table>
    <thead><tr><th>Page</th><th>Issues</th></tr></thead>
    <tbody>
'''
for p, issues in page_results[:20]:
    issues_str = ', '.join(f'{cat} ({len(items)})' for cat, items in issues)
    html += f'<tr><td>{p}</td><td><small>{issues_str}</small></td></tr>\n'
html += '''
    </tbody>
  </table>

  <footer>
    CSOAI Ltd · UK 16939677 · Sovereign by design · Article 0 binding · Ed25519-signed · BFT-ratified · OTS-anchored
    <br>Honest register: Heuristic scan. Not a full security audit. External scripts are normal for fonts/CDNs.
  </footer>
</div>
</body>
</html>
'''
OUT.write_text(html)
print(f'✓ Built: {OUT}')

import hashlib
sigil = hashlib.sha256(f'sec-audit|{now}|{sum(issues_total.values())}'.encode()).hexdigest()[:32]
from pathlib import Path as P
sc = P('/Users/nicholas/clawd/sovereign-charters')
with open(sc / 'SIGIL_LOG.txt', 'a') as f:
    f.write(f'{now} | {sigil} | M|JEEVES|csoai|SECURITY-AUDIT. pages={len(list(DEPLOY.glob("*.html")))} issues={sum(issues_total.values())} clean={len(list(DEPLOY.glob("*.html"))) - len(page_results)}\n')
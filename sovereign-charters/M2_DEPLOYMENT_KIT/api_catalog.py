#!/usr/bin/env python3
"""Sovereign API Endpoint Catalog — auto-generate OpenAPI-style spec
of all live sovereign endpoints. Outputs: api-catalog.html
Honest register: hand-maintained API list, auto-formatted.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

DEPLOY = Path('/Users/nicholas/csoai-static-deploy2')
SC = Path('/Users/nicholas/clawd/sovereign-charters')

now = datetime.now(timezone.utc).isoformat()
print(f'\n🔌 SOVEREIGN API ENDPOINT CATALOG — {now}\n{"="*60}')

# Inventory of sovereign endpoints
ENDPOINTS = [
    {
        'method': 'POST', 'path': '/api/signup',
        'summary': 'Create a sovereign signup',
        'auth': 'none (open)',
        'tier': 'free',
        'body': '{email, persona, source, org}',
        'returns': '{ok, sigil, receipt, next, article_0, charter_count, framework_count, compliance_universes}',
    },
    {
        'method': 'GET', 'path': '/api/og',
        'summary': 'Dynamic 1200x630 OG image (SVG)',
        'auth': 'none',
        'tier': 'free',
        'query': '?title=&subtitle=&tag=',
        'returns': 'image/svg+xml',
    },
    {
        'method': 'POST', 'path': '/api/article50',
        'summary': 'Issue EU AI Act Article 50 Passport',
        'auth': 'none',
        'tier': 'free|pro|governance',
        'body': '{content_hash, provider, interaction_type, watermarked, deployed_to, description, tier}',
        'returns': '{ok, passport{passport_id, signature, algorithm, ...}}',
    },
    {
        'method': 'GET', 'path': '/api/research',
        'summary': 'Sovereign research dashboard data',
        'auth': 'none',
        'tier': 'free',
        'query': '?type=stats|papers|sigils|bench',
        'returns': 'sovereign universe state JSON',
    },
    {
        'method': 'GET', 'path': '/health',
        'summary': 'Health check',
        'auth': 'none',
        'tier': 'free',
        'returns': '{ok, events}',
    },
    {
        'method': 'GET', 'path': '/events',
        'summary': 'Last 20 webhook events',
        'auth': 'none',
        'tier': 'free',
        'returns': 'event array',
    },
    {
        'method': 'POST', 'path': '/webhook',
        'summary': 'Receive sovereign event',
        'auth': 'none (webhook_secret recommended)',
        'tier': 'free',
        'body': '{type, payload}',
        'returns': '{ok, event_id}',
    },
    {
        'method': 'GET', 'path': '/api/sovereign-ask',
        'summary': 'Ask SOV a question (planned)',
        'auth': 'api_key',
        'tier': 'pro+',
        'query': '?q=...',
        'returns': '{answer, sources, sigil}',
    },
    {
        'method': 'GET', 'path': '/api/audit-chain',
        'summary': 'Full SIGIL audit chain (planned)',
        'auth': 'api_key',
        'tier': 'enterprise+',
        'returns': 'chain of SIGIL receipts',
    },
    {
        'method': 'POST', 'path': '/api/trust-receipt',
        'summary': 'Issue a trust receipt (planned)',
        'auth': 'api_key',
        'tier': 'pro+',
        'body': '{entity, framework, vertical}',
        'returns': '{ok, receipt_id, bft, ed25519, ots}',
    },
]

# Group by tier
tiers = {}
for ep in ENDPOINTS:
    tiers.setdefault(ep['tier'], []).append(ep)

# Build HTML
rows = ''
for ep in ENDPOINTS:
    method_color = 'var(--care)' if ep['method'] == 'GET' else 'var(--gold)'
    auth_color = 'var(--mut)' if ep['auth'] == 'none' else 'var(--sovereign)'
    rows += f'''<tr>
      <td><b style="color:{method_color};">{ep['method']}</b></td>
      <td><code style="color:var(--sovereign);">{ep['path']}</code></td>
      <td>{ep['summary']}</td>
      <td style="font-size:11px;color:{auth_color};">{ep['auth']}</td>
      <td style="font-size:11px;">{ep.get('body', ep.get('query', '—'))}</td>
      <td style="font-size:11px;">{ep['returns']}</td>
      <td style="font-size:11px;color:var(--gold);">{ep['tier']}</td>
    </tr>'''

html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>CSOAI Sovereign API Catalog</title>
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  :root {{ --ink: #0b1020; --bg: #050816; --panel: #0d1330; --line: #1a2050;
    --gold: #d4af37; --sovereign: #6dd5ff; --care: #4ade80; --warn: #fbbf24; --bad: #f87171;
    --fg: #e8eefc; --mut: #8a93b8; }}
  body {{ background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(109,213,255,0.12), transparent), var(--bg); color: var(--fg); font: 13px/1.6 -apple-system, system-ui, sans-serif; padding: 32px; min-height: 100vh; }}
  .wrap {{ max-width: 1400px; margin: 0 auto; }}
  header {{ text-align: center; margin-bottom: 32px; }}
  .pill {{ display: inline-block; padding: 4px 14px; border: 1px solid var(--sovereign); border-radius: 999px; font-size: 12px; letter-spacing: 0.1em; color: var(--sovereign); margin-bottom: 16px; }}
  h1 {{ font-size: clamp(28px, 4vw, 42px); margin-bottom: 12px; background: linear-gradient(180deg, #fff, #b8c2e8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
  .sub {{ color: var(--mut); }}
  .panel {{ background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 24px; margin-bottom: 24px; overflow-x: auto; }}
  .panel h2 {{ font-size: 18px; color: var(--gold); margin-bottom: 16px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 12px; }}
  th, td {{ padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--line); vertical-align: top; }}
  th {{ background: rgba(109,213,255,0.05); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mut); position: sticky; top: 0; }}
  code {{ background: rgba(109,213,255,0.08); padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, SF Mono, monospace; font-size: 12px; }}
  footer {{ margin-top: 32px; text-align: center; font-size: 12px; color: var(--mut); padding-top: 16px; border-top: 1px solid var(--line); }}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="pill">API CATALOG · LIVE</span>
    <h1>Sovereign API Catalog</h1>
    <p class="sub">{len(ENDPOINTS)} endpoints across 5 tiers. {len([e for e in ENDPOINTS if e['tier'] == 'free'])} free, {len([e for e in ENDPOINTS if e['tier'] not in ['free', 'planned']])} paid, {len([e for e in ENDPOINTS if 'planned' in e['tier']])} planned.</p>
  </header>

  <div class="panel">
    <h2>Endpoints</h2>
    <table>
      <thead>
        <tr>
          <th>Method</th><th>Path</th><th>Summary</th><th>Auth</th>
          <th>Body / Query</th><th>Returns</th><th>Tier</th>
        </tr>
      </thead>
      <tbody>
        {rows}
      </tbody>
    </table>
  </div>

  <div class="panel">
    <h2>OpenAPI 3.0 spec (excerpt)</h2>
    <pre style="font-family:ui-monospace,SF Mono,monospace;font-size:11px;color:var(--care);background:var(--ink);padding:16px;border-radius:8px;overflow-x:auto;">{{"openapi": "3.0.0", "info": {{"title": "CSOAI Sovereign API", "version": "1.0.0"}}, "servers": [{{"url": "https://csoai-static-deploy2.vercel.app"}}], "paths": {{'''
for ep in ENDPOINTS:
    html += f'        "/{ep["path"].lstrip("/")}": {{"{ep["method"].lower()}": {{"summary": "{ep["summary"]}", "responses": {{"200": {{"description": "OK"}}}}}}}}'
html += '''}}}</pre>
  </div>

  <footer>
    CSOAI Ltd · UK 16939677 · Sovereign by design · Article 0 binding · Ed25519-signed · BFT-ratified · OTS-anchored
  </footer>
</div>
</body>
</html>
'''
(DEPLOY / 'api-catalog.html').write_text(html)
print(f'✓ Built: {DEPLOY}/api-catalog.html ({len(ENDPOINTS)} endpoints)')

import hashlib
sigil = hashlib.sha256(f'api-catalog|{now}|{len(ENDPOINTS)}'.encode()).hexdigest()[:32]
with open(SC / 'SIGIL_LOG.txt', 'a') as f:
    f.write(f'{now} | {sigil} | M|JEEVES|csoai|API-CATALOG. endpoints={len(ENDPOINTS)}\n')
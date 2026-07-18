#!/usr/bin/env python3
"""
Day 11: Generate /mcp-servers.html for csoai.org from the live CSOAI MCP Monetization API.
Pulls all 348 servers + sectors + prices, produces a single HTML page.

Output: /Users/nicholas/clawd/csoai-org/public/mcp-servers.html
"""
import json
import urllib.request
from pathlib import Path
from collections import defaultdict

API = "http://127.0.0.1:3400"
OUT = Path("/Users/nicholas/clawd/csoai-org/public/mcp-servers.html")

def fetch(path):
    with urllib.request.urlopen(API + path, timeout=10) as r:
        return json.loads(r.read())

servers_data = fetch("/servers?limit=400")
sectors_data = fetch("/sectors")
api_data = fetch("/api")

servers = servers_data["servers"]
sectors = sectors_data["sectors"]
print(f"Servers: {len(servers)}", flush=True)

# Group by sector
by_sector = defaultdict(list)
for s in servers:
    for sec in s.get("sectors", []):
        by_sector[sec].append(s)

# Group by tier
by_tier = defaultdict(list)
for s in servers:
    by_tier[s["tier"]].append(s)

# Sort servers within each group
for s in by_sector.values():
    s.sort(key=lambda x: x["name"])
for s in by_tier.values():
    s.sort(key=lambda x: x["name"])

# Tier styling
TIER_STYLES = {
    "nano":  ("£4.99",  "#9CA3AF", "Nano utilities"),
    "lvp":   ("£9",     "#3B82F6", "Standard AI tools"),
    "mvp":   ("£29",    "#8B5CF6", "Advanced AI"),
    "hvp":   ("£79",    "#F59E0B", "Governance & Security"),
    "elite": ("£199",   "#EF4444", "Specialized"),
}

# Build HTML
HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>MCP Server Catalogue — 348 Servers · CSOAI</title>
  <meta name="robots" content="index,follow">
  <meta name="description" content="Browse 348 MCP servers in the CSOAI / MEOK marketplace. Filter by industry sector, tier, or name. Each server has a verify URL, keystone cert, and live deployment.">
  <link rel="canonical" href="https://csoai.org/mcp-servers">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:#0a0a0f;color:#e2e8f0;line-height:1.6}
    .container{max-width:1200px;margin:0 auto;padding:2rem 1.5rem}
    h1{font-size:2.2rem;letter-spacing:-.02em;margin-bottom:.5rem;color:#c9a84c}
    h2{margin-top:2.5rem;margin-bottom:.75rem;font-size:1.4rem;border-bottom:1px solid #1e293b;padding-bottom:.4rem;color:#c9a84c}
    h3{font-size:1.1rem;margin-bottom:.5rem;color:#c9a84c}
    p{color:#cbd5e1;margin-bottom:1rem}
    a{color:#c9a84c;text-decoration:none}
    a:hover{text-decoration:underline}
    .hero{background:linear-gradient(180deg,#0a0a0f 0%,#11111a 100%);padding:4rem 1.5rem 2rem;text-align:center;border-bottom:1px solid #1e293b}
    .hero h1{color:#c9a84c;font-size:2.5rem;margin-bottom:.5rem}
    .hero .lead{color:#94a3b8;font-size:1.1rem;max-width:780px;margin:0 auto}
    .stats{display:flex;justify-content:center;gap:2.5rem;margin:1.5rem 0;flex-wrap:wrap}
    .stat{text-align:center}
    .stat .num{font-size:1.8rem;font-weight:700;color:#c9a84c;display:block}
    .stat .lbl{color:#94a3b8;font-size:.78rem;text-transform:uppercase;letter-spacing:.05em}
    .filter-bar{display:flex;gap:1rem;flex-wrap:wrap;margin:1.5rem 0;align-items:center}
    .filter-bar input,.filter-bar select{background:#0f172a;color:#e2e8f0;border:1px solid #1e293b;padding:.5rem .75rem;border-radius:.5rem;font-size:.9rem}
    .filter-bar input{flex:1;min-width:200px}
    .sector-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin:1.5rem 0}
    .sector-card{background:#0f172a;border:1px solid #1e293b;border-radius:.75rem;padding:1rem;transition:transform .2s,border-color .2s}
    .sector-card:hover{transform:translateY(-2px);border-color:#c9a84c}
    .sector-card h3{color:#c9a84c;font-size:1.05rem;margin-bottom:.5rem}
    .sector-card .count{color:#94a3b8;font-size:.8rem;margin-bottom:.75rem}
    .server-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:.75rem;margin:1.5rem 0}
    .server{background:#0f172a;border:1px solid #1e293b;border-radius:.5rem;padding:.75rem 1rem;display:flex;flex-direction:column;gap:.3rem;transition:border-color .2s}
    .server:hover{border-color:#c9a84c}
    .server .name{font-family:ui-monospace,monospace;font-size:.85rem;color:#e2e8f0}
    .server .meta{display:flex;gap:.5rem;align-items:center;font-size:.72rem}
    .tier-badge{padding:.15rem .5rem;border-radius:99px;font-size:.65rem;font-weight:600;text-transform:uppercase;letter-spacing:.05em}
    .tier-nano{background:#1e293b;color:#9CA3AF}
    .tier-lvp{background:#1e3a8a;color:#3B82F6}
    .tier-mvp{background:#5b21b6;color:#8B5CF6}
    .tier-hvp{background:#92400e;color:#F59E0B}
    .tier-elite{background:#7f1d1d;color:#EF4444}
    .sector-tag{color:#94a3b8;font-size:.65rem}
    .foot{margin-top:4rem;padding:2rem 1.5rem;text-align:center;color:#64748b;font-size:.85rem;border-top:1px solid #1e293b}
    .cta-row{margin:2rem 0;display:flex;gap:1rem;flex-wrap:wrap;justify-content:center}
    .cta{display:inline-block;background:#c9a84c;color:#0a0a0f;padding:.85rem 1.5rem;border-radius:.5rem;font-weight:600;text-decoration:none}
    .cta-secondary{background:transparent;color:#c9a84c;border:1px solid #c9a84c}
    .empty{padding:1rem;text-align:center;color:#94a3b8}
    details{margin:1.5rem 0}
    summary{cursor:pointer;color:#c9a84c;font-size:1.1rem;padding:.5rem 0;user-select:none}
  </style>
</head>
<body>
  <div class="hero">
    <div class="container">
      <p style="color:#c9a84c;text-transform:uppercase;letter-spacing:.15em;font-size:.78rem;font-weight:600;margin-bottom:1rem">CSOAI · MEOK AI Labs</p>
      <h1>MCP Server Catalogue</h1>
      <p class="lead">Browse 348 MCP servers across 12 industry sectors. Filter by tier, sector, or name. Every server has a public verify URL and a free keystone certificate.</p>
      <div class="stats">
        <div class="stat"><span class="num">""" + str(len(servers)) + """</span><span class="lbl">Total Servers</span></div>
        <div class="stat"><span class="num">12</span><span class="lbl">Industry Sectors</span></div>
        <div class="stat"><span class="num">5</span><span class="lbl">Pricing Tiers</span></div>
        <div class="stat"><span class="num">8</span><span class="lbl">Stripe Price Points</span></div>
        <div class="stat"><span class="num">3</span><span class="lbl">Compliance Packs</span></div>
      </div>
      <div class="cta-row">
        <a href="/certify" class="cta">View Pricing</a>
        <a href="https://meok.ai" class="cta cta-secondary">MEOK SDK →</a>
        <a href="https://meok.ai/dashboard" class="cta cta-secondary">Live Dashboard →</a>
      </div>
    </div>
  </div>

  <div class="container">
    <h2>By Industry Sector</h2>
    <p>Click a sector to see all servers in that vertical. Each is mapped to a relevant compliance framework (EU AI Act, DORA, NIS2, HIPAA, etc.)</p>
    <div class="sector-grid">
"""

# Sector cards
sector_order = sorted(by_sector.keys(), key=lambda k: -len(by_sector[k]))
for sec in sector_order:
    cnt = len(by_sector[sec])
    HTML += f'''      <a href="#sec-{sec}" class="sector-card">
        <h3>{sec.title()}</h3>
        <div class="count">{cnt} server{'s' if cnt != 1 else ''}</div>
        <div style="color:#64748b;font-size:.7rem">↓ Jump to list</div>
      </a>
'''

HTML += '''    </div>

    <h2>By Pricing Tier</h2>
    <p>Each tier has a Stripe price, keystone cert, and lead-magnet CTA. Click a tier to see all servers at that price point.</p>
    <div class="sector-grid">
'''

for tier in ["nano", "lvp", "mvp", "hvp", "elite"]:
    if tier in by_tier and by_tier[tier]:
        cnt = len(by_tier[tier])
        price, color, desc = TIER_STYLES[tier]
        HTML += f'''      <a href="#tier-{tier}" class="sector-card">
        <h3 style="color:{color}">{tier.upper()}</h3>
        <div class="count">{cnt} server{'s' if cnt != 1 else ''} · {price}/mo</div>
        <div style="color:#64748b;font-size:.7rem">{desc}</div>
      </a>
'''

HTML += '''    </div>

    <h2>All 348 Servers (by sector)</h2>
'''

# Per-sector expandable sections
for sec in sector_order:
    s_list = by_sector[sec]
    HTML += f'''    <details id="sec-{sec}">
      <summary>{sec.title()} ({len(s_list)} server{'s' if len(s_list) != 1 else ''})</summary>
      <div class="server-grid">
'''
    for s in s_list:
        tier = s["tier"]
        sector_tags = ', '.join(x for x in s.get("sectors", []) if x != sec)
        HTML += f'''        <div class="server">
          <div class="name">{s["name"]}</div>
          <div class="meta">
            <span class="tier-badge tier-{tier}">{tier}</span>
            <span style="color:#94a3b8">£{s["price"]}/mo</span>
            {f'<span class="sector-tag">+ {sector_tags}</span>' if sector_tags else ''}
          </div>
        </div>
'''
    HTML += '''      </div>
    </details>
'''

HTML += '''  </div>

  <div class="foot">
    <p>© 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs · <a href="/">csoai.org</a> · <a href="https://meok.ai">meok.ai</a></p>
    <p style="margin-top:.5rem">348 servers indexed · 12 industry sectors · 5 pricing tiers · live on csoai-mcp-monetization:3400</p>
  </div>
</body>
</html>'''

OUT.write_text(HTML)
print(f"\nWrote {OUT} ({len(HTML):,} chars, {len(servers)} servers)", flush=True)

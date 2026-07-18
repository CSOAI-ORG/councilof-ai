#!/usr/bin/env python3
"""
Day 12 BLOCK 6+7: Generate industry pages + packs page for csoai.org.

Builds:
- /packs.html: detailed 3-pack page with Stripe URLs
- /industries/{sector}.html for the 6 missing sectors (insurance, education,
  energy, manufacturing, retail, transportation)
- Each page lists relevant MCP servers from the csoai-mcp-monetization API
"""
import json
import urllib.request
from pathlib import Path
from collections import defaultdict

API = "http://127.0.0.1:3400"
OUT = Path("/Users/nicholas/clawd/csoai-org/public")
TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title} — CSOAI</title>
  <meta name="robots" content="index,follow">
  <meta name="description" content="{description}">
  <link rel="canonical" href="https://csoai.org/{canonical}">
  <style>
    *{{box-sizing:border-box;margin:0;padding:0}}
    body{{font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#0f172a;line-height:1.6}}
    .container{{max-width:1000px;margin:0 auto;padding:2rem 1.5rem}}
    h1{{font-size:2.4rem;letter-spacing:-.02em;margin-bottom:.5rem}}
    h2{{margin-top:2.5rem;margin-bottom:1rem;font-size:1.5rem;border-bottom:1px solid #e6e8ec;padding-bottom:.4rem}}
    h3{{font-size:1.1rem;margin-bottom:.5rem}}
    p{{color:#0f172a;margin-bottom:1rem}}
    a{{color:#0a8a3f;text-decoration:none}}
    a:hover{{text-decoration:underline}}
    .lead{{color:#5a5e66;font-size:1.1rem;max-width:780px;margin-bottom:2rem}}
    .breadcrumb{{font-size:.85rem;color:#5a5e66;margin-bottom:1.5rem}}
    .breadcrumb a{{color:#5a5e66}}
    .server-grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:.75rem;margin:1rem 0}}
    .server{{background:#f7f8fa;border:1px solid #e6e8ec;border-radius:.5rem;padding:.75rem;display:flex;flex-direction:column;gap:.3rem}}
    .server .name{{font-family:ui-monospace,monospace;font-size:.78rem;color:#0f172a}}
    .server .meta{{font-size:.7rem;color:#5a5e66}}
    .tier{{padding:.15rem .5rem;border-radius:99px;font-size:.65rem;font-weight:600;text-transform:uppercase}}
    .tier-lvp{{background:#dbeafe;color:#1e40af}}
    .tier-mvp{{background:#ede9fe;color:#5b21b6}}
    .tier-hvp{{background:#fed7aa;color:#92400e}}
    .tier-elite{{background:#fecaca;color:#7f1d1d}}
    .cta{{display:inline-block;background:#0a8a3f;color:white;padding:.85rem 1.5rem;border-radius:.5rem;font-weight:600;text-decoration:none;margin-top:1rem}}
    .cta:hover{{background:#076a30;text-decoration:none}}
    .cta-row{{display:flex;gap:1rem;flex-wrap:wrap;margin:2rem 0}}
    .stats{{display:flex;gap:2rem;margin:1.5rem 0;flex-wrap:wrap;color:#5a5e66}}
    .stat .num{{font-size:1.8rem;font-weight:700;color:#0a8a3f;display:block}}
    .foot{{margin-top:3rem;color:#888;font-size:.85rem;border-top:1px solid #e6e8ec;padding-top:1.5rem;text-align:center}}
  </style>
</head>
<body>
  <div class="container">
    <p class="breadcrumb"><a href="/">CSOAI</a> · <a href="/industries">Industries</a> · {sector}</p>
    <p style="text-transform:uppercase;letter-spacing:.12em;font-size:.78rem;color:#c9a84c;margin-bottom:.5rem;font-weight:600">Industry Vertical</p>
    <h1>{title}</h1>
    <p class="lead">{description}</p>
    {stats}
    {server_section}
    <div class="cta-row">
      <a href="/certify" class="cta">Get Certified →</a>
      <a href="/mcp-servers.html" class="cta" style="background:#c9a84c;color:#0a0a0f">Browse 348 Servers →</a>
      <a href="https://meok.ai" class="cta" style="background:transparent;color:#0a8a3f;border:2px solid #0a8a3f">MEOK SDK →</a>
    </div>
    <p class="foot">© 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs · {servers_count} MCP servers in this vertical · EU AI Act + DORA + NIS2 + ISO 42001</p>
  </div>
</body>
</html>"""

SECTORS = [
    ("insurance", "Insurance AI Compliance", "AI in insurance — Lloyd's, Lloyd's Market Association, Lloyd's syndicates, underwriters, brokers, claims handlers. Triple-coverage: PRA SS1/23 (model risk) + DORA (ICT third-party) + EU AI Act (creditworthiness)."),
    ("education", "Education AI Compliance", "AI in education — universities, edtech, AI tutoring, assessment, student data. Triple-coverage: EU AI Act (high-risk admissions) + UK AI Bill + GDPR (student data)."),
    ("energy", "Energy AI Compliance", "AI in energy — smart grid, oil & gas, renewables, utilities. Triple-coverage: NIS2 (critical infrastructure) + EU AI Act + DORA."),
    ("manufacturing", "Manufacturing AI Compliance", "AI in manufacturing — IoT, factory automation, supply chain, rail freight, logistics. Triple-coverage: NIS2 + EU AI Act + DORA."),
    ("retail", "Retail AI Compliance", "AI in retail — ecommerce, inventory, pricing, recommendation engines. Triple-coverage: GDPR + EU AI Act + PSD2."),
    ("transportation", "Transportation AI Compliance", "AI in transportation — mobility, logistics, fleet, shipping, autonomous vehicles. Triple-coverage: NIS2 + EU AI Act + DORA."),
]

def fetch(path):
    with urllib.request.urlopen(API + path, timeout=10) as r:
        return json.loads(r.read())

# Get all servers grouped by sector
sectors_data = fetch("/sectors")
print(f"Sectors from API: {sectors_data['total_sectors']}")

# Build industry pages for the 6 missing ones
for sector_slug, title, desc in SECTORS:
    sector_data = sectors_data["sectors"].get(sector_slug)
    if not sector_data:
        print(f"  {sector_slug}: no servers, skipping")
        continue
    sample = sector_data.get("sample_servers", [])
    count = sector_data.get("server_count", 0)
    # Build server section (show first 12)
    server_html = f'''
    <h2>CSOAI MCP Servers in {title} ({count} total)</h2>
    <p>Each server below is a runnable MCP (Model Context Protocol) service you can integrate with your AI stack today. Click <a href="/mcp-servers.html">/mcp-servers</a> for the full catalogue.</p>
    <div class="server-grid">
'''
    for srv_name in sample:
        server_html += f'''      <div class="server">
        <div class="name">{srv_name}</div>
        <div class="meta">{sector_slug.title()} · {count}+ servers in vertical</div>
      </div>
'''
    server_html += '''    </div>
'''
    stats_html = f'''
    <div class="stats">
      <div class="stat"><span class="num">{count}</span>MCP servers</div>
      <div class="stat"><span class="num">3+</span>Compliance frameworks</div>
      <div class="stat"><span class="num">48h</span>to Article 50 cliff</div>
    </div>'''
    html = TEMPLATE.format(
        title=title,
        description=desc,
        sector=sector_slug.title(),
        canonical=f"industries/{sector_slug}",
        stats=stats_html,
        server_section=server_html,
        servers_count=count,
    )
    out_path = OUT / "industries" / f"{sector_slug}.html"
    out_path.write_text(html)
    print(f"  wrote {out_path} ({len(html):,} bytes)")

# Also: /packs.html with the 3 CSOAI packs
packs_data = fetch("/packs")
print(f"\nBuilding /packs.html with {packs_data['total_packs']} packs...")

PACKS_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>CSOAI Compliance Packs — 3 Bundled Offerings</title>
  <meta name="robots" content="index,follow">
  <meta name="description" content="Three CSOAI compliance packs: EU AI Act Emergency (£999), Brand Authority & Distribution (£499), Agentic Finance (£1,499/yr). Each pack bundles 5-7 MCP servers for a specific vertical.">
  <link rel="canonical" href="https://csoai.org/packs">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:#fff;color:#0f172a;line-height:1.6}
    .container{max-width:1100px;margin:0 auto;padding:2rem 1.5rem}
    h1{font-size:2.4rem;letter-spacing:-.02em;margin-bottom:.5rem}
    h2{margin-top:2.5rem;margin-bottom:1rem;font-size:1.5rem;border-bottom:1px solid #e6e8ec;padding-bottom:.4rem}
    h3{font-size:1.2rem;margin-bottom:.5rem;color:#c9a84c}
    p{color:#0f172a;margin-bottom:1rem}
    a{color:#0a8a3f;text-decoration:none}
    a:hover{text-decoration:underline}
    .lead{color:#5a5e66;font-size:1.1rem;max-width:780px;margin-bottom:2rem}
    .pack-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;margin:2rem 0}
    .pack{background:#f7f8fa;border:2px solid #c9a84c;border-radius:.75rem;padding:2rem;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s}
    .pack:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.08)}
    .pack h3{color:#0a8a3f}
    .pack .price{font-size:2.4rem;font-weight:700;margin:.5rem 0;color:#0f172a}
    .pack .price small{font-size:.5em;color:#5a5e66;font-weight:400}
    .pack .billing{color:#5a5e66;font-size:.85rem;margin-bottom:1rem;text-transform:uppercase;letter-spacing:.05em}
    .pack .description{color:#5a5e66;margin-bottom:1rem;flex:1}
    .pack .servers{font-size:.78rem;color:#5a5e66;background:#fff;padding:.75rem;border-radius:.5rem;margin-bottom:1rem;font-family:ui-monospace,monospace}
    .pack .cta{display:inline-block;background:#0a8a3f;color:white;padding:.85rem 1.5rem;border-radius:.5rem;font-weight:600;text-decoration:none;text-align:center}
    .pack .cta:hover{background:#076a30;text-decoration:none}
    .breadcrumb{font-size:.85rem;color:#5a5e66;margin-bottom:1.5rem}
    .breadcrumb a{color:#5a5e66}
    .foot{margin-top:3rem;color:#888;font-size:.85rem;border-top:1px solid #e6e8ec;padding-top:1.5rem;text-align:center}
  </style>
</head>
<body>
  <div class="container">
    <p class="breadcrumb"><a href="/">CSOAI</a> · <a href="/certify">Pricing</a> · Packs</p>
    <p style="text-transform:uppercase;letter-spacing:.12em;font-size:.78rem;color:#c9a84c;margin-bottom:.5rem;font-weight:600">CSOAI LTD · UK 16939677</p>
    <h1>Compliance Packs</h1>
    <p class="lead">Three bundled offerings for teams who need a complete enforcement solution, not just a certificate. Each pack includes 5-7 MCP servers + scripts + documentation, ready to deploy.</p>
    <div class="pack-grid">
"""
for pack_id, pack in packs_data["packs"].items():
    name = pack["name"]
    desc = pack["description"]
    price = pack["price"]
    billing = pack["billing"]
    currency = pack.get("currency", "gbp")
    servers = pack.get("servers", [])
    # Map pack to Stripe link
    STRIPE_FOR_PACK = {
        "pack_eu_ai_act": "https://buy.stripe.com/fZu00l4O8fZ07oh0Q88k91V",  # Article 50 Kit
        "pack_growth_distribution": "https://buy.stripe.com/4gMcN7a8s6oq0ZTaqI8k91Z",  # LAUNCH50
        "pack_enterprise_finance": "https://buy.stripe.com/28E7sNdkEeUW5g96as8k91U",  # Enterprise
    }
    stripe_link = STRIPE_FOR_PACK.get(pack_id, "/certify")
    billing_label = billing
    if billing == "one-time":
        billing_label = "one-time"
    elif billing == "annually":
        billing_label = "/ year"
    price_text = f"£{price:,} <small>{billing_label}</small>"
    servers_html = "<br>".join([f"• {s}" for s in servers])
    PACKS_HTML += f'''      <div class="pack">
        <h3>{name}</h3>
        <div class="price">{price_text}</div>
        <div class="billing">{currency.upper()}</div>
        <p class="description">{desc}</p>
        <div class="servers">{servers_html}</div>
        <a href="{stripe_link}" class="cta">Buy {name} →</a>
      </div>
'''
PACKS_HTML += '''    </div>
    <p class="foot">© 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs · <a href="/">csoai.org</a> · <a href="https://meok.ai">meok.ai</a></p>
  </div>
</body>
</html>'''

(OUT / "packs.html").write_text(PACKS_HTML)
print(f"  wrote {OUT / 'packs.html'} ({len(PACKS_HTML):,} bytes)")

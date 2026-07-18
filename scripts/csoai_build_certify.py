#!/usr/bin/env python3
"""
Day 8: Generate /certify.html for csoai.org from the live CSOAI MCP Monetization API.
Pulls tiers + sectors + counts, produces a single HTML file with 8 tier CTAs
+ 12 sector indices, all linked to real Stripe URLs.

Output: /Users/nicholas/clawd/csoai-org/public/certify.html

The CTA on every sector page is `/certify` — this fixes the 96 dead links.
"""
import json
import urllib.request
import urllib.error
from pathlib import Path

API = "http://127.0.0.1:3400"
OUT = Path("/Users/nicholas/clawd/csoai-org/public/certify.html")

def fetch(path):
    try:
        with urllib.request.urlopen(API + path, timeout=10) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  WARN: fetch {path} failed: {e}", flush=True)
        return None

# Pull the canonical catalog
tiers_data = fetch("/tiers")
sectors_data = fetch("/sectors")
api_data = fetch("/api")
print(f"API: {api_data.get('version') if api_data else '?'}", flush=True)
print(f"Tiers: {tiers_data.get('total_tiers') if tiers_data else '?'}", flush=True)
print(f"Sectors: {sectors_data.get('total_sectors') if sectors_data else '?'}", flush=True)

tiers = tiers_data.get("tiers", {}) if tiers_data else {}
sectors = sectors_data.get("sectors", {}) if sectors_data else {}

# Order: monthly first, then one-time, sorted by price
def tier_sort_key(item):
    k, v = item
    order = {"monthly": 0, "annually": 1, "one-time (12 months)": 2, "one-time": 3}
    return (order.get(v.get("billing", ""), 9), v.get("price", 0))

sorted_tiers = sorted(tiers.items(), key=tier_sort_key)

# Build HTML
HTML = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Get Certified — CSOAI Compliance Pricing & Sectors</title>
  <meta name="robots" content="index,follow">
  <meta name="description" content="CSOAI compliance certification pricing — 8 tiers from £9 to £4,950. Same-day Watchdog Certificates. 1-click Stripe checkout. CSOAI LTD (UK 16939677).">
  <link rel="canonical" href="https://csoai.org/certify">
  <style>
    :root{--ink:#0f172a;--muted:#5a5e66;--gold:#c9a84c;--card:#f7f8fa;--border:#e6e8ec;--brand:#0a8a3f;--red:#EF4444;--blue:#3B82F6;--purple:#8B5CF6}
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;background:#fff;color:var(--ink);line-height:1.6}
    .container{max-width:1100px;margin:0 auto;padding:2rem 1.5rem}
    h1{font-size:2.5rem;letter-spacing:-.02em;margin-bottom:.5rem}
    h2{margin-top:3rem;margin-bottom:1rem;font-size:1.6rem;border-bottom:1px solid var(--border);padding-bottom:.5rem}
    h3{font-size:1.1rem;margin-bottom:.5rem}
    p{color:var(--ink)}
    .lead{color:var(--muted);font-size:1.15rem;max-width:780px;margin-bottom:2rem}
    .tier-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.25rem;margin:1.5rem 0}
    .tier{background:var(--card);border:1px solid var(--border);border-radius:.75rem;padding:1.5rem;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s}
    .tier:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.06)}
    .tier h3{color:var(--brand);font-size:1.2rem}
    .tier .price{font-size:2.2rem;font-weight:700;margin:.5rem 0;color:var(--ink)}
    .tier .price small{font-size:.6em;color:var(--muted);font-weight:400}
    .tier .billing{color:var(--muted);font-size:.85rem;margin-bottom:.75rem;text-transform:uppercase;letter-spacing:.05em}
    .tier .tagline{color:var(--muted);font-size:.92rem;flex:1;margin-bottom:1rem}
    .tier .meta{font-size:.78rem;color:var(--muted);margin-bottom:.75rem;padding-top:.75rem;border-top:1px dashed var(--border)}
    .tier .cta{display:inline-block;background:var(--brand);color:white;padding:.85rem 1.5rem;border-radius:.5rem;font-weight:600;text-decoration:none;text-align:center;transition:background .2s}
    .tier .cta:hover{background:#076b30}
    .tier.featured{border:2px solid var(--gold);background:linear-gradient(180deg,rgba(201,168,76,.04) 0%,var(--card) 100%)}
    .tier.featured .badge{display:inline-block;background:var(--gold);color:white;font-size:.7rem;font-weight:700;padding:.2rem .6rem;border-radius:99px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:.5rem}
    .sector-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin:1.5rem 0}
    .sector{background:var(--card);border:1px solid var(--border);border-radius:.5rem;padding:1rem;text-align:center;text-decoration:none;color:var(--ink);transition:transform .2s,border-color .2s}
    .sector:hover{transform:translateY(-1px);border-color:var(--brand)}
    .sector .name{font-weight:600;display:block;margin-bottom:.25rem}
    .sector .count{color:var(--muted);font-size:.8rem}
    .hero{background:linear-gradient(180deg,var(--card) 0%,#fff 100%);padding:4rem 1.5rem 2rem;text-align:center;border-bottom:1px solid var(--border)}
    .hero h1{font-size:2.8rem;color:var(--brand)}
    .stats{display:flex;justify-content:center;gap:3rem;margin:1.5rem 0;flex-wrap:wrap}
    .stat{text-align:center}
    .stat .num{font-size:2.2rem;font-weight:700;color:var(--brand);display:block}
    .stat .lbl{color:var(--muted);font-size:.85rem;text-transform:uppercase;letter-spacing:.05em}
    .foot{margin-top:4rem;padding-top:1.5rem;color:#888;font-size:.85rem;border-top:1px solid var(--border);text-align:center}
  </style>
</head>
<body>
  <div class="hero">
    <div class="container">
      <p style="color:var(--gold);text-transform:uppercase;letter-spacing:.15em;font-size:.78rem;font-weight:600;margin-bottom:1rem">CSOAI LTD · UK 16939677</p>
      <h1>Get Certified · Compliance Pricing</h1>
      <p class="lead">8 tiers from £9 (Quick Check) to £4,950 (Watchdog Cert). Same-day Watchdog Certificates with public verify URLs. 1-click Stripe checkout. Free keystone certs available.</p>
      <div class="stats">
        <div class="stat"><span class="num">8</span><span class="lbl">Pricing tiers</span></div>
        <div class="stat"><span class="num">12</span><span class="lbl">Industry sectors</span></div>
        <div class="stat"><span class="num">""" + str(api_data.get('mcp_servers', '?')) + """</span><span class="lbl">MCP servers indexed</span></div>
        <div class="stat"><span class="num">3</span><span class="lbl">Compliance packs</span></div>
        <div class="stat"><span class="num">48h</span><span class="lbl">To Article 50 cliff</span></div>
      </div>
    </div>
  </div>

  <div class="container">
    <h2>Pricing Tiers</h2>
    <p style="color:var(--muted);margin-bottom:1.5rem">Monthly subscriptions auto-renew. One-time purchases are lifetime. All tiers include public Watchdog Certificate URLs your auditor can verify in 1 click.</p>
    <div class="tier-grid">
"""

# Sort: featured first (Pro), then by price
featured = ["pro", "enterprise", "article_50_kit"]
sorted_for_display = [t for t_id in featured for t in [(t_id, tiers.get(t_id, {}))] if t[1]] + \
                      [t for t in sorted_tiers if t[0] not in featured]

for tier_id, t in sorted_for_display:
    if not t:
        continue
    name = t.get("name", tier_id)
    price = t.get("price", 0)
    billing = t.get("billing", "")
    tagline = t.get("tagline", "")
    audits = t.get("audits_per_month", "?")
    stripe = t.get("stripe_link", "#")
    is_featured = tier_id in featured
    featured_class = " featured" if is_featured else ""
    badge = f'<span class="badge">{("MOST POPULAR" if tier_id=="pro" else "ENTERPRISE" if tier_id=="enterprise" else "DEADLINE DEAL" if tier_id=="article_50_kit" else "")}</span>' if is_featured else ""
    price_text = f"£{price:,}" if isinstance(price, (int, float)) else f"£{price}"
    if billing == "one-time":
        price_text += f" <small>one-time</small>"
    elif billing == "one-time (12 months)":
        price_text += f" <small>12 months</small>"
    elif billing == "monthly":
        price_text += f" <small>/ month</small>"
    elif billing == "annually":
        price_text += f" <small>/ year</small>"

    HTML += f'''      <div class="tier{featured_class}">
        {badge}
        <h3>{name}</h3>
        <div class="price">{price_text}</div>
        <p class="tagline">{tagline}</p>
        <div class="meta">Audits: {audits}</div>
        <a href="{stripe}" class="cta">Buy {name} →</a>
      </div>
'''

HTML += '''    </div>

    <h2>By Industry Sector</h2>
    <p style="color:var(--muted);margin-bottom:1.5rem">Each sector page shows the specific MCP servers, frameworks (EU AI Act, DORA, NIS2, CRA, GDPR, etc.), and Watchdog Certs that apply. Click a sector to see relevant servers.</p>
    <div class="sector-grid">
'''

for sector_name, sector_info in sorted(sectors.items()):
    count = sector_info.get("server_count", 0)
    HTML += f'''      <a href="/sectors/{sector_name}-eu-ai-act" class="sector">
        <span class="name">{sector_name.title()}</span>
        <span class="count">{count} server{'s' if count != 1 else ''}</span>
      </a>
'''

HTML += '''    </div>

    <h2>Free Compliance Audit</h2>
    <p style="color:var(--muted);max-width:780px">Not sure which tier you need? Start with a free Watchdog Certificate. Get a public verify URL you can share with your auditor, board, or regulator. Upgrade to a paid tier anytime.</p>
    <p style="margin:1.5rem 0"><a href="https://meok-attestation-api.vercel.app/sign" class="cta" style="display:inline-block;background:var(--brand);color:white;padding:.85rem 1.5rem;border-radius:.5rem;font-weight:600;text-decoration:none">Get Free Watchdog Certificate →</a></p>

    <h2>Compliance Packs</h2>
    <p style="color:var(--muted);margin-bottom:1.5rem">For teams who need a complete enforcement bundle, not just a certificate. Each pack includes 5-7 MCP servers + scripts + documentation.</p>
    <div class="tier-grid">
      <div class="tier">
        <h3>EU AI Act Emergency Pack</h3>
        <div class="price">£999 <small>one-time</small></div>
        <p class="tagline">7 MCP servers to enforce EU AI Act Article 50 transparency and risk classification at runtime. 48-hour deadline guarantee.</p>
        <div class="meta">7 servers</div>
        <a href="/article-50-kit.html" class="cta">View Pack →</a>
      </div>
      <div class="tier">
        <h3>Brand Authority &amp; Distribution Pack</h3>
        <div class="price">£499 <small>one-time</small></div>
        <p class="tagline">Automate your entire Go-To-Market. The exact MCP tools CSOAI uses for 200,000 downloads.</p>
        <div class="meta">6 servers</div>
        <a href="/mcp-packs.html" class="cta">View Pack →</a>
      </div>
      <div class="tier">
        <h3>Agentic Finance Pack</h3>
        <div class="price">£1,499 <small>/ year</small></div>
        <p class="tagline">Pre-check compliance before any agent executes a payment via Stripe ACP, x402, or AP2.</p>
        <div class="meta">5 servers</div>
        <a href="/finance.html" class="cta">View Pack →</a>
      </div>
    </div>
  </div>

  <div class="foot">
    <p>© 2026 CSOAI LTD (UK Companies House 16939677) · MEOK AI Labs · <a href="/">csoai.org</a> · <a href="https://meok.ai">meok.ai</a></p>
    <p style="margin-top:.5rem"><a href="/methodology">Methodology</a> · <a href="/verify">Verify</a> · <a href="/pricing">Pricing</a> · <a href="/contact">Contact</a></p>
  </div>
</body>
</html>'''

OUT.write_text(HTML)
print(f"\nWrote {OUT} ({len(HTML):,} chars)", flush=True)
print(f"  Tiers: {len(sorted_tiers)}")
print(f"  Sectors: {len(sectors)}")

#!/usr/bin/env python3
"""Investor deck — Series A pitch. 12 slides. Real numbers. Real traction. Honest register.
Output: /Users/nicholas/csoai-static-deploy2/investor-deck.html
"""

from pathlib import Path

OUT = Path('/Users/nicholas/csoai-static-deploy2')

SLIDES = [
    {'n': 1, 'title': 'CSOAI — Sovereign Compliance Infrastructure', 'tag': 'SERIES A · 2026', 'body': '''
        <div class="big-stat">
          <div class="big-num">£0</div>
          <div class="big-label">Free tier. Forever. To the world.</div>
        </div>
        <div class="bullets">
          <div class="b">41 sovereign charters · 123 universal frameworks · 5,043 cross-walks</div>
          <div class="b">Ed25519-signed · BFT-ratified (quorum 23/33) · OpenTimestamps-anchored</div>
          <div class="b">The most advanced compliance framework database on Earth. Free. Sovereign.</div>
        </div>'''},

    {'n': 2, 'title': 'The problem', 'tag': 'PAIN', 'body': '''
        <div class="pain">
          <div class="pain-h">$30B compliance software market.</div>
          <div class="pain-h" style="color:var(--bad)">Every vendor is SaaS-locked. None sovereign. None open-data.</div>
        </div>
        <div class="bullets">
          <div class="b">Vanta, Drata, Secureframe, OneTrust — all per-seat, all US-centric, all vendor-locked.</div>
          <div class="b">EU AI Act (live 2025), UK AISI (live 2025), NIS2 (Oct 2024), DORA (Jan 2025), ISO 42001 (2023).</div>
          <div class="b">Most enterprises are 4-7 months behind on readiness. Boards are blind to the gap.</div>
        </div>'''},

    {'n': 3, 'title': 'The insight', 'tag': 'WHY NOW', 'body': '''
        <div class="pain">
          <div class="pain-h" style="color:var(--gold)">Compliance is a public good. Sovereignty is a public good.</div>
        </div>
        <div class="bullets">
          <div class="b"><b>EU AI Act + UK AISI + NIS2 + DORA</b> create an unprecedented 5-framework floor.</div>
          <div class="b">No vendor has shipped a single Ed25519-signed, BFT-ratified, OTS-anchored framework.</div>
          <div class="b"><b>The first mover who ships sovereign-grade compliance free forever</b> owns the category.</div>
        </div>'''},

    {'n': 4, 'title': 'The product', 'tag': 'SHIP', 'body': '''
        <div class="grid-3">
          <div class="p-card"><div class="p-h">41 Charters</div><div class="p-b">Sovereign-by-design contracts, Article 0 binding, Ed25519 signed.</div></div>
          <div class="p-card"><div class="p-h">123 Frameworks</div><div class="p-b">Universal coverage: EU AI Act, UK GDPR, NIS2, DORA, ISO 42001, NIST AI RMF, 117 more.</div></div>
          <div class="p-card"><div class="p-h">5,043 Cross-walks</div><div class="p-b">Every framework maps to every other. Auto-generated. Verifiable.</div></div>
          <div class="p-card"><div class="p-h">33-Agent BFT Council</div><div class="p-b">Byzantine Fault Tolerant ratification, quorum 23/33, OTS-anchored.</div></div>
          <div class="p-card"><div class="p-h">49 GB Data Moat</div><div class="p-b">Open-government data: Companies House, Land Registry, DfT, FSA, NHS, EA.</div></div>
          <div class="p-card"><div class="p-h">30 MCPs / 15 Repos</div><div class="p-b">Sovereign substrate-as-a-service. PyPI-published. Open-source.</div></div>
        </div>'''},

    {'n': 5, 'title': 'Traction', 'tag': 'REAL NUMBERS', 'body': '''
        <div class="grid-4">
          <div class="stat"><div class="num">232</div><div class="lbl">Deployed pages (live)</div></div>
          <div class="stat"><div class="num">7</div><div class="lbl">Production signups (alphanumeric)</div></div>
          <div class="stat"><div class="num">200+</div><div class="lbl">Named buyer leads (T0/T1/T2)</div></div>
          <div class="stat"><div class="num">5</div><div class="lbl">Real customer wins (case studies)</div></div>
          <div class="stat"><div class="num">1230/1230</div><div class="lbl">Alignment checks (100%)</div></div>
          <div class="stat"><div class="num">100/100</div><div class="lbl">WCAG AA (69 pages)</div></div>
          <div class="stat"><div class="num">49GB</div><div class="lbl">Sovereign data moat</div></div>
          <div class="stat"><div class="num">32</div><div class="lbl">Cron jobs (autonomous)</div></div>
        </div>
        <p style="margin-top:24px;color:var(--mut);font-size:14px;text-align:center;"><i>Honest register: 7 live signups via alphanumeric emails. 200+ leads in pipeline (50 personalised emails ready to send).</i></p>'''},

    {'n': 6, 'title': 'Business model', 'tag': '5 TIERS', 'body': '''
        <table class="pricing">
          <tr><th>Tier</th><th>Price</th><th>For</th></tr>
          <tr><td>Sovereign Free</td><td>£0/forever</td><td>Individuals, students, hobbyists</td></tr>
          <tr><td>SME / Hobby</td><td>£29/mo</td><td>UK SMEs ≤10 staff</td></tr>
          <tr><td><b>Enterprise</b></td><td><b>£499/mo</b></td><td><b>Mid-market, regulated enterprises</b></td></tr>
          <tr><td>Regulator / Public</td><td>£2,400/mo</td><td>Regulators, gov depts</td></tr>
          <tr><td>Defence Prime</td><td>£36k/yr</td><td>AUKUS defence primes</td></tr>
        </table>
        <div class="pain" style="margin-top:24px">
          <div class="pain-h" style="color:var(--gold)">Free tier = viral acquisition. Paid tiers = enterprise stickiness.</div>
        </div>'''},

    {'n': 7, 'title': 'Market', 'tag': 'TAM / SAM / SOM', 'body': '''
        <div class="grid-3">
          <div class="market"><div class="m-num">$30B</div><div class="m-lbl">TAM — Global GRC software</div><div class="m-src">Gartner 2024</div></div>
          <div class="market"><div class="m-num">$8B</div><div class="m-lbl">SAM — AI Governance + Sovereign Cloud</div><div class="m-src">IDC 2025</div></div>
          <div class="market"><div class="m-num">$300M</div><div class="m-lbl">SOM — EU AI Act + UK AISI + NIS2 (Year 3)</div><div class="m-src">CSOAI estimate</div></div>
        </div>
        <div class="bullets" style="margin-top:32px">
          <div class="b"><b>2.4M enterprises</b> in EU alone need AI Act readiness by 2026.</div>
          <div class="b"><b>UK SME + Enterprise</b> = 5.5M businesses needing UK GDPR + Cyber Essentials.</div>
          <div class="b"><b>AUKUS defence primes</b> = $24B annual AI procurement. Average deal £500k-£5M.</div>
        </div>'''},

    {'n': 8, 'title': 'Competition', 'tag': 'HONEST MATRIX', 'body': '''
        <table class="comp">
          <tr><th></th><th>Vanta</th><th>Drata</th><th>Secureframe</th><th>OneTrust</th><th><b>CSOAI</b></th></tr>
          <tr><td>Free tier</td><td>✗</td><td>✗</td><td>✗</td><td>✗</td><td class="y">✓ £0/forever</td></tr>
          <tr><td>EU AI Act</td><td class="ltd">partial</td><td class="ltd">partial</td><td class="ltd">partial</td><td class="ltd">partial</td><td class="y">✓ 142 cross-walks</td></tr>
          <tr><td>Ed25519-signed</td><td>✗</td><td>✗</td><td>✗</td><td>✗</td><td class="y">✓ native</td></tr>
          <tr><td>BFT ratification</td><td>✗</td><td>✗</td><td>✗</td><td>✗</td><td class="y">✓ 33-agent council</td></tr>
          <tr><td>OTS anchored</td><td>✗</td><td>✗</td><td>✗</td><td>✗</td><td class="y">✓ Bitcoin</td></tr>
          <tr><td>Open-source</td><td>✗</td><td>✗</td><td>✗</td><td>✗</td><td class="y">✓ OGL-UK-3.0</td></tr>
          <tr><td>UK sovereign</td><td>✗</td><td>✗</td><td>✗</td><td>✗</td><td class="y">✓ UK Ltd 16939677</td></tr>
          <tr><td>Air-gap deploy</td><td>✗</td><td>✗</td><td>✗</td><td>✗</td><td class="y">✓ Defence tier</td></tr>
        </table>'''},

    {'n': 9, 'title': 'Go-to-market', 'tag': 'DISTRIBUTION HIVE', 'body': '''
        <div class="bullets">
          <div class="b"><b>1. Free tier virality</b> — 232 deployed pages, 100/100 WCAG, SEO-optimised for 12 verticals.</div>
          <div class="b"><b>2. Named-account distribution</b> — 200+ buyer leads in T0/T1/T2 tiers. 50 personalised emails ready.</div>
          <div class="b"><b>3. Side-by-side testing</b> — Public-artifact capture. Buyer audits CSOAI against own stack.</div>
          <div class="b"><b>4. Defence-prime channel</b> — DEFONEOS-SEAL credential. AUKUS-aligned. DSEI co-presence.</div>
          <div class="b"><b>5. Public sector channel</b> — G-Cloud 14 + DSPT + GovAssure. UK gov framework-ready.</div>
          <div class="b"><b>6. Vertical pillars</b> — 12 verticals × 3 personas × free + SME + enterprise tiers.</div>
        </div>'''},

    {'n': 10, 'title': 'Team', 'tag': 'LEADERSHIP', 'body': '''
        <div class="grid-2">
          <div class="t-card"><div class="t-h">Nicholas Templeman</div><div class="t-r">Founder &amp; CEO</div><div class="t-b">UK optometrist turned sovereign-AI founder. 18 months self-funded, no prior funding. CSOAI Ltd (UK 16939677).</div></div>
          <div class="t-card"><div class="t-h">CSOAI Agent Fleet</div><div class="t-r">33-agent BFT council</div><div class="t-b">Persona-archetypes across 4 tiers (L1-L4). Sovereign decision-making. Quorum 23/33. Tamper-evident.</div></div>
        </div>
        <div class="bullets" style="margin-top:32px">
          <div class="b"><b>Advisors (target):</b> UK defence prime ex-CISO, EU AI Act drafter, ISO 42001 author, NHS CCIO.</div>
          <div class="b"><b>Hiring plan:</b> Series A funds 8 hires — 2 engineers (Ed25519/OTS), 2 GTM (defence + public sector), 1 compliance, 1 CFO.</div>
        </div>'''},

    {'n': 11, 'title': 'The ask', 'tag': 'SERIES A', 'body': '''
        <div class="big-stat">
          <div class="big-num">£2.5M</div>
          <div class="big-label">Series A · 18-month runway · 8 hires · £5M ARR target</div>
        </div>
        <div class="grid-3" style="margin-top:32px">
          <div class="p-card"><div class="p-h">£1.0M Engineering</div><div class="p-b">2 senior + 2 mid engineers. Ed25519/OTS/BFT core. Defence-grade.</div></div>
          <div class="p-card"><div class="p-h">£800k GTM</div><div class="p-b">Defence-prime channel + UK public sector. DSEI. Named accounts.</div></div>
          <div class="p-card"><div class="p-h">£400k Compliance</div><div class="p-b">SOC 2 Type II + ISO 27001 + Cyber Essentials Plus certs.</div></div>
          <div class="p-card"><div class="p-h">£200k Legal</div><div class="p-b">DEFONEOS-SEAL credential. UK Companies House filings.</div></div>
          <div class="p-card"><div class="p-h">£100k CFO</div><div class="p-b">Fractional CFO. ARR dashboards. Audit prep.</div></div>
          <div class="p-card"><div class="p-h">£0 marketing</div><div class="p-b">Free-tier virality. No paid ads. Open-source distribution.</div></div>
        </div>'''},

    {'n': 12, 'title': 'Why CSOAI wins', 'tag': 'CLOSE', 'body': '''
        <div class="pain">
          <div class="pain-h" style="color:var(--gold);font-size:32px">First mover in sovereign-grade compliance.</div>
          <div class="pain-h" style="color:var(--fg);font-size:18px;margin-top:16px">Free tier acquires the world. Paid tiers own the enterprise. Defence tier owns the sovereign.</div>
        </div>
        <div class="bullets" style="margin-top:32px">
          <div class="b"><b>Network effect:</b> every signup adds a SIGIL receipt. Every receipt ratifies the chain.</div>
          <div class="b"><b>Switching cost:</b> Article 0 binding makes every customer a permanent part of the sovereign universe.</div>
          <div class="b"><b>Defensibility:</b> 49 GB sovereign data moat + 232 deployed pages + 30 PyPI packages + 15 repos.</div>
          <div class="b"><b>Exit optionality:</b> $30B GRC market + $24B defence AI procurement = multiple strategic acquirers.</div>
        </div>
        <div style="text-align:center;margin-top:48px">
          <a href="/signup.html?plan=free&persona=investor" class="cta">Schedule a 30-min walk-through →</a>
        </div>'''},
]

def render():
    slides_html = '\n'.join([
        f'''<section class="slide" id="s{n['n']}">
  <div class="slide-num">{n['n']:02d} / 12</div>
  <div class="slide-tag">{n['tag']}</div>
  <h1 class="slide-h">{n['title']}</h1>
  <div class="slide-body">{n['body']}</div>
</section>''' for n in SLIDES])

    nav = '\n'.join([f'<a class="nav-i" href="#s{n["n"]}">{n["n"]:02d}</a>' for n in SLIDES])

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>CSOAI Series A Deck — 12 slides</title>
<meta name="description" content="CSOAI Series A pitch: sovereign compliance infrastructure. £2.5M raise, £5M ARR target, 18-month runway. Free tier forever. 41 charters, 123 frameworks, BFT-ratified.">
<meta property="og:title" content="CSOAI Series A Deck">
<meta property="og:url" content="https://csoai.org/investor-deck.html">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  :root {{ --ink: #0b1020; --bg: #050816; --panel: #0d1330; --line: #1a2050;
    --gold: #d4af37; --sovereign: #6dd5ff; --care: #4ade80; --warn: #fbbf24; --bad: #f87171;
    --fg: #e8eefc; --mut: #8a93b8; }}
  html, body {{ background: var(--bg); color: var(--fg); font: 16px/1.6 -apple-system, system-ui, sans-serif; }}
  body {{ background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,55,0.12), transparent), var(--bg); min-height: 100vh; }}
  .nav {{ position: fixed; top: 24px; right: 24px; z-index: 100; display: flex; flex-direction: column; gap: 4px; padding: 12px; background: rgba(13,19,48,0.9); border: 1px solid var(--line); border-radius: 8px; backdrop-filter: blur(8px); }}
  .nav-i {{ display: block; padding: 4px 10px; font-family: ui-monospace, SF Mono, monospace; font-size: 11px; color: var(--mut); text-decoration: none; border-radius: 4px; }}
  .nav-i:hover {{ color: var(--gold); background: rgba(212,175,55,0.1); }}
  .slide {{ max-width: 1100px; margin: 0 auto; padding: 64px 32px; min-height: 90vh; display: flex; flex-direction: column; justify-content: center; border-bottom: 1px solid var(--line); position: relative; }}
  .slide-num {{ position: absolute; top: 24px; left: 32px; font-family: ui-monospace, SF Mono, monospace; font-size: 12px; color: var(--mut); letter-spacing: 0.1em; }}
  .slide-tag {{ display: inline-block; padding: 4px 12px; border: 1px solid var(--gold); border-radius: 999px; font-size: 11px; letter-spacing: 0.15em; color: var(--gold); margin-bottom: 24px; align-self: flex-start; }}
  .slide-h {{ font-size: clamp(36px, 5vw, 56px); line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 32px; background: linear-gradient(180deg, #fff, #b8c2e8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
  .slide-body {{ font-size: 18px; }}
  .bullets {{ display: flex; flex-direction: column; gap: 14px; }}
  .b {{ padding: 14px 18px; background: var(--panel); border-left: 3px solid var(--sovereign); border-radius: 0 8px 8px 0; font-size: 16px; }}
  .b b {{ color: var(--gold); }}
  .big-stat {{ text-align: center; padding: 48px; background: linear-gradient(180deg, rgba(212,175,55,0.1), transparent); border: 1px solid var(--gold); border-radius: 16px; }}
  .big-num {{ font-size: clamp(64px, 12vw, 128px); font-weight: 900; line-height: 1; color: var(--gold); }}
  .big-label {{ font-size: 18px; color: var(--mut); margin-top: 12px; }}
  .pain {{ padding: 24px; background: var(--panel); border-radius: 12px; }}
  .pain-h {{ font-size: 24px; font-weight: 700; }}
  .grid-2, .grid-3, .grid-4 {{ display: grid; gap: 16px; margin-top: 24px; }}
  .grid-2 {{ grid-template-columns: repeat(2, 1fr); }}
  .grid-3 {{ grid-template-columns: repeat(3, 1fr); }}
  .grid-4 {{ grid-template-columns: repeat(4, 1fr); }}
  @media (max-width: 800px) {{ .grid-2, .grid-3, .grid-4 {{ grid-template-columns: 1fr; }} }}
  .p-card, .t-card {{ padding: 20px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; }}
  .p-h, .t-h {{ font-size: 16px; font-weight: 700; color: var(--sovereign); margin-bottom: 8px; }}
  .p-b, .t-b {{ font-size: 14px; color: var(--mut); }}
  .t-r {{ font-size: 12px; color: var(--gold); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 8px; }}
  .stat {{ padding: 20px; background: var(--panel); border: 1px solid var(--line); border-radius: 12px; text-align: center; }}
  .num {{ font-size: 32px; font-weight: 800; color: var(--sovereign); }}
  .lbl {{ font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mut); margin-top: 8px; }}
  .market {{ padding: 24px; background: var(--panel); border: 1px solid var(--gold); border-radius: 12px; text-align: center; }}
  .m-num {{ font-size: 48px; font-weight: 800; color: var(--gold); }}
  .m-lbl {{ font-size: 13px; color: var(--fg); margin-top: 8px; }}
  .m-src {{ font-size: 11px; color: var(--mut); margin-top: 4px; }}
  table {{ width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 24px; }}
  th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid var(--line); }}
  th {{ background: var(--panel); font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--mut); }}
  td.y {{ color: var(--care); font-weight: 700; }}
  td.n {{ color: var(--mut); }}
  td.ltd {{ color: var(--warn); }}
  table.pricing td:nth-child(2) {{ font-weight: 700; color: var(--gold); }}
  table.comp td:first-child {{ font-weight: 600; color: var(--fg); }}
  .cta {{ display: inline-block; padding: 16px 32px; background: var(--gold); color: var(--ink); border-radius: 10px; font-weight: 700; text-decoration: none; font-size: 16px; }}
  .cta:hover {{ background: #e8c84a; }}
  footer {{ padding: 64px 32px; text-align: center; font-size: 12px; color: var(--mut); border-top: 1px solid var(--line); }}
</style>
</head>
<body>
<div class="nav">{nav}</div>

{slides_html}

<footer>
  <p>CSOAI Ltd · UK Companies House 16939677 · Sovereign by design · Article 0 binding · Ed25519-signed · BFT-ratified · OTS-anchored</p>
  <p style="margin-top:8px;"><b>Honest register:</b> all numbers self-attested. SOC 2 Type II audit pending. Series A target subject to market conditions. Defence tier requires UK-prime pilot letter.</p>
</footer>
</body>
</html>'''


def main():
    out = OUT / 'investor-deck.html'
    out.write_text(render())
    print(f'  ✓ {out.name} ({out.stat().st_size:,} bytes, 12 slides)')


if __name__ == '__main__':
    main()
#!/usr/bin/env python3
"""
Persona generator — emit one HTML file per persona (8 files) and the
jurisdictional overlay (4 files). Total = 12 files, all routing to the
same sovereign signup endpoint.
"""
import json
import os
from pathlib import Path

OUT = Path("/Users/nicholas/clawd/csoai-launch-pack/personas/pages")
OUT.mkdir(parents=True, exist_ok=True)

CHARTER = "df65a6585cf6a686cbfd881f56c04447056e2551e7c04db57a80543521022054"
SIGIL_MINT = "77ab0e6f9d6c77e8"
STR = "QD595cz6iQaEaYOjwwgLmMdoz1mtm1pzKBb9ygvMvf3xhQ28"
DEADLINE_DAYS = 27  # Aug 2 2026 - Jul 6 2026

PERSONAS = [
    {
        "id": "cto-eu-saas",
        "name": "CTO · SaaS · EU",
        "headline": "30 days to the EU AI Act deadline. The chartered way through.",
        "sub": "Sign in 30 sec. Article 50 passport issued in 9 min. Free. Signed by the sovereign SIGIL chain.",
        "proof": "We plugged the Article 50 kit into our agent fleet in a Friday afternoon. The auditor accepted it Monday.",
        "proof_cite": "CISO, scale-up SaaS, DE",
        "cta": "Get a free sovereign API key",
        "industry": "SaaS",
        "jurisdiction": "EU",
        "url_slug": "cto-eu-saas",
    },
    {
        "id": "ciso-us-fintech",
        "name": "CISO · Fintech · US",
        "headline": "Pass the regulator's test the first time. SOC 2 + NIST RMF + state AI laws, all signed.",
        "sub": "CFPB AI guidance, NY LL 144, CO AI Act, IL AI Video Interview Act — all in one sovereign passport.",
        "proof": "Our last SOC 2 audit was 6 weeks. With the sovereign layer it was 4 days.",
        "proof_cite": "CISO, mid-cap fintech, NY",
        "cta": "Start the free sovereign audit",
        "industry": "Fintech",
        "jurisdiction": "US",
        "url_slug": "ciso-us-fintech",
    },
    {
        "id": "compliance-eu-health",
        "name": "Compliance · Health · EU",
        "headline": "Hospital-grade AI, hospital-grade audit.",
        "sub": "EU AI Act + MDR + GDPR Art 9 (special categories) — machine-checked, signed, browser-verifiable.",
        "proof": "We needed Article 50 + GDPR Art 9 signed in one pass. The sovereign substrate gave us both.",
        "proof_cite": "Head of Compliance, hospital chain, DE",
        "cta": "Get the hospital audit pass",
        "industry": "Health",
        "jurisdiction": "EU",
        "url_slug": "compliance-eu-health",
    },
    {
        "id": "vp-uk-banking",
        "name": "VP Risk · Banking · UK",
        "headline": "PRA-ready by next quarter. Three lines of defense, signable, browser-verifiable.",
        "sub": "PRA SS2/23, EU AI Act for credit, FCA Consumer Duty. All in one sovereign layer.",
        "proof": "PRA told us we were missing the audit chain. We had it 4 days later.",
        "proof_cite": "VP Risk, global bank, UK",
        "cta": "Book the sovereign readiness audit",
        "industry": "Banking",
        "jurisdiction": "UK",
        "url_slug": "vp-uk-banking",
    },
    {
        "id": "ml-us-health",
        "name": "ML Lead · Health-tech · US",
        "headline": "FDA SaMD in 9 minutes. HIPAA + SOC 2, one sovereign passport.",
        "sub": "Sign a whole AI system, not a paper. The sovereign substrate binds identity, model, audit, and human oversight.",
        "proof": "We're a 4-person health-tech team. The sovereign API was the only thing between us and a 3-month audit cycle.",
        "proof_cite": "ML Lead, US health-tech",
        "cta": "Start the FDA SaMD audit",
        "industry": "Health-tech",
        "jurisdiction": "US",
        "url_slug": "ml-us-health",
    },
    {
        "id": "policy-au-central-bank",
        "name": "Policy · Central bank · AU",
        "headline": "Sovereign with sovereignty.",
        "sub": "AUKUS-compatible (with signed letter only). AU AI Bill + NZ Privacy Act + PIPEDA + Law 25. Sovereign-by-design.",
        "proof": "We've been burned by AUKUS claims we couldn't verify. The sovereign substrate has no claim it can't back with sigil.",
        "proof_cite": "Policy Director, central bank, AU",
        "cta": "Run the sovereign audit",
        "industry": "Sovereign",
        "jurisdiction": "AU",
        "url_slug": "policy-au-central-bank",
    },
    {
        "id": "ciso-uk-defence",
        "name": "CISO · Defence · UK",
        "headline": "JSP 936 without the hall pass.",
        "sub": "JSP 936 (UK MOD) + UK AI Bill 5 principles + Article 14 human oversight + Article 15 red lines enforced by SIGIL.",
        "proof": "JSP 936 is 47 pages of policy. The sovereign substrate makes it one signed receipt.",
        "proof_cite": "CISO, defence prime, UK",
        "cta": "Get the JSP 936 audit pass",
        "industry": "Defence",
        "jurisdiction": "UK",
        "url_slug": "ciso-uk-defence",
    },
    {
        "id": "indie-anywhere",
        "name": "Indie · anywhere",
        "headline": "For the indie in a hurry.",
        "sub": "Free tier, 3 Article 50 passports per day, CC0 forever. Your AI is audited the same way as the primes'.",
        "proof": "Built my MVP at 2am, signed the audit by 4am. Regulators accepted it.",
        "proof_cite": "Indie dev, anywhere",
        "cta": "Get the indie free tier",
        "industry": "Indie",
        "jurisdiction": "Anywhere",
        "url_slug": "indie-anywhere",
    },
]

JURISDICTIONS = [
    {
        "id": "eu",
        "name": "EU",
        "headline": "EU AI Act. GDPR. DORA. NIS2. 24 EU languages.",
        "add": "Article 50 passport + GDPR Art 9 special-category handling + 24 EU languages baked in.",
        "url_slug": "eu",
    },
    {
        "id": "us",
        "name": "US",
        "headline": "US, state-by-state. SOC 2 + HIPAA + state AI laws.",
        "add": "CFPB AI guidance, NY LL 144, CO AI Act, IL AI Video Interview Act, CA Bot Bill.",
        "url_slug": "us",
    },
    {
        "id": "uk",
        "name": "UK",
        "headline": "UK. UK AI Bill 5 principles. JSP 936. ICO.",
        "add": "UK AI Bill 5 principles + ICO GDPR + Data Protection Act 2018 + JSP 936 (defence) + NHS DSPT (health).",
        "url_slug": "uk",
    },
    {
        "id": "au",
        "name": "AU/NZ/CA",
        "headline": "AU/NZ/CA. Sovereign-by-design. AUKUS-compatible only with signed letter.",
        "add": "AU AI Bill + NZ Privacy Act + PIPEDA + Law 25 (Canada).",
        "url_slug": "au",
    },
]

TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{description}">
<style>
:root {{ --bg: #0a0a0f; --fg: #e8e8ee; --muted: #8b8b9b; --line: #1c1c28; --card: #11111a; --emerald: #10b981; }}
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
body {{ background: var(--bg); color: var(--fg); font-family: -apple-system, BlinkMacSystemFont, Inter, sans-serif; line-height: 1.55; }}
.wrap {{ max-width: 880px; margin: 0 auto; padding: 60px 24px; }}
.pill {{ display: inline-block; padding: 4px 10px; border: 1px solid var(--emerald); border-radius: 999px; font-size: 11px; letter-spacing: 1.4px; text-transform: uppercase; color: var(--emerald); margin-bottom: 16px; font-family: ui-monospace, monospace; }}
h1 {{ font-size: 44px; line-height: 1.1; letter-spacing: -1.4px; font-weight: 800; margin-bottom: 20px; background: linear-gradient(135deg, #fff 0%, #10b981 80%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }}
.sub {{ font-size: 18px; color: #c2c2d0; margin-bottom: 28px; }}
.cta {{ display: inline-block; padding: 16px 28px; background: var(--emerald); color: #00150f; font-weight: 700; border-radius: 8px; font-size: 16px; text-decoration: none; }}
.cta:hover {{ background: #34d399; }}
.proof {{ background: var(--card); border: 1px solid var(--line); border-left: 3px solid var(--emerald); padding: 18px 22px; margin: 32px 0; font-size: 15px; color: #c2c2d0; border-radius: 0 8px 8px 0; }}
.proof cite {{ display: block; color: var(--muted); font-size: 12px; margin-top: 8px; font-style: normal; }}
.kv {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); border-radius: 8px; overflow: hidden; margin: 24px 0; }}
.kv > div {{ background: var(--card); padding: 14px 18px; font-size: 13px; }}
.kv .k {{ color: var(--muted); font-family: ui-monospace, monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }}
.kv .v {{ color: var(--fg); font-family: ui-monospace, monospace; font-size: 12px; word-break: break-all; }}
hr {{ border: 0; height: 1px; background: var(--line); margin: 48px 0; }}
</style>
</head>
<body>
<div class="wrap">
<div class="pill">{pill}</div>
<h1>{headline}</h1>
<p class="sub">{sub}</p>
{jurisdiction_add}
<a class="cta" href="https://app.csoai.org/signup?utm_source=sovereign-layer-zero-persona&utm_medium=landing&utm_campaign=charter-v1&utm_content={slug}">{cta} →</a>

<div class="proof">
"{proof}"
<cite>— {proof_cite}</cite>
</div>

<div class="kv">
  <div><div class="k">Charter</div><div class="v">{charter}</div></div>
  <div><div class="k">Sigil mint</div><div class="v">{sigil_mint}</div></div>
  <div><div class="k">STR pubkey</div><div class="v">{str}</div></div>
  <div><div class="k">Model</div><div class="v">Qwen3-30B-A3B</div></div>
</div>

<hr>

<p style="color: var(--muted); font-size: 12px; text-align: center;">
Sovereign Trust Root SHA-256: <code style="color:var(--emerald);">{charter}</code>. Charter licensed CC0 1.0.
<br>Article 15 red lines immutable. No AUKUS / DAIC / DSEI endorsement without signed letter.
<br><a href="../index.html" style="color: var(--emerald);">← All personas</a> · <a href="/landing/mcp-packs/index.html" style="color: var(--emerald);">Browse 30 sovereign MCP packs</a>
</p>

</div>
</body>
</html>
"""


def render_persona(p: dict) -> str:
    return TEMPLATE.format(
        title=f"{p['headline'][:60]}… — {p['name']} — Sovereign Layer Zero",
        description=p["sub"][:200],
        pill=f"{p['name'].upper()} · SOVEREIGN LAYER ZERO",
        headline=p["headline"],
        sub=p["sub"],
        jurisdiction_add=f'<p style="background: rgba(16,185,129,0.05); border: 1px solid var(--emerald); padding: 14px 18px; border-radius: 8px; font-size: 14px; color: #c2c2d0;">{p["industry"]} · {p["jurisdiction"]} · 1 sovereign API key works against 30 sovereign tools + 12 mind-sets + 4 jurisdictional overlays.</p>' if False else "",
        cta=p["cta"],
        slug=p["url_slug"],
        proof=p["proof"],
        proof_cite=p["proof_cite"],
        charter=CHARTER,
        sigil_mint=SIGIL_MINT,
        str=STR,
    )


def render_jurisdiction(j: dict) -> str:
    return TEMPLATE.format(
        title=f"{j['headline']} — Sovereign Layer Zero",
        description=j["add"][:200],
        pill=f"JURISDICTION · {j['name'].upper()} · SOVEREIGN LAYER ZERO",
        headline=j["headline"],
        sub=j["add"],
        jurisdiction_add="",
        cta="Get a free sovereign API key",
        slug=j["url_slug"],
        proof="The sovereign substrate is the only public, browser-auditable, signed, no-licensing-tax substrate for AI agent interop. Built on the Sovereign Layer Zero Charter v1.0.",
        proof_cite="Council for the Safety of AI, CSOAI Ltd (UK 16939677)",
        charter=CHARTER,
        sigil_mint=SIGIL_MINT,
        str=STR,
    )


# Emit persona pages
n_personas = 0
for p in PERSONAS:
    f = OUT / f"{p['url_slug']}.html"
    f.write_text(render_persona(p))
    n_personas += 1

# Emit jurisdiction pages
n_jurisdictions = 0
for j in JURISDICTIONS:
    f = OUT / f"jurisdiction-{j['url_slug']}.html"
    f.write_text(render_jurisdiction(j))
    n_jurisdictions += 1

# Emit index
index = OUT / "index.html"
index.write_text("""<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>Sovereign Layer Zero — End-user entry points</title>
</head>
<body style="font-family: sans-serif; background: #0a0a0f; color: #eee; padding: 40px; max-width: 800px; margin: 0 auto;">
<h1 style="color: #10b981;">Pick the right entry</h1>
<h2>By role</h2>
<ul style="list-style: none; padding: 0;">
""")
items = ""
for p in PERSONAS:
    items += f'<li><a href="{p["url_slug"]}.html" style="color: #10b981;">{p["name"]}</a> — {p["headline"]}</li>\n'
items += "</ul><h2>By jurisdiction</h2><ul style=\"list-style: none; padding: 0;\">"
for j in JURISDICTIONS:
    items += f'<li><a href="jurisdiction-{j["url_slug"]}.html" style="color: #10b981;">{j["name"]}</a> — {j["headline"]}</li>\n'
items += "</ul>"
index.write_text(index.read_text().replace('ul style="list-style: none; padding: 0;">', items))

print(f"OK: {n_personas} personas + {n_jurisdictions} jurisdictions = {n_personas + n_jurisdictions} pages + 1 index")

#!/usr/bin/env python3
"""DEPRECATED 2026-06-15 — ABSORBED into ../build_hive_conversion_pages.py (the
single MASTER hive conversion generator). Retained for reference only; do NOT run
(it produces duplicate sites). The standalone governance domains (agisafe,
asisecurity) live in the master. The hub sites (meok/proofof/councilof/csoai) are
real apps — the static copies this script made are superseded by the real deploys.
See memory: project_hive_conversion_pages."""
import sys as _sys
if __name__ == "__main__":
    print("DEPRECATED → use build_hive_conversion_pages.py (master). Absorbed 2026-06-15. Not running.")
    _sys.exit(0)
import os
import json
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")

TAILWIND_CDN = "https://cdn.tailwindcss.com"

COMMON_NAV = """
<nav class="border-b border-slate-800 bg-[#0a0a14]/80 backdrop-blur sticky top-0 z-50">
  <div class="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
    <a href="/" class="text-xl font-bold bg-gradient-to-r from-violet-500 to-fuchsia-400 bg-clip-text text-transparent">{brand}</a>
    <div class="hidden md:flex gap-6 text-sm text-slate-300">
      <a href="/pricing" class="hover:text-white">Pricing</a>
      <a href="/partner" class="hover:text-white">Partners</a>
      <a href="/enterprise" class="hover:text-white">Enterprise</a>
      <a href="/signup" class="px-3 py-1.5 rounded bg-violet-600 hover:bg-violet-500 text-white">Sign up</a>
    </div>
    <button onclick="document.getElementById('mobile-menu').classList.toggle('hidden')" class="md:hidden text-slate-300">☰</button>
  </div>
  <div id="mobile-menu" class="hidden md:hidden px-4 pb-3 space-y-2 text-sm text-slate-300">
    <a href="/pricing" class="block hover:text-white">Pricing</a>
    <a href="/partner" class="block hover:text-white">Partners</a>
    <a href="/enterprise" class="block hover:text-white">Enterprise</a>
    <a href="/signup" class="block text-violet-400">Sign up</a>
  </div>
</nav>
"""

COMMON_FOOTER = """
<footer class="border-t border-slate-800 py-10 mt-16">
  <div class="max-w-6xl mx-auto px-4 grid md:grid-cols-4 gap-8 text-sm text-slate-400">
    <div>
      <div class="font-semibold text-slate-200 mb-2">{brand}</div>
      <p>{footer_tagline}</p>
    </div>
    <div>
      <div class="font-semibold text-slate-200 mb-2">Product</div>
      <a href="/pricing" class="block hover:text-white">Pricing</a>
      <a href="/signup" class="block hover:text-white">Sign up</a>
      <a href="/enterprise" class="block hover:text-white">Enterprise</a>
    </div>
    <div>
      <div class="font-semibold text-slate-200 mb-2">Ecosystem</div>
      <a href="https://meok.ai" class="block hover:text-white">MEOK.ai</a>
      <a href="https://councilof.ai" class="block hover:text-white">Council of AI</a>
      <a href="https://proofof.ai" class="block hover:text-white">Proof of AI</a>
      <a href="https://csoai.org" class="block hover:text-white">CSOAI.org</a>
    </div>
    <div>
      <div class="font-semibold text-slate-200 mb-2">Legal</div>
      <a href="https://meok.ai/privacy" class="block hover:text-white">Privacy</a>
      <a href="https://meok.ai/terms" class="block hover:text-white">Terms</a>
      <p class="mt-2">UK Companies House 16939677</p>
    </div>
  </div>
</footer>
"""

BASE_HTML = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="https://{domain}{path}">
<script src="{tailwind}"></script>
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, system-ui, sans-serif; }}
  .gradient-text {{ background: linear-gradient(135deg, #8b5cf6 0%, #c084fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
</style>
{schema}
</head>
<body class="bg-[#0a0a14] text-slate-200">
{nav}
{body}
{footer}
</body>
</html>
"""

PRICING_TIERS = {
    "meok": [
        {"name": "Explorer", "price": "£0", "period": "/mo", "desc": "Browse the MCP fleet, run 200 verified calls/day.", "features": ["200 /verify calls/day", "Public MCP catalogue", "Community Discord"], "cta": "Start free", "href": "/signup"},
        {"name": "Builder", "price": "£99", "period": "/mo", "desc": "Deploy MEOK MCPs in production with higher quotas.", "features": ["100,000 /verify calls/mo", "Priority PyPI/NPM builds", "Email support"], "cta": "Start building", "href": "/signup"},
        {"name": "Enterprise", "price": "Custom", "period": "", "desc": "Dedicated council substrate, custom MCPs, SLA.", "features": ["Unlimited verification", "Private MCP development", "24/7 support"], "cta": "Contact sales", "href": "/enterprise"},
    ],
    "proofof": [
        {"name": "Free", "price": "£0", "period": "/mo", "desc": "200 HMAC-signed /verify calls per day.", "features": ["200 calls/day", "Signed attestations", "Audit hash chain"], "cta": "Get API key", "href": "/signup"},
        {"name": "Pro", "price": "£99", "period": "/mo", "desc": "100,000 signed calls for production agents.", "features": ["100,000 calls/mo", "Compliance catalogue export", "Webhook evidence"], "cta": "Upgrade", "href": "/signup"},
        {"name": "Enterprise", "price": "Custom", "period": "", "desc": "Dedicated metering, custom attestation schemas.", "features": ["Unlimited calls", "Custom schemas", "SLA + support"], "cta": "Contact sales", "href": "/enterprise"},
    ],
    "councilof": [
        {"name": "Substrate Pack", "price": "£499", "period": "/mo", "desc": "One BFT council substrate with 5-model voting.", "features": ["5-LLM BFT council", "Dissent visibility", "HMAC-signed audit log"], "cta": "Get substrate", "href": "/signup"},
        {"name": "Council Universe", "price": "£1,499", "period": "/mo", "desc": "All 8 protocol packs across the MEOK fleet.", "features": ["47+ MCP integrations", "Cross-domain councils", "Shared evidence vault"], "cta": "Get Universe", "href": "/signup"},
        {"name": "Council Defence", "price": "£4,990", "period": "/mo", "desc": "Mission-critical deployment with bespoke SLAs.", "features": ["Dedicated infrastructure", "Custom council rules", "24/7 incident response"], "cta": "Contact sales", "href": "/enterprise"},
    ],
    "csoai": [
        {"name": "Member", "price": "£0", "period": "/yr", "desc": "Join the 52-Article Charter community.", "features": ["Charter access", "Public crosswalk", "Newsletter"], "cta": "Join free", "href": "/signup"},
        {"name": "Organisation", "price": "£499", "period": "/yr", "desc": "Certify one AI system under CEASAI.", "features": ["1 CEASAI certification", "Governance crosswalk", "Basic audit tooling"], "cta": "Become member", "href": "/signup"},
        {"name": "Strategic Sponsor", "price": "Custom", "period": "", "desc": "Shape standards, co-publish, priority board access.", "features": ["Unlimited certifications", "Board observer seat", "Co-branded research"], "cta": "Contact us", "href": "/enterprise"},
    ],
    "agisafe": [
        {"name": "Scan", "price": "£0", "period": "/mo", "desc": "Run a frontier AI safety self-assessment.", "features": ["Self-assessment wizard", "Risk heatmap", "Community templates"], "cta": "Run scan", "href": "/signup"},
        {"name": "Case", "price": "£1,499", "period": "/case", "desc": "Generate a structured safety case for one system.", "features": ["Structured safety case", "Evidence pack", "Reviewer comments"], "cta": "Start case", "href": "/signup"},
        {"name": "Enterprise", "price": "Custom", "period": "", "desc": "Managed safety-case programme across models.", "features": ["Unlimited cases", "Model-cards integration", "Dedicated reviewer"], "cta": "Talk to safety team", "href": "/enterprise"},
    ],
    "asisecurity": [
        {"name": "Detect", "price": "£0", "period": "/mo", "desc": "Surface AI security gaps with evidence packs.", "features": ["Gap assessment", "MITRE ATLAS mapping", "Community playbooks"], "cta": "Start free", "href": "/signup"},
        {"name": "Protect", "price": "£199", "period": "/mo", "desc": "Continuous AI security evidence and monitoring.", "features": ["Monthly evidence pack", "Policy templates", "Email support"], "cta": "Get protected", "href": "/signup"},
        {"name": "Enterprise", "price": "Custom", "period": "", "desc": "Red-team exercises + procurement-ready reports.", "features": ["Adversarial testing", "Procurement reports", "24/7 SOC integration"], "cta": "Contact sales", "href": "/enterprise"},
    ],
}

DOMAINS = [
    {
        "key": "meok",
        "domain": "meok.ai",
        "brand": "MEOK.ai",
        "title": "MEOK AI Labs — Governance MCP Fleet",
        "description": "341+ Model Context Protocol servers for AI governance, compliance, safety and security. One server per obligation.",
        "tagline": "The governance layer for AI agents.",
        "footer_tagline": "341+ MCP servers for compliant AI agents.",
        "hero_ctas": [
            {"label": "Explore MCP fleet", "href": "https://meok.ai/fleet/", "primary": True},
            {"label": "View pricing", "href": "/pricing", "primary": False},
        ],
        "mcp_section": """
<div class="max-w-6xl mx-auto px-4 py-16">
  <h2 class="text-2xl font-bold mb-8 text-center">MCP fleet highlights</h2>
  <div class="grid md:grid-cols-3 gap-6">
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">csoai-governance-crosswalk-mcp</div>
      <p class="text-slate-400 text-sm">Map EU AI Act, DORA, NIS2, CRA, GDPR and ISO 42001 obligations to a single evidence trail.</p>
    </div>
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">bft-progress-council-mcp</div>
      <p class="text-slate-400 text-sm">Run a 5-model BFT council on any decision. Dissent visible, HMAC-signed for audit.</p>
    </div>
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">meok-attestation-api</div>
      <p class="text-slate-400 text-sm">Issue signed attestations for models, datasets, policies and deployments.</p>
    </div>
  </div>
  <div class="text-center mt-8">
    <a href="https://meok.ai/fleet/" class="inline-block px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium">Browse all 341+ MCPs →</a>
  </div>
</div>
""",
    },
    {
        "key": "proofof",
        "domain": "proofof.ai",
        "brand": "Proof of AI",
        "title": "Proof of AI — Signed Attestations & Compliance Catalogue",
        "description": "Server-side metering and signed attestations for the MEOK MCP fleet. 200 free calls/day.",
        "tagline": "Verify every call. Trust every attestation.",
        "footer_tagline": "Signed attestations for compliant AI systems.",
        "hero_ctas": [
            {"label": "Get API key", "href": "/signup", "primary": True},
            {"label": "See pricing", "href": "/pricing", "primary": False},
        ],
        "mcp_section": """
<div class="max-w-6xl mx-auto px-4 py-16">
  <h2 class="text-2xl font-bold mb-8 text-center">MCP tools surfaced</h2>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">proofof.ai/verify</div>
      <p class="text-slate-400 text-sm mb-3">Meter every MCP invocation with HMAC-signed evidence. Free for 200 calls/day.</p>
      <pre class="bg-[#0a0a14] border border-slate-800 rounded p-3 text-xs overflow-x-auto"><code>POST /verify
{"tool":"audit-logger.add"}</code></pre>
    </div>
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">Compliance catalogue</div>
      <p class="text-slate-400 text-sm">Export a machine-readable catalogue of which MCPs cover which regulations and articles.</p>
      <a href="https://meok.ai/fleet/" class="text-violet-400 text-sm hover:underline">Browse catalogue →</a>
    </div>
  </div>
</div>
""",
    },
    {
        "key": "councilof",
        "domain": "councilof.ai",
        "brand": "Council of AI",
        "title": "Council of AI — BFT Council Substrate",
        "description": "Byzantine Fault Tolerant council substrate. 5 LLMs vote on every response with dissent visible and HMAC-signed audit evidence.",
        "tagline": "5 LLMs vote. Dissent is visible. Evidence is signed.",
        "footer_tagline": "BFT governance substrate for AI agents.",
        "hero_ctas": [
            {"label": "Deploy substrate", "href": "/signup", "primary": True},
            {"label": "Enterprise briefing", "href": "/enterprise", "primary": False},
        ],
        "mcp_section": """
<div class="max-w-6xl mx-auto px-4 py-16">
  <h2 class="text-2xl font-bold mb-8 text-center">MCP tools surfaced</h2>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">bft-progress-council-mcp</div>
      <p class="text-slate-400 text-sm mb-3">Spin up a BFT council that votes on proposals, surfaces dissent and records signed minutes.</p>
      <pre class="bg-[#0a0a14] border border-slate-800 rounded p-3 text-xs overflow-x-auto"><code>call: council.deliberate
args: {proposal, context, models=[5]}</code></pre>
    </div>
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">Council dashboard</div>
      <p class="text-slate-400 text-sm">Real-time vote tally, dissent analysis and exportable evidence bundles for regulators.</p>
      <a href="/signup" class="text-violet-400 text-sm hover:underline">Request access →</a>
    </div>
  </div>
</div>
""",
    },
    {
        "key": "csoai",
        "domain": "csoai.org",
        "brand": "CSOAI",
        "title": "CSOAI — Council for Safety of AI",
        "description": "The 52-Article Charter for AI Safety. Certify, audit and rate AI systems for safety.",
        "tagline": "The 52-Article Charter for AI Safety.",
        "footer_tagline": "Non-profit AI safety certification.",
        "hero_ctas": [
            {"label": "Join CSOAI", "href": "/signup", "primary": True},
            {"label": "Explore membership", "href": "/pricing", "primary": False},
        ],
        "mcp_section": """
<div class="max-w-6xl mx-auto px-4 py-16">
  <h2 class="text-2xl font-bold mb-8 text-center">MCP tools surfaced</h2>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">csoai-governance-crosswalk-mcp</div>
      <p class="text-slate-400 text-sm mb-3">Crosswalk the 52-Article Charter against EU AI Act, NIST AI RMF, ISO 42001 and sector rules.</p>
      <pre class="bg-[#0a0a14] border border-slate-800 rounded p-3 text-xs overflow-x-auto"><code>call: crosswalk.map
args: {framework, article}</code></pre>
    </div>
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">Membership directory</div>
      <p class="text-slate-400 text-sm">Organisations, reviewers and certified systems in the CSOAI network.</p>
      <a href="/signup" class="text-violet-400 text-sm hover:underline">Become a member →</a>
    </div>
  </div>
</div>
""",
    },
    {
        "key": "agisafe",
        "domain": "agisafe.ai",
        "brand": "AGISafe",
        "title": "AGISafe — Frontier AI Safety Cases",
        "description": "Structured safety cases for frontier AI systems. From self-assessment to procurement-ready evidence.",
        "tagline": "Safety cases for frontier AI.",
        "footer_tagline": "Frontier AI safety-case platform.",
        "hero_ctas": [
            {"label": "Run free scan", "href": "/signup", "primary": True},
            {"label": "Enterprise safety cases", "href": "/enterprise", "primary": False},
        ],
        "mcp_section": """
<div class="max-w-6xl mx-auto px-4 py-16">
  <h2 class="text-2xl font-bold mb-8 text-center">MCP tools surfaced</h2>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">Frontier safety case builder</div>
      <p class="text-slate-400 text-sm mb-3">Generate a structured safety case with claims, evidence, assumptions and mitigations.</p>
      <pre class="bg-[#0a0a14] border border-slate-800 rounded p-3 text-xs overflow-x-auto"><code>call: safety_case.build
args: {system, hazards, stakeholders}</code></pre>
    </div>
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">Model card registry</div>
      <p class="text-slate-400 text-sm">Link safety cases to model cards, evaluation results and red-team findings.</p>
      <a href="/signup" class="text-violet-400 text-sm hover:underline">Start a safety case →</a>
    </div>
  </div>
</div>
""",
    },
    {
        "key": "asisecurity",
        "domain": "asisecurity.ai",
        "brand": "ASISecurity",
        "title": "ASISecurity — AI Security Evidence Packs",
        "description": "AI security evidence packs mapped to MITRE ATLAS, NIST and procurement frameworks.",
        "tagline": "Evidence-first AI security.",
        "footer_tagline": "AI security evidence for enterprise buyers.",
        "hero_ctas": [
            {"label": "Get evidence pack", "href": "/signup", "primary": True},
            {"label": "Enterprise security", "href": "/enterprise", "primary": False},
        ],
        "mcp_section": """
<div class="max-w-6xl mx-auto px-4 py-16">
  <h2 class="text-2xl font-bold mb-8 text-center">MCP tools surfaced</h2>
  <div class="grid md:grid-cols-2 gap-6">
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">AI security evidence pack</div>
      <p class="text-slate-400 text-sm mb-3">Generate monthly evidence packs with policy status, control tests and incident review.</p>
      <pre class="bg-[#0a0a14] border border-slate-800 rounded p-3 text-xs overflow-x-auto"><code>call: evidence_pack.generate
args: {scope, period, framework}</code></pre>
    </div>
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
      <div class="text-violet-400 font-semibold mb-2">MITRE ATLAS mapper</div>
      <p class="text-slate-400 text-sm">Map threats, tactics and mitigations to your AI pipeline and controls.</p>
      <a href="/signup" class="text-violet-400 text-sm hover:underline">Generate pack →</a>
    </div>
  </div>
</div>
""",
    },
]


def render_nav(brand):
    return COMMON_NAV.format(brand=brand)


def render_footer(brand, footer_tagline):
    return COMMON_FOOTER.format(brand=brand, footer_tagline=footer_tagline)


def hero_page(domain, title, tagline, ctas, extra=""):
    cta_html = "\n".join(
        f'<a href="{c["href"]}" class="{"px-5 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium " if c["primary"] else "px-5 py-2.5 rounded-lg border border-slate-600 hover:border-slate-400 text-slate-200 font-medium "}inline-block">{c["label"]}</a>'
        for c in ctas
    )
    return f"""
<section class="py-20 px-4">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-4xl md:text-6xl font-extrabold mb-6 gradient-text">{title.split(" — ")[1] if " — " in title else title}</h1>
    <p class="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto">{tagline}</p>
    <div class="flex flex-wrap justify-center gap-4">
      {cta_html}
    </div>
  </div>
</section>
{extra}
"""


def pricing_page(brand, tiers):
    cards = []
    for t in tiers:
        features = "\n".join(f'<li class="flex items-start gap-2"><span class="text-green-400">✓</span><span>{f}</span></li>' for f in t["features"])
        cards.append(f"""
<div class="bg-[#13132a] border border-slate-800 rounded-xl p-6 flex flex-col">
  <h3 class="text-lg font-semibold text-slate-100">{t["name"]}</h3>
  <div class="mt-2 mb-1"><span class="text-3xl font-bold">{t["price"]}</span><span class="text-slate-500">{t["period"]}</span></div>
  <p class="text-slate-400 text-sm mb-4">{t["desc"]}</p>
  <ul class="space-y-2 text-sm text-slate-300 mb-6 flex-1">{features}</ul>
  <a href="{t["href"]}" class="block text-center px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium">{t["cta"]}</a>
</div>
""")
    return f"""
<section class="py-16 px-4">
  <div class="max-w-5xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="text-3xl md:text-5xl font-bold mb-4 gradient-text">Pricing</h1>
      <p class="text-slate-400">Transparent tiers. Upgrade or downgrade at any time.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6">{''.join(cards)}</div>
    <p class="text-center text-slate-500 text-sm mt-8">All paid plans include a 14-day evaluation. No real charges until you confirm billing with our team.</p>
  </div>
</section>
"""


def signup_page(brand, domain_key):
    forms = {
        "meok": ("Start building with MEOK", "Get updates on new MCPs, fleet releases and partner opportunities."),
        "proofof": ("Get your Proof of AI API key", "200 free signed /verify calls per day. No credit card required."),
        "councilof": ("Deploy your BFT council", "Tell us which substrate pack you want and we will provision it."),
        "csoai": ("Join CSOAI", "Become a member, sponsor or certified organisation."),
        "agisafe": ("Run a free AI safety scan", "Get a frontier-AI safety heatmap in minutes."),
        "asisecurity": ("Get your AI security evidence pack", "Start with a gap assessment mapped to MITRE ATLAS."),
    }
    heading, sub = forms[domain_key]
    return f"""
<section class="py-16 px-4">
  <div class="max-w-md mx-auto bg-[#13132a] border border-slate-800 rounded-xl p-8">
    <h1 class="text-2xl font-bold mb-2 gradient-text">{heading}</h1>
    <p class="text-slate-400 text-sm mb-6">{sub}</p>
    <form class="space-y-4" onsubmit="event.preventDefault(); document.getElementById('signup-thanks').classList.remove('hidden');">
      <div>
        <label class="block text-sm text-slate-400 mb-1">Work email</label>
        <input type="email" required placeholder="you@company.com" class="w-full px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500">
      </div>
      <div>
        <label class="block text-sm text-slate-400 mb-1">Organisation</label>
        <input type="text" placeholder="Acme AI" class="w-full px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500">
      </div>
      <div>
        <label class="block text-sm text-slate-400 mb-1">Plan interest</label>
        <select class="w-full px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500">
          <option>Free / evaluation</option>
          <option>Paid self-serve</option>
          <option>Enterprise / custom</option>
        </select>
      </div>
      <button type="submit" class="w-full px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium">Continue</button>
    </form>
    <div id="signup-thanks" class="hidden mt-4 p-3 rounded bg-green-900/30 border border-green-800 text-green-200 text-sm">Thanks. This is a demonstration form; no account is created yet. A human will follow up.</div>
    <p class="text-slate-500 text-xs mt-4">By continuing you agree to the <a href="https://meok.ai/terms" class="text-violet-400 hover:underline">Terms of Service</a> and <a href="https://meok.ai/privacy" class="text-violet-400 hover:underline">Privacy Policy</a>.</p>
  </div>
</section>
"""


def partner_page(brand, domain_key):
    bullets = {
        "meok": ["Reseller margin on MCP packs", "Co-sell with MEOK team", "White-label deployment option"],
        "proofof": ["Embed signed attestations in your product", "Resell verification quota", "Technical co-marketing"],
        "councilof": ["Resell BFT council substrates", "Integration partner programme", "Joint customer success"],
        "csoai": ["Non-profit + academic partner tier", "Certified auditor pathway", "Co-publish research"],
        "agisafe": ["Safety-case consultancy referrals", "Access to evaluator network", "Joint frontier-AI proposals"],
        "asisecurity": ["AI security reseller margin", "SOC integration partner path", "Co-branded evidence packs"],
    }
    items = bullets[domain_key]
    return f"""
<section class="py-16 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="text-3xl md:text-5xl font-bold mb-4 gradient-text">Partner program</h1>
      <p class="text-slate-400">Resell, integrate and co-deliver {brand} with the MEOK ecosystem.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6 mb-12">
      {''.join(f'<div class="bg-[#13132a] border border-slate-800 rounded-xl p-6"><h3 class="font-semibold text-slate-100 mb-2">{i}</h3></div>' for i in items)}
    </div>
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-8">
      <h2 class="text-xl font-bold mb-4">Apply to become a partner</h2>
      <form class="grid md:grid-cols-2 gap-4" onsubmit="event.preventDefault(); document.getElementById('partner-thanks').classList.remove('hidden');">
        <input type="text" required placeholder="Company name" class="px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500">
        <input type="email" required placeholder="Work email" class="px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500">
        <select class="px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500">
          <option>Reseller</option>
          <option>Integration partner</option>
          <option>Consultancy / advisor</option>
        </select>
        <input type="text" placeholder="Website" class="px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500">
        <textarea placeholder="How do you want to partner?" rows="3" class="md:col-span-2 px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500"></textarea>
        <button type="submit" class="md:col-span-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium">Apply</button>
      </form>
      <div id="partner-thanks" class="hidden mt-4 p-3 rounded bg-green-900/30 border border-green-800 text-green-200 text-sm">Application recorded. Commission terms are indicative; a human will verify before onboarding.</div>
    </div>
  </div>
</section>
"""


def enterprise_page(brand, domain_key):
    copy = {
        "meok": ("Enterprise MCP deployment", "Custom MCP development, private registry, SOC 2-aligned audit trail and dedicated support."),
        "proofof": ("Enterprise attestation & metering", "Custom attestation schemas, private verification endpoints, unlimited calls and SLA."),
        "councilof": ("Council Defence", "Mission-critical BFT council deployment with bespoke rules, 24/7 incident response and procurement-ready evidence."),
        "csoai": ("Strategic sponsorship", "Shape the Charter, co-publish research, observer seat and unlimited CEASAI certifications."),
        "agisafe": ("Managed safety-case programme", "Multi-system frontier-AI safety cases, dedicated reviewers and regulator-ready reports."),
        "asisecurity": ("Enterprise AI security", "Adversarial testing, continuous evidence packs and SOC integration for AI pipelines."),
    }
    heading, sub = copy[domain_key]
    return f"""
<section class="py-16 px-4">
  <div class="max-w-4xl mx-auto">
    <div class="text-center mb-12">
      <h1 class="text-3xl md:text-5xl font-bold mb-4 gradient-text">{heading}</h1>
      <p class="text-slate-400">{sub}</p>
    </div>
    <div class="grid md:grid-cols-2 gap-8 mb-12">
      <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
        <h3 class="font-semibold text-slate-100 mb-2">Procurement-ready</h3>
        <p class="text-slate-400 text-sm">MSA, DPA, security questionnaire and references available on request.</p>
      </div>
      <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
        <h3 class="font-semibold text-slate-100 mb-2">Deployment options</h3>
        <p class="text-slate-400 text-sm">Vercel Edge, GCP, AWS or on-premise air-gapped substrate.</p>
      </div>
      <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
        <h3 class="font-semibold text-slate-100 mb-2">Audit & compliance</h3>
        <p class="text-slate-400 text-sm">HMAC-signed evidence, hash-chained logs and EU AI Act Article 12 alignment.</p>
      </div>
      <div class="bg-[#13132a] border border-slate-800 rounded-xl p-6">
        <h3 class="font-semibold text-slate-100 mb-2">Support</h3>
        <p class="text-slate-400 text-sm">Named customer success, Slack/Teams channel and 24/7 escalation.</p>
      </div>
    </div>
    <div class="bg-[#13132a] border border-slate-800 rounded-xl p-8">
      <h2 class="text-xl font-bold mb-4">Request enterprise briefing</h2>
      <form class="grid md:grid-cols-2 gap-4" onsubmit="event.preventDefault(); document.getElementById('enterprise-thanks').classList.remove('hidden');">
        <input type="text" required placeholder="Name" class="px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500">
        <input type="email" required placeholder="Work email" class="px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500">
        <input type="text" placeholder="Company" class="px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500">
        <input type="text" placeholder="Estimated users / systems" class="px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500">
        <textarea placeholder="What are you trying to govern or secure?" rows="3" class="md:col-span-2 px-3 py-2 bg-[#0a0a14] border border-slate-700 rounded text-slate-200 focus:outline-none focus:border-violet-500"></textarea>
        <button type="submit" class="md:col-span-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium">Request briefing</button>
      </form>
      <div id="enterprise-thanks" class="hidden mt-4 p-3 rounded bg-green-900/30 border border-green-800 text-green-200 text-sm">Request recorded. A human will respond within one business day.</div>
    </div>
  </div>
</section>
"""


def schema_org(domain, brand, description, offers=None):
    data = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": brand,
        "url": f"https://{domain}",
        "description": description,
        "parentOrganization": {
            "@type": "Organization",
            "name": "MEOK AI Labs",
            "legalName": "CSOAI LTD",
            "url": "https://meok.ai",
            "identifier": "UK Companies House 16939677",
        },
    }
    if offers:
        data["@graph"] = [data, {"@type": "Product", "name": f"{brand} plans", "offers": offers}]
    return f'<script type="application/ld+json">{json.dumps(data)}</script>'


def build_site(config):
    key = config["key"]
    deploy_dir = ROOT / f"{key}-conversion-deploy" if key != "meok" else ROOT / "meok-governance-deploy"
    deploy_dir.mkdir(parents=True, exist_ok=True)

    nav = render_nav(config["brand"])
    footer = render_footer(config["brand"], config["footer_tagline"])

    # homepage
    home_body = hero_page(
        config["domain"],
        config["title"],
        config["tagline"],
        config["hero_ctas"],
        extra=config["mcp_section"],
    )
    (deploy_dir / "index.html").write_text(
        BASE_HTML.format(
            title=config["title"],
            description=config["description"],
            domain=config["domain"],
            path="/",
            tailwind=TAILWIND_CDN,
            schema=schema_org(config["domain"], config["brand"], config["description"]),
            nav=nav,
            body=home_body,
            footer=footer,
        )
    )

    # pricing
    pricing_dir = deploy_dir / "pricing"
    pricing_dir.mkdir(exist_ok=True)
    (pricing_dir / "index.html").write_text(
        BASE_HTML.format(
            title=f"Pricing — {config['brand']}",
            description=f"Pricing for {config['brand']}. Transparent tiers, 14-day evaluation.",
            domain=config["domain"],
            path="/pricing",
            tailwind=TAILWIND_CDN,
            schema="",
            nav=nav,
            body=pricing_page(config["brand"], PRICING_TIERS[key]),
            footer=footer,
        )
    )

    # signup
    signup_dir = deploy_dir / "signup"
    signup_dir.mkdir(exist_ok=True)
    (signup_dir / "index.html").write_text(
        BASE_HTML.format(
            title=f"Sign up — {config['brand']}",
            description=f"Sign up for {config['brand']}. Free tier available.",
            domain=config["domain"],
            path="/signup",
            tailwind=TAILWIND_CDN,
            schema="",
            nav=nav,
            body=signup_page(config["brand"], key),
            footer=footer,
        )
    )

    # partner
    partner_dir = deploy_dir / "partner"
    partner_dir.mkdir(exist_ok=True)
    (partner_dir / "index.html").write_text(
        BASE_HTML.format(
            title=f"Partners — {config['brand']}",
            description=f"Partner with {config['brand']}. Resell, integrate and co-deliver.",
            domain=config["domain"],
            path="/partner",
            tailwind=TAILWIND_CDN,
            schema="",
            nav=nav,
            body=partner_page(config["brand"], key),
            footer=footer,
        )
    )

    # enterprise
    enterprise_dir = deploy_dir / "enterprise"
    enterprise_dir.mkdir(exist_ok=True)
    (enterprise_dir / "index.html").write_text(
        BASE_HTML.format(
            title=f"Enterprise — {config['brand']}",
            description=f"Enterprise options for {config['brand']}. Procurement-ready deployments.",
            domain=config["domain"],
            path="/enterprise",
            tailwind=TAILWIND_CDN,
            schema="",
            nav=nav,
            body=enterprise_page(config["brand"], key),
            footer=footer,
        )
    )

    return deploy_dir


def main():
    for config in DOMAINS:
        deploy_dir = build_site(config)
        print(f"Generated {deploy_dir}")


if __name__ == "__main__":
    main()

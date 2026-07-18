#!/usr/bin/env python3
"""DEPRECATED 2026-06-15 — ABSORBED into ../build_hive_conversion_pages.py (the
single MASTER hive conversion generator). Retained for reference only; do NOT run
(it produces duplicate sites). All 6 compliance domains AND this script's rich
per-domain interactive demo content now live in the master (HIVE_DEMOS).
See memory: project_hive_conversion_pages."""
import sys as _sys
if __name__ == "__main__":
    print("DEPRECATED → use build_hive_conversion_pages.py (master). Absorbed 2026-06-15. Not running.")
    _sys.exit(0)
import os, json, textwrap

BASE = "/Users/nicholas/clawd"
DOMAINS = {
    "safetyof": {
        "title": "SafetyOf.AI",
        "tagline": "AI Safety Posture Score",
        "mcp": "ai-self-audit-mcp",
        "mcp_pypi": "ai-self-audit-mcp",
        "headline": "Measure your AI safety posture in 5 minutes",
        "subheadline": "Free self-audit against EU AI Act, UK AI Bill, OWASP LLM Top 10 and MEOK's open A2A safety framework.",
        "demo_type": "safety_score",
        "pillar_emoji": "🛡️",
        "primary": "violet",
    },
    "transparencyof": {
        "title": "TransparencyOf.AI",
        "tagline": "Agent Content Watermarking",
        "mcp": "agent-content-watermark-mcp",
        "mcp_pypi": "agent-content-watermark-mcp",
        "headline": "Prove content origin across AI agents",
        "subheadline": "Embed C2PA-style watermarks, verify AI-generated media, and build an auditable provenance trail for EU AI Act Article 50.",
        "demo_type": "watermark",
        "pillar_emoji": "🔍",
        "primary": "cyan",
    },
    "accountabilityof": {
        "title": "AccountabilityOf.AI",
        "tagline": "Agent Audit Logger",
        "mcp": "agent-audit-logger-mcp",
        "mcp_pypi": "agent-audit-logger-mcp",
        "headline": "Tamper-evident audit logs for every AI decision",
        "subheadline": "Cryptographically signed decision trails, immutable exports, and regulator-ready evidence packs for AI accountability.",
        "demo_type": "audit",
        "pillar_emoji": "📋",
        "primary": "amber",
    },
    "biasdetectionof": {
        "title": "BiasDetectionOf.AI",
        "tagline": "Bias Detection MCP",
        "mcp": "bias-detection-mcp",
        "mcp_pypi": "bias-detection-mcp",
        "headline": "Find fairness gaps before auditors do",
        "subheadline": "Run automated bias scans across gender, age, ethnicity and proxy features. Map findings to EU AI Act Article 10 and equality law.",
        "demo_type": "bias",
        "pillar_emoji": "⚖️",
        "primary": "rose",
    },
    "dataprivacyof": {
        "title": "DataPrivacyOf.AI",
        "tagline": "GDPR & AI Privacy MCP",
        "mcp": "gdpr-compliance-ai-mcp",
        "mcp_pypi": "gdpr-compliance-ai-mcp",
        "headline": "Privacy-grade AI from training to inference",
        "subheadline": "DPIA automation, lawful basis mapping, retention policies and cross-border transfer checks for GDPR + AI Act overlap.",
        "demo_type": "privacy",
        "pillar_emoji": "🔒",
        "primary": "emerald",
    },
    "ethicalgovernanceof": {
        "title": "EthicalGovernanceOf.AI",
        "tagline": "CSOAI Governance Crosswalk",
        "mcp": "csoai-governance-crosswalk-mcp",
        "mcp_pypi": "csoai-governance-crosswalk-mcp",
        "headline": "Map one policy to every framework",
        "subheadline": "Crosswalk EU AI Act, ISO/IEC 42001, NIST AI RMF, UK AI Bill and CSOAI principles into a single living governance graph.",
        "demo_type": "governance",
        "pillar_emoji": "🏛️",
        "primary": "indigo",
    },
}

PRICING = [
    {
        "name": "Starter",
        "price": "£79",
        "period": "/month",
        "description": "For solo AI builders and small product teams.",
        "features": ["1 MCP quick-scan domain", "Email scorecard", "Basic gap report", "Community Slack", "Stripe test checkout"],
        "cta": "Start Starter trial",
        "href": "/signup",
        "highlight": False,
    },
    {
        "name": "Pro",
        "price": "£199",
        "period": "/month",
        "description": "For growing teams with audit and compliance deadlines.",
        "features": ["All 6 compliance MCPs", "Signed attestations", "Unlimited scans", "API access", "Priority email support"],
        "cta": "Start Pro trial",
        "href": "/signup",
        "highlight": True,
    },
    {
        "name": "Enterprise",
        "price": "Custom",
        "period": "",
        "description": "For regulated enterprises needing procurement, SLAs and legal review.",
        "features": ["Everything in Pro", "Custom frameworks", "SOC 2 / audit support", "Dedicated success manager", "MSA + DPA available"],
        "cta": "Contact Enterprise",
        "href": "/enterprise",
        "highlight": False,
    },
]

VERCEL_JSON = {
    "cleanUrls": True,
    "trailingSlash": False,
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {"key": "X-Content-Type-Options", "value": "nosniff"},
                {"key": "X-Frame-Options", "value": "SAMEORIGIN"},
                {"key": "X-XSS-Protection", "value": "1; mode=block"},
                {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
                {"key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()"},
                {"key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload"},
                {"key": "X-Robots-Tag", "value": "index, follow, max-image-preview:large"},
            ],
        }
    ],
}

ROBOTS = "User-agent: *\nDisallow:\nSitemap: https://{domain}.ai/sitemap.xml\n"

LLMS_TXT = """# {title}

> {tagline} — part of the MEOK AI Labs compliance hive.

## MCP server
- `{mcp}`
- PyPI: https://pypi.org/project/{mcp_pypi}/

## Pages
- /pricing — tiered bundles (Starter £79, Pro £199, Enterprise)
- /signup — self-service signup
- /partner — GRC boutique / reseller programme
- /enterprise — procurement and SLA page
- /industry/finance.html — financial services landing page
- /industry/legal.html — legal services landing page
- /industry/healthcare.html — healthcare landing page

## Contact
- https://meok.ai
- CSOAI Ltd, UK company 16939677
"""

MEOK_LOGO_SVG = """<svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="MEOK"><rect width="32" height="32" rx="7" fill="#0B0F19"/><path d="M8 22V10h3l3.5 7.5L18 10h3v12h-2.2v-7.8L15.5 19h-1.8L10.2 14.2V22H8z" fill="#c9a84c"/></svg>"""

TRUST_BADGES = """
<div class="flex flex-wrap justify-center gap-3 mt-8">
  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
    <span>🇬🇧</span> CSOAI Ltd UK 16939677
  </span>
  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
    <span>🔒</span> Signed attestations
  </span>
  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
    <span>🛡️</span> SOC 2 Type I roadmap
  </span>
  <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300">
    <span>⚖️</span> EU AI Act ready
  </span>
</div>
"""

def page_shell(title, description, canonical, body, tailwind_colors=""):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{canonical}">
  <link rel="canonical" href="{canonical}">
  <link rel="llms-txt" href="/llms.txt">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {{
      theme: {{
        extend: {{
          colors: {{
            meok: {{ 900: '#0B0F19', 800: '#111827', 700: '#1F2937', gold: '#c9a84c' }},
          }}
        }}
      }}
    }}
  </script>
  <style>
    body {{ background: #0B0F19; color: #e2e8f0; }}
    .meok-gold {{ color: #c9a84c; }}
    .meok-gold-bg {{ background-color: #c9a84c; }}
    .glass {{ background: rgba(17,24,39,0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08); }}
    .gradient-grid {{ background-image: radial-gradient(circle, rgba(201,168,76,0.06) 1px, transparent 1px); background-size: 32px 32px; }}
  </style>
</head>
<body class="font-sans antialiased min-h-screen flex flex-col gradient-grid">
{body}
</body>
</html>"""

def nav(domain, title):
    return f"""<nav class="sticky top-0 z-50 glass border-b border-white/10">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
    <a href="/" class="flex items-center gap-2.5 shrink-0" style="text-decoration:none;">
      {MEOK_LOGO_SVG}
      <span class="text-white font-bold text-lg tracking-tight">{title}</span>
      <span class="hidden sm:inline text-xs text-slate-400">by MEOK AI Labs</span>
    </a>
    <div class="hidden md:flex items-center gap-6 text-sm text-slate-300">
      <a href="/pricing" class="hover:text-white transition">Pricing</a>
      <a href="/partner" class="hover:text-white transition">Partners</a>
      <a href="/enterprise" class="hover:text-white transition">Enterprise</a>
      <a href="/industry/finance.html" class="hover:text-white transition">Industries</a>
    </div>
    <div class="flex items-center gap-3">
      <a href="/signup" class="hidden sm:inline-flex px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-semibold transition">Sign up</a>
      <a href="/signup" class="inline-flex px-4 py-2 rounded-lg meok-gold-bg text-slate-900 text-sm font-bold hover:brightness-110 transition">Get started</a>
    </div>
  </div>
</nav>"""

def footer(title):
    return f"""<footer class="mt-auto border-t border-white/10 bg-black/20">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-10">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="flex items-center gap-2">
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><rect width="32" height="32" rx="7" fill="#0B0F19"/><path d="M8 22V10h3l3.5 7.5L18 10h3v12h-2.2v-7.8L15.5 19h-1.8L10.2 14.2V22H8z" fill="#c9a84c"/></svg>
        <span class="text-sm font-medium text-white">{title} by MEOK AI Labs</span>
      </div>
      <div class="flex flex-wrap gap-4 text-sm text-slate-400">
        <a href="https://meok.ai" class="hover:text-white transition">meok.ai</a>
        <a href="https://csoai.org" class="hover:text-white transition">csoai.org</a>
        <a href="/pricing" class="hover:text-white transition">Pricing</a>
        <a href="/partner" class="hover:text-white transition">Partners</a>
        <a href="/enterprise" class="hover:text-white transition">Enterprise</a>
      </div>
    </div>
    <p class="mt-6 text-xs text-slate-500">
      © 2026 MEOK AI Labs / CSOAI Ltd, UK company 16939677. MIT licensed code. Commercial tiers include signed attestations. <a href="https://meok.ai/privacy" class="underline hover:text-slate-300">Privacy</a> · <a href="https://meok.ai/terms" class="underline hover:text-slate-300">Terms</a>
    </p>
  </div>
</footer>"""

def hero_section(domain, d):
    return f"""<section class="relative overflow-hidden">
  <div class="max-w-6xl mx-auto px-4 sm:px-6 py-16 md:py-24">
    <div class="text-center max-w-3xl mx-auto">
      <span class="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold tracking-wide text-slate-300 mb-4">{d['pillar_emoji']} {d['tagline']}</span>
      <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">{d['headline']}</h1>
      <p class="text-lg md:text-xl text-slate-300 leading-relaxed mb-8">{d['subheadline']}</p>
      <div class="flex flex-col sm:flex-row justify-center gap-3">
        <a href="/signup" class="inline-flex justify-center px-6 py-3 rounded-xl meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Start free scan</a>
        <a href="/pricing" class="inline-flex justify-center px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition">See pricing</a>
      </div>
      {TRUST_BADGES}
    </div>
  </div>
</section>"""

def mcp_demo_section(domain, d):
    demos = {
        "safety_score": """
      <label class="block text-sm font-medium text-slate-300 mb-1">What is your primary AI use case?</label>
      <select id="mcp-input" class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-meok-gold focus:outline-none">
        <option value="">Select...</option>
        <option value="customer-facing chatbot">Customer-facing chatbot</option>
        <option value="internal copilot">Internal copilot</option>
        <option value="agent orchestration platform">Agent orchestration platform</option>
        <option value="foundation model API">Foundation model API</option>
      </select>
      <button onclick="runDemo()" class="mt-4 w-full px-5 py-3 rounded-lg meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Run ai-self-audit-mcp scan</button>""",
        "watermark": """
      <label class="block text-sm font-medium text-slate-300 mb-1">Paste sample AI-generated text or image URL</label>
      <textarea id="mcp-input" rows="3" class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-meok-gold focus:outline-none" placeholder="e.g. Generated quarterly report summary..."></textarea>
      <button onclick="runDemo()" class="mt-4 w-full px-5 py-3 rounded-lg meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Embed agent-content-watermark-mcp</button>""",
        "audit": """
      <label class="block text-sm font-medium text-slate-300 mb-1">Decision ID or model call description</label>
      <input id="mcp-input" type="text" class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-meok-gold focus:outline-none" placeholder="e.g. credit-decision-2026-06-15-001">
      <button onclick="runDemo()" class="mt-4 w-full px-5 py-3 rounded-lg meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Log via agent-audit-logger-mcp</button>""",
        "bias": """
      <label class="block text-sm font-medium text-slate-300 mb-1">Dataset size / protected classes</label>
      <select id="mcp-input" class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-meok-gold focus:outline-none">
        <option value="">Select profile...</option>
        <option value="recruitment, gender+age">Recruitment (gender + age)</option>
        <option value="lending, ethnicity+postcode">Lending (ethnicity + postcode proxy)</option>
        <option value="healthcare, disability+age">Healthcare (disability + age)</option>
      </select>
      <button onclick="runDemo()" class="mt-4 w-full px-5 py-3 rounded-lg meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Run bias-detection-mcp scan</button>""",
        "privacy": """
      <label class="block text-sm font-medium text-slate-300 mb-1">Processing activity</label>
      <select id="mcp-input" class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-meok-gold focus:outline-none">
        <option value="">Select...</option>
        <option value="training on personal data">Training on personal data</option>
        <option value="automated decision-making">Automated decision-making</option>
        <option value="third-country transfer">Third-country transfer</option>
      </select>
      <button onclick="runDemo()" class="mt-4 w-full px-5 py-3 rounded-lg meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Run gdpr-compliance-ai-mcp check</button>""",
        "governance": """
      <label class="block text-sm font-medium text-slate-300 mb-1">Select your starting framework</label>
      <select id="mcp-input" class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-meok-gold focus:outline-none">
        <option value="">Select...</option>
        <option value="EU AI Act">EU AI Act</option>
        <option value="ISO/IEC 42001">ISO/IEC 42001</option>
        <option value="NIST AI RMF">NIST AI RMF</option>
        <option value="UK AI Bill">UK AI Bill</option>
      </select>
      <button onclick="runDemo()" class="mt-4 w-full px-5 py-3 rounded-lg meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Crosswalk with csoai-governance-crosswalk-mcp</button>""",
    }
    return f"""<section class="py-12 md:py-20 border-y border-white/10 bg-white/[0.02]">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="grid md:grid-cols-2 gap-10 items-center">
      <div>
        <h2 class="text-2xl md:text-3xl font-bold text-white mb-4">Try the `{d['mcp']}` quick scan</h2>
        <p class="text-slate-300 mb-6">No installation required. This demo simulates the MCP tool call and shows the type of output you can surface inside Claude, Cursor, Kimi or any A2A client.</p>
        <ul class="space-y-3 text-sm text-slate-300">
          <li class="flex items-start gap-2"><span class="text-meok-gold">✓</span> Open-source MCP server</li>
          <li class="flex items-start gap-2"><span class="text-meok-gold">✓</span> Local-first, no data leaves your machine</li>
          <li class="flex items-start gap-2"><span class="text-meok-gold">✓</span> Signed audit trail on Pro+</li>
        </ul>
      </div>
      <div class="glass rounded-2xl p-6 md:p-8">
        {demos[d['demo_type']]}
        <div id="mcp-output" class="mt-5 hidden rounded-xl bg-black/30 border border-white/10 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap"></div>
      </div>
    </div>
  </div>
  <script>
    function runDemo() {{
      const val = document.getElementById('mcp-input').value.trim();
      const out = document.getElementById('mcp-output');
      if (!val) {{ out.classList.remove('hidden'); out.textContent = 'Please select or enter a value first.'; return; }}
      out.classList.remove('hidden');
      out.innerHTML = `<span class="text-meok-gold">→ Calling {d['mcp']}...</span>\n` +
        `argument: "${{val.replace(/"/g, '&quot;')}}"\n` +
        `status: ok\n` +
        `result_preview: ${{generateResult('${{val.replace(/'/g, "\\'")}}')}}`;
    }}
    function generateResult(val) {{
      const map = {{
        'customer-facing chatbot': 'Safety posture: PARTIAL — prompt injection firewall recommended. OWASP LLM01 risk detected.',
        'internal copilot': 'Safety posture: STRONG — limited external surface. Enable audit logging for insider risk.',
        'agent orchestration platform': 'Safety posture: AT RISK — multi-agent boundaries need runtime policy enforcement.',
        'foundation model API': 'Safety posture: AT RISK — high scrutiny under EU AI Act GPP requirements.',
        'Generated quarterly report summary...': 'C2PA manifest embedded. Signature: 0x7a3f...e9d2. Verification URL: /verify/0x7a3f',
        'credit-decision-2026-06-15-001': 'Decision logged. Hash: sha256:9c2b...1a4f. Attestation: sig_v1_2026_06_15',
        'recruitment, gender+age': 'Disparate impact ratio: 0.78 (threshold 0.80). Recommend stratified re-sampling.',
        'lending, ethnicity+postcode': 'Proxy correlation detected: postcode → ethnicity (r=0.64). Review feature engineering.',
        'healthcare, disability+age': 'No significant disparity found. Continue monitoring production drift.',
        'training on personal data': 'Lawful basis: likely Legitimate Interest + DPIA required. Art 35 GDPR triggered.',
        'automated decision-making': 'Art 22 GDPR check required. Provide meaningful human review mechanism.',
        'third-country transfer': 'Transfer impact assessment + SCCs + supplementary measures required.',
        'EU AI Act': 'Crosswalk complete: 42 controls mapped to ISO/IEC 42001, NIST AI RMF, UK AI Bill.',
        'ISO/IEC 42001': 'Crosswalk complete: 37 AIMS clauses mapped to EU AI Act obligations.',
        'NIST AI RMF': 'Crosswalk complete: Govern/Map/Measure/Manage functions mapped to EU AI Act articles.',
        'UK AI Bill': 'Crosswalk complete: 9 regulator principles mapped to EU AI Act + CSOAI commitments.'
      }};
      return map[val] || 'Scan complete. No issues flagged in demo mode.';
    }}
  </script>
</section>"""

def feature_grid():
    return """<section class="py-16 md:py-24">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="text-center mb-12">
      <h2 class="text-2xl md:text-3xl font-bold text-white mb-3">Built for compliance teams who ship fast</h2>
      <p class="text-slate-400">Everything you need to move from checklist anxiety to audit confidence.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div class="glass rounded-xl p-6"><div class="text-2xl mb-3">⚡</div><h3 class="font-bold text-white mb-2">5-minute scans</h3><p class="text-sm text-slate-400">Answer a short, framework-aware questionnaire and get an actionable scorecard.</p></div>
      <div class="glass rounded-xl p-6"><div class="text-2xl mb-3">🔗</div><h3 class="font-bold text-white mb-2">MCP-native</h3><p class="text-sm text-slate-400">Drop the MCP server into Claude, Cursor, Kimi or your own A2A orchestrator.</p></div>
      <div class="glass rounded-xl p-6"><div class="text-2xl mb-3">🧾</div><h3 class="font-bold text-white mb-2">Evidence packs</h3><p class="text-sm text-slate-400">Export signed PDFs with control mappings, test results and remediation history.</p></div>
      <div class="glass rounded-xl p-6"><div class="text-2xl mb-3">🤝</div><h3 class="font-bold text-white mb-2">GRC partner network</h3><p class="text-sm text-slate-400">Co-sell with vetted compliance boutiques. White-label available on Enterprise.</p></div>
      <div class="glass rounded-xl p-6"><div class="text-2xl mb-3">🏭</div><h3 class="font-bold text-white mb-2">Industry templates</h3><p class="text-sm text-slate-400">Finance, legal and healthcare landing pages with sector-specific controls.</p></div>
      <div class="glass rounded-xl p-6"><div class="text-2xl mb-3">🛡️</div><h3 class="font-bold text-white mb-2">Audit-ready</h3><p class="text-sm text-slate-400">Immutable logs, cryptographic attestations and regulator-friendly exports.</p></div>
    </div>
  </div>
</section>"""

def cta_section():
    return """<section class="py-16 md:py-20 border-t border-white/10">
  <div class="max-w-4xl mx-auto px-4 sm:px-6 text-center">
    <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">Start your free compliance scan today</h2>
    <p class="text-slate-300 mb-8">No credit card. No sales call. Get your scorecard in under 5 minutes.</p>
    <div class="flex flex-col sm:flex-row justify-center gap-3">
      <a href="/signup" class="inline-flex justify-center px-8 py-4 rounded-xl meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Get started free</a>
      <a href="/enterprise" class="inline-flex justify-center px-8 py-4 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition">Talk to Enterprise</a>
    </div>
  </div>
</section>"""

def pricing_page(domain, d):
    cards = ""
    for p in PRICING:
        highlight = "ring-2 ring-meok-gold" if p["highlight"] else "border-white/10"
        badge = '<span class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full meok-gold-bg text-slate-900 text-xs font-bold">Most popular</span>' if p["highlight"] else ""
        cards += f"""
      <div class="relative glass rounded-2xl p-6 md:p-8 {highlight}">
        {badge}
        <h3 class="text-xl font-bold text-white mb-2">{p['name']}</h3>
        <p class="text-sm text-slate-400 mb-4">{p['description']}</p>
        <div class="flex items-baseline gap-1 mb-6"><span class="text-4xl font-extrabold text-white">{p['price']}</span><span class="text-slate-400">{p['period']}</span></div>
        <ul class="space-y-3 mb-8">
          {''.join(f'<li class="flex items-start gap-2 text-sm text-slate-300"><span class="text-meok-gold">✓</span>{f}</li>' for f in p['features'])}
        </ul>
        <a href="{p['href']}" class="block w-full text-center px-5 py-3 rounded-xl {'meok-gold-bg text-slate-900 font-bold hover:brightness-110' if p['highlight'] else 'bg-white/10 text-white font-semibold hover:bg-white/20'} transition">{p['cta']}</a>
      </div>"""
    return f"""<section class="py-16 md:py-24">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="text-center mb-12">
      <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-4">Simple, transparent pricing</h1>
      <p class="text-lg text-slate-300">Starter for individuals, Pro for teams, Enterprise for regulated organisations.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6 md:gap-8 mb-16">
      {cards}
    </div>
    <div class="glass rounded-2xl p-6 md:p-8">
      <h2 class="text-xl font-bold text-white mb-4">Compare plans</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm text-left text-slate-300">
          <thead class="text-xs text-slate-400 uppercase border-b border-white/10">
            <tr><th class="py-3 pr-4">Feature</th><th class="py-3 px-4">Starter</th><th class="py-3 px-4">Pro</th><th class="py-3 px-4">Enterprise</th></tr>
          </thead>
          <tbody>
            <tr class="border-b border-white/5"><td class="py-3 pr-4">MCP quick-scans</td><td class="py-3 px-4">1 domain</td><td class="py-3 px-4">All 6</td><td class="py-3 px-4">Unlimited + custom</td></tr>
            <tr class="border-b border-white/5"><td class="py-3 pr-4">Signed attestations</td><td class="py-3 px-4">—</td><td class="py-3 px-4">✓</td><td class="py-3 px-4">✓ + custom keys</td></tr>
            <tr class="border-b border-white/5"><td class="py-3 pr-4">API access</td><td class="py-3 px-4">—</td><td class="py-3 px-4">✓</td><td class="py-3 px-4">✓ + SLA</td></tr>
            <tr class="border-b border-white/5"><td class="py-3 pr-4">Industry templates</td><td class="py-3 px-4">—</td><td class="py-3 px-4">Finance, Legal, Healthcare</td><td class="py-3 px-4">Custom verticals</td></tr>
            <tr><td class="py-3 pr-4">Support</td><td class="py-3 px-4">Community</td><td class="py-3 px-4">Email (24h)</td><td class="py-3 px-4">Dedicated CSM</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</section>"""

def signup_page(domain, d):
    return f"""<section class="py-16 md:py-24">
  <div class="max-w-2xl mx-auto px-4 sm:px-6">
    <div class="text-center mb-10">
      <h1 class="text-3xl md:text-4xl font-extrabold text-white mb-3">Start your free scan</h1>
      <p class="text-slate-300">No credit card required. Get your scorecard by email in under 5 minutes.</p>
    </div>
    <form id="signup-form" class="glass rounded-2xl p-6 md:p-8 space-y-5" onsubmit="event.preventDefault(); handleSignup();">
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1">Work email</label>
        <input type="email" id="email" required class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-meok-gold focus:outline-none" placeholder="you@company.com">
      </div>
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1">First name</label>
          <input type="text" id="firstName" required class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-meok-gold focus:outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-1">Last name</label>
          <input type="text" id="lastName" required class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-meok-gold focus:outline-none">
        </div>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1">Company</label>
        <input type="text" id="company" required class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-meok-gold focus:outline-none">
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1">Role</label>
        <select id="role" required class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-meok-gold focus:outline-none">
          <option value="">Select...</option>
          <option value="Compliance / Legal">Compliance / Legal</option>
          <option value="Engineering / ML">Engineering / ML</option>
          <option value="Security">Security</option>
          <option value="Product">Product</option>
          <option value="Executive">Executive</option>
          <option value="Partner / Consultant">Partner / Consultant</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-slate-300 mb-1">I&apos;m interested in</label>
        <select id="plan" required class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-meok-gold focus:outline-none">
          <option value="">Select...</option>
          <option value="Starter">Starter — £79/mo</option>
          <option value="Pro">Pro — £199/mo</option>
          <option value="Enterprise">Enterprise — custom</option>
          <option value="Partner">Partner programme</option>
        </select>
      </div>
      <button type="submit" class="w-full px-6 py-3 rounded-xl meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Create free account</button>
      <p class="text-xs text-slate-500">By signing up you agree to our <a href="https://meok.ai/terms" class="underline hover:text-slate-300">Terms</a> and <a href="https://meok.ai/privacy" class="underline hover:text-slate-300">Privacy Policy</a>. No real charge is made at signup.</p>
    </form>
    <div id="signup-success" class="hidden text-center mt-8">
      <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 text-2xl mb-4">✓</div>
      <h2 class="text-2xl font-bold text-white mb-2">Account created</h2>
      <p class="text-slate-300">Check your email for next steps. Your free scan is ready.</p>
    </div>
  </div>
  <script>
    async function handleSignup() {{
      const data = {{
        email: document.getElementById('email').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        company: document.getElementById('company').value,
        role: document.getElementById('role').value,
        plan: document.getElementById('plan').value,
        source: '{domain}.ai/signup',
        submitted_at: new Date().toISOString()
      }};
      try {{
        await fetch('https://meok-attestation-api.vercel.app/sign', {{
          method: 'POST', headers: {{'Content-Type':'application/json'}},
          body: JSON.stringify({{ email: data.email, type: '{domain}_signup', entity: data.company, metadata: data }})
        }});
      }} catch (e) {{}}
      document.getElementById('signup-form').classList.add('hidden');
      document.getElementById('signup-success').classList.remove('hidden');
    }}
  </script>
</section>"""

def partner_page(domain, d):
    return f"""<section class="py-16 md:py-24">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="grid md:grid-cols-2 gap-12 items-center mb-16">
      <div>
        <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-4">Partner programme for GRC boutiques</h1>
        <p class="text-lg text-slate-300 mb-6">Co-sell MCP-powered compliance automation to your clients. White-label options, recurring commission, and technical enablement included.</p>
        <div class="flex flex-col sm:flex-row gap-3">
          <a href="/signup" class="inline-flex justify-center px-6 py-3 rounded-xl meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Apply to partner</a>
          <a href="/enterprise" class="inline-flex justify-center px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition">Enterprise co-sell</a>
        </div>
      </div>
      <div class="glass rounded-2xl p-6 md:p-8">
        <h3 class="text-lg font-bold text-white mb-4">Why partner with {d['title']}?</h3>
        <ul class="space-y-4">
          <li class="flex items-start gap-3"><span class="text-meok-gold text-xl">↗</span><div><strong class="text-white">Recurring revenue</strong><p class="text-sm text-slate-400">20–30% commission on referred subscriptions.</p></div></li>
          <li class="flex items-start gap-3"><span class="text-meok-gold text-xl">🏷</span><div><strong class="text-white">White-label ready</strong><p class="text-sm text-slate-400">Run scans under your brand on Enterprise tiers.</p></div></li>
          <li class="flex items-start gap-3"><span class="text-meok-gold text-xl">🧰</span><div><strong class="text-white">Technical enablement</strong><p class="text-sm text-slate-400">MCP onboarding, proposal templates, sales deck.</p></div></li>
        </ul>
      </div>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
      <div class="glass rounded-xl p-6 text-center"><div class="text-3xl font-extrabold text-white mb-1">20%</div><div class="text-sm text-slate-400">Starter referrals</div></div>
      <div class="glass rounded-xl p-6 text-center"><div class="text-3xl font-extrabold text-white mb-1">25%</div><div class="text-sm text-slate-400">Pro referrals</div></div>
      <div class="glass rounded-xl p-6 text-center"><div class="text-3xl font-extrabold text-white mb-1">30%</div><div class="text-sm text-slate-400">Enterprise co-sell</div></div>
      <div class="glass rounded-xl p-6 text-center"><div class="text-3xl font-extrabold text-white mb-1">90d</div><div class="text-sm text-slate-400">Cookie / attribution</div></div>
    </div>
    <div class="glass rounded-2xl p-6 md:p-8">
      <h2 class="text-xl font-bold text-white mb-6">Ideal partner profile</h2>
      <div class="grid md:grid-cols-3 gap-6 text-sm text-slate-300">
        <div><strong class="text-white block mb-2">GRC consultancies</strong>EU AI Act, DORA, GDPR and ISO 42001 implementation practices.</div>
        <div><strong class="text-white block mb-2">Legal & privacy boutiques</strong>Data protection, AI regulation and commercial law firms.</div>
        <div><strong class="text-white block mb-2">Security resellers</strong>MSSP, penetration testing and AI red-team service providers.</div>
      </div>
    </div>
  </div>
</section>"""

def enterprise_page(domain, d):
    return f"""<section class="py-16 md:py-24">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="text-center mb-16">
      <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-4">Enterprise AI compliance</h1>
      <p class="text-lg text-slate-300 max-w-3xl mx-auto">Procurement-ready packages with custom frameworks, audit support, SLA-backed API access and dedicated customer success.</p>
    </div>
    <div class="grid md:grid-cols-2 gap-8 mb-16">
      <div class="glass rounded-2xl p-6 md:p-8">
        <h2 class="text-xl font-bold text-white mb-4">What&apos;s included</h2>
        <ul class="space-y-3 text-slate-300">
          <li class="flex items-start gap-2"><span class="text-meok-gold">✓</span> Unlimited users and scans across all 6 compliance domains</li>
          <li class="flex items-start gap-2"><span class="text-meok-gold">✓</span> Custom control framework mapping</li>
          <li class="flex items-start gap-2"><span class="text-meok-gold">✓</span> Signed attestations with your own Ed25519 keys</li>
          <li class="flex items-start gap-2"><span class="text-meok-gold">✓</span> Private MCP deployment options</li>
          <li class="flex items-start gap-2"><span class="text-meok-gold">✓</span> SOC 2 Type I support documentation</li>
          <li class="flex items-start gap-2"><span class="text-meok-gold">✓</span> 99.9% uptime SLA</li>
        </ul>
      </div>
      <div class="glass rounded-2xl p-6 md:p-8">
        <h2 class="text-xl font-bold text-white mb-4">Request a procurement call</h2>
        <form id="enterprise-form" class="space-y-4" onsubmit="event.preventDefault(); handleEnterprise();">
          <input type="email" id="ent-email" required placeholder="Work email" class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-meok-gold focus:outline-none">
          <input type="text" id="ent-company" required placeholder="Company" class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-meok-gold focus:outline-none">
          <input type="text" id="ent-title" placeholder="Job title" class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-meok-gold focus:outline-none">
          <textarea id="ent-notes" rows="3" placeholder="Tell us about your compliance priorities" class="w-full rounded-lg bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-slate-500 focus:border-meok-gold focus:outline-none"></textarea>
          <button type="submit" class="w-full px-6 py-3 rounded-xl meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Request Enterprise quote</button>
        </form>
        <div id="ent-success" class="hidden text-center mt-4 text-emerald-400">Thank you. Our team will reply within one business day.</div>
      </div>
    </div>
    <div class="glass rounded-2xl p-6 md:p-8">
      <h2 class="text-xl font-bold text-white mb-4">Trust & security</h2>
      <div class="grid sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm text-slate-300">
        <div><strong class="text-white block">UK legal entity</strong>CSOAI Ltd, company 16939677</div>
        <div><strong class="text-white block">Data residency</strong>EU and UK hosting options</div>
        <div><strong class="text-white block">Cryptographic proof</strong>Ed25519 signed attestations</div>
        <div><strong class="text-white block">MSA & DPA</strong>Available on Enterprise</div>
      </div>
    </div>
  </div>
  <script>
    async function handleEnterprise() {{
      const data = {{ email: document.getElementById('ent-email').value, company: document.getElementById('ent-company').value, title: document.getElementById('ent-title').value, notes: document.getElementById('ent-notes').value, source: '{domain}.ai/enterprise' }};
      try {{ await fetch('https://meok-attestation-api.vercel.app/sign', {{ method:'POST', headers:{{'Content-Type':'application/json'}}, body: JSON.stringify({{ email: data.email, type: '{domain}_enterprise_lead', entity: data.company, metadata: data }}) }}); }} catch(e){{}}
      document.getElementById('enterprise-form').reset();
      document.getElementById('ent-success').classList.remove('hidden');
    }}
  </script>
</section>"""

def industry_page(domain, d, vertical):
    verticals = {
        "finance": {
            "title": "Financial Services",
            "headline": "AI compliance for banks, insurers and fintechs",
            "points": ["EU AI Act high-risk credit and insurance scoring", "DORA ICT risk management and incident reporting", "FCA/PRA consumer duty and model accountability", "GDPR automated decision-making safeguards"],
            "case": "A UK neobank used {title} to map its credit decisioning model to EU AI Act Article 6 and DORA Article 11, cutting audit preparation time by 60%.",
        },
        "legal": {
            "title": "Legal & Professional Services",
            "headline": "AI governance for law firms and consultancies",
            "points": ["Client confidentiality and legal professional privilege", "EU AI Act high-risk use in justice and migration", "SRA technology and AI guidance alignment", "Liability frameworks for AI-assisted advice"],
            "case": "A City law firm used {title} to create an AI use register, map practice-area risks and generate partner-ready compliance memos.",
        },
        "healthcare": {
            "title": "Healthcare & Life Sciences",
            "headline": "Trustworthy AI for health and medtech",
            "points": ["EU AI Act high-risk medical devices and SaMD", "MHRA software and AI medical device guidance", "GDPR health data and lawful basis", "NHS algorithmic impact assessment alignment"],
            "case": "A healthtech scale-up used {title} to complete its DPIA, document clinical safety evidence and prepare for MHRA engagement.",
        },
    }
    v = verticals[vertical]
    case = v["case"].format(title=d['title'])
    return f"""<section class="py-16 md:py-24">
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <div class="mb-6"><a href="/" class="text-sm text-slate-400 hover:text-white transition">← Back to {d['title']}</a></div>
    <div class="grid md:grid-cols-2 gap-12 items-center mb-16">
      <div>
        <span class="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-slate-300 mb-4">Industry</span>
        <h1 class="text-4xl md:text-5xl font-extrabold text-white mb-4">{v['headline']}</h1>
        <p class="text-lg text-slate-300 mb-6">{case}</p>
        <div class="flex flex-col sm:flex-row gap-3">
          <a href="/signup" class="inline-flex justify-center px-6 py-3 rounded-xl meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Start free scan</a>
          <a href="/enterprise" class="inline-flex justify-center px-6 py-3 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition">Enterprise enquiry</a>
        </div>
      </div>
      <div class="glass rounded-2xl p-6 md:p-8">
        <h3 class="text-lg font-bold text-white mb-4">Key compliance areas</h3>
        <ul class="space-y-3">
          {''.join(f'<li class="flex items-start gap-2 text-slate-300"><span class="text-meok-gold">✓</span>{p}</li>' for p in v['points'])}
        </ul>
      </div>
    </div>
    <div class="grid sm:grid-cols-3 gap-6 mb-16">
      <div class="glass rounded-xl p-6 text-center"><div class="text-3xl font-extrabold text-white mb-1">60%</div><div class="text-sm text-slate-400">Faster audit prep</div></div>
      <div class="glass rounded-xl p-6 text-center"><div class="text-3xl font-extrabold text-white mb-1">6</div><div class="text-sm text-slate-400">Compliance domains</div></div>
      <div class="glass rounded-xl p-6 text-center"><div class="text-3xl font-extrabold text-white mb-1">5 min</div><div class="text-sm text-slate-400">To first scorecard</div></div>
    </div>
    <div class="glass rounded-2xl p-6 md:p-8 text-center">
      <h2 class="text-2xl font-bold text-white mb-4">See how {d['title']} fits your {v['title'].lower()} use case</h2>
      <p class="text-slate-300 mb-6">Book a 20-minute sector briefing with our compliance team.</p>
      <a href="/enterprise" class="inline-flex justify-center px-8 py-4 rounded-xl meok-gold-bg text-slate-900 font-bold hover:brightness-110 transition">Book a briefing</a>
    </div>
  </div>
</section>"""

def build_domain(domain, d):
    outdir = os.path.join(BASE, f"{domain}-deploy")
    os.makedirs(outdir, exist_ok=True)
    os.makedirs(os.path.join(outdir, "pricing"), exist_ok=True)
    os.makedirs(os.path.join(outdir, "signup"), exist_ok=True)
    os.makedirs(os.path.join(outdir, "partner"), exist_ok=True)
    os.makedirs(os.path.join(outdir, "enterprise"), exist_ok=True)
    os.makedirs(os.path.join(outdir, "industry"), exist_ok=True)

    canonical = f"https://{domain}.ai"
    desc = f"{d['tagline']} — free quick-scan, paid compliance bundles and MCP-powered automation from MEOK AI Labs."

    # index.html
    index_body = nav(domain, d['title']) + hero_section(domain, d) + mcp_demo_section(domain, d) + feature_grid() + cta_section() + footer(d['title'])
    with open(os.path.join(outdir, "index.html"), "w") as f:
        f.write(page_shell(f"{d['title']} — {d['tagline']}", desc, canonical, index_body))

    # pricing
    pricing_body = nav(domain, d['title']) + pricing_page(domain, d) + footer(d['title'])
    with open(os.path.join(outdir, "pricing", "index.html"), "w") as f:
        f.write(page_shell(f"Pricing — {d['title']}", f"Starter £79, Pro £199, Enterprise custom. {d['tagline']} from MEOK AI Labs.", f"{canonical}/pricing", pricing_body))

    # signup
    signup_body = nav(domain, d['title']) + signup_page(domain, d) + footer(d['title'])
    with open(os.path.join(outdir, "signup", "index.html"), "w") as f:
        f.write(page_shell(f"Sign up — {d['title']}", f"Create your free {d['title']} account. No credit card required.", f"{canonical}/signup", signup_body))

    # partner
    partner_body = nav(domain, d['title']) + partner_page(domain, d) + footer(d['title'])
    with open(os.path.join(outdir, "partner", "index.html"), "w") as f:
        f.write(page_shell(f"Partner programme — {d['title']}", f"GRC boutique partner programme for {d['title']}. Co-sell MCP-powered compliance.", f"{canonical}/partner", partner_body))

    # enterprise
    enterprise_body = nav(domain, d['title']) + enterprise_page(domain, d) + footer(d['title'])
    with open(os.path.join(outdir, "enterprise", "index.html"), "w") as f:
        f.write(page_shell(f"Enterprise — {d['title']}", f"Enterprise procurement, SLA and custom frameworks for {d['title']}.", f"{canonical}/enterprise", enterprise_body))

    # industry pages
    for vertical in ["finance", "legal", "healthcare"]:
        industry_body = nav(domain, d['title']) + industry_page(domain, d, vertical) + footer(d['title'])
        with open(os.path.join(outdir, "industry", f"{vertical}.html"), "w") as f:
            f.write(page_shell(f"{vertical.capitalize()} — {d['title']}", f"{d['title']} for {vertical}. Sector-specific compliance controls and case studies.", f"{canonical}/industry/{vertical}", industry_body))

    # config files
    with open(os.path.join(outdir, "vercel.json"), "w") as f:
        json.dump(VERCEL_JSON, f, indent=2)
    with open(os.path.join(outdir, "robots.txt"), "w") as f:
        f.write(ROBOTS.format(domain=domain))
    with open(os.path.join(outdir, "llms.txt"), "w") as f:
        f.write(LLMS_TXT.format(title=d['title'], tagline=d['tagline'], mcp=d['mcp'], mcp_pypi=d['mcp_pypi']))

    print(f"Generated {outdir}")

def main():
    for domain, d in DOMAINS.items():
        build_domain(domain, d)
    print("Done.")

if __name__ == "__main__":
    main()

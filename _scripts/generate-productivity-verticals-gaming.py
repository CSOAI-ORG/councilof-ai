#!/usr/bin/env python3
"""Generate deploy directories for Productivity + Verticals + Gaming hive enhancement.
Creates index.html + subpages for each domain in the dark MEOK.ai aesthetic."""

import os, json, textwrap

ROOT = "/Users/nicholas/clawd"

# Shared design tokens / Tailwind dark theme
TAILWIND_CDN = "https://cdn.jsdelivr.net/npm/tailwindcss@3.4.1/dist/tailwind.min.css"

VERCEL_JSON = {
    "outputDirectory": ".",
    "cleanUrls": True,
    "trailingSlash": False,
    "headers": [
        {
            "source": "/(.*)",
            "headers": [
                {"key": "X-Content-Type-Options", "value": "nosniff"},
                {"key": "X-Frame-Options", "value": "SAMEORIGIN"},
                {"key": "Referrer-Policy", "value": "strict-origin-when-cross-origin"},
                {"key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload"},
                {"key": "X-Robots-Tag", "value": "index, follow, max-image-preview:large"}
            ]
        },
        {"source": "/llms.txt", "headers": [{"key": "Content-Type", "value": "text/plain; charset=utf-8"}]},
        {"source": "/openapi.json", "headers": [{"key": "Content-Type", "value": "application/json; charset=utf-8"}]},
        {"source": "/sitemap.xml", "headers": [{"key": "Content-Type", "value": "application/xml; charset=utf-8"}]}
    ]
}

ROBOTS = "User-agent: *\nDisallow:\n"

def footer(domain):
    return f"""<footer class="border-t border-slate-800 mt-20 py-10 text-slate-500 text-sm">
  <div class="max-w-6xl mx-auto px-6">
    <nav class="flex flex-wrap justify-center gap-4 mb-6">
      <a href="https://meok.ai" class="hover:text-amber-400 transition">MEOK.ai</a>
      <a href="https://csoai.org" class="hover:text-amber-400 transition">CSOAI</a>
      <a href="https://proofof.ai" class="hover:text-amber-400 transition">ProofOf.AI</a>
      <a href="https://meok.ai/privacy" class="hover:text-amber-400 transition">Privacy</a>
      <a href="https://meok.ai/terms" class="hover:text-amber-400 transition">Terms</a>
    </nav>
    <p class="text-center">© 2026 MEOK AI Labs · CSOAI Ltd · UK Companies House <strong>16939677</strong></p>
    <p class="text-center mt-2">Part of the MEOK sovereign AI hive.</p>
  </div>
</footer>"""

def head(title, desc, canonical, extra=""):
    return f"""<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <meta name="description" content="{desc}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="{canonical}">
  <link rel="canonical" href="{canonical}">
  <link rel="llms-txt" href="/llms.txt">
  <script src="{TAILWIND_CDN}"></script>
  <style>
    body {{ background:#050510; color:#e8e4dc; }}
    .meok-gold {{ color:#c9a84c; }}
    .bg-meok-gold {{ background-color:#c9a84c; }}
    .border-meok-gold {{ border-color:#c9a84c; }}
    .btn-primary {{ background:#c9a84c; color:#050510; padding:0.75rem 1.5rem; border-radius:0.5rem; font-weight:700; display:inline-block; transition:opacity .2s; }}
    .btn-primary:hover {{ opacity:.9; }}
    .btn-secondary {{ border:1px solid #c9a84c; color:#c9a84c; padding:0.75rem 1.5rem; border-radius:0.5rem; font-weight:600; display:inline-block; }}
    .btn-secondary:hover {{ background:rgba(201,168,76,0.1); }}
    .card {{ background:#0f0f1a; border:1px solid #1f1f2e; border-radius:0.75rem; padding:1.5rem; }}
  </style>
  {extra}
</head>"""

def nav(links):
    items = "".join(f'<a href="{href}" class="hover:text-amber-400 transition text-sm">{label}</a>' for href, label in links)
    return f"""<nav class="border-b border-slate-800 bg-[#050510]/90 backdrop-blur sticky top-0 z-50">
  <div class="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
    <a href="/" class="text-xl font-bold meok-gold tracking-tight">MEOK</a>
    <div class="flex flex-wrap gap-6">{items}</div>
  </div>
</nav>"""

def waitlist_form(domain):
    return f"""<form class="max-w-md mx-auto mt-8 flex flex-col sm:flex-row gap-3" onsubmit="event.preventDefault(); alert('Thanks — we will notify you when {domain} is live.');">
  <input type="email" required placeholder="you@example.com" class="flex-1 px-4 py-3 rounded-lg bg-[#0f0f1a] border border-slate-700 text-white focus:border-amber-400 focus:outline-none">
  <button type="submit" class="btn-primary">Join waitlist</button>
</form>"""

def signup_form(domain, cta="Start free trial"):
    return f"""<form class="max-w-md mx-auto mt-8 space-y-4" onsubmit="event.preventDefault(); alert('Signup captured for {domain}. This is a demo/waitlist form; Clerk integration pending.');">
  <input type="email" required placeholder="Work email" class="w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border border-slate-700 text-white focus:border-amber-400 focus:outline-none">
  <input type="password" required placeholder="Create password" class="w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border border-slate-700 text-white focus:border-amber-400 focus:outline-none">
  <button type="submit" class="btn-primary w-full">{cta}</button>
  <p class="text-xs text-slate-500 text-center">No charge today. Stripe checkout connects after Nick verifies live keys.</p>
</form>"""

def contact_form(domain):
    return f"""<form class="max-w-xl mx-auto mt-8 space-y-4" onsubmit="event.preventDefault(); alert('Demo request captured for {domain}. Sales will follow up.');">
  <div class="grid sm:grid-cols-2 gap-4">
    <input type="text" required placeholder="Name" class="w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border border-slate-700 text-white focus:border-amber-400 focus:outline-none">
    <input type="text" required placeholder="Company" class="w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border border-slate-700 text-white focus:border-amber-400 focus:outline-none">
  </div>
  <input type="email" required placeholder="Work email" class="w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border border-slate-700 text-white focus:border-amber-400 focus:outline-none">
  <textarea rows="4" placeholder="Tell us about your project" class="w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border border-slate-700 text-white focus:border-amber-400 focus:outline-none"></textarea>
  <button type="submit" class="btn-primary w-full">Request demo</button>
</form>"""

def partner_form(domain):
    return f"""<form class="max-w-xl mx-auto mt-8 space-y-4" onsubmit="event.preventDefault(); alert('Partner application captured for {domain}. Partnerships team will respond within 48 hours.');">
  <div class="grid sm:grid-cols-2 gap-4">
    <input type="text" required placeholder="Name" class="w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border border-slate-700 text-white focus:border-amber-400 focus:outline-none">
    <input type="text" required placeholder="Organisation" class="w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border border-slate-700 text-white focus:border-amber-400 focus:outline-none">
  </div>
  <input type="email" required placeholder="Work email" class="w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border border-slate-700 text-white focus:border-amber-400 focus:outline-none">
  <select class="w-full px-4 py-3 rounded-lg bg-[#0f0f1a] border border-slate-700 text-white focus:border-amber-400 focus:outline-none">
    <option>Referral partner</option>
    <option>Integration partner</option>
    <option>Reseller / agency</option>
    <option>Enterprise co-sell</option>
  </select>
  <button type="submit" class="btn-primary w-full">Apply to partner</button>
</form>"""

def donation_block():
    return """<div class="max-w-xl mx-auto mt-10 card text-center">
  <h3 class="text-xl font-semibold mb-3">Support crisis intervention</h3>
  <p class="text-slate-400 mb-6">100% of donations fund helpline capacity, training, and multilingual outreach. CSOAI Ltd processes donations; no data is sold.</p>
  <button class="btn-primary" onclick="alert('Donation flow connects to Stripe after Nick verifies live keys.')">Donate now</button>
</div>"""

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)

def write_common(deploy):
    write_file(os.path.join(deploy, "vercel.json"), json.dumps(VERCEL_JSON, indent=2))
    write_file(os.path.join(deploy, "robots.txt"), ROBOTS)

# ---------------- Domain configurations ----------------

DOMAINS = {}

# Dead domains: landing + waitlist
DOMAINS["diyhelp"] = {
    "domain": "diyhelp.ai",
    "live": False,
    "title": "DIYHelp.ai — AI Assistant for Home Repairs & Renovation",
    "tagline": "Ask any DIY question. Get step-by-step guidance, tool lists, and safety warnings from an AI built for homeowners, landlords, and trades apprentices.",
    "features": [
        ("🔧 Step-by-step repairs", "Plumbing, electrics, carpentry, decorating — explained plainly."),
        ("🛡️ Safety first", "Automatic hazard flags and when-to-call-a-pro advice."),
        ("🧰 Tool & material lists", "Know exactly what to buy before you start."),
        ("📹 Video matches", "Link to trusted tutorial videos for complex jobs."),
    ],
    "pages": ["index"]
}

DOMAINS["pokerhud"] = {
    "domain": "pokerhud.ai",
    "live": False,
    "title": "PokerHUD.ai — AI Poker Coach & Stats Assistant",
    "tagline": "Review hands, spot leaks, and study GTO concepts with a private AI coach. No banned HUD overlays — just intelligence.",
    "features": [
        ("🃏 Hand history review", "Paste hands and get street-by-street analysis."),
        ("📊 Leak finder", "Track recurring mistakes by position, stake, and board texture."),
        ("🧠 GTO study mode", "Practice spots with solver-informed explanations."),
        ("🔒 Privacy-first", "Your data is yours; no cloud hand database required."),
    ],
    "pages": ["index"]
}

DOMAINS["loopfactory"] = {
    "domain": "loopfactory.ai",
    "live": False,
    "title": "LoopFactory.ai — AI Workflow Automation for Small Teams",
    "tagline": "Connect your apps, build loops, and let AI agents handle repetitive work. Designed for ops, marketing, and finance teams that outgrow Zapier.",
    "features": [
        ("🔗 App mesh", "Native connectors for email, sheets, CRMs, Slack, and APIs."),
        ("🤖 Agent loops", "Multi-step automations with memory and conditional branches."),
        ("📈 Observability", "See exactly what ran, when, and why."),
        ("🛡️ Sovereign hosting", "EU/UK data residency by default."),
    ],
    "pages": ["index"]
}

DOMAINS["socialmediamanager"] = {
    "domain": "socialmediamanager.ai",
    "live": False,
    "title": "SocialMediaManager.ai — AI Social Media Scheduler & Analyst",
    "tagline": "Plan, draft, schedule, and analyse posts across every major platform. One inbox, one calendar, one AI that learns your brand voice.",
    "features": [
        ("📅 Unified calendar", "Plan content across LinkedIn, X, Instagram, Facebook, TikTok."),
        ("✍️ AI drafting", "On-brand captions, hooks, and thread ideas in your voice."),
        ("📊 Performance analytics", "Track reach, engagement, and conversion in one dashboard."),
        ("🤝 Team approvals", "Workflows for agencies and in-house social teams."),
    ],
    "pages": ["index"]
}

# Live domains: full SaaS conversion pages
DOMAINS["optimobile"] = {
    "domain": "optimobile.ai",
    "live": True,
    "title": "Optimobile.ai — Practice Management for Modern Opticians",
    "tagline": "NHS GOS, PVN & domiciliary workflows in one AI-assisted practice platform. Built for independent opticians and small chains.",
    "features": [
        ("👁️ Patient journeys", "Appointments, recalls, recalls-by-RAG, and referral tracking."),
        ("💳 NHS + private billing", "GOS claims, PVN invoicing, and card payments in one place."),
        ("🏠 Domiciliary ready", "Mobile visits, equipment tracking, and carer notes."),
        ("🔒 IG-compliant", "UK/EU data residency, audit logs, role-based access."),
    ],
    "pages": ["index", "pricing", "signup", "partner", "enterprise"],
    "tiers": [
        ("Solo", "£49/mo", "1 practice, 1 user, NHS GOS & PVN, email support."),
        ("Practice", "£149/mo", "3 users, domiciliary module, recalls, Stripe ready."),
        ("Chain", "£399/mo", "Unlimited users, multi-site, API access, priority support."),
    ]
}

DOMAINS["cobolbridge"] = {
    "domain": "cobolbridge.ai",
    "live": True,
    "title": "COBOL Bridge — Modernise Legacy Systems with AI",
    "tagline": "Reverse-engineer, refactor, and migrate COBOL, mainframe JCL, and RPG to cloud-native services. Trusted by banks, insurers, and government agencies.",
    "features": [
        ("📋 Code discovery", "Map program dependencies, data flows, and business rules."),
        ("🔄 Automated refactoring", "COBOL → Java/Python/Go with human-in-the-loop review."),
        ("☁️ Cloud migration", "Lift-and-shift or re-platform to AWS, Azure, GCP."),
        ("✅ Compliance", "SOX, IFRS, GDPR, and DORA-ready audit trails."),
    ],
    "pages": ["index", "pricing", "signup", "partner", "enterprise", "demo"],
    "tiers": [
        ("Scanner", "£999/mo", "1 application, dependency map, risk report, 5 user seats."),
        ("Moderniser", "£4,999/mo", "5 applications, AI refactor, test generation, JCL translation."),
        ("Enterprise", "Custom", "Unlimited apps, dedicated SRE, on-prem option, SLA."),
    ]
}

DOMAINS["openmoe"] = {
    "domain": "openmoe.ai",
    "live": True,
    "title": "openmoe.ai — BFT Consensus & MoE Routing for Sovereign AI",
    "tagline": "Byzantine-fault-tolerant consensus, Mixture-of-Experts routing, and EU AI Act compliance attestation for open-source AI infrastructure.",
    "features": [
        ("⚡ BFT consensus engine", "Tolerate Byzantine nodes without a trusted coordinator."),
        ("🧠 MoE router", "Route prompts to the right expert model, cheaply and verifiably."),
        ("📜 EU AI Act ready", "Signed attestations, audit receipts, and risk-class mapping."),
        ("🔌 MCP-native", "Expose routing + consensus as Model Context Protocol tools."),
    ],
    "pages": ["index", "pricing", "signup", "docs", "partner"],
    "tiers": [
        ("Hacker", "£0/mo", "10K API calls/mo, community support, non-commercial use."),
        ("Builder", "£79/mo", "500K API calls/mo, signed receipts, email support."),
        ("Platform", "£499/mo", "5M API calls/mo, SLA, dedicated routing region."),
    ],
    "docs": True
}

DOMAINS["landlaw"] = {
    "domain": "landlaw.ai",
    "live": True,
    "title": "LandLaw.ai — UK Planning Permission & Land Law AI Assistant",
    "tagline": "Instant guidance on planning permission, permitted development, boundary disputes, and land law — reviewed by UK solicitors.",
    "features": [
        ("🏘️ Planning checks", "Permitted development rights, LPA requirements, appeal routes."),
        ("⚖️ Legal research", "Case law, statute, and guidance summaries with citations."),
        ("📄 Document drafting", "Letters to neighbours, councils, and solicitors."),
        ("👨‍⚖️ Solicitor handoff", "Escalate to a verified land-law solicitor when needed."),
    ],
    "pages": ["index", "pricing", "signup", "partner"],
    "tiers": [
        ("Citizen", "£0/mo", "5 questions/mo, general guidance, no solicitor review."),
        ("Homeowner", "£19/mo", "Unlimited questions, document templates, citation export."),
        ("Solicitor partner", "£99/mo", "Client handoffs, white-label assistant, CPD materials."),
    ]
}

DOMAINS["commercialvehicle"] = {
    "domain": "commercialvehicle.ai",
    "live": True,
    "title": "CommercialVehicle.ai — Fleet Sales, Compliance & Management",
    "tagline": "Buy, sell, and manage commercial vehicles with AI-powered listings, compliance checks, and fleet telemetry.",
    "features": [
        ("🚛 Smart listings", "AI-generated descriptions, valuation, and buyer matching."),
        ("✅ Compliance hub", "MOT, tacho, O-licence, and maintenance reminders."),
        ("📍 Fleet tracking", "Telematics integration, route history, and driver behaviour."),
        ("💳 Trade finance", "Introducers for HP, lease, and insurance."),
    ],
    "pages": ["index", "pricing", "signup", "partner", "enterprise"],
    "tiers": [
        ("Trader", "£49/mo", "25 live listings, compliance alerts, email support."),
        ("Fleet", "£199/mo", "Unlimited listings, telematics, 5 team seats."),
        ("Enterprise", "Custom", "White-label marketplace, API, SLA, dedicated account manager."),
    ]
}

DOMAINS["suicidestop"] = {
    "domain": "suicidestop.ai",
    "live": True,
    "title": "SuicideStop.ai — Crisis Helplines & Mental Health Resources",
    "tagline": "Free, fast access to international crisis helplines and mental health resources. If you are in crisis, you are not alone.",
    "features": [
        ("🌍 International helplines", "Crisis lines by country, with click-to-call where available."),
        ("💬 Live chat index", "Text and chat services for when calling is hard."),
        ("📚 Resource library", "Safety plans, grounding techniques, and local services."),
        ("🤝 Partner network", "Crisis organisations can list and update services."),
    ],
    "pages": ["index", "partner"],
    "crisis": True
}

# Gaming: enhance existing wowmcp-deploy
DOMAINS["wowmcp"] = {
    "domain": "wowmcp.ai",
    "live": True,
    "title": "wowmcp.ai — WoW MCP Server for AI Agents",
    "tagline": "Model Context Protocol server for World of Warcraft data. 10 tools for raid strategy, character analysis, auction house intelligence, M+ routing, and more.",
    "features": [
        ("raid_strategy_lookup", "Pull current raid strat, boss mechanics, cooldown timings."),
        ("character_analyse", "Parse armory data — gear, talents, parses, recent logs."),
        ("auction_house_query", "Real-time AH prices, trends, market depth."),
        ("mythic_plus_route", "Optimised M+ routes, affix strategies, timer targets."),
        ("gear_compare", "Sim upgrade, BiS lists, stat weights."),
        ("token_price", "WoW Token live price and gold-per-USD history."),
    ],
    "pages": ["pricing", "signup", "partner"],
    "tiers": [
        ("Free", "£0/mo", "10 calls/day per tool, all 10 tools, no signed receipts."),
        ("Pro", "£29/mo", "1,000 calls/day per tool, signed Ed25519 receipts, priority support."),
        ("Guild", "£149/mo", "Unlimited calls, multi-key, guild analytics, webhook alerts."),
    ],
    "gaming": True
}

# ---------------- Page builders ----------------

def build_index(data):
    d = data["domain"]
    base = f"https://{d}"
    nav_links = [("/", "Home")]
    for p in data["pages"]:
        if p != "index":
            nav_links.append((f"/{p}", p.capitalize()))
    nav_html = nav(nav_links)
    signup_btn = '<a href="/signup" class="btn-primary">Get started</a>' if "signup" in data["pages"] else ""
    pricing_btn = '<a href="/pricing" class="btn-secondary">View pricing</a>' if "pricing" in data["pages"] else ""
    partner_btn = '<a href="/partner" class="btn-secondary">Partner with us</a>' if "partner" in data["pages"] else ""
    waitlist_btn = '<a href="#waitlist" class="btn-primary">Join waitlist</a>' if not data["live"] else ""
    hero = f"""<section class="py-20 px-6 text-center">
  <div class="max-w-4xl mx-auto">
    <span class="inline-block px-3 py-1 rounded-full border border-amber-400/30 text-amber-400 text-sm font-semibold mb-6">MEOK AI Labs</span>
    <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">{data['title'].split(' — ')[0]}</h1>
    <p class="text-lg sm:text-xl text-slate-400 mb-10 max-w-2xl mx-auto">{data['tagline']}</p>
    <div class="flex flex-wrap justify-center gap-4">
      {signup_btn}
      {pricing_btn}
      {partner_btn}
      {waitlist_btn}
    </div>
  </div>
</section>"""
    features_grid = "".join(
        f'<div class="card"><h3 class="text-lg font-semibold meok-gold mb-2">{t}</h3><p class="text-slate-400">{desc}</p></div>'
        for t, desc in data["features"]
    )
    features = f"""<section class="py-16 px-6 bg-[#080816]">
  <div class="max-w-6xl mx-auto">
    <h2 class="text-2xl sm:text-3xl font-bold mb-10 text-center">What you get</h2>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">{features_grid}</div>
  </div>
</section>"""
    extra = ""
    if data.get("gaming"):
        extra = f"""<section class="py-16 px-6">
  <div class="max-w-4xl mx-auto">
    <h2 class="text-2xl font-bold mb-6">Quick start</h2>
    <pre class="bg-[#0f0f1a] border border-slate-800 p-4 rounded-lg overflow-x-auto text-sm"><code>npm install @csoai-org/blizzard-wow-mcp
# or via Smithery
npx -y @smithery/cli install @csoai-org/blizzard-wow-mcp</code></pre>
    <p class="mt-4"><a href="https://github.com/CSOAI-ORG/blizzard-wow-mcp" class="meok-gold underline">View on GitHub →</a></p>
  </div>
</section>"""
    if data.get("docs"):
        extra += """<section class="py-16 px-6 bg-[#080816]">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-2xl font-bold mb-4">API & integration docs</h2>
    <p class="text-slate-400 mb-6">MCP endpoints, OpenAPI schema, and SDK references for openmoe.ai.</p>
    <a href="/docs" class="btn-secondary">Browse docs</a>
  </div>
</section>"""
    if not data["live"]:
        extra += f"""<section id="waitlist" class="py-16 px-6 bg-[#080816]">
  <div class="max-w-2xl mx-auto text-center">
    <h2 class="text-2xl font-bold mb-4">Be first in line</h2>
    <p class="text-slate-400 mb-6">{d} is ready for deployment. Enter your email and we will notify you the moment DNS is live.</p>
    {waitlist_form(d)}
    <p class="mt-4 text-sm text-amber-400/80">⏳ Ready for DNS — awaiting Namecheap A-record update by Nick.</p>
  </div>
</section>"""
    if data.get("crisis"):
        extra += f"""<section class="py-16 px-6 bg-red-950/20">
  <div class="max-w-3xl mx-auto text-center">
    <h2 class="text-2xl font-bold mb-4">If you are in crisis right now</h2>
    <p class="text-lg text-slate-300 mb-6">Call or text a helpline. Trained humans are waiting to help.</p>
    <div class="grid sm:grid-cols-2 gap-4 text-left">
      <div class="card"><strong class="text-white">UK & ROI:</strong> Samaritans at <a href="tel:116123" class="meok-gold">116 123</a></div>
      <div class="card"><strong class="text-white">US:</strong> 988 Suicide & Crisis Lifeline <a href="tel:988" class="meok-gold">988</a></div>
      <div class="card"><strong class="text-white">Canada:</strong> Talk Suicide <a href="tel:18334564566" class="meok-gold">1-833-456-4566</a></div>
      <div class="card"><strong class="text-white">Australia:</strong> Lifeline <a href="tel:131114" class="meok-gold">13 11 14</a></div>
    </div>
    <p class="mt-6 text-sm text-slate-500">Find your country on our <a href="/partner" class="meok-gold underline">partner/services page</a>.</p>
  </div>
</section>"""
        extra += donation_block()
    body = f"""{nav_html}
{hero}
{features}
{extra}
{footer(d)}"""
    return f"<!doctype html>\n<html lang=\"en\">\n{head(data['title'], data['tagline'], base)}\n<body>\n{body}\n</body>\n</html>"

def build_pricing(data):
    d = data["domain"]
    base = f"https://{d}/pricing"
    nav_links = [("/", "Home"), ("/pricing", "Pricing")]
    for p in data["pages"]:
        if p not in ("index", "pricing"):
            nav_links.append((f"/{p}", p.capitalize()))
    tiers_html = "".join(
        f"""<div class="card flex flex-col">
      <h3 class="text-xl font-bold mb-2">{name}</h3>
      <p class="text-3xl font-extrabold meok-gold mb-4">{price}</p>
      <p class="text-slate-400 flex-1 mb-6">{desc}</p>
      <button class="btn-primary w-full" onclick="alert('Stripe checkout for {d} {name} will connect after Nick verifies live keys.')">Choose {name}</button>
    </div>"""
        for name, price, desc in data.get("tiers", [])
    )
    body = f"""{nav(nav_links)}
<section class="py-20 px-6 text-center">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
    <p class="text-lg text-slate-400 mb-12">No hidden fees. Cancel anytime. VAT added where applicable.</p>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 text-left">{tiers_html}</div>
    <p class="mt-10 text-sm text-slate-500">Need a custom plan? <a href="/enterprise" class="meok-gold underline">Contact enterprise sales</a> or <a href="/partner" class="meok-gold underline">apply as a partner</a>.</p>
  </div>
</section>
{footer(d)}"""
    return f"<!doctype html>\n<html lang=\"en\">\n{head('Pricing — ' + data['title'].split(' — ')[0], data['tagline'], base)}\n<body>\n{body}\n</body>\n</html>"

def build_signup(data):
    d = data["domain"]
    base = f"https://{d}/signup"
    nav_links = [("/", "Home"), ("/signup", "Signup")]
    for p in data["pages"]:
        if p not in ("index", "signup"):
            nav_links.append((f"/{p}", p.capitalize()))
    body = f"""{nav(nav_links)}
<section class="py-20 px-6">
  <div class="max-w-xl mx-auto text-center">
    <h1 class="text-3xl font-bold mb-4">Create your account</h1>
    <p class="text-slate-400 mb-8">Start free. Upgrade when you are ready.</p>
    {signup_form(d)}
    <p class="mt-6 text-sm text-slate-500">Already have an account? <a href="#" class="meok-gold underline">Log in</a> (Clerk integration pending).</p>
  </div>
</section>
{footer(d)}"""
    return f"<!doctype html>\n<html lang=\"en\">\n{head('Sign up — ' + data['title'].split(' — ')[0], data['tagline'], base)}\n<body>\n{body}\n</body>\n</html>"

def build_partner(data):
    d = data["domain"]
    base = f"https://{d}/partner"
    nav_links = [("/", "Home"), ("/partner", "Partner")]
    for p in data["pages"]:
        if p not in ("index", "partner"):
            nav_links.append((f"/{p}", p.capitalize()))
    crisis_note = ""
    if data.get("crisis"):
        crisis_note = """<div class="max-w-3xl mx-auto mt-10 text-left">
      <h3 class="text-xl font-bold mb-3 meok-gold">Crisis organisation?</h3>
      <p class="text-slate-400">List your helpline, chat service, or local resources free of charge. We verify every listing and update quarterly.</p>
    </div>"""
    body = f"""{nav(nav_links)}
<section class="py-20 px-6">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-3xl font-bold mb-4">Partner with {d}</h1>
    <p class="text-slate-400 mb-10">Join referral, integration, reseller, and co-sell programmes. Commission terms are indicative pending final legal review.</p>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left mb-10">
      <div class="card"><h3 class="font-semibold meok-gold">Referral</h3><p class="text-sm text-slate-400">15-20% recurring for qualified leads.</p></div>
      <div class="card"><h3 class="font-semibold meok-gold">Integration</h3><p class="text-sm text-slate-400">Build MCP connectors and widgets.</p></div>
      <div class="card"><h3 class="font-semibold meok-gold">Reseller</h3><p class="text-sm text-slate-400">White-label and agency margin tiers.</p></div>
      <div class="card"><h3 class="font-semibold meok-gold">Co-sell</h3><p class="text-sm text-slate-400">Joint enterprise proposals with MEOK.</p></div>
    </div>
    {crisis_note}
    {partner_form(d)}
  </div>
</section>
{footer(d)}"""
    return f"<!doctype html>\n<html lang=\"en\">\n{head('Partner — ' + data['title'].split(' — ')[0], data['tagline'], base)}\n<body>\n{body}\n</body>\n</html>"

def build_enterprise(data):
    d = data["domain"]
    base = f"https://{d}/enterprise"
    nav_links = [("/", "Home"), ("/enterprise", "Enterprise")]
    for p in data["pages"]:
        if p not in ("index", "enterprise"):
            nav_links.append((f"/{p}", p.capitalize()))
    body = f"""{nav(nav_links)}
<section class="py-20 px-6">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-3xl font-bold mb-4">Enterprise procurement</h1>
    <p class="text-slate-400 mb-10">SSO, SLA, custom contracts, on-prem deployment, and dedicated support for regulated industries.</p>
    <div class="grid sm:grid-cols-2 gap-4 text-left mb-10">
      <div class="card"><h3 class="font-semibold meok-gold">Security</h3><p class="text-sm text-slate-400">SOC 2 Type II roadmap, penetration testing, role-based access.</p></div>
      <div class="card"><h3 class="font-semibold meok-gold">Data residency</h3><p class="text-sm text-slate-400">UK, EU, or dedicated region hosting.</p></div>
      <div class="card"><h3 class="font-semibold meok-gold">Custom contracts</h3><p class="text-sm text-slate-400">MSA, DPA, and procurement-friendly terms.</p></div>
      <div class="card"><h3 class="font-semibold meok-gold">Dedicated success</h3><p class="text-sm text-slate-400">Named account manager and solution architect.</p></div>
    </div>
    {contact_form(d)}
  </div>
</section>
{footer(d)}"""
    return f"<!doctype html>\n<html lang=\"en\">\n{head('Enterprise — ' + data['title'].split(' — ')[0], data['tagline'], base)}\n<body>\n{body}\n</body>\n</html>"

def build_demo(data):
    d = data["domain"]
    base = f"https://{d}/demo"
    nav_links = [("/", "Home"), ("/demo", "Demo")]
    for p in data["pages"]:
        if p not in ("index", "demo"):
            nav_links.append((f"/{p}", p.capitalize()))
    body = f"""{nav(nav_links)}
<section class="py-20 px-6">
  <div class="max-w-4xl mx-auto text-center">
    <h1 class="text-3xl font-bold mb-4">Book a demo</h1>
    <p class="text-slate-400 mb-10">See {d} in action with your own data. No sales pressure, no spam.</p>
    {contact_form(d)}
  </div>
</section>
{footer(d)}"""
    return f"<!doctype html>\n<html lang=\"en\">\n{head('Demo — ' + data['title'].split(' — ')[0], data['tagline'], base)}\n<body>\n{body}\n</body>\n</html>"

def build_docs(data):
    d = data["domain"]
    base = f"https://{d}/docs"
    nav_links = [("/", "Home"), ("/docs", "Docs")]
    for p in data["pages"]:
        if p not in ("index", "docs"):
            nav_links.append((f"/{p}", p.capitalize()))
    body = f"""{nav(nav_links)}
<section class="py-20 px-6">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-4">API & MCP documentation</h1>
    <p class="text-slate-400 mb-10">Integrate {d} via REST, MCP, or SDK.</p>
    <div class="grid sm:grid-cols-2 gap-4">
      <div class="card"><h3 class="font-semibold meok-gold">OpenAPI</h3><p class="text-sm text-slate-400"><a href="/openapi.json" class="underline">/openapi.json</a> — interactive schema coming soon.</p></div>
      <div class="card"><h3 class="font-semibold meok-gold">MCP manifest</h3><p class="text-sm text-slate-400">Install via Smithery or npx. See homepage quick-start.</p></div>
      <div class="card"><h3 class="font-semibold meok-gold">Authentication</h3><p class="text-sm text-slate-400">Bearer tokens via dashboard. SSO for enterprise.</p></div>
      <div class="card"><h3 class="font-semibold meok-gold">SDKs</h3><p class="text-sm text-slate-400">Python and Node.js clients in development.</p></div>
    </div>
    <pre class="bg-[#0f0f1a] border border-slate-800 p-4 rounded-lg mt-8 overflow-x-auto text-sm"><code>curl https://api.{d}/v1/status \\
  -H "Authorization: Bearer $OPENMOE_API_KEY"</code></pre>
  </div>
</section>
{footer(d)}"""
    return f"<!doctype html>\n<html lang=\"en\">\n{head('Docs — ' + data['title'].split(' — ')[0], data['tagline'], base)}\n<body>\n{body}\n</body>\n</html>"

def build_llms(data):
    d = data["domain"]
    lines = [
        f"# {d}",
        "",
        data["tagline"],
        "",
        f"Part of the MEOK AI Labs sovereign hive: https://meok.ai",
        "",
        "## Pages",
        f"- Home: https://{d}/",
    ]
    for p in data["pages"]:
        if p != "index":
            lines.append(f"- {p.capitalize()}: https://{d}/{p}")
    lines += ["", "## Contact", "hello@meok.ai", ""]
    return "\n".join(lines)

def build_sitemap(data):
    d = data["domain"]
    urls = []
    for p in data["pages"]:
        if p == "index":
            urls.append(f"https://{d}/")
        else:
            urls.append(f"https://{d}/{p}")
    xml = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        xml.append(f"  <url><loc>{u}</loc><lastmod>2026-06-15</lastmod></url>")
    xml.append("</urlset>")
    return "\n".join(xml)

BUILDERS = {
    "index": build_index,
    "pricing": build_pricing,
    "signup": build_signup,
    "partner": build_partner,
    "enterprise": build_enterprise,
    "demo": build_demo,
    "docs": build_docs,
}

def generate():
    for key, data in DOMAINS.items():
        deploy = os.path.join(ROOT, f"{key}-deploy")
        write_common(deploy)
        for page in data["pages"]:
            path = os.path.join(deploy, "index.html") if page == "index" else os.path.join(deploy, page, "index.html")
            write_file(path, BUILDERS[page](data))
        write_file(os.path.join(deploy, "llms.txt"), build_llms(data))
        write_file(os.path.join(deploy, "sitemap.xml"), build_sitemap(data))
        print(f"Generated {deploy}")

if __name__ == "__main__":
    generate()

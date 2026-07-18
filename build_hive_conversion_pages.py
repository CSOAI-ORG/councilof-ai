#!/usr/bin/env python3
"""Generate conversion-page static sites for Construction + Agriculture hives."""
import json
import urllib.parse
import shutil
import subprocess
from html import escape as _esc
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")

ACCENT = "#c9a84c"

DOMAINS = {
    "grabhire": {
        "domain": "grabhire.ai",
        "name": "GrabHire",
        "sector": "construction",
        "hero": "Hire verified labour & grab lorries in minutes, not days.",
        "sub": "From one-off grabs to full-site labour dispatch — instant quotes, compliant operatives, and same-day booking.",
        "features": [
            ("⚡ Instant quote", "Tell us the job size and get a fixed quote in under 60 seconds."),
            ("🛡 Verified operatives", "Every driver and labourer is CSCS/CPCS checked and insured."),
            ("📍 Same-day dispatch", "Local fleet matching means you can book for today or schedule ahead."),
            ("📑 Invoice & compliance", "Waste transfer notes, insurance certs and POs handled automatically."),
        ],
        "tiers": [
            ("Day Rate", "£250", "per day", ["1 operative + grab lorry", "8hr shift", "Digital dockets"], "Hire now"),
            ("Site Team", "£895", "per day", ["3 operatives + 2 vehicles", "Priority dispatch", "Account manager"], "Book a team"),
            ("Enterprise", "Custom", "POA", ["Dedicated fleet", "24/7 operations", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "Partner with GrabHire",
            "blurb": "Plant-hire brokers, groundworkers and construction resellers earn recurring commission by referring jobs.",
            "benefits": [
                "10–15% commission on referred hires",
                "Co-branded booking portal",
                "Real-time job tracking dashboard",
                "Monthly BACS payouts",
            ],
        },
        "enterprise": {
            "title": "GrabHire for Enterprise",
            "blurb": "National contractors and housebuilders manage labour, plant and waste through one procurement layer.",
            "benefits": [
                "Multi-site fleet allocation",
                "Purchase-order and cost-code billing",
                "HSE-ready compliance pack",
                "SSO and dedicated support",
            ],
        },
        "mcps": [
            ("muckaway-ai-mcp.quote_job", "Get instant spoil-removal quotes from any construction workflow."),
            ("planthire-ai-mcp.book_equipment", "Book excavators, dumpers and plant directly through MCP."),
        ],
    },
    "muckaway": {
        "domain": "muckaway.ai",
        "name": "MuckAway",
        "sector": "construction",
        "hero": "Instant muckaway quotes. Zero phone calls.",
        "sub": "Enter your spoil type, access and volume. We match you to the nearest licensed tipper or grab lorry — and quote in seconds.",
        "features": [
            ("🧱 Any spoil type", "Clay, hardcore, green waste, asbestos-soil — matched to the right carrier."),
            ("🚛 Real-time fleet", "See available tippers and grabs near your postcode."),
            ("♻ Eco routing", "Choose landfill diversion or recycling yard routing with CO2 estimates."),
            ("📄 Digital waste notes", "Legally compliant waste transfer notes stored in your account."),
        ],
        "tiers": [
            ("Load", "£195", "per load", ["6-wheel tipper", "Up to 8 tonnes", "Digital docket"], "Book a load"),
            ("Grab", "£395", "per load", ["8-wheel grab lorry", "Self-loading arm", "Remote site access"], "Book a grab"),
            ("Site Account", "Custom", "POA", ["Multiple daily loads", "Waste audits", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "MuckAway Partner Program",
            "blurb": "Groundworkers, demolition firms and skip brokers add muckaway to their service stack without owning wagons.",
            "benefits": [
                "10% recurring commission per load",
                "White-label quote widget",
                "Lead attribution dashboard",
                "Priority carrier allocation",
            ],
        },
        "enterprise": {
            "title": "MuckAway for Enterprise",
            "blurb": "Major civils and infrastructure projects move spoil at scale with guaranteed capacity and audit trails.",
            "benefits": [
                "Daily multi-load scheduling",
                "Waste carrier licence verification",
                "Environmental reporting pack",
                "Custom cost centres and PO matching",
            ],
        },
        "mcps": [
            ("muckaway-ai-mcp.quote_job", "Embed instant muckaway quotes in CRMs, spreadsheets or AI agents."),
        ],
    },
    "planthire": {
        "domain": "planthire.ai",
        "name": "PlantHire",
        "sector": "construction",
        "hero": "Book plant equipment on demand.",
        "sub": "Excavators, dumpers, rollers and telehandlers — live availability, operator hire, and delivery to site.",
        "features": [
            ("🔧 Live fleet", "See which machines are available now near your postcode."),
            ("👷 Operator included", "Add a CPCS operator with any machine in two clicks."),
            ("🚚 Delivery & collection", "Tracked transport to site, timed to your programme."),
            ("✅ Maintenance certs", "All LOLER / PUWERS documentation attached automatically."),
        ],
        "tiers": [
            ("Mini Digger", "£145", "per day", ["1.5 tonne micro digger", "Delivery extra", "Ideal for gardens"], "Book mini"),
            ("360 Excavator", "£295", "per day", ["13 tonne excavator", "Operator optional", "Large groundwork"], "Book excavator"),
            ("Enterprise", "Custom", "POA", ["Multi-machine account", "Cross-hire rates", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "PlantHire Partner Program",
            "blurb": "Independent hire yards, brokers and plant resellers join our network to fill idle machines.",
            "benefits": [
                "15% commission on bookings",
                "Shared availability calendar",
                "Co-branded customer portal",
                "Fleet utilisation reports",
            ],
        },
        "enterprise": {
            "title": "PlantHire for Enterprise",
            "blurb": " Contractors and developers source plant across multiple sites with one account and consolidated billing.",
            "benefits": [
                "National machine allocation",
                "Programme-level scheduling",
                "Hire-vs-buy analytics",
                "SSO, approvals and reporting",
            ],
        },
        "mcps": [
            ("planthire-ai-mcp.book_equipment", "Reserve plant directly from project-management tools or AI agents."),
        ],
    },
    "fishkeeper": {
        "domain": "fishkeeper.ai",
        "name": "FishKeeper",
        "sector": "agriculture",
        "hero": "AI health checks for every tank and pond.",
        "sub": "Upload a photo, get an instant disease diagnosis, treatment guide and water-quality action plan.",
        "features": [
            ("📸 Photo diagnosis", "fishkeeper-ai-mcp.diagnose_disease identifies symptoms and suggests treatment."),
            ("🧪 Water tracking", "Log ammonia, nitrite, nitrate and pH to spot trends before fish suffer."),
            ("💊 Treatment planner", "Step-by-step medication, dosage and quarantine guidance."),
            ("🌐 Community data", "Anonymised pond-health benchmarking across the UK."),
        ],
        "tiers": [
            ("Hobby", "£9", "per month", ["Up to 3 tanks/ponds", "5 diagnoses / month", "Email support"], "Start free trial"),
            ("Pro", "£39", "per month", ["Unlimited ponds", "Unlimited diagnoses", "WhatsApp support"], "Start free trial"),
            ("Enterprise", "Custom", "POA", ["Multi-pond farms", "Sensor integrations", "Vet referrals"], "Talk to sales"),
        ],
        "partner": {
            "title": "FishKeeper Partner Program",
            "blurb": "Aquatic retailers, vets and pond-builders recommend FishKeeper and earn recurring revenue.",
            "benefits": [
                "20% recurring commission",
                "Branded diagnosis landing page",
                "Customer referral dashboard",
                "Co-marketing support",
            ],
        },
        "enterprise": {
            "title": "FishKeeper for Enterprise",
            "blurb": "Fish farms, aquaculture research centres and public aquariums monitor health at scale.",
            "benefits": [
                "Multi-pond health dashboards",
                "IoT sensor integrations",
                "Vet-issued treatment records",
                "Compliance and welfare reports",
            ],
        },
        "mcps": [
            ("fishkeeper-ai-mcp.diagnose_disease", "Run AI disease diagnosis from any aquarium app or workflow."),
        ],
    },
    "koikeeper": {
        "domain": "koikeeper.ai",
        "name": "KoiKeeper",
        "sector": "agriculture",
        "hero": "Premium water quality & care for koi ponds.",
        "sub": "Continuous water-quality monitoring, AI disease diagnosis and seasonal care calendars for serious koi keepers.",
        "features": [
            ("💧 Live water quality", "meok-koikeeper-ai-mcp.water_quality tracks pH, KH, ammonia and temperature."),
            ("🔬 Disease scanner", "Upload photos of lesions or behaviour for AI-assisted diagnosis."),
            ("📅 Care calendar", "Seasonal feeding, filter maintenance and treatment reminders."),
            ("🚨 Smart alerts", "Get notified the moment parameters drift outside safe koi ranges."),
        ],
        "tiers": [
            ("Starter", "£12", "per month", ["1 pond", "Manual water logs", "Email alerts"], "Start free trial"),
            ("Koi Pro", "£49", "per month", ["Unlimited ponds", "IoT sensor sync", "Priority chat"], "Start free trial"),
            ("Estate", "Custom", "POA", ["Multiple estates", "On-site support", "Vet network"], "Talk to sales"),
        ],
        "partner": {
            "title": "KoiKeeper Partner Program",
            "blurb": "Koi dealers, pond builders and aquatic vets offer clients premium water monitoring and care.",
            "benefits": [
                "20% recurring commission",
                "White-label pond reports",
                "Partner badge and listings",
                "Customer success playbooks",
            ],
        },
        "enterprise": {
            "title": "KoiKeeper for Enterprise",
            "blurb": "Koi farms, estates and show venues maintain water quality across dozens of ponds with SLAs.",
            "benefits": [
                "Multi-pond SLA monitoring",
                "Sensor gateway integrations",
                "Show-ready health certificates",
                "Dedicated account manager",
            ],
        },
        "mcps": [
            ("meok-koikeeper-ai-mcp.water_quality", "Pull live water-quality telemetry into dashboards or automations."),
        ],
    },
}


# Per-sector identity: (accent, accent-2 for gradients, "r,g,b" glow for shadows/mesh).
# Drives the Tailwind `gold` token per domain so all 5 pages re-theme with zero body edits.
SECTOR_THEMES = {
    "construction": ("#f59e0b", "#fb923c", "245,158,11"),   # amber → orange
    "agriculture":  ("#10b981", "#34d399", "16,185,129"),   # emerald
    "compliance":   ("#c9a84c", "#e0c068", "201,168,76"),   # brand gold
    "governance":   ("#818cf8", "#a5b4fc", "129,140,248"),  # indigo
    "developer":    ("#22d3ee", "#67e8f9", "34,211,238"),   # cyan
    "automotive":   ("#fb7185", "#fda4af", "251,113,133"),  # rose
    "healthcare":   ("#2dd4bf", "#5eead4", "45,212,191"),   # teal
    "legal":        ("#a78bfa", "#c4b5fd", "167,139,250"),  # violet
}


def theme_for(cfg: dict):
    return SECTOR_THEMES.get(cfg.get("sector", ""), SECTOR_THEMES["compliance"])


# Static head/CSS/JS design system. Tokens are %%…%%-replaced (not f-string) so CSS
# braces stay literal and unescaped. Tailwind CDN is kept (bodies use its utilities),
# but the `gold`/`accent2` tokens + this style layer give per-sector identity, real
# type (Inter), gradient-mesh hero, gradient buttons, card elevation and scroll-reveal.
SHELL_TEMPLATE = """<!doctype html>
<html lang="en" class="scroll-smooth">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>%%TITLE%%</title>
  <meta name="description" content="%%DESC%%">
  <link rel="canonical" href="https://%%DOMAIN%%/%%PAGE%%">
  <meta name="theme-color" content="%%ACCENT%%">
  <meta property="og:type" content="website">
  <meta property="og:title" content="%%TITLE%%">
  <meta property="og:description" content="%%DESC%%">
  <meta property="og:url" content="https://%%DOMAIN%%/%%PAGE%%">
  <meta property="og:site_name" content="%%NAME%%.ai">
  <meta property="og:image" content="https://%%DOMAIN%%/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="%%TITLE%%">
  <meta name="twitter:description" content="%%DESC%%">
  <meta name="twitter:image" content="https://%%DOMAIN%%/og-image.png">
  <link rel="icon" href="data:image/svg+xml,%%FAVICON%%">
  <link rel="apple-touch-icon" href="/apple-touch-icon.svg">
  <link rel="alternate" type="application/json" href="/agent.json">
  <link rel="alternate" type="application/json" href="/.well-known/mcp.json">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: { extend: {
        colors: {
          gold: '%%ACCENT%%',
          accent2: '%%ACCENT2%%',
          slate: { 950: '#070b14', 900: '#0f172a', 850: '#111827' }
        },
        fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] }
      } }
    }
  </script>
  <style>
    :root { --accent: %%ACCENT%%; --accent2: %%ACCENT2%%; --glow: %%GLOW%%; }
    html { scroll-behavior: smooth; }
    body { font-family: 'Inter', ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; letter-spacing: -0.011em; }
    ::selection { background: rgba(var(--glow), 0.30); color: #fff; }
    h1, h2, h3 { letter-spacing: -0.025em; }
    h1 { font-size: clamp(2.2rem, 5vw, 3.6rem); line-height: 1.05; }
    .text-gold { color: var(--accent); }
    .border-gold { border-color: var(--accent); }
    .border-gold\\/40 { border-color: rgba(var(--glow), 0.40) !important; }
    .bg-gold { background-image: linear-gradient(135deg, var(--accent), var(--accent2)) !important; box-shadow: 0 10px 28px -10px rgba(var(--glow), 0.6); }
    a.bg-gold, button.bg-gold { transition: transform .2s ease, filter .2s ease, box-shadow .2s ease; }
    a.bg-gold:hover, button.bg-gold:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 16px 36px -12px rgba(var(--glow), 0.75); }
    .gradient-radial {
      background:
        radial-gradient(60rem 38rem at 50% -12%, rgba(var(--glow), 0.18), transparent 60%),
        radial-gradient(42rem 30rem at 88% 6%, rgba(var(--glow), 0.10), transparent 55%),
        radial-gradient(34rem 30rem at 6% 22%, rgba(255,255,255,0.03), transparent 55%);
    }
    nav { position: sticky; top: 0; z-index: 50; backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); background: rgba(7,11,20,0.72); transition: box-shadow .25s ease; }
    .rounded-2xl { transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease; }
    .rounded-2xl:hover { transform: translateY(-3px); box-shadow: 0 20px 44px -26px rgba(var(--glow), 0.55); }
    .eyebrow { display: inline-flex; align-items: center; gap: .5rem; padding: .35rem .85rem; border-radius: 999px;
      font-size: .76rem; font-weight: 600; letter-spacing: .05em; text-transform: uppercase;
      color: var(--accent); background: rgba(var(--glow), 0.10); border: 1px solid rgba(var(--glow), 0.28); }
    .has-js section { opacity: 0; transform: translateY(18px); }
    .has-js section.seen { opacity: 1; transform: none; transition: opacity .6s ease, transform .6s ease; }
    @media (prefers-reduced-motion: reduce) {
      .has-js section { opacity: 1 !important; transform: none !important; }
      html { scroll-behavior: auto; }
    }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 antialiased">
  <div class="gradient-radial">
    <nav class="border-b border-slate-800">
      <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" class="text-2xl font-extrabold tracking-tight">%%NAME%%<span class="text-gold">.ai</span></a>
        <div class="hidden md:flex items-center gap-6">
          %%NAVLINKS%%
          <a href="/signup/" class="bg-gold text-slate-950 px-4 py-2 rounded-lg font-semibold">Get started</a>
        </div>
        <button id="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu"
          class="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-slate-700 text-slate-100 hover:border-gold hover:text-gold transition">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </div>
      <div id="mobile-menu" class="md:hidden hidden border-t border-slate-800 px-6 py-4 flex-col gap-3">
        %%NAVLINKS%%
        <a href="/signup/" class="mt-1 bg-gold text-slate-950 px-4 py-2.5 rounded-lg font-semibold text-center">Get started</a>
      </div>
    </nav>

    %%BODY%%

    <footer class="border-t border-slate-800 mt-20">
      <div class="max-w-6xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-8 text-sm text-slate-400">
        <div>
          <p class="text-lg font-bold text-slate-100">%%NAME%%<span class="text-gold">.ai</span></p>
          <p class="mt-2">Part of MEOK AI Labs — CSOAI Ltd, UK 16939677.</p>
        </div>
        <div class="flex flex-col gap-2">
          <a href="/pricing/" class="hover:text-gold">Pricing</a>
          <a href="/partner/" class="hover:text-gold">Partners</a>
          <a href="/enterprise/" class="hover:text-gold">Enterprise</a>
          <a href="/signup/" class="hover:text-gold">Sign up</a>
        </div>
        <div>
          <p>hello@meok.ai</p>
          <p class="mt-2">100% Nick Templeman · Sovereign UK infrastructure.</p>
        </div>
      </div>
      <div class="max-w-6xl mx-auto px-6 pb-3 text-xs text-slate-500">
        <span class="text-slate-400 font-semibold">CSOAI Hive:</span>
        <a href="https://csoai.org" class="hover:text-gold ml-1">csoai.org</a> ·
        <a href="https://grabhire.ai" class="hover:text-gold">grabhire</a> ·
        <a href="https://fishkeeper.ai" class="hover:text-gold">fishkeeper</a> ·
        <a href="https://koikeeper.ai" class="hover:text-gold">koikeeper</a> ·
        <a href="https://optimobile.ai" class="hover:text-gold">optimobile</a> ·
        <a href="https://landlaw.ai" class="hover:text-gold">landlaw</a>
      </div>
      <div class="max-w-6xl mx-auto px-6 pb-8 text-xs text-slate-500 flex flex-wrap gap-4">
        <a href="https://meok.ai/privacy" class="hover:text-gold">Privacy</a>
        <a href="https://meok.ai/terms" class="hover:text-gold">Terms</a>
        <a href="https://meok.ai/cookies" class="hover:text-gold">Cookies</a>
        <span>© 2026 %%NAME%%.ai</span>
      </div>
    </footer>
  </div>
  <script>
    document.documentElement.classList.add('has-js');
    (function () {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } });
      }, { threshold: 0.08 });
      document.querySelectorAll('section').forEach(function (s) { io.observe(s); });
      var nav = document.querySelector('nav');
      if (nav) addEventListener('scroll', function () {
        nav.style.boxShadow = scrollY > 8 ? '0 1px 0 rgba(255,255,255,0.06)' : 'none';
      }, { passive: true });
      var mb = document.getElementById('menu-btn'), mm = document.getElementById('mobile-menu');
      if (mb && mm) mb.addEventListener('click', function () {
        var open = mm.classList.toggle('hidden') === false;
        mm.classList.toggle('flex', open);
        mb.setAttribute('aria-expanded', open ? 'true' : 'false');
        mb.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
    })();
  </script>
</body>
</html>
"""


def jsonld_blocks(cfg: dict, page: str, title: str, description: str) -> str:
    """Build Organization + FAQPage JSON-LD for a page.

    Uses only variables the generator already has on every domain config
    (name, domain, features). FAQPage is derived from the domain's feature
    list (title → question, description → answer); if a domain somehow has
    no features, only the Organization block is emitted. Returns a string of
    one or two <script type="application/ld+json"> blocks ready to drop in
    just before </head>. json.dumps keeps it valid + properly escaped.
    """
    domain = cfg["domain"]
    name = cfg["name"]
    page_path = f"/{page}" if page else "/"
    org = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": f"{name}.ai",
        "url": f"https://{domain}",
        "logo": f"https://{domain}/favicon.svg",
        "description": description,
    }
    blocks = [
        '<script type="application/ld+json">'
        + json.dumps(org, ensure_ascii=False)
        + "</script>"
    ]
    features = cfg.get("features") or []
    if features:
        faq = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "url": f"https://{domain}{page_path}",
            "name": title,
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": str(f[0]),
                    "acceptedAnswer": {"@type": "Answer", "text": str(f[1])},
                }
                for f in features
            ],
        }
        blocks.append(
            '<script type="application/ld+json">'
            + json.dumps(faq, ensure_ascii=False)
            + "</script>"
        )
    return "\n  ".join(blocks)


def shell(domain_key: str, page: str, title: str, description: str, body: str) -> str:
    cfg = DOMAINS[domain_key]
    domain = cfg["domain"]
    name = cfg["name"]
    accent, accent2, glow = theme_for(cfg)
    nav_links = "".join(
        f'<a href="/{p}/" class="text-sm font-medium text-slate-300 hover:text-gold transition">{p.capitalize()}</a>'
        for p in ["pricing", "partner", "enterprise", "signup"]
    )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        f'<rect width="64" height="64" rx="14" fill="{accent}"/>'
        f'<text x="32" y="45" font-family="Inter,Arial,sans-serif" font-size="38" '
        f'font-weight="800" text-anchor="middle" fill="#070b14">{name[0]}</text></svg>'
    )
    favicon = urllib.parse.quote(svg, safe="")
    html = SHELL_TEMPLATE
    for token, value in (
        ("%%FAVICON%%", favicon), ("%%NAVLINKS%%", nav_links), ("%%BODY%%", body),
        ("%%TITLE%%", title), ("%%DESC%%", description), ("%%DOMAIN%%", domain),
        ("%%PAGE%%", page), ("%%NAME%%", name),
        ("%%ACCENT2%%", accent2), ("%%ACCENT%%", accent), ("%%GLOW%%", glow),
    ):
        html = html.replace(token, value)
    # Inject Organization + FAQPage JSON-LD just before </head>. Idempotency
    # guard: skip if any ld+json is already present so re-runs / future template
    # edits never double-inject. This is what stops the SEO/AEO regression where
    # regenerating pages used to strip the schema.
    if "application/ld+json" not in html:
        ld = jsonld_blocks(cfg, page, title, description)
        html = html.replace("</head>", f"  {ld}\n</head>", 1)
    return html


def cta_section(domain_key: str, primary_text: str = "Get started", secondary_text: str = "Talk to sales") -> str:
    cfg = DOMAINS[domain_key]
    return f"""
    <section class="max-w-4xl mx-auto px-6 py-16 text-center">
      <h2 class="text-3xl md:text-4xl font-bold">Ready to make {cfg['name']} work for you?</h2>
      <p class="mt-4 text-slate-400">Start a free trial, request a demo, or apply to become a partner.</p>
      <div class="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/signup/" class="bg-gold text-slate-950 px-8 py-3 rounded-xl font-bold text-lg hover:bg-gold-dark transition">{primary_text}</a>
        <a href="/enterprise/" class="border border-slate-600 text-slate-100 px-8 py-3 rounded-xl font-semibold hover:border-gold hover:text-gold transition">{secondary_text}</a>
      </div>
    </section>
    """


# Rich per-domain interactive demo samples, ABSORBED from the now-deprecated
# scripts/generate-compliance-deploys.py (its one genuine strength). Each entry
# is a list of (sample_input, simulated_result). index_page() renders these as a
# dropdown when present, else falls back to the generic free-text demo.
HIVE_DEMOS = {
    "safetyof": [
        ("customer-facing chatbot", "Safety posture: PARTIAL — prompt-injection firewall recommended. OWASP LLM01 risk detected."),
        ("internal copilot", "Safety posture: STRONG — limited external surface. Enable audit logging for insider risk."),
        ("agent orchestration platform", "Safety posture: AT RISK — multi-agent boundaries need runtime policy enforcement."),
        ("foundation model API", "Safety posture: AT RISK — high scrutiny under EU AI Act GPAI requirements."),
    ],
    "transparencyof": [
        ("Generated quarterly report summary", "C2PA manifest embedded. Signature: 0x7a3f…e9d2. Verification URL: /verify/0x7a3f"),
        ("AI-generated product image", "Invisible watermark applied + C2PA provenance. Article 50 transparency satisfied."),
    ],
    "accountabilityof": [
        ("credit-decision-2026-06-15-001", "Decision logged. Hash: sha256:9c2b…1a4f. Attestation: sig_v1_2026_06_15"),
        ("agent-handoff support→billing", "Handoff recorded with tamper-evident chain. EU AI Act Art 12 + DORA Art 17 satisfied."),
    ],
    "biasdetectionof": [
        ("recruitment, gender+age", "Disparate impact ratio: 0.78 (threshold 0.80). Recommend stratified re-sampling."),
        ("lending, ethnicity+postcode", "Proxy correlation detected: postcode → ethnicity (r=0.64). Review feature engineering."),
        ("healthcare, disability+age", "No significant disparity found. Continue monitoring production drift."),
    ],
    "dataprivacyof": [
        ("training on personal data", "Lawful basis: likely Legitimate Interest + DPIA required. Art 35 GDPR triggered."),
        ("automated decision-making", "Art 22 GDPR check required. Provide a meaningful human-review mechanism."),
        ("third-country transfer", "Transfer impact assessment + SCCs + supplementary measures required."),
    ],
    "ethicalgovernanceof": [
        ("EU AI Act", "Crosswalk complete: 42 controls mapped to ISO/IEC 42001, NIST AI RMF, UK AI Bill."),
        ("ISO/IEC 42001", "Crosswalk complete: 37 AIMS clauses mapped to EU AI Act obligations."),
        ("NIST AI RMF", "Crosswalk complete: Govern/Map/Measure/Manage mapped to EU AI Act articles."),
        ("UK AI Bill", "Crosswalk complete: 9 regulator principles mapped to EU AI Act + CSOAI commitments."),
    ],
}


def index_page(domain_key: str) -> str:
    cfg = DOMAINS[domain_key]
    features = "".join(
        f"""<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 hover:border-gold/40 transition">
          <h3 class="text-xl font-bold text-gold">{f[0]}</h3>
          <p class="mt-3 text-slate-400">{f[1]}</p>
        </div>"""
        for f in cfg["features"]
    )
    mcp_cards = "".join(
        f"""<div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <code class="text-gold font-mono text-sm">{m[0]}</code>
          <p class="mt-2 text-slate-400">{m[1]}</p>
        </div>"""
        for m in cfg["mcps"]
    )
    demo_tool = cfg["mcps"][0][0] if cfg.get("mcps") else f"{domain_key}-mcp.run"
    samples = HIVE_DEMOS.get(domain_key)
    if samples:
        # Rich demo: dropdown of curated inputs → specific simulated results.
        options = "".join(f'<option value="{inp}">{inp}</option>' for inp, _ in samples)
        results_js = ",".join(f'{json.dumps(inp)}: {json.dumps(res)}' for inp, res in samples)
        demo_control = f"""<label for="mcp-input" class="sr-only">Sample input for the {demo_tool} demo</label><select id="mcp-input" aria-label="Sample input for the {demo_tool} demo" class="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 focus:border-gold focus:outline-none">{options}</select>"""
        demo_results = f"var RESULTS = {{{results_js}}};"
        result_expr = "RESULTS[val] || ('Scan complete — no issues flagged in demo mode.')"
    else:
        demo_control = """<label for="mcp-input" class="sr-only">Sample input for the demo</label><input id="mcp-input" type="text" aria-label="Sample input for the demo" class="w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 text-slate-100 focus:border-gold focus:outline-none" placeholder="Enter a sample input…">"""
        demo_results = ""
        result_expr = f"'Scan complete — {cfg['name']} processed your input in demo mode. Sign up to run it for real against your data.'"
    demo_section = f"""
    <section class="max-w-6xl mx-auto px-6 py-16 border-y border-slate-800">
      <div class="grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 class="text-2xl md:text-3xl font-bold mb-4">Try <code class="text-gold font-mono">{demo_tool}</code></h2>
          <p class="text-slate-400 mb-6">No installation required. This simulates the MCP tool call and shows the kind of output you can surface inside Claude, Cursor, Kimi or any A2A client.</p>
          <ul class="space-y-3 text-sm text-slate-400">
            <li class="flex items-start gap-2"><span class="text-gold">✓</span> Open-source MCP server</li>
            <li class="flex items-start gap-2"><span class="text-gold">✓</span> Local-first — no data leaves your machine</li>
            <li class="flex items-start gap-2"><span class="text-gold">✓</span> Signed audit trail on Pro+</li>
          </ul>
        </div>
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8">
          {demo_control}
          <button onclick="runDemo()" class="mt-4 w-full px-5 py-3 rounded-lg bg-gold text-slate-950 font-bold hover:bg-gold-dark transition">Run {demo_tool}</button>
          <div id="mcp-output" class="mt-5 hidden rounded-xl bg-black/40 border border-slate-800 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap"></div>
        </div>
      </div>
      <script>
        function runDemo() {{
          var el = document.getElementById('mcp-input');
          var val = (el.value || '').trim();
          var out = document.getElementById('mcp-output');
          out.classList.remove('hidden');
          if (!val) {{ out.textContent = 'Please choose or enter a value first.'; return; }}
          {demo_results}
          out.innerHTML = '<span class="text-gold">→ Calling {demo_tool}…</span>\\n'
            + 'argument: "' + val.replace(/"/g, '&quot;') + '"\\n'
            + 'status: ok\\n'
            + 'result_preview: ' + ({result_expr});
        }}
      </script>
    </section>
"""
    body = f"""
    <section class="max-w-6xl mx-auto px-6 pt-16 pb-12 text-center">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-semibold tracking-wide uppercase">
        AI-powered · MCP-ready · UK-built
      </div>
      <h1 class="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight">{cfg['hero']}</h1>
      <p class="mt-6 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">{cfg['sub']}</p>
      <div class="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/pricing/" class="bg-gold text-slate-950 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gold-dark transition">See pricing</a>
        <a href="/signup/" class="border border-slate-600 text-slate-100 px-8 py-4 rounded-xl font-semibold hover:border-gold hover:text-gold transition">Start free trial</a>
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-6 py-16">
      <h2 class="text-2xl md:text-3xl font-bold text-center mb-10">Built for speed, compliance and scale</h2>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features}
      </div>
    </section>

    <section class="max-w-6xl mx-auto px-6 py-16">
      <div class="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12">
        <div class="md:flex md:items-center md:justify-between gap-8">
          <div class="md:w-2/3">
            <h2 class="text-2xl md:text-3xl font-bold">Connect via MCP</h2>
            <p class="mt-4 text-slate-400">{cfg['name']} exposes its flagship tools as Model Context Protocol servers — call them directly from any MCP client, agent or workflow.</p>
          </div>
          <div class="md:w-1/3 mt-6 md:mt-0">
            <a href="/enterprise/" class="block text-center bg-gold text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-gold-dark transition">Request MCP access</a>
          </div>
        </div>
        <div class="grid md:grid-cols-2 gap-6 mt-10">
          {mcp_cards}
        </div>
      </div>
    </section>

    {demo_section}

    {cta_section(domain_key)}
    """
    return shell(domain_key, "", f"{cfg['name']} — {cfg['hero']}", cfg['sub'], body)


def pricing_page(domain_key: str) -> str:
    cfg = DOMAINS[domain_key]
    cards = "".join(
        f"""<div class="{'border-gold ring-1 ring-gold' if i==1 else 'border-slate-800'} bg-slate-900 border rounded-2xl p-8 flex flex-col">
          <p class="text-sm font-semibold text-gold uppercase tracking-wide">{t[0]}</p>
          <div class="mt-4 flex items-baseline gap-1">
            <span class="text-4xl font-extrabold">{t[1]}</span>
            <span class="text-slate-400">{t[2]}</span>
          </div>
          <ul class="mt-6 space-y-3 text-slate-300 flex-1">
            {''.join(f'<li class="flex gap-2"><span class="text-gold">✓</span><span>{item}</span></li>' for item in t[3])}
          </ul>
          <a href="/signup/" class="mt-8 block text-center bg-gold text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-gold-dark transition">{t[4]}</a>
        </div>"""
        for i, t in enumerate(cfg["tiers"])
    )
    body = f"""
    <section class="max-w-6xl mx-auto px-6 pt-16 pb-8 text-center">
      <h1 class="text-4xl md:text-5xl font-extrabold">Simple, transparent pricing</h1>
      <p class="mt-4 text-lg text-slate-400">Start small, scale as your operation grows.</p>
    </section>
    <section class="max-w-5xl mx-auto px-6 py-10">
      <div class="grid md:grid-cols-3 gap-6">
        {cards}
      </div>
      <p class="mt-8 text-center text-sm text-slate-500">All prices exclude VAT. Enterprise plans include dedicated onboarding and MCP access.</p>
    </section>
    {cta_section(domain_key, "Sign up now", "Become a partner")}
    """
    return shell(domain_key, "pricing", f"Pricing — {cfg['name']}", f"Transparent pricing for {cfg['name']}.ai. Instant quotes, flexible tiers and enterprise procurement.", body)


def form_html(action: str, fields: list, submit: str) -> str:
    inputs = ""
    for label, name, type_, placeholder in fields:
        if type_ == "select":
            opts = "".join(f'<option>{o}</option>' for o in placeholder)
            inputs += f"""<label class="block text-sm font-medium text-slate-300">{label}
              <select name="{name}" class="mt-1 block w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 focus:border-gold focus:ring-gold">
                {opts}
              </select>
            </label>"""
        else:
            inputs += f"""<label class="block text-sm font-medium text-slate-300">{label}
              <input type="{type_}" name="{name}" placeholder="{placeholder}" class="mt-1 block w-full rounded-lg bg-slate-950 border border-slate-700 px-4 py-3 focus:border-gold focus:ring-gold" required>
            </label>"""
    return f"""
    <form action="{action}" method="post" enctype="text/plain" class="space-y-5" onsubmit="this.action='mailto:hello@meok.ai?subject='+encodeURIComponent('New {submit} submission from '+this.email.value)+'&body='+encodeURIComponent(Array.from(new FormData(this)).map(([k,v])=>k+': '+v).join('\\n')); return true;">
      {inputs}
      <button type="submit" class="w-full bg-gold text-slate-950 px-6 py-3 rounded-xl font-bold hover:bg-gold-dark transition">{submit}</button>
      <p class="text-xs text-slate-500">We will reply within one business day. No spam, no real charges until the flow is tested.</p>
    </form>
    """


def signup_page(domain_key: str) -> str:
    cfg = DOMAINS[domain_key]
    body = f"""
    <section class="max-w-xl mx-auto px-6 pt-16 pb-8">
      <h1 class="text-3xl md:text-4xl font-extrabold text-center">Start your {cfg['name']} account</h1>
      <p class="mt-4 text-center text-slate-400">Enter your details and we will set up your trial or enterprise demo.</p>
      <div class="mt-10 bg-slate-900 border border-slate-800 rounded-2xl p-8">
        {form_html('#', [
            ('Full name', 'name', 'text', 'Your name'),
            ('Work email', 'email', 'email', 'you@company.com'),
            ('Company / site name', 'company', 'text', 'Acme Construction Ltd'),
            ('Phone', 'phone', 'tel', '+44 7700 000000'),
            ('Plan', 'plan', 'select', ['Starter / Day rate', 'Pro / Site team', 'Enterprise']),
        ], 'Create account')}
      </div>
    </section>
    """
    return shell(domain_key, "signup", f"Sign up — {cfg['name']}", f"Create a {cfg['name']}.ai account. Free trial, enterprise demo and partner applications.", body)


def partner_page(domain_key: str) -> str:
    cfg = DOMAINS[domain_key]
    benefits = "".join(f"<li class='flex gap-3'><span class='text-gold font-bold'>✓</span><span>{b}</span></li>" for b in cfg["partner"]["benefits"])
    body = f"""
    <section class="max-w-6xl mx-auto px-6 pt-16 pb-8 md:flex md:gap-12">
      <div class="md:w-1/2">
        <h1 class="text-4xl md:text-5xl font-extrabold">{cfg['partner']['title']}</h1>
        <p class="mt-6 text-lg text-slate-400">{cfg['partner']['blurb']}</p>
        <ul class="mt-8 space-y-4 text-slate-300">
          {benefits}
        </ul>
      </div>
      <div class="md:w-1/2 mt-10 md:mt-0">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 class="text-2xl font-bold mb-6">Apply now</h2>
          {form_html('#', [
              ('Full name', 'name', 'text', 'Your name'),
              ('Work email', 'email', 'email', 'you@company.com'),
              ('Company', 'company', 'text', 'Your company'),
              ('Website', 'website', 'url', 'https://example.com'),
              ('Partner type', 'type', 'select', ['Referrer / Affiliate', 'Reseller', 'Integration partner', 'Hire yard / Supplier']),
          ], 'Apply to partner')}
        </div>
      </div>
    </section>
    {cta_section(domain_key, "Join partner program", "View pricing")}
    """
    return shell(domain_key, "partner", f"Partner program — {cfg['name']}", f"Become a {cfg['name']}.ai partner. Commissions, co-branding and referral dashboards.", body)


def enterprise_page(domain_key: str) -> str:
    cfg = DOMAINS[domain_key]
    benefits = "".join(f"<li class='flex gap-3'><span class='text-gold font-bold'>✓</span><span>{b}</span></li>" for b in cfg["enterprise"]["benefits"])
    body = f"""
    <section class="max-w-6xl mx-auto px-6 pt-16 pb-8 md:flex md:gap-12">
      <div class="md:w-1/2">
        <h1 class="text-4xl md:text-5xl font-extrabold">{cfg['enterprise']['title']}</h1>
        <p class="mt-6 text-lg text-slate-400">{cfg['enterprise']['blurb']}</p>
        <ul class="mt-8 space-y-4 text-slate-300">
          {benefits}
        </ul>
      </div>
      <div class="md:w-1/2 mt-10 md:mt-0">
        <div class="bg-slate-900 border border-slate-800 rounded-2xl p-8">
          <h2 class="text-2xl font-bold mb-6">Request a demo</h2>
          {form_html('#', [
              ('Full name', 'name', 'text', 'Your name'),
              ('Work email', 'email', 'email', 'you@company.com'),
              ('Company', 'company', 'text', 'Your company'),
              ('Number of sites / ponds', 'sites', 'text', 'e.g. 12'),
              ('What are you solving?', 'details', 'text', 'Tell us briefly'),
          ], 'Request demo')}
        </div>
      </div>
    </section>
    {cta_section(domain_key, "Get enterprise pricing", "View partner program")}
    """
    return shell(domain_key, "enterprise", f"Enterprise — {cfg['name']}", f"Enterprise procurement, fleet management and multi-site {cfg['name']}.ai deployment.", body)


VERCEL_JSON = """{
  "outputDirectory": ".",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {"key": "X-Content-Type-Options", "value": "nosniff"},
        {"key": "X-Frame-Options", "value": "SAMEORIGIN"}
      ]
    }
  ]
}
"""

ROBOTS_TXT = "User-agent: *\nAllow: /\nSitemap: https://placeholder/sitemap.xml\n"

_PAGES = ["", "pricing", "signup", "partner", "enterprise"]


def og_image_svg(cfg: dict) -> str:
    """1200x630 branded social card (SVG; rasterised to PNG in write_site)."""
    accent, accent2, _ = theme_for(cfg)
    name = _esc(cfg["name"])
    hero = _esc(cfg["hero"][:60])
    sub = _esc(cfg["sub"][:90])
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">'
        '<rect width="1200" height="630" fill="#070b14"/>'
        f'<rect width="1200" height="10" fill="{accent}"/>'
        f'<text x="80" y="250" font-family="Inter,Arial,sans-serif" font-size="84" font-weight="900" fill="{accent}">{name}.ai</text>'
        f'<text x="80" y="330" font-family="Inter,Arial,sans-serif" font-size="34" font-weight="600" fill="#e2e8f0">{hero}</text>'
        f'<text x="80" y="400" font-family="Inter,Arial,sans-serif" font-size="24" fill="#94a3b8">{sub}</text>'
        '<text x="80" y="560" font-family="Inter,Arial,sans-serif" font-size="22" font-weight="700" fill="#64748b">Part of the CSOAI Hive — EU AI Act compliant MCP tools</text>'
        "</svg>"
    )


def apple_icon_svg(cfg: dict) -> str:
    accent, _, _ = theme_for(cfg)
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 180 180">'
        f'<rect width="180" height="180" rx="38" fill="{accent}"/>'
        f'<text x="90" y="126" font-family="Inter,Arial,sans-serif" font-size="104" font-weight="800" '
        f'text-anchor="middle" fill="#070b14">{cfg["name"][0]}</text></svg>'
    )


def llms_txt(cfg: dict) -> str:
    d, name = cfg["domain"], cfg["name"]
    tools = "\n".join(f"- {t}: {desc}" for t, desc in cfg.get("mcps", []))
    return (
        f"# {name} ({d})\n\n> {cfg['hero']}\n\n{cfg['sub']}\n\n"
        f"## What this is\n{name} is a vertical in the CSOAI Hive — EU AI Act / NIS2 / DORA "
        f"compliant tooling exposed as Model Context Protocol (MCP) servers callable by any AI agent.\n\n"
        f"## MCP tools\n{tools or '- See https://csoai.org/.well-known/mcp.json'}\n\n"
        f"## Discovery\n- Agent card: https://{d}/agent.json\n- MCP catalog: https://{d}/.well-known/mcp.json\n"
        f"- Sitemap: https://{d}/sitemap.xml\n- Hive registry: https://csoai.org (271 published MCP servers)\n\n"
        f"## Pricing\nSee https://{d}/pricing/\n"
    )


def agent_json(cfg: dict) -> dict:
    d, name = cfg["domain"], cfg["name"]
    return {
        "schema_version": "1.0",
        "name": f"{name} Agent",
        "description": cfg["hero"],
        "url": f"https://{d}",
        "provider": {"organization": "Council for the Safety of AI (CSOAI)", "url": "https://csoai.org"},
        "capabilities": {"streaming": False, "mcp": True, "a2a": True},
        "skills": [{"id": t.split(".")[-1], "name": t, "description": desc} for t, desc in cfg.get("mcps", [])],
        "endpoints": {
            "a2a": f"https://{d}/a2a",
            "mcp_catalog": f"https://{d}/.well-known/mcp.json",
        },
        "sector": cfg.get("sector", ""),
    }


def mcp_json(cfg: dict) -> dict:
    d, name = cfg["domain"], cfg["name"]
    return {
        "schema_version": "2025-06",
        "publisher": {"name": "CSOAI Hive", "legal_entity": "MEOK AI LTD", "url": "https://csoai.org"},
        "site": {"name": name, "domain": d, "sector": cfg.get("sector", "")},
        "registry": "https://csoai.org/.well-known/mcp.json",
        "published_mcp_servers_total": 271,
        "servers": [
            {
                "name": t.split(".")[0],
                "tool": t,
                "description": desc,
                "endpoint": f"https://{d}/mcp/{t.split('.')[0]}",
                "tier": "vertical",
            }
            for t, desc in cfg.get("mcps", [])
        ],
    }


def sitemap_xml(cfg: dict) -> str:
    d = cfg["domain"]
    urls = "".join(
        f"  <url><loc>https://{d}/{p}{'/' if p else ''}</loc><changefreq>weekly</changefreq></url>\n"
        for p in _PAGES
    )
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">\n'
        f"{urls}</urlset>\n"
    )


def write_site(key: str):
    cfg = DOMAINS[key]
    base = ROOT / f"{key}-deploy"
    base.mkdir(exist_ok=True)
    pages = {
        "index.html": index_page(key),
        "pricing/index.html": pricing_page(key),
        "signup/index.html": signup_page(key),
        "partner/index.html": partner_page(key),
        "enterprise/index.html": enterprise_page(key),
    }
    for path, html in pages.items():
        target = base / path
        target.parent.mkdir(exist_ok=True)
        target.write_text(html, encoding="utf-8")
    (base / "vercel.json").write_text(VERCEL_JSON, encoding="utf-8")
    (base / "robots.txt").write_text(ROBOTS_TXT.replace("placeholder", cfg["domain"]), encoding="utf-8")
    # --- Layer-0 / AEO-GEO machine-discovery surface ---
    (base / "sitemap.xml").write_text(sitemap_xml(cfg), encoding="utf-8")
    (base / "llms.txt").write_text(llms_txt(cfg), encoding="utf-8")
    (base / "og-image.svg").write_text(og_image_svg(cfg), encoding="utf-8")
    (base / "apple-touch-icon.svg").write_text(apple_icon_svg(cfg), encoding="utf-8")
    # Rasterise to PNG (social scrapers don't render SVG og-images) when rsvg-convert exists.
    if shutil.which("rsvg-convert"):
        subprocess.run(["rsvg-convert", "-w", "1200", "-h", "630",
                        str(base / "og-image.svg"), "-o", str(base / "og-image.png")], check=False)
        subprocess.run(["rsvg-convert", "-w", "180", "-h", "180",
                        str(base / "apple-touch-icon.svg"), "-o", str(base / "apple-touch-icon.png")], check=False)
    wk = base / ".well-known"
    wk.mkdir(exist_ok=True)
    ac = json.dumps(agent_json(cfg), indent=2)
    (base / "agent.json").write_text(ac, encoding="utf-8")          # root mirror (fixes /agent.json 404)
    (wk / "agent.json").write_text(ac, encoding="utf-8")
    (wk / "mcp.json").write_text(json.dumps(mcp_json(cfg), indent=2), encoding="utf-8")
    print(f"Wrote {base} ({len(pages)} pages + Layer-0: sitemap/llms/agent.json/mcp.json/og-image)")


# Merge in extra hive clusters (compliance / governance / verticals) authored
# as separate modules so each cluster can be edited without touching this file.
for _mod in ("hive_extra_compliance", "hive_extra_governance", "hive_extra_verticals"):
    try:
        _m = __import__(_mod)
        DOMAINS.update(_m.DOMAINS_EXTRA)
    except Exception as _e:  # noqa: BLE001
        print(f"WARN: could not load {_mod}: {_e}")


if __name__ == "__main__":
    for key in DOMAINS:
        write_site(key)
    print(f"Done. {len(DOMAINS)} hive sites generated. Ready for deployment.")

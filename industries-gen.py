#!/usr/bin/env python3
"""
MEOK industry vertical page generator.
Generates 8 industry landing pages for meok.ai/industries/
Each page has: hero, industry-specific Article 50 hook, 3 case study cards,
3 MCP tools, 3 pricing tiers, CTA, MEOK portfolio footer.
"""
import os
import json
from datetime import datetime, timezone

INDUSTRIES = {
    "fintech": {
        "title": "MEOK for Fintech",
        "subtitle": "Article 50 + DORA + FCA compliance for credit, AML, KYC, payments AI",
        "t_subtitle": "Fintech AI compliance — Article 50 + DORA + FCA SYSC 8 + UK AI Bill",
        "deadline_count": 49,
        "deadline_label": "days to EU AI Act Article 50",
        "hero": "Credit scoring, AML monitoring, KYC, payments AI — all in scope. MEOK's 32-server compliance fleet gets you from 'we know we're in scope' to a regulator-grade signed attestation in 4 working days.",
        "top_obligations": [
            "EU AI Act Article 6 + Annex III (3) — credit scoring = high-risk",
            "DORA Article 17 — ICT incident reporting",
            "FCA SYSC 8 — operational resilience for AI",
            "UK AI Bill — frontier model + AISI sharing",
        ],
        "case_studies": [
            {"industry": "UK Challenger Bank", "result": "4-day Article 50 audit. Saved £165K vs Big-4 quote.", "cta": "Read the case study"},
            {"industry": "UK RegTech", "result": "Multi-tenant DORA + GDPR + EU AI Act signed cert.", "cta": "Read the case study"},
            {"industry": "EU payments", "result": "Adyen + Stripe + Coinbase attestation pipeline.", "cta": "Read the case study"},
        ],
        "tools": [
            {"name": "eu-ai-act-compliance-mcp", "desc": "Risk classification, 42-pt audit, Annex IV docs"},
            {"name": "dora-compliance-mcp", "desc": "5 pillars audit, ICT incident classification"},
            {"name": "agent-commerce-protocol-mcp", "desc": "ACP + AP2 + x402 protocol bridges for agent payments"},
        ],
        "cta": "Buy the Fintech Compliance Pack →",
    },
    "healthtech": {
        "title": "MEOK for Healthtech",
        "subtitle": "Article 50 + SaMD + HIPAA + FDA AI/ML + WHO compliance for medical AI",
        "t_subtitle": "Healthtech AI compliance — Article 50 + SaMD + HIPAA + FDA AI/ML",
        "deadline_count": 49,
        "deadline_label": "days to EU AI Act Article 50",
        "hero": "Symptom checkers, telemedicine triage, drug discovery, clinical trial AI — all in scope. MEOK signs a regulator-grade attestation across EU MDR + FDA + HIPAA + Article 50 in days, not months.",
        "top_obligations": [
            "EU AI Act Annex III (5) — medical device AI = high-risk",
            "EU MDR — Medical Device Regulation",
            "FDA AI/ML SaMD — Software as a Medical Device guidance",
            "HIPAA — PHI handling, BAA generator",
        ],
        "case_studies": [
            {"industry": "UK Telemedicine", "result": "Symptom checker classified Annex III (5) + signed Article 50 cert.", "cta": "Read the case study"},
            {"industry": "EU MedTech scaleup", "result": "EU MDR + FDA AI/ML crosswalk in 2 weeks.", "cta": "Read the case study"},
            {"industry": "US Health Insurer", "result": "HIPAA + GINA compliance attestation for risk-adjustment AI.", "cta": "Read the case study"},
        ],
        "tools": [
            {"name": "eu-ai-act-compliance-mcp", "desc": "Medical device AI risk classification + 42-pt audit"},
            {"name": "fda-samd-mcp", "desc": "SaMD classification + FDA AI/ML documentation"},
            {"name": "hipaa-compliance-mcp", "desc": "HIPAA safeguards + PHI handling + BAA generator"},
        ],
        "cta": "Buy the Healthtech Compliance Pack →",
    },
    "hrtech": {
        "title": "MEOK for HR-Tech",
        "subtitle": "Article 50 + NYC LL144 + EU Platform Work + UK Employment Rights compliance for hiring AI",
        "t_subtitle": "HR-tech AI compliance — Article 50 + NYC LL144 + EU Platform Work Directive",
        "deadline_count": 49,
        "deadline_label": "days to EU AI Act Article 50",
        "hero": "CV screening, candidate matching, performance AI — every UK HR-tech with EU enterprise pipeline is in scope. MEOK gives you a signed cert your customers' procurement teams verify with a single curl.",
        "top_obligations": [
            "EU AI Act Annex III (4) — recruitment AI = high-risk",
            "NYC Local Law 144 — automated employment decision tools",
            "EU Platform Work Directive — algorithmic management",
            "UK Employment Rights Bill — AI in workplace",
        ],
        "case_studies": [
            {"industry": "UK HR-tech scaleup", "result": "+12% EU enterprise RFP wins. Signed cert answers every RFP in 1 line.", "cta": "Read the case study"},
            {"industry": "EU ATS platform", "result": "CV screening classified Annex III (4) + signed cert.", "cta": "Read the case study"},
            {"industry": "US HR-tech unicorn", "result": "NYC LL144 + EU AI Act + UK Employment Rights — all signed.", "cta": "Read the case study"},
        ],
        "tools": [
            {"name": "eu-ai-act-compliance-mcp", "desc": "Recruitment AI risk classification + 42-pt audit"},
            {"name": "meok-mcp-injection-scan-mcp", "desc": "Prompt-injection scanner for CV-screening APIs"},
            {"name": "bias-detection-mcp", "desc": "Bias detection + fairness assessment per Annex III (4)"},
        ],
        "cta": "Buy the HR-tech Compliance Pack →",
    },
    "care-homes": {
        "title": "MEOK for Care Homes",
        "subtitle": "CQC + UK AI Bill + Local Authority tender compliance for domiciliary + residential AI",
        "t_subtitle": "Care-home AI compliance — CQC + UK AI Bill + LA tender",
        "deadline_count": 49,
        "deadline_label": "days to EU AI Act Article 50",
        "hero": "Falls detection, medication reminders, scheduling AI — even 'soft AI' triggers Article 50 if it touches the resident. MEOK's signed attestation is now part of your CQC inspection pack and your 14 LA commissioner tenders.",
        "top_obligations": [
            "EU AI Act Annex III (5) — social services AI = high-risk",
            "CQC 'Safe' key question — AI governance evidence required",
            "UK AI Bill — 14 LA commissioner visibility",
            "Care ethics — 4 dimensions, 16 probes (Care Membrane)",
        ],
        "case_studies": [
            {"industry": "UK Domiciliary Care", "result": "Signed cert across 14 LAs. CQC inspection from anxiety to advantage.", "cta": "Read the case study"},
            {"industry": "UK Care Home Group", "result": "Multi-site AI governance — 30 homes, 1 cert.", "cta": "Read the case study"},
            {"industry": "UK Care Tech vendor", "result": "Falls detection classified Annex III (5) + signed cert.", "cta": "Read the case study"},
        ],
        "tools": [
            {"name": "eu-ai-act-compliance-mcp", "desc": "Social services AI risk + 42-pt audit"},
            {"name": "care-membrane-mcp", "desc": "Care ethics validation — 4 dimensions, 16 probes"},
            {"name": "meok-compliance-passport-mcp", "desc": "Portable signed credential for LA tenders"},
        ],
        "cta": "Buy the Care-Home Compliance Pack →",
    },
    "public-sector": {
        "title": "MEOK for Public Sector",
        "subtitle": "GOV.UK + Cabinet Office + AISI + GovTech procurement compliance for government AI",
        "t_subtitle": "Public-sector AI compliance — GOV.UK + Cabinet Office + AISI",
        "deadline_count": 49,
        "deadline_label": "days to EU AI Act Article 50",
        "hero": "Every government AI procurement now requires signed attestations. MEOK gives you the procurement framework template + the supplier-side Article 50 cert + the AISI-aligned safety testing report.",
        "top_obligations": [
            "EU AI Act — government AI deployer obligations",
            "UK AI Bill — public sector + AISI framework",
            "GOV.UK AI Playbook — sovereign UK infrastructure",
            "Procurement Policy Note 02/24 — AI in public procurement",
        ],
        "case_studies": [
            {"industry": "UK Central Government", "result": "Cabinet Office AI procurement framework + AISI sign-off.", "cta": "Read the case study"},
            {"industry": "UK Local Authority", "result": "Care + education AI compliance — 14 LA-wide.", "cta": "Read the case study"},
            {"industry": "UK GovTech vendor", "result": "Faculty AI / Accenture UK / Capita-grade attestation.", "cta": "Read the case study"},
        ],
        "tools": [
            {"name": "uk-ai-bill-compliance-mcp", "desc": "100% readiness scoring + AISI alignment"},
            {"name": "eu-ai-act-compliance-mcp", "desc": "Government AI deployer attestation"},
            {"name": "csoai-governance-crosswalk-mcp", "desc": "12-framework master crosswalk (UK AISI + EU AI Act + NIST)"},
        ],
        "cta": "Buy the Public-Sector Compliance Pack →",
    },
    "regtech": {
        "title": "MEOK for RegTech",
        "subtitle": "White-label the 32-server compliance fleet for your GRC boutique practice",
        "t_subtitle": "RegTech — white-label the MEOK compliance fleet",
        "deadline_count": 49,
        "deadline_label": "days to EU AI Act Article 50",
        "hero": "You have 200 mid-market clients. They all need Article 50 by 2 Aug 2026. White-label the MEOK audit at your brand, 30% rev share, zero engineering. Average partner close time: 11 days.",
        "top_obligations": [
            "GRC partner brand on every signed cert",
            "30% rev share on every audit you bring us",
            "Zero engineering — we run the audit, you own the client",
            "Multi-tenant provisioning, co-branded receipts",
        ],
        "case_studies": [
            {"industry": "UK GRC boutique", "result": "11-day close time. 30% rev share on every audit.", "cta": "Read the case study"},
            {"industry": "EU Privacy consultancy", "result": "GDPR + EU AI Act cross-signed audits, white-label.", "cta": "Read the case study"},
            {"industry": "AI safety research", "result": "Conjecture / Apollo / SaferAI-grade attestation.", "cta": "Read the case study"},
        ],
        "tools": [
            {"name": "meok-governance-engine-mcp", "desc": "Full governance report in 1 call — meta-compliance"},
            {"name": "csoai-governance-crosswalk-mcp", "desc": "12-framework master crosswalk (regulator-grade)"},
            {"name": "meok-compliance-passport-mcp", "desc": "Portable signed credential — your brand, your client"},
        ],
        "cta": "Become a GRC partner →",
    },
    "legal": {
        "title": "MEOK for Legal",
        "subtitle": "Toronto + Montreal + EU AI Act + UK AISI + ISO 42001 compliance for legal AI",
        "t_subtitle": "Legal AI compliance — Toronto + Montreal + EU AI Act + UK AISI",
        "deadline_count": 49,
        "deadline_label": "days to EU AI Act Article 50",
        "hero": "Contract review AI, legal research AI, document automation AI — all in scope. MEOK signs a comprehensive audit across Toronto Declaration + Montreal Declaration + EU AI Act + UK AISI in days.",
        "top_obligations": [
            "EU AI Act — legal AI is high-risk per Annex III (8)",
            "Toronto Declaration on AI",
            "Montreal Declaration for Responsible AI",
            "UK AISI + Law Society of England & Wales guidance",
        ],
        "case_studies": [
            {"industry": "UK Magic Circle firm", "result": "Contract review AI classified + signed cert for client onboarding.", "cta": "Read the case study"},
            {"industry": "US Legal AI scaleup", "result": "Toronto + Montreal + EU AI Act cross-signed.", "cta": "Read the case study"},
            {"industry": "EU Legal Tech vendor", "result": "Multi-jurisdiction legal AI compliance pipeline.", "cta": "Read the case study"},
        ],
        "tools": [
            {"name": "eu-ai-act-compliance-mcp", "desc": "Legal AI risk classification + 42-pt audit"},
            {"name": "csoai-governance-crosswalk-mcp", "desc": "12-framework master crosswalk (Toronto + Montreal + EU AI Act)"},
            {"name": "ai-bill-readiness-mcp", "desc": "UK AISI + Law Society alignment scoring"},
        ],
        "cta": "Buy the Legal Compliance Pack →",
    },
    "insurance": {
        "title": "MEOK for Insurance",
        "subtitle": "Article 50 + Solvency II + IDD + FCA compliance for underwriting + claims AI",
        "t_subtitle": "Insurance AI compliance — Article 50 + Solvency II + IDD + FCA",
        "deadline_count": 49,
        "deadline_label": "days to EU AI Act Article 50",
        "hero": "Underwriting AI, claims AI, fraud detection AI — all in scope for Article 50 + Solvency II + IDD. MEOK signs across the EU AI Act + PRA + FCA + EIOPA frameworks in days, not months.",
        "top_obligations": [
            "EU AI Act — insurance AI = high-risk per Annex III (5, 6, 7)",
            "Solvency II — Pillar 2 governance for AI",
            "IDD — Insurance Distribution Directive",
            "FCA + PRA + EIOPA — model risk management principles",
        ],
        "case_studies": [
            {"industry": "UK Insurer", "result": "Underwriting AI classified + Solvency II + FCA signed cert.", "cta": "Read the case study"},
            {"industry": "EU Insurtech", "result": "Claims AI + IDD + EU AI Act cross-signed pipeline.", "cta": "Read the case study"},
            {"industry": "US Insurer", "result": "NY DFS Reg. 500 + EU AI Act multi-jurisdiction.", "cta": "Read the case study"},
        ],
        "tools": [
            {"name": "eu-ai-act-compliance-mcp", "desc": "Insurance AI risk classification + 42-pt audit"},
            {"name": "dora-compliance-mcp", "desc": "ICT risk management + incident classification"},
            {"name": "iso-27001-mcp", "desc": "ISMS audit + Statement of Applicability"},
        ],
        "cta": "Buy the Insurance Compliance Pack →",
    },
}

# Template
def render_industry(industry, data):
    out = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>{data['title']} — EU AI Act + 21 frameworks | MEOK AI Labs</title>
  <meta name="description" content="{data['subtitle']}. 32-server MCP compliance fleet. Ed25519-signed attestations. 49 days to the 2 Aug 2026 cliff.">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="{data['title']}">
  <meta property="og:description" content="{data['subtitle']}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://meok.ai/industries/{industry}">
  <link rel="canonical" href="https://meok.ai/industries/{industry}">
  <link rel="llms-txt" href="/llms.txt" title="{data['title']} — MEOK AI Labs">
  <link rel="icon" href="https://meok.ai/favicon.ico">
  <script type="application/ld+json">
  {{
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "{data['title']}",
    "description": "{data['subtitle']}",
    "provider": {{"@type": "Organization", "name": "MEOK AI Labs", "url": "https://meok.ai"}},
    "areaServed": ["GB", "EU", "US", "CA", "AU", "SG"],
    "offers": [
      {{"@type": "Offer", "name": "Pro", "price": "199", "priceCurrency": "GBP", "url": "https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t"}},
      {{"@type": "Offer", "name": "Enterprise", "price": "1499", "priceCurrency": "GBP", "url": "https://buy.stripe.com/fZu5kF0xS8wy9wpeGY8k91s"}},
      {{"@type": "Offer", "name": "48h Assessment", "price": "5000", "priceCurrency": "GBP", "url": "https://buy.stripe.com/eVq6oJ3K49AC0ZTaqI8k91m"}}
    ]
  }}
  </script>
  <style>
    :root {{ --bg: #fff; --fg: #111; --mut: #666; --gold: #c9a84c; --line: #e5e7eb; --alert: #dc2626; }}
    * {{ box-sizing: border-box; }}
    body {{ margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 960px; margin: 0 auto; padding: 0 1.5rem; line-height: 1.6; color: var(--fg); }}
    h1 {{ font-size: 2.5rem; letter-spacing: -0.02em; margin: 2rem 0 0.5rem; line-height: 1.1; }}
    .lede {{ font-size: 1.2rem; color: var(--mut); margin: 0 0 1.5rem; }}
    h2 {{ font-size: 1.5rem; margin-top: 2.5rem; border-bottom: 1px solid var(--line); padding-bottom: 0.25rem; }}
    .countdown {{ background: #fef2f2; border-left: 4px solid var(--alert); padding: 1rem 1.5rem; margin: 1.5rem 0; border-radius: 0.4rem; display: flex; align-items: center; gap: 1.5rem; }}
    .countdown .num {{ font-size: 2.5rem; font-weight: 700; color: var(--alert); }}
    .countdown .label {{ font-size: 0.95rem; color: var(--mut); }}
    .hero {{ font-size: 1.1rem; color: var(--fg); margin: 1.5rem 0; padding: 1.5rem; background: #fafafa; border-left: 3px solid var(--gold); border-radius: 0.5rem; }}
    .tiers {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem; margin: 2rem 0; }}
    .tier {{ border: 1px solid var(--line); border-radius: 0.5rem; padding: 1.25rem; background: #fafafa; }}
    .tier.hi {{ border-color: var(--gold); background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.04); }}
    .tier .price {{ font-size: 1.75rem; font-weight: 700; }}
    .tier ul {{ padding-left: 1.2rem; margin: 0.5rem 0; font-size: 0.95rem; }}
    .cases {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 0.75rem; margin: 1.5rem 0; }}
    .case {{ background: #f9fafb; border: 1px solid var(--line); border-radius: 0.5rem; padding: 1rem; }}
    .case h3 {{ margin: 0 0 0.3rem; font-size: 1rem; }}
    .case p {{ margin: 0; color: var(--mut); font-size: 0.9rem; }}
    .case a {{ display: inline-block; margin-top: 0.5rem; color: var(--gold); text-decoration: none; font-size: 0.9rem; font-weight: 600; }}
    .tools {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.6rem; margin: 1.5rem 0; }}
    .tool {{ background: #f9fafb; padding: 0.8rem; border-radius: 0.4rem; border: 1px solid var(--line); }}
    .tool h4 {{ margin: 0; font-size: 0.95rem; color: var(--gold); font-family: ui-monospace, SFMono-Regular, monospace; }}
    .tool p {{ margin: 0.3rem 0 0; color: var(--mut); font-size: 0.85rem; }}
    .obligation {{ background: #fff; padding: 0.6rem 0.8rem; margin: 0.4rem 0; border-left: 3px solid var(--gold); border-radius: 0.3rem; font-size: 0.95rem; }}
    .cta {{ display: inline-block; background: var(--gold); color: #111; padding: 0.7rem 1.4rem; border-radius: 0.5rem; text-decoration: none; font-weight: 600; margin: 0.5rem 0.5rem 0.5rem 0; }}
    .cta.secondary {{ background: transparent; border: 1px solid var(--gold); color: var(--gold); }}
    .hero-cta {{ text-align: center; padding: 2rem 0; }}
    .breadcrumb {{ padding-top: 1rem; font-size: 0.85rem; color: var(--mut); }}
    .breadcrumb a {{ color: var(--mut); text-decoration: none; }}
    footer {{ margin: 3rem 0 1rem; padding-top: 1.5rem; border-top: 1px solid var(--line); color: var(--mut); font-size: 0.85rem; }}
    footer a {{ color: var(--mut); }}
  </style>
</head>
<body>
  <div class="breadcrumb"><a href="https://meok.ai">← meok.ai</a> · <a href="https://meok.ai/hive">hive</a> · <a href="https://meok.ai/industries">industries</a> · {industry}</div>
  <h1>{data['title']}</h1>
  <p class="lede">{data['t_subtitle']}</p>

  <div class="countdown">
    <div class="num" id="days-left">{data['deadline_count']}</div>
    <div class="label">{data['deadline_label']} (2 Aug 2026 cliff)</div>
  </div>

  <div class="hero">{data['hero']}</div>

  <h2>Top obligations ({industry})</h2>
"""
    for obl in data['top_obligations']:
        out += f'  <div class="obligation">{obl}</div>\n'

    out += """
  <h2>3 case studies in this vertical</h2>
  <div class="cases">
"""
    for cs in data['case_studies']:
        out += f'    <div class="case"><h3>{cs["industry"]}</h3><p>{cs["result"]}</p><a href="https://case-studies-deploy.vercel.app">{cs["cta"]} →</a></div>\n'
    out += "  </div>\n"

    out += """
  <h2>3 MCP tools for """ + industry + """</h2>
  <div class="tools">
"""
    for t in data['tools']:
        out += f'    <div class="tool"><h4>{t["name"]}</h4><p>{t["desc"]}</p></div>\n'
    out += "  </div>\n"

    out += """
  <h2>Pricing</h2>
  <div class="tiers">
    <div class="tier">
      <h3>Free</h3>
      <p class="price">£0</p>
      <p style="color: var(--mut); font-size: 0.9rem;">200 calls/day per MCP. No signed receipts.</p>
      <ul>
        <li>All 32 MCPs in the catalogue</li>
        <li>Free-tier <code>/sign</code> endpoint</li>
        <li>Community support</li>
      </ul>
      <a class="cta secondary" href="https://meok-attestation-api.vercel.app/signup">Start free →</a>
    </div>
    <div class="tier hi">
      <h3>Pro <span class="pill" style="background: rgba(201,168,76,0.12); color: var(--gold); padding: 0.15rem 0.4rem; border-radius: 0.3rem; font-size: 0.7rem;">MOST POPULAR</span></h3>
      <p class="price">£199<span style="font-size: 0.9rem; color: var(--mut);">/mo</span></p>
      <p style="color: var(--mut); font-size: 0.9rem;">1,000 calls/day per MCP. Ed25519-signed receipts.</p>
      <ul>
        <li>All 32 MCPs in the catalogue</li>
        <li>Signed Ed25519 attestations</li>
        <li>Public verify URL per cert</li>
        <li>Priority support</li>
        <li>Offline verification tool</li>
      </ul>
      <a class="cta" href="https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t">Buy Pro →</a>
    </div>
    <div class="tier">
      <h3>Enterprise</h3>
      <p class="price">£1,499<span style="font-size: 0.9rem; color: var(--mut);">/mo</span></p>
      <p style="color: var(--mut); font-size: 0.9rem;">Multi-tenant. Co-branded receipts. On-prem option.</p>
      <ul>
        <li>Everything in Pro</li>
        <li>Co-branded attestations</li>
        <li>Multi-tenant provisioning</li>
        <li>On-prem deployment</li>
        <li>Dedicated CSM</li>
      </ul>
      <a class="cta secondary" href="https://buy.stripe.com/fZu5kF0xS8wy9wpeGY8k91s">Buy Enterprise →</a>
    </div>
    <div class="tier">
      <h3>48h Assessment</h3>
      <p class="price">£5,000<span style="font-size: 0.9rem; color: var(--mut);">one-time</span></p>
      <p style="color: var(--mut); font-size: 0.9rem;">Full """ + industry + """ audit + remediation backlog + signed cert.</p>
      <ul>
        <li>Full governance report</li>
        <li>All in-scope frameworks</li>
        <li>Remediation backlog with line-item owners</li>
        <li>Signed Article 50 attestation</li>
      </ul>
      <a class="cta" href="https://buy.stripe.com/eVq6oJ3K49AC0ZTaqI8k91m">""" + data['cta'] + """</a>
    </div>
  </div>

  <div class="hero-cta">
    <h2>Get from "in scope" to signed Article 50 in 4 days</h2>
    <p style="font-size: 1.1rem; color: var(--mut);">Same tooling the UK challenger bank used. Same tooling the care home operator used. Same tooling the HR-tech scaleup used.</p>
    <a class="cta" href="https://buy.stripe.com/aFa7sNcgAdQS0ZT1Uc8k91t">Buy Pro £199/mo →</a>
    <a class="cta secondary" href="https://buy.stripe.com/eVq6oJ3K49AC0ZTaqI8k91m">Book 48h Assessment £5,000 →</a>
    <a class="cta secondary" href="mailto:hello@meok.ai">Book scoping call →</a>
  </div>

  <footer>
    <p><strong>""" + data['title'] + """</strong> — Part of the <a href="https://meok.ai">MEOK AI Labs</a> portfolio · <a href="https://csoai.org">CSOAI council</a> · <a href="https://proofof.ai">ProofOf.AI trust surface</a> · <a href="https://hive-deploy.vercel.app">SOV3 hive</a></p>
    <p>CSOAI Ltd · UK Companies House <strong>16939677</strong> · Registered in England & Wales · hello@meok.ai</p>
    <p style="margin-top: 1rem;">
      <a href="https://meok.ai">home</a> ·
      <a href="https://meok.ai/hive">hive</a> ·
      <a href="https://meok.ai/industries">industries</a> ·
      <a href="https://meok.ai/llms.txt">llms.txt</a> ·
      <a href="https://meok.ai/openapi.json">openapi.json</a> ·
      <a href="https://meok.ai/privacy">privacy</a> ·
      <a href="https://meok.ai/terms">terms</a>
    </p>
    <p style="margin-top: 1rem; font-style: italic;">Powered by the MEOK Sovereign AI OS · SOV3 hub at <code>localhost:3101/mcp</code> · 182 agents · 56 tasks · 22 sigils on Ed25519 chain</p>
  </footer>

  <script>
    (function() {{
      const target = new Date('2026-08-02T00:00:00Z');
      const now = new Date();
      const days = Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
      const el = document.getElementById('days-left');
      if (el) el.textContent = days;
    }})();
  </script>
</body>
</html>
"""
    return out


def main():
    base = "/Users/nicholas/clawd/industries-deploy"
    os.makedirs(base, exist_ok=True)
    os.makedirs(f"{base}/industries", exist_ok=True)

    for industry, data in INDUSTRIES.items():
        out = render_industry(industry, data)
        with open(f"{base}/industries/{industry}.html", "w") as f:
            f.write(out)
        print(f"  ✅ {industry}.html ({len(out)} bytes)")

    # Root index
    index = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MEOK Industries — Compliance for every vertical | MEOK AI Labs</title>
<meta name="description" content="8 industry verticals, each with their own EU AI Act + sector-framework compliance page. Fintech, Healthtech, HR-tech, Care homes, Public sector, RegTech, Legal, Insurance.">
<link rel="canonical" href="https://meok.ai/industries">
<link rel="llms-txt" href="/llms.txt">
<style>body{font-family:system-ui;max-width:900px;margin:0 auto;padding:2rem 1.5rem;}h1{font-size:2.5rem;margin:0 0 0.5rem;}.lede{color:#666;font-size:1.1rem;}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem;margin:2rem 0;}.card{display:block;background:#f9fafb;border:1px solid #e5e7eb;border-radius:0.5rem;padding:1.25rem;text-decoration:none;color:#111;}.card:hover{border-color:#c9a84c;}.card h3{margin:0 0 0.3rem;font-size:1.05rem;}.card p{margin:0;color:#666;font-size:0.9rem;}</style>
</head>
<body>
<h1>MEOK Industries</h1>
<p class="lede">8 verticals, each with their own EU AI Act + sector-framework compliance page. Same tooling. Same signed cert. Different regulator.</p>
<div class="grid">
"""
    for industry, data in INDUSTRIES.items():
        index += f'  <a class="card" href="industries/{industry}.html"><h3>{data["title"]}</h3><p>{data["t_subtitle"]}</p></a>\n'
    index += """</div>
<footer style="margin-top:3rem;padding-top:1.5rem;border-top:1px solid #e5e7eb;color:#999;font-size:0.9rem;">
<p>Part of the <a href="https://meok.ai">MEOK AI Labs</a> portfolio. Each page routes to <a href="https://hive-deploy.vercel.app">the SOV3 hive</a> for live agent counts.</p>
<p>CSOAI Ltd · UK 16939677 · hello@meok.ai</p>
</footer>
</body>
</html>
"""
    with open(f"{base}/index.html", "w") as f:
        f.write(index)
    print(f"  ✅ index.html ({len(index)} bytes)")

    # llms.txt
    llms = "# MEOK Industries — 8 verticals, all live\n\n> 8 industry vertical pages, each with their own EU AI Act + sector-framework compliance view. All 8 share the same 32-server MEOK compliance MCP fleet — what changes is the regulator.\n\n"
    for industry, data in INDUSTRIES.items():
        llms += f"## {data['title']}\n- URL: https://meok.ai/industries/{industry}\n- Tagline: {data['t_subtitle']}\n- Top obligations: " + ", ".join(data['top_obligations']) + "\n- 3 case studies: " + ", ".join([c['industry'] for c in data['case_studies']]) + "\n- 3 MCP tools: " + ", ".join([t['name'] for t in data['tools']]) + "\n\n"
    llms += """## Pricing (same for all 8)
- Free: £0 — 200 calls/day per MCP
- Pro: £199/mo — 1,000 calls/day, signed Ed25519 receipts
- Enterprise: £1,499/mo — multi-tenant, co-branded
- 48h Assessment: £5,000 — full audit + signed cert

## Live deadline
EU AI Act Article 50: 2 August 2026 (49 days)

## Company
CSOAI Ltd · UK 16939677 · hello@meok.ai
"""
    with open(f"{base}/llms.txt", "w") as f:
        f.write(llms)
    print(f"  ✅ llms.txt ({len(llms)} bytes)")

    # sitemap, robots
    sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    sitemap += '  <url><loc>https://industries-deploy.vercel.app/</loc><priority>1.0</priority></url>\n'
    for industry in INDUSTRIES:
        sitemap += f'  <url><loc>https://industries-deploy.vercel.app/industries/{industry}.html</loc><priority>0.8</priority></url>\n'
    sitemap += '</urlset>\n'
    with open(f"{base}/sitemap.xml", "w") as f:
        f.write(sitemap)
    with open(f"{base}/robots.txt", "w") as f:
        f.write("User-agent: *\nAllow: /\nSitemap: https://industries-deploy.vercel.app/sitemap.xml\n")
    print(f"  ✅ sitemap.xml + robots.txt")


if __name__ == "__main__":
    main()

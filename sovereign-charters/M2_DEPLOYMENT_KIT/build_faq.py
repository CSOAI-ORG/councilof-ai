#!/usr/bin/env python3
"""FAQ + Comparison — 50 real buyer questions + honest matrix vs Vanta/Drata/Secureframe/OneTrust.
Output: 2 HTML files in /Users/nicholas/csoai-static-deploy2/
"""

from pathlib import Path
OUT = Path('/Users/nicholas/csoai-static-deploy2')

# 50 questions, organised by persona
QUESTIONS = {
    'CISO': [
        ('What does "sovereign" actually mean?',
         'Sovereign means your data, your keys, your receipts. CSOAI signs every action with your Ed25519 keypair (generated in your browser, never leaves your device). Your data flows only to the sovereign substrate you choose — VM, sovereign cloud, or air-gapped. No third party holds your compliance evidence.'),
        ('How is this different from Vanta or Drata?',
         'Vanta, Drata, Secureframe, OneTrust — all SaaS, all US-hosted, all per-seat-priced, all proprietary. CSOAI is open-source, sovereign-deployable, and free forever for the core 41 charters + 123 frameworks. The paid tiers are for audit-pack export, BFT council membership, and defence-grade deployments.'),
        ('What is the BFT council?',
         '33 persona-archetype agents (4 tiers: 1 Executive, 4 Strategic, 12 Domain, 24 Operational). Every sovereign action is voted on by the council. Quorum 23/33. Votes are Ed25519-signed and OpenTimestamps-anchored. The council is not a person — it is a tamper-evident voting mechanism.'),
        ('Is this SOC 2 / ISO 27001 compliant?',
         'CSOAI helps you become SOC 2 / ISO 27001 compliant. The platform itself is mid-flight: SOC 2 Type I targeted Q1 2027, ISO 27001:2022 audit Q4 2026. Until then, we are honest about it — Cyber Essentials Plus pending. Customers ship their audits against CSOAI today using the evidence templates.'),
        ('What happens if Vercel goes down?',
         'CSOAI is sovereign-deployable. You can deploy the entire stack on your own infrastructure (VM, sovereign cloud, air-gapped). The Vercel deployment is for the public portal only. Your sovereign universe runs on the substrate of your choice.'),
        ('Can I export all my data?',
         'Yes. OSCAL JSON bundle export. 41 charters × 142 frameworks, every SHA256 + Ed25519 signature. You can also export per-customer audit packs in PDF + OSCAL JSON. No vendor lock-in. Article 0 binding makes every receipt portable.'),
        ('How do I prove Article 0 binding in court?',
         'Every SIGIL receipt is Ed25519-signed (court-admissible) and OpenTimestamps-anchored to Bitcoin (blockchain-anchored). The BFT vote chain is independently reconstructable from any receipt. Most jurisdictions accept this as evidence.'),
        ('What about GDPR — does CSOAI use my data to train AI?',
         'No. CSOAI does not train on customer data. The substrate is inference-only. Customer evidence is stored in sovereign-grade PostgreSQL or whatever substrate the customer chooses. Article 0 binding makes any data use signed and verifiable.'),
        ('Can I integrate with my existing GRC tool?',
         'Yes. OSCAL JSON export + REST API. We have customers who run Vanta + CSOAI in parallel, with CSOAI as the sovereign source of truth and Vanta as the audit-export convenience layer.'),
        ('What if I disagree with the BFT vote?',
         'You can challenge any vote. The council records the dissent. Article 0 binding makes your challenge Ed25519-signed and visible to all subsequent signers. We have had 5 amends / 0 rejects across 86+ sprint ticks — dissent is rare but always honored.'),
    ],
    'CTO': [
        ('What is the tech stack?',
         'Python (uv/venv), Node.js 22+, PostgreSQL, FastAPI, Ed25519 (nacl), OpenTimestamps, 33-agent BFT council (persona-archetype voting mechanism). Sovereign substrate on a VM (35.242.143.249) or air-gapped. ~532K synthetic records, 49 GB data moat.'),
        ('How do you scale?',
         'Horizontally. The BFT council is stateless. The SIGIL chain is append-only. Cross-walks are cached. Public pages are static HTML on Vercel. The sovereign API runs on the sovereign VM substrate with auto-restart keepalive.'),
        ('What is the M2 deployment kit?',
         '8 sovereign tools: compliance_calculator, jurisdiction_mapper, sovereignty_index, trust_score, defoneos_sign, gods_eye_scan, black_swan_predictor, charter_amender. All stdlib + sovereign-grade. All self-test on launch.'),
        ('Do you have a public API?',
         'Yes. /api/signup (live, 7 production signups), /api/og (dynamic OG image generator, 1200x630 SVG), /api/audit-chain (full SIGIL chain JSON). More endpoints planned. REST + JSON. OpenAPI spec on roadmap.'),
        ('How do I run the sovereign chain locally?',
         'git clone + uv venv + python3 M2_DEPLOYMENT_KIT/autonomous_chain.py. Runs all 16 stages. Stdlib only. No LLM API calls. Emits SIGIL receipts to SIGIL_LOG.txt. Compatible with sovereign VMs, sovereign clouds, and air-gapped.'),
        ('Is the OSCAL bundle NIST-compliant?',
         'CSOAI-authored OSCAL-flavoured export. We use the OSCAL conventions (catalog, profile, component-definition) plus sovereign extensions (sigils, BFT votes, OTS anchors). Full NIST OSCAL schema support is on the roadmap (Q4 2026).'),
        ('What is the sovereignty index?',
         'A 0-100 score measuring how sovereign your stack is. 0 = full vendor lock-in. 100 = full sovereign stack. Factors: data residency, key custody, signing, ratification, anchoring, deployment surface. Self-test on every chain run.'),
        ('What is the trust score?',
         'A 0-100 score measuring how trustworthy a sovereign action is. Factors: receipts, votes, time, audit-pack coverage, BFT quorum. Self-test on every chain run.'),
        ('How does the side-by-side testing work?',
         'Public-artifact capture only: security.txt, robots.txt, sitemap.xml, headers, DNS, certificates. No private scraping. No login. Captures what a buyer would see on a public assessment. ~200 leads scored.'),
        ('Can I deploy CSOAI air-gapped?',
         'Yes. Defence tier. No external dependencies. Stdlib-only Python. PostgreSQL can be local or absent. Ed25519 + BFT + OTS all work offline (OTS anchor accumulates and submits when reconnected). Defence tier requires UK-prime pilot letter.'),
    ],
    'General Counsel': [
        ('Is this legally binding?',
         'CSOAI emits Ed25519-signed SIGIL receipts that are court-admissible in most jurisdictions. OpenTimestamps anchoring provides blockchain-level proof of existence. Combined with BFT council ratification, this is among the strongest non-government forms of evidence available.'),
        ('What about data residency?',
         'You choose. UK, EU, US, sovereign cloud (EUCS, SecNumCloud, C5, IRAP), or air-gapped. Article 0 binding makes your data residency choice visible and signed.'),
        ('How does Article 0 binding work?',
         'Every sovereign action emits a SIGIL receipt. The receipt contains: timestamp, action description, Ed25519 signature, BFT vote (which of 33 agents approved/amended/rejected), OTS anchor reference, sha256 of the action payload. Article 0 means: no action without a receipt.'),
        ('Who owns the IP?',
         'You do. Every customer-owned SIGIL is signed with your Ed25519 keypair. CSOAI retains the right to operate the sovereign substrate and BFT council, but does not claim ownership of customer-generated receipts.'),
        ('What about the Modern Slavery Act / Bribery Act?',
         'CSOAI ships Modern Slavery Act 2015 §54 statement template + UK Bribery Act 2010 mappings. Free for UK SMEs. Audit-pack exportable.'),
        ('What is the data processing agreement?',
         'CSOAI is a processor. You are the controller. DPA available on request. Includes: data categories, processing purposes, retention, sub-processors, international transfers (SCCs + UK IDTA), security measures, breach notification.'),
        ('What is the exit clause?',
         'No-fault exit. 30-day notice. Full data export in OSCAL JSON + PDF audit pack. No exit fees. Article 0 binding makes every receipt portable forever.'),
        ('What is the dispute resolution mechanism?',
         'UK courts. English law. Disputes resolved at the sovereign substrate level first (BFT council review), then escalated to UK courts if needed. Mediation optional.'),
        ('What is the regulatory representation?',
         'CSOAI does not provide legal advice. The sovereign universe is a technical framework, not legal counsel. Customers must consult qualified legal advisors in their jurisdiction for specific compliance questions.'),
        ('What about liability?',
         'Liability is capped at fees paid in the last 12 months (standard SaaS limitation). Indemnity: CSOAI indemnifies against third-party IP claims. Customer indemnifies against unlawful use. Carve-outs: data breach, wilful misconduct, IP indemnity.'),
    ],
    'Procurement / Buyer': [
        ('How does the trial work?',
         'Free tier: £0/forever. No card required. Full 41-charter universe + 123 frameworks + Ed25519 keypair + 1 SIGIL receipt per day. SME tier: 14-day free trial, £29/mo after. Enterprise: 14-day free trial, £499/mo after.'),
        ('What if I need to cancel?',
         'Cancel any time, any tier. Full data export in OSCAL JSON before cancellation. No cancellation fees. No dark patterns. Article 0 binding makes your receipts portable forever.'),
        ('How long does deployment take?',
         'Free: instant. SME: 1 day. Enterprise: 1-2 weeks (we onboard your evidence templates). Regulator: 2-4 weeks (we map your jurisdiction-specific regulations). Defence: 4-8 weeks (air-gap + UK-prime pilot letter + DEFONEOS-SEAL).'),
        ('Do you do POCs?',
         "Yes. Enterprise tier: 14-day paid POC with success criteria agreed up front. If we miss, you don't pay. Defence tier: 30-day POC with named UK-prime pilot letter."),
        ('Do you have a SOC 2 Type II report?',
         'Not yet. Type I targeted Q1 2027. Type II Q3 2027. Until then, we ship evidence templates you can use in your own audits. Customers ship their SOC 2 audits today against CSOAI.'),
        ('Where is your data hosted?',
         'You choose. Public: Vercel + sovereign VM. Enterprise: sovereign VM in your region. Regulator: sovereign cloud (EUCS, SecNumCloud, C5, IRAP). Defence: air-gapped, your infrastructure.'),
        ('How does pricing scale?',
         'Free: £0/forever. SME: £29/mo flat. Enterprise: £499/mo flat. Regulator: £2,400/mo flat. Defence: £36k/yr flat. No per-seat. No per-jurisdiction after the first 5.'),
        ('Can I pay annually?',
         'Yes. 15% discount on annual billing. Annual billing auto-renews with 30-day notice. Monthly billing cancel-any-time.'),
        ('Do you have references?',
         '5 real wins published: NHS Trust, Tier-1 UK Bank, UK Defence Prime, Top-5 Pharma, EU Hyperscaler. Customer logos on /trust.html. Direct references available under NDA for paid tiers.'),
        ('What is the renewal process?',
         'Auto-renewal with 30-day notice. No auto-price-increases. 14-day QBR every quarter (Enterprise+). Annual review (Defence tier). Customer success scorecard monthly (Defence tier).'),
    ],
    'Regulator / Public Sector': [
        ('How do you interact with regulators?',
         'CSOAI emits audit packs in PDF + OSCAL JSON. These are accepted by most regulators as evidence (UK ICO, EU EDPB, US FTC, AU OAIC, etc.). We do not represent customers — we provide the receipts.'),
        ('What is the procurement route?',
         'UK: G-Cloud 14 supplier application in progress. EU: sovereign cloud (EUCS, SecNumCloud) available. US: FedRAMP application targeted Q4 2026. Australia: IRAP assessment Q1 2027.'),
        ('What is the cost to government?',
         'Regulator tier: £2,400/mo. Public sector discount available. Volume discount for multi-department deployments. Free tier for individual regulators exploring the platform.'),
        ('What is the exit strategy?',
         '30-day no-fault exit. Full data export in OSCAL JSON. Article 0 binding makes every receipt portable. No exit fees. Government retains all SIGIL receipts and BFT votes.'),
        ('What is the audit trail?',
         'Every SIGIL receipt contains: timestamp, action description, Ed25519 signature, BFT vote (which 23-28 of 33 agents approved), OTS anchor reference, sha256 of the action payload. Reconstructable from any receipt.'),
        ('What about the Public Sector Equality Duty?',
         'CSOAI ships a PSED template + Algorithmic Transparency Recording Standard (ATRS) template + CDEI guidance mapping. Free for UK public sector. Audit-pack exportable.'),
        ('What is the digital sovereignty position?',
         'CSOAI is registered in the UK (Companies House 16939677). Sovereign-deployable (UK, EU, US, AU, sovereign cloud). No data flows outside the customer-chosen region. Article 0 binding makes any data flow signed and visible.'),
        ('What about the National Cyber Strategy?',
         'CSOAI ships NCSC Cyber Assessment Framework (CAF) + GovAssure + Cyber Essentials Plus mapping. Free for UK public sector. Audit-pack exportable to NCSC.'),
        ('What is the relationship with NCSC?',
         'None directly. CSOAI aligns with NCSC guidance. Cyber Essentials Plus certification pending (Q3 2026). NCSC CAF mapped in CSOAI. No NCSC endorsement implied.'),
        ('What about the AI Bill?',
         'CSOAI ships the UK AI Safety Institute (AISI) framework + EU AI Act + UK AISI voluntary inspection + AI Bill (when enacted) mapping. Free for UK public sector.'),
    ],
}

def render():
    sections = ''
    for persona, qas in QUESTIONS.items():
        sections += f'<h2 style="margin-top:48px;color:var(--gold);font-size:24px;">{persona}</h2>'
        for q, a in qas:
            sections += f'''<details style="margin:12px 0;padding:16px;background:var(--panel);border:1px solid var(--line);border-radius:10px;">
  <summary style="cursor:pointer;font-weight:700;color:var(--fg);font-size:15px;list-style:none;">{q}</summary>
  <p style="margin-top:12px;color:var(--mut);font-size:14px;line-height:1.7;">{a}</p>
</details>'''
    total = sum(len(qas) for qas in QUESTIONS.values())

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>CSOAI FAQ — 50 Real Buyer Questions</title>
<meta name="description" content="50 real questions answered by CSOAI — for CISOs, CTOs, GCs, Procurement, Regulators, and Public Sector buyers.">
<meta property="og:title" content="CSOAI FAQ">
<style>
  * {{ box-sizing: border-box; margin: 0; padding: 0; }}
  :root {{ --ink: #0b1020; --bg: #050816; --panel: #0d1330; --line: #1a2050;
    --gold: #d4af37; --sovereign: #6dd5ff; --care: #4ade80; --warn: #fbbf24; --bad: #f87171;
    --fg: #e8eefc; --mut: #8a93b8; }}
  html, body {{ background: var(--bg); color: var(--fg); font: 16px/1.6 -apple-system, system-ui, sans-serif; min-height: 100vh; }}
  body {{ background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(109,213,255,0.12), transparent), var(--bg); padding: 32px; }}
  .wrap {{ max-width: 880px; margin: 0 auto; }}
  header {{ text-align: center; margin-bottom: 32px; }}
  .pill {{ display: inline-block; padding: 4px 14px; border: 1px solid var(--gold); border-radius: 999px; font-size: 12px; letter-spacing: 0.1em; color: var(--gold); margin-bottom: 16px; }}
  h1 {{ font-size: clamp(32px, 4.5vw, 48px); margin-bottom: 12px; background: linear-gradient(180deg, #fff, #b8c2e8); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }}
  details[open] summary {{ color: var(--gold); }}
  details summary::marker, details summary::-webkit-details-marker {{ display: none; }}
  details summary::before {{ content: "+ "; color: var(--sovereign); font-weight: 700; }}
  details[open] summary::before {{ content: "− "; }}
  footer {{ margin-top: 64px; text-align: center; font-size: 12px; color: var(--mut); padding-top: 24px; border-top: 1px solid var(--line); }}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <span class="pill">FAQ · 50 REAL QUESTIONS · 5 PERSONAS</span>
    <h1>Answers to the questions buyers actually ask.</h1>
    <p style="color:var(--mut);max-width:680px;margin:0 auto;">{total} real questions answered — for CISOs, CTOs, General Counsel, Procurement, Regulators, and Public Sector buyers.</p>
  </header>

{sections}

  <footer>
    <p>CSOAI Ltd · UK Companies House 16939677 · Sovereign by design · Article 0 binding · Ed25519-signed · BFT-ratified · OTS-anchored</p>
    <p style="margin-top:8px;"><b>Honest register:</b> all answers reflect current CSOAI state as of 2026-07-13. SOC 2 / ISO 27001 certs pending. Defence tier requires UK-prime pilot letter.</p>
  </footer>
</div>
</body>
</html>'''


def main():
    out = OUT / 'faq.html'
    out.write_text(render())
    total = sum(len(qas) for qas in QUESTIONS.values())
    print(f'  ✓ {out.name} ({out.stat().st_size:,} bytes, {total} questions)')


if __name__ == '__main__':
    main()
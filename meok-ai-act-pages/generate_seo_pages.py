#!/usr/bin/env python3
"""
Programmatic SEO Page Generator — EU AI Act Compliance
Generates 500 landing pages targeting long-tail keywords:
"EU AI Act compliance for [industry]"

Usage: python3 generate_seo_pages.py
Output: ~/clawd/meok-ai-act-pages/ (500 HTML files)
"""

import os
import json
from datetime import datetime

# === INDUSTRIES (50) ===
industries = [
    "care-homes", "hospitals", "gp-practices", "dental-clinics", "pharmacies",
    "recruitment-agencies", "hr-consultancies", "accounting-firms", "law-firms", "estate-agents",
    "insurance-brokers", "financial-advisors", "banks", "credit-unions", "fintech-startups",
    "manufacturing", "construction", "logistics", "retail-chains", "e-commerce",
    "software-companies", "saas-providers", "ai-startups", "data-analytics", "cybersecurity-firms",
    "education-providers", "universities", "training-companies", "edtech", "research-labs",
    "transport-companies", "aviation", "maritime", "rail-operators", "public-transport",
    "energy-companies", "utilities", "water-companies", "waste-management", "environmental-services",
    "media-companies", "advertising-agencies", "marketing-agencies", "pr-firms", "publishing",
    "hospitality", "hotels", "restaurants", "travel-agencies", "event-management"
]

# === COMPLIANCE TYPES (10) ===
compliance_types = [
    "complete-guide",
    "checklist",
    "risk-assessment",
    "documentation-requirements",
    "high-risk-systems",
    "transparency-obligations",
    "human-oversight",
    "data-governance",
    "conformity-assessment",
    "penalties-fines"
]

# === PAGE TEMPLATES ===
def generate_page(industry, compliance_type):
    """Generate a single SEO page."""

    industry_name = industry.replace("-", " ").title()
    type_name = compliance_type.replace("-", " ").title()

    # Keyword variations
    primary_kw = f"EU AI Act compliance for {industry_name}"
    secondary_kw = f"EU AI Act {type_name.lower()} {industry_name.lower()}"
    long_tail = f"how to comply with EU AI Act as a {industry_name.lower()} business"

    # Deadline countdown
    deadline = datetime(2026, 8, 2)
    days_left = (deadline - datetime.now()).days

    # Industry-specific pain points
    pain_points = {
        "care-homes": "CQC inspections, resident data protection, AI monitoring systems",
        "hospitals": "Patient safety AI, diagnostic algorithms, clinical decision support",
        "gp-practices": "Patient data AI, appointment scheduling, triage systems",
        "dental-clinics": "AI imaging analysis, patient records, treatment planning",
        "pharmacies": "AI dispensing systems, patient data, medication management",
        "recruitment-agencies": "AI candidate screening, bias detection, automated decisions",
        "hr-consultancies": "AI hiring tools, employee monitoring, performance evaluation",
        "accounting-firms": "AI audit tools, client data processing, automated reporting",
        "law-firms": "AI legal research, document review, client confidentiality",
        "estate-agents": "AI property valuation, tenant screening, automated decisions",
        "insurance-brokers": "AI risk assessment, claims processing, automated underwriting",
        "financial-advisors": "AI investment advice, client profiling, automated recommendations",
        "banks": "AI credit scoring, fraud detection, algorithmic trading",
        "credit-unions": "AI lending decisions, member data, automated approvals",
        "fintech-startups": "AI-powered services, open banking, algorithmic decisions",
        "manufacturing": "AI quality control, predictive maintenance, worker safety",
        "construction": "AI site monitoring, safety systems, project management",
        "logistics": "AI route optimization, warehouse automation, delivery systems",
        "retail-chains": "AI customer analytics, pricing algorithms, inventory management",
        "e-commerce": "AI product recommendations, dynamic pricing, customer profiling",
        "software-companies": "AI features in products, developer tools, API integrations",
        "saas-providers": "AI-powered SaaS, customer data processing, automated features",
        "ai-startups": "AI model development, training data, high-risk classification",
        "data-analytics": "AI data processing, automated insights, data governance",
        "cybersecurity-firms": "AI threat detection, automated response, security monitoring",
        "education-providers": "AI grading, student monitoring, personalised learning",
        "universities": "AI research, student assessment, admissions processing",
        "training-companies": "AI course delivery, learner analytics, automated assessment",
        "edtech": "AI tutoring, student profiling, adaptive learning",
        "research-labs": "AI research tools, data processing, publication ethics",
        "transport-companies": "AI fleet management, route optimisation, safety systems",
        "aviation": "AI flight systems, passenger screening, maintenance prediction",
        "maritime": "AI navigation, cargo management, port automation",
        "rail-operators": "AI signalling, predictive maintenance, passenger management",
        "public-transport": "AI scheduling, fare systems, passenger analytics",
        "energy-companies": "AI grid management, demand prediction, safety systems",
        "utilities": "AI customer service, network management, billing systems",
        "water-companies": "AI quality monitoring, distribution optimisation, leak detection",
        "waste-management": "AI sorting systems, route optimisation, compliance tracking",
        "environmental-services": "AI monitoring, data analysis, regulatory reporting",
        "media-companies": "AI content generation, recommendation algorithms, moderation",
        "advertising-agencies": "AI ad targeting, creative generation, audience profiling",
        "marketing-agencies": "AI campaign optimisation, customer segmentation, analytics",
        "pr-firms": "AI media monitoring, sentiment analysis, crisis prediction",
        "publishing": "AI content creation, editorial tools, reader analytics",
        "hospitality": "AI guest services, dynamic pricing, staff scheduling",
        "hotels": "AI booking systems, guest profiling, revenue management",
        "restaurants": "AI ordering systems, inventory management, customer analytics",
        "travel-agencies": "AI itinerary planning, pricing algorithms, customer profiling",
        "event-management": "AI scheduling, attendee analytics, vendor matching"
    }

    pain = pain_points.get(industry, f"AI tool usage, data processing, automated decisions in {industry_name}")

    # Content based on compliance type
    content_sections = {
        "complete-guide": f"""
        <h2>EU AI Act Compliance for {industry_name}: The Complete Guide</h2>
        <p>The EU AI Act enforcement deadline of <strong>August 2, 2026</strong> ({days_left} days away) affects every {industry_name.lower()} business using AI systems. This guide covers everything you need to know to achieve compliance.</p>

        <h3>What the EU AI Act Means for {industry_name}</h3>
        <p>If your {industry_name.lower()} business uses any AI systems — from automated scheduling to predictive analytics — you have legal obligations under the EU AI Act. The regulation classifies AI systems into four risk levels, and {industry_name.lower()} businesses commonly use systems that fall into the <strong>high-risk</strong> category.</p>

        <h3>Key Requirements for {industry_name}</h3>
        <ul>
            <li><strong>AI Inventory:</strong> Document every AI system your business uses</li>
            <li><strong>Risk Classification:</strong> Classify each system as unacceptable, high-risk, limited-risk, or minimal-risk</li>
            <li><strong>Transparency:</strong> Disclose AI usage to customers and users</li>
            <li><strong>Human Oversight:</strong> Implement human review for high-risk AI decisions</li>
            <li><strong>Data Governance:</strong> Ensure training data is documented and legally sourced</li>
            <li><strong>Registration:</strong> Register high-risk AI systems in the EU database</li>
        </ul>

        <h3>Common AI Systems in {industry_name}</h3>
        <p>Typical {industry_name.lower()} businesses use AI for: {pain}. Each of these may trigger compliance obligations.</p>

        <h3>Penalties for Non-Compliance</h3>
        <p>Fines for EU AI Act violations reach up to <strong>€35 million or 7% of global annual turnover</strong>, whichever is higher. For {industry_name.lower()} businesses, even moderate fines could be devastating.</p>
        """,

        "checklist": f"""
        <h2>EU AI Act Compliance Checklist for {industry_name}</h2>
        <p>Use this checklist to assess your {industry_name.lower()} business's readiness for the EU AI Act enforcement deadline of <strong>August 2, 2026</strong> ({days_left} days away).</p>

        <h3>Pre-Compliance Checklist</h3>
        <ul>
            <li>☐ Create an inventory of all AI systems used in your {industry_name.lower()} business</li>
            <li>☐ Classify each AI system by risk level (unacceptable, high-risk, limited-risk, minimal-risk)</li>
            <li>☐ Identify which systems process personal or special-category data</li>
            <li>☐ Map AI data flows from input to output</li>
            <li>☐ Document training data sources for each AI system</li>
        </ul>

        <h3>Documentation Checklist</h3>
        <ul>
            <li>☐ Draft an AI Use Policy specific to {industry_name}</li>
            <li>☐ Create a Data Processing Record for AI systems</li>
            <li>☐ Update Privacy Notices to include AI disclosure</li>
            <li>☐ Create Staff AI Training Log templates</li>
            <li>☐ Document human oversight procedures</li>
        </ul>

        <h3>Ongoing Compliance Checklist</h3>
        <ul>
            <li>☐ Register high-risk AI systems in the EU database</li>
            <li>☐ Conduct fundamental rights impact assessments</li>
            <li>☐ Set up continuous monitoring for AI system performance</li>
            <li>☐ Schedule quarterly compliance reviews</li>
            <li>☐ Maintain an incident reporting process for AI failures</li>
        </ul>

        <p><strong>Need help?</strong> Our £150/mo compliance pack covers all of this for {industry_name.lower()} businesses.</p>
        """,

        "risk-assessment": f"""
        <h2>EU AI Act Risk Assessment for {industry_name}</h2>
        <p>Understanding which AI systems in your {industry_name.lower()} business are classified as high-risk under the EU AI Act is the first step to compliance.</p>

        <h3>High-Risk AI Systems Common in {industry_name}</h3>
        <p>The EU AI Act defines high-risk AI systems in Annex III. For {industry_name.lower()} businesses, the following commonly fall into this category:</p>
        <ul>
            <li><strong>AI for {pain.split(",")[0]}:</strong> If this affects individuals' rights or safety, it's likely high-risk</li>
            <li><strong>Automated decision-making:</strong> Any AI that makes decisions about people without human oversight</li>
            <li><strong>Biometric identification:</strong> Facial recognition, voice analysis, or behavioural monitoring</li>
            <li><strong>Critical infrastructure:</strong> AI systems managing essential services</li>
        </ul>

        <h3>Risk Assessment Steps</h3>
        <ol>
            <li><strong>Inventory:</strong> List every AI system your {industry_name.lower()} business uses</li>
            <li><strong>Classify:</strong> Map each system to the EU AI Act risk categories</li>
            <li><strong>Assess:</strong> For high-risk systems, conduct a fundamental rights impact assessment</li>
            <li><strong>Document:</strong> Create technical documentation for each high-risk system</li>
            <li><strong>Register:</strong> Submit high-risk systems to the EU database</li>
        </ol>

        <p><strong>Deadline:</strong> August 2, 2026 — {days_left} days remaining.</p>
        """,

        "documentation-requirements": f"""
        <h2>EU AI Act Documentation Requirements for {industry_name}</h2>
        <p>The EU AI Act requires extensive documentation for AI systems used by {industry_name.lower()} businesses. Here's what you need to prepare.</p>

        <h3>Required Documentation</h3>
        <ul>
            <li><strong>AI Use Policy:</strong> Internal policy governing AI usage in your {industry_name.lower()} business</li>
            <li><strong>Technical Documentation:</strong> For each high-risk AI system, including design, development, and testing details</li>
            <li><strong>Data Processing Records:</strong> Documentation of all personal data processed by AI systems</li>
            <li><strong>Risk Management File:</strong> Ongoing risk assessment and mitigation documentation</li>
            <li><strong>Human Oversight Procedures:</strong> Documented processes for human review of AI decisions</li>
            <li><strong>Incident Reports:</strong> Records of any AI system failures or adverse outcomes</li>
            <li><strong>Conformity Assessment:</strong> Evidence that your AI system meets EU AI Act requirements</li>
        </ul>

        <h3>Documentation Templates for {industry_name}</h3>
        <p>Our compliance pack includes pre-built templates specifically designed for {industry_name.lower()} businesses, saving you weeks of work.</p>
        """,

        "high-risk-systems": f"""
        <h2>High-Risk AI Systems in {industry_name} — What You Need to Know</h2>
        <p>Under the EU AI Act, high-risk AI systems face the strictest requirements. Here's what {industry_name.lower()} businesses need to understand.</p>

        <h3>What Makes an AI System High-Risk?</h3>
        <p>An AI system is classified as high-risk if it:</p>
        <ul>
            <li>Is used as a safety component in regulated products</li>
            <li>Falls under one of the categories in Annex III of the EU AI Act</li>
            <li>Poses significant risk to health, safety, or fundamental rights</li>
        </ul>

        <h3>High-Risk AI in {industry_name}</h3>
        <p>Common high-risk AI systems in {industry_name.lower()} include: {pain}.</p>

        <h3>Obligations for High-Risk AI Systems</h3>
        <ul>
            <li>Register in the EU database before placing on the market</li>
            <li>Conduct conformity assessment</li>
            <li>Implement quality management system</li>
            <li>Maintain technical documentation</li>
            <li>Ensure human oversight</li>
            <li>Monitor performance throughout lifecycle</li>
            <li>Report serious incidents</li>
        </ul>

        <p><strong>Deadline:</strong> August 2, 2026. {days_left} days remaining.</p>
        """,

        "transparency-obligations": f"""
        <h2>EU AI Act Transparency Obligations for {industry_name}</h2>
        <p>The EU AI Act requires {industry_name.lower()} businesses to be transparent about their use of AI systems. Here's what you need to disclose.</p>

        <h3>What You Must Disclose</h3>
        <ul>
            <li><strong>AI Interaction:</strong> Users must know when they're interacting with an AI system</li>
            <li><strong>Emotion Recognition:</strong> If you use AI to detect emotions, this must be disclosed</li>
            <li><strong>Biometric Categorisation:</strong> Any AI that categorises people by biometric data must be disclosed</li>
            <li><strong>AI-Generated Content:</strong> Content generated by AI must be labelled as such</li>
        </ul>

        <h3>How to Disclose AI Usage in {industry_name}</h3>
        <p>For {industry_name.lower()} businesses, transparency disclosures should appear:</p>
        <ul>
            <li>On your website (privacy policy + dedicated AI disclosure page)</li>
            <li>In customer communications (emails, contracts, terms of service)</li>
            <li>At the point of AI interaction (chatbots, automated systems)</li>
            <li>In staff training materials</li>
        </ul>

        <p><strong>Need a template?</strong> Our compliance pack includes a ready-to-use AI disclosure template for {industry_name.lower()} businesses.</p>
        """,

        "human-oversight": f"""
        <h2>Human Oversight Requirements for AI in {industry_name}</h2>
        <p>Article 14 of the EU AI Act requires human oversight for high-risk AI systems. Here's what {industry_name.lower()} businesses need to implement.</p>

        <h3>What Human Oversight Means</h3>
        <p>Human oversight means that a person can:</p>
        <ul>
            <li>Understand the AI system's capabilities and limitations</li>
            <li>Identify when the AI system is producing incorrect or biased outputs</li>
            <li>Override or stop the AI system's decision</li>
            <li>Intervene before the AI system's output affects a person</li>
        </ul>

        <h3>Implementing Human Oversight in {industry_name}</h3>
        <p>For {industry_name.lower()} businesses, human oversight procedures should include:</p>
        <ul>
            <li>Documented review processes for AI-generated decisions</li>
            <li>Staff training on AI system limitations</li>
            <li>Clear escalation paths when AI outputs are questionable</li>
            <li>Regular audits of AI system performance</li>
            <li>Incident reporting for AI failures</li>
        </ul>

        <p><strong>Our compliance pack</strong> includes human oversight procedure templates specifically designed for {industry_name.lower()} businesses.</p>
        """,

        "data-governance": f"""
        <h2>EU AI Act Data Governance for {industry_name}</h2>
        <p>The EU AI Act requires robust data governance for AI systems used by {industry_name.lower()} businesses. Here's what you need to know.</p>

        <h3>Data Governance Requirements</h3>
        <ul>
            <li><strong>Training Data:</strong> Must be relevant, representative, and free of errors</li>
            <li><strong>Data Documentation:</strong> Sources, collection methods, and processing steps must be documented</li>
            <li><strong>Data Quality:</strong> Ongoing monitoring of data quality throughout the AI system's lifecycle</li>
            <li><strong>Bias Mitigation:</strong> Processes to identify and mitigate biases in training data</li>
            <li><strong>Data Protection:</strong> Compliance with UK GDPR for personal data processed by AI</li>
        </ul>

        <h3>Data Governance for {industry_name}</h3>
        <p>For {industry_name.lower()} businesses, data governance is particularly important because: {pain}.</p>

        <p><strong>Our compliance pack</strong> includes data governance templates and checklists for {industry_name.lower()} businesses.</p>
        """,

        "conformity-assessment": f"""
        <h2>EU AI Act Conformity Assessment for {industry_name}</h2>
        <p>High-risk AI systems used by {industry_name.lower()} businesses must undergo a conformity assessment before being placed on the market. Here's the process.</p>

        <h3>Conformity Assessment Steps</h3>
        <ol>
            <li><strong>Internal Control:</strong> Self-assessment against EU AI Act requirements</li>
            <li><strong>Technical Documentation:</strong> Compile all required documentation</li>
            <li><strong>Quality Management:</strong> Implement a quality management system</li>
            <li><strong>Declaration of Conformity:</strong> Issue a declaration stating compliance</li>
            <li><strong>CE Marking:</strong> Apply CE marking to the AI system</li>
            <li><strong>Registration:</strong> Register the system in the EU database</li>
        </ol>

        <h3>Conformity Assessment for {industry_name}</h3>
        <p>For {industry_name.lower()} businesses, the conformity assessment process can be complex. Our compliance pack simplifies it with step-by-step guidance and templates.</p>

        <p><strong>Deadline:</strong> August 2, 2026. {days_left} days remaining.</p>
        """,

        "penalties-fines": f"""
        <h2>EU AI Act Penalties and Fines for {industry_name}</h2>
        <p>The EU AI Act imposes significant penalties for non-compliance. Here's what {industry_name.lower()} businesses face if they don't comply by August 2, 2026.</p>

        <h3>Penalty Tiers</h3>
        <ul>
            <li><strong>Prohibited AI practices:</strong> Up to €35 million or 7% of global annual turnover</li>
            <li><strong>High-risk AI violations:</strong> Up to €15 million or 3% of global annual turnover</li>
            <li><strong>Transparency violations:</strong> Up to €10 million or 2% of global annual turnover</li>
            <li><strong>Incorrect information:</strong> Up to €7.5 million or 1.5% of global annual turnover</li>
        </ul>

        <h3>Impact on {industry_name} Businesses</h3>
        <p>For a typical {industry_name.lower()} business with £2M annual turnover, the maximum fines would be:</p>
        <ul>
            <li>Prohibited AI: £140,000</li>
            <li>High-risk violations: £60,000</li>
            <li>Transparency violations: £40,000</li>
            <li>Incorrect information: £30,000</li>
        </ul>

        <p><strong>Our £150/mo compliance pack</strong> helps {industry_name.lower()} businesses avoid these penalties entirely.</p>
        """
    }

    content = content_sections.get(compliance_type, content_sections["complete-guide"])

    # FAQ section
    faqs = [
        {
            "q": f"Does the EU AI Act apply to {industry_name.lower()} businesses?",
            "a": f"Yes. If your {industry_name.lower()} business uses any AI systems — including automated scheduling, predictive analytics, or decision-making tools — you have obligations under the EU AI Act. The enforcement deadline is August 2, 2026."
        },
        {
            "q": f"What happens if my {industry_name.lower()} business doesn't comply?",
            "a": f"Fines range from €7.5 million to €35 million, or 1.5% to 7% of global annual turnover. For most {industry_name.lower()} businesses, even the lowest tier would be financially devastating."
        },
        {
            "q": f"How much does EU AI Act compliance cost for {industry_name.lower()} businesses?",
            "a": f"Traditional consulting costs £15,000-£50,000. Our compliance pack provides everything a {industry_name.lower()} business needs for just £150/month, including templates, attestation certificates, and quarterly expert reviews."
        },
        {
            "q": f"When is the EU AI Act enforcement deadline?",
            "a": f"August 2, 2026 — {days_left} days from today. High-risk AI systems must be registered and compliant by this date."
        }
    ]

    faq_html = "\n".join([f"""
        <div style="background:var(--bg); border-radius:8px; padding:16px; margin-bottom:12px;">
            <h3 style="font-size:1rem; margin-bottom:8px;">{f['q']}</h3>
            <p style="color:var(--text-muted); font-size:0.9rem;">{f['a']}</p>
        </div>
    """ for f in faqs])

    # Schema.org structured data
    schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": f"EU AI Act Compliance for {industry_name}: {type_name}",
        "description": f"Complete guide to EU AI Act compliance for {industry_name.lower()} businesses. Deadline: August 2, 2026. Free assessment + £150/mo compliance pack.",
        "author": {
            "@type": "Organization",
            "name": "MEOK AI Labs",
            "url": "https://meok.ai"
        },
        "publisher": {
            "@type": "Organization",
            "name": "MEOK AI Labs",
            "url": "https://meok.ai"
        },
        "datePublished": datetime.now().strftime("%Y-%m-%d"),
        "dateModified": datetime.now().strftime("%Y-%m-%d"),
        "mainEntityOfPage": f"https://meok.ai/eu-ai-act/{industry}/{compliance_type}"
    }

    # Full HTML page
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{primary_kw} — MEOK AI Labs</title>
    <meta name="description" content="{secondary_kw}. Deadline: August 2, 2026. Free assessment + £150/mo compliance pack for {industry_name.lower()} businesses.">
    <link rel="canonical" href="https://meok.ai/eu-ai-act/{industry}/{compliance_type}">
    <meta property="og:title" content="{primary_kw}">
    <meta property="og:description" content="{secondary_kw}. Deadline: August 2, 2026.">
    <meta property="og:type" content="article">
    <meta property="og:url" content="https://meok.ai/eu-ai-act/{industry}/{compliance_type}">
    <script type="application/ld+json">{json.dumps(schema)}</script>
    <style>
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a2e; background: #f8f9fa; }}
        .container {{ max-width: 800px; margin: 0 auto; padding: 0 20px; }}
        header {{ background: #1a1a2e; color: white; padding: 40px 0 30px; }}
        header h1 {{ font-size: 1.8rem; margin-bottom: 8px; }}
        header p {{ opacity: 0.8; font-size: 1rem; }}
        .deadline {{ display: inline-flex; align-items: center; gap: 8px; background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4); padding: 6px 12px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; margin-top: 12px; }}
        .deadline .pulse {{ width: 6px; height: 6px; background: #ef4444; border-radius: 50%; animation: pulse 2s infinite; }}
        @keyframes pulse {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.4; }} }}
        main {{ padding: 32px 0; }}
        main h2 {{ font-size: 1.4rem; margin: 24px 0 12px; }}
        main h3 {{ font-size: 1.1rem; margin: 20px 0 8px; }}
        main p {{ margin-bottom: 16px; color: #374151; }}
        main ul, main ol {{ margin: 12px 0 16px 24px; }}
        main li {{ margin-bottom: 6px; color: #374151; }}
        .cta-box {{ background: #1a1a2e; color: white; border-radius: 12px; padding: 24px; margin: 32px 0; text-align: center; }}
        .cta-box h3 {{ color: #4ade80; margin-bottom: 8px; }}
        .cta-box p {{ color: rgba(255,255,255,0.8); margin-bottom: 16px; }}
        .cta-box a {{ display: inline-block; background: #4ade80; color: #1a1a2e; padding: 12px 24px; border-radius: 8px; font-weight: 600; text-decoration: none; }}
        .cta-box a:hover {{ background: #22c55e; }}
        .breadcrumb {{ font-size: 0.85rem; color: #6b7280; margin-bottom: 16px; }}
        .breadcrumb a {{ color: #4ade80; text-decoration: none; }}
        footer {{ text-align: center; padding: 32px 0; color: #6b7280; font-size: 0.85rem; border-top: 1px solid #e5e7eb; }}
        footer a {{ color: #22c55e; text-decoration: none; }}
        @media (max-width: 640px) {{ header h1 {{ font-size: 1.4rem; }} main h2 {{ font-size: 1.2rem; }} }}
    </style>
</head>
<body>
<header>
    <div class="container">
        <div class="breadcrumb"><a href="https://meok.ai">MEOK AI Labs</a> → <a href="https://meok.ai/eu-ai-act">EU AI Act</a> → <a href="https://meok.ai/eu-ai-act/{industry}">{industry_name}</a> → {type_name}</div>
        <h1>{primary_kw}</h1>
        <p>{long_tail}</p>
        <div class="deadline"><span class="pulse"></span> Enforcement: August 2, 2026 — {days_left} days remaining</div>
    </div>
</header>
<main>
    <div class="container">
        {content}

        <h2>Frequently Asked Questions</h2>
        {faq_html}

        <div class="cta-box">
            <h3>Get Compliant in 48 Hours</h3>
            <p>Everything your {industry_name.lower()} business needs for EU AI Act compliance. £150/month, includes templates, attestation, and expert review.</p>
            <a href="https://meok.ai/care-homes">Start Free Trial →</a>
        </div>
    </div>
</main>
<footer>
    <div class="container">
        <p>© 2026 <a href="https://meok.ai">MEOK AI Labs</a> — EU AI Act compliance automation</p>
        <p style="margin-top:4px;">UK Companies House 16939677 · nicholas@csoai.org</p>
    </div>
</footer>
</body>
</html>"""

    return html


def main():
    output_dir = os.path.expanduser("~/clawd/meok-ai-act-pages")
    os.makedirs(output_dir, exist_ok=True)

    count = 0
    for industry in industries:
        for ctype in compliance_types:
            html = generate_page(industry, ctype)
            filename = f"{industry}-{ctype}.html"
            filepath = os.path.join(output_dir, filename)
            with open(filepath, 'w') as f:
                f.write(html)
            count += 1

    print(f"Generated {count} SEO pages in {output_dir}")
    print(f"Total industries: {len(industries)}")
    print(f"Total compliance types: {len(compliance_types)}")
    print(f"Total pages: {len(industries)} × {len(compliance_types)} = {count}")


if __name__ == "__main__":
    main()

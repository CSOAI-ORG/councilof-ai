#!/usr/bin/env python3
"""
CSOAI Cold Outreach Email Template Generator
=============================================
Generates personalized cold outreach emails with follow-up sequences.
Zero dependencies - uses only Python standard library.

Usage:
    python outreach_email_generator.py --company "Acme Bank" --industry "Banking" --contact "Jane Smith" --pain-point "EU AI Act compliance deadline"
    python outreach_email_generator.py --company "MediCare Plus" --industry "Healthcare" --contact "Dr. Chen" --pain-point "FDA validation delays"
    python outreach_email_generator.py --json --company "EnergyCo" --industry "Energy" --contact "Mike Johnson" --pain-point "NERC CIP compliance"
    python outreach_email_generator.py --sequence-only --company "RetailGiant" --industry "Retail" --contact "Sarah Lee" --pain-point "pricing algorithm fairness"
"""

import argparse
import json
import sys
from datetime import datetime, timedelta


# ============================================================================
# INDUSTRY-SPECIFIC EMAIL TEMPLATES
# ============================================================================

INDUSTRY_TEMPLATES = {
    "banking": {
        "subject_lines": [
            "{company} + EU AI Act: Your {pain_point} solution",
            "7% turnover risk - how {company} can get ahead",
            "The compliance gap most banks miss (and how to close it)",
            "{contact}, quick question about {company}'s AI governance",
            "How [Competitor Bank] reduced compliance costs 60%",
        ],
        "hooks": [
            "With the EU AI Act's August 2026 deadline approaching, {company}'s {pain_point} is likely becoming a board-level priority.",
            "I noticed {company} has been expanding its AI-driven services. Most banking leaders I speak with are concerned about {pain_point} right now.",
            "The CFPB just issued new guidance on AI in lending. {company}'s {pain_point} could be at the center of their next enforcement sweep.",
            "I was reading about {company}'s recent digital transformation. The compliance implications for {pain_point} are significant—and time-sensitive.",
        ],
        "social_proof": [
            "We just helped a Top 10 European bank reduce their AI compliance timeline from 18 months to 90 days, while cutting bias incidents by 94%.",
            "A major US lender used our platform to pass their regulatory exam with zero findings on AI governance—for the first time in 5 years.",
            "Our banking clients average a 73% reduction in compliance preparation time and 100% regulatory exam pass rates.",
        ],
        "value_props": [
            "Multi-agent validation that eliminates single-point bias in credit scoring models",
            "Automated fairness monitoring across 200+ protected class dimensions",
            "Immutable audit trails that satisfy EU AI Act and CFPB documentation requirements",
            "Real-time risk signal detection with automated compliance alerts",
        ],
        "cta_options": [
            "Worth a brief conversation? I can share a personalized compliance assessment for {company}:",
            "I'd love to show you how this works with {company}'s specific setup. Here's a link to your personalized demo:",
            "Can we schedule 15 minutes next week? I'll bring a tailored assessment for {company}'s {pain_point}:",
        ],
        "objection_handlers": {
            "budget": "Our banking clients typically see ROI within 60 days—our average implementation costs less than one compliance consultant for a quarter.",
            "timing": "The EU AI Act deadline is fixed at August 2026. Organizations starting now have a clear path; those waiting until Q4 2025 will face compressed timelines and higher costs.",
            "existing_solution": "Most banks we work with already have model risk management teams. CSOAI augments (not replaces) your existing function—think of it as giving your team AI-powered superpowers.",
            "not_priority": "With 7% global turnover penalties and CFPB enforcement averaging $2.5M per violation, AI compliance is rapidly moving from 'nice-to-have' to existential. Early movers are securing competitive advantages.",
        },
    },
    "healthcare": {
        "subject_lines": [
            "{company}'s FDA clearance - {pain_point} accelerator",
            "How {company} can cut {pain_point} by 8 months",
            "The validation gap that's delaying healthcare AI deployments",
            "{contact}, patient safety + AI compliance at {company}",
            "What FDA inspectors now expect from AI diagnostic systems",
        ],
        "hooks": [
            "FDA's Center for Devices just published updated AI/ML guidance. For {company}, this directly impacts how you approach {pain_point}.",
            "I was reviewing {company}'s pipeline and noticed the potential for {pain_point} to impact your market timeline. Most healthcare AI companies face this exact challenge.",
            "The recent FDA warning letter to [Competitor] for inadequate AI validation has put the entire industry on notice. {company}'s approach to {pain_point} could be a differentiator.",
            "With healthcare AI failing prospective studies at a 67% rate, {company}'s investment in {pain_point} is critical for both compliance and patient outcomes.",
        ],
        "social_proof": [
            "We helped a diagnostic AI startup achieve FDA 510(k) clearance 8 months faster than their initial projection—by automating the validation documentation process.",
            "A major health system reduced their clinical AI validation timeline from 14 months to 6 weeks using our multi-agent validation platform.",
            "Our healthcare clients have a 100% regulatory submission success rate, with zero CRLs (Complete Response Letters) related to AI validation.",
        ],
        "value_props": [
            "6-agent Clinical Validation Council that evaluates models across 50+ demographic subgroups",
            "Automated subgroup analysis that exceeds FDA 510(k) documentation requirements",
            "Immutable audit trails linking every diagnostic recommendation to validation evidence",
            "Post-market surveillance automation that monitors real-world performance continuously",
        ],
        "cta_options": [
            "Could we schedule a brief demo? I'll prepare a validation roadmap specific to {company}'s diagnostics:",
            "I'd love to share how this applies to {company}'s specific use case. Here's your personalized assessment link:",
            "Worth a 15-minute conversation next week? I'll bring insights from 20+ healthcare AI deployments:",
        ],
        "objection_handlers": {
            "budget": "Our healthcare clients average $4.2M in accelerated revenue from faster FDA clearance alone. The platform typically pays for itself within the first month of saved timeline.",
            "timing": "Every month of delayed FDA clearance costs healthcare AI companies an average of $800K in lost revenue. Starting validation preparation now directly accelerates your path to market.",
            "existing_solution": "Most health systems have quality assurance teams, but they lack the automated, continuous validation that regulators now expect. CSOAI complements your clinical team with always-on validation infrastructure.",
            "not_priority": "With the EU AI Act classifying diagnostic AI as HIGH RISK (medical devices), and FDA increasing AI scrutiny, compliance is now a prerequisite for market access—not an afterthought.",
        },
    },
    "insurance": {
        "subject_lines": [
            "{company} + NAIC: solving {pain_point} before the deadline",
            "Proxy discrimination: the risk {company} might not see coming",
            "How {company} can eliminate {pain_point} in 90 days",
            "{contact}, the $50M compliance question for {company}",
            "What state regulators now expect from AI pricing models",
        ],
        "hooks": [
            "The NAIC's Model Bulletin on AI requires documented governance for all AI-driven pricing and underwriting decisions. {company}'s {pain_point} is exactly what regulators are targeting.",
            "With 12 states already enforcing AI-specific insurance regulations, {company}'s approach to {pain_point} could determine your competitive position.",
            "A recent state audit found proxy discrimination in 34% of AI-driven insurance models. {company}'s {pain_point} may have blind spots that traditional testing misses.",
        ],
        "social_proof": [
            "We helped a Fortune 100 insurer pass their state audit with zero proxy discrimination findings—after they had received a $3M fine the previous year.",
            "A major health insurer reduced their pricing complaint rate by 82% within 60 days of implementing our validation platform.",
            "Our insurance clients average 94% reduction in regulatory findings related to AI model fairness.",
        ],
        "value_props": [
            "Multi-agent Actuarial Review Council with full proxy discrimination detection",
            "Compliance Ledger that maintains immutable evidence for every pricing decision",
            "Automated NAIC filing documentation generation",
            "Real-time monitoring for model drift across protected class dimensions",
        ],
        "cta_options": [
            "Can we schedule 15 minutes? I'll prepare a proxy discrimination assessment for {company}:",
            "I'd love to show you how this works for {company}'s specific pricing models. Personalized demo here:",
            "Worth a brief conversation? Here's a link to a tailored assessment for {company}:",
        ],
        "objection_handlers": {
            "budget": "Our insurance clients report average savings of $8M annually from avoided regulatory fines, faster filing approvals, and reduced legal exposure.",
            "timing": "State regulators are accelerating AI audits. Three of our insurance clients received unannounced audits in Q4 2024 alone. Early preparation is the only defense.",
            "existing_solution": "Most insurers have actuarial review, but it's manual and periodic. CSOAI provides continuous, automated validation that catches issues between your quarterly reviews.",
            "not_priority": "With state-level fines reaching $50M per violation and the NAIC expanding enforcement, AI compliance is now a board-level risk management issue.",
        },
    },
    "retail": {
        "subject_lines": [
            "{company}'s pricing algorithms + fairness compliance",
            "The CCPA risk hiding in {company}'s AI stack",
            "How {company} can turn {pain_point} into competitive advantage",
            "{contact}, quick question about {company}'s AI governance",
            "What the FTC's new AI guidance means for {company}",
        ],
        "hooks": [
            "The FTC just signaled increased enforcement on AI-driven pricing and personalization. For {company}, {pain_point} could become a significant liability.",
            "With CCPA/CPRA now explicitly covering automated decision-making, {company}'s approach to {pain_point} needs immediate attention.",
            "I noticed {company} has been investing in AI-powered customer experiences. Most retail leaders I speak with are realizing that {pain_point} is both a compliance risk and a brand reputation issue.",
        ],
        "social_proof": [
            "We helped a global e-commerce platform reduce pricing fairness complaints by 78% while actually improving conversion rates by 12%.",
            "A major retailer avoided a $15M CCPA fine by implementing our automated compliance monitoring just weeks before a regulatory inquiry.",
            "Our retail clients average 91% reduction in customer complaints related to AI-driven decisions.",
        ],
        "value_props": [
            "Commerce Council that monitors pricing algorithms for cross-segment fairness",
            "Trust Matrix that validates recommendation outputs against content safety guidelines",
            "Automated privacy impact assessments for GDPR and CCPA compliance",
            "Real-time consumer complaint correlation with algorithm changes",
        ],
        "cta_options": [
            "Interested in seeing how this applies to {company}? Here's your personalized assessment:",
            "Can we schedule a brief demo? I'll bring relevant retail case studies:",
            "Worth a 15-minute conversation? I can share what similar retailers are doing about {pain_point}:",
        ],
        "objection_handlers": {
            "budget": "Our retail clients see an average 340% ROI within 6 months—from avoided fines, reduced legal costs, and improved customer trust metrics.",
            "timing": "The FTC has already issued 8 AI-related enforcement actions in 2024. The regulatory window is closing—early movers will have significant advantages.",
            "existing_solution": "Most retail legal teams handle compliance reactively. CSOAI provides proactive, continuous monitoring that catches issues before they become enforcement actions.",
            "not_priority": "A single CCPA violation can cost $7,500 per affected consumer. For a retailer with 100K customers, that's $750M in exposure. AI compliance is now existential.",
        },
    },
    "automotive": {
        "subject_lines": [
            "{company}'s SOTIF compliance - {pain_point} solved",
            "Type approval: how {company} can accelerate {pain_point}",
            "The safety validation gap most AV programs miss",
            "{contact}, EU type approval + {company}'s AI systems",
            "Why {company} needs continuous AI validation (not just pre-launch)",
        ],
        "hooks": [
            "UNECE R157 type approval now requires documented AI safety validation for all automated driving systems. {company}'s {pain_point} is directly in scope.",
            "With the EU requiring SOTIF compliance for all L3+ systems by 2026, {company}'s approach to {pain_point} could determine your European market access.",
            "The recent NHTSA investigation into [Competitor]'s AI perception system has put the entire industry on notice. {company}'s {pain_point} strategy needs to be bulletproof.",
        ],
        "social_proof": [
            "We helped an L3 autonomy program achieve SOTIF compliance 40% faster than their initial timeline—by automating edge case validation across 10,000+ scenarios.",
            "A major OEM used our Safety Council to pass their UNECE type approval on the first attempt—avoiding a 6-month delay and $50M in lost European revenue.",
            "Our automotive clients have validated their AI systems across 50,000+ scenarios with zero safety-critical failures in production.",
        ],
        "value_props": [
            "Safety Council with multi-agent validation across 10,000+ edge case scenarios",
            "Safety Ledger providing immutable evidence exceeding SOTIF requirements",
            "Automated regression testing preventing safety degradation in OTA updates",
            "Real-time safety signal monitoring with automated escalation protocols",
        ],
        "cta_options": [
            "Can we schedule 15 minutes? I'll prepare a SOTIF validation roadmap for {company}:",
            "I'd love to show you how this works for {company}'s specific autonomy stack. Demo here:",
            "Worth a conversation? Here's a tailored assessment for {company}'s safety validation needs:",
        ],
        "objection_handlers": {
            "budget": "Our automotive clients average $25M in savings from accelerated type approval alone. A single 6-month delay in European market entry costs far more than our platform.",
            "timing": "UNECE type approval processes take 12-18 months. Starting validation preparation now gives {company} the best chance of meeting the 2026 EU deadline.",
            "existing_solution": "Most automotive safety teams focus on physical testing. CSOAI adds the AI-specific validation layer that's now required for type approval—complementing, not replacing, your existing safety processes.",
            "not_priority": "Without UNECE type approval, {company} cannot sell L3+ vehicles in the EU—the world's second-largest auto market. This is a market access prerequisite.",
        },
    },
    "manufacturing": {
        "subject_lines": [
            "{company}'s predictive maintenance + safety compliance",
            "How {company} can prevent {pain_point} before it happens",
            "The ISO standard most manufacturers overlook for AI",
            "{contact}, operational risk + AI at {company}",
            "Why {company} needs AI governance for Industry 4.0",
        ],
        "hooks": [
            "The EU AI Act classifies manufacturing AI in critical infrastructure as HIGH RISK. {company}'s {pain_point} now falls under the strictest compliance requirements.",
            "With product recalls averaging $50M-$500M in manufacturing, {company}'s approach to {pain_point} is both a safety and financial imperative.",
            "OSHA just issued new guidance on AI in manufacturing safety systems. {company}'s {pain_point} strategy needs to align with these evolving requirements.",
        ],
        "social_proof": [
            "We helped a Tier 1 automotive supplier eliminate false negatives in their safety inspection system—preventing an estimated $200M in potential recall costs.",
            "A global manufacturer reduced their AI-related safety incidents by 97% within 90 days of implementing our validation platform.",
            "Our manufacturing clients average 89% reduction in compliance-related downtime.",
        ],
        "value_props": [
            "Industrial Council validating models against safety-critical failure modes",
            "Quality Assurance Matrix with multi-agent inspection validation",
            "Full traceability for ISO 9001 quality management integration",
            "Privacy Shield for edge-based worker monitoring data processing",
        ],
        "cta_options": [
            "Can we schedule a brief demo? I'll bring a tailored assessment for {company}:",
            "Interested in seeing how this applies to {company}'s operations? Personalized demo here:",
            "Worth a 15-minute conversation? I can share relevant manufacturing case studies:",
        ],
        "objection_handlers": {
            "budget": "Our manufacturing clients average $12M in annual savings from prevented recalls, reduced downtime, and avoided OSHA penalties.",
            "timing": "The EU AI Act's manufacturing provisions take effect August 2026. For complex industrial systems, the implementation timeline is 12-18 months. Starting now is essential.",
            "existing_solution": "Most manufacturers have quality and safety programs, but they lack AI-specific validation. CSOAI adds the intelligent monitoring layer that traditional QMS systems cannot provide.",
            "not_priority": "A single product recall costs manufacturers an average of $150M in direct costs plus immeasurable brand damage. AI validation is preventive insurance at a fraction of the cost.",
        },
    },
    "energy": {
        "subject_lines": [
            "{company} + NERC CIP: solving {pain_point}",
            "Grid AI compliance: how {company} stays ahead",
            "The $1.5M/day risk in {company}'s AI systems",
            "{contact}, critical infrastructure + AI governance",
            "NIS2 readiness: {company}'s AI compliance roadmap",
        ],
        "hooks": [
            "NERC CIP violations now carry penalties of up to $1.5M per day. For {company}, {pain_point} could be the difference between compliance and catastrophic fines.",
            "The EU NIS2 Directive expands critical infrastructure AI governance requirements significantly. {company}'s approach to {pain_point} needs to evolve rapidly.",
            "With grid optimization AI directly controlling critical infrastructure, {company}'s {pain_point} is now a national security issue as well as a regulatory one.",
        ],
        "social_proof": [
            "We helped a European TSO prevent 3 grid instability events through AI validation—each event could have resulted in $100M+ in damages and regulatory penalties.",
            "A major US utility achieved NERC CIP compliance for their AI systems in 60 days, avoiding a potential $45M annual penalty exposure.",
            "Our energy clients maintain 99.97% compliance rates with all applicable AI governance frameworks.",
        ],
        "value_props": [
            "Grid Council validating optimization across 500+ contingency scenarios",
            "Resilience Matrix monitoring model performance during extreme events",
            "Immutable audit trails satisfying NERC CIP evidence requirements",
            "Automated compliance reporting for NIS2 and sectoral regulators",
        ],
        "cta_options": [
            "Can we schedule 15 minutes? I'll prepare a NERC CIP readiness assessment for {company}:",
            "I'd love to show you how this works for grid operations. Personalized demo here:",
            "Worth a conversation? Here's a tailored assessment for {company}'s critical infrastructure AI:",
        ],
        "objection_handlers": {
            "budget": "Our energy clients average $30M in annual savings from avoided NERC penalties, prevented outages, and optimized grid operations.",
            "timing": "NERC enforcement is intensifying—2024 saw a 40% increase in AI-related CIP violations. Every day without proper validation is $1.5M in potential daily penalties.",
            "existing_solution": "Most utilities have grid operations centers, but they lack AI-specific validation. CSOAI provides the intelligent monitoring that ensures your AI decisions are always compliant and safe.",
            "not_priority": "A single day of NERC CIP non-compliance costs $1.5M. A single grid instability event costs $100M+. AI validation is the lowest-cost risk mitigation available.",
        },
    },
    "government": {
        "subject_lines": [
            "{company}: algorithmic accountability for {pain_point}",
            "Public trust + AI: how {company} leads by example",
            "The EO 14110 requirements {company} needs to address",
            "{contact}, equitable AI governance at {company}",
            "How {company} can set the standard for responsible AI",
        ],
        "hooks": [
            "Executive Order 14110 requires all federal agencies to implement AI governance frameworks by December 2025. {company}'s {pain_point} must be addressed.",
            "With algorithmic accountability becoming a public trust issue, {company}'s approach to {pain_point} will be under increasing scrutiny from citizens and oversight bodies.",
            "The EU AI Act's full applicability to government services means {company}'s {pain_point} is now subject to the strictest compliance requirements in the world.",
        ],
        "social_proof": [
            "We helped a national social security agency eliminate bias findings in their benefits allocation system—restoring public trust and avoiding a congressional inquiry.",
            "A state government reduced their AI-related legal challenges by 91% within 6 months of implementing our governance platform.",
            "Our public sector clients maintain 100% transparency compliance with all FOIA and public disclosure requirements.",
        ],
        "value_props": [
            "Public Sector Council with transparent, auditable validation of all AI systems",
            "Equity Matrix ensuring strict non-discrimination standards",
            "FOIA-ready compliance documentation on public dashboards",
            "Independent algorithmic oversight with civilian accountability",
        ],
        "cta_options": [
            "Can we schedule a briefing? I'll prepare an EO 14110 readiness assessment for {company}:",
            "I'd love to discuss how other agencies are approaching this. Personalized demo here:",
            "Worth a conversation about {company}'s AI governance strategy? Here's a tailored assessment:",
        ],
        "objection_handlers": {
            "budget": "Our public sector clients leverage existing IT modernization budgets. Most implementations require no new appropriations—and the cost of non-compliance (lawsuits, oversight, public trust) far exceeds implementation costs.",
            "timing": "EO 14110's December 2025 deadline is approaching. Agencies starting now can meet requirements; those delaying risk non-compliance with federal mandates.",
            "existing_solution": "Most agencies have IT governance, but lack AI-specific oversight. CSOAI provides the specialized algorithmic accountability framework that general IT governance cannot address.",
            "not_priority": "AI-related lawsuits against government agencies increased 340% in 2024. Congressional oversight hearings on algorithmic bias are becoming routine. This is a mission-critical priority.",
        },
    },
    "legal": {
        "subject_lines": [
            "{company}: malpractice-proofing your AI tools",
            "The 17% hallucination problem at {company}",
            "How {company} can validate legal AI in 30 days",
            "{contact}, ABA competence + AI at {company}",
            "Client privilege + AI: what {company} needs to know",
        ],
        "hooks": [
            "The ABA just issued formal guidance that lawyers using AI must ensure outputs are accurate and reliable. For {company}, {pain_point} is now a competence requirement.",
            "A recent malpractice case centered on hallucinated case citations generated by AI legal research tools. {company}'s {pain_point} could be the difference between trust and liability.",
            "With 43% of law firms now using AI tools, {company}'s approach to {pain_point} will determine whether you lead or lag in the market.",
        ],
        "social_proof": [
            "We helped a Magic Circle firm reduce their AI hallucination rate from 17% to 0.3%—eliminating the risk of citing non-existent precedents.",
            "A major US firm avoided a $5M malpractice claim by implementing our validation system, which caught a critical error their AI tool had introduced.",
            "Our legal clients report 99.7% accuracy in AI-generated work product—with full malpractice insurance documentation.",
        ],
        "value_props": [
            "Legal Council validating outputs against verified legal databases through multi-agent cross-reference",
            "Privilege Vault ensuring client data never leaves secure environments",
            "Immutable validation certificates for every AI-assisted work product",
            "Automated citation verification against official court databases",
        ],
        "cta_options": [
            "Can we schedule 15 minutes? I'll prepare a validation assessment for {company}'s AI tools:",
            "I'd love to show you how this works for legal research. Personalized demo here:",
            "Worth a conversation about malpractice-proofing {company}'s AI? Here's a tailored assessment:",
        ],
        "objection_handlers": {
            "budget": "Our legal clients report that a single avoided malpractice claim pays for 10+ years of platform costs. At $5M average settlement, the ROI is immediate.",
            "timing": "Bar associations are rapidly issuing AI-specific guidance. Firms that establish governance now will set the standard; those that wait risk being forced to comply reactively.",
            "existing_solution": "Most firms have document review and research protocols, but they lack AI-specific validation. CSOAI adds the intelligent verification layer that traditional legal processes cannot provide.",
            "not_priority": "Multiple firms have already faced disciplinary action for AI-related competence failures. Malpractice insurers are beginning to require AI governance documentation. This is becoming a professional requirement.",
        },
    },
    "telecom": {
        "subject_lines": [
            "{company}: 112/999 compliance for AI systems",
            "How {company} can prevent {pain_point} in 60 days",
            "The net neutrality risk in {company}'s AI stack",
            "{contact}, Ofcom readiness + {company}'s AI",
            "Critical infrastructure AI: {company}'s compliance path",
        ],
        "hooks": [
            "The Ofcom Online Safety Act now requires AI content moderation systems to meet strict proportionality standards. {company}'s {pain_point} must comply.",
            "With telecom classified as critical infrastructure under the EU AI Act, {company}'s {pain_point} is subject to the highest compliance requirements—and penalties.",
            "FCC enforcement on AI in network management is increasing. {company}'s approach to {pain_point} could determine your regulatory standing.",
        ],
        "social_proof": [
            "We helped a Tier 1 mobile operator reduce false positives in fraud detection by 89%—eliminating customer complaints and regulatory scrutiny.",
            "A major telecom provider achieved full EU AI Act compliance for their network AI in 45 days, ahead of their competitors.",
            "Our telecom clients maintain 99.9% service reliability while meeting all AI governance requirements.",
        ],
        "value_props": [
            "Telecom Council validating network AI for fairness across subscriber cohorts",
            "Trust & Safety Matrix ensuring content moderation meets proportionality standards",
            "Security Shield protecting 5G/IoT AI models against adversarial attacks",
            "Automated compliance reporting for Ofcom, FCC, and EU regulators",
        ],
        "cta_options": [
            "Can we schedule 15 minutes? I'll prepare a compliance roadmap for {company}:",
            "I'd love to show you how this works for telecom. Personalized demo here:",
            "Worth a conversation about {company}'s AI governance? Here's a tailored assessment:",
        ],
        "objection_handlers": {
            "budget": "Our telecom clients average $15M in annual savings from avoided regulatory fines, reduced customer churn, and optimized network operations.",
            "timing": "Ofcom's enforcement window is opening now. EU AI Act provisions for critical infrastructure take effect August 2026. The preparation window is closing.",
            "existing_solution": "Most telecoms have network operations and fraud teams, but lack AI-specific governance. CSOAI provides the intelligent compliance layer that evolves with your AI systems.",
            "not_priority": "A single service outage from AI failure costs telecoms an average of $50M in SLA penalties and customer churn. Regulatory fines add millions more. This is core risk management.",
        },
    },
}

# Generic fallback template
FALLBACK_TEMPLATE = {
    "subject_lines": [
        "{company} + AI compliance: solving {pain_point}",
        "How {company} can address {pain_point} in 90 days",
        "The AI governance gap most companies miss",
        "{contact}, quick question about {company}'s AI compliance",
    ],
    "hooks": [
        "With AI regulations expanding globally, {company}'s approach to {pain_point} needs immediate attention.",
        "Most companies in the {industry} sector I speak with are concerned about {pain_point}. {company} is likely facing similar challenges.",
        "The regulatory landscape for AI is changing rapidly. {company}'s {pain_point} strategy will determine whether you lead or lag in compliance.",
    ],
    "social_proof": [
        "We've helped 100+ organizations across 10 industries achieve AI compliance 3x faster than traditional approaches.",
        "Our clients average 90%+ reduction in compliance-related risks within 90 days of implementation.",
        "CSOAI is trusted by organizations ranging from Fortune 500 companies to government agencies.",
    ],
    "value_props": [
        "Multi-agent BFT Council for independent AI validation",
        "Pheromone Matrix for continuous risk signal monitoring",
        "Immutable on-chain audit trails for regulatory evidence",
        "Real-time compliance dashboard with automated alerts",
    ],
    "cta_options": [
        "Worth a brief conversation? Here's a personalized assessment for {company}:",
        "Can we schedule 15 minutes? I'll bring insights from similar organizations:",
        "I'd love to show you how this works. Your personalized demo link:",
    ],
    "objection_handlers": {
        "budget": "Our clients typically see ROI within 60-90 days through avoided fines, accelerated timelines, and operational efficiencies.",
        "timing": "AI regulations are already being enforced. Early movers gain competitive advantages; late movers face compressed timelines and higher costs.",
        "existing_solution": "CSOAI augments your existing governance framework—it's like giving your compliance team AI-powered superpowers.",
        "not_priority": "With penalties reaching 7% of global turnover and enforcement accelerating globally, AI compliance is rapidly becoming a board-level imperative.",
    },
}


# ============================================================================
# EMAIL GENERATION ENGINE
# ============================================================================

def get_template(industry):
    """Get the best matching template for an industry."""
    key = industry.lower().strip()
    # Try direct match
    if key in INDUSTRY_TEMPLATES:
        return INDUSTRY_TEMPLATES[key]
    # Try partial match
    for ind_key, template in INDUSTRY_TEMPLATES.items():
        if ind_key in key or key in ind_key:
            return template
    return FALLBACK_TEMPLATE


def generate_email(company, industry, contact, pain_point, template_idx=0):
    """
    Generate a complete cold outreach email package.

    Args:
        company: Target company name
        industry: Industry sector
        contact: Contact person's name
        pain_point: Specific pain point to reference
        template_idx: Which template variant to use (0-2)

    Returns:
        dict: Complete email package with subject, body, html, etc.
    """
    template = get_template(industry)
    first_name = contact.split()[0] if contact else "there"

    # Select template variants
    subject = template["subject_lines"][template_idx % len(template["subject_lines"])]
    hook = template["hooks"][template_idx % len(template["hooks"])]
    social = template["social_proof"][template_idx % len(template["social_proof"])]
    cta = template["cta_options"][template_idx % len(template["cta_options"])]

    # Format with variables
    subject = subject.format(
        company=company,
        contact=first_name,
        pain_point=pain_point,
        industry=industry
    )
    hook = hook.format(
        company=company,
        contact=first_name,
        pain_point=pain_point,
        industry=industry
    )
    cta = cta.format(
        company=company,
        contact=first_name,
        pain_point=pain_point,
        industry=industry
    )

    # Build demo link
    demo_link = f"https://csoai.com/demo?c={company.replace(' ', '%20')}&i={industry.replace(' ', '%20')}&u={pain_point.replace(' ', '%20')}"

    # Plain text body
    body = f"""Hi {first_name},

{hook}

Here's what I'm seeing across the industry:

{social}

Our platform specifically helps with:

"""
    for i, vp in enumerate(template["value_props"][:4], 1):
        body += f"{i}. {vp}\n"

    body += f"""
{cta}

{demo_link}

The assessment takes 2 minutes and will give you a clear picture of where {company} stands.

If this isn't relevant for you right now, I completely understand. Just reply "not now" and I'll circle back in a few months.

Best,
[Your Name]
CSOAI

P.S. - I'm also happy to share our {industry.title()} AI Compliance Playbook (no strings attached). Just reply "playbook" and I'll send it over.
"""

    # HTML version
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #2c3e50; max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #1a3a5c 0%, #2a5a8c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }}
        .header h1 {{ color: white; margin: 0; font-size: 24px; }}
        .header span {{ color: #00b894; }}
        .content {{ background: #f8fafb; padding: 30px; border-radius: 0 0 12px 12px; }}
        .greeting {{ font-size: 18px; font-weight: 600; margin-bottom: 15px; }}
        .hook {{ background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #00b894; margin-bottom: 20px; }}
        .social-proof {{ background: #e8f8f5; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .social-proof strong {{ color: #1a3a5c; }}
        .value-props {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .value-props li {{ margin-bottom: 10px; }}
        .cta {{ text-align: center; margin: 30px 0; }}
        .cta-button {{ display: inline-block; background: linear-gradient(135deg, #00b894 0%, #00a383 100%); color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; }}
        .cta-button:hover {{ transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,184,148,0.3); }}
        .footer {{ text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e8ed; font-size: 14px; color: #5a6c7d; }}
        .ps {{ background: #fff8e1; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 14px; }}
        .risk-badge {{ display: inline-block; background: #e74c3c; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-left: 10px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>CSO<span>AI</span></h1>
    </div>
    <div class="content">
        <div class="greeting">Hi {first_name},</div>

        <div class="hook">
            {hook}
        </div>

        <div class="social-proof">
            <strong>Industry Insight:</strong><br>
            {social}
        </div>

        <p>Here's how CSOAI specifically addresses {company}'s {pain_point}:</p>

        <div class="value-props">
            <ol>
                {"".join(f"<li>{vp}</li>" for vp in template["value_props"][:4])}
            </ol>
        </div>

        <div class="cta">
            <p style="margin-bottom: 15px;">{cta}</p>
            <a href="{demo_link}" class="cta-button">Get Your Free Assessment →</a>
        </div>

        <p style="text-align: center; font-size: 14px; color: #5a6c7d;">
            Takes 2 minutes • No credit card required • Instant results
        </p>

        <p>If this isn't relevant right now, just reply <strong>"not now"</strong> and I'll follow up later.</p>

        <div class="footer">
            <p>Best regards,<br>
            <strong>[Your Name]</strong><br>
            CSOAI - AI-Native Compliance Infrastructure</p>
        </div>

        <div class="ps">
            <strong>P.S.</strong> Reply <strong>"playbook"</strong> and I'll send you our {industry.title()} AI Compliance Playbook—no strings attached.
        </div>
    </div>
</body>
</html>"""

    return {
        "subject": subject,
        "body_plain": body,
        "body_html": html,
        "template_used": industry.lower().strip(),
        "personalization": {
            "company": company,
            "contact": contact,
            "first_name": first_name,
            "industry": industry,
            "pain_point": pain_point,
        },
        "demo_link": demo_link,
    }


def generate_follow_up_sequence(company, industry, contact, pain_point):
    """
    Generate a complete follow-up email sequence.

    Returns dict with Day 0 (initial), Day 3, Day 7, and Day 14 emails.
    """
    first_name = contact.split()[0] if contact else "there"
    template = get_template(industry)
    social = template["social_proof"][0]

    # Day 0 - Initial email
    day0 = generate_email(company, industry, contact, pain_point, template_idx=0)

    # Day 3 - Value add follow-up
    day3_subject = f"Re: {day0['subject']}"
    day3_body = f"""Hi {first_name},

Quick follow-up on my email about {company}'s AI compliance.

I wanted to share something specific: we just published our {industry.title()} AI Compliance Playbook. It includes:

• The complete regulatory timeline for {industry.title()} AI systems
• A self-assessment checklist for {pain_point}
• Case studies from 5 companies in your sector
• The 10 most common compliance gaps (and how to fix them)

No pitch, just useful information. Want me to send it over? Just reply "playbook".

Best,
[Your Name]
CSOAI
"""

    day3_html = f"""<!DOCTYPE html>
<html><body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<p>Hi {first_name},</p>
<p>Quick follow-up on my email about {company}'s AI compliance.</p>
<p>I wanted to share something specific: we just published our <strong>{industry.title()} AI Compliance Playbook</strong>. It includes:</p>
<ul>
<li>The complete regulatory timeline for {industry.title()} AI systems</li>
<li>A self-assessment checklist for {pain_point}</li>
<li>Case studies from 5 companies in your sector</li>
<li>The 10 most common compliance gaps (and how to fix them)</li>
</ul>
<p><strong>No pitch, just useful information.</strong> Want me to send it over? Just reply "playbook".</p>
<p>Best,<br>[Your Name]<br>CSOAI</p>
</body></html>"""

    # Day 7 - Social proof + urgency
    day7_subject = f"How [Similar Company] solved {pain_point}"
    day7_body = f"""Hi {first_name},

I don't want to be annoying, but this is important for {company}.

{social}

The EU AI Act compliance deadline is August 2026. Companies that start their compliance journey now will have a smooth path. Those that wait until 2026 will face:

• Compressed implementation timelines
• Higher consulting costs (supply/demand)
• Increased regulatory scrutiny
• Potential market access restrictions

I'd love to show you a 15-minute demo tailored to {company}'s {pain_point}. No sales pressure—just a walkthrough of what's possible.

Can we find a time this week or next?

{day0['demo_link']}

Best,
[Your Name]
CSOAI

P.S. Still happy to send the {industry.title()} Compliance Playbook. Just reply "playbook".
"""

    day7_html = f"""<!DOCTYPE html>
<html><body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<p>Hi {first_name},</p>
<p>I don't want to be annoying, but this is important for {company}.</p>
<div style="background: #e8f8f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
<strong>{social}</strong>
</div>
<p>The EU AI Act compliance deadline is <strong>August 2026</strong>. Companies that start now will have a smooth path. Those that wait will face compressed timelines, higher costs, and potential market access restrictions.</p>
<p>I'd love to show you a <strong>15-minute demo</strong> tailored to {company}'s {pain_point}. No sales pressure.</p>
<p style="text-align: center;"><a href="{day0['demo_link']}" style="display: inline-block; background: #00b894; color: white; padding: 15px 40px; border-radius: 8px; text-decoration: none; font-weight: 600;">Schedule Demo →</a></p>
<p>Best,<br>[Your Name]<br>CSOAI</p>
</body></html>"""

    # Day 14 - Breakup email
    day14_subject = f"Should I close the loop on {company}'s AI compliance?"
    day14_body = f"""Hi {first_name},

I haven't heard back, so I'll assume AI compliance isn't a priority for {company} right now. That's completely fine—timing is everything.

Before I close the loop, two things:

1. Here's the {industry.title()} AI Compliance Playbook I mentioned. It's genuinely useful regardless of whether we ever speak:
{day0['demo_link']}&playbook=1

2. If {pain_point} becomes urgent down the line, just reply to this email. I'll pick up right where we left off.

No hard feelings either way. Wishing {company} all the best.

[Your Name]
CSOAI

P.S. If you know someone else at {company} who handles AI governance, I'd appreciate an intro. Happy to return the favor.
"""

    day14_html = f"""<!DOCTYPE html>
<html><body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
<p>Hi {first_name},</p>
<p>I haven't heard back, so I'll assume AI compliance isn't a priority for {company} right now. That's completely fine.</p>
<p>Before I close the loop:</p>
<ol>
<li>Here's the <strong>{industry.title()} AI Compliance Playbook</strong>:<br><a href="{day0['demo_link']}&playbook=1">Download Playbook →</a></li>
<li>If {pain_point} becomes urgent, just reply. I'll pick up right where we left off.</li>
</ol>
<p>No hard feelings either way. Wishing {company} all the best.</p>
<p>[Your Name]<br>CSOAI</p>
<p style="font-size: 12px; color: #5a6c7d;">P.S. If you know someone else at {company} who handles AI governance, I'd appreciate an intro.</p>
</body></html>"""

    return {
        "initial": day0,
        "day_3": {
            "subject": day3_subject,
            "body_plain": day3_body,
            "body_html": day3_html,
            "timing": "3 days after initial email",
            "strategy": "Value-add follow-up with no direct pitch. Offer the industry playbook.",
        },
        "day_7": {
            "subject": day7_subject,
            "body_plain": day7_body,
            "body_html": day7_html,
            "timing": "7 days after initial email",
            "strategy": "Social proof + urgency. Emphasize deadline and offer a short demo.",
        },
        "day_14": {
            "subject": day14_subject,
            "body_plain": day14_body,
            "body_html": day14_html,
            "timing": "14 days after initial email",
            "strategy": "Breakup email. Leave on good terms with value (playbook) and request for referral.",
        },
    }


def generate_objection_handler_doc(industry):
    """Generate a document with objection handlers for a specific industry."""
    template = get_template(industry)
    handlers = template.get("objection_handlers", FALLBACK_TEMPLATE["objection_handlers"])

    doc = f"""# Objection Handlers: {industry.title()}

Generated: {datetime.now().strftime('%Y-%m-%d')}

## Common Objections & Responses

"""
    for objection, response in handlers.items():
        title = {
            "budget": "💰 'We don't have the budget'",
            "timing": "⏰ 'Now is not the right time'",
            "existing_solution": "🛠️ 'We already have a solution'",
            "not_priority": "📋 'This isn't a priority right now'",
        }.get(objection, f"❓ '{objection}'")

        doc += f"""### {title}

**Response:**
{response}

**Follow-up question:**
"What would need to change for this to become a priority?"

---

"""

    doc += """## Universal Closing Techniques

1. **Summary Close**: "So we've established that [risk], [timeline], and [penalty]. The next step is a 15-minute demo. Does Tuesday or Wednesday work?"

2. **Puppy Dog Close**: "I'll send you the playbook and a personalized assessment link. Try it out, and if it resonates, we'll talk. No pressure."

3. **Sharp Angle Close**: When they say "send me more info," reply: "Happy to. And if the info checks out, can we schedule a brief demo for next week?"

4. **Takeaway Close**: "This might not be for {company}. It's really designed for organizations that [specific pain]. Does that apply to you?"

5. **Question Close**: "On a scale of 1-10, how critical is {pain_point} for {company} right now?" (If 7+: "Let's schedule a demo." If <7: "What would make it a 10?")
"""

    return doc


# ============================================================================
# OUTPUT FORMATTERS
# ============================================================================

def format_output_text(email_package, sequence=None):
    """Format email package as readable text."""
    output = "=" * 70 + "\n"
    output += "CSOAI COLD OUTREACH EMAIL PACKAGE\n"
    output += "=" * 70 + "\n\n"

    # Initial email
    e = email_package
    output += f"📧 TO: {e['personalization']['contact']} @ {e['personalization']['company']}\n"
    output += f"📋 INDUSTRY: {e['personalization']['industry']}\n"
    output += f"🎯 PAIN POINT: {e['personalization']['pain_point']}\n"
    output += f"🔗 DEMO LINK: {e['demo_link']}\n"
    output += "-" * 70 + "\n\n"

    output += f"SUBJECT: {e['subject']}\n"
    output += "-" * 70 + "\n\n"
    output += e['body_plain']

    if sequence:
        for day, email in sequence.items():
            if day == "initial":
                continue
            output += "\n\n" + "=" * 70 + "\n"
            output += f"FOLLOW-UP: {day.upper()}\n"
            output += f"TIMING: {email['timing']}\n"
            output += f"STRATEGY: {email['strategy']}\n"
            output += "=" * 70 + "\n\n"
            output += f"SUBJECT: {email['subject']}\n"
            output += "-" * 70 + "\n\n"
            output += email['body_plain']

    return output


def format_output_json(email_package, sequence=None):
    """Format as JSON."""
    result = {
        "generated_at": datetime.now().isoformat(),
        "initial_email": email_package,
    }
    if sequence:
        result["follow_up_sequence"] = {
            k: v for k, v in sequence.items() if k != "initial"
        }
    return json.dumps(result, indent=2)


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="CSOAI Cold Outreach Email Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --company "Acme Bank" --industry "Banking" --contact "Jane Smith" --pain-point "EU AI Act compliance"
  %(prog)s --json --company "MediCare" --industry "Healthcare" --contact "Dr. Chen" --pain-point "FDA validation"
  %(prog)s --sequence --company "EnergyCo" --industry "Energy" --contact "Mike J" --pain-point "NERC CIP"
  %(prog)s --template-idx 1 --company "AutoTech" --industry "Automotive" --contact "Lisa W" --pain-point "SOTIF"
  %(prog)s --objection-handlers --industry "Banking"
  %(prog)s --list-industries
        """
    )
    parser.add_argument("--company", help="Target company name")
    parser.add_argument("--industry", help="Industry sector")
    parser.add_argument("--contact", help="Contact person's name")
    parser.add_argument("--pain-point", help="Specific pain point")
    parser.add_argument("--json", action="store_true", help="Output JSON format")
    parser.add_argument("--sequence", action="store_true", help="Include follow-up sequence")
    parser.add_argument("--sequence-only", action="store_true", help="Output only the follow-up sequence")
    parser.add_argument("--template-idx", type=int, default=0, help="Template variant (0-4)")
    parser.add_argument("--objection-handlers", action="store_true", help="Generate objection handler document")
    parser.add_argument("--output-file", help="Save output to file")
    parser.add_argument("--list-industries", action="store_true", help="List available industries")

    args = parser.parse_args()

    if args.list_industries:
        print("=" * 60)
        print("CSOAI Email Generator - Available Industries")
        print("=" * 60)
        for ind_key in sorted(INDUSTRY_TEMPLATES.keys()):
            template = INDUSTRY_TEMPLATES[ind_key]
            print(f"\n📁 {ind_key.title()}")
            print(f"   Subject lines: {len(template['subject_lines'])}")
            print(f"   Hooks: {len(template['hooks'])}")
            print(f"   Social proof stories: {len(template['social_proof'])}")
            objections = ", ".join(template['objection_handlers'].keys())
            print(f"   Objection handlers: {objections}")
        print("\n" + "=" * 60)
        return

    if args.objection_handlers:
        if not args.industry:
            print("ERROR: --industry required for --objection-handlers")
            sys.exit(1)
        output = generate_objection_handler_doc(args.industry)
        if args.output_file:
            with open(args.output_file, "w") as f:
                f.write(output)
            print(f"Objection handlers saved to: {args.output_file}")
        else:
            print(output)
        return

    # Validate required args
    if not all([args.company, args.industry, args.contact, args.pain_point]):
        print("ERROR: --company, --industry, --contact, and --pain-point are required")
        print("Use --list-industries to see available industries")
        sys.exit(1)

    # Generate email
    email = generate_email(
        args.company,
        args.industry,
        args.contact,
        args.pain_point,
        template_idx=args.template_idx
    )

    # Generate sequence if requested
    sequence = None
    if args.sequence or args.sequence_only:
        sequence = generate_follow_up_sequence(
            args.company,
            args.industry,
            args.contact,
            args.pain_point
        )

    # Format output
    if args.json:
        output = format_output_json(email, sequence)
    elif args.sequence_only:
        # Output only the follow-up sequence
        output = ""
        for day, seq_email in sequence.items():
            if day == "initial":
                continue
            output += "=" * 70 + "\n"
            output += f"FOLLOW-UP: {day.upper()}\n"
            output += f"TIMING: {seq_email['timing']}\n"
            output += f"STRATEGY: {seq_email['strategy']}\n"
            output += "=" * 70 + "\n\n"
            output += f"SUBJECT: {seq_email['subject']}\n"
            output += "-" * 70 + "\n\n"
            output += seq_email['body_plain'] + "\n\n"
    else:
        output = format_output_text(email, sequence if args.sequence else None)

    if args.output_file:
        with open(args.output_file, "w") as f:
            f.write(output)
        print(f"Email package saved to: {args.output_file}")
    else:
        print(output)


if __name__ == "__main__":
    main()

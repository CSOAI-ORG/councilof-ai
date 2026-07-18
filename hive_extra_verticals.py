#!/usr/bin/env python3
"""Conversion-page configs for the legal / automotive / healthcare hives.

Matches the schema of DOMAINS in build_hive_conversion_pages.py.
Importable; defines DOMAINS_EXTRA only.
"""

DOMAINS_EXTRA = {
    "landlaw": {
        "domain": "landlaw.ai",
        "name": "LandLaw",
        "sector": "legal",
        "hero": "UK planning permission & land law, answered in seconds.",
        "sub": "Instant AI guidance on planning permission, permitted development, boundary disputes and land law — reviewed by UK solicitors, with one-click escalation when it matters.",
        "features": [
            ("🏘️ Planning checks", "Permitted development rights, LPA requirements and appeal routes, explained for your exact situation."),
            ("⚖️ Legal research", "Case law, statute and government guidance summarised with proper citations you can verify."),
            ("📄 Document drafting", "Generate letters to neighbours, councils and solicitors — formal, accurate and ready to send."),
            ("👨‍⚖️ Solicitor handoff", "Escalate to a verified UK land-law solicitor the moment your matter needs human sign-off."),
        ],
        "tiers": [
            ("Free advice", "£0", "forever", ["5 AI questions / month", "Planning & PD basics", "Citation-backed answers"], "Ask a question"),
            ("Pro", "£29", "per month", ["Unlimited AI questions", "Document drafting", "Priority solicitor referral"], "Start free trial"),
            ("Firm", "£99", "per seat / month", ["Multi-matter workspace", "Team seats & audit trail", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "LandLaw Partner Program",
            "blurb": "Solicitors, planning consultants and conveyancers refer clients, white-label the assistant, and earn recurring revenue on every upgrade.",
            "benefits": [
                "20% recurring commission on referrals",
                "White-label planning advice widget",
                "Verified solicitor referral inbox",
                "Co-branded client portal & reporting",
            ],
        },
        "enterprise": {
            "title": "LandLaw for Enterprise",
            "blurb": "Law firms, housebuilders and local authorities deploy AI-assisted planning and land-law research across teams with full audit and IG compliance.",
            "benefits": [
                "Multi-matter, multi-team workspaces",
                "Audit trail & matter-level cost codes",
                "UK data residency & IG compliance",
                "SSO and dedicated legal-ops support",
            ],
        },
        "mcps": [
            ("landlaw-ai-mcp.check_planning", "Check planning permission and permitted development rights for any UK site from an AI agent or workflow."),
            ("landlaw-ai-mcp.draft_letter", "Generate citation-backed planning and land-law letters directly from your case-management system."),
        ],
    },
    "commercialvehicle": {
        "domain": "commercialvehicle.ai",
        "name": "CommercialVehicle",
        "sector": "automotive",
        "hero": "Commercial vehicles for sale & fleet management in one platform.",
        "sub": "Buy, sell and run vans, trucks and trailers with AI-powered listings, valuation, O-licence compliance and live fleet telemetry.",
        "features": [
            ("🚛 Smart listings", "AI-generated descriptions, instant valuation and buyer matching for every commercial vehicle you list."),
            ("✅ Compliance hub", "MOT, tachograph, O-licence and maintenance reminders tracked automatically across your fleet."),
            ("📍 Fleet telematics", "Live tracking, route history and driver-behaviour scoring from one dashboard."),
            ("💳 Trade finance", "Connect to HP, lease and insurance introducers to close deals faster."),
        ],
        "tiers": [
            ("Trader", "£49", "per month", ["Up to 25 active listings", "AI valuation & descriptions", "Buyer enquiry inbox"], "Start free trial"),
            ("Fleet", "£149", "per month", ["Unlimited vehicles", "Compliance & telematics hub", "Driver behaviour reports"], "Start free trial"),
            ("Enterprise", "Custom", "POA", ["Multi-depot management", "Trade finance integrations", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "CommercialVehicle Partner Program",
            "blurb": "Dealers, brokers and finance introducers list stock, refer fleets and earn commission on every sale and subscription.",
            "benefits": [
                "Commission on referred sales & finance",
                "White-label dealer marketplace",
                "Shared stock & enquiry dashboard",
                "Co-marketing and lead attribution",
            ],
        },
        "enterprise": {
            "title": "CommercialVehicle for Enterprise",
            "blurb": "National operators and logistics firms manage acquisition, compliance and telematics for entire fleets through one procurement layer.",
            "benefits": [
                "Multi-depot fleet allocation",
                "O-licence & tacho audit reporting",
                "Telematics & ERP integrations",
                "SSO, approvals and consolidated billing",
            ],
        },
        "mcps": [
            ("commercialvehicle-ai-mcp.value_vehicle", "Get instant AI valuations for any commercial vehicle from a CRM, spreadsheet or agent."),
            ("commercialvehicle-ai-mcp.check_compliance", "Pull MOT, tacho and O-licence compliance status for a fleet directly via MCP."),
        ],
    },
    "optimobile": {
        "domain": "optimobile.ai",
        "name": "Optimobile",
        "sector": "healthcare",
        "hero": "Practice management built for modern opticians.",
        "sub": "NHS GOS, PVN and domiciliary workflows in one AI-assisted platform — purpose-built for independent opticians and small chains.",
        "features": [
            ("👁️ Patient journeys", "Appointments, recalls, RAG-driven recall prioritisation and referral tracking in one timeline."),
            ("💳 NHS + private billing", "GOS claims, PVN invoicing and card payments handled together, with automatic validation."),
            ("🏠 Domiciliary ready", "Mobile-visit scheduling, equipment tracking and carer notes for home and care-home rounds."),
            ("🔒 IG-compliant", "UK/EU data residency, full audit logs and role-based access built in from day one."),
        ],
        "tiers": [
            ("Solo", "£59", "per month", ["1 practitioner", "GOS claims & recalls", "Card payments"], "Start free trial"),
            ("Practice", "£149", "per month", ["Up to 5 practitioners", "PVN & domiciliary workflows", "RAG recall engine"], "Start free trial"),
            ("Chain", "Custom", "POA", ["Multi-site management", "Consolidated GOS reporting", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "Optimobile Partner Program",
            "blurb": "Frame suppliers, lab partners and optical consultants refer practices and earn recurring revenue while extending their service stack.",
            "benefits": [
                "20% recurring commission per practice",
                "Co-branded onboarding for clients",
                "Referral and conversion dashboard",
                "Joint marketing to independents",
            ],
        },
        "enterprise": {
            "title": "Optimobile for Enterprise",
            "blurb": "Optical groups and domiciliary providers run GOS billing, recalls and home visits across every branch with central reporting and IG compliance.",
            "benefits": [
                "Multi-site practice management",
                "Consolidated GOS & PVN reporting",
                "Domiciliary fleet & rota scheduling",
                "SSO, IG compliance and audit trail",
            ],
        },
        "mcps": [
            ("optimobile-gos-mcp.validate_claim", "Validate NHS GOS claims for completeness and eligibility before submission, from any workflow."),
            ("optimobile-ai-mcp.schedule_recall", "Trigger RAG-prioritised patient recalls directly from practice systems via MCP."),
        ],
    },
}

#!/usr/bin/env python3
"""Conversion-page configs for the Governance + Developer hive extension.

Matches the DOMAINS schema in build_hive_conversion_pages.py. Each entry has:
  domain, name, sector, hero, sub,
  features  -> 4 (emoji-title, desc) tuples
  tiers     -> 3 (name, price, period, [features], cta) tuples
  partner   -> {title, blurb, benefits[4]}
  enterprise-> {title, blurb, benefits[4]}
  mcps      -> list of (mcp.tool, desc) tuples
"""

DOMAINS_EXTRA = {
    "agisafe": {
        "domain": "agisafe.ai",
        "name": "AGISafe",
        "sector": "governance",
        "hero": "Pre-deployment safety cases for frontier AI.",
        "sub": "Structured, procurement-ready safety cases for frontier and AGI-class systems — from self-assessment to independent evidence the regulator and your board will accept.",
        "features": [
            ("🧠 Frontier safety cases", "Build structured safety arguments for AGI-class models, mapped to the EU AI Act and the UK/US frontier safety frameworks."),
            ("🔬 Pre-deployment evals", "Capability, dangerous-capability and misuse evaluations packaged as defensible, auditable evidence."),
            ("📊 Risk threshold tracking", "Define and monitor capability thresholds, with red-line alerts before a model crosses them."),
            ("📑 Procurement-ready exports", "One-click safety dossiers your customers, auditors and boards can sign off on."),
        ],
        "tiers": [
            ("Self-Assessment", "Free", "forever", ["Safety-case template library", "1 model profile", "EU AI Act gap report"], "Start free"),
            ("Safety Pro", "£499", "per month", ["Unlimited model profiles", "Pre-deployment eval suite", "Procurement-ready exports", "Reviewer collaboration"], "Start Safety Pro"),
            ("Frontier", "Custom", "POA", ["Independent expert review", "Bespoke threshold design", "Regulator liaison support", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "AGISafe Partner Program",
            "blurb": "AI assurance consultancies, audit firms and safety researchers deliver frontier safety cases to their clients on the AGISafe platform.",
            "benefits": [
                "20% recurring revenue share",
                "Co-branded safety-case portal",
                "Reviewer accreditation pathway",
                "Joint go-to-market support",
            ],
        },
        "enterprise": {
            "title": "AGISafe for Enterprise",
            "blurb": "Frontier labs and large model deployers run their entire pre-deployment safety lifecycle through one governed evidence layer.",
            "benefits": [
                "Org-wide safety-case management",
                "SSO, audit logs and RBAC",
                "Dedicated safety engineer",
                "Continuous threshold monitoring",
            ],
        },
        "mcps": [
            ("eu-ai-act-compliance-mcp.assess", "Run a structured EU AI Act risk assessment from any agent or workflow."),
            ("agisafe-mcp.build_safety_case", "Generate a pre-deployment safety case for a frontier model programmatically."),
        ],
    },
    "asisecurity": {
        "domain": "asisecurity.ai",
        "name": "ASISecurity",
        "sector": "governance",
        "hero": "Pre-deployment security evidence for frontier AI.",
        "sub": "Red-team results, threat models and hardening evidence for frontier and ASI-class systems — packaged as the security evidence pack regulators and customers demand.",
        "features": [
            ("🛡 Frontier red-teaming", "Adversarial, jailbreak and exfiltration testing scoped to ASI-class capabilities and weights security."),
            ("🗂 Threat model builder", "Map attack surfaces, insider risk and model-weight theft into a structured, defensible threat model."),
            ("🔐 Hardening evidence", "Capture controls, mitigations and residual risk as signed, verifiable evidence packs."),
            ("📤 Customer trust exports", "Ship security evidence packs to enterprise buyers and procurement teams on demand."),
        ],
        "tiers": [
            ("Scan", "Free", "forever", ["Threat-model template", "1 system profile", "Baseline risk report"], "Start free"),
            ("Security Pro", "£599", "per month", ["Unlimited system profiles", "Red-team evidence packs", "Hardening tracker", "Signed verifiable exports"], "Start Security Pro"),
            ("Frontier", "Custom", "POA", ["Independent red-team engagement", "Weights-security review", "Incident-response retainer", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "ASISecurity Partner Program",
            "blurb": "Offensive-security firms, pentest providers and AI assurance consultancies deliver frontier security evidence through ASISecurity.",
            "benefits": [
                "20% recurring revenue share",
                "Co-branded evidence portal",
                "Red-team accreditation pathway",
                "Lead-sharing and co-marketing",
            ],
        },
        "enterprise": {
            "title": "ASISecurity for Enterprise",
            "blurb": "Frontier labs and critical-AI operators centralise red-teaming, threat modelling and security evidence in one auditable system.",
            "benefits": [
                "Org-wide evidence management",
                "SSO, audit logs and RBAC",
                "Dedicated security engineer",
                "Continuous red-team coverage",
            ],
        },
        "mcps": [
            ("ai-incident-reporting-mcp.report", "File and track AI security incidents directly from any agent or pipeline."),
            ("asisecurity-mcp.redteam", "Launch automated red-team probes and collect signed evidence via MCP."),
        ],
    },
    "cobolbridge": {
        "domain": "cobolbridge.ai",
        "name": "COBOL Bridge",
        "sector": "developer",
        "hero": "Modernise legacy COBOL systems with AI.",
        "sub": "AI-assisted analysis, documentation and migration of mainframe COBOL to modern, maintainable code — without a risky big-bang rewrite.",
        "features": [
            ("🔎 Codebase analysis", "Parse millions of lines of COBOL, map programs, copybooks and JCL, and surface hidden business logic."),
            ("📝 Auto documentation", "Generate up-to-date specs and data-flow docs from legacy code your last expert understood."),
            ("🔄 AI migration", "Translate COBOL to Java, Python or .NET with side-by-side equivalence testing."),
            ("✅ Equivalence testing", "Prove migrated code behaves identically with generated regression and parity test suites."),
        ],
        "tiers": [
            ("Assessment", "£499", "one-off", ["Up to 100k LOC scan", "Migration feasibility report", "Risk & effort estimate"], "Book assessment"),
            ("Migration Project", "Custom", "per project", ["Full codebase migration", "Equivalence test harness", "Dedicated migration lead", "Knowledge transfer"], "Scope a project"),
            ("Managed Modernisation", "Custom", "POA", ["Phased multi-system delivery", "On-prem / air-gapped option", "SLA & support retainer", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "COBOL Bridge Partner Program",
            "blurb": "System integrators, mainframe consultancies and modernisation specialists deliver COBOL migration projects powered by COBOL Bridge.",
            "benefits": [
                "Project revenue share",
                "Co-delivery enablement & training",
                "Reusable migration accelerators",
                "Joint bids and proposal support",
            ],
        },
        "enterprise": {
            "title": "COBOL Bridge for Enterprise",
            "blurb": "Banks, insurers and government departments retire mainframe risk across whole portfolios with governed, auditable migration.",
            "benefits": [
                "Portfolio-wide migration planning",
                "On-prem / air-gapped deployment",
                "Full audit trail & equivalence proofs",
                "Dedicated delivery and support team",
            ],
        },
        "mcps": [
            ("cobol-bridge-mcp.analyze", "Analyse a COBOL codebase and extract business logic from any workflow."),
            ("cobol-bridge-mcp.migrate", "Translate COBOL programs to modern languages with equivalence tests via MCP."),
        ],
    },
    "openmoe": {
        "domain": "openmoe.ai",
        "name": "openmoe",
        "sector": "developer",
        "hero": "Byzantine-fault-tolerant consensus for MoE routing.",
        "sub": "openmoe-bft is an open-source library for Byzantine-fault-tolerant Mixture-of-Experts routing — with built-in EU AI Act compliance attestation for production AI infrastructure.",
        "features": [
            ("🧩 BFT consensus", "Tolerate faulty or adversarial experts with Byzantine-fault-tolerant routing decisions."),
            ("⚖ MoE routing", "Route tokens to the best experts with quorum-verified, reproducible decisions."),
            ("📜 EU AI Act attestation", "Emit signed compliance attestations for every routing decision, ready for audit."),
            ("🔓 Open source", "MIT-licensed core, 183 tests, drop-in for your own MoE stack on PyPI."),
        ],
        "tiers": [
            ("OSS", "Free", "forever", ["Full BFT routing library", "MIT licence", "Community support", "Self-hosted"], "pip install openmoe-bft"),
            ("Cloud", "£99", "per month", ["Hosted consensus API", "Managed attestation store", "Dashboards & alerts", "Email support"], "Start Cloud"),
            ("Enterprise", "Custom", "POA", ["On-prem / VPC deployment", "Compliance SLA", "Custom expert adapters", "Priority support & API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "openmoe Partner Program",
            "blurb": "MLOps platforms, model vendors and AI infra consultancies embed openmoe-bft routing and attestation into their stacks.",
            "benefits": [
                "Revenue share on Cloud referrals",
                "Co-branded integration listing",
                "Early access to roadmap",
                "Joint technical content & demos",
            ],
        },
        "enterprise": {
            "title": "openmoe for Enterprise",
            "blurb": "Teams running mission-critical MoE systems get fault-tolerant routing with audit-grade EU AI Act attestation in their own environment.",
            "benefits": [
                "On-prem / VPC deployment",
                "Compliance attestation SLA",
                "Custom expert and router adapters",
                "Dedicated engineering support",
            ],
        },
        "mcps": [
            ("openmoe-bft-mcp.route", "Make BFT-verified Mixture-of-Experts routing decisions from any agent."),
            ("openmoe-bft-mcp.attest", "Generate signed EU AI Act compliance attestations for routing decisions via MCP."),
        ],
    },
}

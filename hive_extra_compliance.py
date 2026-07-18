#!/usr/bin/env python3
"""Conversion-page configs for the 6 CouncilOf.AI / CSOAI compliance sub-brands.

Matches the schema in build_hive_conversion_pages.py (DOMAINS dict). Each entry
exposes: domain, name, sector, hero, sub, features (4 tuples), tiers (3 tuples),
partner, enterprise, mcps. Import and merge into DOMAINS to generate static sites.
"""

DOMAINS_EXTRA = {
    "safetyof": {
        "domain": "safetyof.ai",
        "name": "SafetyOf",
        "sector": "compliance",
        "hero": "Measure your AI safety posture in 5 minutes.",
        "sub": "Run a free AI Safety Posture Score, see exactly where you fall short of the EU AI Act and ISO 42001, then close the gaps with guided remediation.",
        "features": [
            ("🛡 Free posture score", "A 5-minute self-assessment scores your AI systems against EU AI Act, ISO 42001 and NIST AI RMF controls."),
            ("📊 Gap heatmap", "See red/amber/green across risk management, data governance, human oversight and robustness."),
            ("🧭 Guided remediation", "Each gap comes with a prioritised fix, owner suggestion and evidence template."),
            ("🔁 Continuous monitoring", "Re-score on every model or policy change and track posture trend over time."),
        ],
        "tiers": [
            ("Free Score", "£0", "forever", ["5-minute posture scorecard", "Top-3 gap summary", "Email PDF report"], "Get free score"),
            ("Pro", "£99", "per month", ["Full control-by-control score", "Unlimited re-scans", "Remediation playbooks", "Evidence vault"], "Start Pro"),
            ("Enterprise", "Custom", "POA", ["Multi-entity scoring", "Auditor-ready exports", "SSO + SLA", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "SafetyOf Partner Program",
            "blurb": "Compliance consultants and AI assurance firms resell SafetyOf scoring to their clients and bill ongoing monitoring.",
            "benefits": [
                "20% recurring commission on referred subscriptions",
                "White-label scorecard with your branding",
                "Multi-client console and lead dashboard",
                "Co-marketing and partner certification",
            ],
        },
        "enterprise": {
            "title": "SafetyOf for Enterprise",
            "blurb": "Risk and compliance teams roll out standardised AI safety scoring across every business unit and model.",
            "benefits": [
                "Org-wide posture rollups and benchmarking",
                "Procurement, DPA and security review pack",
                "SSO, RBAC and audit-grade access logs",
                "Guaranteed SLA and dedicated success manager",
            ],
        },
        "mcps": [
            ("eu-ai-act-compliance-mcp.assess", "Run a full EU AI Act risk-and-control assessment from any MCP client or agent workflow."),
            ("ai-safety-posture-mcp.score", "Return a live AI safety posture score for a given system, model or deployment."),
        ],
    },
    "transparencyof": {
        "domain": "transparencyof.ai",
        "name": "TransparencyOf",
        "sector": "compliance",
        "hero": "Prove content origin across AI agents.",
        "sub": "Watermark and sign AI-generated content to meet EU AI Act Article 50, then verify provenance anywhere with tamper-evident C2PA-grade attestations.",
        "features": [
            ("💧 Article 50 watermarking", "Apply machine-readable watermarks to AI text, images and audio to satisfy transparency duties."),
            ("✍ Cryptographic signing", "Ed25519-signed provenance manifests bind content to its origin and model."),
            ("🔎 Public verification", "Anyone can verify origin and detect tampering with a single check."),
            ("🗂 Disclosure registry", "Maintain an auditable log of disclosures for regulators and downstream platforms."),
        ],
        "tiers": [
            ("Free Verify", "£0", "forever", ["Verify any signed asset", "Single-file watermark check", "Public attestation lookup"], "Get free score"),
            ("Pro", "£199", "per month", ["Bulk watermark + sign", "Disclosure registry", "C2PA-grade manifests", "Webhook + API"], "Start Pro"),
            ("Enterprise", "Custom", "POA", ["High-volume signing keys", "On-prem key custody", "SSO + SLA", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "TransparencyOf Partner Program",
            "blurb": "Media, marketing and AI tooling resellers add Article 50 watermarking to their clients' content pipelines.",
            "benefits": [
                "20% recurring commission on referred plans",
                "Embeddable watermark and verify widget",
                "Co-branded provenance landing page",
                "Partner attribution dashboard",
            ],
        },
        "enterprise": {
            "title": "TransparencyOf for Enterprise",
            "blurb": "Content platforms and large publishers watermark every AI output at scale with managed key custody.",
            "benefits": [
                "High-throughput batch signing",
                "Dedicated or on-prem signing keys",
                "Regulator-facing disclosure exports",
                "SSO, audit logs and 24/7 support SLA",
            ],
        },
        "mcps": [
            ("watermarking-authenticity-mcp.sign", "Watermark and cryptographically sign AI-generated content directly from any agent or pipeline."),
            ("watermarking-authenticity-mcp.verify", "Verify content provenance and detect tampering for any signed asset."),
        ],
    },
    "accountabilityof": {
        "domain": "accountabilityof.ai",
        "name": "AccountabilityOf",
        "sector": "compliance",
        "hero": "Tamper-evident audit logs for every AI decision.",
        "sub": "Capture an immutable, append-only trail of every prompt, tool call and model decision — so you can answer regulators, auditors and incident reviews with proof.",
        "features": [
            ("📜 Immutable trail", "Hash-chained, append-only logs make every AI decision tamper-evident and replayable."),
            ("🔗 Full lineage", "Trace each output back through prompts, tools, data sources and model versions."),
            ("🚨 Incident export", "One-click incident pack for EU AI Act, DORA and NIS2 reporting timelines."),
            ("👥 Human-oversight records", "Log approvals, overrides and escalations to evidence meaningful human control."),
        ],
        "tiers": [
            ("Free Trail", "£0", "forever", ["Up to 1,000 logged events/mo", "7-day retention", "Basic decision lookup"], "Get free score"),
            ("Pro", "£99", "per month", ["Unlimited events", "Hash-chained integrity", "12-month retention", "Incident export + API"], "Start Pro"),
            ("Enterprise", "Custom", "POA", ["Long-term archival", "WORM storage option", "SSO + SLA", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "AccountabilityOf Partner Program",
            "blurb": "Auditors, GRC consultants and assurance providers resell accountability logging and run audits on the data.",
            "benefits": [
                "20% recurring commission on referrals",
                "Multi-client auditor console",
                "White-label audit-trail reports",
                "Partner certification and co-marketing",
            ],
        },
        "enterprise": {
            "title": "AccountabilityOf for Enterprise",
            "blurb": "Regulated enterprises centralise AI decision logging across teams with archival-grade retention and access control.",
            "benefits": [
                "Org-wide log aggregation and search",
                "WORM / immutable archival storage",
                "Procurement, DPA and security pack",
                "SSO, RBAC and dedicated SLA",
            ],
        },
        "mcps": [
            ("agent-audit-logger-mcp.record", "Append a tamper-evident audit record for any AI decision from any MCP client."),
            ("ai-incident-reporting-mcp.export", "Generate a regulator-ready incident pack from logged AI decision trails."),
        ],
    },
    "biasdetectionof": {
        "domain": "biasdetectionof.ai",
        "name": "BiasDetectionOf",
        "sector": "compliance",
        "hero": "Find fairness gaps before auditors do.",
        "sub": "Scan your models and datasets for bias across protected attributes, get quantified fairness metrics, and produce the evidence the EU AI Act and the Equality Act demand.",
        "features": [
            ("⚖ Multi-metric scan", "Demographic parity, equalised odds and disparate impact computed across protected groups."),
            ("🧪 Dataset + model testing", "Test training data and live model outputs for skew, proxies and intersectional bias."),
            ("📈 Fairness report", "Auditor-ready report with thresholds, findings and recommended mitigations."),
            ("🔁 Drift alerts", "Re-test on every release and get alerted when fairness regresses."),
        ],
        "tiers": [
            ("Free Scan", "£0", "forever", ["1 model scan / month", "Top fairness metrics", "Summary PDF"], "Get free score"),
            ("Pro", "£199", "per month", ["Unlimited scans", "Full metric suite", "Drift alerts", "Audit report + API"], "Start Pro"),
            ("Enterprise", "Custom", "POA", ["Bulk model pipelines", "Custom protected attributes", "SSO + SLA", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "BiasDetectionOf Partner Program",
            "blurb": "AI assurance firms and DEI/HR-tech consultants resell bias testing and deliver fairness audits to clients.",
            "benefits": [
                "20% recurring commission on referrals",
                "White-label fairness reports",
                "Multi-client testing console",
                "Co-marketing and partner training",
            ],
        },
        "enterprise": {
            "title": "BiasDetectionOf for Enterprise",
            "blurb": "Enterprises bake fairness testing into CI/CD and govern bias across every model in production.",
            "benefits": [
                "Pipeline-integrated bias gates",
                "Custom protected-attribute schemas",
                "Org-wide fairness benchmarking",
                "SSO, audit logs and dedicated SLA",
            ],
        },
        "mcps": [
            ("bias-detection-mcp.scan", "Run a fairness scan on a model or dataset and return quantified bias metrics from any agent."),
            ("eu-ai-act-compliance-mcp.assess", "Map bias findings to EU AI Act high-risk obligations and evidence requirements."),
        ],
    },
    "dataprivacyof": {
        "domain": "dataprivacyof.ai",
        "name": "DataPrivacyOf",
        "sector": "compliance",
        "hero": "Privacy-grade AI from training to inference.",
        "sub": "Automate Data Protection Impact Assessments, map personal-data flows through your AI systems, and prove GDPR and EU AI Act compliance end to end.",
        "features": [
            ("📝 Automated DPIA", "Generate and maintain Data Protection Impact Assessments tailored to each AI use case."),
            ("🗺 Data-flow mapping", "Trace personal data from collection through training, inference and retention."),
            ("🔐 PII detection", "Scan prompts, datasets and outputs for personal data and propose minimisation."),
            ("📋 Rights workflows", "Handle access, erasure and objection requests with audit-logged responses."),
        ],
        "tiers": [
            ("Free DPIA", "£0", "forever", ["1 guided DPIA", "Basic data-flow map", "PDF export"], "Get free score"),
            ("Pro", "£99", "per month", ["Unlimited DPIAs", "PII scanning", "Rights-request workflows", "API + register"], "Start Pro"),
            ("Enterprise", "Custom", "POA", ["Multi-system data mapping", "DPO collaboration tools", "SSO + SLA", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "DataPrivacyOf Partner Program",
            "blurb": "Privacy consultants, DPOs-as-a-service and law firms resell DPIA automation and manage clients' privacy registers.",
            "benefits": [
                "20% recurring commission on referrals",
                "White-label DPIA and register",
                "Multi-client privacy console",
                "Partner certification and co-marketing",
            ],
        },
        "enterprise": {
            "title": "DataPrivacyOf for Enterprise",
            "blurb": "Privacy and legal teams govern personal-data use across every AI system with centralised DPIAs and registers.",
            "benefits": [
                "Org-wide DPIA and ROPA registers",
                "Cross-system data-flow lineage",
                "Procurement, DPA and security pack",
                "SSO, RBAC and dedicated SLA",
            ],
        },
        "mcps": [
            ("data-privacy-dpia-mcp.assess", "Generate or update a GDPR DPIA for an AI use case from any MCP client or workflow."),
            ("pii-detection-mcp.scan", "Detect personal data in prompts, datasets and outputs and suggest minimisation actions."),
        ],
    },
    "ethicalgovernanceof": {
        "domain": "ethicalgovernanceof.ai",
        "name": "EthicalGovernanceOf",
        "sector": "compliance",
        "hero": "Map one policy to every framework.",
        "sub": "Build a certified AI governance program once and crosswalk it across ISO 42001, NIST AI RMF and the EU AI Act — with controls, evidence and certification readiness in one place.",
        "features": [
            ("🧩 Framework crosswalk", "Author a control once and auto-map it to ISO 42001, NIST AI RMF and EU AI Act clauses."),
            ("📚 Policy library", "Ready-made AI policies, roles and procedures aligned to recognised standards."),
            ("✅ Certification readiness", "Track ISO 42001 certification progress with gap analysis and evidence checklists."),
            ("👁 Oversight dashboard", "Board-level view of governance maturity, owners and open actions."),
        ],
        "tiers": [
            ("Free Assess", "£0", "forever", ["Governance maturity self-check", "Single-framework gap view", "Summary report"], "Get free score"),
            ("Pro", "£199", "per month", ["Full multi-framework crosswalk", "Policy library", "Evidence + certification tracker", "API"], "Start Pro"),
            ("Enterprise", "Custom", "POA", ["Certified program rollout", "Auditor collaboration", "SSO + SLA", "API / MCP access"], "Talk to sales"),
        ],
        "partner": {
            "title": "EthicalGovernanceOf Partner Program",
            "blurb": "ISO 42001 lead auditors and governance consultants resell the crosswalk and run certification engagements.",
            "benefits": [
                "20% recurring commission on referrals",
                "White-label governance reports",
                "Multi-client certification console",
                "Lead-auditor partner certification",
            ],
        },
        "enterprise": {
            "title": "EthicalGovernanceOf for Enterprise",
            "blurb": "Enterprises operationalise a single certified AI governance program across every framework and business unit.",
            "benefits": [
                "Org-wide control and evidence library",
                "Multi-standard certification tracking",
                "Procurement, DPA and security pack",
                "SSO, RBAC and dedicated SLA",
            ],
        },
        "mcps": [
            ("ai-governance-crosswalk-mcp.map", "Crosswalk a control or policy across ISO 42001, NIST AI RMF and the EU AI Act from any agent."),
            ("iso-42001-readiness-mcp.assess", "Return ISO 42001 certification readiness with gaps and required evidence."),
        ],
    },
}

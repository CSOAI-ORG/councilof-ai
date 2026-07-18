#!/usr/bin/env python3
"""
CSOAI Personalized Demo Report Generator
========================================
Generates compliance assessment reports for AI use cases across industries.
Zero dependencies - uses only Python standard library.

Usage:
    python demo_report_generator.py --company "Acme Bank" --industry "Banking" --use-case "Credit scoring AI"
    python demo_report_generator.py --company "MediCare Plus" --industry "Healthcare" --use-case "Diagnostic AI"
    python demo_report_generator.py --json --company "Acme Bank" --industry "Banking" --use-case "Credit scoring AI"
"""

import argparse
import json
import sys
from datetime import datetime
from enum import Enum


# ============================================================================
# INDUSTRY DATABASE
# ============================================================================

class RiskLevel(Enum):
    HIGH = "HIGH"
    LIMITED = "LIMITED"
    MINIMAL = "MINIMAL"
    PROHIBITED = "PROHIBITED"


INDUSTRIES = {
    "banking": {
        "display_name": "Banking & Financial Services",
        "regulations": [
            "EU AI Act (Annex III, Point 3)",
            "GDPR Article 22 (Automated Decision-Making)",
            "Fair Credit Reporting Act (FCRA)",
            "ECOA / Regulation B",
            "Basel III/IV Operational Risk",
            "SEC AI Guidance (2024)",
        ],
        "common_risks": [
            "Algorithmic bias in lending decisions leading to discriminatory outcomes",
            "Lack of explainability in credit scoring models",
            "Inadequate human oversight in automated loan approvals",
            "Data quality issues in training datasets",
            "Model drift causing deteriorating fairness metrics over time",
        ],
        "penalty_summary": "Up to 7% of global annual turnover (EU AI Act) + GDPR fines up to EUR 20M or 4% global turnover. US: CFPB enforcement actions averaging $2.5M per violation.",
        "csoai_solution": """CSOAI's BFT Council validates scoring models through multi-agent consensus,
eliminating single-point bias. The Pheromone Matrix continuously tracks 200+
fairness signals across protected class dimensions, alerting when drift exceeds
thresholds. On-chain audit trails provide immutable compliance evidence for
regulators.""",
        "case_study": "Reduced bias incidents by 94% for a Top 10 European bank deploying credit scoring AI",
    },
    "healthcare": {
        "display_name": "Healthcare & Life Sciences",
        "regulations": [
            "EU AI Act (Annex III, Point 1 - Medical Devices)",
            "FDA Software as Medical Device (SaMD)",
            "HIPAA (AI/ML model training data)",
            "GDPR (Health data - Special Category)",
            "MHRA AI Airlock (UK)",
            "EU MDR/IVDR",
        ],
        "common_risks": [
            "Diagnostic AI producing false negatives on underrepresented populations",
            "Training data lacking diversity across demographics",
            "Inadequate clinical validation and post-market surveillance",
            "Patient data privacy breaches in model training pipelines",
            "Lack of explainability for clinical decision support",
        ],
        "penalty_summary": "Up to 7% global turnover (EU AI Act as medical device). FDA Warning Letters, consent decrees. GDPR: up to EUR 20M. MHRA: up to 10% UK turnover.",
        "csoai_solution": """CSOAI's Clinical Validation Council orchestrates 6 independent AI agents that
evaluate diagnostic models across 50+ demographic subgroups. Automated bias
testing runs on every model update. Immutable audit trails link every
diagnostic recommendation to the validation evidence that supports it,
exceeding FDA 510(k) documentation requirements.""",
        "case_study": "Accelerated FDA clearance by 8 months for a diagnostic AI startup using CSOAI validation",
    },
    "insurance": {
        "display_name": "Insurance",
        "regulations": [
            "EU AI Act (Annex III, Point 3 - Insurance)",
            "NAIC AI Model Bulletin",
            "GDPR Article 22",
            "State Insurance Regulation (US)",
            "Solvency II (Operational Risk)",
            "EIOPA AI Guidelines",
        ],
        "common_risks": [
            "Risk scoring algorithms discriminating by proxy variables",
            "Black-box pricing models lacking actuarial justification",
            "Inadequate documentation for regulatory filings",
            "Claims automation denying valid claims unfairly",
            "Lack of appeals process for AI-driven decisions",
        ],
        "penalty_summary": "EU AI Act: up to 7% global turnover. NAIC: state-level enforcement up to $50M per violation. EIOPA: prudential capital add-ons for unvalidated models.",
        "csoai_solution": """CSOAI's Actuarial Review Council provides multi-agent validation of risk scoring
models with full proxy discrimination detection. The Compliance Ledger maintains
immutable evidence of every pricing decision's fairness validation,
streamlining NAIC filing submissions.""",
        "case_study": "Eliminated proxy discrimination findings in state audit for a major US health insurer",
    },
    "retail": {
        "display_name": "Retail & E-Commerce",
        "regulations": [
            "EU AI Act (Limited/Minimal Risk provisions)",
            "GDPR (Profiling & Automated Decision-Making)",
            "CCPA/CPRA (California)",
            "Consumer Protection from Unfair Trading",
            "FTC Act Section 5",
        ],
        "common_risks": [
            "Dynamic pricing algorithms creating discriminatory outcomes",
            "Recommendation engines amplifying harmful content",
            "Customer profiling violating privacy regulations",
            "Fraud detection falsely flagging legitimate transactions",
            "Chatbots providing misleading product information",
        ],
        "penalty_summary": "GDPR: up to EUR 20M or 4% turnover. CCPA: up to $7,500 per violation per consumer. FTC: civil penalties up to $50,120 per violation.",
        "csoai_solution": """CSOAI's Commerce Council monitors pricing algorithms for fairness across
customer segments. The Trust Matrix validates recommendation outputs against
content safety guidelines. Automated privacy impact assessments ensure every
personalization engine meets GDPR/CCPA requirements.""",
        "case_study": "Reduced pricing complaints by 78% for a global e-commerce platform",
    },
    "automotive": {
        "display_name": "Automotive & Mobility",
        "regulations": [
            "EU AI Act (Annex III - Transport)",
            "UNECE R79/R157 (Automated Driving)",
            "ISO 21448 (SOTIF)",
            "ISO 26262 (Functional Safety)",
            "NHTSA Standing General Order",
            "GDPR (Connected Vehicle Data)",
        ],
        "common_risks": [
            "Autonomous driving perception failures in edge cases",
            "Inadequate safety validation for AI-driven controls",
            "Cybersecurity vulnerabilities in AI/ML pipelines",
            "Driver monitoring systems privacy violations",
            "Insufficient OTA update validation processes",
        ],
        "penalty_summary": "EU AI Act: up to 7% global turnover. UNECE non-compliance: market access denied. NHTSA: up to $150M in civil penalties. Product liability: unlimited.",
        "csoai_solution": """CSOAI's Safety Council orchestrates multi-agent validation of perception and
planning models across 10,000+ edge case scenarios. The Safety Ledger provides
immutable evidence of validation coverage exceeding SOTIF requirements.
Automated regression testing prevents safety degradation in OTA updates.""",
        "case_study": "Achieved SOTIF compliance 40% faster for an L3 autonomy program",
    },
    "manufacturing": {
        "display_name": "Manufacturing & Industry 4.0",
        "regulations": [
            "EU AI Act (Annex III - Critical Infrastructure)",
            "EU Machinery Regulation",
            "OSHA (Worker Safety)",
            "IEC 61508 (Functional Safety)",
            "NIST AI RMF",
            "ISO 9001 (Quality Management)",
        ],
        "common_risks": [
            "Predictive maintenance missing safety-critical failures",
            "Quality inspection AI accepting defective products",
            "Worker safety monitoring creating privacy concerns",
            "Supply chain optimization exposing single points of failure",
            "Autonomous systems lacking emergency stop protocols",
        ],
        "penalty_summary": "EU AI Act: up to 7% global turnover (as critical infrastructure). OSHA: up to $145,027 per willful violation. Product recall costs: $50M-$500M average.",
        "csoai_solution": """CSOAI's Industrial Council validates predictive maintenance models against
safety-critical failure modes. The Quality Assurance Matrix provides
multi-agent inspection validation with full traceability. Worker privacy is
protected through edge-based processing with CSOAI's Privacy Shield.""",
        "case_study": "Eliminated false negatives in safety inspection for a Tier 1 automotive supplier",
    },
    "energy": {
        "display_name": "Energy & Utilities",
        "regulations": [
            "EU AI Act (Annex III - Critical Infrastructure)",
            "NERC CIP (North America)",
            "EU NIS2 Directive",
            "IEC 62351 (Power System Security)",
            "OFGEM/PUC State Regulations",
        ],
        "common_risks": [
            "Grid optimization AI causing instability events",
            "Smart meter data privacy breaches",
            "Predictive models failing during extreme weather",
            "Cyber-physical attacks on AI-controlled infrastructure",
            "Energy trading algorithms creating market manipulation",
        ],
        "penalty_summary": "EU AI Act: up to 7% global turnover. NERC CIP: up to $1.5M per violation per day. NIS2: up to EUR 10M or 2% global turnover.",
        "csoai_solution": """CSOAI's Grid Council validates optimization models through multi-agent simulation
across 500+ contingency scenarios. The Resilience Matrix monitors model
performance during extreme events. Immutable audit trails satisfy NERC CIP
evidence requirements for AI-driven grid decisions.""",
        "case_study": "Prevented 3 grid instability events for a European TSO through AI validation",
    },
    "government": {
        "display_name": "Government & Public Sector",
        "regulations": [
            "EU AI Act (Full Applicability)",
            "Algorithmic Accountability Act (proposed US)",
            "Executive Order 14110 (US AI Governance)",
            "Equal Treatment Directive (EU)",
            "Freedom of Information Act implications",
        ],
        "common_risks": [
            "Benefits eligibility algorithms denying valid claims",
            "Surveillance AI violating civil liberties",
            "Procurement scoring showing vendor bias",
            "Predictive policing amplifying existing biases",
            "Citizen service chatbots providing incorrect information",
        ],
        "penalty_summary": "EU AI Act: up to 7% global turnover. ADA lawsuits: averaging $5M settlements. Constitutional challenges: injunctive relief plus damages. Political/reputational: immeasurable.",
        "csoai_solution": """CSOAI's Public Sector Council provides transparent, auditable validation of every
government AI system. The Equity Matrix ensures algorithms meet strict
non-discrimination standards. All validation evidence is FOIA-ready and
published on public compliance dashboards.""",
        "case_study": "Eliminated bias findings in benefits allocation for a national social security agency",
    },
    "legal": {
        "display_name": "Legal & Professional Services",
        "regulations": [
            "EU AI Act (Annex III - Legal/AI Justice)",
            "Attorney-Client Privilege (AI Tool Implications)",
            "ABA Model Rules (Competence & Confidentiality)",
            "GDPR (Client Data Processing)",
            "SRA / Bar Association AI Guidance",
        ],
        "common_risks": [
            "AI-generated legal research containing hallucinated precedents",
            "Contract analysis missing critical clauses",
            "Client confidentiality breaches in AI processing",
            "Due diligence automation overlooking red flags",
            "E-discovery AI producing incomplete results",
        ],
        "penalty_summary": "EU AI Act: up to 7% global turnover (as legal AI). Malpractice: unlimited liability. Bar sanctions: suspension/disbarment. GDPR: up to EUR 20M.",
        "csoai_solution": """CSOAI's Legal Council validates AI outputs against verified legal databases
through multi-agent cross-reference. The Privilege Vault ensures client data
never leaves secure environments. Every AI-assisted work product carries an
immutable validation certificate for malpractice defense.""",
        "case_study": "Reduced hallucination rate from 17% to 0.3% for a Magic Circle law firm's AI research tool",
    },
    "telecom": {
        "display_name": "Telecommunications",
        "regulations": [
            "EU AI Act (Annex III - Critical Infrastructure)",
            "GDPR (Subscriber Data)",
            "FCC AI Transparency Requirements",
            "Ofcom Online Safety Act (UK)",
            "Net Neutrality / Fair Traffic Management",
        ],
        "common_risks": [
            "Network optimization creating service discrimination",
            "Customer churn prediction using discriminatory proxies",
            "Content moderation AI censoring legitimate speech",
            "Fraud detection falsely blocking subscribers",
            "5G/IoT security vulnerabilities in AI models",
        ],
        "penalty_summary": "EU AI Act: up to 7% global turnover. FCC: up to $2.5M per violation. Ofcom: up to 10% UK turnover. GDPR: up to EUR 20M.",
        "csoai_solution": """CSOAI's Telecom Council validates network AI for fairness across subscriber
cohorts. The Trust & Safety Matrix ensures content moderation meets
proportionality standards. The Security Shield protects 5G/IoT AI models
against adversarial attacks.""",
        "case_study": "Reduced false positives in fraud detection by 89% for a Tier 1 mobile operator",
    },
}


# ============================================================================
# AI USE CASE DATABASE
# ============================================================================

USE_CASE_DATABASE = {
    "banking": {
        "credit scoring": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III, Point 3(b) - Credit Scoring",
            "specific_risks": [
                "Scoring algorithms may discriminate against protected classes through proxy variables (zip code correlating with race)",
                "Model drift can gradually erode fairness metrics post-deployment",
                "Lack of explainability for adverse action notices violates ECOA",
                "Training data historical bias perpetuates past discrimination patterns",
            ],
            "compliance_gaps": [
                "No formal bias testing protocol in pre-deployment phase",
                "Missing demographic parity monitoring in production",
                "Inadequate documentation of model development for regulatory exam",
                "No independent model validation separate from development team",
                "Lack of human-in-the-loop for borderline/edge-case decisions",
            ],
            "required_actions": [
                "Implement comprehensive bias testing across 30+ demographic dimensions",
                "Deploy continuous fairness monitoring with automated alerts",
                "Establish independent Model Risk Management function",
                "Create explainable AI pipeline for adverse action notices",
                "Document full model lifecycle for regulatory examination readiness",
                "Implement human override capability for contested decisions",
            ],
        },
        "fraud detection": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III, Point 3(a) - Fraud Prevention",
            "specific_risks": [
                "False positive rates disproportionately affecting certain customer segments",
                "Adversarial attacks evolving to evade detection models",
                "Privacy concerns in behavioral biometrics data collection",
                "Cross-border data transfer issues for global transaction monitoring",
            ],
            "compliance_gaps": [
                "No regular adversarial robustness testing",
                "Missing customer notification for automated account freezes",
                "Inadequate human review process for high-impact decisions",
                "Lack of model performance monitoring across demographics",
            ],
            "required_actions": [
                "Implement adversarial robustness testing quarterly",
                "Deploy demographic parity monitoring for fraud alerts",
                "Establish 24-hour human review SLA for account restrictions",
                "Create customer appeal process for AI-driven decisions",
                "Document model retraining triggers and procedures",
            ],
        },
        "algorithmic trading": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III, Point 3(c) - Financial Risk Assessment",
            "specific_risks": [
                "Flash crashes triggered by AI herd behavior",
                "Market manipulation through coordinated algorithmic strategies",
                "Operational failures causing erroneous large orders",
                "Regulatory reporting gaps for AI-driven trade decisions",
            ],
            "compliance_gaps": [
                "No kill-switch protocols for runaway algorithms",
                "Missing pre-trade risk controls for AI-generated orders",
                "Inadequate market abuse surveillance for AI strategies",
                "Lack of scenario testing for extreme market conditions",
            ],
            "required_actions": [
                "Implement circuit breakers and kill-switch mechanisms",
                "Deploy pre-trade risk filters for all AI-generated orders",
                "Establish market manipulation detection for algorithm behavior",
                "Conduct stress testing across 50+ historical crash scenarios",
                "Register algorithms with relevant regulators where required",
            ],
        },
        "customer onboarding": {
            "risk_level": RiskLevel.LIMITED,
            "eu_ai_act_annex": "Limited Risk - Transparency Obligations",
            "specific_risks": [
                "KYC document verification failing on non-standard IDs",
                "Biometric matching bias against certain ethnic groups",
                "Automation creating exclusion for digitally excluded populations",
                "Data retention beyond regulatory requirements",
            ],
            "compliance_gaps": [
                "No accuracy testing across ID document types",
                "Missing biometric fairness validation",
                "Inadequate fallback process for digital exclusion",
                "Lack of transparency about automated decision-making",
            ],
            "required_actions": [
                "Validate document verification across 100+ ID types",
                "Test biometric accuracy across Fitzpatrick skin types 1-6",
                "Implement human-assisted onboarding pathway",
                "Provide clear disclosure of AI use in onboarding",
                "Establish data retention limits with automated deletion",
            ],
        },
    },
    "healthcare": {
        "diagnostic": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III, Point 1(a) - Medical Devices",
            "specific_risks": [
                "Higher false negative rates for underrepresented populations in training data",
                "Distribution shift between training and deployment environments",
                "Over-reliance on AI reducing clinician diagnostic vigilance",
                "Adversarial attacks on medical imaging inputs",
            ],
            "compliance_gaps": [
                "No prospective clinical validation study completed",
                "Missing subgroup performance analysis in clinical evaluation",
                "Inadequate post-market surveillance plan",
                "No human-AI interaction (HAI) safety study",
                "Lack of cybersecurity validation for connected devices",
            ],
            "required_actions": [
                "Conduct prospective clinical validation across 10,000+ patients",
                "Perform subgroup analysis across race, ethnicity, age, sex, comorbidities",
                "Establish post-market surveillance with automated performance monitoring",
                "Conduct HAI safety study measuring automation bias effects",
                "Implement cybersecurity testing (IEC 81001-5-1)",
                "Prepare Technical Documentation for Notified Body review",
            ],
        },
        "clinical trial": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III, Point 1 - Healthcare",
            "specific_risks": [
                "AI-driven patient selection introducing selection bias",
                "Endpoint prediction models compromising trial blinding",
                "Safety signal detection missing rare adverse events",
                "Regulatory submission lacking AI validation documentation",
            ],
            "compliance_gaps": [
                "No validation of AI tools used in trial conduct",
                "Missing documentation of AI impact on trial integrity",
                "Inadequate regulatory strategy for AI-enabled trials",
                "Lack of DSMB briefings on AI tool limitations",
            ],
            "required_actions": [
                "Validate all AI tools per ICH E6(R2) and E9 guidelines",
                "Document AI impact on randomization and blinding integrity",
                "Brief DSMB on AI model limitations and failure modes",
                "Prepare regulatory defense of AI-enabled endpoints",
                "Implement safety surveillance with human validation layer",
            ],
        },
        "drug discovery": {
            "risk_level": RiskLevel.LIMITED,
            "eu_ai_act_annex": "Limited Risk - Transparency Obligations",
            "specific_risks": [
                "AI-generated molecular candidates with unexpected toxicity",
                "Intellectual property issues with AI-generated inventions",
                "Reproducibility failures in AI-predicted efficacy",
                "Data leakage between training and test sets inflating performance",
            ],
            "compliance_gaps": [
                "No independent validation of AI predictions",
                "Missing documentation of training data provenance",
                "Inadequate reproducibility protocols for AI models",
                "Lack of IP strategy for AI-generated compounds",
            ],
            "required_actions": [
                "Implement independent wet-lab validation of all AI predictions",
                "Document full data provenance chain (FAIR principles)",
                "Establish reproducible ML pipelines with version control",
                "Develop IP strategy for AI-generated molecular IP",
                "Create audit trail linking predictions to experimental results",
            ],
        },
        "patient monitoring": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III, Point 1(a) - Remote Patient Monitoring",
            "specific_risks": [
                "Alarm fatigue from excessive false positive alerts",
                "Sensor failure modes not accounted for in AI models",
                "Patient data privacy in continuous monitoring streams",
                "Delayed alerts causing missed critical events",
            ],
            "compliance_gaps": [
                "No alarm validation across clinical settings",
                "Missing sensor failure detection mechanisms",
                "Inadequate data encryption for streaming health data",
                "Lack of clinical workflow integration safety analysis",
            ],
            "required_actions": [
                "Validate alarm performance across ICU, ward, and home settings",
                "Implement sensor fault detection with graceful degradation",
                "Deploy end-to-end encryption for all health data streams",
                "Conduct workflow integration safety assessment",
                "Establish clinical governance for alert escalation protocols",
            ],
        },
    },
    "insurance": {
        "risk scoring": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III, Point 3 - Insurance Pricing",
            "specific_risks": [
                "Proxy discrimination through correlated variables",
                "Model opacity preventing actuarial justification",
                "Telescope pricing disadvantaging loyal customers",
                "Climate risk models becoming obsolete with changing patterns",
            ],
            "compliance_gaps": [
                "No formal proxy discrimination testing program",
                "Missing documentation of rating factor selection rationale",
                "Inadequate model governance separate from underwriting",
                "No regular model recalibration schedule",
            ],
            "required_actions": [
                "Implement comprehensive proxy discrimination testing",
                "Document actuarial justification for all rating factors",
                "Establish independent Model Governance Committee",
                "Deploy annual recalibration with climate data updates",
                "Create transparency reports for policyholders",
            ],
        },
        "claims automation": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III, Point 3 - Insurance Claims",
            "specific_risks": [
                "Valid claims denied due to model bias against certain claim types",
                "Fraud detection creating false positives for legitimate claimants",
                "Lack of human review for complex or high-value claims",
                "Customer dissatisfaction from opaque denial reasons",
            ],
            "compliance_gaps": [
                "No bias testing across claim types and demographics",
                "Missing human review threshold for automated denials",
                "Inadequate appeal process documentation",
                "Lack of explainability for claim decisions",
            ],
            "required_actions": [
                "Test claim outcomes across demographics and claim categories",
                "Implement mandatory human review for denials above $ threshold",
                "Create transparent appeal process with AI decision explanation",
                "Deploy explainable AI for all claim decisions",
                "Establish customer feedback loop for model improvement",
            ],
        },
        "underwriting": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III, Point 3 - Underwriting",
            "specific_risks": [
                "Automated rejection of high-risk but profitable segments",
                "Data sources with embedded historical biases",
                "Over-reliance on credit scores for unrelated insurance lines",
                "Lack of reconsideration process for declined applicants",
            ],
            "compliance_gaps": [
                "No adverse action notice compliance for AI decisions",
                "Missing data source bias assessment",
                "Inadequate reconsideration process",
                "Lack of model performance monitoring by protected class",
            ],
            "required_actions": [
                "Ensure adverse action notices meet ECOA/FCA requirements",
                "Assess all data sources for embedded bias",
                "Implement human reconsideration pathway",
                "Monitor model performance across protected classes",
                "Document underwriting model governance framework",
            ],
        },
    },
    "retail": {
        "pricing": {
            "risk_level": RiskLevel.LIMITED,
            "eu_ai_act_annex": "Limited Risk - Transparency Obligations",
            "specific_risks": [
                "Dynamic pricing creating discriminatory outcomes",
                "Personalized pricing violating consumer fairness expectations",
                "Price discrimination allegations under consumer protection law",
                "Algorithmic collusion with competitors' pricing AI",
            ],
            "compliance_gaps": [
                "No fairness testing for dynamic pricing algorithms",
                "Missing transparency about personalized pricing",
                "Inadequate monitoring for algorithmic collusion signals",
                "Lack of consumer complaint analysis for pricing issues",
            ],
            "required_actions": [
                "Test dynamic pricing across customer segments for fairness",
                "Provide transparency about factors influencing personalized prices",
                "Monitor for algorithmic collusion indicators",
                "Analyze consumer complaints for pricing bias patterns",
                "Document pricing algorithm governance policy",
            ],
        },
        "recommendation": {
            "risk_level": RiskLevel.LIMITED,
            "eu_ai_act_annex": "Limited Risk - Transparency Obligations",
            "specific_risks": [
                "Recommendation filter bubbles creating harmful echo chambers",
                "Product recommendations violating safety regulations",
                "Children exposed to age-inappropriate recommendations",
                "Addictive recommendation patterns exploiting vulnerable users",
            ],
            "compliance_gaps": [
                "No content safety validation for recommended products",
                "Missing age-appropriateness filters",
                "Inadequate transparency about recommendation logic",
                "No mechanism for users to contest recommendations",
            ],
            "required_actions": [
                "Implement content safety screening for all recommendations",
                "Deploy age-gating for product recommendations",
                "Provide user controls over recommendation personalization",
                "Create transparency about how recommendations are generated",
                "Establish content moderation for algorithmic recommendations",
            ],
        },
        "demand forecasting": {
            "risk_level": RiskLevel.MINIMAL,
            "eu_ai_act_annex": "Minimal Risk - No Additional Obligations",
            "specific_risks": [
                "Forecast errors causing supply chain disruptions",
                "Over-forecasting leading to excess inventory waste",
                "Under-forecasting causing stockouts and lost revenue",
                "Seasonal pattern changes rendering models obsolete",
            ],
            "compliance_gaps": [
                "No forecast accuracy monitoring by product category",
                "Missing bias testing for location-based demand signals",
                "Inadequate model update frequency",
                "Lack of human oversight for significant forecast adjustments",
            ],
            "required_actions": [
                "Monitor forecast accuracy with automated alerts",
                "Test for location bias in demand predictions",
                "Implement regular model retraining schedule",
                "Require human approval for forecast adjustments > threshold",
            ],
        },
    },
    "automotive": {
        "autonomous driving": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III, Point 2(a) - Transport Safety",
            "specific_risks": [
                "Perception failures in adverse weather conditions",
                "Planning errors in complex urban scenarios",
                "Cybersecurity vulnerabilities allowing remote manipulation",
                "Insufficient handover time for human takeover requests",
            ],
            "compliance_gaps": [
                "No validation across ODD (Operational Design Domain) boundaries",
                "Missing SOTIF analysis for known and unknown unsafe scenarios",
                "Inadequate cybersecurity testing (ISO/SAE 21434)",
                "No type approval documentation for EU market",
            ],
            "required_actions": [
                "Validate perception across rain, snow, fog, glare conditions",
                "Complete SOTIF analysis (ISO 21448) with 10,000+ scenarios",
                "Conduct cybersecurity penetration testing per ISO/SAE 21434",
                "Prepare type approval dossier for EU Whole Vehicle Type Approval",
                "Establish safety management system per UNECE R157",
                "Implement OTA update validation with rollback capability",
            ],
        },
        "driver monitoring": {
            "risk_level": RiskLevel.LIMITED,
            "eu_ai_act_annex": "Limited Risk - Transparency Obligations",
            "specific_risks": [
                "Biometric bias in drowsiness detection across demographics",
                "Privacy concerns with continuous facial recording",
                "False alerts causing driver distraction",
                "Data storage and transfer compliance issues",
            ],
            "compliance_gaps": [
                "No demographic fairness testing for drowsiness detection",
                "Missing privacy impact assessment for biometric data",
                "Inadequate driver consent mechanisms",
                "Lack of data minimization in video processing",
            ],
            "required_actions": [
                "Test drowsiness detection accuracy across demographics",
                "Conduct DPIA for biometric data processing",
                "Implement informed consent for driver monitoring",
                "Deploy edge processing to minimize data transfer",
                "Provide driver control over data collection",
            ],
        },
    },
    "manufacturing": {
        "predictive maintenance": {
            "risk_level": RiskLevel.LIMITED,
            "eu_ai_act_annex": "Limited Risk - Critical Infrastructure Context",
            "specific_risks": [
                "False negatives missing safety-critical equipment failures",
                "Over-predicting maintenance causing unnecessary downtime",
                "Sensor degradation reducing model accuracy over time",
                "Integration with legacy SCADA systems creating vulnerabilities",
            ],
            "compliance_gaps": [
                "No safety-critical failure mode coverage analysis",
                "Missing sensor health monitoring",
                "Inadequate cybersecurity for IIoT connectivity",
                "Lack of human override for maintenance decisions",
            ],
            "required_actions": [
                "Validate coverage of all safety-critical failure modes",
                "Implement sensor health monitoring with drift detection",
                "Conduct IIoT cybersecurity assessment per IEC 62443",
                "Establish human approval for safety-critical maintenance overrides",
                "Document predictive maintenance governance framework",
            ],
        },
        "quality inspection": {
            "risk_level": RiskLevel.LIMITED,
            "eu_ai_act_annex": "Annex III - Product Safety (indirect)",
            "specific_risks": [
                "False acceptances letting defective products through",
                "Inspection bias favoring certain defect types over others",
                "Adversarial defects designed to evade AI detection",
                "Reduced human inspector vigilance due to AI reliance",
            ],
            "compliance_gaps": [
                "No defect type coverage analysis",
                "Missing adversarial robustness testing",
                "Inadequate human-AI interaction safety assessment",
                "Lack of inspection audit trail for quality certifications",
            ],
            "required_actions": [
                "Validate detection across all defect categories",
                "Test adversarial robustness of inspection models",
                "Assess automation bias effects on human inspectors",
                "Create immutable inspection audit trail",
                "Integrate with ISO 9001 quality management system",
            ],
        },
    },
    "energy": {
        "grid optimization": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III - Critical Infrastructure",
            "specific_risks": [
                "Optimization creating grid instability during peak demand",
                "Cyber attacks manipulating grid AI causing blackouts",
                "AI decisions conflicting with human operator overrides",
                "Distributed energy resource forecasting errors",
            ],
            "compliance_gaps": [
                "No stability validation across contingency scenarios",
                "Missing cybersecurity assessment for AI control systems",
                "Inadequate human-machine interface safety design",
                "Lack of NERC CIP compliance for AI systems",
            ],
            "required_actions": [
                "Validate across N-1, N-2 contingency scenarios",
                "Conduct cybersecurity assessment per IEC 62351",
                "Design HMI per IEC 61511 human factors standards",
                "Achieve NERC CIP compliance for all AI systems",
                "Implement operator override with safety interlocks",
            ],
        },
        "demand response": {
            "risk_level": RiskLevel.LIMITED,
            "eu_ai_act_annex": "Limited Risk - Critical Infrastructure Context",
            "specific_risks": [
                "Demand signals violating consumer privacy expectations",
                "Automated load control creating safety issues",
                "Aggregator algorithms causing unintended demand spikes",
                "Consumer opt-out mechanisms not functioning properly",
            ],
            "compliance_gaps": [
                "No privacy impact assessment for demand data",
                "Missing safety validation for automated load control",
                "Inadequate consumer consent and opt-out mechanisms",
                "Lack of algorithm transparency for consumers",
            ],
            "required_actions": [
                "Conduct DPIA for demand response data processing",
                "Validate safety of automated load control scenarios",
                "Implement clear consumer consent and opt-out",
                "Provide transparency about demand response algorithms",
                "Establish consumer complaint resolution process",
            ],
        },
    },
    "government": {
        "benefits allocation": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III - Public Services (HIGH RISK)",
            "specific_risks": [
                "Eligibility algorithms denying benefits to qualified recipients",
                "Historical bias in training data perpetuating systemic inequities",
                "Complex rules engine errors in multi-program eligibility",
                "Appeals process not accessible to digitally excluded citizens",
            ],
            "compliance_gaps": [
                "No equity audit of benefits allocation outcomes",
                "Missing disparate impact analysis across demographics",
                "Inadequate appeal process for AI-driven denials",
                "No public transparency about algorithmic decision-making",
            ],
            "required_actions": [
                "Conduct comprehensive equity audit of all AI-driven decisions",
                "Perform disparate impact analysis across protected classes",
                "Redesign appeals process for accessibility",
                "Publish algorithmic transparency reports annually",
                "Establish independent algorithmic oversight board",
                "Implement human review for all AI denial decisions",
            ],
        },
        "public safety": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III - Law Enforcement (HIGH RISK)",
            "specific_risks": [
                "Predictive policing reinforcing historical over-policing patterns",
                "Risk assessment tools scoring certain demographics higher",
                "Facial recognition false positives on minority populations",
                "Autonomous surveillance violating civil liberties",
            ],
            "compliance_gaps": [
                "No bias audit of risk assessment instruments",
                "Missing accuracy testing across demographic groups",
                "Inadequate human review before enforcement actions",
                "Lack of public accountability for AI system performance",
            ],
            "required_actions": [
                "Conduct independent bias audit of all risk assessment tools",
                "Test facial recognition across Fitzpatrick skin types 1-6",
                "Require human authorization before any enforcement action",
                "Publish accuracy metrics and demographic performance data",
                "Establish civilian oversight of AI policing tools",
                "Implement strict use limitations with audit enforcement",
            ],
        },
    },
    "legal": {
        "document review": {
            "risk_level": RiskLevel.LIMITED,
            "eu_ai_act_annex": "Limited Risk - Professional Services",
            "specific_risks": [
                "AI missing critical privileged documents in review",
                "Hallucinated contract clause interpretations",
                "Data leakage in cloud-based AI review tools",
                "Over-reliance reducing junior lawyer skill development",
            ],
            "compliance_gaps": [
                "No validation of privilege detection accuracy",
                "Missing hallucination rate measurement",
                "Inadequate data security for client documents",
                "Lack of human verification protocol for AI outputs",
            ],
            "required_actions": [
                "Validate privilege detection with senior lawyer review",
                "Measure and monitor hallucination rates monthly",
                "Implement client-confidential secure processing environment",
                "Require human verification of all AI-generated work product",
                "Document AI tool use for malpractice insurance",
            ],
        },
        "legal research": {
            "risk_level": RiskLevel.LIMITED,
            "eu_ai_act_annex": "Limited Risk - Professional Services",
            "specific_risks": [
                "Hallucinated case citations and precedent references",
                "Out-of-date training data missing recent rulings",
                "Jurisdiction-specific errors in multi-jurisdictional research",
                "Over-reliance on AI without independent verification",
            ],
            "compliance_gaps": [
                "No citation verification process",
                "Missing training data currency assessment",
                "Inadequate jurisdiction-specific validation",
                "Lack of competency requirements for AI-assisted research",
            ],
            "required_actions": [
                "Implement mandatory citation verification against official databases",
                "Assess and document training data cutoff dates",
                "Validate jurisdiction-specific outputs with local counsel",
                "Establish competency training for AI-assisted research",
                "Create AI use disclosure for client transparency",
            ],
        },
    },
    "telecom": {
        "network optimization": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III - Critical Infrastructure",
            "specific_risks": [
                "Optimization decisions degrading emergency service reliability",
                "Traffic prioritization violating net neutrality principles",
                "AI-driven outages cascading across network segments",
                "Customer data exposure in AI training datasets",
            ],
            "compliance_gaps": [
                "No validation of emergency service impact",
                "Missing net neutrality compliance testing",
                "Inadequate change management for AI-driven configs",
                "Lack of data anonymization in network AI training",
            ],
            "required_actions": [
                "Validate zero impact on emergency services (112/999/911)",
                "Test traffic management for net neutrality compliance",
                "Implement staged rollout with rollback for AI config changes",
                "Anonymize all customer data before AI training use",
                "Document network AI governance per regulatory requirements",
            ],
        },
        "fraud prevention": {
            "risk_level": RiskLevel.HIGH,
            "eu_ai_act_annex": "Annex III - Critical Infrastructure (Fraud)",
            "specific_risks": [
                "SIM swap detection false positives blocking legitimate customers",
                "International roaming fraud creating large customer bills",
                "Subscription fraud using synthetic identities",
                "Interconnect bypass fraud (SIM box / Grey routes)",
            ],
            "compliance_gaps": [
                "No false positive rate monitoring by customer segment",
                "Missing real-time SIM swap validation",
                "Inadequate synthetic identity detection",
                "Lack of interconnect fraud AI monitoring",
            ],
            "required_actions": [
                "Monitor false positive rates across demographics",
                "Implement real-time SIM swap validation pipeline",
                "Deploy synthetic identity detection algorithms",
                "Create AI-powered interconnect fraud monitoring",
                "Establish customer notification for fraud blocks",
            ],
        },
    },
}


# ============================================================================
# FALLBACK TEMPLATES FOR UNKNOWN USE CASES
# ============================================================================

FALLBACK_RISKS = [
    "Unvalidated AI model producing incorrect or biased outputs",
    "Lack of explainability preventing human oversight and trust",
    "Data quality issues in training or inference pipelines",
    "Regulatory non-compliance with emerging AI governance frameworks",
    "Operational failures causing business disruption or harm",
]

FALLBACK_GAPS = [
    "No formal AI risk assessment completed",
    "Missing documentation of model development and validation",
    "Inadequate human oversight for AI-driven decisions",
    "No continuous monitoring for model drift or degradation",
    "Lack of incident response plan for AI failures",
]

FALLBACK_ACTIONS = [
    "Conduct comprehensive AI risk assessment",
    "Document full model lifecycle (development, validation, deployment, monitoring)",
    "Implement human-in-the-loop oversight for high-stakes decisions",
    "Deploy continuous model monitoring with automated alerts",
    "Create AI incident response plan with escalation procedures",
    "Establish AI governance committee with cross-functional representation",
]


# ============================================================================
# REPORT GENERATOR
# ============================================================================

def normalize_key(text):
    """Normalize text for lookup purposes."""
    return text.lower().strip().replace(" ai", "").replace("-", " ").replace("_", " ")


def find_use_case(industry_key, use_case_input):
    """Find the best matching use case in the database."""
    industry_data = USE_CASE_DATABASE.get(industry_key, {})
    if not industry_data:
        return None

    normalized_input = normalize_key(use_case_input)

    # Direct match
    if normalized_input in industry_data:
        return normalized_input, industry_data[normalized_input]

    # Partial match
    for key, data in industry_data.items():
        if key in normalized_input or normalized_input in key:
            return key, data

    # Word-by-word match
    input_words = set(normalized_input.split())
    best_match = None
    best_score = 0
    for key, data in industry_data.items():
        key_words = set(key.split())
        score = len(input_words & key_words)
        if score > best_score:
            best_score = score
            best_match = (key, data)

    return best_match


def generate_compliance_report(company_name, industry, use_case):
    """
    Generate a comprehensive compliance assessment report.

    Args:
        company_name: Name of the company
        industry: Industry sector (e.g., "Banking", "Healthcare")
        use_case: AI use case description (e.g., "Credit scoring AI")

    Returns:
        dict: Complete report data structure
    """
    industry_key = normalize_key(industry)
    industry_info = INDUSTRIES.get(industry_key, {
        "display_name": industry.title(),
        "regulations": ["EU AI Act", "GDPR", "Relevant sectoral regulations"],
        "common_risks": ["AI governance risks applicable to this sector"],
        "penalty_summary": "Significant financial and reputational penalties may apply.",
        "csoai_solution": "CSOAI provides comprehensive AI governance and validation solutions.",
        "case_study": "CSOAI has helped organizations across this sector achieve compliance.",
    })

    # Find use case specific data
    use_case_result = find_use_case(industry_key, use_case)

    if use_case_result:
        use_case_key, use_case_data = use_case_result
        risk_level = use_case_data["risk_level"]
        eu_ai_act_annex = use_case_data["eu_ai_act_annex"]
        specific_risks = use_case_data["specific_risks"]
        compliance_gaps = use_case_data["compliance_gaps"]
        required_actions = use_case_data["required_actions"]
    else:
        use_case_key = normalize_key(use_case)
        risk_level = RiskLevel.HIGH  # Conservative default
        eu_ai_act_annex = "Annex III - To be determined based on detailed assessment"
        specific_risks = FALLBACK_RISKS
        compliance_gaps = FALLBACK_GAPS
        required_actions = FALLBACK_ACTIONS

    # Build timeline
    timeline = [
        {"phase": "Immediate (0-30 days)", "actions": required_actions[:2]},
        {"phase": "Short-term (30-90 days)", "actions": required_actions[2:4] if len(required_actions) > 2 else ["Expand validation coverage"]},
        {"phase": "Medium-term (90-180 days)", "actions": required_actions[4:] if len(required_actions) > 4 else ["Achieve full compliance certification"]},
    ]

    report = {
        "metadata": {
            "report_type": "CSOAI AI Compliance Assessment",
            "version": "1.0",
            "generated_at": datetime.now().isoformat(),
            "company_name": company_name,
            "industry": industry_info["display_name"],
            "ai_use_case": use_case,
            "use_case_matched": use_case_key if use_case_result else None,
        },
        "executive_summary": {
            "risk_level": risk_level.value,
            "eu_ai_act_classification": eu_ai_act_annex,
            "key_finding": f"{company_name}'s {use_case} is classified as {risk_level.value} RISK under the EU AI Act. "
                          f"Immediate action is required to establish compliance framework.",
            "penalty_exposure": industry_info["penalty_summary"],
        },
        "regulatory_landscape": {
            "applicable_regulations": industry_info["regulations"],
            "primary_framework": "EU AI Act (2024)",
            "compliance_deadline": "August 2026 (HIGH RISK systems) / February 2025 (PROHIBITED practices)",
        },
        "risk_assessment": {
            "industry_risks": industry_info["common_risks"],
            "use_case_specific_risks": specific_risks,
            "overall_risk_score": _calculate_risk_score(risk_level, len(specific_risks), len(compliance_gaps)),
        },
        "compliance_gaps": compliance_gaps,
        "required_actions": required_actions,
        "implementation_timeline": timeline,
        "csoai_solution": {
            "overview": industry_info["csoai_solution"],
            "key_capabilities": [
                "Multi-Agent BFT Council for independent AI validation",
                "Pheromone Matrix for continuous risk signal monitoring",
                "Immutable on-chain audit trails for regulatory evidence",
                "Automated compliance gap analysis and remediation tracking",
                "Real-time dashboard for compliance posture visibility",
            ],
            "case_study": industry_info["case_study"],
        },
        "next_steps": [
            f"Schedule CSOAI demo for {company_name} - tailored to {use_case}",
            "Receive detailed compliance roadmap with milestones",
            "Begin 30-day pilot of CSOAI validation platform",
            "Achieve compliance certification within 90 days",
        ],
    }

    return report


def _calculate_risk_score(risk_level, num_risks, num_gaps):
    """Calculate a numerical risk score (0-100)."""
    base_scores = {
        RiskLevel.PROHIBITED: 95,
        RiskLevel.HIGH: 75,
        RiskLevel.LIMITED: 50,
        RiskLevel.MINIMAL: 25,
    }
    base = base_scores.get(risk_level, 50)
    modifier = min((num_risks + num_gaps) * 2, 20)
    return min(base + modifier, 100)


# ============================================================================
# OUTPUT FORMATTERS
# ============================================================================

def format_report_markdown(report):
    """Format the report as professional Markdown."""
    meta = report["metadata"]
    exec_sum = report["executive_summary"]
    regs = report["regulatory_landscape"]
    risks = report["risk_assessment"]
    gaps = report["compliance_gaps"]
    actions = report["required_actions"]
    timeline = report["implementation_timeline"]
    csoai = report["csoai_solution"]

    risk_emoji = {
        "PROHIBITED": "🚫",
        "HIGH": "🔴",
        "LIMITED": "🟡",
        "MINIMAL": "🟢",
    }.get(exec_sum["risk_level"], "⚪")

    md = f"""# CSOAI AI Compliance Assessment Report

---

**Prepared for:** {meta['company_name']}  
**Industry:** {meta['industry']}  
**AI Use Case:** {meta['ai_use_case']}  
**Report Date:** {meta['generated_at'][:10]}  
**Report Version:** {meta['version']}

---

## Executive Summary

### {risk_emoji} Risk Level: {exec_sum['risk_level']}

{exec_sum['key_finding']}

**EU AI Act Classification:** {exec_sum['eu_ai_act_classification']}

### Penalty Exposure
{exec_sum['penalty_exposure']}

---

## Regulatory Landscape

### Applicable Regulations

"""
    for reg in regs["applicable_regulations"]:
        md += f"- {reg}\n"

    md += f"""
### Compliance Timeline

**Primary Framework:** {regs['primary_framework']}

**Key Deadline:** {regs['compliance_deadline']}

> ⚠️ **Action Required:** Organizations must begin compliance preparation NOW to meet the August 2026 deadline for HIGH RISK AI systems.

---

## Risk Assessment

### Overall Risk Score: {risks['overall_risk_score']}/100

"""

    # Risk score bar
    score = risks["overall_risk_score"]
    filled = score // 5
    bar = "█" * filled + "░" * (20 - filled)
    md += f"```\nRisk: [{bar}] {score}/100\n```\n\n"

    md += "### Industry-Specific Risks\n\n"
    for i, risk in enumerate(risks["industry_risks"], 1):
        md += f"{i}. {risk}\n"

    md += "\n### Use Case-Specific Risks\n\n"
    for i, risk in enumerate(risks["use_case_specific_risks"], 1):
        md += f"{i}. **{meta['ai_use_case']} Risk:** {risk}\n"

    md += "\n---\n\n## Compliance Gap Analysis\n\n"
    md += f"{meta['company_name']} has the following compliance gaps that require immediate attention:\n\n"
    for i, gap in enumerate(gaps, 1):
        md += f"{i}. ❌ **Gap:** {gap}\n"

    md += "\n---\n\n## Required Actions\n\n"
    md += "### Priority Actions for Compliance\n\n"
    for i, action in enumerate(actions, 1):
        md += f"{i}. ✅ {action}\n"

    md += "\n---\n\n## Implementation Timeline\n\n"
    for phase in timeline:
        md += f"### {phase['phase']}\n\n"
        for action in phase["actions"]:
            md += f"- [ ] {action}\n"
        md += "\n"

    md += f"""---

## CSOAI Solution: AI-Native Compliance

### How CSOAI Solves {meta['company_name']}'s Compliance Challenge

{csoai['overview']}

### Key Capabilities

"""
    for cap in csoai["key_capabilities"]:
        md += f"- **{cap}**\n"

    md += f"""
### Success Story

> {csoai['case_study']}

---

## Recommended Next Steps

"""
    for i, step in enumerate(report["next_steps"], 1):
        md += f"{i}. {step}\n"

    md += f"""
---

## About CSOAI

CSOAI is the world's first AI-native compliance infrastructure, combining Byzantine Fault Tolerant (BFT) multi-agent consensus, biomimetic signal processing, and immutable audit trails to deliver autonomous compliance at machine speed.

**Ready to get {meta['company_name']} compliant?** Schedule your personalized demo today.

---

*This report was generated by the CSOAI Demo Report Generator v{meta['version']}. It provides an initial assessment based on industry templates and should be followed by a detailed consultation.*

*© {meta['generated_at'][:4]} CSOAI. Confidential - Prepared exclusively for {meta['company_name']}.*
"""

    return md


def format_report_json(report):
    """Format the report as JSON string."""
    return json.dumps(report, indent=2, default=str)


# ============================================================================
# CLI INTERFACE
# ============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="CSOAI Personalized Demo Report Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --company "Acme Bank" --industry "Banking" --use-case "Credit scoring AI"
  %(prog)s --json --company "MediCare Plus" --industry "Healthcare" --use-case "Diagnostic AI"
  %(prog)s --company "Global Retail Inc" --industry "Retail" --use-case "Dynamic pricing"
  %(prog)s --output-file report.md --company "EnergyCo" --industry "Energy" --use-case "Grid optimization"

Available Industries: Banking, Healthcare, Insurance, Retail, Automotive,
  Manufacturing, Energy, Government, Legal, Telecom
        """
    )
    parser.add_argument("--company", help="Company name")
    parser.add_argument("--industry", help="Industry sector")
    parser.add_argument("--use-case", help="AI use case description")
    parser.add_argument("--json", action="store_true", help="Output JSON format")
    parser.add_argument("--output-file", help="Save output to file")
    parser.add_argument("--list-industries", action="store_true", help="List available industries and use cases")

    args = parser.parse_args()

    if args.list_industries:
        print("=" * 60)
        print("CSOAI Demo Report Generator - Available Industries")
        print("=" * 60)
        for ind_key, ind_data in INDUSTRIES.items():
            print(f"\n📁 {ind_data['display_name']} ({ind_key})")
            if ind_key in USE_CASE_DATABASE:
                for uc_key in USE_CASE_DATABASE[ind_key]:
                    uc_data = USE_CASE_DATABASE[ind_key][uc_key]
                    risk_badge = uc_data['risk_level'].value
                    print(f"   ├── {uc_key.replace('_', ' ').title()} [{risk_badge}]")
        print("\n" + "=" * 60)
        return

    # Validate required args
    if not all([args.company, args.industry, args.use_case]):
        print("ERROR: --company, --industry, and --use-case are required")
        print("Use --list-industries to see available industries")
        sys.exit(1)

    # Generate report
    report = generate_compliance_report(args.company, args.industry, args.use_case)

    if args.json:
        output = format_report_json(report)
    else:
        output = format_report_markdown(report)

    if args.output_file:
        with open(args.output_file, "w") as f:
            f.write(output)
        print(f"Report saved to: {args.output_file}")
    else:
        print(output)


if __name__ == "__main__":
    main()

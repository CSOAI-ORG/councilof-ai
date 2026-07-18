#!/usr/bin/env python3
# =============================================================================
# EU AI Act Compliance Checker -- CSOAI MVP
# =============================================================================
# A production-grade compliance assessment engine that maps AI systems to the
# European Union Artificial Intelligence Act (Regulation (EU) 2024/1689) risk
# categories and generates actionable compliance reports.
#
# Author:      CSOAI Engineering
# Version:     1.0.0
# Date:        2025-06-25
# License:     MIT
#
# RUN:    python3 eu_ai_act_compliance_checker.py
# OUTPUT: ./eu_ai_act_report_<timestamp>.json  -- structured API data
#         ./eu_ai_act_report_<timestamp>.md    -- human-readable report
# =============================================================================

import json
import re
import textwrap
from datetime import datetime, timezone
from enum import Enum


# -----------------------------------------------------------------------------
# Section 1: DATA MODELS
# -----------------------------------------------------------------------------

class RiskLevel(Enum):
    """EU AI Act risk tiers -- Articles 5, 6, 52, and Recitals."""
    UNACCEPTABLE = "unacceptable"
    HIGH = "high"
    LIMITED = "limited"
    MINIMAL = "minimal"

    def display(self):
        return {
            RiskLevel.UNACCEPTABLE: "UNACCEPTABLE RISK -- Prohibited",
            RiskLevel.HIGH: "HIGH RISK -- Strict Compliance Required",
            RiskLevel.LIMITED: "LIMITED RISK -- Transparency Obligations",
            RiskLevel.MINIMAL: "MINIMAL RISK -- Voluntary Code Encouraged",
        }[self]

    def regulatory_basis(self):
        return {
            RiskLevel.UNACCEPTABLE: "Article 5; Recitals 28-38",
            RiskLevel.HIGH: "Annex III; Articles 6, 8-15, 16-29; Recitals 39-82",
            RiskLevel.LIMITED: "Article 52; Recitals 132-137",
            RiskLevel.MINIMAL: "Recital 26; No mandatory requirements",
        }[self]


# -----------------------------------------------------------------------------
# Section 2: KNOWLEDGE BASE -- EU AI Act regulatory text as structured rules
# -----------------------------------------------------------------------------

# ---- 2.1 UNACCEPTABLE RISK INDICATORS (Article 5) ----
UNACCEPTABLE_INDICATORS = [
    {
        "id": "A5.1.a",
        "name": "Subliminal / Manipulative Techniques",
        "article": "Article 5(1)(a)",
        "description": "AI systems deploying subliminal techniques beyond consciousness to materially distort behaviour, causing or likely to cause physical, psychological, or financial harm.",
        "keywords": [
            "subliminal", "manipulative", "materially distort behaviour",
            "beyond consciousness", "deceptive interface", "dark pattern",
            "psychological manipulation", "behavioural manipulation",
            "subconscious influence", "hidden persuasion",
        ],
        "examples": [
            "Social media algorithms exploiting psychological vulnerabilities",
            "Dark-pattern UI tricking users into purchases",
            "Subliminal messaging in advertising AI",
        ],
    },
    {
        "id": "A5.1.b",
        "name": "Exploitation of Vulnerable Groups",
        "article": "Article 5(1)(b)",
        "description": "AI systems exploiting vulnerabilities of specific groups (age, disability, socio-economic status) to distort behaviour causing harm.",
        "keywords": [
            "vulnerable group", "children", "elderly", "disabled",
            "exploit vulnerability", "socio-economic exploitation",
            "cognitive disability", "minor", "vulnerable person",
            "developmental disability", "autism", "dementia",
        ],
        "examples": [
            "Toys with voice assistance encouraging dangerous behaviour in children",
            "AI systems targeting elderly with financial scams",
            "Systems exploiting cognitive disabilities",
        ],
    },
    {
        "id": "A5.1.c",
        "name": "Social Scoring by Government",
        "article": "Article 5(1)(c)",
        "description": "AI systems for social scoring by public authorities -- evaluating/classifying people based on social behaviour over time, leading to detrimental treatment.",
        "keywords": [
            "social scoring", "social credit", "citizen score",
            "public authority scoring", "government social rating",
            "trustworthiness score", "social behaviour evaluation",
            "citizen ranking", "social classification government",
            "trust score citizen", "citizen rating government",
            "government behaviour score", "public service scoring",
            "municipal scoring", "citizen behaviour tracking",
        ],
        "examples": [
            "Government citizen trustworthiness scoring systems",
            "Social credit systems for public services access",
            "Behavioural scoring by law enforcement",
        ],
    },
    {
        "id": "A5.1.d",
        "name": "Real-time Remote Biometric ID (RBI) in Public Spaces",
        "article": "Article 5(1)(d)",
        "description": "Real-time remote biometric identification in publicly accessible spaces for law enforcement purposes (with limited exceptions under Article 5(2)).",
        "keywords": [
            "real-time biometric", "remote biometric identification",
            "facial recognition public", "CCTV facial recognition",
            "live face recognition", "public space surveillance",
            "biometric tracking real-time", "mass surveillance",
            "automated facial recognition law enforcement",
            "public area biometric scanning",
        ],
        "examples": [
            "Real-time facial recognition in public CCTV networks",
            "Live biometric scanning in train stations",
            "Public space automated gait recognition",
        ],
    },
    {
        "id": "A5.1.e",
        "name": "Emotion Recognition in Workplace / Education",
        "article": "Article 5(1)(e) via Recital 44",
        "description": "AI systems inferring emotions in workplace and educational institutions (certain narrow exceptions apply for medical/safety reasons).",
        "keywords": [
            "emotion recognition workplace", "emotion detection employee",
            "sentiment monitoring workers", "facial emotion workplace",
            "mood detection education", "student emotion monitoring",
            "teacher emotion surveillance", "workplace emotion AI",
            "affective computing workplace", "emotional state monitoring",
            "facial expression monitoring", "voice tone analysis",
            "emotional assessment employee", "mood tracking workers",
            "stress detection employee", "engagement monitoring facial",
            "employee feeling detection", "emotion AI workplace",
        ],
        "examples": [
            "Employee emotion monitoring via webcam",
            "Student attention/emotion tracking in classrooms",
            "Call centre sentiment analysis for performance scoring",
        ],
    },
    {
        "id": "A5.1.f",
        "name": "Untargeted Scraping of Facial Images",
        "article": "Article 5(1)(f)",
        "description": "Untargeted scraping of facial images from the internet or CCTV for facial recognition databases.",
        "keywords": [
            "untargeted facial scraping", "face image scraping",
            "facial database scraping", "internet face collection",
            "CCTV face harvesting", "bulk face collection",
        ],
        "examples": [
            "Scraping social media for facial recognition databases",
            "Bulk collection of faces from CCTV footage",
            "Building facial recognition DB from internet images",
        ],
    },
    {
        "id": "A5.1.g",
        "name": "Biometric Categorisation -- Sensitive Attributes",
        "article": "Article 5(1)(g)",
        "description": "AI systems categorising individuals based on biometric data to deduce/detect race, political opinions, trade union membership, religious beliefs, sex life or sexual orientation.",
        "keywords": [
            "biometric categorisation sensitive", "race detection AI",
            "political opinion biometric", "religious belief detection",
            "sexual orientation AI", "trade union detection",
            "sensitive attribute biometric", "protected class detection",
            "ethnicity detection AI", "LGBTQ detection",
        ],
        "examples": [
            "AI detecting sexual orientation from photos",
            "Biometric systems identifying political affiliation",
            "Race/ethnicity detection from facial features",
        ],
    },
    {
        "id": "A5.1.h",
        "name": "Predictive Policing (Individual Risk Assessment)",
        "article": "Article 5(1)(h)",
        "description": "AI systems for individualised predictive policing based solely on profiling or assessing personality traits/characteristics without objective evidence.",
        "keywords": [
            "predictive policing individual", "individual risk assessment policing",
            "crime prediction person", "profiling police AI",
            "personality-based policing", "AI profiling law enforcement",
            "individualised crime forecast", "recidivism prediction individual",
            "pre-crime AI", "risk terrain modelling individual",
        ],
        "examples": [
            "Predicting an individual will commit a crime based on profiling",
            "Individual risk scoring by law enforcement without evidence",
            "AI assessing 'criminal propensity' of individuals",
        ],
    },
]

# ---- 2.2 HIGH-RISK INDICATORS (Annex III) ----
HIGH_RISK_INDICATORS = [
    {
        "id": "AIII.1",
        "name": "Critical Infrastructure -- Safety Components",
        "article": "Annex III(1)",
        "description": "AI systems used as safety components in the management and operation of critical digital infrastructure, road traffic, and the supply of water, gas, electricity, and heating.",
        "keywords": [
            "critical infrastructure", "safety component", "digital infrastructure",
            "road traffic management", "water supply management", "gas supply",
            "electricity grid", "heating network", "nuclear facility",
            "power plant AI", "traffic control system", "smart grid",
            "utility management AI", "SCADA AI", "industrial control",
        ],
        "examples": [
            "AI controlling electricity grid load balancing",
            "Smart traffic light management systems",
            "Water treatment plant AI controllers",
        ],
    },
    {
        "id": "AIII.2",
        "name": "Education & Vocational Training",
        "article": "Annex III(2)",
        "description": "AI systems determining access/admission to educational institutions, evaluating learning outcomes, assessing student education level, monitoring during testing.",
        "keywords": [
            "education access AI", "school admission AI", "university admission",
            "student evaluation", "exam proctoring AI", "learning outcome assessment",
            "education placement", "vocational training AI", "entrance exam AI",
            "student performance AI", "educational assessment automated",
            "placement test AI", "grading AI", "remote proctoring",
        ],
        "examples": [
            "AI evaluating university applications",
            "Automated essay grading systems",
            "Remote exam proctoring with behavioural analysis",
        ],
    },
    {
        "id": "AIII.3",
        "name": "Employment & Worker Management",
        "article": "Annex III(3)",
        "description": "AI systems for recruitment, screening, evaluating candidates, decisions on promotion/termination, task allocation, monitoring/evaluating work performance.",
        "keywords": [
            "recruitment AI", "hiring algorithm", "candidate screening AI",
            "resume screening automated", "job application AI",
            "promotion decision AI", "termination AI", "firing algorithm",
            "performance evaluation AI", "worker monitoring AI",
            "employee surveillance", "work behaviour tracking",
            "task allocation AI", "workforce management AI",
            "HR decision AI", "people analytics", "employee scoring",
        ],
        "examples": [
            "AI screening job applications",
            "Automated performance evaluation systems",
            "Worker productivity monitoring AI",
            "Algorithmic management of gig workers",
        ],
    },
    {
        "id": "AIII.4",
        "name": "Essential Services -- Access & Eligibility",
        "article": "Annex III(4)",
        "description": "AI systems evaluating eligibility for essential public services (healthcare, social services, credit scoring, insurance, emergency services dispatch).",
        "keywords": [
            "healthcare eligibility AI", "social services AI", "benefits assessment",
            "credit scoring AI", "insurance eligibility", "loan approval AI",
            "emergency dispatch AI", "911 triage AI", "medical triage AI",
            "public service access AI", "welfare eligibility",
            "social benefit AI", "creditworthiness assessment",
            "insurance risk scoring", "healthcare access decision",
            "hospital patient AI", "medical service AI",
            "health screening AI", "patient care AI decision",
        ],
        "examples": [
            "AI determining eligibility for government benefits",
            "Insurance claim evaluation AI",
            "Emergency services call triage systems",
            "Credit scoring algorithms",
        ],
    },
    {
        "id": "AIII.5",
        "name": "Law Enforcement",
        "article": "Annex III(5)",
        "description": "AI systems for law enforcement risk assessment, polygraph analysis, evidence evaluation, crime analytics, offender profiling (not individual predictive policing).",
        "keywords": [
            "law enforcement AI", "police AI", "risk assessment policing",
            "polygraph AI", "lie detection AI", "evidence evaluation AI",
            "crime pattern analysis", "criminal intelligence AI",
            "offender profiling system", "investigation support AI",
            "forensic AI", "crime statistics AI", "police analytics",
            "criminal network analysis", "pattern recognition crime",
        ],
        "examples": [
            "AI analysing crime patterns across a city",
            "Forensic evidence evaluation systems",
            "Polygraph/voice stress analysis AI",
            "Criminal network analysis tools",
        ],
    },
    {
        "id": "AIII.6",
        "name": "Migration, Asylum & Border Control",
        "article": "Annex III(6)",
        "description": "AI systems for asylum application assessment, visa/automated entry-exit risk assessment, border control, document verification.",
        "keywords": [
            "asylum AI", "migration AI", "border control AI",
            "visa application AI", "asylum decision AI", "entry-exit system",
            "immigration screening", "refugee status AI", "border biometric",
            "document verification AI", "immigration risk assessment",
            "automated border gate", "smart border AI",
            "migration management AI", "deportation risk AI",
        ],
        "examples": [
            "AI evaluating asylum applications",
            "Automated border control gates",
            "Visa application risk scoring",
            "Document authenticity verification for migration",
        ],
    },
    {
        "id": "AIII.7",
        "name": "Administration of Justice & Democratic Processes",
        "article": "Annex III(7)",
        "description": "AI systems assisting judicial decisions, researching/interpreting facts/law, applying law to concrete facts (recommending/deciding cases).",
        "keywords": [
            "judicial AI", "court AI", "legal decision AI",
            "case law research AI", "sentencing AI", "judge assistant",
            "legal research automated", "case outcome prediction",
            "judicial analytics", "court decision support",
            "democratic process AI", "election AI", "voting AI",
            "legal interpretation AI", "dispute resolution AI",
        ],
        "examples": [
            "AI recommending sentencing decisions",
            "Legal research assistants for judges",
            "Case outcome prediction systems",
            "AI-powered dispute resolution",
        ],
    },
    {
        "id": "A6.2",
        "name": "Product Safety -- Harmonised Standards",
        "article": "Article 6(2) + Annex I",
        "description": "AI systems that are safety components of products covered by EU harmonisation legislation (medical devices, machinery, toys, vehicles, etc.).",
        "keywords": [
            "medical device AI", "AI radiology", "AI diagnosis",
            "diagnostic AI", "clinical AI", "hospital AI system",
            "medical imaging AI", "patient diagnosis AI",
            "machinery safety AI", "vehicle AI safety", "autonomous vehicle",
            "toy AI safety", "elevator AI", "lift safety AI",
            "personal protective equipment AI", "pressure equipment AI",
            "cableway AI", "marine equipment AI", "aircraft AI",
            "railway safety AI", "construction product AI",
            "healthcare AI", "x-ray AI", "scan analysis AI",
        ],
        "examples": [
            "AI-powered medical imaging diagnostic",
            "Autonomous driving systems (levels 3-5)",
            "AI safety systems in industrial machinery",
            "Medical device software with AI",
        ],
    },
]

# ---- 2.3 LIMITED RISK INDICATORS (Article 52) ----
LIMITED_RISK_INDICATORS = [
    {
        "id": "A52.1",
        "name": "Chatbot / Conversational AI",
        "article": "Article 52(1)",
        "description": "AI systems interacting with humans (chatbots) must disclose that the user is interacting with an AI, unless obvious from context.",
        "keywords": [
            "chatbot", "conversational AI", "virtual assistant",
            "customer service bot", "dialogue system", "AI agent",
            "conversational agent", "AI assistant", "chat agent",
            "messaging bot", "voice assistant customer service",
            "automated conversation", "AI helpline",
        ],
        "examples": [
            "Customer service chatbot on e-commerce site",
            "AI virtual assistant for banking queries",
            "Automated support chat widget",
        ],
    },
    {
        "id": "A52.2",
        "name": "Emotion Recognition (non-high-risk context)",
        "article": "Article 52(2)",
        "description": "AI systems recognising emotions or biometric categorisation -- must inform exposed persons and process data lawfully.",
        "keywords": [
            "emotion recognition", "mood detection", "affective computing",
            "sentiment analysis face", "emotion AI", "biometric categorisation",
            "facial emotion analysis", "voice emotion detection",
            "attention detection", "engagement monitoring",
            "biometric classification", "demographic detection",
        ],
        "examples": [
            "Emotion recognition in retail analytics",
            "Audience engagement tracking at events",
            "Driver drowsiness detection (not safety-critical)",
        ],
    },
    {
        "id": "A52.3",
        "name": "Deepfake / Synthetic Content",
        "article": "Article 52(3)",
        "description": "AI systems generating or manipulating image, audio, video content (deepfakes) -- must disclose content is artificially generated/manipulated.",
        "keywords": [
            "deepfake", "synthetic media", "AI-generated content",
            "image generation", "video generation", "audio generation",
            "synthetic voice", "text-to-image", "text-to-video",
            "generative adversarial network", "GAN output",
            "AI avatar", "synthetic face", "face swap",
            "text-to-speech", "voice cloning", "AI narration",
        ],
        "examples": [
            "AI-generated marketing videos",
            "Synthetic voice for audiobooks",
            "Deepfake detection tools",
            "AI-generated images for advertising",
        ],
    },
]

# ---- 2.4 MINIMAL RISK INDICATORS ----
MINIMAL_RISK_INDICATORS = [
    {
        "id": "MIN.1",
        "name": "AI-Enabled Video Games",
        "article": "Recital 26",
        "description": "AI systems in video games for NPC behaviour, procedural generation, difficulty adjustment.",
        "keywords": [
            "video game AI", "NPC behaviour", "game AI",
            "procedural generation game", "game difficulty AI",
            "enemy AI", "game bot", "gaming AI",
        ],
        "examples": ["NPC opponents in strategy games"],
    },
    {
        "id": "MIN.2",
        "name": "Spam Filter / Content Organisation",
        "article": "Recital 26",
        "description": "AI systems for spam filtering, smart inbox categorisation, automated content organisation.",
        "keywords": [
            "spam filter", "email categorisation", "content organisation",
            "smart inbox", "newsletter filter", "junk detection",
        ],
        "examples": ["Email spam detection", "Social media feed curation"],
    },
    {
        "id": "MIN.3",
        "name": "Inventory / Supply Chain Optimisation",
        "article": "Recital 26",
        "description": "AI for inventory management, demand forecasting, logistics optimisation (non-safety-critical).",
        "keywords": [
            "inventory AI", "demand forecasting", "supply chain optimisation",
            "logistics AI", "warehouse management AI", "stock prediction",
            "delivery routing", "inventory management",
        ],
        "examples": ["Warehouse stock level prediction", "Delivery route optimisation"],
    },
    {
        "id": "MIN.4",
        "name": "Scientific Research / Recommender",
        "article": "Recital 26",
        "description": "AI for scientific research, product recommendation, creative tools (non-consequential).",
        "keywords": [
            "product recommendation", "scientific research AI",
            "creative AI tool", "content recommendation",
            "music recommendation", "movie recommendation",
            "research analysis AI", "non-consequential AI",
        ],
        "examples": [
            "E-commerce product recommendations",
            "Scientific data analysis tools",
            "AI-assisted creative writing tools",
        ],
    },
]


# -----------------------------------------------------------------------------
# Section 3: COMPLIANCE CHECKLISTS by risk level
# -----------------------------------------------------------------------------

class ChecklistItem:
    """A single compliance requirement with regulatory citation."""

    def __init__(self, id, article, title, description, actions,
                 deadline_note="", priority="required"):
        self.id = id
        self.article = article
        self.title = title
        self.description = description
        self.actions = actions
        self.deadline_note = deadline_note
        self.priority = priority

    def to_dict(self):
        return {
            "id": self.id,
            "article": self.article,
            "title": self.title,
            "description": self.description,
            "actions": self.actions,
            "deadline_note": self.deadline_note,
            "priority": self.priority,
            "status": "pending",
        }


# ---- 3.1 UNACCEPTABLE RISK CHECKLIST ----
CHECKLIST_UNACCEPTABLE = [
    ChecklistItem(
        id="UNACCEPTABLE-01",
        article="Article 5(1); Recital 28",
        title="CEASE OPERATION IMMEDIATELY",
        description="The described AI system falls into the prohibited 'unacceptable risk' category under Article 5 of the EU AI Act. Operation, placing on the market, putting into service, or use is PROHIBITED throughout the European Union.",
        actions=[
            "IMMEDIATELY suspend deployment and use of the AI system in the EU",
            "Notify all affected users and stakeholders of the prohibition",
            "Conduct full legal review with EU AI Act specialist counsel",
            "Document the decision rationale for regulatory inspection",
            "Assess whether ANY narrow exception under Article 5(2) applies",
            "If no exception applies, plan system decommissioning or redesign",
            "Report compliance actions to relevant national supervisory authority",
        ],
        deadline_note="Immediate -- prohibition effective from 2 February 2025",
        priority="required",
    ),
    ChecklistItem(
        id="UNACCEPTABLE-02",
        article="Article 5(2); Recitals 34-38",
        title="Assess Exceptions (if applicable)",
        description="Article 5(2) provides narrow exceptions for real-time biometric identification: (a) victim search, (b) imminent threat to life/terrorism, (c) serious crime investigation with prior judicial authorisation.",
        actions=[
            "Document specific exception category claimed",
            "Obtain prior judicial authorisation if required by Article 5(2)(c)",
            "Register each use with competent authority per Article 5(4)",
            "Ensure use is limited to the strictly necessary scope",
            "Report outcomes to authorising judicial authority",
        ],
        deadline_note="Before any deployment",
        priority="required",
    ),
    ChecklistItem(
        id="UNACCEPTABLE-03",
        article="Article 99; Article 113(3)",
        title="Penalties Awareness",
        description="Non-compliance with Article 5 prohibitions attracts the highest penalties: up to EUR 35 million or 7% of global annual turnover (whichever is higher).",
        actions=[
            "Quantify potential penalty exposure under Article 99",
            "Review Directors & Officers (D&O) insurance coverage",
            "Brief board on regulatory risk and liability",
            "Engage external compliance counsel immediately",
        ],
        deadline_note="Immediate",
        priority="required",
    ),
]

# ---- 3.2 HIGH-RISK CHECKLIST ----
CHECKLIST_HIGH_RISK = [
    ChecklistItem(
        id="HR-01",
        article="Article 8 -- Risk Management System",
        title="Establish Risk Management System",
        description="Implement a continuous, iterative risk management process throughout the AI system lifecycle. Identify and analyse known/foreseeable risks, estimate/evaluate risks that may emerge, and adopt suitable risk management measures.",
        actions=[
            "Designate a Risk Management Officer for the AI system",
            "Document the risk management plan covering entire lifecycle",
            "Conduct preliminary risk analysis (known risks)",
            "Implement risk estimation methodology (foreseeable risks)",
            "Define risk acceptance criteria and residual risk thresholds",
            "Establish post-market monitoring for emerging risks",
            "Review and update risk management system at least annually",
            "Maintain risk management documentation for 10 years (Article 18)",
        ],
        deadline_note="Before placing on market / putting into service",
        priority="required",
    ),
    ChecklistItem(
        id="HR-02",
        article="Article 9 -- Data & Data Governance",
        title="Implement Data Governance Framework",
        description="Training, validation, and testing datasets must meet quality criteria: relevant, representative, error-free, complete, and with appropriate statistical properties. Special attention to data gaps and shortcomings.",
        actions=[
            "Document data collection methodology and sources",
            "Assess data relevance to the intended purpose",
            "Evaluate representativeness (demographic, geographic, temporal)",
            "Conduct data quality audit -- identify errors, outliers, missing values",
            "Analyse data for possible biases (protected attribute analysis)",
            "Implement bias detection metrics (demographic parity, equalised odds)",
            "Document data cleaning, preprocessing, and augmentation steps",
            "Maintain separate training/validation/testing datasets",
            "Establish data lineage and version control",
            "If using synthetic data, document generation method and fidelity",
        ],
        deadline_note="Before placing on market / putting into service",
        priority="required",
    ),
    ChecklistItem(
        id="HR-03",
        article="Article 10 -- Technical Documentation",
        title="Prepare Technical Documentation",
        description="Maintain comprehensive technical documentation demonstrating compliance with the Act. Must be sufficient for authorities to assess conformity.",
        actions=[
            "System description and intended purpose documentation",
            "Architecture diagrams (data flow, model architecture, deployment)",
            "Algorithmic design and model selection rationale",
            "Hyperparameter configuration and optimisation strategy",
            "Training methodology documentation (epochs, batch size, loss function)",
            "Performance metrics on validation and test sets",
            "Hardware/software dependencies and environment specification",
            "Integration points with other systems",
            "Version control and change management log",
            "Keep documentation up-to-date throughout lifecycle",
            "Prepare summary of technical documentation (Annex IV, Section B)",
        ],
        deadline_note="Before placing on market; continuously updated",
        priority="required",
    ),
    ChecklistItem(
        id="HR-04",
        article="Article 11 -- Record-Keeping / Logging",
        title="Implement Automatic Logging (Record-Keeping)",
        description="High-risk AI systems must automatically record events (logs) over their lifetime to ensure traceability and facilitate post-market monitoring.",
        actions=[
            "Implement automatic logging for each use of the AI system",
            "Log model version, input data summary, timestamp, output",
            "Log any instances of malfunction or unexpected behaviour",
            "Implement tamper-resistant log storage",
            "Ensure logs retained for minimum period per Article 18",
            "Design log access controls (who can view/modify logs)",
            "Implement log monitoring for anomaly detection",
            "Ensure logs enable reconstruction of individual decisions",
            "Document logging architecture and data retention policy",
        ],
        deadline_note="Before placing on market",
        priority="required",
    ),
    ChecklistItem(
        id="HR-05",
        article="Article 13 -- Transparency & User Information",
        title="Provide Transparency & User Information",
        description="High-risk AI systems must be designed to enable deployers to interpret system output and use it appropriately. Instructions for use must include: intended purpose, performance characteristics, limitations, known risks.",
        actions=[
            "Draft comprehensive 'Instructions for Use' document",
            "Clearly state intended purpose and scope of application",
            "Document known limitations and conditions of use",
            "Describe expected performance characteristics with metrics",
            "List known foreseeable failure modes and edge cases",
            "Specify required human oversight measures",
            "Include information on change control procedures",
            "Provide expected system lifetime and maintenance schedule",
            "Document instructions in all EU languages where deployed",
        ],
        deadline_note="Before placing on market",
        priority="required",
    ),
    ChecklistItem(
        id="HR-06",
        article="Article 14 -- Human Oversight",
        title="Implement Human Oversight Measures",
        description="High-risk AI systems must be designed for effective human oversight by natural persons. Oversight measures must enable: awareness of automation bias, correct interpretation of outputs, decision override, intervention/stop commands.",
        actions=[
            "Design human-in-the-loop (HITL) or human-on-the-loop (HOTL) architecture",
            "Implement override mechanism for AI system decisions",
            "Provide interpretable output with confidence scores",
            "Design user interface to combat automation bias",
            "Define escalation procedures for low-confidence predictions",
            "Train oversight personnel on system capabilities and limitations",
            "Document oversight roles, responsibilities, and procedures",
            "Implement real-time alerts for anomalous system behaviour",
            "Establish protocol for emergency system shutdown",
            "Review oversight effectiveness quarterly and document findings",
        ],
        deadline_note="Before placing on market; continuously monitored",
        priority="required",
    ),
    ChecklistItem(
        id="HR-07",
        article="Article 15 -- Accuracy, Robustness, Cybersecurity",
        title="Ensure Accuracy, Robustness & Cybersecurity",
        description="High-risk AI systems must achieve appropriate levels of accuracy, robustness, and cybersecurity for their intended purpose. Must be resilient against errors, faults, inconsistencies, and attacks.",
        actions=[
            "Define accuracy metrics appropriate to the use case",
            "Establish minimum accuracy thresholds with justification",
            "Conduct robustness testing (adversarial inputs, edge cases)",
            "Perform stress testing under various operating conditions",
            "Implement input validation and sanitisation",
            "Conduct cybersecurity risk assessment (OWASP ML Top 10)",
            "Implement adversarial attack defences",
            "Perform model poisoning and data poisoning detection",
            "Establish continuous monitoring for accuracy degradation (drift)",
            "Document accuracy and robustness test results",
            "Implement secure software development lifecycle (SSDLC)",
        ],
        deadline_note="Before placing on market; continuously monitored",
        priority="required",
    ),
    ChecklistItem(
        id="HR-08",
        article="Article 16 -- Quality Management System",
        title="Establish Quality Management System (QMS)",
        description="Providers must put in place a quality management system ensuring compliance with the AI Act. Must cover: strategy, procedures, responsibilities, resources, and continuous improvement.",
        actions=[
            "Designate management representative responsible for QMS",
            "Document QMS policy and objectives",
            "Establish procedures for design, development, and testing",
            "Implement change management and version control processes",
            "Define supplier and third-party assessment procedures",
            "Establish internal audit programme (minimum annually)",
            "Document management review procedures",
            "Implement corrective and preventive action (CAPA) process",
            "Maintain QMS records for 10 years after system withdrawal",
        ],
        deadline_note="Before placing on market; continuously maintained",
        priority="required",
    ),
    ChecklistItem(
        id="HR-09",
        article="Article 17 -- Automatic Logging (Provider)",
        title="Implement Provider-Side Logging",
        description="Providers must implement automatic logging for post-market monitoring. Logs must enable tracing of system functioning throughout the lifecycle.",
        actions=[
            "Implement logging for all model training events",
            "Log data version, training configuration, and hyperparameters",
            "Log validation results and performance metrics",
            "Implement centralised logging infrastructure",
            "Ensure log integrity (tamper-evident storage)",
            "Define log retention period (minimum 10 years per Article 18)",
            "Implement log access controls and audit trail",
            "Design log analysis procedures for trend detection",
        ],
        deadline_note="Before placing on market; continuously maintained",
        priority="required",
    ),
    ChecklistItem(
        id="HR-10",
        article="Article 20 -- Corrective Actions & Duty of Information",
        title="Establish Corrective Action Framework",
        description="Providers must establish procedures for investigating and taking corrective actions when the AI system is not in conformity. Must inform competent national authorities and affected deployers.",
        actions=[
            "Define non-conformity classification system (critical/major/minor)",
            "Establish incident response team and escalation procedures",
            "Implement root cause analysis methodology",
            "Document corrective action plan for each non-conformity",
            "Establish notification procedure for competent authorities",
            "Define communication plan for affected deployers/users",
            "Implement field safety corrective action (FSCA) procedures",
            "Maintain corrective action register and trend analysis",
            "Document effectiveness verification for all corrective actions",
        ],
        deadline_note="Before placing on market; continuously active",
        priority="required",
    ),
    ChecklistItem(
        id="HR-11",
        article="Article 21 -- Registration Obligations",
        title="Register AI System in EU Database",
        description="Before placing a high-risk AI system on the market, providers (or authorised representatives) must register themselves and the system in the EU AI Act database.",
        actions=[
            "Create account in EU AI Act database (when available)",
            "Prepare registration information per Annex VIII",
            "Submit provider identification and contact details",
            "Upload technical documentation summary",
            "Declare conformity assessment procedure applied",
            "Obtain unique registration number",
            "Update registration for any significant changes",
            "Renew registration periodically as required",
        ],
        deadline_note="Before placing on market (after 2 August 2025)",
        priority="required",
    ),
    ChecklistItem(
        id="HR-12",
        article="Article 22 -- Post-Market Monitoring",
        title="Implement Post-Market Monitoring System",
        description="Providers must establish and document a post-market monitoring system to actively and systematically collect, document, and analyse relevant data on performance throughout the system's lifetime.",
        actions=[
            "Define post-market monitoring plan and KPIs",
            "Implement automated data collection from deployed systems",
            "Establish periodic performance review schedule (monthly/quarterly)",
            "Define trigger thresholds for investigation (e.g., accuracy drop)",
            "Implement user feedback collection mechanism",
            "Document and analyse all reported incidents",
            "Conduct annual post-market surveillance report",
            "Update risk management based on post-market findings",
            "Maintain post-market monitoring records for 10 years",
        ],
        deadline_note="Continuous throughout system lifetime",
        priority="required",
    ),
    ChecklistItem(
        id="HR-13",
        article="Article 26 -- Deployer Obligations",
        title="Comply with Deployer Obligations",
        description="Deployers (users) of high-risk AI systems must implement human oversight, ensure input data relevance, monitor for risks, maintain logs, and inform workers' representatives.",
        actions=[
            "Assign competent personnel for human oversight",
            "Ensure input data is relevant to intended purpose",
            "Monitor AI system operation for anomalies or risks",
            "Maintain logs as required by Article 12",
            "Inform workers' representatives when AI affects working conditions",
            "Inform affected persons they are subject to high-risk AI",
            "Conduct fundamental rights impact assessment (Article 27)",
            "Cooperate with market surveillance authorities",
        ],
        deadline_note="Before deployment; continuously maintained",
        priority="required",
    ),
    ChecklistItem(
        id="HR-14",
        article="Article 27 -- Fundamental Rights Impact Assessment (FRIA)",
        title="Conduct Fundamental Rights Impact Assessment",
        description="Deployers must conduct an assessment of the impact on fundamental rights that the use of the high-risk AI system may have, before putting it into use.",
        actions=[
            "Identify all fundamental rights potentially affected",
            "Assess impact on: dignity, privacy, non-discrimination, data protection",
            "Evaluate impact on freedom of expression, assembly, movement",
            "Assess effects on vulnerable groups and minorities",
            "Document mitigation measures for identified risks",
            "Consult affected stakeholders and civil society",
            "Publish FRIA summary (where appropriate)",
            "Review and update FRIA at least annually",
            "Submit FRIA to competent authority if required",
        ],
        deadline_note="Before first deployment of high-risk AI",
        priority="required",
    ),
    ChecklistItem(
        id="HR-15",
        article="Article 28 -- Use of AI by Public Authorities",
        title="Public Authority Additional Obligations",
        description="Public authorities deploying high-risk AI systems have additional obligations: non-discrimination assessment, transparency about AI use, and specific reporting requirements.",
        actions=[
            "Conduct non-discrimination assessment before deployment",
            "Publish information about AI systems used and their purpose",
            "Register all high-risk AI systems in EU database",
            "Report serious incidents to market surveillance within 15 days",
            "Ensure decisions can be explained to affected individuals",
            "Provide right to human review of AI-assisted decisions",
            "Conduct annual review of AI system impact on citizens",
        ],
        deadline_note="Before deployment; continuously maintained",
        priority="required",
    ),
    ChecklistItem(
        id="HR-16",
        article="Article 43 -- Conformity Assessment",
        title="Complete Conformity Assessment",
        description="High-risk AI systems must undergo a conformity assessment procedure before being placed on the market. Can be internal production control or third-party assessment.",
        actions=[
            "Determine applicable conformity assessment procedure",
            "Internal production control (Annex VI) OR",
            "Third-party assessment by Notified Body (Annex VII)",
            "Prepare EU declaration of conformity",
            "Affix CE marking to AI system",
            "Maintain conformity assessment documentation",
            "Prepare for re-assessment upon significant changes",
        ],
        deadline_note="Before placing on market (after 2 August 2026)",
        priority="required",
    ),
    ChecklistItem(
        id="HR-17",
        article="Article 48 -- EU Declaration of Conformity",
        title="Draw Up EU Declaration of Conformity",
        description="Providers must draw up a written EU declaration of conformity stating that the high-risk AI system meets the requirements of the AI Act.",
        actions=[
            "Use template from Annex V of the AI Act",
            "Include AI system name, type, and identification",
            "Reference technical documentation",
            "State conformity with all applicable requirements",
            "Include provider name, address, and signature",
            "Date the declaration",
            "Maintain declaration for 10 years after system withdrawal",
        ],
        deadline_note="Before placing on market",
        priority="required",
    ),
    ChecklistItem(
        id="HR-18",
        article="Article 50 -- CE Marking",
        title="Apply CE Marking",
        description="High-risk AI systems must bear the CE marking to indicate conformity with the AI Act. Must be affixed visibly, legibly, and indelibly.",
        actions=[
            "Ensure CE marking conforms to Regulation (EC) No 765/2008",
            "Affix CE marking visibly on AI system or packaging",
            "Include notified body identification number (if applicable)",
            "Do not affix CE until full conformity is achieved",
            "Maintain records of CE marking application",
        ],
        deadline_note="Before placing on market",
        priority="required",
    ),
    ChecklistItem(
        id="HR-REC-01",
        article="Recital 84-97 (GPAI)",
        title="Assess General-Purpose AI (GPAI) Obligations",
        description="If the high-risk AI system incorporates a GPAI model, additional obligations may apply under Articles 52a-52i for systemic risk GPAI models.",
        actions=[
            "Determine if system incorporates a GPAI model",
            "Assess if GPAI model has systemic risk classification",
            "If systemic risk: ensure model evaluation and red-teaming",
            "If systemic risk: ensure incident reporting to AI Office",
            "Document GPAI model integration and dependencies",
        ],
        deadline_note="If applicable -- assess immediately",
        priority="recommended",
    ),
]

# ---- 3.3 LIMITED RISK CHECKLIST ----
CHECKLIST_LIMITED = [
    ChecklistItem(
        id="LR-01",
        article="Article 52(1)",
        title="Chatbot Transparency Obligation",
        description="AI systems designed to interact directly with natural persons (chatbots) must disclose that the user is interacting with an AI, unless obvious from the context and circumstances.",
        actions=[
            "Implement clear AI disclosure at start of every interaction",
            "Use unambiguous language: 'You are interacting with an AI assistant'",
            "Ensure disclosure is visually prominent and accessible",
            "Provide information about the AI system's capabilities and limitations",
            "Implement mechanism for user to request human agent",
            "Document disclosure implementation and user testing results",
            "Test with users to verify disclosure is clear and understood",
        ],
        deadline_note="Before placing on market (after 2 August 2025)",
        priority="required",
    ),
    ChecklistItem(
        id="LR-02",
        article="Article 52(2)",
        title="Emotion Recognition / Biometric Categorisation Transparency",
        description="AI systems that recognise emotions or biometric categorisation must inform exposed persons that they are being exposed to such a system, and process data lawfully.",
        actions=[
            "Post clear notices in all areas where emotion recognition operates",
            "Inform individuals BEFORE processing their biometric/emotion data",
            "Provide mechanism for individuals to opt out where possible",
            "Document lawful basis for processing under GDPR",
            "Ensure compliance with GDPR Articles 13 and 14 (information provision)",
            "Implement data minimisation -- only process necessary data",
            "Conduct Data Protection Impact Assessment (DPIA) under GDPR",
            "Provide contact details for data protection enquiries",
        ],
        deadline_note="Before placing on market (after 2 August 2025)",
        priority="required",
    ),
    ChecklistItem(
        id="LR-03",
        article="Article 52(3)",
        title="Deepfake / Synthetic Content Disclosure",
        description="AI systems that generate or manipulate image, audio, or video content constituting a deepfake must disclose that the content has been artificially created or manipulated.",
        actions=[
            "Implement visible watermark or label on all AI-generated content",
            "Use metadata tagging (e.g., C2PA standard) to mark synthetic content",
            "Disclose artificial nature at point of sharing/distribution",
            "Ensure disclosure persists through sharing and republication",
            "Provide clear, human-readable indication of artificial manipulation",
            "Document disclosure methods and their technical implementation",
            "Test that disclosure cannot be easily removed by users",
        ],
        deadline_note="Before placing on market (after 2 August 2025)",
        priority="required",
    ),
    ChecklistItem(
        id="LR-04",
        article="Article 52(4)",
        title="Exceptions to Disclosure Obligations",
        description="Assess whether any exception to transparency obligations applies: law enforcement, freedom of expression/artistic work, authorised satire/parody.",
        actions=[
            "Document whether content falls under artistic/satirist exception",
            "If law enforcement exception applies, document legal basis",
            "If parody/satire: assess whether work is clearly identifiable as such",
            "Maintain documentation of exception assessment",
            "If no exception: ensure full transparency obligations are met",
        ],
        deadline_note="Assess before deployment",
        priority="recommended",
    ),
    ChecklistItem(
        id="LR-05",
        article="GDPR (Regulation (EU) 2016/679)",
        title="Ensure GDPR Compliance",
        description="Limited-risk AI systems must comply with GDPR requirements for lawful processing, data minimisation, purpose limitation, and data subject rights.",
        actions=[
            "Identify lawful basis for processing (consent, legitimate interest, etc.)",
            "Conduct Data Protection Impact Assessment (DPIA) if required",
            "Implement data minimisation -- collect only necessary data",
            "Ensure purpose limitation -- use data only for stated purpose",
            "Provide privacy notice covering AI processing",
            "Implement mechanisms for data subject rights requests",
            "Ensure cross-border data transfer compliance (if applicable)",
            "Appoint Data Protection Officer (DPO) if required",
        ],
        deadline_note="Before processing personal data",
        priority="required",
    ),
]

# ---- 3.4 MINIMAL RISK CHECKLIST ----
CHECKLIST_MINIMAL = [
    ChecklistItem(
        id="MIN-01",
        article="Recital 26; Article 95",
        title="Voluntary Code of Conduct",
        description="Providers of minimal-risk AI systems are encouraged to voluntarily apply the requirements for high-risk systems as a code of conduct. This builds trust and demonstrates responsible AI practices.",
        actions=[
            "Consider voluntarily adopting high-risk system requirements",
            "Implement basic risk management practices",
            "Document intended purpose and system limitations",
            "Provide transparency information to users",
            "Establish basic logging for accountability",
            "Consider voluntary conformity assessment",
        ],
        deadline_note="Voluntary -- recommended for trust-building",
        priority="recommended",
    ),
    ChecklistItem(
        id="MIN-02",
        article="GDPR; Data Protection Law",
        title="Ensure Data Protection Compliance",
        description="Even minimal-risk AI systems processing personal data must comply with applicable data protection laws, including GDPR.",
        actions=[
            "Ensure lawful basis for any personal data processing",
            "Implement data minimisation for personal data",
            "Provide privacy notice to data subjects",
            "Implement data subject rights mechanisms",
            "Ensure data security (encryption, access controls)",
            "Document data processing activities",
        ],
        deadline_note="Before processing personal data",
        priority="required",
    ),
    ChecklistItem(
        id="MIN-03",
        article="Consumer Protection Law",
        title="Ensure Consumer Protection Compliance",
        description="AI systems offered to consumers must comply with EU consumer protection laws: unfair commercial practices directive, product liability, etc.",
        actions=[
            "Ensure AI system does not engage in deceptive practices",
            "Provide accurate information about product capabilities",
            "Comply with EU product liability rules",
            "Implement accessible customer support channels",
            "Ensure terms of service are fair and transparent",
        ],
        deadline_note="Before placing on market",
        priority="required",
    ),
]


# -----------------------------------------------------------------------------
# Section 4: RISK CLASSIFICATION ENGINE
# -----------------------------------------------------------------------------

class RiskMatch:
    """A matched risk indicator with confidence score."""

    def __init__(self, indicator, matched_keywords, confidence):
        self.indicator = indicator
        self.matched_keywords = matched_keywords
        self.confidence = confidence

    def to_dict(self):
        return {
            "indicator_id": self.indicator["id"],
            "indicator_name": self.indicator["name"],
            "article": self.indicator["article"],
            "matched_keywords": self.matched_keywords,
            "confidence": round(self.confidence, 3),
            "description": self.indicator["description"],
            "examples": self.indicator["examples"],
        }


class ClassificationResult:
    """Full classification result for an AI system."""

    def __init__(self, risk_level, matches, input_text):
        self.risk_level = risk_level
        self.matches = matches
        self.input_text = input_text
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.confidence = self._compute_overall_confidence()

    def _compute_overall_confidence(self):
        if not self.matches:
            return 0.5
        return sum(m.confidence for m in self.matches) / len(self.matches)

    def to_dict(self):
        return {
            "risk_level": self.risk_level.value,
            "risk_display": self.risk_level.display(),
            "regulatory_basis": self.risk_level.regulatory_basis(),
            "confidence": round(self.confidence, 3),
            "num_indicators_matched": len(self.matches),
            "matched_indicators": [m.to_dict() for m in self.matches],
            "timestamp": self.timestamp,
        }


def classify_input(text):
    """
    Classify an AI system description against EU AI Act risk categories.

    Uses a hybrid matching strategy:
    1. Full phrase matching (exact substring = highest confidence)
    2. Word-level token matching (partial matches still score)
    3. Category-level scoring with weighted top matches
    """
    text_lower = text.lower()
    # Tokenise input into unique words for fast lookup
    text_words = set(re.findall(r'[a-z]+', text_lower))

    def score_indicators(indicators):
        matches = []
        for ind in indicators:
            matched = []
            total_score = 0.0
            for kw in ind["keywords"]:
                kw_lower = kw.lower()
                # Level 1: exact phrase match (highest score)
                if kw_lower in text_lower:
                    matched.append(kw)
                    total_score += 1.0
                else:
                    # Level 2: word-level token matching
                    kw_words = set(re.findall(r'[a-z]+', kw_lower))
                    if not kw_words:
                        continue
                    common = kw_words & text_words
                    # Require at least 2 matching words, or 50% of words
                    min_match = 2 if len(kw_words) >= 2 else 1
                    if len(common) >= max(len(kw_words) * 0.5, min_match):
                        # Partial match: score proportional to word overlap
                        partial_score = len(common) / len(kw_words)
                        matched.append(kw)
                        total_score += partial_score * 0.7  # 70% weight for partial

            if matched:
                # Confidence = proportion of max possible score
                max_possible = len(ind["keywords"])
                confidence = min(total_score / max(max_possible * 0.25, 1.0), 1.0)
                matches.append(RiskMatch(ind, matched, confidence))
        matches.sort(key=lambda m: m.confidence, reverse=True)
        return matches

    unacceptable_matches = score_indicators(UNACCEPTABLE_INDICATORS)
    high_matches = score_indicators(HIGH_RISK_INDICATORS)
    limited_matches = score_indicators(LIMITED_RISK_INDICATORS)
    minimal_matches = score_indicators(MINIMAL_RISK_INDICATORS)

    def category_score(matches):
        if not matches:
            return 0.0
        top = matches[:3]
        weights = [1.0, 0.5, 0.25]
        return sum(m.confidence * w for m, w in zip(top, weights))

    scores = {
        RiskLevel.UNACCEPTABLE: category_score(unacceptable_matches),
        RiskLevel.HIGH: category_score(high_matches),
        RiskLevel.LIMITED: category_score(limited_matches),
        RiskLevel.MINIMAL: category_score(minimal_matches),
    }

    sorted_levels = sorted(scores.items(), key=lambda x: (x[1], {
        RiskLevel.UNACCEPTABLE: 4,
        RiskLevel.HIGH: 3,
        RiskLevel.LIMITED: 2,
        RiskLevel.MINIMAL: 1,
    }[x[0]]), reverse=True)

    selected_level = sorted_levels[0][0]

    match_map = {
        RiskLevel.UNACCEPTABLE: unacceptable_matches,
        RiskLevel.HIGH: high_matches,
        RiskLevel.LIMITED: limited_matches,
        RiskLevel.MINIMAL: minimal_matches,
    }
    selected_matches = match_map[selected_level]

    if not any(scores.values()):
        generic_ai_terms = ["ai", "artificial intelligence", "machine learning",
                            "ml", "neural network", "model", "algorithm",
                            "deep learning", "predictive", "automation",
                            "classification", "regression", "nlp",
                            "natural language", "computer vision"]
        if any(term in text_lower for term in generic_ai_terms):
            selected_level = RiskLevel.MINIMAL
            selected_matches = []
        else:
            selected_level = RiskLevel.MINIMAL
            selected_matches = []

    return ClassificationResult(selected_level, selected_matches, text)


# -----------------------------------------------------------------------------
# Section 5: COMPLIANCE CHECKLIST GENERATOR
# -----------------------------------------------------------------------------

def generate_checklist(classification):
    checklist_map = {
        RiskLevel.UNACCEPTABLE: CHECKLIST_UNACCEPTABLE,
        RiskLevel.HIGH: CHECKLIST_HIGH_RISK,
        RiskLevel.LIMITED: CHECKLIST_LIMITED,
        RiskLevel.MINIMAL: CHECKLIST_MINIMAL,
    }
    items = checklist_map[classification.risk_level]
    return [item.to_dict() for item in items]


# -----------------------------------------------------------------------------
# Section 6: REPORT GENERATORS (JSON + Markdown)
# -----------------------------------------------------------------------------

class ComplianceReport:
    """Full compliance report combining classification and checklist."""

    def __init__(self, company_name, company_description, system_name,
                 system_description, classification, checklist):
        self.company_name = company_name
        self.company_description = company_description
        self.system_name = system_name
        self.system_description = system_description
        self.classification = classification
        self.checklist = checklist
        self.timestamp = datetime.now(timezone.utc).isoformat()
        self.report_id = self._generate_report_id()

    def _generate_report_id(self):
        ts = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        safe_company = re.sub(r'[^a-zA-Z0-9]', '_', self.company_name)[:20]
        return f"EUAIACT_{safe_company}_{ts}"

    def to_dict(self):
        return {
            "report_metadata": {
                "report_id": self.report_id,
                "generated_at": self.timestamp,
                "tool_version": "1.0.0",
                "regulation": "Regulation (EU) 2024/1689 -- EU Artificial Intelligence Act",
                "disclaimer": "This report is generated by automated analysis and does not constitute legal advice. Consult qualified EU AI Act legal counsel for definitive compliance assessment.",
            },
            "company": {
                "name": self.company_name,
                "description": self.company_description,
            },
            "ai_system": {
                "name": self.system_name,
                "description": self.system_description,
            },
            "risk_classification": self.classification.to_dict(),
            "compliance_checklist": self.checklist,
            "summary": {
                "total_checklist_items": len(self.checklist),
                "required_items": sum(1 for c in self.checklist if c["priority"] == "required"),
                "recommended_items": sum(1 for c in self.checklist if c["priority"] == "recommended"),
                "informational_items": sum(1 for c in self.checklist if c["priority"] == "informational"),
            },
        }

    def to_json(self, indent=2):
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)

    def to_markdown(self):
        d = self.to_dict()
        rc = d["risk_classification"]
        sm = d["summary"]

        md = []
        md.append("# EU AI Act Compliance Report")
        md.append("")
        md.append("---")
        md.append("")
        md.append("## Report Metadata")
        md.append("")
        md.append("| Field | Value |")
        md.append("|-------|-------|")
        md.append("| **Report ID** | {} |".format(d['report_metadata']['report_id']))
        md.append("| **Generated** | {} |".format(d['report_metadata']['generated_at']))
        md.append("| **Tool Version** | {} |".format(d['report_metadata']['tool_version']))
        md.append("| **Regulation** | {} |".format(d['report_metadata']['regulation']))
        md.append("")
        md.append("> **DISCLAIMER:** " + d["report_metadata"]["disclaimer"])
        md.append("")
        md.append("---")
        md.append("")

        md.append("## 1. Subject Information")
        md.append("")
        md.append("### Company")
        md.append("**{}**".format(self.company_name))
        md.append("")
        md.append(self.company_description)
        md.append("")
        md.append("### AI System")
        md.append("**{}**".format(self.system_name))
        md.append("")
        md.append(self.system_description)
        md.append("")
        md.append("---")
        md.append("")

        md.append("## 2. Risk Classification")
        md.append("")
        md.append("### {}".format(rc['risk_display']))
        md.append("")
        md.append("**Regulatory Basis:** {}".format(rc['regulatory_basis']))
        md.append("")
        md.append("**Classification Confidence:** {:.1%}".format(rc['confidence']))
        md.append("")
        md.append("**Indicators Matched:** {}".format(rc['num_indicators_matched']))
        md.append("")

        if rc["matched_indicators"]:
            md.append("#### Matched Indicators")
            md.append("")
            for i, mi in enumerate(rc["matched_indicators"], 1):
                md.append("**{}. {}** (`{}`)".format(i, mi['indicator_name'], mi['indicator_id']))
                md.append("")
                md.append("- **Article:** {}".format(mi['article']))
                md.append("- **Confidence:** {:.1%}".format(mi['confidence']))
                md.append("- **Matched Keywords:** {}".format(', '.join(mi['matched_keywords'][:5])))
                md.append("- **Description:** {}".format(mi['description']))
                if mi['examples']:
                    md.append("- **Examples:** {}".format(', '.join(mi['examples'][:2])))
                md.append("")
        else:
            md.append("*No specific regulatory indicators were matched. The system was classified based on general AI system characteristics and the precautionary principle.*")
            md.append("")

        md.append("---")
        md.append("")

        md.append("## 3. Compliance Checklist")
        md.append("")
        md.append("**Total Items:** {} | **Required:** {} | **Recommended:** {} | **Informational:** {}".format(
            sm['total_checklist_items'], sm['required_items'],
            sm['recommended_items'], sm['informational_items']))
        md.append("")

        for item in self.checklist:
            priority_badge = {
                "required": "REQUIRED",
                "recommended": "RECOMMENDED",
                "informational": "INFORMATIONAL",
            }.get(item["priority"], item["priority"])

            md.append("### {}: {}".format(item['id'], item['title']))
            md.append("")
            md.append("**Article:** {}  |  **Priority:** {}".format(item['article'], priority_badge))
            md.append("")
            md.append(item['description'])
            md.append("")
            md.append("**Deadline:** {}".format(item['deadline_note']))
            md.append("")
            md.append("**Actions:**")
            for action in item["actions"]:
                md.append("- [ ] {}".format(action))
            md.append("")
            md.append("---")
            md.append("")

        md.append("## 4. Key EU AI Act Deadlines")
        md.append("")
        md.append("| Date | Milestone |")
        md.append("|------|-----------|")
        md.append("| **2 February 2025** | Prohibited practices (Article 5) -- IN EFFECT |")
        md.append("| **2 August 2025** | Codes of practice for GPAI; transparency obligations |")
        md.append("| **2 August 2026** | Full high-risk system obligations; conformity assessment |")
        md.append("| **2 August 2027** | Obligations for high-risk systems listed in Annex II |")
        md.append("")

        md.append("## 5. Penalty Framework")
        md.append("")
        md.append("| Violation Category | Fine |")
        md.append("|-------------------|------|")
        md.append("| **Prohibited practices (Art. 5)** | Up to EUR 35M or 7% global turnover |")
        md.append("| **High-risk non-compliance** | Up to EUR 15M or 3% global turnover |")
        md.append("| **Incorrect information to authorities** | Up to EUR 7.5M or 1% global turnover |")
        md.append("")

        md.append("## 6. Recommended Next Steps")
        md.append("")
        md.append("1. **Review this report with legal counsel** specialising in EU AI Act compliance")
        md.append("2. **Prioritise REQUIRED items** for immediate action")
        md.append("3. **Assign compliance owners** for each checklist item")
        md.append("4. **Set up compliance tracking** with regular progress reviews")
        md.append("5. **Monitor regulatory updates** from the EU AI Office and national authorities")
        md.append("6. **Consider external audit** by an EU AI Act conformity assessment body")
        md.append("")

        md.append("---")
        md.append("")
        md.append("*Generated by CSOAI EU AI Act Compliance Checker v1.0.0*")
        md.append("")
        md.append("*2025 CSOAI -- This report is for informational purposes only and does not constitute legal advice.*")
        md.append("")

        return "\n".join(md)


# -----------------------------------------------------------------------------
# Section 7: FILE I/O
# -----------------------------------------------------------------------------

def save_reports(report):
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    base_name = "eu_ai_act_report_{}".format(timestamp)

    json_path = "{}.json".format(base_name)
    md_path = "{}.md".format(base_name)

    with open(json_path, "w", encoding="utf-8") as f:
        f.write(report.to_json())

    with open(md_path, "w", encoding="utf-8") as f:
        f.write(report.to_markdown())

    return json_path, md_path


# -----------------------------------------------------------------------------
# Section 8: CLI INTERFACE
# -----------------------------------------------------------------------------

BANNER = """
   _____ _    _    _____         _____          _____ _                            _
  |  ___/ \\  / \\  |_   _|       |  ___|        |  ___(_)_ __   __ _ _ __   ___  __| | ___  _ __
  | |_ / _ \\/ _ \\   | |         | |_          | |_  | | '_ \\ / _` | '_ \\ / _ \\/ _` |/ _ \\| '_ \\
  |  _/ ___ \\ ___|  | |         |  _|         |  _| | | | | | (_| | | | |  __/ (_| | (_) | | | |
  |_|/_/   \\_\\____| |_|  _____  |_|   _____   |_|   |_|_| |_|\\__,_|_| |_|\\___|\\__,_|\\___/|_| |_|
                        |_____|     |_____|

  +==========================================================================================+
  |   EU AI Act Compliance Checker  v1.0.0  --  Regulation (EU) 2024/1689                    |
  |   Maps AI systems to EU AI Act risk categories + generates actionable compliance reports |
  +==========================================================================================+
"""

EXAMPLES = {
    "1": {
        "name": "Healthcare Diagnostic AI (High Risk)",
        "company": "MedTech Diagnostics GmbH",
        "company_desc": "A German medical technology company developing AI-powered diagnostic tools for hospitals.",
        "system": "AI-Powered Chest X-Ray Analysis",
        "system_desc": "A deep learning system that analyses chest X-ray images to detect pneumonia, tuberculosis, and lung cancer. Deployed in 50 hospitals across Germany, France, and Italy. The system assists radiologists by highlighting suspicious regions and providing probability scores for 12 different pathologies. Processes approximately 10,000 images daily.",
    },
    "2": {
        "name": "Recruitment Screening AI (High Risk)",
        "company": "HireFlow Solutions SAS",
        "company_desc": "A French HR technology company providing AI-powered recruitment tools to large enterprises.",
        "system": "SmartHire Candidate Screening",
        "system_desc": "An AI system that automatically screens job applications, ranks candidates, and provides hiring recommendations based on resume analysis, video interview assessment, and psychometric testing. Uses natural language processing to evaluate candidate fit and predicts job performance scores.",
    },
    "3": {
        "name": "Customer Service Chatbot (Limited Risk)",
        "company": "ShopBot Technologies Ltd",
        "company_desc": "An Irish e-commerce technology company building conversational AI for online retailers.",
        "system": "ShopAssistant Conversational AI",
        "system_desc": "A customer service chatbot deployed on e-commerce websites that answers product questions, helps with order tracking, and handles returns. Uses large language model technology to provide natural language responses. Interacts with approximately 500,000 customers monthly across 15 EU countries.",
    },
    "4": {
        "name": "Social Scoring System (Unacceptable Risk)",
        "company": "CityGov Digital Services",
        "company_desc": "A municipal digital services provider working with local governments on smart city initiatives.",
        "system": "Citizen Trust Score Platform",
        "system_desc": "A comprehensive AI platform that evaluates citizen behaviour across multiple data sources including social media activity, payment history, traffic violations, and public service usage to generate a 'citizen trust score'. The score determines access to public housing, priority for school admissions, and eligibility for social benefits. Uses predictive analytics to forecast future compliance likelihood.",
    },
    "5": {
        "name": "Game AI NPC Controller (Minimal Risk)",
        "company": "Nordic Game Studios AB",
        "company_desc": "A Swedish indie game development studio specialising in strategy games.",
        "system": "NPC Behaviour Engine",
        "system_desc": "An AI system that controls non-player character behaviour in a medieval strategy game. Uses reinforcement learning to adapt NPC tactics based on player behaviour patterns. Generates procedural dialogue and adjusts game difficulty dynamically. Purely entertainment-focused with no real-world consequences.",
    },
}


def get_input_with_default(prompt, default=""):
    if default:
        user_input = input("{} [{}]: ".format(prompt, default)).strip()
        return user_input if user_input else default
    return input("{}: ".format(prompt)).strip()


def run_cli():
    print(BANNER)

    print("Welcome! This tool assesses your AI system against the EU AI Act and generates")
    print("a comprehensive compliance report with actionable checklist items.")
    print("")
    print("You can either:")
    print("  [1] Use a pre-configured example scenario")
    print("  [2] Enter your own company and AI system details")
    print("")

    choice = ""
    while choice not in ("1", "2"):
        choice = input("Select option (1 or 2): ").strip()

    if choice == "1":
        print("")
        print("Available examples:")
        for key, ex in EXAMPLES.items():
            print("  [{}] {}".format(key, ex['name']))
        print("")

        ex_choice = ""
        while ex_choice not in EXAMPLES:
            ex_choice = input("Select example (1-5): ").strip()

        ex = EXAMPLES[ex_choice]
        company_name = ex["company"]
        company_desc = ex["company_desc"]
        system_name = ex["system"]
        system_desc = ex["system_desc"]

        print("")
        print("Using example: {}".format(ex['name']))
        print("")

    else:
        print("")
        print("=" * 65)
        print("  COMPANY INFORMATION")
        print("=" * 65)
        print("")
        company_name = get_input_with_default("Company name")
        company_desc = get_input_with_default("Company description (what does the company do?)")

        print("")
        print("=" * 65)
        print("  AI SYSTEM INFORMATION")
        print("=" * 65)
        print("")
        print("Tip: Be specific! Include details about:")
        print("  - What the AI system does")
        print("  - Who uses it and how")
        print("  - What data it processes")
        print("  - What decisions it makes or influences")
        print("  - What sector/domain it operates in")
        print("")
        system_name = get_input_with_default("AI system name")
        system_desc = get_input_with_default("AI system description (be detailed)")

    combined_text = "{} {} {} {}".format(company_name, company_desc, system_name, system_desc)

    print("")
    print("=" * 65)
    print("  ANALYSING...")
    print("=" * 65)
    print("")
    print("Classifying AI system against EU AI Act risk categories...")
    print("")

    classification = classify_input(combined_text)

    print("")
    print("=" * 65)
    print("  RISK CLASSIFICATION RESULT")
    print("=" * 65)
    print("")
    print("  >> {}".format(classification.risk_level.display()))
    print("")
    print("  Classification Confidence: {:.1%}".format(classification.confidence))
    print("  Regulatory Basis: {}".format(classification.risk_level.regulatory_basis()))
    print("  Matched Indicators: {}".format(len(classification.matches)))
    print("")

    if classification.matches:
        print("  Matched Indicators:")
        for i, m in enumerate(classification.matches[:5], 1):
            print("    {}. {} ({}) -- {:.0%} confidence".format(
                i, m.indicator['name'], m.indicator['id'], m.confidence))
        print("")

    print("  Generating compliance checklist...")
    checklist = generate_checklist(classification)

    report = ComplianceReport(
        company_name=company_name,
        company_description=company_desc,
        system_name=system_name,
        system_description=system_desc,
        classification=classification,
        checklist=checklist,
    )

    json_path, md_path = save_reports(report)

    print("")
    print("=" * 65)
    print("  REPORTS GENERATED")
    print("=" * 65)
    print("")
    print("  [OK] JSON Report (API data):    ./{}".format(json_path))
    print("  [OK] Markdown Report (human):   ./{}".format(md_path))
    print("")
    print("  Checklist items generated: {}".format(len(checklist)))
    print("    [R] Required:      {}".format(
        sum(1 for c in checklist if c['priority'] == 'required')))
    print("    [O] Recommended:   {}".format(
        sum(1 for c in checklist if c['priority'] == 'recommended')))
    print("    [I] Informational: {}".format(
        sum(1 for c in checklist if c['priority'] == 'informational')))
    print("")
    print("  Markdown report is ready for sharing with stakeholders,")
    print("  investors, and regulators.")
    print("")
    print("  JSON report is ready for integration with compliance APIs")
    print("  and tracking systems.")
    print("")

    print("=" * 65)
    print("  KEY EU AI ACT DEADLINES")
    print("=" * 65)
    print("")
    print("  2 Feb 2025  -> Prohibited practices (Article 5) -- IN EFFECT")
    print("  2 Aug 2025  -> Transparency obligations; GPAI codes of practice")
    print("  2 Aug 2026  -> Full high-risk system obligations")
    print("  2 Aug 2027  -> Annex II high-risk system obligations")
    print("")

    print("=" * 65)
    print("  COMPLIANCE CHECKLIST PREVIEW")
    print("=" * 65)
    print("")
    for item in checklist[:5]:
        priority_emoji = {
            "required": "[R]",
            "recommended": "[O]",
            "informational": "[I]",
        }.get(item["priority"], "[ ]")
        print("  {} [{}] {}".format(priority_emoji, item['id'], item['title']))
        print("      Article: {}".format(item['article']))
        for action in item['actions'][:2]:
            print("      [ ] {}".format(action))
        if len(item['actions']) > 2:
            print("      ... and {} more actions".format(len(item['actions']) - 2))
        print("")
    if len(checklist) > 5:
        print("  ... and {} more items. See full report for details.".format(len(checklist) - 5))
        print("")

    print("=" * 65)
    print("  Analysis complete! Reports saved to current directory.")
    print("=" * 65)
    print("")


# -----------------------------------------------------------------------------
# Section 9: ENTRY POINT
# -----------------------------------------------------------------------------

if __name__ == "__main__":
    try:
        run_cli()
    except KeyboardInterrupt:
        print("")
        print("")
        print("Interrupted. No report was generated.")
    except Exception as e:
        print("")
        print("Error: {}".format(e))
        raise

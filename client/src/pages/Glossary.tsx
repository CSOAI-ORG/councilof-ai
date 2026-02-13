import { useState, useMemo } from "react";
import { Search, Filter, AlertCircle, ExternalLink, BookOpen, Hash, Layers, Link2, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface GlossaryTerm {
  term: string;
  definition: string;
  category: string;
  relatedTerms?: string[];
  resources?: string[];
}

const glossaryTerms: GlossaryTerm[] = [
  // A
  {
    term: "Accountability",
    definition:
      "The principle and practice of being responsible for AI system decisions and their consequences. Accountability mechanisms include clear attribution of responsibility, ability to explain decisions, and consequences for failures or harm.",
    category: "Governance",
    relatedTerms: [
      "Responsibility",
      "Transparency",
      "Explainability",
    ],
  },
  {
    term: "AI Agent",
    definition:
      "An autonomous software entity that perceives its environment, makes decisions, and takes actions to achieve specific goals. AI agents can be simple (rule-based) or complex (machine learning-based).",
    category: "Technical",
    relatedTerms: ["Machine Learning", "Autonomous System", "AI System"],
  },
  {
    term: "AI Audit",
    definition:
      "A systematic, independent examination of an AI system to assess compliance with regulations, standards, and ethical principles. AI audits evaluate performance, bias, safety, security, and documentation.",
    category: "Compliance",
    relatedTerms: [
      "Conformity Assessment",
      "AI Governance",
      "Quality Management",
    ],
  },
  {
    term: "AI Ethics",
    definition:
      "The field of philosophy and practice focused on ensuring AI systems are developed and deployed responsibly, with consideration for fairness, transparency, accountability, and human values.",
    category: "Governance",
    relatedTerms: [
      "Fairness",
      "Transparency",
      "Accountability",
      "Ethics by Design",
    ],
  },
  {
    term: "AI Governance",
    definition:
      "The frameworks, policies, and processes organizations implement to manage AI systems responsibly. Encompasses risk management, compliance, ethics, transparency, and human oversight throughout the AI lifecycle.",
    category: "Governance",
    relatedTerms: [
      "AI Management System",
      "Governance Framework",
      "Risk Assessment",
    ],
  },
  {
    term: "AI Impact Assessment",
    definition:
      "A systematic evaluation of how a proposed or deployed AI system might affect individuals, groups, and society. Examines potential risks including discrimination, privacy violations, and societal impacts.",
    category: "Risk",
    relatedTerms: ["Due Diligence", "Risk Assessment", "Impact Analysis"],
  },
  {
    term: "AI Literacy",
    definition:
      "The ability to understand, critically evaluate, and responsibly interact with AI systems. AI literacy encompasses technical knowledge, ethical awareness, and practical skills for working with AI.",
    category: "Governance",
    relatedTerms: ["Education", "Training", "Awareness"],
  },
  {
    term: "AI Management System",
    definition:
      "A comprehensive set of policies, procedures, and tools for managing AI systems throughout their lifecycle. Includes governance, risk management, quality assurance, monitoring, and compliance activities (ISO 42001 standard).",
    category: "Governance",
    relatedTerms: [
      "ISO 42001",
      "AI Governance",
      "Quality Management",
    ],
  },
  {
    term: "AI Safety",
    definition:
      "The discipline and practice of ensuring AI systems operate reliably, securely, and without causing harm. Encompasses technical safety (robustness, security), operational safety (monitoring, controls), and societal safety (fairness, human oversight).",
    category: "Risk",
    relatedTerms: [
      "Robustness",
      "Security",
      "Human Oversight",
      "Risk Management",
    ],
  },
  {
    term: "AI Trust",
    definition:
      "The confidence that stakeholders place in AI systems based on their understanding of system capabilities, limitations, transparency, and track record. Built through accountability, explainability, and consistent safe performance.",
    category: "Governance",
    relatedTerms: [
      "Trustworthy AI",
      "Transparency",
      "Accountability",
      "AI Safety",
    ],
  },
  {
    term: "Algorithmic Bias",
    definition:
      "Systematic and unfair discrimination that occurs when AI systems produce consistently inaccurate or prejudicial outcomes for particular groups. Can result from biased training data, flawed model design, or misaligned objectives.",
    category: "Risk",
    relatedTerms: [
      "Fairness",
      "Discrimination",
      "Bias Detection",
      "Bias Mitigation",
    ],
  },
  {
    term: "Algorithmic Discrimination",
    definition:
      "The practice of algorithmic systems producing different treatment or outcomes for individuals or groups based on protected characteristics (race, gender, age, etc.). Distinguished from statistical difference by intent and legal standards.",
    category: "Legal",
    relatedTerms: [
      "Algorithmic Bias",
      "Non-Discrimination",
      "Fairness",
      "High-Risk AI System",
    ],
  },
  {
    term: "Algorithmic Transparency",
    definition:
      "The degree to which the logic, data inputs, and decision-making processes of an algorithm are visible and understandable to stakeholders. Key component of trustworthy AI and regulatory compliance.",
    category: "Governance",
    relatedTerms: [
      "Explainability",
      "Transparency",
      "XAI",
      "Model Card",
    ],
  },

  // B
  {
    term: "Byzantine Fault Tolerance",
    definition:
      "A distributed computing concept where a system continues to function correctly even if some nodes (agents) provide incorrect or malicious information. Used in CSOAI's 33-Agent Council for robust decision-making.",
    category: "Technical",
    relatedTerms: ["Consensus", "Distributed Systems", "Robustness"],
  },
  {
    term: "Bias Detection",
    definition:
      "The process of identifying and measuring unfair or discriminatory patterns in AI system outputs. Uses statistical tests, fairness metrics, and data analysis to quantify bias across demographic groups.",
    category: "Technical",
    relatedTerms: [
      "Algorithmic Bias",
      "Fairness",
      "Bias Mitigation",
      "Testing",
    ],
  },
  {
    term: "Bias Mitigation",
    definition:
      "Techniques and strategies to reduce or eliminate unfair discrimination in AI systems. Includes data balancing, algorithmic adjustments, threshold optimization, and fairness constraints during model development.",
    category: "Technical",
    relatedTerms: [
      "Algorithmic Bias",
      "Fairness",
      "Bias Detection",
      "Quality Management",
    ],
  },

  // C
  {
    term: "Certification",
    definition:
      "Formal recognition by CSOAI that an individual, organization, or AI system meets established standards for AI governance, safety, compliance, or performance. CSOAI certifications include CAGP, CASA, CEAAS, and CWA.",
    category: "Compliance",
    relatedTerms: ["Conformity Assessment", "Training", "Standards"],
  },
  {
    term: "Compliance",
    definition:
      "Adherence to applicable laws, regulations, standards, and organizational policies. In AI governance, compliance requires meeting requirements from frameworks like EU AI Act, NIST AI RMF, and ISO 42001.",
    category: "Compliance",
    relatedTerms: [
      "Regulatory",
      "Governance",
      "Standards",
      "Conformity Assessment",
    ],
  },
  {
    term: "Continuous Monitoring",
    definition:
      "Ongoing, real-time assessment of AI system performance, behavior, and compliance. Enables early detection of drift, bias emergence, security threats, and regulatory violations through automated and manual analysis.",
    category: "Technical",
    relatedTerms: [
      "Model Monitoring",
      "Drift Detection",
      "Post-Market Monitoring",
      "Incident Reporting",
    ],
  },
  {
    term: "Conformity Assessment",
    definition:
      "The formal process of determining whether an AI system complies with applicable requirements (regulatory, standard, organizational). Often includes documentation review, testing, audits, and certification by qualified assessors.",
    category: "Compliance",
    relatedTerms: [
      "AI Audit",
      "Compliance",
      "Certification",
      "Quality Management",
    ],
  },
  {
    term: "Council of Safety",
    definition:
      "CSOAI's governance body and the conceptual foundation of the Council of Safety for AI. Represents the collective expertise and consensus-driven approach to AI governance across 33 specialized agent perspectives.",
    category: "Governance",
    relatedTerms: ["CSOAI", "Governance", "33-Agent Council"],
  },

  // D
  {
    term: "Data Governance",
    definition:
      "The frameworks and processes for managing data quality, access, privacy, and use throughout an organization. Critical for AI governance as data quality directly impacts AI system safety, fairness, and compliance.",
    category: "Governance",
    relatedTerms: [
      "Data Protection",
      "Privacy",
      "GDPR",
      "AI Governance",
    ],
  },
  {
    term: "Data Protection",
    definition:
      "Measures and practices to safeguard personal and sensitive data from unauthorized access, misuse, breaches, and other threats. Regulated by GDPR, CCPA, and similar privacy laws.",
    category: "Legal",
    relatedTerms: ["Privacy", "GDPR", "Data Governance", "Security"],
  },
  {
    term: "Deep Learning",
    definition:
      "A subset of machine learning using neural networks with multiple layers to learn hierarchical representations of data. Powers large language models, computer vision systems, and other advanced AI applications.",
    category: "Technical",
    relatedTerms: [
      "Machine Learning",
      "Neural Network",
      "Foundation Model",
      "Large Language Model",
    ],
  },
  {
    term: "Deployment",
    definition:
      "The process of moving an AI model from development and testing into production where it serves real users or makes actual decisions. Requires thorough validation, monitoring setup, and ongoing governance.",
    category: "Technical",
    relatedTerms: [
      "Model Governance",
      "Validation",
      "Continuous Monitoring",
      "Post-Market Monitoring",
    ],
  },
  {
    term: "Digital Safety Review Board",
    definition:
      "CSOAI's expert body of AI safety professionals, ethicists, and regulators who review complex AI incidents, provide governance guidance, and establish best practices. Organizations can request DSRB reviews for critical systems.",
    category: "Governance",
    relatedTerms: ["CSOAI", "AI Audit", "Governance", "Incident Reporting"],
  },
  {
    term: "Drift Detection",
    definition:
      "The continuous monitoring process to identify when AI model performance, behavior, or predictions change over time (model drift), data characteristics change (data drift), or environmental conditions change (concept drift).",
    category: "Technical",
    relatedTerms: [
      "Model Monitoring",
      "Continuous Monitoring",
      "Performance Degradation",
    ],
  },
  {
    term: "Due Diligence",
    definition:
      "The comprehensive investigation and assessment of an AI system's risks, compliance status, performance characteristics, and governance practices. Required before deploying high-risk systems and merging organizations.",
    category: "Compliance",
    relatedTerms: [
      "Risk Assessment",
      "AI Impact Assessment",
      "Compliance",
      "AI Audit",
    ],
  },

  // E
  {
    term: "EU AI Act",
    definition:
      "European Union regulation establishing comprehensive rules for AI systems based on risk levels. Defines prohibited practices, high-risk requirements, transparency rules, and conformity assessments. Enforcement timeline extends through 2026.",
    category: "Legal",
    relatedTerms: [
      "Compliance",
      "Regulation",
      "High-Risk AI System",
      "Prohibited AI Practices",
    ],
  },
  {
    term: "Explainability",
    definition:
      "The quality of being understandable and interpretable. In AI context, explainability refers to the ability to provide clear, human-understandable explanations for why an AI system made specific decisions or recommendations.",
    category: "Governance",
    relatedTerms: ["XAI", "Transparency", "Model Card", "Interpretability"],
  },
  {
    term: "Ethics by Design",
    definition:
      "The practice of incorporating ethical considerations and safeguards into AI systems from the initial design phase rather than attempting to add them later. Proactive approach to building trustworthy AI.",
    category: "Governance",
    relatedTerms: [
      "AI Ethics",
      "Privacy by Design",
      "Responsible AI",
      "AI Safety",
    ],
  },

  // F
  {
    term: "Fairness",
    definition:
      "The principle and practice of ensuring AI systems treat all individuals and groups equitably without discrimination. Fairness metrics quantify whether outcomes are proportional across demographic groups.",
    category: "Governance",
    relatedTerms: [
      "Non-Discrimination",
      "Algorithmic Bias",
      "Equity",
      "AI Ethics",
    ],
  },
  {
    term: "FEAT Principles",
    definition:
      "Framework of principles for trustworthy AI: Fairness (equitable treatment), Explainability (understandable decisions), Accountability (clear responsibility), Transparency (open communication). Guides responsible AI development.",
    category: "Governance",
    relatedTerms: [
      "AI Ethics",
      "Trustworthy AI",
      "Governance",
      "Accountability",
    ],
  },
  {
    term: "Foundation Model",
    definition:
      "A large-scale AI model trained on diverse, broad data to serve as a base for multiple downstream applications. Examples include GPT models, BERT, and Llama. Foundation models demonstrate general AI capabilities across many tasks.",
    category: "Technical",
    relatedTerms: [
      "Large Language Model",
      "Deep Learning",
      "General Purpose AI",
      "Pre-training",
    ],
  },
  {
    term: "Framework",
    definition:
      "A structured set of guidelines, standards, and practices for implementing AI governance. Examples include NIST AI RMF, EU AI Act, and CSOAI's SOAI-PDCA framework. Frameworks provide methodologies and best practices.",
    category: "Governance",
    relatedTerms: [
      "Standards",
      "Governance",
      "AI Management System",
      "Compliance",
    ],
  },

  // G
  {
    term: "GDPR",
    definition:
      "General Data Protection Regulation - EU law governing personal data protection and privacy. Requires lawful basis for processing, transparency, data subject rights, and impact assessments. Critical for AI systems processing personal data.",
    category: "Legal",
    relatedTerms: ["Data Protection", "Privacy", "Compliance", "CCPA"],
  },
  {
    term: "General Purpose AI (GPAI)",
    definition:
      "AI systems with broad capabilities applicable across many different domains and use cases rather than specialized for single tasks. Foundation models and large language models are primary examples. Subject to specific EU AI Act requirements.",
    category: "Technical",
    relatedTerms: [
      "Foundation Model",
      "Large Language Model",
      "AI System",
      "EU AI Act",
    ],
  },
  {
    term: "Governance Framework",
    definition:
      "A comprehensive structure defining how an organization manages AI systems responsibly. Includes policies, procedures, accountability mechanisms, risk management, compliance monitoring, and human oversight structures.",
    category: "Governance",
    relatedTerms: [
      "AI Governance",
      "Framework",
      "Policy",
      "Risk Management",
    ],
  },

  // H
  {
    term: "High-Risk AI System",
    definition:
      "AI systems that pose significant risks to fundamental rights, safety, or public interest. Under EU AI Act, high-risk systems (e.g., in law enforcement, employment, credit assessment) require conformity assessments, documentation, human oversight, and post-market monitoring.",
    category: "Legal",
    relatedTerms: [
      "Risk Classification",
      "EU AI Act",
      "Risk Assessment",
      "Conformity Assessment",
    ],
  },
  {
    term: "Human Oversight",
    definition:
      "The practice of maintaining human involvement in critical AI decisions and monitoring AI system behavior. Required for high-risk systems to ensure humans can understand, intervene in, or override AI decisions.",
    category: "Governance",
    relatedTerms: [
      "Human-in-the-Loop",
      "Explainability",
      "Accountability",
      "AI Safety",
    ],
  },
  {
    term: "Human-in-the-Loop",
    definition:
      "AI system design where humans remain actively involved in decision-making processes. Humans provide feedback, validate decisions, and intervene when necessary. Improves safety, fairness, and user acceptance of AI systems.",
    category: "Governance",
    relatedTerms: [
      "Human Oversight",
      "Explainability",
      "Accountability",
      "AI Safety",
    ],
  },

  // I
  {
    term: "Impact Assessment",
    definition:
      "A systematic evaluation of potential consequences from deploying an AI system. Examines effects on individuals, groups, society, and environment across dimensions like fairness, privacy, employment, and fundamental rights.",
    category: "Risk",
    relatedTerms: [
      "AI Impact Assessment",
      "Due Diligence",
      "Risk Assessment",
      "GDPR",
    ],
  },
  {
    term: "ISO 42001",
    definition:
      "International standard for AI management systems. Provides requirements for establishing, implementing, maintaining, and continuously improving AI governance. Includes risk management, quality assurance, monitoring, and documentation requirements.",
    category: "Compliance",
    relatedTerms: [
      "Standards",
      "Certification",
      "AI Management System",
      "Governance",
    ],
  },
  {
    term: "Incident Reporting",
    definition:
      "The process of documenting, analyzing, and reporting problematic events involving AI systems (bias incidents, failures, security breaches, unintended consequences). Critical for continuous improvement and regulatory compliance.",
    category: "Compliance",
    relatedTerms: [
      "Continuous Monitoring",
      "Post-Market Monitoring",
      "Risk Management",
      "Watchdog",
    ],
  },

  // J
  {
    term: "Jailbreaking",
    definition:
      "Techniques used to circumvent safety measures and content filters in AI systems, often large language models. Users attempt to manipulate AI to generate harmful, inappropriate, or prohibited content.",
    category: "Risk",
    relatedTerms: ["Security", "AI Safety", "Robustness", "Testing"],
  },

  // K
  {
    term: "KPI (Key Performance Indicator)",
    definition:
      "Measurable value demonstrating effectiveness of AI systems and governance processes. AI governance KPIs include fairness metrics, model accuracy, compliance status, incident response time, and stakeholder satisfaction.",
    category: "Governance",
    relatedTerms: ["Metrics", "Monitoring", "Performance", "Compliance"],
  },

  // L
  {
    term: "Large Language Model (LLM)",
    definition:
      "AI models trained on vast amounts of text data to predict and generate human language. Examples include GPT models and Claude. LLMs are foundation models with broad capabilities across language understanding and generation tasks.",
    category: "Technical",
    relatedTerms: [
      "Foundation Model",
      "Deep Learning",
      "General Purpose AI",
      "Machine Learning",
    ],
  },
  {
    term: "Liability",
    definition:
      "Legal responsibility for harm or losses caused by AI systems. Liability regimes vary by jurisdiction and risk level; high-risk systems typically have stricter liability requirements. Enterprises need liability insurance and governance practices.",
    category: "Legal",
    relatedTerms: [
      "Legal Risk",
      "Compliance",
      "Accountability",
      "High-Risk AI System",
    ],
  },

  // M
  {
    term: "Machine Learning",
    definition:
      "Subset of AI where systems learn patterns from data and improve performance without being explicitly programmed. Includes supervised learning, unsupervised learning, and reinforcement learning approaches.",
    category: "Technical",
    relatedTerms: [
      "Deep Learning",
      "Neural Network",
      "AI System",
      "Model Training",
    ],
  },
  {
    term: "Model Card",
    definition:
      "Standardized documentation describing an AI model's performance, intended use, characteristics, and limitations. Includes training data, fairness metrics, performance across demographic groups, recommended use cases, and known limitations.",
    category: "Governance",
    relatedTerms: [
      "Documentation",
      "Transparency",
      "Model Governance",
      "Explainability",
    ],
  },
  {
    term: "Model Governance",
    definition:
      "Processes and structures for managing AI models throughout their lifecycle: development, validation, deployment, monitoring, updates, and retirement. Ensures consistent quality, safety, and compliance across all models.",
    category: "Governance",
    relatedTerms: [
      "AI Management System",
      "Quality Management",
      "Model Monitoring",
      "Governance",
    ],
  },
  {
    term: "Model Monitoring",
    definition:
      "Continuous observation and analysis of deployed AI model performance, behavior, and health. Tracks metrics for accuracy, bias, latency, security, and identifies drift or anomalies requiring intervention.",
    category: "Technical",
    relatedTerms: [
      "Continuous Monitoring",
      "Drift Detection",
      "Performance Metrics",
      "Model Governance",
    ],
  },
  {
    term: "Maternal Covenant",
    definition:
      "CSOAI's founding pledge to prioritize human well-being and create opportunities for displaced workers. Ensures AI safety efforts directly translate into meaningful employment, training, and economic support.",
    category: "Governance",
    relatedTerms: ["CSOAI", "Values", "Watchdog Program"],
  },

  // N
  {
    term: "NIST AI RMF",
    definition:
      "National Institute of Standards and Technology AI Risk Management Framework. Voluntary, flexible framework for identifying, measuring, and managing AI risks. Provides guidance across design, development, deployment, and monitoring phases.",
    category: "Compliance",
    relatedTerms: [
      "Framework",
      "Risk Management",
      "Standards",
      "Governance",
    ],
  },
  {
    term: "Non-Discrimination",
    definition:
      "Legal and ethical principle ensuring AI systems do not unfairly distinguish between individuals or groups based on protected characteristics. Enforced through fairness requirements and bias testing.",
    category: "Legal",
    relatedTerms: [
      "Fairness",
      "Algorithmic Discrimination",
      "Algorithmic Bias",
      "Compliance",
    ],
  },

  // O
  {
    term: "OECD AI Principles",
    definition:
      "Organization for Economic Cooperation and Development principles for responsible stewardship of trustworthy AI: human-centered values, transparency, robustness, accountability, and human oversight.",
    category: "Governance",
    relatedTerms: [
      "Framework",
      "AI Ethics",
      "Governance",
      "Standards",
    ],
  },
  {
    term: "Operational Risk",
    definition:
      "Risks arising from deficiencies in AI system operations, monitoring, maintenance, or response procedures. Includes model failures, drift, security incidents, and inadequate incident response.",
    category: "Risk",
    relatedTerms: [
      "Risk Management",
      "Risk Classification",
      "Continuous Monitoring",
      "Post-Market Monitoring",
    ],
  },

  // P
  {
    term: "PDCA Cycle",
    definition:
      "Plan-Do-Check-Act continuous improvement methodology. Plan governance approach, Do implementation, Check results and compliance, Act on findings to improve. CSOAI's SOAI-PDCA framework applies PDCA to AI governance.",
    category: "Governance",
    relatedTerms: ["Framework", "Continuous Improvement", "SOAI-PDCA"],
  },
  {
    term: "Post-Market Monitoring",
    definition:
      "Ongoing surveillance and evaluation of AI systems after deployment to detect performance issues, safety failures, bias emergence, security threats, and compliance violations. Required for high-risk systems under EU AI Act.",
    category: "Compliance",
    relatedTerms: [
      "Continuous Monitoring",
      "Drift Detection",
      "Incident Reporting",
      "Model Governance",
    ],
  },
  {
    term: "Privacy by Design",
    definition:
      "Approach of integrating data privacy and protection measures from the initial design phase of AI systems rather than adding them later. Minimizes data collection, implements anonymization, and respects user rights.",
    category: "Governance",
    relatedTerms: [
      "Ethics by Design",
      "Data Protection",
      "GDPR",
      "AI Safety",
    ],
  },
  {
    term: "Prohibited AI Practices",
    definition:
      "AI applications and techniques explicitly forbidden under regulations like EU AI Act. Examples include real-time facial recognition for mass surveillance, social scoring systems, and manipulation causing psychological harm.",
    category: "Legal",
    relatedTerms: [
      "EU AI Act",
      "Compliance",
      "High-Risk AI System",
      "Regulation",
    ],
  },
  {
    term: "Prosperity Fund",
    definition:
      "CSOAI's economic support program for displaced workers. Provides training, income support, and employment opportunities in AI safety careers, operationalizing the Maternal Covenant commitment.",
    category: "Governance",
    relatedTerms: ["Maternal Covenant", "Watchdog Program", "CSOAI"],
  },

  // Q
  {
    term: "Quality Management",
    definition:
      "Systematic approach to ensuring AI systems and processes meet consistent standards throughout their lifecycle. Includes quality assurance, testing, validation, monitoring, and continuous improvement practices.",
    category: "Governance",
    relatedTerms: [
      "Model Governance",
      "Compliance",
      "Standards",
      "Certification",
    ],
  },

  // R
  {
    term: "Red Teaming",
    definition:
      "Adversarial testing practice where teams attempt to break, exploit, or manipulate AI systems to identify vulnerabilities, failure modes, and security issues before deployment.",
    category: "Technical",
    relatedTerms: ["Testing", "Security", "AI Safety", "Robustness"],
  },
  {
    term: "Regulatory Sandbox",
    definition:
      "Controlled environment where organizations can test innovative AI applications with relaxed regulatory requirements while maintaining safety oversight. Enables experimentation while protecting users.",
    category: "Compliance",
    relatedTerms: ["Testing", "Deployment", "Innovation", "Compliance"],
  },
  {
    term: "Risk Assessment",
    definition:
      "Systematic process of identifying, analyzing, and evaluating potential risks from an AI system. Determines risk level (low, medium, high) and informs appropriate governance, monitoring, and compliance requirements.",
    category: "Risk",
    relatedTerms: [
      "Risk Classification",
      "Due Diligence",
      "Impact Assessment",
      "Compliance",
    ],
  },
  {
    term: "Risk Classification",
    definition:
      "Categorization of AI systems by their potential impact and risk level. EU AI Act defines prohibited, high-risk, limited-risk, and minimal-risk categories. NIST and ISO 42001 provide additional classification schemes.",
    category: "Risk",
    relatedTerms: [
      "Risk Assessment",
      "High-Risk AI System",
      "Governance",
      "Compliance",
    ],
  },
  {
    term: "Robustness",
    definition:
      "The ability of AI systems to maintain safe and reliable performance under adverse conditions, unexpected inputs, or distribution shifts. Robust systems handle edge cases gracefully and resist adversarial attacks.",
    category: "Technical",
    relatedTerms: [
      "AI Safety",
      "Testing",
      "Red Teaming",
      "Drift Detection",
    ],
  },

  // S
  {
    term: "Safety",
    definition:
      "Condition of AI systems operating without causing harm. Encompasses technical safety (system reliability), operational safety (monitoring and controls), and societal safety (fairness, human oversight, accountability).",
    category: "Risk",
    relatedTerms: [
      "AI Safety",
      "Risk Management",
      "Robustness",
      "Human Oversight",
    ],
  },
  {
    term: "Sandboxing",
    definition:
      "Isolated environment where AI systems or code are tested safely without affecting production systems or accessing sensitive data. Used for testing, development, and security evaluation.",
    category: "Technical",
    relatedTerms: [
      "Testing",
      "Security",
      "Regulatory Sandbox",
      "Quality Management",
    ],
  },
  {
    term: "SOAI-PDCA",
    definition:
      "CSOAI's proprietary AI governance methodology combining Safety-Oriented AI (SOAI) principles with Plan-Do-Check-Act (PDCA) continuous improvement cycles. Provides structured approach to implement responsible AI governance.",
    category: "Governance",
    relatedTerms: [
      "Framework",
      "AI Governance",
      "PDCA Cycle",
      "CSOAI",
    ],
  },
  {
    term: "Stakeholder",
    definition:
      "Any individual or group affected by or having interest in an AI system. Includes users, organizations, regulators, society, and potentially impacted communities. Stakeholder engagement is essential for responsible AI governance.",
    category: "Governance",
    relatedTerms: [
      "Accountability",
      "Governance",
      "Impact Assessment",
      "Transparency",
    ],
  },
  {
    term: "Standards",
    definition:
      "Established specifications, guidelines, and requirements that AI systems should meet. Examples include ISO 42001, NIST AI RMF, OECD Principles. Standards promote consistency, quality, and best practices.",
    category: "Compliance",
    relatedTerms: [
      "Framework",
      "Certification",
      "Compliance",
      "Governance",
    ],
  },
  {
    term: "Sustainability",
    definition:
      "Long-term viability and positive impact of AI systems. Addresses environmental impact (energy efficiency), social sustainability (equitable access), economic sustainability (job creation), and operational sustainability (maintainability).",
    category: "Governance",
    relatedTerms: [
      "AI Ethics",
      "Environmental Impact",
      "Governance",
      "Responsible AI",
    ],
  },

  // T
  {
    term: "TC260",
    definition:
      "China's standardization technical committee developing AI security and governance standards. Provides guidelines for algorithm transparency, data protection, and security assessments for high-impact AI systems.",
    category: "Legal",
    relatedTerms: [
      "Framework",
      "Standards",
      "Compliance",
      "Regional Regulations",
    ],
  },
  {
    term: "Technical Documentation",
    definition:
      "Comprehensive records describing AI system architecture, training data, performance metrics, limitations, and use cases. Required for regulatory compliance, system understanding, and knowledge transfer.",
    category: "Governance",
    relatedTerms: [
      "Model Card",
      "Transparency",
      "Compliance",
      "Governance",
    ],
  },
  {
    term: "Transparency",
    definition:
      "The practice of making AI systems, their decisions, and their impacts visible and understandable to stakeholders. Includes explainability, documentation, and communication about system capabilities and limitations.",
    category: "Governance",
    relatedTerms: [
      "Explainability",
      "Accountability",
      "Technical Documentation",
      "Model Card",
    ],
  },
  {
    term: "Trustworthy AI",
    definition:
      "AI systems that are reliable, fair, transparent, accountable, and aligned with human values and societal norms. Built through ethics by design, robust governance, and continuous monitoring.",
    category: "Governance",
    relatedTerms: [
      "AI Ethics",
      "AI Safety",
      "Governance",
      "FEAT Principles",
    ],
  },

  // U
  {
    term: "Unacceptable Risk",
    definition:
      "Under EU AI Act, AI practices posing unacceptable risks to human safety or rights are prohibited outright. Examples include social scoring, real-time facial recognition, and manipulation causing psychological harm.",
    category: "Legal",
    relatedTerms: [
      "Prohibited AI Practices",
      "EU AI Act",
      "High-Risk AI System",
      "Compliance",
    ],
  },

  // V
  {
    term: "Validation",
    definition:
      "Process of confirming that an AI system meets specified requirements and performs as intended before deployment. Includes functional testing, performance validation, bias testing, and safety verification.",
    category: "Technical",
    relatedTerms: [
      "Testing",
      "Quality Management",
      "Deployment",
      "Model Governance",
    ],
  },
  {
    term: "Vendor Risk",
    definition:
      "Risks arising from using external AI systems, models, or services from third-party vendors. Includes security risks, performance risks, compliance risks, and dependency risks.",
    category: "Risk",
    relatedTerms: [
      "Risk Assessment",
      "Risk Management",
      "Security",
      "Compliance",
    ],
  },

  // W
  {
    term: "Watchdog",
    definition:
      "CSOAI's trained AI safety analysts who monitor, audit, and report on AI systems. Part of global community creating meaningful employment while protecting humanity from AI risks.",
    category: "Governance",
    relatedTerms: [
      "Watchdog Program",
      "CSOAI",
      "Incident Reporting",
      "AI Audit",
    ],
  },
  {
    term: "Watermarking",
    definition:
      "Technique of embedding imperceptible markers or patterns in AI-generated content to indicate its provenance and authenticity. Helps combat misinformation and deepfakes.",
    category: "Technical",
    relatedTerms: [
      "Security",
      "AI Safety",
      "Content Detection",
      "Transparency",
    ],
  },

  // X
  {
    term: "XAI (Explainable AI)",
    definition:
      "Field and set of techniques focused on making AI system decisions transparent and understandable to humans. Includes LIME, SHAP, attention mechanisms, and other interpretability methods.",
    category: "Technical",
    relatedTerms: [
      "Explainability",
      "Transparency",
      "Model Interpretability",
      "AI Governance",
    ],
  },

  // Z
  {
    term: "Zero Trust",
    definition:
      "Security principle of never assuming trust and continuously verifying all access and interactions. Applied to AI governance by continuously monitoring system behavior, data access, and integrity.",
    category: "Technical",
    relatedTerms: [
      "Security",
      "Continuous Monitoring",
      "Risk Management",
      "AI Safety",
    ],
  },
];

type CategoryType =
  | "Governance"
  | "Technical"
  | "Legal"
  | "Compliance"
  | "Risk";

const categories: CategoryType[] = [
  "Governance",
  "Technical",
  "Legal",
  "Compliance",
  "Risk",
];

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export default function Glossary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<
    Set<CategoryType>
  >(new Set(categories));

  const filteredTerms = useMemo(() => {
    return glossaryTerms.filter((item) => {
      const matchesSearch =
        item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.definition.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategories.has(
        item.category as CategoryType
      );

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategories]);

  const groupedByLetter = useMemo(() => {
    const grouped: { [key: string]: GlossaryTerm[] } = {};
    filteredTerms.forEach((term) => {
      const letter = term.term.charAt(0).toUpperCase();
      if (!grouped[letter]) {
        grouped[letter] = [];
      }
      grouped[letter].push(term);
    });
    return grouped;
  }, [filteredTerms]);

  const toggleCategory = (category: CategoryType) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
  };

  const getCategoryColor = (category: CategoryType) => {
    const colors: Record<CategoryType, string> = {
      Governance: "bg-blue-100 text-blue-800 border-blue-300",
      Technical: "bg-purple-100 text-purple-800 border-purple-300",
      Legal: "bg-red-100 text-red-800 border-red-300",
      Compliance: "bg-emerald-100 text-emerald-800 border-emerald-300",
      Risk: "bg-orange-100 text-orange-800 border-orange-300",
    };
    return colors[category];
  };

  const getCategoryGradient = (category: CategoryType) => {
    const gradients: Record<CategoryType, string> = {
      Governance: "from-blue-500 to-blue-600",
      Technical: "from-purple-500 to-purple-600",
      Legal: "from-red-500 to-red-600",
      Compliance: "from-emerald-500 to-emerald-600",
      Risk: "from-orange-500 to-orange-600",
    };
    return gradients[category];
  };

  const getStatIcon = (index: number) => {
    const icons = [Layers, Hash, ArrowUpRight, Link2];
    const Icon = icons[index % icons.length];
    return <Icon className="h-5 w-5" />;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 text-white py-20">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              AI Governance Glossary
            </h1>
            <p className="text-xl text-gray-300">
              Comprehensive definitions of 60+ AI governance, technical, legal, and compliance terms.
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search terms by name or definition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-4 bg-white text-gray-900 placeholder-gray-500 rounded-xl shadow-lg focus:ring-2 focus:ring-emerald-400 border-0"
            />
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-gradient-to-r from-slate-50 to-emerald-50 border-b border-emerald-200">
        <div className="container max-w-5xl py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Total Terms</p>
                <p className="text-lg font-bold text-gray-900">60+</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Hash className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Categories</p>
                <p className="text-lg font-bold text-gray-900">5</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <Layers className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">A-Z Navigation</p>
                <p className="text-lg font-bold text-gray-900">26</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Link2 className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600">Cross-Referenced</p>
                <p className="text-lg font-bold text-gray-900">Yes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container max-w-5xl py-16">
        {/* Category Filters */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-5 w-5 text-gray-700" />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Filter by Category
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => toggleCategory(category)}
                className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-200 ${
                  selectedCategories.has(category)
                    ? `bg-gradient-to-r ${getCategoryGradient(category)} text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Alphabet Navigation - Sticky */}
        {filteredTerms.length > 0 && (
          <div className="sticky top-0 z-10 mb-12 p-6 bg-white rounded-xl border border-gray-200 shadow-md">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Quick Navigation
            </h3>
            <div className="flex flex-wrap gap-2">
              {alphabet.map((letter) => (
                <button
                  key={letter}
                  onClick={() => {
                    const element = document.getElementById(`letter-${letter}`);
                    element?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`w-10 h-10 rounded-lg text-sm font-bold transition-all duration-200 ${
                    groupedByLetter[letter]
                      ? "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white hover:from-emerald-500 hover:to-emerald-700 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Terms List */}
        {filteredTerms.length > 0 ? (
          <div className="space-y-12">
            {Object.entries(groupedByLetter)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([letter, terms]) => (
                <div key={letter}>
                  <div id={`letter-${letter}`} className="scroll-mt-32">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="h-12 w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
                      <h2 className="text-4xl font-bold text-gray-900">
                        {letter}
                      </h2>
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-emerald-200 to-transparent" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {terms.map((term, index) => (
                      <Card
                        key={`${letter}-${index}`}
                        className="p-7 border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                      >
                        <div className="mb-4">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <h3 className="text-xl font-bold text-gray-900 flex-1">
                              {term.term}
                            </h3>
                            <Badge className={`${getCategoryColor(term.category as CategoryType)} flex-shrink-0`}>
                              {term.category}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-gray-700 leading-relaxed mb-5">
                          {term.definition}
                        </p>

                        {term.relatedTerms && term.relatedTerms.length > 0 && (
                          <div className="mt-5 pt-5 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                              Related Terms
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {term.relatedTerms.map((relatedTerm) => (
                                <Badge
                                  key={relatedTerm}
                                  variant="outline"
                                  className="text-xs cursor-pointer transition-all duration-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
                                >
                                  {relatedTerm}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-2 border-dashed border-gray-300 rounded-xl">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No terms found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or selecting different categories.
            </p>
            <Button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategories(new Set(categories));
              }}
              variant="outline"
            >
              Reset Filters
            </Button>
          </Card>
        )}

        {/* Results Count */}
        <div className="mt-12 text-center text-sm text-gray-600 font-medium">
          Showing {filteredTerms.length} of {glossaryTerms.length} terms
        </div>

        {/* Additional Resources */}
        <div className="mt-20 bg-gradient-to-br from-blue-50 via-purple-50 to-emerald-50 rounded-xl p-12 border border-emerald-200">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Need More Information?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <Card className="p-8 border-none shadow-md hover:shadow-xl rounded-xl transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex-shrink-0">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Free Training Courses
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Learn AI governance through CSOAI's comprehensive free courses covering all major frameworks.
              </p>
              <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-700">
                Browse Courses
              </Button>
            </Card>

            <Card className="p-8 border-none shadow-md hover:shadow-xl rounded-xl transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg flex-shrink-0">
                  <Layers className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Get Certified
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Earn internationally recognized certifications in AI governance, safety, and compliance.
              </p>
              <Button variant="outline" size="sm" className="hover:bg-purple-50 hover:text-purple-700">
                View Certifications
              </Button>
            </Card>

            <Card className="p-8 border-none shadow-md hover:shadow-xl rounded-xl transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-lg flex-shrink-0">
                  <Hash className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  FAQ Page
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Find answers to common questions about CSOAI, governance, and compliance.
              </p>
              <Button variant="outline" size="sm" className="hover:bg-emerald-50 hover:text-emerald-700">
                View FAQs
              </Button>
            </Card>

            <Card className="p-8 border-none shadow-md hover:shadow-xl rounded-xl transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex-shrink-0">
                  <ArrowUpRight className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Contact Support
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Get help from CSOAI experts and the community. Always free, always responsive.
              </p>
              <Button variant="outline" size="sm" className="hover:bg-orange-50 hover:text-orange-700">
                Contact Us
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

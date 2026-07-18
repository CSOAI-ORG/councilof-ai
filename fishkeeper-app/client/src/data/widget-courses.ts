/**
 * Static course data for the widget system
 * Contains all 7 courses with their module data for direct consumption by the widget
 */

export interface WidgetModule {
  title: string;
  description: string;
  content: string;  // markdown content
  durationMinutes: number;
}

export interface WidgetCourse {
  id: number;
  name: string;
  framework: string;
  level: string;
  description: string;
  duration: string;
  moduleCount: number;
  region: string;
  modules: WidgetModule[];
}

export const widgetCourses: WidgetCourse[] = [
  {
    id: 100001,
    name: "EU AI Act Fundamentals",
    framework: "EU AI Act",
    level: "fundamentals",
    description: "Comprehensive training on the European Union's Artificial Intelligence Act",
    duration: "10h",
    moduleCount: 7,
    region: "EU",
    modules: [
      {
        title: "Introduction to EU AI Act",
        description: "Module 1 of EU AI Act Fundamentals",
        content: `# Introduction to EU AI Act

**Module Code:** 100001-M01
**Duration:** 60 minutes
**Description:** Module 1 of EU AI Act Fundamentals

---

This module introduces the European Union's Artificial Intelligence Act, providing a comprehensive overview of its scope, objectives, and key provisions. You'll learn about the regulatory framework designed to ensure AI systems are safe, transparent, and respect fundamental rights.`,
        durationMinutes: 60,
      },
      {
        title: "Risk Classification System",
        description: "Module 2 of EU AI Act Fundamentals",
        content: `# Risk Classification System

**Module Code:** 100001-M02
**Duration:** 90 minutes
**Description:** Module 2 of EU AI Act Fundamentals

---

Learn about the EU AI Act's risk-based classification system that categorizes AI systems into four levels: unacceptable risk, high risk, limited risk, and minimal risk. Understand how different AI applications are classified and what requirements apply to each category.`,
        durationMinutes: 90,
      },
      {
        title: "High-Risk AI Requirements",
        description: "Module 3 of EU AI Act Fundamentals",
        content: `# High-Risk AI Requirements

**Module Code:** 100001-M03
**Duration:** 120 minutes
**Description:** Module 3 of EU AI Act Fundamentals

---

This module covers the detailed requirements for high-risk AI systems, including conformity assessments, technical documentation, quality management systems, and post-market monitoring obligations.`,
        durationMinutes: 120,
      },
      {
        title: "Prohibited AI Practices",
        description: "Module 4 of EU AI Act Fundamentals",
        content: `# Prohibited AI Practices

**Module Code:** 100001-M04
**Duration:** 60 minutes
**Description:** Module 4 of EU AI Act Fundamentals

---

Explore the AI practices that are completely prohibited under the EU AI Act, including social scoring systems, real-time biometric identification in public spaces, and manipulative AI techniques.`,
        durationMinutes: 60,
      },
      {
        title: "EU AI Act Enforcement",
        description: "Module 5 of EU AI Act Fundamentals",
        content: `# EU AI Act Enforcement

**Module Code:** 100001-M05
**Duration:** 90 minutes
**Description:** Module 5 of EU AI Act Fundamentals

---

Understand the enforcement mechanisms of the EU AI Act, including the role of national competent authorities, market surveillance, and the penalties for non-compliance.`,
        durationMinutes: 90,
      },
      {
        title: "Implementing EU AI Act Compliance",
        description: "Module 6 of EU AI Act Fundamentals",
        content: `# Implementing EU AI Act Compliance

**Module Code:** 100001-M06
**Duration:** 90 minutes
**Description:** Module 6 of EU AI Act Fundamentals

---

Learn practical strategies for implementing EU AI Act compliance within your organization, including gap analysis, documentation requirements, and building a compliance roadmap.`,
        durationMinutes: 90,
      },
      {
        title: "Certification Exam Preparation",
        description: "Module 7 of EU AI Act Fundamentals",
        content: `# Certification Exam Preparation

**Module Code:** 100001-M07
**Duration:** 60 minutes
**Description:** Module 7 of EU AI Act Fundamentals

---

Prepare for the certification exam with comprehensive review materials, practice questions, and key concepts summary covering all aspects of the EU AI Act.`,
        durationMinutes: 60,
      },
    ],
  },
  {
    id: 100002,
    name: "NIST AI RMF Fundamentals",
    framework: "NIST AI RMF",
    level: "fundamentals",
    description: "Comprehensive training on the NIST AI Risk Management Framework",
    duration: "10h",
    moduleCount: 7,
    region: "US",
    modules: [
      {
        title: "NIST AI RMF Overview",
        description: "Module 1 of NIST AI RMF Fundamentals",
        content: `# NIST AI RMF Overview

**Module Code:** 100002-M01
**Duration:** 60 minutes
**Description:** Module 1 of NIST AI RMF Fundamentals

---

This module provides a comprehensive introduction to the NIST AI Risk Management Framework, its development history, core principles, and how it integrates with existing risk management practices in organizations.`,
        durationMinutes: 60,
      },
      {
        title: "GOVERN Function",
        description: "Module 2 of NIST AI RMF Fundamentals",
        content: `# GOVERN Function

**Module Code:** 100002-M02
**Duration:** 90 minutes
**Description:** Module 2 of NIST AI RMF Fundamentals

---

Learn about the GOVERN function which establishes the organizational context for AI risk management, including governance structures, policies, and accountability mechanisms.`,
        durationMinutes: 90,
      },
      {
        title: "MAP Function",
        description: "Module 3 of NIST AI RMF Fundamentals",
        content: `# MAP Function

**Module Code:** 100002-M03
**Duration:** 90 minutes
**Description:** Module 3 of NIST AI RMF Fundamentals

---

Explore the MAP function that helps organizations identify and categorize AI risks, understand the AI system context, and map potential impacts across stakeholders.`,
        durationMinutes: 90,
      },
      {
        title: "MEASURE Function",
        description: "Module 4 of NIST AI RMF Fundamentals",
        content: `# MEASURE Function

**Module Code:** 100002-M04
**Duration:** 90 minutes
**Description:** Module 4 of NIST AI RMF Fundamentals

---

Understand the MEASURE function which provides methodologies for assessing and analyzing AI risks, including metrics, testing approaches, and evaluation criteria.`,
        durationMinutes: 90,
      },
      {
        title: "MANAGE Function",
        description: "Module 5 of NIST AI RMF Fundamentals",
        content: `# MANAGE Function

**Module Code:** 100002-M05
**Duration:** 90 minutes
**Description:** Module 5 of NIST AI RMF Fundamentals

---

Learn about the MANAGE function that covers risk response strategies, mitigation measures, and continuous monitoring of AI systems throughout their lifecycle.`,
        durationMinutes: 90,
      },
      {
        title: "NIST AI RMF Implementation",
        description: "Module 6 of NIST AI RMF Fundamentals",
        content: `# NIST AI RMF Implementation

**Module Code:** 100002-M06
**Duration:** 90 minutes
**Description:** Module 6 of NIST AI RMF Fundamentals

---

This module covers practical implementation guidance, best practices, and real-world case studies for applying the NIST AI RMF in various organizational contexts.`,
        durationMinutes: 90,
      },
      {
        title: "Certification Exam Preparation",
        description: "Module 7 of NIST AI RMF Fundamentals",
        content: `# Certification Exam Preparation

**Module Code:** 100002-M07
**Duration:** 60 minutes
**Description:** Module 7 of NIST AI RMF Fundamentals

---

Prepare for the certification exam with comprehensive review materials, practice questions, and key concepts summary covering all aspects of the NIST AI RMF.`,
        durationMinutes: 60,
      },
    ],
  },
  {
    id: 100003,
    name: "UK AI Safety Institute Framework",
    framework: "UK AI Safety",
    level: "fundamentals",
    description: "Comprehensive training on UK AI regulation and safety frameworks",
    duration: "10h",
    moduleCount: 7,
    region: "UK",
    modules: [
      {
        title: "UK AI Regulation Landscape",
        description: "Module 1 of UK AI Safety Institute Framework",
        content: `# UK AI Regulation Landscape

**Module Code:** 100003-M01
**Duration:** 60 minutes
**Description:** Module 1 of UK AI Safety Institute Framework

---

Explore the UK's approach to AI regulation, including the pro-innovation regulatory framework, sector-specific guidance, and the role of existing regulators in overseeing AI systems.`,
        durationMinutes: 60,
      },
      {
        title: "AI Safety Institute Mission",
        description: "Module 2 of UK AI Safety Institute Framework",
        content: `# AI Safety Institute Mission

**Module Code:** 100003-M02
**Duration:** 60 minutes
**Description:** Module 2 of UK AI Safety Institute Framework

---

Learn about the UK AI Safety Institute's mission, structure, and key initiatives in advancing AI safety research, evaluation, and international collaboration.`,
        durationMinutes: 60,
      },
      {
        title: "Testing and Evaluation Methodologies",
        description: "Module 3 of UK AI Safety Institute Framework",
        content: `# Testing and Evaluation Methodologies

**Module Code:** 100003-M03
**Duration:** 90 minutes
**Description:** Module 3 of UK AI Safety Institute Framework

---

This module covers the testing and evaluation methodologies used by the AI Safety Institute, including red-teaming, capability assessments, and safety benchmarks.`,
        durationMinutes: 90,
      },
      {
        title: "Safety Assurance Principles",
        description: "Module 4 of UK AI Safety Institute Framework",
        content: `# Safety Assurance Principles

**Module Code:** 100003-M04
**Duration:** 90 minutes
**Description:** Module 4 of UK AI Safety Institute Framework

---

Understand the core safety assurance principles for AI systems, including robustness, reliability, transparency, and alignment with human values.`,
        durationMinutes: 90,
      },
      {
        title: "UK AI Compliance Requirements",
        description: "Module 5 of UK AI Safety Institute Framework",
        content: `# UK AI Compliance Requirements

**Module Code:** 100003-M05
**Duration:** 90 minutes
**Description:** Module 5 of UK AI Safety Institute Framework

---

Learn about UK-specific compliance requirements, including data protection obligations, sector-specific regulations, and voluntary commitments for AI developers.`,
        durationMinutes: 90,
      },
      {
        title: "Case Studies and Applications",
        description: "Module 6 of UK AI Safety Institute Framework",
        content: `# Case Studies and Applications

**Module Code:** 100003-M06
**Duration:** 90 minutes
**Description:** Module 6 of UK AI Safety Institute Framework

---

Explore real-world case studies demonstrating the application of UK AI safety principles across different sectors and use cases.`,
        durationMinutes: 90,
      },
      {
        title: "Certification Exam Preparation",
        description: "Module 7 of UK AI Safety Institute Framework",
        content: `# Certification Exam Preparation

**Module Code:** 100003-M07
**Duration:** 60 minutes
**Description:** Module 7 of UK AI Safety Institute Framework

---

Prepare for the certification exam with comprehensive review materials, practice questions, and key concepts summary covering all aspects of UK AI safety.`,
        durationMinutes: 60,
      },
    ],
  },
  {
    id: 100004,
    name: "Canada AIDA Compliance",
    framework: "AIDA",
    level: "fundamentals",
    description: "Comprehensive training on Canada's Artificial Intelligence and Data Act",
    duration: "10h",
    moduleCount: 7,
    region: "Canada",
    modules: [
      {
        title: "Introduction to AIDA",
        description: "Module 1 of Canada AIDA Compliance",
        content: `# Introduction to AIDA

**Module Code:** 100004-M01
**Duration:** 60 minutes
**Description:** Module 1 of Canada AIDA Compliance

---

This module introduces Canada's Artificial Intelligence and Data Act (AIDA), its legislative context, scope, and key objectives in regulating AI systems.`,
        durationMinutes: 60,
      },
      {
        title: "High-Impact AI Systems Classification",
        description: "Module 2 of Canada AIDA Compliance",
        content: `# High-Impact AI Systems Classification

**Module Code:** 100004-M02
**Duration:** 90 minutes
**Description:** Module 2 of Canada AIDA Compliance

---

Learn about the classification of high-impact AI systems under AIDA, including criteria for designation and the specific requirements that apply to these systems.`,
        durationMinutes: 90,
      },
      {
        title: "Risk Mitigation Requirements",
        description: "Module 3 of Canada AIDA Compliance",
        content: `# Risk Mitigation Requirements

**Module Code:** 100004-M03
**Duration:** 90 minutes
**Description:** Module 3 of Canada AIDA Compliance

---

Understand the risk mitigation requirements for AI systems, including impact assessments, bias testing, and measures to address potential harms.`,
        durationMinutes: 90,
      },
      {
        title: "Transparency and Accountability",
        description: "Module 4 of Canada AIDA Compliance",
        content: `# Transparency and Accountability

**Module Code:** 100004-M04
**Duration:** 90 minutes
**Description:** Module 4 of Canada AIDA Compliance

---

Explore the transparency and accountability obligations under AIDA, including disclosure requirements, explainability standards, and record-keeping duties.`,
        durationMinutes: 90,
      },
      {
        title: "AIDA Enforcement and Penalties",
        description: "Module 5 of Canada AIDA Compliance",
        content: `# AIDA Enforcement and Penalties

**Module Code:** 100004-M05
**Duration:** 90 minutes
**Description:** Module 5 of Canada AIDA Compliance

---

Learn about the enforcement mechanisms and penalties under AIDA, including the role of the AI and Data Commissioner and potential sanctions for non-compliance.`,
        durationMinutes: 90,
      },
      {
        title: "Implementing AIDA Compliance",
        description: "Module 6 of Canada AIDA Compliance",
        content: `# Implementing AIDA Compliance

**Module Code:** 100004-M06
**Duration:** 90 minutes
**Description:** Module 6 of Canada AIDA Compliance

---

This module provides a practical roadmap for implementing AIDA compliance, including timelines, resource planning, and integration with existing governance frameworks.`,
        durationMinutes: 90,
      },
      {
        title: "Certification Exam Preparation",
        description: "Module 7 of Canada AIDA Compliance",
        content: `# Certification Exam Preparation

**Module Code:** 100004-M07
**Duration:** 60 minutes
**Description:** Module 7 of Canada AIDA Compliance

---

Prepare for the certification exam with comprehensive review materials, practice questions, and key concepts summary covering all aspects of AIDA compliance.`,
        durationMinutes: 60,
      },
    ],
  },
  {
    id: 100005,
    name: "Australia AI Ethics Framework",
    framework: "Australia AI Ethics",
    level: "fundamentals",
    description: "Comprehensive training on Australia's AI ethics principles and frameworks",
    duration: "10h",
    moduleCount: 7,
    region: "Australia",
    modules: [
      {
        title: "Australian AI Ethics Principles",
        description: "Module 1 of Australia AI Ethics Framework",
        content: `# Australian AI Ethics Principles

**Module Code:** 100005-M01
**Duration:** 60 minutes
**Description:** Module 1 of Australia AI Ethics Framework

---

Learn about Australia's eight AI Ethics Principles and how they guide the responsible development and deployment of AI systems across sectors.`,
        durationMinutes: 60,
      },
      {
        title: "Voluntary AI Safety Standard",
        description: "Module 2 of Australia AI Ethics Framework",
        content: `# Voluntary AI Safety Standard

**Module Code:** 100005-M02
**Duration:** 90 minutes
**Description:** Module 2 of Australia AI Ethics Framework

---

Explore Australia's Voluntary AI Safety Standard and its practical guidance for organizations developing and deploying AI systems.`,
        durationMinutes: 90,
      },
      {
        title: "AI and Privacy Law Intersection",
        description: "Module 3 of Australia AI Ethics Framework",
        content: `# AI and Privacy Law Intersection

**Module Code:** 100005-M03
**Duration:** 90 minutes
**Description:** Module 3 of Australia AI Ethics Framework

---

Understand the intersection of AI and privacy law in Australia, including the Privacy Act requirements and emerging data protection considerations.`,
        durationMinutes: 90,
      },
      {
        title: "Fairness and Non-Discrimination",
        description: "Module 4 of Australia AI Ethics Framework",
        content: `# Fairness and Non-Discrimination

**Module Code:** 100005-M04
**Duration:** 90 minutes
**Description:** Module 4 of Australia AI Ethics Framework

---

This module covers fairness and non-discrimination requirements for AI systems, including bias detection, mitigation strategies, and equity considerations.`,
        durationMinutes: 90,
      },
      {
        title: "Transparency and Explainability",
        description: "Module 5 of Australia AI Ethics Framework",
        content: `# Transparency and Explainability

**Module Code:** 100005-M05
**Duration:** 90 minutes
**Description:** Module 5 of Australia AI Ethics Framework

---

Learn about transparency and explainability requirements for AI systems, including disclosure obligations and methods for making AI decisions understandable.`,
        durationMinutes: 90,
      },
      {
        title: "Implementing Australian AI Ethics",
        description: "Module 6 of Australia AI Ethics Framework",
        content: `# Implementing Australian AI Ethics

**Module Code:** 100005-M06
**Duration:** 90 minutes
**Description:** Module 6 of Australia AI Ethics Framework

---

Explore practical implementation guidelines for applying Australia's AI ethics framework within organizations, including governance structures and assessment tools.`,
        durationMinutes: 90,
      },
      {
        title: "Certification Exam Preparation",
        description: "Module 7 of Australia AI Ethics Framework",
        content: `# Certification Exam Preparation

**Module Code:** 100005-M07
**Duration:** 60 minutes
**Description:** Module 7 of Australia AI Ethics Framework

---

Prepare for the certification exam with comprehensive review materials, practice questions, and key concepts summary covering all aspects of Australian AI ethics.`,
        durationMinutes: 60,
      },
    ],
  },
  {
    id: 100006,
    name: "ISO/IEC 42001 International Standard",
    framework: "ISO/IEC 42001",
    level: "fundamentals",
    description: "Comprehensive training on ISO/IEC 42001 AI management systems standard",
    duration: "10h",
    moduleCount: 7,
    region: "International",
    modules: [
      {
        title: "ISO 42001 Overview",
        description: "Module 1 of ISO/IEC 42001 International Standard",
        content: `# ISO 42001 Overview

**Module Code:** 100006-M01
**Duration:** 60 minutes
**Description:** Module 1 of ISO/IEC 42001 International Standard

---

This module introduces ISO/IEC 42001, the international standard for AI management systems, including its scope, structure, and relationship to other management system standards.`,
        durationMinutes: 60,
      },
      {
        title: "Establishing AI Management Systems",
        description: "Module 2 of ISO/IEC 42001 International Standard",
        content: `# Establishing AI Management Systems

**Module Code:** 100006-M02
**Duration:** 90 minutes
**Description:** Module 2 of ISO/IEC 42001 International Standard

---

Learn about the core requirements for establishing, implementing, and maintaining an AI management system, including leadership commitment and organizational context.`,
        durationMinutes: 90,
      },
      {
        title: "Risk Management Requirements",
        description: "Module 3 of ISO/IEC 42001 International Standard",
        content: `# Risk Management Requirements

**Module Code:** 100006-M03
**Duration:** 90 minutes
**Description:** Module 3 of ISO/IEC 42001 International Standard

---

Understand the risk management requirements of ISO 42001, including risk identification, assessment, treatment, and the implementation of controls.`,
        durationMinutes: 90,
      },
      {
        title: "Documentation and Records",
        description: "Module 4 of ISO/IEC 42001 International Standard",
        content: `# Documentation and Records

**Module Code:** 100006-M04
**Duration:** 90 minutes
**Description:** Module 4 of ISO/IEC 42001 International Standard

---

Explore the documentation and records requirements for ISO 42001 compliance, including policies, procedures, and evidence of conformity.`,
        durationMinutes: 90,
      },
      {
        title: "Audit and Management Review",
        description: "Module 5 of ISO/IEC 42001 International Standard",
        content: `# Audit and Management Review

**Module Code:** 100006-M05
**Duration:** 90 minutes
**Description:** Module 5 of ISO/IEC 42001 International Standard

---

Learn about internal audit requirements and management review processes for maintaining and improving the AI management system.`,
        durationMinutes: 90,
      },
      {
        title: "ISO 42001 Certification",
        description: "Module 6 of ISO/IEC 42001 International Standard",
        content: `# ISO 42001 Certification

**Module Code:** 100006-M06
**Duration:** 90 minutes
**Description:** Module 6 of ISO/IEC 42001 International Standard

---

Understand the certification process for ISO 42001, including preparation, audit stages, and maintaining certification over time.`,
        durationMinutes: 90,
      },
      {
        title: "Continuous Improvement",
        description: "Module 7 of ISO/IEC 42001 International Standard",
        content: `# Continuous Improvement

**Module Code:** 100006-M07
**Duration:** 60 minutes
**Description:** Module 7 of ISO/IEC 42001 International Standard

---

This module covers continuous improvement methodologies for AI management systems, including corrective actions, preventive measures, and performance optimization.`,
        durationMinutes: 60,
      },
    ],
  },
  {
    id: 100007,
    name: "China TC260 AI Framework",
    framework: "TC260",
    level: "fundamentals",
    description: "Comprehensive training on China's TC260 AI governance standards and frameworks",
    duration: "10h",
    moduleCount: 7,
    region: "China",
    modules: [
      {
        title: "TC260 Framework Overview",
        description: "Module 1 of China TC260 AI Framework",
        content: `# TC260 Framework Overview

**Module Code:** 100007-M01
**Duration:** 60 minutes
**Description:** Module 1 of China TC260 AI Framework

---

Learn about China's TC260 (National Information Security Standardization Technical Committee) and its role in developing AI governance standards and frameworks.`,
        durationMinutes: 60,
      },
      {
        title: "AI Risk Classification System",
        description: "Module 2 of China TC260 AI Framework",
        content: `# AI Risk Classification System

**Module Code:** 100007-M02
**Duration:** 90 minutes
**Description:** Module 2 of China TC260 AI Framework

---

Understand China's three-tier risk classification system for AI systems and the specific requirements that apply to each risk level.`,
        durationMinutes: 90,
      },
      {
        title: "AI Algorithm Registration",
        description: "Module 3 of China TC260 AI Framework",
        content: `# AI Algorithm Registration

**Module Code:** 100007-M03
**Duration:** 90 minutes
**Description:** Module 3 of China TC260 AI Framework

---

Explore the AI algorithm registration requirements in China, including the registration process, documentation requirements, and ongoing compliance obligations.`,
        durationMinutes: 90,
      },
      {
        title: "Data Security Requirements",
        description: "Module 4 of China TC260 AI Framework",
        content: `# Data Security Requirements

**Module Code:** 100007-M04
**Duration:** 90 minutes
**Description:** Module 4 of China TC260 AI Framework

---

Learn about data security requirements for AI systems in China, including data classification, protection measures, and cross-border data transfer restrictions.`,
        durationMinutes: 90,
      },
      {
        title: "Compliance and Auditing",
        description: "Module 5 of China TC260 AI Framework",
        content: `# Compliance and Auditing

**Module Code:** 100007-M05
**Duration:** 90 minutes
**Description:** Module 5 of China TC260 AI Framework

---

Understand the compliance and auditing requirements for AI systems operating in China, including self-assessments, third-party audits, and regulatory inspections.`,
        durationMinutes: 90,
      },
      {
        title: "Cross-Border Data Transfer Rules",
        description: "Module 6 of China TC260 AI Framework",
        content: `# Cross-Border Data Transfer Rules

**Module Code:** 100007-M06
**Duration:** 90 minutes
**Description:** Module 6 of China TC260 AI Framework

---

Explore the rules governing cross-border data transfers involving AI systems, including security assessments and contractual requirements.`,
        durationMinutes: 90,
      },
      {
        title: "Certification Exam Preparation",
        description: "Module 7 of China TC260 AI Framework",
        content: `# Certification Exam Preparation

**Module Code:** 100007-M07
**Duration:** 60 minutes
**Description:** Module 7 of China TC260 AI Framework

---

Prepare for the certification exam with comprehensive review materials, practice questions, and key concepts summary covering all aspects of China's TC260 framework.`,
        durationMinutes: 60,
      },
    ],
  },
];

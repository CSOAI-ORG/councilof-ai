import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { courses, trainingModules } from './drizzle/schema.ts';
import { readFileSync } from 'fs';
import { eq } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function populateNISTAndISOCourses() {
  console.log('Starting NIST AI RMF and ISO 42001 course population...');

  try {
    // Check if courses already exist
    const existingNIST = await db.select().from(courses).where(eq(courses.id, 2));
    const existingISO = await db.select().from(courses).where(eq(courses.id, 3));

    if (existingNIST.length > 0) {
      console.log('NIST AI RMF course already exists, skipping...');
    } else {
      // Create NIST AI RMF course
      await db.insert(courses).values({
        id: 2,
        title: 'NIST AI Risk Management Framework',
        description: 'Comprehensive training on the NIST AI RMF, covering trustworthy AI characteristics, the four core functions (GOVERN, MAP, MEASURE, MANAGE), AI lifecycle management, and implementation strategies for building responsible AI systems.',
        category: 'AI Safety Frameworks',
        difficulty: 'intermediate',
        estimatedHours: 12,
        moduleCount: 8,
        published: true,
      });
      console.log('✓ Created NIST AI RMF course');
    }

    if (existingISO.length > 0) {
      console.log('ISO 42001 course already exists, skipping...');
    } else {
      // Create ISO 42001 course
      await db.insert(courses).values({
        id: 3,
        title: 'ISO 42001: AI Management System',
        description: 'Complete guide to ISO 42001 certification, covering the AI Management System (AIMS) structure, context and leadership requirements, planning and risk management, operational controls, performance evaluation, and continuous improvement for certifiable AI governance.',
        category: 'AI Safety Frameworks',
        difficulty: 'advanced',
        estimatedHours: 14,
        moduleCount: 8,
        published: true,
      });
      console.log('✓ Created ISO 42001 course');
    }

    // NIST AI RMF Modules
    const nistModules = [
      {
        courseId: 2,
        moduleNumber: 1,
        title: 'Introduction to NIST AI RMF',
        description: 'Overview of the NIST AI Risk Management Framework, its history, purpose, and how it helps organizations build trustworthy AI systems.',
        content: `# Introduction to NIST AI Risk Management Framework

## Overview

The NIST AI Risk Management Framework (AI RMF) is a voluntary framework developed by the National Institute of Standards and Technology to help organizations manage risks associated with artificial intelligence systems. Released in January 2023, it provides a structured approach to identifying, assessing, and mitigating AI risks while promoting trustworthy AI development and deployment.

## Framework Purpose

The AI RMF aims to:
- Provide a common language and understanding of AI risks
- Offer practical guidance for managing AI risks across the AI lifecycle
- Support the development of trustworthy AI systems
- Enable organizations to balance innovation with risk management
- Facilitate stakeholder engagement and transparency

## Key Principles

The framework is built on several foundational principles:
- **Voluntary**: Organizations can adopt the framework based on their needs
- **Risk-based**: Focuses on identifying and managing risks proportionate to their severity
- **Flexible**: Adaptable to different organizational contexts and AI applications
- **Stakeholder-inclusive**: Emphasizes engagement with affected parties
- **Lifecycle-oriented**: Addresses risks across the entire AI system lifecycle

## Framework Structure

The NIST AI RMF consists of:
- **Core Functions**: GOVERN, MAP, MEASURE, and MANAGE
- **Categories and Subcategories**: Specific outcomes and activities within each function
- **Trustworthy Characteristics**: Seven characteristics of trustworthy AI systems
- **Implementation Guidance**: Practical recommendations for applying the framework

## Benefits

Organizations that adopt the NIST AI RMF can:
- Reduce AI-related incidents and harms
- Build stakeholder trust and confidence
- Demonstrate responsible AI practices
- Align with regulatory expectations
- Improve AI system quality and reliability
- Foster a culture of responsible innovation

## Relationship to Other Frameworks

The NIST AI RMF is designed to complement other frameworks and standards:
- Aligns with NIST Cybersecurity Framework structure
- Compatible with ISO standards (ISO 42001, ISO 27001)
- Supports compliance with regulations like the EU AI Act
- Integrates with existing risk management approaches

## Who Should Use This Framework

The AI RMF is relevant for:
- AI developers and data scientists
- Product managers and business leaders
- Risk management and compliance professionals
- Policy makers and regulators
- Civil society organizations
- Anyone involved in AI system development, deployment, or governance

## Getting Started

Implementing the NIST AI RMF involves:
1. Understanding your organizational context and AI portfolio
2. Identifying stakeholders and their concerns
3. Assessing current AI risk management practices
4. Mapping framework functions to your processes
5. Implementing controls and safeguards
6. Monitoring and continuously improving

This course will guide you through each component of the framework, providing practical knowledge and skills to implement effective AI risk management in your organization.`,
        estimatedMinutes: 45,
        orderIndex: 0,
        published: true,
      },
      {
        courseId: 2,
        moduleNumber: 2,
        title: 'Trustworthy AI Characteristics',
        description: 'Deep dive into the seven characteristics of trustworthy AI: Valid & Reliable, Safe, Secure & Resilient, Accountable & Transparent, Explainable & Interpretable, Privacy-Enhanced, and Fair with Harmful Bias Managed.',
        content: readFileSync('/home/ubuntu/coai-dashboard/nist-module-2-content.md', 'utf-8'),
        estimatedMinutes: 90,
        orderIndex: 1,
        published: true,
      },
      {
        courseId: 2,
        moduleNumber: 3,
        title: 'GOVERN Function',
        description: 'Understanding the GOVERN function: establishing AI governance structures, policies, procedures, and accountability mechanisms for responsible AI management.',
        content: readFileSync('/home/ubuntu/coai-dashboard/nist-module-3-content.md', 'utf-8'),
        estimatedMinutes: 75,
        orderIndex: 2,
        published: true,
      },
      {
        courseId: 2,
        moduleNumber: 4,
        title: 'MAP Function',
        description: 'Exploring the MAP function: understanding organizational context, categorizing AI systems, assessing impacts, and identifying stakeholders.',
        content: readFileSync('/home/ubuntu/coai-dashboard/nist-module-4-content.md', 'utf-8'),
        estimatedMinutes: 75,
        orderIndex: 3,
        published: true,
      },
      {
        courseId: 2,
        moduleNumber: 5,
        title: 'MEASURE Function',
        description: 'Mastering the MEASURE function: establishing metrics, testing and validation, performance evaluation, and continuous monitoring of AI systems.',
        content: readFileSync('/home/ubuntu/coai-dashboard/nist-module-5-content.md', 'utf-8'),
        estimatedMinutes: 70,
        orderIndex: 4,
        published: true,
      },
      {
        courseId: 2,
        moduleNumber: 6,
        title: 'MANAGE Function',
        description: 'Implementing the MANAGE function: risk mitigation strategies, incident response, continuous improvement, and documentation requirements.',
        content: readFileSync('/home/ubuntu/coai-dashboard/nist-module-6-content.md', 'utf-8'),
        estimatedMinutes: 70,
        orderIndex: 5,
        published: true,
      },
      {
        courseId: 2,
        moduleNumber: 7,
        title: 'AI Lifecycle and Actors',
        description: 'Understanding AI system lifecycle stages, roles and responsibilities of different actors, and supply chain considerations in AI development and deployment.',
        content: readFileSync('/home/ubuntu/coai-dashboard/nist-module-7-content.md', 'utf-8'),
        estimatedMinutes: 75,
        orderIndex: 6,
        published: true,
      },
      {
        courseId: 2,
        moduleNumber: 8,
        title: 'Implementation Roadmap',
        description: 'Practical guidance on implementing the NIST AI RMF: organizational readiness, maturity assessment, best practices, and common pitfalls to avoid.',
        content: readFileSync('/home/ubuntu/coai-dashboard/nist-module-8-content.md', 'utf-8'),
        estimatedMinutes: 70,
        orderIndex: 7,
        published: true,
      },
    ];

    // ISO 42001 Modules
    const isoModules = [
      {
        courseId: 3,
        moduleNumber: 1,
        title: 'Introduction to ISO 42001',
        description: 'Overview of ISO 42001 standard for AI Management Systems, its history, benefits, and the certification process.',
        content: `# Introduction to ISO 42001: AI Management System Standard

## Overview

ISO 42001 is the world's first international standard for Artificial Intelligence Management Systems (AIMS). Published in December 2023, it provides a comprehensive framework for organizations to establish, implement, maintain, and continuously improve their AI management practices. Unlike voluntary guidelines, ISO 42001 is a certifiable standard—organizations can demonstrate conformity through third-party audits.

## What is an AI Management System?

An AI Management System (AIMS) is a structured framework of policies, processes, procedures, and controls that enable an organization to:
- Manage AI-related risks systematically
- Ensure AI systems are developed and used responsibly
- Meet regulatory and stakeholder expectations
- Continuously improve AI practices
- Demonstrate accountability and transparency

## Why ISO 42001 Matters

As AI becomes increasingly prevalent, organizations face growing pressure to demonstrate responsible AI practices. ISO 42001 provides:
- **International Recognition**: A globally recognized standard for AI management
- **Certification**: Ability to achieve third-party certification demonstrating conformity
- **Regulatory Alignment**: Framework that supports compliance with AI regulations
- **Stakeholder Confidence**: Credible demonstration of commitment to responsible AI
- **Competitive Advantage**: Differentiation through certified AI management practices

## Standard Structure

ISO 42001 follows the High-Level Structure (HLS) common to all ISO management system standards, consisting of 10 clauses:

**Clauses 1-3**: Introductory (Scope, Normative References, Terms and Definitions)

**Clauses 4-10**: Requirements
- Clause 4: Context of the Organization
- Clause 5: Leadership
- Clause 6: Planning
- Clause 7: Support
- Clause 8: Operation
- Clause 9: Performance Evaluation
- Clause 10: Improvement

This structure enables integration with other ISO standards like ISO 9001 (Quality) and ISO 27001 (Information Security).

## Key Requirements

ISO 42001 requires organizations to:
- Understand their context and stakeholder needs
- Establish AI governance and leadership commitment
- Conduct AI risk assessments and impact assessments
- Implement controls throughout the AI lifecycle
- Monitor and measure AI system performance
- Conduct internal audits and management reviews
- Continuously improve the AIMS

## Benefits of Implementation

Organizations that implement ISO 42001 can:
- Reduce AI-related incidents and harms
- Build trust with customers, regulators, and stakeholders
- Demonstrate compliance with regulatory requirements
- Improve AI system quality and reliability
- Enhance organizational reputation
- Enable responsible AI innovation
- Achieve competitive differentiation

## Certification Process

Achieving ISO 42001 certification involves:
1. Gap assessment and planning
2. AIMS implementation
3. Internal audits and management reviews
4. Certification body selection
5. Stage 1 audit (documentation review)
6. Stage 2 audit (implementation audit)
7. Certification decision
8. Ongoing surveillance audits

## Who Should Pursue ISO 42001

ISO 42001 is relevant for:
- Organizations developing AI systems
- Organizations deploying AI systems
- AI service providers
- Organizations subject to AI regulations
- Organizations seeking to demonstrate responsible AI practices
- Any organization using AI in significant ways

## Relationship to Other Standards and Frameworks

ISO 42001 complements:
- **ISO 27001**: Information security management
- **ISO 9001**: Quality management
- **NIST AI RMF**: Risk management framework
- **EU AI Act**: Regulatory compliance
- **IEEE 7000 series**: Ethics and AI standards

## Getting Started

Implementing ISO 42001 requires:
- Executive commitment and sponsorship
- Understanding of current AI practices
- Gap assessment against standard requirements
- Implementation roadmap and resources
- Cultural readiness for AI governance
- Stakeholder engagement

This course will guide you through each clause of ISO 42001, providing comprehensive understanding and practical implementation guidance to help your organization achieve certification and build effective AI management capabilities.`,
        estimatedMinutes: 45,
        orderIndex: 0,
        published: true,
      },
      {
        courseId: 3,
        moduleNumber: 2,
        title: 'AIMS Requirements and Structure',
        description: 'Detailed exploration of ISO 42001 structure, the 10 clauses, mandatory vs optional requirements, and documentation needs.',
        content: readFileSync('/home/ubuntu/coai-dashboard/iso-42001-module-2-content.md', 'utf-8'),
        estimatedMinutes: 85,
        orderIndex: 1,
        published: true,
      },
      {
        courseId: 3,
        moduleNumber: 3,
        title: 'Context and Leadership',
        description: 'Understanding organizational context (Clause 4) and leadership requirements (Clause 5): establishing AI policy, governance, and roles.',
        content: readFileSync('/home/ubuntu/coai-dashboard/iso-42001-module-3-content.md', 'utf-8'),
        estimatedMinutes: 80,
        orderIndex: 2,
        published: true,
      },
      {
        courseId: 3,
        moduleNumber: 4,
        title: 'Planning and Risk Management',
        description: 'Mastering planning requirements (Clause 6): identifying risks and opportunities, setting AI objectives, and AI-specific risk assessment.',
        content: readFileSync('/home/ubuntu/coai-dashboard/iso-42001-module-4-content.md', 'utf-8'),
        estimatedMinutes: 85,
        orderIndex: 3,
        published: true,
      },
      {
        courseId: 3,
        moduleNumber: 5,
        title: 'Support and Operations',
        description: 'Implementing support (Clause 7) and operations (Clause 8): resources, competence, communication, operational controls, and impact assessments.',
        content: readFileSync('/home/ubuntu/coai-dashboard/iso-42001-module-5-content.md', 'utf-8'),
        estimatedMinutes: 90,
        orderIndex: 4,
        published: true,
      },
      {
        courseId: 3,
        moduleNumber: 6,
        title: 'Performance Evaluation',
        description: 'Establishing performance evaluation (Clause 9): monitoring and measurement, internal audits, and management reviews.',
        content: readFileSync('/home/ubuntu/coai-dashboard/iso-42001-module-6-content.md', 'utf-8'),
        estimatedMinutes: 80,
        orderIndex: 5,
        published: true,
      },
      {
        courseId: 3,
        moduleNumber: 7,
        title: 'Improvement and Certification',
        description: 'Driving improvement (Clause 10): continual improvement, nonconformity management, corrective action, and the certification process.',
        content: readFileSync('/home/ubuntu/coai-dashboard/iso-42001-module-7-content.md', 'utf-8'),
        estimatedMinutes: 80,
        orderIndex: 6,
        published: true,
      },
      {
        courseId: 3,
        moduleNumber: 8,
        title: 'Implementation Best Practices',
        description: 'Practical implementation guidance: roadmap, integration with existing systems, common pitfalls, and building organizational maturity.',
        content: readFileSync('/home/ubuntu/coai-dashboard/iso-42001-module-8-content.md', 'utf-8'),
        estimatedMinutes: 85,
        orderIndex: 7,
        published: true,
      },
    ];

    // Insert all modules
    const allModules = [...nistModules, ...isoModules];
    
    for (const module of allModules) {
      // Check if module already exists
      const existing = await db.select()
        .from(trainingModules)
        .where(eq(trainingModules.courseId, module.courseId))
        .where(eq(trainingModules.moduleNumber, module.moduleNumber));

      if (existing.length > 0) {
        console.log(`✓ Module ${module.courseId}-${module.moduleNumber} already exists, skipping...`);
      } else {
        await db.insert(trainingModules).values(module);
        console.log(`✓ Created module: ${module.title}`);
      }
    }

    console.log('\n✅ NIST AI RMF and ISO 42001 courses populated successfully!');
    console.log(`Total modules created: ${allModules.length}`);
    
  } catch (error) {
    console.error('Error populating courses:', error);
    throw error;
  }
}

// Run the population
populateNISTAndISOCourses()
  .then(async () => {
    console.log('Population complete!');
    await client.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error('Population failed:', error);
    await client.end();
    process.exit(1);
  });

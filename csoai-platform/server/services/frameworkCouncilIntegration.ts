/**
 * CSOAI Framework-Council Integration Service
 *
 * Connects compliance frameworks (EU AI Act, NIST AI RMF, ISO 42001, TC260)
 * with the Byzantine Council for automated assessment and voting
 *
 * Flow:
 * 1. System detected as high-risk by framework assessment
 * 2. Automatically triggers council review
 * 3. 33 agents evaluate against framework requirements
 * 4. Consensus determines compliance status
 */

import { generateAgentCouncil, executeCouncilVoting, type VotingSession } from './council';

// Framework definitions with their key requirements
export const COMPLIANCE_FRAMEWORKS = {
  EU_AI_ACT: {
    id: 'eu-ai-act',
    name: 'EU AI Act',
    articles: 113,
    region: 'European Union',
    effectiveDate: '2026-02-01',
    keyRequirements: [
      'Risk categorization (Unacceptable, High, Limited, Minimal)',
      'Mandatory conformity assessment for high-risk systems',
      'Technical documentation and logging requirements',
      'Human oversight mechanisms',
      'Transparency and disclosure obligations',
      'Prohibited AI practices (social scoring, subliminal manipulation)',
      'Registration in EU database for high-risk systems',
      'Post-market monitoring requirements',
    ],
    prohibitedPractices: [
      'Social scoring by governments',
      'Real-time biometric identification in public spaces (with exceptions)',
      'Subliminal manipulation techniques',
      'Exploitation of vulnerable groups',
      'Predictive policing based solely on profiling',
    ],
    highRiskCategories: [
      'Biometric identification',
      'Critical infrastructure management',
      'Education and vocational training',
      'Employment and worker management',
      'Access to essential services',
      'Law enforcement',
      'Migration and border control',
      'Administration of justice',
    ],
  },

  NIST_AI_RMF: {
    id: 'nist-ai-rmf',
    name: 'NIST AI Risk Management Framework',
    articles: 72,
    region: 'United States',
    effectiveDate: '2023-01-26',
    keyRequirements: [
      'Govern: Establish AI risk management culture',
      'Map: Identify and categorize AI risks',
      'Measure: Assess and analyze identified risks',
      'Manage: Prioritize and address AI risks',
      'Trustworthy AI characteristics assessment',
      'Continuous monitoring and improvement',
    ],
    trustworthyCharacteristics: [
      'Valid and Reliable',
      'Safe',
      'Secure and Resilient',
      'Accountable and Transparent',
      'Explainable and Interpretable',
      'Privacy-Enhanced',
      'Fair with Harmful Bias Managed',
    ],
    governFunctions: [
      'Policies, processes, procedures, and practices',
      'Accountability structures',
      'Workforce diversity and expertise',
      'Culture of risk management',
    ],
  },

  ISO_42001: {
    id: 'iso-42001',
    name: 'ISO/IEC 42001',
    articles: 56,
    region: 'International',
    effectiveDate: '2023-12-01',
    keyRequirements: [
      'AI Management System (AIMS) establishment',
      'Leadership and commitment',
      'Risk assessment and treatment',
      'Competence and awareness',
      'Documented information management',
      'Operational planning and control',
      'Performance evaluation',
      'Continual improvement',
    ],
    managementClauses: [
      'Context of the organization',
      'Leadership',
      'Planning',
      'Support',
      'Operation',
      'Performance evaluation',
      'Improvement',
    ],
    controls: [
      'AI policies',
      'Internal organization',
      'Resources for AI systems',
      'Assessing AI system impact',
      'AI system lifecycle',
      'Data for AI systems',
      'Information for interested parties',
      'Use of AI systems',
      'Third party relationships',
    ],
  },

  TC260: {
    id: 'tc260',
    name: 'TC260 AI Safety Governance',
    articles: 48,
    region: 'China',
    effectiveDate: '2023-08-15',
    keyRequirements: [
      'AI security assessment',
      'Algorithm filing requirements',
      'Deep synthesis management',
      'Generative AI service rules',
      'Data security requirements',
      'Content moderation',
      'User rights protection',
      'Cross-border data transfer compliance',
    ],
    securityAssessmentAreas: [
      'Algorithm security',
      'Data security',
      'Application security',
      'Content security',
      'Service security',
    ],
    contentRequirements: [
      'No incitement to subversion',
      'No terrorism or extremism',
      'No false information',
      'No content harmful to minors',
      'Respect for intellectual property',
    ],
  },
};

// Risk levels aligned across frameworks
export const RISK_LEVELS = {
  UNACCEPTABLE: {
    level: 'unacceptable',
    description: 'Prohibited - Cannot be deployed',
    councilAction: 'immediate_halt',
    requiredVotes: 15, // Lower threshold for urgent action
  },
  HIGH: {
    level: 'high',
    description: 'High-risk - Requires full assessment and council review',
    councilAction: 'full_review',
    requiredVotes: 22, // Standard BFT consensus
  },
  LIMITED: {
    level: 'limited',
    description: 'Limited risk - Transparency obligations',
    councilAction: 'transparency_check',
    requiredVotes: 22,
  },
  MINIMAL: {
    level: 'minimal',
    description: 'Minimal risk - Voluntary codes',
    councilAction: 'optional_review',
    requiredVotes: 17, // Lighter threshold
  },
};

// Assessment criteria for council evaluation
export interface FrameworkAssessment {
  systemId: number;
  systemName: string;
  frameworks: string[];
  riskLevel: keyof typeof RISK_LEVELS;
  assessmentItems: AssessmentItem[];
  overallScore: number;
  councilRequired: boolean;
}

export interface AssessmentItem {
  framework: string;
  requirement: string;
  status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable';
  evidence?: string;
  score: number;
  weight: number;
}

/**
 * Evaluate an AI system against selected frameworks
 */
export function evaluateSystemCompliance(
  systemName: string,
  systemDescription: string,
  systemCategory: string,
  selectedFrameworks: string[]
): FrameworkAssessment {
  const assessmentItems: AssessmentItem[] = [];
  let totalScore = 0;
  let totalWeight = 0;

  for (const frameworkId of selectedFrameworks) {
    const framework = COMPLIANCE_FRAMEWORKS[frameworkId as keyof typeof COMPLIANCE_FRAMEWORKS];
    if (!framework) continue;

    // Evaluate each key requirement
    for (const requirement of framework.keyRequirements) {
      const item: AssessmentItem = {
        framework: framework.name,
        requirement,
        status: 'partial', // Default - would be determined by actual assessment
        score: 0.7, // Mock score
        weight: 1,
      };
      assessmentItems.push(item);
      totalScore += item.score * item.weight;
      totalWeight += item.weight;
    }
  }

  const overallScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

  // Determine risk level based on system category and score
  let riskLevel: keyof typeof RISK_LEVELS = 'MINIMAL';
  if (systemCategory === 'biometric' || systemCategory === 'critical_infrastructure') {
    riskLevel = 'HIGH';
  } else if (systemCategory === 'social_scoring') {
    riskLevel = 'UNACCEPTABLE';
  } else if (overallScore < 60) {
    riskLevel = 'HIGH';
  } else if (overallScore < 80) {
    riskLevel = 'LIMITED';
  }

  return {
    systemId: Date.now(),
    systemName,
    frameworks: selectedFrameworks,
    riskLevel,
    assessmentItems,
    overallScore,
    councilRequired: riskLevel === 'HIGH' || riskLevel === 'UNACCEPTABLE',
  };
}

/**
 * Trigger council review for a framework assessment
 */
export async function triggerCouncilReview(
  assessment: FrameworkAssessment
): Promise<VotingSession | null> {
  if (!assessment.councilRequired) {
    console.log(`[Framework Integration] Council review not required for ${assessment.systemName}`);
    return null;
  }

  // Build detailed subject for council review
  const subject = {
    type: 'system_review' as const,
    title: `Framework Compliance Review: ${assessment.systemName}`,
    description: `
AI System: ${assessment.systemName}
Risk Level: ${assessment.riskLevel}
Frameworks Assessed: ${assessment.frameworks.join(', ')}
Overall Compliance Score: ${assessment.overallScore.toFixed(1)}%

Key Findings:
${assessment.assessmentItems
  .filter(item => item.status !== 'compliant')
  .slice(0, 5)
  .map(item => `- ${item.framework}: ${item.requirement} (${item.status})`)
  .join('\n')}

Council Task: Review this assessment and determine if the system should be:
- APPROVED: Meets compliance requirements
- REJECTED: Fails critical requirements, needs remediation
- ESCALATED: Requires human oversight for complex decision
    `.trim(),
  };

  // Execute the actual council voting
  // In production, this would call executeVoting with real AI agents
  console.log(`[Framework Integration] Triggering council vote for ${assessment.systemName}`);

  // Return mock session for now (real implementation would use executeVoting)
  const mockSession: VotingSession = {
    sessionId: Date.now(),
    subjectType: 'system_review',
    subjectId: assessment.systemId,
    subjectTitle: subject.title,
    subjectDescription: subject.description,
    status: 'voting',
    votes: [],
    totalVotes: 0,
    approveVotes: 0,
    rejectVotes: 0,
    escalateVotes: 0,
    finalDecision: null,
    consensusReached: false,
  };

  return mockSession;
}

/**
 * Get framework-specific council prompts
 */
export function getFrameworkPrompts(frameworks: string[]): string {
  const prompts: string[] = [];

  for (const frameworkId of frameworks) {
    const framework = COMPLIANCE_FRAMEWORKS[frameworkId as keyof typeof COMPLIANCE_FRAMEWORKS];
    if (!framework) continue;

    prompts.push(`
## ${framework.name} (${framework.region})
Key Requirements to Evaluate:
${framework.keyRequirements.map(r => `- ${r}`).join('\n')}
    `);
  }

  return prompts.join('\n\n');
}

/**
 * Generate compliance report for a system
 */
export function generateComplianceReport(assessment: FrameworkAssessment): string {
  const report = `
# CSOAI Compliance Assessment Report
Generated: ${new Date().toISOString()}

## System Information
- Name: ${assessment.systemName}
- Risk Level: ${assessment.riskLevel}
- Overall Score: ${assessment.overallScore.toFixed(1)}%
- Council Review Required: ${assessment.councilRequired ? 'Yes' : 'No'}

## Frameworks Assessed
${assessment.frameworks.map(f => {
  const framework = COMPLIANCE_FRAMEWORKS[f as keyof typeof COMPLIANCE_FRAMEWORKS];
  return framework ? `- ${framework.name} (${framework.articles} articles)` : f;
}).join('\n')}

## Detailed Findings

### Compliant Items
${assessment.assessmentItems
  .filter(i => i.status === 'compliant')
  .map(i => `- ✓ ${i.framework}: ${i.requirement}`)
  .join('\n') || 'None'}

### Non-Compliant Items
${assessment.assessmentItems
  .filter(i => i.status === 'non_compliant')
  .map(i => `- ✗ ${i.framework}: ${i.requirement}`)
  .join('\n') || 'None'}

### Partial Compliance
${assessment.assessmentItems
  .filter(i => i.status === 'partial')
  .map(i => `- ⚠ ${i.framework}: ${i.requirement}`)
  .join('\n') || 'None'}

## Recommendations
${assessment.overallScore >= 80 ?
  'System meets compliance requirements. Continue monitoring.' :
  assessment.overallScore >= 60 ?
    'System requires attention in identified areas. Implement remediation plan.' :
    'System has critical compliance gaps. Immediate action required.'}

---
Report generated by CSOAI Byzantine Council Framework Integration
  `.trim();

  return report;
}

// Export service
export const frameworkCouncilService = {
  COMPLIANCE_FRAMEWORKS,
  RISK_LEVELS,
  evaluateSystemCompliance,
  triggerCouncilReview,
  getFrameworkPrompts,
  generateComplianceReport,
};

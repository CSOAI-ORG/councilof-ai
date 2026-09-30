/**
 * UK AI Bill Landing Page
 * Framework-specific landing page for UK AI regulation
 */

import { FrameworkLandingPage } from './FrameworkLandingPage';

export default function UKAIBillPage() {
  return (
    <FrameworkLandingPage
      frameworkId="uk-ai-bill"
      frameworkName="UK AI Bill"
      region="United Kingdom"
      description="Master the United Kingdom's comprehensive AI regulation framework. Understand risk-based governance, transparency requirements, and compliance obligations for AI systems operating in UK markets."
      deadline="2026-03-31"
      threats={[
        'Regulatory fines up to £20M or 6% of global turnover for non-compliance',
        'Mandatory incident reporting requirements for high-risk AI systems',
        'Liability exposure for AI-caused harms and discrimination',
        'Market access restrictions for non-compliant AI systems',
        'Reputational damage from public AI safety incidents',
      ]}
      keyRequirements={[
        'Risk-based classification of AI systems (minimal, low, medium, high)',
        'Transparency and explainability for high-risk AI applications',
        'Human oversight and intervention capabilities for autonomous systems',
        'Data quality and bias mitigation requirements',
        'Incident reporting and documentation obligations',
        'Post-market monitoring and compliance audits',
      ]}
      trainingModules={[
        {
          title: 'UK AI Bill Fundamentals',
          description: 'Introduction to UK AI regulation, risk classification, and compliance framework',
          duration: '2-3 hours',
        },
        {
          title: 'High-Risk AI Systems',
          description: 'Deep dive into requirements for high-risk AI applications and oversight mechanisms',
          duration: '3-4 hours',
        },
        {
          title: 'Compliance & Documentation',
          description: 'Practical guidance on documentation, audits, and incident reporting',
          duration: '2-3 hours',
        },
      ]}
      comingSoon={true}
      certificationInfo={{
        examLength: 90,
        passingScore: 70,
        validity: '2 years',
      }}
    />
  );
}

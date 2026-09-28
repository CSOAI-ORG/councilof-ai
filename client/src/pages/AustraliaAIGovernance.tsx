/**
 * Australia AI Governance Landing Page
 * Framework-specific landing page for Australian AI regulation
 */

import { FrameworkLandingPage } from './FrameworkLandingPage';

export default function AustraliaAIGovernancePage() {
  return (
    <FrameworkLandingPage
      frameworkId="australia-ai"
      frameworkName="Australia AI Governance"
      region="Australia"
      description="Master Australia's AI governance framework. Understand mandatory AI impact assessments, transparency requirements, and compliance obligations for AI systems deployed in Australian markets."
      deadline="2026-12-31"
      threats={[
        'Regulatory penalties and enforcement action for non-compliant AI systems',
        'Mandatory AI impact assessments for high-risk applications',
        'Public disclosure requirements for AI system failures',
        'Consumer protection violations and liability exposure',
        'Market access restrictions and trading restrictions',
        'Reputational damage from AI-related incidents',
      ]}
      keyRequirements={[
        'Mandatory AI impact assessments for high-risk systems',
        'Transparency and explainability requirements',
        'Human oversight and accountability mechanisms',
        'Bias detection and mitigation strategies',
        'Data governance and quality standards',
        'Regular compliance audits and monitoring',
        'Incident notification and reporting obligations',
      ]}
      trainingModules={[
        {
          title: 'Australia AI Governance Overview',
          description: 'Introduction to Australian AI regulation, impact assessments, and compliance framework',
          duration: '2-3 hours',
        },
        {
          title: 'High-Risk AI Applications',
          description: 'Requirements for high-risk AI systems, transparency, and human oversight',
          duration: '3-4 hours',
        },
        {
          title: 'Compliance & Auditing',
          description: 'Practical guidance on audits, documentation, and incident reporting',
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

/**
 * Canada AI Act Landing Page
 * Framework-specific landing page for Canadian AI regulation
 */

import { FrameworkLandingPage } from './FrameworkLandingPage';

export default function CanadaAIActPage() {
  return (
    <FrameworkLandingPage
      frameworkId="canada-ai-act"
      frameworkName="Canada AI Act"
      region="Canada"
      description="Master Canada's artificial intelligence regulation. Understand high-risk AI requirements, transparency obligations, and compliance mechanisms for AI systems in Canadian markets."
      deadline="2026-09-30"
      threats={[
        'Administrative monetary penalties up to CAD $15M or 3% of global revenue',
        'Mandatory high-risk AI system registration and documentation',
        'Transparency and disclosure requirements for AI decision-making',
        'Liability and compensation obligations for AI-caused harms',
        'Market access restrictions for non-compliant AI systems',
        'Reputational damage and loss of consumer trust',
      ]}
      keyRequirements={[
        'Identification and classification of high-risk AI systems',
        'Transparency and explainability for AI decision-making',
        'Human oversight and control mechanisms',
        'Bias testing and mitigation requirements',
        'Data governance and quality standards',
        'Incident reporting and documentation',
        'Regular compliance assessments and audits',
      ]}
      trainingModules={[
        {
          title: 'Canada AI Act Essentials',
          description: 'Overview of Canadian AI regulation, high-risk systems, and compliance requirements',
          duration: '2-3 hours',
        },
        {
          title: 'High-Risk AI Requirements',
          description: 'In-depth coverage of high-risk AI systems, transparency, and oversight',
          duration: '3-4 hours',
        },
        {
          title: 'Compliance & Documentation',
          description: 'Practical guidance on documentation, testing, and incident reporting',
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

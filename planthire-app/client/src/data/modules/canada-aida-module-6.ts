import type { QuizQuestion } from '@/types/quiz';

export const canadaAidaModule6Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What are the key steps in implementing AIDA compliance?',
    options: [
      'Only register AI systems with the government',
      'Inventory AI systems, assess risks, implement controls, monitor, and document',
      'Only train employees',
      'Only update privacy policies',
    ],
    correctAnswer: 1,
    explanation: 'AIDA compliance requires a comprehensive approach: inventorying AI systems, assessing risks, implementing appropriate controls, ongoing monitoring, and maintaining thorough documentation.',
  },
  {
    id: 2,
    question: 'How should organizations prioritize AI systems for AIDA compliance?',
    options: [
      'All systems should be treated equally',
      'Based on system cost',
      'Based on risk level and potential impact on individuals',
      'Based on system age',
    ],
    correctAnswer: 2,
    explanation: 'Organizations should prioritize AI systems for compliance based on their risk level and potential impact on individuals, focusing first on high-impact systems that pose the greatest risks.',
  },
  {
    id: 3,
    question: 'What role does change management play in AIDA compliance?',
    options: [
      'Change management is not relevant',
      'Only for major system updates',
      'Critical for ensuring ongoing compliance as AI systems evolve',
      'Only for new AI systems',
    ],
    correctAnswer: 2,
    explanation: 'Change management is critical for AIDA compliance, ensuring that any changes to AI systems are properly assessed for compliance implications and that documentation is updated accordingly.',
  },
  {
    id: 4,
    question: 'How should organizations handle legacy AI systems under AIDA?',
    options: [
      'Legacy systems are exempt',
      'Assess and bring into compliance or decommission if non-compliant',
      'Only document legacy systems',
      'Legacy systems only need annual review',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must assess legacy AI systems against AIDA requirements and either bring them into compliance or decommission them if compliance is not feasible.',
  },
  {
    id: 5,
    question: 'What is the recommended approach to AIDA compliance testing?',
    options: [
      'Testing is not required',
      'Only test before deployment',
      'Regular testing throughout the AI system lifecycle',
      'Only test when problems are reported',
    ],
    correctAnswer: 2,
    explanation: 'AIDA compliance requires regular testing throughout the AI system lifecycle, not just at deployment, to ensure ongoing compliance and identify emerging issues.',
  },
  {
    id: 6,
    question: 'How should organizations document their AIDA compliance efforts?',
    options: [
      'Verbal records are sufficient',
      'Only document major decisions',
      'Comprehensive documentation of all compliance activities, decisions, and rationales',
      'Only document incidents',
    ],
    correctAnswer: 2,
    explanation: 'Organizations should maintain comprehensive documentation of all AIDA compliance activities, including risk assessments, decisions made, rationales, and actions taken.',
  },
  {
    id: 7,
    question: 'What is the role of internal audit in AIDA compliance?',
    options: [
      'Internal audit is not relevant',
      'Only for financial aspects',
      'To independently verify compliance and identify improvement opportunities',
      'Only after regulatory requests',
    ],
    correctAnswer: 2,
    explanation: 'Internal audit plays a crucial role in independently verifying AIDA compliance, identifying gaps, and recommending improvements to the organization\'s AI governance framework.',
  },
  {
    id: 8,
    question: 'How should organizations prepare for AIDA regulatory inspections?',
    options: [
      'No preparation is needed',
      'Only prepare when notified',
      'Maintain ongoing readiness through documentation and regular compliance reviews',
      'Only prepare financial records',
    ],
    correctAnswer: 2,
    explanation: 'Organizations should maintain ongoing readiness for regulatory inspections through comprehensive documentation, regular compliance reviews, and clear processes for responding to inquiries.',
  },
  {
    id: 9,
    question: 'What metrics should organizations track for AIDA compliance?',
    options: [
      'No metrics are needed',
      'Only financial metrics',
      'Risk indicators, bias metrics, incident rates, and compliance status',
      'Only user satisfaction',
    ],
    correctAnswer: 2,
    explanation: 'Organizations should track various metrics including risk indicators, bias metrics, incident rates, compliance status, and other relevant measures to monitor and improve their AIDA compliance.',
  },
  {
    id: 10,
    question: 'How should organizations handle AIDA compliance for AI-as-a-Service providers?',
    options: [
      'The service provider is solely responsible',
      'No compliance requirements for cloud AI',
      'Shared responsibility with clear contractual obligations and oversight',
      'Only the user organization is responsible',
    ],
    correctAnswer: 2,
    explanation: 'AIDA compliance for AI-as-a-Service involves shared responsibility between the provider and user organization, requiring clear contractual obligations and appropriate oversight mechanisms.',
  },
];

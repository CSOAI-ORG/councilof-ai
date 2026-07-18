import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule6Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is a gap analysis in the context of EU AI Act compliance?',
    options: [
      'Identifying differences between planned AI features and actual features',
      'Comparing an organization\'s current state against EU AI Act requirements to identify compliance gaps',
      'Analyzing market gaps where new AI products could be developed',
      'Measuring the speed difference between AI processing times'
    ],
    correctAnswer: 1,
    explanation: 'A gap analysis for EU AI Act compliance involves systematically evaluating an organization\'s existing AI systems and processes against the regulation\'s requirements, identifying what needs to be implemented, updated, or changed to achieve full compliance.'
  },
  {
    id: 2,
    question: 'What documentation is essential for an organization implementing the EU AI Act?',
    options: [
      'Only marketing materials for AI products',
      'Risk assessments, technical documentation, quality management procedures, and compliance mapping for each AI system',
      'Employee vacation schedules and office policies',
      'Historical financial records from the past 20 years'
    ],
    correctAnswer: 1,
    explanation: 'Compliant organizations must maintain comprehensive documentation including risk assessments identifying applicable EU AI Act provisions, technical documentation for high-risk systems, quality management procedures, training records, and compliance mapping linking each AI system to relevant requirements.'
  },
  {
    id: 3,
    question: 'What is a compliance roadmap in the context of EU AI Act implementation?',
    options: [
      'A physical map showing locations of EU regulatory offices',
      'A strategically planned timeline for implementing EU AI Act requirements progressively across an organization',
      'Directions for drivers delivering AI systems',
      'A list of websites where AI products can be purchased'
    ],
    correctAnswer: 1,
    explanation: 'A compliance roadmap outlines the organization\'s implementation strategy, including timelines for addressing specific requirements, prioritizing high-risk systems, assigning responsibilities, allocating resources, and tracking progress toward full EU AI Act compliance.'
  },
  {
    id: 4,
    question: 'Which AI systems are exempt from EU AI Act requirements?',
    options: [
      'All AI systems deployed in the EU must comply with the EU AI Act',
      'AI systems used solely for military purposes or scientific research are fully exempt',
      'Only AI systems used for personal, non-commercial purposes are exempt from the Act',
      'There are no exemptions; every AI system must comply'
    ],
    correctAnswer: 2,
    explanation: 'The EU AI Act applies broadly to AI systems placed on the EU market, but exemptions exist for AI used solely in non-commercial or personal contexts. Military and certain national security AI also have special provisions, but most commercial AI must comply.'
  },
  {
    id: 5,
    question: 'What are General Purpose AI (GPAI) models according to the EU AI Act?',
    options: [
      'AI systems designed for a single, specific task',
      'Large-scale AI models with broad capabilities that can be adapted for multiple downstream applications',
      'AI systems owned by the General Public',
      'Any AI system that operates at high speed'
    ],
    correctAnswer: 1,
    explanation: 'GPAI models are large-scale AI systems like large language models (LLMs) designed with broad capabilities that can be fine-tuned or adapted for various downstream applications. The EU AI Act creates distinct requirements for GPAI model providers.'
  },
  {
    id: 6,
    question: 'What specific obligations apply to General Purpose AI model providers?',
    options: [
      'They must create technical documentation accessible only to the European Commission',
      'They must create detailed technical documentation, design documentation, and respect copyright while building models',
      'GPAI models are completely unregulated by the EU AI Act',
      'They must ensure every downstream application is prohibited'
    ],
    correctAnswer: 1,
    explanation: 'GPAI model providers must provide comprehensive technical documentation, design documentation, and develop mechanisms to ensure respect for copyright and intellectual property. They must also monitor and document identified systemic risks of their models.'
  },
  {
    id: 7,
    question: 'What is a key implementation consideration for organizations deploying high-risk AI systems?',
    options: [
      'High-risk systems can be deployed immediately without prior evaluation',
      'Conducting conformity assessments, establishing quality management systems, and preparing human oversight protocols BEFORE market deployment',
      'Implementing compliance measures only after customers complain about issues',
      'High-risk AI systems require no planning or preparation'
    ],
    correctAnswer: 1,
    explanation: 'Organizations must implement compliance measures proactively before deploying high-risk AI systems, including conformity assessment, quality management system establishment, technical documentation completion, and human oversight mechanisms.'
  },
  {
    id: 8,
    question: 'How should organizations handle legacy AI systems already in operation during the compliance transition period?',
    options: [
      'Legacy systems can continue indefinitely without any updates',
      'All legacy systems must be immediately shut down',
      'Legacy systems must be gradually brought into compliance with a realistic transition timeline aligned with implementation deadlines',
      'Legacy systems are completely exempt from all EU AI Act requirements'
    ],
    correctAnswer: 2,
    explanation: 'The EU AI Act provides transition periods for existing systems. Organizations must develop a transition plan to bring legacy AI systems into compliance within the specified timelines, prioritizing high-risk systems and those causing the greatest compliance gaps.'
  },
  {
    id: 9,
    question: 'What role do internal audits play in EU AI Act compliance?',
    options: [
      'Internal audits are optional and have no compliance value',
      'Regular internal audits verify ongoing compliance, identify new risks, and document adherence to EU AI Act requirements',
      'Only external auditors can audit for compliance; internal audits are not valid',
      'Audits are required only for companies larger than 5000 employees'
    ],
    correctAnswer: 1,
    explanation: 'Internal audits are essential compliance tools that systematically verify adherence to EU AI Act requirements, identify gaps before regulators do, and demonstrate good-faith compliance efforts to authorities. They should be documented and conducted regularly.'
  },
  {
    id: 10,
    question: 'Which of these is NOT a typical component of an EU AI Act compliance implementation program?',
    options: [
      'Conducting gap analyses of current AI systems',
      'Developing or updating quality management systems',
      'Creating a social media marketing strategy for AI products',
      'Establishing technical documentation standards and protocols'
    ],
    correctAnswer: 2,
    explanation: 'While compliance requires gap analysis, quality management, technical documentation, and human oversight protocols, marketing strategy for AI products is not a compliance component. Compliance focuses on legal and operational requirements, not marketing.'
  }
];

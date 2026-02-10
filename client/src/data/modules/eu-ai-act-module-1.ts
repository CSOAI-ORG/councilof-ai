import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'When was the EU AI Act officially published in the Official Journal of the European Union?',
    options: [
      'June 12, 2024',
      'July 12, 2024',
      'August 1, 2024',
      'December 31, 2024',
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act was published in the Official Journal on July 12, 2024, and entered into force 20 days later on August 1, 2024. This marked the beginning of its phased implementation timeline.',
  },
  {
    id: 2,
    question: 'Which of the following is NOT one of the four risk categories in the EU AI Act?',
    options: [
      'Unacceptable Risk (Prohibited)',
      'High Risk',
      'Medium Risk',
      'Limited Risk (Transparency Obligations)',
    ],
    correctAnswer: 2,
    explanation: 'The EU AI Act uses a four-tier risk-based approach: Unacceptable Risk (prohibited), High Risk (strict requirements), Limited Risk (transparency obligations), and Minimal Risk (no obligations). There is no "Medium Risk" category.',
  },
  {
    id: 3,
    question: 'How many prohibited AI practices are explicitly banned under Article 5 of the EU AI Act?',
    options: [
      '4 prohibited practices',
      '6 prohibited practices',
      '8 prohibited practices',
      '10 prohibited practices',
    ],
    correctAnswer: 2,
    explanation: 'Article 5 prohibits 8 specific AI practices, including subliminal manipulation, exploitation of vulnerabilities, social scoring by public authorities, real-time remote biometric identification in public spaces (with exceptions), emotion recognition in workplaces/education, biometric categorization using sensitive attributes, untargeted scraping of facial images, and inferring sensitive attributes.',
  },
  {
    id: 4,
    question: 'What is the maximum fine for deploying a prohibited AI system under the EU AI Act?',
    options: [
      '€10 million or 2% of global annual turnover',
      '€20 million or 4% of global annual turnover',
      '€35 million or 7% of global annual turnover',
      '€50 million or 10% of global annual turnover',
    ],
    correctAnswer: 2,
    explanation: 'The highest penalty tier is €35 million or 7% of global annual turnover (whichever is higher) for deploying prohibited AI systems. This is the most severe penalty category, reflecting the serious nature of these violations.',
  },
  {
    id: 5,
    question: 'Which Annex of the EU AI Act lists the 8 categories of high-risk AI systems?',
    options: [
      'Annex I',
      'Annex II',
      'Annex III',
      'Annex IV',
    ],
    correctAnswer: 2,
    explanation: 'Annex III lists the 8 categories of high-risk AI systems: biometric identification, critical infrastructure, education and vocational training, employment, essential services, law enforcement, migration and border control, and administration of justice. These systems face the strictest compliance requirements.',
  },
  {
    id: 6,
    question: 'What does GPAI stand for in the context of the EU AI Act?',
    options: [
      'General Purpose Artificial Intelligence',
      'Global Public AI Initiative',
      'Government Protected AI',
      'General Practice AI Integration',
    ],
    correctAnswer: 0,
    explanation: 'GPAI stands for General Purpose AI - models trained on large amounts of data that can perform a wide range of tasks. The EU AI Act includes specific provisions for GPAI models, with additional requirements for those with systemic risk.',
  },
  {
    id: 7,
    question: 'Which transparency obligation applies to ALL AI systems that interact with humans?',
    options: [
      'Annual transparency reports',
      'Disclosure that users are interacting with an AI system',
      'Publication of training data sources',
      'Real-time monitoring dashboards',
    ],
    correctAnswer: 1,
    explanation: 'Article 52 requires that when AI systems interact with natural persons, they must be designed to inform users that they are interacting with an AI system, unless this is obvious from the circumstances. This transparency obligation applies to all AI systems, not just high-risk ones.',
  },
  {
    id: 8,
    question: 'When do the prohibitions on unacceptable-risk AI practices take effect?',
    options: [
      'August 1, 2024 (immediately upon entry into force)',
      'February 2, 2025 (6 months after entry into force)',
      'August 2, 2026 (24 months after entry into force)',
      'August 2, 2027 (36 months after entry into force)',
    ],
    correctAnswer: 1,
    explanation: 'Prohibited AI practices (Article 5) must be discontinued by February 2, 2025, which is 6 months after the regulation entered into force. This is the earliest compliance deadline, reflecting the serious nature of these prohibitions.',
  },
  {
    id: 9,
    question: 'What is the role of the European AI Office established under the EU AI Act?',
    options: [
      'To enforce penalties and fines against non-compliant organizations',
      'To coordinate implementation, monitor GPAI models, and support national authorities',
      'To certify all high-risk AI systems before market deployment',
      'To develop AI systems for EU member states',
    ],
    correctAnswer: 1,
    explanation: 'The European AI Office (within the European Commission) coordinates the implementation of the AI Act, monitors GPAI models, maintains the EU database of high-risk AI systems, and supports national competent authorities. It does not directly enforce penalties or certify systems.',
  },
  {
    id: 10,
    question: 'Which of the following is a key benefit of regulatory sandboxes under the EU AI Act?',
    options: [
      'Permanent exemption from all AI Act requirements',
      'Controlled environment to test innovative AI under regulatory supervision',
      'Automatic approval for market deployment',
      'Reduced penalties for non-compliance',
    ],
    correctAnswer: 1,
    explanation: 'Regulatory sandboxes (Article 57) provide a controlled environment where innovative AI systems can be developed and tested under the supervision of competent authorities. They help innovators understand compliance requirements but do not grant exemptions or automatic approvals.',
  },
];

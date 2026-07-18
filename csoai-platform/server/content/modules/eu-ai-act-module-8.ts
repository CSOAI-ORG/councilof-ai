import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule8Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'When did the EU AI Act enter into force?',
    options: [
      'January 1, 2024',
      'August 1, 2024',
      'February 2, 2025',
      'August 2, 2026',
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act entered into force on August 1, 2024, 20 days after its publication in the Official Journal. However, most provisions apply later according to a phased timeline.',
  },
  {
    id: 2,
    question: 'When must prohibited AI practices be discontinued?',
    options: [
      'August 1, 2024 (immediately)',
      'February 2, 2025 (6 months)',
      'August 2, 2026 (24 months)',
      'August 2, 2027 (36 months)',
    ],
    correctAnswer: 1,
    explanation: 'Prohibited AI practices (Article 5) must be discontinued by February 2, 2025, which is 6 months after the Act entered into force. This is the earliest compliance deadline, reflecting the urgency of eliminating unacceptable-risk AI.',
  },
  {
    id: 3,
    question: 'When do GPAI obligations take effect?',
    options: [
      'August 1, 2024',
      'February 2, 2025',
      'August 2, 2025 (12 months)',
      'August 2, 2026',
    ],
    correctAnswer: 2,
    explanation: 'GPAI obligations (Articles 53-56) apply from August 2, 2025, which is 12 months after the Act entered into force. This gives GPAI providers time to implement transparency, documentation, and systemic risk measures.',
  },
  {
    id: 4,
    question: 'When do the main provisions for high-risk AI systems apply?',
    options: [
      'February 2, 2025',
      'August 2, 2025',
      'August 2, 2026 (24 months)',
      'August 2, 2027',
    ],
    correctAnswer: 2,
    explanation: 'The main provisions for high-risk AI systems apply from August 2, 2026, which is 24 months after the Act entered into force. This gives providers time to implement risk management, data governance, and conformity assessment processes.',
  },
  {
    id: 5,
    question: 'What is the maximum penalty for deploying prohibited AI systems?',
    options: [
      '€15 million or 3% of global turnover',
      '€25 million or 5% of global turnover',
      '€35 million or 7% of global turnover',
      '€50 million or 10% of global turnover',
    ],
    correctAnswer: 2,
    explanation: '€35 million or 7% of global annual turnover (whichever is higher) is the maximum penalty for deploying prohibited AI systems. This is the highest penalty tier, reflecting the severity of these violations.',
  },
  {
    id: 6,
    question: 'What is the penalty for non-compliance with high-risk AI obligations?',
    options: [
      '€7.5 million or 1.5% of global turnover',
      '€15 million or 3% of global turnover',
      '€25 million or 5% of global turnover',
      '€35 million or 7% of global turnover',
    ],
    correctAnswer: 1,
    explanation: '€15 million or 3% of global annual turnover (whichever is higher) is the penalty for non-compliance with high-risk AI obligations (risk management, data governance, transparency, human oversight, etc.).',
  },
  {
    id: 7,
    question: 'What is the penalty for providing incorrect or incomplete information to authorities?',
    options: [
      '€5 million or 1% of global turnover',
      '€7.5 million or 1.5% of global turnover',
      '€10 million or 2% of global turnover',
      '€15 million or 3% of global turnover',
    ],
    correctAnswer: 1,
    explanation: '€7.5 million or 1.5% of global annual turnover (whichever is higher) is the penalty for supplying incorrect, incomplete, or misleading information to authorities, or failing to comply with requests for information.',
  },
  {
    id: 8,
    question: 'Can SMEs and startups receive reduced penalties?',
    options: [
      'No, penalties are the same for all companies',
      'Yes, member states must consider proportionality',
      'Yes, but only for first-time violations',
      'No, only non-profits get reductions',
    ],
    correctAnswer: 1,
    explanation: 'Yes, member states must consider the size of the enterprise (especially SMEs and startups) when setting penalties. The goal is to ensure penalties are effective and proportionate without stifling innovation.',
  },
  {
    id: 9,
    question: 'What should organizations do immediately to prepare for compliance?',
    options: [
      'Wait for official guidance',
      'Conduct an AI inventory and risk assessment',
      'Hire more developers',
      'Stop all AI development',
    ],
    correctAnswer: 1,
    explanation: 'Organizations should immediately conduct an AI inventory to identify all AI systems, assess their risk classification, and determine compliance requirements. This forms the foundation for a compliance roadmap.',
  },
  {
    id: 10,
    question: 'Are existing AI systems exempt from the EU AI Act?',
    options: [
      'Yes, only new AI systems must comply',
      'No, existing high-risk AI systems must comply by August 2, 2027',
      'Yes, for 5 years',
      'No, all AI must comply immediately',
    ],
    correctAnswer: 1,
    explanation: 'Existing high-risk AI systems placed on the market before August 2, 2026, must comply by August 2, 2027 (36 months after the Act entered into force). This transition period allows providers to update legacy systems.',
  },
];

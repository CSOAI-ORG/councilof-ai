import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule4Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'How many categories of high-risk AI systems are listed in Annex III?',
    options: [
      '6 categories',
      '8 categories',
      '10 categories',
      '12 categories',
    ],
    correctAnswer: 1,
    explanation: 'Annex III lists 8 categories of high-risk AI systems: biometric identification, critical infrastructure, education and vocational training, employment, essential services, law enforcement, migration and border control, and administration of justice.',
  },
  {
    id: 2,
    question: 'Which biometric AI system is considered high-risk?',
    options: [
      'Fingerprint unlock on smartphones',
      'Remote biometric identification for law enforcement',
      'Face filters on social media',
      'Voice assistants',
    ],
    correctAnswer: 1,
    explanation: 'Remote biometric identification systems intended for law enforcement are high-risk (Annex III, Category 1). Personal biometric systems like smartphone unlocking are not high-risk because they don\'t pose the same fundamental rights concerns.',
  },
  {
    id: 3,
    question: 'AI systems managing critical infrastructure in which sector are considered high-risk?',
    options: [
      'Entertainment venues',
      'Road traffic and water/gas/electricity supply',
      'Retail stores',
      'Office buildings',
    ],
    correctAnswer: 1,
    explanation: 'AI systems used as safety components in managing road traffic and the supply of water, gas, heating, and electricity are high-risk (Annex III, Category 2) because failures could endanger public safety and essential services.',
  },
  {
    id: 4,
    question: 'Which educational AI application is considered high-risk?',
    options: [
      'AI-powered spell checkers',
      'AI systems determining access to educational institutions or evaluating learning outcomes',
      'AI-generated study materials',
      'AI-powered language learning apps',
    ],
    correctAnswer: 1,
    explanation: 'AI systems that determine access to educational institutions, evaluate learning outcomes, or assess students are high-risk (Annex III, Category 3) because they significantly impact educational opportunities and future prospects.',
  },
  {
    id: 5,
    question: 'What makes an AI recruitment system high-risk?',
    options: [
      'It automates job postings',
      'It makes decisions affecting hiring, promotion, or termination',
      'It schedules interviews',
      'It sends automated email responses',
    ],
    correctAnswer: 1,
    explanation: 'AI systems used for recruitment, making decisions on promotion/termination, task allocation, or monitoring/evaluating workers are high-risk (Annex III, Category 4) because they significantly impact employment opportunities and working conditions.',
  },
  {
    id: 6,
    question: 'Can an AI system be high-risk even if it only assists human decision-makers?',
    options: [
      'No, only fully automated systems are high-risk',
      'Yes, if it significantly influences the outcome',
      'No, human oversight eliminates high-risk classification',
      'Yes, but only in law enforcement',
    ],
    correctAnswer: 1,
    explanation: 'Yes, AI systems that significantly influence the outcome of decisions are high-risk even if humans make the final decision. The key is whether the AI system materially impacts the decision-making process in a high-risk area.',
  },
  {
    id: 7,
    question: 'Which of the following is NOT a high-risk AI system in education?',
    options: [
      'AI for exam proctoring and plagiarism detection',
      'AI for determining admission to universities',
      'AI for recommending study resources',
      'AI for evaluating student performance',
    ],
    correctAnswer: 2,
    explanation: 'AI systems that merely recommend study resources are not high-risk because they don\'t determine access to education or evaluate learning outcomes. High-risk educational AI makes decisions that significantly impact educational opportunities.',
  },
  {
    id: 8,
    question: 'What is required for high-risk AI systems before they can be placed on the market?',
    options: [
      'Only registration with authorities',
      'Conformity assessment and CE marking',
      'User consent forms',
      'Annual audits',
    ],
    correctAnswer: 1,
    explanation: 'High-risk AI systems must undergo conformity assessment (either self-assessment or third-party assessment depending on the system) and receive CE marking before being placed on the EU market. This ensures compliance with all requirements.',
  },
  {
    id: 9,
    question: 'Can AI systems for worker monitoring be considered high-risk?',
    options: [
      'No, workplace monitoring is not covered',
      'Yes, if they evaluate or affect workers\' rights',
      'Only if they monitor remote workers',
      'Only if they use biometric data',
    ],
    correctAnswer: 1,
    explanation: 'AI systems for monitoring and evaluating workers\' performance and behavior are high-risk (Annex III, Category 4) because they can affect working conditions, job security, and workers\' rights. This includes productivity monitoring and behavior analysis.',
  },
  {
    id: 10,
    question: 'What happens if a provider believes their AI system should not be classified as high-risk?',
    options: [
      'They can self-certify as non-high-risk',
      'They must still comply until authorities agree',
      'They can deploy it without restrictions',
      'They must wait for EU-wide guidance',
    ],
    correctAnswer: 1,
    explanation: 'If a provider believes their AI system falls outside Annex III scope, they should consult national authorities. However, they must comply with high-risk requirements until authorities confirm the classification. Unilateral reclassification is not permitted.',
  },
];

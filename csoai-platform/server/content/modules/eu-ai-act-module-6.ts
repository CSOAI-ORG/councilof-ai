import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule6Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'How many key obligations do providers of high-risk AI systems have?',
    options: [
      '8 obligations',
      '10 obligations',
      '12 obligations',
      '15 obligations',
    ],
    correctAnswer: 2,
    explanation: 'Providers of high-risk AI systems have 12 key obligations under Articles 9-17, including establishing a risk management system, data governance, technical documentation, logging, transparency, human oversight, accuracy, robustness, and cybersecurity.',
  },
  {
    id: 2,
    question: 'What is the first step providers must take for high-risk AI systems?',
    options: [
      'Market the product',
      'Establish a risk management system',
      'Hire a compliance officer',
      'Register with authorities',
    ],
    correctAnswer: 1,
    explanation: 'Establishing a risk management system is the foundational requirement (Article 9). It must be continuous, iterative, and cover the entire AI system lifecycle, identifying and mitigating risks to health, safety, and fundamental rights.',
  },
  {
    id: 3,
    question: 'What must providers ensure about training data for high-risk AI systems?',
    options: [
      'It must be free',
      'It must be relevant, representative, and free of errors',
      'It must be collected directly by the provider',
      'It must be approved by regulators',
    ],
    correctAnswer: 1,
    explanation: 'Article 10 requires training, validation, and testing datasets to be relevant, sufficiently representative, and free of errors and biases. Providers must examine data for possible biases and implement data governance practices.',
  },
  {
    id: 4,
    question: 'How long must providers retain logs for high-risk AI systems?',
    options: [
      '6 months',
      '1 year',
      'At least 6 months or as required by applicable law',
      '5 years',
    ],
    correctAnswer: 2,
    explanation: 'Article 12 requires automatic logging capabilities with logs retained for at least 6 months (or longer if required by applicable law). Logs must enable traceability of the AI system\'s functioning and facilitate post-market monitoring.',
  },
  {
    id: 5,
    question: 'What information must providers give to deployers of high-risk AI systems?',
    options: [
      'Only the price',
      'Instructions for use with clear information about capabilities, limitations, and risks',
      'Just the technical specifications',
      'Only warranty information',
    ],
    correctAnswer: 1,
    explanation: 'Article 13 requires providers to supply clear instructions for use, including the AI system\'s intended purpose, capabilities, limitations, expected accuracy, robustness, cybersecurity measures, and known risks. This enables deployers to use the system correctly.',
  },
  {
    id: 6,
    question: 'What must deployers do before putting a high-risk AI system into use?',
    options: [
      'Nothing, providers handle everything',
      'Conduct input data checks and ensure human oversight',
      'Only train users',
      'Register with local authorities',
    ],
    correctAnswer: 1,
    explanation: 'Article 26 requires deployers to ensure input data is relevant to the intended purpose, assign human oversight, monitor the AI system\'s operation, and keep logs. Deployers must also conduct fundamental rights impact assessments for high-risk systems.',
  },
  {
    id: 7,
    question: 'Who is responsible if a deployer modifies a high-risk AI system?',
    options: [
      'The original provider remains responsible',
      'The deployer becomes the provider and assumes all obligations',
      'No one is responsible',
      'Shared responsibility between both parties',
    ],
    correctAnswer: 1,
    explanation: 'If a deployer makes substantial modifications to a high-risk AI system, they become the provider and must assume all provider obligations, including conformity assessment, technical documentation, and CE marking.',
  },
  {
    id: 8,
    question: 'What must providers do if they discover their high-risk AI system is non-compliant?',
    options: [
      'Continue selling and fix it later',
      'Immediately take corrective action and inform authorities and deployers',
      'Wait for authorities to discover it',
      'Only inform customers',
    ],
    correctAnswer: 1,
    explanation: 'Article 20 requires providers to immediately take corrective action if they become aware of non-compliance or serious incidents. They must inform national authorities, notified bodies, and deployers, and cooperate with authorities.',
  },
  {
    id: 9,
    question: 'Are deployers required to report serious incidents?',
    options: [
      'No, only providers report incidents',
      'Yes, deployers must report serious incidents to providers and authorities',
      'Only if the incident causes death',
      'Only for public sector deployers',
    ],
    correctAnswer: 1,
    explanation: 'Article 26 requires deployers to report serious incidents and malfunctions to the provider and national authorities. This ensures rapid response to safety issues and enables authorities to take appropriate action.',
  },
  {
    id: 10,
    question: 'What is a "serious incident" under the EU AI Act?',
    options: [
      'Any technical error',
      'An incident leading to death, serious health damage, or serious fundamental rights violations',
      'Any user complaint',
      'System downtime',
    ],
    correctAnswer: 1,
    explanation: 'A serious incident is any incident that directly or indirectly leads to death, serious damage to health, serious and irreversible disruption of critical infrastructure, or serious infringement of fundamental rights protected by EU law.',
  },
];

import type { QuizQuestion } from '@/types/quiz';

export const tc260Module3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary focus of TC260 data governance requirements for AI?',
    options: [
      'Maximizing data collection',
      'Ensuring data quality, security, and lawful processing',
      'Eliminating all data usage',
      'Selling data to third parties',
    ],
    correctAnswer: 1,
    explanation: 'TC260 data governance focuses on ensuring data quality for AI training, security throughout the data lifecycle, and lawful processing in compliance with Chinese data protection laws.',
  },
  {
    id: 2,
    question: 'How does TC260 address the use of personal information in AI training?',
    options: [
      'No restrictions',
      'Requires legal basis, minimization, and purpose limitation',
      'Prohibits all use of personal data',
      'Only allows anonymized data',
    ],
    correctAnswer: 1,
    explanation: 'TC260 aligns with PIPL (Personal Information Protection Law) requirements, mandating a legal basis for processing, data minimization, and purpose limitation for AI training data.',
  },
  {
    id: 3,
    question: 'What is required for AI training data quality under TC260?',
    options: [
      'No quality requirements',
      'Data accuracy, completeness, timeliness, and bias assessment',
      'Only quantity matters',
      'Any data source is acceptable',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires assessment of training data quality including accuracy, completeness, timeliness, and potential biases that could affect AI system outputs.',
  },
  {
    id: 4,
    question: 'How does TC260 handle sensitive personal information used in AI?',
    options: [
      'No special treatment',
      'Enhanced protection including explicit consent and security measures',
      'Complete prohibition',
      'Same as regular data',
    ],
    correctAnswer: 1,
    explanation: 'Sensitive personal information (biometric, health, financial, etc.) requires enhanced protections under TC260, including explicit consent, additional security measures, and impact assessments.',
  },
  {
    id: 5,
    question: 'What data localization requirements apply to AI systems under TC260?',
    options: [
      'No localization requirements',
      'Critical and personal data must be stored in China with security assessment for transfers',
      'All data must leave China',
      'Only financial data is restricted',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires that critical infrastructure operators and processors of large amounts of personal data store data in China, with security assessments required for any cross-border transfers.',
  },
  {
    id: 6,
    question: 'How does TC260 address data security for AI systems?',
    options: [
      'Optional security measures',
      'Mandatory security classification, access controls, and encryption requirements',
      'Security is not addressed',
      'Only physical security matters',
    ],
    correctAnswer: 1,
    explanation: 'TC260 mandates data security classification, appropriate access controls, encryption for sensitive data, and security monitoring throughout the AI data lifecycle.',
  },
  {
    id: 7,
    question: 'What is required for AI data annotation under TC260?',
    options: [
      'No requirements',
      'Quality controls, annotator training, and documentation',
      'Only automated annotation allowed',
      'Annotation is prohibited',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires quality controls for data annotation processes, including annotator training, consistency checks, and documentation of annotation guidelines and procedures.',
  },
  {
    id: 8,
    question: 'How does TC260 address third-party data sources for AI training?',
    options: [
      'No restrictions on sources',
      'Due diligence on data provenance and lawful acquisition',
      'Only government data allowed',
      'All third-party data prohibited',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires due diligence when using third-party data sources, including verification of lawful data acquisition and appropriate rights for AI training purposes.',
  },
  {
    id: 9,
    question: 'What data retention requirements apply to AI systems under TC260?',
    options: [
      'Keep all data indefinitely',
      'Retention limited to necessary period with secure deletion',
      'Delete immediately after training',
      'No retention rules',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires that data be retained only as long as necessary for the stated purposes, with secure deletion procedures when data is no longer required.',
  },
  {
    id: 10,
    question: 'How does TC260 address synthetic data generation for AI?',
    options: [
      'Not addressed',
      'Permitted with controls to prevent disclosure of source data characteristics',
      'Completely prohibited',
      'No restrictions',
    ],
    correctAnswer: 1,
    explanation: 'TC260 permits synthetic data generation for AI training but requires controls to ensure the synthetic data does not inadvertently reveal characteristics of the underlying source data.',
  },
];

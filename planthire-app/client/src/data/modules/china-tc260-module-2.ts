import type { QuizQuestion } from '@/types/quiz';

export const chinaTc260Module2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the purpose of China\'s AI security assessment requirements?',
    options: [
      'Only to approve AI for export',
      'To evaluate risks to national security, public interest, and individual rights',
      'Only for military AI',
      'Only for foreign AI systems',
    ],
    correctAnswer: 1,
    explanation: 'China\'s AI security assessments evaluate risks to national security, public interest, and individual rights, ensuring AI systems meet safety and security requirements before deployment.',
  },
  {
    id: 2,
    question: 'What types of AI systems require security assessment in China?',
    options: [
      'All AI systems',
      'AI systems that may affect national security, public interest, or process large amounts of personal data',
      'Only government AI',
      'Only AI from foreign companies',
    ],
    correctAnswer: 1,
    explanation: 'AI systems that may affect national security, public interest, or process large amounts of personal data require security assessment under Chinese regulations.',
  },
  {
    id: 3,
    question: 'What is the role of algorithm filing in China\'s AI governance?',
    options: [
      'Algorithm filing is optional',
      'Mandatory registration of certain algorithms with regulatory authorities',
      'Only for recommendation algorithms',
      'Only for AI startups',
    ],
    correctAnswer: 1,
    explanation: 'China requires mandatory filing (registration) of certain algorithms with regulatory authorities, enabling oversight and ensuring compliance with content and safety requirements.',
  },
  {
    id: 4,
    question: 'How does China address AI bias and discrimination?',
    options: [
      'Bias is not addressed',
      'Requirements to prevent discrimination and ensure fair treatment in AI systems',
      'Only racial bias is addressed',
      'Bias is only addressed for government AI',
    ],
    correctAnswer: 1,
    explanation: 'Chinese AI regulations include requirements to prevent discrimination and ensure fair treatment, prohibiting AI systems from unfairly discriminating against users.',
  },
  {
    id: 5,
    question: 'What are the data security requirements for AI systems in China?',
    options: [
      'No specific data security requirements',
      'Comprehensive requirements including data localization, security measures, and cross-border transfer restrictions',
      'Only encryption is required',
      'Only government data is protected',
    ],
    correctAnswer: 1,
    explanation: 'China has comprehensive data security requirements for AI systems, including data localization for certain data types, security measures, and restrictions on cross-border data transfers.',
  },
  {
    id: 6,
    question: 'What is the Data Security Law\'s relevance to AI?',
    options: [
      'Not relevant to AI',
      'Governs data processing in AI systems, including classification and protection requirements',
      'Only applies to government data',
      'Only applies to foreign companies',
    ],
    correctAnswer: 1,
    explanation: 'The Data Security Law governs data processing in AI systems, establishing data classification requirements, protection obligations, and rules for important and core data.',
  },
  {
    id: 7,
    question: 'How does China regulate AI training data?',
    options: [
      'Training data is unregulated',
      'Requirements for data quality, legality, and compliance with content regulations',
      'Only personal data is regulated',
      'Training data regulations only apply to generative AI',
    ],
    correctAnswer: 1,
    explanation: 'China regulates AI training data through requirements for data quality, ensuring data is obtained legally, and compliance with content regulations to prevent harmful outputs.',
  },
  {
    id: 8,
    question: 'What security measures are required for AI systems in China?',
    options: [
      'No specific measures required',
      'Technical and organizational measures including access controls, monitoring, and incident response',
      'Only encryption',
      'Only physical security',
    ],
    correctAnswer: 1,
    explanation: 'Chinese regulations require comprehensive security measures for AI systems, including technical controls, access management, continuous monitoring, and incident response capabilities.',
  },
  {
    id: 9,
    question: 'How does China address AI system vulnerabilities?',
    options: [
      'Vulnerabilities are not addressed',
      'Requirements for vulnerability management, testing, and timely remediation',
      'Only critical vulnerabilities matter',
      'Vulnerabilities are only relevant for government AI',
    ],
    correctAnswer: 1,
    explanation: 'Chinese regulations require organizations to manage AI system vulnerabilities through regular testing, timely remediation, and reporting of significant security issues.',
  },
  {
    id: 10,
    question: 'What is required for AI systems processing important data in China?',
    options: [
      'No special requirements',
      'Enhanced security measures, risk assessments, and potential government review',
      'Only encryption',
      'Only data localization',
    ],
    correctAnswer: 1,
    explanation: 'AI systems processing important data face enhanced requirements including stronger security measures, mandatory risk assessments, and potential government security reviews.',
  },
];

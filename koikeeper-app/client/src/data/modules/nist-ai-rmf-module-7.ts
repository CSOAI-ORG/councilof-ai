import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule7Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'Which of the following best describes the purpose of the GOVERN function?',
    options: [
      'To measure AI system performance',
      'To identify and assess AI risks',
      'To establish organizational structures and policies for managing AI risk',
      'To implement technical controls on AI systems',
    ],
    correctAnswer: 2,
    explanation: 'GOVERN establishes the organizational foundation including governance structures, roles and responsibilities, policies, and culture needed to support effective AI risk management throughout the organization.',
  },
  {
    id: 2,
    question: 'What is the relationship between MAP and MEASURE functions?',
    options: [
      'MAP and MEASURE are the same function',
      'MAP identifies and characterizes risks; MEASURE quantifies and evaluates those risks through testing and metrics',
      'MEASURE comes before MAP',
      'They are independent and unrelated',
    ],
    correctAnswer: 1,
    explanation: 'MAP focuses on identifying, characterizing, and understanding risks. MEASURE builds on this foundation by quantifying and assessing the severity and probability of those identified risks.',
  },
  {
    id: 3,
    question: 'In the context of NIST AI RMF, what does "fairness" refer to?',
    options: [
      'How much users like the AI system',
      'The ethical principle that AI systems should not discriminate or produce disparate impacts on different demographic groups',
      'The speed at which the system makes decisions',
      'The cost of the AI system',
    ],
    correctAnswer: 1,
    explanation: 'Fairness in the NIST AI RMF context means ensuring that AI systems do not systematically disadvantage or discriminate against individuals or groups based on protected characteristics.',
  },
  {
    id: 4,
    question: 'What is meant by "explainability" in AI systems?',
    options: [
      'How quickly the system trains',
      'The ability to understand and interpret how the AI system makes decisions and reaches conclusions',
      'The documentation of the code',
      'The user interface design',
    ],
    correctAnswer: 1,
    explanation: 'Explainability refers to the degree to which a person can understand why an AI system made a particular decision. This is especially important for high-stakes applications.',
  },
  {
    id: 5,
    question: 'How does privacy relate to AI risk management?',
    options: [
      'Privacy is not relevant to AI systems',
      'Privacy risks include unauthorized access to personal data, data breaches, and inappropriate use of sensitive information in AI systems',
      'Privacy only applies to non-AI systems',
      'AI systems automatically protect privacy',
    ],
    correctAnswer: 1,
    explanation: 'Privacy risks are significant in AI systems, particularly when they process personal data. Risk management must address data protection, consent, access controls, and compliance with privacy regulations.',
  },
  {
    id: 6,
    question: 'What is meant by "security" in the context of AI risk management?',
    options: [
      'Only physical security of server rooms',
      'Protection against adversarial attacks, unauthorized modifications of models, data breaches, and exploitation of AI systems',
      'Security only applies to traditional IT systems',
      'AI systems do not need security measures',
    ],
    correctAnswer: 1,
    explanation: 'AI security encompasses protecting models from adversarial attacks, ensuring data integrity, preventing unauthorized modification, defending against model theft, and safeguarding the entire AI supply chain.',
  },
  {
    id: 7,
    question: 'Which key regulatory framework influences AI governance in the United States?',
    options: [
      'There are no US regulations affecting AI',
      'Multiple regulatory approaches including sector-specific laws, the Executive Order on AI, and various agency guidance documents',
      'A single unified AI law applies everywhere',
      'Only industry self-regulation exists',
    ],
    correctAnswer: 1,
    explanation: 'The US regulatory landscape for AI includes sector-specific regulations (healthcare, finance, defense), Executive Orders, FTC guidance, EEOC enforcement on discrimination, and emerging state and local laws.',
  },
  {
    id: 8,
    question: 'What is the significance of "cross-cutting concepts" in the NIST AI RMF?',
    options: [
      'Cross-cutting concepts are not important',
      'They are principles like fairness, transparency, privacy, and security that apply across all four functions and all stages of the AI lifecycle',
      'They only apply to the GOVERN function',
      'They are specific to individual use cases',
    ],
    correctAnswer: 1,
    explanation: 'Cross-cutting concepts represent fundamental principles that must be considered throughout the AI lifecycle and across all four RMF functions, not just in isolation.',
  },
  {
    id: 9,
    question: 'What should an organization do if they identify a critical AI risk during the MEASURE function?',
    options: [
      'Ignore the risk',
      'Document it and decide whether to accept, mitigate, transfer, or avoid the risk based on organizational tolerance',
      'Always avoid deploying the system',
      'Never deploy any AI systems',
    ],
    correctAnswer: 1,
    explanation: 'When risks are identified, organizations should assess them against their risk tolerance. Some risks warrant mitigation measures; others may be accepted, transferred, or may lead to avoiding the AI project entirely.',
  },
  {
    id: 10,
    question: 'Which statement best summarizes the NIST AI RMF approach to responsible AI?',
    options: [
      'AI systems should never be deployed',
      'A comprehensive, flexible, and systematic approach to managing AI risks by establishing governance, mapping risks, measuring them, and managing responses throughout the AI lifecycle',
      'Only developers need to understand risk management',
      'Risk management should happen only after deployment',
    ],
    correctAnswer: 1,
    explanation: 'The NIST AI RMF provides a holistic framework for managing AI risks from conception through retirement, involving multiple organizational functions, and emphasizing continuous monitoring and improvement.',
  },
];

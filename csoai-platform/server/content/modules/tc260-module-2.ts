import type { QuizQuestion } from '@/types/quiz';

export const tc260Module2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the core classification approach used in TC260 for AI systems?',
    options: [
      'Single-tier classification',
      'Multi-level classification based on risk and impact',
      'No classification system',
      'Classification by company size only',
    ],
    correctAnswer: 1,
    explanation: 'TC260 uses a multi-level classification approach that categorizes AI systems based on their risk level, potential societal impact, and the sensitivity of domains they operate in.',
  },
  {
    id: 2,
    question: 'Which factor is NOT considered in TC260 AI risk classification?',
    options: [
      'Data sensitivity',
      'Impact on individuals and society',
      'The nationality of the AI developer',
      'Autonomous decision-making capability',
    ],
    correctAnswer: 2,
    explanation: 'TC260 risk classification focuses on technical and impact factors such as data sensitivity, societal impact, and autonomous capabilities, rather than the nationality of developers.',
  },
  {
    id: 3,
    question: 'What does TC260 require for high-risk AI applications?',
    options: [
      'No special requirements',
      'Enhanced security assessments and ongoing monitoring',
      'Only annual reviews',
      'Self-certification only',
    ],
    correctAnswer: 1,
    explanation: 'High-risk AI applications under TC260 require enhanced security assessments, algorithm impact evaluations, human oversight mechanisms, and ongoing monitoring throughout their lifecycle.',
  },
  {
    id: 4,
    question: 'How does TC260 categorize generative AI services?',
    options: [
      'As low-risk by default',
      'As requiring special governance due to content generation capabilities',
      'As exempt from all regulations',
      'As identical to traditional software',
    ],
    correctAnswer: 1,
    explanation: 'TC260 categorizes generative AI services as requiring special governance measures due to their ability to generate text, images, and other content that may have significant societal impact.',
  },
  {
    id: 5,
    question: 'What is required for AI systems used in public services under TC260?',
    options: [
      'No additional requirements',
      'Security review, fairness assessment, and accessibility considerations',
      'Only cost-benefit analysis',
      'International certification only',
    ],
    correctAnswer: 1,
    explanation: 'AI systems used in public services require security reviews, fairness assessments to prevent discrimination, and accessibility considerations to ensure equitable access.',
  },
  {
    id: 6,
    question: 'How does TC260 address AI systems that make automated decisions affecting individuals?',
    options: [
      'No specific provisions',
      'Requires human oversight and right to human review',
      'Allows fully automated decisions without limits',
      'Prohibits all automated decisions',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires that AI systems making automated decisions affecting individuals incorporate human oversight mechanisms and provide individuals with the right to request human review of significant decisions.',
  },
  {
    id: 7,
    question: 'What documentation is required for AI system classification under TC260?',
    options: [
      'No documentation needed',
      'System description, risk assessment, and mitigation measures',
      'Only user manuals',
      'Financial statements only',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires comprehensive documentation including system descriptions, risk assessments, intended use cases, data handling practices, and mitigation measures for identified risks.',
  },
  {
    id: 8,
    question: 'Which category of AI applications faces the strictest requirements under TC260?',
    options: [
      'Entertainment applications',
      'AI affecting national security, critical infrastructure, or mass public opinion',
      'Personal productivity tools',
      'Gaming applications',
    ],
    correctAnswer: 1,
    explanation: 'AI applications affecting national security, critical infrastructure, or capable of influencing mass public opinion face the strictest requirements, including mandatory security assessments and government review.',
  },
  {
    id: 9,
    question: 'How does TC260 handle AI systems that evolve through machine learning?',
    options: [
      'Ignores post-deployment changes',
      'Requires ongoing monitoring and re-assessment as capabilities change',
      'Allows unlimited changes without review',
      'Prohibits all model updates',
    ],
    correctAnswer: 1,
    explanation: 'TC260 recognizes that AI systems evolve and requires ongoing monitoring, with re-assessment requirements when significant changes occur in system capabilities or risk profiles.',
  },
  {
    id: 10,
    question: 'What is the TC260 approach to AI systems operating in multiple risk categories?',
    options: [
      'Apply the lowest applicable requirements',
      'Apply the highest applicable requirements',
      'Average the requirements',
      'Exempt from all requirements',
    ],
    correctAnswer: 1,
    explanation: 'When AI systems operate across multiple risk categories, TC260 requires applying the highest applicable requirements to ensure adequate protection across all use cases.',
  },
];

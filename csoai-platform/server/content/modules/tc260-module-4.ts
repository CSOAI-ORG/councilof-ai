import type { QuizQuestion } from '@/types/quiz';

export const tc260Module4Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary goal of TC260 algorithm security requirements?',
    options: [
      'Maximizing algorithm speed',
      'Ensuring algorithm safety, reliability, and controllability',
      'Protecting algorithm trade secrets only',
      'Eliminating all algorithms',
    ],
    correctAnswer: 1,
    explanation: 'TC260 algorithm security requirements focus on ensuring that AI algorithms are safe, reliable, controllable, and do not produce harmful or discriminatory outputs.',
  },
  {
    id: 2,
    question: 'What does TC260 require for algorithmic recommendation systems?',
    options: [
      'No specific requirements',
      'Algorithm registration, transparency, and user control options',
      'Complete algorithm disclosure',
      'Prohibition of all recommendations',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires algorithmic recommendation systems to be registered with authorities, provide transparency about recommendation logic, and give users control options including opt-out.',
  },
  {
    id: 3,
    question: 'How does TC260 address algorithmic discrimination?',
    options: [
      'Not addressed',
      'Prohibits unreasonable differential treatment and requires fairness testing',
      'Allows all forms of differentiation',
      'Only addresses pricing discrimination',
    ],
    correctAnswer: 1,
    explanation: 'TC260 prohibits unreasonable algorithmic discrimination, requiring organizations to conduct fairness testing and ensure algorithms do not unfairly disadvantage individuals or groups.',
  },
  {
    id: 4,
    question: 'What algorithm testing is required under TC260?',
    options: [
      'No testing required',
      'Pre-deployment testing for safety, accuracy, and bias',
      'Only speed testing',
      'Post-deployment testing only',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires comprehensive pre-deployment testing including safety assessments, accuracy validation, bias detection, and testing for potential harmful outputs.',
  },
  {
    id: 5,
    question: 'How does TC260 handle algorithm updates and modifications?',
    options: [
      'No restrictions on updates',
      'Requires impact assessment and re-testing for significant changes',
      'Prohibits all updates',
      'Only allows annual updates',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires that significant algorithm modifications undergo impact assessment and re-testing to ensure updates do not introduce new risks or degrade safety properties.',
  },
  {
    id: 6,
    question: 'What algorithm documentation is required by TC260?',
    options: [
      'No documentation needed',
      'Algorithm design, training methodology, and risk assessment documentation',
      'Only user manuals',
      'Financial documentation only',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires comprehensive algorithm documentation including design rationale, training methodology, testing results, identified risks, and mitigation measures.',
  },
  {
    id: 7,
    question: 'How does TC260 address model robustness and adversarial attacks?',
    options: [
      'Not considered',
      'Requires robustness testing and defenses against adversarial manipulation',
      'Assumes all models are robust',
      'Only addresses physical attacks',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires assessment of model robustness, testing against adversarial inputs, and implementation of appropriate defenses to prevent malicious manipulation of AI systems.',
  },
  {
    id: 8,
    question: 'What requirements apply to deep learning models under TC260?',
    options: [
      'Same as traditional software',
      'Additional interpretability and testing requirements',
      'Exempt from all requirements',
      'Only performance requirements',
    ],
    correctAnswer: 1,
    explanation: 'Deep learning models face additional requirements under TC260, including enhanced interpretability measures, more extensive testing, and specific documentation of model architecture and training.',
  },
  {
    id: 9,
    question: 'How does TC260 address algorithm explainability?',
    options: [
      'Not required',
      'Appropriate explainability based on application context and user needs',
      'Full technical disclosure required',
      'No explanation ever permitted',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires appropriate explainability based on context, with higher-stakes applications requiring more detailed explanations while protecting legitimate trade secrets.',
  },
  {
    id: 10,
    question: 'What is required for algorithm audit trails under TC260?',
    options: [
      'No logging required',
      'Logging of algorithm decisions, inputs, and outputs for accountability',
      'Only error logging',
      'Logging prohibited for privacy',
    ],
    correctAnswer: 1,
    explanation: 'TC260 requires maintaining audit trails of algorithm decisions, including inputs, outputs, and decision rationale, to support accountability and incident investigation.',
  },
];

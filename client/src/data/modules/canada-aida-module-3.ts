import type { QuizQuestion } from '@/types/quiz';

export const canadaAidaModule3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What transparency requirements does AIDA impose on high-impact AI systems?',
    options: [
      'No transparency requirements',
      'Only internal documentation',
      'Public disclosure of AI system use and plain language explanations',
      'Only technical documentation for developers',
    ],
    correctAnswer: 2,
    explanation: 'AIDA requires organizations to provide transparency about their use of high-impact AI systems, including plain language explanations of how the systems work and how decisions are made.',
  },
  {
    id: 2,
    question: 'When must individuals be informed that an AI system is being used to make decisions about them?',
    options: [
      'Never',
      'Only after the decision is made',
      'Before or at the time the AI system is used',
      'Only if they specifically ask',
    ],
    correctAnswer: 2,
    explanation: 'AIDA requires that individuals be informed before or at the time a high-impact AI system is used to make decisions about them, ensuring they are aware of AI involvement in the process.',
  },
  {
    id: 3,
    question: 'What information must be provided in a plain language explanation under AIDA?',
    options: [
      'Only the AI system\'s name',
      'Technical specifications only',
      'How the system works, what factors it considers, and how decisions are made',
      'Only the developer\'s contact information',
    ],
    correctAnswer: 2,
    explanation: 'Plain language explanations must describe how the AI system works, what factors it considers in making decisions, and how those decisions are reached, in terms understandable to the general public.',
  },
  {
    id: 4,
    question: 'How does AIDA address algorithmic explainability?',
    options: [
      'Explainability is not required',
      'Only technical experts need to understand the algorithm',
      'Organizations must be able to explain AI decisions in understandable terms',
      'Explainability only applies to government AI systems',
    ],
    correctAnswer: 2,
    explanation: 'AIDA requires organizations to be able to explain how their AI systems reach decisions in terms that affected individuals can understand, promoting algorithmic accountability.',
  },
  {
    id: 5,
    question: 'What rights do individuals have regarding AI-made decisions under AIDA?',
    options: [
      'No rights to challenge decisions',
      'Right to explanation and potentially to challenge or appeal decisions',
      'Only the right to opt out of AI processing',
      'Only the right to see their data',
    ],
    correctAnswer: 1,
    explanation: 'AIDA provides individuals with the right to receive explanations about AI-made decisions and, in many cases, the right to challenge or appeal those decisions through appropriate mechanisms.',
  },
  {
    id: 6,
    question: 'What is the purpose of maintaining an AI system registry under AIDA?',
    options: [
      'To track AI system sales',
      'To enable public oversight and accountability of high-impact AI systems',
      'To collect taxes on AI systems',
      'To limit AI development',
    ],
    correctAnswer: 1,
    explanation: 'The AI system registry enables public oversight and accountability by providing information about high-impact AI systems in use, supporting transparency and informed public discourse.',
  },
  {
    id: 7,
    question: 'How should organizations communicate AI system limitations to users?',
    options: [
      'Limitations should not be disclosed',
      'Only in technical documentation',
      'Clearly and prominently, in plain language',
      'Only to regulators',
    ],
    correctAnswer: 2,
    explanation: 'Organizations must clearly and prominently communicate AI system limitations to users in plain language, ensuring users understand what the system can and cannot do.',
  },
  {
    id: 8,
    question: 'What role does consent play in AIDA\'s transparency framework?',
    options: [
      'Consent is not relevant to AIDA',
      'Consent alone is sufficient for compliance',
      'Transparency must be provided regardless of consent, though consent may be required for certain uses',
      'Consent replaces all transparency requirements',
    ],
    correctAnswer: 2,
    explanation: 'While consent may be required for certain AI system uses, transparency requirements apply regardless of consent. Organizations cannot avoid transparency obligations simply by obtaining consent.',
  },
  {
    id: 9,
    question: 'How does AIDA address AI systems that make automated decisions without human review?',
    options: [
      'Fully automated decisions are prohibited',
      'No special requirements for automated decisions',
      'Additional transparency and accountability measures are required',
      'Automated decisions are only allowed in healthcare',
    ],
    correctAnswer: 2,
    explanation: 'AIDA imposes additional transparency and accountability measures on AI systems that make automated decisions without human review, recognizing the increased risks of such systems.',
  },
  {
    id: 10,
    question: 'What must organizations do to ensure AI system transparency is accessible?',
    options: [
      'Only provide information in English',
      'Provide information in multiple formats and languages as appropriate',
      'Only provide information online',
      'Only provide information upon written request',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must ensure transparency information is accessible to all affected individuals, which may include providing information in multiple formats and languages as appropriate for the audience.',
  },
];

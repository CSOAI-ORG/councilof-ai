import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule4Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary purpose of the MAP function?',
    options: [
      'To create visual diagrams',
      'To understand the context, categorize AI systems, and identify risks',
      'To deploy AI systems',
      'To train AI models',
    ],
    correctAnswer: 1,
    explanation: 'The MAP function helps organizations understand the context in which AI systems will operate, categorize AI systems based on their characteristics and risks, and identify potential positive and negative impacts on individuals, communities, and society.',
  },
  {
    id: 2,
    question: 'What should be mapped during the context assessment?',
    options: [
      'Only technical specifications',
      'Business context, stakeholders, intended use, potential impacts, and legal/regulatory requirements',
      'Only the development team',
      'Only the budget',
    ],
    correctAnswer: 1,
    explanation: 'Context assessment should map the business context, affected stakeholders, intended and foreseeable uses, potential positive and negative impacts, applicable legal and regulatory requirements, and organizational values and risk tolerance.',
  },
  {
    id: 3,
    question: 'Why is stakeholder identification important in the MAP function?',
    options: [
      'To increase marketing reach',
      'To understand who may be affected by the AI system and incorporate diverse perspectives',
      'To reduce development costs',
      'To speed up deployment',
    ],
    correctAnswer: 1,
    explanation: 'Stakeholder identification is crucial for understanding who may be affected by the AI system (directly or indirectly) and incorporating diverse perspectives into risk assessment. This includes users, affected individuals, communities, employees, regulators, and civil society.',
  },
  {
    id: 4,
    question: 'What is AI system categorization?',
    options: [
      'Organizing AI systems by cost',
      'Classifying AI systems based on characteristics, capabilities, and risk levels',
      'Sorting AI systems alphabetically',
      'Grouping AI systems by development team',
    ],
    correctAnswer: 1,
    explanation: 'AI system categorization involves classifying AI systems based on their technical characteristics, capabilities, intended use, potential impacts, and risk levels. This helps organizations prioritize risk management efforts and tailor approaches to specific system types.',
  },
  {
    id: 5,
    question: 'Should foreseeable misuse be considered during the MAP function?',
    options: [
      'No, only intended use matters',
      'Yes, foreseeable misuse and unintended consequences should be identified',
      'Only if legally required',
      'Only for consumer products',
    ],
    correctAnswer: 1,
    explanation: 'Yes, organizations should identify foreseeable misuse, dual-use concerns, and unintended consequences during the MAP function. AI systems can be used in ways not intended by developers, and these scenarios should be anticipated and addressed.',
  },
  {
    id: 6,
    question: 'What is the role of impact assessment in the MAP function?',
    options: [
      'To maximize profit',
      'To identify potential positive and negative impacts on individuals, groups, and society',
      'To reduce development time',
      'To avoid documentation',
    ],
    correctAnswer: 1,
    explanation: 'Impact assessment identifies potential positive and negative impacts of the AI system on individuals, groups, communities, organizations, and society. This includes impacts on rights, safety, fairness, privacy, and other trustworthy AI characteristics.',
  },
  {
    id: 7,
    question: 'How does the MAP function relate to the MEASURE function?',
    options: [
      'They are unrelated',
      'MAP identifies what to measure; MEASURE evaluates those aspects',
      'MAP replaces MEASURE',
      'MEASURE comes before MAP',
    ],
    correctAnswer: 1,
    explanation: 'MAP identifies the context, risks, and impacts that need to be measured, while MEASURE evaluates those aspects through metrics, testing, and monitoring. MAP provides the foundation for what to measure and why.',
  },
  {
    id: 8,
    question: 'Should the MAP function be performed only once?',
    options: [
      'Yes, mapping is a one-time activity',
      'No, mapping should be revisited as context, systems, and risks evolve',
      'Only for high-risk systems',
      'Only when regulations change',
    ],
    correctAnswer: 1,
    explanation: 'No, the MAP function should be revisited regularly as the AI system evolves, the operational context changes, new risks emerge, stakeholder concerns shift, or regulations are updated. Mapping is an ongoing process, not a one-time exercise.',
  },
  {
    id: 9,
    question: 'What is the purpose of identifying legal and regulatory requirements during MAP?',
    options: [
      'To avoid compliance',
      'To understand applicable obligations and integrate them into risk management',
      'To delay deployment',
      'To increase costs',
    ],
    correctAnswer: 1,
    explanation: 'Identifying legal and regulatory requirements ensures that organizations understand their obligations (e.g., EU AI Act, sector-specific regulations, privacy laws) and integrate compliance into their risk management approach from the start, rather than as an afterthought.',
  },
  {
    id: 10,
    question: 'Should the MAP function consider the entire AI lifecycle?',
    options: [
      'No, only the deployment phase',
      'Yes, MAP should consider risks across design, development, deployment, and monitoring',
      'No, only the development phase',
      'Only if the system is high-risk',
    ],
    correctAnswer: 1,
    explanation: 'Yes, the MAP function should consider risks and impacts across the entire AI lifecycle—from design and data collection through development, deployment, operation, and decommissioning. Risks can emerge at any stage and should be anticipated.',
  },
];

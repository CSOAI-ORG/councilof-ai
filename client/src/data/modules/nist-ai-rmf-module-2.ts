import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary goal of the GOVERN function in the NIST AI RMF?',
    options: [
      'To deploy AI systems as quickly as possible',
      'To establish organizational structures, policies, and processes for managing AI risk',
      'To measure the accuracy of AI models',
      'To eliminate all risks associated with AI',
    ],
    correctAnswer: 1,
    explanation: 'The GOVERN function focuses on establishing the governance structures, policies, processes, and organizational culture needed to manage AI risks effectively throughout the organization.',
  },
  {
    id: 2,
    question: 'Which of the following is a key component of organizational governance for AI?',
    options: [
      'Restricting all AI projects to technical teams only',
      'Clear accountability mechanisms and defined roles and responsibilities for AI risk management',
      'Avoiding documentation of AI systems',
      'Centralizing all AI decisions in one department',
    ],
    correctAnswer: 1,
    explanation: 'Effective AI governance requires clear accountability mechanisms, well-defined roles and responsibilities, and a distributed approach that involves multiple stakeholders across the organization.',
  },
  {
    id: 3,
    question: 'What does "risk tolerance" mean in the context of NIST AI RMF governance?',
    options: [
      'The maximum amount of money an organization can spend on AI',
      'The level of risk an organization is willing to accept in AI systems',
      'The number of AI projects that can be run simultaneously',
      'The speed at which AI models must make predictions',
    ],
    correctAnswer: 1,
    explanation: 'Risk tolerance refers to the amount and type of risk an organization is willing to accept. This guides decision-making about which AI risks to mitigate and which to accept or avoid.',
  },
  {
    id: 4,
    question: 'How does organizational culture impact AI risk management?',
    options: [
      'Culture has no impact on AI risk management',
      'A strong organizational culture promotes responsible AI practices, transparency, and risk awareness',
      'Culture only matters in marketing departments',
      'Culture should prioritize speed over safety in AI deployment',
    ],
    correctAnswer: 1,
    explanation: 'Organizational culture significantly impacts AI risk management. A culture that values transparency, accountability, and responsible innovation supports better risk governance and decision-making.',
  },
  {
    id: 5,
    question: 'What role do governance policies play in the NIST AI RMF?',
    options: [
      'They restrict innovation in AI development',
      'They establish standards, guidelines, and expectations for how AI systems should be developed, deployed, and monitored',
      'They are only for legal compliance purposes',
      'They are optional for organizations to implement',
    ],
    correctAnswer: 1,
    explanation: 'Governance policies establish the standards, guidelines, and expectations that guide AI development, deployment, and monitoring. They provide a framework for consistent decision-making and risk management.',
  },
  {
    id: 6,
    question: 'Which stakeholder group should be included in governance structures for AI risk management?',
    options: [
      'Only technical developers',
      'Only executive leadership',
      'Cross-functional teams including technical, business, ethics, legal, and domain experts',
      'Only external auditors',
    ],
    correctAnswer: 2,
    explanation: 'Effective AI governance requires cross-functional participation, including perspectives from technical teams, business leaders, ethics specialists, legal experts, subject matter experts, and other relevant stakeholders.',
  },
  {
    id: 7,
    question: 'What is meant by "accountability" in the context of NIST AI RMF governance?',
    options: [
      'Punishing employees when AI systems fail',
      'Clear assignment of responsibility for AI risk decisions and outcomes, with transparency and oversight',
      'Avoiding responsibility for AI impacts',
      'Making executives solely responsible for all AI decisions',
    ],
    correctAnswer: 1,
    explanation: 'Accountability means clearly assigning responsibility for decisions about AI systems and their outcomes. It includes transparency in decision-making and mechanisms for oversight and review.',
  },
  {
    id: 8,
    question: 'How should an organization define its risk appetite for AI systems?',
    options: [
      'Risk appetite should be the same for all organizations',
      'Based on organizational strategy, values, resources, and the specific context and potential impacts of AI use',
      'By copying what competitors do',
      'Risk appetite does not need to be formally defined',
    ],
    correctAnswer: 1,
    explanation: 'Risk appetite should be tailored to an organization\'s specific context, including its strategy, values, resources, regulatory environment, and the potential impacts of the AI systems it develops or deploys.',
  },
  {
    id: 9,
    question: 'What is the relationship between governance and the other NIST AI RMF functions?',
    options: [
      'Governance is separate from the other functions',
      'Governance provides the foundation and organizational context for effective implementation of MAP, MEASURE, and MANAGE functions',
      'The other functions are more important than governance',
      'Governance only applies to the MEASURE function',
    ],
    correctAnswer: 1,
    explanation: 'The GOVERN function provides the organizational foundation, policies, and structures that enable effective implementation of the MAP, MEASURE, and MANAGE functions throughout the AI lifecycle.',
  },
  {
    id: 10,
    question: 'Which of the following best represents a governance mechanism for AI risk?',
    options: [
      'An AI model with high accuracy',
      'An AI ethics board with defined responsibilities for reviewing and approving AI projects',
      'Rapid deployment of AI systems',
      'Avoiding documentation of AI decisions',
    ],
    correctAnswer: 1,
    explanation: 'A governance mechanism like an AI ethics board, oversight committee, or review process helps ensure that AI risk management practices are implemented consistently and that decisions are made with appropriate accountability.',
  },
];

import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What must organizations understand about their context according to Clause 4?',
    options: [
      'Only internal issues',
      'Internal and external issues that affect the AIMS',
      'Only competitor analysis',
      'Only financial context',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must determine internal and external issues relevant to their purpose and that affect their ability to achieve the intended outcomes of the AIMS. This includes technological, legal, regulatory, cultural, social, and economic factors.',
  },
  {
    id: 2,
    question: 'Who are "interested parties" in ISO 42001?',
    options: [
      'Only customers',
      'Stakeholders who can affect or be affected by the AIMS (customers, regulators, employees, society)',
      'Only shareholders',
      'Only employees',
    ],
    correctAnswer: 1,
    explanation: 'Interested parties are stakeholders who can affect, be affected by, or perceive themselves to be affected by the organization\'s AI activities. This includes customers, regulators, employees, suppliers, affected individuals, civil society, and shareholders.',
  },
  {
    id: 3,
    question: 'What is the purpose of defining the AIMS scope?',
    options: [
      'To limit liability',
      'To clearly define boundaries and applicability of the management system',
      'To reduce costs',
      'To avoid audits',
    ],
    correctAnswer: 1,
    explanation: 'The scope defines the boundaries and applicability of the AIMS, specifying which AI systems, processes, locations, and organizational units are included. A clear scope ensures everyone understands what is covered and enables effective implementation and auditing.',
  },
  {
    id: 4,
    question: 'What is required of top management in Clause 5?',
    options: [
      'Only budget approval',
      'Demonstrate leadership and commitment to the AIMS',
      'Only attend meetings',
      'Only sign documents',
    ],
    correctAnswer: 1,
    explanation: 'Top management must demonstrate leadership and commitment by ensuring the AIMS achieves its intended outcomes, integrating AIMS requirements into business processes, providing resources, communicating importance, and ensuring the AIMS delivers value.',
  },
  {
    id: 5,
    question: 'What must the AI policy include?',
    options: [
      'Only technical specifications',
      'Commitment to meet requirements, framework for AI objectives, and commitment to continual improvement',
      'Only budget allocations',
      'Only marketing messages',
    ],
    correctAnswer: 1,
    explanation: 'The AI policy must include a commitment to satisfy applicable requirements, provide a framework for setting AI objectives, and include a commitment to continual improvement of the AIMS. It should be appropriate to the organization\'s purpose and context.',
  },
  {
    id: 6,
    question: 'Should the AI policy be documented and communicated?',
    options: [
      'No, it can be informal',
      'Yes, it must be documented, communicated internally, and available to interested parties',
      'Only documented, not communicated',
      'Only communicated to executives',
    ],
    correctAnswer: 1,
    explanation: 'Yes, the AI policy must be available as documented information, communicated within the organization, and made available to relevant interested parties as appropriate. This ensures transparency and accountability.',
  },
  {
    id: 7,
    question: 'What organizational roles must be assigned for the AIMS?',
    options: [
      'Only a single AI manager',
      'Roles and responsibilities for AIMS conformity, reporting, and ensuring customer focus',
      'Only technical roles',
      'Only compliance roles',
    ],
    correctAnswer: 1,
    explanation: 'Top management must assign roles, responsibilities, and authorities for ensuring the AIMS conforms to ISO 42001 requirements, reporting AIMS performance to top management, and ensuring customer focus throughout the organization.',
  },
  {
    id: 8,
    question: 'Can the AIMS scope exclude certain AI systems?',
    options: [
      'Yes, but exclusions must be justified and not affect conformity or responsibility',
      'No, all AI systems must be included',
      'Yes, without justification',
      'Only low-risk systems can be excluded',
    ],
    correctAnswer: 0,
    explanation: 'Organizations can define their AIMS scope based on their context, but any exclusions must be justified. Exclusions cannot affect the organization\'s ability or responsibility to ensure AI systems meet applicable requirements and achieve intended outcomes.',
  },
  {
    id: 9,
    question: 'How often should the organizational context be reviewed?',
    options: [
      'Never, it is set once',
      'Regularly, as internal and external issues change',
      'Only during audits',
      'Only when regulations change',
    ],
    correctAnswer: 1,
    explanation: 'The organizational context should be reviewed regularly as internal and external issues evolve, new interested parties emerge, or requirements change. This ensures the AIMS remains relevant and effective.',
  },
  {
    id: 10,
    question: 'What is the relationship between leadership and the AIMS?',
    options: [
      'Leadership is optional',
      'Leadership commitment is essential for AIMS success and must be demonstrated',
      'Leadership only provides funding',
      'Leadership only reviews reports',
    ],
    correctAnswer: 1,
    explanation: 'Leadership commitment is essential for AIMS success. Top management must actively champion the AIMS, integrate it into business strategy, provide resources, communicate its importance, and ensure it achieves intended outcomes. Without leadership, the AIMS will fail.',
  },
];

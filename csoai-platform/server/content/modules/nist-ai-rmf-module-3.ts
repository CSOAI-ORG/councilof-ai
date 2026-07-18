import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary purpose of the GOVERN function?',
    options: [
      'To test AI systems',
      'To establish organizational policies, procedures, and accountability for AI',
      'To deploy AI systems',
      'To collect training data',
    ],
    correctAnswer: 1,
    explanation: 'The GOVERN function establishes and nurtures a culture of AI risk management within the organization. It includes policies, procedures, governance structures, and accountability mechanisms that enable responsible AI development and deployment.',
  },
  {
    id: 2,
    question: 'Who should be involved in AI governance?',
    options: [
      'Only data scientists',
      'Only executives',
      'Cross-functional teams including leadership, technical staff, legal, ethics, and affected stakeholders',
      'Only the IT department',
    ],
    correctAnswer: 2,
    explanation: 'Effective AI governance requires cross-functional collaboration including senior leadership, technical teams, legal/compliance, ethics experts, risk management, and representatives of affected stakeholders. Diverse perspectives are essential for comprehensive risk management.',
  },
  {
    id: 3,
    question: 'What is a key component of AI governance policies?',
    options: [
      'Maximizing AI deployment speed',
      'Clear roles, responsibilities, and decision-making authority',
      'Minimizing documentation',
      'Avoiding external oversight',
    ],
    correctAnswer: 1,
    explanation: 'AI governance policies must establish clear roles, responsibilities, and decision-making authority for AI development, deployment, and monitoring. This includes defining who can approve high-risk AI systems, who monitors performance, and who responds to incidents.',
  },
  {
    id: 4,
    question: 'How should AI risk tolerance be determined?',
    options: [
      'By the AI development team alone',
      'By aligning with organizational risk appetite and stakeholder values',
      'By copying competitors',
      'By maximizing profit',
    ],
    correctAnswer: 1,
    explanation: 'AI risk tolerance should be determined by aligning with the organization\'s overall risk appetite, values, legal obligations, and stakeholder expectations. It should consider potential impacts on individuals, communities, and the organization itself.',
  },
  {
    id: 5,
    question: 'What is the role of senior leadership in AI governance?',
    options: [
      'No role—delegate to technical teams',
      'Provide oversight, resources, and accountability for AI risk management',
      'Only approve budgets',
      'Only review after incidents occur',
    ],
    correctAnswer: 1,
    explanation: 'Senior leadership must provide active oversight, allocate resources, set the tone for responsible AI, and hold teams accountable for AI risk management. Leadership commitment is essential for embedding AI governance into organizational culture.',
  },
  {
    id: 6,
    question: 'Should AI governance be integrated with existing organizational governance?',
    options: [
      'No, AI governance should be completely separate',
      'Yes, AI governance should align with and leverage existing risk management, compliance, and ethics frameworks',
      'Only for large organizations',
      'Only if required by law',
    ],
    correctAnswer: 1,
    explanation: 'Yes, AI governance should be integrated with existing organizational governance structures, risk management frameworks, compliance programs, and ethics processes. This avoids silos, leverages existing expertise, and ensures consistency across the organization.',
  },
  {
    id: 7,
    question: 'What is the purpose of AI risk management policies?',
    options: [
      'To slow down AI development',
      'To provide clear guidance on identifying, assessing, and mitigating AI risks',
      'To eliminate all AI risks',
      'To avoid using AI',
    ],
    correctAnswer: 1,
    explanation: 'AI risk management policies provide clear, actionable guidance on how to identify, assess, prioritize, and mitigate AI risks throughout the AI lifecycle. They enable teams to make informed decisions while fostering innovation.',
  },
  {
    id: 8,
    question: 'How often should AI governance policies be reviewed?',
    options: [
      'Never—set once and forget',
      'Every 10 years',
      'Regularly, and updated as AI systems, risks, and regulations evolve',
      'Only when incidents occur',
    ],
    correctAnswer: 2,
    explanation: 'AI governance policies should be reviewed regularly and updated as AI systems evolve, new risks emerge, regulations change, and organizational context shifts. Governance is an ongoing process, not a one-time exercise.',
  },
  {
    id: 9,
    question: 'What is the relationship between GOVERN and the other three functions (MAP, MEASURE, MANAGE)?',
    options: [
      'GOVERN is independent of the other functions',
      'GOVERN provides the foundation and context for MAP, MEASURE, and MANAGE',
      'GOVERN comes after the other functions',
      'GOVERN is optional if you have the other functions',
    ],
    correctAnswer: 1,
    explanation: 'GOVERN provides the foundational policies, culture, and structures that enable effective execution of MAP, MEASURE, and MANAGE. Without strong governance, the other functions lack direction, accountability, and organizational support.',
  },
  {
    id: 10,
    question: 'Should AI governance include mechanisms for stakeholder feedback?',
    options: [
      'No, stakeholder feedback is unnecessary',
      'Yes, stakeholder feedback is essential for understanding impacts and maintaining trust',
      'Only for consumer-facing AI',
      'Only if legally required',
    ],
    correctAnswer: 1,
    explanation: 'Yes, effective AI governance includes mechanisms for stakeholder feedback, including affected individuals, communities, customers, employees, and regulators. This feedback helps identify blind spots, understand real-world impacts, and maintain trust.',
  },
];

import type { QuizQuestion } from '@/types/quiz';

export const canadaAidaModule4Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What governance structures does AIDA require for high-impact AI systems?',
    options: [
      'No specific governance requirements',
      'Only IT department oversight',
      'Clear accountability, oversight mechanisms, and defined roles and responsibilities',
      'Only CEO approval',
    ],
    correctAnswer: 2,
    explanation: 'AIDA requires organizations to establish clear governance structures including defined accountability, oversight mechanisms, and clearly assigned roles and responsibilities for AI system management.',
  },
  {
    id: 2,
    question: 'Who bears ultimate accountability for AI system compliance under AIDA?',
    options: [
      'Only the AI developers',
      'The organization\'s senior leadership',
      'Only the IT department',
      'The AI system itself',
    ],
    correctAnswer: 1,
    explanation: 'Senior leadership of the organization bears ultimate accountability for AI system compliance under AIDA, though specific responsibilities may be delegated to appropriate personnel.',
  },
  {
    id: 3,
    question: 'What is the role of an AI ethics committee under AIDA best practices?',
    options: [
      'AI ethics committees are prohibited',
      'To review and advise on ethical implications of AI systems',
      'Only to approve marketing materials',
      'To develop AI systems',
    ],
    correctAnswer: 1,
    explanation: 'AI ethics committees, while not explicitly mandated by AIDA, are considered best practice for reviewing and advising on the ethical implications of AI systems and ensuring alignment with organizational values.',
  },
  {
    id: 4,
    question: 'How should organizations handle third-party AI systems under AIDA?',
    options: [
      'Third-party systems are exempt from AIDA',
      'Organizations must ensure third-party systems comply with AIDA requirements',
      'Only the third-party vendor is responsible',
      'Third-party systems don\'t need risk assessments',
    ],
    correctAnswer: 1,
    explanation: 'Organizations using third-party AI systems remain responsible for ensuring those systems comply with AIDA requirements, including conducting appropriate due diligence and risk assessments.',
  },
  {
    id: 5,
    question: 'What training requirements does AIDA imply for AI system operators?',
    options: [
      'No training is required',
      'Only technical training',
      'Training on AI risks, ethical considerations, and compliance requirements',
      'Training is only required for developers',
    ],
    correctAnswer: 2,
    explanation: 'AIDA implies that personnel involved in AI system operation should receive appropriate training on AI risks, ethical considerations, and compliance requirements to ensure responsible use.',
  },
  {
    id: 6,
    question: 'How does AIDA address AI system auditing?',
    options: [
      'Auditing is not required',
      'Only internal audits are required',
      'Regular audits, both internal and potentially external, are required',
      'Audits are only required after incidents',
    ],
    correctAnswer: 2,
    explanation: 'AIDA requires regular auditing of high-impact AI systems to ensure ongoing compliance, which may include both internal audits and, in some cases, external independent audits.',
  },
  {
    id: 7,
    question: 'What is the purpose of AI system monitoring under AIDA?',
    options: [
      'Only to track system performance',
      'To detect and address emerging risks, biases, and compliance issues',
      'Only to collect user data',
      'Monitoring is optional',
    ],
    correctAnswer: 1,
    explanation: 'AI system monitoring under AIDA serves to detect and address emerging risks, biases, and compliance issues throughout the system\'s lifecycle, not just to track technical performance.',
  },
  {
    id: 8,
    question: 'How should organizations document AI governance decisions under AIDA?',
    options: [
      'Documentation is not required',
      'Only verbal records are needed',
      'Comprehensive written records of decisions, rationales, and actions taken',
      'Only financial decisions need documentation',
    ],
    correctAnswer: 2,
    explanation: 'Organizations must maintain comprehensive written documentation of governance decisions, including the rationale behind decisions and actions taken to address identified issues.',
  },
  {
    id: 9,
    question: 'What role does stakeholder engagement play in AI governance under AIDA?',
    options: [
      'Stakeholder engagement is not relevant',
      'Only shareholder engagement is required',
      'Engagement with affected communities and stakeholders is encouraged',
      'Only government engagement is required',
    ],
    correctAnswer: 2,
    explanation: 'AIDA encourages engagement with affected communities and stakeholders as part of responsible AI governance, recognizing that those impacted by AI systems should have input into their development and use.',
  },
  {
    id: 10,
    question: 'How does AIDA address conflicts of interest in AI governance?',
    options: [
      'Conflicts of interest are not addressed',
      'Only financial conflicts must be disclosed',
      'Organizations must identify and manage conflicts of interest in AI oversight',
      'Conflicts of interest are only relevant for government AI',
    ],
    correctAnswer: 2,
    explanation: 'AIDA requires organizations to identify and appropriately manage conflicts of interest in AI governance to ensure objective oversight and decision-making.',
  },
];

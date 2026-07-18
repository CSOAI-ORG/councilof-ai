import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'How many clauses does ISO 42001 have?',
    options: [
      '5 clauses',
      '8 clauses',
      '10 clauses',
      '12 clauses',
    ],
    correctAnswer: 2,
    explanation: 'ISO 42001 has 10 clauses following the ISO High-Level Structure (HLS). Clauses 1-3 are introductory (scope, normative references, terms), while clauses 4-10 contain the management system requirements.',
  },
  {
    id: 2,
    question: 'Which clauses of ISO 42001 contain mandatory requirements?',
    options: [
      'Only Clause 4',
      'Clauses 1-3 only',
      'Clauses 4-10',
      'All 10 clauses',
    ],
    correctAnswer: 2,
    explanation: 'Clauses 4-10 contain mandatory requirements for the AI Management System. Clauses 1-3 (Scope, Normative References, Terms and Definitions) are introductory and provide context, but do not contain "shall" requirements.',
  },
  {
    id: 3,
    question: 'What is the purpose of Clause 4 (Context of the Organization)?',
    options: [
      'To define AI algorithms',
      'To understand internal and external issues affecting the AIMS',
      'To train employees',
      'To purchase AI tools',
    ],
    correctAnswer: 1,
    explanation: 'Clause 4 requires organizations to understand their context—internal and external issues, interested parties and their requirements, and the scope of the AIMS. This ensures the management system is tailored to organizational needs.',
  },
  {
    id: 4,
    question: 'What does Clause 5 (Leadership) require?',
    options: [
      'Only appointing an AI manager',
      'Top management commitment, AI policy, and organizational roles/responsibilities',
      'Only technical leadership',
      'Only budget approval',
    ],
    correctAnswer: 1,
    explanation: 'Clause 5 requires top management to demonstrate leadership and commitment, establish an AI policy, and ensure organizational roles, responsibilities, and authorities are assigned and communicated for the AIMS.',
  },
  {
    id: 5,
    question: 'What is covered in Clause 6 (Planning)?',
    options: [
      'Only project timelines',
      'Risk and opportunity management, AI objectives, and planning to achieve them',
      'Only budget planning',
      'Only hiring plans',
    ],
    correctAnswer: 1,
    explanation: 'Clause 6 requires organizations to address risks and opportunities, establish AI objectives aligned with the AI policy, and plan actions to achieve these objectives. This includes AI-specific risk assessment and treatment.',
  },
  {
    id: 6,
    question: 'What does Clause 7 (Support) address?',
    options: [
      'Only IT support',
      'Resources, competence, awareness, communication, and documented information',
      'Only customer support',
      'Only technical support',
    ],
    correctAnswer: 1,
    explanation: 'Clause 7 covers support elements: providing resources (people, infrastructure, technology), ensuring competence and awareness, establishing communication processes, and managing documented information (documentation and records).',
  },
  {
    id: 7,
    question: 'What is the focus of Clause 8 (Operation)?',
    options: [
      'Only AI model training',
      'Operational planning, control, and AI system lifecycle management',
      'Only deployment',
      'Only monitoring',
    ],
    correctAnswer: 1,
    explanation: 'Clause 8 focuses on operational planning and control, including AI system lifecycle management (design, development, deployment, monitoring, maintenance, decommissioning), change management, and supplier relationships.',
  },
  {
    id: 8,
    question: 'What does Clause 9 (Performance Evaluation) require?',
    options: [
      'Only financial metrics',
      'Monitoring, measurement, analysis, evaluation, internal audit, and management review',
      'Only AI accuracy metrics',
      'Only customer satisfaction surveys',
    ],
    correctAnswer: 1,
    explanation: 'Clause 9 requires organizations to monitor and measure AIMS performance, conduct internal audits to verify conformity, and perform management reviews to ensure the AIMS remains suitable, adequate, and effective.',
  },
  {
    id: 9,
    question: 'What is the purpose of Clause 10 (Improvement)?',
    options: [
      'Only fixing bugs',
      'Continual improvement, nonconformity management, and corrective action',
      'Only adding new features',
      'Only cost reduction',
    ],
    correctAnswer: 1,
    explanation: 'Clause 10 requires organizations to continually improve the AIMS, address nonconformities when they occur, and take corrective actions to eliminate root causes and prevent recurrence. This drives ongoing enhancement of AI practices.',
  },
  {
    id: 10,
    question: 'Does ISO 42001 include an Annex with additional controls?',
    options: [
      'No, there are no annexes',
      'Yes, Annex A provides a comprehensive set of AI-specific controls',
      'Yes, but it is optional and not part of certification',
      'Yes, but only for technical specifications',
    ],
    correctAnswer: 1,
    explanation: 'Yes, ISO 42001 includes Annex A, which provides a comprehensive set of AI-specific controls organized into categories. Organizations must determine which controls are applicable and implement them as part of their AIMS. Annex A is normative and required for certification.',
  },
];

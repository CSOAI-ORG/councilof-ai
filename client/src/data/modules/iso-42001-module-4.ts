import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module4Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What are the three main support requirements established in Clause 7 of ISO/IEC 42001?',
    options: [
      'Finance, Marketing, and Human Resources',
      'Resources, Competence, and Awareness',
      'Budget, Timeline, and Quality',
      'Technology, Training, and Documentation',
    ],
    correctAnswer: 1,
    explanation: 'Clause 7 requires organizations to provide adequate resources for the AIMS, ensure staff have the competence to perform AI-related tasks, and maintain awareness of the AIMS among relevant personnel.',
  },
  {
    id: 2,
    question: 'Under Clause 7 (Support), what does "competence" requirement entail?',
    options: [
      'Only IT staff need to be trained on the AIMS',
      'Determining necessary competencies, providing training, and evaluating the effectiveness of competence development for AI management',
      'Hiring only employees with previous AI experience',
      'Competence requirements are optional for organizations',
    ],
    correctAnswer: 1,
    explanation: 'Clause 7.2 requires the organization to identify competence needs, provide training or other means to achieve competence, and evaluate the effectiveness of competence development activities.',
  },
  {
    id: 3,
    question: 'Which of the following is part of Clause 7\'s awareness requirements?',
    options: [
      'Only executive management needs awareness of the AIMS',
      'Ensuring people understand the AI policy, their contributions to AIMS effectiveness, and implications of non-conformity',
      'Creating awareness is the responsibility of external consultants only',
      'Awareness is only needed for IT personnel',
    ],
    correctAnswer: 1,
    explanation: 'Clause 7.3 requires the organization to ensure that people working for or on behalf of the organization understand the AI policy, their role in the AIMS, and the implications of not conforming.',
  },
  {
    id: 4,
    question: 'What is the primary purpose of documented information in an AIMS?',
    options: [
      'To create unnecessary bureaucracy',
      'To provide evidence of AIMS implementation and operation for internal and external stakeholders',
      'To eliminate the need for actual controls',
      'To satisfy audit requirements only',
    ],
    correctAnswer: 1,
    explanation: 'Documented information provides evidence that the AIMS is established, implemented, and maintained effectively, and serves as a record of decisions, activities, and results.',
  },
  {
    id: 5,
    question: 'According to Clause 8 (Operation), what is the purpose of operational controls in the AIMS?',
    options: [
      'To prevent any use of AI in the organization',
      'To implement, maintain, and control processes to meet AI objectives and manage AI-related risks',
      'To ensure all AI systems perform identically',
      'To reduce the number of AI projects',
    ],
    correctAnswer: 1,
    explanation: 'Clause 8 requires the organization to plan and implement processes to meet its AI objectives and manage identified risks and opportunities through operational controls.',
  },
  {
    id: 6,
    question: 'What does an AI system impact assessment (Annex B) evaluate?',
    options: [
      'Only the cost of AI system development',
      'Only the technical performance metrics',
      'The potential impacts, harms, and consequences of the AI system on individuals, groups, and the organization',
      'Only whether the system should be purchased or developed internally',
    ],
    correctAnswer: 2,
    explanation: 'An AI system impact assessment evaluates the potential harms and consequences of an AI system, including impacts on individuals, groups, and organizational objectives.',
  },
  {
    id: 7,
    question: 'Under Clause 7, what resources must be provided to support the AIMS?',
    options: [
      'Only IT infrastructure',
      'Personnel, infrastructure, technology, information, and financial resources necessary for the AIMS',
      'Only training budgets',
      'Resources are determined solely by the finance department',
    ],
    correctAnswer: 1,
    explanation: 'Clause 7.1 requires the organization to determine and provide the resources needed to establish, implement, and maintain an effective AIMS, including people, infrastructure, technology, information, and finances.',
  },
  {
    id: 8,
    question: 'How should data management controls be implemented according to ISO/IEC 42001?',
    options: [
      'Data management is not relevant to AI management',
      'Controls to manage data quality, access, security, retention, and disposal throughout the AI system lifecycle',
      'Data should be stored without any controls to maximize system speed',
      'Only customer data needs to be managed; internal data management is optional',
    ],
    correctAnswer: 1,
    explanation: 'Data management controls in the AIMS address data quality, integrity, access controls, security, retention policies, and disposal procedures to ensure AI systems operate on reliable data.',
  },
  {
    id: 9,
    question: 'According to Clause 8, what must be documented regarding AI operations?',
    options: [
      'Only successful operations need documentation',
      'Operational procedures, control implementation, monitoring mechanisms, and records of operational decisions and activities',
      'Documentation is optional for organizations smaller than 100 employees',
      'Only changes to operations need documentation',
    ],
    correctAnswer: 1,
    explanation: 'Clause 8 requires documented information about operational processes, how controls are implemented, how AI systems are monitored and controlled, and records of operational activities.',
  },
  {
    id: 10,
    question: 'What is the relationship between Clause 7 (Support) and Clause 8 (Operation) in ISO/IEC 42001?',
    options: [
      'Clause 7 and 8 are unrelated and can be implemented independently',
      'Clause 7 provides the necessary support and resources that enable effective operation outlined in Clause 8',
      'Clause 8 is more important than Clause 7',
      'Only one of these clauses needs to be implemented',
    ],
    correctAnswer: 1,
    explanation: 'Clause 7 establishes the support infrastructure (resources, competence, awareness) necessary for organizations to effectively implement and operate the controls and processes specified in Clause 8.',
  },
];

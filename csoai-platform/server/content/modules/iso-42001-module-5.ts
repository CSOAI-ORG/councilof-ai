import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module5Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What resources must organizations provide for the AIMS?',
    options: [
      'Only financial resources',
      'People, infrastructure, technology, and organizational knowledge',
      'Only technology',
      'Only training materials',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must provide resources including people (competent personnel), infrastructure (facilities, equipment, IT systems), technology (AI tools, platforms), and organizational knowledge (information, experience, lessons learned) needed for the AIMS.',
  },
  {
    id: 2,
    question: 'What is required regarding competence in ISO 42001?',
    options: [
      'Only hire AI experts',
      'Determine necessary competence, ensure personnel are competent, take actions to acquire competence, and retain documented evidence',
      'Only provide training',
      'Competence is optional',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must determine necessary competence for personnel affecting AIMS performance, ensure personnel are competent based on education/training/experience, take actions to acquire competence where needed, and retain documented evidence of competence.',
  },
  {
    id: 3,
    question: 'What must personnel be aware of according to Clause 7?',
    options: [
      'Only their job duties',
      'AI policy, their contribution to AIMS effectiveness, and implications of not conforming',
      'Only company policies',
      'Only technical procedures',
    ],
    correctAnswer: 1,
    explanation: 'Personnel must be aware of the AI policy, their contribution to the effectiveness of the AIMS (including benefits of improved performance), and the implications of not conforming to AIMS requirements. Awareness drives engagement and compliance.',
  },
  {
    id: 4,
    question: 'What communication requirements does ISO 42001 specify?',
    options: [
      'No specific requirements',
      'Determine what to communicate, when, to whom, how, and who communicates',
      'Only email communication',
      'Only annual reports',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must determine what needs to be communicated about the AIMS, when to communicate, with whom to communicate, how to communicate, and who communicates. This ensures effective internal and external communication.',
  },
  {
    id: 5,
    question: 'What is "documented information" in ISO 42001?',
    options: [
      'Only paper documents',
      'Information required to be controlled and maintained (documents and records)',
      'Only electronic files',
      'Only audit reports',
    ],
    correctAnswer: 1,
    explanation: 'Documented information includes both documents (policies, procedures, plans) that need to be controlled and records (evidence of activities performed) that need to be retained. It can be in any format or media (paper, electronic, etc.).',
  },
  {
    id: 6,
    question: 'What does operational planning and control (Clause 8) require?',
    options: [
      'Only project management',
      'Plan, implement, and control processes needed to meet AIMS requirements and implement risk treatment actions',
      'Only deployment planning',
      'Only budget control',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must plan, implement, and control the processes needed to meet AIMS requirements and implement risk treatment actions. This includes establishing criteria for processes, implementing control of processes, and keeping documented information.',
  },
  {
    id: 7,
    question: 'What is required for AI system lifecycle management?',
    options: [
      'Only development and deployment',
      'Manage the entire lifecycle: design, development, deployment, operation, monitoring, maintenance, and decommissioning',
      'Only operation',
      'Only monitoring',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must manage AI systems throughout their entire lifecycle, from design and development through deployment, operation, monitoring, maintenance, and eventual decommissioning. Each stage has specific risk management and control requirements.',
  },
  {
    id: 8,
    question: 'How should changes to AI systems be managed?',
    options: [
      'Changes can be made freely',
      'Changes must be controlled, reviewed for risks, approved, and documented',
      'Only technical changes need control',
      'Only major changes need control',
    ],
    correctAnswer: 1,
    explanation: 'Changes to AI systems (models, data, configurations, infrastructure) must be controlled through a change management process. Changes should be reviewed for risks, approved by authorized personnel, tested, and documented to prevent unintended consequences.',
  },
  {
    id: 9,
    question: 'What is required regarding suppliers and external providers?',
    options: [
      'No specific requirements',
      'Determine controls for externally provided processes, products, and services relevant to the AIMS',
      'Only price negotiation',
      'Only contract signing',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must determine and apply controls for externally provided processes, products, and services that are relevant to the AIMS. This includes supplier evaluation, contractual requirements, and ongoing monitoring of supplier performance.',
  },
  {
    id: 10,
    question: 'Should AI system decommissioning be planned?',
    options: [
      'No, systems can be turned off anytime',
      'Yes, decommissioning should be planned to manage risks and ensure responsible retirement',
      'Only for high-risk systems',
      'Only if legally required',
    ],
    correctAnswer: 1,
    explanation: 'Yes, AI system decommissioning should be planned and controlled. This includes managing risks during retirement, preserving necessary records, communicating with affected stakeholders, and ensuring responsible disposal of data and systems.',
  },
];

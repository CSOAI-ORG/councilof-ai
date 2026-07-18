import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module6Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What must organizations monitor and measure in the AIMS?',
    options: [
      'Only AI system accuracy',
      'AIMS performance, effectiveness of controls, and achievement of AI objectives',
      'Only financial metrics',
      'Only customer satisfaction',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must determine what needs to be monitored and measured, including AIMS performance, effectiveness of controls, progress toward AI objectives, and compliance with requirements. This provides evidence of AIMS effectiveness.',
  },
  {
    id: 2,
    question: 'How should monitoring and measurement be performed?',
    options: [
      'Informally and occasionally',
      'Using valid methods, at planned intervals, with documented results',
      'Only during audits',
      'Only when problems occur',
    ],
    correctAnswer: 1,
    explanation: 'Monitoring and measurement must be performed using valid methods (accurate, repeatable), at planned intervals (regular schedule), and results must be retained as documented information. This ensures reliable performance data.',
  },
  {
    id: 3,
    question: 'What is the purpose of internal audits in ISO 42001?',
    options: [
      'To punish employees',
      'To verify the AIMS conforms to requirements and is effectively implemented and maintained',
      'Only to satisfy certification bodies',
      'Only to find problems',
    ],
    correctAnswer: 1,
    explanation: 'Internal audits verify that the AIMS conforms to ISO 42001 requirements and the organization\'s own requirements, and that it is effectively implemented and maintained. Audits provide objective evidence of AIMS performance.',
  },
  {
    id: 4,
    question: 'How often should internal audits be conducted?',
    options: [
      'Only once before certification',
      'At planned intervals based on importance of processes and previous audit results',
      'Only when problems occur',
      'Only annually',
    ],
    correctAnswer: 1,
    explanation: 'Internal audits should be conducted at planned intervals, with frequency based on the importance of processes, changes affecting the organization, and results of previous audits. High-risk areas may be audited more frequently.',
  },
  {
    id: 5,
    question: 'What must be ensured about internal auditors?',
    options: [
      'They can audit their own work',
      'They are competent, objective, and impartial (not auditing their own work)',
      'They must be external consultants',
      'They need no special qualifications',
    ],
    correctAnswer: 1,
    explanation: 'Internal auditors must be competent (trained in auditing and AIMS), objective, and impartial. They must not audit their own work to maintain independence. Organizations should define auditor selection criteria and qualifications.',
  },
  {
    id: 6,
    question: 'What is the purpose of management review?',
    options: [
      'Only to review financial performance',
      'To ensure the AIMS remains suitable, adequate, and effective',
      'Only to satisfy auditors',
      'Only to review employee performance',
    ],
    correctAnswer: 1,
    explanation: 'Management review is a periodic evaluation by top management to ensure the AIMS continues to be suitable (aligned with organizational context), adequate (sufficient to meet requirements), and effective (achieving intended outcomes).',
  },
  {
    id: 7,
    question: 'How often should management reviews be conducted?',
    options: [
      'Only once per year',
      'At planned intervals (typically annually, but more frequently if needed)',
      'Only before certification audits',
      'Only when problems occur',
    ],
    correctAnswer: 1,
    explanation: 'Management reviews should be conducted at planned intervals, typically at least annually, but more frequently if significant changes occur or if performance issues arise. The frequency should be appropriate to organizational needs.',
  },
  {
    id: 8,
    question: 'What inputs should be considered in management review?',
    options: [
      'Only audit results',
      'Status of previous actions, changes, performance data, audit results, nonconformities, risks, and improvement opportunities',
      'Only financial reports',
      'Only customer complaints',
    ],
    correctAnswer: 1,
    explanation: 'Management review inputs should include: status of actions from previous reviews, changes affecting the AIMS, performance and effectiveness information, audit results, nonconformities and corrective actions, monitoring and measurement results, risks and opportunities, and opportunities for improvement.',
  },
  {
    id: 9,
    question: 'What outputs should result from management review?',
    options: [
      'Only meeting minutes',
      'Decisions on continual improvement, changes to AIMS, and resource needs',
      'Only action items',
      'Only approval signatures',
    ],
    correctAnswer: 1,
    explanation: 'Management review outputs should include decisions related to continual improvement opportunities, any need for changes to the AIMS (including resource needs), and actions if needed. These decisions should be documented and implemented.',
  },
  {
    id: 10,
    question: 'Should performance evaluation results be documented?',
    options: [
      'No, documentation is optional',
      'Yes, monitoring, measurement, audit, and management review results must be retained as evidence',
      'Only audit results need documentation',
      'Only if problems are found',
    ],
    correctAnswer: 1,
    explanation: 'Yes, organizations must retain documented information as evidence of monitoring and measurement results, internal audit programs and results, and management review outcomes. This provides objective evidence of AIMS performance and supports certification.',
  },
];

import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module4Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What must organizations do when planning the AIMS?',
    options: [
      'Only create a project timeline',
      'Determine risks and opportunities and plan actions to address them',
      'Only allocate budget',
      'Only hire staff',
    ],
    correctAnswer: 1,
    explanation: 'When planning the AIMS, organizations must determine risks and opportunities that need to be addressed to ensure the AIMS achieves intended outcomes, prevent undesired effects, and achieve continual improvement. They must then plan actions to address these risks and opportunities.',
  },
  {
    id: 2,
    question: 'What is AI risk assessment in ISO 42001?',
    options: [
      'Only technical risk assessment',
      'Systematic process to identify, analyze, and evaluate AI-related risks',
      'Only financial risk assessment',
      'Only cybersecurity risk assessment',
    ],
    correctAnswer: 1,
    explanation: 'AI risk assessment is a systematic process to identify AI-related risks (technical, ethical, legal, operational, reputational), analyze their likelihood and impact, and evaluate them against risk criteria. This informs risk treatment decisions.',
  },
  {
    id: 3,
    question: 'What are the four risk treatment options in ISO 42001?',
    options: [
      'Accept, ignore, delay, transfer',
      'Avoid, modify (mitigate), share (transfer), retain (accept)',
      'Only accept or reject',
      'Only mitigate',
    ],
    correctAnswer: 1,
    explanation: 'The four risk treatment options are: avoid the risk (don\'t deploy the AI system), modify the risk (implement controls to reduce it), share the risk (transfer via insurance or contracts), or retain the risk (accept it with justification).',
  },
  {
    id: 4,
    question: 'What must AI objectives be?',
    options: [
      'Vague and aspirational',
      'Consistent with AI policy, measurable, monitored, communicated, and updated',
      'Only financial targets',
      'Only technical targets',
    ],
    correctAnswer: 1,
    explanation: 'AI objectives must be consistent with the AI policy, measurable (where practicable), take into account applicable requirements and risk assessment results, be monitored, communicated, and updated as appropriate. They should be SMART (Specific, Measurable, Achievable, Relevant, Time-bound).',
  },
  {
    id: 5,
    question: 'What should be planned to achieve AI objectives?',
    options: [
      'Only budget allocation',
      'What will be done, resources needed, who is responsible, when it will be completed, and how results will be evaluated',
      'Only timelines',
      'Only team assignments',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must plan what will be done to achieve AI objectives, what resources are required, who will be responsible, when it will be completed, and how the results will be evaluated. This ensures objectives translate into concrete actions.',
  },
  {
    id: 6,
    question: 'Should AI risk assessment be documented?',
    options: [
      'No, documentation is optional',
      'Yes, risk assessment process and results must be retained as documented information',
      'Only for high-risk systems',
      'Only if legally required',
    ],
    correctAnswer: 1,
    explanation: 'Yes, organizations must retain documented information about the risk assessment process, identified risks, risk analysis and evaluation results, and risk treatment decisions. This provides evidence of systematic risk management and supports audits.',
  },
  {
    id: 7,
    question: 'How often should AI risk assessments be performed?',
    options: [
      'Only once at the start',
      'Regularly and when significant changes occur',
      'Only during audits',
      'Only when incidents happen',
    ],
    correctAnswer: 1,
    explanation: 'AI risk assessments should be performed regularly (e.g., annually) and whenever significant changes occur, such as new AI systems, changes to existing systems, new regulations, or incidents. Risks evolve and assessments must stay current.',
  },
  {
    id: 8,
    question: 'What is the relationship between risk assessment and Annex A controls?',
    options: [
      'They are unrelated',
      'Risk assessment informs which Annex A controls are applicable and necessary',
      'Annex A replaces risk assessment',
      'Risk assessment is optional if using Annex A',
    ],
    correctAnswer: 1,
    explanation: 'Risk assessment informs the selection and implementation of Annex A controls. Organizations assess risks, then determine which Annex A controls are applicable and necessary to treat those risks. Controls should be tailored to the organization\'s risk profile.',
  },
  {
    id: 9,
    question: 'Should opportunities be addressed in planning?',
    options: [
      'No, only risks matter',
      'Yes, opportunities to improve the AIMS and achieve better outcomes should be identified and pursued',
      'Only if resources are available',
      'Only in profitable years',
    ],
    correctAnswer: 1,
    explanation: 'Yes, organizations should identify and address opportunities to improve the AIMS, enhance AI system performance, increase stakeholder trust, gain competitive advantage, and achieve better outcomes. Opportunities are as important as risks.',
  },
  {
    id: 10,
    question: 'What is a Statement of Applicability (SoA) in ISO 42001?',
    options: [
      'A marketing document',
      'A document stating which Annex A controls are applicable, implemented, and excluded with justification',
      'A financial statement',
      'A technical specification',
    ],
    correctAnswer: 1,
    explanation: 'The Statement of Applicability (SoA) is a mandatory document that lists all Annex A controls, indicates which are applicable and implemented, which are excluded (with justification), and references the risk assessment. It demonstrates systematic control selection.',
  },
];

import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module5Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary purpose of internal audits under Clause 9 of ISO/IEC 42001?',
    options: [
      'To eliminate the need for external audits',
      'To find nonconformities and assign blame to employees',
      'To provide objective evidence that the AIMS conforms to requirements and is effectively implemented',
      'To audit only the AI development team',
    ],
    correctAnswer: 2,
    explanation: 'Clause 9.2 requires internal audits to determine whether the AIMS conforms to ISO/IEC 42001 requirements and is effectively implemented, providing objective evidence of system effectiveness.',
  },
  {
    id: 2,
    question: 'What should be included in an internal audit programme under ISO/IEC 42001?',
    options: [
      'Random audits without planning',
      'Audit frequency, scope, methods, auditor qualifications, and reporting procedures',
      'Only audits of IT systems',
      'Audit planning is the responsibility of external auditors only',
    ],
    correctAnswer: 1,
    explanation: 'Clause 9.2.1 requires a documented internal audit programme that defines the frequency, scope, methods, and responsibilities for conducting audits, ensuring systematic evaluation of the AIMS.',
  },
  {
    id: 3,
    question: 'According to Clause 9, what must be monitored and measured?',
    options: [
      'Only the number of AI systems deployed',
      'The processes and controls of the AIMS, including AI system performance, risk levels, and objective achievement',
      'Only financial metrics related to AI investments',
      'Monitoring and measurement are optional activities',
    ],
    correctAnswer: 1,
    explanation: 'Clause 9.1 requires the organization to determine what needs to be monitored and measured, how monitoring will be done, and the frequency of monitoring to evaluate AIMS performance.',
  },
  {
    id: 4,
    question: 'What is the primary purpose of management review under Clause 10?',
    options: [
      'To review only the CEO\'s performance',
      'To evaluate the continuing suitability, adequacy, and effectiveness of the AIMS',
      'To replace operational meetings',
      'Management review is optional for small organizations',
    ],
    correctAnswer: 1,
    explanation: 'Clause 10.3 requires top management to review the AIMS at planned intervals to evaluate its suitability, adequacy, and effectiveness, and to determine if improvements are needed.',
  },
  {
    id: 5,
    question: 'Which of the following should be inputs to the management review process?',
    options: [
      'Only recent financial performance data',
      'Internal audit results, performance monitoring data, risk assessment results, feedback from interested parties, and status of corrective actions',
      'Only customer complaints',
      'Inputs to management review are not specified in the standard',
    ],
    correctAnswer: 1,
    explanation: 'Clause 10.3.2 specifies that management review should consider internal audit results, monitoring and measurement results, nonconformities, feedback, risk assessments, and corrective action status.',
  },
  {
    id: 6,
    question: 'What are the outputs of a management review according to ISO/IEC 42001?',
    options: [
      'Only approval of the annual budget',
      'Decisions regarding needs for improvement, resource allocation, changes to the AIMS, and addressing identified gaps',
      'Management reviews do not produce formal outputs',
      'Outputs are determined by the CEO without consultation',
    ],
    correctAnswer: 1,
    explanation: 'Clause 10.3.3 requires management review outputs to include decisions and actions for improvement, resource allocation, changes to the AIMS, and addressing identified nonconformities.',
  },
  {
    id: 7,
    question: 'How does ISO/IEC 42001 define nonconformity?',
    options: [
      'Any deviation from organizational policy',
      'Failure to meet a requirement of ISO/IEC 42001 or the organization\'s AIMS',
      'Any employee who disagrees with management',
      'A situation where the AIMS is working perfectly',
    ],
    correctAnswer: 1,
    explanation: 'A nonconformity is identified when the AIMS fails to meet requirements of ISO/IEC 42001 or the organization\'s own documented AIMS requirements.',
  },
  {
    id: 8,
    question: 'What must be included in corrective action according to Clause 10?',
    options: [
      'Only temporary fixes to address immediate problems',
      'Root cause analysis, corrective action planning, implementation, effectiveness checking, and documentation',
      'Corrective actions are optional if the nonconformity was minor',
      'Corrective actions should address only symptoms, not root causes',
    ],
    correctAnswer: 1,
    explanation: 'Clause 10.2 requires that for nonconformities, the organization identify root causes, plan corrective actions, implement them, verify effectiveness, and document all corrective actions.',
  },
  {
    id: 9,
    question: 'According to Clause 10 (Improvement), what is the focus of continual improvement?',
    options: [
      'Only improving AI system accuracy metrics',
      'Enhancing the effectiveness of the AIMS, including processes, controls, and governance',
      'Improvement is optional if no nonconformities are identified',
      'Improvement initiatives require external consultants only',
    ],
    correctAnswer: 1,
    explanation: 'Clause 10.1 requires the organization to continually improve the suitability, adequacy, and effectiveness of the AIMS through planned improvement initiatives.',
  },
  {
    id: 10,
    question: 'How should findings from internal audits and management reviews be addressed?',
    options: [
      'Findings can be ignored if they are considered minor',
      'Findings must be documented and addressed through corrective actions, improvement initiatives, or resource allocation',
      'Only findings from external auditors need to be addressed',
      'Organizations can choose to address only the findings they prefer',
    ],
    correctAnswer: 1,
    explanation: 'Findings from both internal audits and management reviews must be documented and addressed through appropriate corrective actions or improvement initiatives as part of the continuous improvement cycle.',
  },
];

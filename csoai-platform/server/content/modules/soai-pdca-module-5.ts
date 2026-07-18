import type { QuizQuestion } from '@/types/quiz';

export const soaiPdcaModule5Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary focus of the ACT phase in SOAI-PDCA?',
    options: [
      'Initial planning',
      'Taking corrective and preventive actions based on CHECK findings',
      'System deployment',
      'Data collection',
    ],
    correctAnswer: 1,
    explanation: 'The ACT phase focuses on taking corrective actions to address identified issues and preventive actions to avoid future problems based on findings from CHECK.',
  },
  {
    id: 2,
    question: 'What types of actions are taken during ACT?',
    options: [
      'Only documentation updates',
      'Corrective actions, preventive actions, and improvement initiatives',
      'No actions needed',
      'Only technical fixes',
    ],
    correctAnswer: 1,
    explanation: 'ACT encompasses corrective actions (fixing identified problems), preventive actions (preventing recurrence), and improvement initiatives (enhancing system performance and safety).',
  },
  {
    id: 3,
    question: 'How should improvement priorities be determined in ACT?',
    options: [
      'Address all issues equally',
      'Prioritize based on risk severity, impact, and alignment with objectives',
      'Random selection',
      'Only quick fixes first',
    ],
    correctAnswer: 1,
    explanation: 'Improvement priorities are determined based on risk severity, potential impact, alignment with organizational objectives, and resource availability.',
  },
  {
    id: 4,
    question: 'What role does root cause analysis play in ACT?',
    options: [
      'Not required',
      'Essential for developing effective corrective and preventive actions',
      'Optional for major issues only',
      'Performed after improvements',
    ],
    correctAnswer: 1,
    explanation: 'Root cause analysis is essential for developing effective actions, ensuring improvements address underlying causes rather than just symptoms.',
  },
  {
    id: 5,
    question: 'How does ACT prepare for the next PDCA cycle?',
    options: [
      'No connection to next cycle',
      'Lessons learned and improvement plans feed into updated PLAN objectives',
      'Start from scratch each cycle',
      'Repeat same plan',
    ],
    correctAnswer: 1,
    explanation: 'ACT directly feeds the next PDCA cycle, with lessons learned, improvement plans, and updated understanding informing revised PLAN objectives for continuous improvement.',
  },
  {
    id: 6,
    question: 'What documentation is required during ACT?',
    options: [
      'No documentation needed',
      'Action plans, implementation records, and effectiveness verification',
      'Only financial records',
      'Verbal updates only',
    ],
    correctAnswer: 1,
    explanation: 'ACT requires documentation of action plans, implementation records, effectiveness verification results, and lessons learned for organizational knowledge management.',
  },
  {
    id: 7,
    question: 'How should corrective action effectiveness be verified?',
    options: [
      'Assume actions are effective',
      'Systematic verification that actions resolved identified issues',
      'Verification is optional',
      'Wait for problems to recur',
    ],
    correctAnswer: 1,
    explanation: 'Effectiveness verification systematically confirms that corrective actions resolved identified issues and preventive actions successfully prevent recurrence.',
  },
  {
    id: 8,
    question: 'What role does stakeholder communication play in ACT?',
    options: [
      'No communication needed',
      'Communicate improvements, changes, and lessons learned to stakeholders',
      'Internal communication only',
      'Communication after next cycle',
    ],
    correctAnswer: 1,
    explanation: 'Stakeholder communication during ACT shares information about improvements made, changes implemented, and lessons learned, maintaining transparency and trust.',
  },
  {
    id: 9,
    question: 'How does ACT address systemic issues identified in CHECK?',
    options: [
      'Only address symptoms',
      'Develop comprehensive solutions addressing systemic root causes',
      'Systemic issues are ignored',
      'Document for future consideration',
    ],
    correctAnswer: 1,
    explanation: 'ACT develops comprehensive solutions for systemic issues, addressing root causes through process changes, governance updates, or organizational improvements.',
  },
  {
    id: 10,
    question: 'What is the relationship between ACT and organizational learning?',
    options: [
      'No relationship',
      'ACT captures and disseminates lessons learned across the organization',
      'Learning is separate',
      'Learning happens automatically',
    ],
    correctAnswer: 1,
    explanation: 'ACT is closely tied to organizational learning, capturing lessons from each cycle and disseminating insights to improve AI governance practices organization-wide.',
  },
];

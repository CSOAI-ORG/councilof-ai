import type { QuizQuestion } from '@/types/quiz';

export const soaiPdcaModule4Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary focus of the CHECK phase in SOAI-PDCA?',
    options: [
      'Implementation activities',
      'Monitoring, measuring, and evaluating AI system performance against objectives',
      'Planning improvements',
      'Initial development',
    ],
    correctAnswer: 1,
    explanation: 'The CHECK phase focuses on monitoring, measuring, and evaluating AI system performance, safety, and ethical alignment against the objectives established in PLAN.',
  },
  {
    id: 2,
    question: 'What metrics should be monitored during CHECK?',
    options: [
      'Only accuracy metrics',
      'Safety, performance, fairness, robustness, and compliance metrics',
      'Financial metrics only',
      'No metrics needed',
    ],
    correctAnswer: 1,
    explanation: 'CHECK phase monitoring covers comprehensive metrics including safety indicators, performance measures, fairness metrics, robustness assessments, and compliance status.',
  },
  {
    id: 3,
    question: 'How should AI system performance be evaluated in CHECK?',
    options: [
      'Subjective assessment only',
      'Systematic comparison against planned objectives and defined thresholds',
      'User opinions only',
      'Evaluation is optional',
    ],
    correctAnswer: 1,
    explanation: 'Performance evaluation uses systematic comparison of actual results against planned objectives, defined thresholds, and success criteria established during PLAN.',
  },
  {
    id: 4,
    question: 'What role does bias monitoring play in CHECK?',
    options: [
      'Bias monitoring is not needed',
      'Ongoing detection of bias emergence and fairness degradation',
      'One-time bias check only',
      'Bias monitoring after complaints',
    ],
    correctAnswer: 1,
    explanation: 'Ongoing bias monitoring is essential in CHECK, detecting potential bias emergence, fairness degradation over time, and disparate impacts across user groups.',
  },
  {
    id: 5,
    question: 'How does SOAI-PDCA address model drift in CHECK?',
    options: [
      'Model drift is not monitored',
      'Continuous monitoring for performance and behavior changes over time',
      'Drift checked annually only',
      'Drift is acceptable',
    ],
    correctAnswer: 1,
    explanation: 'CHECK includes continuous monitoring for model drift, detecting changes in model performance, prediction patterns, and alignment with intended behavior over time.',
  },
  {
    id: 6,
    question: 'What incident monitoring is required in CHECK?',
    options: [
      'No incident monitoring',
      'Detection, logging, and analysis of AI-related incidents and near-misses',
      'Only major incidents',
      'Incident monitoring is optional',
    ],
    correctAnswer: 1,
    explanation: 'CHECK requires monitoring for AI-related incidents and near-misses, with systematic logging, analysis, and tracking to identify patterns and improvement opportunities.',
  },
  {
    id: 7,
    question: 'How should stakeholder feedback be incorporated in CHECK?',
    options: [
      'Feedback is not collected',
      'Systematic collection and analysis of user and stakeholder feedback',
      'Only complaint handling',
      'Feedback collected annually',
    ],
    correctAnswer: 1,
    explanation: 'Stakeholder feedback is systematically collected and analyzed during CHECK, including user satisfaction, concerns, and observations about AI system behavior.',
  },
  {
    id: 8,
    question: 'What documentation is produced during CHECK?',
    options: [
      'No documentation needed',
      'Monitoring reports, evaluation results, and gap analyses',
      'Only incident reports',
      'Documentation postponed',
    ],
    correctAnswer: 1,
    explanation: 'CHECK produces comprehensive documentation including monitoring reports, evaluation results, gap analyses comparing actual vs. planned performance, and trend analyses.',
  },
  {
    id: 9,
    question: 'How does CHECK support regulatory compliance?',
    options: [
      'Compliance not addressed in CHECK',
      'Ongoing monitoring of compliance status and audit trail maintenance',
      'Compliance checked only during audits',
      'Self-certification only',
    ],
    correctAnswer: 1,
    explanation: 'CHECK supports compliance through ongoing monitoring of regulatory requirements, maintenance of audit trails, and documentation of compliance evidence.',
  },
  {
    id: 10,
    question: 'What is the output of CHECK that feeds into ACT?',
    options: [
      'No formal output',
      'Evaluation findings, identified gaps, and improvement recommendations',
      'Only success confirmation',
      'Financial reports',
    ],
    correctAnswer: 1,
    explanation: 'CHECK produces evaluation findings, identified gaps between planned and actual performance, root cause analyses, and recommendations for improvement that feed into ACT.',
  },
];

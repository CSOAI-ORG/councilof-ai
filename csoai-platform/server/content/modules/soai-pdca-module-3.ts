import type { QuizQuestion } from '@/types/quiz';

export const soaiPdcaModule3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary focus of the DO phase in SOAI-PDCA?',
    options: [
      'Planning activities',
      'Implementing the AI system according to planned safety and performance requirements',
      'Only monitoring',
      'Improvement actions',
    ],
    correctAnswer: 1,
    explanation: 'The DO phase focuses on implementing the AI system according to the objectives, safety requirements, and governance structures established during the PLAN phase.',
  },
  {
    id: 2,
    question: 'What development practices are emphasized in the DO phase?',
    options: [
      'Speed over safety',
      'Safety-by-design, responsible AI development, and quality assurance',
      'Minimal testing',
      'No documentation during development',
    ],
    correctAnswer: 1,
    explanation: 'The DO phase emphasizes safety-by-design principles, responsible AI development practices, comprehensive testing, and quality assurance throughout implementation.',
  },
  {
    id: 3,
    question: 'How should data handling be approached during DO?',
    options: [
      'Use any available data',
      'Ensure data quality, privacy compliance, and bias assessment',
      'Data quality is not important',
      'Skip data validation',
    ],
    correctAnswer: 1,
    explanation: 'Data handling during DO must ensure data quality, privacy compliance, bias assessment in training data, and appropriate data governance practices.',
  },
  {
    id: 4,
    question: 'What testing is required during the DO phase?',
    options: [
      'Testing is optional',
      'Comprehensive testing including safety, performance, fairness, and robustness',
      'Only functional testing',
      'Testing after deployment',
    ],
    correctAnswer: 1,
    explanation: 'DO phase testing must be comprehensive, covering safety validation, performance verification, fairness assessment, robustness testing, and security evaluation.',
  },
  {
    id: 5,
    question: 'How does SOAI-PDCA address model development in DO?',
    options: [
      'No guidance on model development',
      'Structured development with checkpoints, reviews, and safety validation',
      'Fastest development approach',
      'Model development is outsourced',
    ],
    correctAnswer: 1,
    explanation: 'Model development follows structured approaches with defined checkpoints, peer reviews, safety validation gates, and documentation of design decisions and trade-offs.',
  },
  {
    id: 6,
    question: 'What role does documentation play during DO?',
    options: [
      'Documentation is postponed',
      'Continuous documentation of implementation decisions, test results, and issues',
      'Only final documentation',
      'Documentation is discouraged',
    ],
    correctAnswer: 1,
    explanation: 'Documentation during DO is continuous, capturing implementation decisions, test results, identified issues, and their resolutions to support later phases.',
  },
  {
    id: 7,
    question: 'How should the DO phase handle identified risks during implementation?',
    options: [
      'Ignore implementation risks',
      'Implement planned mitigations and escalate new risks for assessment',
      'Document but dont address',
      'Risks are not relevant in DO',
    ],
    correctAnswer: 1,
    explanation: 'During DO, planned risk mitigations are implemented, and newly identified risks are documented and escalated for assessment, potentially triggering plan adjustments.',
  },
  {
    id: 8,
    question: 'What human oversight mechanisms should be implemented in DO?',
    options: [
      'No human oversight needed',
      'Design and implement oversight capabilities as specified in PLAN',
      'Oversight added post-deployment',
      'Automated oversight only',
    ],
    correctAnswer: 1,
    explanation: 'Human oversight mechanisms specified in PLAN must be designed and implemented during DO, including intervention capabilities, monitoring interfaces, and escalation paths.',
  },
  {
    id: 9,
    question: 'How does SOAI-PDCA address deployment in the DO phase?',
    options: [
      'Immediate full deployment',
      'Controlled deployment with staged rollout and monitoring activation',
      'Deployment is separate from DO',
      'No deployment guidance',
    ],
    correctAnswer: 1,
    explanation: 'Deployment follows controlled approaches including staged rollout, monitoring system activation, and verification that all planned safety measures are operational.',
  },
  {
    id: 10,
    question: 'What transition occurs from DO to CHECK?',
    options: [
      'Abrupt handoff',
      'Smooth transition with implementation evidence enabling systematic evaluation',
      'No transition needed',
      'CHECK starts before DO ends',
    ],
    correctAnswer: 1,
    explanation: 'The transition from DO to CHECK is smooth, with implementation documentation and evidence enabling systematic evaluation of whether objectives were achieved.',
  },
];

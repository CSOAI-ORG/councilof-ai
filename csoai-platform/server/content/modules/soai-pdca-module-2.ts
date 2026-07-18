import type { QuizQuestion } from '@/types/quiz';

export const soaiPdcaModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary focus of the PLAN phase in SOAI-PDCA?',
    options: [
      'Immediate deployment',
      'Establishing safety objectives, risk assessments, and governance structures',
      'Cost reduction planning',
      'Marketing strategy',
    ],
    correctAnswer: 1,
    explanation: 'The PLAN phase focuses on establishing AI safety objectives, conducting comprehensive risk assessments, and setting up appropriate governance structures before development or deployment.',
  },
  {
    id: 2,
    question: 'What key activities occur during the PLAN phase for AI systems?',
    options: [
      'Model training only',
      'Risk identification, objective setting, and resource planning',
      'System deployment',
      'User training only',
    ],
    correctAnswer: 1,
    explanation: 'PLAN phase activities include identifying AI-specific risks, setting clear safety and performance objectives, planning resources, and defining success criteria and monitoring approaches.',
  },
  {
    id: 3,
    question: 'How should AI safety objectives be defined in the PLAN phase?',
    options: [
      'Vague aspirations',
      'Specific, measurable, achievable, relevant, and time-bound (SMART)',
      'Only qualitative goals',
      'Objectives are optional',
    ],
    correctAnswer: 1,
    explanation: 'AI safety objectives should be SMART: Specific to AI risks, Measurable through defined metrics, Achievable with available resources, Relevant to stakeholder needs, and Time-bound.',
  },
  {
    id: 4,
    question: 'What role does stakeholder analysis play in the PLAN phase?',
    options: [
      'No stakeholder consideration needed',
      'Identifying affected parties and their requirements for AI system performance',
      'Only internal stakeholders matter',
      'Stakeholder analysis occurs after deployment',
    ],
    correctAnswer: 1,
    explanation: 'Stakeholder analysis identifies all parties affected by the AI system, their requirements, concerns, and expectations, informing planning decisions and success criteria.',
  },
  {
    id: 5,
    question: 'How does SOAI-PDCA address AI risk assessment in the PLAN phase?',
    options: [
      'Risk assessment is optional',
      'Systematic identification and prioritization of AI-specific risks',
      'Only technical risks considered',
      'Risk assessment after deployment only',
    ],
    correctAnswer: 1,
    explanation: 'SOAI-PDCA requires systematic identification of AI-specific risks (bias, safety, security, ethical) and prioritization based on likelihood and impact during planning.',
  },
  {
    id: 6,
    question: 'What governance elements should be established during PLAN?',
    options: [
      'No governance needed in PLAN',
      'Roles, responsibilities, decision authority, and escalation procedures',
      'Only technical documentation',
      'Governance comes after deployment',
    ],
    correctAnswer: 1,
    explanation: 'The PLAN phase establishes governance elements including roles and responsibilities, decision-making authority, escalation procedures, and oversight mechanisms.',
  },
  {
    id: 7,
    question: 'How should ethical considerations be addressed in PLAN?',
    options: [
      'Ethics considered only if required by law',
      'Proactive ethical analysis integrated into planning from the start',
      'Ethics are not part of planning',
      'Ethical review after development',
    ],
    correctAnswer: 1,
    explanation: 'Ethical considerations should be proactively integrated into planning, including fairness assessments, privacy considerations, and potential societal impacts.',
  },
  {
    id: 8,
    question: 'What documentation is required during the PLAN phase?',
    options: [
      'No documentation needed',
      'Objectives, risk assessments, resource plans, and success criteria',
      'Only code documentation',
      'Documentation is discouraged',
    ],
    correctAnswer: 1,
    explanation: 'PLAN phase documentation includes clearly stated objectives, risk assessments, resource allocation plans, success criteria, and the rationale behind planning decisions.',
  },
  {
    id: 9,
    question: 'How does PLAN address AI system performance requirements?',
    options: [
      'Performance is not planned',
      'Define performance metrics, thresholds, and testing approaches',
      'Only accuracy matters',
      'Performance assessed only in production',
    ],
    correctAnswer: 1,
    explanation: 'PLAN defines performance metrics (accuracy, fairness, robustness), acceptable thresholds, testing methodologies, and approaches for ongoing performance monitoring.',
  },
  {
    id: 10,
    question: 'What is the relationship between PLAN and subsequent PDCA phases?',
    options: [
      'PLAN is independent',
      'PLAN sets the foundation that guides DO, CHECK, and ACT activities',
      'Phases can be skipped',
      'PLAN is optional',
    ],
    correctAnswer: 1,
    explanation: 'PLAN establishes the foundation for all subsequent phases, with objectives guiding implementation (DO), criteria informing evaluation (CHECK), and improvement priorities directing actions (ACT).',
  },
];

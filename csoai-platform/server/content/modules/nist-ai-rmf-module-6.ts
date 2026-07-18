import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule6Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary purpose of the MANAGE function?',
    options: [
      'To manage budgets',
      'To respond to AI risks, incidents, and changes through regular practices',
      'To manage development teams',
      'To manage marketing campaigns',
    ],
    correctAnswer: 1,
    explanation: 'The MANAGE function involves responding to identified AI risks, incidents, and changes through regular practices including risk response planning, incident response, continuous improvement, and adaptation to evolving contexts.',
  },
  {
    id: 2,
    question: 'What are the key components of AI risk response?',
    options: [
      'Ignoring risks',
      'Risk avoidance, mitigation, transfer, and acceptance based on risk tolerance',
      'Only risk acceptance',
      'Only risk transfer',
    ],
    correctAnswer: 1,
    explanation: 'AI risk response includes four strategies: risk avoidance (not deploying the system), risk mitigation (implementing controls), risk transfer (insurance, contracts), and risk acceptance (acknowledging residual risk). The choice depends on risk level and organizational tolerance.',
  },
  {
    id: 3,
    question: 'Should organizations have an AI incident response plan?',
    options: [
      'No, incidents are unlikely',
      'Yes, organizations should have plans to detect, respond to, and recover from AI incidents',
      'Only for large organizations',
      'Only if legally required',
    ],
    correctAnswer: 1,
    explanation: 'Yes, organizations should have AI incident response plans that define roles, responsibilities, escalation procedures, communication protocols, and recovery processes. This enables rapid, coordinated responses when AI systems fail or cause harm.',
  },
  {
    id: 4,
    question: 'What is the purpose of continuous monitoring in the MANAGE function?',
    options: [
      'To micromanage teams',
      'To detect performance degradation, emerging risks, and incidents in real-time',
      'To reduce costs',
      'To avoid documentation',
    ],
    correctAnswer: 1,
    explanation: 'Continuous monitoring detects performance degradation, emerging risks, incidents, and changes in operational context in real-time. It enables timely interventions before small issues become major incidents.',
  },
  {
    id: 5,
    question: 'Should AI systems be updated after deployment?',
    options: [
      'No, systems should remain static',
      'Yes, systems should be updated to address risks, improve performance, and adapt to changes',
      'Only if they fail completely',
      'Only once per year',
    ],
    correctAnswer: 1,
    explanation: 'Yes, AI systems should be updated regularly to address identified risks, improve performance, fix bugs, adapt to data distribution shifts, and respond to stakeholder feedback. Updates should follow change management processes.',
  },
  {
    id: 6,
    question: 'What is the role of stakeholder feedback in the MANAGE function?',
    options: [
      'Stakeholder feedback is unnecessary',
      'Stakeholder feedback informs risk management, incident response, and continuous improvement',
      'Stakeholder feedback is only for marketing',
      'Stakeholder feedback should be ignored',
    ],
    correctAnswer: 1,
    explanation: 'Stakeholder feedback (from users, affected individuals, regulators, civil society) is essential for identifying real-world impacts, emerging risks, and improvement opportunities. It should be systematically collected, analyzed, and acted upon.',
  },
  {
    id: 7,
    question: 'Should AI systems be decommissioned when appropriate?',
    options: [
      'No, systems should run forever',
      'Yes, systems should be decommissioned when they no longer meet risk thresholds or serve their purpose',
      'Only if they break',
      'Only if legally forced',
    ],
    correctAnswer: 1,
    explanation: 'Yes, AI systems should be decommissioned when they no longer meet risk thresholds, serve their intended purpose, comply with regulations, or align with organizational values. Decommissioning should follow a structured process.',
  },
  {
    id: 8,
    question: 'What is the purpose of change management in AI systems?',
    options: [
      'To prevent all changes',
      'To ensure changes are evaluated for risks, tested, and deployed safely',
      'To speed up deployment',
      'To reduce documentation',
    ],
    correctAnswer: 1,
    explanation: 'Change management ensures that modifications to AI systems (model updates, data changes, configuration changes) are evaluated for risks, tested thoroughly, documented, and deployed safely. It prevents unintended consequences from changes.',
  },
  {
    id: 9,
    question: 'How does the MANAGE function relate to the MEASURE function?',
    options: [
      'They are unrelated',
      'MEASURE provides data that triggers MANAGE actions; MANAGE implements responses',
      'MANAGE replaces MEASURE',
      'MEASURE comes after MANAGE',
    ],
    correctAnswer: 1,
    explanation: 'MEASURE provides data, metrics, and insights that trigger MANAGE actions. When measurement detects issues, MANAGE implements responses. MANAGE actions are then measured to verify effectiveness, creating a feedback loop.',
  },
  {
    id: 10,
    question: 'Should AI risk management be documented?',
    options: [
      'No, documentation is unnecessary',
      'Yes, risk management activities, decisions, and rationales should be documented for accountability and learning',
      'Only for audits',
      'Only if legally required',
    ],
    correctAnswer: 1,
    explanation: 'Yes, risk management activities, decisions, rationales, and outcomes should be documented. Documentation supports accountability, enables learning, facilitates audits, and helps demonstrate due diligence to stakeholders and regulators.',
  },
];

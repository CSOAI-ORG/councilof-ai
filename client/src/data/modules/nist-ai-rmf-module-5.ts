import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule5Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary purpose of the MANAGE function in the NIST AI RMF?',
    options: [
      'To eliminate all uncertainty in AI projects',
      'To develop strategies for responding to identified risks and implementing controls',
      'To measure model accuracy',
      'To design AI systems without risks',
    ],
    correctAnswer: 1,
    explanation: 'The MANAGE function focuses on developing risk response strategies and implementing measures to address, mitigate, or manage the risks identified through the MAP and MEASURE functions.',
  },
  {
    id: 2,
    question: 'Which of the following is a valid risk response strategy in the MANAGE function?',
    options: [
      'Ignore all identified risks',
      'Accept, mitigate, transfer, or avoid risks depending on organizational context and risk tolerance',
      'Always mitigate every risk immediately',
      'Risks cannot be managed in AI systems',
    ],
    correctAnswer: 1,
    explanation: 'Organizations can choose to accept certain risks that fall within their risk tolerance, mitigate risks through controls and measures, transfer risks through insurance or contracts, or avoid risks by not pursuing certain AI projects.',
  },
  {
    id: 3,
    question: 'What is a mitigation measure in the context of AI risk management?',
    options: [
      'Removing all AI systems from the organization',
      'An action, control, or intervention taken to reduce the likelihood or impact of an identified risk',
      'Telling employees not to use AI',
      'Keeping AI systems confidential from all users',
    ],
    correctAnswer: 1,
    explanation: 'Mitigation measures are specific actions or controls implemented to reduce risk. Examples include adding human oversight, improving data quality, implementing fairness constraints, or adding security controls.',
  },
  {
    id: 4,
    question: 'Which of the following is an example of a technical mitigation control?',
    options: [
      'Increasing the marketing budget for an AI product',
      'Implementing adversarial robustness testing or fairness constraints in the model',
      'Hiring more managers',
      'Reducing employee salaries',
    ],
    correctAnswer: 1,
    explanation: 'Technical controls include measures like robustness testing, fairness-aware ML techniques, model monitoring, input validation, and security measures to reduce AI-specific risks.',
  },
  {
    id: 5,
    question: 'What is the role of continuous monitoring in the MANAGE function?',
    options: [
      'Monitoring is only done during the development phase',
      'To track system performance, identify when risks are increasing, and trigger response actions if needed',
      'Monitoring is not necessary once deployment is complete',
      'Monitoring only applies to cybersecurity, not AI risk',
    ],
    correctAnswer: 1,
    explanation: 'Continuous monitoring involves ongoing observation of AI system performance and behavior in production to detect drift, emerging risks, changing stakeholder impacts, and violations of performance criteria.',
  },
  {
    id: 6,
    question: 'What should be included in an incident response plan for AI systems?',
    options: [
      'Only responses to system crashes',
      'Procedures for detecting, investigating, and responding to AI-related incidents such as biased decisions, security breaches, or harmful predictions',
      'Response plans are not needed for AI systems',
      'Only responses to missing data',
    ],
    correctAnswer: 1,
    explanation: 'AI incident response plans should address detection and investigation of adverse events, communication strategies, remediation steps, stakeholder notification, and processes for learning and improvement.',
  },
  {
    id: 7,
    question: 'What is the purpose of documentation and reporting in the MANAGE function?',
    options: [
      'Documentation is busywork with no practical value',
      'To maintain records of risks, mitigation measures, decisions, and outcomes for accountability and continuous improvement',
      'Only for regulatory compliance',
      'Documentation should be minimal to save time',
    ],
    correctAnswer: 1,
    explanation: 'Comprehensive documentation supports accountability, enables institutional learning, demonstrates due diligence, facilitates audits, and helps organizations improve risk management practices over time.',
  },
  {
    id: 8,
    question: 'How does human oversight contribute to managing AI risks?',
    options: [
      'Human oversight slows down AI systems',
      'Humans should never be involved in AI decision-making',
      'Human review and approval can help catch errors, bias, and harmful outcomes before decisions are implemented',
      'Human involvement is only needed for simple AI systems',
    ],
    correctAnswer: 2,
    explanation: 'Human-in-the-loop oversight provides additional assurance by enabling people to review, question, or override AI decisions in critical or high-stakes situations.',
  },
  {
    id: 9,
    question: 'What is the relationship between MANAGE and organizational policies?',
    options: [
      'Policies have no relationship to MANAGE',
      'Organizational policies should require compliance with MANAGE practices and risk response strategies',
      'Policies are only for human resources',
      'Policies should discourage risk management',
    ],
    correctAnswer: 1,
    explanation: 'Effective MANAGE practices require supporting organizational policies that establish expectations, allocate responsibility, provide resources, and ensure consistent implementation across the organization.',
  },
  {
    id: 10,
    question: 'How should organizations approach the MANAGE function over the AI system lifecycle?',
    options: [
      'Risk management only happens before deployment',
      'Risk management ends after the system is deployed',
      'Continuous, iterative management of risks throughout the entire lifecycle, with regular review and adjustment of strategies',
      'Risk management is a one-time activity',
    ],
    correctAnswer: 2,
    explanation: 'MANAGE is an ongoing function that continues throughout the AI lifecycle. As systems evolve, new risks emerge, and organizational context changes, risk management strategies should be regularly reviewed and updated.',
  },
];

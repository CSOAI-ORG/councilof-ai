import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary purpose of conformity assessment for high-risk AI systems?',
    options: [
      'To ensure the AI system is profitable for the company',
      'To verify that the high-risk AI system complies with EU AI Act requirements before market entry',
      'To determine the maximum number of users the system can serve',
      'To establish the price point for the AI system in the market'
    ],
    correctAnswer: 1,
    explanation: 'Conformity assessment is a mandatory evaluation process to verify that high-risk AI systems meet all EU AI Act requirements including technical documentation, quality management, human oversight, and safety measures before deployment.'
  },
  {
    id: 2,
    question: 'Which of the following must be included in the technical documentation for a high-risk AI system?',
    options: [
      'Only the names of the software developers',
      'General description of the system\'s purpose, design choices, training data, testing procedures, and performance metrics',
      'A marketing plan for the AI system',
      'The exact source code without any modifications allowed'
    ],
    correctAnswer: 1,
    explanation: 'Technical documentation for high-risk systems must comprehensively cover the AI system\'s purpose, design specifications, training and validation data, testing results, performance metrics, and risk management documentation. This ensures transparency and traceability.'
  },
  {
    id: 3,
    question: 'What is a quality management system in the context of high-risk AI systems?',
    options: [
      'A system that ensures the AI system generates perfect results without errors',
      'Procedures to manage data quality, testing, maintenance, and continuous improvement of the AI system',
      'A process to eliminate all users who provide negative feedback',
      'A requirement that all AI training must be completed within 30 days'
    ],
    correctAnswer: 1,
    explanation: 'A quality management system encompasses procedures for data quality assurance, system testing, performance monitoring, maintenance protocols, and continuous improvement mechanisms to ensure high-risk AI systems remain compliant and safe throughout their lifecycle.'
  },
  {
    id: 4,
    question: 'What is post-market monitoring for high-risk AI systems?',
    options: [
      'Advertising the AI system after it launches in the market',
      'Continuous surveillance of the AI system\'s performance, identifying issues, and taking corrective actions after deployment',
      'Monitoring competitors\' AI systems to maintain market advantage',
      'Sending surveys to users asking if they like the AI system'
    ],
    correctAnswer: 1,
    explanation: 'Post-market monitoring involves collecting and analyzing data on the AI system\'s performance, identifying potential issues or non-compliance, and implementing corrective measures to ensure ongoing safety and compliance after the system is deployed in the market.'
  },
  {
    id: 5,
    question: 'Who is responsible for maintaining technical documentation for a high-risk AI system?',
    options: [
      'Only the European Commission',
      'The provider (developer or deployer) of the high-risk AI system',
      'Only national data protection authorities',
      'An AI system is not responsible for anything; only humans can have responsibility'
    ],
    correctAnswer: 1,
    explanation: 'The provider of a high-risk AI system is legally responsible for creating, maintaining, and updating technical documentation. This documentation must be kept available for regulatory inspection and must be understandable to competent authorities.'
  },
  {
    id: 6,
    question: 'How long must high-risk AI system providers retain technical documentation and records?',
    options: [
      'Only while the system is actively being used',
      'For at least 5 years after the AI system is no longer in use',
      'Indefinitely, with no time limit',
      'The documentation can be deleted immediately after system deployment'
    ],
    correctAnswer: 1,
    explanation: 'Providers must maintain technical documentation and post-market monitoring records for at least 5 years after the AI system is no longer placed on the market. This enables regulatory oversight and supports investigations of potential harms.'
  },
  {
    id: 7,
    question: 'What role does human oversight play in the compliance requirements for high-risk AI systems?',
    options: [
      'Human oversight is optional and companies can choose whether to implement it',
      'Humans must be able to understand, monitor, and override high-risk AI system decisions',
      'Only artificial intelligence is allowed to monitor other AI systems',
      'Human oversight is only required for systems that make mistakes more than 5% of the time'
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act requires meaningful human oversight for high-risk AI systems. Humans must be able to understand the system\'s functioning, monitor its operations, intervene when necessary, and override automated decisions, particularly for critical determinations.'
  },
  {
    id: 8,
    question: 'Which of these is NOT typically a requirement for high-risk AI systems?',
    options: [
      'Risk assessment and mitigation strategy',
      'Conformity assessment before market placement',
      'Registration in the EU AI database',
      'Immediate deletion of all user data every 24 hours'
    ],
    correctAnswer: 3,
    explanation: 'There is no requirement to delete all data every 24 hours. High-risk systems must conduct risk assessments, undergo conformity assessments, maintain technical documentation, be registered in databases, and implement appropriate data governance - but not mandatory daily data deletion.'
  },
  {
    id: 9,
    question: 'What is the purpose of registering high-risk AI systems in the EU AI database?',
    options: [
      'To prevent the system from being used by competitors',
      'To create transparency and enable regulatory oversight of high-risk AI systems in the EU market',
      'To automatically shut down the system if it causes any error',
      'To increase the system\'s performance by 50%'
    ],
    correctAnswer: 1,
    explanation: 'The EU AI database is a transparency mechanism that allows authorities and the public to track which high-risk AI systems are deployed in the EU. This supports market surveillance, enforcement, and public accountability.'
  },
  {
    id: 10,
    question: 'How does the conformity assessment process differ between notified bodies and non-notified assessment approaches?',
    options: [
      'Notified bodies are always incorrect, while self-assessments are always correct',
      'Notified bodies are independent third-party assessors designated by member states, while self-assessment is conducted by the provider itself under EU AI Act framework',
      'There is no difference; both are identical processes',
      'Notified bodies only assess AI systems larger than 1000 megabytes'
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act allows two pathways: assessment by notified bodies (independent third-party certification bodies designated by member states) or self-assessment by the provider following EU conformity procedures. Both approaches must demonstrate compliance with technical requirements, but notified body assessment provides independent verification.'
  }
];

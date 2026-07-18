import type { QuizQuestion } from '@/types/quiz';

export const aiSafetyFundamentalsModule3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is a "safety-critical AI system"?',
    options: [
      'Any AI system used in business operations',
      'AI systems where failures could result in serious harm to people or property',
      'AI systems with advanced security features',
      'AI systems that monitor other AI systems',
    ],
    correctAnswer: 1,
    explanation: 'Safety-critical AI systems are those where failures or malfunctions could result in death, injury, significant environmental damage, or major property damage. Examples include autonomous vehicles, medical AI, and industrial control systems.',
  },
  {
    id: 2,
    question: 'What is "catastrophic forgetting" in AI systems?',
    options: [
      'Complete data loss due to hardware failure',
      'When an AI system loses previously learned knowledge while learning new tasks',
      'Users forgetting how to operate AI systems',
      'AI systems failing to save new information',
    ],
    correctAnswer: 1,
    explanation: 'Catastrophic forgetting occurs when neural networks lose previously learned knowledge while learning new tasks. This is a safety concern because AI systems may lose critical safety-relevant behaviors during updates.',
  },
  {
    id: 3,
    question: 'What role does "testing in deployment" play in AI safety?',
    options: [
      'Testing should only occur before deployment',
      'Continuous monitoring and testing in production to detect issues with real-world data',
      'Deployment testing is optional for AI systems',
      'Testing in deployment replaces pre-deployment testing',
    ],
    correctAnswer: 1,
    explanation: 'Testing in deployment involves continuous monitoring and testing of AI systems in production environments. This is essential because real-world data often differs from test data, and issues may only emerge during actual use.',
  },
  {
    id: 4,
    question: 'What is an "AI incident"?',
    options: [
      'Any bug in AI software code',
      'An event where an AI system causes or nearly causes harm, or behaves unexpectedly',
      'A scheduled AI system update',
      'A meeting about AI development',
    ],
    correctAnswer: 1,
    explanation: 'An AI incident is an event where an AI system causes harm, nearly causes harm, or behaves in unexpected ways that could lead to harm. Documenting and learning from incidents is crucial for improving AI safety.',
  },
  {
    id: 5,
    question: 'What is the purpose of an "AI safety incident database"?',
    options: [
      'Storing AI training data',
      'Tracking employee performance',
      'Collecting and sharing information about AI failures to prevent future incidents',
      'Recording AI system configurations',
    ],
    correctAnswer: 2,
    explanation: 'AI safety incident databases collect and share information about AI failures and near-misses. This allows the broader community to learn from incidents and implement preventive measures, similar to aviation incident databases.',
  },
  {
    id: 6,
    question: 'What is "value lock-in" as an AI safety concern?',
    options: [
      'Protecting AI intellectual property',
      'The risk of AI systems embedding particular values that become difficult to change',
      'Securing AI systems with encryption',
      'Locking AI development to specific vendors',
    ],
    correctAnswer: 1,
    explanation: 'Value lock-in refers to the concern that AI systems might embed particular values or objectives that become increasingly difficult to modify as the systems become more powerful or widely deployed.',
  },
  {
    id: 7,
    question: 'What is "corrigibility" in AI safety?',
    options: [
      'The ability of AI to correct its own errors',
      'The property of an AI system being amenable to correction, shutdown, or modification by humans',
      'Error correction in AI data transmission',
      'Self-correcting algorithms',
    ],
    correctAnswer: 1,
    explanation: 'Corrigibility refers to an AI system\'s property of being amenable to correction, shutdown, or modification by its operators. A corrigible AI doesn\'t resist human attempts to change or shut it down.',
  },
  {
    id: 8,
    question: 'What is the "deployment environment" consideration in AI safety?',
    options: [
      'The physical location of AI hardware',
      'The real-world context where AI systems operate, which may differ from training conditions',
      'The software environment for AI development',
      'Environmental impact of AI systems',
    ],
    correctAnswer: 1,
    explanation: 'The deployment environment encompasses all the real-world conditions, users, and contexts where an AI system operates. Safety requires understanding how deployment environments may differ from training and testing conditions.',
  },
  {
    id: 9,
    question: 'What is a "safety margin" in AI system design?',
    options: [
      'Profit margin on AI products',
      'Extra capacity built into AI systems to handle unexpected situations safely',
      'The border around AI interface elements',
      'Marketing budget for AI safety',
    ],
    correctAnswer: 1,
    explanation: 'Safety margins involve building extra capacity, redundancy, or conservative thresholds into AI systems to handle unexpected situations safely. This helps ensure systems remain safe even under adverse conditions.',
  },
  {
    id: 10,
    question: 'What is "emergent behavior" in AI systems?',
    options: [
      'Behavior that only occurs in emergencies',
      'Behaviors that arise from complex interactions that were not explicitly programmed',
      'AI behavior during system startup',
      'Behavior that emerges during AI development',
    ],
    correctAnswer: 1,
    explanation: 'Emergent behavior refers to capabilities or behaviors that arise from complex interactions in AI systems but were not explicitly programmed. This can include both beneficial and potentially harmful unexpected behaviors.',
  },
];

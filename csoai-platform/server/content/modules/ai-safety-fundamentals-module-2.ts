import type { QuizQuestion } from '@/types/quiz';

export const aiSafetyFundamentalsModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is "robustness" in the context of AI safety?',
    options: [
      'The physical durability of AI hardware',
      'The ability of an AI system to maintain performance under varying conditions and inputs',
      'The speed at which an AI system processes data',
      'The cost-effectiveness of AI deployment',
    ],
    correctAnswer: 1,
    explanation: 'Robustness refers to an AI system\'s ability to maintain reliable and safe performance even when faced with unexpected inputs, adversarial attacks, or changing conditions in its operating environment.',
  },
  {
    id: 2,
    question: 'Which type of attack involves making small, often imperceptible changes to inputs to fool AI systems?',
    options: [
      'Brute force attack',
      'Denial of service attack',
      'Adversarial attack',
      'Phishing attack',
    ],
    correctAnswer: 2,
    explanation: 'Adversarial attacks involve carefully crafted perturbations to inputs (like images or text) that can cause AI systems to make incorrect predictions while appearing normal to humans. This is a major security concern for AI systems.',
  },
  {
    id: 3,
    question: 'What is "explainability" in AI systems?',
    options: [
      'The ability to explain AI technology to non-technical users',
      'Documentation of AI system architecture',
      'The ability to understand and interpret how an AI system makes decisions',
      'Marketing materials for AI products',
    ],
    correctAnswer: 2,
    explanation: 'Explainability (or interpretability) refers to the ability to understand and interpret the reasoning behind AI decisions. This is crucial for trust, debugging, regulatory compliance, and ensuring AI systems behave as intended.',
  },
  {
    id: 4,
    question: 'What is "data poisoning" in the context of AI security?',
    options: [
      'Corrupting data storage hardware',
      'Intentionally manipulating training data to cause AI systems to learn incorrect behaviors',
      'Encrypting data without authorization',
      'Accidentally using outdated data',
    ],
    correctAnswer: 1,
    explanation: 'Data poisoning attacks involve intentionally manipulating or injecting malicious data into AI training datasets to cause the model to learn incorrect or harmful behaviors. This can compromise AI safety from the ground up.',
  },
  {
    id: 5,
    question: 'Which principle ensures that AI systems can be investigated when things go wrong?',
    options: [
      'Transparency',
      'Accountability',
      'Auditability',
      'Reliability',
    ],
    correctAnswer: 2,
    explanation: 'Auditability ensures that AI systems maintain sufficient records, logs, and documentation to allow investigation of decisions and behaviors, especially when incidents occur. This is essential for post-incident analysis and continuous improvement.',
  },
  {
    id: 6,
    question: 'What is the purpose of "model cards" in AI documentation?',
    options: [
      'Physical cards used to identify AI hardware',
      'Standardized documentation providing key information about AI models and their limitations',
      'Credit cards used to purchase AI services',
      'Employee ID cards for AI developers',
    ],
    correctAnswer: 1,
    explanation: 'Model cards are standardized documentation that provide essential information about AI models, including intended use cases, limitations, performance metrics, and potential biases. They promote transparency and responsible AI deployment.',
  },
  {
    id: 7,
    question: 'What does "graceful degradation" mean for AI systems?',
    options: [
      'AI systems becoming slower over time',
      'AI systems maintaining partial functionality rather than complete failure when problems occur',
      'Gradually reducing AI capabilities to save costs',
      'Phasing out old AI systems',
    ],
    correctAnswer: 1,
    explanation: 'Graceful degradation ensures that when AI systems encounter problems, they maintain partial or reduced functionality rather than failing completely. This helps prevent catastrophic failures in critical applications.',
  },
  {
    id: 8,
    question: 'What is "uncertainty quantification" in AI systems?',
    options: [
      'Measuring how uncertain developers are about the project',
      'Estimating the financial risk of AI projects',
      'Measuring and communicating confidence levels in AI predictions',
      'Calculating project timeline uncertainty',
    ],
    correctAnswer: 2,
    explanation: 'Uncertainty quantification involves measuring and communicating how confident an AI system is in its predictions. This is crucial for safety-critical applications where users need to know when AI outputs should be trusted.',
  },
  {
    id: 9,
    question: 'What is the "inner alignment" problem in AI safety?',
    options: [
      'Aligning team members within an AI project',
      'Ensuring an AI\'s learned objective matches the training objective',
      'Aligning hardware components in AI systems',
      'Synchronizing multiple AI models',
    ],
    correctAnswer: 1,
    explanation: 'Inner alignment refers to the challenge of ensuring that the objective a model actually learns during training matches the objective specified by developers. Misalignment can lead to unexpected behaviors.',
  },
  {
    id: 10,
    question: 'Which approach involves training AI systems with human feedback to align with human preferences?',
    options: [
      'Supervised learning',
      'Reinforcement Learning from Human Feedback (RLHF)',
      'Unsupervised learning',
      'Transfer learning',
    ],
    correctAnswer: 1,
    explanation: 'RLHF (Reinforcement Learning from Human Feedback) is a training technique where AI systems learn from human evaluations of their outputs. This helps align AI behavior with human preferences and values.',
  },
];

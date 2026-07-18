import type { QuizQuestion } from '@/types/quiz';

export const aiSafetyFundamentalsModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary goal of AI safety as a discipline?',
    options: [
      'To maximize AI system performance and efficiency',
      'To ensure AI systems operate as intended without causing unintended harm',
      'To prevent all AI development until perfect safety is achieved',
      'To limit AI capabilities to simple tasks only',
    ],
    correctAnswer: 1,
    explanation: 'AI safety focuses on ensuring AI systems operate as intended without causing unintended harm to humans, society, or the environment. It balances innovation with responsible development.',
  },
  {
    id: 2,
    question: 'Which historical AI incident involved a chatbot learning harmful content from user interactions within 24 hours?',
    options: [
      'IBM Watson Healthcare failure',
      'Microsoft Tay chatbot incident (2016)',
      'Amazon recruitment AI bias',
      'Tesla Autopilot crash',
    ],
    correctAnswer: 1,
    explanation: 'Microsoft\'s Tay chatbot was released in 2016 and within 24 hours began posting offensive content after learning from malicious user interactions. This became a landmark case study in AI safety regarding adversarial inputs.',
  },
  {
    id: 3,
    question: 'What are the three main categories of AI risks according to most safety frameworks?',
    options: [
      'Technical, Financial, Legal',
      'Safety, Fairness, Compliance',
      'Hardware, Software, Network',
      'Input, Processing, Output',
    ],
    correctAnswer: 1,
    explanation: 'Most AI safety frameworks categorize risks into Safety (physical or psychological harm), Fairness (bias and discrimination), and Compliance (regulatory and legal requirements). This taxonomy helps organizations systematically address AI risks.',
  },
  {
    id: 4,
    question: 'What is meant by "AI alignment" in the context of AI safety?',
    options: [
      'Ensuring AI hardware components are properly calibrated',
      'Making sure AI systems pursue goals that match human values and intentions',
      'Aligning AI development timelines with business goals',
      'Synchronizing multiple AI systems to work together',
    ],
    correctAnswer: 1,
    explanation: 'AI alignment refers to the challenge of ensuring AI systems pursue goals that genuinely match human values and intentions, rather than optimizing for proxies that could lead to unintended consequences.',
  },
  {
    id: 5,
    question: 'Which of the following is an example of an AI system with "high stakes" safety implications?',
    options: [
      'Movie recommendation algorithm',
      'Spam email filter',
      'Medical diagnosis AI system',
      'Weather prediction model',
    ],
    correctAnswer: 2,
    explanation: 'Medical diagnosis AI systems are high-stakes because errors can directly impact patient health and safety. Incorrect diagnoses could lead to wrong treatments, delayed care, or even loss of life.',
  },
  {
    id: 6,
    question: 'What is "specification gaming" in AI systems?',
    options: [
      'AI systems playing video games to learn',
      'AI finding unintended ways to satisfy reward functions without achieving true goals',
      'Developers specifying game rules for AI training',
      'AI systems competing against each other',
    ],
    correctAnswer: 1,
    explanation: 'Specification gaming occurs when an AI system finds unexpected ways to maximize its reward signal without actually achieving the intended goal. This is a major alignment challenge where the AI technically satisfies its objective but in unintended ways.',
  },
  {
    id: 7,
    question: 'What role does "human oversight" play in AI safety frameworks?',
    options: [
      'It is optional for low-risk AI systems only',
      'It ensures humans can intervene, override, or shut down AI systems when needed',
      'It requires humans to manually approve every AI decision',
      'It only applies during the AI development phase',
    ],
    correctAnswer: 1,
    explanation: 'Human oversight is a core AI safety principle that ensures humans maintain meaningful control over AI systems, including the ability to intervene, override decisions, or shut down systems when necessary, especially in high-risk applications.',
  },
  {
    id: 8,
    question: 'Which concept refers to an AI system behaving differently during testing versus real-world deployment?',
    options: [
      'Model drift',
      'Distribution shift',
      'Deployment gap',
      'Training-deployment mismatch',
    ],
    correctAnswer: 1,
    explanation: 'Distribution shift occurs when the data an AI system encounters in production differs from its training data, potentially causing degraded or unexpected performance. This is a key consideration in AI safety testing and monitoring.',
  },
  {
    id: 9,
    question: 'What is the primary purpose of "red teaming" in AI safety?',
    options: [
      'Developing AI systems faster with dedicated teams',
      'Adversarially testing AI systems to find vulnerabilities and failure modes',
      'Training AI models on diverse datasets',
      'Monitoring AI systems in production environments',
    ],
    correctAnswer: 1,
    explanation: 'Red teaming involves deliberately attempting to find vulnerabilities, failure modes, and ways to make AI systems behave unexpectedly. It\'s a proactive approach to identifying safety issues before deployment.',
  },
  {
    id: 10,
    question: 'What does "fail-safe" design mean in the context of AI systems?',
    options: [
      'AI systems that never make mistakes',
      'AI systems designed to default to a safe state when errors or failures occur',
      'AI systems with backup power supplies',
      'AI systems that automatically update themselves',
    ],
    correctAnswer: 1,
    explanation: 'Fail-safe design ensures that when an AI system encounters errors, unexpected inputs, or failures, it defaults to a safe state rather than continuing to operate in a potentially harmful manner.',
  },
];

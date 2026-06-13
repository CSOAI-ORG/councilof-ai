import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'When was NIST AI 100-1, the foundational document for the AI Risk Management Framework, published?',
    options: ['January 2023', 'January 2024', 'July 2022', 'October 2023'],
    correctAnswer: 0,
    explanation: 'NIST AI Risk Management Framework (NIST AI 100-1) was published in January 2023, establishing the foundational guidance for managing AI risk in organizations.',
  },
  {
    id: 2,
    question: 'What are the two core principles that underpin the NIST AI RMF?',
    options: [
      'Efficiency and cost reduction',
      'Trustworthy and responsible AI',
      'Speed and market advantage',
      'Compliance and documentation',
    ],
    correctAnswer: 1,
    explanation: 'The NIST AI RMF is built on the principles of trustworthy and responsible AI, emphasizing that AI systems should be developed, deployed, and monitored with attention to safety, security, and societal impacts.',
  },
  {
    id: 3,
    question: 'How does the NIST AI RMF relate to the existing NIST Cybersecurity Framework?',
    options: [
      'It replaces the Cybersecurity Framework entirely',
      'It is integrated with and complementary to the Cybersecurity Framework',
      'It has no relationship to the Cybersecurity Framework',
      'It is a simplified version of the Cybersecurity Framework',
    ],
    correctAnswer: 1,
    explanation: 'The NIST AI RMF is designed to integrate with and complement the existing NIST Cybersecurity Framework, working together to address both traditional cybersecurity and AI-specific risks.',
  },
  {
    id: 4,
    question: 'What does the NIST AI RMF define as an "AI actor"?',
    options: [
      'A fictional character in AI training data',
      'An entity involved in the AI lifecycle, including developers, deployers, and operators',
      'A person who audits AI systems',
      'A tool used to test AI models',
    ],
    correctAnswer: 1,
    explanation: 'AI actors are entities involved in the AI lifecycle, including those who design, develop, deploy, maintain, and monitor AI systems. This encompasses various organizational roles and responsibilities.',
  },
  {
    id: 5,
    question: 'Which of the following best describes the "AI lifecycle" in the context of NIST AI RMF?',
    options: [
      'The training phase of a machine learning model',
      'The sequence of phases from conception through deployment to eventual retirement of an AI system',
      'The period during which an AI model is actively making predictions',
      'The time it takes to develop an AI system from scratch',
    ],
    correctAnswer: 1,
    explanation: 'The AI lifecycle encompasses all phases from initial planning and design, through development, validation, deployment, monitoring, and eventual retirement of an AI system. The RMF addresses risk management across this entire lifecycle.',
  },
  {
    id: 6,
    question: 'What is the primary purpose of integrating risk management principles into AI development and deployment?',
    options: [
      'To eliminate all AI use in organizations',
      'To ensure AI systems are trustworthy, responsible, and minimize negative impacts on stakeholders',
      'To reduce the cost of AI projects',
      'To speed up deployment of AI models',
    ],
    correctAnswer: 1,
    explanation: 'The primary purpose of integrating risk management into AI systems is to ensure they are trustworthy and responsible, while identifying and mitigating potential harms and negative impacts on individuals and society.',
  },
  {
    id: 7,
    question: 'Which of the following is NOT one of the four primary functions of the NIST AI RMF?',
    options: ['GOVERN', 'DEPLOY', 'MAP', 'MEASURE'],
    correctAnswer: 1,
    explanation: 'The four primary functions of the NIST AI RMF are GOVERN, MAP, MEASURE, and MANAGE. DEPLOY is not a primary function; risk management activities occur across all phases of the AI lifecycle.',
  },
  {
    id: 8,
    question: 'What is meant by "AI risk" in the context of the NIST AI RMF?',
    options: [
      'The probability that an AI project will exceed its budget',
      'The potential for AI systems to cause harm or negative outcomes to individuals or organizations',
      'The difficulty of training machine learning models',
      'The cost of purchasing AI software',
    ],
    correctAnswer: 1,
    explanation: 'AI risk refers to the potential for AI systems to cause harm or produce negative outcomes, including impacts related to safety, fairness, security, transparency, and other dimensions of trustworthiness.',
  },
  {
    id: 9,
    question: 'How does the NIST AI RMF approach accommodate organizations of different sizes and maturity levels?',
    options: [
      'It prescribes a one-size-fits-all process for all organizations',
      'It is flexible and scalable, allowing organizations to implement risk management practices appropriate to their context and resources',
      'It only applies to large enterprises',
      'It requires organizations to follow a specific timeline for implementation',
    ],
    correctAnswer: 1,
    explanation: 'The NIST AI RMF is designed to be flexible and scalable, recognizing that organizations have different resources, risk tolerances, and operational contexts. It provides guidance that can be adapted to fit organizational needs.',
  },
  {
    id: 10,
    question: 'Which key terminology in NIST AI RMF refers to the specific application or use case for which an AI system is being developed?',
    options: ['AI actor', 'AI lifecycle', 'AI use case', 'AI risk appetite'],
    correctAnswer: 2,
    explanation: 'The "AI use case" refers to the specific application, purpose, or context in which an AI system is intended to be used. Understanding the use case is essential for identifying relevant risks and stakeholders.',
  },
];

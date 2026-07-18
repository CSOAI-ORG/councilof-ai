import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What are the four risk tiers defined by the EU AI Act for AI systems classification?',
    options: [
      'Unacceptable, high, limited, and minimal risk',
      'Critical, severe, moderate, and low risk',
      'Prohibited, restricted, regulated, and unregulated',
      'Extreme, substantial, moderate, and negligible risk'
    ],
    correctAnswer: 0,
    explanation: 'The EU AI Act establishes a four-tier risk-based classification system: unacceptable risk (prohibited), high risk (subject to strict requirements), limited risk (transparency obligations), and minimal risk (no specific obligations).'
  },
  {
    id: 2,
    question: 'Which of the following would be classified as an unacceptable risk AI system?',
    options: [
      'A facial recognition system used in airports for border control',
      'An AI system using social scoring by a public authority to restrict fundamental rights',
      'A recommendation algorithm used by an e-commerce platform',
      'An AI chatbot for customer service that learns from interactions'
    ],
    correctAnswer: 1,
    explanation: 'Unacceptable risk systems include social scoring by public authorities that restricts fundamental rights, real-time biometric identification, and AI that manipulates behavior to harm health or fundamental rights. These are prohibited under Article 5 of the EU AI Act.'
  },
  {
    id: 3,
    question: 'What is the primary criterion for determining if an AI system falls into the high-risk category?',
    options: [
      'The size of the company developing the AI system',
      'The potential impact on fundamental rights or safety',
      'The number of users the system serves',
      'The computational resources required to run the system'
    ],
    correctAnswer: 1,
    explanation: 'High-risk classification is determined by the potential impact on fundamental rights and safety, particularly in critical areas such as employment, education, credit decisions, and law enforcement. The EU AI Act lists specific high-risk use cases in Annex III.'
  },
  {
    id: 4,
    question: 'Which requirement applies specifically to high-risk AI systems?',
    options: [
      'Immediate deletion of all training data after system deployment',
      'Conformity assessment and technical documentation',
      'Monthly audits by a third-party government agency',
      'Complete transparency of the AI algorithm to all users'
    ],
    correctAnswer: 1,
    explanation: 'High-risk AI systems must undergo conformity assessments, maintain comprehensive technical documentation, implement quality management systems, and establish post-market monitoring mechanisms. These are core compliance requirements under Articles 6-15 of the EU AI Act.'
  },
  {
    id: 5,
    question: 'What are limited risk AI systems required to do under the EU AI Act?',
    options: [
      'Undergo full conformity assessment before market entry',
      'Implement continuous real-time monitoring for errors',
      'Meet transparency obligations and inform users they are interacting with an AI',
      'Obtain approval from national authorities in each EU member state'
    ],
    correctAnswer: 2,
    explanation: 'Limited risk AI systems (those not classified as high-risk) must meet transparency obligations, including informing users when they interact with an AI system. This applies to systems like chatbots, AI-generated content, or automated decision-making with limited consequences.'
  },
  {
    id: 6,
    question: 'Which of these scenarios would result in an AI system being classified as high-risk?',
    options: [
      'Analyzing customer email to detect spam',
      'Using AI to predict employee performance for hiring decisions',
      'Recommending books based on reading history',
      'Filtering inappropriate content in social media comments'
    ],
    correctAnswer: 1,
    explanation: 'Using AI to evaluate or assess employees for hiring, promotion, termination, or work allocation is explicitly listed as a high-risk category under Annex III of the EU AI Act because it directly affects fundamental rights to fair employment.'
  },
  {
    id: 7,
    question: 'What is a key difference between minimal risk and limited risk AI systems?',
    options: [
      'Minimal risk systems require annual audits; limited risk systems require quarterly audits',
      'Minimal risk systems have no specific EU AI Act obligations; limited risk systems must meet transparency requirements',
      'Limited risk systems are only allowed in certain EU member states',
      'Minimal risk systems are only used by small companies; limited risk systems can be used by any size company'
    ],
    correctAnswer: 1,
    explanation: 'Minimal risk systems like simple spam filters have no specific compliance obligations under the EU AI Act. Limited risk systems must meet transparency obligations, such as informing users about AI involvement. High-risk systems face the most stringent requirements.'
  },
  {
    id: 8,
    question: 'Which of the following is NOT a typical characteristic of high-risk AI systems under the EU AI Act?',
    options: [
      'They have significant impacts on fundamental rights or safety',
      'They are deployed in critical infrastructure or essential services',
      'They are used by private companies to increase profit margins',
      'They involve automated decision-making in employment or education'
    ],
    correctAnswer: 2,
    explanation: 'High-risk classification is not based on profit motivation or company size. Instead, it depends on the potential impact on fundamental rights, safety, and critical areas. The EU AI Act takes a rights-based approach rather than an economic approach to risk classification.'
  },
  {
    id: 9,
    question: 'How does the EU AI Act define the "risk" in its risk-based classification system?',
    options: [
      'The financial risk to the company deploying the AI system',
      'The probability that the AI system will make errors',
      'The potential harm to individuals or society regarding fundamental rights, safety, and wellbeing',
      'The technical complexity of the AI model\'s architecture'
    ],
    correctAnswer: 2,
    explanation: 'The EU AI Act uses a fundamental rights and safety approach to define risk. Risk is assessed based on potential harm to individuals\' fundamental rights, safety, health, and wellbeing, not on technical complexity or business impact.'
  },
  {
    id: 10,
    question: 'Which AI system would require the most stringent compliance requirements under the EU AI Act\'s risk classification?',
    options: [
      'An AI system that analyzes weather patterns to improve forecast accuracy',
      'An AI system used by law enforcement to predict crime hotspots for resource allocation',
      'An AI system that translates documents between EU languages',
      'An AI system that optimizes energy consumption in buildings'
    ],
    correctAnswer: 1,
    explanation: 'AI used by law enforcement for decision-making is explicitly categorized as high-risk under Annex III due to its potential impact on fundamental rights, privacy, and fair treatment. High-risk systems require conformity assessments, technical documentation, quality management, and post-market monitoring.'
  }
];

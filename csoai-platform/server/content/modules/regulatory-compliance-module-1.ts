import type { QuizQuestion } from '@/types/quiz';

export const regulatoryComplianceModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'Which is the first comprehensive AI-specific regulation to become law globally?',
    options: [
      'US AI Bill of Rights',
      'EU AI Act',
      'China AI Governance Framework',
      'UK AI Regulation Act',
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act, officially published in July 2024, is the world\'s first comprehensive AI-specific regulation. It establishes a harmonized legal framework for AI across all EU member states.',
  },
  {
    id: 2,
    question: 'What is the main approach the EU AI Act uses to regulate AI systems?',
    options: [
      'Technology-based approach',
      'Industry-based approach',
      'Risk-based approach',
      'Size-based approach',
    ],
    correctAnswer: 2,
    explanation: 'The EU AI Act uses a risk-based approach, categorizing AI systems into four risk tiers (unacceptable, high, limited, minimal) with proportionate requirements based on potential harm.',
  },
  {
    id: 3,
    question: 'What does NIST AI RMF stand for?',
    options: [
      'National Institute of Standards and Technology AI Risk Management Framework',
      'National Information Security Technology AI Regulation Management Framework',
      'New International Standard for Technology AI Risk Mitigation Framework',
      'Network Infrastructure Safety Technology AI Resource Management Framework',
    ],
    correctAnswer: 0,
    explanation: 'NIST AI RMF stands for National Institute of Standards and Technology AI Risk Management Framework. It provides voluntary guidance for organizations to manage AI risks.',
  },
  {
    id: 4,
    question: 'What are the four core functions of the NIST AI RMF?',
    options: [
      'Identify, Protect, Detect, Respond',
      'Govern, Map, Measure, Manage',
      'Plan, Do, Check, Act',
      'Assess, Design, Implement, Monitor',
    ],
    correctAnswer: 1,
    explanation: 'The NIST AI RMF is organized around four core functions: Govern (establish policies and accountability), Map (identify context and risks), Measure (assess and track risks), and Manage (prioritize and address risks).',
  },
  {
    id: 5,
    question: 'What is the primary difference between the EU AI Act and NIST AI RMF?',
    options: [
      'EU AI Act is for larger companies only',
      'EU AI Act is mandatory law while NIST AI RMF is voluntary guidance',
      'NIST AI RMF covers more industries',
      'NIST AI RMF has stricter penalties',
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act is binding legislation with mandatory requirements and penalties, while the NIST AI RMF provides voluntary guidance that organizations can choose to adopt.',
  },
  {
    id: 6,
    question: 'What is TC260 in the context of AI governance?',
    options: [
      'A type of AI hardware standard',
      'China\'s national committee responsible for AI safety governance standards',
      'An EU technical committee for AI',
      'A US technology classification system',
    ],
    correctAnswer: 1,
    explanation: 'TC260 (National Information Security Standardization Technical Committee) is China\'s national committee responsible for information security and AI safety governance standards.',
  },
  {
    id: 7,
    question: 'What is ISO 42001?',
    options: [
      'A hardware safety standard',
      'An environmental standard for data centers',
      'An international standard for AI Management Systems',
      'A quality standard for software development',
    ],
    correctAnswer: 2,
    explanation: 'ISO/IEC 42001 is the international standard for AI Management Systems (AIMS), providing a framework for organizations to manage AI responsibly. It was published in December 2023.',
  },
  {
    id: 8,
    question: 'Which US framework is specifically designed for federal agencies using AI?',
    options: [
      'NIST AI RMF',
      'Executive Order 14110',
      'FTC AI Guidelines',
      'SEC AI Rules',
    ],
    correctAnswer: 1,
    explanation: 'Executive Order 14110 (October 2023) specifically addresses AI use by federal agencies, requiring safety assessments, reporting, and adherence to responsible AI principles.',
  },
  {
    id: 9,
    question: 'What is "extraterritorial scope" in AI regulations?',
    options: [
      'Regulations that only apply outside a country',
      'Regulations that can apply to organizations outside the jurisdiction if they impact people within it',
      'Regulations for space-based AI systems',
      'International treaty requirements',
    ],
    correctAnswer: 1,
    explanation: 'Extraterritorial scope means regulations can apply to organizations located outside the jurisdiction if their AI systems affect people or markets within it. Both the EU AI Act and GDPR have extraterritorial reach.',
  },
  {
    id: 10,
    question: 'What is a "conformity assessment" in AI regulation?',
    options: [
      'Testing if users conform to AI system requirements',
      'A process to verify that AI systems meet regulatory requirements before deployment',
      'Assessing if AI conforms to industry norms',
      'Evaluating AI developer qualifications',
    ],
    correctAnswer: 1,
    explanation: 'A conformity assessment is a formal process to verify that AI systems meet applicable regulatory requirements before being placed on the market. It may involve self-assessment or third-party evaluation.',
  },
];

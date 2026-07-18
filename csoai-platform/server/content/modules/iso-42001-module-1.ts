import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is ISO 42001?',
    options: [
      'A technical AI algorithm standard',
      'An international standard for AI management systems (AIMS)',
      'A programming language for AI',
      'A data protection regulation',
    ],
    correctAnswer: 1,
    explanation: 'ISO 42001 is an international standard that specifies requirements for establishing, implementing, maintaining, and continually improving an Artificial Intelligence Management System (AIMS) within organizations.',
  },
  {
    id: 2,
    question: 'When was ISO 42001 published?',
    options: [
      'December 2023',
      'January 2020',
      'June 2025',
      'March 2018',
    ],
    correctAnswer: 0,
    explanation: 'ISO 42001 was published in December 2023, making it the world\'s first international standard for AI management systems. It provides a framework for responsible AI development and use.',
  },
  {
    id: 3,
    question: 'What does AIMS stand for in ISO 42001?',
    options: [
      'Automated Intelligence Monitoring System',
      'AI Management System',
      'Advanced Information Management Standard',
      'Artificial Intelligence Measurement System',
    ],
    correctAnswer: 1,
    explanation: 'AIMS stands for AI Management System. It is a systematic approach to managing AI-related risks and opportunities, ensuring responsible AI development, deployment, and use within an organization.',
  },
  {
    id: 4,
    question: 'Which organizations can benefit from ISO 42001?',
    options: [
      'Only large tech companies',
      'Only AI developers',
      'Any organization developing, providing, or using AI systems',
      'Only government agencies',
    ],
    correctAnswer: 2,
    explanation: 'ISO 42001 is applicable to any organization, regardless of size, type, or nature, that develops, provides, or uses AI-based products or services. This includes AI developers, deployers, users, and service providers.',
  },
  {
    id: 5,
    question: 'What is the primary purpose of ISO 42001?',
    options: [
      'To replace existing AI regulations',
      'To provide a framework for responsible and ethical AI use',
      'To standardize AI algorithms',
      'To certify individual AI models',
    ],
    correctAnswer: 1,
    explanation: 'The primary purpose of ISO 42001 is to provide a framework for responsible and ethical AI use, helping organizations manage AI-related risks, ensure compliance, build stakeholder trust, and demonstrate responsible AI practices.',
  },
  {
    id: 6,
    question: 'Is ISO 42001 certification mandatory?',
    options: [
      'Yes, for all organizations using AI',
      'No, it is voluntary but demonstrates commitment to responsible AI',
      'Yes, but only in the EU',
      'Yes, but only for high-risk AI systems',
    ],
    correctAnswer: 1,
    explanation: 'ISO 42001 certification is voluntary, not mandatory. However, achieving certification demonstrates an organization\'s commitment to responsible AI practices, can enhance reputation, and may help meet regulatory requirements in various jurisdictions.',
  },
  {
    id: 7,
    question: 'How does ISO 42001 relate to other ISO management system standards?',
    options: [
      'It is completely independent',
      'It follows the ISO High-Level Structure (HLS) for easy integration',
      'It replaces ISO 27001',
      'It conflicts with other ISO standards',
    ],
    correctAnswer: 1,
    explanation: 'ISO 42001 follows the ISO High-Level Structure (HLS), also known as Annex SL, which provides a common framework for all ISO management system standards. This makes it easy to integrate with ISO 27001 (information security), ISO 9001 (quality), and others.',
  },
  {
    id: 8,
    question: 'What are the key benefits of implementing ISO 42001?',
    options: [
      'Only cost reduction',
      'Risk management, compliance, stakeholder trust, and competitive advantage',
      'Only regulatory compliance',
      'Only technical performance improvement',
    ],
    correctAnswer: 1,
    explanation: 'Key benefits include systematic AI risk management, enhanced compliance with regulations (like EU AI Act), increased stakeholder trust, competitive advantage, improved decision-making, and demonstration of responsible AI practices to customers and regulators.',
  },
  {
    id: 9,
    question: 'Does ISO 42001 specify technical AI requirements?',
    options: [
      'Yes, it specifies exact algorithms to use',
      'No, it focuses on management system requirements, not technical specifications',
      'Yes, it requires specific programming languages',
      'Yes, it mandates specific AI architectures',
    ],
    correctAnswer: 1,
    explanation: 'No, ISO 42001 is a management system standard, not a technical specification. It focuses on organizational processes, governance, risk management, and controls for AI systems, rather than prescribing specific technical implementations or algorithms.',
  },
  {
    id: 10,
    question: 'Can ISO 42001 help with EU AI Act compliance?',
    options: [
      'No, they are unrelated',
      'Yes, ISO 42001 can support compliance with the EU AI Act and other regulations',
      'Only for non-EU companies',
      'Only for low-risk AI systems',
    ],
    correctAnswer: 1,
    explanation: 'Yes, ISO 42001 can significantly support EU AI Act compliance. While not a substitute for legal compliance, implementing ISO 42001 helps organizations establish the governance, risk management, and documentation practices required by the EU AI Act and other AI regulations.',
  },
];

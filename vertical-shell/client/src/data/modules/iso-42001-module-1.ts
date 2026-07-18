import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'In what month and year was ISO/IEC 42001 published as the first international standard for AI Management Systems?',
    options: ['June 2023', 'December 2023', 'September 2023', 'March 2024'],
    correctAnswer: 1,
    explanation: 'ISO/IEC 42001:2023 was officially published in December 2023, marking the first international standard specifically designed for AI Management Systems (AIMS).',
  },
  {
    id: 2,
    question: 'Which ISO management system standard does ISO/IEC 42001 have the closest structural alignment with?',
    options: ['ISO 9001:2015', 'ISO 27001:2022', 'ISO 14001:2015', 'ISO 45001:2018'],
    correctAnswer: 1,
    explanation: 'ISO/IEC 42001 follows the same high-level structure and Annex SL framework as ISO 27001:2022 (Information Security Management), facilitating integration of AI and information security management systems.',
  },
  {
    id: 3,
    question: 'What is the primary scope of an AI Management System (AIMS) under ISO/IEC 42001?',
    options: [
      'Managing only the development phase of AI systems',
      'Establishing, implementing, maintaining, and continually improving an organization\'s approach to managing AI risks and opportunities',
      'Ensuring all AI systems achieve 100% accuracy and performance',
      'Creating standardized AI algorithms across all organizations',
    ],
    correctAnswer: 1,
    explanation: 'The scope of an AIMS under ISO/IEC 42001 is to establish, implement, maintain, and continually improve an organization\'s systematic approach to managing AI-related risks and opportunities across the entire AI lifecycle.',
  },
  {
    id: 4,
    question: 'Which cycle does ISO/IEC 42001 use as its foundational management approach?',
    options: ['RACI cycle', 'PDCA (Plan-Do-Check-Act) cycle', 'OODA loop', 'ISO lifecycle model'],
    correctAnswer: 1,
    explanation: 'ISO/IEC 42001 adopts the PDCA (Plan-Do-Check-Act) cycle, a continuous improvement methodology that ensures systematic management of AI systems through iterative planning, implementation, evaluation, and improvement.',
  },
  {
    id: 5,
    question: 'What is defined as a "person or organization that can affect, be affected by, or perceive themselves to be affected by a decision or activity" in ISO/IEC 42001?',
    options: ['Stakeholder', 'Interested party', 'Customer', 'Regulator'],
    correctAnswer: 1,
    explanation: 'In ISO/IEC 42001, an "interested party" is the formal term for any person or organization that can affect, be affected by, or perceive themselves to be affected by a decision or activity related to the AIMS.',
  },
  {
    id: 6,
    question: 'Which of the following is NOT a key component of the context of the organization in ISO/IEC 42001?',
    options: [
      'Understanding the internal and external issues affecting the AIMS',
      'Identifying interested parties and their relevant requirements',
      'Setting specific AI algorithm parameters for all systems',
      'Determining the scope of the AIMS',
    ],
    correctAnswer: 2,
    explanation: 'Setting specific AI algorithm parameters is an operational implementation detail, not part of establishing the context. The context includes understanding issues, identifying interested parties, determining scope, and understanding their requirements.',
  },
  {
    id: 7,
    question: 'According to ISO/IEC 42001, what is an "AI policy" intended to do?',
    options: [
      'Replace all organizational policies',
      'Provide a strategic direction for the organization\'s AI management approach and commitment',
      'Define specific technical requirements for AI systems',
      'Establish financial budgets for AI projects',
    ],
    correctAnswer: 1,
    explanation: 'An AI policy under ISO/IEC 42001 provides strategic direction for the organization\'s AI management, reflects the organization\'s commitment to managing AI appropriately, and serves as a framework for setting AI objectives.',
  },
  {
    id: 8,
    question: 'What is the relationship between ISO/IEC 42001 and ISO 27001 in terms of management system design?',
    options: [
      'ISO 27001 is being replaced by ISO 42001',
      'They follow different structural frameworks and cannot be integrated',
      'Both follow the ISO management system common structure and can be integrated to address AI security and risk management',
      'ISO 42001 is an extension module for ISO 27001',
    ],
    correctAnswer: 2,
    explanation: 'Both ISO/IEC 42001 and ISO 27001 follow the same high-level ISO management system structure (Annex SL), enabling organizations to integrate their AI management system with information security management for a comprehensive approach.',
  },
  {
    id: 9,
    question: 'Which clause in ISO/IEC 42001 establishes the foundational principles for implementing an AIMS?',
    options: ['Clause 2 (Normative References)', 'Clause 4 (Context of the Organization)', 'Clause 5 (Leadership)', 'Clause 8 (Operation)'],
    correctAnswer: 1,
    explanation: 'Clause 4 (Context of the Organization) establishes the foundational principles by requiring organizations to understand their internal and external context and determine the scope of their AIMS.',
  },
  {
    id: 10,
    question: 'According to ISO/IEC 42001, which of the following best describes "AI objectives"?',
    options: [
      'Specific profit targets for AI investments',
      'Detailed technical specifications for AI algorithms',
      'Targets set to achieve the organization\'s AI policy, measurable and monitored, and communicated to relevant parties',
      'Annual budget allocations for AI projects',
    ],
    correctAnswer: 2,
    explanation: 'AI objectives under ISO/IEC 42001 are defined as specific, measurable targets that support the AI policy, are communicated to relevant interested parties, and are monitored for achievement as part of the AIMS.',
  },
];

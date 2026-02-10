import type { QuizQuestion } from '@/types/quiz';

export const nistAiRmfModule6Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What should be the first step in developing an implementation roadmap for NIST AI RMF adoption?',
    options: [
      'Immediately deploy all AI systems',
      'Assess current organizational capabilities, identify gaps, and establish realistic timelines and resource requirements',
      'Hire consultants without planning',
      'Delay implementation indefinitely',
    ],
    correctAnswer: 1,
    explanation: 'Successful implementation begins with assessing the organization\'s current state, identifying where gaps exist, and developing a phased roadmap that aligns with organizational capacity and strategic objectives.',
  },
  {
    id: 2,
    question: 'How should organizations approach phased implementation of the NIST AI RMF?',
    options: [
      'All functions must be implemented simultaneously',
      'Phase implementation by starting with foundational elements (GOVERN), then progressing through MAP, MEASURE, and MANAGE',
      'Skip less important functions to save time',
      'Implementation order does not matter',
    ],
    correctAnswer: 1,
    explanation: 'A typical phased approach starts with governance structures, then adds context and risk mapping capabilities, followed by measurement and monitoring infrastructure, and finally risk management practices.',
  },
  {
    id: 3,
    question: 'What can organizations learn from case studies of AI RMF implementation in similar sectors?',
    options: [
      'Nothing, every implementation is completely unique',
      'Best practices, common pitfalls, resource requirements, and how other organizations adapted the framework to their context',
      'Only that the framework is too complex to implement',
      'That implementation always fails',
    ],
    correctAnswer: 1,
    explanation: 'Case studies provide valuable insights into how organizations in healthcare, finance, government, and other sectors have successfully adapted the NIST AI RMF to their specific needs and constraints.',
  },
  {
    id: 4,
    question: 'How does the NIST AI RMF relate to ISO standards for AI and risk management?',
    options: [
      'The NIST AI RMF conflicts with ISO standards',
      'The NIST AI RMF complements ISO standards and can be integrated for comprehensive AI governance and risk management',
      'ISO standards replace the need for NIST AI RMF',
      'They are completely unrelated',
    ],
    correctAnswer: 1,
    explanation: 'The NIST AI RMF and ISO standards (such as ISO/IEC 42001 and ISO 31000) can work together to provide comprehensive governance and risk management for AI systems.',
  },
  {
    id: 5,
    question: 'What sector-specific considerations should healthcare organizations address when implementing NIST AI RMF?',
    options: [
      'Healthcare does not need to implement AI risk management',
      'Patient safety, medical accuracy, data privacy, regulatory compliance with HIPAA, and impacts on clinical decision-making',
      'Only cost reduction',
      'Healthcare should follow different frameworks',
    ],
    correctAnswer: 1,
    explanation: 'Healthcare organizations must address unique AI risks including patient safety impacts, clinical decision support, privacy of medical data, compliance with healthcare regulations, and equity in access to care.',
  },
  {
    id: 6,
    question: 'What are key AI risk considerations for the financial services sector?',
    options: [
      'Financial institutions do not have AI risks',
      'Fair lending practices, fraud detection accuracy, market manipulation risks, regulatory compliance, and protection of customer financial data',
      'Only profitability',
      'Financial AI systems have no ethical concerns',
    ],
    correctAnswer: 1,
    explanation: 'Financial institutions must address risks including algorithmic fairness in lending decisions, security against adversarial attacks, regulatory compliance with banking standards, and protection of sensitive financial information.',
  },
  {
    id: 7,
    question: 'What organizational change management activities support successful AI RMF implementation?',
    options: [
      'Change management is not important for technical frameworks',
      'Stakeholder engagement, training, clear communication of benefits, addressing resistance, and building organizational culture that values responsible AI',
      'Only executive announcements',
      'Forcing rapid adoption without preparation',
    ],
    correctAnswer: 1,
    explanation: 'Successful implementation requires change management strategies including stakeholder engagement, staff training, transparent communication, cultural alignment, and addressing concerns from different parts of the organization.',
  },
  {
    id: 8,
    question: 'How should government agencies adapt NIST AI RMF implementation?',
    options: [
      'Governments should not use the AI RMF',
      'Considering public sector context, regulatory requirements, transparency obligations, accountability to citizens, and government procurement standards',
      'By ignoring citizen impact',
      'Government agencies should use private sector approaches unchanged',
    ],
    correctAnswer: 1,
    explanation: 'Government agencies must adapt implementation to address public sector concerns including transparency and explainability requirements, accountability to citizens, regulatory compliance, and the public interest in AI decisions.',
  },
  {
    id: 9,
    question: 'What role do external resources and vendors play in NIST AI RMF implementation?',
    options: [
      'External resources should never be involved',
      'Vendors may provide tools, services, and expertise, but organizations must assess their capabilities and maintain oversight of third-party risk management',
      'Organizations should rely entirely on vendors',
      'Vendor selection is not important',
    ],
    correctAnswer: 1,
    explanation: 'Organizations may leverage external tools, consulting services, and platforms to support implementation, but must conduct proper due diligence on vendors and maintain accountability for AI risk management.',
  },
  {
    id: 10,
    question: 'What is a key success factor for sustainable AI RMF implementation?',
    options: [
      'One-time implementation effort',
      'Integrating risk management into organizational culture and processes so it becomes ongoing practice rather than a compliance checkbox',
      'Minimal documentation',
      'Implementation without stakeholder involvement',
    ],
    correctAnswer: 1,
    explanation: 'Sustainable implementation requires embedding risk management into organizational processes, building capability over time, maintaining leadership commitment, and evolving practices as the AI landscape changes.',
  },
];

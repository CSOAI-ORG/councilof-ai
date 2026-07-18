import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module8Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the first step in implementing ISO 42001?',
    options: [
      'Hire consultants',
      'Secure top management commitment and understand organizational context',
      'Write all policies immediately',
      'Schedule certification audit',
    ],
    correctAnswer: 1,
    explanation: 'The first step is securing top management commitment and understanding the organizational context. Without leadership support and clear understanding of context, the AIMS will lack direction, resources, and organizational buy-in needed for success.',
  },
  {
    id: 2,
    question: 'Should ISO 42001 be implemented in isolation or integrated with existing systems?',
    options: [
      'Always in isolation',
      'Integrated with existing management systems (ISO 27001, ISO 9001, etc.) where possible',
      'Only integrated for large organizations',
      'Integration is not allowed',
    ],
    correctAnswer: 1,
    explanation: 'ISO 42001 should be integrated with existing management systems where possible. The High-Level Structure (HLS) facilitates integration with ISO 27001 (information security), ISO 9001 (quality), and others, reducing duplication and improving efficiency.',
  },
  {
    id: 3,
    question: 'What is a common challenge in ISO 42001 implementation?',
    options: [
      'Too much documentation',
      'Lack of AI-specific expertise and understanding of AI risks',
      'Too many audits',
      'Excessive costs',
    ],
    correctAnswer: 1,
    explanation: 'A common challenge is lack of AI-specific expertise and understanding of AI risks. Organizations may struggle to identify AI-specific risks, implement appropriate controls, and build competence. Training, hiring, and external expertise can help address this.',
  },
  {
    id: 4,
    question: 'How long does ISO 42001 implementation typically take?',
    options: [
      '1 week',
      '6-18 months depending on organizational size, complexity, and existing systems',
      '1 month',
      '5 years',
    ],
    correctAnswer: 1,
    explanation: 'Implementation typically takes 6-18 months, depending on organizational size, AI system complexity, existing management systems, and resources. Smaller organizations with existing ISO certifications may implement faster; larger organizations with complex AI portfolios may take longer.',
  },
  {
    id: 5,
    question: 'Should organizations use a phased approach to implementation?',
    options: [
      'No, implement everything at once',
      'Yes, a phased approach (pilot, expand, optimize) is often more effective',
      'Only for large organizations',
      'Phased approach is not allowed',
    ],
    correctAnswer: 1,
    explanation: 'Yes, a phased approach is often more effective: start with a pilot (one AI system or department), learn lessons, expand to more systems, and continuously optimize. This reduces risk, builds capability, and demonstrates value before full-scale implementation.',
  },
  {
    id: 6,
    question: 'What role do external consultants play in ISO 42001 implementation?',
    options: [
      'They are mandatory',
      'They can provide expertise, guidance, and support, but implementation must be owned by the organization',
      'They do all the work',
      'They are not allowed',
    ],
    correctAnswer: 1,
    explanation: 'External consultants can provide valuable expertise, guidance, and support, especially for organizations new to ISO standards or AI risk management. However, implementation must be owned and driven by the organization to ensure sustainability and genuine integration.',
  },
  {
    id: 7,
    question: 'How should organizations balance documentation with practical implementation?',
    options: [
      'Focus only on documentation',
      'Document what is necessary and focus on effective implementation over excessive paperwork',
      'Avoid all documentation',
      'Create as much documentation as possible',
    ],
    correctAnswer: 1,
    explanation: 'Organizations should document what is necessary to meet ISO 42001 requirements and support effective operation, but avoid excessive paperwork. The focus should be on practical implementation and effectiveness, not documentation for its own sake.',
  },
  {
    id: 8,
    question: 'What is a key success factor for ISO 42001 implementation?',
    options: [
      'Expensive tools',
      'Organizational culture that values responsible AI and continuous improvement',
      'Large budgets',
      'External consultants',
    ],
    correctAnswer: 1,
    explanation: 'A key success factor is organizational culture that values responsible AI, transparency, accountability, and continuous improvement. Without cultural alignment, the AIMS becomes a compliance exercise rather than a driver of responsible AI practices.',
  },
  {
    id: 9,
    question: 'Should ISO 42001 implementation be aligned with business strategy?',
    options: [
      'No, it is separate',
      'Yes, the AIMS should support and enable business objectives, not hinder them',
      'Only for large organizations',
      'Only if required by regulation',
    ],
    correctAnswer: 1,
    explanation: 'Yes, the AIMS should be aligned with business strategy and support business objectives. When aligned, the AIMS enables innovation, builds trust, manages risks, and creates competitive advantage rather than being seen as a burden.',
  },
  {
    id: 10,
    question: 'What is the ultimate goal of ISO 42001 implementation?',
    options: [
      'To get a certificate',
      'To build trustworthy AI systems that benefit stakeholders while managing risks responsibly',
      'To satisfy auditors',
      'To avoid regulation',
    ],
    correctAnswer: 1,
    explanation: 'The ultimate goal is building trustworthy AI systems that benefit stakeholders (customers, employees, society) while managing risks responsibly. Certification is a means to this end, not the end itself. The focus should be on genuine responsible AI practices.',
  },
];

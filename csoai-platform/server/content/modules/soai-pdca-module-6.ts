import type { QuizQuestion } from '@/types/quiz';

export const soaiPdcaModule6Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'How does SOAI-PDCA integrate with ISO 42001?',
    options: [
      'They are incompatible',
      'SOAI-PDCA provides the continuous improvement mechanism for AIMS',
      'ISO 42001 replaces SOAI-PDCA',
      'No integration possible',
    ],
    correctAnswer: 1,
    explanation: 'SOAI-PDCA naturally integrates with ISO 42001, providing the continuous improvement mechanism that drives the AI Management System (AIMS) performance evaluation and improvement clauses.',
  },
  {
    id: 2,
    question: 'How does SOAI-PDCA support EU AI Act compliance?',
    options: [
      'Not relevant to EU AI Act',
      'Provides systematic approach to meeting ongoing compliance requirements',
      'Replaces EU AI Act requirements',
      'Only for non-EU organizations',
    ],
    correctAnswer: 1,
    explanation: 'SOAI-PDCA supports EU AI Act compliance by providing a systematic approach to ongoing risk management, documentation, monitoring, and improvement required by the regulation.',
  },
  {
    id: 3,
    question: 'How does SOAI-PDCA align with NIST AI RMF functions?',
    options: [
      'No alignment',
      'PDCA cycles can be mapped to GOVERN, MAP, MEASURE, MANAGE functions',
      'Conflicting approaches',
      'NIST replaces PDCA',
    ],
    correctAnswer: 1,
    explanation: 'SOAI-PDCA aligns with NIST AI RMF: PLAN supports GOVERN and MAP, DO enables MANAGE, CHECK aligns with MEASURE, and ACT drives ongoing improvement across all functions.',
  },
  {
    id: 4,
    question: 'How does SOAI-PDCA integrate with quality management systems?',
    options: [
      'Separate from quality management',
      'Naturally integrates as PDCA is foundational to ISO 9001 and quality systems',
      'Conflicts with quality standards',
      'Only for AI-specific quality',
    ],
    correctAnswer: 1,
    explanation: 'SOAI-PDCA naturally integrates with quality management systems since PDCA is foundational to ISO 9001 and similar standards, enabling unified governance approaches.',
  },
  {
    id: 5,
    question: 'How does SOAI-PDCA address information security requirements?',
    options: [
      'Security is not covered',
      'Incorporates security considerations throughout all PDCA phases',
      'Security is handled separately',
      'Only in CHECK phase',
    ],
    correctAnswer: 1,
    explanation: 'Security is incorporated throughout SOAI-PDCA: security requirements in PLAN, secure implementation in DO, security monitoring in CHECK, and security improvements in ACT.',
  },
  {
    id: 6,
    question: 'How does SOAI-PDCA support risk management frameworks?',
    options: [
      'Replaces risk management',
      'Provides iterative risk assessment, treatment, and monitoring cycles',
      'Risk management is separate',
      'Only for AI-specific risks',
    ],
    correctAnswer: 1,
    explanation: 'SOAI-PDCA supports risk management through iterative cycles of risk identification (PLAN), treatment implementation (DO), monitoring (CHECK), and improvement (ACT).',
  },
  {
    id: 7,
    question: 'How can organizations map SOAI-PDCA to multiple frameworks simultaneously?',
    options: [
      'Choose one framework only',
      'Use SOAI-PDCA as an operational backbone connecting framework requirements',
      'Separate implementation for each',
      'Multiple frameworks cannot be mapped',
    ],
    correctAnswer: 1,
    explanation: 'SOAI-PDCA serves as an operational backbone, with its phases providing a common structure to address requirements from multiple frameworks in an integrated manner.',
  },
  {
    id: 8,
    question: 'How does SOAI-PDCA address TC260 requirements?',
    options: [
      'Not applicable to Chinese standards',
      'Provides continuous improvement mechanism supporting TC260 compliance',
      'TC260 prohibits PDCA',
      'Only for international organizations',
    ],
    correctAnswer: 1,
    explanation: 'SOAI-PDCA supports TC260 compliance by providing systematic approaches to security assessments, ongoing monitoring, and continuous improvement required by Chinese AI governance.',
  },
  {
    id: 9,
    question: 'How should organizations prioritize across multiple frameworks using SOAI-PDCA?',
    options: [
      'Ignore conflicting requirements',
      'Identify common requirements and address framework-specific needs in each phase',
      'Address one framework per cycle',
      'Prioritization is not possible',
    ],
    correctAnswer: 1,
    explanation: 'Organizations identify common requirements across frameworks for unified implementation and address framework-specific needs within appropriate PDCA phases.',
  },
  {
    id: 10,
    question: 'What documentation approach supports multi-framework integration?',
    options: [
      'Separate documentation for each',
      'Unified documentation mapped to multiple framework requirements',
      'Minimal documentation only',
      'No documentation needed',
    ],
    correctAnswer: 1,
    explanation: 'Unified documentation mapped to multiple framework requirements reduces duplication, ensures consistency, and demonstrates compliance across frameworks simultaneously.',
  },
];

import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module7Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'How many main clauses does ISO/IEC 42001:2023 contain?',
    options: ['5 clauses', '8 clauses', '10 clauses', '15 clauses'],
    correctAnswer: 2,
    explanation: 'ISO/IEC 42001:2023 contains 10 main clauses: Context (4), Leadership (5), Planning (6), Support (7), Operation (8), Performance Evaluation (9), and Improvement (10), plus Normative References and Terms/Definitions.',
  },
  {
    id: 2,
    question: 'What is the primary purpose of Annex A in ISO/IEC 42001?',
    options: [
      'To define financial requirements for AI systems',
      'To clarify the relationship between ISO/IEC 42001 and the ISO management system framework',
      'To provide mandatory controls for all organizations',
      'Annex A is informative guidance on implementing specific AI algorithms',
    ],
    correctAnswer: 1,
    explanation: 'Annex A clarifies how the eight standard ISO management system principles relate to ISO/IEC 42001, helping organizations understand the structural alignment with other ISO standards like 27001.',
  },
  {
    id: 3,
    question: 'What categories of controls are covered in Annex B of ISO/IEC 42001?',
    options: [
      'Only financial controls',
      'AI system impact assessment, data management, human oversight, and risks/opportunities controls',
      'Only technical infrastructure controls',
      'Annex B contains only informative guidance without specific controls',
    ],
    correctAnswer: 1,
    explanation: 'Annex B provides control categories including AI system impact assessment, management of data used in AI systems, human oversight of AI operations, and identified risks/opportunities.',
  },
  {
    id: 4,
    question: 'How should organizations approach integration of ISO/IEC 42001 with ISO/IEC 27001?',
    options: [
      'The standards cannot be integrated and must be implemented separately',
      'Both standards should be completely merged into one system',
      'Organizations should share the same context analysis, policies, and risk assessment while maintaining distinct focus areas for AI vs. information security',
      'ISO 27001 supersedes ISO 42001 for organizations pursuing both',
    ],
    correctAnswer: 2,
    explanation: 'Organizations can leverage common elements like context analysis, leadership commitment, and risk management from both standards while maintaining distinct focus areas for AI-specific and information security-specific requirements.',
  },
  {
    id: 5,
    question: 'What practical implementation scenario would require AI system impact assessment according to ISO/IEC 42001?',
    options: [
      'Only for AI systems used in healthcare',
      'Before deploying any AI system that could impact individuals, groups, or organizational objectives',
      'Only for large AI projects exceeding certain budgets',
      'Impact assessments are optional and not required',
    ],
    correctAnswer: 1,
    explanation: 'AI system impact assessments should be conducted before deployment of any AI system that could potentially impact individuals, groups, organizational operations, or strategic objectives.',
  },
  {
    id: 6,
    question: 'According to ISO/IEC 42001, how does "human oversight" as a control relate to AI operations?',
    options: [
      'Humans should not be involved in AI decisions',
      'Humans should override all AI decisions automatically',
      'Appropriate human review and oversight mechanisms should be established based on the AI system\'s risk level and impact',
      'Human oversight is not addressed in the standard',
    ],
    correctAnswer: 2,
    explanation: 'Human oversight is a key control area in Annex B, requiring organizations to establish appropriate levels of human review based on the AI system\'s potential impact and risk level.',
  },
  {
    id: 7,
    question: 'How does the EU AI Act relate to ISO/IEC 42001 implementation?',
    options: [
      'The EU AI Act replaces ISO/IEC 42001',
      'ISO/IEC 42001 and EU AI Act are unrelated',
      'Organizations in the EU should implement ISO/IEC 42001 to help meet EU AI Act requirements for high-risk AI systems',
      'The EU AI Act only applies to EU organizations; ISO 42001 is global only',
    ],
    correctAnswer: 2,
    explanation: 'While the EU AI Act is regulatory and ISO/IEC 42001 is a voluntary standard, implementing the AIMS can help organizations demonstrate compliance with EU AI Act requirements, particularly for risk management and documentation.',
  },
  {
    id: 8,
    question: 'What is the relationship between continuous improvement and the PDCA cycle in ISO/IEC 42001?',
    options: [
      'Continuous improvement is separate from PDCA',
      'PDCA is used only during initial implementation, not ongoing',
      'The PDCA cycle provides the structure for continuous improvement throughout the AIMS lifecycle',
      'Continuous improvement is the same as compliance checking',
    ],
    correctAnswer: 2,
    explanation: 'The PDCA (Plan-Do-Check-Act) cycle is embedded throughout ISO/IEC 42001 to create a framework for continuous improvement, where organizations plan improvements, implement them, evaluate results, and adjust.',
  },
  {
    id: 9,
    question: 'Which of the following is a key definition in ISO/IEC 42001?',
    options: [
      'Only "AI system" is defined in the standard',
      'Terms including AI, artificial intelligence, AIMS, risk, control, and interested party are defined',
      'Definitions are not provided in the standard',
      'Only technical AI terminology is defined; management terms are not',
    ],
    correctAnswer: 1,
    explanation: 'ISO/IEC 42001 provides comprehensive definitions for key terms including AI system, artificial intelligence, AI Management System, risk, opportunity, control, and interested parties to ensure common understanding.',
  },
  {
    id: 10,
    question: 'How should exam preparation address the balance between theoretical knowledge and practical application in ISO/IEC 42001?',
    options: [
      'Study only theory; practical application is not tested',
      'Study only practical scenarios; theory is not important',
      'Understand both standard requirements and how to apply them in real-world organizational contexts through case studies and implementation scenarios',
      'Exam preparation requires memorization of the entire standard verbatim',
    ],
    correctAnswer: 2,
    explanation: 'Comprehensive exam preparation should integrate understanding of ISO/IEC 42001 requirements with ability to apply them in organizational contexts, analyze scenarios, and understand implementation implications.',
  },
];

import type { QuizQuestion } from '@/types/quiz';

export const iso42001Module2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the primary purpose of Clause 4 (Context of the Organization) in ISO/IEC 42001?',
    options: [
      'To define the organizational structure and reporting lines',
      'To establish understanding of internal and external issues and their relevance to the AIMS',
      'To create a list of all AI projects in the organization',
      'To assign budget allocations for AI initiatives',
    ],
    correctAnswer: 1,
    explanation: 'Clause 4 requires organizations to understand their internal and external context and determine how this context relates to the scope and objectives of their AI Management System.',
  },
  {
    id: 2,
    question: 'In Clause 5 (Leadership), what is the top management\'s primary responsibility regarding the AIMS?',
    options: [
      'To approve all AI purchasing decisions',
      'To demonstrate commitment and accountability for the effectiveness of the AIMS',
      'To implement all technical AI controls personally',
      'To replace all existing management systems with the AIMS',
    ],
    correctAnswer: 1,
    explanation: 'Clause 5 establishes that top management must demonstrate commitment and accountability for the AIMS, ensuring it is integrated with organizational processes and strategic direction.',
  },
  {
    id: 3,
    question: 'Which of the following is NOT a requirement of the AI Policy according to ISO/IEC 42001?',
    options: [
      'It must be appropriate to the context and purpose of the organization',
      'It must provide a commitment to meeting applicable legal and regulatory requirements',
      'It must contain detailed technical specifications for all AI algorithms',
      'It must be communicated to relevant interested parties',
    ],
    correctAnswer: 2,
    explanation: 'The AI policy should provide strategic direction and commitment statements, not detailed technical specifications. Technical specifications are determined during the planning and operation phases.',
  },
  {
    id: 4,
    question: 'Under Clause 5 (Leadership), who has the authority and responsibility to determine the scope of the AIMS?',
    options: ['The IT department', 'The AI development team', 'Top management', 'External auditors'],
    correctAnswer: 2,
    explanation: 'Top management is responsible for determining the scope of the AIMS based on the organization\'s context, interested parties, and strategic objectives.',
  },
  {
    id: 5,
    question: 'What does Clause 6 (Planning) require regarding the identification of risks and opportunities?',
    options: [
      'Risks should only be identified for technical AI systems',
      'The organization must establish processes to identify and address risks and opportunities related to the AIMS',
      'Opportunities should not be documented as they compete with risk management',
      'Planning for risks is optional if the organization is mature',
    ],
    correctAnswer: 1,
    explanation: 'Clause 6.1 requires the organization to establish processes to determine risks and opportunities that need to be addressed to ensure the AIMS achieves its intended results and prevents unwanted outcomes.',
  },
  {
    id: 6,
    question: 'According to Clause 6, what is the relationship between the AI policy and AI objectives?',
    options: [
      'AI objectives replace the need for an AI policy',
      'AI objectives are set independently of the AI policy',
      'AI objectives must support the achievement of the organization\'s AI policy',
      'The AI policy and objectives are optional if the organization has general policies',
    ],
    correctAnswer: 2,
    explanation: 'Clause 6.2 establishes that AI objectives must be set to support the achievement and implementation of the AI policy, and must be measurable and monitored.',
  },
  {
    id: 7,
    question: 'Under Clause 5, which organizational roles must be assigned regarding the AIMS?',
    options: [
      'Only the IT security team',
      'Roles, responsibilities, and authorities relevant to AI management must be assigned and communicated',
      'Roles are determined solely by the AI development team',
      'Roles are not required if the organization has a small AI presence',
    ],
    correctAnswer: 1,
    explanation: 'Clause 5.3 requires the organization to assign relevant roles, responsibilities, and authorities for the AIMS and communicate these to relevant personnel and interested parties.',
  },
  {
    id: 8,
    question: 'What must be included in the action plans for addressing risks and opportunities under Clause 6?',
    options: [
      'Only the list of identified risks',
      'The plans must include how to address the risks and opportunities, responsibility assignment, and timelines',
      'Action plans are optional for opportunities',
      'Plans should only address technical AI risks, not organizational ones',
    ],
    correctAnswer: 1,
    explanation: 'Clause 6.1 requires action plans that specify how risks and opportunities will be addressed, who is responsible for implementation, and target dates for completion.',
  },
  {
    id: 9,
    question: 'In Clause 4, what must an organization determine regarding the scope of the AIMS?',
    options: [
      'Scope must include all systems in the organization',
      'Scope must be documented and be available to interested parties, specifying which AI systems and processes are included',
      'Scope is predetermined by the ISO standard for all organizations',
      'Scope should be kept confidential from employees',
    ],
    correctAnswer: 1,
    explanation: 'Clause 4.3 requires that the scope of the AIMS be determined and documented, and be made available to interested parties. The scope specifies what is included in the AIMS implementation.',
  },
  {
    id: 10,
    question: 'Which of the following best describes how interested parties\' requirements should be handled under Clause 4 and 5?',
    options: [
      'All interested parties\' requirements must be implemented regardless of organizational feasibility',
      'Requirements from interested parties should be identified, documented, and evaluated for relevance to the AIMS',
      'Interested parties\' requirements are not relevant to AIMS planning',
      'Only customer requirements matter; regulatory requirements can be ignored',
    ],
    correctAnswer: 1,
    explanation: 'Clause 4.2 requires the organization to identify interested parties and their relevant requirements, then Clause 5 and 6 require that these requirements be considered in establishing the AIMS and setting objectives.',
  },
];

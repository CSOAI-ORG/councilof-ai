import type { QuizQuestion } from '@/types/quiz';

export const canadaAidaModule3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'How does Canada\'s voluntary AI ethics framework (Responsible AI) complement AIDA?',
    options: [
      'It replaces AIDA requirements',
      'Provides additional ethical guidance beyond minimum legal compliance',
      'It is mandatory for all organizations',
      'Only applies to government AI',
    ],
    correctAnswer: 1,
    explanation: 'Canada\'s Responsible AI framework provides voluntary ethical guidance that goes beyond AIDA\'s minimum legal requirements, helping organizations adopt best practices in AI development and deployment.',
  },
  {
    id: 2,
    question: 'What considerations apply to cross-border AI services in Canada?',
    options: [
      'Cross-border AI is not regulated',
      'PIPEDA, AIDA, and sector-specific rules may apply based on where data is collected or services provided',
      'Only Canadian-developed AI is regulated',
      'Cross-border AI only follows US law',
    ],
    correctAnswer: 1,
    explanation: 'Cross-border AI services must consider Canadian privacy laws (PIPEDA, provincial laws), AIDA when applicable, and sector-specific requirements based on where data is collected or services are provided.',
  },
  {
    id: 3,
    question: 'What is required for AI-assisted decisions that significantly affect individuals under PIPEDA?',
    options: [
      'No special requirements',
      'Organizations must explain how automated decision-making works and offer human review options',
      'Only written consent required',
      'Decisions must be made by humans only',
    ],
    correctAnswer: 1,
    explanation: 'Under PIPEDA, organizations using AI for decisions significantly affecting individuals must explain how automated decision-making works and provide mechanisms for human review.',
  },
  {
    id: 4,
    question: 'How does AIDA address AI systems in employment decisions?',
    options: [
      'Employment AI is exempt from AIDA',
      'Employment AI systems are likely to be classified as high-impact with full compliance requirements',
      'Only federal employers are covered',
      'Employment decisions must be fully automated',
    ],
    correctAnswer: 1,
    explanation: 'AI systems used for employment decisions (hiring, performance evaluation, termination) are likely to be classified as high-impact under AIDA, requiring full compliance with assessment and transparency requirements.',
  },
  {
    id: 5,
    question: 'What is the Consumer Privacy Protection Act (CPPA) and its relation to AI?',
    options: [
      'It is separate from AI regulation',
      'Part of Bill C-27 that modernizes privacy law with AI-relevant provisions',
      'Provincial privacy legislation',
      'A healthcare-specific AI law',
    ],
    correctAnswer: 1,
    explanation: 'The CPPA is part of Bill C-27 (alongside AIDA) that would modernize PIPEDA with provisions relevant to AI, including enhanced rights around automated decision-making.',
  },
  {
    id: 6,
    question: 'What documentation requirements does AIDA impose?',
    options: [
      'Only financial records',
      'Maintain records of AI risk assessments, mitigation measures, and ongoing monitoring activities',
      'No documentation required',
      'Only user manuals required',
    ],
    correctAnswer: 1,
    explanation: 'AIDA requires organizations to maintain records of their AI risk assessments, mitigation measures implemented, monitoring activities, and any incidents or issues encountered.',
  },
  {
    id: 7,
    question: 'How does AIDA interact with sector-specific regulations in Canada?',
    options: [
      'AIDA overrides all sector regulations',
      'AIDA operates alongside sector-specific regulations, with both potentially applying',
      'Sector regulations are repealed by AIDA',
      'Organizations choose which law to follow',
    ],
    correctAnswer: 1,
    explanation: 'AIDA would operate alongside sector-specific regulations (financial services, healthcare, transportation), meaning organizations may need to comply with multiple overlapping requirements.',
  },
  {
    id: 8,
    question: 'What is the significance of the "meaningful explanation" requirement in Canadian AI law?',
    options: [
      'It is not a legal requirement',
      'Individuals affected by AI decisions have the right to understand how the decision was made',
      'Only applies to negative decisions',
      'Explanations are optional',
    ],
    correctAnswer: 1,
    explanation: 'The meaningful explanation requirement ensures that individuals affected by significant AI decisions can understand how those decisions were made, enabling them to contest unfair outcomes.',
  },
  {
    id: 9,
    question: 'How does Canada approach AI in public sector procurement?',
    options: [
      'No specific guidelines exist',
      'Government procurement policies include responsible AI requirements and vendor assessments',
      'AI procurement is banned',
      'Only Canadian vendors can supply AI',
    ],
    correctAnswer: 1,
    explanation: 'Canada has developed procurement policies for AI that include responsible AI requirements, vendor assessments, and ensuring purchased AI systems meet government standards for transparency and fairness.',
  },
  {
    id: 10,
    question: 'What rights do individuals have to challenge AI decisions under Canadian law?',
    options: [
      'No challenge rights exist',
      'Rights to explanation, human review, and complaint mechanisms through privacy commissioners and proposed tribunals',
      'Only court challenges are possible',
      'Challenges are only allowed for financial decisions',
    ],
    correctAnswer: 1,
    explanation: 'Canadian law provides rights to challenge AI decisions through explanation requirements, human review options, privacy commissioner complaints, and proposed AI-specific tribunal mechanisms.',
  },
];

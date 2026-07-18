import type { QuizQuestion } from '@/types/quiz';

export const canadaAidaModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What does AIDA stand for in Canadian AI legislation?',
    options: [
      'Artificial Intelligence Development Act',
      'Artificial Intelligence and Data Act',
      'Automated Intelligence and Digital Act',
      'AI Industry Development Authority',
    ],
    correctAnswer: 1,
    explanation: 'AIDA stands for the Artificial Intelligence and Data Act, which is Canada\'s proposed federal legislation for regulating AI systems, introduced as part of Bill C-27.',
  },
  {
    id: 2,
    question: 'What is Bill C-27 in the Canadian legislative context?',
    options: [
      'A provincial AI regulation bill',
      'The Digital Charter Implementation Act containing PIPEDA reform, CPPA, and AIDA',
      'A bill specifically about AI in healthcare',
      'Canada\'s cybersecurity legislation',
    ],
    correctAnswer: 1,
    explanation: 'Bill C-27 is the Digital Charter Implementation Act 2022, a comprehensive bill that includes PIPEDA reform (CPPA), a Data Tribunal, and the Artificial Intelligence and Data Act (AIDA).',
  },
  {
    id: 3,
    question: 'What is a "high-impact AI system" under AIDA?',
    options: [
      'Any AI system that is expensive to develop',
      'AI systems prescribed by regulations based on context, use, and potential impact on individuals',
      'AI systems with high computational requirements',
      'AI systems used by large companies only',
    ],
    correctAnswer: 1,
    explanation: 'High-impact AI systems under AIDA are those prescribed by regulations based on the context of use, potential for harm, and impact on individuals, similar to the risk-based approach in other jurisdictions.',
  },
  {
    id: 4,
    question: 'What is PIPEDA in the Canadian privacy landscape?',
    options: [
      'Provincial Information Protection and Electronic Documents Act',
      'Personal Information Protection and Electronic Documents Act',
      'Private Industry Protection and Data Act',
      'Public Information and Privacy Electronic Data Act',
    ],
    correctAnswer: 1,
    explanation: 'PIPEDA (Personal Information Protection and Electronic Documents Act) is Canada\'s federal private sector privacy law, which applies to AI systems processing personal information.',
  },
  {
    id: 5,
    question: 'What is the role of the AI and Data Commissioner proposed under AIDA?',
    options: [
      'Developing AI systems for the government',
      'Administering and enforcing AIDA provisions, including investigating complaints',
      'Only advising on AI policy',
      'Approving all AI systems before deployment',
    ],
    correctAnswer: 1,
    explanation: 'The AI and Data Commissioner would be responsible for administering and enforcing AIDA, including investigating complaints, conducting audits, and issuing compliance orders.',
  },
  {
    id: 6,
    question: 'What obligations do companies have for high-impact AI systems under AIDA?',
    options: [
      'Only documentation requirements',
      'Assess and mitigate risks, establish accountability measures, and monitor systems',
      'No specific obligations',
      'Only annual reporting requirements',
    ],
    correctAnswer: 1,
    explanation: 'AIDA requires companies operating high-impact AI systems to assess and mitigate risks, establish accountability and transparency measures, and monitor AI system performance.',
  },
  {
    id: 7,
    question: 'How does AIDA address harm caused by AI systems?',
    options: [
      'AIDA does not address harm',
      'Creates offense for recklessly or knowingly causing serious harm through AI deployment',
      'Only requires insurance coverage',
      'Harm is addressed through civil courts only',
    ],
    correctAnswer: 1,
    explanation: 'AIDA creates criminal offenses for knowingly or recklessly causing serious physical or psychological harm through the deployment of AI systems, with significant penalties.',
  },
  {
    id: 8,
    question: 'What is the relationship between AIDA and provincial AI regulations in Canada?',
    options: [
      'AIDA replaces all provincial regulations',
      'AIDA is federal law that operates alongside provincial privacy and sector-specific regulations',
      'Provincial laws always take precedence',
      'No provincial AI regulations exist',
    ],
    correctAnswer: 1,
    explanation: 'AIDA operates as federal law alongside provincial privacy laws (like Quebec\'s Law 25) and sector-specific regulations, creating a multi-layered regulatory landscape.',
  },
  {
    id: 9,
    question: 'What is Quebec\'s Law 25 (Bill 64)?',
    options: [
      'Quebec\'s AI-specific regulation',
      'Quebec\'s modernized privacy law with AI-relevant provisions on automated decision-making',
      'A law about AI in transportation',
      'Federal legislation about Quebec AI companies',
    ],
    correctAnswer: 1,
    explanation: 'Quebec\'s Law 25 (formerly Bill 64) modernizes Quebec\'s privacy law and includes provisions relevant to AI, particularly regarding automated decision-making and profiling.',
  },
  {
    id: 10,
    question: 'What maximum penalties does AIDA propose for serious violations?',
    options: [
      'Up to $100,000 CAD',
      'Up to $10 million CAD or 3% of global revenue, and up to $25 million CAD or 5% for the most serious offenses',
      'Only criminal penalties, no fines',
      'Unlimited penalties at court discretion',
    ],
    correctAnswer: 1,
    explanation: 'AIDA proposes significant penalties: up to $10M CAD or 3% of global revenue for violations, and up to $25M CAD or 5% of global revenue for the most serious offenses involving harm.',
  },
];

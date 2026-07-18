import type { QuizQuestion } from '@/types/quiz';

export const ukAiRegulationModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the UK\'s current approach to AI regulation compared to the EU?',
    options: [
      'Identical comprehensive legislation',
      'Pro-innovation, sector-based regulatory framework rather than horizontal legislation',
      'Complete absence of AI regulation',
      'Stricter than EU AI Act',
    ],
    correctAnswer: 1,
    explanation: 'The UK has adopted a "pro-innovation" approach using existing sector-specific regulators rather than creating new comprehensive AI legislation like the EU AI Act, aiming to balance innovation with safety.',
  },
  {
    id: 2,
    question: 'Which UK government document outlines the country\'s AI regulatory framework?',
    options: [
      'UK AI Act 2023',
      'AI Regulation: A Pro-Innovation Approach White Paper',
      'British AI Standards Act',
      'UK Digital Services Act',
    ],
    correctAnswer: 1,
    explanation: 'The "AI Regulation: A Pro-Innovation Approach" White Paper (March 2023) outlines the UK\'s regulatory framework, emphasizing sector-specific regulation through existing regulators.',
  },
  {
    id: 3,
    question: 'What are the five cross-cutting principles for UK AI regulation?',
    options: [
      'Speed, Efficiency, Profit, Growth, Innovation',
      'Safety, Transparency, Fairness, Accountability, Contestability',
      'Privacy, Security, Reliability, Accuracy, Speed',
      'Design, Development, Deployment, Monitoring, Retirement',
    ],
    correctAnswer: 1,
    explanation: 'The UK framework establishes five cross-cutting principles: Safety/Security/Robustness, Transparency/Explainability, Fairness, Accountability/Governance, and Contestability/Redress.',
  },
  {
    id: 4,
    question: 'Which UK body was established to coordinate AI regulation across sectors?',
    options: [
      'UK AI Authority',
      'Digital Regulation Cooperation Forum (DRCF)',
      'British AI Council',
      'AI Safety Agency',
    ],
    correctAnswer: 1,
    explanation: 'The Digital Regulation Cooperation Forum (DRCF) coordinates AI regulation across UK regulators including the ICO, CMA, Ofcom, and FCA to ensure coherent oversight.',
  },
  {
    id: 5,
    question: 'How does the UK\'s approach to high-risk AI differ from the EU AI Act?',
    options: [
      'The UK has stricter definitions of high-risk AI',
      'The UK relies on sector regulators to define high-risk within their domains rather than a central list',
      'The UK does not recognize high-risk AI as a category',
      'High-risk AI is completely banned in the UK',
    ],
    correctAnswer: 1,
    explanation: 'Unlike the EU\'s central list of high-risk AI applications, the UK approach allows sector-specific regulators to determine what constitutes high-risk within their domains.',
  },
  {
    id: 6,
    question: 'What is the role of the ICO in UK AI regulation?',
    options: [
      'Only regulating AI hardware',
      'Regulating AI systems that process personal data and enforcing data protection requirements',
      'Certifying all AI systems in the UK',
      'Only international AI cooperation',
    ],
    correctAnswer: 1,
    explanation: 'The Information Commissioner\'s Office (ICO) regulates AI systems that process personal data, enforcing UK GDPR requirements including transparency, fairness, and individuals\' rights in automated decision-making.',
  },
  {
    id: 7,
    question: 'What is the UK\'s position on AI-specific mandatory legislation?',
    options: [
      'Comprehensive mandatory legislation has been enacted',
      'Initially favoring guidance-based approach, with consideration of targeted legislation',
      'All AI legislation is strictly voluntary',
      'AI legislation is delegated entirely to the EU',
    ],
    correctAnswer: 1,
    explanation: 'The UK initially favored a guidance-based approach but has indicated openness to targeted mandatory legislation where needed, particularly for high-risk applications, while avoiding overly prescriptive rules.',
  },
  {
    id: 8,
    question: 'How does UK data protection law apply to AI systems?',
    options: [
      'UK GDPR does not apply to AI',
      'UK GDPR applies to AI processing personal data, including requirements for automated decision-making',
      'Only the Data Protection Act applies, not GDPR',
      'AI systems are exempt from data protection requirements',
    ],
    correctAnswer: 1,
    explanation: 'UK GDPR applies to AI systems processing personal data, including Article 22 requirements for automated decision-making, rights to human review, and transparency about algorithmic processing.',
  },
  {
    id: 9,
    question: 'What is the UK AI Safety Institute?',
    options: [
      'A university research center',
      'A government-backed organization focused on AI safety research and evaluation',
      'A private AI certification company',
      'An EU regulatory body based in the UK',
    ],
    correctAnswer: 1,
    explanation: 'The UK AI Safety Institute (announced in 2023) is a government-backed organization focused on AI safety research, frontier model evaluation, and developing technical standards for AI safety.',
  },
  {
    id: 10,
    question: 'What is the UK\'s approach to AI in the financial services sector?',
    options: [
      'No specific AI guidance for financial services',
      'FCA and PRA provide sector-specific AI guidance on model risk management and consumer protection',
      'All AI is banned in UK financial services',
      'Only international banks can use AI in the UK',
    ],
    correctAnswer: 1,
    explanation: 'The FCA and PRA provide sector-specific guidance on AI use in financial services, covering model risk management, consumer outcomes, and existing regulatory expectations for algorithmic trading.',
  },
];

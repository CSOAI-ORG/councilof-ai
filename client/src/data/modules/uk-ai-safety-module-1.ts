import type { QuizQuestion } from '@/types/quiz';

export const ukAiSafetyModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the UK government\'s primary approach to AI regulation?',
    options: [
      'Strict prescriptive rules for all AI systems',
      'Pro-innovation, sector-specific regulatory framework',
      'Complete deregulation of AI development',
      'Mandatory licensing for all AI developers',
    ],
    correctAnswer: 1,
    explanation: 'The UK has adopted a pro-innovation, sector-specific approach to AI regulation, allowing existing regulators to apply AI-specific guidance within their domains rather than creating a single comprehensive AI law.',
  },
  {
    id: 2,
    question: 'When was the UK AI Safety Institute officially established?',
    options: [
      'January 2023',
      'November 2023',
      'March 2024',
      'July 2024',
    ],
    correctAnswer: 1,
    explanation: 'The UK AI Safety Institute was officially established in November 2023, following the UK\'s AI Safety Summit at Bletchley Park. It became the world\'s first government-backed AI safety institute.',
  },
  {
    id: 3,
    question: 'Which UK regulatory body is responsible for AI in financial services?',
    options: [
      'Ofcom',
      'ICO',
      'FCA and PRA',
      'CMA',
    ],
    correctAnswer: 2,
    explanation: 'The Financial Conduct Authority (FCA) and Prudential Regulation Authority (PRA) are responsible for regulating AI use in financial services, including algorithmic trading, credit decisions, and fraud detection.',
  },
  {
    id: 4,
    question: 'What are the five cross-cutting principles in the UK\'s AI regulatory framework?',
    options: [
      'Speed, Efficiency, Profit, Growth, Innovation',
      'Safety, Transparency, Fairness, Accountability, Contestability',
      'Privacy, Security, Compliance, Monitoring, Reporting',
      'Development, Testing, Deployment, Monitoring, Retirement',
    ],
    correctAnswer: 1,
    explanation: 'The UK\'s AI regulatory framework is built on five cross-cutting principles: Safety/Security/Robustness, Transparency/Explainability, Fairness, Accountability/Governance, and Contestability/Redress.',
  },
  {
    id: 5,
    question: 'What is the primary role of the UK AI Safety Institute?',
    options: [
      'To enforce penalties on AI developers',
      'To evaluate AI models for safety and provide research on AI risks',
      'To approve all AI systems before deployment',
      'To develop AI systems for government use',
    ],
    correctAnswer: 1,
    explanation: 'The UK AI Safety Institute focuses on evaluating frontier AI models for safety, conducting research on AI risks, and developing safety evaluation methodologies. It does not have enforcement powers.',
  },
  {
    id: 6,
    question: 'Which legislation governs data protection in AI systems in the UK?',
    options: [
      'EU AI Act',
      'UK GDPR and Data Protection Act 2018',
      'Computer Misuse Act 1990',
      'Digital Economy Act 2017',
    ],
    correctAnswer: 1,
    explanation: 'The UK GDPR (retained EU law) and Data Protection Act 2018 govern data protection requirements for AI systems, including requirements for lawful processing, data minimization, and automated decision-making.',
  },
  {
    id: 7,
    question: 'What is the UK\'s position on AI regulatory sandboxes?',
    options: [
      'They are prohibited under UK law',
      'They are encouraged to support innovation while ensuring safety',
      'They are only available for government projects',
      'They require EU approval to operate',
    ],
    correctAnswer: 1,
    explanation: 'The UK actively encourages regulatory sandboxes as a way to support AI innovation while ensuring appropriate safeguards. Several UK regulators, including the FCA and ICO, operate sandbox programs.',
  },
  {
    id: 8,
    question: 'What was the significance of the Bletchley Declaration signed at the UK AI Safety Summit?',
    options: [
      'It established binding international AI regulations',
      'It was the first international agreement on AI safety risks',
      'It created a global AI enforcement body',
      'It banned development of frontier AI models',
    ],
    correctAnswer: 1,
    explanation: 'The Bletchley Declaration, signed by 28 countries at the November 2023 AI Safety Summit, was the first international agreement acknowledging the potential risks from frontier AI and committing to international cooperation on AI safety.',
  },
  {
    id: 9,
    question: 'Which UK regulator is responsible for AI in telecommunications and broadcasting?',
    options: [
      'ICO',
      'Ofcom',
      'CMA',
      'FCA',
    ],
    correctAnswer: 1,
    explanation: 'Ofcom (Office of Communications) is responsible for regulating AI use in telecommunications and broadcasting, including content moderation algorithms and AI-generated content.',
  },
  {
    id: 10,
    question: 'What approach does the UK take to AI liability?',
    options: [
      'Strict liability for all AI systems',
      'No liability framework exists',
      'Existing product liability and negligence laws apply, with sector-specific guidance',
      'AI developers are immune from liability',
    ],
    correctAnswer: 2,
    explanation: 'The UK applies existing product liability and negligence laws to AI systems, with sector-specific regulators providing guidance on how these apply in their domains. There is no AI-specific liability legislation.',
  },
];

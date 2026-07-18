import type { QuizQuestion } from '@/types/quiz';

export const canadaAidaModule1Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What does AIDA stand for in the context of Canadian AI regulation?',
    options: [
      'Artificial Intelligence Development Act',
      'Artificial Intelligence and Data Act',
      'Advanced Intelligence Data Architecture',
      'Automated Intelligence Deployment Act',
    ],
    correctAnswer: 1,
    explanation: 'AIDA stands for the Artificial Intelligence and Data Act, which is part of Canada\'s Bill C-27 (Digital Charter Implementation Act, 2022) aimed at regulating AI systems in Canada.',
  },
  {
    id: 2,
    question: 'Which Canadian bill contains the Artificial Intelligence and Data Act (AIDA)?',
    options: [
      'Bill C-11',
      'Bill C-18',
      'Bill C-27',
      'Bill C-32',
    ],
    correctAnswer: 2,
    explanation: 'AIDA is Part 3 of Bill C-27, the Digital Charter Implementation Act, 2022, which also includes the Consumer Privacy Protection Act (CPPA) and the Personal Information and Data Protection Tribunal Act.',
  },
  {
    id: 3,
    question: 'What is the primary focus of AIDA regarding AI systems?',
    options: [
      'Promoting AI development without restrictions',
      'Regulating high-impact AI systems to mitigate risks',
      'Banning all AI systems in critical sectors',
      'Only regulating AI in healthcare',
    ],
    correctAnswer: 1,
    explanation: 'AIDA focuses on regulating high-impact AI systems to ensure they are designed, developed, and used responsibly, with particular attention to mitigating risks of harm and bias.',
  },
  {
    id: 4,
    question: 'Under AIDA, what constitutes a "high-impact system"?',
    options: [
      'Any AI system that processes personal data',
      'AI systems used in areas with significant impact on health, safety, or human rights',
      'Only AI systems used by government agencies',
      'AI systems with more than 1 million users',
    ],
    correctAnswer: 1,
    explanation: 'High-impact systems under AIDA are AI systems used in activities that may have significant impacts on individuals\' health, safety, or fundamental rights, such as employment, financial services, and healthcare.',
  },
  {
    id: 5,
    question: 'Which Canadian government department is primarily responsible for overseeing AIDA?',
    options: [
      'Health Canada',
      'Innovation, Science and Economic Development Canada (ISED)',
      'Public Safety Canada',
      'Environment and Climate Change Canada',
    ],
    correctAnswer: 1,
    explanation: 'Innovation, Science and Economic Development Canada (ISED) is the primary department responsible for overseeing the implementation and enforcement of AIDA.',
  },
  {
    id: 6,
    question: 'What role does the AI and Data Commissioner play under AIDA?',
    options: [
      'Developing AI systems for government use',
      'Overseeing compliance and enforcement of AIDA requirements',
      'Funding AI research projects',
      'Training AI developers',
    ],
    correctAnswer: 1,
    explanation: 'The AI and Data Commissioner is responsible for overseeing compliance with AIDA, conducting audits, investigating complaints, and enforcing the Act\'s requirements.',
  },
  {
    id: 7,
    question: 'How does AIDA define "harm" in the context of AI systems?',
    options: [
      'Only physical harm to individuals',
      'Physical or psychological harm, damage to property, or economic loss',
      'Only financial harm',
      'Only harm to businesses',
    ],
    correctAnswer: 1,
    explanation: 'AIDA defines harm broadly to include physical or psychological harm to individuals, damage to property, and economic loss, recognizing the diverse ways AI systems can negatively impact people.',
  },
  {
    id: 8,
    question: 'What is required of organizations using high-impact AI systems under AIDA?',
    options: [
      'No specific requirements',
      'Assess and mitigate risks, maintain records, and provide transparency',
      'Only register the system with the government',
      'Only obtain user consent',
    ],
    correctAnswer: 1,
    explanation: 'Organizations using high-impact AI systems must assess and mitigate risks of harm and bias, maintain records of their risk assessments, and provide transparency about how the systems work.',
  },
  {
    id: 9,
    question: 'What penalties can be imposed for serious violations of AIDA?',
    options: [
      'No penalties, only warnings',
      'Up to $10,000 in fines',
      'Up to $25 million or 5% of global revenue',
      'Only criminal charges',
    ],
    correctAnswer: 2,
    explanation: 'AIDA provides for significant penalties including fines of up to $25 million or 5% of global revenue for serious violations, reflecting the importance of compliance with AI safety requirements.',
  },
  {
    id: 10,
    question: 'How does AIDA relate to Canada\'s existing privacy legislation (PIPEDA)?',
    options: [
      'AIDA replaces PIPEDA entirely',
      'AIDA and PIPEDA are completely separate with no interaction',
      'AIDA complements PIPEDA, with both applying to AI systems that process personal data',
      'PIPEDA only applies to non-AI systems',
    ],
    correctAnswer: 2,
    explanation: 'AIDA complements existing privacy legislation like PIPEDA. Organizations using AI systems that process personal data must comply with both AIDA\'s AI-specific requirements and PIPEDA\'s privacy requirements.',
  },
];

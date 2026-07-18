import type { QuizQuestion } from '@/types/quiz';

export const canadaAidaModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is the purpose of risk assessments under AIDA?',
    options: [
      'To increase AI system performance',
      'To identify and mitigate potential harms from high-impact AI systems',
      'To reduce development costs',
      'To speed up AI deployment',
    ],
    correctAnswer: 1,
    explanation: 'Risk assessments under AIDA are designed to identify potential harms that could result from high-impact AI systems and develop appropriate mitigation measures to address those risks.',
  },
  {
    id: 2,
    question: 'How often must risk assessments be updated under AIDA?',
    options: [
      'Only once at initial deployment',
      'Every 5 years',
      'Continuously throughout the AI system lifecycle',
      'Only when requested by regulators',
    ],
    correctAnswer: 2,
    explanation: 'AIDA requires ongoing risk assessment throughout the AI system\'s lifecycle, not just at initial deployment, to ensure emerging risks are identified and addressed as the system evolves.',
  },
  {
    id: 3,
    question: 'What types of bias must be assessed under AIDA?',
    options: [
      'Only racial bias',
      'Only gender bias',
      'Biases related to any prohibited grounds of discrimination',
      'Only biases that affect system accuracy',
    ],
    correctAnswer: 2,
    explanation: 'AIDA requires assessment of biases related to any prohibited grounds of discrimination under Canadian human rights law, including race, gender, disability, age, religion, and other protected characteristics.',
  },
  {
    id: 4,
    question: 'What documentation must organizations maintain for high-impact AI systems?',
    options: [
      'Only source code',
      'Risk assessments, mitigation measures, and monitoring records',
      'Only user complaints',
      'Only financial records',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must maintain comprehensive documentation including risk assessments, mitigation measures taken, monitoring records, and evidence of compliance with AIDA requirements.',
  },
  {
    id: 5,
    question: 'Who is responsible for conducting risk assessments under AIDA?',
    options: [
      'Only the government',
      'Only third-party auditors',
      'The organization responsible for the AI system',
      'Only AI developers',
    ],
    correctAnswer: 2,
    explanation: 'The organization responsible for the AI system (whether as developer, deployer, or operator) is responsible for conducting and maintaining risk assessments under AIDA.',
  },
  {
    id: 6,
    question: 'What role does human oversight play in AIDA compliance?',
    options: [
      'Human oversight is optional',
      'Human oversight is required for all high-impact AI decisions',
      'Human oversight is only required for healthcare AI',
      'Human oversight is discouraged',
    ],
    correctAnswer: 1,
    explanation: 'AIDA emphasizes the importance of human oversight for high-impact AI systems, requiring appropriate human involvement in decision-making processes to ensure accountability and prevent harm.',
  },
  {
    id: 7,
    question: 'How should organizations address identified biases in AI systems under AIDA?',
    options: [
      'Ignore them if they don\'t affect accuracy',
      'Document them but take no action',
      'Implement mitigation measures and monitor effectiveness',
      'Only address biases if users complain',
    ],
    correctAnswer: 2,
    explanation: 'Organizations must implement appropriate mitigation measures to address identified biases and continuously monitor the effectiveness of these measures to ensure ongoing compliance.',
  },
  {
    id: 8,
    question: 'What is the relationship between risk level and regulatory requirements under AIDA?',
    options: [
      'All AI systems have the same requirements regardless of risk',
      'Higher-risk systems face more stringent requirements',
      'Lower-risk systems face more stringent requirements',
      'Risk level has no impact on requirements',
    ],
    correctAnswer: 1,
    explanation: 'AIDA takes a risk-based approach where higher-risk AI systems face more stringent regulatory requirements, including more comprehensive risk assessments and mitigation measures.',
  },
  {
    id: 9,
    question: 'What must organizations do when a high-impact AI system causes harm?',
    options: [
      'Nothing, if the harm was unintentional',
      'Report the incident, investigate, and implement corrective measures',
      'Only report if the harm exceeds $1 million',
      'Only report if requested by the affected individual',
    ],
    correctAnswer: 1,
    explanation: 'Organizations must report incidents of harm, conduct thorough investigations, and implement corrective measures to prevent similar incidents from occurring in the future.',
  },
  {
    id: 10,
    question: 'How does AIDA address the use of AI in employment decisions?',
    options: [
      'AI is prohibited in employment decisions',
      'AI in employment is unregulated',
      'Employment AI is considered high-impact and subject to strict requirements',
      'Only large employers must comply',
    ],
    correctAnswer: 2,
    explanation: 'AI systems used in employment decisions (hiring, promotion, termination) are typically classified as high-impact under AIDA and subject to strict requirements for risk assessment, bias mitigation, and transparency.',
  },
];

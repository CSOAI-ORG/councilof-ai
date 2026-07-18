import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'How many AI practices are explicitly prohibited under Article 5 of the EU AI Act?',
    options: [
      '5 prohibited practices',
      '6 prohibited practices',
      '8 prohibited practices',
      '10 prohibited practices',
    ],
    correctAnswer: 2,
    explanation: 'Article 5 prohibits 8 specific AI practices that are considered to pose unacceptable risks to fundamental rights and safety. These prohibitions take effect 6 months after the Act entered into force (February 2, 2025).',
  },
  {
    id: 2,
    question: 'Which of the following is a prohibited AI practice under the EU AI Act?',
    options: [
      'Using AI for medical diagnosis',
      'Deploying AI systems that use subliminal techniques to manipulate behavior',
      'Using AI for customer service chatbots',
      'Deploying AI for fraud detection',
    ],
    correctAnswer: 1,
    explanation: 'AI systems that deploy subliminal techniques beyond a person\'s consciousness to materially distort behavior in a manner that causes significant harm are prohibited. This prevents manipulation that people cannot detect or resist.',
  },
  {
    id: 3,
    question: 'Is social scoring by private companies prohibited under the EU AI Act?',
    options: [
      'Yes, all social scoring is prohibited',
      'No, only social scoring by public authorities is prohibited',
      'Yes, but only for financial institutions',
      'No, social scoring is allowed with consent',
    ],
    correctAnswer: 1,
    explanation: 'Only social scoring by public authorities or on their behalf is explicitly prohibited. Private companies can still use scoring systems (like credit scores) as long as they comply with other regulations like GDPR and don\'t fall into prohibited categories.',
  },
  {
    id: 4,
    question: 'Under what circumstances is real-time remote biometric identification in publicly accessible spaces allowed?',
    options: [
      'Never, it is completely prohibited',
      'Only for targeted search of serious crime suspects with judicial authorization',
      'Anytime with user consent',
      'Only for national security purposes',
    ],
    correctAnswer: 1,
    explanation: 'Real-time remote biometric identification (RBI) in publicly accessible spaces is prohibited with narrow exceptions: targeted search for victims, prevention of imminent threats, or locating/identifying suspects of serious crimes. Each use requires prior judicial authorization (except in emergencies).',
  },
  {
    id: 5,
    question: 'Which AI system is prohibited in workplace and educational settings?',
    options: [
      'AI for scheduling and logistics',
      'AI for emotion recognition',
      'AI for performance evaluation',
      'AI for attendance tracking',
    ],
    correctAnswer: 1,
    explanation: 'Emotion recognition systems are prohibited in workplace and educational settings (with exceptions for medical or safety reasons). The EU AI Act recognizes that emotion recognition is scientifically questionable and poses risks to dignity and privacy.',
  },
  {
    id: 6,
    question: 'What is prohibited regarding biometric categorization systems?',
    options: [
      'All biometric categorization',
      'Categorization based on sensitive attributes like race or religion',
      'Categorization for security purposes',
      'Categorization with explicit consent',
    ],
    correctAnswer: 1,
    explanation: 'Biometric categorization systems that infer sensitive attributes (race, political opinions, trade union membership, religious beliefs, sex life, or sexual orientation) are prohibited. This prevents discriminatory profiling based on biometric data.',
  },
  {
    id: 7,
    question: 'Is untargeted scraping of facial images from the internet or CCTV prohibited?',
    options: [
      'No, it is allowed for research',
      'Yes, to create or expand facial recognition databases',
      'No, if the images are publicly available',
      'Yes, but only for commercial purposes',
    ],
    correctAnswer: 1,
    explanation: 'Untargeted scraping of facial images from the internet or CCTV footage to create or expand facial recognition databases is prohibited. This addresses concerns about mass surveillance and privacy violations from indiscriminate data collection.',
  },
  {
    id: 8,
    question: 'Can AI systems infer emotions in law enforcement contexts?',
    options: [
      'Yes, with proper authorization',
      'No, it is completely prohibited',
      'Yes, but only for serious crimes',
      'No, unless validated by scientific evidence',
    ],
    correctAnswer: 1,
    explanation: 'Inferring emotions in law enforcement, border control, and workplace/education settings is prohibited (with narrow exceptions for medical/safety reasons). The prohibition recognizes the lack of scientific validity and potential for misuse.',
  },
  {
    id: 9,
    question: 'What is the penalty for deploying a prohibited AI system?',
    options: [
      '€10 million or 2% of global turnover',
      '€15 million or 3% of global turnover',
      '€35 million or 7% of global turnover',
      '€50 million or 10% of global turnover',
    ],
    correctAnswer: 2,
    explanation: '€35 million or 7% of global annual turnover (whichever is higher) is the maximum penalty for deploying prohibited AI systems. This is the highest penalty tier, reflecting the severity of these violations.',
  },
  {
    id: 10,
    question: 'When do the prohibitions on unacceptable-risk AI practices take effect?',
    options: [
      'August 1, 2024 (immediately)',
      'February 2, 2025 (6 months)',
      'August 2, 2026 (24 months)',
      'August 2, 2027 (36 months)',
    ],
    correctAnswer: 1,
    explanation: 'Prohibited AI practices must be discontinued by February 2, 2025, which is 6 months after the EU AI Act entered into force. This is the earliest compliance deadline, emphasizing the urgency of eliminating unacceptable-risk AI systems.',
  },
];

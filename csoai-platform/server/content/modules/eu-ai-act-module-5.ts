import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule5Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'Which AI systems in essential services are considered high-risk?',
    options: [
      'All AI systems used by service providers',
      'AI for evaluating creditworthiness and eligibility for public benefits',
      'AI for customer service chatbots',
      'AI for marketing and advertising',
    ],
    correctAnswer: 1,
    explanation: 'AI systems for evaluating creditworthiness, credit scores, and determining eligibility for essential public assistance benefits and services are high-risk (Annex III, Category 5) because they impact access to fundamental services like housing, healthcare, and financial services.',
  },
  {
    id: 2,
    question: 'Are AI systems for insurance pricing considered high-risk?',
    options: [
      'Yes, all insurance AI is high-risk',
      'Yes, but only for health and life insurance',
      'No, insurance is not covered',
      'Only if they use biometric data',
    ],
    correctAnswer: 1,
    explanation: 'AI systems for risk assessment and pricing in life and health insurance are high-risk because they determine access to essential services and can significantly impact individuals\' financial security and well-being.',
  },
  {
    id: 3,
    question: 'Which law enforcement AI application is high-risk?',
    options: [
      'AI for police department scheduling',
      'AI for evaluating reliability of evidence or assessing risk of criminal offending',
      'AI for crime statistics reporting',
      'AI for police vehicle maintenance',
    ],
    correctAnswer: 1,
    explanation: 'AI systems used by law enforcement to evaluate the reliability of evidence, assess the risk of a person becoming a victim or committing a criminal offense, conduct profiling, or detect emotions are high-risk (Annex III, Category 6) due to their impact on fundamental rights and justice.',
  },
  {
    id: 4,
    question: 'Can AI be used for predictive policing?',
    options: [
      'No, it is prohibited',
      'Yes, but it is high-risk and requires strict safeguards',
      'Yes, with no restrictions',
      'Only for property crimes',
    ],
    correctAnswer: 1,
    explanation: 'Predictive policing AI (assessing risk of criminal offending or profiling) is high-risk, not prohibited. It requires strict compliance with risk management, transparency, human oversight, and accuracy requirements to prevent discrimination and protect fundamental rights.',
  },
  {
    id: 5,
    question: 'Which migration and border control AI system is high-risk?',
    options: [
      'AI for passport photo verification',
      'AI for assessing security risks, eligibility for visas, or detecting fraudulent documents',
      'AI for flight scheduling',
      'AI for translating documents',
    ],
    correctAnswer: 1,
    explanation: 'AI systems for assessing security, irregular immigration, or health risks; examining visa/asylum applications; detecting fraudulent documents; or assessing risks posed by persons crossing borders are high-risk (Annex III, Category 7) due to their impact on fundamental rights and safety.',
  },
  {
    id: 6,
    question: 'Are AI systems for asylum application assessment high-risk?',
    options: [
      'No, asylum is handled manually',
      'Yes, because they affect fundamental rights',
      'Only if they make final decisions',
      'No, unless they use biometric data',
    ],
    correctAnswer: 1,
    explanation: 'AI systems used to examine applications for asylum, visa, and residence permits, or to assess eligibility for international protection are high-risk because they significantly impact people\'s safety, freedom, and access to protection.',
  },
  {
    id: 7,
    question: 'Which AI system in the administration of justice is high-risk?',
    options: [
      'AI for court scheduling',
      'AI for assisting judges in researching legal matters or interpreting facts and law',
      'AI for legal document formatting',
      'AI for court transcription',
    ],
    correctAnswer: 1,
    explanation: 'AI systems intended to assist judicial authorities in researching and interpreting facts and law, and applying the law to concrete facts, are high-risk (Annex III, Category 8) because they can influence judicial decisions that affect people\'s rights and freedoms.',
  },
  {
    id: 8,
    question: 'Can AI systems be used to assess the risk of reoffending?',
    options: [
      'No, it is prohibited',
      'Yes, but as a high-risk system with strict requirements',
      'Yes, with no restrictions',
      'Only for minor offenses',
    ],
    correctAnswer: 1,
    explanation: 'AI systems for assessing the risk of a natural person reoffending are high-risk (Annex III, Category 6). They must comply with all high-risk requirements including accuracy, transparency, human oversight, and protection against discrimination.',
  },
  {
    id: 9,
    question: 'What is the key concern with AI in law enforcement and justice?',
    options: [
      'Cost of implementation',
      'Impact on fundamental rights and potential for discrimination',
      'Technical complexity',
      'Data storage requirements',
    ],
    correctAnswer: 1,
    explanation: 'The primary concern is the significant impact on fundamental rights (liberty, fair trial, presumption of innocence) and the potential for discrimination. AI systems in these areas must have the highest standards of accuracy, transparency, and human oversight.',
  },
  {
    id: 10,
    question: 'Do all AI systems used by law enforcement qualify as high-risk?',
    options: [
      'Yes, all law enforcement AI is high-risk',
      'No, only those listed in Annex III for specific purposes',
      'Yes, but only if they use personal data',
      'No, law enforcement AI is exempt',
    ],
    correctAnswer: 1,
    explanation: 'Not all law enforcement AI is high-risk—only systems used for specific purposes listed in Annex III (risk assessment, evidence evaluation, profiling, emotion detection, lie detection). Administrative AI like scheduling or vehicle maintenance is not high-risk.',
  },
];

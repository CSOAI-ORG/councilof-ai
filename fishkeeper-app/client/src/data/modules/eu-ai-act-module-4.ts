import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule4Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What is social scoring by a public authority under the EU AI Act\'s prohibited practices?',
    options: [
      'Using AI to calculate a person\'s social media influence score',
      'Creating algorithmic assessments of individuals\' behavior that restrict fundamental rights or access to services based on low scores',
      'Measuring public opinion through surveys',
      'Rating the quality of public services provided by government agencies'
    ],
    correctAnswer: 1,
    explanation: 'Social scoring by public authorities uses AI to rate individuals\' behavior and restrict their fundamental rights or access to benefits (employment, education, housing) based on algorithmic assessments. This practice is prohibited under Article 5(2)(a) because it poses severe risks to human dignity and fundamental rights.'
  },
  {
    id: 2,
    question: 'Which scenario would violate the EU AI Act\'s prohibition on real-time biometric identification?',
    options: [
      'Using facial recognition with proper legal basis, transparency, and safeguards at border control checkpoints',
      'Using photographs from a driver\'s license to verify identity at a bank branch',
      'Real-time identification of individuals in public spaces using biometric surveillance without specific legal justification',
      'Scanning fingerprints for unlocking a personal smartphone'
    ],
    correctAnswer: 2,
    explanation: 'The prohibition on real-time biometric identification in publicly accessible spaces aims to prevent mass surveillance. The EU AI Act restricts this practice except for narrowly defined law enforcement purposes with proper legal authorization and safeguards. Targeted identification for specific crimes is permitted.'
  },
  {
    id: 3,
    question: 'What are manipulative AI techniques as defined by the EU AI Act\'s prohibited practices?',
    options: [
      'Any AI system that makes decisions on behalf of humans',
      'AI designed to alter behavior or decision-making through subliminal or deceptive means, exploiting vulnerabilities to restrict freedom of choice',
      'All recommendation algorithms used by social media platforms',
      'Any AI system that learns and improves over time'
    ],
    correctAnswer: 1,
    explanation: 'Article 5(1)(a) prohibits AI systems designed to manipulate individuals through deceptive or subliminal techniques that distort behavior and restrict freedom of choice. This applies to exploiting vulnerabilities related to age, physical/mental disability, or other characteristics, not to all algorithmic systems.'
  },
  {
    id: 4,
    question: 'Which of the following practices is explicitly prohibited by Article 5 of the EU AI Act?',
    options: [
      'Using AI to detect fraudulent financial transactions',
      'Deploying AI systems designed to harm the physical, mental, or moral integrity of people',
      'Using AI to improve customer service responses',
      'Employing AI for predictive maintenance in manufacturing'
    ],
    correctAnswer: 1,
    explanation: 'Article 5(1)(c) prohibits AI systems intentionally designed to harm the physical, mental, or moral integrity of persons by exploiting vulnerabilities. This includes AI systems that could cause psychological or physical harm, particularly to vulnerable groups like children or individuals with disabilities.'
  },
  {
    id: 5,
    question: 'What are the exceptions to the prohibition on real-time biometric identification in public spaces?',
    options: [
      'There are no exceptions; real-time biometric identification is completely prohibited',
      'Exceptions exist for law enforcement with proper legal basis, reasonable safeguards, and specific authorization',
      'Any private company can use real-time biometric identification for any purpose',
      'Real-time biometric identification is permitted only during daytime hours'
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act allows narrowly defined exceptions for real-time biometric identification in public spaces when used by law enforcement for specific purposes (targeting serious crimes) with proper legal basis, authorization, and safeguards to prevent misuse.'
  },
  {
    id: 6,
    question: 'How does the EU AI Act distinguish between prohibited social scoring and legitimate AI assessment tools?',
    options: [
      'There is no distinction; all scoring systems are prohibited',
      'Prohibited social scoring involves public authorities restricting fundamental rights; legitimate tools are for other purposes or by private actors with safeguards',
      'Only AI systems created by government agencies are prohibited',
      'The EU AI Act does not address social scoring at all'
    ],
    correctAnswer: 1,
    explanation: 'The prohibition specifically targets social scoring by public authorities that restricts fundamental rights. Private sector assessment tools, credit scoring systems, and similar mechanisms are not automatically prohibited under Article 5(2)(a), though they may face other regulatory requirements.'
  },
  {
    id: 7,
    question: 'What is the scope of the prohibition on AI designed to exploit vulnerabilities?',
    options: [
      'All AI systems must be prohibited because all systems can potentially be misused',
      'Only AI systems intentionally designed to distort behavior and exploit vulnerabilities for manipulation purposes',
      'The prohibition applies to AI developed for children exclusively',
      'The EU AI Act does not prohibit any AI based on vulnerability exploitation'
    ],
    correctAnswer: 1,
    explanation: 'Article 5 prohibits AI systems intentionally designed to distort the behavior of persons or exploit their vulnerabilities to restrict freedom of choice or cause harm. This is about intentional design for harmful purposes, not incidental risks.'
  },
  {
    id: 8,
    question: 'Which of these would NOT be classified as a prohibited AI practice under the EU AI Act?',
    options: [
      'A public authority using AI to rate citizens and restrict their access to benefits based on behavioral scores',
      'An AI system designed to subliminalally manipulate people\'s purchasing decisions through imperceptible persuasion',
      'A recommendation algorithm that suggests products based on purchase history and user preferences',
      'Law enforcement using facial recognition to identify suspects linked to serious crimes without proper authorization'
    ],
    correctAnswer: 2,
    explanation: 'Recommendation algorithms that transparently suggest products based on user preferences are not inherently prohibited. They only violate Article 5 if they use subliminal or deceptive manipulation targeting vulnerabilities to restrict freedom of choice.'
  },
  {
    id: 9,
    question: 'What is the legal consequence for deploying a prohibited AI system under the EU AI Act?',
    options: [
      'A warning letter with no further action',
      'Administrative fines up to €30 million or 6% of global revenue, plus the system must be taken offline',
      'The company loses its EU business license permanently',
      'Only the AI system is deleted; companies face no penalties'
    ],
    correctAnswer: 1,
    explanation: 'Violation of Article 5 prohibitions (banned AI practices) results in administrative fines of up to €30 million or 6% of annual global revenue (whichever is higher), and competent authorities can mandate removal of the non-compliant system from the market.'
  },
  {
    id: 10,
    question: 'How does the EU AI Act\'s prohibition on manipulative AI apply to content moderation systems?',
    options: [
      'All content moderation systems are banned under the prohibition',
      'Content moderation is exempt from all EU AI Act requirements',
      'Content moderation systems must not use subliminal or deceptive techniques to manipulate user behavior or exploit vulnerabilities',
      'The prohibition applies only to AI systems that moderate positive content, not negative content'
    ],
    correctAnswer: 2,
    explanation: 'Content moderation systems are not categorically prohibited, but they must comply with Article 5 restrictions on manipulation. They cannot use deceptive or subliminal techniques designed to distort behavior or exploit vulnerabilities, though legitimate transparency and user control are required.'
  }
];

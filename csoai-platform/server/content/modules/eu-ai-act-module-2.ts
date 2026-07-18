import type { QuizQuestion } from '@/types/quiz';

export const euAiActModule2Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'How many risk tiers does the EU AI Act use to classify AI systems?',
    options: [
      '3 tiers',
      '4 tiers',
      '5 tiers',
      '6 tiers',
    ],
    correctAnswer: 1,
    explanation: 'The EU AI Act uses a 4-tier risk-based approach: Unacceptable Risk (prohibited), High Risk (strict requirements), Limited Risk (transparency obligations), and Minimal Risk (no specific obligations).',
  },
  {
    id: 2,
    question: 'Which risk category faces an outright ban under the EU AI Act?',
    options: [
      'High Risk AI systems',
      'Unacceptable Risk AI systems',
      'Limited Risk AI systems',
      'Minimal Risk AI systems',
    ],
    correctAnswer: 1,
    explanation: 'Unacceptable Risk AI systems are completely prohibited under Article 5 because they pose fundamental threats to people\'s safety, livelihoods, and rights. These include systems for subliminal manipulation, social scoring by public authorities, and exploitation of vulnerabilities.',
  },
  {
    id: 3,
    question: 'What determines if an AI system is classified as "High Risk"?',
    options: [
      'The cost of development',
      'The number of users',
      'Its use in specific sectors listed in Annex III',
      'The company size',
    ],
    correctAnswer: 2,
    explanation: 'An AI system is classified as High Risk if it falls into one of the 8 categories listed in Annex III (biometric identification, critical infrastructure, education, employment, essential services, law enforcement, migration, justice) AND poses significant risks to health, safety, or fundamental rights.',
  },
  {
    id: 4,
    question: 'Which of the following is an example of a "Limited Risk" AI system?',
    options: [
      'Social scoring system by government',
      'Chatbot that interacts with customers',
      'AI system for hiring decisions',
      'Biometric identification in law enforcement',
    ],
    correctAnswer: 1,
    explanation: 'Chatbots fall under Limited Risk because they interact with humans and must disclose that users are interacting with AI (transparency obligation under Article 52). They don\'t face the strict requirements of High Risk systems but must be transparent about their AI nature.',
  },
  {
    id: 5,
    question: 'What obligations apply to "Minimal Risk" AI systems?',
    options: [
      'Full conformity assessment',
      'Transparency disclosure',
      'No specific obligations',
      'Annual audits',
    ],
    correctAnswer: 2,
    explanation: 'Minimal Risk AI systems (like AI-enabled video games, spam filters, or recommendation systems for entertainment) face no specific obligations under the EU AI Act. However, providers are encouraged to adopt voluntary codes of conduct.',
  },
  {
    id: 6,
    question: 'Can an AI system move between risk categories over time?',
    options: [
      'No, risk classification is permanent',
      'Yes, if the use case or context changes',
      'Only if approved by regulators',
      'Only during the first year after deployment',
    ],
    correctAnswer: 1,
    explanation: 'Yes, the same AI technology can be classified differently depending on its use case. For example, a facial recognition system used for unlocking phones (Minimal Risk) vs. used by law enforcement for real-time surveillance (High Risk or Prohibited depending on context).',
  },
  {
    id: 7,
    question: 'Which factor is NOT considered when assessing if a High Risk AI system poses significant risk?',
    options: [
      'The severity of potential harm',
      'The probability of harm occurring',
      'The market share of the provider',
      'The extent of deployment',
    ],
    correctAnswer: 2,
    explanation: 'Risk assessment focuses on the severity and probability of harm, the extent of deployment, and the vulnerability of affected persons. The market share or size of the provider is not a factor in determining risk classification—small startups and large corporations are assessed equally.',
  },
  {
    id: 8,
    question: 'What is the primary purpose of the risk-based approach in the EU AI Act?',
    options: [
      'To ban all AI systems',
      'To apply proportionate regulation based on actual risks',
      'To favor large companies over startups',
      'To delay AI innovation',
    ],
    correctAnswer: 1,
    explanation: 'The risk-based approach ensures that regulatory requirements are proportionate to the actual risks posed by AI systems. Low-risk AI faces minimal regulation to encourage innovation, while high-risk AI faces strict requirements to protect fundamental rights and safety.',
  },
  {
    id: 9,
    question: 'Which AI system would likely be classified as High Risk?',
    options: [
      'AI-powered music recommendation app',
      'AI system for evaluating creditworthiness',
      'AI-enabled photo editing tool',
      'AI-powered weather forecasting',
    ],
    correctAnswer: 1,
    explanation: 'AI systems for evaluating creditworthiness are explicitly listed in Annex III as High Risk because they can significantly impact people\'s access to essential services (financial services). They must comply with strict requirements including risk management, data governance, and human oversight.',
  },
  {
    id: 10,
    question: 'What happens if a provider disagrees with the risk classification of their AI system?',
    options: [
      'They can ignore the classification',
      'They must appeal to the European Court of Justice',
      'They should consult with national competent authorities',
      'They can self-certify a different classification',
    ],
    correctAnswer: 2,
    explanation: 'If a provider believes their AI system has been incorrectly classified, they should consult with their national competent authority. These authorities provide guidance on classification and can issue opinions. Providers cannot unilaterally change classifications or ignore them.',
  },
];

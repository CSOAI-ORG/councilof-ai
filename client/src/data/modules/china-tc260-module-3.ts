import type { QuizQuestion } from '@/types/quiz';

export const chinaTc260Module3Quiz: QuizQuestion[] = [
  {
    id: 1,
    question: 'What transparency requirements apply to AI algorithms in China?',
    options: [
      'No transparency requirements',
      'Disclosure of algorithm principles, purposes, and main operating mechanisms',
      'Only source code disclosure',
      'Transparency is optional',
    ],
    correctAnswer: 1,
    explanation: 'Chinese regulations require disclosure of algorithm principles, purposes, and main operating mechanisms to users, enabling understanding of how AI systems affect them.',
  },
  {
    id: 2,
    question: 'When must users be informed about AI-driven decisions in China?',
    options: [
      'Never',
      'When AI significantly affects user rights and interests',
      'Only for government AI',
      'Only upon request',
    ],
    correctAnswer: 1,
    explanation: 'Users must be informed when AI systems make decisions that significantly affect their rights and interests, including the right to explanation and the ability to refuse automated decisions.',
  },
  {
    id: 3,
    question: 'What are the labeling requirements for AI-generated content in China?',
    options: [
      'No labeling required',
      'AI-generated content must be clearly labeled to prevent confusion',
      'Only deepfakes need labeling',
      'Labeling is optional',
    ],
    correctAnswer: 1,
    explanation: 'China requires clear labeling of AI-generated content to prevent confusion and ensure users can distinguish between human-created and AI-generated content.',
  },
  {
    id: 4,
    question: 'How does China address AI explainability?',
    options: [
      'Explainability is not required',
      'AI systems must provide explanations for decisions affecting user interests',
      'Only technical explanations are needed',
      'Explainability only applies to government AI',
    ],
    correctAnswer: 1,
    explanation: 'Chinese regulations require AI systems to provide explanations for decisions that affect user interests, enabling users to understand and potentially challenge those decisions.',
  },
  {
    id: 5,
    question: 'What information must be disclosed in algorithm filings in China?',
    options: [
      'Only the algorithm name',
      'Algorithm principles, application scenarios, and self-assessment results',
      'Only technical specifications',
      'Only company information',
    ],
    correctAnswer: 1,
    explanation: 'Algorithm filings must include information about algorithm principles, application scenarios, self-assessment results, and other details required by regulatory authorities.',
  },
  {
    id: 6,
    question: 'How does China regulate AI recommendation systems\' transparency?',
    options: [
      'No specific requirements',
      'Users must be able to understand recommendation logic and opt out of personalization',
      'Only news recommendations are regulated',
      'Transparency is voluntary',
    ],
    correctAnswer: 1,
    explanation: 'China requires AI recommendation systems to enable users to understand the basic logic of recommendations and provides the right to opt out of personalized recommendations.',
  },
  {
    id: 7,
    question: 'What are the disclosure requirements for AI service providers in China?',
    options: [
      'No disclosure requirements',
      'Disclosure of service rules, AI capabilities, and limitations',
      'Only pricing disclosure',
      'Only for foreign providers',
    ],
    correctAnswer: 1,
    explanation: 'AI service providers must disclose service rules, AI system capabilities and limitations, and other information necessary for users to make informed decisions.',
  },
  {
    id: 8,
    question: 'How does China address transparency in AI-assisted content moderation?',
    options: [
      'Content moderation is exempt from transparency',
      'Platforms must explain content moderation decisions and provide appeal mechanisms',
      'Only government moderation needs transparency',
      'Transparency is optional for content moderation',
    ],
    correctAnswer: 1,
    explanation: 'Platforms using AI for content moderation must explain decisions to affected users and provide mechanisms for appealing content moderation decisions.',
  },
  {
    id: 9,
    question: 'What role does user consent play in AI transparency in China?',
    options: [
      'Consent is not relevant',
      'Informed consent is required for certain AI processing, supported by transparency',
      'Consent replaces transparency requirements',
      'Only implicit consent is needed',
    ],
    correctAnswer: 1,
    explanation: 'Informed consent is required for certain AI processing activities, and transparency requirements support meaningful consent by ensuring users understand how AI systems work.',
  },
  {
    id: 10,
    question: 'How does China balance transparency with trade secrets in AI?',
    options: [
      'Trade secrets always take precedence',
      'Transparency always takes precedence',
      'Balanced approach protecting legitimate secrets while meeting transparency needs',
      'No balance is attempted',
    ],
    correctAnswer: 2,
    explanation: 'China takes a balanced approach, protecting legitimate trade secrets while requiring sufficient transparency to meet regulatory requirements and protect user interests.',
  },
];
